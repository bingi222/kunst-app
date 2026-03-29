import React, { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { normalizeUsername, isEditableTarget, createAvatarFromName } from "./utils/helpers";
import { getPasswordStrength } from "./utils/format";
import usePersistentState from "./hooks/usePersistentState";
import Header from "./components/layout/Header";
import FeedToolbar from "./components/feed/FeedToolbar";
import PostCard from "./components/feed/PostCard";
import ArtworkDetailModal from "./components/feed/ArtworkDetailModal";
import ActivityView from "./components/activity/ActivityView";
import AuthScreen from "./components/pages/AuthScreen";
import ProfilePage from "./components/pages/ProfilePage";
import UploadPage from "./components/pages/UploadPage";

const TOKENS = {
  radius: {
    sm: "12px",
    md: "18px",
    lg: "24px",
    pill: "999px",
  },
  spacing: {
    xs: "8px",
    sm: "12px",
    md: "16px",
    lg: "24px",
    xl: "32px",
  },
  elevation: {
    soft: "0 8px 30px rgba(0, 0, 0, 0.35)",
    card: "0 10px 36px rgba(0, 0, 0, 0.38)",
  },
};

const styles = {
  app: {
    background: "#121212",
    color: "rgba(255, 255, 255, 0.9)",
    minHeight: "100vh",
    paddingBottom: "24px",
  },
  card: {
    marginBottom: 0,
    border: "1px solid #2a2a2a",
    borderRadius: "18px",
    overflow: "hidden",
    background: "#1a1a1a",
    boxShadow: "0 14px 44px rgba(0, 0, 0, 0.4)",
  },
  imageGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "0",
  },
  image: {
    width: "100%",
    maxWidth: "100%",
    height: "auto",
    objectFit: "cover",
    background: "#1a1a1a",
    transition: "transform 420ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 320ms ease",
    opacity: 0.58,
  },
  iconBtn: {
    background: "transparent",
    border: "none",
    color: "rgba(255, 255, 255, 0.9)",
    cursor: "pointer",
    fontSize: "15px",
    padding: 0,
    fontFamily: "inherit",
    transition: "transform 180ms ease, opacity 180ms ease, background-color 180ms ease, border-color 180ms ease",
  },
  nav: {
    position: "fixed",
    left: "50%",
    transform: "translateX(-50%)",
    bottom: "12px",
    width: "min(94vw, 700px)",
    background: "rgba(26, 26, 26, 0.88)",
    border: "1px solid #2a2a2a",
    borderRadius: TOKENS.radius.pill,
    boxShadow: TOKENS.elevation.soft,
    backdropFilter: "blur(14px)",
    display: "none",
    justifyContent: "space-around",
    padding: "10px 12px",
    zIndex: 30,
  },
  primaryBtn: {
    height: "40px",
    borderRadius: TOKENS.radius.sm,
    border: "1px solid transparent",
    background: "#d7d7d7",
    color: "#121212",
    padding: "0 14px",
    fontWeight: 600,
    fontSize: "14px",
    cursor: "pointer",
    transition: "transform 180ms ease, filter 180ms ease",
  },
  secondaryBtn: {
    height: "40px",
    borderRadius: TOKENS.radius.sm,
    border: "1px solid #2a2a2a",
    background: "#1a1a1a",
    color: "rgba(255, 255, 255, 0.9)",
    padding: "0 14px",
    fontWeight: 600,
    fontSize: "14px",
    cursor: "pointer",
    transition: "transform 180ms ease, background-color 180ms ease",
  },
};

