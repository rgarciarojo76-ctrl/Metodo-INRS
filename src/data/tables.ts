/**
 * NTP 937 Reference Tables — Complete INRS methodology data
 */

// ─── Table 1: R-phrases → Danger Class ─────────────────

/** Maps individual R-phrase codes to their danger class (1-5). */
export const R_PHRASE_DANGER_CLASS: Record<string, number> = {
  // Class 5 (highest)
  'R26': 5, 'R32': 5, 'R39/26': 5, 'R39/26/27': 5, 'R39/26/27/28': 5,
  'R39/26/28': 5, 'R45': 5, 'R46': 5, 'R49': 5, 'R61': 5,
  'R26/27': 5, 'R26/28': 5, 'R26/27/28': 5,
  // Class 4
  'R23': 4, 'R23/24': 4, 'R23/25': 4, 'R23/24/25': 4,
  'R24': 4, 'R24/25': 4, 'R25': 4, 'R27': 4, 'R27/28': 4, 'R28': 4,
  'R35': 4, 'R39': 4, 'R39/23': 4, 'R39/23/24': 4,
  'R39/23/24/25': 4, 'R39/23/25': 4, 'R39/24': 4, 'R39/24/25': 4,
  'R39/25': 4, 'R39/27': 4, 'R39/27/28': 4, 'R39/28': 4,
  'R40': 4, 'R42': 4, 'R42/43': 4, 'R48/23': 4,
  'R48/23/24': 4, 'R48/23/24/25': 4, 'R48/23/25': 4,
  'R48/24': 4, 'R48/24/25': 4, 'R48/25': 4,
  'R60': 4, 'R62': 4, 'R63': 4,
  // Class 3
  'R20': 3, 'R20/21': 3, 'R20/22': 3, 'R20/21/22': 3,
  'R21': 3, 'R21/22': 3, 'R22': 3,
  'R34': 3, 'R37': 3, 'R41': 3, 'R43': 3,
  'R48/20': 3, 'R48/20/21': 3, 'R48/20/21/22': 3, 'R48/20/22': 3,
  'R48/21': 3, 'R48/21/22': 3, 'R48/22': 3,
  'R68': 3, 'R68/20': 3, 'R68/20/21': 3, 'R68/20/21/22': 3,
  'R68/20/22': 3, 'R68/21': 3, 'R68/21/22': 3, 'R68/22': 3,
  // Class 2
  'R36': 2, 'R36/37': 2, 'R36/37/38': 2, 'R36/38': 2,
  'R38': 2, 'R65': 2, 'R67': 2,
  // Class 1
  'R33': 1, 'R66': 1,
};

// ─── Table 1b: H-phrases → Danger Class ────────────────

export const H_PHRASE_DANGER_CLASS: Record<string, number> = {
  // Class 5
  'H330': 5, 'H340': 5, 'H350': 5, 'H350i': 5, 'H360': 5,
  'H360F': 5, 'H360D': 5, 'H360FD': 5, 'H360Fd': 5, 'H360Df': 5,
  'H370': 5,
  // Class 4
  'H300': 4, 'H301': 4, 'H310': 4, 'H311': 4, 'H314': 4,
  'H331': 4, 'H334': 4, 'H341': 4, 'H351': 4,
  'H361': 4, 'H361f': 4, 'H361d': 4, 'H361fd': 4,
  'H371': 4, 'H372': 4, 'H300+H310': 4, 'H300+H330': 4,
  'H310+H330': 4, 'H300+H310+H330': 4,
  // Class 3
  'H302': 3, 'H312': 3, 'H315': 3, 'H317': 3, 'H318': 3,
  'H332': 3, 'H335': 3, 'H336': 3, 'H373': 3,
  'H301+H311': 3, 'H301+H331': 3, 'H311+H331': 3,
  'H301+H311+H331': 3, 'H362': 3,
  // Class 2
  'H304': 2, 'H315+H319': 2, 'H319': 2,
  // Class 1
  'H303': 1, 'H313': 1, 'H333': 1,
};

// ─── Table 1c: Special Materials → Danger Class ────────

export interface SpecialMaterial {
  id: string;
  name: string;
  dangerClass: number;
  notes?: string;
}

