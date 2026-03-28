import { fireEvent, render, screen } from "@testing-library/react";
import App from "./App";

let mockUser;
let currentPassword;
const validToken = "test-token";
let mockPosts;
let likedPostIds;

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
      createdAt: Date.now() - 1000,
    },
    {
      id: 2,
      ownerId: "u-pluesch",
      user: "Pluesch",
      bio: "Abstract emotions",
      avatar: "https://api.dicebear.com/9.x/initials/svg?seed=Pluesch",
      images: ["https://picsum.photos/seed/pluesch-1/900/600"],
      createdAt: Date.now(),
    },
  ];
  likedPostIds = new Set([1]);

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
      const nextDisplayName = String(body.displayName || "").trim() || normalizedUsername;
      mockUser = {
        id: "u-new",
        username: normalizedUsername,
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

    if (endpoint === "/api/posts" && method === "GET") {
      if (!isAuthorized) {
        return createJsonResponse(401, { message: "Nicht autorisiert." });
      }
      return createJsonResponse(200, { posts: mockPosts });
    }

    if (endpoint === "/api/posts" && method === "POST") {
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
        createdAt: Date.now(),
      };
      mockPosts = [createdPost, ...mockPosts];
      return createJsonResponse(201, { post: createdPost });
    }

    if (endpoint === "/api/likes" && method === "GET") {
      if (!isAuthorized) {
        return createJsonResponse(401, { message: "Nicht autorisiert." });
      }
      const likes = {};
      Array.from(likedPostIds).forEach((id) => {
        likes[id] = true;
      });
      return createJsonResponse(200, { likes });
    }

    if (endpoint === "/api/likes/toggle" && method === "POST") {
      if (!isAuthorized) {
        return createJsonResponse(401, { message: "Nicht autorisiert." });
      }
      const postId = Number(body.postId);
      if (!postId) {
        return createJsonResponse(400, { message: "Ungueltige Post-ID." });
      }
      if (likedPostIds.has(postId)) {
        likedPostIds.delete(postId);
      } else {
        likedPostIds.add(postId);
      }
      return createJsonResponse(200, { liked: likedPostIds.has(postId) });
    }

    return createJsonResponse(404, { message: "Not found" });
  });
});

afterEach(() => {
  delete global.fetch;
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
  const showButtons = screen.getAllByRole("button", { name: "Anzeigen" });
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
  fireEvent.click(screen.getByRole("button", { name: "Logout" }));

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
  fireEvent.change(screen.getByPlaceholderText("Mindestens 6 Zeichen"), {
    target: { value: "Test123!" },
  });

  expect(screen.getByText(/Passwortstaerke:/)).toBeInTheDocument();
});
