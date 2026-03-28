import React, { useEffect, useRef, useState } from "react";
import SafeImage from "../common/SafeImage";

export default function UploadPage({ onBack, onPost, currentUser, draftImageUrl, onDraftImageUrlChange }) {
  const [imageUrl, setImageUrl] = useState(() => String(draftImageUrl || ""));
  const [errorText, setErrorText] = useState("");
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const canPost = imageUrl.trim().length > 0;

  useEffect(() => {
    setImageUrl(String(draftImageUrl || ""));
  }, [draftImageUrl]);

  const setDraft = (nextValue) => {
    setImageUrl(nextValue);
    onDraftImageUrlChange(nextValue);
  };

  const assignFileAsPreview = (file) => {
    if (!file) {
      return;
    }
    if (!String(file.type || "").startsWith("image/")) {
      setErrorText("Bitte nur Bilddateien hochladen.");
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setErrorText("");
    setDraft(objectUrl);
  };

  const submitPost = () => {
    const normalized = imageUrl.trim();
    if (!normalized) {
      return;
    }

    let parsedUrl;
    try {
      parsedUrl = new URL(normalized);
    } catch (error) {
      setErrorText("Bitte eine gueltige URL eingeben.");
      return;
    }

    if (!["http:", "https:", "blob:", "data:"].includes(parsedUrl.protocol)) {
      setErrorText("Nur http/https oder lokale Vorschau-URLs sind erlaubt.");
      return;
    }

    setErrorText("");
    onPost({
      id: Date.now(),
      ownerId: currentUser.id,
      user: currentUser.displayName,
      bio: currentUser.bio,
      avatar: currentUser.avatar,
      images: [normalized],
    });
    setDraft("");
    onBack();
  };

  const onDragOver = (event) => {
    event.preventDefault();
    setIsDragActive(true);
  };

  const onDragLeave = (event) => {
    event.preventDefault();
    setIsDragActive(false);
  };

  const onDrop = (event) => {
    event.preventDefault();
    setIsDragActive(false);
    const file = event.dataTransfer?.files?.[0];
    assignFileAsPreview(file);
  };

  return (
    <section style={{ maxWidth: 760, margin: "0 auto", padding: "20px 16px" }}>
      <button type="button" onClick={onBack} style={{ border: "none", background: "transparent", color: "#9ca3af", cursor: "pointer" }}>
        ← Zurueck
      </button>
      <h2 style={{ marginTop: "18px", marginBottom: "8px", fontSize: "30px" }}>Upload</h2>
      <p style={{ marginTop: 0, color: "#9ca3af" }}>Fuege ein Werk per URL hinzu oder ziehe ein Bild in die Upload-Flache.</p>

      <div
        role="button"
        tabIndex={0}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        style={{
          marginTop: "14px",
          border: `1px dashed ${isDragActive ? "#8b5cf6" : "#364152"}`,
          borderRadius: "16px",
          padding: "26px 18px",
          background: isDragActive ? "rgba(139, 92, 246, 0.1)" : "#151922",
          textAlign: "center",
          color: "#d1d5db",
          cursor: "pointer",
        }}
      >
        Bild hierher ziehen oder klicken zum Auswaehlen
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(event) => {
          assignFileAsPreview(event.target.files?.[0]);
          event.target.value = "";
        }}
        style={{ display: "none" }}
      />

      <input
        type="url"
        placeholder="Bild-URL einfuegen"
        value={imageUrl}
        onChange={(event) => {
          const nextValue = event.target.value;
          setDraft(nextValue);
          if (errorText) {
            setErrorText("");
          }
        }}
        style={{
          width: "100%",
          boxSizing: "border-box",
          marginTop: "14px",
          padding: "12px 14px",
          borderRadius: "12px",
          border: "1px solid #303745",
          background: "#121722",
          color: "#f3f4f6",
        }}
      />
      {errorText && <p style={{ marginTop: "10px", color: "#fda4af", fontSize: "13px" }}>{errorText}</p>}

      {imageUrl && (
        <div style={{ marginTop: "14px", border: "1px solid #262d3a", borderRadius: "16px", overflow: "hidden" }}>
          <SafeImage src={imageUrl} alt="Upload Vorschau" style={{ width: "100%", height: 320, objectFit: "cover", background: "#1b1f29" }} />
        </div>
      )}

      <div style={{ marginTop: "14px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={() => setDraft("https://picsum.photos/seed/upload-demo/900/600")}
          style={{
            height: "40px",
            borderRadius: "12px",
            border: "1px solid #2b313d",
            background: "#171b24",
            color: "#e5e7eb",
            padding: "0 14px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Demo-Bild einsetzen
        </button>
        <button
          type="button"
          onClick={submitPost}
          disabled={!canPost}
          style={{
            height: "40px",
            borderRadius: "12px",
            border: "1px solid transparent",
            background: "#8b5cf6",
            color: "#ffffff",
            padding: "0 14px",
            fontWeight: 600,
            cursor: canPost ? "pointer" : "not-allowed",
            opacity: canPost ? 1 : 0.6,
          }}
        >
          Posten
        </button>
      </div>
    </section>
  );
}
