import React, { useEffect, useRef, useState } from "react";

function navBtnStyle(isActive) {
  return {
    height: 30,
    borderRadius: 0,
    border: "none",
    background: "transparent",
    color: isActive ? "rgba(255, 255, 255, 0.9)" : "#aaaaaa",
    padding: "0 2px",
    fontSize: "12px",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    fontWeight: isActive ? 600 : 500,
    boxShadow: isActive ? "inset 0 -1.5px 0 #d7d7d7" : "none",
    cursor: "pointer",
    transition: "color 220ms ease, box-shadow 220ms ease, opacity 220ms ease",
  };
}

export default function Header({
  title,
  currentUser,
  onLogout,
  currentTab,
  onGoFeed,
  onGoUpload,
  onGoActivity,
  onRefreshCurrent,
  onOpenOwnProfile,
  unreadNotificationsCount,
  searchQuery = "",
  onSearchChange = () => {},
  onToggleFeedFilters = () => {},
  showFeedFilters = false,
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const menuToggleRef = useRef(null);
  const profileButtonStyle = navBtnStyle(currentTab === "profile");

  useEffect(() => {
    if (!isMenuOpen) {
      return undefined;
    }

    const handleDocumentClick = (event) => {
      const target = event.target;
      if (!menuRef.current?.contains(target) && !menuToggleRef.current?.contains(target)) {
        setIsMenuOpen(false);
      }
    };
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handleDocumentClick);
    window.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("pointerdown", handleDocumentClick);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isMenuOpen]);

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        background: "rgba(18, 18, 18, 0.82)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        padding: "18px 28px",
        borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
        zIndex: 30,
      }}
    >
      <div
        style={{
          maxWidth: 1360,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "30px",
        }}
      >
        <b style={{ fontSize: "14px", letterSpacing: "0.24em", fontWeight: 600 }}>{title}</b>

        <nav
          style={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "20px",
            justifyContent: "center",
          }}
        >
          <button type="button" onClick={onGoFeed} style={navBtnStyle(currentTab === "feed")}>
            Home
          </button>
          <button type="button" onClick={onGoUpload} style={navBtnStyle(currentTab === "upload")}>
            Upload
          </button>
          <button type="button" onClick={onOpenOwnProfile} style={profileButtonStyle}>
            Mein Profil
          </button>
        </nav>

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "4px 6px",
            borderRadius: "999px",
            border: "1px solid #2a2a2a",
            background: "rgba(26, 26, 26, 0.72)",
            backdropFilter: "blur(8px)",
          }}
        >
          <input
            id="feed-search"
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            aria-label="Suche"
            placeholder="Suche"
            style={{
              width: "clamp(150px, 20vw, 220px)",
              boxSizing: "border-box",
              border: "1px solid transparent",
              borderRadius: "999px",
              background: "#1a1a1a",
              color: "rgba(255, 255, 255, 0.9)",
              padding: "7px 11px",
              outline: "none",
              fontSize: "12px",
            }}
          />
          <button
            type="button"
            onClick={onToggleFeedFilters}
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "999px",
              border: "1px solid #3a3a3a",
              background: showFeedFilters ? "#222222" : "#1a1a1a",
              color: "rgba(255, 255, 255, 0.9)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              fontSize: "12px",
              lineHeight: 1,
              transition: "background-color 200ms ease, border-color 200ms ease, transform 200ms ease",
            }}
            aria-label={showFeedFilters ? "Filter ausblenden" : "Filter anzeigen"}
            title={showFeedFilters ? "Filter ausblenden" : "Filter anzeigen"}
          >
            ⌯
          </button>
        </div>

        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
          <button
            type="button"
            onClick={onLogout}
            style={{
              height: "36px",
              borderRadius: "999px",
              border: "1px solid #3a3a3a",
              background: "#1a1a1a",
              color: "rgba(255, 255, 255, 0.9)",
              padding: "0 12px",
              fontSize: "12px",
              cursor: "pointer",
            }}
            aria-label="Sofort ausloggen"
          >
            Logout
          </button>
          <div style={{ position: "relative" }} ref={menuRef}>
          <button
            type="button"
            onClick={() => setIsMenuOpen((previous) => !previous)}
            ref={menuToggleRef}
            style={{
              minWidth: "36px",
              width: "36px",
              height: "36px",
              padding: 0,
              borderRadius: "999px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid #3a3a3a",
              background: "#1a1a1a",
              color: "rgba(255, 255, 255, 0.9)",
              fontWeight: 600,
              cursor: "pointer",
            }}
            aria-label={isMenuOpen ? "Benutzermenue schliessen" : "Benutzermenue oeffnen"}
          >
            {String(currentUser.displayName || "?").slice(0, 1).toUpperCase()}
          </button>

          {isMenuOpen && (
            <div
              style={{
                position: "absolute",
                right: 0,
                top: "calc(100% + 8px)",
                minWidth: "220px",
                borderRadius: "16px",
                border: "1px solid #2a2a2a",
                background: "rgba(26, 26, 26, 0.96)",
                backdropFilter: "blur(14px)",
                WebkitBackdropFilter: "blur(14px)",
                boxShadow: "0 14px 40px rgba(0, 0, 0, 0.42)",
                padding: "10px",
                zIndex: 40,
              }}
            >
              <div style={{ fontSize: "12px", color: "#aaaaaa", marginBottom: "10px", padding: "0 4px" }}>
                Angemeldet als {currentUser.displayName}
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  onGoActivity();
                }}
                style={{
                  ...navBtnStyle(currentTab === "activity"),
                  width: "100%",
                  justifyContent: "space-between",
                  display: "inline-flex",
                  alignItems: "center",
                  marginBottom: "8px",
                }}
                aria-label={
                  unreadNotificationsCount > 0
                    ? `Aktivitaet (${unreadNotificationsCount} ungelesen)`
                    : "Aktivitaet"
                }
              >
                <span>Aktivitaet</span>
                {unreadNotificationsCount > 0 && (
                  <span
                    style={{
                      display: "inline-flex",
                      minWidth: "16px",
                      height: "16px",
                      borderRadius: "999px",
                      padding: "0 4px",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "#d7d7d7",
                      color: "#121212",
                      fontSize: "10px",
                      lineHeight: 1,
                      fontWeight: 700,
                    }}
                  >
                    {unreadNotificationsCount > 99 ? "99+" : unreadNotificationsCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  onRefreshCurrent();
                }}
                style={{ ...navBtnStyle(false), width: "100%", marginBottom: "8px" }}
              >
                Aktualisieren
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  onLogout();
                }}
                aria-label="Logout aus Menue"
                style={{ ...navBtnStyle(false), width: "100%" }}
              >
                Logout
              </button>
            </div>
          )}
          </div>
        </div>
      </div>
    </header>
  );
}
