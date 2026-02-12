// ─── Const Enums (compatible with erasableSyntaxOnly) ─────

export const PhysicalState = {
  Solid: 'solid',
  Liquid: 'liquid',
  Gas: 'gas',
  Aerosol: 'aerosol',
} as const;
export type PhysicalState = (typeof PhysicalState)[keyof typeof PhysicalState];

export const LabelingSystem = {
  OldR: 'old_r',
  NewCLP: 'new_clp',
  Both: 'both',
  None: 'none',
} as const;
export type LabelingSystem = (typeof LabelingSystem)[keyof typeof LabelingSystem];

export const VLAType = {
  ED: 'vla_ed',
  EC: 'vla_ec',
  Both: 'both',
} as const;
export type VLAType = (typeof VLAType)[keyof typeof VLAType];

export const ParticulateMatter = {
  Inhalable: 'inhalable',
  Respirable: 'respirable',
  No: 'no',
} as const;
export type ParticulateMatter = (typeof ParticulateMatter)[keyof typeof ParticulateMatter];

export const TimeReference = {
  Day: 'day',
  Week: 'week',
  Month: 'month',
  Year: 'year',
} as const;
export type TimeReference = (typeof TimeReference)[keyof typeof TimeReference];

export const FrequencyLevel = {
  NotUsed: 0,
  Occasional: 1,
  Intermittent: 2,
  Frequent: 3,
  Permanent: 4,
} as const;
export type FrequencyLevel = (typeof FrequencyLevel)[keyof typeof FrequencyLevel];

export const SolidForm = {
  FinePowder: 'fine_powder',
  GrainPowder: 'grain_powder',
  Pellets: 'pellets',
} as const;
export type SolidForm = (typeof SolidForm)[keyof typeof SolidForm];

export const ProcedureClass = {
  ClosedPermanent: 1,
  ClosedRegularOpening: 2,
  Open: 3,
  Dispersive: 4,
} as const;
export type ProcedureClass = (typeof ProcedureClass)[keyof typeof ProcedureClass];

export const VentilationClass = {
  Enclosing: 1,
  PartialCapture: 2,
  GeneralOrOutdoor: 3,
  NoVentilation: 4,
  ConfinedSpace: 5,
} as const;
export type VentilationClass = (typeof VentilationClass)[keyof typeof VentilationClass];

export const DermalSurface = {
  OneHand: 1,
  TwoHandsOrForearm: 2,
  TwoHandsPlusForearm: 3,
  ExtensiveSurface: 10,
} as const;
export type DermalSurface = (typeof DermalSurface)[keyof typeof DermalSurface];

export const DermalFrequency = {
  Occasional: 1,
  Intermittent: 2,
  Frequent: 5,
  Permanent: 10,
} as const;
export type DermalFrequency = (typeof DermalFrequency)[keyof typeof DermalFrequency];

export const RiskLevel = {
  Low: 'low',
  Moderate: 'moderate',
  VeryHigh: 'very_high',
} as const;
export type RiskLevel = (typeof RiskLevel)[keyof typeof RiskLevel];

export const Priority = {
  Low: 'low',
  Medium: 'medium',
  High: 'high',
} as const;
export type Priority = (typeof Priority)[keyof typeof Priority];

// ─── Data Models ─────────────────────────────────────────

