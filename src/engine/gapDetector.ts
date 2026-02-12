/**
 * Gap Detector — Identifies missing operational data after FDS extraction.
 * Groups required questions by section for the intelligent questionnaire.
 */
import type {
  ExtractedAgentData,
  GapQuestion,
  GroupedQuestions,
} from '../types';

const SECTION_LABELS: Record<string, string> = {
  A: 'Cantidades y Frecuencia',
  B: 'Condiciones de Uso',
  C: 'Procedimiento de Trabajo',
  D: 'Ventilación y Protección Colectiva',
  E: 'Exposición Dérmica',
};

export function detectMissingData(agents: ExtractedAgentData[]): GroupedQuestions {
  const allQuestions: GapQuestion[] = [];

  for (const agent of agents) {
    const name = (agent.commercialName.value as string) || agent.fileName.replace(/\.pdf$/i, '');
    const agentId = agent.fdsFileId;

    // Section A: Quantities & Frequency (always needed — not in FDS)
    allQuestions.push({
      id: `${agentId}_quantity`,
      agentId,
      agentName: name,
      field: 'quantity',
      section: 'A',
      sectionLabel: SECTION_LABELS.A,
      question: `¿Qué cantidad de "${name}" se utiliza por sesión de trabajo?`,
      type: 'number_unit',
      unit: 'kg',
      validation: { min: 0.001, max: 100000, message: 'Ingrese una cantidad válida' },
      helpText: 'Indique la cantidad aproximada utilizada en cada sesión de trabajo.',
    });

    allQuestions.push({
      id: `${agentId}_timeRef`,
      agentId,
      agentName: name,
      field: 'timeReference',
      section: 'A',
      sectionLabel: SECTION_LABELS.A,
      question: `¿Con qué referencia temporal se mide el uso de "${name}"?`,
      type: 'select',
      options: [
        { value: 'day', label: 'Por día' },
        { value: 'week', label: 'Por semana' },
        { value: 'month', label: 'Por mes' },
        { value: 'year', label: 'Por año' },
      ],
    });

    allQuestions.push({
      id: `${agentId}_frequency`,
      agentId,
      agentName: name,
      field: 'frequencyLevel',
      section: 'A',
      sectionLabel: SECTION_LABELS.A,
      question: `¿Con qué frecuencia se utiliza "${name}"?`,
      type: 'select',
      options: [
        { value: '1', label: 'Ocasional', description: 'Menor de 30 min/día' },
        { value: '2', label: 'Intermitente', description: '30-120 min/día' },
        { value: '3', label: 'Frecuente', description: '2-6 horas/día' },
        { value: '4', label: 'Permanente', description: 'Más de 6 horas/día' },
      ],
    });

    // Section B: Working conditions (only if liquid and missing temp)
    const physState = agent.physicalState.value as string | null;
    if (physState === 'liquid') {
      allQuestions.push({
        id: `${agentId}_workTemp`,
        agentId,
        agentName: name,
        field: 'workingTemperature',
        section: 'B',
        sectionLabel: SECTION_LABELS.B,
        question: `¿A qué temperatura se utiliza "${name}"?`,
        type: 'number',
        unit: '°C',
        validation: { min: -20, max: 500 },
        helpText: 'Temperatura del proceso o ambiente de trabajo donde se manipula.',
      });

      allQuestions.push({
        id: `${agentId}_spray`,
        agentId,
        agentName: name,
        field: 'isSpray',
        section: 'B',
        sectionLabel: SECTION_LABELS.B,
        question: `¿Se aplica "${name}" en forma de spray/pulverización?`,
        type: 'boolean',
      });
    }

    // Section C: Work procedure (always needed)
    allQuestions.push({
      id: `${agentId}_procedure`,
      agentId,
      agentName: name,
      field: 'procedureClass',
      section: 'C',
      sectionLabel: SECTION_LABELS.C,
      question: `¿Cómo se manipula "${name}"?`,
      type: 'select',
      options: [
        { value: '1', label: 'Sistema cerrado permanente', description: 'Reactor cerrado, circuito estanco' },
        { value: '2', label: 'Sistema cerrado con apertura regular', description: 'Reactor abierto puntualmente, trasvases' },
        { value: '3', label: 'Proceso abierto', description: 'Baño abierto, pintura a brocha' },
        { value: '4', label: 'Uso dispersivo', description: 'Pulverización, aplicación manual extensiva' },
      ],
    });

    // Section E: Dermal (only if dermal toxicity detected)
    if (agent.hasDermalToxicity.value === true) {
      allQuestions.push({
        id: `${agentId}_skinContact`,
        agentId,
        agentName: name,
        field: 'hasSkinContact',
        section: 'E',
        sectionLabel: SECTION_LABELS.E,
        question: `¿Existe contacto cutáneo con "${name}"?`,
        type: 'boolean',
      });

      allQuestions.push({
        id: `${agentId}_dermalSurface`,
        agentId,
        agentName: name,
        field: 'dermalSurface',
        section: 'E',
        sectionLabel: SECTION_LABELS.E,
        question: `¿Qué superficie corporal está expuesta a "${name}"?`,
        type: 'select',
        options: [
          { value: '1', label: 'Una mano' },
          { value: '2', label: 'Dos manos o un antebrazo' },
          { value: '3', label: 'Dos manos + antebrazos' },
          { value: '10', label: 'Superficie extensa (miembros superiores, torso)' },
        ],
      });

      allQuestions.push({
        id: `${agentId}_dermalFreq`,
        agentId,
        agentName: name,
        field: 'dermalFrequency',
        section: 'E',
        sectionLabel: SECTION_LABELS.E,
        question: `¿Con qué frecuencia se produce el contacto cutáneo con "${name}"?`,
        type: 'select',
        options: [
          { value: '1', label: 'Ocasional', description: '< 30 min/día' },
          { value: '2', label: 'Intermitente', description: '30-120 min/día' },
          { value: '5', label: 'Frecuente', description: '2-6 horas/día' },
          { value: '10', label: 'Permanente', description: '> 6 horas/día' },
        ],
      });
    }
  }

  // Optimization: ask ventilation once for all agents
  allQuestions.push({
    id: 'global_ventilation',
    agentId: '__global__',
    agentName: 'Todos los productos',
    field: 'ventilationClass',
    section: 'D',
    sectionLabel: SECTION_LABELS.D,
    question: '¿Qué tipo de ventilación/protección colectiva existe en la zona de trabajo?',
    type: 'select',
    options: [
      { value: '1', label: 'Envolvente (cabina cerrada con aspiración)' },
      { value: '2', label: 'Captación parcial (campana, brazo articulado)' },
      { value: '3', label: 'General mecánica o trabajo al aire libre' },
      { value: '4', label: 'Sin ventilación específica' },
      { value: '5', label: 'Espacio confinado' },
    ],
  });

  allQuestions.push({
    id: 'global_ventMaintained',
    agentId: '__global__',
    agentName: 'Todos los productos',
    field: 'ventilationMaintained',
    section: 'D',
    sectionLabel: SECTION_LABELS.D,
    question: '¿La instalación de ventilación se mantiene correctamente y se verifica periódicamente?',
    type: 'select',
    options: [
      { value: 'yes', label: 'Sí, se mantiene y verifica' },
      { value: 'unsure', label: 'No estoy seguro/a' },
      { value: 'no', label: 'No se verifica regularmente' },
    ],
  });

  // Group by section
  const sectionOrder: ('A' | 'B' | 'C' | 'D' | 'E')[] = ['A', 'B', 'C', 'D', 'E'];
  const sections = sectionOrder
    .map(id => ({
      id,
      label: SECTION_LABELS[id],
      questions: allQuestions.filter(q => q.section === id),
    }))
    .filter(s => s.questions.length > 0);

  const totalQuestions = sections.reduce((sum, s) => sum + s.questions.length, 0);
  const estimatedMinutes = Math.max(5, Math.round(totalQuestions * 0.5));

  return { sections, totalQuestions, estimatedMinutes };
}
