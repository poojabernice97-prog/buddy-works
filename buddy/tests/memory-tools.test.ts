import { describe, expect, mock, test } from "bun:test";
import type { BuddyMemoryClient } from "../server/memory-client.ts";
import { callBuddyMemoryTool } from "../server/tool-handlers.ts";

describe("Buddy memory tool handlers", () => {
  test("buddy_save_raid_item requires label enum when provided", async () => {
    const client = {
      insertRaidItem: mock(() => {
        throw new Error("should not be called");
      }),
    } as unknown as BuddyMemoryClient;

    const result = await callBuddyMemoryTool(
      client,
      "owner-1",
      "buddy_save_raid_item",
      {
        project_id: "p1",
        kind: "risk",
        title: "Latency",
        label: "guess",
      },
    );
    expect(result.isError).toBe(true);
    expect(result.text).toContain("label");
  });

  test("buddy_list_projects returns JSON list", async () => {
    const projects = [{ id: "p1", name: "Alpha" }];
    const client = {
      listProjects: mock(async () => projects),
    } as unknown as BuddyMemoryClient;

    const result = await callBuddyMemoryTool(
      client,
      "owner-1",
      "buddy_list_projects",
      {},
    );
    expect(result.isError).toBe(false);
    expect(JSON.parse(result.text)).toEqual(projects);
  });

  test("buddy_save_private_thought delegates to client", async () => {
    const client = {
      appendPrivateThought: mock(async () => ({
        id: "t1",
        owner_id: "owner-1",
        project_id: null,
        content: "quiet note",
      })),
    } as unknown as BuddyMemoryClient;

    const result = await callBuddyMemoryTool(
      client,
      "owner-1",
      "buddy_save_private_thought",
      { content: "quiet note" },
    );
    expect(result.isError).toBe(false);
    expect(client.appendPrivateThought).toHaveBeenCalledWith(
      "owner-1",
      "quiet note",
      null,
    );
  });
});
