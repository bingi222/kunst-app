const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || "kunst-dev-secret-change-me";

app.use(cors());
app.use(express.json({ limit: "3mb" }));

const users = [
  {
    id: "u-bingi",
    username: "bingi",
    email: "bingi@kunst.app",
    emailVerified: true,
    marketingOptIn: true,
    passwordHash: bcrypt.hashSync("kunst123", 10),
    displayName: "Bingi",
    bio: "Digital minimal art",
    avatar: "https://api.dicebear.com/9.x/initials/svg?seed=Bingi",
  },
  {
    id: "u-pluesch",
    username: "pluesch",
    email: "pluesch@kunst.app",
    emailVerified: true,
    marketingOptIn: true,
    passwordHash: bcrypt.hashSync("kunst123", 10),
    displayName: "Pluesch",
    bio: "Abstract emotions",
    avatar: "https://api.dicebear.com/9.x/initials/svg?seed=Pluesch",
  },
  {
    id: "u-giream",
    username: "giream",
    email: "giream@kunst.app",
    emailVerified: true,
    marketingOptIn: true,
    passwordHash: bcrypt.hashSync("kunst123", 10),
    displayName: "Giream",
    bio: "Visual storytelling",
    avatar: "https://api.dicebear.com/9.x/initials/svg?seed=Giream",
  },
];

const posts = [
  {
    id: 1,
    user: "Bingi",
    ownerId: "u-bingi",
    bio: "Digital minimal art",
    avatar: "https://api.dicebear.com/9.x/initials/svg?seed=Bingi",
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
    avatar: "https://api.dicebear.com/9.x/initials/svg?seed=Pluesch",
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
    avatar: "https://api.dicebear.com/9.x/initials/svg?seed=Giream",
    images: [
      "https://picsum.photos/seed/giream-1/900/600",
      "https://picsum.photos/seed/giream-2/900/600",
      "https://picsum.photos/seed/giream-3/900/600",
    ],
  },
];

const likesByUserId = new Map();
const commentsByPostId = new Map();
const notificationsByUserId = new Map();

function normalizeUsername(username) {
  return String(username || "")
    .trim()
    .toLowerCase();
}

function normalizeEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

function toPublicUser(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    emailVerified: Boolean(user.emailVerified),
    marketingOptIn: Boolean(user.marketingOptIn),
    displayName: user.displayName,
    bio: user.bio,
    avatar: user.avatar,
  };
}

function getUserLikes(userId) {
  if (!likesByUserId.has(userId)) {
    likesByUserId.set(userId, {});
  }
  return likesByUserId.get(userId);
}

function getPostById(postId) {
  return posts.find((post) => Number(post.id) === Number(postId)) || null;
}

function getPostComments(postId) {
  const normalizedPostId = Number(postId);
  if (!commentsByPostId.has(normalizedPostId)) {
    commentsByPostId.set(normalizedPostId, []);
  }
  return commentsByPostId.get(normalizedPostId);
}

function getUserNotifications(userId) {
  if (!notificationsByUserId.has(userId)) {
    notificationsByUserId.set(userId, []);
  }
  return notificationsByUserId.get(userId);
}

function createNotification({ recipientUserId, actorUser, type, postId, text }) {
  if (!recipientUserId || !actorUser || recipientUserId === actorUser.id) {
    return null;
  }

  let resolvedText = String(text || "").trim();
  if (!resolvedText) {
    if (type === "like") {
      resolvedText = "hat deinen Beitrag geliked.";
    } else if (type === "comment") {
      resolvedText = "hat kommentiert.";
    } else {
      resolvedText = "hat mit deinem Beitrag interagiert.";
    }
  }

  const notification = {
    id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    postId: Number(postId),
    actorUserId: actorUser.id,
    actorName: actorUser.displayName,
    actorAvatar: actorUser.avatar,
    text: resolvedText,
    createdAt: Date.now(),
    read: false,
  };
  getUserNotifications(recipientUserId).unshift(notification);
  return notification;
}

