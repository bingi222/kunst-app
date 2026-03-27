import React, { useState } from "react";

/* ---------- DATEN ---------- */
const initialPosts = [
  {
    id: 1,
    user: "Bingi",
    bio: "Digital minimal art",
    avatar: "https://i.pravatar.cc/100?img=1",
    images: [
      "https://images.unsplash.com/photo-1549880338-65ddcdfd017b?q=80&w=1200",
      "https://images.unsplash.com/photo-1579783901586-d88db74b4fe4?q=80&w=1200",
      "https://images.unsplash.com/photo-1504198453319-5ce911bafcde?q=80&w=1200",
    ],
  },
  {
    id: 2,
    user: "Plüsch",
    bio: "Abstract emotions",
    avatar: "https://i.pravatar.cc/100?img=2",
    images: [
      "https://images.unsplash.com/photo-1492724441997-5dc865305da7?q=80&w=1200",
      "https://images.unsplash.com/photo-1500462918059-b1a0cb512f1d?q=80&w=1200",
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200",
    ],
  },
  {
    id: 3,
    user: "Giream",
    bio: "Visual storytelling",
    avatar: "https://i.pravatar.cc/100?img=3",
    images: [
      "https://images.unsplash.com/photo-1541961017774-22349e4a1262?q=80&w=1200",
      "https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=1200",
      "https://images.unsplash.com/photo-1520697222860-4b1a4c9d0b3f?q=80&w=1200",
    ],
  },
];

/* ---------- HEADER ---------- */
function Header({ title }) {
  return (
    <div style={{
      position: "sticky",
      top: 0,
      background: "black",
      padding: "16px",
      borderBottom: "1px solid #222",
      color: "white",
      textAlign: "center"
    }}>
      <b>{title}</b>
    </div>
  );
}

/* ---------- ICONS ---------- */
function IconHeart({ active, onClick, trigger }) {
  const [anim, setAnim] = useState(false);

  const runAnim = () => {
    setAnim(true);
    setTimeout(() => setAnim(false), 300);
  };

  const handleClick = () => {
    runAnim();
    onClick();
  };

  React.useEffect(() => {
    if (trigger) runAnim();
  }, [trigger]);

  return (
    <svg
      onClick={handleClick}
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill={active ? "white" : "none"}
      stroke="white"
      strokeWidth="1.5"
      style={{
        cursor: "pointer",
        opacity: active ? 1 : 0.7,
        transform: anim
          ? "scale(1.3) rotate(-8deg)"
          : "scale(1) rotate(0deg)",
        transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
        filter: active && anim
          ? "drop-shadow(0 0 6px rgba(255,255,255,0.6))"
          : "none"
      }}
    >
      <path d="M20.8 4.6c-1.5-1.5-4-1.5-5.5 0L12 7.9 8.7 4.6c-1.5-1.5-4-1.5-5.5 0s-1.5 4 0 5.5L12 21l8.8-10.9c1.5-1.5 1.5-4 0-5.5z"/>
    </svg>
  );
}

function IconComment({ onClick }) {
  return (
    <svg
      onClick={onClick}
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth="1.5"
      style={{ cursor: "pointer", opacity: 0.7 }}
    >
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/>
    </svg>
  );
}

/* ---------- NAV ---------- */
function BottomNav({ current, setCurrent }) {
  const getStyle = (tab) => ({
    color: current === tab ? "white" : "#777",
    cursor: "pointer",
    transition: "all 0.25s ease",
    transform: current === tab ? "scale(1.1)" : "scale(1)",
    textShadow: current === tab
      ? "0 0 8px rgba(255,255,255,0.8)"
      : "none",
  });

  return (
    <div style={{
      position: "fixed",
      bottom: 0,
      width: "100%",
      background: "black",
      borderTop: "1px solid #222",
      display: "flex",
      justifyContent: "space-around",
      padding: "10px 0"
    }}>
      <span onClick={() => setCurrent("feed")} style={getStyle("feed")}>
        Home
      </span>

      <span
        onClick={() => setCurrent("upload")}
        style={{ ...getStyle("upload"), fontSize: "20px" }}
      >
        +
      </span>

      <span onClick={() => setCurrent("profile")} style={getStyle("profile")}>
        Mein Profil
      </span>
    </div>
  );
}

