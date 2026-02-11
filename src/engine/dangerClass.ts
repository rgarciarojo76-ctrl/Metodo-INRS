/**
 * Danger Class determination from agent data.
 */
import type { ChemicalAgent } from '../types';
import {
  R_PHRASE_DANGER_CLASS,
  H_PHRASE_DANGER_CLASS,
  SPECIAL_MATERIALS,
  dangerClassFromVLA,
} from '../data/tables';

/**
 * Determine the danger class (CP: 1-5) for a chemical agent.
 * Takes the maximum from: R-phrases, H-phrases, VLA, and special materials.
 */
export function determineDangerClass(agent: ChemicalAgent): number {
  const classes: number[] = [];

  // From R-phrases
  for (const phrase of agent.rPhrases) {
    const p = phrase.trim().toUpperCase();
    if (R_PHRASE_DANGER_CLASS[p] !== undefined) {
      classes.push(R_PHRASE_DANGER_CLASS[p]);
    }
  }

  // From H-phrases
  for (const phrase of agent.hPhrases) {
    const p = phrase.trim();
    if (H_PHRASE_DANGER_CLASS[p] !== undefined) {
      classes.push(H_PHRASE_DANGER_CLASS[p]);
    }
  }

  // From VLA
  if (agent.hasVLA && agent.vlaED !== null) {
    const vlaClass = dangerClassFromVLA(agent.vlaED);
    if (vlaClass > 0) classes.push(vlaClass);
  }

  // From special materials
  if (agent.isSpecialMaterial && agent.specialMaterialId) {
    const special = SPECIAL_MATERIALS.find(s => s.id === agent.specialMaterialId);
    if (special) {
      classes.push(special.dangerClass);
    }
  }

  if (classes.length === 0) return 1; // default minimum
  return Math.max(...classes);
}
