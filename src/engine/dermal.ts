/**
 * Algorithm 3: Dermal Risk Evaluation
 */
import type {
  ChemicalAgent,
  DermalResult,
} from '../types';
import { RiskLevel } from '../types';
import { determineDangerClass } from './dangerClass';
import {
  DANGER_CLASS_SCORE,
  characterizeDermalRisk,
} from '../data/tables';

/**
 * Calculate dermal risk (PRD) for a chemical agent.
 * Returns null if the agent doesn't have dermal toxicity or skin contact.
 */
export function evaluateDermalRisk(agent: ChemicalAgent): DermalResult | null {
  if (!agent.hasDermalToxicity || !agent.hasSkinContact) {
    return null;
  }

  // PP (Danger score)
  const cp = determineDangerClass(agent);
  const pp = DANGER_CLASS_SCORE[cp] || 1;

  // PS (Surface score) — directly maps to DermalSurface value
  const ps = agent.dermalSurface ?? 1;

  // PFD (Frequency score) — directly maps to DermalFrequency value
  const pfd = agent.dermalFrequency ?? 1;

  // PRD = PP × PS × PFD
  const prd = pp * ps * pfd;

  // Characterize
  const char = characterizeDermalRisk(prd);

  return {
    agentId: agent.id,
    agentName: agent.commercialName || agent.substanceName,
    dangerScore: pp,
    surfaceScore: ps,
    frequencyScore: pfd,
    riskScore: prd,
    riskLevel: char.level === 'very_high' ? RiskLevel.VeryHigh
             : char.level === 'moderate' ? RiskLevel.Moderate
             : RiskLevel.Low,
    priorityAction: char.priority,
    characterization: char.label,
  };
}
