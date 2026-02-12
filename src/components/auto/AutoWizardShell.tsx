import { useState, useCallback } from 'react';
import { ChevronLeft, Save, Check, AlertTriangle, Sparkles } from 'lucide-react';
import type { Evaluation, AutoWizardStep } from '../../types';
import { AUTO_WIZARD_STEPS } from '../../types';
import { db } from '../../db';
import { GeneralDataStep } from '../steps/GeneralDataStep';
import { FDSUploadStep } from './FDSUploadStep';
import { FDSValidationStep } from './FDSValidationStep';
import { SmartQuestionnaireStep } from './SmartQuestionnaireStep';
import { AutoResultsStep } from './AutoResultsStep';

// ─── Component ───────────────────────────────────────────

interface Props {
  evaluation: Evaluation;
  onUpdate: (evaluation: Evaluation) => void;
  onClose: () => void;
}

export function AutoWizardShell({ evaluation, onUpdate, onClose }: Props) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const step = (evaluation.autoStep ?? 1) as AutoWizardStep;

  const goTo = useCallback((newStep: AutoWizardStep) => {
    onUpdate({ ...evaluation, autoStep: newStep, updatedAt: new Date().toISOString() });
  }, [evaluation, onUpdate]);

  const handleNext = useCallback(() => {
    if (step >= 5) return;
    goTo((step + 1) as AutoWizardStep);
  }, [step, goTo]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = { ...evaluation, updatedAt: new Date().toISOString() };
      if (updated.id) {
        await db.evaluations.put(updated);
      } else {
        const id = await db.evaluations.add(updated);
        updated.id = id as number;
      }
      onUpdate(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Error saving:', err);
    }
    setSaving(false);
  };

  const handleStepUpdate = useCallback((updated: Evaluation) => {
    onUpdate(updated);
    // Auto-advance if step was changed by the child component
    if (updated.autoStep && updated.autoStep !== step) {
      // Step already updated by child
    }
  }, [onUpdate, step]);

  const renderStep = () => {
    switch (step) {
      case 1: return <GeneralDataStep evaluation={evaluation} onUpdate={handleStepUpdate} />;
      case 2: return <FDSUploadStep evaluation={evaluation} onUpdate={handleStepUpdate} />;
      case 3: return <FDSValidationStep evaluation={evaluation} onUpdate={handleStepUpdate} />;
      case 4: return <SmartQuestionnaireStep evaluation={evaluation} onUpdate={handleStepUpdate} />;
      case 5: return <AutoResultsStep evaluation={evaluation} onUpdate={handleStepUpdate} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-surface-50 flex flex-col">
      {/* Corporate header */}
      <header className="bg-white border-b border-[var(--color-border)] sticky top-0 z-50 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col sm:grid sm:grid-cols-3 gap-2 sm:gap-0 items-center">
          {/* Left */}
          <div className="flex items-center gap-3 justify-start">
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-surface-100 text-[var(--color-text-light)] transition-colors"
              title="Volver al panel"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex flex-col">
              <span className="text-[var(--color-primary)] font-bold text-sm tracking-wide">DIRECCIÓN TÉCNICA IA LAB</span>
              <span className="text-[var(--color-text-main)] text-xs flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                Evaluación Automatizada (FDS)
              </span>
            </div>
          </div>

          {/* Center: Warning */}
          <div className="flex justify-center">
            <div className="status-disclaimer">
              <AlertTriangle className="disclaimer-icon w-4 h-4" />
              <div className="flex items-baseline gap-1">
                <span className="disclaimer-title">AVISO:</span>
                <span className="disclaimer-body">Apoyo técnico (no sustitutivo). Validar por técnico.</span>
              </div>
            </div>
          </div>

          {/* Right: Save */}
          <div className="flex items-center gap-2 justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                saved
                  ? 'bg-green-100 text-green-700'
                  : 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)]'
              }`}
            >
              {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saving ? '...' : saved ? 'Guardado' : 'Guardar'}
            </button>
          </div>
        </div>

        {/* Auto-mode progress bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-3 mt-2">
          <div className="flex items-center gap-1">
            {AUTO_WIZARD_STEPS.map((ws) => (
              <button
                key={ws.step}
                onClick={() => goTo(ws.step)}
                className="group flex-1 relative"
              >
                <div
                  className={`h-1.5 rounded-full transition-all ${
                    ws.step < step
                      ? 'bg-amber-500'
                      : ws.step === step
                      ? 'bg-amber-400 animate-pulse'
                      : 'bg-surface-200'
                  }`}
                />
                <span
                  className={`absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity ${
                    ws.step <= step ? 'text-amber-600' : 'text-surface-400'
                  }`}
                >
                  {ws.label}
                </span>
              </button>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-surface-500">
              Paso {step} de 5:{' '}
              <span className="font-medium text-surface-700">{AUTO_WIZARD_STEPS[step - 1].label}</span>
            </span>
            <span className="text-xs text-surface-400">
              {Math.round((step / 5) * 100)}% completado
            </span>
          </div>
        </div>
      </header>

      {/* Step content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8">
        {renderStep()}
      </main>

      {/* Navigation footer */}
      <footer className="bg-white border-t border-surface-200 sticky bottom-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex justify-between">
          <button
            onClick={() => step > 1 && goTo((step - 1) as AutoWizardStep)}
            disabled={step <= 1}
            className="px-5 py-2.5 rounded-lg font-medium text-sm text-surface-600 bg-surface-100 hover:bg-surface-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            ← Anterior
          </button>
          <button
            onClick={handleNext}
            disabled={step >= 5}
            className="px-5 py-2.5 rounded-lg font-medium text-sm text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            Siguiente →
          </button>
        </div>
      </footer>
    </div>
  );
}
