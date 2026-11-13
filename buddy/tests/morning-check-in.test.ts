import { describe, expect, test } from "bun:test";
import {
  buildMorningCheckInInstruction,
  type MorningCheckInContext,
} from "../lib/routine/morning-check-in.ts";

const baseContext: MorningCheckInContext = {
  profile: {
    owner_id: "00000000-0000-0000-0000-000000000001",
    pushback_level: "standard",
    working_hours: null,
    autonomy: {},
  },
  projects: [
    {
      id: "p1",
      owner_id: "00000000-0000-0000-0000-000000000001",
      name: "Launch",
      goal: "Ship v2",
      focus_area: "executing",
      approach: "hybrid",
      milestones: null,
      baseline_dates: null,
    },
  ],
  openRaidByProject: {
    p1: [
      {
        id: "r1",
        owner_id: "00000000-0000-0000-0000-000000000001",
        project_id: "p1",
        kind: "risk",
        title: "Vendor slip",
        description: null,
        status: "open",
        item_owner: null,
        due_date: null,
        source: "standup",
        label: "fact",
      },
    ],
  },
  recentDecisionsByProject: {
    p1: [
      {
        id: "d1",
        owner_id: "00000000-0000-0000-0000-000000000001",
        project_id: "p1",
        decision: "Cut scope on analytics",
        options_considered: null,
        reasoning: null,
        assumptions: null,
        review_date: null,
        source: null,
        label: "inference",
      },
    ],
  },
  privateThoughts: [],
  memorySources: [
    { source: "u/1/file.txt", label: "retro", last_synced_at: null },
  ],
  transcriptSnippets: [
    { source: "u/1/file.txt", excerpt: "Customer asked for earlier date." },
  ],
};

describe("morning check-in prompt", () => {
  test("forbids status dumps and outbound actions", () => {
    const text = buildMorningCheckInInstruction(baseContext);
    expect(text).toContain("Never deliver a status dump");
    expect(text).toContain("Do not send Slack");
    expect(text).toContain("Vendor slip");
    expect(text).toContain("Customer asked for earlier date");
  });

  test("asks for two or three strategic questions", () => {
    const text = buildMorningCheckInInstruction(baseContext);
    expect(text).toMatch(/two or three.*strategic questions/i);
  });
});
