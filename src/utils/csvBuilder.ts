import type {
  EstimateItem,
  Participant,
  Project,
  RiskItem,
  Section,
} from "../types";
import { averageEstimate, formatEstimate, sumEstimates } from "./estimates";

type CsvPayload = {
  project: Project;
  participants: Participant[];
  sections: Section[];
  items: EstimateItem[];
  risks: RiskItem[];
};

export function buildEstimateCsv({
  project,
  participants,
  sections,
  items,
  risks,
}: CsvPayload) {
  const lines: string[] = [];
  const activeSections = sections.filter((section) => section.enabled);
  const participantHeaders = participants.flatMap((participant) => [
    `${participant.name} Опт`,
    `${participant.name} Реал`,
    `${participant.name} Пес`,
  ]);

  const sectionTotals = activeSections.map((section) => {
    const sectionItems = items.filter((item) => item.sectionId === section.id);
    const total = sumEstimates(sectionItems.map(averageEstimate));

    return { section, total, sectionItems };
  });

  const grandTotal = sumEstimates(sectionTotals.map(({ total }) => total));

  lines.push(`Проект,${project.name || "Без названия"}`);
  lines.push(`Срок вопросов,${project.questionDeadline || "—"}`);
  lines.push(`Срок оценки,${project.estimateDeadline || "—"}`);
  lines.push(`Redmine,${project.redmineUrl || "—"}`);
  lines.push("");
  lines.push(
    [
      "Раздел",
      "Пункт",
      ...participantHeaders,
      "Сводная Опт",
      "Сводная Реал",
      "Сводная Пес",
      "Рейт",
      "Стоимость (реал)",
      "Риски",
    ].join(","),
  );

  sectionTotals.forEach(({ section, sectionItems, total }) => {
    lines.push(
      [
        escapeCell(section.name),
        "ИТОГО",
        ...participants.flatMap(() => ["", "", ""]),
        formatEstimate(total.optimistic),
        formatEstimate(total.realistic),
        formatEstimate(total.pessimistic),
        section.rate.toString(),
        Math.round((total.realistic ?? 0) * section.rate).toString(),
        "",
      ].join(","),
    );

    sectionItems.forEach((item) => {
      const summary = averageEstimate(item);
      const participantCells = participants.flatMap((participant) => {
        const estimate = item.estimatesByParticipant[participant.id];

        return [
          formatEstimate(estimate?.optimistic ?? null),
          formatEstimate(estimate?.realistic ?? null),
          formatEstimate(estimate?.pessimistic ?? null),
        ];
      });

      lines.push(
        [
          "",
          escapeCell(formatItemLabel(item.title, item.parentId)),
          ...participantCells,
          formatEstimate(summary.optimistic),
          formatEstimate(summary.realistic),
          formatEstimate(summary.pessimistic),
          "",
          "",
          escapeCell(item.risks),
        ].join(","),
      );
    });
  });

  lines.push(
    [
      "ИТОГО",
      "",
      ...participants.flatMap(() => ["", "", ""]),
      formatEstimate(grandTotal.optimistic),
      formatEstimate(grandTotal.realistic),
      formatEstimate(grandTotal.pessimistic),
      "",
      "",
      "",
    ].join(","),
  );
  lines.push("");
  lines.push("Риски и вопросы");

  risks
    .filter((risk) => risk.checked)
    .forEach((risk) => lines.push(escapeCell(`- ${risk.text}`)));

  return lines.join("\n");
}

function formatItemLabel(title: string, parentId: string | null) {
  return parentId ? `  ${title}` : title;
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
