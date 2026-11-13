import { BUDDY_MEMORY_TOOLS } from "../../../buddy/server/memory-tools";
import {
  callBuddyMemoryTool,
  tryCreateBuddyMemoryClient,
} from "../../../buddy/server/openbot-wiring";
import { type McpCallResult, type McpTool } from "./mcp";

type Connection = {
  url: string;
  token?: string;
  actorId?: string;
  botId?: string;
  threadId?: string;
};

const failure = (message: string): McpCallResult => ({
  text: message,
  isError: true,
  truncated: false,
});

function asResult(text: string, isError: boolean): McpCallResult {
  return { text, isError, truncated: false };
}

export async function listTools(): Promise<McpTool[]> {
  return BUDDY_MEMORY_TOOLS.map((tool) => ({ ...tool }));
}

export const listNeedsCredential = false;
export const listIsThisCode = true;

export async function callTool(
  connection: Connection,
  toolName: string,
  args: Record<string, unknown>,
): Promise<McpCallResult> {
  const ownerId = connection.actorId;
  if (!ownerId) {
    return failure(
      "Buddy memory refused: the run is not attributed to a person.",
    );
  }

  const client = tryCreateBuddyMemoryClient();
  if (!client) {
    return failure(
      "Buddy memory is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, and expose the buddy schema on the Supabase API.",
    );
  }

  const result = await callBuddyMemoryTool(
    client,
    ownerId,
    toolName,
    args,
  );
  return asResult(result.text, result.isError);
}
