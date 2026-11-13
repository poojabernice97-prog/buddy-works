import { describe, expect, test } from "bun:test";
import { fileURLToPath } from "node:url";
import { loadTenantPackage } from "../../server/src/tenant-package";

const tenantDir = fileURLToPath(new URL("../tenant", import.meta.url));

describe("Buddy tenant package", () => {
  test("loads with router and three specialists", async () => {
    const pkg = await loadTenantPackage(tenantDir);
    expect(pkg.tenantId).toBe("buddy");
    expect(pkg.productName).toBe("Buddy");
    const ids = pkg.agents.map((agent) => agent.id).sort();
    expect(ids).toEqual(["athena", "buddy", "hercules", "hermes"]);
  });

  test("exposes a primary Buddy channel", async () => {
    const pkg = await loadTenantPackage(tenantDir);
    const buddyChannel = pkg.channels.find((channel) => channel.id === "buddy");
    expect(buddyChannel).toBeDefined();
    expect(buddyChannel?.permittedAgents).toContain("hermes");
  });

  test("ships Phase 1a thought-partner skills on Buddy", async () => {
    const pkg = await loadTenantPackage(tenantDir);
    const slugs = pkg.skills.map((skill) => skill.slug).sort();
    expect(slugs).toEqual(["pushback-engine", "trade-off-brief"]);
    const buddy = pkg.agents.find((agent) => agent.id === "buddy");
    expect(buddy?.skills).toEqual(["pushback-engine", "trade-off-brief"]);
  });
});
