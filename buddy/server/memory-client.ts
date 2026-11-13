import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type BuddyApproach = "predictive" | "adaptive" | "hybrid";
export type BuddyFocusArea =
  | "initiating"
  | "planning"
  | "executing"
  | "monitoring_controlling"
  | "closing";
export type BuddyRaidKind = "risk" | "assumption" | "issue" | "dependency";
export type BuddyMemoryLabel = "fact" | "inference" | "general_practice";
export type PushbackLevel = "gentle" | "standard" | "tough";

export interface BuddyAutonomyLevels {
  readonly [action: string]:
    | "advise"
    | "draft"
    | "act_with_notice"
    | "act_silently";
}

export interface BuddyProfile {
  readonly owner_id: string;
  readonly pushback_level: PushbackLevel;
  readonly working_hours: Record<string, unknown> | null;
  readonly autonomy: BuddyAutonomyLevels;
}

export interface BuddyProjectRow {
  readonly id: string;
  readonly owner_id: string;
  readonly name: string;
  readonly goal: string | null;
  readonly focus_area: BuddyFocusArea | null;
  readonly approach: BuddyApproach | null;
  readonly milestones: unknown;
  readonly baseline_dates: unknown;
}

export interface BuddyRaidRow {
  readonly id: string;
  readonly owner_id: string;
  readonly project_id: string;
  readonly kind: BuddyRaidKind;
  readonly title: string;
  readonly description: string | null;
  readonly status: string;
  readonly item_owner: string | null;
  readonly due_date: string | null;
  readonly source: string | null;
  readonly label: BuddyMemoryLabel | null;
}

export interface BuddyDecisionRow {
  readonly id: string;
  readonly owner_id: string;
  readonly project_id: string;
  readonly decision: string;
  readonly options_considered: unknown;
  readonly reasoning: string | null;
  readonly assumptions: unknown;
  readonly review_date: string | null;
  readonly source: string | null;
  readonly label: BuddyMemoryLabel | null;
}

export interface BuddyPrivateThoughtRow {
  readonly id: string;
  readonly owner_id: string;
  readonly project_id: string | null;
  readonly content: string;
}

export interface BuddyMemorySourceRow {
  readonly id: string;
  readonly owner_id: string;
  readonly source: string;
  readonly label: string | null;
  readonly last_synced_at: string | null;
}

const DEFAULT_AUTONOMY: BuddyAutonomyLevels = {
  morning_check_in: "draft",
  stakeholder_message: "draft",
  calendar_change: "draft",
  ticket_create: "draft",
  slack_nudge: "draft",
};

export function createBuddyMemoryClientFromEnv(): BuddyMemoryClient {
  const url = process.env.SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set for Buddy memory.",
    );
  }
  return new BuddyMemoryClient(
    createClient(url, serviceRoleKey, {
      db: { schema: "buddy" },
    }) as unknown as SupabaseClient,
  );
}

export class BuddyMemoryClient {
  constructor(private readonly client: SupabaseClient) {}

  /** Supabase Storage client (bucket `buddy-uploads`). */
  storage() {
    return this.client.storage;
  }

  /** Underlying client (server-only; for storage reads). */
  underlying(): SupabaseClient {
    return this.client;
  }

