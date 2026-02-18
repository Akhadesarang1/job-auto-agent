import os
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
from werkzeug.utils import secure_filename
from PyPDF2 import PdfReader
from dotenv import load_dotenv

load_dotenv()

# === APP SETUP ===
app = Flask(__name__)
CORS(app)
logging.basicConfig(level=logging.DEBUG)   # switch to DEBUG
logger = logging.getLogger(__name__)

# === CONFIG & KEYS ===
GEMINI_KEY = os.getenv("GEMINI_KEY")
if not GEMINI_KEY:
    logger.error("Missing GEMINI_KEY environment variable.")
    raise EnvironmentError("GEMINI_KEY not set")

genai.configure(api_key=GEMINI_KEY)
DEFAULT_MODEL = "gemini-flash-latest"

# === SYSTEM PROMPT ===
SYSTEM_INSTRUCTIONS = """
You are an expert résumé writer.
Given the Original Résumé and the Target Job Description,
produce a tailored résumé with:
• A 2–3 line professional summary
• 5–8 bullet key skills using exact JD keywords
• 3–5 bullet experience highlights per role
• Education & certifications if relevant
Respond ONLY with the résumé content—no commentary.
"""

# === HELPERS ===
def extract_text_from_pdf(fp):
    try:
        reader = PdfReader(fp)
        pages = [p.extract_text() or "" for p in reader.pages]
        return "\n".join(pages)
    except Exception as e:
        logger.error(f"Error extracting text from PDF: {e}")
        return ""


# === ROUTES ===
@app.route('/health', methods=['GET'])
def health():
    return jsonify(status="ok"), 200

@app.route('/tailor', methods=['POST'])
def tailor_resume():
    # Log incoming headers and parts
    logger.debug("Received /tailor request")
    logger.debug("Headers: %s", dict(request.headers))
    logger.debug("Form fields: %s", list(request.form.keys()))
    logger.debug("File fields: %s", list(request.files.keys()))

    # 1) PDF upload?
    if 'resume' in request.files:
        file = request.files['resume']
        logger.debug("Processing PDF upload: filename=%s, content_type=%s",
                     file.filename, file.content_type)
        resume_text = extract_text_from_pdf(file.stream)
        jd_text = request.form.get('job_description', '').strip()
        if not jd_text:
            logger.warning("Missing job_description in form")
            return jsonify(error="Missing job_description form field"), 400

    else:
        # 2) Plain-text fields (form-data or JSON)
        if request.is_json:
            data = request.get_json()
            logger.debug("Parsed JSON body: %s", data)
        else:
            data = request.form
            logger.debug("Parsed form body: %s", {k: data.get(k) for k in data})

        resume_text = (data.get('resume') or "").strip()
        jd_text      = (data.get('job_description') or "").strip()
        if not resume_text or not jd_text:
            logger.warning("Missing resume text or job_description text")
            return jsonify(
                error="Missing 'resume' text or 'job_description' text"
            ), 400

    # Log snippets for sanity
    logger.debug("First 200 chars of resume_text: %s", resume_text[:200])
    logger.debug("First 200 chars of jd_text: %s", jd_text[:200])

    # 3) Build prompt
    prompt = f"""{SYSTEM_INSTRUCTIONS}

Original Résumé:
{resume_text}

Target Job Description:
{jd_text}
"""
    logger.debug("Constructed prompt (first 500 chars): %s", prompt[:500])

    # 4) Call Gemini
    model_name = request.form.get('model') or request.args.get('model')
    model = genai.GenerativeModel(model_name or DEFAULT_MODEL)
    try:
        # Retry loop for 429 ResourceExhausted
        import time
        from google.api_core import exceptions

        tailored = ""
        for attempt in range(5): # Try 5 times
            try:
                response = model.generate_content(prompt)
                tailored = getattr(response, 'text', '').strip()
                break # Success
            except exceptions.ResourceExhausted:
                if attempt < 4:
                    wait_time = (attempt + 1) * 3 # 3, 6, 9, 12...
                    logger.warning(f"⚠️ Quota exceeded (429). Retrying in {wait_time}s...")
                    time.sleep(wait_time)
                else:
                    raise # Re-raise after all retries fail
            except Exception:
                raise # Re-raise other errors immediately

        logger.debug("Gemini response text (first 500 chars): %s", tailored[:500])
    except Exception as e:
        logger.exception("Gemini API error")
        return jsonify(error=str(e)), 500

    return jsonify(tailored_resume=tailored)


if __name__ == '__main__':
    port = int(os.getenv('PORT', 5005))
    logger.info("Starting LLM agent on port %d", port)
    app.run(host='0.0.0.0', port=port, debug=False)
