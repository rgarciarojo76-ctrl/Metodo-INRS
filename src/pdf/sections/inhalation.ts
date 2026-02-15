import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Evaluation } from '../../types';
import { COLORS, LAYOUT, FONTS } from '../styles';
import { checkPageBreak } from '../core';

export function renderInhalation(doc: jsPDF, evaluation: Evaluation) {
  if (evaluation.inhalationResults.length === 0) return;

  const { margin, contentWidth } = LAYOUT;
  let y = checkPageBreak(doc, margin, 40);

  // Section Header
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, y - 5, LAYOUT.pageWidth, 12, 'F');
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(FONTS.heading);
  doc.setFont('helvetica', 'bold');
  doc.text('EVALUACIÓN DEL RIESGO POR INHALACIÓN', margin, y + 2);
  doc.setTextColor(...COLORS.text);
  y += 14;

  for (const r of evaluation.inhalationResults) {
    y = checkPageBreak(doc, y, 60);

    doc.setFontSize(FONTS.heading);
    doc.setFont('helvetica', 'bold');
    doc.text(r.agentName, margin, y);
    y += 6;

    autoTable(doc, {
      startY: y,
      head: [['Variable', 'Clase', 'Puntuación']],
      body: [
        ['Peligro (PP)', r.dangerClass.toString(), r.dangerScore.toLocaleString()],
        ['Volatilidad (PV)', r.volatilityClass.toString(), r.volatilityScore.toString()],
        ['Procedimiento (PPr)', r.procedureClass.toString(), r.procedureScore.toString()],
        ['Protección Colectiva (PPC)', r.protectionClass.toString(), r.protectionScore.toString()],
        ['Factor Corrección VLA', '—', r.vlaCorrectionFactor.toString()],
        ['RIESGO INHALACIÓN (PRI)', '—', r.riskScore.toLocaleString()],
      ],
      theme: 'grid',
      headStyles: { fillColor: COLORS.primary, fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      didParseCell: (data) => {
        if (data.row.index === 5) {
          data.cell.styles.fontStyle = 'bold';
          if (r.riskScore > 1000) data.cell.styles.textColor = COLORS.danger;
          else if (r.riskScore > 100) data.cell.styles.textColor = COLORS.warning;
          else data.cell.styles.textColor = COLORS.success;
        }
      },
      margin: { left: margin, right: margin },
    });

    // Update Y after table
    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5;

    // Characterization
    doc.setFontSize(FONTS.body);
    doc.setFont('helvetica', 'bold');
    
    if (r.riskScore > 1000) doc.setTextColor(...COLORS.danger);
    else if (r.riskScore > 100) doc.setTextColor(...COLORS.warning);
    else doc.setTextColor(...COLORS.success);

    doc.text(`Prioridad ${r.priorityAction} — ${r.characterization}`, margin, y);
    y += 5;

    // Recommendation
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(FONTS.small + 1);
    doc.setTextColor(...COLORS.secondary);
    const recLines = doc.splitTextToSize(r.recommendation, contentWidth);
    doc.text(recLines, margin, y);
    y += recLines.length * 4 + 10;
    
    doc.setTextColor(...COLORS.text);
  }
}
