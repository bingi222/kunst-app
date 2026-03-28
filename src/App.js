import React, { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";


const TOKENS = {
  radius: {
    sm: "10px",
    md: "16px",
    lg: "18px",
    pill: "999px",
  },
  spacing: {
    xs: "6px",
    sm: "10px",
    md: "14px",
    lg: "20px",
  },
  elevation: {
    soft: "0 10px 24px rgba(0, 0, 0, 0.42)",
    neon: "0 0 0 1px rgba(176, 125, 255, 0.3), 0 0 22px rgba(176, 125, 255, 0.23), 0 14px 28px rgba(0, 0, 0, 0.52)",
  },
};

const styles = {
  app: {
    background:
      "radial-gradient(circle at 15% 0%, #3f1f6f 0%, #161426 35%, #090910 66%), radial-gradient(circle at 92% 4%, rgba(0, 245, 255, 0.14) 0%, rgba(0, 0, 0, 0) 40%)",
    color: "#f6f2ff",
    minHeight: "100vh",
    paddingBottom: "96px",
  },
  card: {
    marginBottom: TOKENS.spacing.lg,
    border: "1px solid #4f3293",
    borderRadius: TOKENS.radius.md,
    overflow: "hidden",
    background: "linear-gradient(145deg, #1a1430 0%, #0d101c 100%)",
    boxShadow: "0 0 0 1px rgba(186, 120, 255, 0.15), 0 16px 32px rgba(0, 0, 0, 0.5)",
  },
  imageGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "6px",
  },
  image: {
    width: "100%",
    height: "152px",
    objectFit: "cover",
    background: "#131320",
  },
  iconBtn: {
    background: "transparent",
    border: "none",
    color: "#f7f1ff",
    cursor: "pointer",
    fontSize: "19px",
    padding: 0,
    fontFamily: "inherit",
    transition: "transform 140ms ease, filter 140ms ease, box-shadow 140ms ease",
  },
  nav: {
    position: "fixed",
    left: "50%",
    transform: "translateX(-50%)",
    bottom: "14px",
    width: "min(94vw, 700px)",
    background: "rgba(12, 10, 24, 0.9)",
    border: "1px solid #4f39a0",
    borderRadius: TOKENS.radius.pill,
    boxShadow: TOKENS.elevation.neon,
    backdropFilter: "blur(10px)",
    display: "flex",
    justifyContent: "space-around",
    padding: "8px 10px",
    zIndex: 30,
  },
};

const STORAGE_AUTH_TOKEN_KEY = "kunst-app.auth.token.v1";
const STORAGE_FEED_SEARCH_KEY = "kunst-app.feed.search.v1";
const STORAGE_FEED_MODE_KEY = "kunst-app.feed.mode.v1";
const STORAGE_FEED_SORT_KEY = "kunst-app.feed.sort.v1";
const STORAGE_UPLOAD_DRAFT_KEY = "kunst-app.upload.draft.v1";
const STORAGE_COMMENT_DRAFTS_KEY = "kunst-app.comment.drafts.v1";
const API_BASE_URL = process.env.REACT_APP_API_URL || "";
const EMPTY_COMMENTS = [];
const MARK_ALL_UNDO_WINDOW_MS = 5000;
function readStorage(key, fallbackValue) {
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

function writeStorage(key, value) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    // Ignore storage errors (e.g. quota/privacy mode).
  }
}

function createAvatarFromName(name) {
  const seed = (name || "Kunst").trim();
  return `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(seed)}`;
}

function normalizeUsername(username) {
  return username.trim().toLowerCase();
}

function isEditableTarget(target) {
  if (!target || typeof target !== "object") {
    return false;
  }
  const tagName = String(target.tagName || "").toUpperCase();
  return Boolean(target.isContentEditable) || tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT";
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Datei konnte nicht gelesen werden."));
    reader.readAsDataURL(file);
  });
}

function getPasswordStrength(value) {
  const normalized = (value || "").trim();
  if (!normalized) {
    return { label: "Keine Eingabe", color: "#8f8f8f" };
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
    return { label: "Schwach", color: "#ff8f8f" };
  }
  if (score <= 3) {
    return { label: "Mittel", color: "#ffd479" };
  }
  return { label: "Stark", color: "#9aff9a" };
}

