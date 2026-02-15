import jsPDF from 'jspdf';
import { COLORS, LAYOUT, FONTS } from './styles';

export function addHeader(doc: jsPDF, title: string) {
  const { pageWidth, margin } = LAYOUT;
  
  // Blue background
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageWidth, 15, 'F');
  
  // Title
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(FONTS.heading);
  doc.setFont('helvetica', 'bold');
  doc.text(title.toUpperCase(), margin, 10);
  
  // Reset text color
  doc.setTextColor(...COLORS.text);
}

export function addFooter(doc: jsPDF, companyName: string) {
  const totalPages = doc.getNumberOfPages();
  const { pageWidth, pageHeight, margin } = LAYOUT;

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    
    // Separator line
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.1);
    doc.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14);

    // Text
    doc.setFontSize(FONTS.small);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.secondary);
    
    const leftText = `Evaluación Riesgo Químico — Método INRS (NTP 937) — ${companyName}`;
    const rightText = `Página ${i} de ${totalPages}`;
    
    doc.text(leftText, margin, pageHeight - 10);
    doc.text(rightText, pageWidth - margin, pageHeight - 10, { align: 'right' });
  }
}

export function checkPageBreak(doc: jsPDF, y: number, requiredSpace: number): number {
  if (y + requiredSpace > LAYOUT.pageHeight - 20) {
    doc.addPage();
    return LAYOUT.margin + 20; // Expanded top margin for content after header
  }
  return y;
}