const STORAGE_AUTH_TOKEN_KEY = "kunst-app.auth.token.v1";
const STORAGE_FEED_SEARCH_KEY = "kunst-app.feed.search.v1";
const STORAGE_FEED_MODE_KEY = "kunst-app.feed.mode.v1";
const STORAGE_FEED_SORT_KEY = "kunst-app.feed.sort.v1";
const STORAGE_UPLOAD_DRAFT_KEY = "kunst-app.upload.draft.v1";
const API_BASE_URL = process.env.REACT_APP_API_URL || "";
const MARK_ALL_UNDO_WINDOW_MS = 5000;
const SESSION_BOOT_TIMEOUT_MS = 5000;

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
    getNotifications: () => request("/api/notifications"),
    markAllNotificationsRead: () =>
      request("/api/notifications/read-all", {
        method: "PUT",
      }),
    markNotificationRead: (notificationId) =>
      request(`/api/notifications/${notificationId}/read`, {
        method: "PUT",
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
    // eslint-disable-next-line no-console
    console.error("UI crash captured by ErrorBoundary:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "24px", color: "rgba(255, 255, 255, 0.9)", background: "#121212", minHeight: "100vh" }}>
          <h1>Inhalte konnten nicht vollstaendig geladen werden</h1>
          <p>Bitte Seite neu laden. Die Anwendung bleibt stabil und zeigt Basisinhalte an.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

function createOwnProfile(currentUser, posts) {
  const ownPosts = posts.filter((post) => post.ownerId === currentUser.id);
  const ownImages = ownPosts.flatMap((post) => post.images).slice(0, 20);
  const ownLikes = ownPosts.reduce((sum, post) => {
    const likeCount = Number(post.likeCount);
    if (Number.isFinite(likeCount) && likeCount >= 0) {
      return sum + likeCount;
    }
    const idPart = Number(post.id);
    const userPart = String(post.user || "")
      .split("")
      .reduce((nextSum, char) => nextSum + char.charCodeAt(0), 0);
    const hash = Math.abs((Number.isFinite(idPart) ? idPart : 0) * 17 + userPart);
    return sum + (24 + (hash % 180));
  }, 0);

  return {
    id: currentUser.id,
    user: currentUser.displayName,
    ownerId: currentUser.id,
    bio: currentUser.bio,
    avatar: currentUser.avatar,
    images: ownImages,
    works: ownPosts,
    likeCount: ownLikes,
    worksCount: ownImages.length,
    isOwnProfile: true,
  };
}

function createProfileFromPost(post, posts, currentUserId) {
  if (!post) {
    return null;
  }
  const ownerId = String(post.ownerId || "").trim();
  const normalizedUser = normalizeUsername(String(post.user || "").trim());
  const matchingPosts = posts.filter((candidate) => {
    if (ownerId) {
      return String(candidate.ownerId || "").trim() === ownerId;
    }
    return normalizeUsername(String(candidate.user || "").trim()) === normalizedUser;
  });
  const profilePosts = matchingPosts.length > 0 ? matchingPosts : [post];
  const images = profilePosts.flatMap((entry) => (Array.isArray(entry.images) ? entry.images : [])).filter(Boolean);
  const likeCount = profilePosts.reduce((sum, entry) => {
    const parsedLikeCount = Number(entry.likeCount);
    if (Number.isFinite(parsedLikeCount) && parsedLikeCount >= 0) {
      return sum + parsedLikeCount;
    }
    const idPart = Number(entry.id);
    const userPart = String(entry.user || "")
      .split("")
      .reduce((nextSum, char) => nextSum + char.charCodeAt(0), 0);
    const hash = Math.abs((Number.isFinite(idPart) ? idPart : 0) * 17 + userPart);
    return sum + (24 + (hash % 180));
  }, 0);
  const fallbackAvatar = createAvatarFromName(String(post.user || "Kuenstler"));

  return {
    ...post,
    ownerId: ownerId || post.ownerId,
    user: String(post.user || "").trim() || "Kuenstler",
    bio: String(post.bio || "").trim() || "Noch keine Bio verfuegbar.",
    avatar: String(post.avatar || "").trim() || fallbackAvatar,
    images,
    works: profilePosts,
    likeCount,
    worksCount: images.length,
    isOwnProfile: ownerId ? ownerId === currentUserId : false,
  };
}

function getArtistFollowKeyFromPost(post) {
  if (!post) {
    return "";
  }
  const ownerId = String(post.ownerId || "").trim();
  if (ownerId) {
    return `owner:${ownerId}`;
  }
  const normalizedUser = normalizeUsername(String(post.user || "").trim());
  return normalizedUser ? `user:${normalizedUser}` : "";
}

function createFollowerCountFromKey(artistKey) {
  const key = String(artistKey || "");
  if (!key) {
    return 120;
  }
  let hash = 0;
  for (let index = 0; index < key.length; index += 1) {
    hash = (hash * 31 + key.charCodeAt(index)) >>> 0;
  }
  return 80 + (hash % 920);
}

function AppContent({ currentUser, onLogout, onUpdateProfile, onChangePassword, apiClient }) {
  const [current, setCurrent] = useState("feed");
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [likes, setLikes] = useState({});
  const [posts, setPosts] = useState([]);
  const [followByArtistKey, setFollowByArtistKey] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [isNotificationsLoading, setIsNotificationsLoading] = useState(false);
  const [notificationsErrorText, setNotificationsErrorText] = useState("");
  const [showUndoMarkAll, setShowUndoMarkAll] = useState(false);
  const [detailPost, setDetailPost] = useState(null);
  const [highlightedPostId, setHighlightedPostId] = useState(null);
  const [showFeedFilters, setShowFeedFilters] = useState(false);
  const [searchQuery, setSearchQuery] = usePersistentState(STORAGE_FEED_SEARCH_KEY, "");
  const [feedMode, setFeedMode] = usePersistentState(STORAGE_FEED_MODE_KEY, "all");
  const [sortOrder, setSortOrder] = usePersistentState(STORAGE_FEED_SORT_KEY, "newest");
  const [feedErrorText, setFeedErrorText] = useState("");
  const [isFeedLoading, setIsFeedLoading] = useState(true);
  const [uploadDraftImageUrl, setUploadDraftImageUrl] = usePersistentState(STORAGE_UPLOAD_DRAFT_KEY, "");

  const deferredSearchQuery = useDeferredValue(searchQuery);
  const likesRef = useRef(likes);
  const pendingMarkAllUndoRef = useRef(null);
  const pendingMarkAllTimerRef = useRef(null);

  useEffect(() => {
    likesRef.current = likes;
  }, [likes]);

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
  const detailArtistKey = useMemo(() => getArtistFollowKeyFromPost(detailPost), [detailPost]);
  const activeProfileArtistKey = useMemo(() => getArtistFollowKeyFromPost(activeProfile), [activeProfile]);
  const isFollowingDetailArtist = Boolean(detailArtistKey && followByArtistKey[detailArtistKey]);
  const isFollowingActiveProfileArtist = Boolean(activeProfileArtistKey && followByArtistKey[activeProfileArtistKey]);
  const detailFollowerCount = useMemo(
    () => createFollowerCountFromKey(detailArtistKey) + (isFollowingDetailArtist ? 1 : 0),
    [detailArtistKey, isFollowingDetailArtist],
  );
  const activeProfileFollowerCount = useMemo(
    () => createFollowerCountFromKey(activeProfileArtistKey) + (isFollowingActiveProfileArtist ? 1 : 0),
    [activeProfileArtistKey, isFollowingActiveProfileArtist],
  );

  const toggleFollowArtist = useCallback((artistKey) => {
    if (!artistKey) {
      return;
    }
    setFollowByArtistKey((previous) => ({
      ...previous,
      [artistKey]: !previous[artistKey],
    }));
  }, []);

  const openProfile = useCallback(
    (post) => {
      const profileData = createProfileFromPost(post, posts, currentUser.id);
      if (!profileData) {
        return;
      }
      setDetailPost(null);
      setSelectedProfile(profileData);
      setCurrent("profile");
    },
    [currentUser.id, posts],
  );

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
          setShowFeedFilters(false);
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
      const firstCreatedAt = Number(first.createdAt) || Number(first.id) || 0;
      const secondCreatedAt = Number(second.createdAt) || Number(second.id) || 0;
      if (sortOrder === "popular") {
        const firstLikes = Number(first.likeCount) || (likes[first.id] ? 1 : 0);
        const secondLikes = Number(second.likeCount) || (likes[second.id] ? 1 : 0);
        if (secondLikes !== firstLikes) {
          return secondLikes - firstLikes;
        }
        return secondCreatedAt - firstCreatedAt;
      }
      return secondCreatedAt - firstCreatedAt;
    });

    return nextPosts;
  }, [posts, likes, deferredSearchQuery, feedMode, sortOrder]);

  const handleResetFilters = useCallback(() => {
    setSearchQuery("");
    setFeedMode("all");
    setSortOrder("newest");
    setShowFeedFilters(false);
  }, [setSearchQuery, setFeedMode, setSortOrder]);

  const handleTabChange = useCallback(
    (nextTab) => {
      setCurrent(nextTab);
      if (nextTab === "activity") {
        loadNotifications();
      }
      if (nextTab !== "profile") {
        setSelectedProfile(null);
      }
    },
    [loadNotifications],
  );

  const handleRefreshCurrent = useCallback(() => {
    if (current === "activity") {
      loadNotifications();
      return;
    }
    loadFeed();
  }, [current, loadFeed, loadNotifications]);

  const openArtworkDetail = useCallback((post) => {
    if (!post) {
      return;
    }
    setDetailPost(post);
  }, []);

  const closeArtworkDetail = useCallback(() => {
    setDetailPost(null);
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
      <Header
        title="KUNST"
        currentUser={currentUser}
        onLogout={onLogout}
        currentTab={current}
        onGoFeed={() => handleTabChange("feed")}
        onGoUpload={() => handleTabChange("upload")}
        onGoActivity={() => handleTabChange("activity")}
        onRefreshCurrent={handleRefreshCurrent}
        onOpenOwnProfile={openOwnProfile}
        unreadNotificationsCount={unreadNotificationsCount}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onToggleFeedFilters={() => setShowFeedFilters((previous) => !previous)}
        showFeedFilters={showFeedFilters}
      />

      {current === "feed" && (
        <main style={{ maxWidth: 1320, margin: "0 auto", padding: "38px 24px 64px" }}>
          <FeedToolbar
            feedMode={feedMode}
            setFeedMode={setFeedMode}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
            onResetFilters={handleResetFilters}
            showAdvanced={showFeedFilters}
          />

          {feedErrorText && (
            <div
              style={{
                border: "1px dashed #3a3a3a",
                borderRadius: "10px",
                padding: "18px",
                color: "#aaaaaa",
                marginBottom: "12px",
              }}
            >
              {feedErrorText}
            </div>
          )}

          {isFeedLoading ? (
            <div
              style={{
                border: "1px dashed #3a3a3a",
                borderRadius: "10px",
                padding: "18px",
                color: "#aaaaaa",
              }}
            >
              Feed wird geladen...
            </div>
          ) : visiblePosts.length === 0 ? (
            <div
              style={{
                border: "1px dashed #3a3a3a",
                borderRadius: "10px",
                padding: "18px",
                color: "#aaaaaa",
              }}
            >
              Keine Inhalte fuer diesen Filter gefunden.
            </div>
          ) : (
            <div className="feed-grid-balanced">
              {visiblePosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  isHighlighted={Number(post.id) === Number(highlightedPostId)}
                  onOpenDetail={openArtworkDetail}
                  styles={styles}
                />
              ))}
            </div>
          )}
        </main>
      )}

      <ArtworkDetailModal
        post={detailPost}
        onClose={closeArtworkDetail}
        isFollowing={isFollowingDetailArtist}
        onToggleFollow={() => toggleFollowArtist(detailArtistKey)}
        onOpenArtistProfile={openProfile}
        followerCount={detailFollowerCount}
      />

      {current === "activity" && (
        <ActivityView
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
          styles={styles}
        />
      )}

      {current === "profile" && (
        <ProfilePage
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
          isFollowed={isFollowingActiveProfileArtist}
          onToggleFollow={() => toggleFollowArtist(activeProfileArtistKey)}
          followerCount={activeProfileFollowerCount}
          likesCount={Number(activeProfile?.likeCount) || 0}
          artworksCount={Array.isArray(activeProfile?.images) ? activeProfile.images.length : 0}
          onOpenArtworkDetail={openArtworkDetail}
          styles={styles}
          getPasswordStrength={getPasswordStrength}
        />
      )}

      {current === "upload" && (
        <UploadPage
          currentUser={currentUser}
          draftImageUrl={uploadDraftImageUrl}
          onDraftImageUrlChange={setUploadDraftImageUrl}
          onBack={() => setCurrent("feed")}
          onPost={(newPost) => {
            const localPostId = Number(newPost?.id) || Date.now();
            const localPost = {
              ...newPost,
              id: localPostId,
              ownerId: newPost?.ownerId || currentUser.id,
              user: newPost?.user || currentUser.displayName,
              bio: newPost?.bio || currentUser.bio,
              avatar: newPost?.avatar || currentUser.avatar,
              images: Array.isArray(newPost?.images) ? newPost.images : [],
              createdAt: Date.now(),
              commentCount: 0,
            };
            setFeedErrorText("");
            setPosts((previousPosts) => [localPost, ...previousPosts.filter((post) => Number(post.id) !== Number(localPostId))]);
            setCurrent("feed");
          }}
        />
      )}
    </div>
  );
}

