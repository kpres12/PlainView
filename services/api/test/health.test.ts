import { describe, it, expect } from "vitest";
import { MODULES } from "@plainview/shared";

describe("MODULES", () => {
  it("exposes 4 modules", () => {
    expect(MODULES.length).toBe(4);
  });
});
