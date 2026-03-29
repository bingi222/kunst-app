import React, { useEffect, useState } from "react";
import SafeImage from "../common/SafeImage";

const backdropStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(0, 0, 0, 0.56)",
  display: "grid",
  placeItems: "center",
  padding: "24px",
  zIndex: 120,
};

const dialogStyle = {
  width: "min(100%, 980px)",
  borderRadius: "18px",
  border: "1px solid #2a2a2a",
  background: "#1a1a1a",
  boxShadow: "0 24px 70px rgba(0, 0, 0, 0.55)",
  overflow: "hidden",
};

const closeButtonStyle = {
  width: "34px",
  height: "34px",
  borderRadius: "999px",
  border: "1px solid #2a2a2a",
  background: "#1a1a1a",
  color: "rgba(255, 255, 255, 0.9)",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  fontSize: "16px",
  lineHeight: 1,
};

function createDetailMeta(post) {
  const idPart = Number(post.id);
  const userPart = String(post.user || "")
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const hash = Math.abs((Number.isFinite(idPart) ? idPart : 0) * 31 + userPart);
  const fallbackArtists = ["Atelier Nord", "Studio Lumen", "Kollektiv Forma", "Maison Nocturne"];
  const generatedArtist = fallbackArtists[hash % fallbackArtists.length];
  const artistName = String(post.user || "").trim() || generatedArtist;
  const likeCount = 80 + (hash % 321);
  const descriptions = [
    "Eine ruhige Komposition aus Kontrast und Struktur laesst den Blick langsam in die Tiefe wandern. Subtile Uebergaenge erzeugen dabei eine konzentrierte, fast meditative Wirkung.",
    "Subtile Lichtflaechen und reduzierte Formen schaffen eine klare visuelle Ordnung. Das Werk belohnt laengeres Betrachten mit immer neuen kleinen Details.",
    "Klare Flaechen und feine Tonabstufungen bauen eine stille Dynamik auf. Die Balance aus Ruhe und Spannung verleiht dem Motiv eine praezise Praesenz.",
    "Minimalistische Linien und weiche Uebergaenge geben der Szene eine zeitlose Haltung. Gleichzeitig bleibt genug Offenheit, damit der Blick frei assoziieren kann.",
  ];
  const description = descriptions[hash % descriptions.length];
  const postedHoursAgo = 1 + (hash % 8);
  return { artistName, likeCount, description, postedHoursAgo };
}

export default function ArtworkDetailModal({
  post,
  onClose,
  isFollowing = false,
  onToggleFollow = () => {},
  followerCount = 0,
}) {
  const [isLiked, setIsLiked] = useState(false);

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

  useEffect(() => {
    setIsLiked(false);
  }, [post?.id]);

  if (!post) {
    return null;
  }

  const detailMeta = createDetailMeta(post);
  const displayedLikes = detailMeta.likeCount + (isLiked ? 1 : 0);

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
            alt={`Detailansicht von ${detailMeta.artistName}`}
            style={{
              width: "100%",
              height: "auto",
              maxHeight: "78vh",
              objectFit: "contain",
              borderRadius: "14px",
              background: "#1a1a1a",
            }}
          />
          <div style={{ padding: "12px 4px 2px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
              <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "rgba(255, 255, 255, 0.9)" }}>
                Kuenstler: {detailMeta.artistName}
              </p>
              <button
                type="button"
                onClick={() => onToggleFollow(post.user)}
                aria-label="Kuenstler folgen umschalten"
                aria-pressed={isFollowing}
                style={{
                  border: "1px solid #2a2a2a",
                  borderRadius: "999px",
                  padding: "6px 10px",
                  background: isFollowing ? "#222222" : "#1a1a1a",
                  color: isFollowing ? "rgba(255, 255, 255, 0.9)" : "#aaaaaa",
                  fontSize: "12px",
                  cursor: "pointer",
                  transition: "background-color 180ms ease, color 180ms ease, transform 180ms ease",
                  transform: isFollowing ? "scale(1.02)" : "scale(1)",
                }}
              >
                {isFollowing ? "Gefolgt" : "Follow"}
              </button>
            </div>
            <p style={{ margin: "6px 0 0", fontSize: "12px", color: "#aaaaaa" }}>
              {followerCount} Follower
            </p>
            <div style={{ marginTop: "8px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
              <p style={{ margin: 0, fontSize: "12px", color: "#aaaaaa" }}>
                {displayedLikes} Likes
              </p>
              <button
                type="button"
                onClick={() => setIsLiked((previous) => !previous)}
                aria-label="Like visuell umschalten"
                aria-pressed={isLiked}
                style={{
                  border: "1px solid #2a2a2a",
                  borderRadius: "999px",
                  padding: "6px 10px",
                  background: isLiked ? "#222222" : "#1a1a1a",
                  color: isLiked ? "rgba(255, 255, 255, 0.9)" : "#aaaaaa",
                  fontSize: "12px",
                  cursor: "pointer",
                  transition: "background-color 180ms ease, color 180ms ease, transform 180ms ease",
                  transform: isLiked ? "scale(1.02)" : "scale(1)",
                }}
              >
                {isLiked ? "♥ Geliked" : "♡ Like"}
              </button>
            </div>
            <p style={{ margin: "8px 0 0", fontSize: "13px", lineHeight: 1.45, color: "#aaaaaa" }}>
              {detailMeta.description}
            </p>
            <p style={{ margin: "8px 0 0", fontSize: "12px", color: "#aaaaaa" }}>
              vor {detailMeta.postedHoursAgo} Stunden gepostet
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
