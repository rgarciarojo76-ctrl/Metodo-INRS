/**
 * Algorithm 1: Hierarchization of Potential Risks
 */
import type { ChemicalAgent, HierarchyResult } from '../types';
import { Priority } from '../types';
import { determineDangerClass } from './dangerClass';
import {
  quantityClassFromIndex,
  potentialExposureClass,
  potentialRiskClass,
  RISK_CLASS_SCORE,
} from '../data/tables';

/**
 * Normalize all agent quantities to the same unit (kg equivalent per day).
 * This is a simplification; in practice, volumes would need density conversion.
 */
function normalizeQuantity(agent: ChemicalAgent): number {
  let q = agent.quantity;
  // Convert units to kg
  const unit = agent.quantityUnit.toLowerCase();
  if (unit === 'g' || unit === 'ml') q = q / 1000;
  if (unit === 'ton' || unit === 't') q = q * 1000;
  // Already kg or l (assume density ≈ 1 for simplification)
  return q;
}

/**
 * Run hierarchization algorithm on all agents.
 * Returns sorted results with IPA percentages.
 */
export function computeHierarchy(agents: ChemicalAgent[]): HierarchyResult[] {
  if (agents.length === 0) return [];

  // Step 1: Normalize quantities and find Qmax
  const quantities = agents.map(normalizeQuantity);
  const qMax = Math.max(...quantities);

  // Step 2-7: Calculate per agent
  const results: HierarchyResult[] = agents.map((agent, i) => {
    // Danger class
    const cp = determineDangerClass(agent);

    // Quantity index and class
    const qIndex = qMax > 0 ? (quantities[i] / qMax) * 100 : 100;
    const cc = quantityClassFromIndex(qIndex);

    // Frequency class (directly from FrequencyLevel)
    const cf = agent.frequencyLevel;

    // Potential exposure class (matrix)
    const cep = potentialExposureClass(cc, cf);

    // Potential risk class (matrix)
    const crp = cep === 0 ? 1 : potentialRiskClass(cp, cep);

    // Risk score
    const prp = RISK_CLASS_SCORE[crp] || 1;

    return {
      agentId: agent.id,
      agentName: agent.commercialName || agent.substanceName,
      dangerClass: cp,
      quantityClass: cc,
      frequencyClass: cf,
      potentialExposureClass: cep,
      potentialRiskClass: crp,
      riskScore: prp,
      ipaPercent: 0, // calculated below
      priority: Priority.Low,
      selected: false,
    };
  });

  // Step 8: Calculate IPA
  const totalScore = results.reduce((sum, r) => sum + r.riskScore, 0);
  for (const r of results) {
    r.ipaPercent = totalScore > 0 ? (r.riskScore / totalScore) * 100 : 0;
  }

  // Step 9: Determine priority
  for (const r of results) {
    if (r.riskScore > 10000 || (r.dangerClass >= 4 && r.riskScore >= 10000)) {
      r.priority = Priority.High;
    } else if (r.riskScore > 100) {
      r.priority = Priority.Medium;
    } else {
      r.priority = Priority.Low;
    }
  }

  // Step 10: Sort
  const priorityOrder = { [Priority.High]: 0, [Priority.Medium]: 1, [Priority.Low]: 2 };
  results.sort((a, b) => {
    const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (pDiff !== 0) return pDiff;
    const cpDiff = b.dangerClass - a.dangerClass;
    if (cpDiff !== 0) return cpDiff;
    return b.riskScore - a.riskScore;
  });

  return results;
}
