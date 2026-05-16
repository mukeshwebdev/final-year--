import os
import speech_recognition as sr
from pydub import AudioSegment
from PIL import Image
try:
    import pytesseract
    TESSERACT_AVAILABLE = True
except ImportError:
    TESSERACT_AVAILABLE = False

class FileProcessor:
    def __init__(self):
        self.recognizer = sr.Recognizer()
        self._configure_ffmpeg()

    def _configure_ffmpeg(self):
        """Configure ffmpeg path so pydub can process webm/mp4 reliably."""
        try:
            import imageio_ffmpeg
            ffmpeg_path = imageio_ffmpeg.get_ffmpeg_exe()
            if ffmpeg_path and os.path.exists(ffmpeg_path):
                AudioSegment.converter = ffmpeg_path
                AudioSegment.ffprobe = ffmpeg_path.replace("ffmpeg", "ffprobe")
        except Exception:
            # Graceful fallback: WAV files can still be processed without ffmpeg.
            pass
    
    def process_audio(self, file_path):
        """Convert audio file to text"""
        try:
            # Check if file exists
            if not os.path.exists(file_path):
                raise FileNotFoundError(f"Audio file not found: {file_path}")
            
            # Convert audio to WAV if needed
            try:
                audio = AudioSegment.from_file(file_path)
                wav_path = file_path.rsplit('.', 1)[0] + '.wav'
                # Only convert if not already WAV
                if not file_path.lower().endswith('.wav'):
                    audio.export(wav_path, format='wav')
                else:
                    wav_path = file_path
            except Exception as e:
                print(f"Error converting audio format: {e}")
                # Try direct recognition if conversion fails
                wav_path = file_path
            
            # Use speech recognition
            try:
                with sr.AudioFile(wav_path) as source:
                    # Adjust for ambient noise
                    self.recognizer.adjust_for_ambient_noise(source, duration=0.5)
                    audio_data = self.recognizer.record(source)
                    text = self.recognizer.recognize_google(audio_data, language='en-IN')
                
                # Clean up temporary WAV file if it was created
                if wav_path != file_path and os.path.exists(wav_path):
                    os.remove(wav_path)
                
                return text.strip() if text else ""
            except sr.UnknownValueError:
                return "[Audio processing error: Could not understand audio. Please speak clearly or upload a better quality audio file.]"
            except sr.RequestError as e:
                return f"[Audio processing error: Could not request results from speech recognition service. Check internet connection. Error: {str(e)}]"
        except Exception as e:
            print(f"Error processing audio: {e}")
            return f"[Audio processing error: {str(e)}]"

    def process_video(self, file_path):
        """Extract speech text from video by decoding audio track."""
        # pydub can decode many video formats via ffmpeg.
        return self.process_audio(file_path)
    
    def process_image(self, file_path):
        """Extract text from image using OCR"""
        try:
            if not TESSERACT_AVAILABLE:
                # Try to find tesseract in common locations (Windows)
                try:
                    import subprocess
                    # Common Windows installation path
                    tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
                    if os.path.exists(tesseract_cmd):
                        pytesseract.pytesseract.tesseract_cmd = tesseract_cmd
                        # Try to use it
                        image = Image.open(file_path)
                        text = pytesseract.image_to_string(image, lang='eng')
                        return text.strip() if text.strip() else ""
                except:
                    pass
                return ""  # Return empty string instead of error marker
            
            # Check if file exists
            if not os.path.exists(file_path):
                return ""
            
            # Open image and extract text using OCR
            try:
                image = Image.open(file_path)
                # Try to get text from image
                text = pytesseract.image_to_string(image, lang='eng')
                extracted_text = text.strip()
                
                if extracted_text:
                    return extracted_text
                else:
                    return ""  # Return empty string if no text found
            except Exception as ocr_error:
                print(f"OCR processing error: {ocr_error}")
                # Try to set tesseract path if not set
                try:
                    tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
                    if os.path.exists(tesseract_cmd):
                        pytesseract.pytesseract.tesseract_cmd = tesseract_cmd
                        image = Image.open(file_path)
                        text = pytesseract.image_to_string(image, lang='eng')
                        return text.strip() if text.strip() else ""
                except:
                    pass
                return ""  # Return empty string instead of error
        except Exception as e:
            print(f"Error processing image: {e}")
            return ""  # Return empty string instead of error
    
    def process_text(self, file_path):
        """Read text from file"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                return f.read()
        except Exception as e:
            print(f"Error processing text file: {e}")
            return f"[Text processing error: {str(e)}]"
