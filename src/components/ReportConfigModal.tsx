import { useState } from 'react';
import { X, FileText, BarChart2, List } from 'lucide-react';

interface ReportConfig {
  includeFDS: boolean;
  includePareto: boolean;
  includeDetails: boolean;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (config: ReportConfig) => void;
  hasFDS: boolean;
}

export function ReportConfigModal({ isOpen, onClose, onConfirm, hasFDS }: Props) {
  const [config, setConfig] = useState<ReportConfig>({
    includeFDS: false,
    includePareto: true,
    includeDetails: true,
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-surface-200 flex items-center justify-between bg-surface-50">
          <h3 className="font-bold text-lg text-surface-900">Configuración del Informe</h3>
          <button onClick={onClose} className="p-1 hover:bg-surface-200 rounded-full text-surface-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-surface-600 mb-4">
            Personalice el contenido del informe PDF que se generará.
          </p>

          <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${config.includePareto ? 'border-primary-500 bg-primary-50' : 'border-surface-200 hover:border-primary-300'}`}>
            <input
              type="checkbox"
              checked={config.includePareto}
              onChange={e => setConfig({ ...config, includePareto: e.target.checked })}
              className="mt-1"
            />
            <div>
              <div className="flex items-center gap-2 font-medium text-surface-900 text-sm">
                <BarChart2 className="w-4 h-4 text-primary-600" />
                Incluir Gráficos
              </div>
              <p className="text-xs text-surface-500">Añade gráfico de Pareto de jerarquización de riesgos.</p>
            </div>
          </label>

          <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${config.includeFDS ? 'border-primary-500 bg-primary-50' : 'border-surface-200 hover:border-primary-300'} ${!hasFDS ? 'opacity-50 pointer-events-none' : ''}`}>
            <input
              type="checkbox"
              checked={config.includeFDS}
              onChange={e => setConfig({ ...config, includeFDS: e.target.checked })}
              className="mt-1"
              disabled={!hasFDS}
            />
            <div>
              <div className="flex items-center gap-2 font-medium text-surface-900 text-sm">
                <FileText className="w-4 h-4 text-primary-600" />
                Adjuntar Fichas de Datos de Seguridad
              </div>
              <p className="text-xs text-surface-500">
                {hasFDS 
                  ? 'Fusiona los archivos PDF originales al final del informe (puede aumentar el tamaño).' 
                  : 'No hay archivos FDS cargados en esta evaluación.'}
              </p>
            </div>
          </label>

          <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${config.includeDetails ? 'border-primary-500 bg-primary-50' : 'border-surface-200 hover:border-primary-300'}`}>
            <input
              type="checkbox"
              checked={config.includeDetails}
              onChange={e => setConfig({ ...config, includeDetails: e.target.checked })}
              className="mt-1"
            />
            <div>
              <div className="flex items-center gap-2 font-medium text-surface-900 text-sm">
                <List className="w-4 h-4 text-primary-600" />
                Detles de cálculo
              </div>
              <p className="text-xs text-surface-500">Muestra tablas detalladas de puntuación para cada agente.</p>
            </div>
          </label>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-surface-50 flex justify-end gap-3 border-t border-surface-200">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-surface-600 hover:text-surface-800 transition-colors">
            Cancelar
          </button>
          <button 
            onClick={() => onConfirm(config)}
            className="px-4 py-2 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 shadow-sm transition-all"
          >
            Generar PDF
          </button>
        </div>
      </div>
    </div>
  );
}
