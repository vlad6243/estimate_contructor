import type { EstimateItem } from "../../types";

type InitModalProps = {
  items: EstimateItem[];
  onClose: () => void;
  onSelect: (itemIds: string[]) => void;
};

export function InitModal({ items, onClose, onSelect }: InitModalProps) {
  const initializationItems = items.filter((item) => item.initialization);

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-stone-950/55 p-6 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-[2rem] border border-stone-200 bg-white p-8 shadow-2xl">
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-orange-500">
              Инициализация
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-stone-900">
              Шаблонные задачи раздела
            </h3>
          </div>
          <button
            className="rounded-full border border-stone-300 px-4 py-2 text-sm text-stone-600 transition hover:border-stone-400"
            onClick={onClose}
            type="button"
          >
            Закрыть
          </button>
        </div>

        <div className="mt-6 space-y-3">
          {initializationItems.map((item) => (
            <label
              key={item.id}
              className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-800"
            >
              <input
                className="size-4 accent-orange-500"
                defaultChecked
                type="checkbox"
                value={item.id}
              />
              <span>{item.title}</span>
            </label>
          ))}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            className="rounded-2xl border border-stone-300 px-4 py-3 text-sm font-medium text-stone-700"
            onClick={onClose}
            type="button"
          >
            Отмена
          </button>
          <button
            className="rounded-2xl bg-orange-400 px-4 py-3 text-sm font-semibold text-stone-950"
            onClick={() => onSelect(initializationItems.map((item) => item.id))}
            type="button"
          >
            Выбрать всё
          </button>
        </div>
      </div>
    </div>
  );
}
