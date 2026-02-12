import { useState, useCallback, useRef } from 'react';
import { Upload, FileText, Eye, Trash2, AlertTriangle, CheckCircle, Loader2, XCircle } from 'lucide-react';
import type { FDSFile, FDSStatus, Evaluation } from '../../types';
import { identifySections, extractFromFDS } from '../../engine/fdsExtractor';

// ─── PDF Text Extraction (pdf.js) ────────────────────────

async function extractTextFromPDF(file: File): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((item: unknown) => (item as { str: string }).str)
      .join(' ');
    pages.push(text);
  }

  return pages.join('\n\n');
}

// ─── Date Detection ──────────────────────────────────────

function detectFDSAge(text: string): { isOld: boolean; dateFound?: string } {
  const datePatterns = [
    /(?:fecha\s+de\s+revisi[óo]n|revision\s+date|date\s+of\s+revision)\s*[:\-–]?\s*(\d{1,2}[\/.]\d{1,2}[\/.]\d{2,4})/i,
    /(?:versi[óo]n|version)\s*[:\-]?\s*\d+\s*[,\-\s]+(\d{1,2}[\/.]\d{1,2}[\/.]\d{2,4})/i,
    /(\d{1,2}[\/.]\d{1,2}[\/.](20\d{2}))/,
  ];

  for (const p of datePatterns) {
    const m = text.match(p);
    if (m) {
      const dateStr = m[1];
      // Try to parse: extract year
      const yearMatch = dateStr.match(/(20\d{2})/);
      if (yearMatch) {
        const year = parseInt(yearMatch[1]);
        const currentYear = new Date().getFullYear();
        return {
          isOld: currentYear - year > 3,
          dateFound: dateStr,
        };
      }
    }
  }
  return { isOld: false };
}

// ─── Helpers ─────────────────────────────────────────────

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_FILES = 50;

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const STATUS_CONFIG: Record<FDSStatus, { icon: typeof CheckCircle; color: string; label: string }> = {
  pending: { icon: Loader2, color: 'text-blue-500', label: 'Procesando...' },
  ok: { icon: CheckCircle, color: 'text-green-600', label: '✓ OK' },
  old: { icon: AlertTriangle, color: 'text-amber-500', label: '⚠ Antigua' },
  error: { icon: XCircle, color: 'text-red-500', label: '✗ Error' },
};

// ─── Component ───────────────────────────────────────────

interface Props {
  evaluation: Evaluation;
  onUpdate: (ev: Evaluation) => void;
}

