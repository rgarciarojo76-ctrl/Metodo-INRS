import { useEffect, useState } from 'react';
import { Plus, Search, FlaskConical, Calendar, Building2, Trash2, AlertTriangle, ChevronRight, Sparkles } from 'lucide-react';
import type { Evaluation } from '../types';
import { db } from '../db';

interface Props {
  onNewEvaluation: (mode?: 'manual' | 'auto') => void;
  onLoadEvaluation: (evaluation: Evaluation) => void;
}

export function Dashboard({ onNewEvaluation, onLoadEvaluation }: Props) {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const loadEvaluations = async () => {
    const all = await db.evaluations.reverse().sortBy('updatedAt');
    setEvaluations(all);
  };

  useEffect(() => { loadEvaluations(); }, []);

  const handleDelete = async (id: number | undefined, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!id) return;
    if (confirm('¿Eliminar esta evaluación?')) {
      await db.evaluations.delete(id);
      loadEvaluations();
    }
  };

  const filtered = evaluations.filter(ev =>
    ev.project.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ev.project.area.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      {/* corporate header */}
      <header className="bg-white border-b border-[var(--color-border)] sticky top-0 z-50 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col sm:grid sm:grid-cols-3 gap-2 sm:gap-0 items-center">
          {/* Left: Branding */}
          <div className="flex items-center gap-3 justify-start">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)] flex items-center justify-center">
              <FlaskConical className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col leading-tight">
               <span className="text-[var(--color-primary)] font-bold text-sm tracking-wide">DIRECCIÓN TÉCNICA IA LAB</span>
               <span className="text-[var(--color-text-main)] text-xs">Método INRS</span>
            </div>
          </div>

          {/* Center: Warning Pill */}
          <div className="flex justify-center">
             <div className="status-disclaimer">
                <AlertTriangle className="disclaimer-icon w-4 h-4" />
                <div className="flex items-baseline gap-1">
                   <span className="disclaimer-title">AVISO:</span>
                   <span className="disclaimer-body">Apoyo técnico. Validar por técnico.</span>
                </div>
             </div>
          </div>

          {/* Right: Actions */}
          <div className="flex justify-end">
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12 space-y-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-text-main)]">
            Identificación de productos químicos cancerígenos
          </h1>
          <p className="text-[var(--color-text-light)] max-w-2xl mx-auto text-lg">
            Asistente virtual para la identificación y valoración de Agentes Cancerígenos, 
            Mutágenos y Reprotóxicos según metodología INRS y normativa vigente.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => onNewEvaluation('manual')}
              className="inline-flex items-center gap-2 px-8 py-3 bg-[var(--color-primary)] text-white rounded-lg font-semibold hover:bg-[var(--color-primary-dark)] transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:-translate-y-0.5"
            >
              <Plus className="w-5 h-5" />
              Evaluación Manual
            </button>
            <button
              onClick={() => onNewEvaluation('auto')}
              className="inline-flex items-center gap-2 px-8 py-3 bg-amber-500 text-white rounded-lg font-semibold hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 hover:-translate-y-0.5"
            >
              <Sparkles className="w-5 h-5" />
              Evaluación Automatizada (FDS)
            </button>
          </div>
        </div>

        {/* Action bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8 items-center justify-between">
            <h2 className="text-xl font-semibold text-[var(--color-text-main)]">Evaluaciones Recientes</h2>
            <div className="relative w-full sm:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-light)]" />
                <input
                type="text"
                placeholder="Buscar por empresa o área..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text-main)] placeholder-[var(--color-text-light)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
                />
            </div>
        </div>

        {/* Evaluations grid */}
        {filtered.length === 0 ? (
          <div className="card text-center py-16 flex flex-col items-center">
            <div className="w-16 h-16 mb-4 rounded-full bg-[var(--color-background)] flex items-center justify-center">
              <FlaskConical className="w-8 h-8 text-[var(--color-text-light)]" />
            </div>
            <h3 className="text-lg font-medium text-[var(--color-text-main)] mb-1">
              {evaluations.length === 0 ? 'No hay evaluaciones' : 'No se encontraron resultados'}
            </h3>
            <p className="text-[var(--color-text-light)] text-sm mb-6">
              Comienza una nueva evaluación para analizar riesgos químicos.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(ev => (
              <button
                key={ev.id}
                onClick={() => onLoadEvaluation(ev)}
                className="card text-left hover:border-[var(--color-primary)]/50 hover:shadow-md transition-all group relative p-6 flex flex-col h-full"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-[var(--color-text-light)]">
                    <Building2 className="w-3 h-3" />
                    <span className="truncate max-w-[150px]">{ev.project.companyName || 'Sin empresa'}</span>
                  </div>
                  <div
                    role="button"
                    onClick={(e) => handleDelete(ev.id, e)}
                    className="p-1.5 rounded-md hover:bg-red-50 text-[var(--color-text-light)] hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </div>
                </div>
                
                <h3 className="text-lg font-bold text-[var(--color-text-main)] mb-2 line-clamp-2">
                  {ev.project.area || ev.project.workCenter || 'Evaluación sin título'}
                </h3>
                
                <div className="mt-auto pt-4 flex items-center justify-between border-t border-[var(--color-border)]/50">
                  <div className="flex items-center gap-3 text-xs text-[var(--color-text-light)]">
                     <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {ev.project.evaluationDate || 'N/A'}
                     </span>
                     <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold">
                        Step {ev.currentStep}/7
                     </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[var(--color-text-light)] group-hover:text-[var(--color-primary)] transition-colors" />
                </div>
              </button>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--color-border)] mt-auto bg-white">
        <div className="max-w-6xl mx-auto px-6 py-6 text-center text-xs text-[var(--color-text-light)]">
          © 2026 Dirección Técnica - Motor de Decisión CMR (RD 665/1997)
        </div>
      </footer>
    </div>
  );
}
