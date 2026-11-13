import { describe, expect, test } from "bun:test";
import {
  formatTradeOffBriefMarkdown,
  validateTradeOffBrief,
} from "../lib/brief/trade-off-brief.ts";

const validBrief = {
  decision: "Communicate dashboard ship timing to the client",
  options: [
    {
      name: "Commit to 28th",
      tradesAway: "Buffer if the data pipeline slips",
    },
    {
      name: "Give a date range",
      tradesAway: "A firm single date for procurement",
    },
  ],
  dependencies: [
    {
      description: "Data pipeline ready",
      owner: "Dev",
    },
  ],
  stakeholders: ["Client sponsor", "Engineering lead"],
  workOwner: "PM",
  dueDate: "2026-11-20",
  acceptanceCriteria: "Client acknowledges the plan in writing",
};

describe("validateTradeOffBrief", () => {
  test("accepts a complete brief", () => {
    const result = validateTradeOffBrief(validBrief);
    expect(result.valid).toBe(true);
    expect(result.value?.decision).toBe(validBrief.decision);
  });

  test("rejects missing decision and options", () => {
    const result = validateTradeOffBrief({
      ...validBrief,
      decision: "  ",
      options: [],
    });
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.path === "decision")).toBe(true);
    expect(result.issues.some((i) => i.path === "options")).toBe(true);
  });

  test("requires dependency owner when dependencies are listed", () => {
    const result = validateTradeOffBrief({
      ...validBrief,
      dependencies: [{ description: "API contract signed", owner: "" }],
    });
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.path === "dependencies[0].owner")).toBe(
      true,
    );
  });

  test("formatTradeOffBriefMarkdown includes fixed sections", () => {
    const parsed = validateTradeOffBrief(validBrief);
    expect(parsed.valid).toBe(true);
    const markdown = formatTradeOffBriefMarkdown(parsed.value!);
    expect(markdown).toContain("## Trade-off brief");
    expect(markdown).toContain("**Decision:**");
    expect(markdown).toContain("Acceptance criteria");
  });
});
