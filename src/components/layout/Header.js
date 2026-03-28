import React from "react";

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
  onOpenOwnProfile,
  unreadNotificationsCount,
  styles,
}) {
  const profileButtonStyle = currentTab === "profile" ? navBtnStyle(true) : navBtnStyle(false);
  const mergedProfileButtonStyle = {
    ...profileButtonStyle,
    ...(currentTab === "profile" ? {} : { background: "#222a39" }),
  };

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
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "10px" }}>
          <div>
            <b>{title}</b>
            <div style={{ fontSize: "11px", opacity: 0.62, marginTop: "2px" }}>Angemeldet als {currentUser.displayName}</div>
          </div>
          <button type="button" onClick={onLogout} style={styles.secondaryBtn}>
            Logout
          </button>
        </div>

        <nav style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
          <button type="button" onClick={onGoFeed} style={navBtnStyle(currentTab === "feed")}>
            Home
          </button>
          <button type="button" onClick={onGoUpload} style={navBtnStyle(currentTab === "upload")}>
            Upload
          </button>
          <button
            type="button"
            onClick={onGoActivity}
            style={navBtnStyle(currentTab === "activity")}
            aria-label={
              unreadNotificationsCount > 0
                ? `Aktivitaet (${unreadNotificationsCount} ungelesen)`
                : "Aktivitaet"
            }
          >
            Aktivitaet
            {unreadNotificationsCount > 0 && (
              <span
                style={{
                  marginLeft: "8px",
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
          <button type="button" onClick={onOpenOwnProfile} style={mergedProfileButtonStyle}>
            Mein Profil
          </button>
        </nav>
      </div>
    </header>
  );
}
