import type { TreatmentCase } from "./treatmentCases";

export type TreatmentPlan = {
  id: string;
  jobName: string;
  clientName: string;
  serviceAddress: string;
  surfaceType: string;
  conditionLevel: string;
  selectedTreatmentIds: string[];
  selectedCaseIds: string[];
  notes: string;
  createdAt: string;
};

export type TreatmentPlanFormState = {
  jobName: string;
  clientName: string;
  serviceAddress: string;
  surfaceType: string;
  conditionLevel: string;
  selectedTreatmentIds: string[];
  selectedCaseIds: string[];
  notes: string;
};

export const emptyTreatmentPlanForm: TreatmentPlanFormState = {
  jobName: "",
  clientName: "",
  serviceAddress: "",
  surfaceType: "",
  conditionLevel: "",
  selectedTreatmentIds: [],
  selectedCaseIds: [],
  notes: ""
};

export function buildTreatmentPlanFromForm(form: TreatmentPlanFormState): TreatmentPlan {
  return {
    id: `local-treatment-plan-${Date.now()}`,
    jobName: form.jobName.trim() || "Untitled Treatment Plan",
    clientName: form.clientName.trim(),
    serviceAddress: form.serviceAddress.trim(),
    surfaceType: form.surfaceType.trim(),
    conditionLevel: form.conditionLevel.trim(),
    selectedTreatmentIds: form.selectedTreatmentIds,
    selectedCaseIds: form.selectedCaseIds,
    notes: form.notes.trim(),
    createdAt: new Date().toISOString()
  };
}

export function getHighestPlanRisk(cases: TreatmentCase[]) {
  if (cases.some((item) => item.riskLevel === "High Review")) return "High Review";
  if (cases.some((item) => item.riskLevel === "Moderate")) return "Moderate";
  return "Standard";
}
