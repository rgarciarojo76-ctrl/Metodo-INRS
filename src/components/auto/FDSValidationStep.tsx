import { useState, useCallback } from 'react';
import { CheckCircle, Edit3, ChevronLeft, ChevronRight, AlertTriangle, Search } from 'lucide-react';
import type { Evaluation, ExtractedAgentData, FieldConfidence } from '../../types';

// ─── Confidence Badge ────────────────────────────────────

function ConfidenceBadge({ field }: { field: FieldConfidence }) {
  const config = {
    high:      { bg: 'bg-green-100', text: 'text-green-700', icon: '🟢', label: 'ALTA' },
    medium:    { bg: 'bg-amber-100', text: 'text-amber-700', icon: '🟡', label: 'MEDIA' },
    low:       { bg: 'bg-red-100', text: 'text-red-700', icon: '🔴', label: 'BAJA' },
    not_found: { bg: 'bg-surface-100', text: 'text-surface-500', icon: '❌', label: 'NO ENCONTRADO' },
  }[field.level];

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {config.icon} {config.label} {field.confidence > 0 ? `${field.confidence}%` : ''}
    </span>
  );
}

// ─── Display Value ───────────────────────────────────────

function displayValue(field: FieldConfidence): string {
  if (field.value === null || field.value === undefined) return '—';
  if (typeof field.value === 'boolean') return field.value ? 'Sí' : 'No';
  if (Array.isArray(field.value)) return field.value.length > 0 ? field.value.join(', ') : '—';
  return String(field.value);
}

// ─── Field Labels ────────────────────────────────────────

const FIELD_LABELS: Record<string, string> = {
  commercialName: 'Nombre comercial',
  substanceName: 'Nombre químico',
  casNumber: 'Nº CAS',
  physicalState: 'Estado físico',
  hPhrases: 'Frases H (CLP)',
  rPhrases: 'Frases R',
  vlaED: 'VLA-ED (mg/m³)',
  vlaEC: 'VLA-EC (mg/m³)',
  boilingPoint: 'Punto de ebullición (°C)',
  vaporPressure: 'Presión de vapor (kPa)',
  hasFIV: 'Notación FIV',
  hasDermalToxicity: 'Toxicidad dérmica',
  solidForm: 'Forma física (sólidos)',
};

const FIELD_KEYS = Object.keys(FIELD_LABELS) as (keyof typeof FIELD_LABELS)[];

// ─── Component ───────────────────────────────────────────

interface Props {
  evaluation: Evaluation;
  onUpdate: (ev: Evaluation) => void;
}