function toCommentPayload(comment) {
  return {
    id: comment.id,
    postId: comment.postId,
    userId: comment.userId,
    userName: comment.userName,
    userAvatar: comment.userAvatar,
    text: comment.text,
    createdAt: comment.createdAt,
  };
}

function toNotificationPayload(notification) {
  return {
    id: notification.id,
    type: notification.type,
    postId: notification.postId,
    actorUserId: notification.actorUserId,
    actorName: notification.actorName,
    actorAvatar: notification.actorAvatar,
    text: notification.text,
    message: notification.text,
    createdAt: notification.createdAt,
    read: Boolean(notification.read),
  };
}

function toLikesPayload(userId) {
  const likes = getUserLikes(userId);
  const payload = {};
  for (let index = 0; index < posts.length; index += 1) {
    const postId = Number(posts[index].id);
    if (likes[postId] === true) {
      payload[postId] = true;
    }
  }
  return payload;
}

function toPostPayload(post) {
  const comments = getPostComments(post.id);
  return {
    id: post.id,
    user: post.user,
    ownerId: post.ownerId,
    bio: post.bio,
    avatar: post.avatar,
    images: Array.isArray(post.images) ? post.images : [],
    commentCount: comments.length,
  };
}

function signToken(user) {
  return jwt.sign({ sub: user.id, username: user.username }, JWT_SECRET, {
    expiresIn: "7d",
  });
}

