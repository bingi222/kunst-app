import { useState } from "react";
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
  showRefreshButton = true,
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const lastUpdatedLabel = lastUpdatedAt
    ? `Zuletzt aktualisiert ${formatRelativeTime(lastUpdatedAt)}`
    : "Noch nicht aktualisiert";

  return (
    <section style={{ marginBottom: "36px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "8px", marginBottom: "8px" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 6px", borderRadius: "999px", border: "1px solid rgba(255, 255, 255, 0.08)", background: "rgba(12, 16, 24, 0.45)", backdropFilter: "blur(8px)" }}>
          <input
            id="feed-search"
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            aria-label="Suche"
            placeholder="Suche"
            style={{
              width: "clamp(170px, 24vw, 250px)",
              boxSizing: "border-box",
              border: "1px solid transparent",
              borderRadius: "999px",
              background: "rgba(17, 23, 34, 0.82)",
              color: "#f3f4f6",
              padding: "7px 11px",
              outline: "none",
              fontSize: "12px",
            }}
          />
          <button
            type="button"
            onClick={() => setShowAdvanced((prev) => !prev)}
            style={{ ...buttonStyle(showAdvanced), minWidth: "28px", width: "28px", height: "28px", padding: 0, opacity: 0.82 }}
            aria-label={showAdvanced ? "Filter ausblenden" : "Filter anzeigen"}
            title={showAdvanced ? "Filter ausblenden" : "Filter anzeigen"}
          >
            ⌯
          </button>
          {showRefreshButton && (
            <button type="button" onClick={onRefresh} disabled={isRefreshing} style={buttonStyle(false)}>
              {isRefreshing ? "Aktualisiere..." : "Aktualisieren"}
            </button>
          )}
        </div>
      </div>
      <p style={{ marginTop: 0, marginBottom: showAdvanced ? "12px" : 0, fontSize: "10px", color: "#6f7b92", textAlign: "right" }}>{lastUpdatedLabel}</p>

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