export function FDSUploadStep({ evaluation, onUpdate }: Props) {
  const [files, setFiles] = useState<FDSFile[]>(evaluation.fdsFiles ?? []);
  const [processing, setProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback(async (newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);

    // Validate
    const validFiles: File[] = [];
    for (const f of fileArray) {
      if (!f.name.toLowerCase().endsWith('.pdf')) continue;
      if (f.size > MAX_FILE_SIZE) continue;
      if (files.length + validFiles.length >= MAX_FILES) break;
      validFiles.push(f);
    }

    if (validFiles.length === 0) return;

    // Create pending entries
    const pending: FDSFile[] = validFiles.map(f => ({
      id: crypto.randomUUID(),
      fileName: f.name,
      fileSize: f.size,
      file: f,
      status: 'pending' as FDSStatus,
      addedAt: new Date().toISOString(),
    }));

    const updated = [...files, ...pending];
    setFiles(updated);
    setProcessing(true);

    // Process each file
    const processed: FDSFile[] = [...files];
    for (const entry of pending) {
      try {
        const text = await extractTextFromPDF(entry.file);
        const age = detectFDSAge(text);
        const sections = identifySections(text);

        processed.push({
          ...entry,
          extractedText: text,
          sections,
          status: age.isOld ? 'old' : 'ok',
          statusMessage: age.isOld
            ? `FDS antigua (${age.dateFound}), se recomienda actualizar`
            : undefined,
        });
      } catch {
        processed.push({
          ...entry,
          status: 'error',
          statusMessage: 'Error al leer el PDF. Verifique que no esté corrupto.',
        });
      }
      setFiles([...processed]);
    }

    setProcessing(false);
    onUpdate({
      ...evaluation,
      fdsFiles: processed,
      updatedAt: new Date().toISOString(),
    });
  }, [files, evaluation, onUpdate]);

  const removeFile = useCallback((id: string) => {
    const updated = files.filter(f => f.id !== id);
    setFiles(updated);
    onUpdate({ ...evaluation, fdsFiles: updated, updatedAt: new Date().toISOString() });
  }, [files, evaluation, onUpdate]);

  const previewFile = useCallback((file: FDSFile) => {
    const url = URL.createObjectURL(file.file);
    window.open(url, '_blank');
  }, []);

  const processAllFDS = useCallback(() => {
    const readyFiles = files.filter(f => f.status === 'ok' || f.status === 'old');
    const extracted = readyFiles.map(f => {
      const sections = f.sections ?? identifySections(f.extractedText ?? '');
      return extractFromFDS(f.id, f.fileName, sections);
    });
    onUpdate({
      ...evaluation,
      fdsFiles: files,
      extractedData: extracted,
      autoStep: 3 as const,
      updatedAt: new Date().toISOString(),
    });
  }, [files, evaluation, onUpdate]);

  const readyCount = files.filter(f => f.status === 'ok' || f.status === 'old').length;

  // Drag handlers
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragActive(true); };
  const handleDragLeave = () => setDragActive(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    addFiles(e.dataTransfer.files);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-surface-900">
          📋 Carga de Fichas de Datos de Seguridad (FDS)
        </h2>
        <p className="text-sm text-surface-600 mt-1">
          Suba las FDS de los productos químicos a evaluar en formato PDF. El sistema extraerá
          automáticamente los datos necesarios para la evaluación INRS.
        </p>
      </div>

      {/* Instructions */}
      <div className="card p-4 bg-blue-50 border-blue-200">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-blue-800">
          <div>📄 Formato: <b>PDF</b></div>
          <div>📦 Máx. archivo: <b>10 MB</b></div>
          <div>📋 Máx. FDS: <b>50</b></div>
          <div>🕐 FDS actualizadas: <b>&lt; 3 años</b></div>
        </div>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
          transition-all duration-200
          ${dragActive
            ? 'border-primary-500 bg-primary-50 scale-[1.01]'
            : 'border-surface-300 bg-surface-50 hover:border-primary-400 hover:bg-primary-50/50'}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          multiple
          onChange={e => e.target.files && addFiles(e.target.files)}
          className="hidden"
        />
        <Upload className={`h-10 w-10 mx-auto mb-3 ${dragActive ? 'text-primary-500' : 'text-surface-400'}`} />
        <p className="font-semibold text-surface-700">
          {dragActive ? 'Suelte los archivos aquí' : 'Arrastre archivos FDS aquí o pulse para seleccionar'}
        </p>
        <p className="text-xs text-surface-500 mt-1">Selección múltiple habilitada</p>
      </div>

      {/* File Table */}
      {files.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-4 py-3 bg-surface-100 border-b border-surface-200 flex items-center justify-between">
            <span className="font-semibold text-sm text-surface-700">
              Archivos cargados ({files.length})
            </span>
            {processing && (
              <span className="text-xs text-blue-600 flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" /> Procesando...
              </span>
            )}
          </div>

          <div className="divide-y divide-surface-100">
            {files.map((f, idx) => {
              const cfg = STATUS_CONFIG[f.status];
              const Icon = cfg.icon;
              return (
                <div key={f.id} className="px-4 py-3 flex items-center gap-3 hover:bg-surface-50 text-sm">
                  <span className="w-6 text-surface-400 text-xs font-mono">{idx + 1}</span>
                  <FileText className="h-4 w-4 text-surface-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium text-surface-800">{f.fileName}</p>
                    {f.statusMessage && (
                      <p className="text-xs text-amber-600 mt-0.5">{f.statusMessage}</p>
                    )}
                  </div>
                  <span className="text-xs text-surface-500 shrink-0">{formatSize(f.fileSize)}</span>
                  <span className={`flex items-center gap-1 text-xs font-medium shrink-0 ${cfg.color}`}>
                    <Icon className={`h-3.5 w-3.5 ${f.status === 'pending' ? 'animate-spin' : ''}`} />
                    {cfg.label}
                  </span>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); previewFile(f); }}
                      className="p-1.5 rounded hover:bg-surface-200 text-surface-500"
                      title="Vista previa"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeFile(f.id); }}
                      className="p-1.5 rounded hover:bg-red-100 text-surface-500 hover:text-red-600"
                      title="Eliminar"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="px-4 py-2 bg-surface-50 border-t border-surface-200 flex gap-4 text-xs text-surface-500">
            <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-green-600" /> OK — válida</span>
            <span className="flex items-center gap-1"><AlertTriangle className="h-3 w-3 text-amber-500" /> Antigua (&gt;3 años)</span>
            <span className="flex items-center gap-1"><XCircle className="h-3 w-3 text-red-500" /> Error lectura</span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => inputRef.current?.click()}
          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          + Añadir más FDS
        </button>
        <button
          onClick={processAllFDS}
          disabled={readyCount === 0 || processing}
          className={`
            inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold text-sm
            transition-all
            ${readyCount > 0 && !processing
              ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-sm'
              : 'bg-surface-200 text-surface-400 cursor-not-allowed'}
          `}
        >
          {processing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Procesando…
            </>
          ) : (
            <>▶ Procesar {readyCount} FDS</>
          )}
        </button>
      </div>
    </div>
  );
}
