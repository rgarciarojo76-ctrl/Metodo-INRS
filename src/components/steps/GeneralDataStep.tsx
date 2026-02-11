import { Building2, User, MapPin, Calendar, FileText } from 'lucide-react';
import type { Evaluation } from '../../types';

interface Props {
  evaluation: Evaluation;
  onUpdate: (evaluation: Evaluation) => void;
}

export function GeneralDataStep({ evaluation, onUpdate }: Props) {
  const p = evaluation.project;

  const update = (field: string, value: string) => {
    onUpdate({
      ...evaluation,
      project: { ...p, [field]: value },
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-surface-800 mb-1">Datos Generales del Proyecto</h2>
        <p className="text-surface-500">Información de la empresa y el técnico evaluador.</p>
      </div>

      {/* Company */}
      <section className="bg-white rounded-2xl border border-surface-200 p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-2 text-primary-600 mb-2">
          <Building2 className="w-5 h-5" />
          <h3 className="font-semibold">Identificación de la Empresa</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">Nombre de la empresa *</label>
            <input
              type="text"
              value={p.companyName}
              onChange={e => update('companyName', e.target.value)}
              className="w-full px-4 py-2.5 border border-surface-300 rounded-xl text-surface-800 focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all outline-none"
              placeholder="Ej: Industrias Químicas, S.A."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">Centro de trabajo</label>
            <input
              type="text"
              value={p.workCenter}
              onChange={e => update('workCenter', e.target.value)}
              className="w-full px-4 py-2.5 border border-surface-300 rounded-xl text-surface-800 focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all outline-none"
              placeholder="Ej: Planta principal"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">
              <MapPin className="w-4 h-4 inline mr-1" />
              Área / Nave / Línea de producción
            </label>
            <input
              type="text"
              value={p.area}
              onChange={e => update('area', e.target.value)}
              className="w-full px-4 py-2.5 border border-surface-300 rounded-xl text-surface-800 focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all outline-none"
              placeholder="Ej: Nave 2 – Línea de pintura"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">
              <Calendar className="w-4 h-4 inline mr-1" />
              Fecha de evaluación
            </label>
            <input
              type="date"
              value={p.evaluationDate}
              onChange={e => update('evaluationDate', e.target.value)}
              className="w-full px-4 py-2.5 border border-surface-300 rounded-xl text-surface-800 focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all outline-none"
            />
          </div>
        </div>
      </section>

      {/* Evaluator */}
      <section className="bg-white rounded-2xl border border-surface-200 p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-2 text-primary-600 mb-2">
          <User className="w-5 h-5" />
          <h3 className="font-semibold">Técnico Evaluador</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">Nombre completo *</label>
            <input
              type="text"
              value={p.evaluatorName}
              onChange={e => update('evaluatorName', e.target.value)}
              className="w-full px-4 py-2.5 border border-surface-300 rounded-xl text-surface-800 focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all outline-none"
              placeholder="Ej: María López García"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">Titulación / Cargo</label>
            <input
              type="text"
              value={p.evaluatorTitle}
              onChange={e => update('evaluatorTitle', e.target.value)}
              className="w-full px-4 py-2.5 border border-surface-300 rounded-xl text-surface-800 focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all outline-none"
              placeholder="Ej: Técnico Superior PRL – Higiene Industrial"
            />
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="bg-white rounded-2xl border border-surface-200 p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-2 text-primary-600 mb-2">
          <FileText className="w-5 h-5" />
          <h3 className="font-semibold">Descripción del Proceso</h3>
        </div>
        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1.5">
            Descripción general del proceso productivo
          </label>
          <textarea
            value={p.processDescription}
            onChange={e => update('processDescription', e.target.value)}
            rows={5}
            className="w-full px-4 py-3 border border-surface-300 rounded-xl text-surface-800 focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all outline-none resize-y"
            placeholder="Describa el proceso productivo donde se utilizan los agentes químicos..."
          />
        </div>
      </section>
    </div>
  );
}