  async getOrCreateProfile(ownerId: string): Promise<BuddyProfile> {
    const { data, error } = await this.client
      .from("profiles")
      .select("owner_id, pushback_level, working_hours, autonomy")
      .eq("owner_id", ownerId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (data) {
      return data as BuddyProfile;
    }

    const insert = {
      owner_id: ownerId,
      pushback_level: "standard" as const,
      working_hours: null,
      autonomy: DEFAULT_AUTONOMY,
    };

    const { data: created, error: insertError } = await this.client
      .from("profiles")
      .insert(insert)
      .select("owner_id, pushback_level, working_hours, autonomy")
      .single();

    if (insertError) {
      throw insertError;
    }

    return created as BuddyProfile;
  }

  async listProjects(ownerId: string): Promise<BuddyProjectRow[]> {
    const { data, error } = await this.client
      .from("projects")
      .select(
        "id, owner_id, name, goal, focus_area, approach, milestones, baseline_dates",
      )
      .eq("owner_id", ownerId)
      .order("updated_at", { ascending: false });

    if (error) {
      throw error;
    }
    return (data ?? []) as BuddyProjectRow[];
  }

  async upsertProject(
    ownerId: string,
    project: {
      id?: string;
      name: string;
      goal?: string | null;
      focus_area?: BuddyFocusArea | null;
      approach?: BuddyApproach;
      milestones?: unknown;
      baseline_dates?: unknown;
    },
  ): Promise<BuddyProjectRow> {
    const row = {
      ...project,
      owner_id: ownerId,
      approach: project.approach ?? "hybrid",
    };

    const { data, error } = await this.client
      .from("projects")
      .upsert(row)
      .select(
        "id, owner_id, name, goal, focus_area, approach, milestones, baseline_dates",
      )
      .single();

    if (error) {
      throw error;
    }
    return data as BuddyProjectRow;
  }

  async listRaidItems(
    ownerId: string,
    projectId: string,
  ): Promise<BuddyRaidRow[]> {
    const { data, error } = await this.client
      .from("raid_items")
      .select(
        "id, owner_id, project_id, kind, title, description, status, item_owner, due_date, source, label",
      )
      .eq("owner_id", ownerId)
      .eq("project_id", projectId)
      .order("updated_at", { ascending: false });

    if (error) {
      throw error;
    }
    return (data ?? []) as BuddyRaidRow[];
  }

  async insertRaidItem(
    ownerId: string,
    item: Omit<
      BuddyRaidRow,
      "id" | "owner_id" | "status" | "description" | "item_owner" | "due_date"
    > & {
      id?: string;
      status?: string;
      description?: string | null;
      item_owner?: string | null;
      due_date?: string | null;
    },
  ): Promise<BuddyRaidRow> {
    const { data, error } = await this.client
      .from("raid_items")
      .insert({ ...item, owner_id: ownerId, status: item.status ?? "open" })
      .select(
        "id, owner_id, project_id, kind, title, description, status, item_owner, due_date, source, label",
      )
      .single();

    if (error) {
      throw error;
    }
    return data as BuddyRaidRow;
  }

  async listDecisions(
    ownerId: string,
    projectId: string,
  ): Promise<BuddyDecisionRow[]> {
    const { data, error } = await this.client
      .from("decisions")
      .select(
        "id, owner_id, project_id, decision, options_considered, reasoning, assumptions, review_date, source, label",
      )
      .eq("owner_id", ownerId)
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }
    return (data ?? []) as BuddyDecisionRow[];
  }

  async insertDecision(
    ownerId: string,
    decision: Omit<BuddyDecisionRow, "id" | "owner_id"> & { id?: string },
  ): Promise<BuddyDecisionRow> {
    const { data, error } = await this.client
      .from("decisions")
      .insert({ ...decision, owner_id: ownerId })
      .select(
        "id, owner_id, project_id, decision, options_considered, reasoning, assumptions, review_date, source, label",
      )
      .single();

    if (error) {
      throw error;
    }
    return data as BuddyDecisionRow;
  }

  async listPrivateThoughts(
    ownerId: string,
    projectId?: string,
  ): Promise<BuddyPrivateThoughtRow[]> {
    let query = this.client
      .from("private_thoughts")
      .select("id, owner_id, project_id, content")
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: false });

    if (projectId) {
      query = query.eq("project_id", projectId);
    }

    const { data, error } = await query;
    if (error) {
      throw error;
    }
    return (data ?? []) as BuddyPrivateThoughtRow[];
  }

  async appendPrivateThought(
    ownerId: string,
    content: string,
    projectId?: string | null,
  ): Promise<BuddyPrivateThoughtRow> {
    const { data, error } = await this.client
      .from("private_thoughts")
      .insert({
        owner_id: ownerId,
        project_id: projectId ?? null,
        content,
      })
      .select("id, owner_id, project_id, content")
      .single();

    if (error) {
      throw error;
    }
    return data as BuddyPrivateThoughtRow;
  }

  async listMemorySources(ownerId: string): Promise<BuddyMemorySourceRow[]> {
    const { data, error } = await this.client
      .from("memory_sources")
      .select("id, owner_id, source, label, last_synced_at")
      .eq("owner_id", ownerId)
      .order("last_synced_at", { ascending: false });

    if (error) {
      throw error;
    }
    return (data ?? []) as BuddyMemorySourceRow[];
  }

  async upsertMemorySource(
    ownerId: string,
    row: {
      source: string;
      label?: string | null;
      last_synced_at?: string | null;
    },
  ): Promise<BuddyMemorySourceRow> {
    const { data, error } = await this.client
      .from("memory_sources")
      .upsert(
        {
          owner_id: ownerId,
          source: row.source,
          label: row.label ?? null,
          last_synced_at: row.last_synced_at ?? new Date().toISOString(),
        },
        { onConflict: "owner_id,source" },
      )
      .select("id, owner_id, source, label, last_synced_at")
      .single();

    if (error) {
      throw error;
    }
    return data as BuddyMemorySourceRow;
  }
}
