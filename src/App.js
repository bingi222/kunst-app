import React, { useMemo, useState } from "react";

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
        onChange={(event) => setImageUrl(event.target.value)}
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

      <button
        type="button"
        onClick={() => {
          const normalized = imageUrl.trim();
          if (!normalized) {
            return;
          }
          onPost({
            id: Date.now(),
            user: "Bingi",
            bio: "Digital minimal art",
            avatar: AVATAR_BINGI,
            images: [normalized],
          });
          setImageUrl("");
          onBack();
        }}
        style={{
          marginTop: "14px",
          padding: "12px",
          width: "100%",
          background: "#fff",
          color: "#000",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
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
  const [likes, setLikes] = useState({});
  const [posts, setPosts] = useState(initialPosts);

  const fallbackProfile = useMemo(() => posts[0] || null, [posts]);
  const activeProfile = selectedProfile || fallbackProfile;

  const openProfile = (post) => {
    setSelectedProfile(post);
    setCurrent("profile");
  };

  const toggleLike = (postId) => {
    setLikes((previous) => ({ ...previous, [postId]: !previous[postId] }));
  };

  return (
    <div style={styles.app}>
      <Header title="KUNST" />

      {current === "feed" && (
        <main style={{ maxWidth: 640, margin: "0 auto", padding: "14px" }}>
          {posts.map((post) => (
            <Post
              key={post.id}
              post={post}
              onProfile={openProfile}
              liked={Boolean(likes[post.id])}
              toggleLike={() => toggleLike(post.id)}
            />
          ))}
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