import { useState } from "react";
import { AddItemModal } from "../modals/AddItemModal";
import { InitModal } from "../modals/InitModal";
import { useProjectStore } from "../../store/projectStore";

export function Step2Structure() {
  const {
    sections,
    items,
    addSection,
    addItem,
    toggleSection,
    updateItemRisk,
  } = useProjectStore();
  const [sectionName, setSectionName] = useState("");
  const [initSectionId, setInitSectionId] = useState<string | null>(null);
  const [addItemSectionId, setAddItemSectionId] = useState<string | null>(null);

  const activeSections = sections.filter((section) => section.enabled);

  return (
    <section className="rounded-[2rem] border border-stone-200 bg-white/80 p-8 shadow-xl shadow-stone-200/70 backdrop-blur">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-orange-500">
            Структура
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-stone-900">
            Структура оценки
          </h2>
        </div>
        <div className="max-w-md rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-stone-700">
          Здесь менеджер собирает каноническую структуру оценки. После этого у
          каждого участника будет своя отдельная страница только для ввода чисел.
        </div>
      </div>

      <div className="mt-8 rounded-[2rem] border border-stone-200 bg-stone-50 p-5">
        <div className="flex flex-wrap items-center gap-3">
          {sections.map((section) => (
            <label
              key={section.id}
              className={`inline-flex items-center gap-3 rounded-full border px-4 py-3 text-sm font-medium transition ${
                section.enabled
                  ? "border-stone-900 bg-stone-900 text-white"
                  : "border-stone-300 bg-white text-stone-600"
              }`}
            >
              <input
                checked={section.enabled}
                className="size-4 accent-orange-500"
                onChange={() => toggleSection(section.id)}
                type="checkbox"
              />
              {section.name}
            </label>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <input
            className="min-w-64 flex-1 rounded-2xl border border-stone-300 bg-white px-4 py-3 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
            onChange={(event) => setSectionName(event.target.value)}
            placeholder="Добавить свой раздел"
            value={sectionName}
          />
          <button
            className="rounded-2xl bg-stone-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:bg-stone-300"
            disabled={!sectionName.trim()}
            onClick={() => {
              addSection(sectionName.trim());
              setSectionName("");
            }}
            type="button"
          >
            Добавить раздел
          </button>
        </div>
      </div>

      <div className="mt-8 space-y-8">
        {activeSections.map((section) => {
          const sectionItems = items.filter((item) => item.sectionId === section.id);

          return (
            <div
              key={section.id}
              className="rounded-[2rem] border border-stone-200 bg-white p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-semibold text-stone-900">
                    {section.name}
                  </h3>
                  <p className="mt-1 text-sm text-stone-500">
                    Здесь редактируется дерево задач и комментарии к рискам.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    className="rounded-2xl border border-stone-300 px-4 py-3 text-sm font-medium text-stone-700 transition hover:border-stone-400"
                    onClick={() => setInitSectionId(section.id)}
                    type="button"
                  >
                    Инициализация
                  </button>
                  <button
                    className="rounded-2xl bg-orange-400 px-4 py-3 text-sm font-semibold text-stone-950 transition hover:bg-orange-300"
                    onClick={() => setAddItemSectionId(section.id)}
                    type="button"
                  >
                    + Добавить пункт
                  </button>
                </div>
              </div>

              <div className="mt-5 overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-y-3">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-[0.3em] text-stone-500">
                      <th className="px-3">Название</th>
                      <th className="px-3">Флаги</th>
                      <th className="px-3">Риски</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sectionItems.map((item) => (
                      <tr key={item.id}>
                        <td className="rounded-l-3xl border border-r-0 border-stone-200 bg-stone-50 px-3 py-4 align-top">
                          <div
                            className={`font-medium text-stone-900 ${
                              item.parentId ? "pl-6 text-stone-700" : ""
                            }`}
                          >
                            {item.title}
                          </div>
                          <div className="mt-1 text-xs text-stone-500">
                            {item.projectOnly ? "Только для проекта" : "Шаблонный пункт"}
                            {item.initialization ? " • инициализация" : ""}
                          </div>
                        </td>
                        <td className="border border-stone-200 bg-white px-3 py-3 align-top text-sm leading-6 text-stone-600">
                          <div>{item.initialization ? "Инициализация" : "Обычный пункт"}</div>
                          <div>{item.parentId ? "Вложенный пункт" : "Корневой пункт"}</div>
                        </td>
                        <td className="rounded-r-3xl border border-l-0 border-stone-200 bg-stone-50 px-3 py-3 align-top">
                          <textarea
                            className="min-h-28 w-full rounded-2xl border border-stone-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
                            onChange={(event) =>
                              updateItemRisk(item.id, event.target.value)
                            }
                            placeholder="Что может повлиять на оценку?"
                            value={item.risks}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      {initSectionId ? (
        <InitModal
          items={items.filter((item) => item.sectionId === initSectionId)}
          onClose={() => setInitSectionId(null)}
          onSelect={() => setInitSectionId(null)}
        />
      ) : null}

      {addItemSectionId ? (
        <AddItemModal
          items={items.filter((item) => item.sectionId === addItemSectionId)}
          onClose={() => setAddItemSectionId(null)}
          onSubmit={(payload) => {
            addItem(addItemSectionId, payload);
            setAddItemSectionId(null);
          }}
        />
      ) : null}
    </section>
  );
}
