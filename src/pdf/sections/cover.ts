import jsPDF from 'jspdf';
import type { Evaluation } from '../../types';
import { COLORS, LAYOUT, FONTS } from '../styles';

export function renderCover(doc: jsPDF, evaluation: Evaluation) {
  const { pageWidth, contentWidth, margin } = LAYOUT;

  // Blue header bar (custom for cover)
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageWidth, 60, 'F');

  doc.setTextColor(...COLORS.white);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('EVALUACIÓN DE RIESGO QUÍMICO', pageWidth / 2, 28, { align: 'center' });

  doc.setFontSize(FONTS.subtitle);
  doc.setFont('helvetica', 'normal');
  doc.text('Método INRS — NTP 937', pageWidth / 2, 40, { align: 'center' });

  doc.setFontSize(FONTS.body);
  doc.text('Evaluación Simplificada del Riesgo por Inhalación y Contacto Dérmico', pageWidth / 2, 50, { align: 'center' });

  // Company info
  let y = 80;
  doc.setTextColor(...COLORS.text);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(evaluation.project.companyName || 'Empresa no especificada', pageWidth / 2, y, { align: 'center' });

  y += 15;
  doc.setFontSize(FONTS.heading);
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
    doc.setFontSize(FONTS.heading + 1);
    doc.setFont('helvetica', 'bold');
    doc.text('Descripción del proceso', margin, y);
    y += 7;
    doc.setFontSize(FONTS.body);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(evaluation.project.processDescription, contentWidth);
    doc.text(lines, margin, y);
    y += lines.length * 5;
  }

  // Methodology
  y += 15;
  doc.setFontSize(FONTS.heading + 1);
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
}
