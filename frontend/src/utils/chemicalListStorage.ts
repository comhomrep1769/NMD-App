export type ChemicalListItem = {
  id: string;
  chemicalName: string;
  purchaseLink: string;
  category: string;
  primaryUseCases: string;
  safetyNotes: string;
  damageWarnings: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type ChemicalForm = {
  chemicalName: string;
  purchaseLink: string;
  category: string;
  primaryUseCases: string;
  safetyNotes: string;
  damageWarnings: string;
  notes: string;
};

export const emptyChemicalForm: ChemicalForm = {
  chemicalName: "",
  purchaseLink: "",
  category: "",
  primaryUseCases: "",
  safetyNotes: "",
  damageWarnings: "",
  notes: ""
};

const STORAGE_KEY = "nmd_chemical_list_items";
const STORAGE_EVENT = "nmd-chemical-list-updated";

export const starterChemicals: ChemicalListItem[] = [
  {
    id: "chemical-sh",
    chemicalName: "Sodium Hypochlorite / SH",
    purchaseLink: "https://www.amazon.com/s?k=12.5+sodium+hypochlorite+liquid+chlorine",
    category: "Soft wash / organic growth",
    primaryUseCases:
      "House wash, roof wash, vinyl siding, concrete post-treatment, algae, mildew, organic growth.",
    safetyNotes:
      "PPE required. Protect plants, metals, fabrics, painted/oxidized surfaces, electrical, and runoff areas. Never mix with acids or ammonia.",
    damageWarnings:
      "Can burn plants, bleach fabrics, corrode metals, discolor surfaces, damage coatings, and create dangerous gas if mixed incorrectly.",
    notes:
      "Usually cheaper and fresher from pool supply, pressure washing supplier, or local chemical distributor than Amazon.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "chemical-surfactant",
    chemicalName: "Exterior Wash Surfactant / House Wash Soap",
    purchaseLink:
      "https://www.amazon.com/PressureTek-Elemonator-Surfactant-Concrete-Cleaning/dp/B0DHLP2SZL",
    category: "Soft wash additive",
    primaryUseCases:
      "Helps SH cling and clean siding, gutters, roofs, trim, and exterior surfaces.",
    safetyNotes: "Use label-compatible amount with SH mixes. Rinse thoroughly.",
    damageWarnings:
      "Too much surfactant can leave residue on windows/siding and increase rinse time.",
    notes: "Elemonator-style surfactant reference.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "chemical-oxalic",
    chemicalName: "Oxalic Acid",
    purchaseLink: "https://www.amazon.com/Oxalic-Acid-99-6-Pure-2lbs/dp/B08PDKNZSC",
    category: "Rust / wood brightening / mineral stains",
    primaryUseCases:
      "Wood brightening, rust stains, tannin stains, gray wood, and some concrete rust spotting.",
    safetyNotes:
      "Acid PPE required. Avoid inhalation, skin, and eye exposure. Keep away from SH/bleach.",
    damageWarnings:
      "Can etch or discolor sensitive stone, metals, coatings, and some wood if misused.",
    notes: "Common wood brightener and rust/mineral treatment.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "chemical-percarbonate",
    chemicalName: "Sodium Percarbonate",
    purchaseLink:
      "https://www.amazon.com/Sodium-Percarbonate-lbs-Biodegradable-Scent-Free/dp/B0CCLLNZKX",
    category: "Wood cleaner / oxygen cleaner",
    primaryUseCases:
      "Wood cleaning, organic growth on wood, deck/fence cleaning, gray wood prep.",
    safetyNotes: "Use PPE. Avoid dust inhalation. Follow label and rinse thoroughly.",
    damageWarnings:
      "Wrong concentration or poor rinsing can leave residue or affect wood finish.",
    notes: "Useful before oxalic brightening.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "chemical-f9-barc",
    chemicalName: "F9 BARC / Front 9 BARC Rust Remover",
    purchaseLink: "https://www.amazon.com/Generic-Front-BARC-Concrete-Remover/dp/B0DBJB84ZV",
    category: "Specialty rust restoration",
    primaryUseCases:
      "Irrigation rust, battery acid burns, fertilizer stains, orange rust stains on concrete, pavers, and brick.",
    safetyNotes:
      "PPE and test spot required. Protect glass, metals, plants, and surrounding finishes.",
    damageWarnings: "Can etch or discolor sensitive surfaces if used incorrectly.",
    notes: "Premium specialty restoration product.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export function makeChemicalId() {
  return `chemical-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function normalizeChemicalName(value: string) {
  return value.trim().toLowerCase();
}

export function loadChemicalList(): ChemicalListItem[] {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    saveChemicalList(starterChemicals);
    return starterChemicals;
  }

  try {
    const parsed = JSON.parse(raw) as ChemicalListItem[];

    if (!Array.isArray(parsed)) {
      saveChemicalList(starterChemicals);
      return starterChemicals;
    }

    return parsed.map((item) => ({
      id: item.id || makeChemicalId(),
      chemicalName: item.chemicalName || "",
      purchaseLink: item.purchaseLink || "",
      category: item.category || "",
      primaryUseCases: item.primaryUseCases || "",
      safetyNotes: item.safetyNotes || "",
      damageWarnings: item.damageWarnings || "",
      notes: item.notes || "",
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: item.updatedAt || new Date().toISOString()
    }));
  } catch {
    saveChemicalList(starterChemicals);
    return starterChemicals;
  }
}

export function saveChemicalList(items: ChemicalListItem[]) {
  const sorted = [...items].sort((a, b) =>
    a.chemicalName.localeCompare(b.chemicalName)
  );

  localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
  window.dispatchEvent(new CustomEvent(STORAGE_EVENT));

  return sorted;
}

export function subscribeChemicalList(callback: () => void) {
  window.addEventListener(STORAGE_EVENT, callback);
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener(STORAGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function addChemicalItem(form: ChemicalForm) {
  const now = new Date().toISOString();

  const next: ChemicalListItem = {
    id: makeChemicalId(),
    chemicalName: form.chemicalName.trim(),
    purchaseLink: form.purchaseLink.trim(),
    category: form.category.trim(),
    primaryUseCases: form.primaryUseCases.trim(),
    safetyNotes: form.safetyNotes.trim(),
    damageWarnings: form.damageWarnings.trim(),
    notes: form.notes.trim(),
    createdAt: now,
    updatedAt: now
  };

  const current = loadChemicalList();
  const existingIndex = current.findIndex(
    (item) =>
      normalizeChemicalName(item.chemicalName) ===
      normalizeChemicalName(next.chemicalName)
  );

  if (existingIndex >= 0) {
    current[existingIndex] = {
      ...current[existingIndex],
      ...next,
      id: current[existingIndex].id,
      createdAt: current[existingIndex].createdAt,
      updatedAt: now
    };

    saveChemicalList(current);
    return {
      item: current[existingIndex],
      mode: "updated" as const
    };
  }

  const saved = saveChemicalList([next, ...current]);

  return {
    item: saved.find((item) => item.id === next.id) || next,
    mode: "created" as const
  };
}

export function removeChemicalItem(id: string) {
  const current = loadChemicalList();
  return saveChemicalList(current.filter((item) => item.id !== id));
}

export function clearChemicalList() {
  return saveChemicalList([]);
}

export function resetChemicalListToStarters() {
  return saveChemicalList(starterChemicals);
}

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function parseCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let insideQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const nextChar = line[index + 1];

    if (char === '"' && nextChar === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      insideQuotes = !insideQuotes;
      continue;
    }

    if (char === "," && !insideQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.trim());

  return values;
}

export function parseChemicalCsv(text: string) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error("CSV must include a header row and at least one chemical row.");
  }

  const headers = parseCsvLine(lines[0]).map(normalizeHeader);

  const findIndex = (...keys: string[]) =>
    headers.findIndex((header) => keys.map(normalizeHeader).includes(header));

  const chemicalNameIndex = findIndex("chemical_name", "chemicalName", "name", "chemical");
  const purchaseLinkIndex = findIndex("purchase_link", "purchaseLink", "link", "url");
  const categoryIndex = findIndex("category");
  const primaryUseCasesIndex = findIndex(
    "primary_use_cases",
    "primaryUseCases",
    "use_cases",
    "useCases"
  );
  const safetyNotesIndex = findIndex("safety_notes", "safetyNotes");
  const damageWarningsIndex = findIndex("damage_warnings", "damageWarnings");
  const notesIndex = findIndex("notes");

  if (chemicalNameIndex === -1) {
    throw new Error("CSV is missing chemical_name column.");
  }

  return lines
    .slice(1)
    .map((line) => {
      const values = parseCsvLine(line);
      const now = new Date().toISOString();

      return {
        id: makeChemicalId(),
        chemicalName: values[chemicalNameIndex] || "",
        purchaseLink: purchaseLinkIndex >= 0 ? values[purchaseLinkIndex] || "" : "",
        category: categoryIndex >= 0 ? values[categoryIndex] || "" : "",
        primaryUseCases:
          primaryUseCasesIndex >= 0 ? values[primaryUseCasesIndex] || "" : "",
        safetyNotes: safetyNotesIndex >= 0 ? values[safetyNotesIndex] || "" : "",
        damageWarnings:
          damageWarningsIndex >= 0 ? values[damageWarningsIndex] || "" : "",
        notes: notesIndex >= 0 ? values[notesIndex] || "" : "",
        createdAt: now,
        updatedAt: now
      };
    })
    .filter((item) => item.chemicalName.trim());
}

export function mergeChemicalList(incoming: ChemicalListItem[]) {
  const current = loadChemicalList();
  const byName = new Map<string, ChemicalListItem>();

  current.forEach((item) => {
    byName.set(normalizeChemicalName(item.chemicalName), item);
  });

  let created = 0;
  let updated = 0;

  incoming.forEach((item) => {
    const key = normalizeChemicalName(item.chemicalName);
    const existing = byName.get(key);

    if (existing) {
      byName.set(key, {
        ...existing,
        ...item,
        id: existing.id,
        createdAt: existing.createdAt,
        updatedAt: new Date().toISOString()
      });
      updated += 1;
    } else {
      byName.set(key, {
        ...item,
        id: item.id || makeChemicalId(),
        createdAt: item.createdAt || new Date().toISOString(),
        updatedAt: item.updatedAt || new Date().toISOString()
      });
      created += 1;
    }
  });

  const saved = saveChemicalList(Array.from(byName.values()));

  return {
    items: saved,
    created,
    updated
  };
}

export function escapeCsv(value: string) {
  const safe = String(value || "");

  if (safe.includes(",") || safe.includes('"') || safe.includes("\n")) {
    return `"${safe.replace(/"/g, '""')}"`;
  }

  return safe;
}

export function buildChemicalCsv(items: ChemicalListItem[]) {
  const headers = [
    "chemical_name",
    "purchase_link",
    "category",
    "primary_use_cases",
    "safety_notes",
    "damage_warnings",
    "notes"
  ];

  const rows = items.map((item) => [
    item.chemicalName,
    item.purchaseLink,
    item.category,
    item.primaryUseCases,
    item.safetyNotes,
    item.damageWarnings,
    item.notes
  ]);

  return [
    headers.join(","),
    ...rows.map((row) => row.map(escapeCsv).join(","))
  ].join("\n");
}

export function downloadChemicalCsv(items: ChemicalListItem[]) {
  const csv = buildChemicalCsv(items);

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "nmd_chemical_list_upload.csv";
  link.click();

  URL.revokeObjectURL(url);
}
