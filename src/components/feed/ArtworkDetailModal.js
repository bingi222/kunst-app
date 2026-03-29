import React, { useEffect } from "react";
import SafeImage from "../common/SafeImage";

const backdropStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(8, 10, 16, 0.78)",
  display: "grid",
  placeItems: "center",
  padding: "24px",
  zIndex: 120,
};

const dialogStyle = {
  width: "min(100%, 980px)",
  borderRadius: "18px",
  border: "1px solid rgba(255, 255, 255, 0.12)",
  background: "#0f1520",
  boxShadow: "0 24px 70px rgba(0, 0, 0, 0.55)",
  overflow: "hidden",
};

const closeButtonStyle = {
  width: "34px",
  height: "34px",
  borderRadius: "999px",
  border: "1px solid rgba(255, 255, 255, 0.18)",
  background: "rgba(17, 22, 33, 0.76)",
  color: "#f3f4f6",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  fontSize: "16px",
  lineHeight: 1,
};

export default function ArtworkDetailModal({ post, onClose }) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  if (!post) {
    return null;
  }

  return (
    <div
      style={backdropStyle}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Detailansicht Kunstwerk"
    >
      <div style={dialogStyle} onClick={(event) => event.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "flex-end", padding: "12px 12px 0" }}>
          <button type="button" onClick={onClose} style={closeButtonStyle} aria-label="Detailansicht schliessen">
            ×
          </button>
        </div>

        <div style={{ padding: "0 18px 18px" }}>
          <SafeImage
            src={post.images?.[0]}
            alt={`Detailansicht von ${post.user}`}
            style={{
              width: "100%",
              height: "auto",
              maxHeight: "68vh",
              objectFit: "contain",
              borderRadius: "14px",
              background: "#111826",
            }}
          />

          <div style={{ marginTop: "14px", display: "grid", gap: "8px" }}>
            <p style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#f5f6fb" }}>
              {post.user || "Unbekannter Kuenstler"}
            </p>
            <p style={{ margin: 0, fontSize: "13px", lineHeight: 1.55, color: "#b7c1d4" }}>
              Dieses Werk zeigt eine reduzierte, zeitgenoessische Komposition mit Fokus auf Licht, Struktur und
              Stimmung. Die Detailansicht ist als visuelle Vorschau vorbereitet.
            </p>
            <div
              style={{
                marginTop: "4px",
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                color: "#d7def0",
                fontSize: "13px",
              }}
            >
              <span style={{ opacity: 0.9 }}>♡</span>
              <span style={{ opacity: 0.9 }}>Like-Bereich (Preview)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
