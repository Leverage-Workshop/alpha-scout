import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import Home from "./page";

test("renders the app name", () => {
  render(<Home />);
  expect(screen.getByRole("heading", { name: "Alpha Scout" })).toBeDefined();
});