function formatRelativeTime(timestamp) {
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

function buildNotificationMessage(notification) {
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

function createApiClient(token) {
  const request = async (path, options = {}) => {
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });

    const responseBody = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = responseBody?.message || responseBody?.error || "Serverfehler";
      throw new Error(message);
    }
    return responseBody;
  };

  return {
    register: (payload) =>
      request("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    login: (payload) =>
      request("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    me: () => request("/api/auth/me"),
    updateProfile: (payload) =>
      request("/api/auth/profile", {
        method: "PUT",
        body: JSON.stringify(payload),
      }),
    changePassword: (payload) =>
      request("/api/auth/password", {
        method: "PUT",
        body: JSON.stringify(payload),
      }),
    getFeed: () => request("/api/feed"),
    createPost: (payload) =>
      request("/api/feed/posts", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    toggleLike: (postId, liked) =>
      request(`/api/feed/likes/${postId}`, {
        method: "PUT",
        body: JSON.stringify({ liked }),
      }),
    getNotifications: () => request("/api/notifications"),
    markAllNotificationsRead: () =>
      request("/api/notifications/read-all", {
        method: "PUT",
      }),
    markNotificationRead: (notificationId) =>
      request(`/api/notifications/${notificationId}/read`, {
        method: "PUT",
      }),
    getComments: (postId) => request(`/api/feed/posts/${postId}/comments`),
    createComment: (postId, payload) =>
      request(`/api/feed/posts/${postId}/comments`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  };
}

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    // Keep the app usable even if one subtree crashes.
    // eslint-disable-next-line no-console
    console.error("UI crash captured by ErrorBoundary:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "24px", color: "#fff", background: "#000", minHeight: "100vh" }}>
          <h1>Inhalte konnten nicht vollstaendig geladen werden</h1>
          <p>Bitte Seite neu laden. Die Anwendung bleibt stabil und zeigt Basisinhalte an.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

function AuthScreen({ onLogin, onRegister }) {
  const [mode, setMode] = useState("login");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [marketingConsent, setMarketingConsent] = useState(true);
  const [errorText, setErrorText] = useState("");

  const isRegister = mode === "register";
  const registerPasswordStrength = useMemo(() => getPasswordStrength(password), [password]);

  const submitAuth = async (event) => {
    event.preventDefault();
    const payload = { username, password, displayName, email, marketingConsent };
    const error = await (isRegister ? onRegister(payload) : onLogin(payload));
    if (error) {
      setErrorText(error);
      return;
    }

    setErrorText("");
    setPassword("");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#000",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <form
        onSubmit={submitAuth}
        style={{
          width: "100%",
          maxWidth: "420px",
          border: "1px solid #242424",
          borderRadius: "14px",
          padding: "22px",
          background: "#0a0a0a",
        }}
      >
        <h1 style={{ marginTop: 0, marginBottom: "8px" }}>KUNST Login</h1>
        <p style={{ marginTop: 0, color: "#bdbdbd", fontSize: "14px" }}>
          {isRegister ? "Neues Konto anlegen" : "Mit Profil anmelden"}
        </p>

        {isRegister && (
          <label style={{ display: "block", marginBottom: "12px" }}>
            <span style={{ display: "block", marginBottom: "6px", fontSize: "13px" }}>Anzeigename</span>
            <input
              type="text"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="z. B. Mia Art"
              style={{
                width: "100%",
                boxSizing: "border-box",
                background: "#101010",
                border: "1px solid #2d2d2d",
                borderRadius: "8px",
                color: "#fff",
                padding: "10px",
              }}
            />
          </label>
        )}
        {isRegister && (
          <label style={{ display: "block", marginBottom: "12px" }}>
            <span style={{ display: "block", marginBottom: "6px", fontSize: "13px" }}>E-Mail (erforderlich)</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@beispiel.de"
              autoComplete="email"
              required={isRegister}
              style={{
                width: "100%",
                boxSizing: "border-box",
                background: "#101010",
                border: "1px solid #2d2d2d",
                borderRadius: "8px",
                color: "#fff",
                padding: "10px",
              }}
            />
          </label>
        )}

        <label style={{ display: "block", marginBottom: "12px" }}>
          <span style={{ display: "block", marginBottom: "6px", fontSize: "13px" }}>Username</span>
          <input
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="z. B. bingi"
            autoComplete="username"
            style={{
              width: "100%",
              boxSizing: "border-box",
              background: "#101010",
              border: "1px solid #2d2d2d",
              borderRadius: "8px",
              color: "#fff",
              padding: "10px",
            }}
          />
        </label>

        <label style={{ display: "block", marginBottom: "6px" }}>
          <span style={{ display: "block", marginBottom: "6px", fontSize: "13px" }}>Passwort</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete={isRegister ? "new-password" : "current-password"}
            placeholder={isRegister ? "Mindestens 6 Zeichen" : "Dein Passwort"}
            style={{
              width: "100%",
              boxSizing: "border-box",
              background: "#101010",
              border: "1px solid #2d2d2d",
              borderRadius: "8px",
              color: "#fff",
              padding: "10px",
            }}
          />
        </label>
        {isRegister && (
          <p style={{ marginTop: "-2px", marginBottom: "10px", color: registerPasswordStrength.color, fontSize: "12px" }}>
            Passwortstaerke: {registerPasswordStrength.label}
          </p>
        )}
        {isRegister && (
          <label style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginBottom: "10px", fontSize: "12px", color: "#bfb9d7" }}>
            <input
              type="checkbox"
              checked={marketingConsent}
              onChange={(event) => setMarketingConsent(Boolean(event.target.checked))}
              style={{ marginTop: "2px" }}
            />
            <span>
              Ich moechte Produkt-News und Werbe-E-Mails erhalten. Meine E-Mail wird fuer Verifizierung und Marketing genutzt.
            </span>
          </label>
        )}

        {errorText && <p style={{ color: "#ff8f8f", marginBottom: "12px" }}>{errorText}</p>}

        <button
          type="submit"
          style={{
            marginTop: "10px",
            width: "100%",
            padding: "11px",
            borderRadius: "8px",
            border: "none",
            background: "#fff",
            color: "#000",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          {isRegister ? "Registrieren" : "Anmelden"}
        </button>

        <button
          type="button"
          onClick={() => {
            setMode(isRegister ? "login" : "register");
            setErrorText("");
          }}
          style={{
            ...styles.iconBtn,
            marginTop: "10px",
            fontSize: "13px",
            textDecoration: "underline",
          }}
        >
          {isRegister ? "Schon ein Konto? Jetzt anmelden" : "Noch kein Konto? Jetzt registrieren"}
        </button>

        <p style={{ marginBottom: 0, marginTop: "16px", color: "#8f8f8f", fontSize: "12px" }}>
          Demo-Login: Username <b>bingi</b>, Passwort <b>kunst123</b>
        </p>
      </form>
    </div>
  );
}

function Header({ title, currentUser, onLogout }) {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        background: "#000",
        padding: "14px 16px",
        borderBottom: "1px solid #1f1f1f",
        zIndex: 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
        <div>
          <b>{title}</b>
          <div style={{ fontSize: "12px", opacity: 0.65, marginTop: "2px" }}>Angemeldet als {currentUser.displayName}</div>
          <div style={{ fontSize: "11px", opacity: 0.58, marginTop: "3px" }}>
            Shortcuts: G Feed · U Upload · A Aktivitaet · P Profil · R Aktualisieren
          </div>
        </div>
        <button
          type="button"
          onClick={onLogout}
          style={{
            ...styles.iconBtn,
            fontSize: "12px",
            border: "1px solid #2e2e2e",
            borderRadius: "999px",
            padding: "6px 10px",
          }}
        >
          Logout
        </button>
      </div>
    </header>
  );
}

function FeedToolbar({
  searchQuery,
  onSearchChange,
  feedMode,
  setFeedMode,
  sortOrder,
  setSortOrder,
  onResetFilters,
  onRefresh,
  isRefreshing,
  lastUpdatedAt,
}) {
  const controlButtonStyle = (active) => ({
    ...styles.iconBtn,
    border: "1px solid #2a2a2a",
    borderRadius: "999px",
    padding: "6px 10px",
    fontSize: "12px",
    fontWeight: 700,
    opacity: active ? 1 : 0.65,
    background: active ? "#1d1d1d" : "transparent",
  });
  const refreshButtonStyle = {
    ...styles.iconBtn,
    border: "1px solid #4f3293",
    borderRadius: "999px",
    padding: "6px 10px",
    fontSize: "12px",
    fontWeight: 700,
    boxShadow: "0 0 0 1px rgba(186, 120, 255, 0.2)",
  };
  const lastUpdatedLabel = lastUpdatedAt
    ? `Zuletzt aktualisiert ${formatRelativeTime(lastUpdatedAt)}`
    : "Noch nicht aktualisiert";

  return (
    <section style={{ marginBottom: "16px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", marginBottom: "8px" }}>
        <label htmlFor="feed-search" style={{ marginBottom: 0, fontSize: "13px", opacity: 0.8 }}>
          Suche
        </label>
        <button type="button" onClick={onRefresh} disabled={isRefreshing} style={refreshButtonStyle}>
          {isRefreshing ? "Aktualisiere..." : "Aktualisieren"}
        </button>
      </div>
      <input
        id="feed-search"
        type="search"
        value={searchQuery}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Kuenstler oder Bio suchen"
        style={{
          width: "100%",
          boxSizing: "border-box",
          border: "1px solid #2a2a2a",
          borderRadius: "8px",
          background: "#101010",
          color: "#fff",
          padding: "10px 12px",
          marginBottom: "10px",
        }}
      />
      <p style={{ marginTop: 0, marginBottom: "10px", fontSize: "11px", color: "#9d94bf" }}>{lastUpdatedLabel}</p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        <button type="button" onClick={() => setFeedMode("all")} style={controlButtonStyle(feedMode === "all")}>
          Alle
        </button>
        <button type="button" onClick={() => setFeedMode("liked")} style={controlButtonStyle(feedMode === "liked")}>
          Nur Likes
        </button>
        <button
          type="button"
          onClick={() => setSortOrder(sortOrder === "newest" ? "oldest" : "newest")}
          style={controlButtonStyle(true)}
        >
          Sortierung: {sortOrder === "newest" ? "Neueste zuerst" : "Aelteste zuerst"}
        </button>
        <button type="button" onClick={onResetFilters} style={controlButtonStyle(false)}>
          Filter zuruecksetzen
        </button>
      </div>
    </section>
  );
}

function SafeImage({ src, alt, style, onDoubleClick }) {
  const [failed, setFailed] = useState(false);
  if (failed || !src) {
    return (
      <div
        style={{
          ...style,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          color: "#8c8c8c",
          fontSize: "12px",
          border: "1px dashed #333",
        }}
      >
        Bild nicht verfuegbar
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onDoubleClick={onDoubleClick}
      onError={() => setFailed(true)}
      style={style}
    />
  );
}

function HeartIcon({ active }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill={active ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "block", width: 22, height: 22 }}
      aria-hidden="true"
    >
      <path d="M20.8 5.6c-1.5-1.5-3.9-1.5-5.4 0L12 9l-3.4-3.4c-1.5-1.5-3.9-1.5-5.4 0a3.82 3.82 0 0 0 0 5.4L12 19.8l8.8-8.8a3.82 3.82 0 0 0 0-5.4z" />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "block", width: 22, height: 22 }}
      aria-hidden="true"
    >
      <path d="M21 14a4 4 0 0 1-4 4H9l-4 3v-3a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4h12a4 4 0 0 1 4 4z" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "block", width: 18, height: 18 }}
      aria-hidden="true"
    >
      <path d="M18 8a6 6 0 1 0-12 0c0 7-3 8-3 8h18s-3-1-3-8" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function BottomNav({ current, setCurrent, onOpenOwnProfile, unreadNotificationsCount }) {
  const linkStyle = (tab) => ({
    ...styles.iconBtn,
    fontSize: "14px",
    opacity: current === tab ? 1 : 0.6,
    fontWeight: current === tab ? 700 : 400,
  });

  return (
    <nav style={styles.nav}>
      <button type="button" onClick={() => setCurrent("feed")} style={linkStyle("feed")}>
        Home
      </button>
      <button type="button" onClick={() => setCurrent("upload")} style={linkStyle("upload")}>
        Upload
      </button>
      <button
        type="button"
        onClick={() => setCurrent("activity")}
        style={linkStyle("activity")}
        aria-label={
          unreadNotificationsCount > 0
            ? `Aktivitaet (${unreadNotificationsCount} ungelesen)`
            : "Aktivitaet"
        }
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", position: "relative" }}>
          <BellIcon />
          <span>Aktivitaet</span>
          {unreadNotificationsCount > 0 && (
            <span
              style={{
                minWidth: "16px",
                height: "16px",
                padding: "0 4px",
                borderRadius: "999px",
                background: "#ff5f5f",
                color: "#fff",
                fontSize: "10px",
                lineHeight: "16px",
                textAlign: "center",
                fontWeight: 700,
              }}
            >
              {unreadNotificationsCount > 99 ? "99+" : unreadNotificationsCount}
            </span>
          )}
        </span>
      </button>
      <button type="button" onClick={onOpenOwnProfile} style={linkStyle("profile")}>
        Mein Profil
      </button>
    </nav>
  );
}

