// Label verification helpers: OCR field extraction + comparison logic.

export type MatchStatus = 'match' | 'mismatch' | 'uncertain';

export interface FieldResult {
  field: string;
  expected: string;
  extracted: string;
  status: MatchStatus;
  note?: string;
}

export interface ApplicationData {
  brandName: string;
  classType: string;
  abv: string;
  netContents: string;
  bottler: string;
}

export const GOVERNMENT_WARNING_TEXT =
  "GOVERNMENT WARNING: (1) ACCORDING TO THE SURGEON GENERAL, WOMEN SHOULD NOT DRINK ALCOHOLIC BEVERAGES DURING PREGNANCY BECAUSE OF THE RISK OF BIRTH DEFECTS. (2) CONSUMPTION OF ALCOHOLIC BEVERAGES IMPAIRS YOUR ABILITY TO DRIVE A CAR OR OPERATE MACHINERY, AND MAY CAUSE HEALTH PROBLEMS.";

// --- normalization & similarity ---

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\w%./\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const v0 = new Array(b.length + 1);
  const v1 = new Array(b.length + 1);
  for (let i = 0; i <= b.length; i++) v0[i] = i;
  for (let i = 0; i < a.length; i++) {
    v1[0] = i + 1;
    for (let j = 0; j < b.length; j++) {
      const cost = a[i] === b[j] ? 0 : 1;
      v1[j + 1] = Math.min(v1[j] + 1, v0[j + 1] + 1, v0[j] + cost);
    }
    for (let j = 0; j <= b.length; j++) v0[j] = v1[j];
  }
  return v1[b.length];
}

function similarity(a: string, b: string): number {
  const na = normalize(a);
  const nb = normalize(b);
  if (!na || !nb) return 0;
  const dist = levenshtein(na, nb);
  return 1 - dist / Math.max(na.length, nb.length);
}

// --- field extractors ---

export function extractAbv(text: string): string {
  // Look for patterns like "40% ALC/VOL", "ALC 5.5% BY VOL", "ABV 12.5%"
  const patterns = [
    /(\d{1,2}(?:\.\d{1,2})?)\s*%\s*(?:alc(?:\.|ohol)?\s*\/?\s*vol|alc\s*by\s*vol|abv)/i,
    /(?:alc(?:ohol)?|abv)[^0-9]{0,10}(\d{1,2}(?:\.\d{1,2})?)\s*%/i,
    /(\d{1,2}(?:\.\d{1,2})?)\s*%/,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return `${m[1]}%`;
  }
  return '';
}

export function extractNetContents(text: string): string {
  // Match "750 ML", "12 FL OZ", "1.75 L", "355mL"
  const patterns = [
    /(\d+(?:\.\d+)?)\s*(ml|millilit(?:er|re)s?)/i,
    /(\d+(?:\.\d+)?)\s*(l|lit(?:er|re)s?)\b/i,
    /(\d+(?:\.\d+)?)\s*(fl\.?\s*oz|fluid\s*ounces?)/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      const unit = m[2].toLowerCase().replace(/\.|\s/g, '');
      const normUnit = unit.startsWith('ml') || unit.startsWith('millil')
        ? 'mL'
        : unit.startsWith('l') || unit.startsWith('lit')
          ? 'L'
          : 'fl oz';
      return `${m[1]} ${normUnit}`;
    }
  }
  return '';
}

export function extractGovernmentWarning(text: string): string {
  // Find from "GOVERNMENT WARNING" to end of warning block.
  const idx = text.toUpperCase().indexOf('GOVERNMENT WARNING');
  if (idx === -1) return '';
  // Take a generous slice (warning is ~330 chars).
  return text.slice(idx, idx + 600).trim();
}

// Generic line-based extraction: finds the line that best matches expected.
function findBestLine(text: string, expected: string): string {
  if (!expected) return '';
  const lines = text
    .split(/[\n\r]+/)
    .map((l) => l.trim())
    .filter((l) => l.length > 1);
  let best = '';
  let bestScore = 0;
  for (const line of lines) {
    const s = similarity(line, expected);
    if (s > bestScore) {
      bestScore = s;
      best = line;
    }
  }
  return bestScore > 0.4 ? best : '';
}

