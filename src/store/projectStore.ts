import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  DriveFile,
  EstimateField,
  EstimateItem,
  Participant,
  Project,
  RiskItem,
  Section,
  WizardStep,
} from "../types";

function createDefaultParticipants(): Participant[] {
  return [
    { id: "p-1", name: "Юрий Гребенюк", driveFile: null },
    { id: "p-2", name: "Сергей Семко", driveFile: null },
    { id: "p-3", name: "Виталий Марушко", driveFile: null },
  ];
}

function createDefaultSections(): Section[] {
  return [
    { id: "frontend", name: "Фронтенд", enabled: true, rate: 45 },
    { id: "backend", name: "Бэкенд", enabled: true, rate: 50 },
    { id: "admin", name: "Админка", enabled: true, rate: 42 },
  ];
}

function createDefaultProject(): Project {
  return {
    name: "Новая оценка",
    questionDeadline: "",
    estimateDeadline: "",
    redmineUrl: "",
  };
}

function createDefaultRisks(): RiskItem[] {
  return [
    {
      id: "risk-1",
      checked: true,
      text: "At this point, we provide our estimate based on the current scope of work. It is a rough quote for guidance.",
    },
    {
      id: "risk-2",
      checked: true,
      text: "Design works are not included and are estimated separately when required.",
    },
    {
      id: "risk-3",
      checked: false,
      text: "The current quote assumes milestone delivery with 2-week sprints for longer projects.",
    },
  ];
}

function createEstimateItem(
  params: Pick<
    EstimateItem,
    "id" | "sectionId" | "parentId" | "title" | "risks" | "projectOnly" | "initialization"
  >,
  participants = createDefaultParticipants(),
): EstimateItem {
  return {
    ...params,
    estimatesByParticipant: Object.fromEntries(
      participants.map((participant) => [
        participant.id,
        { optimistic: null, realistic: null, pessimistic: null },
      ]),
    ),
  };
}

function createDefaultItems(participants = createDefaultParticipants()): EstimateItem[] {
  const items: EstimateItem[] = [
    createEstimateItem(
      {
        id: "item-1",
        sectionId: "frontend",
        parentId: null,
        title: "Базовая архитектура",
        risks: "",
        projectOnly: false,
        initialization: true,
      },
      participants,
    ),
    createEstimateItem(
      {
        id: "item-2",
        sectionId: "frontend",
        parentId: null,
        title: "Элементы UI",
        risks: "",
        projectOnly: false,
        initialization: true,
      },
      participants,
    ),
    createEstimateItem(
      {
        id: "item-3",
        sectionId: "frontend",
        parentId: null,
        title: "Навигация",
        risks: "",
        projectOnly: false,
        initialization: true,
      },
      participants,
    ),
    createEstimateItem(
      {
        id: "item-4",
        sectionId: "backend",
        parentId: null,
        title: "API layer",
        risks: "",
        projectOnly: false,
        initialization: true,
      },
      participants,
    ),
  ];

  items[0].estimatesByParticipant["p-1"] = {
    optimistic: 3,
    realistic: 4,
    pessimistic: 5,
  };
  items[0].estimatesByParticipant["p-2"] = {
    optimistic: 3,
    realistic: 5,
    pessimistic: 5,
  };
  items[1].estimatesByParticipant["p-1"] = {
    optimistic: 2,
    realistic: 5,
    pessimistic: 6,
  };
  items[1].estimatesByParticipant["p-2"] = {
    optimistic: 3,
    realistic: 5,
    pessimistic: 7,
  };

  return items;
}

function createInitialState() {
  const participants = createDefaultParticipants();

  return {
    currentStepIndex: 0,
    discrepancyThreshold: 3,
    project: createDefaultProject(),
    participants,
    sections: createDefaultSections(),
    items: createDefaultItems(participants),
    riskItems: createDefaultRisks(),
    driveFile: null,
  };
}

