import React from "react";
import { apiFetch } from "../api";
import type { AuthUserRole, TreatmentItem } from "../types";
import { isAdminRole } from "../utils/roles";
import {
  emptyTreatmentForm,
  exportTreatmentsToCsv,
  formToTreatmentPayload,
  getTreatmentRiskLevel,
  normalizeTreatment,
  treatmentMatchesSearch,
  treatmentToForm,
  uniqueTreatmentCategories,
  type TreatmentForm
} from "../utils/treatmentHelpers";
import DilutionCalculator from "../components/treatments/DilutionCalculator";
import TreatmentDetailPanel from "../components/treatments/TreatmentDetailPanel";
import TreatmentCasesPanel from "../components/treatments/TreatmentCasesPanel";
import TreatmentPlanBuilder from "../components/treatments/TreatmentPlanBuilder";
import SavedTreatmentPlansPanel from "../components/treatments/SavedTreatmentPlansPanel";
import TreatmentGuruSearchPanel from "../components/treatments/TreatmentGuruSearchPanel";
import TreatmentFieldModePanel from "../components/treatments/TreatmentFieldModePanel";
import TreatmentPageTabs from "../components/treatments/TreatmentPageTabs";
import TreatmentStatsPanel from "../components/treatments/TreatmentStatsPanel";
import TreatmentSearchPanel from "../components/treatments/TreatmentSearchPanel";
import TreatmentQuickActions from "../components/treatments/TreatmentQuickActions";
import TreatmentCategorySidebar from "../components/treatments/TreatmentCategorySidebar";
import TreatmentMobileJumpBar from "../components/treatments/TreatmentMobileJumpBar";
import TreatmentFormPanel from "../components/treatments/TreatmentFormPanel";
import TreatmentWorkspaceLayout from "../components/treatments/TreatmentWorkspaceLayout";
import TreatmentUploadPanel from "../components/treatments/TreatmentUploadPanel";
import type { TreatmentPlan } from "../types/treatmentPlans";
import type { TreatmentTabKey } from "../types/treatmentUi";