export const SPECIAL_MATERIALS: SpecialMaterial[] = [
  { id: 'iron', name: 'Hierro (humos/polvo)', dangerClass: 2 },
  { id: 'cereal', name: 'Cereal (polvo)', dangerClass: 2 },
  { id: 'graphite', name: 'Grafito', dangerClass: 2 },
  { id: 'construction', name: 'Material de construcción', dangerClass: 2 },
  { id: 'talc', name: 'Talco (sin amianto)', dangerClass: 3 },
  { id: 'cement', name: 'Cemento Portland', dangerClass: 3 },
  { id: 'welding_mild', name: 'Soldadura (acero suave)', dangerClass: 3 },
  { id: 'welding_stainless', name: 'Soldadura (acero inoxidable)', dangerClass: 4, notes: 'Contiene cromo VI' },
  { id: 'welding_galvanized', name: 'Soldadura (galvanizado)', dangerClass: 4 },
  { id: 'ceramic_fibers', name: 'Fibras cerámicas', dangerClass: 4 },
  { id: 'vegetable_fibers', name: 'Fibras vegetales', dangerClass: 3 },
  { id: 'lead_paint', name: 'Pinturas de plomo', dangerClass: 5 },
  { id: 'grinding_wheels', name: 'Muelas abrasivas', dangerClass: 2 },
  { id: 'sand', name: 'Arenas (sílice)', dangerClass: 4, notes: 'Sílice cristalina' },
  { id: 'cutting_oils', name: 'Aceites de corte (nebulización)', dangerClass: 3 },
  { id: 'softwood', name: 'Maderas blandas', dangerClass: 3 },
  { id: 'hardwood', name: 'Maderas duras', dangerClass: 4, notes: 'Cancerígeno categoría 1' },
  { id: 'amianto', name: 'Amianto (asbesto)', dangerClass: 5, notes: 'Requiere evaluación cuantitativa obligatoria (RD 396/2006)' },
  { id: 'bitumen', name: 'Betunes / asfalto', dangerClass: 3 },
  { id: 'gasoline', name: 'Gasolina', dangerClass: 4 },
  { id: 'diesel', name: 'Gasóleo / Diésel', dangerClass: 3 },
  { id: 'mineral_wool', name: 'Lana mineral', dangerClass: 2 },
  { id: 'plaster', name: 'Yeso', dangerClass: 2 },
  { id: 'flour', name: 'Harina', dangerClass: 3 },
  { id: 'sugar', name: 'Azúcar (polvo)', dangerClass: 2 },
];

// ─── VLA → Danger Class ────────────────────────────────

/**
 * Given a VLA-ED in mg/m³ (already adjusted for particulate if needed),
 * returns the danger class.
 */
export function dangerClassFromVLA(vlaAdjusted: number): number {
  if (vlaAdjusted >= 100) return 1;
  if (vlaAdjusted >= 10) return 2;
  if (vlaAdjusted >= 1) return 3;
  if (vlaAdjusted >= 0.1) return 4;
  return 5; // < 0.1 mg/m³
}

// ─── Table 2: Quantity Class Thresholds ────────────────

/**
 * Given percentage index (Qi/Qmax × 100), returns quantity class (1-5).
 */
export function quantityClassFromIndex(percentIndex: number): number {
  if (percentIndex < 1) return 1;
  if (percentIndex < 5) return 2;
  if (percentIndex < 12) return 3;
  if (percentIndex < 33) return 4;
  return 5;
}

// ─── Table 3: Frequency Class ──────────────────────────
// Frequency levels are directly mapped to classes 0-4
// (FrequencyLevel enum values already correspond to classes)

// ─── Table 4: Potential Exposure Matrix (CC × CF → CEP) ─

/**
 * Matrix: [quantityClass 1-5][frequencyClass 0-4] → potential exposure class (1-5)
 */
const EXPOSURE_MATRIX: number[][] = [
  // CF→  0  1  2  3  4    (CC: row)
  /* 1 */ [0, 1, 1, 1, 1],
  /* 2 */ [0, 1, 1, 2, 2],
  /* 3 */ [0, 1, 2, 3, 3],
  /* 4 */ [0, 2, 3, 3, 4],
  /* 5 */ [0, 2, 3, 4, 5],
];

