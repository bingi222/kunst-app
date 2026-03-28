import React from "react";
import { BellIcon } from "../common/Icons";

export default function BottomNav({ current, setCurrent, onOpenOwnProfile, unreadNotificationsCount, styles }) {
  const linkStyle = (tab) => ({
    ...styles.iconBtn,
    fontSize: "14px",
    padding: "8px 12px",
    borderRadius: "999px",
    background: current === tab ? "#242a37" : "transparent",
    opacity: current === tab ? 1 : 0.72,
    fontWeight: current === tab ? 700 : 500,
  });

  return (
    <nav style={styles.nav}>
      <button type="button" onClick={() => setCurrent("feed")} style={linkStyle("feed")}>
        Home
      </button>
      <button type="button" onClick={() => setCurrent("upload")} style={linkStyle("upload")}>
        Upload
      </button>
      <button
        type="button"
        onClick={() => setCurrent("activity")}
        style={linkStyle("activity")}
        aria-label={
          unreadNotificationsCount > 0
            ? `Aktivitaet (${unreadNotificationsCount} ungelesen)`
            : "Aktivitaet"
        }
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", position: "relative" }}>
          <BellIcon />
          <span>Aktivitaet</span>
          {unreadNotificationsCount > 0 && (
            <span
              style={{
                minWidth: "16px",
                height: "16px",
                padding: "0 4px",
                borderRadius: "999px",
                background: "#8b5cf6",
                color: "#fff",
                fontSize: "10px",
                lineHeight: "16px",
                textAlign: "center",
                fontWeight: 700,
              }}
            >
              {unreadNotificationsCount > 99 ? "99+" : unreadNotificationsCount}
            </span>
          )}
        </span>
      </button>
      <button type="button" onClick={onOpenOwnProfile} style={linkStyle("profile")}>
        Mein Profil
      </button>
    </nav>
  );
}
