from flask import Flask, render_template, request, jsonify, session, redirect, url_for, send_file, Response
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from datetime import datetime
import os
import json
from functools import wraps
from io import BytesIO
from sqlalchemy import text

# Import models first to get db instance
from models import db, User, FIRCase, Evidence, WorkflowStatus
from services.nlp_service import NLPService
from services.file_processor import FileProcessor

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-change-in-production'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///fir_management.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB max file size

# Create upload directories
os.makedirs('uploads/audio', exist_ok=True)
os.makedirs('uploads/video', exist_ok=True)
os.makedirs('uploads/image', exist_ok=True)
os.makedirs('uploads/text', exist_ok=True)
os.makedirs('uploads/evidence', exist_ok=True)

# Initialize db with app
db.init_app(app)

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

nlp_service = NLPService()
file_processor = FileProcessor()

# Add Jinja2 filter for JSON parsing
@app.template_filter('from_json')
def from_json_filter(value):
    if isinstance(value, str):
        try:
            return json.loads(value)
        except:
            return []
    return value or []

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

def role_required(role):
    def decorator(f):
        @wraps(f)
        @login_required
        def decorated_function(*args, **kwargs):
            if current_user.role != role:
                return jsonify({'error': 'Insufficient permissions'}), 403
            return f(*args, **kwargs)
        return decorated_function
    return decorator


def normalize_aadhaar(raw_value):
    digits = ''.join(ch for ch in (raw_value or '') if ch.isdigit())
    return digits if len(digits) == 12 else None


def ensure_schema():
    """Lightweight migration for existing SQLite databases."""
    columns = [row[1] for row in db.session.execute(text("PRAGMA table_info(fir_case)"))]
    if "aadhaar_number" not in columns:
        db.session.execute(text("ALTER TABLE fir_case ADD COLUMN aadhaar_number VARCHAR(12)"))
        db.session.commit()