function Activity({
  notifications,
  isLoading,
  errorText,
  onReload,
  onMarkAllRead,
  canMarkAllRead,
  showUndoMarkAll,
  onUndoMarkAll,
  onMarkRead,
  onOpenPost,
  onBack,
}) {
  const unreadCount = notifications.filter((notification) => !notification.read).length;

  return (
    <section style={{ maxWidth: 640, margin: "0 auto", padding: "14px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
        <button type="button" onClick={onBack} style={styles.iconBtn}>
          ← Zurueck
        </button>
        <button
          type="button"
          onClick={onMarkAllRead}
          disabled={!canMarkAllRead}
          style={{
            ...styles.iconBtn,
            border: "1px solid #2d2d2d",
            borderRadius: "999px",
            padding: "6px 10px",
            fontSize: "12px",
            opacity: canMarkAllRead ? 1 : 0.55,
            cursor: canMarkAllRead ? "pointer" : "not-allowed",
          }}
        >
          Alle als gelesen markieren
        </button>
      </div>
      {showUndoMarkAll && (
        <div
          style={{
            border: "1px solid #3a2f66",
            borderRadius: "10px",
            padding: "10px 12px",
            marginBottom: "10px",
            background: "rgba(39, 28, 71, 0.42)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "10px",
          }}
        >
          <p style={{ margin: 0, fontSize: "12px", color: "#d8cdf8" }}>Alle Benachrichtigungen wurden als gelesen markiert.</p>
          <button
            type="button"
            onClick={onUndoMarkAll}
            style={{
              ...styles.iconBtn,
              fontSize: "12px",
              textDecoration: "underline",
            }}
          >
            Rueckgaengig
          </button>
        </div>
      )}

      <h2 style={{ marginTop: 0 }}>Aktivitaet</h2>
      {errorText && (
        <div
          style={{
            border: "1px dashed #5b2323",
            borderRadius: "10px",
            padding: "12px",
            color: "#ffb9b9",
            marginBottom: "10px",
          }}
        >
          <p style={{ marginTop: 0, marginBottom: "8px" }}>{errorText}</p>
          <button
            type="button"
            onClick={onReload}
            style={{
              ...styles.iconBtn,
              fontSize: "12px",
              textDecoration: "underline",
            }}
          >
            Erneut versuchen
          </button>
        </div>
      )}
      {isLoading ? (
        <div
          style={{
            border: "1px dashed #303030",
            borderRadius: "10px",
            padding: "18px",
            color: "#b7b7b7",
          }}
        >
          Aktivitaet wird geladen...
        </div>
      ) : notifications.length === 0 ? (
        <div
          style={{
            border: "1px dashed #303030",
            borderRadius: "10px",
            padding: "18px",
            color: "#b7b7b7",
          }}
        >
          Noch keine Benachrichtigungen.
        </div>
      ) : (
        <div style={{ display: "grid", gap: "10px" }}>
          {unreadCount === 0 && (
            <p style={{ margin: 0, fontSize: "12px", color: "#9b9b9b" }}>
              Keine ungelesenen Benachrichtigungen.
            </p>
          )}
          {notifications.map((notification) => (
            <div
              key={notification.id}
              style={{
                border: "1px solid #252525",
                borderRadius: "10px",
                padding: "10px 12px",
                background: notification.read ? "#0b0b0b" : "#121212",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                <SafeImage
                  src={notification.actorAvatar}
                  alt={`${notification.actorName || "User"} Avatar`}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    objectFit: "cover",
                    background: "#111",
                    flexShrink: 0,
                  }}
                />
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: "13px", lineHeight: 1.4 }}>
                    <strong>{notification.actorName || "Jemand"}</strong> {buildNotificationMessage(notification)}
                  </p>
                  <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#8f8f8f" }}>
                    {formatRelativeTime(notification.createdAt)}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "8px" }}>
                    {Number.isFinite(Number(notification.postId)) && (
                      <button
                        type="button"
                        onClick={() => {
                          if (onOpenPost) {
                            onOpenPost(notification);
                          }
                        }}
                        style={{
                          ...styles.iconBtn,
                          fontSize: "12px",
                          textDecoration: "underline",
                        }}
                      >
                        Zum Beitrag
                      </button>
                    )}
                    {!notification.read && (
                      <button
                        type="button"
                        onClick={() => onMarkRead(notification.id)}
                        style={{
                          ...styles.iconBtn,
                          fontSize: "12px",
                          textDecoration: "underline",
                        }}
                      >
                        Als gelesen markieren
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function CommentPanel({
  comments,
  isLoading,
  errorText,
  commentText,
  onCommentTextChange,
  onSubmitComment,
  isSubmitting,
}) {
  const currentLength = commentText.length;
  const trimmedLength = commentText.trim().length;
  const canSubmit = trimmedLength > 0 && trimmedLength <= 300 && !isSubmitting;

  return (
    <div
      style={{
        borderTop: "1px solid #1f1f1f",
        padding: "10px 14px 14px",
      }}
    >
      {isLoading ? (
        <p style={{ marginTop: 0, marginBottom: "10px", color: "#b7b7b7", fontSize: "13px" }}>
          Kommentare werden geladen...
        </p>
      ) : comments.length === 0 ? (
        <p style={{ marginTop: 0, marginBottom: "10px", color: "#9b9b9b", fontSize: "13px" }}>
          Noch keine Kommentare.
        </p>
      ) : (
        <div style={{ display: "grid", gap: "10px", marginBottom: "10px" }}>
          {comments.map((comment) => (
            <div key={comment.id} style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
              <SafeImage
                src={comment.userAvatar}
                alt={`${comment.userName} Avatar`}
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  objectFit: "cover",
                  background: "#111",
                  flexShrink: 0,
                }}
              />
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: "13px", lineHeight: 1.35 }}>
                  <strong>{comment.userName}</strong>
                </p>
                <p style={{ margin: "2px 0 0", fontSize: "13px", lineHeight: 1.35 }}>{comment.text}</p>
                <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#8f8f8f" }}>
                  {formatRelativeTime(comment.createdAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {errorText && (
        <p style={{ marginTop: 0, marginBottom: "8px", color: "#ff8f8f", fontSize: "12px" }}>{errorText}</p>
      )}

      <label style={{ display: "block", marginBottom: "8px" }}>
        <span style={{ display: "block", marginBottom: "6px", fontSize: "12px", opacity: 0.85 }}>
          Kommentar schreiben
        </span>
        <textarea
          value={commentText}
          onChange={(event) => onCommentTextChange(event.target.value)}
          rows={2}
          maxLength={300}
          placeholder="Schreibe einen Kommentar..."
          style={{
            width: "100%",
            boxSizing: "border-box",
            background: "#101010",
            border: "1px solid #2d2d2d",
            borderRadius: "8px",
            color: "#fff",
            padding: "8px 10px",
            resize: "vertical",
          }}
        />
      </label>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" }}>
        <span style={{ fontSize: "11px", color: currentLength > 300 ? "#ff8f8f" : "#8f8f8f" }}>{currentLength}/300</span>
        <button
          type="button"
          onClick={onSubmitComment}
          disabled={!canSubmit}
          style={{
            ...styles.iconBtn,
            border: "1px solid #2e2e2e",
            borderRadius: "999px",
            padding: "6px 12px",
            fontSize: "12px",
            opacity: canSubmit ? 1 : 0.55,
            cursor: canSubmit ? "pointer" : "not-allowed",
          }}
        >
          {isSubmitting ? "Senden..." : "Senden"}
        </button>
      </div>
    </div>
  );
}

const Post = React.memo(function Post({
  post,
  onOpenProfile,
  liked,
  onToggleLike,
  postRef,
  isHighlighted,
  comments,
  commentCount,
  isCommentsOpen,
  onToggleComments,
  commentText,
  onCommentTextChange,
  onSubmitComment,
  isCommentsLoading,
  isCommentSubmitting,
  commentErrorText,
}) {
  const commentsAriaLabel = isHighlighted
    ? `${isCommentsOpen ? "Kommentare ausblenden" : "Kommentare anzeigen"} (Ausgewahlter Beitrag)`
    : isCommentsOpen
      ? "Kommentare ausblenden"
      : "Kommentare anzeigen";

  return (
    <article
      ref={postRef}
      data-testid={`post-${post.id}`}
      style={{
        ...styles.card,
        border: isHighlighted ? "1px solid #4a7dff" : styles.card.border,
        boxShadow: isHighlighted ? "0 0 0 1px rgba(74, 125, 255, 0.35)" : "none",
      }}
    >
      <button
        type="button"
        onClick={() => onOpenProfile(post)}
        style={{
          ...styles.iconBtn,
          width: "100%",
          textAlign: "left",
          padding: "12px 14px",
          fontWeight: 700,
        }}
      >
        {post.user}
      </button>

      <div style={styles.imageGrid}>
        {post.images.map((image, index) => (
          <SafeImage
            key={`${post.id}-${index}`}
            src={image}
            alt={`Artwork ${index + 1} von ${post.user}`}
            onDoubleClick={() => onToggleLike(post.id)}
            style={styles.image}
          />
        ))}
      </div>

      <div style={{ display: "flex", gap: "16px", padding: "10px 14px" }}>
        <button type="button" onClick={() => onToggleLike(post.id)} style={styles.iconBtn} aria-label="Like umschalten">
          <HeartIcon active={liked} />
        </button>
        <button
          type="button"
          onClick={() => onToggleComments(post.id)}
          style={styles.iconBtn}
          aria-label={commentsAriaLabel}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <CommentIcon />
            <span style={{ fontSize: "12px", fontWeight: 700 }}>{commentCount}</span>
          </span>
        </button>
      </div>

      {isCommentsOpen && (
        <CommentPanel
          comments={comments}
          isLoading={isCommentsLoading}
          errorText={commentErrorText}
          commentText={commentText}
          onCommentTextChange={(value) => onCommentTextChange(post.id, value)}
          onSubmitComment={() => onSubmitComment(post.id)}
          isSubmitting={isCommentSubmitting}
        />
      )}
    </article>
  );
});

Post.displayName = "Post";

function Profile({ data, onBack, isOwnProfile, onSaveProfile, onChangePassword }) {
  const [displayName, setDisplayName] = useState(data?.user || "");
  const [bio, setBio] = useState(data?.bio || "");
  const [avatar, setAvatar] = useState(data?.avatar || "");
  const [successText, setSuccessText] = useState("");
  const [profileErrorText, setProfileErrorText] = useState("");
  const [avatarFileError, setAvatarFileError] = useState("");
  const [avatarFileName, setAvatarFileName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordErrorText, setPasswordErrorText] = useState("");
  const [passwordSuccessText, setPasswordSuccessText] = useState("");

  useEffect(() => {
    setDisplayName(data?.user || "");
    setBio(data?.bio || "");
    setAvatar(data?.avatar || "");
    setSuccessText("");
    setProfileErrorText("");
    setAvatarFileError("");
    setAvatarFileName("");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setPasswordErrorText("");
    setPasswordSuccessText("");
  }, [data]);

  const passwordStrength = useMemo(() => {
    const value = newPassword.trim();
    if (!value) {
      return { label: "Keine Eingabe", color: "#8f8f8f" };
    }

    let score = 0;
    if (value.length >= 8) {
      score += 1;
    }
    if (/[A-Z]/.test(value)) {
      score += 1;
    }
    if (/[a-z]/.test(value)) {
      score += 1;
    }
    if (/[0-9]/.test(value)) {
      score += 1;
    }
    if (/[^A-Za-z0-9]/.test(value)) {
      score += 1;
    }

    if (value.length < 6 || score <= 1) {
      return { label: "Schwach", color: "#ff8f8f" };
    }
    if (score <= 3) {
      return { label: "Mittel", color: "#ffd479" };
    }
    return { label: "Stark", color: "#9aff9a" };
  }, [newPassword]);

  if (!data) {
    return (
      <div style={{ padding: "20px" }}>
        <p>Kein Profil ausgewaehlt.</p>
      </div>
    );
  }

  const canSaveOwnProfile = displayName.trim().length >= 2;
  const canChangePassword =
    currentPassword.trim().length > 0 && newPassword.trim().length > 0 && confirmPassword.trim().length > 0;

  return (
    <section>
      <div style={{ padding: "12px 16px" }}>
        <button type="button" onClick={onBack} style={styles.iconBtn}>
          ← Zurueck
        </button>
      </div>

      <div style={{ padding: "0 20px 20px" }}>
        <SafeImage
          src={data.avatar}
          alt={`${data.user} Avatar`}
          style={{ width: 70, height: 70, borderRadius: "50%", objectFit: "cover", background: "#111" }}
        />
        <h2>{data.user}</h2>
        <p style={{ opacity: 0.7 }}>{data.bio}</p>
      </div>

      {isOwnProfile && (
        <div
          style={{
            margin: "0 20px 20px",
            padding: "14px",
            border: "1px solid #272727",
            borderRadius: "10px",
            background: "#0d0d0d",
          }}
        >
          <h3 style={{ marginTop: 0 }}>Profil bearbeiten</h3>
          <label style={{ display: "block", marginBottom: "10px" }}>
            <span style={{ display: "block", marginBottom: "6px", fontSize: "13px" }}>Anzeigename</span>
            <input
              value={displayName}
              onChange={(event) => {
                setDisplayName(event.target.value);
                if (successText) {
                  setSuccessText("");
                }
              }}
              style={{
                width: "100%",
                boxSizing: "border-box",
                background: "#101010",
                border: "1px solid #2d2d2d",
                borderRadius: "8px",
                color: "#fff",
                padding: "10px",
              }}
            />
          </label>

          <label style={{ display: "block", marginBottom: "10px" }}>
            <span style={{ display: "block", marginBottom: "6px", fontSize: "13px" }}>Bio</span>
            <textarea
              value={bio}
              onChange={(event) => {
                setBio(event.target.value);
                if (successText) {
                  setSuccessText("");
                }
              }}
              rows={3}
              style={{
                width: "100%",
                boxSizing: "border-box",
                background: "#101010",
                border: "1px solid #2d2d2d",
                borderRadius: "8px",
                color: "#fff",
                padding: "10px",
                resize: "vertical",
              }}
            />
          </label>

          <label style={{ display: "block", marginBottom: "10px" }}>
            <span style={{ display: "block", marginBottom: "6px", fontSize: "13px" }}>Avatar URL (optional)</span>
            <input
              value={avatar}
              onChange={(event) => {
                setAvatar(event.target.value);
                if (successText) {
                  setSuccessText("");
                }
                if (profileErrorText) {
                  setProfileErrorText("");
                }
                if (avatarFileError) {
                  setAvatarFileError("");
                }
              }}
              placeholder="https://..."
              style={{
                width: "100%",
                boxSizing: "border-box",
                background: "#101010",
                border: "1px solid #2d2d2d",
                borderRadius: "8px",
                color: "#fff",
                padding: "10px",
              }}
            />
          </label>
          <label style={{ display: "block", marginBottom: "10px" }}>
            <span style={{ display: "block", marginBottom: "6px", fontSize: "13px" }}>Profilbild Datei</span>
            <input
              type="file"
              accept="image/*"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) {
                  return;
                }

                setAvatarFileError("");
                setProfileErrorText("");
                setSuccessText("");

                if (!file.type.startsWith("image/")) {
                  setAvatarFileError("Bitte nur Bilddateien auswaehlen.");
                  event.target.value = "";
                  return;
                }

                if (file.size > 2 * 1024 * 1024) {
                  setAvatarFileError("Datei ist zu gross. Maximal 2 MB erlaubt.");
                  event.target.value = "";
                  return;
                }

                try {
                  const dataUrl = await readFileAsDataUrl(file);
                  setAvatar(dataUrl);
                  setAvatarFileName(file.name);
                } catch (error) {
                  setAvatarFileError("Datei konnte nicht gelesen werden.");
                } finally {
                  event.target.value = "";
                }
              }}
              style={{
                width: "100%",
                boxSizing: "border-box",
                background: "#101010",
                border: "1px solid #2d2d2d",
                borderRadius: "8px",
                color: "#fff",
                padding: "10px",
              }}
            />
          </label>
          {avatarFileName && <p style={{ marginTop: "-2px", color: "#bfbfbf", fontSize: "12px" }}>Ausgewaehlt: {avatarFileName}</p>}
          {avatarFileError && <p style={{ color: "#ff8f8f", marginTop: "-2px" }}>{avatarFileError}</p>}

          <button
            type="button"
            onClick={async () => {
              if (!canSaveOwnProfile) {
                return;
              }

              const nextName = displayName.trim();
              const nextBio = bio.trim();
              const nextAvatar = avatar.trim() || createAvatarFromName(nextName);
              const error = await onSaveProfile({
                displayName: nextName,
                bio: nextBio,
                avatar: nextAvatar,
              });
              if (error) {
                setProfileErrorText(error);
                setSuccessText("");
                return;
              }
              setProfileErrorText("");
              setSuccessText("Profil gespeichert.");
            }}
            disabled={!canSaveOwnProfile}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "8px",
              border: "none",
              background: canSaveOwnProfile ? "#fff" : "#666",
              color: "#000",
              cursor: canSaveOwnProfile ? "pointer" : "not-allowed",
              fontWeight: 700,
            }}
          >
            Aenderungen speichern
          </button>
          {profileErrorText && <p style={{ color: "#ff8f8f", marginBottom: 0 }}>{profileErrorText}</p>}
          {successText && <p style={{ color: "#9aff9a", marginBottom: 0 }}>{successText}</p>}

          <hr style={{ borderColor: "#242424", margin: "16px 0" }} />

          <h4 style={{ marginTop: 0, marginBottom: "10px" }}>Passwort aendern</h4>
          <label style={{ display: "block", marginBottom: "10px" }}>
            <span style={{ display: "block", marginBottom: "6px", fontSize: "13px" }}>Aktuelles Passwort</span>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                type={showCurrentPassword ? "text" : "password"}
                placeholder="Aktuelles Passwort"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(event) => {
                  setCurrentPassword(event.target.value);
                  if (passwordErrorText) {
                    setPasswordErrorText("");
                  }
                  if (passwordSuccessText) {
                    setPasswordSuccessText("");
                  }
                }}
                style={{
                  flex: 1,
                  width: "100%",
                  boxSizing: "border-box",
                  background: "#101010",
                  border: "1px solid #2d2d2d",
                  borderRadius: "8px",
                  color: "#fff",
                  padding: "10px",
                }}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword((previous) => !previous)}
                style={{
                  ...styles.iconBtn,
                  fontSize: "12px",
                  border: "1px solid #2d2d2d",
                  borderRadius: "8px",
                  padding: "0 10px",
                  minWidth: "86px",
                }}
              >
                {showCurrentPassword ? "Verbergen" : "Anzeigen"}
              </button>
            </div>
          </label>

          <label style={{ display: "block", marginBottom: "10px" }}>
            <span style={{ display: "block", marginBottom: "6px", fontSize: "13px" }}>Neues Passwort</span>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                type={showNewPassword ? "text" : "password"}
                placeholder="Neues Passwort"
                autoComplete="new-password"
                value={newPassword}
                onChange={(event) => {
                  setNewPassword(event.target.value);
                  if (passwordErrorText) {
                    setPasswordErrorText("");
                  }
                  if (passwordSuccessText) {
                    setPasswordSuccessText("");
                  }
                }}
                style={{
                  flex: 1,
                  width: "100%",
                  boxSizing: "border-box",
                  background: "#101010",
                  border: "1px solid #2d2d2d",
                  borderRadius: "8px",
                  color: "#fff",
                  padding: "10px",
                }}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword((previous) => !previous)}
                style={{
                  ...styles.iconBtn,
                  fontSize: "12px",
                  border: "1px solid #2d2d2d",
                  borderRadius: "8px",
                  padding: "0 10px",
                  minWidth: "86px",
                }}
              >
                {showNewPassword ? "Verbergen" : "Anzeigen"}
              </button>
            </div>
          </label>
          <p style={{ marginTop: "-4px", marginBottom: "12px", color: passwordStrength.color, fontSize: "12px" }}>
            Passwortstaerke: {passwordStrength.label}
          </p>

          <label style={{ display: "block", marginBottom: "10px" }}>
            <span style={{ display: "block", marginBottom: "6px", fontSize: "13px" }}>Neues Passwort bestaetigen</span>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Neues Passwort bestaetigen"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => {
                  setConfirmPassword(event.target.value);
                  if (passwordErrorText) {
                    setPasswordErrorText("");
                  }
                  if (passwordSuccessText) {
                    setPasswordSuccessText("");
                  }
                }}
                style={{
                  flex: 1,
                  width: "100%",
                  boxSizing: "border-box",
                  background: "#101010",
                  border: "1px solid #2d2d2d",
                  borderRadius: "8px",
                  color: "#fff",
                  padding: "10px",
                }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((previous) => !previous)}
                style={{
                  ...styles.iconBtn,
                  fontSize: "12px",
                  border: "1px solid #2d2d2d",
                  borderRadius: "8px",
                  padding: "0 10px",
                  minWidth: "86px",
                }}
              >
                {showConfirmPassword ? "Verbergen" : "Anzeigen"}
              </button>
            </div>
          </label>

          <button
            type="button"
            onClick={async () => {
              const error = await onChangePassword({
                currentPassword,
                newPassword,
                confirmPassword,
              });
              if (error) {
                setPasswordErrorText(error);
                setPasswordSuccessText("");
                return;
              }
              setPasswordErrorText("");
              setPasswordSuccessText("Passwort wurde aktualisiert.");
              setCurrentPassword("");
              setNewPassword("");
              setConfirmPassword("");
            }}
            disabled={!canChangePassword}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "8px",
              border: "none",
              background: canChangePassword ? "#fff" : "#666",
              color: "#000",
              cursor: canChangePassword ? "pointer" : "not-allowed",
              fontWeight: 700,
            }}
          >
            Passwort aktualisieren
          </button>
          {passwordErrorText && <p style={{ color: "#ff8f8f", marginBottom: 0 }}>{passwordErrorText}</p>}
          {passwordSuccessText && <p style={{ color: "#9aff9a", marginBottom: 0 }}>{passwordSuccessText}</p>}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px", padding: "0 20px 20px" }}>
        {data.images.length === 0 ? (
          <div style={{ border: "1px dashed #2d2d2d", borderRadius: "8px", padding: "16px", color: "#b7b7b7" }}>
            Noch keine hochgeladenen Bilder.
          </div>
        ) : (
          data.images.map((image, index) => (
            <SafeImage
              key={`${data.id}-profile-${index}`}
              src={image}
              alt={`Profilbild ${index + 1}`}
              style={{ width: "100%", height: 180, objectFit: "cover", background: "#161616" }}
            />
          ))
        )}
      </div>
    </section>
  );
}

