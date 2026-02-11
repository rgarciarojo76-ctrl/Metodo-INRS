import { useMemo, useEffect, useRef } from 'react';
import { Hand } from 'lucide-react';
import type { Evaluation, DermalResult } from '../../types';
import { DermalSurface, DermalFrequency } from '../../types';
import { evaluateDermalRisk } from '../../engine/dermal';

interface Props {
  evaluation: Evaluation;
  onUpdate: (evaluation: Evaluation) => void;
}

export function DermalStep({ evaluation, onUpdate }: Props) {
  const onUpdateRef = useRef(onUpdate);
  useEffect(() => { onUpdateRef.current = onUpdate; });

  // Only agents with dermal toxicity + skin contact
  const dermalAgents = useMemo(() =>
    evaluation.agents.filter(a => a.hasDermalToxicity),
    [evaluation.agents]
  );

  const results = useMemo(() =>
    dermalAgents.map(a => evaluateDermalRisk(a)).filter(Boolean) as DermalResult[],
    [dermalAgents]
  );

  // Store results
  useEffect(() => {
    onUpdateRef.current({ ...evaluation, dermalResults: results });
  }, [results, evaluation]);

  const updateAgent = (id: string, patch: Partial<typeof evaluation.agents[0]>) => {
    const agents = evaluation.agents.map(a => a.id === id ? { ...a, ...patch } : a);
    onUpdate({ ...evaluation, agents });
  };

  if (dermalAgents.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-surface-800 mb-1">Evaluación Riesgo Dérmico</h2>
          <p className="text-surface-500">No hay agentes con indicación de toxicidad dérmica.</p>
        </div>
        <div className="text-center py-16 bg-white rounded-2xl border border-surface-200">
          <Hand className="w-12 h-12 mx-auto text-surface-300 mb-4" />
          <p className="text-surface-500">
            Ningún agente tiene frases de toxicidad dérmica (R21, R24, R27, R34, R35, R38, R43 / H312, H314, H315, H317, H318).
          </p>
          <p className="text-sm text-surface-400 mt-2">Puedes continuar al paso siguiente.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-surface-800 mb-1">Evaluación Riesgo Dérmico</h2>
        <p className="text-surface-500">
          {dermalAgents.length} agente(s) con toxicidad dérmica identificada.
        </p>
      </div>

      {dermalAgents.map((agent) => {
        const result = results.find(r => r.agentId === agent.id);

        return (
          <div key={agent.id} className="bg-white rounded-2xl border border-surface-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-surface-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Hand className="w-5 h-5 text-primary-600" />
                <h3 className="font-semibold text-surface-800">{agent.commercialName || agent.substanceName}</h3>
              </div>
              {result && (
                <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                  result.riskScore > 1000 ? 'bg-danger-50 text-danger-700' :
                  result.riskScore > 100 ? 'bg-warning-50 text-warning-700' :
                  'bg-success-50 text-success-700'
                }`}>
                  {result.characterization}
                </span>
              )}
            </div>

            <div className="p-6 space-y-6">
              {/* Skin contact */}
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-surface-700">¿Contacto real con la piel?</label>
                {[{ v: true, l: 'Sí' }, { v: false, l: 'No' }].map(o => (
                  <button key={String(o.v)} onClick={() => updateAgent(agent.id, { hasSkinContact: o.v })}
                    className={`px-3 py-1.5 text-sm rounded-lg border transition-all ${
                      agent.hasSkinContact === o.v
                        ? 'bg-primary-50 border-primary-300 text-primary-700 font-medium'
                        : 'border-surface-200 text-surface-600 hover:bg-surface-50'
                    }`}>
                    {o.l}
                  </button>
                ))}
              </div>

              {agent.hasSkinContact && (
                <>
                  {/* Surface */}
                  <div>
                    <label className="block text-sm font-medium text-surface-700 mb-2">Superficie corporal expuesta</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {[
                        { v: DermalSurface.OneHand, l: 'Una mano', s: 'PS = 1' },
                        { v: DermalSurface.TwoHandsOrForearm, l: 'Dos manos / Una mano + antebrazo', s: 'PS = 2' },
                        { v: DermalSurface.TwoHandsPlusForearm, l: 'Dos manos + antebrazo / Brazo completo', s: 'PS = 3' },
                        { v: DermalSurface.ExtensiveSurface, l: 'Superficie extensa (torso/piernas)', s: 'PS = 10' },
                      ].map(o => (
                        <button key={o.v} onClick={() => updateAgent(agent.id, { dermalSurface: o.v })}
                          className={`text-left px-4 py-2.5 rounded-xl border transition-all ${
                            agent.dermalSurface === o.v ? 'bg-primary-50 border-primary-300' : 'border-surface-200 hover:bg-surface-50'
                          }`}>
                          <span className="font-medium text-surface-800 text-sm">{o.l}</span>
                          <span className="ml-2 text-xs text-surface-400">{o.s}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Frequency */}
                  <div>
                    <label className="block text-sm font-medium text-surface-700 mb-2">Frecuencia de exposición cutánea</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {[
                        { v: DermalFrequency.Occasional, l: 'Ocasional (< 30 min/día)', s: 'PFD = 1' },
                        { v: DermalFrequency.Intermittent, l: 'Intermitente (30 min - 2h/día)', s: 'PFD = 2' },
                        { v: DermalFrequency.Frequent, l: 'Frecuente (2h - 6h/día)', s: 'PFD = 5' },
                        { v: DermalFrequency.Permanent, l: 'Permanente (> 6h/día)', s: 'PFD = 10' },
                      ].map(o => (
                        <button key={o.v} onClick={() => updateAgent(agent.id, { dermalFrequency: o.v })}
                          className={`text-left px-4 py-2.5 rounded-xl border transition-all ${
                            agent.dermalFrequency === o.v ? 'bg-primary-50 border-primary-300' : 'border-surface-200 hover:bg-surface-50'
                          }`}>
                          <span className="font-medium text-surface-800 text-sm">{o.l}</span>
                          <span className="ml-2 text-xs text-surface-400">{o.s}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Result */}
                  {result && (
                    <div className={`px-4 py-4 rounded-xl border ${
                      result.riskScore > 1000 ? 'bg-danger-50 border-danger-200' :
                      result.riskScore > 100 ? 'bg-warning-50 border-warning-200' :
                      'bg-success-50 border-success-200'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-surface-800">PRD = PP × PS × PFD</span>
                        <span className={`text-lg font-mono font-bold ${
                          result.riskScore > 1000 ? 'text-danger-700' :
                          result.riskScore > 100 ? 'text-warning-700' :
                          'text-success-700'
                        }`}>{result.riskScore.toLocaleString()}</span>
                      </div>
                      <p className="text-xs font-mono text-surface-500">
                        {result.dangerScore} × {result.surfaceScore} × {result.frequencyScore} = {result.riskScore.toLocaleString()}
                      </p>
                      <p className={`text-sm font-semibold mt-2 ${
                        result.riskScore > 1000 ? 'text-danger-700' :
                        result.riskScore > 100 ? 'text-warning-700' :
                        'text-success-700'
                      }`}>{result.characterization}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
