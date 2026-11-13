import type { MorningCheckInContext } from "../lib/routine/morning-check-in";
import {
  type BuddyDecisionRow,
  type BuddyMemoryClient,
  type BuddyRaidRow,
  createBuddyMemoryClientFromEnv,
} from "./memory-client";
import { readUploadExcerpt } from "./upload";

let sharedClient: BuddyMemoryClient | null = null;

export function useBuddyMemoryClient(client: BuddyMemoryClient | null): void {
  sharedClient = client;
}

function clientOrEnv(): BuddyMemoryClient {
  if (sharedClient) return sharedClient;
  return createBuddyMemoryClientFromEnv();
}

/** Load portfolio snapshot for Hermes morning routine instruction assembly. */
export async function loadMorningCheckInContext(
  ownerId: string,
): Promise<MorningCheckInContext> {
  const client = clientOrEnv();
  const profile = await client.getOrCreateProfile(ownerId);
  const projects = await client.listProjects(ownerId);
  const openRaidByProject: Record<string, BuddyRaidRow[]> = {};
  const recentDecisionsByProject: Record<string, BuddyDecisionRow[]> = {};

  for (const project of projects) {
    openRaidByProject[project.id] = await client.listRaidItems(
      ownerId,
      project.id,
    );
    recentDecisionsByProject[project.id] = await client.listDecisions(
      ownerId,
      project.id,
    );
  }

  const privateThoughts = await client.listPrivateThoughts(ownerId);
  const memorySources = await client.listMemorySources(ownerId);

  const transcriptSnippets: { source: string; excerpt: string }[] = [];
  const supabase = client.underlying();
  for (const row of memorySources.slice(0, 5)) {
    const excerpt = await readUploadExcerpt(supabase, row.source);
    if (excerpt) {
      transcriptSnippets.push({ source: row.source, excerpt });
    }
  }

  return {
    profile,
    projects,
    openRaidByProject,
    recentDecisionsByProject,
    privateThoughts,
    memorySources,
    transcriptSnippets,
  };
}