export function potentialExposureClass(cc: number, cf: number): number {
  if (cf === 0) return 0;
  const row = Math.min(Math.max(cc, 1), 5) - 1;
  const col = Math.min(Math.max(cf, 0), 4);
  return EXPOSURE_MATRIX[row][col];
}

// ─── Table 5: Potential Risk Matrix (CP × CEP → CRP) ──

/**
 * Matrix: [dangerClass 1-5][exposureClass 1-5] → potential risk class (1-5)
 */
const RISK_MATRIX: number[][] = [
  // CEP→  1  2  3  4  5   (CP: row)
  /* 1 */ [1, 1, 1, 2, 2],
  /* 2 */ [1, 1, 2, 2, 3],
  /* 3 */ [1, 2, 2, 3, 4],
  /* 4 */ [2, 3, 3, 4, 5],
  /* 5 */ [3, 4, 4, 5, 5],
];

export function potentialRiskClass(cp: number, cep: number): number {
  if (cep === 0) return 1;
  const row = Math.min(Math.max(cp, 1), 5) - 1;
  const col = Math.min(Math.max(cep, 1), 5) - 1;
  return RISK_MATRIX[row][col];
}

// ─── Table 6: Risk Class → Score ───────────────────────

export const RISK_CLASS_SCORE: Record<number, number> = {
  1: 1,
  2: 10,
  3: 100,
  4: 1000,
  5: 10000,
};

// ─── Table 7: Solid Pulverulence ───────────────────────
// Already encoded in SolidForm enum → class in volatility engine

// ─── Table 8: Vapor Pressure → Volatility Class ───────

export function volatilityFromVaporPressure(pvKPa: number): number {
  if (pvKPa < 0.5) return 1;
  if (pvKPa < 25) return 2;
  return 3;
}

// ─── Figure 2: Boiling Point vs Working Temp → Volatility ─

/**
 * Digitized Figure 2 from NTP 937.
 * Given boiling point (°C) and working temperature (°C),
 * returns volatility class 1 (low), 2 (medium), or 3 (high).
 *
 * The figure divides the space into three zones based on the
 * difference (Teb - Tuso) relative to the boiling point.
 */
export function volatilityFromTemperatures(tBoiling: number, tWorking: number): number {
  // If working temp exceeds boiling point, maximum volatility
  if (tWorking >= tBoiling) return 3;

  const delta = tBoiling - tWorking;
  const ratio = delta / (tBoiling > 0 ? tBoiling : 1);

  // Approximate curve boundaries from Figure 2 NTP 937:
  // High volatility zone: Tuso > ~0.9×Teb (small delta)
  // Medium zone: Tuso between ~0.5×Teb and ~0.9×Teb
  // Low zone: Tuso < ~0.5×Teb (large delta)

  // More precise: using absolute difference thresholds adapted from the graph
  if (tBoiling <= 50) {
    // Low boiling point liquids
    if (delta < 5) return 3;
    if (delta < 20) return 2;
    return 1;
  } else if (tBoiling <= 100) {
    if (delta < 10) return 3;
    if (delta < 40) return 2;
    return 1;
  } else if (tBoiling <= 150) {
    if (delta < 20) return 3;
    if (delta < 60) return 2;
    return 1;
  } else {
    // High boiling point
    if (ratio < 0.15) return 3;
    if (ratio < 0.45) return 2;
    return 1;
  }
}

// ─── Table 10: Volatility/Pulverulence Score ───────────

export const VOLATILITY_SCORE: Record<number, number> = {
  1: 1,
  2: 10,
  3: 100,
};

// ─── Table 11: VLA Correction Factors ──────────────────

export function vlaCorrectionFactor(vlaAdjusted: number | null, hasVLA: boolean): number {
  if (!hasVLA || vlaAdjusted === null) return 1;
  if (vlaAdjusted > 0.1) return 1;
  if (vlaAdjusted > 0.01) return 10;
  if (vlaAdjusted > 0.001) return 30;
  return 100;
}

// ─── Procedure Score (Figure 3) ────────────────────────

export const PROCEDURE_SCORE: Record<number, number> = {
  1: 0.001,
  2: 0.05,
  3: 0.5,
  4: 1,
};

// ─── Protection/Ventilation Score (Figure 4) ───────────

