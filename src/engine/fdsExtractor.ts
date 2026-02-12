/**
 * FDS Extractor — RegEx-based extraction of chemical data from FDS text.
 * Processes sections identified from REACH-format Safety Data Sheets.
 */
import type { ExtractedAgentData, FDSSections, FieldConfidence, ConfidenceLevel } from '../types';
import { H_PHRASE_DANGER_CLASS, R_PHRASE_DANGER_CLASS, DANGER_CLASS_SCORE } from '../data/tables';

// ─── Helpers ─────────────────────────────────────────────

function fc(
  value: string | number | boolean | string[] | null,
  confidence: number,
  source?: string,
): FieldConfidence {
  let level: ConfidenceLevel = 'not_found';
  if (value !== null && value !== '' && !(Array.isArray(value) && value.length === 0)) {
    if (confidence >= 95) level = 'high';
    else if (confidence >= 70) level = 'medium';
    else level = 'low';
  }
  return { value, confidence, level, source };
}

function firstMatch(text: string, patterns: RegExp[]): string | null {
  for (const p of patterns) {
    const m = text.match(p);
    if (m && m[1]) return m[1].trim();
  }
  return null;
}

// ─── Section Identifier ─────────────────────────────────

const SECTION_PATTERNS: Record<string, RegExp[]> = {
  section1: [
    /(?:SECCI[ÓO]N\s*1|SECTION\s*1)[.:\-–]?\s*(?:Identificaci[óo]n|Identification)/i,
  ],
  section2: [
    /(?:SECCI[ÓO]N\s*2|SECTION\s*2)[.:\-–]?\s*(?:Identificaci[óo]n de (?:los )?peligros|Hazards? identification)/i,
  ],
  section3: [
    /(?:SECCI[ÓO]N\s*3|SECTION\s*3)[.:\-–]?\s*(?:Composici[óo]n|Composition)/i,
  ],
  section8: [
    /(?:SECCI[ÓO]N\s*8|SECTION\s*8)[.:\-–]?\s*(?:Controles de exposici[óo]n|Exposure controls)/i,
  ],
  section9: [
    /(?:SECCI[ÓO]N\s*9|SECTION\s*9)[.:\-–]?\s*(?:Propiedades f[íi]sicas|Physical and chemical)/i,
  ],
  section11: [
    /(?:SECCI[ÓO]N\s*11|SECTION\s*11)[.:\-–]?\s*(?:Informaci[óo]n toxicol[óo]gica|Toxicological)/i,
  ],
  section15: [
    /(?:SECCI[ÓO]N\s*15|SECTION\s*15)[.:\-–]?\s*(?:Informaci[óo]n reglamentaria|Regulatory)/i,
  ],
};

export function identifySections(fullText: string): FDSSections {
  const sections: FDSSections = {};
  const sectionKeys = Object.keys(SECTION_PATTERNS) as (keyof FDSSections)[];
  const allSectionStarts: { key: keyof FDSSections; index: number }[] = [];

  // Find the start position of each section
  for (const key of sectionKeys) {
    for (const pattern of SECTION_PATTERNS[key]) {
      const m = fullText.match(pattern);
      if (m && m.index !== undefined) {
        allSectionStarts.push({ key, index: m.index });
        break;
      }
    }
  }

  // Sort by position in text
  allSectionStarts.sort((a, b) => a.index - b.index);

  // Also find generic section headers to delimit sections
  const genericSectionPattern = /(?:SECCI[ÓO]N|SECTION)\s*(\d{1,2})/gi;
  const allHeaders: number[] = [];
  let gm: RegExpExecArray | null;
  while ((gm = genericSectionPattern.exec(fullText)) !== null) {
    allHeaders.push(gm.index);
  }
  allHeaders.sort((a, b) => a - b);

  for (let i = 0; i < allSectionStarts.length; i++) {
    const start = allSectionStarts[i].index;
    // End is either next identified section or next generic header after this one
    let end = fullText.length;
    
    // Find the next section header after this one
    const nextHeaderIdx = allHeaders.find(h => h > start + 10);
    if (nextHeaderIdx !== undefined) end = nextHeaderIdx;

    // Or next identified section
    if (i + 1 < allSectionStarts.length) {
      end = Math.min(end, allSectionStarts[i + 1].index);
    }

    sections[allSectionStarts[i].key] = fullText.substring(start, end);
  }

  return sections;
}

// ─── Field Extractors ────────────────────────────────────

function extractCommercialName(sections: FDSSections): FieldConfidence {
  const s = sections.section1 || '';
  const v = firstMatch(s, [
    /(?:Nombre\s+(?:del\s+)?producto|Product\s+name|Nombre\s+comercial)\s*[:\-–]\s*([^\n]+)/i,
    /1\.1[.\s]*(?:Identificador|Identifier)[^\n]*\n\s*([^\n]+)/i,
  ]);
  return fc(v, v ? 95 : 0, 'section1');
}