export function buildWizardSteps(participants: Participant[]): WizardStep[] {
  return [
    {
      id: "project",
      kind: "project",
      label: "Проект",
      description: "Параметры оценки и участники",
    },
    {
      id: "structure",
      kind: "structure",
      label: "Структура",
      description: "Разделы и дерево оценки",
    },
    ...participants.map((participant, index) => ({
      id: `participant-${participant.id}`,
      kind: "participant" as const,
      label: participant.name || `Участник ${index + 1}`,
      description: "Личная страница для ввода оценок",
      participantId: participant.id,
    })),
    {
      id: "summary",
      kind: "summary",
      label: "Сводная",
      description: "Сравнение оценок участников",
    },
    {
      id: "rates",
      kind: "rates",
      label: "Рейты",
      description: "Стоимость по разделам",
    },
    {
      id: "risks",
      kind: "risks",
      label: "CSV и Drive",
      description: "Экспорт и сохранение в Google Drive",
    },
  ];
}

type ProjectState = {
  currentStepIndex: number;
  discrepancyThreshold: number;
  project: Project;
  participants: Participant[];
  sections: Section[];
  items: EstimateItem[];
  riskItems: RiskItem[];
  driveFile: DriveFile | null;
  setCurrentStep: (index: number) => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  updateProjectField: <K extends keyof Project>(field: K, value: Project[K]) => void;
  addParticipant: () => void;
  removeParticipant: (participantId: string) => void;
  updateParticipantName: (participantId: string, name: string) => void;
  toggleSection: (sectionId: string) => void;
  updateSectionRate: (sectionId: string, rate: number) => void;
  addSection: (name: string) => void;
  addItem: (
    sectionId: string,
    payload: Pick<
      EstimateItem,
      "title" | "parentId" | "projectOnly" | "initialization"
    >,
  ) => void;
  updateItemRisk: (itemId: string, risks: string) => void;
  updateItemEstimate: (
    itemId: string,
    participantId: string,
    field: EstimateField,
    value: number | null,
  ) => void;
  toggleRisk: (riskId: string) => void;
  addRisk: (text: string) => void;
  setDiscrepancyThreshold: (value: number) => void;
  setDriveFile: (file: DriveFile | null) => void;
  setParticipantDriveFile: (participantId: string, file: DriveFile | null) => void;
  importParticipantEstimateData: (payload: {
    participantId: string;
    estimatesByItemId: Record<string, { optimistic: number | null; realistic: number | null; pessimistic: number | null }>;
    driveFile?: DriveFile | null;
  }) => void;
  importEstimateData: (payload: {
    project: Project;
    participants: Participant[];
    sections: Section[];
    items: EstimateItem[];
    riskItems: RiskItem[];
    driveFile?: DriveFile | null;
  }) => void;
  resetAll: () => void;
};

