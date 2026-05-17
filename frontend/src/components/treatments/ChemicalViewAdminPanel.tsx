import React from "react";
import {
  downloadChemicalCsv,
  loadChemicalList,
  removeChemicalItem,
  resetChemicalListToStarters,
  subscribeChemicalList,
  type ChemicalListItem
} from "../../utils/chemicalListStorage";

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

export default function ChemicalViewAdminPanel() {
  const [items, setItems] = React.useState<ChemicalListItem[]>(() => loadChemicalList());
  const [search, setSearch] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState("all");
  const [expandedId, setExpandedId] = React.useState<string | null>(items[0]?.id || null);
  const [success, setSuccess] = React.useState("");

  React.useEffect(() => {
    return subscribeChemicalList(() => {
      setItems(loadChemicalList());
    });
  }, []);

  const categories = Array.from(
    new Set(items.map((item) => item.category).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));

  const visibleItems = items.filter((item) => {
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    return matchesCategory && chemicalMatchesSearch(item, search);
  });

  const removeChemical = (id: string) => {
    const item = items.find((entry) => entry.id === id);
    const ok = window.confirm(`Remove ${item?.chemicalName || "this chemical"}?`);

    if (!ok) return;

    const updated = removeChemicalItem(id);
    setItems(updated);
    setSuccess("Chemical removed.");
  };

  const resetList = () => {
    const ok = window.confirm("Reset chemical list to starter chemicals?");
    if (!ok) return;

    const updated = resetChemicalListToStarters();
    setItems(updated);
    setSuccess("Chemical list reset to starter chemicals.");
  };

  return (
    <section className="panel">
      <div className="panelHeader">
        <div>
          <h2 className="panelTitle">View Chemicals</h2>
          <p className="brandSubtitle">
            Visual reference for chemical names, purchase links, use cases, safety notes,
            and damage warnings.
          </p>
        </div>

        <div className="buttonRow">
          <button
            className="secondaryButton"
            type="button"
            onClick={() => downloadChemicalCsv(items)}
            disabled={items.length === 0}
          >
            Export CSV
          </button>

          <button className="secondaryButton" type="button" onClick={resetList}>
            Reset Starters
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

      {success && (
        <div className="listCard" style={{ borderColor: "rgba(34, 197, 94, 0.65)" }}>
          {success}
        </div>
      )}

      <div className="formGrid" style={{ marginTop: 16 }}>
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