function extractSubstanceName(sections: FDSSections): FieldConfidence {
  const text = (sections.section1 || '') + '\n' + (sections.section3 || '');
  const v = firstMatch(text, [
    /(?:Sustancia|Nombre\s+qu[íi]mico|Chemical\s+name|Substance\s+name)\s*[:\-–]\s*([^\n]+)/i,
    /(?:Denominaci[óo]n\s+qu[íi]mica)\s*[:\-–]\s*([^\n]+)/i,
  ]);
  return fc(v, v ? 90 : 0, 'section1/3');
}

function extractCAS(sections: FDSSections): FieldConfidence {
  const text = (sections.section1 || '') + '\n' + (sections.section3 || '');
  const m = text.match(/(?:CAS|N[ºo°]\s*CAS|CAS[\s-]*No?\.?)\s*[:\-–]?\s*(\d{2,7}-\d{2}-\d)/i);
  return fc(m?.[1] ?? null, m ? 100 : 0, 'section1/3');
}

function extractPhysicalState(sections: FDSSections): FieldConfidence {
  const s = sections.section9 || '';
  const stateMap: Record<string, string> = {
    'líquido': 'liquid', 'liquid': 'liquid', 'liquido': 'liquid',
    'sólido': 'solid', 'solid': 'solid', 'solido': 'solid', 'polvo': 'solid', 'powder': 'solid',
    'gas': 'gas', 'gaseoso': 'gas', 'gaseous': 'gas',
    'aerosol': 'aerosol',
  };
  const m = s.match(/(?:Estado\s+f[íi]sico|Physical\s+state|Form|Forma|Aspecto|Appearance)\s*[:\-–]?\s*([^\n,;]+)/i);
  if (m) {
    const raw = m[1].trim().toLowerCase();
    for (const [key, val] of Object.entries(stateMap)) {
      if (raw.includes(key)) return fc(val, 100, 'section9');
    }
    return fc(raw, 70, 'section9');
  }
  return fc(null, 0);
}

function extractHPhrases(sections: FDSSections): FieldConfidence {
  const text = (sections.section2 || '') + '\n' + (sections.section15 || '');
  const matches: string[] = [];
  const pattern = /\b(H[2-4]\d{2}[A-Za-z]?)\b/g;
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(text)) !== null) {
    if (!matches.includes(m[1])) matches.push(m[1]);
  }
  return fc(
    matches.length > 0 ? matches : null,
    matches.length > 0 ? 97 : 0,
    'section2/15',
  );
}

function extractRPhrases(sections: FDSSections): FieldConfidence {
  const text = (sections.section2 || '') + '\n' + (sections.section15 || '');
  const matches: string[] = [];
  const pattern = /\b(R\d{1,3}(?:\/\d{1,3})*)\b/g;
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(text)) !== null) {
    if (!matches.includes(m[1])) matches.push(m[1]);
  }
  return fc(
    matches.length > 0 ? matches : null,
    matches.length > 0 ? 95 : 0,
    'section2/15',
  );
}

function extractVLA(sections: FDSSections, type: 'ED' | 'EC'): FieldConfidence {
  const text = (sections.section8 || '') + '\n' + (sections.section15 || '');
  const label = type === 'ED' ? 'VLA[\\s-]*ED' : 'VLA[\\s-]*EC';
  const pattern = new RegExp(label + '\\s*[:\\-–]?\\s*([\\d.,]+)\\s*(mg\\/m[³3]|ppm)?', 'i');
  const m = text.match(pattern);
  if (m) {
    const val = parseFloat(m[1].replace(',', '.'));
    return fc(isNaN(val) ? null : val, 92, 'section8/15');
  }
  // Also try TWA/OEL patterns
  const twaPattern = new RegExp('(?:TWA|OEL|TLV)\\s*[:\\-–]?\\s*([\\d.,]+)\\s*(mg\\/m[³3]|ppm)', 'i');
  const m2 = text.match(twaPattern);
  if (m2 && type === 'ED') {
    const val = parseFloat(m2[1].replace(',', '.'));
    return fc(isNaN(val) ? null : val, 80, 'section8/15');
  }
  return fc(null, 0);
}

function extractBoilingPoint(sections: FDSSections): FieldConfidence {
  const s = sections.section9 || '';
  const m = s.match(/(?:Punto\s+de\s+ebullici[óo]n|Boiling\s+point|Ebullici[oó]n)\s*[:\-–]?\s*(?:aprox\.?\s*)?([0-9.,\-]+)\s*°?\s*C/i);
  if (m) {
    // Handle ranges like "56-57" → take lower
    const parts = m[1].split('-').map(p => parseFloat(p.replace(',', '.')));
    const val = Math.min(...parts.filter(n => !isNaN(n)));
    return fc(isNaN(val) ? null : val, 100, 'section9');
  }
  return fc(null, 0);
}

