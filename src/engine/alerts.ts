/**
 * Alert system — Generates warnings based on agent data
 */
import type {
  ChemicalAgent,
  Alert,
} from '../types';
import {
  VentilationClass,
  ParticulateMatter,
} from '../types';
import {
  CARCINOGENIC_R,
  CARCINOGENIC_H,
} from '../data/tables';

/**
 * Generate all applicable alerts for a chemical agent.
 */
export function generateAlerts(agent: ChemicalAgent): Alert[] {
  const alerts: Alert[] = [];
  const name = agent.commercialName || agent.substanceName;

  // ALERT 1: Amianto detected
  if (agent.isSpecialMaterial && agent.specialMaterialId === 'amianto') {
    alerts.push({
      id: `${agent.id}-amianto`,
      agentId: agent.id,
      agentName: name,
      type: 'amianto',
      title: '⚠️ AMIANTO DETECTADO',
      message: 'Este agente requiere evaluación cuantitativa obligatoria (RD 396/2006). Este método simplificado NO es aplicable.',
      severity: 'critical',
    });
  }

  // ALERT 2: Carcinogenic / Mutagenic Cat. 1A/1B
  const rPhrases = agent.rPhrases.map(p => p.trim().toUpperCase());
  const hPhrases = agent.hPhrases.map(p => p.trim());
  const hasCarcinogenicR = rPhrases.some(p => CARCINOGENIC_R.includes(p));
  const hasCarcinogenicH = hPhrases.some(p => CARCINOGENIC_H.includes(p));

  if (hasCarcinogenicR || hasCarcinogenicH) {
    alerts.push({
      id: `${agent.id}-carcinogenic`,
      agentId: agent.id,
      agentName: name,
      type: 'carcinogenic',
      title: '⚠️ CANCERÍGENO / MUTÁGENO',
      message: 'Consultar Guía Técnica RD 665/97. Se recomienda evaluación cuantitativa detallada.',
      severity: 'critical',
    });
  }

  // ALERT 4: FIV notation
  if (agent.hasFIV) {
    alerts.push({
      id: `${agent.id}-fiv`,
      agentId: agent.id,
      agentName: name,
      type: 'fiv',
      title: '⚠️ NOTACIÓN FIV',
      message: 'Exposición simultánea vapor + partículas. Se calculan ambas volatilidades según Tabla 8.',
      severity: 'warning',
    });
  }

  // ALERT 5: VLA very low
  if (agent.hasVLA && agent.vlaED !== null) {
    let vlaAdj = agent.vlaED;
    if (agent.isParticulateMatter !== ParticulateMatter.No) {
      vlaAdj = vlaAdj / 10;
    }
    if (vlaAdj <= 0.1) {
      let fc = 1;
      if (vlaAdj <= 0.001) fc = 100;
      else if (vlaAdj <= 0.01) fc = 30;
      else fc = 10;
      alerts.push({
        id: `${agent.id}-low-vla`,
        agentId: agent.id,
        agentName: name,
        type: 'low_vla',
        title: '⚠️ VLA MUY BAJO',
        message: `VLA ajustado = ${vlaAdj.toFixed(4)} mg/m³. Se ha aplicado Factor de Corrección FC = ${fc} automáticamente.`,
        severity: 'warning',
      });
    }
  }

  // ALERT 6: Working temp > Boiling point
  if (
    agent.boilingPoint !== null &&
    agent.workingTemperature !== null &&
    agent.workingTemperature > agent.boilingPoint
  ) {
    alerts.push({
      id: `${agent.id}-temp`,
      agentId: agent.id,
      agentName: name,
      type: 'temp_exceeds_bp',
      title: '⚠️ TEMPERATURA USO > PUNTO EBULLICIÓN',
      message: 'Revisar datos: la temperatura de uso no puede superar el punto de ebullición en procesos normales.',
      severity: 'warning',
    });
  }

  // ALERT 7: Confined space (Ventilation class 5)
  if (agent.ventilationClass === VentilationClass.ConfinedSpace) {
    alerts.push({
      id: `${agent.id}-confined`,
      agentId: agent.id,
      agentName: name,
      type: 'confined_space',
      title: '⚠️ ESPACIO CONFINADO',
      message: 'Situación de confinamiento peligrosa. Revisar medidas urgentemente. Factor PPC = 10 aplicado.',
      severity: 'critical',
    });
  }

  return alerts;
}

/**
 * Generate alerts for all agents.
 */
export function generateAllAlerts(agents: ChemicalAgent[]): Alert[] {
  return agents.flatMap(generateAlerts);
}
