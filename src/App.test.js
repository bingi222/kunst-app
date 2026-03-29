import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import App from "./App";

let mockUser;
let currentPassword;
const validToken = "test-token";
let mockPosts;
let likedPostIds;
let commentsByPostId;
let notificationsByUserId;

function createJsonResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}

beforeEach(() => {
  window.localStorage.clear();
  mockUser = {
    id: "u-bingi",
    username: "bingi",
    email: "bingi@kunst.local",
    emailVerified: true,
    marketingConsent: false,
    displayName: "Bingi",
    bio: "Digital minimal art",
    avatar: "https://api.dicebear.com/9.x/initials/svg?seed=Bingi",
  };
  currentPassword = "kunst123";
  mockPosts = [
    {
      id: 1,
      ownerId: "u-bingi",
      user: "Bingi",
      bio: "Digital minimal art",
      avatar: "https://api.dicebear.com/9.x/initials/svg?seed=Bingi",
      images: ["https://picsum.photos/seed/bingi-1/900/600"],
      commentCount: 1,
      createdAt: Date.now() - 1000,
    },
    {
      id: 2,
      ownerId: "u-pluesch",
      user: "Pluesch",
      bio: "Abstract emotions",
      avatar: "https://api.dicebear.com/9.x/initials/svg?seed=Pluesch",
      images: ["https://picsum.photos/seed/pluesch-1/900/600"],
      commentCount: 0,
      createdAt: Date.now(),
    },
    {
      id: 3,
      ownerId: "u-pluesch",
      user: "Pluesch",
      bio: "Abstract emotions",
      avatar: "https://api.dicebear.com/9.x/initials/svg?seed=Pluesch",
      images: ["https://picsum.photos/seed/pluesch-2/900/600"],
      commentCount: 0,
      createdAt: Date.now() - 500,
    },
  ];
  likedPostIds = new Set([1]);
  commentsByPostId = {
    1: [
      {
        id: 5001,
        postId: 1,
        userId: "u-pluesch",
        userName: "Pluesch",
        userAvatar: "https://api.dicebear.com/9.x/initials/svg?seed=Pluesch",
        text: "Starke Farben!",
        createdAt: Date.now() - 60_000,
      },
    ],
    2: [],
  };
  notificationsByUserId = {};

  global.fetch = jest.fn(async (url, options = {}) => {
    const endpoint = new URL(url, "http://localhost").pathname;
    const method = options.method || "GET";
    const body = options.body ? JSON.parse(options.body) : {};
    const authHeader = options.headers?.Authorization || "";
    const isAuthorized = authHeader === `Bearer ${validToken}`;

    if (endpoint === "/api/auth/login" && method === "POST") {
      if (body.username === "bingi" && body.password === currentPassword) {
        return createJsonResponse(200, { token: validToken, user: mockUser });
      }
      return createJsonResponse(401, { message: "Login fehlgeschlagen. Bitte Daten pruefen." });
    }

    if (endpoint === "/api/auth/register" && method === "POST") {
      const normalizedUsername = String(body.username || "").trim().toLowerCase();
      const normalizedEmail = String(body.email || "").trim().toLowerCase();
      const nextDisplayName = String(body.displayName || "").trim() || normalizedUsername;
      if (!normalizedEmail) {
        return createJsonResponse(400, { message: "Bitte eine E-Mail-Adresse eingeben." });
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        return createJsonResponse(400, { message: "Bitte eine gueltige E-Mail-Adresse eingeben." });
      }
      if (body.marketingOptIn !== true) {
        return createJsonResponse(400, { message: "Bitte der Verifizierung und den Marketing-E-Mails zustimmen." });
      }
      mockUser = {
        id: "u-new",
        username: normalizedUsername,
        email: normalizedEmail,
        emailVerified: false,
        marketingConsent: Boolean(body.marketingOptIn),
        displayName: nextDisplayName,
        bio: "Neues Mitglied bei KUNST",
        avatar: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(nextDisplayName)}`,
      };
      currentPassword = body.password;
      return createJsonResponse(201, { token: validToken, user: mockUser });
    }

    if (endpoint === "/api/auth/me" && method === "GET") {
      if (!isAuthorized) {
        return createJsonResponse(401, { message: "Nicht autorisiert." });
      }
      return createJsonResponse(200, { user: mockUser });
    }

    if (endpoint === "/api/auth/profile" && method === "PUT") {
      if (!isAuthorized) {
        return createJsonResponse(401, { message: "Nicht autorisiert." });
      }
      mockUser = {
        ...mockUser,
        displayName: body.displayName,
        bio: body.bio,
        avatar: body.avatar,
      };
      return createJsonResponse(200, { user: mockUser });
    }

    if (endpoint === "/api/auth/password" && method === "PUT") {
      if (!isAuthorized) {
        return createJsonResponse(401, { message: "Nicht autorisiert." });
      }
      if (body.currentPassword !== currentPassword) {
        return createJsonResponse(400, { message: "Aktuelles Passwort ist nicht korrekt." });
      }
      if (body.newPassword !== body.confirmPassword) {
        return createJsonResponse(400, { message: "Neues Passwort und Bestaetigung stimmen nicht ueberein." });
      }
      currentPassword = body.newPassword;
      return createJsonResponse(200, { ok: true });
    }

    if (endpoint === "/api/feed" && method === "GET") {
      if (!isAuthorized) {
        return createJsonResponse(401, { message: "Nicht autorisiert." });
      }
      const likes = {};
      Array.from(likedPostIds).forEach((id) => {
        likes[id] = true;
      });
      const postsWithCommentCount = mockPosts.map((post) => ({
        ...post,
        commentCount: Array.isArray(commentsByPostId[post.id]) ? commentsByPostId[post.id].length : 0,
      }));
      return createJsonResponse(200, { posts: postsWithCommentCount, likes });
    }

    if (endpoint === "/api/feed/posts" && method === "POST") {
      if (!isAuthorized) {
        return createJsonResponse(401, { message: "Nicht autorisiert." });
      }
      const imageUrl = String(body.imageUrl || "").trim();
      if (!imageUrl) {
        return createJsonResponse(400, { message: "Bitte eine Bild-URL angeben." });
      }
      const createdPost = {
        id: Date.now(),
        ownerId: mockUser.id,
        user: mockUser.displayName,
        bio: mockUser.bio,
        avatar: mockUser.avatar,
        images: [imageUrl],
        commentCount: 0,
        createdAt: Date.now(),
      };
      mockPosts = [createdPost, ...mockPosts];
      return createJsonResponse(201, { post: createdPost });
    }

    if (/^\/api\/feed\/posts\/\d+$/.test(endpoint) && method === "DELETE") {
      if (!isAuthorized) {
        return createJsonResponse(401, { message: "Nicht autorisiert." });
      }
      const postId = Number(endpoint.split("/").pop());
      const targetPost = mockPosts.find((post) => Number(post.id) === postId);
      if (!targetPost) {
        return createJsonResponse(404, { message: "Post nicht gefunden." });
      }
      if (targetPost.ownerId !== mockUser.id) {
        return createJsonResponse(403, { message: "Du darfst nur deine eigenen Beitraege loeschen." });
      }
      mockPosts = mockPosts.filter((post) => Number(post.id) !== postId);
      likedPostIds.delete(postId);
      commentsByPostId[postId] = [];
      return createJsonResponse(200, { ok: true });
    }

    if (endpoint === "/api/notifications" && method === "GET") {
      if (!isAuthorized) {
        return createJsonResponse(401, { message: "Nicht autorisiert." });
      }
      const notifications = notificationsByUserId[mockUser.id] || [];
      const unreadCount = notifications.filter((item) => item.read !== true).length;
      return createJsonResponse(200, { notifications, unreadCount });
    }

    if (endpoint === "/api/notifications/read-all" && method === "PUT") {
      if (!isAuthorized) {
        return createJsonResponse(401, { message: "Nicht autorisiert." });
      }
      notificationsByUserId[mockUser.id] = (notificationsByUserId[mockUser.id] || []).map((item) => ({
        ...item,
        read: true,
      }));
      return createJsonResponse(200, { ok: true });
    }

    if (endpoint.startsWith("/api/feed/likes/") && method === "PUT") {
      if (!isAuthorized) {
        return createJsonResponse(401, { message: "Nicht autorisiert." });
      }
      const postId = Number(endpoint.split("/").pop());
      if (!postId) {
        return createJsonResponse(400, { message: "Ungueltige Post-ID." });
      }

      if (body.liked) {
        likedPostIds.add(postId);
        const post = mockPosts.find((item) => Number(item.id) === postId);
        if (post && post.ownerId !== mockUser.id) {
          notificationsByUserId[post.ownerId] = [
            {
              id: Date.now(),
              type: "like",
              postId,
              actorId: mockUser.id,
              actorName: mockUser.displayName,
              actorAvatar: mockUser.avatar,
              text: `${mockUser.displayName} hat deinen Beitrag geliked.`,
              read: false,
              createdAt: Date.now(),
            },
            ...(notificationsByUserId[post.ownerId] || []),
          ];
        }
      } else {
        likedPostIds.delete(postId);
      }
      const likes = {};
      Array.from(likedPostIds).forEach((id) => {
        likes[id] = true;
      });
      return createJsonResponse(200, { likes });
    }

    if (/^\/api\/feed\/posts\/\d+\/comments$/.test(endpoint) && method === "GET") {
      if (!isAuthorized) {
        return createJsonResponse(401, { message: "Nicht autorisiert." });
      }
      const postId = Number(endpoint.split("/")[4]);
      if (!postId || !mockPosts.some((post) => Number(post.id) === postId)) {
        return createJsonResponse(404, { message: "Post nicht gefunden." });
      }
      return createJsonResponse(200, { comments: commentsByPostId[postId] || [] });
    }

    if (/^\/api\/feed\/posts\/\d+\/comments$/.test(endpoint) && method === "POST") {
      if (!isAuthorized) {
        return createJsonResponse(401, { message: "Nicht autorisiert." });
      }
      const postId = Number(endpoint.split("/")[4]);
      if (!postId || !mockPosts.some((post) => Number(post.id) === postId)) {
        return createJsonResponse(404, { message: "Post nicht gefunden." });
      }
      const text = String(body.text || "").trim();
      if (!text) {
        return createJsonResponse(400, { message: "Kommentar darf nicht leer sein." });
      }
      if (text.length > 300) {
        return createJsonResponse(400, { message: "Kommentar darf maximal 300 Zeichen haben." });
      }

      const createdComment = {
        id: Date.now(),
        postId,
        userId: mockUser.id,
        userName: mockUser.displayName,
        userAvatar: mockUser.avatar,
        text,
        createdAt: Date.now(),
      };
      commentsByPostId[postId] = [...(commentsByPostId[postId] || []), createdComment];
      mockPosts = mockPosts.map((post) =>
        Number(post.id) === postId ? { ...post, commentCount: (post.commentCount || 0) + 1 } : post,
      );
      const post = mockPosts.find((item) => Number(item.id) === postId);
      if (post && post.ownerId !== mockUser.id) {
        notificationsByUserId[post.ownerId] = [
          {
            id: Date.now() + 1,
            type: "comment",
            postId,
            actorId: mockUser.id,
            actorName: mockUser.displayName,
            actorAvatar: mockUser.avatar,
            text: `${mockUser.displayName} hat kommentiert: "${text}"`,
            read: false,
            createdAt: Date.now(),
          },
          ...(notificationsByUserId[post.ownerId] || []),
        ];
      }
      return createJsonResponse(201, { comment: createdComment });
    }

    return createJsonResponse(404, { message: "Not found" });
  });
});

afterEach(() => {
  delete global.fetch;
  delete window.confirm;
});

test("renders login screen initially", () => {
  render(<App />);
  expect(screen.getByRole("heading", { name: "KUNST Login" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Anmelden" })).toBeInTheDocument();
});

test("allows demo user login and shows app navigation", async () => {
  render(<App />);

  fireEvent.change(screen.getByPlaceholderText("z. B. bingi"), {
    target: { value: "bingi" },
  });
  fireEvent.change(screen.getByPlaceholderText("Dein Passwort"), {
    target: { value: "kunst123" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Anmelden" }));

  expect(await screen.findByText("KUNST")).toBeInTheDocument();
  expect(await screen.findByRole("button", { name: "Home" })).toBeInTheDocument();
  expect(await screen.findByRole("button", { name: "Upload" })).toBeInTheDocument();
});

test("opens user menu from avatar button and logs out", async () => {
  render(<App />);

  fireEvent.change(screen.getByPlaceholderText("z. B. bingi"), {
    target: { value: "bingi" },
  });
  fireEvent.change(screen.getByPlaceholderText("Dein Passwort"), {
    target: { value: "kunst123" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Anmelden" }));

  const menuButton = await screen.findByRole("button", { name: "Benutzermenue oeffnen" });
  fireEvent.click(menuButton);
  const logoutFromMenu = await screen.findByRole("button", { name: "Logout aus Menue" });
  fireEvent.click(logoutFromMenu);
  expect(await screen.findByRole("heading", { name: "KUNST Login" })).toBeInTheDocument();
});

test("opens own profile from nav and allows logout from user menu", async () => {
  render(<App />);

  fireEvent.change(screen.getByPlaceholderText("z. B. bingi"), {
    target: { value: "bingi" },
  });
  fireEvent.change(screen.getByPlaceholderText("Dein Passwort"), {
    target: { value: "kunst123" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Anmelden" }));

  fireEvent.click(await screen.findByRole("button", { name: "Mein Profil" }));
  expect(await screen.findByText("Deine Werke")).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Benutzermenue oeffnen" }));
  fireEvent.click(screen.getByRole("button", { name: "Logout aus Menue" }));
  expect(await screen.findByRole("heading", { name: "KUNST Login" })).toBeInTheDocument();
});

test("allows logout directly from profile page", async () => {
  render(<App />);

  fireEvent.change(screen.getByPlaceholderText("z. B. bingi"), {
    target: { value: "bingi" },
  });
  fireEvent.change(screen.getByPlaceholderText("Dein Passwort"), {
    target: { value: "kunst123" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Anmelden" }));

  fireEvent.click(await screen.findByRole("button", { name: "Mein Profil" }));
  expect(await screen.findByText("Deine Werke")).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Logout" }));
  expect(await screen.findByRole("heading", { name: "KUNST Login" })).toBeInTheDocument();
});

test("allows changing profile password", async () => {
  render(<App />);

  fireEvent.change(screen.getByPlaceholderText("z. B. bingi"), {
    target: { value: "bingi" },
  });
  fireEvent.change(screen.getByPlaceholderText("Dein Passwort"), {
    target: { value: "kunst123" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Anmelden" }));

  fireEvent.click(await screen.findByRole("button", { name: "Mein Profil" }));
  expect(await screen.findByText("Deine Werke")).toBeInTheDocument();
  const showButtons = screen.getAllByRole("button", { name: /^Anzeigen|Verbergen$/ });
  expect(showButtons).toHaveLength(3);
  showButtons.forEach((button) => fireEvent.click(button));
  fireEvent.change(screen.getByPlaceholderText("Aktuelles Passwort"), {
    target: { value: "kunst123" },
  });
  fireEvent.change(screen.getByPlaceholderText("Neues Passwort"), {
    target: { value: "newpass123" },
  });
  expect(screen.getByText(/Passwortstaerke:/)).toBeInTheDocument();
  fireEvent.change(screen.getByPlaceholderText("Neues Passwort bestaetigen"), {
    target: { value: "newpass123" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Passwort aktualisieren" }));

  expect(await screen.findByText("Passwort wurde aktualisiert.")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Benutzermenue oeffnen" }));
  fireEvent.click(screen.getByRole("button", { name: "Logout aus Menue" }));

  fireEvent.change(screen.getByPlaceholderText("z. B. bingi"), {
    target: { value: "bingi" },
  });
  fireEvent.change(screen.getByPlaceholderText("Dein Passwort"), {
    target: { value: "kunst123" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Anmelden" }));
  expect(await screen.findByText("Login fehlgeschlagen. Bitte Daten pruefen.")).toBeInTheDocument();

  fireEvent.change(screen.getByPlaceholderText("z. B. bingi"), {
    target: { value: "bingi" },
  });
  fireEvent.change(screen.getByPlaceholderText("Dein Passwort"), {
    target: { value: "newpass123" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Anmelden" }));
  expect(await screen.findByText("KUNST")).toBeInTheDocument();
});

test("shows password strength in register mode", () => {
  render(<App />);

  fireEvent.click(screen.getByRole("button", { name: "Noch kein Konto? Jetzt registrieren" }));
  fireEvent.change(screen.getByPlaceholderText("name@beispiel.de"), {
    target: { value: "mia@example.com" },
  });
  fireEvent.click(screen.getByLabelText(/Produkt-News und Werbe-E-Mails/));
  fireEvent.change(screen.getByPlaceholderText("Mindestens 6 Zeichen"), {
    target: { value: "Test123!" },
  });

  expect(screen.getByText(/Passwortstaerke:/)).toBeInTheDocument();
});

test("requires email and consent for registration", async () => {
  render(<App />);

  fireEvent.click(screen.getByRole("button", { name: "Noch kein Konto? Jetzt registrieren" }));
  fireEvent.change(screen.getByPlaceholderText("z. B. bingi"), {
    target: { value: "newuser" },
  });
  fireEvent.change(screen.getByPlaceholderText("Mindestens 6 Zeichen"), {
    target: { value: "Test123!" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Registrieren" }));

  expect(await screen.findByText("Bitte eine E-Mail-Adresse eingeben.")).toBeInTheDocument();

  fireEvent.change(screen.getByPlaceholderText("name@beispiel.de"), {
    target: { value: "ungueltig" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Registrieren" }));
  expect(await screen.findByText("Bitte eine gueltige E-Mail-Adresse eingeben.")).toBeInTheDocument();

  fireEvent.change(screen.getByPlaceholderText("name@beispiel.de"), {
    target: { value: "newuser@example.com" },
  });
  fireEvent.click(screen.getByLabelText(/Produkt-News und Werbe-E-Mails/));
  fireEvent.click(screen.getByRole("button", { name: "Registrieren" }));

  expect(await screen.findByText("Bitte E-Mail-Verification und Marketing-Einwilligung bestaetigen.")).toBeInTheDocument();
});

test("can filter liked posts without interaction controls", async () => {
  render(<App />);

  fireEvent.change(screen.getByPlaceholderText("z. B. bingi"), {
    target: { value: "bingi" },
  });
  fireEvent.change(screen.getByPlaceholderText("Dein Passwort"), {
    target: { value: "kunst123" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Anmelden" }));

  await screen.findByRole("button", { name: "Home" });
  fireEvent.click(screen.getByRole("button", { name: "Filter anzeigen" }));

  fireEvent.click(screen.getByRole("button", { name: "Nur Likes" }));

  expect(screen.getAllByTestId(/post-/)).toHaveLength(1);
});

test("supports feed sorting by newest and most popular", async () => {
  render(<App />);

  fireEvent.change(screen.getByPlaceholderText("z. B. bingi"), {
    target: { value: "bingi" },
  });
  fireEvent.change(screen.getByPlaceholderText("Dein Passwort"), {
    target: { value: "kunst123" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Anmelden" }));

  await screen.findByRole("button", { name: "Home" });
  fireEvent.click(screen.getByRole("button", { name: "Filter anzeigen" }));

  fireEvent.click(screen.getByRole("button", { name: "Beliebteste" }));
  await waitFor(() => {
    const posts = screen.getAllByTestId(/post-/);
    expect(posts[0]).toHaveAttribute("data-testid", "post-1");
  });

  fireEvent.click(screen.getByRole("button", { name: "Neueste" }));
  await waitFor(() => {
    const posts = screen.getAllByTestId(/post-/);
    expect(posts[0]).toHaveAttribute("data-testid", "post-2");
  });
});

test("renders post cards without interaction buttons", async () => {
  render(<App />);

  fireEvent.change(screen.getByPlaceholderText("z. B. bingi"), {
    target: { value: "bingi" },
  });
  fireEvent.change(screen.getByPlaceholderText("Dein Passwort"), {
    target: { value: "kunst123" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Anmelden" }));

  await screen.findByRole("button", { name: "Home" });

  const posts = await screen.findAllByTestId(/post-/);
  expect(posts.length).toBeGreaterThan(0);
  expect(screen.queryByRole("button", { name: "Like umschalten" })).toBeNull();
  expect(screen.queryByRole("button", { name: "Kommentare anzeigen" })).toBeNull();
  expect(screen.queryByRole("button", { name: "Beitrag loeschen" })).toBeNull();
});

test("keeps feed cards image-only in default state", async () => {
  render(<App />);

  fireEvent.change(screen.getByPlaceholderText("z. B. bingi"), {
    target: { value: "bingi" },
  });
  fireEvent.change(screen.getByPlaceholderText("Dein Passwort"), {
    target: { value: "kunst123" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Anmelden" }));

  await screen.findByRole("button", { name: "Home" });
  const posts = await screen.findAllByTestId(/post-/);
  expect(posts.length).toBeGreaterThan(0);
  expect(screen.queryByRole("button", { name: "Like umschalten" })).toBeNull();
  expect(screen.queryByRole("button", { name: "Kommentare anzeigen" })).toBeNull();
});

test("shows notifications badge and marks all as read", async () => {
  notificationsByUserId["u-bingi"] = [
    {
      id: 9001,
      type: "comment",
      postId: 1,
      actorId: "u-pluesch",
      actorName: "Pluesch",
      actorAvatar: "https://api.dicebear.com/9.x/initials/svg?seed=Pluesch",
      text: "Pluesch hat kommentiert: \"Starke Farben!\"",
      read: false,
      createdAt: Date.now() - 20_000,
    },
  ];

  render(<App />);

  fireEvent.change(screen.getByPlaceholderText("z. B. bingi"), {
    target: { value: "bingi" },
  });
  fireEvent.change(screen.getByPlaceholderText("Dein Passwort"), {
    target: { value: "kunst123" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Anmelden" }));

  fireEvent.click(await screen.findByRole("button", { name: "Benutzermenue oeffnen" }));
  const activityButton = await screen.findByRole("button", { name: /Aktivitaet/ });
  await waitFor(() => {
    expect(activityButton.getAttribute("aria-label") || "").toContain("1 ungelesen");
  });
  fireEvent.click(activityButton);
  expect(await screen.findByRole("button", { name: "Als gelesen markieren" })).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Alle als gelesen markieren" }));
  expect(await screen.findByText("Keine ungelesenen Benachrichtigungen.")).toBeInTheDocument();
});

test("opens related post from activity notification", async () => {
  notificationsByUserId["u-bingi"] = [
    {
      id: 9002,
      type: "comment",
      postId: 1,
      actorId: "u-pluesch",
      actorName: "Pluesch",
      actorAvatar: "https://api.dicebear.com/9.x/initials/svg?seed=Pluesch",
      text: "Pluesch hat kommentiert: \"Starke Farben!\"",
      read: false,
      createdAt: Date.now() - 10_000,
    },
  ];

  render(<App />);

  fireEvent.change(screen.getByPlaceholderText("z. B. bingi"), {
    target: { value: "bingi" },
  });
  fireEvent.change(screen.getByPlaceholderText("Dein Passwort"), {
    target: { value: "kunst123" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Anmelden" }));

  fireEvent.click(await screen.findByRole("button", { name: "Benutzermenue oeffnen" }));
  const activityButton = await screen.findByRole("button", { name: /Aktivitaet/ });
  fireEvent.click(activityButton);

  const notifButton = await screen.findByRole("button", { name: "Zum Beitrag" });
  fireEvent.click(notifButton);

  expect(await screen.findByTestId("post-1")).toBeInTheDocument();
});

test("renders fallback notification text when message is missing", async () => {
  notificationsByUserId["u-bingi"] = [
    {
      id: 9003,
      type: "like",
      postId: 2,
      actorId: "u-pluesch",
      actorName: "Pluesch",
      actorAvatar: "https://api.dicebear.com/9.x/initials/svg?seed=Pluesch",
      text: "",
      read: false,
      createdAt: Date.now() - 5_000,
    },
  ];

  render(<App />);

  fireEvent.change(screen.getByPlaceholderText("z. B. bingi"), {
    target: { value: "bingi" },
  });
  fireEvent.change(screen.getByPlaceholderText("Dein Passwort"), {
    target: { value: "kunst123" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Anmelden" }));

  fireEvent.click(await screen.findByRole("button", { name: "Benutzermenue oeffnen" }));
  fireEvent.click(await screen.findByRole("button", { name: /Aktivitaet/ }));
  expect(await screen.findByText(/hat deinen Beitrag geliked/)).toBeInTheDocument();
});

test("supports manual feed refresh", async () => {
  render(<App />);

  fireEvent.change(screen.getByPlaceholderText("z. B. bingi"), {
    target: { value: "bingi" },
  });
  fireEvent.change(screen.getByPlaceholderText("Dein Passwort"), {
    target: { value: "kunst123" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Anmelden" }));

  await screen.findByRole("button", { name: "Home" });
  fireEvent.click(screen.getByRole("button", { name: "Benutzermenue oeffnen" }));
  await waitFor(() => {
    expect(screen.getByRole("button", { name: /Aktualisier/ })).not.toBeDisabled();
  });
  fireEvent.click(screen.getByRole("button", { name: /Aktualisier/ }));

  await waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith("/api/feed", expect.any(Object));
  });
});

test("allows undo after mark all notifications as read", async () => {
  notificationsByUserId["u-bingi"] = [
    {
      id: 9010,
      type: "comment",
      postId: 1,
      actorId: "u-pluesch",
      actorName: "Pluesch",
      actorAvatar: "https://api.dicebear.com/9.x/initials/svg?seed=Pluesch",
      text: "Pluesch hat kommentiert: \"Starke Farben!\"",
      read: false,
      createdAt: Date.now() - 30_000,
    },
  ];

  render(<App />);

  fireEvent.change(screen.getByPlaceholderText("z. B. bingi"), {
    target: { value: "bingi" },
  });
  fireEvent.change(screen.getByPlaceholderText("Dein Passwort"), {
    target: { value: "kunst123" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Anmelden" }));

  fireEvent.click(await screen.findByRole("button", { name: "Benutzermenue oeffnen" }));
  fireEvent.click(await screen.findByRole("button", { name: /Aktivitaet/ }));
  expect(await screen.findByRole("button", { name: "Als gelesen markieren" })).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Alle als gelesen markieren" }));
  expect(await screen.findByRole("button", { name: "Rueckgaengig" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Als gelesen markieren" })).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Rueckgaengig" }));
  expect(await screen.findByRole("button", { name: "Als gelesen markieren" })).toBeInTheDocument();
});

test("supports keyboard shortcuts for feed refresh and navigation", async () => {
  render(<App />);

  fireEvent.change(screen.getByPlaceholderText("z. B. bingi"), {
    target: { value: "bingi" },
  });
  fireEvent.change(screen.getByPlaceholderText("Dein Passwort"), {
    target: { value: "kunst123" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Anmelden" }));

  await screen.findByRole("button", { name: "Home" });
  const fetchCallsBefore = global.fetch.mock.calls.length;
  fireEvent.keyDown(window, { key: "r" });

  await waitFor(() => {
    expect(global.fetch.mock.calls.length).toBeGreaterThan(fetchCallsBefore);
  });

  fireEvent.keyDown(window, { key: "a" });
  expect(await screen.findByRole("heading", { name: "Aktivitaet" })).toBeInTheDocument();

  fireEvent.keyDown(window, { key: "h" });
  expect(await screen.findByRole("button", { name: "Home" })).toBeInTheDocument();
});

test("persists feed filters and allows reset", async () => {
  render(<App />);

  fireEvent.change(screen.getByPlaceholderText("z. B. bingi"), {
    target: { value: "bingi" },
  });
  fireEvent.change(screen.getByPlaceholderText("Dein Passwort"), {
    target: { value: "kunst123" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Anmelden" }));

  await screen.findByRole("button", { name: "Home" });

  const searchInput = screen.getByRole("searchbox", { name: "Suche" });
  fireEvent.change(searchInput, { target: { value: "pluesch" } });
  fireEvent.click(screen.getByRole("button", { name: "Filter anzeigen" }));
  fireEvent.click(screen.getByRole("button", { name: "Nur Likes" }));

  fireEvent.click(screen.getByRole("button", { name: "Benutzermenue oeffnen" }));
  fireEvent.click(screen.getByRole("button", { name: "Logout aus Menue" }));
  fireEvent.change(screen.getByPlaceholderText("z. B. bingi"), {
    target: { value: "bingi" },
  });
  fireEvent.change(screen.getByPlaceholderText("Dein Passwort"), {
    target: { value: "kunst123" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Anmelden" }));

  const persistedSearchInput = await screen.findByRole("searchbox", { name: "Suche" });
  expect(persistedSearchInput).toHaveValue("pluesch");

  fireEvent.click(await screen.findByRole("button", { name: "Filter anzeigen" }));
  fireEvent.click(await screen.findByRole("button", { name: "Filter zuruecksetzen" }));
  expect(screen.getByRole("searchbox", { name: "Suche" })).toHaveValue("");
});

test("persists upload draft image url", async () => {
  window.localStorage.setItem(
    "kunst-app.upload.draft.v1",
    JSON.stringify("https://picsum.photos/seed/draft-url/900/600"),
  );

  render(<App />);

  fireEvent.change(screen.getByPlaceholderText("z. B. bingi"), {
    target: { value: "bingi" },
  });
  fireEvent.change(screen.getByPlaceholderText("Dein Passwort"), {
    target: { value: "kunst123" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Anmelden" }));

  await screen.findByRole("button", { name: "Home" });
  fireEvent.click(screen.getByRole("button", { name: "Upload" }));
  expect(await screen.findByDisplayValue("https://picsum.photos/seed/draft-url/900/600")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Home" }));
  fireEvent.click(screen.getByRole("button", { name: "Upload" }));
  expect(screen.getByDisplayValue("https://picsum.photos/seed/draft-url/900/600")).toBeInTheDocument();
});

test("shows uploaded image immediately in feed after posting", async () => {
  render(<App />);

  fireEvent.change(screen.getByPlaceholderText("z. B. bingi"), {
    target: { value: "bingi" },
  });
  fireEvent.change(screen.getByPlaceholderText("Dein Passwort"), {
    target: { value: "kunst123" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Anmelden" }));

  await screen.findByRole("button", { name: "Home" });
  fireEvent.click(screen.getByRole("button", { name: "Upload" }));

  fireEvent.change(screen.getByPlaceholderText("Bild-URL einfuegen"), {
    target: { value: "https://picsum.photos/seed/new-upload-1/900/600" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Posten" }));

  expect(await screen.findByRole("button", { name: "Home" })).toBeInTheDocument();
  await waitFor(() => {
    expect(document.querySelector('img[src="https://picsum.photos/seed/new-upload-1/900/600"]')).not.toBeNull();
  });
});

test("does not render delete controls in feed cards", async () => {
  render(<App />);

  fireEvent.change(screen.getByPlaceholderText("z. B. bingi"), {
    target: { value: "bingi" },
  });
  fireEvent.change(screen.getByPlaceholderText("Dein Passwort"), {
    target: { value: "kunst123" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Anmelden" }));

  await screen.findByTestId("post-1");
  expect(screen.queryByRole("button", { name: "Beitrag loeschen" })).toBeNull();
});

test("opens and closes artwork detail modal on image click", async () => {
  render(<App />);

  fireEvent.change(screen.getByPlaceholderText("z. B. bingi"), {
    target: { value: "bingi" },
  });
  fireEvent.change(screen.getByPlaceholderText("Dein Passwort"), {
    target: { value: "kunst123" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Anmelden" }));

  const firstPost = await screen.findByTestId("post-1");
  const artworkImage = within(firstPost).getByRole("img", { name: /Artwork von/ });
  fireEvent.click(artworkImage);

  expect(await screen.findByRole("dialog", { name: "Detailansicht Kunstwerk" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Profil von Bingi anzeigen" })).toBeInTheDocument();
  expect(screen.getByText(/Likes/)).toBeInTheDocument();
  expect(screen.getByText(/vor \d+ Stunden/i)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Like visuell umschalten" })).toBeInTheDocument();
  expect(screen.getByText(/laesst den Blick langsam in die Tiefe wandern/i)).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Detailansicht schliessen" }));
  await waitFor(() => {
    expect(screen.queryByRole("dialog", { name: "Detailansicht Kunstwerk" })).not.toBeInTheDocument();
  });
});

test("provides visual like feedback in artwork detail modal", async () => {
  render(<App />);

  fireEvent.change(screen.getByPlaceholderText("z. B. bingi"), {
    target: { value: "bingi" },
  });
  fireEvent.change(screen.getByPlaceholderText("Dein Passwort"), {
    target: { value: "kunst123" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Anmelden" }));

  const firstPost = await screen.findByTestId("post-2");
  const artworkImage = within(firstPost).getByRole("img", { name: /Artwork von/ });
  fireEvent.click(artworkImage);

  const likeButton = await screen.findByRole("button", { name: "Like visuell umschalten" });
  const wasPressedInitially = likeButton.getAttribute("aria-pressed") === "true";
  fireEvent.click(likeButton);
  expect(likeButton).toHaveAttribute("aria-pressed", wasPressedInitially ? "false" : "true");
});

test("toggles follow state in artwork detail modal", async () => {
  render(<App />);

  fireEvent.change(screen.getByPlaceholderText("z. B. bingi"), {
    target: { value: "bingi" },
  });
  fireEvent.change(screen.getByPlaceholderText("Dein Passwort"), {
    target: { value: "kunst123" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Anmelden" }));

  const firstPost = await screen.findByTestId("post-1");
  const artworkImage = within(firstPost).getByRole("img", { name: /Artwork von/ });
  fireEvent.click(artworkImage);

  const followButton = await screen.findByRole("button", { name: "Kuenstler folgen umschalten" });
  expect(followButton).toHaveAttribute("aria-pressed", "false");
  expect(followButton).toHaveTextContent("Follow");
  fireEvent.click(followButton);
  await waitFor(() => {
    expect(screen.getByRole("button", { name: "Kuenstler folgen umschalten" })).toHaveAttribute("aria-pressed", "true");
  });
  expect(screen.getByRole("button", { name: "Kuenstler folgen umschalten" })).toHaveTextContent("Gefolgt");
});

test("keeps follow state for artist in detail modal", async () => {
  render(<App />);

  fireEvent.change(screen.getByPlaceholderText("z. B. bingi"), {
    target: { value: "bingi" },
  });
  fireEvent.change(screen.getByPlaceholderText("Dein Passwort"), {
    target: { value: "kunst123" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Anmelden" }));

  const foreignPost = await screen.findByTestId("post-2");
  fireEvent.click(within(foreignPost).getByRole("img", { name: /Artwork von Pluesch/i }));

  const followButton = await screen.findByRole("button", { name: "Kuenstler folgen umschalten" });
  fireEvent.click(followButton);
  await waitFor(() => {
    expect(screen.getByRole("button", { name: "Kuenstler folgen umschalten" })).toHaveAttribute("aria-pressed", "true");
  });
  fireEvent.click(screen.getByRole("button", { name: "Detailansicht schliessen" }));

  fireEvent.click(within(foreignPost).getByRole("img", { name: /Artwork von Pluesch/i }));
  const reopenedFollowButton = await screen.findByRole("button", { name: "Kuenstler folgen umschalten" });
  expect(reopenedFollowButton).toHaveAttribute("aria-pressed", "true");
});

test("opens artist profile from detail modal name click and shows stats", async () => {
  render(<App />);

  fireEvent.change(screen.getByPlaceholderText("z. B. bingi"), {
    target: { value: "bingi" },
  });
  fireEvent.change(screen.getByPlaceholderText("Dein Passwort"), {
    target: { value: "kunst123" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Anmelden" }));

  const foreignPost = await screen.findByTestId("post-2");
  fireEvent.click(within(foreignPost).getByRole("img", { name: /Artwork von Pluesch/i }));

  await screen.findByRole("dialog", { name: "Detailansicht Kunstwerk" });
  const artistButton = await screen.findByRole("button", { name: /Profil von Pluesch/i });
  fireEvent.click(artistButton);

  expect(await screen.findByRole("heading", { name: "Pluesch" })).toBeInTheDocument();
  expect(screen.getByRole("img", { name: "Pluesch Avatar" })).toBeInTheDocument();
  expect(screen.getByText(/\d+\s+Likes/)).toBeInTheDocument();
  expect(screen.getByText(/\d+\s+Werke/)).toBeInTheDocument();
  expect(screen.getAllByText(/Follower/).length).toBeGreaterThan(0);
  expect(screen.getByText("Werke")).toBeInTheDocument();
  expect(screen.getByRole("img", { name: "Werk 1 von Pluesch" })).toBeInTheDocument();
  expect(screen.getByRole("img", { name: "Werk 2 von Pluesch" })).toBeInTheDocument();
});

test("opens detail modal from artist profile artwork click", async () => {
  render(<App />);

  fireEvent.change(screen.getByPlaceholderText("z. B. bingi"), {
    target: { value: "bingi" },
  });
  fireEvent.change(screen.getByPlaceholderText("Dein Passwort"), {
    target: { value: "kunst123" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Anmelden" }));

  const foreignPost = await screen.findByTestId("post-2");
  fireEvent.click(within(foreignPost).getByRole("img", { name: /Artwork von Pluesch/i }));

  await screen.findByRole("dialog", { name: "Detailansicht Kunstwerk" });
  fireEvent.click(await screen.findByRole("button", { name: /Profil von Pluesch/i }));

  const profileArtwork = await screen.findByRole("img", { name: "Werk 2 von Pluesch" });
  fireEvent.click(profileArtwork);

  expect(await screen.findByRole("dialog", { name: "Detailansicht Kunstwerk" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Profil von Pluesch/i })).toBeInTheDocument();
});

test("applies like from artist profile artwork and updates profile likes count", async () => {
  render(<App />);

  fireEvent.change(screen.getByPlaceholderText("z. B. bingi"), {
    target: { value: "bingi" },
  });
  fireEvent.change(screen.getByPlaceholderText("Dein Passwort"), {
    target: { value: "kunst123" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Anmelden" }));

  const foreignPost = await screen.findByTestId("post-2");
  fireEvent.click(within(foreignPost).getByRole("img", { name: /Artwork von Pluesch/i }));
  fireEvent.click(await screen.findByRole("button", { name: /Profil von Pluesch/i }));

  const likesChipBefore = screen.getByText(/\d+\s+Likes/);
  const likesCountBefore = Number((likesChipBefore.textContent || "").replace(/\D/g, "")) || 0;

  const profileArtwork = await screen.findByRole("img", { name: "Werk 2 von Pluesch" });
  fireEvent.click(profileArtwork);

  const likeButton = await screen.findByRole("button", { name: "Like visuell umschalten" });
  fireEvent.click(likeButton);
  await waitFor(() => {
    expect(screen.getByRole("button", { name: "Like visuell umschalten" })).toHaveAttribute("aria-pressed", "true");
  });
  fireEvent.click(screen.getByRole("button", { name: /Profil von Pluesch/i }));

  const likesChipAfter = await screen.findByText(/\d+\s+Likes/);
  const likesCountAfter = Number((likesChipAfter.textContent || "").replace(/\D/g, "")) || 0;
  expect(likesCountAfter).toBe(likesCountBefore + 1);
});

test("shows artist profile likes in home liked filter", async () => {
  render(<App />);

  fireEvent.change(screen.getByPlaceholderText("z. B. bingi"), {
    target: { value: "bingi" },
  });
  fireEvent.change(screen.getByPlaceholderText("Dein Passwort"), {
    target: { value: "kunst123" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Anmelden" }));

  const foreignPost = await screen.findByTestId("post-2");
  fireEvent.click(within(foreignPost).getByRole("img", { name: /Artwork von Pluesch/i }));
  fireEvent.click(await screen.findByRole("button", { name: /Profil von Pluesch/i }));

  const profileArtwork = await screen.findByRole("img", { name: "Werk 2 von Pluesch" });
  fireEvent.click(profileArtwork);

  const likeButton = await screen.findByRole("button", { name: "Like visuell umschalten" });
  fireEvent.click(likeButton);
  await waitFor(() => {
    expect(screen.getByRole("button", { name: "Like visuell umschalten" })).toHaveAttribute("aria-pressed", "true");
  });
  fireEvent.click(screen.getByRole("button", { name: "Detailansicht schliessen" }));

  fireEvent.click(screen.getByRole("button", { name: "Home" }));
  fireEvent.click(screen.getByRole("button", { name: "Filter anzeigen" }));
  fireEvent.click(screen.getByRole("button", { name: "Nur Likes" }));

  const likedPosts = await screen.findAllByTestId(/post-/);
  expect(likedPosts.length).toBeGreaterThan(1);
  expect(document.querySelector('img[src="https://picsum.photos/seed/pluesch-2/900/600"]')).not.toBeNull();
});

test("keeps single-like selection when server returns malformed likes payload", async () => {
  const originalFetch = global.fetch;
  global.fetch = jest.fn(async (url, options = {}) => {
    const endpoint = new URL(url, "http://localhost").pathname;
    const method = options.method || "GET";
    const response = await originalFetch(url, options);

    if (endpoint.startsWith("/api/feed/likes/") && method === "PUT") {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          liked: true,
          likes: true,
        }),
      };
    }
    return response;
  });

  render(<App />);

  fireEvent.change(screen.getByPlaceholderText("z. B. bingi"), {
    target: { value: "bingi" },
  });
  fireEvent.change(screen.getByPlaceholderText("Dein Passwort"), {
    target: { value: "kunst123" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Anmelden" }));

  const foreignPost = await screen.findByTestId("post-2");
  fireEvent.click(within(foreignPost).getByRole("img", { name: /Artwork von Pluesch/i }));
  fireEvent.click(await screen.findByRole("button", { name: /Profil von Pluesch/i }));

  const likesChipBefore = screen.getByText(/\d+\s+Likes/);
  const likesCountBefore = Number((likesChipBefore.textContent || "").replace(/\D/g, "")) || 0;

  const profileArtwork = await screen.findByRole("img", { name: "Werk 2 von Pluesch" });
  fireEvent.click(profileArtwork);

  const likeButton = await screen.findByRole("button", { name: "Like visuell umschalten" });
  fireEvent.click(likeButton);

  await waitFor(() => {
    expect(screen.getByRole("button", { name: "Like visuell umschalten" })).toHaveAttribute("aria-pressed", "true");
  });
  fireEvent.click(screen.getByRole("button", { name: /Profil von Pluesch/i }));

  const likesChipAfter = await screen.findByText(/\d+\s+Likes/);
  const likesCountAfter = Number((likesChipAfter.textContent || "").replace(/\D/g, "")) || 0;
  expect(likesCountAfter).toBe(likesCountBefore + 1);
});

test("closes artwork detail modal via backdrop click and Escape", async () => {
  render(<App />);

  fireEvent.change(screen.getByPlaceholderText("z. B. bingi"), {
    target: { value: "bingi" },
  });
  fireEvent.change(screen.getByPlaceholderText("Dein Passwort"), {
    target: { value: "kunst123" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Anmelden" }));

  const firstPost = await screen.findByTestId("post-1");
  const artworkImage = within(firstPost).getByRole("img", { name: /Artwork von/ });
  fireEvent.click(artworkImage);

  const dialog = await screen.findByRole("dialog", { name: "Detailansicht Kunstwerk" });
  fireEvent.click(dialog);
  await waitFor(() => {
    expect(screen.queryByRole("dialog", { name: "Detailansicht Kunstwerk" })).not.toBeInTheDocument();
  });

  fireEvent.click(artworkImage);
  expect(await screen.findByRole("dialog", { name: "Detailansicht Kunstwerk" })).toBeInTheDocument();
  fireEvent.keyDown(window, { key: "Escape" });
  await waitFor(() => {
    expect(screen.queryByRole("dialog", { name: "Detailansicht Kunstwerk" })).not.toBeInTheDocument();
  });
});