export default function App() {
  const [authToken, setAuthToken] = usePersistentState(STORAGE_AUTH_TOKEN_KEY, "");
  const [currentUser, setCurrentUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const apiClient = useMemo(() => createApiClient(authToken), [authToken]);

  useEffect(() => {
    let cancelled = false;
    let settled = false;
    const completeSessionBoot = () => {
      if (cancelled || settled) {
        return false;
      }
      settled = true;
      return true;
    };
    const sessionFallbackTimer =
      typeof window !== "undefined"
        ? window.setTimeout(() => {
            if (!completeSessionBoot()) {
              return;
            }
            // eslint-disable-next-line no-console
            console.log("[session] timeout fallback -> login");
            setCurrentUser(null);
            setAuthToken("");
            setAuthReady(true);
          }, SESSION_BOOT_TIMEOUT_MS)
        : null;

    const loadSession = async () => {
      // eslint-disable-next-line no-console
      console.log("[session] start", { hasToken: Boolean(authToken) });
      if (!authToken) {
        // eslint-disable-next-line no-console
        console.log("[session] result -> no session token");
        if (completeSessionBoot()) {
          setCurrentUser(null);
          setAuthReady(true);
        }
        return;
      }

      setAuthReady(false);
      try {
        const response = await apiClient.me();
        // eslint-disable-next-line no-console
        console.log("[session] result -> session loaded", {
          hasUser: Boolean(response?.user),
          userId: response?.user?.id || null,
        });
        if (completeSessionBoot()) {
          setCurrentUser(response?.user || null);
          setAuthReady(true);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.log("[session] fetch error", error);
        if (completeSessionBoot()) {
          setCurrentUser(null);
          setAuthToken("");
          setAuthReady(true);
        }
      } finally {
        if (sessionFallbackTimer !== null) {
          window.clearTimeout(sessionFallbackTimer);
        }
      }
    };

    loadSession();
    return () => {
      cancelled = true;
      if (sessionFallbackTimer !== null) {
        window.clearTimeout(sessionFallbackTimer);
      }
    };
  }, [authToken, apiClient, setAuthToken]);

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
      <div style={{ minHeight: "100vh", background: "#121212", color: "rgba(255, 255, 255, 0.9)", display: "flex", alignItems: "center", justifyContent: "center" }}>
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
