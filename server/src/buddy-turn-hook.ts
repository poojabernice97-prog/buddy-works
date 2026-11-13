import type { Message, RunAgentInput } from "@ag-ui/client";
import type { PushbackLevel } from "../../buddy/lib/pushback/types";
import {
  buddyAgentUsesPushbackPreflight,
  formatPushbackPreflight,
  morningRoutineInstructionFor,
  MORNING_ROUTINE_TITLE,
  tryCreateBuddyMemoryClient,
} from "../../buddy/server/openbot-wiring";

function isBuddyTenant(): boolean {
  const dir = process.env.TENANT_PACKAGE_DIR ?? "";
  return dir.replace(/\\/g, "/").includes("/buddy/");
}

function latestUserText(messages: readonly Message[]): string | undefined {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message?.role !== "user") continue;
    const content = message.content;
    if (typeof content === "string" && content.trim()) return content.trim();
  }
  return undefined;
}

function actorUserIdFrom(input: RunAgentInput): string | undefined {
  const props = input.forwardedProps;
  if (!props || typeof props !== "object") return undefined;
  const telemetry = (props as Record<string, unknown>).openbotTelemetry;
  if (!telemetry || typeof telemetry !== "object") return undefined;
  const userId = (telemetry as Record<string, unknown>).user_id;
  return typeof userId === "string" ? userId : undefined;
}

/** Deterministic pushback block for the built-in prompt (Phase 1b). */
export async function resolveBuddyPushbackPreflight(
  agentId: string,
  input: RunAgentInput,
): Promise<string | undefined> {
  if (!isBuddyTenant()) return undefined;
  if (!buddyAgentUsesPushbackPreflight(agentId)) return undefined;
  const userText = latestUserText(input.messages);
  if (!userText) return undefined;

  let level: PushbackLevel = "standard";
  const ownerId = actorUserIdFrom(input);
  const client = tryCreateBuddyMemoryClient();
  if (client && ownerId) {
    try {
      const profile = await client.getOrCreateProfile(ownerId);
      level = profile.pushback_level;
    } catch {
      // Fall back to standard.
    }
  }

  return formatPushbackPreflight(userText, level) ?? undefined;
}

export async function enrichBuddyRoutineInstruction(
  instruction: string,
  context: { title: string | null; agentId: string; ownerUserId: string },
): Promise<string> {
  if (!isBuddyTenant()) return instruction;
  if (context.agentId !== "hermes") return instruction;
  if (context.title !== MORNING_ROUTINE_TITLE) return instruction;
  try {
    return await morningRoutineInstructionFor(context.ownerUserId);
  } catch (error) {
    console.warn(
      JSON.stringify({
        type: "buddy-morning-routine-context-failed",
        reason: error instanceof Error ? error.message : String(error),
      }),
    );
    return instruction;
  }
}
