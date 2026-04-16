import { useState } from "react";
import { NumberInput } from "../shared/NumberInput";
import { useProjectStore } from "../../store/projectStore";
import { parseParticipantEstimateCsv, buildParticipantEstimateCsv } from "../../utils/participantCsv";
import { downloadCsvFromDrive, uploadCsvToDrive } from "../../utils/driveUpload";

const estimateFields = [
  { key: "optimistic", label: "Опт." },
  { key: "realistic", label: "Реал." },
  { key: "pessimistic", label: "Пес." },
] as const;

type StepParticipantEstimateProps = {
  participantId: string;
};

export function StepParticipantEstimate({
  participantId,
}: StepParticipantEstimateProps) {
  const {
    project,
    participants,
    sections,
    items,
    updateItemEstimate,
    setParticipantDriveFile,
    importParticipantEstimateData,
  } = useProjectStore();
  const participant = participants.find((entry) => entry.id === participantId);
  const activeSections = sections.filter((section) => section.enabled);
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [driveFileInput, setDriveFileInput] = useState("");

  if (!participant) {
    return (
      <section className="rounded-[2rem] border border-stone-200 bg-white/80 p-8 shadow-xl shadow-stone-200/70">
        <h2 className="text-2xl font-semibold text-stone-900">
          Участник не найден
        </h2>
      </section>
    );
  }

  const totalItems = activeSections.reduce(
    (sum, section) => sum + items.filter((item) => item.sectionId === section.id).length,
    0,
  );
  const completedItems = items.filter((item) => {
    const estimate = item.estimatesByParticipant[participantId];
    return (
      estimate?.optimistic !== null ||
      estimate?.realistic !== null ||
      estimate?.pessimistic !== null
    );
  }).length;

  const buildCsv = () =>
    buildParticipantEstimateCsv({
      project,
      participant,
      sections,
      items,
    });

  const getCsvFileName = () =>
    `${(project.name || "estimate").trim().replaceAll(/\s+/g, "-").toLowerCase()}-${participant.name.trim().replaceAll(/\s+/g, "-").toLowerCase()}-estimate.csv`;

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

  const handleUploadCsv = async () => {
    try {
      setIsUploading(true);
      setError("");
      const file = await uploadCsvToDrive({
        csv: buildCsv(),
        existingFileId: participant.driveFile?.id ?? null,
        fileName: getCsvFileName(),
      });

      setParticipantDriveFile(participantId, {
        id: file.id,
        name: file.name,
        webViewLink: file.webViewLink,
        uploadedAt: new Date().toISOString(),
      });
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Не удалось загрузить CSV участника в Google Drive.",
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleImportFromTrackedFile = async () => {
    if (!participant.driveFile?.id) {
      setError("У этого участника пока нет привязанного CSV файла в Google Drive.");
      return;
    }

    const shouldReplace = window.confirm(
      `Импортировать обновлённые оценки из "${participant.driveFile.name}"?`,
    );

    if (!shouldReplace) {
      return;
    }

    try {
      setIsImporting(true);
      setError("");
      const csv = await downloadCsvFromDrive(participant.driveFile.id);
      const imported = parseParticipantEstimateCsv(csv, participant.driveFile);

      importParticipantEstimateData({
        participantId,
        estimatesByItemId: imported.estimatesByItemId,
        driveFile: participant.driveFile,
      });
    } catch (importError) {
      setError(
        importError instanceof Error
          ? importError.message
          : "Не удалось импортировать оценки участника из Google Drive.",
      );
    } finally {
      setIsImporting(false);
    }
  };

  const handleImportFromLink = async () => {
    const fileId = extractDriveFileId(driveFileInput);

    if (!fileId) {
      setError("Вставь корректную ссылку на файл Google Drive или сам fileId.");
      return;
    }

    const shouldReplace = window.confirm(
      "Импортировать оценки участника по вставленной ссылке и заменить текущие значения?",
    );

    if (!shouldReplace) {
      return;
    }

    try {
      setIsImporting(true);
      setError("");
      const csv = await downloadCsvFromDrive(fileId);
      const driveFile = {
        id: fileId,
        name: `${participant.name} CSV`,
        webViewLink: normalizeDriveLink(driveFileInput, fileId),
        uploadedAt: new Date().toISOString(),
      };
      const imported = parseParticipantEstimateCsv(csv, driveFile);

      importParticipantEstimateData({
        participantId,
        estimatesByItemId: imported.estimatesByItemId,
        driveFile,
      });
      setDriveFileInput("");
    } catch (importError) {
      setError(
        importError instanceof Error
          ? importError.message
          : "Не удалось импортировать оценки участника по ссылке.",
      );
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <section className="rounded-[2rem] border border-stone-200 bg-white/80 p-8 shadow-xl shadow-stone-200/70 backdrop-blur">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-orange-500">
            Страница участника
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-stone-900">
            {participant.name}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">
            Здесь участник заполняет только свои `Опт / Реал / Пес`. Для него можно
            отдельно сгенерировать `CSV`, загрузить его в Google Drive и позже
            импортировать обновлённую версию обратно в его оценку.
          </p>
        </div>

        <div className="rounded-[1.75rem] border border-stone-200 bg-stone-950 px-5 py-4 text-stone-50">
          <div className="text-xs uppercase tracking-[0.3em] text-stone-400">
            Прогресс
          </div>
          <div className="mt-2 text-3xl font-semibold">
            {completedItems}/{totalItems}
          </div>
          <div className="mt-2 h-2 w-52 overflow-hidden rounded-full bg-stone-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-orange-400 via-amber-300 to-lime-300"
              style={{
                width: `${totalItems === 0 ? 0 : (completedItems / totalItems) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-[2rem] border border-stone-200 bg-stone-950 p-6 text-stone-50">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-stone-400">
              CSV участника
            </p>
            <h3 className="mt-2 text-2xl font-semibold">
              Обмен оценкой через Google Drive
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-300">
              Этот файл можно загрузить в Google Drive, расшарить участнику и потом
              импортировать обновлённую версию обратно в его оценки.
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
              className="rounded-2xl bg-sky-300 px-4 py-3 text-sm font-semibold text-stone-950 transition hover:bg-sky-200 disabled:cursor-not-allowed disabled:bg-stone-500"
              disabled={isUploading}
              onClick={handleUploadCsv}
              type="button"
            >
              {isUploading ? "Загружаю..." : "Загрузить в Drive"}
            </button>
            <button
              className="rounded-2xl bg-stone-700 px-4 py-3 text-sm font-semibold text-stone-50 transition hover:bg-stone-600 disabled:cursor-not-allowed disabled:bg-stone-500"
              disabled={isImporting}
              onClick={handleImportFromTrackedFile}
              type="button"
            >
              {isImporting ? "Импортирую..." : "Импорт из текущего файла"}
            </button>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <input
            className="min-w-80 flex-1 rounded-2xl border border-stone-700 bg-stone-900 px-4 py-3 text-sm text-stone-100 outline-none transition placeholder:text-stone-500 focus:border-sky-300 focus:ring-4 focus:ring-sky-300/10"
            onChange={(event) => setDriveFileInput(event.target.value)}
            placeholder="Вставь ссылку на CSV участника из Google Drive или fileId"
            value={driveFileInput}
          />
          <button
            className="rounded-2xl border border-stone-600 px-4 py-3 text-sm font-semibold text-stone-100 transition hover:border-stone-400 disabled:cursor-not-allowed disabled:border-stone-800 disabled:text-stone-500"
            disabled={!driveFileInput.trim() || isImporting}
            onClick={handleImportFromLink}
            type="button"
          >
            {isImporting ? "Импортирую..." : "Импорт по ссылке"}
          </button>
        </div>

        {participant.driveFile ? (
          <div className="mt-5 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            Текущий Drive-файл:{" "}
            {participant.driveFile.webViewLink ? (
              <a
                className="font-semibold underline"
                href={participant.driveFile.webViewLink}
                rel="noreferrer"
                target="_blank"
              >
                {participant.driveFile.name}
              </a>
            ) : (
              participant.driveFile.name
            )}
          </div>
        ) : null}

        {error ? (
          <div className="mt-5 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        ) : null}
      </div>

      <div className="mt-8 space-y-8">
        {activeSections.map((section) => {
          const sectionItems = items.filter((item) => item.sectionId === section.id);

          return (
            <div
              key={section.id}
              className="rounded-[2rem] border border-stone-200 bg-white p-6"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-semibold text-stone-900">
                    {section.name}
                  </h3>
                  <p className="mt-1 text-sm text-stone-500">
                    Отдельная страница оценки для участника.
                  </p>
                </div>
                <div className="rounded-full border border-stone-300 px-4 py-2 text-sm text-stone-600">
                  {sectionItems.length} пунктов
                </div>
              </div>

              <div className="mt-5 overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-y-3">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-[0.3em] text-stone-500">
                      <th className="px-3">Название</th>
                      <th className="px-3">Опт.</th>
                      <th className="px-3">Реал.</th>
                      <th className="px-3">Пес.</th>
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
                            {item.initialization ? "Инициализация" : "Основной пункт"}
                            {item.projectOnly ? " • только для проекта" : ""}
                          </div>
                        </td>
                        {estimateFields.map((field) => (
                          <td
                            key={field.key}
                            className="border border-stone-200 bg-white px-3 py-3 align-top"
                          >
                            <div className="grid gap-1 text-xs font-medium uppercase tracking-[0.2em] text-stone-500">
                              {field.label}
                              <NumberInput
                                className="w-28"
                                onChange={(value) =>
                                  updateItemEstimate(
                                    item.id,
                                    participantId,
                                    field.key,
                                    value,
                                  )
                                }
                                value={
                                  item.estimatesByParticipant[participantId]?.[field.key] ??
                                  null
                                }
                              />
                            </div>
                          </td>
                        ))}
                        <td className="rounded-r-3xl border border-l-0 border-stone-200 bg-stone-50 px-3 py-4 text-sm leading-6 text-stone-600">
                          {item.risks || "—"}
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
    </section>
  );
}

function extractDriveFileId(input: string) {
  const value = input.trim();
  if (!value) {
    return "";
  }

  const filePathMatch = value.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (filePathMatch) {
    return filePathMatch[1];
  }

  const urlIdMatch = value.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (urlIdMatch) {
    return urlIdMatch[1];
  }

  if (/^[a-zA-Z0-9_-]{10,}$/.test(value)) {
    return value;
  }

  return "";
}

function normalizeDriveLink(input: string, fileId: string) {
  const value = input.trim();
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  return `https://drive.google.com/file/d/${fileId}/view`;
}
