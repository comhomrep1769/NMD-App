import React from "react";
import { apiFetch } from "../api";
import type { Role, TipNote } from "../types";

export default function TipsPage({ role }: { role: Role }) {
  const [tips, setTips] = React.useState<TipNote[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [category, setCategory] = React.useState("General");
  const [pinned, setPinned] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const loadTips = React.useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await apiFetch<{ tips: TipNote[] }>("/api/tips");
      setTips(data.tips);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tips");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadTips();
  }, [loadTips]);

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setContent("");
    setCategory("General");
    setPinned(false);
  };

  const startEdit = (tip: TipNote) => {
    setEditingId(tip.id);
    setTitle(tip.title);
    setContent(tip.content);
    setCategory(tip.category);
    setPinned(tip.pinned);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const payload = {
        title,
        content,
        category,
        pinned
      };

      if (editingId) {
        await apiFetch(`/api/tips/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(payload)
        });
      } else {
        await apiFetch("/api/tips", {
          method: "POST",
          body: JSON.stringify(payload)
        });
      }

      resetForm();
      await loadTips();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save tip");
    }
  };

  const deleteTip = async (tipId: string) => {
    const ok = window.confirm("Delete this tip/note?");
    if (!ok) return;

    try {
      await apiFetch(`/api/tips/${tipId}`, {
        method: "DELETE"
      });

      await loadTips();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete tip");
    }
  };

  const filteredTips = tips.filter((tip) => {
    const text = `${tip.title} ${tip.content} ${tip.category}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });

  return (
    <div className="pageGrid">
      {role === "admin" && (
        <section className="panel">
          <div className="panelHeader">
            <h2 className="panelTitle">{editingId ? "Edit Tip / Note" : "New Tip / Note"}</h2>
          </div>

          {error && <div className="errorBox">{error}</div>}

          <form className="formGrid" onSubmit={submit}>
            <input
              className="textInput"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <input
              className="textInput"
              placeholder="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />

            <textarea
              className="textInput"
              placeholder="Write the tip, field note, safety note, equipment note, or procedure..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
            />

            <label className="assignItem">
              <input
                type="checkbox"
                checked={pinned}
                onChange={(e) => setPinned(e.target.checked)}
              />
              <span>Pin this note to the top</span>
            </label>

            <div className="buttonRow">
              <button className="primaryButton" type="submit">
                {editingId ? "Save Note" : "Add Note"}
              </button>

              {editingId && (
                <button className="secondaryButton" type="button" onClick={resetForm}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>
      )}

      <section className="panel">
        <div className="panelHeader">
          <h2 className="panelTitle">Tips & Notes</h2>
        </div>

        <input
          className="textInput"
          placeholder="Search tips, categories, procedures..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {loading && <div className="listCard" style={{ marginTop: 16 }}>Loading tips...</div>}
        {error && role !== "admin" && <div className="errorBox">{error}</div>}

        {!loading && (
          <div className="cardsGrid" style={{ marginTop: 16 }}>
            {filteredTips.map((tip) => (
              <div key={tip.id} className="quoteCard">
                <div className="quoteTopRow">
                  <div className="quoteNumber">
                    {tip.pinned ? "📌 " : ""}
                    {tip.title}
                  </div>
                  <span className="statusBadge status-completed">
                    {tip.category}
                  </span>
                </div>

                <div className="cardLine" style={{ whiteSpace: "pre-wrap" }}>
                  {tip.content}
                </div>

                <div className="chatMeta">
                  Updated {new Date(tip.updated_at).toLocaleString()}
                </div>

                {role === "admin" && (
                  <div className="buttonRow">
                    <button className="secondaryButton" onClick={() => startEdit(tip)}>
                      Edit
                    </button>

                    <button className="secondaryButton" onClick={() => deleteTip(tip.id)}>
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}

            {filteredTips.length === 0 && (
              <div className="listCard">No tips or notes found.</div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
