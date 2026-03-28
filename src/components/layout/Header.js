import React from "react";

export default function Header({ title, currentUser, onLogout, styles }) {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        background: "rgba(15, 17, 21, 0.9)",
        backdropFilter: "blur(8px)",
        padding: "14px 16px",
        borderBottom: "1px solid #252b36",
        zIndex: 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
        <div>
          <b>{title}</b>
          <div style={{ fontSize: "12px", opacity: 0.7, marginTop: "2px" }}>Angemeldet als {currentUser.displayName}</div>
          <div style={{ fontSize: "11px", opacity: 0.55, marginTop: "3px" }}>
            Shortcuts: G Feed · U Upload · A Aktivitaet · P Profil · R Aktualisieren
          </div>
        </div>
        <button type="button" onClick={onLogout} style={styles.secondaryBtn}>
          Logout
        </button>
      </div>
    </header>
  );
}
