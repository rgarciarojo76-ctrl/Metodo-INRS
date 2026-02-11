import { useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { WizardShell } from './components/WizardShell';
import type { Evaluation } from './types';

function App() {
  const [activeEvaluation, setActiveEvaluation] = useState<Evaluation | null>(null);

  const handleNewEvaluation = () => {
    const now = new Date().toISOString();
    const evaluation: Evaluation = {
      project: {
        companyName: '',
        workCenter: '',
        area: '',
        evaluationDate: new Date().toISOString().split('T')[0],
        evaluatorName: '',
        evaluatorTitle: '',
        processDescription: '',
        createdAt: now,
        updatedAt: now,
      },
      agents: [],
      hierarchyResults: [],
      inhalationResults: [],
      dermalResults: [],
      alerts: [],
      currentStep: 1,
      createdAt: now,
      updatedAt: now,
    };
    setActiveEvaluation(evaluation);
  };

  const handleLoadEvaluation = (evaluation: Evaluation) => {
    setActiveEvaluation(evaluation);
  };

  const handleClose = () => {
    setActiveEvaluation(null);
  };

  return (
    <div className="min-h-screen bg-surface-50">
      {activeEvaluation ? (
        <WizardShell
          evaluation={activeEvaluation}
          onUpdate={setActiveEvaluation}
          onClose={handleClose}
        />
      ) : (
        <Dashboard
          onNewEvaluation={handleNewEvaluation}
          onLoadEvaluation={handleLoadEvaluation}
        />
      )}
    </div>
  );
}

export default App;
