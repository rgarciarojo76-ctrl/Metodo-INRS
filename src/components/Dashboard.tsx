import { useEffect, useState } from 'react';
import { Plus, Search, FlaskConical, Calendar, Building2, Trash2 } from 'lucide-react';
import type { Evaluation } from '../types';
import { db } from '../db';

interface Props {
  onNewEvaluation: () => void;
  onLoadEvaluation: (evaluation: Evaluation) => void;
}

export function Dashboard({ onNewEvaluation, onLoadEvaluation }: Props) {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadEvaluations();
  }, []);

  const loadEvaluations = async () => {
    const all = await db.evaluations.reverse().sortBy('updatedAt');
    setEvaluations(all);
  };

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
    <div className="min-h-screen bg-gradient-to-br from-surface-900 via-surface-800 to-primary-900">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-sm bg-white/5">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/25">
            <FlaskConical className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Método INRS</h1>
            <p className="text-sm text-surface-400">Evaluación Simplificada de Riesgo Químico · NTP 937</p>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">
            Panel de Evaluaciones
          </h2>
          <p className="text-surface-400 max-w-2xl mx-auto text-lg">
            Evaluación cualitativa y simplificada del riesgo por inhalación y contacto dérmico
            de agentes químicos según la metodología INRS.
          </p>
        </div>

        {/* Action bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <button
            onClick={onNewEvaluation}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-semibold hover:from-primary-600 hover:to-primary-700 transition-all shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-5 h-5" />
            Nueva Evaluación
          </button>
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500" />
            <input
              type="text"
              placeholder="Buscar por empresa o área..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/10 rounded-xl text-white placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all backdrop-blur-sm"
            />
          </div>
        </div>

        {/* Evaluations grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-white/5 flex items-center justify-center">
              <FlaskConical className="w-10 h-10 text-surface-600" />
            </div>
            <h3 className="text-xl font-semibold text-surface-400 mb-2">
              {evaluations.length === 0 ? 'Sin evaluaciones' : 'Sin resultados'}
            </h3>
            <p className="text-surface-500 mb-6">
              {evaluations.length === 0
                ? 'Crea tu primera evaluación de riesgo químico.'
                : 'No se encontraron evaluaciones con ese criterio.'}
            </p>
            {evaluations.length === 0 && (
              <button
                onClick={onNewEvaluation}
                className="px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors"
              >
                Crear primera evaluación
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(ev => (
              <button
                key={ev.id}
                onClick={() => onLoadEvaluation(ev)}
                className="group text-left p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-primary-500/30 transition-all backdrop-blur-sm hover:shadow-lg hover:shadow-primary-500/10"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 text-sm text-surface-400">
                    <Building2 className="w-4 h-4" />
                    <span className="truncate">{ev.project.companyName || 'Sin nombre'}</span>
                  </div>
                  <button
                    onClick={(e) => handleDelete(ev.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-danger-500/20 text-surface-500 hover:text-danger-400 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="text-white font-semibold mb-1 truncate">
                  {ev.project.area || ev.project.workCenter || 'Evaluación sin título'}
                </h3>
                <div className="flex items-center gap-4 text-xs text-surface-500 mt-3">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {ev.project.evaluationDate || '—'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-primary-500/10 text-primary-400 font-medium">
                    {ev.agents.length} agente{ev.agents.length !== 1 ? 's' : ''}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-surface-700/50 text-surface-400 font-medium">
                    Paso {ev.currentStep}/7
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 mt-12">
        <div className="max-w-6xl mx-auto px-6 py-6 text-center text-sm text-surface-600">
          Metodología basada en NTP 937 (INSHT) y ND 2233-200-05 (INRS)
        </div>
      </footer>
    </div>
  );
}
