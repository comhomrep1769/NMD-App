import React from "react";

export type ChemicalListItem = {
  id: string;
  chemicalName: string;
  purchaseLink: string;
  category: string;
  primaryUseCases: string;
  safetyNotes: string;
  damageWarnings: string;
  notes: string;
};

type ChemicalForm = {
  chemicalName: string;
  purchaseLink: string;
  category: string;
  primaryUseCases: string;
  safetyNotes: string;
  damageWarnings: string;
  notes: string;
};

const emptyForm: ChemicalForm = {
  chemicalName: "",
  purchaseLink: "",
  category: "",
  primaryUseCases: "",
  safetyNotes: "",
  damageWarnings: "",
  notes: ""
};

const starterChemicals: ChemicalListItem[] = [
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
      "Usually cheaper and fresher from pool supply, pressure washing supplier, or local chemical distributor than Amazon."
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
    notes: "Elemonator-style surfactant reference."
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
    notes: "Common wood brightener and rust/mineral treatment."
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
    notes: "Useful before oxalic brightening."
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
    notes: "Premium specialty restoration product."
  }
];

function makeId() {
  return `chemical-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function parseCsvLine(line: string) {
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

function parseChemicalCsv(text: string) {
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
  const primaryUseCasesIndex = findIndex("primary_use_cases", "primaryUseCases", "use_cases", "useCases");
  const safetyNotesIndex = findIndex("safety_notes", "safetyNotes");
  const damageWarningsIndex = findIndex("damage_warnings", "damageWarnings");
  const notesIndex = findIndex("notes");

  if (chemicalNameIndex === -1) {
    throw new Error("CSV is missing chemical_name column.");
  }

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);

    return {
      id: makeId(),
      chemicalName: values[chemicalNameIndex] || "",
      purchaseLink: purchaseLinkIndex >= 0 ? values[purchaseLinkIndex] || "" : "",
      category: categoryIndex >= 0 ? values[categoryIndex] || "" : "",
      primaryUseCases: primaryUseCasesIndex >= 0 ? values[primaryUseCasesIndex] || "" : "",
      safetyNotes: safetyNotesIndex >= 0 ? values[safetyNotesIndex] || "" : "",
      damageWarnings: damageWarningsIndex >= 0 ? values[damageWarningsIndex] || "" : "",
      notes: notesIndex >= 0 ? values[notesIndex] || "" : ""
    };
  });
}

function escapeCsv(value: string) {
  const safe = String(value || "");

  if (safe.includes(",") || safe.includes('"') || safe.includes("\n")) {
    return `"${safe.replace(/"/g, '""')}"`;
  }

  return safe;
}

