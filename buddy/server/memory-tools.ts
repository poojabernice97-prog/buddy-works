/** Minimal MCP tool shape for listing (matches OpenBot's `McpTool`). */
export type BuddyListedTool = {
  readonly name: string;
  readonly description: string;
  readonly inputSchema: Record<string, unknown>;
};

/** OpenBot catalogue app id for Buddy portfolio memory tools. */
export const BUDDY_MEMORY_APP = "buddy-memory";

export const BUDDY_MEMORY_TOOL_NAMES = [
  "buddy_list_projects",
  "buddy_save_project",
  "buddy_list_raid_items",
  "buddy_save_raid_item",
  "buddy_list_decisions",
  "buddy_save_decision",
  "buddy_list_private_thoughts",
  "buddy_save_private_thought",
  "buddy_list_memory_sources",
  "buddy_upload_transcript",
] as const;

export type BuddyMemoryToolName = (typeof BUDDY_MEMORY_TOOL_NAMES)[number];

const labelProperty = {
  type: "string" as const,
  description:
    "Provenance label: fact (from user data), inference, or general_practice.",
  enum: ["fact", "inference", "general_practice"],
};

export const BUDDY_MEMORY_TOOLS: readonly BuddyListedTool[] = Object.freeze([
  {
    name: "buddy_list_projects",
    description: "List the PM's portfolio projects from Buddy memory.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "buddy_save_project",
    description:
      "Create or update a project (name required). Hybrid approach is the default.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Existing project id to update." },
        name: { type: "string" },
        goal: { type: "string" },
        focus_area: {
          type: "string",
          enum: [
            "initiating",
            "planning",
            "executing",
            "monitoring_controlling",
            "closing",
          ],
        },
        milestones: {},
        baseline_dates: {},
      },
      required: ["name"],
    },
  },
  {
    name: "buddy_list_raid_items",
    description: "List RAID items for a project.",
    inputSchema: {
      type: "object",
      properties: {
        project_id: { type: "string" },
      },
      required: ["project_id"],
    },
  },
  {
    name: "buddy_save_raid_item",
    description:
      "Add a RAID item. Include source and label (fact | inference | general_practice) when stating portfolio facts.",
    inputSchema: {
      type: "object",
      properties: {
        project_id: { type: "string" },
        kind: {
          type: "string",
          enum: ["risk", "assumption", "issue", "dependency"],
        },
        title: { type: "string" },
        description: { type: "string" },
        status: { type: "string" },
        item_owner: { type: "string" },
        due_date: { type: "string", description: "ISO date." },
        source: {
          type: "string",
          description: "Where this came from (meeting, ticket export, etc.).",
        },
        label: labelProperty,
      },
      required: ["project_id", "kind", "title"],
    },
  },
  {
    name: "buddy_list_decisions",
    description: "List decisions recorded for a project.",
    inputSchema: {
      type: "object",
      properties: {
        project_id: { type: "string" },
      },
      required: ["project_id"],
    },
  },
  {
    name: "buddy_save_decision",
    description:
      "Record a decision with source and label (fact | inference | general_practice).",
    inputSchema: {
      type: "object",
      properties: {
        project_id: { type: "string" },
        decision: { type: "string" },
        options_considered: {},
        reasoning: { type: "string" },
        assumptions: {},
        review_date: { type: "string" },
        source: { type: "string" },
        label: labelProperty,
      },
      required: ["project_id", "decision"],
    },
  },
  {
    name: "buddy_list_private_thoughts",
    description:
      "List Hermes/Buddy private thoughts (not shared outward). Optional project filter.",
    inputSchema: {
      type: "object",
      properties: {
        project_id: { type: "string" },
      },
    },
  },
  {
    name: "buddy_save_private_thought",
    description:
      "Append a private thought for Buddy specialists — never promote to outbound messages without approval.",
    inputSchema: {
      type: "object",
      properties: {
        content: { type: "string" },
        project_id: { type: "string" },
      },
      required: ["content"],
    },
  },
  {
    name: "buddy_list_memory_sources",
    description:
      "List uploaded transcripts and ticket exports synced into Buddy memory.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "buddy_upload_transcript",
    description:
      "Paste or upload a transcript/ticket export. Records buddy.memory_sources and stores the file in buddy-uploads when bytes are provided.",
    inputSchema: {
      type: "object",
      properties: {
        label: {
          type: "string",
          description: "Human label, e.g. sprint-review-transcript.",
        },
        content: {
          type: "string",
          description: "Pasted text when not uploading bytes.",
        },
        filename: { type: "string" },
        content_base64: {
          type: "string",
          description: "Base64 file bytes when uploading instead of paste.",
        },
      },
    },
  },
]);
