import React from "react";
import { BellIcon } from "../common/Icons";

function navItemStyle(active) {
  return {
    border: "none",
    background: "transparent",
    color: active ? "rgba(255, 255, 255, 0.9)" : "#aaaaaa",
    fontSize: "13px",
    fontWeight: active ? 700 : 500,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 10px",
    borderRadius: "999px",
    transition: "color 180ms ease, background-color 180ms ease",
  };
}

export default function BottomNav({ current, setCurrent, onOpenOwnProfile, unreadNotificationsCount }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
      <button type="button" onClick={() => setCurrent("feed")} style={navItemStyle(current === "feed")}>
        Home
      </button>
      <button type="button" onClick={() => setCurrent("upload")} style={navItemStyle(current === "upload")}>
        Upload
      </button>
      <button
        type="button"
        onClick={() => setCurrent("activity")}
        style={navItemStyle(current === "activity")}
        aria-label={
          unreadNotificationsCount > 0
            ? `Aktivitaet (${unreadNotificationsCount} ungelesen)`
            : "Aktivitaet"
        }
      >
        <BellIcon />
        <span>Aktivitaet</span>
        {unreadNotificationsCount > 0 && (
          <span
            style={{
              minWidth: "16px",
              height: "16px",
              padding: "0 4px",
              borderRadius: "999px",
              background: "#d7d7d7",
              color: "#121212",
              fontSize: "10px",
              lineHeight: "16px",
              textAlign: "center",
              fontWeight: 700,
            }}
          >
            {unreadNotificationsCount > 99 ? "99+" : unreadNotificationsCount}
          </span>
        )}
      </button>
      <button type="button" onClick={onOpenOwnProfile} style={navItemStyle(current === "profile")}>
        Mein Profil
      </button>
    </div>
  );
}
