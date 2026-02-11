import { useState } from 'react';
import { Plus, ChevronDown, ChevronUp, Trash2, Beaker, AlertTriangle } from 'lucide-react';
import type { Evaluation, ChemicalAgent } from '../../types';
import {
  PhysicalState, LabelingSystem, ParticulateMatter,
  TimeReference, FrequencyLevel, SolidForm, ProcedureClass,
  VentilationClass, DermalSurface, DermalFrequency,
} from '../../types';
import { SPECIAL_MATERIALS, FREQUENCY_OPTIONS, DERMAL_R_PHRASES, DERMAL_H_PHRASES } from '../../data/tables';

interface Props {
  evaluation: Evaluation;
  onUpdate: (evaluation: Evaluation) => void;
}

function createEmptyAgent(index: number): ChemicalAgent {
  return {
    id: `agent-${Date.now()}-${index}`,
    commercialName: '',
    substanceName: '',
    casNumber: '',
    physicalState: PhysicalState.Liquid,
    labelingSystem: LabelingSystem.NewCLP,
    rPhrases: [],
    hPhrases: [],
    hasVLA: false,
    vlaType: null,
    vlaED: null,
    isParticulateMatter: ParticulateMatter.No,
    isSpecialMaterial: false,
    specialMaterialId: null,
    quantity: 0,
    quantityUnit: 'kg',
    timeReference: TimeReference.Day,
    frequencyLevel: FrequencyLevel.Frequent,
    boilingPoint: null,
    workingTemperature: null,
    isSpray: false,
    hasFIV: false,
    vaporPressure: null,
    solidForm: null,
    procedureClass: ProcedureClass.Open,
    ventilationClass: VentilationClass.GeneralOrOutdoor,
    ventilationMaintained: 'yes',
    hasDermalToxicity: false,
    hasSkinContact: false,
    dermalSurface: null,
    dermalFrequency: null,
  };
}

