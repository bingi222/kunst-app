import { formatRelativeTime } from "../../utils/format";

function buttonStyle(active = false) {
  return {
    height: 36,
    borderRadius: "12px",
    border: "1px solid #2b313d",
    background: active ? "#222a39" : "#171b24",
    color: "#e5e7eb",
    padding: "0 12px",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "transform 180ms ease, background-color 180ms ease, border-color 180ms ease",
  };
}

export default function FeedToolbar({
  searchQuery,
  onSearchChange,
  feedMode,
  setFeedMode,
  sortOrder,
  setSortOrder,
  onResetFilters,
  onRefresh,
  isRefreshing,
  lastUpdatedAt,
}) {
  const lastUpdatedLabel = lastUpdatedAt
    ? `Zuletzt aktualisiert ${formatRelativeTime(lastUpdatedAt)}`
    : "Noch nicht aktualisiert";

  return (
    <section style={{ marginBottom: "18px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", marginBottom: "8px" }}>
        <label htmlFor="feed-search" style={{ marginBottom: 0, fontSize: "13px", color: "#cbd5e1" }}>
          Suche
        </label>
        <button type="button" onClick={onRefresh} disabled={isRefreshing} style={buttonStyle(false)}>
          {isRefreshing ? "Aktualisiere..." : "Aktualisieren"}
        </button>
      </div>
      <input
        id="feed-search"
        type="search"
        value={searchQuery}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Kuenstler oder Bio suchen"
        style={{
          width: "100%",
          boxSizing: "border-box",
          border: "1px solid #2b313d",
          borderRadius: "12px",
          background: "#121722",
          color: "#f3f4f6",
          padding: "11px 12px",
          marginBottom: "10px",
          outline: "none",
        }}
      />
      <p style={{ marginTop: 0, marginBottom: "10px", fontSize: "11px", color: "#94a3b8" }}>{lastUpdatedLabel}</p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
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
    </section>
  );
}
