Treasury Label Verification AI
Author: Julie Preval
GitHub: github.com/JUPREVAL/treasury-label-verification-ai-by-julie
Live Demo: mrsjuliepreval-treasury-ai-app.lovable.app
Project Overview
This is a take-home prototype built for the U.S. Treasury's Alcohol and Tobacco Tax and Trade Bureau (TTB). The TTB reviews around 150,000 alcohol beverage label applications per year. Compliance agents manually check each label image against an application — verifying that the brand name, alcohol content, government warning, and other required fields are correct.

This tool automates that process. A user uploads a label image, enters the expected application data, and the app extracts text from the image using OCR, then compares it field by field and returns a clear PASS, UNCERTAIN, or FAIL result — in under 5 seconds.

Why It Was Built
The TTB compliance team described a review process that is largely manual and repetitive. Agents spend a significant portion of their day doing what amounts to data-entry verification — checking whether the number on a label matches the number on the form. With a team of 47 agents handling 150,000 applications annually, the volume is difficult to manage without automation support.

Key pain points identified during stakeholder interviews:

Results must come back in roughly 5 seconds or agents won't use the tool — a previous scanning vendor took 30–40 seconds per label and was abandoned
Half the team is over 50; the interface needs to be clean and obvious with no hunting for buttons
During peak season, importers submit 200–300 applications at once; batch upload is critical
The Government Warning Statement must be checked exactly — word for word, "GOVERNMENT WARNING:" in all caps and bold
Features
Upload a single label image or a batch of images
Enter expected application data: Brand Name, Class/Type, ABV, Net Contents, Bottler/Producer, Government Warning
OCR runs entirely in the browser — no backend, no network calls to external services
Results display per field: ✔ Match, ⚠ Uncertain, or ❌ Mismatch
ABV is compared with a ±0.3% tolerance (flagged as Uncertain, not a hard failure)
Government Warning is checked word for word — must appear in ALL CAPS
Per-label processing time is shown
Raw OCR text is viewable for transparency
Large, high-contrast UI designed for accessibility and non-technical users
Tech Stack
Layer	Technology
Frontend	React + TypeScript
OCR Engine	Tesseract.js (runs entirely in the browser)
Styling	Tailwind CSS
Hosting / Build	Lovable (deployed)
Backend	None — all processing happens client-side
Why no backend?
No backend or external API calls are required. This was intentional — government network environments often block outbound traffic to cloud ML endpoints, a lesson learned from a prior vendor pilot.

How to Run Locally
Prerequisites: Node.js 18+ and npm

git clone https://github.com/JUPREVAL/treasury-label-verification-ai-by-julie.git
cd treasury-label-verification-ai-by-julie
npm install
npm run dev
Open http://localhost:8080 in your browser.

To use the app:
Upload one or more alcohol label images (JPG, PNG)
Fill in the expected application fields in the form
Click Run Verification
Review the match results per field and per label
How OCR Works
This app uses Tesseract.js, a JavaScript port of the Tesseract OCR engine. It runs directly in the browser — no image is sent to a server.

When a label is uploaded:

The image is passed to Tesseract.js for text extraction
The raw text output is parsed line by line to find matching fields
Extracted values are compared against what the user entered in the application form
Because OCR quality depends on image clarity, results may vary for labels that are photographed at angles, have glare, or are low resolution. The raw OCR output is always shown so the user can verify what was extracted.

How Comparison Works
Each field is compared using a different rule:

Field	Method
Brand Name	Fuzzy line matching
Class / Type	Fuzzy line matching
ABV	Numeric comparison with ±0.3% tolerance
Net Contents	Fuzzy line matching
Bottler / Producer	Fuzzy line matching
Government Warning	Exact match required — ALL CAPS enforced
Match results:

✔ Match — extracted value matches the application data
⚠ Uncertain — close but not exact (e.g., ABV within tolerance, or low OCR confidence)
❌ Mismatch — values do not match or field was not found
Assumptions
One label per image — multi-label scans are not auto-split
The user enters the correct application data before running verification
Image quality affects OCR accuracy — heavily glared or angled images may produce incomplete results
The Government Warning Statement used is the standard TTB-required text
This is a prototype; it has not been validated against a full production dataset
Limitations
OCR accuracy drops on poor-quality images (glare, extreme angles, very small fonts)
No persistent storage — results are session-only and not saved between sessions
No login or access control
Batch processing is sequential; very large batches may be slow in older browsers
Not connected to the COLA system or any TTB database
Future Improvements
Image preprocessing (deskew, contrast enhancement) to improve OCR accuracy on imperfect photos
Audit log — save verification history with timestamps and agent ID
Connect to COLA or an internal reference dataset to auto-populate application fields
Role-based access control for production use
API endpoint to allow integration with existing TTB workflows
Improved batch performance using Web Workers for parallel processing
Author
Julie Preval

Choose me- Julie Preval Treasury Developer

github.com/JUPREVAL

Prototype built as part of a TTB take-home assessment. Not intended for production use without further validation and security review.
