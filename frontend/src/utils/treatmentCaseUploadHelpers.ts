import type { TreatmentCase } from "../types/treatmentCases";

export type TreatmentCaseUploadRow = {
  treatmentName: string;
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

export type TreatmentCaseUploadPreview = {
  rows: TreatmentCaseUploadRow[];
  errors: string[];
};

function cleanHeader(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/_/g, "")
    .replace(/-/g, "");
}

function splitCsvLine(line: string) {
  const cells: string[] = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      quoted = !quoted;
      continue;
    }

    if (char === "," && !quoted) {
      cells.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current.trim());

  return cells;
}

function getCell(row: Record<string, string>, keys: string[]) {
  for (const key of keys) {
    const found = row[key];
    if (found !== undefined) return found.trim();
  }

  return "";
}

function normalizeRisk(value: string) {
  if (value.toLowerCase() === "high review") return "High Review";
  if (value.toLowerCase() === "moderate") return "Moderate";
  return "Standard";
}

function normalizeRawRow(row: Record<string, string>, index: number) {
  const title = getCell(row, ["title", "casetitle", "name"]);

  if (!title) {
    throw new Error(`Row ${index + 1}: missing case title.`);
  }

  return {
    treatmentName: getCell(row, ["treatmentname", "treatment", "linked treatment"]),
    title,
    surfaceType: getCell(row, ["surfacetype", "surface", "surfaces"]),
    conditionLevel: getCell(row, ["conditionlevel", "condition", "severity"]),
    problemType: getCell(row, ["problemtype", "problem", "staintype"]),
    recommendedMix: getCell(row, ["recommendedmix", "mix", "chemical", "chemistry"]),
    dwellTime: getCell(row, ["dwelltime", "dwell"]),
    toolsNeeded: getCell(row, ["toolsneeded", "tools", "equipment"]),
    stepByStep: getCell(row, ["stepbystep", "steps", "instructions", "workflow"]),
    safetyChecklist: getCell(row, ["safetychecklist", "safety", "safetynotes"]),
    pricingNote: getCell(row, ["pricingnote", "pricing", "costreference", "cost"]),
    customerExpectation: getCell(row, ["customerexpectation", "expectation", "clientnote"]),
    riskLevel: normalizeRisk(getCell(row, ["risklevel", "risk"]) || "Standard")
  };
}

export function parseTreatmentCaseCsv(text: string): TreatmentCaseUploadPreview {
  const errors: string[] = [];
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return {
      rows: [],
      errors: ["CSV must include a header row and at least one treatment case row."]
    };
  }

  const headers = splitCsvLine(lines[0]).map(cleanHeader);
  const rows: TreatmentCaseUploadRow[] = [];

  for (let index = 1; index < lines.length; index += 1) {
    try {
      const cells = splitCsvLine(lines[index]);
      const raw: Record<string, string> = {};

      headers.forEach((header, cellIndex) => {
        raw[header] = cells[cellIndex] || "";
      });

      rows.push(normalizeRawRow(raw, index));
    } catch (err) {
      errors.push(err instanceof Error ? err.message : `Row ${index + 1}: invalid row.`);
    }
  }

  return {
    rows,
    errors
  };
}

