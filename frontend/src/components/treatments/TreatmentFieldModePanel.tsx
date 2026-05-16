import React from "react";
import type { TreatmentItem } from "../../types";
import { getTreatmentRiskLevel } from "../../utils/treatmentHelpers";

function getFieldChecklist(treatment: TreatmentItem | null) {
  const base = [
    "Confirm surface type before applying chemistry.",
    "Take before photos and document pre-existing damage.",
    "Perform a test spot on sensitive, painted, oxidized, new, sealed, or specialty surfaces.",
    "Wear proper PPE and follow product label directions.",
    "Protect plants, outlets, cameras, doorbells, windows, metals, and surrounding surfaces.",
    "Control runoff and avoid letting chemical dry.",
    "Rinse plants and sensitive areas before, during, and after chemical work.",
    "Explain customer expectations before starting."
  ];

  if (!treatment) return base;

  const text = [
    treatment.name,
    treatment.category,
    treatment.chemical,
    treatment.safetyNotes,
    treatment.instructions
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (text.includes("roof")) {
    base.unshift("Verify ladder safety, pitch, access, and fall protection before roof work.");
    base.push("Control roof runoff and protect landscaping throughout the whole process.");
  }

  if (text.includes("rust")) {
    base.unshift("Test rust remover in a small area before treating the full stain.");
    base.push("Avoid overspray on glass, metals, painted surfaces, and sensitive stone.");
  }

  if (text.includes("wood")) {
    base.unshift("Avoid high pressure on wood and expect possible fuzzing on damaged boards.");
    base.push("Use brightener only when appropriate and explain color variation expectations.");
  }

  if (text.includes("painted") || text.includes("oxidation")) {
    base.unshift("Do not scrub or pressure oxidized/painted surfaces without approval.");
    base.push("Standard washing may not restore oxidation, fading, or coating damage.");
  }

  return base;
}

export default function TreatmentFieldModePanel({
  selectedTreatment,
  onClose
}: {
  selectedTreatment: TreatmentItem | null;
  onClose: () => void;
}) {
  const [checkedItems, setCheckedItems] = React.useState<string[]>([]);

  const checklist = getFieldChecklist(selectedTreatment);
  const risk = selectedTreatment ? getTreatmentRiskLevel(selectedTreatment) : "Standard";
  const completedCount = checklist.filter((item) => checkedItems.includes(item)).length;

  const toggleItem = (item: string) => {
    setCheckedItems((prev) =>
      prev.includes(item) ? prev.filter((value) => value !== item) : [...prev, item]
    );
  };

  const resetChecklist = () => {
    setCheckedItems([]);
  };

  const copyChecklist = async () => {
    const text = [
      "NMD FIELD MODE CHECKLIST",
      selectedTreatment ? `Treatment: ${selectedTreatment.name}` : "Treatment: General",
      `Risk: ${risk}`,
      "",
      ...checklist.map((item) => `${checkedItems.includes(item) ? "[x]" : "[ ]"} ${item}`)
    ].join("\n");

    try {
      await navigator.clipboard.writeText(text);
      window.alert("Field checklist copied.");
    } catch {
      window.alert(text);
    }
  };

  return (
    <section className="panel">
      <div className="panelHeader">
        <div>
          <h2 className="panelTitle">Employee Field Mode</h2>
          <p className="brandSubtitle">
            Mobile-friendly safety and prep checklist for selected treatment.
          </p>
        </div>

        <div className="buttonRow">
          <button className="secondaryButton" type="button" onClick={copyChecklist}>
            Copy Checklist
          </button>

          <button className="secondaryButton" type="button" onClick={resetChecklist}>
            Reset
          </button>

          <button className="secondaryButton" type="button" onClick={onClose}>
            Close Field Mode
          </button>
        </div>
      </div>

      <div className="statsGrid">
        <div className="statCard">
          <div className="statLabel">Treatment</div>
          <div className="statValue" style={{ fontSize: 18 }}>
            {selectedTreatment?.name || "General"}
          </div>
        </div>

        <div className="statCard">
          <div className="statLabel">Risk</div>
          <div className="statValue" style={{ fontSize: 18 }}>
            {risk}
          </div>
        </div>

        <div className="statCard">
          <div className="statLabel">Completed</div>
          <div className="statValue">
            {completedCount}/{checklist.length}
          </div>
        </div>
      </div>

      {selectedTreatment && (
        <div className="assignBox" style={{ marginTop: 16 }}>
          <div className="assignTitle">Selected Treatment Quick View</div>

          <div className="cardLine">
            <strong>Chemical:</strong> {selectedTreatment.chemical || "—"}
          </div>

          <div className="cardLine">
            <strong>Dilution:</strong> {selectedTreatment.dilutionRatio || "—"}
          </div>

          <div className="cardLine">
            <strong>Instructions:</strong> {selectedTreatment.instructions || "—"}
          </div>

          <div className="cardLine">
            <strong>Safety:</strong> {selectedTreatment.safetyNotes || "—"}
          </div>
        </div>
      )}

      <div className="assignBox">
        <div className="assignTitle">Field Checklist</div>

        <div style={{ display: "grid", gap: 10 }}>
          {checklist.map((item) => {
            const checked = checkedItems.includes(item);

            return (
              <button
                key={item}
                className={checked ? "primaryButton" : "secondaryButton"}
                type="button"
                onClick={() => toggleItem(item)}
                style={{
                  justifyContent: "flex-start",
                  textAlign: "left",
                  whiteSpace: "normal",
                  lineHeight: 1.35
                }}
              >
                {checked ? "✓ " : "□ "}
                {item}
              </button>
            );
          })}
        </div>
      </div>

      <div className="errorBox">
        Field Mode is a checklist helper. It does not replace product labels, company policy,
        admin approval, PPE, or legal safety requirements. High Review work should be escalated.
      </div>
    </section>
  );
}
