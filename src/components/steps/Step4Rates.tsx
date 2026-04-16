import { NumberInput } from "../shared/NumberInput";
import { useProjectStore } from "../../store/projectStore";
import { averageEstimate, sumEstimates } from "../../utils/estimates";

export function Step4Rates() {
  const { sections, items, updateSectionRate } = useProjectStore();

  const activeSections = sections.filter((section) => section.enabled);
  const rows = activeSections.map((section) => {
    const sectionItems = items.filter((item) => item.sectionId === section.id);
    const total = sumEstimates(sectionItems.map(averageEstimate));
    return {
      section,
      total,
      amount: Math.round((total.realistic ?? 0) * section.rate),
    };
  });
  const grandTotal = rows.reduce((sum, row) => sum + row.amount, 0);

  return (
    <section className="rounded-[2rem] border border-stone-200 bg-white/80 p-8 shadow-xl shadow-stone-200/70 backdrop-blur">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-orange-500">
            Рейты
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-stone-900">
            Установка рейтов и расчёт стоимости
          </h2>
        </div>
        <div className="max-w-sm rounded-3xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm leading-6 text-stone-700">
          На этом этапе рейт задаётся на раздел. Если захочешь более детальную
          модель, можно будет переключить расчёт на айтемы.
        </div>
      </div>

      <div className="mt-8 overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-y-3">
          <thead>
            <tr className="text-left text-xs uppercase tracking-[0.28em] text-stone-500">
              <th className="px-3">Раздел</th>
              <th className="px-3">Опт.</th>
              <th className="px-3">Реал.</th>
              <th className="px-3">Пес.</th>
              <th className="px-3">Рейт</th>
              <th className="px-3">Стоимость</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.section.id}>
                <td className="rounded-l-3xl border border-r-0 border-stone-200 bg-stone-50 px-3 py-4 font-medium text-stone-900">
                  {row.section.name}
                </td>
                <td className="border border-stone-200 bg-white px-3 py-4 text-stone-700">
                  {row.total.optimistic ?? "—"}
                </td>
                <td className="border border-stone-200 bg-white px-3 py-4 text-stone-700">
                  {row.total.realistic ?? "—"}
                </td>
                <td className="border border-stone-200 bg-white px-3 py-4 text-stone-700">
                  {row.total.pessimistic ?? "—"}
                </td>
                <td className="border border-stone-200 bg-white px-3 py-4">
                  <NumberInput
                    className="w-28"
                    onChange={(value) =>
                      updateSectionRate(row.section.id, value ?? 0)
                    }
                    value={row.section.rate}
                  />
                </td>
                <td className="rounded-r-3xl border border-l-0 border-stone-200 bg-stone-950 px-3 py-4 font-semibold text-stone-50">
                  ${row.amount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex justify-end">
        <div className="rounded-[2rem] border border-stone-900 bg-stone-900 px-6 py-4 text-right text-stone-50">
          <div className="text-xs uppercase tracking-[0.3em] text-stone-400">
            Итого
          </div>
          <div className="mt-2 text-3xl font-semibold">${grandTotal}</div>
        </div>
      </div>
    </section>
  );
}