export interface Project {
  id?: number;
  companyName: string;
  workCenter: string;
  area: string;
  evaluationDate: string;
  evaluatorName: string;
  evaluatorTitle: string;
  processDescription: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChemicalAgent {
  id: string;
  // Section 1: Identification
  commercialName: string;
  substanceName: string;
  casNumber: string;
  physicalState: PhysicalState;

  // Section 2: Hazard Classification
  labelingSystem: LabelingSystem;
  rPhrases: string[];
  hPhrases: string[];
  hasVLA: boolean;
  vlaType: VLAType | null;
  vlaED: number | null;  // mg/m³
  isParticulateMatter: ParticulateMatter;
  isSpecialMaterial: boolean;
  specialMaterialId: string | null;

  // Section 3: Quantity & Frequency
  quantity: number;
  quantityUnit: string;
  timeReference: TimeReference;
  frequencyLevel: FrequencyLevel;

  // Section 4: Physico-chemical properties
  boilingPoint: number | null;     // °C (liquids)
  workingTemperature: number | null; // °C (liquids)
  isSpray: boolean;
  hasFIV: boolean;
  vaporPressure: number | null;     // kPa
  solidForm: SolidForm | null;      // solids

  // Section 5: Work procedure
  procedureClass: ProcedureClass;

  // Section 6: Collective protection
  ventilationClass: VentilationClass;
  ventilationMaintained: 'yes' | 'unsure' | 'no';

  // Section 7: Dermal exposure
  hasDermalToxicity: boolean;
  hasSkinContact: boolean;
  dermalSurface: DermalSurface | null;
  dermalFrequency: DermalFrequency | null;
}

// ─── Calculation Results ─────────────────────────────────

export interface HierarchyResult {
  agentId: string;
  agentName: string;
  dangerClass: number;         // CP: 1-5
  quantityClass: number;       // CC: 1-5
  frequencyClass: number;      // CF: 0-4
  potentialExposureClass: number; // CEP: 1-5
  potentialRiskClass: number;  // CRP: 1-5
  riskScore: number;           // PRP
  ipaPercent: number;          // IPA %
  priority: Priority;
  selected: boolean;           // for detailed evaluation
}

export interface InhalationResult {
  agentId: string;
  agentName: string;
  dangerClass: number;
  dangerScore: number;         // PP
  volatilityClass: number;     // CV
  volatilityScore: number;     // PV
  procedureClass: number;
  procedureScore: number;      // PPr
  protectionClass: number;
  protectionScore: number;     // PPC
  vlaCorrectionFactor: number; // FC_VLA
  riskScore: number;           // PRI = PP × PV × PPr × PPC × FC
  riskLevel: RiskLevel;
  priorityAction: number;      // 1, 2, or 3
  characterization: string;
  recommendation: string;
}

export interface DermalResult {
  agentId: string;
  agentName: string;
  dangerScore: number;
  surfaceScore: number;
  frequencyScore: number;
  riskScore: number;          // PRD = PP × PS × PFD
  riskLevel: RiskLevel;
  priorityAction: number;
  characterization: string;
}

export interface Alert {
  id: string;
  agentId: string;
  agentName: string;
  type: AlertType;
  title: string;
  message: string;
  severity: 'critical' | 'warning' | 'info';
}

export type AlertType =
  | 'amianto'
  | 'carcinogenic'
  | 'thermal_decomposition'
  | 'fiv'
  | 'low_vla'
  | 'temp_exceeds_bp'
  | 'confined_space'
  | 'low_ipa';

// ─── Evaluation (stored entity) ─────────────────────────

export interface Evaluation {
  id?: number;
  project: Project;
  agents: ChemicalAgent[];
  hierarchyResults: HierarchyResult[];
  inhalationResults: InhalationResult[];
  dermalResults: DermalResult[];
  alerts: Alert[];
  currentStep: number;
  createdAt: string;
  updatedAt: string;
  // Automation fields
  mode?: 'manual' | 'auto';
  fdsFiles?: FDSFile[];
  extractedData?: ExtractedAgentData[];
  autoStep?: AutoWizardStep;
}

// ─── Wizard State ────────────────────────────────────────

export type WizardStep = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const WIZARD_STEPS: { step: WizardStep; label: string }[] = [
  { step: 1, label: 'Datos Generales' },
  { step: 2, label: 'Inventario' },
  { step: 3, label: 'Jerarquización' },
  { step: 4, label: 'Evaluación Inhalación' },
  { step: 5, label: 'Resultados Inhalación' },
  { step: 6, label: 'Riesgo Dérmico' },
  { step: 7, label: 'Resultados Finales' },
];

// ─── FDS Automation Types ────────────────────────────────

export type FDSStatus = 'pending' | 'ok' | 'old' | 'error';

export interface FDSFile {
  id: string;
  fileName: string;
  fileSize: number;          // bytes
  file: File;                // the actual File object
  status: FDSStatus;
  statusMessage?: string;
  extractedText?: string;    // full raw text from PDF
  sections?: FDSSections;    // parsed REACH sections
  addedAt: string;
}

export interface FDSSections {
  section1?: string;  // Identification
  section2?: string;  // Hazards
  section3?: string;  // Composition
  section8?: string;  // Exposure controls
  section9?: string;  // Physical/chemical properties
  section11?: string; // Toxicological information
  section15?: string; // Regulatory
}

export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'not_found';

export interface FieldConfidence {
  value: string | number | boolean | string[] | null;
  confidence: number;       // 0-100
  level: ConfidenceLevel;
  source?: string;           // which section it was found in
}

export interface ExtractedAgentData {
  fdsFileId: string;
  fileName: string;
  validated: boolean;

  // Extracted fields with confidence
  commercialName: FieldConfidence;
  substanceName: FieldConfidence;
  casNumber: FieldConfidence;
  physicalState: FieldConfidence;
  hPhrases: FieldConfidence;
  rPhrases: FieldConfidence;
  vlaED: FieldConfidence;
  vlaEC: FieldConfidence;
  boilingPoint: FieldConfidence;
  vaporPressure: FieldConfidence;
  hasFIV: FieldConfidence;
  hasDermalToxicity: FieldConfidence;
  solidForm: FieldConfidence;

  // Auto-calculated
  dangerClass?: number;
  dangerScore?: number;
}

// ─── Auto Wizard ─────────────────────────────────────────

export type AutoWizardStep = 1 | 2 | 3 | 4 | 5;

export const AUTO_WIZARD_STEPS: { step: AutoWizardStep; label: string }[] = [
  { step: 1, label: 'Datos Generales' },
  { step: 2, label: 'Carga de FDS' },
  { step: 3, label: 'Validación Datos' },
  { step: 4, label: 'Datos Complementarios' },
  { step: 5, label: 'Resultados & Informe' },
];

// ─── Gap Detection (Módulo B) ────────────────────────────

export interface GapQuestion {
  id: string;
  agentId: string;
  agentName: string;
  field: string;
  section: 'A' | 'B' | 'C' | 'D' | 'E';
  sectionLabel: string;
  question: string;
  type: 'number' | 'select' | 'boolean' | 'number_unit';
  options?: { value: string; label: string; description?: string }[];
  unit?: string;
  validation?: { min?: number; max?: number; message?: string };
  helpText?: string;
}

export interface GroupedQuestions {
  sections: {
    id: string;
    label: string;
    questions: GapQuestion[];
  }[];
  totalQuestions: number;
  estimatedMinutes: number;
}
