import React, { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { normalizeUsername, isEditableTarget, createAvatarFromName } from "./utils/helpers";
import { getPasswordStrength } from "./utils/format";
import usePersistentState from "./hooks/usePersistentState";
import Header from "./components/layout/Header";
import FeedToolbar from "./components/feed/FeedToolbar";
import PostCard from "./components/feed/PostCard";
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
    background: "#0b1018",
    color: "#f3f4f6",
    minHeight: "100vh",
    paddingBottom: "24px",
  },
  card: {
    marginBottom: 0,
    border: "1px solid #1f2632",
    borderRadius: "18px",
    overflow: "hidden",
    background: "#0e1420",
    boxShadow: "0 14px 44px rgba(0, 0, 0, 0.4)",
  },
  imageGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "0",
  },
  image: {
    width: "100%",
    height: "auto",
    objectFit: "cover",
    background: "#1b1f29",
    transition: "transform 420ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 320ms ease",
    opacity: 0.58,
  },
  iconBtn: {
    background: "transparent",
    border: "none",
    color: "#e5e7eb",
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
    background: "rgba(18, 22, 30, 0.88)",
    border: "1px solid #2b313d",
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
    background: "#8b5cf6",
    color: "#ffffff",
    padding: "0 14px",
    fontWeight: 600,
    fontSize: "14px",
    cursor: "pointer",
    transition: "transform 180ms ease, filter 180ms ease",
  },
  secondaryBtn: {
    height: "40px",
    borderRadius: TOKENS.radius.sm,
    border: "1px solid #2b313d",
    background: "#171b24",
    color: "#e5e7eb",
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
const STORAGE_COMMENT_DRAFTS_KEY = "kunst-app.comment.drafts.v1";
const API_BASE_URL = process.env.REACT_APP_API_URL || "";
const EMPTY_COMMENTS = [];
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
    deletePost: (postId) =>
      request(`/api/feed/posts/${postId}`, {
        method: "DELETE",
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
  const [commentInputByPostId, setCommentInputByPostId] = usePersistentState(STORAGE_COMMENT_DRAFTS_KEY, {});
  const [expandedCommentsPostId, setExpandedCommentsPostId] = useState(null);
  const [highlightedPostId, setHighlightedPostId] = useState(null);
  const [showFeedFilters, setShowFeedFilters] = useState(false);
  const [searchQuery, setSearchQuery] = usePersistentState(STORAGE_FEED_SEARCH_KEY, "");
  const [feedMode, setFeedMode] = usePersistentState(STORAGE_FEED_MODE_KEY, "all");
  const [sortOrder, setSortOrder] = usePersistentState(STORAGE_FEED_SORT_KEY, "newest");
  const [lastFeedLoadedAt, setLastFeedLoadedAt] = useState(null);
  const [feedErrorText, setFeedErrorText] = useState("");
  const [isFeedLoading, setIsFeedLoading] = useState(true);
  const [deletingPostIds, setDeletingPostIds] = useState({});
  const [uploadDraftImageUrl, setUploadDraftImageUrl] = usePersistentState(STORAGE_UPLOAD_DRAFT_KEY, "");

  const deferredSearchQuery = useDeferredValue(searchQuery);
  const likesRef = useRef(likes);
  const commentsByPostIdRef = useRef(commentsByPostId);
  const expandedCommentsPostIdRef = useRef(expandedCommentsPostId);
  const commentInputByPostIdRef = useRef(commentInputByPostId);
  const commentErrorByPostIdRef = useRef(commentErrorByPostId);
  const pendingMarkAllUndoRef = useRef(null);
  const pendingMarkAllTimerRef = useRef(null);

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

  const openProfile = useCallback(
    (post) => {
      const profileData = {
        ...post,
        isOwnProfile: post.ownerId === currentUser.id,
      };
      setSelectedProfile(profileData);
      setCurrent("profile");
    },
    [currentUser.id],
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

  const toggleLike = useCallback(
    async (postId) => {
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
    },
    [apiClient],
  );

  const deletePost = useCallback(
    async (postId) => {
      const normalizedPostId = Number(postId);
      if (!Number.isFinite(normalizedPostId)) {
        return;
      }
      if (deletingPostIds[normalizedPostId]) {
        return;
      }
      const shouldDelete =
        typeof window !== "undefined" && typeof window.confirm === "function"
          ? window.confirm("Diesen Beitrag wirklich loeschen?")
          : true;
      if (!shouldDelete) {
        return;
      }

      setDeletingPostIds((previous) => ({ ...previous, [normalizedPostId]: true }));
      setFeedErrorText("");
      try {
        await apiClient.deletePost(normalizedPostId);
        setPosts((previousPosts) => previousPosts.filter((post) => Number(post.id) !== normalizedPostId));
        setCommentsByPostId((previous) => {
          const next = { ...previous };
          delete next[normalizedPostId];
          commentsByPostIdRef.current = next;
          return next;
        });
        setCommentInputByPostId((previous) => {
          const next = { ...previous };
          delete next[normalizedPostId];
          commentInputByPostIdRef.current = next;
          return next;
        });
        setCommentErrorByPostId((previous) => {
          const next = { ...previous };
          delete next[normalizedPostId];
          commentErrorByPostIdRef.current = next;
          return next;
        });
        setCommentsLoadingByPostId((previous) => {
          const next = { ...previous };
          delete next[normalizedPostId];
          return next;
        });
        setCommentSubmittingByPostId((previous) => {
          const next = { ...previous };
          delete next[normalizedPostId];
          return next;
        });
        setExpandedCommentsPostId((previous) => (Number(previous) === normalizedPostId ? null : previous));
        if (Number(highlightedPostId) === normalizedPostId) {
          setHighlightedPostId(null);
        }
        setLikes((previous) => {
          const next = { ...previous };
          delete next[normalizedPostId];
          likesRef.current = next;
          return next;
        });
      } catch (error) {
        setFeedErrorText(error.message || "Beitrag konnte nicht geloescht werden.");
      } finally {
        setDeletingPostIds((previous) => {
          const next = { ...previous };
          delete next[normalizedPostId];
          return next;
        });
      }
    },
    [apiClient, deletingPostIds, highlightedPostId, setCommentInputByPostId],
  );

  const loadCommentsForPost = useCallback(
    async (postId) => {
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
    },
    [apiClient],
  );

  const openCommentsForPost = useCallback(
    async (postId) => {
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
    },
    [loadCommentsForPost],
  );

  const submitComment = useCallback(
    async (postId) => {
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
    },
    [apiClient, setCommentInputByPostId],
  );

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
  }, [setCommentInputByPostId]);

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
        <main style={{ maxWidth: 1520, margin: "0 auto", padding: "40px 34px 66px" }}>
          <FeedToolbar
            feedMode={feedMode}
            setFeedMode={setFeedMode}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
            lastUpdatedAt={lastFeedLoadedAt}
            onResetFilters={handleResetFilters}
            showAdvanced={showFeedFilters}
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
            <div className="masonry-feed">
              {visiblePosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUserId={currentUser.id}
                  onOpenProfile={openProfile}
                  onDeletePost={deletePost}
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
                  styles={styles}
                />
              ))}
            </div>
          )}
        </main>
      )}

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
      <div style={{ minHeight: "100vh", background: "#0f1115", color: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center" }}>
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
