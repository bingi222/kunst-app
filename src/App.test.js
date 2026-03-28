import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders app title and navigation", () => {
  render(<App />);
  expect(screen.getByText("KUNST")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Home" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Upload" })).toBeInTheDocument();
});
