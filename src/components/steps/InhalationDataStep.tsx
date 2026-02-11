import { useMemo } from 'react';
import { Thermometer, Wind } from 'lucide-react';
import type { Evaluation, ChemicalAgent } from '../../types';
import { PhysicalState, ProcedureClass, VentilationClass, SolidForm } from '../../types';

interface Props {
  evaluation: Evaluation;
  onUpdate: (evaluation: Evaluation) => void;
}

export function InhalationDataStep({ evaluation, onUpdate }: Props) {
  // Only show agents selected in hierarchy step
  const selectedAgents = useMemo(() => {
    const selectedIds = new Set(
      evaluation.hierarchyResults.filter(r => r.selected).map(r => r.agentId)
    );
    // If none selected, show all
    if (selectedIds.size === 0) return evaluation.agents;
    return evaluation.agents.filter(a => selectedIds.has(a.id));
  }, [evaluation.agents, evaluation.hierarchyResults]);

  const updateAgent = (id: string, patch: Partial<ChemicalAgent>) => {
    const agents = evaluation.agents.map(a => a.id === id ? { ...a, ...patch } : a);
    onUpdate({ ...evaluation, agents });
  };

  if (selectedAgents.length === 0) {
    return (
      <div className="text-center py-20">
        <h3 className="text-xl font-semibold text-surface-700 mb-2">Sin agentes seleccionados</h3>
        <p className="text-surface-500">Vuelve al paso 3 y selecciona al menos un agente para evaluar.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-surface-800 mb-1">Evaluación por Inhalación — Datos</h2>
        <p className="text-surface-500">
          Revisa los datos de volatilidad, procedimiento y protección colectiva para los {selectedAgents.length} agente(s) seleccionado(s).
        </p>
      </div>

      {selectedAgents.map((agent, idx) => (
        <div key={agent.id} className="bg-white rounded-2xl border border-surface-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-surface-100 bg-surface-50 flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold">{idx + 1}</span>
            <h3 className="font-semibold text-surface-800">{agent.commercialName || agent.substanceName || `Agente ${idx + 1}`}</h3>
            <span className="text-xs px-2 py-0.5 rounded bg-surface-200 text-surface-500">
              {agent.physicalState === PhysicalState.Liquid ? 'Líquido' :
               agent.physicalState === PhysicalState.Solid ? 'Sólido' :
               agent.physicalState === PhysicalState.Gas ? 'Gas' : 'Aerosol'}
            </span>
          </div>

          <div className="p-6 space-y-6">
            {/* Volatility summary */}
            <div>
              <h4 className="flex items-center gap-2 text-sm font-semibold text-primary-600 mb-3">
                <Thermometer className="w-4 h-4" />
                Volatilidad / Pulverulencia
              </h4>

              {agent.physicalState === PhysicalState.Liquid && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-surface-700 mb-1.5">Punto de ebullición (°C)</label>
                    <input type="number" value={agent.boilingPoint ?? ''}
                      onChange={e => updateAgent(agent.id, { boilingPoint: e.target.value ? Number(e.target.value) : null })}
                      className="w-full px-4 py-2.5 border border-surface-300 rounded-xl focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 outline-none"
                      placeholder="°C" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-surface-700 mb-1.5">Tª de utilización (°C)</label>
                    <input type="number" value={agent.workingTemperature ?? ''}
                      onChange={e => updateAgent(agent.id, { workingTemperature: e.target.value ? Number(e.target.value) : null })}
                      className="w-full px-4 py-2.5 border border-surface-300 rounded-xl focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 outline-none"
                      placeholder="°C" />
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-surface-700">¿Spray?</label>
                    {[{ v: true, l: 'Sí' }, { v: false, l: 'No' }].map(o => (
                      <button key={String(o.v)} onClick={() => updateAgent(agent.id, { isSpray: o.v })}
                        className={`px-3 py-1.5 text-sm rounded-lg border transition-all ${agent.isSpray === o.v ? 'bg-primary-50 border-primary-300 text-primary-700' : 'border-surface-200 text-surface-600 hover:bg-surface-50'}`}>
                        {o.l}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-surface-700">¿FIV?</label>
                    {[{ v: true, l: 'Sí' }, { v: false, l: 'No' }].map(o => (
                      <button key={String(o.v)} onClick={() => updateAgent(agent.id, { hasFIV: o.v })}
                        className={`px-3 py-1.5 text-sm rounded-lg border transition-all ${agent.hasFIV === o.v ? 'bg-primary-50 border-primary-300 text-primary-700' : 'border-surface-200 text-surface-600 hover:bg-surface-50'}`}>
                        {o.l}
                      </button>
                    ))}
                  </div>
                  {agent.hasFIV && (
                    <div>
                      <label className="block text-sm font-medium text-surface-700 mb-1.5">Presión de vapor (kPa)</label>
                      <input type="number" step="0.001" value={agent.vaporPressure ?? ''}
                        onChange={e => updateAgent(agent.id, { vaporPressure: e.target.value ? Number(e.target.value) : null })}
                        className="w-full px-4 py-2.5 border border-surface-300 rounded-xl focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 outline-none"
                        placeholder="kPa" />
                    </div>
                  )}
                </div>
              )}

              {agent.physicalState === PhysicalState.Solid && (
                <div className="space-y-2">
                  {[
                    { value: SolidForm.FinePowder, label: 'Polvo fino → Clase 3', sub: 'PV = 100' },
                    { value: SolidForm.GrainPowder, label: 'Polvo grano → Clase 2', sub: 'PV = 10' },
                    { value: SolidForm.Pellets, label: 'Pastillas/granulado → Clase 1', sub: 'PV = 1' },
                  ].map(o => (
                    <button key={o.value} onClick={() => updateAgent(agent.id, { solidForm: o.value })}
                      className={`w-full text-left px-4 py-2.5 rounded-xl border transition-all ${agent.solidForm === o.value ? 'bg-primary-50 border-primary-300' : 'border-surface-200 hover:bg-surface-50'}`}>
                      <span className="font-medium text-surface-800">{o.label}</span>
                      <span className="ml-2 text-xs text-surface-400">{o.sub}</span>
                    </button>
                  ))}
                </div>
              )}

              {(agent.physicalState === PhysicalState.Gas || agent.physicalState === PhysicalState.Aerosol) && (
                <div className="px-4 py-3 bg-primary-50 rounded-xl">
                  <p className="text-sm text-primary-700 font-medium">Clase 3 asignada automáticamente (PV = 100)</p>
                </div>
              )}
            </div>

            {/* Procedure */}
            <div>
              <h4 className="flex items-center gap-2 text-sm font-semibold text-primary-600 mb-3">
                <Wind className="w-4 h-4" />
                Procedimiento de Trabajo
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {[
                  { v: ProcedureClass.Dispersive, l: 'Dispersivo', s: 'PPr = 1' },
                  { v: ProcedureClass.Open, l: 'Abierto', s: 'PPr = 0,5' },
                  { v: ProcedureClass.ClosedRegularOpening, l: 'Cerrado con aperturas', s: 'PPr = 0,05' },
                  { v: ProcedureClass.ClosedPermanent, l: 'Cerrado permanente', s: 'PPr = 0,001' },
                ].map(o => (
                  <button key={o.v} onClick={() => updateAgent(agent.id, { procedureClass: o.v })}
                    className={`text-left px-4 py-2.5 rounded-xl border transition-all ${agent.procedureClass === o.v ? 'bg-primary-50 border-primary-300' : 'border-surface-200 hover:bg-surface-50'}`}>
                    <span className="font-medium text-surface-800">{o.l}</span>
                    <span className="ml-2 text-xs text-surface-400">{o.s}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Ventilation */}
            <div>
              <h4 className="flex items-center gap-2 text-sm font-semibold text-primary-600 mb-3">
                <Wind className="w-4 h-4" />
                Protección Colectiva
              </h4>
              <div className="space-y-2">
                {[
                  { v: VentilationClass.Enclosing, l: 'Clase 1 — Captación envolvente', s: 'PPC = 0,001' },
                  { v: VentilationClass.PartialCapture, l: 'Clase 2 — Cabina/Campana', s: 'PPC = 0,1' },
                  { v: VentilationClass.GeneralOrOutdoor, l: 'Clase 3 — Ventilación general', s: 'PPC = 0,7' },
                  { v: VentilationClass.NoVentilation, l: 'Clase 4 — Sin ventilación', s: 'PPC = 1' },
                  { v: VentilationClass.ConfinedSpace, l: 'Clase 5 — Espacio confinado', s: 'PPC = 10' },
                ].map(o => (
                  <button key={o.v} onClick={() => updateAgent(agent.id, { ventilationClass: o.v })}
                    className={`w-full text-left px-4 py-2.5 rounded-xl border transition-all ${
                      agent.ventilationClass === o.v
                        ? o.v === VentilationClass.ConfinedSpace ? 'bg-danger-50 border-danger-300' : 'bg-primary-50 border-primary-300'
                        : 'border-surface-200 hover:bg-surface-50'
                    }`}>
                    <span className="font-medium text-surface-800">{o.l}</span>
                    <span className="ml-2 text-xs text-surface-400">{o.s}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
