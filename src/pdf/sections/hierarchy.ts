import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Evaluation } from '../../types';
import { COLORS, LAYOUT } from '../styles';
import { addHeader } from '../core';

export function renderHierarchy(doc: jsPDF, evaluation: Evaluation) {
  if (evaluation.hierarchyResults.length === 0) return;

  doc.addPage();
  addHeader(doc, 'JERARQUIZACIÓN DE RIESGOS POTENCIALES');

  let y = 30; // 15 header + margin
  const margin = LAYOUT.margin;

  // Chart (Vector drawing)
  y = renderParetoChart(doc, evaluation, y);

  y += 10;

  autoTable(doc, {
    startY: y,
    head: [['Producto', 'CP', 'CC', 'CF', 'CEP', 'CRP', 'PRP', 'IPA %', 'Prioridad']],
    body: evaluation.hierarchyResults.map(r => [
      r.agentName,
      r.dangerClass.toString(),
      r.quantityClass.toString(),
      r.frequencyClass.toString(),
      r.potentialExposureClass.toString(),
      r.potentialRiskClass.toString(),
      r.riskScore.toLocaleString(),
      r.ipaPercent.toFixed(1) + '%',
      r.priority === 'high' ? 'FUERTE' : r.priority === 'medium' ? 'MEDIA' : 'BAJA',
    ]),
    theme: 'striped',
    headStyles: { fillColor: COLORS.primary, fontSize: 8, font: 'helvetica' },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 35 },
      6: { halign: 'right', fontStyle: 'bold' },
      7: { halign: 'right' },
      8: { halign: 'center' },
    },
    margin: { left: margin, right: margin },
  });
}

/**
 * Renders a simple Pareto bar chart using vector graphics.
 */
function renderParetoChart(doc: jsPDF, evaluation: Evaluation, startY: number): number {
  const { contentWidth, margin } = LAYOUT;
  const height = 60;
  const chartY = startY;
  
  // Sort data desc by risk score
  const data = [...evaluation.hierarchyResults].sort((a, b) => b.riskScore - a.riskScore).slice(0, 10);
  if(data.length === 0) return startY;

  const maxScore = Math.max(...data.map(d => d.riskScore));
  const barWidth = (contentWidth - 20) / data.length; // Spacing logic
  const maxBarHeight = 50;
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Gráfico de Pareto (Riesgo Potencial)', margin, chartY - 5);

  // Axis lines
  doc.setDrawColor(...COLORS.border);
  doc.line(margin, chartY + maxBarHeight, margin + contentWidth, chartY + maxBarHeight); // X axis
  doc.line(margin, chartY, margin, chartY + maxBarHeight); // Y axis

  // Bars
  data.forEach((item, i) => {
    const barH = (item.riskScore / maxScore) * maxBarHeight;
    const x = margin + 10 + (i * barWidth);
    const y = chartY + maxBarHeight - barH;
    
    // Choose color based on priority
    let color = COLORS.success;
    if (item.riskScore >= 1000) color = COLORS.danger;
    else if (item.riskScore >= 100) color = COLORS.warning;

    doc.setFillColor(...color);
    doc.rect(x, y, barWidth * 0.6, barH, 'F');

    // Label (truncated)
    doc.setFontSize(6);
    doc.setTextColor(...COLORS.secondary);
    const label = item.agentName.length > 8 ? item.agentName.substring(0, 6) + '..' : item.agentName;
    doc.text(label, x + (barWidth * 0.3), chartY + maxBarHeight + 4, { align: 'center' });
  });

  return chartY + height;
}
