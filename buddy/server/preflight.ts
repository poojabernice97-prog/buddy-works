import { detectPushbackTriggers } from "../lib/pushback/detect";
import type { PushbackLevel } from "../lib/pushback/types";

const PREFLIGHT_AGENTS = new Set(["buddy", "hermes", "athena", "hercules"]);

export function buddyAgentUsesPushbackPreflight(agentId: string): boolean {
  return PREFLIGHT_AGENTS.has(agentId);
}

/**
 * Deterministic pushback questions appended to the standing role for this turn.
 * The model must ask these (or cite memory that answers them) before drafting outward work.
 */
export function formatPushbackPreflight(
  userMessage: string,
  level: PushbackLevel,
): string | null {
  const result = detectPushbackTriggers(userMessage, level);
  if (result.questions.length === 0) {
    return null;
  }

  const lines = [
    "## Pushback pre-flight (deterministic — ask before drafting)",
    `Detected ${result.triggers.length} trigger(s) at **${result.level}** level.`,
  ];

  if (result.withholdDrafts) {
    lines.push(
      "**Tough mode:** do not draft tickets, invites, or outbound messages until the PM answers the questions below.",
    );
  }

  lines.push("");
  lines.push(
    "Ask these questions in order (skip any already answered in portfolio memory):",
  );
  for (const [index, question] of result.questions.entries()) {
    lines.push(`${index + 1}. ${question}`);
  }

  lines.push("");
  lines.push(
    "Triggers matched: " +
      result.triggers
        .map((trigger) => `${trigger.id} ("${trigger.matchedText}")`)
        .join("; "),
  );

  return lines.join("\n");
}
