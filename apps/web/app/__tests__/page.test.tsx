import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import Home from "../page";

describe("Home", () => {
  it("renders the heading", () => {
    render(<Home />);
    expect(
      screen.getByText("Monorepo activo de backend y frontend."),
    ).toBeInTheDocument();
  });

  it("renders the backend and workspace cards", () => {
    render(<Home />);
    expect(screen.getByText("Backend API")).toBeInTheDocument();
    expect(screen.getByText("Workspace")).toBeInTheDocument();
  });
});
