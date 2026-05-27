# AI Resume Analyzer

A web app for analyzing a resume photo against a target job role. It extracts text from the image using OCR, then gives an overall match score, skills match, missing skills, ATS readiness, detected resume sections, keyword density, and improvement suggestions.

## Features

- Upload a resume photo with preview support.
- Extract text from the photo using Tesseract.js OCR.
- Rejects non-resume images or photos with very little readable resume content.
- Add a target role and job description.
- Calculates skill match using role keywords.
- Checks resume structure such as contact, summary, skills, projects, experience, education, and achievements.
- Estimates ATS readiness from contact details, links, length, and formatting.
- Generates practical resume improvement suggestions.
- Enables report download as a `.txt` file after a valid analysis is complete.

## How To Run

Open `index.html` in any modern browser and upload a clear resume image.

No API key, backend, or database is required. Internet is needed the first time so the browser can load the OCR library from CDN.

## Files

- `index.html` - App layout
- `styles.css` - Dashboard styling
- `script.js` - Resume analysis logic

## Note About Resume Photos

Use a clear, well-lit resume image for best OCR accuracy. Blurry photos, tilted pages, or very small text may reduce the analysis quality.

The analyzer checks for resume signals such as contact details, education, skills, projects, experience, and section headings before scoring. Regular personal photos should be rejected instead of producing a fake resume result.
