/**
 * AutoResultsStep — Final results view for the automated evaluation flow.
 * Runs the INRS calculation engines on the assembled ChemicalAgent data
 * and displays results using the same visualizations as the manual wizard.
 */
import { useState, useMemo } from 'react';
import { BarChart3, Shield, Droplets, Download } from 'lucide-react';
import type { Evaluation, InhalationResult } from '../../types';
import { computeHierarchy } from '../../engine/hierarchy';
import { evaluateAllInhalation } from '../../engine/inhalation';
import { evaluateDermalRisk } from '../../engine/dermal';
import { generateAllAlerts } from '../../engine/alerts';
import { generatePdfReport, type ReportConfig } from '../../pdf/generateReport';
import { ReportConfigModal } from '../ReportConfigModal';

interface Props {
  evaluation: Evaluation;
  onUpdate: (ev: Evaluation) => void;
}

export function AutoResultsStep({ evaluation, onUpdate }: Props) {
  const [showReportConfig, setShowReportConfig] = useState(false);

  // Run all calculations on mount
  const computedEval = useMemo(() => {
    if (evaluation.agents.length === 0) return evaluation;

    const hierarchyResults = computeHierarchy(evaluation.agents);
    const selected = hierarchyResults.filter(h => h.selected);
    const selectedAgents = evaluation.agents.filter(a =>
      selected.some(s => s.agentId === a.id),
    );

    const inhalationResults = evaluateAllInhalation(selectedAgents);
    const dermalResults = selectedAgents
      .filter(a => a.hasDermalToxicity && a.hasSkinContact)
      .map(a => evaluateDermalRisk(a))
      .filter((r): r is NonNullable<typeof r> => r !== null);
    const alerts = generateAllAlerts(evaluation.agents);

    return {
      ...evaluation,
      hierarchyResults,
      inhalationResults,
      dermalResults,
      alerts,
    };
  }, [evaluation]);

  // Auto-save computed results
  useMemo(() => {
    if (computedEval !== evaluation) {
      onUpdate(computedEval);
    }
  }, [computedEval, evaluation, onUpdate]);

  const { hierarchyResults, inhalationResults, dermalResults, alerts } = computedEval;

  const riskDistribution = {
    low: inhalationResults.filter((r: InhalationResult) => r.riskLevel === 'low').length,
    moderate: inhalationResults.filter((r: InhalationResult) => r.riskLevel === 'moderate').length,
    veryHigh: inhalationResults.filter((r: InhalationResult) => r.riskLevel === 'very_high').length,
  };

  const hasFDS = useMemo(() => {
    return (evaluation.fdsFiles?.length ?? 0) > 0;
  }, [evaluation.fdsFiles]);

  const handleGenerateReport = async (config: ReportConfig) => {
    setShowReportConfig(false);
    await generatePdfReport(computedEval, config);
  };

  if (evaluation.agents.length === 0) {
    return (
      <div className="card p-8 text-center">
        <BarChart3 className="h-10 w-10 text-surface-400 mx-auto mb-3" />
        <p className="font-semibold text-surface-700">Sin datos para calcular</p>
        <p className="text-sm text-surface-500 mt-1">Complete los pasos anteriores primero.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-surface-900">
            📊 Resultados de la Evaluación Automatizada
          </h2>
          <p className="text-sm text-surface-600 mt-1">
            Se han evaluado {evaluation.agents.length} agentes químicos según el método INRS (NTP 937).
          </p>
        </div>
        <button
          onClick={() => setShowReportConfig(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-primary-600 text-white hover:bg-primary-700 shadow-sm transition-colors"
        >
          <Download className="h-4 w-4" /> Descargar PDF
        </button>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="card p-4 bg-red-50 border-red-200">
          <h3 className="font-bold text-sm text-red-800 mb-2">⚠ Alertas ({alerts.length})</h3>
          <div className="space-y-1">
            {alerts.map(alert => (
              <div key={alert.id} className="flex items-start gap-2 text-sm text-red-700">
                <span className="mt-0.5">•</span>
                <span><b>{alert.agentName}:</b> {alert.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="h-5 w-5 text-primary-600" />
            <h3 className="font-bold text-sm text-surface-800">Jerarquización</h3>
          </div>
          <p className="text-2xl font-bold text-surface-900">{hierarchyResults.length}</p>
          <p className="text-xs text-surface-500">agentes evaluados</p>
          <p className="text-xs text-primary-600 mt-1 font-medium">
            {hierarchyResults.filter(h => h.selected).length} seleccionados para evaluación detallada
          </p>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <h3 className="font-bold text-sm text-surface-800">Riesgo Inhalación</h3>
          </div>
          <div className="flex gap-2 mt-2">
            <span className="px-2 py-1 rounded-lg text-xs font-bold bg-green-100 text-green-700">
              {riskDistribution.low} bajo
            </span>
            <span className="px-2 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-700">
              {riskDistribution.moderate} moderado
            </span>
            <span className="px-2 py-1 rounded-lg text-xs font-bold bg-red-100 text-red-700">
              {riskDistribution.veryHigh} alto
            </span>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-3 mb-2">
            <Droplets className="h-5 w-5 text-purple-600" />
            <h3 className="font-bold text-sm text-surface-800">Riesgo Dérmico</h3>
          </div>
          <p className="text-2xl font-bold text-surface-900">{dermalResults.length}</p>
          <p className="text-xs text-surface-500">agentes con exposición dérmica</p>
        </div>
      </div>

      {/* Hierarchy Table */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 bg-surface-100 border-b border-surface-200">
          <h3 className="font-bold text-sm text-surface-700">Tabla de Jerarquización</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-50 text-surface-600 text-xs">
                <th className="text-left px-3 py-2">Agente</th>
                <th className="text-center px-3 py-2">CP</th>
                <th className="text-center px-3 py-2">CC</th>
                <th className="text-center px-3 py-2">CF</th>
                <th className="text-center px-3 py-2">CEP</th>
                <th className="text-center px-3 py-2">CRP</th>
                <th className="text-center px-3 py-2">IPA%</th>
                <th className="text-center px-3 py-2">Prioridad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {hierarchyResults.map(h => (
                <tr key={h.agentId} className="hover:bg-surface-50">
                  <td className="px-3 py-2 font-medium text-surface-800">{h.agentName}</td>
                  <td className="text-center px-3 py-2">{h.dangerClass}</td>
                  <td className="text-center px-3 py-2">{h.quantityClass}</td>
                  <td className="text-center px-3 py-2">{h.frequencyClass}</td>
                  <td className="text-center px-3 py-2">{h.potentialExposureClass}</td>
                  <td className="text-center px-3 py-2">{h.potentialRiskClass}</td>
                  <td className="text-center px-3 py-2 font-bold">{h.ipaPercent.toFixed(1)}</td>
                  <td className="text-center px-3 py-2">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                      h.priority === 'high' ? 'bg-red-100 text-red-700'
                        : h.priority === 'medium' ? 'bg-amber-100 text-amber-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {h.priority === 'high' ? 'ALTA' : h.priority === 'medium' ? 'MEDIA' : 'BAJA'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inhalation Results */}
      {inhalationResults.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-4 py-3 bg-surface-100 border-b border-surface-200">
            <h3 className="font-bold text-sm text-surface-700">Resultados de Inhalación</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-50 text-surface-600 text-xs">
                  <th className="text-left px-3 py-2">Agente</th>
                  <th className="text-center px-3 py-2">PP</th>
                  <th className="text-center px-3 py-2">PV</th>
                  <th className="text-center px-3 py-2">PPr</th>
                  <th className="text-center px-3 py-2">PPC</th>
                  <th className="text-center px-3 py-2">FC</th>
                  <th className="text-center px-3 py-2">PRI</th>
                  <th className="text-center px-3 py-2">Nivel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {inhalationResults.map(r => (
                  <tr key={r.agentId} className="hover:bg-surface-50">
                    <td className="px-3 py-2 font-medium text-surface-800">{r.agentName}</td>
                    <td className="text-center px-3 py-2">{r.dangerScore}</td>
                    <td className="text-center px-3 py-2">{r.volatilityScore}</td>
                    <td className="text-center px-3 py-2">{r.procedureScore}</td>
                    <td className="text-center px-3 py-2">{r.protectionScore}</td>
                    <td className="text-center px-3 py-2">{r.vlaCorrectionFactor}</td>
                    <td className="text-center px-3 py-2 font-bold">{r.riskScore.toFixed(1)}</td>
                    <td className="text-center px-3 py-2">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                        r.riskLevel === 'very_high' ? 'bg-red-100 text-red-700'
                          : r.riskLevel === 'moderate' ? 'bg-amber-100 text-amber-700'
                          : 'bg-green-100 text-green-700'
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
      <ReportConfigModal
        isOpen={showReportConfig}
        onClose={() => setShowReportConfig(false)}
        onConfirm={handleGenerateReport}
        hasFDS={hasFDS}
      />
    </div>
  );
}
