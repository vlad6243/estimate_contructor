import type {
  DriveFile,
  EstimateItem,
  EstimateTriple,
  Participant,
  Project,
  RiskItem,
  Section,
} from "../types";

type ParsedEstimateCsv = {
  project: Project;
  participants: Participant[];
  sections: Section[];
  items: EstimateItem[];
  riskItems: RiskItem[];
  driveFile: DriveFile | null;
};

export function parseEstimateCsv(
  csv: string,
  driveFile: DriveFile | null = null,
): ParsedEstimateCsv {
  const rows = parseCsv(csv);

  if (rows.length < 6) {
    throw new Error("CSV слишком короткий или не соответствует ожидаемому формату.");
  }

  const headerRowIndex = rows.findIndex(
    (row) => row[0] === "Раздел" && row[1] === "Пункт",
  );

  if (headerRowIndex === -1) {
    throw new Error("В CSV не найдена строка заголовка таблицы.");
  }

  const project: Project = {
    name: getValue(rows, 0, 1),
    questionDeadline: getValue(rows, 1, 1),
    estimateDeadline: getValue(rows, 2, 1),
    redmineUrl: getValue(rows, 3, 1),
  };

  const headerRow = rows[headerRowIndex];
  const summaryStartIndex = headerRow.indexOf("Сводная Опт");

  if (summaryStartIndex === -1 || summaryStartIndex < 2) {
    throw new Error("В CSV не найдены колонки сводной оценки.");
  }

  const participantColumns = headerRow.slice(2, summaryStartIndex);
  if (participantColumns.length % 3 !== 0) {
    throw new Error("Колонки участников в CSV повреждены.");
  }

  const participants: Participant[] = [];
  for (let index = 0; index < participantColumns.length; index += 3) {
    const participantName = participantColumns[index].replace(/\s+Опт$/, "").trim();
    participants.push({
      id: `participant-${crypto.randomUUID()}`,
      name: participantName || `Участник ${participants.length + 1}`,
    });
  }

  const rateColumnIndex = headerRow.indexOf("Рейт");
  const risksColumnIndex = headerRow.indexOf("Риски");
  if (rateColumnIndex === -1 || risksColumnIndex === -1) {
    throw new Error("В CSV не найдены обязательные колонки Рейт или Риски.");
  }

  const sections: Section[] = [];
  const items: EstimateItem[] = [];
  let currentSection: Section | null = null;
  let lastRootItemId: string | null = null;

  for (let rowIndex = headerRowIndex + 1; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex];
    const firstCell = (row[0] ?? "").trim();
    const secondCell = (row[1] ?? "").trim();

    if (!firstCell && !secondCell && row.every((cell) => !cell)) {
      continue;
    }

    if (firstCell === "ИТОГО") {
      continue;
    }

    if (firstCell === "Риски и вопросы") {
      break;
    }

    if (firstCell && secondCell === "ИТОГО") {
      currentSection = {
        id: `section-${crypto.randomUUID()}`,
        name: firstCell,
        enabled: true,
        rate: Number.parseFloat(row[rateColumnIndex] ?? "0") || 0,
      };
      sections.push(currentSection);
      lastRootItemId = null;
      continue;
    }

    if (!currentSection || row[0] !== "") {
      continue;
    }

    const rawTitle = row[1] ?? "";
    const isChild = rawTitle.startsWith("  ");
    const title = rawTitle.trim();
    const itemId = `item-${crypto.randomUUID()}`;
    const parentId = isChild ? lastRootItemId : null;
    const estimatesByParticipant = Object.fromEntries(
      participants.map((participant, participantIndex) => [
        participant.id,
        parseEstimateTriple(row, 2 + participantIndex * 3),
      ]),
    );

    if (!isChild) {
      lastRootItemId = itemId;
    }

    items.push({
      id: itemId,
      sectionId: currentSection.id,
      parentId,
      title,
      risks: row[risksColumnIndex] ?? "",
      projectOnly: false,
      initialization: false,
      estimatesByParticipant,
    });
  }

  const risksHeaderIndex = rows.findIndex((row) => row[0] === "Риски и вопросы");
  const riskItems: RiskItem[] =
    risksHeaderIndex === -1
      ? []
      : rows
          .slice(risksHeaderIndex + 1)
          .map((row) => row[0]?.trim() ?? "")
          .filter(Boolean)
          .map((text) => ({
            id: `risk-${crypto.randomUUID()}`,
            text: text.replace(/^-+\s*/, ""),
            checked: true,
          }));

  return {
    project,
    participants,
    sections,
    items,
    riskItems,
    driveFile,
  };
}

function parseEstimateTriple(row: string[], startIndex: number): EstimateTriple {
  return {
    optimistic: parseNullableNumber(row[startIndex]),
    realistic: parseNullableNumber(row[startIndex + 1]),
    pessimistic: parseNullableNumber(row[startIndex + 2]),
  };
}

function parseNullableNumber(value: string | undefined) {
  const normalized = (value ?? "").trim();
  if (!normalized || normalized === "—") {
    return null;
  }

  const numeric = Number.parseFloat(normalized.replace(",", "."));
  return Number.isNaN(numeric) ? null : numeric;
}

function getValue(rows: string[][], rowIndex: number, columnIndex: number) {
  const value = rows[rowIndex]?.[columnIndex] ?? "";
  return value === "—" ? "" : value;
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
