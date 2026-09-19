export const applicationStatuses = [
  "FOUND",
  "INTERESTING",
  "RESUME_PREPARED",
  "APPLIED",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
  "ARCHIVED",
] as const;

export type ApplicationStatus = (typeof applicationStatuses)[number];

export const applicationStatusLabels: Record<ApplicationStatus, string> = {
  FOUND: "Encontrada",
  INTERESTING: "Interessante",
  RESUME_PREPARED: "Currículo preparado",
  APPLIED: "Aplicada",
  INTERVIEW: "Entrevista",
  OFFER: "Oferta",
  REJECTED: "Rejeitada",
  ARCHIVED: "Arquivada",
};

const transitions: Record<ApplicationStatus, readonly ApplicationStatus[]> = {
  FOUND: ["INTERESTING", "APPLIED", "ARCHIVED"],
  INTERESTING: ["FOUND", "RESUME_PREPARED", "APPLIED", "ARCHIVED"],
  RESUME_PREPARED: ["INTERESTING", "APPLIED", "ARCHIVED"],
  APPLIED: ["INTERVIEW", "REJECTED", "ARCHIVED"],
  INTERVIEW: ["OFFER", "REJECTED", "ARCHIVED"],
  OFFER: ["ARCHIVED"],
  REJECTED: ["INTERESTING", "ARCHIVED"],
  ARCHIVED: ["FOUND", "INTERESTING"],
};

export function parseApplicationStatus(value: unknown): ApplicationStatus {
  if (
    typeof value !== "string" ||
    !applicationStatuses.includes(value as ApplicationStatus)
  )
    throw new Error("Estado de candidatura inválido.");
  return value as ApplicationStatus;
}

export function getAllowedApplicationTransitions(status: ApplicationStatus) {
  return transitions[status];
}

export function assertApplicationTransition(
  from: ApplicationStatus,
  to: ApplicationStatus,
) {
  if (!transitions[from].includes(to))
    throw new Error(`Transição de ${from} para ${to} não permitida.`);
}
