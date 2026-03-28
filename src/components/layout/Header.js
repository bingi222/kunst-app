import React, { useEffect, useRef, useState } from "react";

function navBtnStyle(isActive) {
  return {
    height: 34,
    borderRadius: "999px",
    border: "1px solid #2b313d",
    background: isActive ? "#222a39" : "transparent",
    color: "#e5e7eb",
    padding: "0 12px",
    fontSize: "13px",
    fontWeight: isActive ? 700 : 600,
    cursor: "pointer",
    transition: "background-color 180ms ease, border-color 180ms ease, transform 180ms ease",
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
        background: "rgba(15, 17, 21, 0.84)",
        backdropFilter: "blur(16px)",
        padding: "12px 16px",
        borderBottom: "1px solid #252b36",
        zIndex: 10,
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
        }}
      >
        <b>{title}</b>

        <nav style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "8px", justifyContent: "center" }}>
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
              minWidth: "40px",
              width: "40px",
              height: "40px",
              padding: 0,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
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
                borderRadius: "14px",
                border: "1px solid #2b313d",
                background: "#141a25",
                boxShadow: "0 10px 36px rgba(0, 0, 0, 0.38)",
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
