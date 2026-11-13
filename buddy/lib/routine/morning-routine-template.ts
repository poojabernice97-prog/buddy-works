import {
  MORNING_CHECK_IN_CRON,
  MORNING_ROUTINE_TITLE,
} from "./morning-check-in.ts";

/**
 * Short standing instruction stored on the routine row; the server replaces it at fire time
 * with a fresh portfolio snapshot (see `enrichBuddyRoutineInstruction`).
 */
export const MORNING_ROUTINE_STUB_INSTRUCTION =
  "Run Buddy morning check-in: load portfolio memory and open with strategic questions (instruction enriched at runtime).";

export const morningRoutineDefaults = {
  title: MORNING_ROUTINE_TITLE,
  cron: MORNING_CHECK_IN_CRON,
  instruction: MORNING_ROUTINE_STUB_INSTRUCTION,
  agentId: "hermes" as const,
};
