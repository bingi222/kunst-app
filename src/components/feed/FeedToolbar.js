import { formatRelativeTime } from "../../utils/format";

function buttonStyle(active = false) {
  return {
    height: 32,
    borderRadius: "999px",
    border: "1px solid rgba(255, 255, 255, 0.14)",
    background: active ? "rgba(255, 255, 255, 0.13)" : "rgba(18, 23, 34, 0.64)",
    color: "#e5e7eb",
    padding: "0 10px",
    fontSize: "12px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "transform 180ms ease, background-color 180ms ease, border-color 180ms ease, opacity 180ms ease",
  };
}

export default function FeedToolbar({
  feedMode,
  setFeedMode,
  sortOrder,
  setSortOrder,
  onResetFilters,
  lastUpdatedAt,
  showAdvanced = false,
}) {
  const lastUpdatedLabel = lastUpdatedAt
    ? `Zuletzt aktualisiert ${formatRelativeTime(lastUpdatedAt)}`
    : "Noch nicht aktualisiert";

  return (
    <section style={{ marginBottom: showAdvanced ? "42px" : "34px" }}>
      <p
        style={{
          marginTop: 0,
          marginBottom: showAdvanced ? "14px" : 0,
          fontSize: "10px",
          color: "#6f7b92",
          textAlign: "right",
          letterSpacing: "0.03em",
        }}
      >
        {lastUpdatedLabel}
      </p>

      {showAdvanced && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "flex-end" }}>
          <button type="button" onClick={() => setFeedMode("all")} style={buttonStyle(feedMode === "all")}>
            Alle
          </button>
          <button type="button" onClick={() => setFeedMode("liked")} style={buttonStyle(feedMode === "liked")}>
            Nur Likes
          </button>
          <button
            type="button"
            onClick={() => setSortOrder(sortOrder === "newest" ? "oldest" : "newest")}
            style={buttonStyle(true)}
          >
            Sortierung: {sortOrder === "newest" ? "Neueste zuerst" : "Aelteste zuerst"}
          </button>
          <button type="button" onClick={onResetFilters} style={buttonStyle(false)}>
            Filter zuruecksetzen
          </button>
        </div>
      )}
      {!showAdvanced && <div style={{ height: "2px" }} />}
    </section>
  );
}
