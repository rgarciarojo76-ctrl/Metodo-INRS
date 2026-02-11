import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Evaluation } from '../types';

/**
 * Generate a complete INRS evaluation PDF report.
 */
export async function generatePdfReport(evaluation: Evaluation): Promise<void> {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const addNewPageIfNeeded = (requiredSpace: number) => {
    if (y + requiredSpace > doc.internal.pageSize.getHeight() - 25) {
      doc.addPage();
      y = margin;
    }
  };

  // ─── Cover Page ────────────────────────────────────

  // Blue header bar
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, pageWidth, 60, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('EVALUACIÓN DE RIESGO QUÍMICO', pageWidth / 2, 28, { align: 'center' });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Método INRS — NTP 937', pageWidth / 2, 40, { align: 'center' });

  doc.setFontSize(9);
  doc.text('Evaluación Simplificada del Riesgo por Inhalación y Contacto Dérmico', pageWidth / 2, 50, { align: 'center' });

  // Company info
  y = 80;
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(evaluation.project.companyName || 'Empresa no especificada', pageWidth / 2, y, { align: 'center' });

  y += 15;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const infoLines = [
    `Centro de trabajo: ${evaluation.project.workCenter || '—'}`,
    `Área / Línea: ${evaluation.project.area || '—'}`,
    `Fecha de evaluación: ${evaluation.project.evaluationDate || '—'}`,
    `Técnico evaluador: ${evaluation.project.evaluatorName || '—'}`,
    `Titulación: ${evaluation.project.evaluatorTitle || '—'}`,
  ];
  for (const line of infoLines) {
    doc.text(line, pageWidth / 2, y, { align: 'center' });
    y += 7;
  }

  // Process description
  if (evaluation.project.processDescription) {
    y += 10;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Descripción del proceso', margin, y);
    y += 7;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(evaluation.project.processDescription, contentWidth);
    doc.text(lines, margin, y);
    y += lines.length * 5;
  }

  // Methodology
  y += 15;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Metodología aplicada', margin, y);
  y += 7;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const methLines = [
    'Método INRS (Institut National de Recherche et de Sécurité) según NTP 937 y documento ND 2233-200-05.',
    'Evaluación cualitativa y simplificada conforme al RD 374/2001.',
    'Normativa CLP: Reglamento (CE) 1272/2008.',
  ];
  for (const line of methLines) {
    doc.text(line, margin, y);
    y += 5;
  }

  // ─── Page 2: Hierarchy ───────────────────────────────

  doc.addPage();
  y = margin;

  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, pageWidth, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('JERARQUIZACIÓN DE RIESGOS POTENCIALES', margin, 8);
  doc.setTextColor(15, 23, 42);
  y = 20;

  if (evaluation.hierarchyResults.length > 0) {
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
      headStyles: { fillColor: [37, 99, 235], fontSize: 8, font: 'helvetica' },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 35 },
        6: { halign: 'right', fontStyle: 'bold' },
        7: { halign: 'right' },
        8: { halign: 'center' },
      },
      margin: { left: margin, right: margin },
    });

    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }

  // ─── Inhalation Results ──────────────────────────────

  if (evaluation.inhalationResults.length > 0) {
    addNewPageIfNeeded(40);

    doc.setFillColor(37, 99, 235);
    doc.rect(0, y - 5, pageWidth, 12, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('EVALUACIÓN DEL RIESGO POR INHALACIÓN', margin, y + 2);
    doc.setTextColor(15, 23, 42);
    y += 14;

    for (const r of evaluation.inhalationResults) {
      addNewPageIfNeeded(60);

      doc.setFontSize(10);
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
        headStyles: { fillColor: [37, 99, 235], fontSize: 8 },
        bodyStyles: { fontSize: 8 },
        didParseCell: (data) => {
          // Bold last row
          if (data.row.index === 5) {
            data.cell.styles.fontStyle = 'bold';
            if (r.riskScore > 1000) {
              data.cell.styles.textColor = [185, 28, 28];
            } else if (r.riskScore > 100) {
              data.cell.styles.textColor = [217, 119, 6];
            } else {
              data.cell.styles.textColor = [22, 163, 106];
            }
          }
        },
        margin: { left: margin, right: margin },
      });

      y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5;

      // Characterization
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      if (r.riskScore > 1000) doc.setTextColor(185, 28, 28);
      else if (r.riskScore > 100) doc.setTextColor(217, 119, 6);
      else doc.setTextColor(22, 163, 106);

      doc.text(`Prioridad ${r.priorityAction} — ${r.characterization}`, margin, y);
      y += 5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      const recLines = doc.splitTextToSize(r.recommendation, contentWidth);
      doc.text(recLines, margin, y);
      y += recLines.length * 4 + 10;

      doc.setTextColor(15, 23, 42);
    }
  }

  // ─── Dermal Results ──────────────────────────────────

  if (evaluation.dermalResults.length > 0) {
    addNewPageIfNeeded(40);

    doc.setFillColor(37, 99, 235);
    doc.rect(0, y - 5, pageWidth, 12, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('EVALUACIÓN DEL RIESGO DÉRMICO', margin, y + 2);
    doc.setTextColor(15, 23, 42);
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
      headStyles: { fillColor: [37, 99, 235], fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        4: { halign: 'right', fontStyle: 'bold' },
      },
      margin: { left: margin, right: margin },
    });

    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }

  // ─── Alerts ───────────────────────────────────────────

  if (evaluation.alerts.length > 0) {
    addNewPageIfNeeded(30);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(185, 28, 28);
    doc.text('ALERTAS Y OBSERVACIONES', margin, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);

    for (const alert of evaluation.alerts) {
      addNewPageIfNeeded(15);
      doc.setFont('helvetica', 'bold');
      doc.text(`${alert.title} — ${alert.agentName}`, margin, y);
      y += 4;
      doc.setFont('helvetica', 'normal');
      const alertLines = doc.splitTextToSize(alert.message, contentWidth);
      doc.text(alertLines, margin, y);
      y += alertLines.length * 4 + 4;
    }
  }

  // ─── Footer on all pages ──────────────────────────────

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const pageH = doc.internal.pageSize.getHeight();
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(`Evaluación Riesgo Químico — Método INRS (NTP 937) — ${evaluation.project.companyName}`, margin, pageH - 10);
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, pageH - 10, { align: 'right' });
    // Separator line
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageH - 14, pageWidth - margin, pageH - 14);
  }

  // ─── Save ─────────────────────────────────────────────

  const filename = `INRS_${evaluation.project.companyName || 'evaluacion'}_${evaluation.project.evaluationDate || 'sin_fecha'}.pdf`;
  doc.save(filename.replace(/\s+/g, '_'));
}
