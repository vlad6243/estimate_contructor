import { useState } from "react";
import { DatePicker } from "../shared/DatePicker";
import { useProjectStore } from "../../store/projectStore";
import { parseEstimateCsv } from "../../utils/csvImport";
import {
  type DriveCsvFile,
  downloadCsvFromDrive,
  listCsvFilesFromDrive,
} from "../../utils/driveUpload";

export function Step1NewProject() {
  const {
    project,
    participants,
    driveFile,
    addParticipant,
    importEstimateData,
    removeParticipant,
    updateParticipantName,
    updateProjectField,
  } = useProjectStore();
  const [error, setError] = useState("");
  const [isLoadingDriveFiles, setIsLoadingDriveFiles] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [driveFiles, setDriveFiles] = useState<DriveCsvFile[]>([]);
  const [driveFileInput, setDriveFileInput] = useState("");
  const [showDriveImport, setShowDriveImport] = useState(false);

  const handleLoadDriveFiles = async () => {
    try {
      setIsLoadingDriveFiles(true);
      setError("");
      const files = await listCsvFilesFromDrive();
      setDriveFiles(files);
      setShowDriveImport(true);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Не удалось получить список CSV файлов из Google Drive.",
      );
    } finally {
      setIsLoadingDriveFiles(false);
    }
  };

  const handleImportFromDrive = async (file: DriveCsvFile) => {
    const shouldReplace = window.confirm(
      `Загрузить "${file.name}" из Google Drive и заменить текущие данные проекта?`,
    );

    if (!shouldReplace) {
      return;
    }

    try {
      setIsImporting(true);
      setError("");
      const csv = await downloadCsvFromDrive(file.id);
      const imported = parseEstimateCsv(csv, {
        id: file.id,
        name: file.name,
        webViewLink: file.webViewLink,
        uploadedAt: file.modifiedTime ?? new Date().toISOString(),
      });

      importEstimateData(imported);
      setShowDriveImport(false);
    } catch (importError) {
      setError(
        importError instanceof Error
          ? importError.message
          : "Не удалось импортировать CSV из Google Drive.",
      );
    } finally {
      setIsImporting(false);
    }
  };

  const handleImportFromInput = async () => {
    const fileId = extractDriveFileId(driveFileInput);

    if (!fileId) {
      setError("Вставь корректную ссылку на файл Google Drive или сам fileId.");
      return;
    }

    const shouldReplace = window.confirm(
      "Загрузить CSV по вставленной ссылке и заменить текущие данные проекта?",
    );

    if (!shouldReplace) {
      return;
    }

    try {
      setIsImporting(true);
      setError("");
      const csv = await downloadCsvFromDrive(fileId);
      const imported = parseEstimateCsv(csv, {
        id: fileId,
        name: "Импортированный CSV",
        webViewLink: normalizeDriveLink(driveFileInput, fileId),
        uploadedAt: new Date().toISOString(),
      });

      importEstimateData(imported);
      setDriveFileInput("");
      setShowDriveImport(false);
    } catch (importError) {
      setError(
        importError instanceof Error
          ? importError.message
          : "Не удалось импортировать CSV по ссылке из Google Drive.",
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
            Шаг 1
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-stone-900">
            Новый проект на оценку
          </h2>
        </div>
        <div className="max-w-sm rounded-3xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm leading-6 text-stone-700">
          Здесь можно либо создать новую оценку, либо сразу импортировать уже
          сохранённый `CSV` из Google Drive.
        </div>
      </div>

      <div className="mt-8 rounded-[2rem] border border-stone-200 bg-stone-950 p-6 text-stone-50">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-stone-400">
              Импорт
            </p>
            <h3 className="mt-2 text-2xl font-semibold">
              Загрузить CSV из Google Drive
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-300">
              Импорт поддерживает `CSV`, который был создан этим приложением.
              Текущие данные будут заменены содержимым выбранного файла. Если
              интеграция Drive недоступна, проверь настройки приложения.
            </p>
          </div>
          <button
            className="rounded-2xl bg-sky-300 px-4 py-3 text-sm font-semibold text-stone-950 transition hover:bg-sky-200 disabled:cursor-not-allowed disabled:bg-stone-500"
            disabled={isLoadingDriveFiles || isImporting}
            onClick={handleLoadDriveFiles}
            type="button"
          >
            {isLoadingDriveFiles ? "Ищу CSV..." : "Импорт из Drive"}
          </button>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <input
            className="min-w-80 flex-1 rounded-2xl border border-stone-700 bg-stone-900 px-4 py-3 text-sm text-stone-100 outline-none transition placeholder:text-stone-500 focus:border-sky-300 focus:ring-4 focus:ring-sky-300/10"
            onChange={(event) => setDriveFileInput(event.target.value)}
            placeholder="Вставь ссылку на CSV из Google Drive или fileId"
            value={driveFileInput}
          />
          <button
            className="rounded-2xl border border-stone-600 px-4 py-3 text-sm font-semibold text-stone-100 transition hover:border-stone-400 disabled:cursor-not-allowed disabled:border-stone-800 disabled:text-stone-500"
            disabled={!driveFileInput.trim() || isImporting}
            onClick={handleImportFromInput}
            type="button"
          >
            {isImporting ? "Импортирую..." : "Загрузить по ссылке"}
          </button>
        </div>

        {error ? (
          <div className="mt-5 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        ) : null}

        {driveFile ? (
          <div className="mt-5 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            Сейчас загружен файл: {driveFile.name}
          </div>
        ) : null}

        {showDriveImport ? (
          <div className="mt-5 rounded-[1.5rem] border border-stone-800 bg-stone-900 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-stone-100">
                  CSV файлы в Google Drive
                </div>
                <div className="mt-1 text-xs leading-5 text-stone-400">
                  Выбери файл, чтобы загрузить его в конструктор.
                </div>
              </div>
              <button
                className="rounded-2xl border border-stone-700 px-3 py-2 text-xs font-medium text-stone-300 transition hover:border-stone-500"
                onClick={() => setShowDriveImport(false)}
                type="button"
              >
                Закрыть
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {driveFiles.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-stone-700 px-4 py-5 text-sm text-stone-400">
                  В Google Drive не найдено `CSV` файлов.
                </div>
              ) : (
                driveFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-800 bg-stone-950 px-4 py-4"
                  >
                    <div>
                      <div className="text-sm font-semibold text-stone-100">
                        {file.name}
                      </div>
                      <div className="mt-1 text-xs leading-5 text-stone-400">
                        {file.modifiedTime
                          ? new Date(file.modifiedTime).toLocaleString()
                          : "Дата изменения неизвестна"}
                      </div>
                    </div>
                    <button
                      className="rounded-2xl bg-sky-300 px-4 py-3 text-sm font-semibold text-stone-950 transition hover:bg-sky-200 disabled:cursor-not-allowed disabled:bg-stone-500"
                      disabled={isImporting}
                      onClick={() => handleImportFromDrive(file)}
                      type="button"
                    >
                      {isImporting ? "Импортирую..." : "Загрузить"}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <label className="grid gap-2 text-sm font-medium text-stone-700">
          Имя проекта
          <input
            className="rounded-2xl border border-stone-300 bg-white px-4 py-3 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
            onChange={(event) =>
              updateProjectField("name", event.target.value)
            }
            placeholder="Например, Digigram"
            value={project.name}
          />
        </label>

        <label className="grid gap-2 text-sm font-medium text-stone-700">
          Ссылка в Redmine
          <input
            className="rounded-2xl border border-stone-300 bg-white px-4 py-3 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
            onChange={(event) =>
              updateProjectField("redmineUrl", event.target.value)
            }
            placeholder="https://redmine.example.com/issues/123"
            value={project.redmineUrl}
          />
        </label>

        <label className="grid gap-2 text-sm font-medium text-stone-700">
          Срок для вопросов
          <DatePicker
            onChange={(value) => updateProjectField("questionDeadline", value)}
            value={project.questionDeadline}
          />
        </label>

        <label className="grid gap-2 text-sm font-medium text-stone-700">
          Срок для оценки
          <DatePicker
            onChange={(value) => updateProjectField("estimateDeadline", value)}
            value={project.estimateDeadline}
          />
        </label>
      </div>

      <div className="mt-10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-stone-900">Кто участвует</h3>
            <p className="text-sm text-stone-500">
              После этого шага автоматически появится отдельная страница оценки для
              каждого участника.
            </p>
          </div>
          <button
            className="rounded-2xl border border-stone-300 px-4 py-3 text-sm font-medium text-stone-700 transition hover:border-stone-400"
            onClick={addParticipant}
            type="button"
          >
            + Добавить участника
          </button>
        </div>

        <div className="mt-5 grid gap-3">
          {participants.map((participant, index) => (
            <div
              key={participant.id}
              className="grid gap-3 rounded-3xl border border-stone-200 bg-stone-50 px-4 py-4 md:grid-cols-[80px_1fr_auto]"
            >
              <div className="flex items-center text-sm font-medium text-stone-500">
                #{index + 1}
              </div>
              <input
                className="rounded-2xl border border-stone-300 bg-white px-4 py-3 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
                onChange={(event) =>
                  updateParticipantName(participant.id, event.target.value)
                }
                value={participant.name}
              />
              <button
                className="rounded-2xl border border-stone-300 px-4 py-3 text-sm text-stone-600 transition hover:border-rose-300 hover:text-rose-600"
                onClick={() => removeParticipant(participant.id)}
                type="button"
              >
                Удалить
              </button>
            </div>
          ))}
        </div>
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
