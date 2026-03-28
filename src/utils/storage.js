export function readStorage(key, fallbackValue) {
  if (typeof window === "undefined") {
    return fallbackValue;
  }
  try {
    const rawValue = window.localStorage.getItem(key);
    if (!rawValue) {
      return fallbackValue;
    }
    return JSON.parse(rawValue);
  } catch (error) {
    return fallbackValue;
  }
}

export function writeStorage(key, value) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    // Ignore storage errors to keep UI usable.
  }
}