// --- comparison ---

function compareField(field: string, expected: string, extracted: string): FieldResult {
  if (!expected) {
    return { field, expected, extracted, status: 'uncertain', note: 'No expected value' };
  }
  if (!extracted) {
    return { field, expected, extracted, status: 'mismatch', note: 'Not detected on label' };
  }
  const sim = similarity(expected, extracted);
  if (sim >= 0.92) return { field, expected, extracted, status: 'match' };
  if (sim >= 0.7) return { field, expected, extracted, status: 'uncertain', note: 'Close match — review' };
  return { field, expected, extracted, status: 'mismatch' };
}

function compareAbv(expected: string, extracted: string): FieldResult {
  const field = 'ABV';
  const eNum = parseFloat(expected.replace('%', ''));
  const xNum = parseFloat(extracted.replace('%', ''));
  if (!expected) return { field, expected, extracted, status: 'uncertain', note: 'No expected value' };
  if (!extracted || isNaN(xNum)) return { field, expected, extracted, status: 'mismatch', note: 'ABV not detected' };
  if (isNaN(eNum)) return { field, expected, extracted, status: 'uncertain' };
  const diff = Math.abs(eNum - xNum);
  if (diff < 0.05) return { field, expected, extracted, status: 'match' };
  // TTB tolerance is ~0.3% for wine/spirits; treat small diff as uncertain.
  if (diff <= 0.3) return { field, expected, extracted, status: 'uncertain', note: 'Within tolerance' };
  return { field, expected, extracted, status: 'mismatch', note: `Off by ${diff.toFixed(2)}%` };
}

function compareGovernmentWarning(extracted: string): FieldResult {
  const field = 'Government Warning';
  if (!extracted) {
    return {
      field,
      expected: GOVERNMENT_WARNING_TEXT,
      extracted: '',
      status: 'mismatch',
      note: 'Government Warning not found on label',
    };
  }
  // Must be in ALL CAPS (per TTB rule). Check the "GOVERNMENT WARNING" prefix is uppercase in raw extract.
  const hasUpperPrefix = /GOVERNMENT WARNING/.test(extracted);
  const sim = similarity(extracted, GOVERNMENT_WARNING_TEXT);
  if (sim >= 0.95 && hasUpperPrefix) {
    return { field, expected: GOVERNMENT_WARNING_TEXT, extracted, status: 'match' };
  }
  if (sim >= 0.8) {
    return {
      field,
      expected: GOVERNMENT_WARNING_TEXT,
      extracted,
      status: 'uncertain',
      note: hasUpperPrefix ? 'Wording differs slightly — verify word-for-word' : 'Not in required ALL CAPS or wording differs',
    };
  }
  return {
    field,
    expected: GOVERNMENT_WARNING_TEXT,
    extracted,
    status: 'mismatch',
    note: 'Warning text does not match required statement',
  };
}

export function verifyLabel(rawText: string, app: ApplicationData): FieldResult[] {
  const text = rawText.replace(/\u0000/g, '');
  const results: FieldResult[] = [];

  results.push(compareField('Brand Name', app.brandName, findBestLine(text, app.brandName)));
  results.push(compareField('Class / Type', app.classType, findBestLine(text, app.classType)));
  results.push(compareAbv(app.abv, extractAbv(text)));
  results.push(compareField('Net Contents', app.netContents, extractNetContents(text)));
  results.push(compareField('Bottler / Producer', app.bottler, findBestLine(text, app.bottler)));
  results.push(compareGovernmentWarning(extractGovernmentWarning(text)));

  return results;
}

export function summarize(results: FieldResult[]) {
  return {
    match: results.filter((r) => r.status === 'match').length,
    mismatch: results.filter((r) => r.status === 'mismatch').length,
    uncertain: results.filter((r) => r.status === 'uncertain').length,
  };
}
