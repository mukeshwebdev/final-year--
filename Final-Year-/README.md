# AI FIR Management System

An intelligent First Information Report (FIR) management system that processes audio, image, and text inputs to automatically extract keywords and allocate relevant IPC (Indian Penal Code) sections.

## Features

- **Multi-format Input Support**: Accept FIR statements as text, audio (record or upload), or image files
- **Audio Recording**: Built-in audio recording capability for direct statement capture
- **Image OCR**: Extract text from images using OCR technology
- **NLP Processing**: Automatically extracts keywords and allocates relevant IPC sections
- **Hierarchical Workflow**: 
  - Writer → Creates and submits cases
  - Sub Inspector → Investigates cases and adds evidence
  - Inspector → Reviews and approves cases
  - Court → Final destination after approval
- **Evidence Inventory**: Track and manage evidence files for each case (visible to all station personnel)
- **Case Status Tracking**: Separate sections for ongoing and submitted cases at all levels
- **Simple, Clean UI**: Professional interface without flashy elements

## Installation

1. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Install Tesseract OCR (required for image text extraction):**
   - Windows: Download from https://github.com/UB-Mannheim/tesseract/wiki and add to PATH
   - Linux: `sudo apt-get install tesseract-ocr`
   - macOS: `brew install tesseract`
   
   Note: Tesseract OCR is required for processing image files. Audio processing uses Google Speech Recognition API (requires internet connection).

3. **Run the application:**
   ```bash
   python app.py
   ```

4. **Access the application:**
   Open your browser and navigate to `http://localhost:5000`

## Default Users

The system comes with three default user accounts:

- **Writer**: 
  - Username: `writer`
  - Password: `writer123`

- **Sub Inspector**: 
  - Username: `subinspector`
  - Password: `subinspector123`

- **Inspector**: 
  - Username: `inspector`
  - Password: `inspector123`

## Usage

### For Writers:
1. Login with writer credentials
2. Click "Create New Case"
3. Select input type (Text/Audio/Image)
4. For audio: Record directly or upload audio file
5. For image: Upload image file and optionally add description
6. System automatically extracts keywords and allocates IPC sections
7. Review and submit to Sub Inspector

### For Sub Inspectors:
1. Login with sub inspector credentials
2. View "Ongoing Cases" section for cases requiring investigation
3. Review case details, keywords, and IPC sections
4. View all evidence (visible to all station personnel)
5. Add evidence files as needed
6. Complete investigation and forward to Inspector

### For Inspectors:
1. Login with inspector credentials
2. View "Ongoing Cases" section for cases awaiting approval
3. Review investigated cases with full case status visibility
4. View all evidence (visible to all station personnel)
5. Add additional evidence if needed
6. Approve and send to Court (moves to "Submitted Cases" section)

## Project Structure

```
.
├── app.py                 # Main Flask application
├── models.py              # Database models
├── requirements.txt      # Python dependencies
├── services/
│   ├── nlp_service.py    # NLP processing for keywords and IPC sections
│   └── file_processor.py # Audio/video/text file processing
├── templates/
│   ├── base.html         # Base template
│   ├── login.html        # Login page
│   ├── dashboard.html    # Dashboard
│   ├── create_case.html  # Create case form
│   └── case_detail.html  # Case details view
├── static/
│   ├── css/
│   │   └── style.css     # Stylesheet
│   └── js/
│       └── main.js       # JavaScript
└── uploads/              # Uploaded files (created automatically)
    ├── audio/
    ├── video/
    ├── text/
    └── evidence/
```

## Technologies Used

- **Backend**: Flask (Python)
- **Database**: SQLite (SQLAlchemy ORM)
- **NLP**: Custom keyword extraction and IPC section matching
- **File Processing**: 
  - Speech Recognition for audio (Google API)
  - Tesseract OCR for image text extraction
  - Web Audio API for browser-based audio recording
- **Frontend**: HTML, CSS, JavaScript

## Notes

- Audio processing requires internet connection for Google Speech Recognition API
- Image OCR requires Tesseract to be installed on the system
- For production use, change the SECRET_KEY in app.py
- The IPC section allocation is based on keyword matching - you can expand the keyword database in `services/nlp_service.py`
- File uploads are limited to 100MB per file
- Evidence is visible to all station personnel (Writer, Sub Inspector, Inspector)
- All roles can add evidence to cases
- Dashboard shows separate sections for "Ongoing Cases" and "Submitted Cases" (sent to court)

## License

This project is for educational purposes.
