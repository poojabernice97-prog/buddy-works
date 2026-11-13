import type { DetectedPushbackTrigger, PushbackTriggerId } from "./types.ts";

export interface PushbackTriggerRule {
  readonly id: PushbackTriggerId;
  readonly patterns: readonly RegExp[];
  readonly domain: DetectedPushbackTrigger["domain"];
  readonly question: string;
  readonly priority: number;
}

/**
 * Named pushback triggers — original rules inspired by PM practice, not copied from any guide text.
 */
export const PUSHBACK_TRIGGER_RULES: readonly PushbackTriggerRule[] = [
  {
    id: "date_without_basis",
    patterns: [
      /\b(?:by|on|before|due|ship(?:s|ping)?|launch(?:es|ing)?|deliver(?:y)?)\s+(?:the\s+)?(?:\d{1,2}(?:st|nd|rd|th)?|\w+\s+\d{1,2}|\d{4}-\d{2}-\d{2}|next\s+\w+|end\s+of\s+\w+|eow|eom)\b/i,
      /\b(?:deadline|target\s+date|go[- ]live)\s+(?:is\s+)?(?:\d|\w)/i,
      /\b(?:the\s+)?\d{1,2}(?:st|nd|rd|th)?\s+of\s+\w+\b/i,
    ],
    domain: ["schedule"],
    question:
      "Who estimated this date, and what work or evidence is it based on?",
    priority: 1,
  },
  {
    id: "task_without_dependencies",
    patterns: [
      /\b(?:add|create|new)\s+(?:a\s+)?task\b/i,
      /\bwe(?:'ll| will)\s+(?:just\s+)?(?:start|kick\s+off|build)\b/i,
      /\bwithout\s+(?:waiting|blocking)\b/i,
    ],
    domain: ["schedule"],
    question: "What has to be delivered to you before this work can start?",
    priority: 2,
  },
  {
    id: "mid_project_request",
    patterns: [
      /\b(?:also|another|new)\s+(?:request|feature|scope|ask)\b/i,
      /\b(?:client|stakeholder|they)\s+(?:also\s+)?(?:want|asked|needs?)\b/i,
      /\bscope\s+creep\b/i,
      /\bchange\s+request\b/i,
    ],
    domain: ["scope", "governance"],
    question:
      "What does this displace on the current plan, and who approved the change?",
    priority: 1,
  },
  {
    id: "stakeholders_vague_alignment",
    patterns: [
      /\bstakeholders?\s+(?:are\s+)?(?:on\s+board|aligned|happy|fine)\b/i,
      /\beveryone\s+(?:agrees|is\s+aligned|signed\s+off)\b/i,
      /\b(?:they(?:'re| are)|we(?:'re| are))\s+all\s+(?:good|fine|aligned)\b/i,
    ],
    domain: ["stakeholders"],
    question: "Who exactly agreed, when — and who has not been asked yet?",
    priority: 1,
  },
  {
    id: "single_point_of_failure",
    patterns: [
      /\bonly\s+\w+\s+(?:can|knows|handles)\b/i,
      /\b(?:single|sole)\s+(?:owner|person|point)\b/i,
      /\bif\s+\w+\s+(?:is\s+)?out\b/i,
      /\bcritical\s+path\s+(?:is\s+)?\w+\b/i,
    ],
    domain: ["resources", "risk"],
    question:
      "What happens if that person is unavailable for two weeks — who backs them up?",
    priority: 2,
  },
  {
    id: "zero_buffer",
    patterns: [
      /\bno\s+(?:buffer|slack|padding|reserve)\b/i,
      /\btight\s+(?:timeline|schedule)\b/i,
      /\bback[- ]to[- ]back\b/i,
      /\bzero\s+(?:float|slack)\b/i,
    ],
    domain: ["risk"],
    question: "Where is the schedule or risk reserve, and who can spend it?",
    priority: 2,
  },
  {
    id: "loose_definition_of_done",
    patterns: [
      /\b(?:basically|mostly|kind\s+of)\s+done\b/i,
      /\b(?:good\s+enough|close\s+enough)\b/i,
      /\b(?:roughly|approximately)\s+(?:complete|finished)\b/i,
      /\bdefinition\s+of\s+done\b/i,
      /\bwhen\s+it(?:'s|\s+is)\s+(?:done|ready)\b/i,
    ],
    domain: ["scope"],
    question: "How will we know it is done, and who validates it?",
    priority: 3,
  },
  {
    id: "soft_language",
    patterns: [
      /\bshould\s+be\s+fine\b/i,
      /\bprobably\s+(?:ok|fine|works?)\b/i,
      /\b(?:might|may)\s+work\b/i,
      /\b(?:soon|eventually|shortly)\b/i,
      /\b(?:I\s+think|we\s+think)\s+(?:it(?:'ll| will)|this)\b/i,
      /\blow\s+risk\b/i,
    ],
    domain: ["risk"],
    question: "What evidence supports that, and what would change your mind?",
    priority: 3,
  },
];
