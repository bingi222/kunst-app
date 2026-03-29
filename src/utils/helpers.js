export function createAvatarFromName(name) {
  const seed = (name || "Kunst").trim();
  return `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(seed)}`;
}

export function normalizeUsername(username) {
  return String(username || "")
    .trim()
    .toLowerCase();
}

export function isEditableTarget(target) {
  if (!target || typeof target !== "object") {
    return false;
  }
  const tagName = String(target.tagName || "").toUpperCase();
  return Boolean(target.isContentEditable) || tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT";
}

export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Datei konnte nicht gelesen werden."));
    reader.readAsDataURL(file);
  });
}

export function mergeClassNames(...values) {
  return values.filter(Boolean).join(" ");
}
