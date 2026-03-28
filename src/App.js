import React, { useEffect, useMemo, useState } from "react";

const AVATAR_BINGI = "https://api.dicebear.com/9.x/initials/svg?seed=Bingi";
const AVATAR_PLUESCH = "https://api.dicebear.com/9.x/initials/svg?seed=Pluesch";
const AVATAR_GIREAM = "https://api.dicebear.com/9.x/initials/svg?seed=Giream";

const initialPosts = [
  {
    id: 1,
    user: "Bingi",
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

function Header({ title }) {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        background: "#000",
        padding: "16px",
        borderBottom: "1px solid #1f1f1f",
        textAlign: "center",
        zIndex: 10,
      }}
    >
      <b>{title}</b>
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

function BottomNav({ current, setCurrent }) {
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
      <button type="button" onClick={() => setCurrent("profile")} style={linkStyle("profile")}>
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

function Profile({ data, onBack }) {
  if (!data) {
    return (
      <div style={{ padding: "20px" }}>
        <p>Kein Profil ausgewaehlt.</p>
      </div>
    );
  }

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

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px" }}>
        {data.images.map((image, index) => (
          <SafeImage
            key={`${data.id}-profile-${index}`}
            src={image}
            alt={`Profilbild ${index + 1}`}
            style={{ width: "100%", height: 180, objectFit: "cover", background: "#161616" }}
          />
        ))}
      </div>
    </section>
  );
}

function Upload({ onBack, onPost }) {
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
      user: "Bingi",
      bio: "Digital minimal art",
      avatar: AVATAR_BINGI,
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

function AppContent() {
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

  const fallbackProfile = useMemo(() => posts[0] || null, [posts]);
  const activeProfile = selectedProfile || fallbackProfile;

  const openProfile = (post) => {
    setSelectedProfile(post);
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
      <Header title="KUNST" />

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

      {current === "profile" && <Profile data={activeProfile} onBack={() => setCurrent("feed")} />}

      {current === "upload" && (
        <Upload
          onBack={() => setCurrent("feed")}
          onPost={(newPost) => setPosts((previous) => [newPost, ...previous])}
        />
      )}

      <BottomNav current={current} setCurrent={setCurrent} />
    </div>
  );
}

export default function App() {
  return (
    <AppErrorBoundary>
      <AppContent />
    </AppErrorBoundary>
  );
}