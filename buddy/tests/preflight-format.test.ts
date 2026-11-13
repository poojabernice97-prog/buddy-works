import { describe, expect, test } from "bun:test";
import { formatPushbackPreflight } from "../server/preflight.ts";

describe("formatPushbackPreflight", () => {
  test("returns null when no triggers", () => {
    expect(
      formatPushbackPreflight(
        "We reviewed the RAID log yesterday.",
        "standard",
      ),
    ).toBeNull();
  });

  test("embeds deterministic questions for vague stakeholder text", () => {
    const block = formatPushbackPreflight(
      "Stakeholders are on board and we ship Friday.",
      "standard",
    );
    expect(block).not.toBeNull();
    expect(block).toContain("Pushback pre-flight");
    expect(block).toContain("stakeholders_vague_alignment");
    expect(block).toMatch(/1\./);
  });

  test("tough mode instructs withhold drafts", () => {
    const block = formatPushbackPreflight(
      "Everyone agrees it should be fine.",
      "tough",
    );
    expect(block).toContain("do not draft");
  });
});