function extractVaporPressure(sections: FDSSections): FieldConfidence {
  const s = sections.section9 || '';
  const m = s.match(/(?:Presi[óo]n\s+de\s+vapor|Vapor\s+pressure)\s*[:\-–]?\s*([0-9.,]+)\s*(kPa|hPa|mmHg|mbar|Pa)/i);
  if (m) {
    let val = parseFloat(m[1].replace(',', '.'));
    const unit = m[2].toLowerCase();
    // Normalize to kPa
    if (unit === 'hpa' || unit === 'mbar') val /= 10;
    else if (unit === 'mmhg') val *= 0.133322;
    else if (unit === 'pa') val /= 1000;
    return fc(isNaN(val) ? null : Math.round(val * 100) / 100, 78, 'section9');
  }
  return fc(null, 0);
}

function extractFIV(sections: FDSSections): FieldConfidence {
  const text = (sections.section8 || '') + '\n' + (sections.section15 || '');
  const found = /\bFIV\b|factor\s+de\s+incertidumbre/i.test(text);
  return fc(found, found ? 90 : 85, 'section8/15');
}

function extractDermalToxicity(sections: FDSSections, hPhrases: string[]): FieldConfidence {
  const dermalH = ['H310', 'H311', 'H312', 'H314', 'H315', 'H317', 'H318'];
  const hasDermal = hPhrases.some(h => dermalH.includes(h));
  if (hasDermal) return fc(true, 95, 'h-phrases');

  const text = (sections.section11 || '') + '\n' + (sections.section2 || '');
  const dermalKeywords = /(?:toxicidad\s+(?:por\s+)?(?:v[íi]a\s+)?(?:cut[áa]nea|d[ée]rmica)|(?:dermal|skin)\s+(?:toxicity|irritation))/i;
  const hasKeyword = dermalKeywords.test(text);
  return fc(hasKeyword, hasKeyword ? 80 : 70, 'section11');
}

function extractSolidForm(sections: FDSSections, physState: string | null): FieldConfidence {
  if (physState !== 'solid') return fc(null, 100);
  const s = sections.section9 || '';
  const m = s.match(/(?:Forma|Apariencia|Form|Appearance)\s*[:\-–]?\s*([^\n]+)/i);
  if (m) {
    const raw = m[1].toLowerCase();
    if (/polvo\s+fino|fine\s+powder|very\s+fine/i.test(raw)) return fc('fine_powder', 90, 'section9');
    if (/polvo|powder|dust/i.test(raw)) return fc('grain_powder', 85, 'section9');
    if (/grano|granul|pellet|escama|pastilla|flake|tablet/i.test(raw)) return fc('pellets', 85, 'section9');
  }
  return fc(null, 0);
}

// ─── Main Extractor ──────────────────────────────────────

export function extractFromFDS(
  fdsFileId: string,
  fileName: string,
  sections: FDSSections,
): ExtractedAgentData {
  const commercialName = extractCommercialName(sections);
  const substanceName = extractSubstanceName(sections);
  const casNumber = extractCAS(sections);
  const physicalState = extractPhysicalState(sections);
  const hPhrases = extractHPhrases(sections);
  const rPhrases = extractRPhrases(sections);
  const vlaED = extractVLA(sections, 'ED');
  const vlaEC = extractVLA(sections, 'EC');
  const boilingPoint = extractBoilingPoint(sections);
  const vaporPressure = extractVaporPressure(sections);
  const hasFIV = extractFIV(sections);
  const hPhrasesArr = (Array.isArray(hPhrases.value) ? hPhrases.value : []) as string[];
  const hasDermalToxicity = extractDermalToxicity(sections, hPhrasesArr);
  const solidForm = extractSolidForm(sections, physicalState.value as string | null);

  // Auto-calculate danger class from phrases
  let dangerClass: number | undefined;
  let dangerScore: number | undefined;

  const classes: number[] = [];
  for (const h of hPhrasesArr) {
    const hTrimmed = h.trim();
    if (H_PHRASE_DANGER_CLASS[hTrimmed] !== undefined) classes.push(H_PHRASE_DANGER_CLASS[hTrimmed]);
  }
  const rPhrasesArr = (Array.isArray(rPhrases.value) ? rPhrases.value : []) as string[];
  for (const r of rPhrasesArr) {
    const rTrimmed = r.trim().toUpperCase();
    if (R_PHRASE_DANGER_CLASS[rTrimmed] !== undefined) classes.push(R_PHRASE_DANGER_CLASS[rTrimmed]);
  }
  if (classes.length > 0) {
    dangerClass = Math.max(...classes);
    dangerScore = DANGER_CLASS_SCORE[dangerClass] ?? 1;
  }

  return {
    fdsFileId,
    fileName,
    validated: false,
    commercialName,
    substanceName,
    casNumber,
    physicalState,
    hPhrases,
    rPhrases,
    vlaED,
    vlaEC,
    boilingPoint,
    vaporPressure,
    hasFIV,
    hasDermalToxicity,
    solidForm,
    dangerClass,
    dangerScore,
  };
}