export const VENTILATION_SCORE: Record<number, number> = {
  1: 0.001,
  2: 0.1,
  3: 0.7,
  4: 1,
  5: 10,
};

// ─── Danger Class → Score (for inhalation/dermal) ──────

export const DANGER_CLASS_SCORE: Record<number, number> = {
  1: 1,
  2: 10,
  3: 100,
  4: 1000,
  5: 10000,
};

// ─── Risk Characterization Thresholds ──────────────────

export function characterizeInhalationRisk(pri: number): {
  level: 'low' | 'moderate' | 'very_high';
  priority: number;
  label: string;
  recommendation: string;
} {
  if (pri > 1000) {
    return {
      level: 'very_high',
      priority: 1,
      label: 'RIESGO PROBABLEMENTE MUY ELEVADO',
      recommendation: 'Se requieren medidas correctoras inmediatas. Consultar NTP 872 para medidas preventivas aplicables.',
    };
  }
  if (pri > 100) {
    return {
      level: 'moderate',
      priority: 2,
      label: 'RIESGO MODERADO',
      recommendation: 'Necesita probablemente medidas correctoras y/o evaluación más detallada (mediciones según UNE-EN 689).',
    };
  }
  return {
    level: 'low',
    priority: 3,
    label: 'RIESGO A PRIORI BAJO',
    recommendation: 'Sin necesidad de modificaciones. Mantener condiciones actuales y reevaluar periódicamente.',
  };
}

export function characterizeDermalRisk(prd: number): {
  level: 'low' | 'moderate' | 'very_high';
  priority: number;
  label: string;
} {
  if (prd > 1000) {
    return { level: 'very_high', priority: 1, label: 'RIESGO DÉRMICO MUY ELEVADO' };
  }
  if (prd > 100) {
    return { level: 'moderate', priority: 2, label: 'RIESGO DÉRMICO MODERADO' };
  }
  return { level: 'low', priority: 3, label: 'RIESGO DÉRMICO A PRIORI BAJO' };
}

// ─── Dermal toxicity R/H phrases ───────────────────────

export const DERMAL_R_PHRASES = ['R21', 'R24', 'R27', 'R34', 'R35', 'R38', 'R43'];
export const DERMAL_H_PHRASES = ['H312', 'H314', 'H315', 'H317', 'H318'];

// ─── Carcinogenic / Mutagenic phrases ──────────────────

export const CARCINOGENIC_R = ['R45', 'R49', 'R46'];
export const CARCINOGENIC_H = ['H340', 'H350', 'H350i'];

// ─── Frequency descriptions ────────────────────────────

export const FREQUENCY_OPTIONS = {
  day: [
    { level: 0, label: 'No usado', description: '' },
    { level: 1, label: 'Ocasional', description: '≤ 30 min/día' },
    { level: 2, label: 'Intermitente', description: '30-120 min/día' },
    { level: 3, label: 'Frecuente', description: '2-6 h/día' },
    { level: 4, label: 'Permanente', description: '> 6 h/día' },
  ],
  week: [
    { level: 0, label: 'No usado', description: '' },
    { level: 1, label: 'Ocasional', description: '≤ 2 h/semana' },
    { level: 2, label: 'Intermitente', description: '2-8 h/semana' },
    { level: 3, label: 'Frecuente', description: '1-3 días/semana' },
    { level: 4, label: 'Permanente', description: '> 3 días/semana' },
  ],
  month: [
    { level: 0, label: 'No usado', description: '' },
    { level: 1, label: 'Ocasional', description: '1 día/mes' },
    { level: 2, label: 'Intermitente', description: '2-6 días/mes' },
    { level: 3, label: 'Frecuente', description: '7-15 días/mes' },
    { level: 4, label: 'Permanente', description: '> 15 días/mes' },
  ],
  year: [
    { level: 0, label: 'No usado en el último año (Clase 0)', description: '' },
    { level: 1, label: 'Ocasional', description: '≤ 15 días/año' },
    { level: 2, label: 'Intermitente', description: '15 días - 2 meses/año' },
    { level: 3, label: 'Frecuente', description: '2-5 meses/año' },
    { level: 4, label: 'Permanente', description: '> 5 meses/año' },
  ],
};
