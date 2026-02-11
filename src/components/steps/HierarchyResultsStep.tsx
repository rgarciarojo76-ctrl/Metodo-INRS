import { useMemo } from 'react';
import { BarChart3, ArrowUpRight, AlertTriangle } from 'lucide-react';
import type { Evaluation } from '../../types';
import { computeHierarchy } from '../../engine/hierarchy';
import { generateAllAlerts } from '../../engine/alerts';
import { Priority } from '../../types';
import { ParetoChart } from '../ui/ParetoChart';

interface Props {
  evaluation: Evaluation;
  onUpdate: (evaluation: Evaluation) => void;
}

export function HierarchyResultsStep({ evaluation, onUpdate }: Props) {
  const results = useMemo(() => computeHierarchy(evaluation.agents), [evaluation.agents]);
  const alerts = useMemo(() => generateAllAlerts(evaluation.agents), [evaluation.agents]);

  // Auto-store results
  useMemo(() => {
    if (results.length > 0) {
      onUpdate({ ...evaluation, hierarchyResults: results, alerts });
    }
  }, [results.length]);

  const toggleSelect = (agentId: string) => {
    const updated = results.map(r =>
      r.agentId === agentId ? { ...r, selected: !r.selected } : r
    );
    onUpdate({ ...evaluation, hierarchyResults: updated });
  };

  const selectAll = () => {
    const allSelected = results.every(r => r.selected);
    const updated = results.map(r => ({ ...r, selected: !allSelected }));
    onUpdate({ ...evaluation, hierarchyResults: updated });
  };

  const priorityColor = (p: Priority) => {
    if (p === Priority.High) return 'bg-danger-100 text-danger-700 border-danger-200';
    if (p === Priority.Medium) return 'bg-warning-100 text-warning-700 border-warning-200';
    return 'bg-success-100 text-success-700 border-success-200';
  };

  const priorityLabel = (p: Priority) => {
    if (p === Priority.High) return 'FUERTE';
    if (p === Priority.Medium) return 'MEDIA';
    return 'BAJA';
  };

  // Find agents covering 80% of total risk
  const totalScore = results.reduce((s, r) => s + r.riskScore, 0);
  let cumPercent = 0;
  const priorityAgents: string[] = [];
  for (const r of results) {
    cumPercent += (r.riskScore / totalScore) * 100;
    priorityAgents.push(r.agentName);
    if (cumPercent >= 80) break;
  }

  if (evaluation.agents.length === 0) {
    return (
      <div className="text-center py-20">
        <AlertTriangle className="w-12 h-12 mx-auto text-warning-400 mb-4" />
        <h3 className="text-xl font-semibold text-surface-700 mb-2">Sin agentes químicos</h3>
        <p className="text-surface-500">Vuelve al paso 2 y añade al menos un agente químico.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-surface-800 mb-1">Jerarquización de Riesgos Potenciales</h2>
        <p className="text-surface-500">Priorización de agentes según el Módulo 1 del método INRS.</p>
      </div>

      {/* Alerts */}
      {alerts.filter(a => a.severity === 'critical').length > 0 && (
        <div className="space-y-2">
          {alerts.filter(a => a.severity === 'critical').map(alert => (
            <div key={alert.id} className="px-4 py-3 bg-danger-50 border border-danger-200 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-danger-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-danger-700 text-sm">{alert.title}</p>
                <p className="text-xs text-danger-600 mt-0.5">{alert.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Results table */}
      <div className="bg-white rounded-2xl border border-surface-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-surface-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary-600" />
            <h3 className="font-semibold text-surface-800">Tabla de Resultados</h3>
          </div>
          <button onClick={selectAll} className="text-xs text-primary-600 hover:text-primary-700 font-medium">
            {results.every(r => r.selected) ? 'Deseleccionar todos' : 'Seleccionar todos'}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-50 text-surface-600">
                <th className="px-4 py-3 text-left font-medium">Eval.</th>
                <th className="px-4 py-3 text-left font-medium">Producto</th>
                <th className="px-4 py-3 text-center font-medium">CP</th>
                <th className="px-4 py-3 text-center font-medium">CC</th>
                <th className="px-4 py-3 text-center font-medium">CF</th>
                <th className="px-4 py-3 text-center font-medium">CEP</th>
                <th className="px-4 py-3 text-center font-medium">CRP</th>
                <th className="px-4 py-3 text-right font-medium">PRP</th>
                <th className="px-4 py-3 text-right font-medium">IPA %</th>
                <th className="px-4 py-3 text-center font-medium">Prioridad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {results.map(r => (
                <tr key={r.agentId} className="hover:bg-surface-50 transition-colors">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={r.selected}
                      onChange={() => toggleSelect(r.agentId)}
                      className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                    />
                  </td>
                  <td className="px-4 py-3 font-medium text-surface-800">{r.agentName}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex w-7 h-7 items-center justify-center rounded-lg text-xs font-bold ${
                      r.dangerClass >= 4 ? 'bg-danger-100 text-danger-700' :
                      r.dangerClass === 3 ? 'bg-warning-100 text-warning-700' :
                      'bg-surface-100 text-surface-600'
                    }`}>{r.dangerClass}</span>
                  </td>
                  <td className="px-4 py-3 text-center text-surface-600">{r.quantityClass}</td>
                  <td className="px-4 py-3 text-center text-surface-600">{r.frequencyClass}</td>
                  <td className="px-4 py-3 text-center text-surface-600">{r.potentialExposureClass}</td>
                  <td className="px-4 py-3 text-center text-surface-600">{r.potentialRiskClass}</td>
                  <td className="px-4 py-3 text-right font-mono font-semibold text-surface-800">
                    {r.riskScore.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-surface-600">
                    {r.ipaPercent.toFixed(1)}%
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold border ${priorityColor(r.priority)}`}>
                      {priorityLabel(r.priority)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pareto Chart */}
      <div className="bg-white rounded-2xl border border-surface-200 shadow-sm p-6">
        <h3 className="font-semibold text-surface-800 mb-4 flex items-center gap-2">
          <ArrowUpRight className="w-5 h-5 text-primary-600" />
          Diagrama de Pareto
        </h3>
        <div className="h-80">
          <ParetoChart results={results} />
        </div>
        {priorityAgents.length > 0 && (
          <div className="mt-4 px-4 py-3 bg-primary-50 rounded-xl border border-primary-100">
            <p className="text-sm text-primary-700">
              <span className="font-semibold">Interpretación:</span> Los agentes que concentran el 80% del riesgo potencial son:{' '}
              <span className="font-bold">{priorityAgents.join(', ')}</span>.
            </p>
          </div>
        )}
      </div>

      {/* Selection summary */}
      <div className="px-4 py-3 bg-surface-100 rounded-xl">
        <p className="text-sm text-surface-600">
          <span className="font-medium">{results.filter(r => r.selected).length}</span> agente(s) seleccionado(s)
          para evaluación detallada. Marca los agentes que deseas evaluar y avanza al siguiente paso.
        </p>
      </div>
    </div>
  );
}
