import { describe, expect, test } from "bun:test";
import { detectPushbackTriggers } from "../lib/pushback/detect.ts";

describe("detectPushbackTriggers", () => {
  test("flags date without basis and limits to three questions at standard level", () => {
    const result = detectPushbackTriggers(
      "Let's tell the client the dashboard ships on the 28th without waiting on Dev.",
      "standard",
    );
    expect(result.triggers.some((t) => t.id === "date_without_basis")).toBe(
      true,
    );
    expect(result.questions.length).toBeLessThanOrEqual(3);
    expect(result.withholdDrafts).toBe(false);
  });

  test("gentle level asks at most one question", () => {
    const result = detectPushbackTriggers(
      "Stakeholders are on board and we have no buffer on the timeline.",
      "gentle",
    );
    expect(result.questions.length).toBeLessThanOrEqual(1);
  });

  test("tough level withholds drafts when triggers fire", () => {
    const result = detectPushbackTriggers(
      "Everyone agrees and this should be fine by next Friday.",
      "tough",
    );
    expect(result.triggers.length).toBeGreaterThan(0);
    expect(result.withholdDrafts).toBe(true);
  });

  test("detects soft language and vague stakeholder alignment", () => {
    const result = detectPushbackTriggers(
      "Stakeholders are on board — it should be fine soon.",
      "standard",
    );
    const ids = result.triggers.map((t) => t.id);
    expect(ids).toContain("stakeholders_vague_alignment");
    expect(ids).toContain("soft_language");
  });

  test("detects mid-project scope and single point of failure patterns", () => {
    const result = detectPushbackTriggers(
      "The client also wants another feature; only Priya can handle the integration.",
      "standard",
    );
    const ids = result.triggers.map((t) => t.id);
    expect(ids).toContain("mid_project_request");
    expect(ids).toContain("single_point_of_failure");
  });
});
