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
  planText?: string;
  createdAt: string;
  updatedAt?: string;
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
    planText: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

export function normalizeTreatmentPlan(plan: TreatmentPlan): TreatmentPlan {
  return {
    ...plan,
    jobName: plan.jobName || "Untitled Treatment Plan",
    clientName: plan.clientName || "",
    serviceAddress: plan.serviceAddress || "",
    surfaceType: plan.surfaceType || "",
    conditionLevel: plan.conditionLevel || "",
    selectedTreatmentIds: Array.isArray(plan.selectedTreatmentIds)
      ? plan.selectedTreatmentIds
      : [],
    selectedCaseIds: Array.isArray(plan.selectedCaseIds) ? plan.selectedCaseIds : [],
    notes: plan.notes || "",
    planText: plan.planText || "",
    createdAt: plan.createdAt || new Date().toISOString(),
    updatedAt: plan.updatedAt || plan.createdAt || new Date().toISOString()
  };
}

export function getHighestPlanRisk(cases: TreatmentCase[]) {
  if (cases.some((item) => item.riskLevel === "High Review")) return "High Review";
  if (cases.some((item) => item.riskLevel === "Moderate")) return "Moderate";
  return "Standard";
}