/* ---------- POST ---------- */
function Post({ post, onProfile, liked, toggleLike }) {
  const [lastTap, setLastTap] = useState(0);
  const [triggerAnim, setTriggerAnim] = useState(false);

  const handleDoubleTap = () => {
    const now = Date.now();
    const DELAY = 300;

    if (now - lastTap < DELAY) {
      toggleLike();
      setTriggerAnim(true);
      setTimeout(() => setTriggerAnim(false), 10);
    }

    setLastTap(now);
  };

  return (
    <div style={{ marginBottom: "40px" }}>
      <div onClick={() => onProfile(post)} style={{
        padding: "14px",
        color: "white",
        fontWeight: "600",
        cursor: "pointer"
      }}>
        {post.user}
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        gap: "4px"
      }}>
        {post.images.map((img, i) => (
          <img
            key={i}
            src={img}
            alt=""
            onClick={handleDoubleTap}
            style={{
              width: "100%",
              height: "140px",
              objectFit: "cover",
              cursor: "pointer",
              transition: "0.2s"
            }}
            onMouseOver={e => e.target.style.opacity = 0.7}
            onMouseOut={e => e.target.style.opacity = 1}
          />
        ))}
      </div>

      <div style={{ display: "flex", gap: "16px", padding: "10px 14px" }}>
        <IconHeart active={liked} onClick={toggleLike} trigger={triggerAnim} />
        <IconComment onClick={() => alert("Kommentare kommen später")} />
      </div>
    </div>
  );
}

/* ---------- PROFILE ---------- */
function Profile({ data, onBack }) {
  return (
    <div style={{ color: "white" }}>
      <div style={{ padding: "10px" }}>
        <span onClick={onBack} style={{ cursor: "pointer" }}>← Zurück</span>
      </div>

      <div style={{ padding: "20px" }}>
        <img src={data.avatar} alt=""
          style={{ width: 70, height: 70, borderRadius: "50%" }} />
        <h2>{data.user}</h2>
        <p style={{ opacity: 0.6 }}>{data.bio}</p>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "4px"
      }}>
        {data.images.map((img, i) => (
          <img key={i} src={img} alt=""
            style={{
              width: "100%",
              height: 200,
              objectFit: "cover",
              cursor: "pointer",
              transition: "0.2s"
            }}
            onMouseOver={e => e.target.style.opacity = 0.7}
            onMouseOut={e => e.target.style.opacity = 1}
          />
        ))}
      </div>
    </div>
  );
}

/* ---------- UPLOAD ---------- */
function Upload({ onBack, onPost }) {
  const [image, setImage] = useState("");

  return (
    <div style={{ color: "white", padding: "20px" }}>
      <span onClick={onBack} style={{ cursor: "pointer" }}>← Zurück</span>

      <h2 style={{ marginTop: "20px" }}>Upload</h2>

      <input
        placeholder="Bild URL einfügen"
        value={image}
        onChange={(e) => setImage(e.target.value)}
        style={{
          width: "100%",
          padding: "12px",
          marginTop: "20px",
          background: "#111",
          border: "1px solid #333",
          color: "white"
        }}
      />

      <button
        onClick={() => {
          if (!image) return;

          onPost({
            id: Date.now(),
            user: "Bingi",
            bio: "Digital minimal art",
            avatar: "https://i.pravatar.cc/100?img=1",
            images: [image],
          });

          onBack();
        }}
        style={{
          marginTop: "20px",
          padding: "12px",
          width: "100%",
          background: "white",
          color: "black",
          border: "none",
          cursor: "pointer"
        }}
      >
        Posten
      </button>
    </div>
  );
}

/* ---------- APP ---------- */
export default function App() {
  const [current, setCurrent] = useState("feed");
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [likes, setLikes] = useState({});
  const [posts, setPosts] = useState(initialPosts);

  const toggleLike = (id) => {
    setLikes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const openProfile = (post) => {
    setSelectedProfile(post);
    setCurrent("profile");
  };

  return (
    <div style={{ background: "black", minHeight: "100vh", paddingBottom: "60px" }}>
      
      <Header title="KUNST" />

      {current === "feed" && (
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          {posts.map(post => (
            <Post
              key={post.id}
              post={post}
              onProfile={openProfile}
              liked={likes[post.id]}
              toggleLike={() => toggleLike(post.id)}
            />
          ))}
        </div>
      )}

      {current === "profile" && selectedProfile && (
        <Profile data={selectedProfile} onBack={() => setCurrent("feed")} />
      )}

      {current === "upload" && (
        <Upload
          onBack={() => setCurrent("feed")}
          onPost={(newPost) => setPosts(prev => [newPost, ...prev])}
        />
      )}

      <BottomNav current={current} setCurrent={setCurrent} />
    </div>
  );
}