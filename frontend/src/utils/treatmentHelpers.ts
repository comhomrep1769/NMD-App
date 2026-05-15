import type { TreatmentItem } from "../types";

export type TreatmentRiskLevel = "Standard" | "Moderate" | "High Review";

export type TreatmentForm = {
  id: string | null;
  name: string;
  category: string;
  surfaceTypes: string;
  chemical: string;
  dilutionRatio: string;
  useCase: string;
  safetyNotes: string;
  instructions: string;
  purchaseLink: string;
  costReference: string;
};

export const emptyTreatmentForm: TreatmentForm = {
  id: null,
  name: "",
  category: "General",
  surfaceTypes: "",
  chemical: "",
  dilutionRatio: "",
  useCase: "",
  safetyNotes: "",
  instructions: "",
  purchaseLink: "",
  costReference: ""
};

export function normalizeTreatment(item: TreatmentItem): TreatmentItem {
  return {
    ...item,
    surfaceTypes: Array.isArray(item.surfaceTypes) ? item.surfaceTypes : [],
    chemical: item.chemical || "",
    dilutionRatio: item.dilutionRatio || "",
    useCase: item.useCase || "",
    safetyNotes: item.safetyNotes || "",
    instructions: item.instructions || "",
    purchaseLink: item.purchaseLink || "",
    costReference: item.costReference || "",
    createdAt: item.createdAt || "",
    updatedAt: item.updatedAt || ""
  };
}

export function treatmentToForm(treatment: TreatmentItem): TreatmentForm {
  return {
    id: treatment.id,
    name: treatment.name || "",
    category: treatment.category || "General",
    surfaceTypes: Array.isArray(treatment.surfaceTypes)
      ? treatment.surfaceTypes.join(", ")
      : "",
    chemical: treatment.chemical || "",
    dilutionRatio: treatment.dilutionRatio || "",
    useCase: treatment.useCase || "",
    safetyNotes: treatment.safetyNotes || "",
    instructions: treatment.instructions || "",
    purchaseLink: treatment.purchaseLink || "",
    costReference: treatment.costReference || ""
  };
}

export function formToTreatmentPayload(form: TreatmentForm) {
  return {
    name: form.name.trim(),
    category: form.category.trim() || "General",
    surfaceTypes: form.surfaceTypes
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    chemical: form.chemical.trim(),
    dilutionRatio: form.dilutionRatio.trim(),
    useCase: form.useCase.trim(),
    safetyNotes: form.safetyNotes.trim(),
    instructions: form.instructions.trim(),
    purchaseLink: form.purchaseLink.trim(),
    costReference: form.costReference.trim()
  };
}

export function uniqueTreatmentCategories(treatments: TreatmentItem[]) {
  const categories = new Set<string>();

  treatments.forEach((treatment) => {
    if (treatment.category) categories.add(treatment.category);
  });

  return Array.from(categories).sort((a, b) => a.localeCompare(b));
}

export function treatmentMatchesSearch(treatment: TreatmentItem, search: string) {
  if (!search.trim()) return true;

  const q = search.toLowerCase();

  return [
    treatment.name,
    treatment.category,
    treatment.chemical,
    treatment.dilutionRatio,
    treatment.useCase,
    treatment.safetyNotes,
    treatment.instructions,
    treatment.costReference,
    ...(treatment.surfaceTypes || [])
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(q);
}

export function getTreatmentRiskLevel(treatment: TreatmentItem): TreatmentRiskLevel {
  const text = [
    treatment.name,
    treatment.category,
    treatment.chemical,
    treatment.useCase,
    treatment.safetyNotes,
    treatment.instructions,
    treatment.costReference
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (
    text.includes("roof") ||
    text.includes("rust") ||
    text.includes("oxidation") ||
    text.includes("new concrete") ||
    text.includes("painted") ||
    text.includes("restaurant") ||
    text.includes("grease") ||
    text.includes("stucco") ||
    text.includes("fall protection") ||
    text.includes("water intrusion") ||
    text.includes("specialty restoration")
  ) {
    return "High Review";
  }

  if (
    text.includes("wood") ||
    text.includes("paver") ||
    text.includes("plant") ||
    text.includes("degreaser") ||
    text.includes("runoff") ||
    text.includes("test spot")
  ) {
    return "Moderate";
  }

  return "Standard";
}

export function getRiskBadgeClass(risk: TreatmentRiskLevel) {
  if (risk === "High Review") return "statusBadge status-pending_admin_approval";
  if (risk === "Moderate") return "statusBadge status-approved";
  return "statusBadge status-paid";
}

export function buildGuruTreatmentSummary(treatment: TreatmentItem) {
  const risk = getTreatmentRiskLevel(treatment);

  return [
    `Treatment: ${treatment.name}`,
    `Category: ${treatment.category || "General"}`,
    `Risk Level: ${risk}`,
    `Surfaces: ${
      treatment.surfaceTypes && treatment.surfaceTypes.length > 0
        ? treatment.surfaceTypes.join(", ")
        : "No surfaces listed"
    }`,
    `Chemical/Product: ${treatment.chemical || "Not listed"}`,
    `Dilution: ${treatment.dilutionRatio || "Not listed"}`,
    `Use Case: ${treatment.useCase || "Not listed"}`,
    `Instructions: ${treatment.instructions || "Not listed"}`,
    `Safety Notes: ${treatment.safetyNotes || "Not listed"}`,
    `Cost/Pricing Reference: ${treatment.costReference || "Not listed"}`
  ].join("\n");
}

export function exportTreatmentsToCsv(treatments: TreatmentItem[]) {
  const headers = [
    "Name",
    "Category",
    "Risk Level",
    "Surface Types",
    "Chemical",
    "Dilution Ratio",
    "Use Case",
    "Safety Notes",
    "Instructions",
    "Cost Reference",
    "Purchase Link"
  ];

  const rows = treatments.map((treatment) => [
    treatment.name || "",
    treatment.category || "",
    getTreatmentRiskLevel(treatment),
    (treatment.surfaceTypes || []).join(", "),
    treatment.chemical || "",
    treatment.dilutionRatio || "",
    treatment.useCase || "",
    treatment.safetyNotes || "",
    treatment.instructions || "",
    treatment.costReference || "",
    treatment.purchaseLink || ""
  ]);

  const csv = [headers, ...rows]
    .map((row) =>
      row
        .map((cell) => {
          const value = String(cell).replace(/"/g, '""');
          return `"${value}"`;
        })
        .join(",")
    )
    .join("\n");

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8"
  });

  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `nmd-treatment-database-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}

export function safeNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatTreatmentNumber(value: number) {
  return value.toLocaleString(undefined, {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0
  });
}