function Upload({ onBack, onPost, currentUser, draftImageUrl, onDraftImageUrlChange }) {
  const [imageUrl, setImageUrl] = useState(() => String(draftImageUrl || ""));
  const [errorText, setErrorText] = useState("");

  const canPost = imageUrl.trim().length > 0;

  useEffect(() => {
    setImageUrl(String(draftImageUrl || ""));
  }, [draftImageUrl]);

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

    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      setErrorText("Nur http/https URLs sind erlaubt.");
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
    setImageUrl("");
    onDraftImageUrlChange("");
    onBack();
  };

  return (
    <section style={{ padding: "20px" }}>
      <button type="button" onClick={onBack} style={styles.iconBtn}>
        ← Zurueck
      </button>
      <h2 style={{ marginTop: "20px" }}>Upload</h2>
      <input
        type="url"
        placeholder="Bild-URL einfuegen"
        value={imageUrl}
        onChange={(event) => {
          const nextValue = event.target.value;
          setImageUrl(nextValue);
          onDraftImageUrlChange(nextValue);
          if (errorText) {
            setErrorText("");
          }
        }}
        style={{
          width: "100%",
          padding: "12px",
          marginTop: "12px",
          background: "#111",
          border: "1px solid #333",
          color: "#fff",
          borderRadius: "8px",
          boxSizing: "border-box",
        }}
      />
      {errorText && <p style={{ marginTop: "10px", color: "#ff7d7d", fontSize: "13px" }}>{errorText}</p>}

      <button
        type="button"
        onClick={() => {
          const demoUrl = "https://picsum.photos/seed/upload-demo/900/600";
          setImageUrl(demoUrl);
          onDraftImageUrlChange(demoUrl);
        }}
        style={{
          ...styles.iconBtn,
          marginTop: "8px",
          fontSize: "13px",
          textDecoration: "underline",
        }}
      >
        Demo-Bild einsetzen
      </button>

      <button
        type="button"
        onClick={submitPost}
        disabled={!canPost}
        style={{
          marginTop: "14px",
          padding: "12px",
          width: "100%",
          background: canPost ? "#fff" : "#5f5f5f",
          color: "#000",
          border: "none",
          borderRadius: "8px",
          cursor: canPost ? "pointer" : "not-allowed",
          fontWeight: 700,
        }}
      >
        Posten
      </button>
    </section>
  );
}

