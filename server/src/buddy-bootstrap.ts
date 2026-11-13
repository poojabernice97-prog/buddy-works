import { BUDDY_MEMORY_APP } from "../../buddy/server/openbot-wiring";
import type { PersonalDefaultsDeps } from "./plugins/personal-defaults";

const GRANTED_BY = "buddy-bootstrap";

type BootstrapStore = {
  serverAddress(serverId: string): Promise<unknown>;
  addServer(input: { key: string; by: string }): Promise<unknown>;
  refreshOwnListings(): Promise<string[]>;
  grantTools(
    app: string,
    tools: string[],
    bot: string,
    grantedBy: string,
  ): Promise<unknown>;
};

/**
 * Register Buddy memory tools and grant them to every Bot when this deployment uses the Buddy tenant.
 */
export async function ensureBuddyMemoryApp(
  store: BootstrapStore,
  deps: PersonalDefaultsDeps,
  tenantId: string,
): Promise<void> {
  if (tenantId !== "buddy") return;
  if (!(await store.serverAddress(BUDDY_MEMORY_APP))) {
    await store.addServer({ key: BUDDY_MEMORY_APP, by: GRANTED_BY });
  }
  await store.refreshOwnListings();

  const tools = await deps.tools(BUDDY_MEMORY_APP);
  if (tools.length === 0) return;
  const refs = tools.map((tool) => tool.ref);
  const bots = await deps.bots();
  for (const bot of bots) {
    const held = await deps.granted(bot, BUDDY_MEMORY_APP);
    const missing = refs.filter((ref) => !held.has(ref)).sort();
    if (missing.length > 0) {
      await store.grantTools(BUDDY_MEMORY_APP, missing, bot, GRANTED_BY);
    }
  }
}