export default function TreatmentsPage({ role }: { role: AuthUserRole }) {
  const adminAccess = isAdminRole(role);

  const [treatments, setTreatments] = React.useState<TreatmentItem[]>([]);
  const [activeTab, setActiveTab] = React.useState<TreatmentTabKey>("guru");
  const [search, setSearch] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState("all");
  const [riskFilter, setRiskFilter] = React.useState("all");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<TreatmentForm>(emptyTreatmentForm);
  const [showForm, setShowForm] = React.useState(false);
  const [showFilters, setShowFilters] = React.useState(true);
  const [plansRefreshKey, setPlansRefreshKey] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [seeding, setSeeding] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");

  const loadTreatments = React.useCallback(async () => {
    setError("");

    try {
      const data = await apiFetch<{ treatments: TreatmentItem[] }>("/api/treatments");
      setTreatments((data.treatments || []).map(normalizeTreatment));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load treatments.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadTreatments();
  }, [loadTreatments]);

  const categories = uniqueTreatmentCategories(treatments);

  const visibleTreatments = treatments.filter((treatment) => {
    const matchesCategory =
      categoryFilter === "all" || treatment.category === categoryFilter;

    const risk = getTreatmentRiskLevel(treatment);
    const matchesRisk = riskFilter === "all" || risk === riskFilter;

    return matchesCategory && matchesRisk && treatmentMatchesSearch(treatment, search);
  });

  const selectedTreatment =
    treatments.find((treatment) => treatment.id === selectedId) ||
    visibleTreatments[0] ||
    null;

  React.useEffect(() => {
    if (!selectedId && visibleTreatments[0]) {
      setSelectedId(visibleTreatments[0].id);
    }
  }, [selectedId, visibleTreatments]);

  const updateForm = (field: keyof TreatmentForm, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const startCreate = () => {
    setForm(emptyTreatmentForm);
    setShowForm(true);
    setActiveTab("search");
    setError("");
    setSuccess("");
  };

  const startEdit = (treatment: TreatmentItem) => {
    setForm(treatmentToForm(treatment));
    setShowForm(true);
    setActiveTab("details");
    setError("");
    setSuccess("");
  };

  const cancelForm = () => {
    setForm(emptyTreatmentForm);
    setShowForm(false);
    setError("");
  };

  const handlePlanSaved = (_plan: TreatmentPlan) => {
    setPlansRefreshKey((prev) => prev + 1);
    setActiveTab("saved");
  };

  const handleTreatmentsUploaded = (uploadedTreatments: TreatmentItem[], message: string) => {
    setTreatments(uploadedTreatments.map(normalizeTreatment));
    setSuccess(message);
    setActiveTab("search");
  };

  const seedTreatments = async () => {
    setError("");
    setSuccess("");
    setSeeding(true);

    try {
      const data = await apiFetch<{
        message: string;
        treatments: TreatmentItem[];
      }>("/api/treatments/seed", {
        method: "POST"
      });

      setTreatments((data.treatments || []).map(normalizeTreatment));
      setSuccess(data.message || "Treatment database seeded.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to seed treatments.");
    } finally {
      setSeeding(false);
    }
  };

  const saveTreatment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!adminAccess) {
      setError("Only Admin or Super Admin can manage treatments.");
      return;
    }

    if (!form.name.trim()) {
      setError("Treatment name is required.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    const payload = formToTreatmentPayload(form);

    try {
      if (form.id) {
        const data = await apiFetch<{ treatment: TreatmentItem }>(
          `/api/treatments/${form.id}`,
          {
            method: "PATCH",
            body: JSON.stringify(payload)
          }
        );

        const updated = normalizeTreatment(data.treatment);

        setTreatments((prev) =>
          prev.map((treatment) => (treatment.id === updated.id ? updated : treatment))
        );

        setSelectedId(updated.id);
        setSuccess("Treatment updated.");
      } else {
        const data = await apiFetch<{ treatment: TreatmentItem }>("/api/treatments", {
          method: "POST",
          body: JSON.stringify(payload)
        });

        const created = normalizeTreatment(data.treatment);

        setTreatments((prev) =>
          [...prev, created].sort((a, b) =>
            `${a.category}-${a.name}`.localeCompare(`${b.category}-${b.name}`)
          )
        );

        setSelectedId(created.id);
        setSuccess("Treatment created.");
      }

      setForm(emptyTreatmentForm);
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save treatment.");
    } finally {
      setSaving(false);
    }
  };

  const deleteTreatment = async (treatment: TreatmentItem) => {
    if (!adminAccess) {
      setError("Only Admin or Super Admin can delete treatments.");
      return;
    }

    const ok = window.confirm(`Delete treatment "${treatment.name}"?`);
    if (!ok) return;

    setError("");
    setSuccess("");

    try {
      await apiFetch(`/api/treatments/${treatment.id}`, {
        method: "DELETE"
      });

      setTreatments((prev) => prev.filter((item) => item.id !== treatment.id));
      setSelectedId(null);
      setSuccess("Treatment deleted.");
      setActiveTab("search");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete treatment.");
    }
  };

  const handleCategoryChange = (category: string) => {
    setCategoryFilter(category);
    setActiveTab("search");
  };

  const handleRiskChange = (risk: string) => {
    setRiskFilter(risk);
    setActiveTab("search");
  };

  if (loading) {
    return (
      <section className="panel">
        <h2 className="panelTitle">Treatment Options & Cases</h2>
        <div className="listCard">Loading treatment database...</div>
      </section>
    );
  }

  return (
    <div className="pageGrid">
      <section className="panel">
        <div className="panelHeader">
          <div>
            <h2 className="panelTitle">Treatment Options & Cases</h2>
            <p className="brandSubtitle">
              Search chemical usage, dilution ratios, safety notes, surfaces, cases, saved plans, and field instructions.
            </p>
          </div>

          <TreatmentQuickActions
            adminAccess={adminAccess}
            seeding={seeding}
            visibleCount={visibleTreatments.length}
            onAddTreatment={startCreate}
            onSeedDefaults={seedTreatments}
            onExportVisible={() => exportTreatmentsToCsv(visibleTreatments)}
            onTabChange={setActiveTab}
          />
        </div>

        {error && <div className="errorBox">{error}</div>}

        {success && <div className="listCard">{success}</div>}

        <TreatmentStatsPanel
          treatments={treatments}
          visibleTreatments={visibleTreatments}
          adminAccess={adminAccess}
        />

        <TreatmentMobileJumpBar activeTab={activeTab} onChange={setActiveTab} />

        <div className="buttonRow" style={{ marginTop: 12 }}>
          <button
            className="secondaryButton"
            type="button"
            onClick={() => setShowFilters((prev) => !prev)}
          >
            {showFilters ? "Hide Filters" : "Show Filters"}
          </button>

          <button
            className="secondaryButton"
            type="button"
            onClick={() => {
              setSearch("");
              setCategoryFilter("all");
              setRiskFilter("all");
              setActiveTab("search");
            }}
          >
            Clear Filters
          </button>
        </div>
      </section>

      <TreatmentPageTabs activeTab={activeTab} onChange={setActiveTab} />

      <TreatmentWorkspaceLayout
        showFilters={showFilters}
        filters={
          <TreatmentCategorySidebar
            treatments={treatments}
            selectedCategory={categoryFilter}
            selectedRisk={riskFilter}
            onCategoryChange={handleCategoryChange}
            onRiskChange={handleRiskChange}
          />
        }
      >
        <div className="pageGrid">
          {showForm && adminAccess && (
            <TreatmentFormPanel
              form={form}
              saving={saving}
              onChange={updateForm}
              onSubmit={saveTreatment}
              onCancel={cancelForm}
            />
          )}

          {activeTab === "guru" && <TreatmentGuruSearchPanel />}

          {activeTab === "upload" && (
            <TreatmentUploadPanel
              adminAccess={adminAccess}
              onUploaded={handleTreatmentsUploaded}
            />
          )}

          {activeTab === "field" && (
            <TreatmentFieldModePanel
              selectedTreatment={selectedTreatment}
              onClose={() => setActiveTab("search")}
            />
          )}

          {activeTab === "search" && (
            <TreatmentSearchPanel
              search={search}
              setSearch={setSearch}
              categoryFilter={categoryFilter}
              setCategoryFilter={setCategoryFilter}
              riskFilter={riskFilter}
              setRiskFilter={setRiskFilter}
              categories={categories}
              visibleTreatments={visibleTreatments}
              selectedTreatment={selectedTreatment}
              setSelectedId={setSelectedId}
            />
          )}

          {activeTab === "details" && selectedTreatment && (
            <TreatmentDetailPanel
              treatment={selectedTreatment}
              adminAccess={adminAccess}
              onEdit={() => startEdit(selectedTreatment)}
              onDelete={() => deleteTreatment(selectedTreatment)}
            />
          )}

          {activeTab === "details" && !selectedTreatment && (
            <section className="panel">
              <h2 className="panelTitle">Treatment Details</h2>
              <div className="listCard">Select a treatment first.</div>
            </section>
          )}

          {activeTab === "calculator" && (
            <DilutionCalculator onClose={() => setActiveTab("search")} />
          )}

          {activeTab === "cases" && (
            <TreatmentCasesPanel
              treatments={treatments}
              selectedTreatmentId={selectedTreatment?.id || null}
              adminAccess={adminAccess}
            />
          )}

          {activeTab === "planner" && (
            <TreatmentPlanBuilder
              treatments={treatments}
              selectedTreatmentId={selectedTreatment?.id || null}
              onClose={() => setActiveTab("search")}
              onPlanSaved={handlePlanSaved}
            />
          )}

          {activeTab === "saved" && (
            <SavedTreatmentPlansPanel
              treatments={treatments}
              casesRefreshKey={plansRefreshKey}
            />
          )}
        </div>
      </TreatmentWorkspaceLayout>
    </div>
  );
}
