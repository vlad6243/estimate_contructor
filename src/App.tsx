import { StepParticipantEstimate } from "./components/steps/StepParticipantEstimate";
import { Step1NewProject } from "./components/steps/Step1NewProject";
import { Step2Structure } from "./components/steps/Step2Structure";
import { Step3Summary } from "./components/steps/Step3Summary";
import { Step4Rates } from "./components/steps/Step4Rates";
import { Step5Risks } from "./components/steps/Step5Risks";
import { WizardNav } from "./components/wizard/WizardNav";
import { buildWizardSteps, useProjectStore } from "./store/projectStore";

export default function App() {
  const {
    currentStepIndex,
    goToNextStep,
    goToPreviousStep,
    participants,
    resetAll,
    setCurrentStep,
  } = useProjectStore();
  const wizardSteps = buildWizardSteps(participants);
  const safeStepIndex = Math.min(currentStepIndex, wizardSteps.length - 1);
  const currentStep = wizardSteps[safeStepIndex];

  function renderCurrentStep() {
    switch (currentStep.kind) {
      case "project":
        return <Step1NewProject />;
      case "structure":
        return <Step2Structure />;
      case "participant":
        return currentStep.participantId ? (
          <StepParticipantEstimate participantId={currentStep.participantId} />
        ) : null;
      case "summary":
        return <Step3Summary />;
      case "rates":
        return <Step4Rates />;
      case "risks":
        return <Step5Risks />;
      default:
        return null;
    }
  }

  function handleReset() {
    const shouldReset = window.confirm(
      "Сбросить весь проект, участников, оценки, риски и сохранённый CSV?",
    );

    if (!shouldReset) {
      return;
    }

    resetAll();
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.22),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(253,186,116,0.24),_transparent_30%),linear-gradient(180deg,_#fffdf8_0%,_#f5efe5_100%)] px-4 py-6 text-stone-900 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[360px_1fr]">
        <WizardNav
          currentStepIndex={safeStepIndex}
          onNext={goToNextStep}
          onPrevious={goToPreviousStep}
          onReset={handleReset}
          onStepSelect={setCurrentStep}
          steps={wizardSteps}
        />
        <main>
          {renderCurrentStep()}
        </main>
      </div>
    </div>
  );
}
