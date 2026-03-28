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
