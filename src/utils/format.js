export function getPasswordStrength(value) {
  const normalized = (value || "").trim();
  if (!normalized) {
    return { label: "Keine Eingabe", color: "#aaaaaa" };
  }

  let score = 0;
  if (normalized.length >= 8) {
    score += 1;
  }
  if (/[A-Z]/.test(normalized)) {
    score += 1;
  }
  if (/[a-z]/.test(normalized)) {
    score += 1;
  }
  if (/[0-9]/.test(normalized)) {
    score += 1;
  }
  if (/[^A-Za-z0-9]/.test(normalized)) {
    score += 1;
  }

  if (normalized.length < 6 || score <= 1) {
    return { label: "Schwach", color: "#aaaaaa" };
  }
  if (score <= 3) {
    return { label: "Mittel", color: "rgba(255, 255, 255, 0.9)" };
  }
  return { label: "Stark", color: "rgba(255, 255, 255, 0.9)" };
}

export function formatRelativeTime(timestamp) {
  const createdAt = Number(timestamp);
  if (!Number.isFinite(createdAt) || createdAt <= 0) {
    return "gerade eben";
  }

  const diffMs = Date.now() - createdAt;
  if (!Number.isFinite(diffMs) || diffMs < 0) {
    return "gerade eben";
  }

  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) {
    return "gerade eben";
  }
  if (minutes < 60) {
    return `vor ${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `vor ${hours}h`;
  }

  const days = Math.floor(hours / 24);
  return `vor ${days}d`;
}

export function buildNotificationMessage(notification) {
  if (!notification) {
    return "Neue Aktivitaet.";
  }
  const actorName = String(notification.actorName || "Jemand");
  const type = String(notification.type || "").toLowerCase();
  const fallbackText = String(notification.text || "").trim();
  if (fallbackText) {
    return fallbackText;
  }
  if (type === "like") {
    return `${actorName} hat deinen Beitrag geliked.`;
  }
  if (type === "comment") {
    return `${actorName} hat deinen Beitrag kommentiert.`;
  }
  return `${actorName} hat eine neue Aktivitaet ausgeloest.`;
}