@app.route('/')
def index():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    return redirect(url_for('login'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        user = User.query.filter_by(username=username).first()
        
        if user and check_password_hash(user.password_hash, password):
            login_user(user)
            return redirect(url_for('dashboard'))
        return render_template('login.html', error='Invalid credentials')
    return render_template('login.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))

@app.route('/dashboard')
@login_required
def dashboard():
    role = current_user.role
    aadhaar_query = normalize_aadhaar(request.args.get('aadhaar_search', ''))
    
    # Get all cases based on role
    if role == 'writer':
        all_cases = FIRCase.query.filter_by(created_by=current_user.id).all()
    elif role == 'sub_inspector':
        # Sub inspector sees cases assigned to them and all cases in their status
        all_cases = FIRCase.query.filter(
            (FIRCase.status == WorkflowStatus.SUB_INSPECTOR.value) |
            (FIRCase.status == WorkflowStatus.INSPECTOR.value) |
            (FIRCase.status == WorkflowStatus.COURT.value)
        ).all()
    elif role == 'inspector':
        # Inspector sees all cases
        all_cases = FIRCase.query.all()
    else:
        all_cases = FIRCase.query.all()
    
    # Separate into ongoing and submitted
    ongoing_cases = [c for c in all_cases if c.status != WorkflowStatus.COURT.value]
    submitted_cases = [c for c in all_cases if c.status == WorkflowStatus.COURT.value]
    
    history_results = []
    if aadhaar_query:
        history_results = FIRCase.query.filter(FIRCase.aadhaar_number == aadhaar_query).order_by(FIRCase.created_at.desc()).all()
        if role == 'writer':
            history_results = [c for c in history_results if c.created_by == current_user.id]

    return render_template('dashboard.html', 
                         ongoing_cases=ongoing_cases, 
                         submitted_cases=submitted_cases, 
                         role=role,
                         aadhaar_query=aadhaar_query or '',
                         history_results=history_results)

@app.route('/create_case', methods=['GET', 'POST'])
@login_required
@role_required('writer')
def create_case():
    if request.method == 'POST':
        try:
            # Get form data
            statement_text = request.form.get('statement_text', '')
            input_type = request.form.get('input_type', 'text')
            aadhaar_number = normalize_aadhaar(request.form.get('aadhaar_number', ''))
            media_description = request.form.get('media_description', '').strip()
            if not aadhaar_number:
                return jsonify({'success': False, 'error': 'Valid 12-digit Aadhaar number is required.'}), 400
            
            # Handle file uploads
            if input_type == 'audio':
                file = request.files.get('audio_file')
                # Check if file exists and has content
                if file and (file.filename or (hasattr(file, 'read') and file.read(1))):
                    # Reset file pointer if we read from it
                    if hasattr(file, 'seek'):
                        file.seek(0)
                    
                    # Check if file has a filename (uploaded) or is a recorded blob
                    if file.filename:
                        filename = secure_filename(file.filename)
                    else:
                        # Recorded audio - generate filename based on timestamp
                        from datetime import datetime
                        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                        filename = f'recording_{timestamp}.webm'
                    
                    filepath = os.path.join(app.config['UPLOAD_FOLDER'], 'audio', filename)
                    file.save(filepath)
                    
                    # Process audio
                    processed_text = file_processor.process_audio(filepath)
                    
                    # Use processed text if valid, otherwise create placeholder
                    if processed_text and not processed_text.startswith('[Audio processing error') and processed_text.strip():
                        statement_text = processed_text
                        if media_description:
                            statement_text += "\n\n[Additional Details: " + media_description + "]"
                    elif media_description:
                        statement_text = media_description + "\n\n[Audio uploaded - speech extraction failed]"
                    else:
                        # Audio processing failed but we still create the case
                        statement_text = f"[Audio file uploaded: {filename}. Audio processing encountered an issue. Please add text description or try again.]"
                        # Don't block case creation, just warn
                        print(f"Warning: Audio processing failed for {filename}: {processed_text}")
                else:
                    return jsonify({'success': False, 'error': 'No audio file provided. Please record audio or upload an audio file.'}), 400

            elif input_type == 'video':
                file = request.files.get('video_file')
                if file and file.filename:
                    filename = secure_filename(file.filename)
                    filepath = os.path.join(app.config['UPLOAD_FOLDER'], 'video', filename)
                    file.save(filepath)
                    processed_text = file_processor.process_video(filepath)
                    if processed_text and not processed_text.startswith('[Audio processing error') and processed_text.strip():
                        statement_text = processed_text
                        if media_description:
                            statement_text += "\n\n[Additional Details: " + media_description + "]"
                    elif media_description:
                        statement_text = media_description + "\n\n[Video uploaded - speech extraction failed]"
                    else:
                        statement_text = f"[Video file uploaded: {filename}. Add incident details manually if speech extraction fails.]"
                else:
                    return jsonify({'success': False, 'error': 'No video file provided.'}), 400
            
            elif input_type == 'image':
                file = request.files.get('image_file')
                if file and file.filename:
                    filename = secure_filename(file.filename)
                    filepath = os.path.join(app.config['UPLOAD_FOLDER'], 'image', filename)
                    file.save(filepath)
                    # Get optional manual description
                    manual_desc = request.form.get('image_description', '').strip()
                    # Try OCR processing first
                    ocr_text = file_processor.process_image(filepath)
                    
                    # Determine which text to use - prioritize OCR
                    if ocr_text and not ocr_text.startswith('[') and not 'error' in ocr_text.lower() and not 'not available' in ocr_text.lower() and not 'no text' in ocr_text.lower():
                        # OCR successfully extracted text
                        statement_text = ocr_text
                        # Append manual description if provided
                        if manual_desc:
                            statement_text += "\n\n[Additional Details: " + manual_desc + "]"
                    elif manual_desc:
                        # Use manual description if OCR didn't work
                        statement_text = manual_desc + "\n\n[Image uploaded - OCR extraction attempted but no text found]"
                    else:
                        # No OCR and no description - create minimal statement
                        statement_text = f"[Image uploaded: {filename}. Please review the image for case details.]"
            
            # Validate that we have statement text
            if not statement_text or not statement_text.strip():
                return jsonify({'success': False, 'error': 'No statement text available. Please provide input.'}), 400
            
            # Clean statement text - remove error markers for NLP processing
            clean_text = statement_text
            if clean_text.startswith('[') and ('error' in clean_text.lower() or 'not available' in clean_text.lower()):
                return jsonify({'success': False, 'error': 'Failed to extract content. Please provide text input or description.'}), 400
            
            # Process statement with NLP
            keywords = nlp_service.extract_keywords(clean_text)
            ipc_sections = nlp_service.allocate_ipc_sections(clean_text, keywords)
            
            # Create FIR case
            case = FIRCase(
                statement=statement_text,
                keywords=json.dumps(keywords),
                ipc_sections=json.dumps(ipc_sections),
                status=WorkflowStatus.WRITER.value,
                created_by=current_user.id,
                input_type=input_type,
                aadhaar_number=aadhaar_number
            )
            db.session.add(case)
            db.session.commit()
            
            return jsonify({'success': True, 'case_id': case.id})
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 400
    
    return render_template('create_case.html')

@app.route('/case/<int:case_id>')
@login_required
def view_case(case_id):
    case = FIRCase.query.get_or_404(case_id)
    evidence = Evidence.query.filter_by(case_id=case_id).all()
    return render_template('case_detail.html', case=case, evidence=evidence)

@app.route('/case/<int:case_id>/submit', methods=['POST'])
@login_required
@role_required('writer')
def submit_case(case_id):
    case = FIRCase.query.get_or_404(case_id)
    if case.created_by != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    case.status = WorkflowStatus.SUB_INSPECTOR.value
    db.session.commit()
    return jsonify({'success': True})

@app.route('/case/<int:case_id>/investigate', methods=['POST'])
@login_required
@role_required('sub_inspector')
def investigate_case(case_id):
    case = FIRCase.query.get_or_404(case_id)
    case.status = WorkflowStatus.INSPECTOR.value
    case.investigated_by = current_user.id
    case.investigation_date = datetime.utcnow()
    db.session.commit()
    return jsonify({'success': True})

@app.route('/case/<int:case_id>/approve', methods=['POST'])
@login_required
@role_required('inspector')
def approve_case(case_id):
    case = FIRCase.query.get_or_404(case_id)
    case.status = WorkflowStatus.COURT.value
    case.approved_by = current_user.id
    case.approval_date = datetime.utcnow()
    db.session.commit()
    return jsonify({'success': True})

@app.route('/case/<int:case_id>/evidence', methods=['POST'])
@login_required
def add_evidence(case_id):
    case = FIRCase.query.get_or_404(case_id)
    
    # All roles can add evidence (visible to all station personnel)
    if 'evidence_file' in request.files:
        file = request.files['evidence_file']
        if file.filename:
            filename = secure_filename(file.filename)
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], 'evidence', filename)
            file.save(filepath)
            
            evidence = Evidence(
                case_id=case_id,
                description=request.form.get('description', ''),
                file_path=filepath,
                uploaded_by=current_user.id
            )
            db.session.add(evidence)
            db.session.commit()
            return jsonify({'success': True})
    
    return jsonify({'error': 'No file provided'}), 400

@app.route('/case/<int:case_id>/evidence/<int:evidence_id>')
@login_required
def view_evidence(case_id, evidence_id):
    """View evidence file - accessible to all roles"""
    evidence = Evidence.query.get_or_404(evidence_id)
    if evidence.case_id != case_id:
        return jsonify({'error': 'Evidence not found for this case'}), 404
    
    return send_file(evidence.file_path)


@app.route('/case/<int:case_id>/download')
@login_required
def download_case(case_id):
    case = FIRCase.query.get_or_404(case_id)
    content = (
        f"FIR Copy\n"
        f"{'=' * 60}\n"
        f"Case ID: {case.id}\n"
        f"Aadhaar Number: {case.aadhaar_number or 'Not provided'}\n"
        f"Status: {case.status}\n"
        f"Input Type: {case.input_type}\n"
        f"Created By: {case.creator.name}\n"
        f"Created At: {case.created_at.strftime('%Y-%m-%d %H:%M:%S')}\n\n"
        f"Statement:\n{case.statement}\n\n"
        f"Keywords: {case.keywords}\n"
        f"IPC Sections: {case.ipc_sections}\n"
    )
    buffer = BytesIO(content.encode("utf-8"))
    filename = f"fir_case_{case.id}.txt"
    return send_file(buffer, as_attachment=True, download_name=filename, mimetype="text/plain")


@app.route('/api/history')
@login_required
def search_history():
    aadhaar_number = normalize_aadhaar(request.args.get('aadhaar', ''))
    if not aadhaar_number:
        return jsonify({'success': False, 'error': 'Enter a valid 12-digit Aadhaar number.'}), 400

    results = FIRCase.query.filter(FIRCase.aadhaar_number == aadhaar_number).order_by(FIRCase.created_at.desc()).all()
    if current_user.role == 'writer':
        results = [c for c in results if c.created_by == current_user.id]

    return jsonify({
        'success': True,
        'aadhaar': aadhaar_number,
        'count': len(results),
        'cases': [
            {
                'id': c.id,
                'status': c.status,
                'input_type': c.input_type,
                'created_at': c.created_at.strftime('%Y-%m-%d %H:%M:%S')
            } for c in results
        ]
    })

@app.route('/case/<int:case_id>/edit', methods=['GET', 'POST'])
@login_required
def edit_case(case_id):
    """Edit case - available to all users"""
    case = FIRCase.query.get_or_404(case_id)
    
    # Check permissions: Writers can only edit their own cases, others can edit cases in their workflow
    if current_user.role == 'writer' and case.created_by != current_user.id:
        return jsonify({'error': 'You can only edit your own cases'}), 403
    
    if request.method == 'POST':
        try:
            # Get updated statement
            new_statement = request.form.get('statement', '').strip()
            if not new_statement:
                return jsonify({'success': False, 'error': 'Statement cannot be empty'}), 400
            
            # Reprocess with NLP
            keywords = nlp_service.extract_keywords(new_statement)
            ipc_sections = nlp_service.allocate_ipc_sections(new_statement, keywords)
            
            # Update case
            case.statement = new_statement
            case.keywords = json.dumps(keywords)
            case.ipc_sections = json.dumps(ipc_sections)
            db.session.commit()
            
            return jsonify({'success': True, 'case_id': case.id})
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 400
    
    # GET request - show edit form
    return render_template('edit_case.html', case=case)

@app.route('/case/<int:case_id>/delete', methods=['POST'])
@login_required
def delete_case(case_id):
    """Delete case - available to all users with restrictions"""
    case = FIRCase.query.get_or_404(case_id)
    
    # Check permissions: Writers can only delete their own cases, others can delete cases in their workflow
    if current_user.role == 'writer' and case.created_by != current_user.id:
        return jsonify({'error': 'You can only delete your own cases'}), 403
    
    # Prevent deletion of cases sent to court (optional safety measure)
    # Uncomment if you want to prevent deletion of court cases
    # if case.status == WorkflowStatus.COURT.value:
    #     return jsonify({'error': 'Cannot delete cases that have been sent to court'}), 403
    
    try:
        # Delete associated evidence files
        evidence_list = Evidence.query.filter_by(case_id=case_id).all()
        for evidence in evidence_list:
            if os.path.exists(evidence.file_path):
                try:
                    os.remove(evidence.file_path)
                except:
                    pass
            db.session.delete(evidence)
        
        # Delete case
        db.session.delete(case)
        db.session.commit()
        
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 400

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        ensure_schema()
        # Create default users if they don't exist
        if not User.query.filter_by(username='writer').first():
            writer = User(
                username='writer',
                password_hash=generate_password_hash('writer123'),
                role='writer',
                name='Writer'
            )
            db.session.add(writer)
        
        if not User.query.filter_by(username='subinspector').first():
            sub_inspector = User(
                username='subinspector',
                password_hash=generate_password_hash('subinspector123'),
                role='sub_inspector',
                name='Sub Inspector'
            )
            db.session.add(sub_inspector)
        
        if not User.query.filter_by(username='inspector').first():
            inspector = User(
                username='inspector',
                password_hash=generate_password_hash('inspector123'),
                role='inspector',
                name='Inspector'
            )
            db.session.add(inspector)
        
        db.session.commit()
    
    app.run(debug=True, port=5000)
