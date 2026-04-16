import { useState } from "react";
import { useProjectStore } from "../../store/projectStore";
import { uploadCsvToDrive } from "../../utils/driveUpload";
import { buildEstimateCsv } from "../../utils/csvBuilder";

export function Step5Risks() {
  const {
    project,
    sections,
    items,
    participants,
    riskItems,
    driveFile,
    addRisk,
    toggleRisk,
    setDriveFile,
  } = useProjectStore();
  const [draftRisk, setDraftRisk] = useState("");
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const buildCsv = () =>
    buildEstimateCsv({
      project,
      participants,
      sections,
      items,
      risks: riskItems,
    });

  const getCsvFileName = () =>
    `${(project.name || "estimate").trim().replaceAll(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`;

  const handleDownloadCsv = () => {
    const csv = buildCsv();
    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = getCsvFileName();
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setError("");
  };

  const handleUpload = async () => {
    try {
      setIsUploading(true);
      setError("");
      const csv = buildCsv();

      const file = await uploadCsvToDrive({
        csv,
        existingFileId: driveFile?.id ?? null,
        fileName: getCsvFileName(),
      });

      setDriveFile({
        id: file.id,
        name: file.name,
        webViewLink: file.webViewLink,
        uploadedAt: new Date().toISOString(),
      });
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Не удалось загрузить CSV в Google Drive.",
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <section className="rounded-[2rem] border border-stone-200 bg-white/80 p-8 shadow-xl shadow-stone-200/70 backdrop-blur">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-orange-500">
            CSV и Drive
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-stone-900">
            Учёт рисков и экспорт
          </h2>
        </div>
        <div className="max-w-md rounded-3xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-stone-700">
          Здесь можно скачать `CSV` или сохранить его в Google Drive. Импорт
          доступен на первой странице конструктора.
        </div>
      </div>

      <div className="mt-8 grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[2rem] border border-stone-200 bg-stone-50 p-6">
          <div className="mb-6 rounded-2xl border border-stone-200 bg-white px-4 py-4 text-sm leading-6 text-stone-700">
            Если загрузка в Google Drive недоступна, проверь настройки интеграции
            в приложении.
          </div>

          <div className="space-y-4">
            {riskItems.map((risk) => (
              <label
                key={risk.id}
                className="flex gap-4 rounded-2xl border border-stone-200 bg-white px-4 py-4 text-stone-800"
              >
                <input
                  checked={risk.checked}
                  className="mt-1 size-4 accent-orange-500"
                  onChange={() => toggleRisk(risk.id)}
                  type="checkbox"
                />
                <span className="leading-7">{risk.text}</span>
              </label>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <input
              className="min-w-64 flex-1 rounded-2xl border border-stone-300 bg-white px-4 py-3 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
              onChange={(event) => setDraftRisk(event.target.value)}
              placeholder="+ добавить свой пункт"
              value={draftRisk}
            />
            <button
              className="rounded-2xl border border-stone-900 px-4 py-3 text-sm font-semibold text-stone-900 disabled:border-stone-300 disabled:text-stone-400"
              disabled={!draftRisk.trim()}
              onClick={() => {
                addRisk(draftRisk.trim());
                setDraftRisk("");
              }}
              type="button"
            >
              Сохранить
            </button>
          </div>
        </div>

        <div className="rounded-[2rem] border border-stone-200 bg-stone-950 p-6 text-stone-50">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-stone-400">
                Экспорт
              </p>
              <h3 className="mt-2 text-2xl font-semibold">CSV файл</h3>
              <p className="mt-2 max-w-xl text-sm leading-6 text-stone-400">
                Файл генерируется из текущих данных проекта и оценок участников.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                className="rounded-2xl border border-orange-300 bg-orange-300 px-4 py-3 text-sm font-semibold text-stone-950 transition hover:bg-orange-200"
                onClick={handleDownloadCsv}
                type="button"
              >
                Скачать CSV
              </button>
              <button
                className="rounded-2xl bg-stone-700 px-4 py-3 text-sm font-semibold text-stone-50 transition hover:bg-stone-600 disabled:cursor-not-allowed disabled:bg-stone-500"
                disabled={isUploading}
                onClick={handleUpload}
                type="button"
              >
                {isUploading ? "Сохраняю..." : "Загрузить в Drive"}
              </button>
            </div>
          </div>

          {error ? (
            <div className="mt-5 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          ) : null}

          {driveFile ? (
            <div className="mt-5 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              CSV в Google Drive:{" "}
              {driveFile.webViewLink ? (
                <a
                  className="font-semibold underline"
                  href={driveFile.webViewLink}
                  rel="noreferrer"
                  target="_blank"
                >
                  {driveFile.name}
                </a>
              ) : (
                driveFile.name
              )}
            </div>
          ) : null}

          <div className="mt-4 text-xs leading-6 text-stone-400">
            Участники: {participants.map((participant) => participant.name).join(", ")}
          </div>
        </div>
      </div>
    </section>
  );
}
