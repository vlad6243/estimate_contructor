import type { DriveFile, EstimateItem, EstimateTriple, Participant, Project, Section } from "../types";
import { formatEstimate } from "./estimates";

type ParticipantCsvPayload = {
  project: Project;
  participant: Participant;
  sections: Section[];
  items: EstimateItem[];
};

type ParsedParticipantEstimateCsv = {
  projectName: string;
  participantName: string;
  estimatesByItemId: Record<string, EstimateTriple>;
  driveFile: DriveFile | null;
};

export function buildParticipantEstimateCsv({
  project,
  participant,
  sections,
  items,
}: ParticipantCsvPayload) {
  const lines: string[] = [];
  const activeSections = sections.filter((section) => section.enabled);

  lines.push(`Проект,${escapeCell(project.name || "Без названия")}`);
  lines.push(`Участник,${escapeCell(participant.name)}`);
  lines.push(`Срок вопросов,${project.questionDeadline || "—"}`);
  lines.push(`Срок оценки,${project.estimateDeadline || "—"}`);
  lines.push(`Redmine,${escapeCell(project.redmineUrl || "—")}`);
  lines.push("");
  lines.push(
    [
      "Раздел",
      "Section ID",
      "Пункт",
      "Item ID",
      "Parent Item ID",
      "Опт",
      "Реал",
      "Пес",
      "Риски",
    ].join(","),
  );

  activeSections.forEach((section) => {
    const sectionItems = items.filter((item) => item.sectionId === section.id);

    sectionItems.forEach((item) => {
      const estimate = item.estimatesByParticipant[participant.id];
      lines.push(
        [
          escapeCell(section.name),
          section.id,
          escapeCell(formatItemLabel(item.title, item.parentId)),
          item.id,
          item.parentId ?? "",
          formatEstimate(estimate?.optimistic ?? null),
          formatEstimate(estimate?.realistic ?? null),
          formatEstimate(estimate?.pessimistic ?? null),
          escapeCell(item.risks),
        ].join(","),
      );
    });
  });

  return lines.join("\n");
}

export function parseParticipantEstimateCsv(
  csv: string,
  driveFile: DriveFile | null = null,
): ParsedParticipantEstimateCsv {
  const rows = parseCsv(csv);
  const headerRowIndex = rows.findIndex(
    (row) => row[0] === "Раздел" && row[1] === "Section ID",
  );

  if (headerRowIndex === -1) {
    throw new Error("В CSV участника не найдена строка заголовка.");
  }

  const projectName = getValue(rows, 0, 1);
  const participantName = getValue(rows, 1, 1);
  const itemIdColumnIndex = rows[headerRowIndex].indexOf("Item ID");
  const optimisticColumnIndex = rows[headerRowIndex].indexOf("Опт");
  const realisticColumnIndex = rows[headerRowIndex].indexOf("Реал");
  const pessimisticColumnIndex = rows[headerRowIndex].indexOf("Пес");

  if (
    itemIdColumnIndex === -1 ||
    optimisticColumnIndex === -1 ||
    realisticColumnIndex === -1 ||
    pessimisticColumnIndex === -1
  ) {
    throw new Error("В CSV участника не найдены обязательные колонки оценок.");
  }

  const estimatesByItemId: Record<string, EstimateTriple> = {};

  rows.slice(headerRowIndex + 1).forEach((row) => {
    const itemId = (row[itemIdColumnIndex] ?? "").trim();
    if (!itemId) {
      return;
    }

    estimatesByItemId[itemId] = {
      optimistic: parseNullableNumber(row[optimisticColumnIndex]),
      realistic: parseNullableNumber(row[realisticColumnIndex]),
      pessimistic: parseNullableNumber(row[pessimisticColumnIndex]),
    };
  });

  return {
    projectName,
    participantName,
    estimatesByItemId,
    driveFile,
  };
}

function formatItemLabel(title: string, parentId: string | null) {
  return parentId ? `  ${title}` : title;
}

function getValue(rows: string[][], rowIndex: number, columnIndex: number) {
  const value = rows[rowIndex]?.[columnIndex] ?? "";
  return value === "—" ? "" : value;
}

function parseNullableNumber(value: string | undefined) {
  const normalized = (value ?? "").trim();
  if (!normalized || normalized === "—") {
    return null;
  }

  const numeric = Number.parseFloat(normalized.replace(",", "."));
  return Number.isNaN(numeric) ? null : numeric;
}

function escapeCell(value: string) {
  if (!value) {
    return "";
  }

  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replaceAll('"', '""')}"`;
  }

  return value;
}

function parseCsv(input: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const nextChar = input[index + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        cell += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        index += 1;
      }
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  if (cell !== "" || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  return rows;
}
