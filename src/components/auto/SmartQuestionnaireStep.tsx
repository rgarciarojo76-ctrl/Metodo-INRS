import { useState, useCallback, useMemo } from 'react';
import { ChevronRight, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import type { Evaluation, GapQuestion, ExtractedAgentData, ChemicalAgent } from '../../types';
import { detectMissingData } from '../../engine/gapDetector';

// ─── Component ───────────────────────────────────────────

interface Props {
  evaluation: Evaluation;
  onUpdate: (ev: Evaluation) => void;
}

export function SmartQuestionnaireStep({ evaluation, onUpdate }: Props) {
  const data = useMemo(() => evaluation.extractedData ?? [], [evaluation.extractedData]);
  const grouped = useMemo(() => detectMissingData(data), [data]);
  const [answers, setAnswers] = useState<Record<string, string | number | boolean>>({});
  const [currentSection, setCurrentSection] = useState(0);

  const section = grouped.sections[currentSection];
  const isLastSection = currentSection === grouped.sections.length - 1;

  const answeredInSection = section?.questions.filter(q => answers[q.id] !== undefined).length ?? 0;
  const totalInSection = section?.questions.length ?? 0;
  const totalAnswered = Object.keys(answers).length;

  const setAnswer = useCallback((qId: string, value: string | number | boolean) => {
    setAnswers(prev => ({ ...prev, [qId]: value }));
  }, []);

  const buildAgents = useCallback((): ChemicalAgent[] => {
    // Convert extracted data + questionnaire answers into ChemicalAgent[]
    const globalVentilation = answers['global_ventilation'] ? Number(answers['global_ventilation']) : 3;
    const globalVentMaintained = (answers['global_ventMaintained'] as string) || 'unsure';

    return data.map((ext: ExtractedAgentData) => {
      const id = ext.fdsFileId;
      const a = (qField: string) => answers[`${id}_${qField}`];

      const hPhrases = Array.isArray(ext.hPhrases.value) ? (ext.hPhrases.value as string[]) : [];
      const rPhrases = Array.isArray(ext.rPhrases.value) ? (ext.rPhrases.value as string[]) : [];

      return {
        id: id,
        commercialName: (ext.commercialName.value as string) || '',
        substanceName: (ext.substanceName.value as string) || '',
        casNumber: (ext.casNumber.value as string) || '',
        physicalState: (ext.physicalState.value as ChemicalAgent['physicalState']) || 'liquid',
        labelingSystem: hPhrases.length > 0 ? 'new_clp' : rPhrases.length > 0 ? 'old_r' : 'none',
        rPhrases,
        hPhrases,
        hasVLA: ext.vlaED.value !== null,
        vlaType: ext.vlaED.value !== null && ext.vlaEC.value !== null ? 'both'
          : ext.vlaED.value !== null ? 'vla_ed' : null,
        vlaED: (ext.vlaED.value as number) ?? null,
        isParticulateMatter: 'no' as const,
        isSpecialMaterial: false,
        specialMaterialId: null,
        quantity: Number(a('quantity')) || 1,
        quantityUnit: 'kg',
        timeReference: (a('timeRef') as ChemicalAgent['timeReference']) || 'day',
        frequencyLevel: (Number(a('frequency')) || 2) as ChemicalAgent['frequencyLevel'],
        boilingPoint: (ext.boilingPoint.value as number) ?? null,
        workingTemperature: a('workTemp') !== undefined ? Number(a('workTemp')) : 20,
        isSpray: a('spray') === true || a('spray') === 'true',
        hasFIV: ext.hasFIV.value === true,
        vaporPressure: (ext.vaporPressure.value as number) ?? null,
        solidForm: (ext.solidForm.value as ChemicalAgent['solidForm']) ?? null,
        procedureClass: (Number(a('procedure')) || 3) as ChemicalAgent['procedureClass'],
        ventilationClass: globalVentilation as ChemicalAgent['ventilationClass'],
        ventilationMaintained: globalVentMaintained as ChemicalAgent['ventilationMaintained'],
        hasDermalToxicity: ext.hasDermalToxicity.value === true,
        hasSkinContact: a('skinContact') === true || a('skinContact') === 'true',
        dermalSurface: a('dermalSurface') ? (Number(a('dermalSurface')) as ChemicalAgent['dermalSurface']) : null,
        dermalFrequency: a('dermalFreq') ? (Number(a('dermalFreq')) as ChemicalAgent['dermalFrequency']) : null,
      } satisfies ChemicalAgent;
    });
  }, [data, answers]);

  const finishQuestionnaire = useCallback(() => {
    const agents = buildAgents();
    onUpdate({
      ...evaluation,
      agents,
      autoStep: 5 as const,
      updatedAt: new Date().toISOString(),
    });
  }, [buildAgents, evaluation, onUpdate]);

  if (!section) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-surface-900">
          💬 Cuestionario de Datos Complementarios
        </h2>
        <p className="text-sm text-surface-600 mt-1">
          Complete los datos operacionales que no se encuentran en las FDS.
        </p>
      </div>

      {/* Progress bar + time estimate */}
      <div className="card p-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <div className="flex items-center gap-2 text-surface-600">
            <Clock className="h-4 w-4" />
            <span>Tiempo estimado: <b>{grouped.estimatedMinutes} min</b> ({grouped.totalQuestions} preguntas)</span>
          </div>
          <span className="font-semibold text-primary-700">
            {totalAnswered}/{grouped.totalQuestions} respondidas
          </span>
        </div>
        <div className="h-2 bg-surface-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-500 rounded-full transition-all duration-300"
            style={{ width: `${(totalAnswered / grouped.totalQuestions) * 100}%` }}
          />
        </div>
        {/* Section tabs */}
        <div className="flex gap-2 mt-3">
          {grouped.sections.map((s, idx) => {
            const answered = s.questions.filter(q => answers[q.id] !== undefined).length;
            const complete = answered === s.questions.length;
            return (
              <button
                key={s.id}
                onClick={() => setCurrentSection(idx)}
                className={`
                  px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                  ${idx === currentSection
                    ? 'bg-primary-600 text-white'
                    : complete
                      ? 'bg-green-100 text-green-700'
                      : 'bg-surface-100 text-surface-600 hover:bg-surface-200'}
                `}
              >
                {complete && <CheckCircle className="h-3 w-3 inline mr-1" />}
                {s.id}: {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-4">
        <h3 className="font-bold text-surface-800">
          Sección {section.id}: {section.label}
          <span className="text-xs text-surface-400 font-normal ml-2">
            ({answeredInSection}/{totalInSection})
          </span>
        </h3>

        {section.questions.map(q => (
          <QuestionCard key={q.id} question={q} value={answers[q.id]} onChange={v => setAnswer(q.id, v)} />
        ))}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={() => setCurrentSection(Math.max(0, currentSection - 1))}
          disabled={currentSection === 0}
          className="px-4 py-2 text-sm font-medium text-surface-600 hover:bg-surface-100 rounded-lg disabled:opacity-30"
        >
          ← Sección anterior
        </button>

        {isLastSection ? (
          <button
            onClick={finishQuestionnaire}
            disabled={totalAnswered < grouped.totalQuestions * 0.6}
            className={`
              inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all
              ${totalAnswered >= grouped.totalQuestions * 0.6
                ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-sm'
                : 'bg-surface-200 text-surface-400 cursor-not-allowed'}
            `}
          >
            Calcular resultados <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={() => setCurrentSection(currentSection + 1)}
            className="inline-flex items-center gap-1 px-4 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg"
          >
            Siguiente sección <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Question Card ───────────────────────────────────────

function QuestionCard({
  question,
  value,
  onChange,
}: {
  question: GapQuestion;
  value: string | number | boolean | undefined;
  onChange: (v: string | number | boolean) => void;
}) {
  const answered = value !== undefined;

  return (
    <div className={`card p-4 transition-all ${answered ? 'border-green-200 bg-green-50/30' : ''}`}>
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 ${answered ? 'text-green-600' : 'text-surface-400'}`}>
          {answered ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
        </div>
        <div className="flex-1">
          <label className="block font-medium text-sm text-surface-800 mb-1">
            {question.question}
          </label>
          {question.helpText && (
            <p className="text-xs text-surface-500 mb-2">{question.helpText}</p>
          )}

          {question.agentId !== '__global__' && (
            <span className="inline-block px-2 py-0.5 rounded bg-surface-100 text-xs text-surface-500 mb-2">
              🔬 {question.agentName}
            </span>
          )}

          {/* Input based on type */}
          {question.type === 'select' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
              {question.options?.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => onChange(opt.value)}
                  className={`
                    text-left px-3 py-2 rounded-lg border text-sm transition-all
                    ${String(value) === opt.value
                      ? 'border-primary-500 bg-primary-50 text-primary-800'
                      : 'border-surface-200 hover:border-primary-300 text-surface-700'}
                  `}
                >
                  <div className="font-medium">{opt.label}</div>
                  {opt.description && <div className="text-xs text-surface-500 mt-0.5">{opt.description}</div>}
                </button>
              ))}
            </div>
          )}

          {question.type === 'boolean' && (
            <div className="flex gap-3 mt-2">
              {[
                { val: true, label: 'Sí' },
                { val: false, label: 'No' },
              ].map(opt => (
                <button
                  key={String(opt.val)}
                  onClick={() => onChange(opt.val)}
                  className={`
                    px-4 py-2 rounded-lg border text-sm font-medium transition-all
                    ${value === opt.val
                      ? 'border-primary-500 bg-primary-50 text-primary-800'
                      : 'border-surface-200 hover:border-primary-300 text-surface-700'}
                  `}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {(question.type === 'number' || question.type === 'number_unit') && (
            <div className="flex items-center gap-2 mt-2">
              <input
                type="number"
                value={value !== undefined ? String(value) : ''}
                onChange={e => {
                  const v = parseFloat(e.target.value);
                  if (!isNaN(v)) onChange(v);
                }}
                min={question.validation?.min}
                max={question.validation?.max}
                className="w-32 px-3 py-2 border border-surface-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
                placeholder="0"
              />
              {question.unit && (
                <span className="text-sm text-surface-500">{question.unit}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
