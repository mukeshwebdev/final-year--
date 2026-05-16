from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from datetime import datetime
from enum import Enum

db = SQLAlchemy()

class WorkflowStatus(Enum):
    WRITER = "writer"
    SUB_INSPECTOR = "sub_inspector"
    INSPECTOR = "inspector"
    COURT = "court"

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(50), nullable=False)  # writer, sub_inspector, inspector
    name = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class FIRCase(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    case_number = db.Column(db.String(50), unique=True, nullable=True)
    statement = db.Column(db.Text, nullable=False)
    keywords = db.Column(db.Text, nullable=True)  # JSON string
    ipc_sections = db.Column(db.Text, nullable=True)  # JSON string
    status = db.Column(db.String(50), default=WorkflowStatus.WRITER.value)
    input_type = db.Column(db.String(20), nullable=False)  # audio, video, text
    aadhaar_number = db.Column(db.String(12), nullable=True, index=True)
    created_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    investigated_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    investigation_date = db.Column(db.DateTime, nullable=True)
    approved_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    approval_date = db.Column(db.DateTime, nullable=True)
    sent_to_court_date = db.Column(db.DateTime, nullable=True)
    
    creator = db.relationship('User', foreign_keys=[created_by], backref='created_cases')
    investigator = db.relationship('User', foreign_keys=[investigated_by], backref='investigated_cases')
    approver = db.relationship('User', foreign_keys=[approved_by], backref='approved_cases')

class Evidence(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    case_id = db.Column(db.Integer, db.ForeignKey('fir_case.id'), nullable=False)
    description = db.Column(db.Text, nullable=False)
    file_path = db.Column(db.String(255), nullable=False)
    uploaded_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    case = db.relationship('FIRCase', backref='evidence_list')
    uploader = db.relationship('User', backref='uploaded_evidence')
