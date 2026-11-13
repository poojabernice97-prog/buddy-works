import type {
  BuddyDecisionRow,
  BuddyPrivateThoughtRow,
  BuddyProfile,
  BuddyProjectRow,
  BuddyRaidRow,
} from "../../server/memory-client.ts";

export interface MorningMemorySourceRow {
  readonly source: string;
  readonly label: string | null;
  readonly last_synced_at: string | null;
}

export interface MorningCheckInContext {
  readonly profile: BuddyProfile;
  readonly projects: readonly BuddyProjectRow[];
  readonly openRaidByProject: Readonly<Record<string, readonly BuddyRaidRow[]>>;
  readonly recentDecisionsByProject: Readonly<
    Record<string, readonly BuddyDecisionRow[]>
  >;
  readonly privateThoughts: readonly BuddyPrivateThoughtRow[];
  readonly memorySources: readonly MorningMemorySourceRow[];
  readonly transcriptSnippets: readonly { source: string; excerpt: string }[];
}

/** Weekday 9:00 in the owner's zone — Hermes routine uses this unless overridden. */
export const MORNING_CHECK_IN_CRON = "0 9 * * 1-5";

export const MORNING_ROUTINE_TITLE = "Morning portfolio check-in";

/**
 * Instruction for Hermes's weekday routine: strategic opening only — never a status dump,
 * never outbound actions.
 */
export function buildMorningCheckInInstruction(
  context: MorningCheckInContext,
): string {
  const memoryBlock = formatMemoryBlock(context);
  return [
    "You are Hermes running Buddy's **morning check-in** (private conversation only).",
    "",
    "Read the portfolio snapshot below. Open with **two or three** strategic questions or risk alerts.",
    "Never deliver a status dump, backlog list, or bullet inventory of everything you see.",
    "Do not send Slack, email, calendar invites, or tickets — this turn stays in chat.",
    "Label each claim as fact, inference, or general_practice when you cite memory.",
    "",
    "If pushback questions were already answered in recent memory, build on them instead of repeating.",
    "",
    "--- Portfolio snapshot (server-provided) ---",
    memoryBlock,
    "--- End snapshot ---",
    "",
    "Now greet the PM briefly and ask your two or three highest-leverage questions.",
  ].join("\n");
}

function formatMemoryBlock(context: MorningCheckInContext): string {
  const lines: string[] = [];
  lines.push(`Pushback level: ${context.profile.pushback_level}`);

  if (context.projects.length === 0) {
    lines.push("Projects: none recorded yet.");
  } else {
    for (const project of context.projects) {
      lines.push(
        `Project: ${project.name}${project.goal ? ` — goal: ${project.goal}` : ""}`,
      );
      const raid = context.openRaidByProject[project.id] ?? [];
      const open = raid.filter((item) => item.status === "open");
      if (open.length > 0) {
        lines.push(
          `  Open RAID (${open.length}): ${open
            .slice(0, 5)
            .map((item) => `${item.kind}: ${item.title}`)
            .join("; ")}`,
        );
      }
      const decisions = context.recentDecisionsByProject[project.id] ?? [];
      if (decisions.length > 0) {
        lines.push(
          `  Recent decisions: ${decisions
            .slice(0, 3)
            .map((row) => row.decision)
            .join(" | ")}`,
        );
      }
    }
  }

  if (context.memorySources.length > 0) {
    lines.push(
      `Uploaded sources: ${context.memorySources
        .map(
          (row) =>
            `${row.source}${row.last_synced_at ? ` (synced ${row.last_synced_at})` : ""}`,
        )
        .join(", ")}`,
    );
  }

  if (context.transcriptSnippets.length > 0) {
    lines.push("Transcript excerpts:");
    for (const snippet of context.transcriptSnippets.slice(0, 3)) {
      lines.push(`  [${snippet.source}] ${snippet.excerpt.slice(0, 400)}`);
    }
  }

  if (context.privateThoughts.length > 0) {
    lines.push(
      `Private thoughts (Hermes only — do not quote verbatim): ${context.privateThoughts.length} on file`,
    );
  }

  return lines.join("\n");
}
