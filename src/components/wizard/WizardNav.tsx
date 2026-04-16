import type { WizardStep } from "../../types";

type WizardNavProps = {
  currentStepIndex: number;
  steps: WizardStep[];
  onStepSelect: (index: number) => void;
  onNext: () => void;
  onPrevious: () => void;
  onReset: () => void;
};

export function WizardNav({
  currentStepIndex,
  steps,
  onStepSelect,
  onNext,
  onPrevious,
  onReset,
}: WizardNavProps) {
  const progress = ((currentStepIndex + 1) / steps.length) * 100;
  const isLastStep = currentStepIndex === steps.length - 1;

  return (
    <aside className="rounded-[2rem] border border-stone-200 bg-stone-950 p-6 text-stone-50 shadow-2xl shadow-stone-950/20">
      <div className="mb-6">
        <div className="text-xs uppercase tracking-[0.35em] text-stone-400">
          Estimate Constructor
        </div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Конструктор оценок
        </h1>
        <p className="mt-2 text-sm leading-6 text-stone-300">
          Каркас на React для быстрого перехода от мокапов к рабочему мастеру.
        </p>
      </div>

      <div className="mb-6 h-2 overflow-hidden rounded-full bg-stone-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-orange-400 via-amber-300 to-lime-300 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="space-y-3">
        {steps.map((step, index) => {
          const isActive = index === currentStepIndex;
          const isPast = index < currentStepIndex;

          return (
            <button
              key={step.id}
              className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                isActive
                  ? "border-orange-300 bg-orange-100/10"
                  : "border-stone-800 bg-stone-900 hover:border-stone-700"
              }`}
              onClick={() => onStepSelect(index)}
              type="button"
            >
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-medium">{step.label}</span>
                <span
                  className={`inline-flex size-7 items-center justify-center rounded-full text-xs font-semibold ${
                    isPast
                      ? "bg-lime-300 text-stone-950"
                      : isActive
                        ? "bg-orange-300 text-stone-950"
                        : "bg-stone-800 text-stone-300"
                  }`}
                >
                  {index + 1}
                </span>
              </div>
              <p className="mt-1 text-xs leading-5 text-stone-400">
                {step.description}
              </p>
            </button>
          );
        })}
      </div>

      <div className="mt-8 flex gap-3">
        <button
          className="flex-1 rounded-2xl border border-stone-700 px-4 py-3 text-sm font-medium text-stone-200 transition hover:border-stone-500"
          onClick={onPrevious}
          type="button"
        >
          Назад
        </button>
        {!isLastStep ? (
          <button
            className="flex-1 rounded-2xl bg-orange-300 px-4 py-3 text-sm font-semibold text-stone-950 transition hover:bg-orange-200"
            onClick={onNext}
            type="button"
          >
            Далее
          </button>
        ) : null}
      </div>

      <button
        className="mt-3 w-full rounded-2xl border border-rose-400/40 px-4 py-3 text-sm font-medium text-rose-200 transition hover:border-rose-300 hover:bg-rose-500/10"
        onClick={onReset}
        type="button"
      >
        Сбросить всё
      </button>
    </aside>
  );
}