export const useProjectStore = create<ProjectState>()(
  persist(
    (set) => ({
      ...createInitialState(),
      setCurrentStep: (index) => set({ currentStepIndex: index }),
      goToNextStep: () =>
        set((state) => ({
          currentStepIndex: Math.min(
            state.currentStepIndex + 1,
            buildWizardSteps(state.participants).length - 1,
          ),
        })),
      goToPreviousStep: () =>
        set((state) => ({
          currentStepIndex: Math.max(state.currentStepIndex - 1, 0),
        })),
      updateProjectField: (field, value) =>
        set((state) => ({
          project: {
            ...state.project,
            [field]: value,
          },
        })),
      addParticipant: () =>
        set((state) => {
          const nextIndex = state.participants.length + 1;
          const participantId = `p-${crypto.randomUUID()}`;
          const participants = [
            ...state.participants,
            { id: participantId, name: `Участник ${nextIndex}`, driveFile: null },
          ];
          const items = state.items.map((item) => ({
            ...item,
            estimatesByParticipant: {
              ...item.estimatesByParticipant,
              [participantId]: {
                optimistic: null,
                realistic: null,
                pessimistic: null,
              },
            },
          }));

          return { participants, items };
        }),
      removeParticipant: (participantId) =>
        set((state) => {
          if (state.participants.length === 1) {
            return state;
          }

          const participants = state.participants.filter(
            (participant) => participant.id !== participantId,
          );
          const items = state.items.map((item) => {
            const nextEstimates = { ...item.estimatesByParticipant };
            delete nextEstimates[participantId];
            return { ...item, estimatesByParticipant: nextEstimates };
          });
          const maxIndex = buildWizardSteps(participants).length - 1;

          return {
            participants,
            items,
            currentStepIndex: Math.min(state.currentStepIndex, maxIndex),
          };
        }),
      updateParticipantName: (participantId, name) =>
        set((state) => ({
          participants: state.participants.map((participant) =>
            participant.id === participantId ? { ...participant, name } : participant,
          ),
        })),
      toggleSection: (sectionId) =>
        set((state) => ({
          sections: state.sections.map((section) =>
            section.id === sectionId
              ? { ...section, enabled: !section.enabled }
              : section,
          ),
        })),
      updateSectionRate: (sectionId, rate) =>
        set((state) => ({
          sections: state.sections.map((section) =>
            section.id === sectionId ? { ...section, rate } : section,
          ),
        })),
      addSection: (name) =>
        set((state) => ({
          sections: [
            ...state.sections,
            {
              id: `section-${crypto.randomUUID()}`,
              name,
              enabled: true,
              rate: 40,
            },
          ],
        })),
      addItem: (sectionId, payload) =>
        set((state) => ({
          items: [
            ...state.items,
            createEstimateItem(
              {
                id: `item-${crypto.randomUUID()}`,
                sectionId,
                title: payload.title,
                parentId: payload.parentId,
                projectOnly: payload.projectOnly,
                initialization: payload.initialization,
                risks: "",
              },
              state.participants,
            ),
          ],
        })),
      updateItemRisk: (itemId, risks) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === itemId ? { ...item, risks } : item,
          ),
        })),
      updateItemEstimate: (itemId, participantId, field, value) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  estimatesByParticipant: {
                    ...item.estimatesByParticipant,
                    [participantId]: {
                      ...item.estimatesByParticipant[participantId],
                      [field]: value,
                    },
                  },
                }
              : item,
          ),
        })),
      toggleRisk: (riskId) =>
        set((state) => ({
          riskItems: state.riskItems.map((risk) =>
            risk.id === riskId ? { ...risk, checked: !risk.checked } : risk,
          ),
        })),
      addRisk: (text) =>
        set((state) => ({
          riskItems: [
            ...state.riskItems,
            { id: `risk-${crypto.randomUUID()}`, text, checked: true },
          ],
        })),
      setDiscrepancyThreshold: (value) => set({ discrepancyThreshold: value }),
      setDriveFile: (file) => set({ driveFile: file }),
      setParticipantDriveFile: (participantId, file) =>
        set((state) => ({
          participants: state.participants.map((participant) =>
            participant.id === participantId
              ? { ...participant, driveFile: file }
              : participant,
          ),
        })),
      importParticipantEstimateData: (payload) =>
        set((state) => ({
          participants: state.participants.map((participant) =>
            participant.id === payload.participantId
              ? { ...participant, driveFile: payload.driveFile ?? participant.driveFile ?? null }
              : participant,
          ),
          items: state.items.map((item) => {
            const importedEstimate = payload.estimatesByItemId[item.id];

            if (!importedEstimate) {
              return item;
            }

            return {
              ...item,
              estimatesByParticipant: {
                ...item.estimatesByParticipant,
                [payload.participantId]: importedEstimate,
              },
            };
          }),
        })),
      importEstimateData: (payload) =>
        set(() => ({
          currentStepIndex: 0,
          discrepancyThreshold: 3,
          project: payload.project,
          participants: payload.participants,
          sections: payload.sections,
          items: payload.items,
          riskItems: payload.riskItems,
          driveFile: payload.driveFile ?? null,
        })),
      resetAll: () => set(createInitialState()),
    }),
    {
      name: "estimate-constructor-store",
      partialize: (state) => ({
        discrepancyThreshold: state.discrepancyThreshold,
        project: state.project,
        participants: state.participants,
        sections: state.sections,
        items: state.items,
        riskItems: state.riskItems,
        driveFile: state.driveFile,
      }),
    },
  ),
);