export function parseTreatmentCaseJson(text: string): TreatmentCaseUploadPreview {
  try {
    const parsed = JSON.parse(text);
    const array = Array.isArray(parsed) ? parsed : parsed.cases;

    if (!Array.isArray(array)) {
      return {
        rows: [],
        errors: ["JSON must be an array or an object with a cases array."]
      };
    }

    const rows: TreatmentCaseUploadRow[] = [];
    const errors: string[] = [];

    array.forEach((item, index) => {
      const raw = item as Record<string, unknown>;
      const title = String(raw.title || raw.caseTitle || raw.name || "").trim();

      if (!title) {
        errors.push(`JSON row ${index + 1}: missing case title.`);
        return;
      }

      rows.push({
        treatmentName: String(raw.treatmentName || raw.treatment_name || raw.treatment || "").trim(),
        title,
        surfaceType: String(raw.surfaceType || raw.surface_type || raw.surface || "").trim(),
        conditionLevel: String(raw.conditionLevel || raw.condition_level || raw.condition || "").trim(),
        problemType: String(raw.problemType || raw.problem_type || raw.problem || "").trim(),
        recommendedMix: String(raw.recommendedMix || raw.recommended_mix || raw.mix || "").trim(),
        dwellTime: String(raw.dwellTime || raw.dwell_time || raw.dwell || "").trim(),
        toolsNeeded: String(raw.toolsNeeded || raw.tools_needed || raw.tools || "").trim(),
        stepByStep: String(raw.stepByStep || raw.step_by_step || raw.steps || "").trim(),
        safetyChecklist: String(raw.safetyChecklist || raw.safety_checklist || raw.safety || "").trim(),
        pricingNote: String(raw.pricingNote || raw.pricing_note || raw.pricing || "").trim(),
        customerExpectation: String(
          raw.customerExpectation || raw.customer_expectation || raw.expectation || ""
        ).trim(),
        riskLevel: normalizeRisk(String(raw.riskLevel || raw.risk_level || raw.risk || "Standard"))
      });
    });

    return {
      rows,
      errors
    };
  } catch (err) {
    return {
      rows: [],
      errors: [err instanceof Error ? err.message : "Invalid JSON file."]
    };
  }
}

export function parseTreatmentCaseUploadFile(fileName: string, text: string) {
  if (fileName.toLowerCase().endsWith(".json")) {
    return parseTreatmentCaseJson(text);
  }

  return parseTreatmentCaseCsv(text);
}

export function buildTreatmentCaseTemplateCsv() {
  const headers = [
    "treatmentName",
    "title",
    "surfaceType",
    "conditionLevel",
    "problemType",
    "recommendedMix",
    "dwellTime",
    "toolsNeeded",
    "stepByStep",
    "safetyChecklist",
    "pricingNote",
    "customerExpectation",
    "riskLevel"
  ];

  const sample = [
    "Rust Stain Removal",
    "Heavy Irrigation Rust On Concrete",
    "Concrete / driveway / sidewalk",
    "Heavy",
    "Orange irrigation rust staining",
    "F9 BARC or compatible rust remover per label",
    "Follow label; do not allow product to dry",
    "Pump sprayer, PPE, water source, brush",
    "Inspect, test spot, protect plants, apply, dwell, rinse, repeat if safe",
    "PPE, avoid glass/metals, control runoff, protect plants",
    "Heavy irrigation rust can be $300-$800+",
    "May need multiple applications; no 100% guarantee before testing",
    "High Review"
  ];

  return [headers.join(","), sample.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")].join(
    "\n"
  );
}

export function downloadTreatmentCaseUploadTemplate() {
  const blob = new Blob([buildTreatmentCaseTemplateCsv()], {
    type: "text/csv;charset=utf-8"
  });

  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "nmd-treatment-case-upload-template.csv";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}

export function uploadedRowsToTreatmentCases(rows: TreatmentCaseUploadRow[]): TreatmentCase[] {
  return rows.map((row, index) => ({
    id: `case-upload-preview-${index}`,
    treatmentId: null,
    treatmentName: row.treatmentName,
    treatmentCategory: null,
    title: row.title,
    surfaceType: row.surfaceType,
    conditionLevel: row.conditionLevel,
    problemType: row.problemType,
    recommendedMix: row.recommendedMix,
    dwellTime: row.dwellTime,
    toolsNeeded: row.toolsNeeded,
    stepByStep: row.stepByStep,
    safetyChecklist: row.safetyChecklist,
    pricingNote: row.pricingNote,
    customerExpectation: row.customerExpectation,
    riskLevel: row.riskLevel,
    createdAt: "",
    updatedAt: ""
  }));
}
