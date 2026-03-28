import React, { useEffect, useRef, useState } from "react";

function navBtnStyle(isActive) {
  return {
    height: 36,
    borderRadius: "999px",
    border: isActive ? "1px solid rgba(255, 255, 255, 0.2)" : "1px solid transparent",
    background: isActive ? "rgba(255, 255, 255, 0.1)" : "transparent",
    color: "#e8ecf3",
    padding: "0 13px",
    fontSize: "12px",
    letterSpacing: "0.03em",
    textTransform: "uppercase",
    fontWeight: 600,
    cursor: "pointer",
    transition: "background-color 220ms ease, border-color 220ms ease, color 220ms ease",
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
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const profileButtonStyle = navBtnStyle(currentTab === "profile");

  useEffect(() => {
    if (!isMenuOpen) {
      return undefined;
    }

    const handleDocumentClick = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleDocumentClick);
    window.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleDocumentClick);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isMenuOpen]);

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        background: "rgba(10, 13, 20, 0.58)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        padding: "18px 26px",
        borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
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
          gap: "24px",
        }}
      >
        <b style={{ fontSize: "14px", letterSpacing: "0.24em", fontWeight: 600 }}>{title}</b>

        <nav
          style={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "10px",
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

        <div style={{ position: "relative" }} ref={menuRef}>
          <button
            type="button"
            onClick={() => setIsMenuOpen((previous) => !previous)}
            style={{
              ...navBtnStyle(false),
              minWidth: "36px",
              width: "36px",
              height: "36px",
              padding: 0,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              textTransform: "none",
              letterSpacing: "normal",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              background: "rgba(255, 255, 255, 0.06)",
              fontWeight: 600,
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
                border: "1px solid rgba(255, 255, 255, 0.14)",
                background: "rgba(12, 16, 24, 0.92)",
                backdropFilter: "blur(14px)",
                WebkitBackdropFilter: "blur(14px)",
                boxShadow: "0 14px 40px rgba(0, 0, 0, 0.42)",
                padding: "10px",
                zIndex: 40,
              }}
            >
              <div style={{ fontSize: "12px", color: "#9ca3af", marginBottom: "10px", padding: "0 4px" }}>
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
                      background: "#8b5cf6",
                      color: "#fff",
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
                style={{ ...navBtnStyle(false), width: "100%" }}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
