/**
 * Step validation — checks required fields before allowing navigation.
 */
import type { Evaluation } from './types';
import { PhysicalState, LabelingSystem } from './types';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/** Step 1: Datos Generales — empresa, fecha, evaluador obligatorios */
export function validateStep1(ev: Evaluation): ValidationResult {
  const errors: string[] = [];
  const p = ev.project;

  if (!p.companyName.trim()) errors.push('El nombre de la empresa es obligatorio.');
  if (!p.evaluationDate.trim()) errors.push('La fecha de evaluación es obligatoria.');
  if (!p.evaluatorName.trim()) errors.push('El nombre del evaluador es obligatorio.');

  return { valid: errors.length === 0, errors };
}

/** Step 2: Inventario — al menos 1 agente con datos mínimos */
export function validateStep2(ev: Evaluation): ValidationResult {
  const errors: string[] = [];

  if (ev.agents.length === 0) {
    errors.push('Añade al menos un agente químico.');
    return { valid: false, errors };
  }

  ev.agents.forEach((a, i) => {
    const label = a.commercialName || `Agente ${i + 1}`;

    if (!a.commercialName.trim()) {
      errors.push(`${label}: nombre comercial obligatorio.`);
    }

    // At least one hazard identifier (unless no labeling)
    if (a.labelingSystem !== LabelingSystem.None) {
      const hasR = a.rPhrases.length > 0;
      const hasH = a.hPhrases.length > 0;
      if (!hasR && !hasH && !a.isSpecialMaterial) {
        errors.push(`${label}: indica al menos una frase R/H o un material especial.`);
      }
    }

    if (a.quantity <= 0) {
      errors.push(`${label}: la cantidad debe ser mayor que 0.`);
    }

    // Conditional: liquid needs boiling point
    if (a.physicalState === PhysicalState.Liquid && a.boilingPoint === null) {
      errors.push(`${label}: el punto de ebullición es obligatorio para líquidos.`);
    }

    // Conditional: solid needs form
    if (a.physicalState === PhysicalState.Solid && a.solidForm === null) {
      errors.push(`${label}: selecciona la forma del sólido.`);
    }
  });

  return { valid: errors.length === 0, errors };
}

/** Step 3: Jerarquización — al menos 1 agente seleccionado */
export function validateStep3(ev: Evaluation): ValidationResult {
  const errors: string[] = [];
  const anySelected = ev.hierarchyResults.some(r => r.selected);

  if (!anySelected && ev.agents.length > 0) {
    errors.push('Selecciona al menos un agente para la evaluación detallada.');
  }

  return { valid: errors.length === 0, errors };
}

/** Generic validator dispatcher */
export function validateStep(step: number, ev: Evaluation): ValidationResult {
  switch (step) {
    case 1: return validateStep1(ev);
    case 2: return validateStep2(ev);
    case 3: return validateStep3(ev);
    default: return { valid: true, errors: [] };
  }
}
