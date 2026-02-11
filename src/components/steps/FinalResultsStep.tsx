import { useMemo } from 'react';
import { FileDown, BarChart3, Shield, Hand, AlertTriangle } from 'lucide-react';
import type { Evaluation } from '../../types';
import { computeHierarchy } from '../../engine/hierarchy';
import { evaluateAllInhalation } from '../../engine/inhalation';
import { evaluateDermalRisk } from '../../engine/dermal';
import { generateAllAlerts } from '../../engine/alerts';
import { generatePdfReport } from '../../pdf/generateReport';

interface Props {
  evaluation: Evaluation;
  onUpdate: (evaluation: Evaluation) => void;
}

export function FinalResultsStep({ evaluation }: Props) {
  // Recalculate everything for final summary
  const hierarchyResults = useMemo(() => computeHierarchy(evaluation.agents), [evaluation.agents]);

  const selectedAgents = useMemo(() => {
    const ids = new Set(
      (evaluation.hierarchyResults.length > 0 ? evaluation.hierarchyResults : hierarchyResults)
        .filter(r => r.selected).map(r => r.agentId)
    );
    if (ids.size === 0) return evaluation.agents;
    return evaluation.agents.filter(a => ids.has(a.id));
  }, [evaluation.agents, evaluation.hierarchyResults, hierarchyResults]);

  const inhalationResults = useMemo(() => evaluateAllInhalation(selectedAgents), [selectedAgents]);
  const dermalResults = useMemo(() =>
    evaluation.agents.map(a => evaluateDermalRisk(a)).filter(Boolean) as NonNullable<ReturnType<typeof evaluateDermalRisk>>[],
    [evaluation.agents]
  );
  const alerts = useMemo(() => generateAllAlerts(evaluation.agents), [evaluation.agents]);

  const handleExportPdf = async () => {
    try {
      const fullEval: Evaluation = {
        ...evaluation,
        hierarchyResults,
        inhalationResults,
        dermalResults,
        alerts,
      };
      await generatePdfReport(fullEval);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error al generar el PDF. Revise la consola para más detalles.');
    }
  };

  const highRiskCount = inhalationResults.filter(r => r.riskScore > 1000).length;
  const moderateRiskCount = inhalationResults.filter(r => r.riskScore > 100 && r.riskScore <= 1000).length;
  const lowRiskCount = inhalationResults.filter(r => r.riskScore <= 100).length;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-surface-800 mb-1">Resultados Finales</h2>
          <p className="text-surface-500">Resumen de la evaluación de riesgo químico.</p>
        </div>
        <button
          onClick={handleExportPdf}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl font-medium text-sm hover:bg-primary-700 transition-colors shadow-sm hover:shadow-md"
        >
          <FileDown className="w-4 h-4" />
          Exportar PDF
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard
          icon={<BarChart3 className="w-5 h-5" />}
          label="Agentes evaluados"
          value={evaluation.agents.length.toString()}
          color="primary"
        />
        <SummaryCard
          icon={<AlertTriangle className="w-5 h-5" />}
          label="Riesgo Muy Elevado"
          value={highRiskCount.toString()}
          color="danger"
        />
        <SummaryCard
          icon={<Shield className="w-5 h-5" />}
          label="Riesgo Moderado"
          value={moderateRiskCount.toString()}
          color="warning"
        />
        <SummaryCard
          icon={<Shield className="w-5 h-5" />}
          label="Riesgo Bajo"
          value={lowRiskCount.toString()}
          color="success"
        />
      </div>

      {/* Critical alerts */}
      {alerts.filter(a => a.severity === 'critical').length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold text-danger-700 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Alertas Críticas
          </h3>
          {alerts.filter(a => a.severity === 'critical').map(alert => (
            <div key={alert.id} className="px-4 py-3 bg-danger-50 border border-danger-200 rounded-xl">
              <p className="font-semibold text-danger-700 text-sm">{alert.title}</p>
              <p className="text-xs text-danger-600 mt-0.5">{alert.message}</p>
            </div>
          ))}
        </div>
      )}

      {/* Hierarchy summary table */}
      <div className="bg-white rounded-2xl border border-surface-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-surface-100">
          <h3 className="font-semibold text-surface-800 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary-600" />
            Jerarquización
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-50 text-surface-600">
                <th className="px-4 py-2 text-left font-medium">Producto</th>
                <th className="px-4 py-2 text-center font-medium">CP</th>
                <th className="px-4 py-2 text-center font-medium">CRP</th>
                <th className="px-4 py-2 text-right font-medium">PRP</th>
                <th className="px-4 py-2 text-right font-medium">IPA %</th>
                <th className="px-4 py-2 text-center font-medium">Prioridad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {hierarchyResults.map(r => (
                <tr key={r.agentId} className="hover:bg-surface-50">
                  <td className="px-4 py-2 font-medium text-surface-800">{r.agentName}</td>
                  <td className="px-4 py-2 text-center">{r.dangerClass}</td>
                  <td className="px-4 py-2 text-center">{r.potentialRiskClass}</td>
                  <td className="px-4 py-2 text-right font-mono">{r.riskScore.toLocaleString()}</td>
                  <td className="px-4 py-2 text-right font-mono">{r.ipaPercent.toFixed(1)}%</td>
                  <td className="px-4 py-2 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      r.priority === 'high' ? 'bg-danger-100 text-danger-700' :
                      r.priority === 'medium' ? 'bg-warning-100 text-warning-700' :
                      'bg-success-100 text-success-700'
                    }`}>
                      {r.priority === 'high' ? 'FUERTE' : r.priority === 'medium' ? 'MEDIA' : 'BAJA'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inhalation results summary */}
      {inhalationResults.length > 0 && (
        <div className="bg-white rounded-2xl border border-surface-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-surface-100">
            <h3 className="font-semibold text-surface-800 flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary-600" />
              Riesgo por Inhalación
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-50 text-surface-600">
                  <th className="px-4 py-2 text-left font-medium">Producto</th>
                  <th className="px-4 py-2 text-center font-medium">PP</th>
                  <th className="px-4 py-2 text-center font-medium">PV</th>
                  <th className="px-4 py-2 text-center font-medium">PPr</th>
                  <th className="px-4 py-2 text-center font-medium">PPC</th>
                  <th className="px-4 py-2 text-center font-medium">FC</th>
                  <th className="px-4 py-2 text-right font-medium">PRI</th>
                  <th className="px-4 py-2 text-center font-medium">Nivel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {inhalationResults.map(r => (
                  <tr key={r.agentId} className="hover:bg-surface-50">
                    <td className="px-4 py-2 font-medium text-surface-800">{r.agentName}</td>
                    <td className="px-4 py-2 text-center font-mono">{r.dangerScore.toLocaleString()}</td>
                    <td className="px-4 py-2 text-center font-mono">{r.volatilityScore}</td>
                    <td className="px-4 py-2 text-center font-mono">{r.procedureScore}</td>
                    <td className="px-4 py-2 text-center font-mono">{r.protectionScore}</td>
                    <td className="px-4 py-2 text-center font-mono">{r.vlaCorrectionFactor}</td>
                    <td className="px-4 py-2 text-right font-mono font-bold">{r.riskScore.toLocaleString()}</td>
                    <td className="px-4 py-2 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                        r.riskScore > 1000 ? 'bg-danger-100 text-danger-700' :
                        r.riskScore > 100 ? 'bg-warning-100 text-warning-700' :
                        'bg-success-100 text-success-700'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${
                          r.riskScore > 1000 ? 'bg-danger-500' :
                          r.riskScore > 100 ? 'bg-warning-500' :
                          'bg-success-500'
                        }`} />
                        {r.riskScore > 1000 ? 'MUY ELEVADO' : r.riskScore > 100 ? 'MODERADO' : 'BAJO'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Dermal results summary */}
      {dermalResults.length > 0 && (
        <div className="bg-white rounded-2xl border border-surface-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-surface-100">
            <h3 className="font-semibold text-surface-800 flex items-center gap-2">
              <Hand className="w-5 h-5 text-primary-600" />
              Riesgo Dérmico
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-50 text-surface-600">
                  <th className="px-4 py-2 text-left font-medium">Producto</th>
                  <th className="px-4 py-2 text-center font-medium">PP</th>
                  <th className="px-4 py-2 text-center font-medium">PS</th>
                  <th className="px-4 py-2 text-center font-medium">PFD</th>
                  <th className="px-4 py-2 text-right font-medium">PRD</th>
                  <th className="px-4 py-2 text-center font-medium">Nivel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {dermalResults.map(r => (
                  <tr key={r.agentId} className="hover:bg-surface-50">
                    <td className="px-4 py-2 font-medium text-surface-800">{r.agentName}</td>
                    <td className="px-4 py-2 text-center font-mono">{r.dangerScore.toLocaleString()}</td>
                    <td className="px-4 py-2 text-center font-mono">{r.surfaceScore}</td>
                    <td className="px-4 py-2 text-center font-mono">{r.frequencyScore}</td>
                    <td className="px-4 py-2 text-right font-mono font-bold">{r.riskScore.toLocaleString()}</td>
                    <td className="px-4 py-2 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        r.riskScore > 1000 ? 'bg-danger-100 text-danger-700' :
                        r.riskScore > 100 ? 'bg-warning-100 text-warning-700' :
                        'bg-success-100 text-success-700'
                      }`}>
                        {r.characterization}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Project info footer */}
      <div className="bg-surface-100 rounded-2xl p-6 text-sm text-surface-600 space-y-1">
        <p><span className="font-medium">Empresa:</span> {evaluation.project.companyName || '—'}</p>
        <p><span className="font-medium">Centro / Área:</span> {evaluation.project.workCenter} — {evaluation.project.area}</p>
        <p><span className="font-medium">Fecha:</span> {evaluation.project.evaluationDate}</p>
        <p><span className="font-medium">Evaluador:</span> {evaluation.project.evaluatorName}</p>
        <p className="text-xs text-surface-400 mt-3">Metodología: NTP 937 (INSHT) / ND 2233-200-05 (INRS)</p>
      </div>
    </div>
  );
}

function SummaryCard({ icon, label, value, color }: {
  icon: React.ReactNode; label: string; value: string; color: 'primary' | 'danger' | 'warning' | 'success';
}) {
  const colors = {
    primary: 'bg-primary-50 text-primary-600 border-primary-200',
    danger: 'bg-danger-50 text-danger-600 border-danger-200',
    warning: 'bg-warning-50 text-warning-600 border-warning-200',
    success: 'bg-success-50 text-success-600 border-success-200',
  };
  return (
    <div className={`rounded-2xl border p-5 ${colors[color]}`}>
      <div className="flex items-center gap-2 mb-2 opacity-70">{icon}<span className="text-xs font-medium">{label}</span></div>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}
