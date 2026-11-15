import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import Home from "./page";

test("renders the app name and prompt box", () => {
  render(<Home />);
  expect(screen.getByRole("heading", { name: "Alpha Scout" })).toBeDefined();
  expect(screen.getByRole("textbox", { name: "Prompt" })).toBeDefined();
  expect(screen.getByRole("button", { name: "Submit" })).toHaveProperty("disabled", true);
});
