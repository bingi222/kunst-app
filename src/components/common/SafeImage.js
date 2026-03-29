import React, { useState } from "react";

const fallbackStyle = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  color: "#aaaaaa",
  fontSize: "12px",
  border: "1px dashed #3a3a3a",
};

export default function SafeImage({
  src,
  alt,
  style,
  onDoubleClick,
  onClick,
  className = "",
  onLoad,
}) {
  const [failed, setFailed] = useState(false);
  if (failed || !src) {
    return <div style={{ ...fallbackStyle, ...style }}>Bild nicht verfuegbar</div>;
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onDoubleClick={onDoubleClick}
      onClick={onClick}
      onLoad={onLoad}
      onError={() => setFailed(true)}
      className={className}
      style={style}
    />
  );
}
