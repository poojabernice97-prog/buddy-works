import {
  buildMorningCheckInInstruction,
  MORNING_CHECK_IN_CRON,
  MORNING_ROUTINE_TITLE,
} from "../lib/routine/morning-check-in";
import {
  type BuddyMemoryClient,
  createBuddyMemoryClientFromEnv,
} from "./memory-client";
import { loadMorningCheckInContext } from "./morning-context";

export {
  BUDDY_MEMORY_APP,
  BUDDY_MEMORY_TOOL_NAMES,
  BUDDY_MEMORY_TOOLS,
} from "./memory-tools";
export { useBuddyMemoryClient } from "./morning-context";
export {
  buddyAgentUsesPushbackPreflight,
  formatPushbackPreflight,
} from "./preflight";
export { callBuddyMemoryTool } from "./tool-handlers";
export {
  buildMorningCheckInInstruction,
  loadMorningCheckInContext,
  MORNING_CHECK_IN_CRON,
  MORNING_ROUTINE_TITLE,
};

export function buddyMemoryConfigured(): boolean {
  return Boolean(
    process.env.SUPABASE_URL?.trim() &&
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
  );
}

export function tryCreateBuddyMemoryClient(): BuddyMemoryClient | null {
  if (!buddyMemoryConfigured()) return null;
  try {
    return createBuddyMemoryClientFromEnv();
  } catch {
    return null;
  }
}

/** Assemble Hermes morning routine instruction for a firing turn. */
export async function morningRoutineInstructionFor(
  ownerId: string,
): Promise<string> {
  const context = await loadMorningCheckInContext(ownerId);
  return buildMorningCheckInInstruction(context);
}
