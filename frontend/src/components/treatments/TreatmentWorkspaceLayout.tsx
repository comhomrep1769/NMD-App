import React from "react";

export default function TreatmentWorkspaceLayout({
  showFilters,
  filters,
  children
}: {
  showFilters: boolean;
  filters: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className={showFilters ? "treatmentWorkspace withFilters" : "treatmentWorkspace"}>
      {showFilters && <aside className="treatmentFiltersColumn">{filters}</aside>}

      <main className="treatmentMainColumn">{children}</main>
    </div>
  );
}
