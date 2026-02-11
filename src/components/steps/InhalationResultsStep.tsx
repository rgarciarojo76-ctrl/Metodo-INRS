import { useMemo, useEffect, useRef } from 'react';
import { Shield, AlertTriangle } from 'lucide-react';
import type { Evaluation, InhalationResult } from '../../types';
import { evaluateAllInhalation } from '../../engine/inhalation';
import { generateAllAlerts } from '../../engine/alerts';

interface Props {
  evaluation: Evaluation;
  onUpdate: (evaluation: Evaluation) => void;
}

function TrafficLight({ level }: { level: 'low' | 'moderate' | 'very_high' }) {
  const config = {
    low: { color: 'bg-success-500', ring: 'ring-success-200', label: 'BAJO', bg: 'bg-success-50' },
    moderate: { color: 'bg-warning-500', ring: 'ring-warning-200', label: 'MODERADO', bg: 'bg-warning-50' },
    very_high: { color: 'bg-danger-500', ring: 'ring-danger-200', label: 'MUY ELEVADO', bg: 'bg-danger-50' },
  }[level];

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${config.bg}`}>
      <span className={`w-3 h-3 rounded-full ${config.color} ring-4 ${config.ring} animate-pulse`} />
      <span className="text-xs font-bold">{config.label}</span>
    </div>
  );
}

export function InhalationResultsStep({ evaluation, onUpdate }: Props) {
  const onUpdateRef = useRef(onUpdate);
  useEffect(() => { onUpdateRef.current = onUpdate; });

  const selectedAgents = useMemo(() => {
    const selectedIds = new Set(
      evaluation.hierarchyResults.filter(r => r.selected).map(r => r.agentId)
    );
    if (selectedIds.size === 0) return evaluation.agents;
    return evaluation.agents.filter(a => selectedIds.has(a.id));
  }, [evaluation.agents, evaluation.hierarchyResults]);

  const results = useMemo(() => evaluateAllInhalation(selectedAgents), [selectedAgents]);
  const alerts = useMemo(() => generateAllAlerts(selectedAgents), [selectedAgents]);

  // Store results
  useEffect(() => {
    if (results.length > 0) {
      onUpdateRef.current({ ...evaluation, inhalationResults: results, alerts });
    }
  }, [results, alerts, evaluation]);

  if (selectedAgents.length === 0) {
    return (
      <div className="text-center py-20">
        <h3 className="text-xl font-semibold text-surface-700 mb-2">Sin agentes</h3>
        <p className="text-surface-500">No hay agentes seleccionados para evaluar.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-surface-800 mb-1">Resultados — Riesgo por Inhalación</h2>
        <p className="text-surface-500">Puntuación y caracterización del riesgo para cada agente evaluado.</p>
      </div>

      {/* Warning alerts */}
      {alerts.filter(a => a.severity !== 'info').length > 0 && (
        <div className="space-y-2">
          {alerts.filter(a => a.severity !== 'info').map(alert => (
            <div key={alert.id} className={`px-4 py-3 rounded-xl flex items-start gap-3 ${
              alert.severity === 'critical'
                ? 'bg-danger-50 border border-danger-200'
                : 'bg-warning-50 border border-warning-200'
            }`}>
              <AlertTriangle className={`w-5 h-5 mt-0.5 shrink-0 ${
                alert.severity === 'critical' ? 'text-danger-600' : 'text-warning-600'
              }`} />
              <div>
                <p className={`font-semibold text-sm ${alert.severity === 'critical' ? 'text-danger-700' : 'text-warning-700'}`}>
                  {alert.title}
                </p>
                <p className={`text-xs mt-0.5 ${alert.severity === 'critical' ? 'text-danger-600' : 'text-warning-600'}`}>
                  {alert.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Per-agent results */}
      {results.map((r: InhalationResult) => (
        <div key={r.agentId} className="bg-white rounded-2xl border border-surface-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-surface-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-primary-600" />
              <h3 className="font-semibold text-surface-800">{r.agentName}</h3>
            </div>
            <TrafficLight level={r.riskLevel === 'very_high' ? 'very_high' : r.riskLevel === 'moderate' ? 'moderate' : 'low'} />
          </div>

          <div className="p-6">
            {/* Calculation table */}
            <table className="w-full text-sm mb-6">
              <thead>
                <tr className="border-b border-surface-200">
                  <th className="py-2 text-left font-medium text-surface-600">Variable</th>
                  <th className="py-2 text-center font-medium text-surface-600">Clase</th>
                  <th className="py-2 text-center font-medium text-surface-600">Puntuación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                <tr>
                  <td className="py-2.5 text-surface-700">Peligro (PP)</td>
                  <td className="py-2.5 text-center">
                    <span className={`inline-flex w-7 h-7 items-center justify-center rounded-lg text-xs font-bold ${
                      r.dangerClass >= 4 ? 'bg-danger-100 text-danger-700' :
                      r.dangerClass === 3 ? 'bg-warning-100 text-warning-700' :
                      'bg-surface-100 text-surface-600'
                    }`}>{r.dangerClass}</span>
                  </td>
                  <td className="py-2.5 text-center font-mono font-semibold">{r.dangerScore.toLocaleString()}</td>
                </tr>
                <tr>
                  <td className="py-2.5 text-surface-700">Volatilidad (PV)</td>
                  <td className="py-2.5 text-center">
                    <span className="inline-flex w-7 h-7 items-center justify-center rounded-lg text-xs font-bold bg-surface-100 text-surface-600">{r.volatilityClass}</span>
                  </td>
                  <td className="py-2.5 text-center font-mono font-semibold">{r.volatilityScore}</td>
                </tr>
                <tr>
                  <td className="py-2.5 text-surface-700">Procedimiento (PPr)</td>
                  <td className="py-2.5 text-center">
                    <span className="inline-flex w-7 h-7 items-center justify-center rounded-lg text-xs font-bold bg-surface-100 text-surface-600">{r.procedureClass}</span>
                  </td>
                  <td className="py-2.5 text-center font-mono font-semibold">{r.procedureScore}</td>
                </tr>
                <tr>
                  <td className="py-2.5 text-surface-700">Protección Colectiva (PPC)</td>
                  <td className="py-2.5 text-center">
                    <span className="inline-flex w-7 h-7 items-center justify-center rounded-lg text-xs font-bold bg-surface-100 text-surface-600">{r.protectionClass}</span>
                  </td>
                  <td className="py-2.5 text-center font-mono font-semibold">{r.protectionScore}</td>
                </tr>
                <tr>
                  <td className="py-2.5 text-surface-700">Factor Corrección VLA (FC)</td>
                  <td className="py-2.5 text-center text-surface-400">—</td>
                  <td className="py-2.5 text-center font-mono font-semibold">{r.vlaCorrectionFactor}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-surface-300">
                  <td className="py-3 font-bold text-surface-800">RIESGO INHALACIÓN (PRI)</td>
                  <td className="py-3 text-center text-surface-400">—</td>
                  <td className="py-3 text-center">
                    <span className={`inline-block px-3 py-1 rounded-lg font-mono font-bold text-lg ${
                      r.riskScore > 1000 ? 'bg-danger-100 text-danger-700' :
                      r.riskScore > 100 ? 'bg-warning-100 text-warning-700' :
                      'bg-success-100 text-success-700'
                    }`}>{r.riskScore.toLocaleString()}</span>
                  </td>
                </tr>
              </tfoot>
            </table>

            {/* Characterization */}
            <div className={`px-4 py-3 rounded-xl border ${
              r.riskScore > 1000 ? 'bg-danger-50 border-danger-200' :
              r.riskScore > 100 ? 'bg-warning-50 border-warning-200' :
              'bg-success-50 border-success-200'
            }`}>
              <p className={`font-bold text-sm ${
                r.riskScore > 1000 ? 'text-danger-700' :
                r.riskScore > 100 ? 'text-warning-700' :
                'text-success-700'
              }`}>
                Prioridad {r.priorityAction} — {r.characterization}
              </p>
              <p className={`text-xs mt-1 ${
                r.riskScore > 1000 ? 'text-danger-600' :
                r.riskScore > 100 ? 'text-warning-600' :
                'text-success-600'
              }`}>
                {r.recommendation}
              </p>
            </div>

            {/* Formula */}
            <p className="text-xs text-surface-400 mt-3 font-mono">
              PRI = {r.dangerScore} × {r.volatilityScore} × {r.procedureScore} × {r.protectionScore} × {r.vlaCorrectionFactor} = {r.riskScore.toLocaleString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
