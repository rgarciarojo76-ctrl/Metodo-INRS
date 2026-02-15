import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Evaluation } from '../../types';
import { COLORS, LAYOUT, FONTS } from '../styles';
import { checkPageBreak } from '../core';

export function renderDermal(doc: jsPDF, evaluation: Evaluation) {
  if (evaluation.dermalResults.length === 0) return;

  const { margin } = LAYOUT;
  let y = checkPageBreak(doc, margin, 40);

  // Section Header
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, y - 5, LAYOUT.pageWidth, 12, 'F');
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(FONTS.heading);
  doc.setFont('helvetica', 'bold');
  doc.text('EVALUACIÓN DEL RIESGO DÉRMICO', margin, y + 2);
  doc.setTextColor(...COLORS.text);
  y += 14;

  autoTable(doc, {
    startY: y,
    head: [['Producto', 'PP', 'PS', 'PFD', 'PRD', 'Caracterización']],
    body: evaluation.dermalResults.map(r => [
      r.agentName,
      r.dangerScore.toLocaleString(),
      r.surfaceScore.toString(),
      r.frequencyScore.toString(),
      r.riskScore.toLocaleString(),
      r.characterization,
    ]),
    theme: 'striped',
    headStyles: { fillColor: COLORS.primary, fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      4: { halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: margin, right: margin },
  });
}
