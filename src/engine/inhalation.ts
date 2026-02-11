/**
 * Algorithm 2: Inhalation Risk Evaluation
 */
import type {
  ChemicalAgent,
  InhalationResult,
} from '../types';
import {
  PhysicalState,
  ParticulateMatter,
  SolidForm,
  RiskLevel,
} from '../types';
import { determineDangerClass } from './dangerClass';
import {
  DANGER_CLASS_SCORE,
  VOLATILITY_SCORE,
  PROCEDURE_SCORE,
  VENTILATION_SCORE,
  vlaCorrectionFactor,
  volatilityFromTemperatures,
  volatilityFromVaporPressure,
  characterizeInhalationRisk,
} from '../data/tables';

/**
 * Determine volatility/pulverulence class for an agent.
 */
function determineVolatilityClass(agent: ChemicalAgent): number {
  const state = agent.physicalState;

  // Gas or Aerosol → always class 3
  if (state === PhysicalState.Gas || state === PhysicalState.Aerosol) {
    return 3;
  }

  // Solid
  if (state === PhysicalState.Solid) {
    if (agent.solidForm === SolidForm.FinePowder) return 3;
    if (agent.solidForm === SolidForm.GrainPowder) return 2;
    return 1; // Pellets
  }

  // Liquid
  if (state === PhysicalState.Liquid) {
    // Spray operation → class 3
    if (agent.isSpray) return 3;

    // FIV notation: use vapor pressure
    if (agent.hasFIV && agent.vaporPressure !== null) {
      const cvVapor = volatilityFromVaporPressure(agent.vaporPressure);
      return cvVapor;
    }

    // Normal liquid: use boiling point vs working temperature
    if (agent.boilingPoint !== null && agent.workingTemperature !== null) {
      return volatilityFromTemperatures(agent.boilingPoint, agent.workingTemperature);
    }

    // Default if no temperature data
    return 2;
  }

  return 2; // fallback
}

/**
 * Calculate inhalation risk for a single agent.
 */
export function evaluateInhalationRisk(agent: ChemicalAgent): InhalationResult {
  // 1. Danger score
  const cp = determineDangerClass(agent);
  const pp = DANGER_CLASS_SCORE[cp] || 1;

  // 2. Volatility/Pulverulence
  const cv = determineVolatilityClass(agent);
  const pv = VOLATILITY_SCORE[cv] || 1;

  // 3. Procedure score
  const ppr = PROCEDURE_SCORE[agent.procedureClass] || 1;

  // 4. Collective protection score
  const ppc = VENTILATION_SCORE[agent.ventilationClass] || 1;

  // 5. VLA correction factor
  let vlaAdjusted: number | null = null;
  if (agent.hasVLA && agent.vlaED !== null) {
    vlaAdjusted = agent.vlaED;
    if (agent.isParticulateMatter !== ParticulateMatter.No) {
      vlaAdjusted = vlaAdjusted / 10;
    }
  }
  const fc = vlaCorrectionFactor(vlaAdjusted, agent.hasVLA);

  // 6. Calculate PRI
  const pri = pp * pv * ppr * ppc * fc;

  // 7. Characterize risk
  const char = characterizeInhalationRisk(pri);

  return {
    agentId: agent.id,
    agentName: agent.commercialName || agent.substanceName,
    dangerClass: cp,
    dangerScore: pp,
    volatilityClass: cv,
    volatilityScore: pv,
    procedureClass: agent.procedureClass,
    procedureScore: ppr,
    protectionClass: agent.ventilationClass,
    protectionScore: ppc,
    vlaCorrectionFactor: fc,
    riskScore: pri,
    riskLevel: char.level === 'very_high' ? RiskLevel.VeryHigh
             : char.level === 'moderate' ? RiskLevel.Moderate
             : RiskLevel.Low,
    priorityAction: char.priority,
    characterization: char.label,
    recommendation: char.recommendation,
  };
}

/**
 * Evaluate inhalation risk for multiple agents.
 */
export function evaluateAllInhalation(agents: ChemicalAgent[]): InhalationResult[] {
  return agents.map(evaluateInhalationRisk);
}
