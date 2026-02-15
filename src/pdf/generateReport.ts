import jsPDF from 'jspdf';
import type { Evaluation } from '../types';
import { addFooter } from './core';
import { renderCover } from './sections/cover';
import { renderHierarchy } from './sections/hierarchy';
import { renderInhalation } from './sections/inhalation';
import { renderDermal } from './sections/dermal';
import { renderAlerts } from './sections/alerts';

export interface ReportConfig {
  includeFDS: boolean;
  includePareto: boolean; // Not used yet (Always on for now)
}

/**
 * Generate a complete INRS evaluation PDF report.
 * Optionally appends original FDS files.
 */
export async function generatePdfReport(
  evaluation: Evaluation,
  config: ReportConfig = { includeFDS: false, includePareto: true }
): Promise<void> {
  const doc = new jsPDF('p', 'mm', 'a4');

  // 1. Render Sections
  renderCover(doc, evaluation);
  renderHierarchy(doc, evaluation);
  renderInhalation(doc, evaluation);
  renderDermal(doc, evaluation);
  renderAlerts(doc, evaluation);
  
  // 2. Add Footer (Page numbers)
  addFooter(doc, evaluation.project.companyName || '');

  // 3. Handle Output
  const filename = `INRS_${evaluation.project.companyName || 'evaluacion'}_${evaluation.project.evaluationDate || 'sin_fecha'}.pdf`.replace(/\s+/g, '_');

  if (config.includeFDS && evaluation.fdsFiles && evaluation.fdsFiles.length > 0) {
    try {
      await mergeAndDownload(doc, evaluation, filename);
    } catch (error) {
      console.error('Error merging FDS files:', error);
      alert('Hubo un error al adjuntar las FDS originales. Se descargará solo el informe.');
      doc.save(filename);
    }
  } else {
    doc.save(filename);
  }
}

/**
 * Merges the generated report with original FDS files using pdf-lib.
 */
async function mergeAndDownload(reportDoc: jsPDF, evaluation: Evaluation, filename: string) {
  const { PDFDocument } = await import('pdf-lib');

  // Create a new PDF document
  const compositeDoc = await PDFDocument.create();

  // Load the report we just generated
  const reportBytes = reportDoc.output('arraybuffer');
  const reportPdf = await PDFDocument.load(reportBytes);
  
  // Copy all pages from report
  const reportPages = await compositeDoc.copyPages(reportPdf, reportPdf.getPageIndices());
  reportPages.forEach(page => compositeDoc.addPage(page));

  // Append each valid FDS file
  if (evaluation.fdsFiles) {
    for (const f of evaluation.fdsFiles) {
      if (f.status === 'error') continue; // Skip failed files
      
      try {
        const fileBytes = await f.file.arrayBuffer();
        // Load the FDS PDF
        // Note: ignoreEncryption=true attempts to load even if encrypted (if password is empty)
        const fdsPdf = await PDFDocument.load(fileBytes, { ignoreEncryption: true });
        
        // Add a section separator page? Or just append?
        // Let's just append for now. 
        // Ideally we'd add a "Anexo: [Filename]" title page before each, 
        // but let's keep it simple for now as requested.

        const fdsPages = await compositeDoc.copyPages(fdsPdf, fdsPdf.getPageIndices());
        fdsPages.forEach(page => compositeDoc.addPage(page));
      } catch (err) {
        console.warn(`Could not append FDS: ${f.fileName}`, err);
        // Continue to next file
      }
    }
  }

  // Save and trigger download
  const pdfBytes = await compositeDoc.save();
  const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}
