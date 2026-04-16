import { NumberInput } from "../shared/NumberInput";
import { useProjectStore } from "../../store/projectStore";
import { averageEstimate, estimateSpread, formatEstimate } from "../../utils/estimates";

export function Step3Summary() {
  const { items, participants, sections, discrepancyThreshold, setDiscrepancyThreshold } =
    useProjectStore();

  const activeSections = sections.filter((section) => section.enabled);

  return (
    <section className="rounded-[2rem] border border-stone-200 bg-white/80 p-8 shadow-xl shadow-stone-200/70 backdrop-blur">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-orange-500">
            Сводная
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-stone-900">
            Формирование сводной оценки
          </h2>
        </div>
        <div className="rounded-3xl border border-stone-200 bg-stone-50 px-4 py-3">
          <label className="grid gap-2 text-sm font-medium text-stone-700">
            Порог расхождения
            <NumberInput
              className="w-28"
              onChange={(value) => setDiscrepancyThreshold(value ?? 0)}
              value={discrepancyThreshold}
            />
          </label>
        </div>
      </div>

      <div className="mt-8 space-y-8">
        <div className="grid gap-3 md:grid-cols-3">
          {participants.map((participant) => {
            const completedItems = items.filter((item) => {
              const estimate = item.estimatesByParticipant[participant.id];
              return (
                estimate?.optimistic !== null ||
                estimate?.realistic !== null ||
                estimate?.pessimistic !== null
              );
            }).length;

            return (
              <div
                key={participant.id}
                className="rounded-3xl border border-stone-200 bg-stone-50 px-4 py-4"
              >
                <div className="text-sm font-semibold text-stone-900">
                  {participant.name}
                </div>
                <div className="mt-2 text-sm text-stone-500">
                  Заполнено {completedItems} из {items.length} пунктов
                </div>
              </div>
            );
          })}
        </div>

        {activeSections.map((section) => {
          const sectionItems = items.filter((item) => item.sectionId === section.id);

          return (
            <div key={section.id}>
              <div className="mb-4 flex items-center justify-between gap-4">
                <h3 className="text-xl font-semibold text-stone-900">
                  {section.name}
                </h3>
                <p className="text-sm text-stone-500">
                  Сейчас сводная оценка считается как среднее по участникам.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-y-3">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-[0.28em] text-stone-500">
                      <th className="px-3">Название</th>
                      {participants.map((participant) => (
                        <th key={participant.id} className="px-3">
                          {participant.name}
                        </th>
                      ))}
                      <th className="px-3">Сводная оценка</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sectionItems.map((item) => {
                      const summary = averageEstimate(item);
                      const spread = estimateSpread(item);
                      const hasDiscrepancy = Object.values(spread).some(
                        (value) => value !== null && value > discrepancyThreshold,
                      );

                      return (
                        <tr key={item.id}>
                          <td className="rounded-l-3xl border border-r-0 border-stone-200 bg-stone-50 px-3 py-4 font-medium text-stone-900">
                            {item.title}
                          </td>
                          {participants.map((participant) => {
                            const estimate = item.estimatesByParticipant[participant.id];

                            return (
                              <td
                                key={participant.id}
                                className={`border px-3 py-3 text-sm ${
                                  hasDiscrepancy
                                    ? "border-rose-200 bg-rose-50 text-rose-700"
                                    : "border-stone-200 bg-white text-stone-700"
                                }`}
                              >
                                <div>Опт: {formatEstimate(estimate.optimistic)}</div>
                                <div>Реал: {formatEstimate(estimate.realistic)}</div>
                                <div>Пес: {formatEstimate(estimate.pessimistic)}</div>
                              </td>
                            );
                          })}
                          <td className="rounded-r-3xl border border-l-0 border-stone-200 bg-stone-950 px-4 py-4 text-sm text-stone-100">
                            <div>Опт: {formatEstimate(summary.optimistic)}</div>
                            <div>Реал: {formatEstimate(summary.realistic)}</div>
                            <div>Пес: {formatEstimate(summary.pessimistic)}</div>
                            {hasDiscrepancy ? (
                              <div className="mt-2 font-semibold text-rose-300">
                                Большое расхождение
                              </div>
                            ) : null}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
