import { useState } from "react";
import type { EstimateItem } from "../../types";

type AddItemModalProps = {
  items: EstimateItem[];
  onClose: () => void;
  onSubmit: (payload: {
    title: string;
    parentId: string | null;
    projectOnly: boolean;
    initialization: boolean;
  }) => void;
};

export function AddItemModal({
  items,
  onClose,
  onSubmit,
}: AddItemModalProps) {
  const [title, setTitle] = useState("");
  const [parentId, setParentId] = useState<string>("");
  const [projectOnly, setProjectOnly] = useState(true);
  const [initialization, setInitialization] = useState(false);

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-stone-950/55 p-6 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-[2rem] border border-stone-200 bg-white p-8 shadow-2xl">
        <p className="text-xs uppercase tracking-[0.35em] text-orange-500">
          Добавить пункт
        </p>
        <h3 className="mt-2 text-2xl font-semibold text-stone-900">
          Новый элемент структуры
        </h3>

        <div className="mt-6 grid gap-5">
          <label className="grid gap-2 text-sm font-medium text-stone-700">
            Название
            <input
              className="rounded-2xl border border-stone-300 px-3 py-2 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Например, Экран регистрации"
              value={title}
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-stone-700">
            Является подпунктом
            <select
              className="rounded-2xl border border-stone-300 px-3 py-2 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
              onChange={(event) => setParentId(event.target.value)}
              value={parentId}
            >
              <option value="">Нет</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-3 text-sm text-stone-700">
            <input
              checked={projectOnly}
              className="size-4 accent-orange-500"
              onChange={(event) => setProjectOnly(event.target.checked)}
              type="checkbox"
            />
            Только для оценки этого проекта
          </label>

          <label className="flex items-center gap-3 text-sm text-stone-700">
            <input
              checked={initialization}
              className="size-4 accent-orange-500"
              onChange={(event) => setInitialization(event.target.checked)}
              type="checkbox"
            />
            Относится к инициализации проекта
          </label>
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
            className="rounded-2xl bg-orange-400 px-4 py-3 text-sm font-semibold text-stone-950 disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-stone-400"
            disabled={!title.trim()}
            onClick={() =>
              onSubmit({
                title: title.trim(),
                parentId: parentId || null,
                projectOnly,
                initialization,
              })
            }
            type="button"
          >
            Добавить
          </button>
        </div>
      </div>
    </div>
  );
}