function getUserFromAuthHeader(req) {
  const auth = req.headers.authorization || "";
  if (!auth.startsWith("Bearer ")) {
    return null;
  }

  const token = auth.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    return users.find((user) => user.id === payload.sub) || null;
  } catch (error) {
    return null;
  }
}

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.post("/api/auth/register", async (req, res) => {
  const username = normalizeUsername(req.body?.username);
  const email = normalizeEmail(req.body?.email);
  const password = String(req.body?.password || "").trim();
  const marketingOptIn = req.body?.marketingOptIn === true;
  const displayName = String(req.body?.displayName || "").trim() || username;

  if (!username) {
    return res.status(400).json({ error: "Bitte einen Username eingeben." });
  }
  if (!email) {
    return res.status(400).json({ error: "Bitte eine E-Mail-Adresse eingeben." });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: "Bitte eine gueltige E-Mail-Adresse eingeben." });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Passwort muss mindestens 6 Zeichen haben." });
  }
  if (!marketingOptIn) {
    return res.status(400).json({ error: "Bitte der Verifizierung und den Marketing-E-Mails zustimmen." });
  }
  if (users.some((user) => user.username === username)) {
    return res.status(409).json({ error: "Username ist bereits vergeben." });
  }
  if (users.some((user) => user.email === email)) {
    return res.status(409).json({ error: "E-Mail ist bereits registriert." });
  }

  const createdUser = {
    id: `u-${Date.now()}`,
    username,
    email,
    emailVerified: false,
    marketingOptIn: true,
    passwordHash: await bcrypt.hash(password, 10),
    displayName,
    bio: "Neues Mitglied bei KUNST",
    avatar: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(displayName)}`,
  };

  users.unshift(createdUser);

  return res.status(201).json({
    token: signToken(createdUser),
    user: toPublicUser(createdUser),
    verificationRequired: true,
    verificationMessage: "Bitte bestaetige deine E-Mail-Adresse. Der Verifizierungslink wurde versendet.",
  });
});

app.post("/api/auth/login", async (req, res) => {
  const username = normalizeUsername(req.body?.username);
  const password = String(req.body?.password || "").trim();

  if (!username || !password) {
    return res.status(400).json({ error: "Bitte Username und Passwort eingeben." });
  }

  const user = users.find((item) => item.username === username);
  if (!user) {
    return res.status(401).json({ error: "Login fehlgeschlagen. Bitte Daten pruefen." });
  }

  const matches = await bcrypt.compare(password, user.passwordHash);
  if (!matches) {
    return res.status(401).json({ error: "Login fehlgeschlagen. Bitte Daten pruefen." });
  }

  // Ensure deterministic default for demo users: first login starts with no likes.
  if (!likesByUserId.has(user.id)) {
    likesByUserId.set(user.id, {});
  }

  return res.json({
    token: signToken(user),
    user: toPublicUser(user),
  });
});

app.get("/api/auth/me", (req, res) => {
  const user = getUserFromAuthHeader(req);
  if (!user) {
    return res.status(401).json({ error: "Nicht autorisiert." });
  }
  return res.json({ user: toPublicUser(user) });
});

app.put("/api/auth/profile", (req, res) => {
  const user = getUserFromAuthHeader(req);
  if (!user) {
    return res.status(401).json({ error: "Nicht autorisiert." });
  }

  const displayName = String(req.body?.displayName || "").trim();
  const bio = String(req.body?.bio || "").trim();
  const avatar = String(req.body?.avatar || "").trim();

  if (displayName.length < 2) {
    return res.status(400).json({ error: "Anzeigename muss mindestens 2 Zeichen haben." });
  }

  user.displayName = displayName;
  user.bio = bio;
  user.avatar =
    avatar || `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(displayName)}`;

  for (let index = 0; index < posts.length; index += 1) {
    if (posts[index].ownerId === user.id) {
      posts[index].user = user.displayName;
      posts[index].bio = user.bio;
      posts[index].avatar = user.avatar;
    }
  }

  commentsByPostId.forEach((comments) => {
    for (let index = 0; index < comments.length; index += 1) {
      if (comments[index].userId === user.id) {
        comments[index].userName = user.displayName;
        comments[index].userAvatar = user.avatar;
      }
    }
  });

  notificationsByUserId.forEach((notifications) => {
    for (let index = 0; index < notifications.length; index += 1) {
      if (notifications[index].actorUserId === user.id) {
        notifications[index].actorName = user.displayName;
        notifications[index].actorAvatar = user.avatar;
      }
    }
  });

  return res.json({ user: toPublicUser(user) });
});

app.put("/api/auth/password", async (req, res) => {
  const user = getUserFromAuthHeader(req);
  if (!user) {
    return res.status(401).json({ error: "Nicht autorisiert." });
  }

  const currentPassword = String(req.body?.currentPassword || "").trim();
  const newPassword = String(req.body?.newPassword || "").trim();
  const confirmPassword = String(req.body?.confirmPassword || "").trim();

  if (!currentPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({ error: "Bitte alle Passwort-Felder ausfuellen." });
  }

  const matches = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!matches) {
    return res.status(400).json({ error: "Aktuelles Passwort ist nicht korrekt." });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: "Neues Passwort muss mindestens 6 Zeichen haben." });
  }
  if (newPassword !== confirmPassword) {
    return res.status(400).json({ error: "Neues Passwort und Bestaetigung stimmen nicht ueberein." });
  }
  if (newPassword === currentPassword) {
    return res.status(400).json({ error: "Neues Passwort muss sich vom alten unterscheiden." });
  }

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  return res.json({ ok: true });
});

app.get("/api/feed", (req, res) => {
  const user = getUserFromAuthHeader(req);
  if (!user) {
    return res.status(401).json({ error: "Nicht autorisiert." });
  }

  const orderedPosts = [...posts].sort((first, second) => Number(second.id) - Number(first.id));

  return res.json({
    posts: orderedPosts.map(toPostPayload),
    likes: toLikesPayload(user.id),
  });
});

app.post("/api/feed/posts", (req, res) => {
  const user = getUserFromAuthHeader(req);
  if (!user) {
    return res.status(401).json({ error: "Nicht autorisiert." });
  }

  const imageUrl = String(req.body?.imageUrl || "").trim();
  if (!imageUrl) {
    return res.status(400).json({ error: "Bild-URL darf nicht leer sein." });
  }

  const createdPost = {
    id: Date.now(),
    ownerId: user.id,
    user: user.displayName,
    bio: user.bio,
    avatar: user.avatar,
    images: [imageUrl],
  };

  posts.unshift(createdPost);
  return res.status(201).json({ post: toPostPayload(createdPost) });
});

app.delete("/api/feed/posts/:postId", (req, res) => {
  const user = getUserFromAuthHeader(req);
  if (!user) {
    return res.status(401).json({ error: "Nicht autorisiert." });
  }

  const postId = Number(req.params.postId);
  if (!Number.isFinite(postId)) {
    return res.status(400).json({ error: "Ungueltige Post-ID." });
  }

  const postIndex = posts.findIndex((post) => Number(post.id) === postId);
  if (postIndex < 0) {
    return res.status(404).json({ error: "Post nicht gefunden." });
  }
  if (posts[postIndex].ownerId !== user.id) {
    return res.status(403).json({ error: "Nur der Ersteller darf diesen Beitrag loeschen." });
  }

  posts.splice(postIndex, 1);
  commentsByPostId.delete(postId);

  likesByUserId.forEach((likes) => {
    if (likes && Object.prototype.hasOwnProperty.call(likes, postId)) {
      delete likes[postId];
    }
  });

  notificationsByUserId.forEach((notifications, recipientUserId) => {
    if (!Array.isArray(notifications) || notifications.length === 0) {
      return;
    }
    const filtered = notifications.filter((notification) => Number(notification.postId) !== postId);
    if (filtered.length !== notifications.length) {
      notificationsByUserId.set(recipientUserId, filtered);
    }
  });

  return res.json({ ok: true, postId });
});

app.put("/api/feed/likes/:postId", (req, res) => {
  const user = getUserFromAuthHeader(req);
  if (!user) {
    return res.status(401).json({ error: "Nicht autorisiert." });
  }

  const postId = Number(req.params.postId);
  if (!Number.isFinite(postId)) {
    return res.status(400).json({ error: "Ungueltige Post-ID." });
  }

  const post = getPostById(postId);
  if (!post) {
    return res.status(404).json({ error: "Post nicht gefunden." });
  }

  const requestedLiked = req.body?.liked;
  const likes = getUserLikes(user.id);
  const nextLiked = typeof requestedLiked === "boolean" ? requestedLiked : !Boolean(likes[postId]);
  likes[postId] = nextLiked;

  if (nextLiked === true) {
    createNotification({
      recipientUserId: post.ownerId,
      actorUser: user,
      type: "like",
      postId: post.id,
    });
  }

  return res.json({ liked: nextLiked, likes: toLikesPayload(user.id) });
});

app.get("/api/feed/posts/:postId/comments", (req, res) => {
  const user = getUserFromAuthHeader(req);
  if (!user) {
    return res.status(401).json({ error: "Nicht autorisiert." });
  }

  const postId = Number(req.params.postId);
  if (!Number.isFinite(postId)) {
    return res.status(400).json({ error: "Ungueltige Post-ID." });
  }

  const post = getPostById(postId);
  if (!post) {
    return res.status(404).json({ error: "Post nicht gefunden." });
  }

  const comments = getPostComments(post.id);
  const orderedComments = [...comments].sort((first, second) => Number(first.createdAt) - Number(second.createdAt));
  return res.json({ comments: orderedComments.map(toCommentPayload) });
});

app.post("/api/feed/posts/:postId/comments", (req, res) => {
  const user = getUserFromAuthHeader(req);
  if (!user) {
    return res.status(401).json({ error: "Nicht autorisiert." });
  }

  const postId = Number(req.params.postId);
  if (!Number.isFinite(postId)) {
    return res.status(400).json({ error: "Ungueltige Post-ID." });
  }

  const post = getPostById(postId);
  if (!post) {
    return res.status(404).json({ error: "Post nicht gefunden." });
  }

  const text = String(req.body?.text || "").trim();
  if (!text) {
    return res.status(400).json({ error: "Kommentar darf nicht leer sein." });
  }
  if (text.length > 300) {
    return res.status(400).json({ error: "Kommentar darf maximal 300 Zeichen haben." });
  }

  const comment = {
    id: Date.now(),
    postId: post.id,
    userId: user.id,
    userName: user.displayName,
    userAvatar: user.avatar,
    text,
    createdAt: Date.now(),
  };
  getPostComments(post.id).push(comment);

  createNotification({
    recipientUserId: post.ownerId,
    actorUser: user,
    type: "comment",
    postId: post.id,
    text: text.slice(0, 200),
  });

  return res.status(201).json({ comment: toCommentPayload(comment) });
});

app.get("/api/notifications", (req, res) => {
  const user = getUserFromAuthHeader(req);
  if (!user) {
    return res.status(401).json({ error: "Nicht autorisiert." });
  }

  const notifications = getUserNotifications(user.id);
  const orderedNotifications = [...notifications].sort(
    (first, second) => Number(second.createdAt) - Number(first.createdAt),
  );
  return res.json({
    notifications: orderedNotifications.map(toNotificationPayload),
    unreadCount: orderedNotifications.filter((notification) => !notification.read).length,
  });
});

app.put("/api/notifications/read-all", (req, res) => {
  const user = getUserFromAuthHeader(req);
  if (!user) {
    return res.status(401).json({ error: "Nicht autorisiert." });
  }

  const notifications = getUserNotifications(user.id);
  for (let index = 0; index < notifications.length; index += 1) {
    notifications[index].read = true;
  }
  return res.json({ ok: true });
});

app.put("/api/notifications/:notificationId/read", (req, res) => {
  const user = getUserFromAuthHeader(req);
  if (!user) {
    return res.status(401).json({ error: "Nicht autorisiert." });
  }

  const notificationId = String(req.params.notificationId || "").trim();
  if (!notificationId) {
    return res.status(400).json({ error: "Ungueltige Notification-ID." });
  }

  const notifications = getUserNotifications(user.id);
  const notification = notifications.find((item) => item.id === notificationId);
  if (!notification) {
    return res.status(404).json({ error: "Notification nicht gefunden." });
  }

  notification.read = true;
  return res.json({ notification: toNotificationPayload(notification) });
});

app.post("/api/posts", (req, res) => {
  const user = getUserFromAuthHeader(req);
  if (!user) {
    return res.status(401).json({ error: "Nicht autorisiert." });
  }

  const imageUrl = String(req.body?.imageUrl || "").trim();
  if (!imageUrl) {
    return res.status(400).json({ error: "Bild-URL darf nicht leer sein." });
  }

  const createdPost = {
    id: Date.now(),
    ownerId: user.id,
    user: user.displayName,
    bio: user.bio,
    avatar: user.avatar,
    images: [imageUrl],
  };

  posts.unshift(createdPost);
  return res.status(201).json({ post: toPostPayload(createdPost) });
});

app.post("/api/posts/:postId/like", (req, res) => {
  const user = getUserFromAuthHeader(req);
  if (!user) {
    return res.status(401).json({ error: "Nicht autorisiert." });
  }

  const postId = Number(req.params.postId);
  if (!Number.isFinite(postId)) {
    return res.status(400).json({ error: "Ungueltige Post-ID." });
  }

  const postExists = posts.some((post) => Number(post.id) === postId);
  if (!postExists) {
    return res.status(404).json({ error: "Post nicht gefunden." });
  }

  const requestedLiked = req.body?.liked;
  const likes = getUserLikes(user.id);
  const nextLiked = typeof requestedLiked === "boolean" ? requestedLiked : !Boolean(likes[postId]);
  likes[postId] = nextLiked;

  return res.json({ liked: nextLiked, likes: toLikesPayload(user.id) });
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`KUNST API listening on http://localhost:${PORT}`);
});
