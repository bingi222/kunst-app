import React, { useEffect, useMemo, useState } from "react";

const AVATAR_BINGI = "https://api.dicebear.com/9.x/initials/svg?seed=Bingi";
const AVATAR_PLUESCH = "https://api.dicebear.com/9.x/initials/svg?seed=Pluesch";
const AVATAR_GIREAM = "https://api.dicebear.com/9.x/initials/svg?seed=Giream";

const initialPosts = [
  {
    id: 1,
    user: "Bingi",
    ownerId: "u-bingi",
    bio: "Digital minimal art",
    avatar: AVATAR_BINGI,
    images: [
      "https://picsum.photos/seed/bingi-1/900/600",
      "https://picsum.photos/seed/bingi-2/900/600",
      "https://picsum.photos/seed/bingi-3/900/600",
    ],
  },
  {
    id: 2,
    user: "Pluesch",
    ownerId: "u-pluesch",
    bio: "Abstract emotions",
    avatar: AVATAR_PLUESCH,
    images: [
      "https://picsum.photos/seed/pluesch-1/900/600",
      "https://picsum.photos/seed/pluesch-2/900/600",
      "https://picsum.photos/seed/pluesch-3/900/600",
    ],
  },
  {
    id: 3,
    user: "Giream",
    ownerId: "u-giream",
    bio: "Visual storytelling",
    avatar: AVATAR_GIREAM,
    images: [
      "https://picsum.photos/seed/giream-1/900/600",
      "https://picsum.photos/seed/giream-2/900/600",
      "https://picsum.photos/seed/giream-3/900/600",
    ],
  },
];

const styles = {
  app: {
    background: "#000",
    color: "#fff",
    minHeight: "100vh",
    paddingBottom: "72px",
  },
  card: {
    marginBottom: "24px",
    border: "1px solid #1f1f1f",
    borderRadius: "12px",
    overflow: "hidden",
    background: "#0b0b0b",
  },
  imageGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "4px",
  },
  image: {
    width: "100%",
    height: "140px",
    objectFit: "cover",
    background: "#161616",
  },
  iconBtn: {
    background: "transparent",
    border: "none",
    color: "#fff",
    cursor: "pointer",
    fontSize: "19px",
    padding: 0,
  },
  nav: {
    position: "fixed",
    left: 0,
    right: 0,
    bottom: 0,
    background: "#000",
    borderTop: "1px solid #1f1f1f",
    display: "flex",
    justifyContent: "space-around",
    padding: "10px 0",
  },
};

const STORAGE_POSTS_KEY = "kunst-app.posts.v1";
const STORAGE_LIKES_KEY = "kunst-app.likes.v1";
const STORAGE_AUTH_TOKEN_KEY = "kunst-app.auth.token.v1";
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:4000";

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
      const message = responseBody?.message || "Serverfehler";
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
  const [password, setPassword] = useState("");
  const [errorText, setErrorText] = useState("");

  const isRegister = mode === "register";
  const registerPasswordStrength = useMemo(() => getPasswordStrength(password), [password]);

  const submitAuth = async (event) => {
    event.preventDefault();
    const payload = { username, password, displayName };
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

  return (
    <section style={{ marginBottom: "16px" }}>
      <label htmlFor="feed-search" style={{ display: "block", marginBottom: "8px", fontSize: "13px", opacity: 0.8 }}>
        Suche
      </label>
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

function BottomNav({ current, setCurrent, onOpenOwnProfile }) {
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
      <button type="button" onClick={onOpenOwnProfile} style={linkStyle("profile")}>
        Mein Profil
      </button>
    </nav>
  );
}

function Post({ post, onProfile, liked, toggleLike }) {
  return (
    <article style={styles.card}>
      <button
        type="button"
        onClick={() => onProfile(post)}
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
            onDoubleClick={toggleLike}
            style={styles.image}
          />
        ))}
      </div>

      <div style={{ display: "flex", gap: "16px", padding: "10px 14px" }}>
        <button type="button" onClick={toggleLike} style={styles.iconBtn} aria-label="Like umschalten">
          {liked ? "♥" : "♡"}
        </button>
        <button
          type="button"
          onClick={() => window.alert("Kommentare kommen spaeter")}
          style={styles.iconBtn}
          aria-label="Kommentare"
        >
          💬
        </button>
      </div>
    </article>
  );
}

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

function Upload({ onBack, onPost, currentUser }) {
  const [imageUrl, setImageUrl] = useState("");
  const [errorText, setErrorText] = useState("");

  const canPost = imageUrl.trim().length > 0;

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
          setImageUrl(event.target.value);
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
        onClick={() => setImageUrl("https://picsum.photos/seed/upload-demo/900/600")}
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

function AppContent({ currentUser, onLogout, onUpdateProfile, onChangePassword }) {
  const [current, setCurrent] = useState("feed");
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [likes, setLikes] = useState(() => readStorage(STORAGE_LIKES_KEY, {}));
  const [posts, setPosts] = useState(() => {
    const savedPosts = readStorage(STORAGE_POSTS_KEY, initialPosts);
    if (!Array.isArray(savedPosts) || savedPosts.length === 0) {
      return initialPosts;
    }
    return savedPosts;
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [feedMode, setFeedMode] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");

  const ownProfile = useMemo(() => createOwnProfile(currentUser, posts), [currentUser, posts]);
  const activeProfile = selectedProfile && !selectedProfile.isOwnProfile ? selectedProfile : ownProfile;

  const openProfile = (post) => {
    const profileData = {
      ...post,
      isOwnProfile: post.ownerId === currentUser.id,
    };
    setSelectedProfile(profileData);
    setCurrent("profile");
  };

  const openOwnProfile = () => {
    setSelectedProfile(ownProfile);
    setCurrent("profile");
  };

  const toggleLike = (postId) => {
    setLikes((previous) => ({ ...previous, [postId]: !previous[postId] }));
  };

  useEffect(() => {
    writeStorage(STORAGE_POSTS_KEY, posts);
  }, [posts]);

  useEffect(() => {
    writeStorage(STORAGE_LIKES_KEY, likes);
  }, [likes]);

  const visiblePosts = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
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
  }, [posts, likes, searchQuery, feedMode, sortOrder]);

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
          />

          {visiblePosts.length === 0 ? (
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
                onProfile={openProfile}
                liked={Boolean(likes[post.id])}
                toggleLike={() => toggleLike(post.id)}
              />
            ))
          )}
        </main>
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
          onBack={() => setCurrent("feed")}
          onPost={(newPost) => setPosts((previous) => [newPost, ...previous])}
        />
      )}

      <BottomNav
        current={current}
        setCurrent={(nextTab) => {
          setCurrent(nextTab);
          if (nextTab !== "profile") {
            setSelectedProfile(null);
          }
        }}
        onOpenOwnProfile={openOwnProfile}
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

  const handleRegister = async ({ username, password, displayName }) => {
    const normalizedUsername = normalizeUsername(username || "");
    const cleanPassword = (password || "").trim();
    const cleanDisplayName = (displayName || "").trim() || normalizedUsername;

    if (!normalizedUsername) {
      return "Bitte einen Username eingeben.";
    }
    if (cleanPassword.length < 6) {
      return "Passwort muss mindestens 6 Zeichen haben.";
    }

    try {
      const response = await createApiClient().register({
        username: normalizedUsername,
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
        />
      ) : (
        <AuthScreen onLogin={handleLogin} onRegister={handleRegister} />
      )}
    </AppErrorBoundary>
  );
}