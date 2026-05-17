import React from "react";

export default function TreatmentUploadSafetyNotice({
  type
}: {
  type: "treatments" | "cases";
}) {
  return (
    <div className="errorBox">
      <strong>Admin upload safety:</strong>{" "}
      {type === "treatments"
        ? "Treatment record uploads can create or update chemical, dilution, pricing, and safety guidance."
        : "Detailed treatment uploads can create or update step-by-step workflows, risk notes, and customer expectation guidance."}{" "}
      Only upload reviewed information you trust. Employees can view treatment knowledge,
      but upload/edit/delete actions are protected for Admin and Super Admin on the backend.
    </div>
  );
}
