export type TreatmentCaseRiskLevel = "Standard" | "Moderate" | "High Review" | string;

export type TreatmentCase = {
  id: string;
  treatmentId: string | null;
  treatmentName?: string | null;
  treatmentCategory?: string | null;

  title: string;
  surfaceType: string | null;
  conditionLevel: string | null;
  problemType: string | null;
  recommendedMix: string | null;
  dwellTime: string | null;
  toolsNeeded: string | null;
  stepByStep: string | null;
  safetyChecklist: string | null;
  pricingNote: string | null;
  customerExpectation: string | null;
  riskLevel: TreatmentCaseRiskLevel;

  createdAt: string;
  updatedAt: string;
};

export type TreatmentCaseFormState = {
  id: string | null;
  treatmentId: string;
  title: string;
  surfaceType: string;
  conditionLevel: string;
  problemType: string;
  recommendedMix: string;
  dwellTime: string;
  toolsNeeded: string;
  stepByStep: string;
  safetyChecklist: string;
  pricingNote: string;
  customerExpectation: string;
  riskLevel: string;
};

export const emptyTreatmentCaseForm: TreatmentCaseFormState = {
  id: null,
  treatmentId: "",
  title: "",
  surfaceType: "",
  conditionLevel: "",
  problemType: "",
  recommendedMix: "",
  dwellTime: "",
  toolsNeeded: "",
  stepByStep: "",
  safetyChecklist: "",
  pricingNote: "",
  customerExpectation: "",
  riskLevel: "Standard"
};

export function normalizeTreatmentCase(item: TreatmentCase): TreatmentCase {
  return {
    ...item,
    treatmentId: item.treatmentId || null,
    treatmentName: item.treatmentName || null,
    treatmentCategory: item.treatmentCategory || null,
    title: item.title || "",
    surfaceType: item.surfaceType || "",
    conditionLevel: item.conditionLevel || "",
    problemType: item.problemType || "",
    recommendedMix: item.recommendedMix || "",
    dwellTime: item.dwellTime || "",
    toolsNeeded: item.toolsNeeded || "",
    stepByStep: item.stepByStep || "",
    safetyChecklist: item.safetyChecklist || "",
    pricingNote: item.pricingNote || "",
    customerExpectation: item.customerExpectation || "",
    riskLevel: item.riskLevel || "Standard",
    createdAt: item.createdAt || "",
    updatedAt: item.updatedAt || ""
  };
}

export function caseToForm(item: TreatmentCase): TreatmentCaseFormState {
  return {
    id: item.id,
    treatmentId: item.treatmentId || "",
    title: item.title || "",
    surfaceType: item.surfaceType || "",
    conditionLevel: item.conditionLevel || "",
    problemType: item.problemType || "",
    recommendedMix: item.recommendedMix || "",
    dwellTime: item.dwellTime || "",
    toolsNeeded: item.toolsNeeded || "",
    stepByStep: item.stepByStep || "",
    safetyChecklist: item.safetyChecklist || "",
    pricingNote: item.pricingNote || "",
    customerExpectation: item.customerExpectation || "",
    riskLevel: item.riskLevel || "Standard"
  };
}

export function formToTreatmentCasePayload(form: TreatmentCaseFormState) {
  return {
    treatmentId: form.treatmentId || null,
    title: form.title.trim(),
    surfaceType: form.surfaceType.trim(),
    conditionLevel: form.conditionLevel.trim(),
    problemType: form.problemType.trim(),
    recommendedMix: form.recommendedMix.trim(),
    dwellTime: form.dwellTime.trim(),
    toolsNeeded: form.toolsNeeded.trim(),
    stepByStep: form.stepByStep.trim(),
    safetyChecklist: form.safetyChecklist.trim(),
    pricingNote: form.pricingNote.trim(),
    customerExpectation: form.customerExpectation.trim(),
    riskLevel: form.riskLevel.trim() || "Standard"
  };
}

export function treatmentCaseMatchesSearch(item: TreatmentCase, search: string) {
  if (!search.trim()) return true;

  const q = search.toLowerCase();

  return [
    item.title,
    item.treatmentName,
    item.treatmentCategory,
    item.surfaceType,
    item.conditionLevel,
    item.problemType,
    item.recommendedMix,
    item.dwellTime,
    item.toolsNeeded,
    item.stepByStep,
    item.safetyChecklist,
    item.pricingNote,
    item.customerExpectation,
    item.riskLevel
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(q);
}

export function treatmentCaseRiskBadgeClass(riskLevel: string) {
  if (riskLevel === "High Review") return "statusBadge status-pending_admin_approval";
  if (riskLevel === "Moderate") return "statusBadge status-approved";
  return "statusBadge status-paid";
}

export function buildTreatmentCaseSummary(item: TreatmentCase) {
  return [
    `Treatment Case: ${item.title}`,
    `Linked Treatment: ${item.treatmentName || "Not linked"}`,
    `Surface: ${item.surfaceType || "Not listed"}`,
    `Condition: ${item.conditionLevel || "Not listed"}`,
    `Problem Type: ${item.problemType || "Not listed"}`,
    `Recommended Mix: ${item.recommendedMix || "Not listed"}`,
    `Dwell Time: ${item.dwellTime || "Not listed"}`,
    `Tools Needed: ${item.toolsNeeded || "Not listed"}`,
    `Steps: ${item.stepByStep || "Not listed"}`,
    `Safety Checklist: ${item.safetyChecklist || "Not listed"}`,
    `Pricing Note: ${item.pricingNote || "Not listed"}`,
    `Customer Expectation: ${item.customerExpectation || "Not listed"}`,
    `Risk Level: ${item.riskLevel || "Standard"}`
  ].join("\n");
}