export function FDSValidationStep({ evaluation, onUpdate }: Props) {
  const data = evaluation.extractedData ?? [];
  const [currentIdx, setCurrentIdx] = useState(0);
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const current = data[currentIdx] as ExtractedAgentData | undefined;
  if (!current) {
    return (
      <div className="card p-8 text-center">
        <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto mb-3" />
        <p className="font-semibold text-surface-700">No hay datos extraídos para validar</p>
        <p className="text-sm text-surface-500 mt-1">Vuelva al paso anterior y cargue FDS.</p>
      </div>
    );
  }

  const confirmedCount = data.filter(d => d.validated).length;
  const progress = Math.round((confirmedCount / data.length) * 100);

  // Edit logic
  const startEdit = (fieldKey: string) => {
    const field = current[fieldKey as keyof ExtractedAgentData] as FieldConfidence;
    setEditing(fieldKey);
    setEditValue(displayValue(field));
  };

  const saveEdit = useCallback(() => {
    if (!editing) return;
    const updated = [...data];
    const agent = { ...updated[currentIdx] };
    const field = { ...(agent[editing as keyof ExtractedAgentData] as FieldConfidence) };

    // Parse value based on field type
    if (['vlaED', 'vlaEC', 'boilingPoint', 'vaporPressure'].includes(editing)) {
      field.value = parseFloat(editValue.replace(',', '.')) || null;
    } else if (['hasFIV', 'hasDermalToxicity'].includes(editing)) {
      field.value = editValue.toLowerCase() === 'sí' || editValue.toLowerCase() === 'si' || editValue === 'true';
    } else if (['hPhrases', 'rPhrases'].includes(editing)) {
      field.value = editValue.split(',').map(s => s.trim()).filter(Boolean);
    } else {
      field.value = editValue;
    }

    field.confidence = 100;
    field.level = 'high';
    (agent as Record<string, unknown>)[editing] = field;
    updated[currentIdx] = agent;

    onUpdate({
      ...evaluation,
      extractedData: updated,
      updatedAt: new Date().toISOString(),
    });
    setEditing(null);
  }, [editing, editValue, data, currentIdx, evaluation, onUpdate]);

  const confirmProduct = useCallback(() => {
    const updated = [...data];
    updated[currentIdx] = { ...updated[currentIdx], validated: true };
    onUpdate({
      ...evaluation,
      extractedData: updated,
      updatedAt: new Date().toISOString(),
    });
  }, [data, currentIdx, evaluation, onUpdate]);

  const validateAll = useCallback(() => {
    const updated = data.map(d => ({ ...d, validated: true }));
    onUpdate({
      ...evaluation,
      extractedData: updated,
      autoStep: 4 as const,
      updatedAt: new Date().toISOString(),
    });
  }, [data, evaluation, onUpdate]);

  const hasLowConfidence = FIELD_KEYS.some(k => {
    const f = current[k as keyof ExtractedAgentData] as FieldConfidence | undefined;
    return f && (f.level === 'low' || f.level === 'not_found');
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-surface-900">
            ✅ Validación de Datos Extraídos de FDS
          </h2>
          <p className="text-sm text-surface-600 mt-1">
            Se han procesado {data.length} FDS. Revise y confirme los datos extraídos.
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-surface-500 mb-1">{confirmedCount}/{data.length} confirmados</div>
          <div className="w-32 h-2 bg-surface-200 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      {/* Product Navigation */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
          disabled={currentIdx === 0}
          className="p-2 rounded-lg hover:bg-surface-100 disabled:opacity-30"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex-1 text-center">
          <span className="text-sm text-surface-500">Producto {currentIdx + 1} de {data.length}:</span>
          <h3 className="font-bold text-lg text-surface-900">
            {displayValue(current.commercialName) !== '—'
              ? displayValue(current.commercialName)
              : current.fileName.replace(/\.pdf$/i, '').replace(/^FDS_/i, '')}
          </h3>
        </div>
        <button
          onClick={() => setCurrentIdx(Math.min(data.length - 1, currentIdx + 1))}
          disabled={currentIdx === data.length - 1}
          className="p-2 rounded-lg hover:bg-surface-100 disabled:opacity-30"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Low confidence warning */}
      {hasLowConfidence && (
        <div className="card p-3 bg-amber-50 border-amber-200 flex items-start gap-2">
          <Search className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-700">
            Algunos campos tienen confianza baja o no se encontraron. Revíselos y edítelos manualmente si es necesario.
          </p>
        </div>
      )}

      {/* Data Table */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-100 text-surface-600">
              <th className="text-left px-4 py-2.5 font-semibold">Campo</th>
              <th className="text-left px-4 py-2.5 font-semibold">Valor extraído</th>
              <th className="text-center px-4 py-2.5 font-semibold">Confianza</th>
              <th className="text-center px-4 py-2.5 font-semibold w-20">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100">
            {FIELD_KEYS.map(key => {
              const field = current[key as keyof ExtractedAgentData] as FieldConfidence | undefined;
              if (!field) return null;
              const isEditing = editing === key;

              return (
                <tr key={key} className={`hover:bg-surface-50 ${field.level === 'low' || field.level === 'not_found' ? 'bg-red-50/30' : ''}`}>
                  <td className="px-4 py-2.5 font-medium text-surface-700">{FIELD_LABELS[key]}</td>
                  <td className="px-4 py-2.5">
                    {isEditing ? (
                      <div className="flex gap-2">
                        <input
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && saveEdit()}
                          className="flex-1 px-2 py-1 border border-primary-400 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                          autoFocus
                        />
                        <button onClick={saveEdit} className="px-2 py-1 bg-primary-600 text-white rounded text-xs">OK</button>
                        <button onClick={() => setEditing(null)} className="px-2 py-1 bg-surface-200 rounded text-xs">✕</button>
                      </div>
                    ) : (
                      <span className={field.level === 'not_found' ? 'text-surface-400 italic' : 'text-surface-800'}>
                        {displayValue(field)}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <ConfidenceBadge field={field} />
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    {!isEditing && (
                      <button
                        onClick={() => startEdit(key)}
                        className="p-1.5 rounded hover:bg-surface-200 text-surface-500 hover:text-primary-600"
                        title="Editar"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}

            {/* Danger class row */}
            {current.dangerClass !== undefined && (
              <tr className="bg-primary-50/50">
                <td className="px-4 py-2.5 font-bold text-primary-800">Clase de Peligro (auto)</td>
                <td className="px-4 py-2.5 font-bold text-primary-800">
                  {current.dangerClass} (CP = {current.dangerScore})
                </td>
                <td className="px-4 py-2.5 text-center">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    🟢 AUTO
                  </span>
                </td>
                <td />
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={confirmProduct}
            disabled={current.validated}
            className={`
              inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all
              ${current.validated
                ? 'bg-green-100 text-green-700 cursor-default'
                : 'bg-green-600 text-white hover:bg-green-700'}
            `}
          >
            <CheckCircle className="h-4 w-4" />
            {current.validated ? 'Confirmado' : 'Confirmar datos'}
          </button>
          {currentIdx < data.length - 1 && (
            <button
              onClick={() => setCurrentIdx(currentIdx + 1)}
              className="inline-flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium text-primary-600 hover:bg-primary-50"
            >
              Siguiente producto <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>

        <button
          onClick={validateAll}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-primary-600 text-white hover:bg-primary-700 shadow-sm"
        >
          Validar todos ▶
        </button>
      </div>
    </div>
  );
}
