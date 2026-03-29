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
              maxHeight: "78vh",
              objectFit: "contain",
              borderRadius: "14px",
              background: "#111826",
            }}
          />
        </div>
      </div>
    </div>
  );
}