function downloadCsv(items: ChemicalListItem[]) {
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

  const csv = [
    headers.join(","),
    ...rows.map((row) => row.map(escapeCsv).join(","))
  ].join("\n");

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

function formToChemical(form: ChemicalForm): ChemicalListItem {
  return {
    id: makeId(),
    chemicalName: form.chemicalName.trim(),
    purchaseLink: form.purchaseLink.trim(),
    category: form.category.trim(),
    primaryUseCases: form.primaryUseCases.trim(),
    safetyNotes: form.safetyNotes.trim(),
    damageWarnings: form.damageWarnings.trim(),
    notes: form.notes.trim()
  };
}

function chemicalMatchesSearch(item: ChemicalListItem, search: string) {
  const value = search.trim().toLowerCase();

  if (!value) return true;

  const haystack = [
    item.chemicalName,
    item.purchaseLink,
    item.category,
    item.primaryUseCases,
    item.safetyNotes,
    item.damageWarnings,
    item.notes
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(value);
}

export default function ChemicalListAdminPanel() {
  const [items, setItems] = React.useState<ChemicalListItem[]>(starterChemicals);
  const [form, setForm] = React.useState<ChemicalForm>(emptyForm);
  const [search, setSearch] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState("all");
  const [expandedId, setExpandedId] = React.useState<string | null>(starterChemicals[0]?.id || null);
  const [success, setSuccess] = React.useState("");
  const [error, setError] = React.useState("");

  const categories = Array.from(
    new Set(items.map((item) => item.category).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));

  const visibleItems = items.filter((item) => {
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    return matchesCategory && chemicalMatchesSearch(item, search);
  });

  const updateForm = (field: keyof ChemicalForm, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const addChemical = (event: React.FormEvent) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!form.chemicalName.trim()) {
      setError("Chemical name is required.");
      return;
    }

    const next = formToChemical(form);

    setItems((prev) =>
      [next, ...prev].sort((a, b) => a.chemicalName.localeCompare(b.chemicalName))
    );

    setExpandedId(next.id);
    setForm(emptyForm);
    setSuccess(`Added ${next.chemicalName}.`);
  };

  const removeChemical = (id: string) => {
    const item = items.find((entry) => entry.id === id);
    const ok = window.confirm(`Remove ${item?.chemicalName || "this chemical"} from the visual list?`);

    if (!ok) return;

    setItems((prev) => prev.filter((entry) => entry.id !== id));
    setSuccess("Chemical removed from visual list.");
  };

  const loadCsv = async (file: File) => {
    setError("");
    setSuccess("");

    try {
      const text = await file.text();
      const parsed = parseChemicalCsv(text).filter((item) => item.chemicalName.trim());

      if (parsed.length === 0) {
        throw new Error("No valid chemicals were found in this CSV.");
      }

      setItems((prev) => {
        const existingNames = new Set(prev.map((item) => item.chemicalName.toLowerCase()));
        const uniqueNew = parsed.filter(
          (item) => !existingNames.has(item.chemicalName.toLowerCase())
        );

        return [...uniqueNew, ...prev].sort((a, b) =>
          a.chemicalName.localeCompare(b.chemicalName)
        );
      });

      setSuccess(`CSV loaded. Added ${parsed.length} chemical row(s) to the visual list.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load chemical CSV.");
    }
  };

  return (
    <section className="panel">
      <div className="panelHeader">
        <div>
          <h2 className="panelTitle">Chemical List</h2>
          <p className="brandSubtitle">
            Admin input and visual reference for treatment chemicals, purchase links,
            use cases, safety notes, and damage warnings.
          </p>
        </div>

        <div className="buttonRow">
          <button
            className="secondaryButton"
            type="button"
            onClick={() => downloadCsv(items)}
            disabled={items.length === 0}
          >
            Export Chemical CSV
          </button>

          <a
            className="primaryButton"
            href="https://www.amazon.com"
            target="_blank"
            rel="noreferrer"
          >
            Search Amazon
          </a>
        </div>
      </div>

      {error && <div className="errorBox">{error}</div>}

      {success && (
        <div className="listCard" style={{ borderColor: "rgba(34, 197, 94, 0.65)" }}>
          {success}
        </div>
      )}

      <div className="errorBox">
        <strong>Admin note:</strong> Going forward, you can add chemicals with only{" "}
        <strong>chemical name + purchase link</strong>. Category, use cases, safety notes,
        damage warnings, and notes can be filled in now or enriched later.
      </div>

      <form className="formGrid" onSubmit={addChemical} style={{ marginTop: 16 }}>
        <label className="fieldLabel">
          Chemical Name
          <input
            className="textInput"
            value={form.chemicalName}
            onChange={(e) => updateForm("chemicalName", e.target.value)}
            placeholder="Example: Oxalic Acid"
          />
        </label>

        <label className="fieldLabel">
          Purchase Link
          <input
            className="textInput"
            value={form.purchaseLink}
            onChange={(e) => updateForm("purchaseLink", e.target.value)}
            placeholder="https://www.amazon.com/..."
          />
        </label>

        <label className="fieldLabel">
          Category
          <input
            className="textInput"
            value={form.category}
            onChange={(e) => updateForm("category", e.target.value)}
            placeholder="Soft wash, degreaser, rust removal, wood restoration..."
          />
        </label>

        <label className="fieldLabel">
          Primary Use Cases
          <textarea
            className="textInput"
            rows={3}
            value={form.primaryUseCases}
            onChange={(e) => updateForm("primaryUseCases", e.target.value)}
            placeholder="What surfaces, stains, or treatments should this chemical be used for?"
          />
        </label>

        <label className="fieldLabel">
          Safety Notes
          <textarea
            className="textInput"
            rows={3}
            value={form.safetyNotes}
            onChange={(e) => updateForm("safetyNotes", e.target.value)}
            placeholder="PPE, plant protection, runoff, mixing warnings..."
          />
        </label>

        <label className="fieldLabel">
          Damage Warnings
          <textarea
            className="textInput"
            rows={3}
            value={form.damageWarnings}
            onChange={(e) => updateForm("damageWarnings", e.target.value)}
            placeholder="What can this damage if used wrong?"
          />
        </label>

        <label className="fieldLabel">
          Notes
          <textarea
            className="textInput"
            rows={3}
            value={form.notes}
            onChange={(e) => updateForm("notes", e.target.value)}
            placeholder="Cheapest source, dilution reminder, admin review note..."
          />
        </label>

        <div className="buttonRow">
          <button className="primaryButton" type="submit">
            Add Chemical
          </button>

          <button
            className="secondaryButton"
            type="button"
            onClick={() => setForm(emptyForm)}
          >
            Clear Form
          </button>
        </div>
      </form>

      <div className="formGrid" style={{ marginTop: 16 }}>
        <label className="fieldLabel">
          Upload Chemical CSV
          <input
            className="textInput"
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) loadCsv(file);
            }}
          />
        </label>

        <label className="fieldLabel">
          Search Chemicals
          <input
            className="textInput"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search: SH, oxalic, rust, degreaser, roof, wood..."
          />
        </label>

        <label className="fieldLabel">
          Category Filter
          <select
            className="textInput"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="statsGrid" style={{ marginTop: 16 }}>
        <div className="statCard">
          <div className="statLabel">Chemicals</div>
          <div className="statValue">{items.length}</div>
        </div>

        <div className="statCard">
          <div className="statLabel">Visible</div>
          <div className="statValue">{visibleItems.length}</div>
        </div>

        <div className="statCard">
          <div className="statLabel">Categories</div>
          <div className="statValue">{categories.length}</div>
        </div>
      </div>

      <div className="cardsGrid" style={{ marginTop: 16 }}>
        {visibleItems.map((item) => {
          const expanded = expandedId === item.id;

          return (
            <div key={item.id} className="quoteCard">
              <div className="quoteTopRow">
                <div>
                  <div className="quoteNumber">{item.chemicalName}</div>
                  <div className="cardLine">
                    <strong>Category:</strong> {item.category || "Uncategorized"}
                  </div>
                </div>

                <span className="statusBadge status-approved">Chemical</span>
              </div>

              <div className="cardLine">
                <strong>Use cases:</strong> {item.primaryUseCases || "Add use cases."}
              </div>

              <div className="buttonRow" style={{ marginTop: 12 }}>
                {item.purchaseLink && (
                  <a
                    className="primaryButton"
                    href={item.purchaseLink}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Purchase Link
                  </a>
                )}

                <button
                  className="secondaryButton"
                  type="button"
                  onClick={() => setExpandedId(expanded ? null : item.id)}
                >
                  {expanded ? "Hide Details" : "View Details"}
                </button>

                <button
                  className="dangerButton"
                  type="button"
                  onClick={() => removeChemical(item.id)}
                >
                  Remove
                </button>
              </div>

              {expanded && (
                <div style={{ marginTop: 14 }}>
                  <div className="assignBox">
                    <div className="assignTitle">Safety Notes</div>
                    <div className="cardLine" style={{ whiteSpace: "pre-wrap" }}>
                      {item.safetyNotes || "No safety notes added yet."}
                    </div>
                  </div>

                  <div className="assignBox">
                    <div className="assignTitle">Damage Warnings</div>
                    <div className="cardLine" style={{ whiteSpace: "pre-wrap" }}>
                      {item.damageWarnings || "No damage warnings added yet."}
                    </div>
                  </div>

                  <div className="assignBox">
                    <div className="assignTitle">Purchase Link</div>
                    <div className="cardLine" style={{ wordBreak: "break-word" }}>
                      {item.purchaseLink || "No purchase link added yet."}
                    </div>
                  </div>

                  <div className="assignBox">
                    <div className="assignTitle">Notes</div>
                    <div className="cardLine" style={{ whiteSpace: "pre-wrap" }}>
                      {item.notes || "No notes added yet."}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {visibleItems.length === 0 && (
          <div className="listCard">No chemicals match the current search/filter.</div>
        )}
      </div>
    </section>
  );
}
