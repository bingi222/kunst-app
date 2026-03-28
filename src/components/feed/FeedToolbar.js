import { useState } from "react";
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
  const [showAdvanced, setShowAdvanced] = useState(false);
  const lastUpdatedLabel = lastUpdatedAt
    ? `Zuletzt aktualisiert ${formatRelativeTime(lastUpdatedAt)}`
    : "Noch nicht aktualisiert";

  return (
    <section style={{ marginBottom: "26px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", marginBottom: "10px" }}>
        <label htmlFor="feed-search" style={{ marginBottom: 0, fontSize: "12px", color: "#9aa3b6", letterSpacing: "0.04em", textTransform: "uppercase" }}>
          Suche
        </label>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
          <button
            type="button"
            onClick={() => setShowAdvanced((prev) => !prev)}
            style={{ ...buttonStyle(showAdvanced), minWidth: "44px", padding: "0 10px" }}
            aria-label={showAdvanced ? "Filter ausblenden" : "Filter anzeigen"}
            title={showAdvanced ? "Filter ausblenden" : "Filter anzeigen"}
          >
            ⚙
          </button>
          <button type="button" onClick={onRefresh} disabled={isRefreshing} style={buttonStyle(false)}>
            {isRefreshing ? "Aktualisiere..." : "Aktualisieren"}
          </button>
        </div>
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
          border: "1px solid #252c39",
          borderRadius: "14px",
          background: "#111722",
          color: "#f3f4f6",
          padding: "12px 14px",
          marginBottom: "10px",
          outline: "none",
        }}
      />
      <p style={{ marginTop: 0, marginBottom: showAdvanced ? "12px" : 0, fontSize: "11px", color: "#7e8ca6" }}>{lastUpdatedLabel}</p>

      {showAdvanced && (
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
      )}
      {!showAdvanced && (
        <div style={{ height: "4px" }} />
      )}
    </section>
  );
}
