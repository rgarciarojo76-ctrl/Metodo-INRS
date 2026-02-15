import jsPDF from 'jspdf';
import type { Evaluation } from '../../types';
import { COLORS, LAYOUT, FONTS } from '../styles';
import { checkPageBreak } from '../core';

export function renderAlerts(doc: jsPDF, evaluation: Evaluation) {
  if (evaluation.alerts.length === 0) return;

  const { margin, contentWidth } = LAYOUT;
  let y = checkPageBreak(doc, margin, 40);

  doc.setFontSize(FONTS.heading);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.danger);
  doc.text('ALERTAS Y OBSERVACIONES', margin, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(FONTS.body);
  doc.setTextColor(...COLORS.text);

  for (const alert of evaluation.alerts) {
    y = checkPageBreak(doc, y, 20);
    
    doc.setFont('helvetica', 'bold');
    doc.text(`${alert.title} — ${alert.agentName}`, margin, y);
    y += 4;
    
    doc.setFont('helvetica', 'normal');
    const alertLines = doc.splitTextToSize(alert.message, contentWidth);
    doc.text(alertLines, margin, y);
    y += alertLines.length * 4 + 4;
  }
}
