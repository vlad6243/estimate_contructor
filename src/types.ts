export type EstimateField = "optimistic" | "realistic" | "pessimistic";

export type EstimateTriple = {
  optimistic: number | null;
  realistic: number | null;
  pessimistic: number | null;
};

export type Participant = {
  id: string;
  name: string;
  driveFile?: DriveFile | null;
};

export type Project = {
  name: string;
  questionDeadline: string;
  estimateDeadline: string;
  redmineUrl: string;
};

export type Section = {
  id: string;
  name: string;
  enabled: boolean;
  rate: number;
};

export type EstimateItem = {
  id: string;
  sectionId: string;
  parentId: string | null;
  title: string;
  risks: string;
  projectOnly: boolean;
  initialization: boolean;
  estimatesByParticipant: Record<string, EstimateTriple>;
};

export type RiskItem = {
  id: string;
  text: string;
  checked: boolean;
};

export type DriveFile = {
  id: string;
  name: string;
  webViewLink: string | null;
  uploadedAt: string;
};

export type WizardStep = {
  id: string;
  kind: "project" | "structure" | "participant" | "summary" | "rates" | "risks";
  label: string;
  description: string;
  participantId?: string;
};
