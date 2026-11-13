/** How hard Buddy challenges before drafting outward work. */
export type PushbackLevel = "gentle" | "standard" | "tough";

export type PushbackDomain =
  | "schedule"
  | "scope"
  | "governance"
  | "stakeholders"
  | "resources"
  | "risk";

export type PushbackTriggerId =
  | "date_without_basis"
  | "task_without_dependencies"
  | "mid_project_request"
  | "stakeholders_vague_alignment"
  | "single_point_of_failure"
  | "zero_buffer"
  | "loose_definition_of_done"
  | "soft_language";

export interface DetectedPushbackTrigger {
  readonly id: PushbackTriggerId;
  readonly domain: PushbackDomain[];
  readonly question: string;
  readonly matchedText: string;
}

export interface PushbackDetectionResult {
  readonly triggers: DetectedPushbackTrigger[];
  readonly questions: string[];
  readonly level: PushbackLevel;
  readonly withholdDrafts: boolean;
}