function createOwnProfile(currentUser, posts) {
  const ownImages = posts
    .filter((post) => post.ownerId === currentUser.id)
    .flatMap((post) => post.images)
    .slice(0, 20);

  return {
    id: currentUser.id,
    user: currentUser.displayName,
    ownerId: currentUser.id,
    bio: currentUser.bio,
    avatar: currentUser.avatar,
    images: ownImages,
    isOwnProfile: true,
  };
}

function AppContent({ currentUser, onLogout, onUpdateProfile, onChangePassword, apiClient }) {
  const [current, setCurrent] = useState("feed");
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [likes, setLikes] = useState({});
  const [posts, setPosts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [isNotificationsLoading, setIsNotificationsLoading] = useState(false);
  const [notificationsErrorText, setNotificationsErrorText] = useState("");
  const [showUndoMarkAll, setShowUndoMarkAll] = useState(false);
  const [commentsByPostId, setCommentsByPostId] = useState({});
  const [commentsLoadingByPostId, setCommentsLoadingByPostId] = useState({});
  const [commentSubmittingByPostId, setCommentSubmittingByPostId] = useState({});
  const [commentErrorByPostId, setCommentErrorByPostId] = useState({});
  const [commentInputByPostId, setCommentInputByPostId] = useState({});
  const [expandedCommentsPostId, setExpandedCommentsPostId] = useState(null);
  const [highlightedPostId, setHighlightedPostId] = useState(null);
  const [searchQuery, setSearchQuery] = useState(() => readStorage(STORAGE_FEED_SEARCH_KEY, ""));
  const [feedMode, setFeedMode] = useState(() => {
    const savedMode = readStorage(STORAGE_FEED_MODE_KEY, "all");
    return savedMode === "liked" ? "liked" : "all";
  });
  const [sortOrder, setSortOrder] = useState(() => {
    const savedSort = readStorage(STORAGE_FEED_SORT_KEY, "newest");
    return savedSort === "oldest" ? "oldest" : "newest";
  });
  const [lastFeedLoadedAt, setLastFeedLoadedAt] = useState(null);
  const [feedErrorText, setFeedErrorText] = useState("");
  const [isFeedLoading, setIsFeedLoading] = useState(true);
  const [uploadDraftImageUrl, setUploadDraftImageUrl] = useState(() => readStorage(STORAGE_UPLOAD_DRAFT_KEY, ""));
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const likesRef = useRef(likes);
  const commentsByPostIdRef = useRef(commentsByPostId);
  const expandedCommentsPostIdRef = useRef(expandedCommentsPostId);
  const commentInputByPostIdRef = useRef(commentInputByPostId);
  const commentErrorByPostIdRef = useRef(commentErrorByPostId);
  const pendingMarkAllUndoRef = useRef(null);
  const pendingMarkAllTimerRef = useRef(null);

  useEffect(() => {
    writeStorage(STORAGE_FEED_SEARCH_KEY, searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    writeStorage(STORAGE_FEED_MODE_KEY, feedMode);
  }, [feedMode]);

  useEffect(() => {
    writeStorage(STORAGE_FEED_SORT_KEY, sortOrder);
  }, [sortOrder]);

  useEffect(() => {
    const savedCommentDrafts = readStorage(STORAGE_COMMENT_DRAFTS_KEY, {});
    if (savedCommentDrafts && typeof savedCommentDrafts === "object" && !Array.isArray(savedCommentDrafts)) {
      setCommentInputByPostId(savedCommentDrafts);
      commentInputByPostIdRef.current = savedCommentDrafts;
    }
  }, []);

  useEffect(() => {
    writeStorage(STORAGE_COMMENT_DRAFTS_KEY, commentInputByPostId);
  }, [commentInputByPostId]);

  useEffect(() => {
    writeStorage(STORAGE_UPLOAD_DRAFT_KEY, uploadDraftImageUrl);
  }, [uploadDraftImageUrl]);

  useEffect(() => {
    likesRef.current = likes;
  }, [likes]);

  useEffect(() => {
    commentsByPostIdRef.current = commentsByPostId;
  }, [commentsByPostId]);

  useEffect(() => {
    expandedCommentsPostIdRef.current = expandedCommentsPostId;
  }, [expandedCommentsPostId]);

  useEffect(() => {
    commentInputByPostIdRef.current = commentInputByPostId;
  }, [commentInputByPostId]);

  useEffect(() => {
    commentErrorByPostIdRef.current = commentErrorByPostId;
  }, [commentErrorByPostId]);

  useEffect(
    () => () => {
      if (pendingMarkAllTimerRef.current !== null) {
        window.clearTimeout(pendingMarkAllTimerRef.current);
        pendingMarkAllTimerRef.current = null;
      }
    },
    [],
  );

  const loadFeed = useCallback(async () => {
    setIsFeedLoading(true);
    setFeedErrorText("");
    try {
      const feedResponse = await apiClient.getFeed();
      setPosts(Array.isArray(feedResponse.posts) ? feedResponse.posts : []);
      const nextLikes = feedResponse.likes || {};
      setLikes(nextLikes);
      likesRef.current = nextLikes;
      setLastFeedLoadedAt(Date.now());
    } catch (error) {
      setFeedErrorText(error.message || "Feed konnte nicht geladen werden.");
      setPosts([]);
      setLikes({});
      likesRef.current = {};
    } finally {
      setIsFeedLoading(false);
    }
  }, [apiClient]);

  const loadNotifications = useCallback(async () => {
    setIsNotificationsLoading(true);
    setNotificationsErrorText("");
    try {
      const response = await apiClient.getNotifications();
      const list = Array.isArray(response.notifications) ? response.notifications : [];
      setNotifications(list);
      if (typeof response.unreadCount === "number" && Number.isFinite(response.unreadCount)) {
        setUnreadNotificationsCount(Math.max(0, Number(response.unreadCount)));
      } else {
        setUnreadNotificationsCount(list.filter((notification) => !notification.read).length);
      }
    } catch (error) {
      setNotificationsErrorText(error.message || "Aktivitaet konnte nicht geladen werden.");
      setNotifications([]);
      setUnreadNotificationsCount(0);
    } finally {
      setIsNotificationsLoading(false);
    }
  }, [apiClient]);

  const ownProfile = useMemo(() => createOwnProfile(currentUser, posts), [currentUser, posts]);
  const activeProfile = selectedProfile && !selectedProfile.isOwnProfile ? selectedProfile : ownProfile;

  const openProfile = useCallback((post) => {
    const profileData = {
      ...post,
      isOwnProfile: post.ownerId === currentUser.id,
    };
    setSelectedProfile(profileData);
    setCurrent("profile");
  }, [currentUser.id]);

  const openOwnProfile = useCallback(() => {
    setSelectedProfile(ownProfile);
    setCurrent("profile");
  }, [ownProfile]);

  const handleShortcutKeyDown = useCallback(
    (event) => {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }
      if (isEditableTarget(event.target)) {
        return;
      }
      const key = String(event.key || "").toLowerCase();
      if (!key) {
        return;
      }

      if (key === "g") {
        event.preventDefault();
        setCurrent("feed");
        setSelectedProfile(null);
        return;
      }
      if (key === "u") {
        event.preventDefault();
        setCurrent("upload");
        setSelectedProfile(null);
        return;
      }
      if (key === "a") {
        event.preventDefault();
        setCurrent("activity");
        setSelectedProfile(null);
        loadNotifications();
        return;
      }
      if (key === "p") {
        event.preventDefault();
        openOwnProfile();
        return;
      }
      if (key === "r") {
        event.preventDefault();
        if (current === "activity") {
          loadNotifications();
        } else if (current === "feed") {
          loadFeed();
        }
      }
    },
    [current, loadFeed, loadNotifications, openOwnProfile],
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }
    window.addEventListener("keydown", handleShortcutKeyDown);
    return () => {
      window.removeEventListener("keydown", handleShortcutKeyDown);
    };
  }, [handleShortcutKeyDown]);

  const toggleLike = useCallback(async (postId) => {
    const previousLikes = likesRef.current;
    const previousValue = Boolean(previousLikes[postId]);
    const optimisticLikes = { ...previousLikes };
    if (previousValue) {
      delete optimisticLikes[postId];
    } else {
      optimisticLikes[postId] = true;
    }
    setLikes(optimisticLikes);
    likesRef.current = optimisticLikes;
    setFeedErrorText("");
    try {
      const response = await apiClient.toggleLike(postId, !previousValue);
      if (typeof response?.liked === "boolean") {
        setLikes((previous) => {
          const nextLikes = { ...previous };
          if (response.liked) {
            nextLikes[postId] = true;
          } else {
            delete nextLikes[postId];
          }
          likesRef.current = nextLikes;
          return nextLikes;
        });
      }
    } catch (error) {
      setLikes(previousLikes);
      likesRef.current = previousLikes;
      setFeedErrorText(error.message || "Like konnte nicht gespeichert werden.");
    }
  }, [apiClient]);

  const loadCommentsForPost = useCallback(async (postId) => {
    setCommentsLoadingByPostId((previous) => ({ ...previous, [postId]: true }));
    setCommentErrorByPostId((previous) => ({ ...previous, [postId]: "" }));
    try {
      const response = await apiClient.getComments(postId);
      setCommentsByPostId((previous) => ({
        ...previous,
        [postId]: Array.isArray(response.comments) ? response.comments : [],
      }));
    } catch (error) {
      setCommentErrorByPostId((previous) => ({
        ...previous,
        [postId]: error.message || "Kommentare konnten nicht geladen werden.",
      }));
    } finally {
      setCommentsLoadingByPostId((previous) => ({ ...previous, [postId]: false }));
    }
  }, [apiClient]);

  const openCommentsForPost = useCallback(async (postId) => {
    if (expandedCommentsPostIdRef.current === postId) {
      setExpandedCommentsPostId(null);
      expandedCommentsPostIdRef.current = null;
      return;
    }
    setExpandedCommentsPostId(postId);
    expandedCommentsPostIdRef.current = postId;

    if (Array.isArray(commentsByPostIdRef.current[postId])) {
      return;
    }
    await loadCommentsForPost(postId);
  }, [loadCommentsForPost]);

  const submitComment = useCallback(async (postId) => {
    const rawText = commentInputByPostIdRef.current[postId] || "";
    const text = rawText.trim();
    if (!text) {
      setCommentErrorByPostId((previous) => ({
        ...previous,
        [postId]: "Kommentar darf nicht leer sein.",
      }));
      return;
    }
    if (text.length > 300) {
      setCommentErrorByPostId((previous) => ({
        ...previous,
        [postId]: "Kommentar darf maximal 300 Zeichen haben.",
      }));
      return;
    }

    setCommentSubmittingByPostId((previous) => ({ ...previous, [postId]: true }));
    setCommentErrorByPostId((previous) => ({ ...previous, [postId]: "" }));

    try {
      const response = await apiClient.createComment(postId, { text });
      if (response?.comment) {
        setCommentsByPostId((previous) => {
          const nextCommentsByPostId = {
            ...previous,
            [postId]: [...(previous[postId] || []), response.comment],
          };
          commentsByPostIdRef.current = nextCommentsByPostId;
          return nextCommentsByPostId;
        });
      }
      setCommentInputByPostId((previous) => {
        const nextInputByPostId = { ...previous };
        delete nextInputByPostId[postId];
        commentInputByPostIdRef.current = nextInputByPostId;
        return nextInputByPostId;
      });
    } catch (error) {
      setCommentErrorByPostId((previous) => ({
        ...previous,
        [postId]: error.message || "Kommentar konnte nicht gesendet werden.",
      }));
    } finally {
      setCommentSubmittingByPostId((previous) => ({ ...previous, [postId]: false }));
    }
  }, [apiClient]);

  const markAllNotificationsRead = async () => {
    if (pendingMarkAllTimerRef.current !== null) {
      window.clearTimeout(pendingMarkAllTimerRef.current);
      pendingMarkAllTimerRef.current = null;
    }
    if (unreadNotificationsCount <= 0) {
      return;
    }
    const previousNotifications = notifications;
    const previousUnreadCount = unreadNotificationsCount;
    const snapshot = {
      notifications: previousNotifications,
      unreadCount: previousUnreadCount,
    };
    pendingMarkAllUndoRef.current = snapshot;
    setNotifications((previous) => previous.map((notification) => ({ ...notification, read: true })));
    setUnreadNotificationsCount(0);
    setNotificationsErrorText("");
    setShowUndoMarkAll(true);
    pendingMarkAllTimerRef.current = window.setTimeout(async () => {
      pendingMarkAllTimerRef.current = null;
      setShowUndoMarkAll(false);
      pendingMarkAllUndoRef.current = null;
      try {
        await apiClient.markAllNotificationsRead();
      } catch (error) {
        setNotifications(snapshot.notifications);
        setUnreadNotificationsCount(snapshot.unreadCount);
        setNotificationsErrorText(error.message || "Benachrichtigungen konnten nicht aktualisiert werden.");
      }
    }, MARK_ALL_UNDO_WINDOW_MS);
  };

  const undoMarkAllNotificationsRead = useCallback(() => {
    const snapshot = pendingMarkAllUndoRef.current;
    if (!snapshot) {
      return;
    }
    if (pendingMarkAllTimerRef.current !== null) {
      window.clearTimeout(pendingMarkAllTimerRef.current);
      pendingMarkAllTimerRef.current = null;
    }
    pendingMarkAllUndoRef.current = null;
    setShowUndoMarkAll(false);
    setNotifications(snapshot.notifications);
    setUnreadNotificationsCount(snapshot.unreadCount);
    setNotificationsErrorText("");
  }, []);

  const markNotificationRead = async (notificationId) => {
    const previousNotifications = notifications;
    const previousUnreadCount = unreadNotificationsCount;
    const optimisticNotifications = previousNotifications.map((notification) =>
      notification.id === notificationId ? { ...notification, read: true } : notification,
    );
    setNotifications(optimisticNotifications);
    setUnreadNotificationsCount(optimisticNotifications.filter((notification) => !notification.read).length);
    setNotificationsErrorText("");
    try {
      await apiClient.markNotificationRead(notificationId);
    } catch (error) {
      setNotifications(previousNotifications);
      setUnreadNotificationsCount(previousUnreadCount);
      setNotificationsErrorText(error.message || "Benachrichtigung konnte nicht aktualisiert werden.");
    }
  };

  const openPostFromNotification = async (notification) => {
    const targetPostId = Number(notification?.postId);
    if (!Number.isFinite(targetPostId)) {
      return;
    }

    setCurrent("feed");
    setSearchQuery("");
    setFeedMode("all");
    setSortOrder("newest");
    setFeedErrorText("");
    setHighlightedPostId(targetPostId);

    if (notification?.id && !notification.read) {
      await markNotificationRead(notification.id);
    }
  };

  useEffect(() => {
    loadFeed();
    loadNotifications();
  }, [loadFeed, loadNotifications, currentUser.id]);

  const visiblePosts = useMemo(() => {
    const normalizedQuery = deferredSearchQuery.trim().toLowerCase();
    let nextPosts = [...posts];

    if (normalizedQuery) {
      nextPosts = nextPosts.filter((post) => {
        const byUser = post.user.toLowerCase().includes(normalizedQuery);
        const byBio = post.bio.toLowerCase().includes(normalizedQuery);
        return byUser || byBio;
      });
    }

    if (feedMode === "liked") {
      nextPosts = nextPosts.filter((post) => Boolean(likes[post.id]));
    }

    nextPosts.sort((first, second) => {
      const firstId = Number(first.id) || 0;
      const secondId = Number(second.id) || 0;
      return sortOrder === "newest" ? secondId - firstId : firstId - secondId;
    });

    return nextPosts;
  }, [posts, likes, deferredSearchQuery, feedMode, sortOrder]);

  const handleToggleComments = useCallback(
    (postId) => {
      openCommentsForPost(postId);
    },
    [openCommentsForPost],
  );

  const handleCommentTextChange = useCallback((postId, value) => {
    setCommentInputByPostId((previous) => {
      const nextInputByPostId = { ...previous, [postId]: value };
      commentInputByPostIdRef.current = nextInputByPostId;
      return nextInputByPostId;
    });
    if (commentErrorByPostIdRef.current[postId]) {
      setCommentErrorByPostId((previous) => {
        const nextErrorByPostId = { ...previous, [postId]: "" };
        commentErrorByPostIdRef.current = nextErrorByPostId;
        return nextErrorByPostId;
      });
    }
  }, []);

  const handleSubmitComment = useCallback(
    (postId) => {
      submitComment(postId);
    },
    [submitComment],
  );

  const handleResetFilters = useCallback(() => {
    setSearchQuery("");
    setFeedMode("all");
    setSortOrder("newest");
  }, []);

  useEffect(() => {
    if (current !== "feed" || highlightedPostId === null) {
      return undefined;
    }

    const scrollTimer = window.setTimeout(() => {
      const targetPost = document.querySelector(`[data-testid="post-${highlightedPostId}"]`);
      if (targetPost && typeof targetPost.scrollIntoView === "function") {
        targetPost.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 60);
    const clearTimer = window.setTimeout(() => {
      setHighlightedPostId(null);
    }, 2600);

    return () => {
      window.clearTimeout(scrollTimer);
      window.clearTimeout(clearTimer);
    };
  }, [current, highlightedPostId, visiblePosts.length]);

  return (
    <div style={styles.app}>
      <Header title="KUNST" currentUser={currentUser} onLogout={onLogout} />

      {current === "feed" && (
        <main style={{ maxWidth: 640, margin: "0 auto", padding: "14px" }}>
          <FeedToolbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            feedMode={feedMode}
            setFeedMode={setFeedMode}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
            onRefresh={loadFeed}
            isRefreshing={isFeedLoading}
            lastUpdatedAt={lastFeedLoadedAt}
            onResetFilters={handleResetFilters}
          />

          {feedErrorText && (
            <div
              style={{
                border: "1px dashed #5b2323",
                borderRadius: "10px",
                padding: "18px",
                color: "#ffb9b9",
                marginBottom: "12px",
              }}
            >
              {feedErrorText}
            </div>
          )}

          {isFeedLoading ? (
            <div
              style={{
                border: "1px dashed #303030",
                borderRadius: "10px",
                padding: "18px",
                color: "#b7b7b7",
              }}
            >
              Feed wird geladen...
            </div>
          ) : visiblePosts.length === 0 ? (
            <div
              style={{
                border: "1px dashed #303030",
                borderRadius: "10px",
                padding: "18px",
                color: "#b7b7b7",
              }}
            >
              Keine Inhalte fuer diesen Filter gefunden.
            </div>
          ) : (
            visiblePosts.map((post) => (
              <Post
                key={post.id}
                post={post}
                onOpenProfile={openProfile}
                liked={Boolean(likes[post.id])}
                onToggleLike={toggleLike}
                isHighlighted={Number(post.id) === Number(highlightedPostId)}
                comments={commentsByPostId[post.id] || EMPTY_COMMENTS}
                commentCount={Array.isArray(commentsByPostId[post.id]) ? commentsByPostId[post.id].length : Number(post.commentCount) || 0}
                isCommentsOpen={expandedCommentsPostId === post.id}
                onToggleComments={handleToggleComments}
                commentText={commentInputByPostId[post.id] || ""}
                onCommentTextChange={handleCommentTextChange}
                onSubmitComment={handleSubmitComment}
                isCommentsLoading={Boolean(commentsLoadingByPostId[post.id])}
                isCommentSubmitting={Boolean(commentSubmittingByPostId[post.id])}
                commentErrorText={commentErrorByPostId[post.id] || ""}
              />
            ))
          )}
        </main>
      )}

      {current === "activity" && (
        <Activity
          notifications={notifications}
          isLoading={isNotificationsLoading}
          errorText={notificationsErrorText}
          onReload={loadNotifications}
          onMarkAllRead={markAllNotificationsRead}
          canMarkAllRead={unreadNotificationsCount > 0}
          showUndoMarkAll={showUndoMarkAll}
          onUndoMarkAll={undoMarkAllNotificationsRead}
          onMarkRead={markNotificationRead}
          onOpenPost={openPostFromNotification}
          onBack={() => setCurrent("feed")}
        />
      )}

      {current === "profile" && (
        <Profile
          data={activeProfile}
          isOwnProfile={Boolean(activeProfile?.isOwnProfile)}
          onSaveProfile={async (profilePatch) => {
            const error = await onUpdateProfile(profilePatch);
            if (error) {
              return error;
            }
            setPosts((previousPosts) =>
              previousPosts.map((post) =>
                post.ownerId === currentUser.id
                  ? {
                      ...post,
                      user: profilePatch.displayName,
                      bio: profilePatch.bio,
                      avatar: profilePatch.avatar,
                    }
                  : post,
              ),
            );
            setSelectedProfile((previousProfile) =>
              previousProfile
                ? {
                    ...previousProfile,
                    user: profilePatch.displayName,
                    bio: profilePatch.bio,
                    avatar: profilePatch.avatar,
                  }
                : previousProfile,
            );
            return "";
          }}
          onChangePassword={onChangePassword}
          onBack={() => {
            setCurrent("feed");
            setSelectedProfile(null);
          }}
        />
      )}

      {current === "upload" && (
        <Upload
          currentUser={currentUser}
          draftImageUrl={uploadDraftImageUrl}
          onDraftImageUrlChange={setUploadDraftImageUrl}
          onBack={() => setCurrent("feed")}
          onPost={async (newPost) => {
            try {
              const response = await apiClient.createPost({
                imageUrl: newPost.images?.[0] || "",
              });
              setPosts((previous) => [response.post, ...previous]);
              await loadFeed();
            } catch (error) {
              setFeedErrorText(error.message || "Post konnte nicht erstellt werden.");
              throw error;
            }
          }}
        />
      )}

      <BottomNav
        current={current}
        setCurrent={(nextTab) => {
          setCurrent(nextTab);
          if (nextTab === "activity") {
            loadNotifications();
          }
          if (nextTab !== "profile") {
            setSelectedProfile(null);
          }
        }}
        onOpenOwnProfile={openOwnProfile}
        unreadNotificationsCount={unreadNotificationsCount}
      />
    </div>
  );
}

export default function App() {
  const [authToken, setAuthToken] = useState(() => readStorage(STORAGE_AUTH_TOKEN_KEY, ""));
  const [currentUser, setCurrentUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const apiClient = useMemo(() => createApiClient(authToken), [authToken]);

  useEffect(() => {
    writeStorage(STORAGE_AUTH_TOKEN_KEY, authToken);
  }, [authToken]);

  useEffect(() => {
    let cancelled = false;

    const loadSession = async () => {
      if (!authToken) {
        if (!cancelled) {
          setCurrentUser(null);
          setAuthReady(true);
        }
        return;
      }

      setAuthReady(false);
      try {
        const response = await apiClient.me();
        if (!cancelled) {
          setCurrentUser(response.user);
        }
      } catch (error) {
        if (!cancelled) {
          setCurrentUser(null);
          setAuthToken("");
        }
      } finally {
        if (!cancelled) {
          setAuthReady(true);
        }
      }
    };

    loadSession();
    return () => {
      cancelled = true;
    };
  }, [authToken, apiClient]);

  const handleLogin = async ({ username, password }) => {
    const normalizedUsername = normalizeUsername(username || "");
    const cleanPassword = (password || "").trim();

    if (!normalizedUsername || !cleanPassword) {
      return "Bitte Username und Passwort eingeben.";
    }

    try {
      const response = await createApiClient().login({
        username: normalizedUsername,
        password: cleanPassword,
      });
      setAuthToken(response.token);
      setCurrentUser(response.user);
      return "";
    } catch (error) {
      return error.message || "Login fehlgeschlagen. Bitte Daten pruefen.";
    }
  };

  const handleRegister = async ({ username, password, displayName, email, marketingConsent }) => {
    const normalizedUsername = normalizeUsername(username || "");
    const cleanPassword = (password || "").trim();
    const cleanDisplayName = (displayName || "").trim() || normalizedUsername;
    const normalizedEmail = String(email || "")
      .trim()
      .toLowerCase();
    const hasMarketingConsent = marketingConsent === true;

    if (!normalizedUsername) {
      return "Bitte einen Username eingeben.";
    }
    if (!normalizedEmail) {
      return "Bitte eine E-Mail-Adresse eingeben.";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return "Bitte eine gueltige E-Mail-Adresse eingeben.";
    }
    if (cleanPassword.length < 6) {
      return "Passwort muss mindestens 6 Zeichen haben.";
    }
    if (!hasMarketingConsent) {
      return "Bitte E-Mail-Verification und Marketing-Einwilligung bestaetigen.";
    }

    try {
      const response = await createApiClient().register({
        username: normalizedUsername,
        email: normalizedEmail,
        marketingOptIn: hasMarketingConsent,
        password: cleanPassword,
        displayName: cleanDisplayName,
      });
      setAuthToken(response.token);
      setCurrentUser(response.user);
      return "";
    } catch (error) {
      return error.message || "Registrierung fehlgeschlagen.";
    }
  };

  const handleProfileUpdate = async ({ displayName, bio, avatar }) => {
    if (!currentUser) {
      return "Du bist nicht eingeloggt.";
    }

    const nextDisplayName = (displayName || "").trim();
    if (nextDisplayName.length < 2) {
      return "Anzeigename muss mindestens 2 Zeichen haben.";
    }

    try {
      const response = await apiClient.updateProfile({
        displayName: nextDisplayName,
        bio: (bio || "").trim(),
        avatar: (avatar || "").trim() || createAvatarFromName(nextDisplayName),
      });
      setCurrentUser(response.user);
      return "";
    } catch (error) {
      return error.message || "Profil konnte nicht aktualisiert werden.";
    }
  };

  const handlePasswordChange = async ({ currentPassword, newPassword, confirmPassword }) => {
    if (!currentUser) {
      return "Du bist nicht eingeloggt.";
    }

    const currentPasswordValue = (currentPassword || "").trim();
    const newPasswordValue = (newPassword || "").trim();
    const confirmPasswordValue = (confirmPassword || "").trim();

    if (!currentPasswordValue || !newPasswordValue || !confirmPasswordValue) {
      return "Bitte alle Passwort-Felder ausfuellen.";
    }
    if (newPasswordValue.length < 6) {
      return "Neues Passwort muss mindestens 6 Zeichen haben.";
    }
    if (newPasswordValue !== confirmPasswordValue) {
      return "Neues Passwort und Bestaetigung stimmen nicht ueberein.";
    }
    if (newPasswordValue === currentPasswordValue) {
      return "Neues Passwort muss sich vom alten unterscheiden.";
    }

    try {
      await apiClient.changePassword({
        currentPassword: currentPasswordValue,
        newPassword: newPasswordValue,
        confirmPassword: confirmPasswordValue,
      });
      return "";
    } catch (error) {
      return error.message || "Passwort konnte nicht aktualisiert werden.";
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setAuthToken("");
  };

  if (!authReady) {
    return (
      <div style={{ minHeight: "100vh", background: "#000", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p>Session wird geladen...</p>
      </div>
    );
  }

  return (
    <AppErrorBoundary>
      {currentUser ? (
        <AppContent
          currentUser={currentUser}
          onLogout={logout}
          onUpdateProfile={handleProfileUpdate}
          onChangePassword={handlePasswordChange}
          apiClient={apiClient}
        />
      ) : (
        <AuthScreen onLogin={handleLogin} onRegister={handleRegister} />
      )}
    </AppErrorBoundary>
  );
}