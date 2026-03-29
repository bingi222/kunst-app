function buttonStyle(active = false) {
  return {
    height: 32,
    borderRadius: "999px",
    border: "1px solid #2a2a2a",
    background: active ? "#222222" : "#1a1a1a",
    color: "rgba(255, 255, 255, 0.9)",
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
  showAdvanced = false,
}) {
  return (
    <section style={{ marginBottom: showAdvanced ? "36px" : "28px" }}>
      {showAdvanced && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "flex-end" }}>
          <button type="button" onClick={() => setFeedMode("all")} style={buttonStyle(feedMode === "all")}>
            Alle
          </button>
          <button type="button" onClick={() => setFeedMode("liked")} style={buttonStyle(feedMode === "liked")}>
            Nur Likes
          </button>
          <button type="button" onClick={() => setSortOrder("newest")} style={buttonStyle(sortOrder === "newest")}>
            Neueste
          </button>
          <button type="button" onClick={() => setSortOrder("popular")} style={buttonStyle(sortOrder === "popular")}>
            Beliebteste
          </button>
          <button type="button" onClick={onResetFilters} style={buttonStyle(false)}>
            Filter zuruecksetzen
          </button>
        </div>
      )}
      {!showAdvanced && <div style={{ height: "1px" }} />}
    </section>
  );
}
