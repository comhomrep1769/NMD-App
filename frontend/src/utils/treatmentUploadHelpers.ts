import type { TreatmentItem } from "../types";

export type TreatmentUploadRow = {
  name: string;
  category: string;
  surfaceTypes: string[];
  chemical: string;
  dilutionRatio: string;
  useCase: string;
  safetyNotes: string;
  instructions: string;
  purchaseLink: string;
  costReference: string;
};

export type TreatmentUploadPreview = {
  rows: TreatmentUploadRow[];
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

function parseSurfaceTypes(value: string) {
  return String(value || "")
    .split(/[;,|]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeRawRow(row: Record<string, string>, index: number) {
  const name = getCell(row, ["name", "treatmentname", "title"]);
  const category = getCell(row, ["category", "type"]) || "General";

  if (!name) {
    throw new Error(`Row ${index + 1}: missing name.`);
  }

  return {
    name,
    category,
    surfaceTypes: parseSurfaceTypes(
      getCell(row, ["surfacetypes", "surfaces", "surfacetype", "surface"])
    ),
    chemical: getCell(row, ["chemical", "product", "chemicalproduct"]),
    dilutionRatio: getCell(row, ["dilutionratio", "dilution", "mix", "recommendedmix"]),
    useCase: getCell(row, ["usecase", "problem", "problemtype", "description"]),
    safetyNotes: getCell(row, ["safetynotes", "safety", "risknotes"]),
    instructions: getCell(row, ["instructions", "steps", "stepbystep", "workflow"]),
    purchaseLink: getCell(row, ["purchaselink", "link", "url", "productlink"]),
    costReference: getCell(row, ["costreference", "pricing", "pricingnote", "cost"])
  };
}

export function parseTreatmentCsv(text: string): TreatmentUploadPreview {
  const errors: string[] = [];
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return {
      rows: [],
      errors: ["CSV must include a header row and at least one treatment row."]
    };
  }

  const headers = splitCsvLine(lines[0]).map(cleanHeader);
  const rows: TreatmentUploadRow[] = [];

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

export function parseTreatmentJson(text: string): TreatmentUploadPreview {
  const errors: string[] = [];

  try {
    const parsed = JSON.parse(text);
    const array = Array.isArray(parsed) ? parsed : parsed.treatments;

    if (!Array.isArray(array)) {
      return {
        rows: [],
        errors: ["JSON must be an array or an object with a treatments array."]
      };
    }

    const rows: TreatmentUploadRow[] = [];

    array.forEach((item, index) => {
      try {
        const raw = item as Record<string, unknown>;

        const name = String(raw.name || raw.treatmentName || raw.title || "").trim();
        if (!name) throw new Error(`JSON row ${index + 1}: missing name.`);

        rows.push({
          name,
          category: String(raw.category || raw.type || "General").trim(),
          surfaceTypes: Array.isArray(raw.surfaceTypes)
            ? raw.surfaceTypes.map((surface) => String(surface).trim()).filter(Boolean)
            : parseSurfaceTypes(String(raw.surfaceTypes || raw.surface_types || raw.surfaces || "")),
          chemical: String(raw.chemical || raw.product || "").trim(),
          dilutionRatio: String(raw.dilutionRatio || raw.dilution_ratio || raw.mix || "").trim(),
          useCase: String(raw.useCase || raw.use_case || raw.description || "").trim(),
          safetyNotes: String(raw.safetyNotes || raw.safety_notes || raw.safety || "").trim(),
          instructions: String(raw.instructions || raw.steps || raw.stepByStep || "").trim(),
          purchaseLink: String(raw.purchaseLink || raw.purchase_link || raw.link || "").trim(),
          costReference: String(raw.costReference || raw.cost_reference || raw.pricing || "").trim()
        });
      } catch (err) {
        errors.push(err instanceof Error ? err.message : `JSON row ${index + 1}: invalid row.`);
      }
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

export function parseTreatmentUploadFile(fileName: string, text: string) {
  const lower = fileName.toLowerCase();

  if (lower.endsWith(".json")) {
    return parseTreatmentJson(text);
  }

  return parseTreatmentCsv(text);
}

export function buildTreatmentTemplateCsv() {
  return [
    [
      "name",
      "category",
      "surfaceTypes",
      "chemical",
      "dilutionRatio",
      "useCase",
      "safetyNotes",
      "instructions",
      "purchaseLink",
      "costReference"
    ].join(","),
    [
      "Example Rust Removal",
      "Specialty Restoration",
      "Concrete; Pavers; Stucco",
      "F9 BARC or oxalic acid",
      "Follow label / test first",
      "Orange irrigation rust staining",
      "PPE, test spot, protect plants, avoid glass and metals",
      "Inspect, test, apply, dwell, rinse, repeat if safe",
      "",
      "Small spots $50-$100, heavy irrigation staining $300-$800+"
    ]
      .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
      .join(",")
  ].join("\n");
}

export function downloadTreatmentUploadTemplate() {
  const blob = new Blob([buildTreatmentTemplateCsv()], {
    type: "text/csv;charset=utf-8"
  });

  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "nmd-treatment-upload-template.csv";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}

export function uploadedRowsToTreatmentItems(rows: TreatmentUploadRow[]): TreatmentItem[] {
  return rows.map((row, index) => ({
    id: `upload-preview-${index}`,
    name: row.name,
    category: row.category,
    surfaceTypes: row.surfaceTypes,
    chemical: row.chemical,
    dilutionRatio: row.dilutionRatio,
    useCase: row.useCase,
    safetyNotes: row.safetyNotes,
    instructions: row.instructions,
    purchaseLink: row.purchaseLink,
    costReference: row.costReference,
    createdAt: "",
    updatedAt: ""
  }));
}