export function InventoryStep({ evaluation, onUpdate }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(
    evaluation.agents.length > 0 ? evaluation.agents[0].id : null
  );

  const agents = evaluation.agents;

  const updateAgents = (newAgents: ChemicalAgent[]) => {
    onUpdate({ ...evaluation, agents: newAgents });
  };

  const addAgent = () => {
    const newAgent = createEmptyAgent(agents.length);
    const updated = [...agents, newAgent];
    updateAgents(updated);
    setExpandedId(newAgent.id);
  };

  const removeAgent = (id: string) => {
    updateAgents(agents.filter(a => a.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  const updateAgent = (id: string, patch: Partial<ChemicalAgent>) => {
    updateAgents(agents.map(a => a.id === id ? { ...a, ...patch } : a));
  };

  // Auto-detect dermal toxicity from phrases
  const checkDermalToxicity = (agent: ChemicalAgent): boolean => {
    const rHit = agent.rPhrases.some(p => DERMAL_R_PHRASES.includes(p.trim().toUpperCase()));
    const hHit = agent.hPhrases.some(p => DERMAL_H_PHRASES.includes(p.trim()));
    return rHit || hHit;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-surface-800 mb-1">Inventario de Agentes Químicos</h2>
          <p className="text-surface-500">
            {agents.length} agente{agents.length !== 1 ? 's' : ''} registrado{agents.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={addAgent}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl font-medium text-sm hover:bg-primary-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Añadir agente
        </button>
      </div>

      {agents.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-surface-200">
          <Beaker className="w-12 h-12 mx-auto text-surface-300 mb-4" />
          <p className="text-surface-500 mb-4">No hay agentes químicos. Añade el primero.</p>
          <button
            onClick={addAgent}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
          >
            Añadir agente químico
          </button>
        </div>
      )}

      {agents.map((agent, idx) => {
        const isExpanded = expandedId === agent.id;
        return (
          <div key={agent.id} className="bg-white rounded-2xl border border-surface-200 shadow-sm overflow-hidden">
            {/* Header */}
            <button
              onClick={() => setExpandedId(isExpanded ? null : agent.id)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-surface-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold">
                  {idx + 1}
                </span>
                <div className="text-left">
                  <h3 className="font-semibold text-surface-800">
                    {agent.commercialName || `Agente ${idx + 1}`}
                  </h3>
                  <p className="text-xs text-surface-500">
                    {agent.substanceName || 'Sin sustancia definida'} · {agent.physicalState}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); removeAgent(agent.id); }}
                  className="p-1.5 rounded-lg hover:bg-danger-50 text-surface-400 hover:text-danger-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                {isExpanded ? <ChevronUp className="w-5 h-5 text-surface-400" /> : <ChevronDown className="w-5 h-5 text-surface-400" />}
              </div>
            </button>

            {/* Expanded form */}
            {isExpanded && (
              <div className="px-6 pb-6 border-t border-surface-100 space-y-6">
                {/* Section 1: Identification */}
                <div className="pt-4">
                  <h4 className="text-sm font-semibold text-primary-600 uppercase tracking-wider mb-4">
                    Sección 1: Identificación del Producto
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField label="P1.1 — Nombre comercial *" value={agent.commercialName}
                      onChange={v => updateAgent(agent.id, { commercialName: v })}
                      placeholder="Ej: Disolvente Universal" />
                    <InputField label="P1.2 — Sustancia principal" value={agent.substanceName}
                      onChange={v => updateAgent(agent.id, { substanceName: v })}
                      placeholder="Consultar FDS" help="Nombre químico principal según FDS" />
                    <InputField label="P1.3 — Número CAS" value={agent.casNumber}
                      onChange={v => updateAgent(agent.id, { casNumber: v })}
                      placeholder="XXX-XX-X" />
                    <div>
                      <label className="block text-sm font-medium text-surface-700 mb-1.5">P1.4 — Estado físico</label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { value: PhysicalState.Solid, label: 'Sólido' },
                          { value: PhysicalState.Liquid, label: 'Líquido' },
                          { value: PhysicalState.Gas, label: 'Gas' },
                          { value: PhysicalState.Aerosol, label: 'Aerosol/Spray' },
                        ].map(opt => (
                          <button key={opt.value} onClick={() => updateAgent(agent.id, { physicalState: opt.value })}
                            className={`px-3 py-2 text-sm rounded-lg border transition-all ${
                              agent.physicalState === opt.value
                                ? 'bg-primary-50 border-primary-300 text-primary-700 font-medium'
                                : 'border-surface-200 text-surface-600 hover:bg-surface-50'
                            }`}>
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Hazard Classification */}
                <div className="pt-2">
                  <h4 className="text-sm font-semibold text-primary-600 uppercase tracking-wider mb-4">
                    Sección 2: Clasificación de Peligro
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-surface-700 mb-1.5">P2.1 — Sistema de etiquetado</label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {[
                          { value: LabelingSystem.OldR, label: 'Frases R' },
                          { value: LabelingSystem.NewCLP, label: 'Frases H (CLP)' },
                          { value: LabelingSystem.Both, label: 'Ambos' },
                          { value: LabelingSystem.None, label: 'Sin etiquetado' },
                        ].map(opt => (
                          <button key={opt.value} onClick={() => updateAgent(agent.id, { labelingSystem: opt.value })}
                            className={`px-3 py-2 text-sm rounded-lg border transition-all ${
                              agent.labelingSystem === opt.value
                                ? 'bg-primary-50 border-primary-300 text-primary-700 font-medium'
                                : 'border-surface-200 text-surface-600 hover:bg-surface-50'
                            }`}>
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {(agent.labelingSystem === LabelingSystem.OldR || agent.labelingSystem === LabelingSystem.Both) && (
                      <InputField label="P2.2a — Frases R" value={agent.rPhrases.join(', ')}
                        onChange={v => {
                          const phrases = v.split(',').map(p => p.trim()).filter(Boolean);
                          const hasDermal = phrases.some(p => DERMAL_R_PHRASES.includes(p.toUpperCase()));
                          updateAgent(agent.id, { rPhrases: phrases, hasDermalToxicity: hasDermal || checkDermalToxicity({ ...agent, rPhrases: phrases }) });
                        }}
                        placeholder="R36/38, R11, R23/24/25" help="Separar con comas. Consultar FDS." />
                    )}

                    {(agent.labelingSystem === LabelingSystem.NewCLP || agent.labelingSystem === LabelingSystem.Both) && (
                      <InputField label="P2.2b — Frases H" value={agent.hPhrases.join(', ')}
                        onChange={v => {
                          const phrases = v.split(',').map(p => p.trim()).filter(Boolean);
                          const hasDermal = phrases.some(p => DERMAL_H_PHRASES.includes(p));
                          updateAgent(agent.id, { hPhrases: phrases, hasDermalToxicity: hasDermal || checkDermalToxicity({ ...agent, hPhrases: phrases }) });
                        }}
                        placeholder="H225, H319, H336" help="Separar con comas. Consultar FDS." />
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-surface-700 mb-1.5">P2.3 — ¿Tiene VLA?</label>
                        <div className="flex gap-2">
                          {[{ value: true, label: 'Sí' }, { value: false, label: 'No' }].map(opt => (
                            <button key={String(opt.value)} onClick={() => updateAgent(agent.id, { hasVLA: opt.value })}
                              className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-all ${
                                agent.hasVLA === opt.value
                                  ? 'bg-primary-50 border-primary-300 text-primary-700 font-medium'
                                  : 'border-surface-200 text-surface-600 hover:bg-surface-50'
                              }`}>
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {agent.hasVLA && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-surface-700 mb-1.5">P2.5 — VLA-ED (mg/m³)</label>
                            <input type="number" step="0.001" min="0"
                              value={agent.vlaED ?? ''}
                              onChange={e => updateAgent(agent.id, { vlaED: e.target.value ? Number(e.target.value) : null })}
                              className="w-full px-4 py-2.5 border border-surface-300 rounded-xl text-surface-800 focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all outline-none"
                              placeholder="mg/m³" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-surface-700 mb-1.5">P2.6 — ¿Materia particulada?</label>
                            <div className="grid grid-cols-3 gap-2">
                              {[
                                { value: ParticulateMatter.No, label: 'No' },
                                { value: ParticulateMatter.Inhalable, label: 'Fr. inhalable' },
                                { value: ParticulateMatter.Respirable, label: 'Fr. respirable' },
                              ].map(opt => (
                                <button key={opt.value} onClick={() => updateAgent(agent.id, { isParticulateMatter: opt.value })}
                                  className={`px-2 py-2 text-xs rounded-lg border transition-all ${
                                    agent.isParticulateMatter === opt.value
                                      ? 'bg-primary-50 border-primary-300 text-primary-700 font-medium'
                                      : 'border-surface-200 text-surface-600 hover:bg-surface-50'
                                  }`}>
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Special material */}
                    <div>
                      <label className="block text-sm font-medium text-surface-700 mb-1.5">P2.7 — ¿Material/proceso especial?</label>
                      <div className="flex gap-2 mb-2">
                        {[{ value: false, label: 'No' }, { value: true, label: 'Sí' }].map(opt => (
                          <button key={String(opt.value)} onClick={() => updateAgent(agent.id, { isSpecialMaterial: opt.value, specialMaterialId: opt.value ? agent.specialMaterialId : null })}
                            className={`px-3 py-2 text-sm rounded-lg border transition-all ${
                              agent.isSpecialMaterial === opt.value
                                ? 'bg-primary-50 border-primary-300 text-primary-700 font-medium'
                                : 'border-surface-200 text-surface-600 hover:bg-surface-50'
                            }`}>
                            {opt.label}
                          </button>
                        ))}
                      </div>
                      {agent.isSpecialMaterial && (
                        <select
                          value={agent.specialMaterialId || ''}
                          onChange={e => updateAgent(agent.id, { specialMaterialId: e.target.value || null })}
                          className="w-full px-4 py-2.5 border border-surface-300 rounded-xl text-surface-800 focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all outline-none"
                        >
                          <option value="">Seleccionar material...</option>
                          {SPECIAL_MATERIALS.map(m => (
                            <option key={m.id} value={m.id}>
                              {m.name} (Clase {m.dangerClass}){m.notes ? ` — ${m.notes}` : ''}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section 3: Quantity & Frequency */}
                <div className="pt-2">
                  <h4 className="text-sm font-semibold text-primary-600 uppercase tracking-wider mb-4">
                    Sección 3: Cantidad y Frecuencia
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-surface-700 mb-1.5">P3.1 — Cantidad</label>
                      <div className="flex gap-2">
                        <input type="number" step="0.01" min="0"
                          value={agent.quantity || ''}
                          onChange={e => updateAgent(agent.id, { quantity: Number(e.target.value) })}
                          className="flex-1 px-4 py-2.5 border border-surface-300 rounded-xl text-surface-800 focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all outline-none"
                          placeholder="0" />
                        <select value={agent.quantityUnit}
                          onChange={e => updateAgent(agent.id, { quantityUnit: e.target.value })}
                          className="px-3 py-2.5 border border-surface-300 rounded-xl text-surface-800 focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all outline-none">
                          <option value="g">g</option>
                          <option value="kg">kg</option>
                          <option value="ton">ton</option>
                          <option value="ml">ml</option>
                          <option value="l">l</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-surface-700 mb-1.5">Referencia temporal</label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { value: TimeReference.Day, label: 'Día' },
                          { value: TimeReference.Week, label: 'Semana' },
                          { value: TimeReference.Month, label: 'Mes' },
                          { value: TimeReference.Year, label: 'Año' },
                        ].map(opt => (
                          <button key={opt.value} onClick={() => updateAgent(agent.id, { timeReference: opt.value })}
                            className={`px-2 py-2 text-xs rounded-lg border transition-all ${
                              agent.timeReference === opt.value
                                ? 'bg-primary-50 border-primary-300 text-primary-700 font-medium'
                                : 'border-surface-200 text-surface-600 hover:bg-surface-50'
                            }`}>
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-surface-700 mb-1.5">P3.2 — Frecuencia</label>
                      <select value={agent.frequencyLevel}
                        onChange={e => updateAgent(agent.id, { frequencyLevel: Number(e.target.value) as FrequencyLevel })}
                        className="w-full px-4 py-2.5 border border-surface-300 rounded-xl text-surface-800 focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all outline-none">
                        {FREQUENCY_OPTIONS[agent.timeReference].map(opt => (
                          <option key={opt.level} value={opt.level}>
                            {opt.label}{opt.description ? ` (${opt.description})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section 4: Physico-chemical (conditional) */}
                <div className="pt-2">
                  <h4 className="text-sm font-semibold text-primary-600 uppercase tracking-wider mb-4">
                    Sección 4: Propiedades Físico-Químicas
                  </h4>

                  {agent.physicalState === PhysicalState.Liquid && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-surface-700 mb-1.5">P4.1 — Punto de ebullición (°C)</label>
                          <input type="number" value={agent.boilingPoint ?? ''}
                            onChange={e => updateAgent(agent.id, { boilingPoint: e.target.value ? Number(e.target.value) : null })}
                            className="w-full px-4 py-2.5 border border-surface-300 rounded-xl text-surface-800 focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all outline-none"
                            placeholder="°C" />
                          <p className="text-xs text-surface-400 mt-1">Consultar FDS. Si es mezcla, usar la Tª más baja</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-surface-700 mb-1.5">P4.2 — Tª de utilización (°C)</label>
                          <input type="number" value={agent.workingTemperature ?? ''}
                            onChange={e => updateAgent(agent.id, { workingTemperature: e.target.value ? Number(e.target.value) : null })}
                            className="w-full px-4 py-2.5 border border-surface-300 rounded-xl text-surface-800 focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all outline-none"
                            placeholder="°C" />
                          {agent.boilingPoint !== null && agent.workingTemperature !== null &&
                           agent.workingTemperature > agent.boilingPoint && (
                            <p className="text-xs text-danger-600 mt-1 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              Tª uso &gt; Punto ebullición. Revise los datos.
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <label className="block text-sm font-medium text-surface-700 mb-1.5 mr-2">P4.3 — ¿Pulverización (spray)?</label>
                        {[{ value: true, label: 'Sí (Clase 3)' }, { value: false, label: 'No' }].map(opt => (
                          <button key={String(opt.value)} onClick={() => updateAgent(agent.id, { isSpray: opt.value })}
                            className={`px-3 py-1.5 text-sm rounded-lg border transition-all ${
                              agent.isSpray === opt.value
                                ? 'bg-primary-50 border-primary-300 text-primary-700 font-medium'
                                : 'border-surface-200 text-surface-600 hover:bg-surface-50'
                            }`}>
                            {opt.label}
                          </button>
                        ))}
                      </div>
                      <div>
                        <div className="flex gap-2 items-center mb-2">
                          <label className="text-sm font-medium text-surface-700">P4.4 — ¿Notación FIV?</label>
                          {[{ value: true, label: 'Sí' }, { value: false, label: 'No' }].map(opt => (
                            <button key={String(opt.value)} onClick={() => updateAgent(agent.id, { hasFIV: opt.value })}
                              className={`px-3 py-1.5 text-sm rounded-lg border transition-all ${
                                agent.hasFIV === opt.value
                                  ? 'bg-primary-50 border-primary-300 text-primary-700 font-medium'
                                  : 'border-surface-200 text-surface-600 hover:bg-surface-50'
                              }`}>
                              {opt.label}
                            </button>
                          ))}
                        </div>
                        {agent.hasFIV && (
                          <div>
                            <label className="block text-sm font-medium text-surface-700 mb-1.5">P4.5 — Presión de vapor (kPa)</label>
                            <input type="number" step="0.001" min="0"
                              value={agent.vaporPressure ?? ''}
                              onChange={e => updateAgent(agent.id, { vaporPressure: e.target.value ? Number(e.target.value) : null })}
                              className="w-full max-w-xs px-4 py-2.5 border border-surface-300 rounded-xl text-surface-800 focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all outline-none"
                              placeholder="kPa" />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {agent.physicalState === PhysicalState.Solid && (
                    <div>
                      <label className="block text-sm font-medium text-surface-700 mb-2">P4.6 — Forma de presentación del sólido</label>
                      <div className="space-y-2">
                        {[
                          { value: SolidForm.FinePowder, label: 'Polvo fino en suspensión', example: 'azúcar polvo, harina, cemento, yeso', cls: 'Clase 3' },
                          { value: SolidForm.GrainPowder, label: 'Polvo en grano (1-2 mm)', example: 'azúcar cristalizada', cls: 'Clase 2' },
                          { value: SolidForm.Pellets, label: 'Pastillas / granulado / escamas', example: 'varios mm, sin emisión', cls: 'Clase 1' },
                        ].map(opt => (
                          <button key={opt.value}
                            onClick={() => updateAgent(agent.id, { solidForm: opt.value })}
                            className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                              agent.solidForm === opt.value
                                ? 'bg-primary-50 border-primary-300'
                                : 'border-surface-200 hover:bg-surface-50'
                            }`}>
                            <span className="font-medium text-surface-800">{opt.label}</span>
                            <span className="ml-2 text-xs px-1.5 py-0.5 bg-surface-100 rounded text-surface-500">{opt.cls}</span>
                            <p className="text-xs text-surface-400 mt-0.5">{opt.example}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {(agent.physicalState === PhysicalState.Gas || agent.physicalState === PhysicalState.Aerosol) && (
                    <div className="px-4 py-3 bg-primary-50 rounded-xl border border-primary-100">
                      <p className="text-sm text-primary-700 font-medium">
                        Volatilidad asignada automáticamente: <span className="font-bold">Clase 3</span> (Puntuación = 100)
                      </p>
                    </div>
                  )}
                </div>

                {/* Section 5: Procedure */}
                <div className="pt-2">
                  <h4 className="text-sm font-semibold text-primary-600 uppercase tracking-wider mb-4">
                    Sección 5: Procedimiento de Trabajo
                  </h4>
                  <div className="space-y-2">
                    {[
                      { value: ProcedureClass.Dispersive, label: 'Dispersivo (Clase 4)', score: '1', examples: 'Pintura pistola, taladro, muela, vaciado sacos manual, soldadura arco, limpieza trapos' },
                      { value: ProcedureClass.Open, label: 'Abierto (Clase 3)', score: '0,5', examples: 'Conductos reactor, mezcladores abiertos, pintura brocha, acondicionamiento toneles' },
                      { value: ProcedureClass.ClosedRegularOpening, label: 'Cerrado con aperturas regulares (Clase 2)', score: '0,05', examples: 'Reactor cerrado con cargas regulares, toma muestras, máquina desengrasar' },
                      { value: ProcedureClass.ClosedPermanent, label: 'Cerrado permanente (Clase 1)', score: '0,001', examples: 'Reactor químico completamente cerrado' },
                    ].map(opt => (
                      <button key={opt.value}
                        onClick={() => updateAgent(agent.id, { procedureClass: opt.value })}
                        className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                          agent.procedureClass === opt.value
                            ? 'bg-primary-50 border-primary-300'
                            : 'border-surface-200 hover:bg-surface-50'
                        }`}>
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-surface-800">{opt.label}</span>
                          <span className="text-xs px-2 py-0.5 bg-surface-100 rounded text-surface-500">PPr = {opt.score}</span>
                        </div>
                        <p className="text-xs text-surface-400 mt-0.5">{opt.examples}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Section 6: Ventilation */}
                <div className="pt-2">
                  <h4 className="text-sm font-semibold text-primary-600 uppercase tracking-wider mb-4">
                    Sección 6: Protección Colectiva (Ventilación)
                  </h4>
                  <div className="space-y-2">
                    {[
                      { value: VentilationClass.Enclosing, label: 'Clase 1 — Captación envolvente', score: '0,001', examples: 'Vitrina laboratorio' },
                      { value: VentilationClass.PartialCapture, label: 'Clase 2 — Cabina/Campana/Aspiración', score: '0,1', examples: 'Cabina ventilada, campana superior, rendija aspiración, mesa con aspiración' },
                      { value: VentilationClass.GeneralOrOutdoor, label: 'Clase 3 — Ventilación general / Intemperie', score: '0,7', examples: 'Trabajos intemperie, trabajador alejado, ventilación mecánica general' },
                      { value: VentilationClass.NoVentilation, label: 'Clase 4 — Sin ventilación mecánica', score: '1', examples: 'Ausencia de ventilación mecánica' },
                      { value: VentilationClass.ConfinedSpace, label: 'Clase 5 — Espacio confinado', score: '10', examples: 'Espacio con aberturas limitadas + ventilación natural desfavorable' },
                    ].map(opt => (
                      <button key={opt.value}
                        onClick={() => updateAgent(agent.id, { ventilationClass: opt.value })}
                        className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                          agent.ventilationClass === opt.value
                            ? opt.value === VentilationClass.ConfinedSpace
                              ? 'bg-danger-50 border-danger-300'
                              : 'bg-primary-50 border-primary-300'
                            : 'border-surface-200 hover:bg-surface-50'
                        }`}>
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-surface-800">{opt.label}</span>
                          <span className="text-xs px-2 py-0.5 bg-surface-100 rounded text-surface-500">PPC = {opt.score}</span>
                        </div>
                        <p className="text-xs text-surface-400 mt-0.5">{opt.examples}</p>
                      </button>
                    ))}
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-surface-700 mb-1.5">P6.2 — ¿Mantenimiento de la ventilación?</label>
                    <div className="flex gap-2">
                      {[
                        { value: 'yes' as const, label: 'Sí, revisiones periódicas' },
                        { value: 'unsure' as const, label: 'No estoy seguro' },
                        { value: 'no' as const, label: 'No, requiere mantenimiento' },
                      ].map(opt => (
                        <button key={opt.value} onClick={() => updateAgent(agent.id, { ventilationMaintained: opt.value })}
                          className={`px-3 py-2 text-xs rounded-lg border transition-all ${
                            agent.ventilationMaintained === opt.value
                              ? 'bg-primary-50 border-primary-300 text-primary-700 font-medium'
                              : 'border-surface-200 text-surface-600 hover:bg-surface-50'
                          }`}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Section 7: Dermal */}
                <div className="pt-2">
                  <h4 className="text-sm font-semibold text-primary-600 uppercase tracking-wider mb-4">
                    Sección 7: Exposición Dérmica
                  </h4>
                  {agent.hasDermalToxicity && (
                    <div className="mb-3 px-3 py-2 bg-warning-50 border border-warning-400/20 rounded-lg">
                      <p className="text-xs text-warning-600">Frases de toxicidad dérmica detectadas automáticamente.</p>
                    </div>
                  )}
                  <div className="flex gap-2 items-center mb-4">
                    <label className="text-sm font-medium text-surface-700">P7.1 — ¿Toxicidad dérmica?</label>
                    {[{ value: true, label: 'Sí' }, { value: false, label: 'No' }].map(opt => (
                      <button key={String(opt.value)} onClick={() => updateAgent(agent.id, { hasDermalToxicity: opt.value })}
                        className={`px-3 py-1.5 text-sm rounded-lg border transition-all ${
                          agent.hasDermalToxicity === opt.value
                            ? 'bg-primary-50 border-primary-300 text-primary-700 font-medium'
                            : 'border-surface-200 text-surface-600 hover:bg-surface-50'
                        }`}>
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {agent.hasDermalToxicity && (
                    <>
                      <div className="flex gap-2 items-center mb-4">
                        <label className="text-sm font-medium text-surface-700">P7.2 — ¿Contacto con la piel?</label>
                        {[{ value: true, label: 'Sí' }, { value: false, label: 'No' }].map(opt => (
                          <button key={String(opt.value)} onClick={() => updateAgent(agent.id, { hasSkinContact: opt.value })}
                            className={`px-3 py-1.5 text-sm rounded-lg border transition-all ${
                              agent.hasSkinContact === opt.value
                                ? 'bg-primary-50 border-primary-300 text-primary-700 font-medium'
                                : 'border-surface-200 text-surface-600 hover:bg-surface-50'
                            }`}>
                            {opt.label}
                          </button>
                        ))}
                      </div>

                      {agent.hasSkinContact && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-surface-700 mb-2">P7.3 — Superficie expuesta</label>
                            <div className="space-y-1.5">
                              {[
                                { value: DermalSurface.OneHand, label: 'Una mano', score: 1 },
                                { value: DermalSurface.TwoHandsOrForearm, label: 'Dos manos / Una mano + antebrazo', score: 2 },
                                { value: DermalSurface.TwoHandsPlusForearm, label: 'Dos manos + antebrazo / Brazo completo', score: 3 },
                                { value: DermalSurface.ExtensiveSurface, label: 'Superficie extensa (torso/piernas)', score: 10 },
                              ].map(opt => (
                                <button key={opt.value} onClick={() => updateAgent(agent.id, { dermalSurface: opt.value })}
                                  className={`w-full text-left px-3 py-2 text-sm rounded-lg border transition-all ${
                                    agent.dermalSurface === opt.value
                                      ? 'bg-primary-50 border-primary-300 text-primary-700 font-medium'
                                      : 'border-surface-200 text-surface-600 hover:bg-surface-50'
                                  }`}>
                                  {opt.label} <span className="text-xs text-surface-400">(PS={opt.score})</span>
                                </button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-surface-700 mb-2">P7.4 — Frecuencia cutánea</label>
                            <div className="space-y-1.5">
                              {[
                                { value: DermalFrequency.Occasional, label: 'Ocasional (< 30 min/día)', score: 1 },
                                { value: DermalFrequency.Intermittent, label: 'Intermitente (30 min - 2h/día)', score: 2 },
                                { value: DermalFrequency.Frequent, label: 'Frecuente (2h - 6h/día)', score: 5 },
                                { value: DermalFrequency.Permanent, label: 'Permanente (> 6h/día)', score: 10 },
                              ].map(opt => (
                                <button key={opt.value} onClick={() => updateAgent(agent.id, { dermalFrequency: opt.value })}
                                  className={`w-full text-left px-3 py-2 text-sm rounded-lg border transition-all ${
                                    agent.dermalFrequency === opt.value
                                      ? 'bg-primary-50 border-primary-300 text-primary-700 font-medium'
                                      : 'border-surface-200 text-surface-600 hover:bg-surface-50'
                                  }`}>
                                  {opt.label} <span className="text-xs text-surface-400">(PFD={opt.score})</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Reusable Input Field ─────────────────────────────

function InputField({ label, value, onChange, placeholder, help }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; help?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-surface-700 mb-1.5">{label}</label>
      <input type="text" value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-4 py-2.5 border border-surface-300 rounded-xl text-surface-800 focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all outline-none"
        placeholder={placeholder} />
      {help && <p className="text-xs text-surface-400 mt-1">{help}</p>}
    </div>
  );
}
