import type { TreatmentItem } from "../types";
import type { TreatmentCase } from "../types/treatmentCases";
import type { TreatmentPlan } from "../types/treatmentPlans";
import { buildGuruTreatmentSummary } from "./treatmentHelpers";
import { buildTreatmentCaseSummary } from "../types/treatmentCases";

export function getSelectedTreatments(
  treatments: TreatmentItem[],
  selectedIds: string[]
) {
  const selected = new Set(selectedIds);
  return treatments.filter((treatment) => selected.has(treatment.id));
}

export function getSelectedTreatmentCases(
  cases: TreatmentCase[],
  selectedIds: string[]
) {
  const selected = new Set(selectedIds);
  return cases.filter((item) => selected.has(item.id));
}

export function buildTreatmentPlanText(input: {
  plan: TreatmentPlan;
  treatments: TreatmentItem[];
  cases: TreatmentCase[];
}) {
  if (input.plan.planText && input.treatments.length === 0 && input.cases.length === 0) {
    return input.plan.planText;
  }

  const lines: string[] = [];

  lines.push("NMD TREATMENT PLAN");
  lines.push("");
  lines.push(`Job: ${input.plan.jobName || "—"}`);
  lines.push(`Client: ${input.plan.clientName || "—"}`);
  lines.push(`Address: ${input.plan.serviceAddress || "—"}`);
  lines.push(`Surface: ${input.plan.surfaceType || "—"}`);
  lines.push(`Condition: ${input.plan.conditionLevel || "—"}`);
  lines.push(`Created: ${new Date(input.plan.createdAt).toLocaleString()}`);
  lines.push("");

  if (input.plan.notes) {
    lines.push("JOB NOTES");
    lines.push(input.plan.notes);
    lines.push("");
  }

  lines.push("SELECTED TREATMENTS");
  if (input.treatments.length === 0) {
    lines.push("No treatments selected.");
  } else {
    input.treatments.forEach((treatment, index) => {
      lines.push("");
      lines.push(`${index + 1}. ${buildGuruTreatmentSummary(treatment)}`);
    });
  }

  lines.push("");
  lines.push("SELECTED CASES");
  if (input.cases.length === 0) {
    lines.push("No cases selected.");
  } else {
    input.cases.forEach((item, index) => {
      lines.push("");
      lines.push(`${index + 1}. ${buildTreatmentCaseSummary(item)}`);
    });
  }

  lines.push("");
  lines.push("FIELD REMINDERS");
  lines.push("• Verify surface type before applying chemistry.");
  lines.push("• Perform test spots on sensitive, painted, oxidized, new, or specialty surfaces.");
  lines.push("• Use PPE and follow product labels.");
  lines.push("• Protect plants, property, windows, outlets, cameras, and surrounding surfaces.");
  lines.push("• Manage runoff and avoid letting products dry on surfaces.");
  lines.push("• Document pre-existing damage and customer expectations before work.");

  return lines.join("\n");
}

export async function copyTreatmentPlan(input: {
  plan: TreatmentPlan;
  treatments: TreatmentItem[];
  cases: TreatmentCase[];
}) {
  const text = buildTreatmentPlanText(input);

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    window.alert(text);
    return false;
  }
}

export function downloadTreatmentPlan(input: {
  plan: TreatmentPlan;
  treatments: TreatmentItem[];
  cases: TreatmentCase[];
}) {
  const text = buildTreatmentPlanText(input);
  const blob = new Blob([text], {
    type: "text/plain;charset=utf-8"
  });

  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const safeName = input.plan.jobName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  anchor.href = url;
  anchor.download = `nmd-treatment-plan-${safeName || "job"}-${new Date()
    .toISOString()
    .slice(0, 10)}.txt`;

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}

export function printTreatmentPlan(input: {
  plan: TreatmentPlan;
  treatments: TreatmentItem[];
  cases: TreatmentCase[];
}) {
  const text = buildTreatmentPlanText(input);
  const printWindow = window.open("", "_blank", "width=900,height=700");

  if (!printWindow) {
    window.alert(text);
    return;
  }

  printWindow.document.write(`
    <html>
      <head>
        <title>NMD Treatment Plan</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.5;
            padding: 28px;
            color: #0f172a;
          }

          pre {
            white-space: pre-wrap;
            font-family: Arial, sans-serif;
            font-size: 14px;
          }

          h1 {
            color: #0b5ed7;
          }
        </style>
      </head>

      <body>
        <h1>NMD Treatment Plan</h1>
        <pre>${text.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}
