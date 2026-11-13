import type {
  BuddyFocusArea,
  BuddyMemoryClient,
  BuddyMemoryLabel,
  BuddyRaidKind,
} from "./memory-client";
import { recordPastedTranscript, uploadTranscriptBytes } from "./upload";

export type BuddyToolResult = { text: string; isError: boolean };

function ok(text: string): BuddyToolResult {
  return { text, isError: false };
}

function err(text: string): BuddyToolResult {
  return { text, isError: true };
}

function requiredString(
  args: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = args[key];
  return typeof value === "string" && value.trim() !== ""
    ? value.trim()
    : undefined;
}

function optionalString(
  args: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = args[key];
  return typeof value === "string" ? value.trim() : undefined;
}

function parseLabel(value: unknown): BuddyMemoryLabel | null | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (
    value === "fact" ||
    value === "inference" ||
    value === "general_practice"
  ) {
    return value;
  }
  return undefined;
}

export async function callBuddyMemoryTool(
  client: BuddyMemoryClient,
  ownerId: string,
  toolName: string,
  args: Record<string, unknown>,
): Promise<BuddyToolResult> {
  try {
    switch (toolName) {
      case "buddy_list_projects": {
        const projects = await client.listProjects(ownerId);
        return ok(JSON.stringify(projects, null, 2));
      }
      case "buddy_save_project": {
        const name = requiredString(args, "name");
        if (!name) return err("name is required.");
        const project = await client.upsertProject(ownerId, {
          id: optionalString(args, "id"),
          name,
          goal: optionalString(args, "goal") ?? null,
          focus_area: optionalString(args, "focus_area") as
            | BuddyFocusArea
            | undefined,
          milestones: args.milestones,
          baseline_dates: args.baseline_dates,
        });
        return ok(JSON.stringify(project, null, 2));
      }
      case "buddy_list_raid_items": {
        const projectId = requiredString(args, "project_id");
        if (!projectId) return err("project_id is required.");
        const items = await client.listRaidItems(ownerId, projectId);
        return ok(JSON.stringify(items, null, 2));
      }
      case "buddy_save_raid_item": {
        const projectId = requiredString(args, "project_id");
        const kind = requiredString(args, "kind") as BuddyRaidKind | undefined;
        const title = requiredString(args, "title");
        if (!projectId || !kind || !title) {
          return err("project_id, kind, and title are required.");
        }
        const label = parseLabel(args.label);
        if (args.label !== undefined && label === undefined) {
          return err("label must be fact, inference, or general_practice.");
        }
        const item = await client.insertRaidItem(ownerId, {
          id: optionalString(args, "id"),
          project_id: projectId,
          kind,
          title,
          description: optionalString(args, "description") ?? null,
          status: optionalString(args, "status"),
          item_owner: optionalString(args, "item_owner") ?? null,
          due_date: optionalString(args, "due_date") ?? null,
          source: optionalString(args, "source") ?? null,
          label: label ?? null,
        });
        return ok(JSON.stringify(item, null, 2));
      }
      case "buddy_list_decisions": {
        const projectId = requiredString(args, "project_id");
        if (!projectId) return err("project_id is required.");
        const rows = await client.listDecisions(ownerId, projectId);
        return ok(JSON.stringify(rows, null, 2));
      }
      case "buddy_save_decision": {
        const projectId = requiredString(args, "project_id");
        const decision = requiredString(args, "decision");
        if (!projectId || !decision) {
          return err("project_id and decision are required.");
        }
        const label = parseLabel(args.label);
        if (args.label !== undefined && label === undefined) {
          return err("label must be fact, inference, or general_practice.");
        }
        const row = await client.insertDecision(ownerId, {
          id: optionalString(args, "id"),
          project_id: projectId,
          decision,
          options_considered: args.options_considered ?? null,
          reasoning: optionalString(args, "reasoning") ?? null,
          assumptions: args.assumptions ?? null,
          review_date: optionalString(args, "review_date") ?? null,
          source: optionalString(args, "source") ?? null,
          label: label ?? null,
        });
        return ok(JSON.stringify(row, null, 2));
      }
      case "buddy_list_private_thoughts": {
        const projectId = optionalString(args, "project_id");
        const rows = await client.listPrivateThoughts(ownerId, projectId);
        return ok(JSON.stringify(rows, null, 2));
      }
      case "buddy_save_private_thought": {
        const content = requiredString(args, "content");
        if (!content) return err("content is required.");
        const row = await client.appendPrivateThought(
          ownerId,
          content,
          optionalString(args, "project_id") ?? null,
        );
        return ok(JSON.stringify(row, null, 2));
      }
      case "buddy_list_memory_sources": {
        const rows = await client.listMemorySources(ownerId);
        return ok(JSON.stringify(rows, null, 2));
      }
      case "buddy_upload_transcript": {
        const label = optionalString(args, "label") ?? "transcript";
        const content = optionalString(args, "content");
        const filename = optionalString(args, "filename");
        const base64 = optionalString(args, "content_base64");

        if (content) {
          const recorded = await recordPastedTranscript(
            client,
            ownerId,
            label,
            content,
            filename ?? "paste.txt",
          );
          return ok(JSON.stringify(recorded, null, 2));
        }

        if (base64 && filename) {
          const bytes = Buffer.from(base64, "base64");
          const recorded = await uploadTranscriptBytes(
            client,
            ownerId,
            label,
            filename,
            bytes,
          );
          return ok(JSON.stringify(recorded, null, 2));
        }

        return err(
          "Provide either content (paste) or content_base64 with filename (upload).",
        );
      }
      default:
        return err(`${toolName} is not implemented.`);
    }
  } catch (error) {
    return err(error instanceof Error ? error.message : String(error));
  }
}
