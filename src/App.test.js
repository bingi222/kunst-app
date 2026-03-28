import { fireEvent, render, screen } from "@testing-library/react";
import App from "./App";

beforeEach(() => {
  window.localStorage.clear();
});

test("renders login screen initially", () => {
  render(<App />);
  expect(screen.getByRole("heading", { name: "KUNST Login" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Anmelden" })).toBeInTheDocument();
});

test("allows demo user login and shows app navigation", () => {
  render(<App />);

  fireEvent.change(screen.getByPlaceholderText("z. B. bingi"), {
    target: { value: "bingi" },
  });
  fireEvent.change(screen.getByPlaceholderText("Dein Passwort"), {
    target: { value: "kunst123" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Anmelden" }));

  expect(screen.getByText("KUNST")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Home" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Upload" })).toBeInTheDocument();
});

test("allows changing profile password", () => {
  render(<App />);

  fireEvent.change(screen.getByPlaceholderText("z. B. bingi"), {
    target: { value: "bingi" },
  });
  fireEvent.change(screen.getByPlaceholderText("Dein Passwort"), {
    target: { value: "kunst123" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Anmelden" }));

  fireEvent.click(screen.getByRole("button", { name: "Mein Profil" }));
  fireEvent.change(screen.getByPlaceholderText("Aktuelles Passwort"), {
    target: { value: "kunst123" },
  });
  fireEvent.change(screen.getByPlaceholderText("Neues Passwort"), {
    target: { value: "newpass123" },
  });
  fireEvent.change(screen.getByPlaceholderText("Neues Passwort bestaetigen"), {
    target: { value: "newpass123" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Passwort aktualisieren" }));
  fireEvent.click(screen.getByRole("button", { name: "Logout" }));

  fireEvent.change(screen.getByPlaceholderText("z. B. bingi"), {
    target: { value: "bingi" },
  });
  fireEvent.change(screen.getByPlaceholderText("Dein Passwort"), {
    target: { value: "kunst123" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Anmelden" }));
  expect(screen.getByText("Login fehlgeschlagen. Bitte Daten pruefen.")).toBeInTheDocument();

  fireEvent.change(screen.getByPlaceholderText("z. B. bingi"), {
    target: { value: "bingi" },
  });
  fireEvent.change(screen.getByPlaceholderText("Dein Passwort"), {
    target: { value: "newpass123" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Anmelden" }));
  expect(screen.getByText("KUNST")).toBeInTheDocument();
});
