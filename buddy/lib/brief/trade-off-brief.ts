/** Labels Buddy applies to statements in chat and memory (per product spec). */
export type BuddyStatementLabel = "fact" | "inference" | "general_practice";

export interface TradeOffOption {
  readonly name: string;
  readonly tradesAway: string;
}

export interface TradeOffDependency {
  readonly description: string;
  readonly owner: string;
}

export interface TradeOffBrief {
  readonly decision: string;
  readonly options: TradeOffOption[];
  readonly dependencies: TradeOffDependency[];
  readonly stakeholders: string[];
  readonly workOwner: string;
  readonly dueDate: string;
  readonly acceptanceCriteria: string;
}

export interface TradeOffBriefValidationIssue {
  readonly path: string;
  readonly message: string;
}

export interface TradeOffBriefValidationResult {
  readonly valid: boolean;
  readonly issues: TradeOffBriefValidationIssue[];
  readonly value?: TradeOffBrief;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function asStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) {
    return null;
  }
  const items: string[] = [];
  for (let index = 0; index < value.length; index++) {
    const entry = value[index];
    if (!isNonEmptyString(entry)) {
      return null;
    }
    items.push(entry.trim());
  }
  return items;
}

/**
 * Validate and normalize a trade-off brief object (fixed shape before any ticket).
 */
export function validateTradeOffBrief(
  input: unknown,
): TradeOffBriefValidationResult {
  const issues: TradeOffBriefValidationIssue[] = [];

  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    return {
      valid: false,
      issues: [{ path: "", message: "Brief must be a JSON object." }],
    };
  }

  const record = input as Record<string, unknown>;

  if (!isNonEmptyString(record.decision)) {
    issues.push({
      path: "decision",
      message: "Decision is required.",
    });
  }

  const optionsRaw = record.options;
  const options: TradeOffOption[] = [];
  if (!Array.isArray(optionsRaw) || optionsRaw.length === 0) {
    issues.push({
      path: "options",
      message: "At least one option is required.",
    });
  } else {
    for (let index = 0; index < optionsRaw.length; index++) {
      const option = optionsRaw[index];
      if (
        option === null ||
        typeof option !== "object" ||
        Array.isArray(option)
      ) {
        issues.push({
          path: `options[${index}]`,
          message: "Each option must be an object.",
        });
        continue;
      }
      const optionRecord = option as Record<string, unknown>;
      if (!isNonEmptyString(optionRecord.name)) {
        issues.push({
          path: `options[${index}].name`,
          message: "Option name is required.",
        });
      }
      if (!isNonEmptyString(optionRecord.tradesAway)) {
        issues.push({
          path: `options[${index}].tradesAway`,
          message: "What this option trades away is required.",
        });
      }
      if (
        isNonEmptyString(optionRecord.name) &&
        isNonEmptyString(optionRecord.tradesAway)
      ) {
        options.push({
          name: optionRecord.name.trim(),
          tradesAway: optionRecord.tradesAway.trim(),
        });
      }
    }
  }

  const dependenciesRaw = record.dependencies;
  const dependencies: TradeOffDependency[] = [];
  if (!Array.isArray(dependenciesRaw)) {
    issues.push({
      path: "dependencies",
      message: "Dependencies must be an array (use [] if none).",
    });
  } else {
    for (let index = 0; index < dependenciesRaw.length; index++) {
      const dep = dependenciesRaw[index];
      if (dep === null || typeof dep !== "object" || Array.isArray(dep)) {
        issues.push({
          path: `dependencies[${index}]`,
          message: "Each dependency must be an object.",
        });
        continue;
      }
      const depRecord = dep as Record<string, unknown>;
      if (!isNonEmptyString(depRecord.description)) {
        issues.push({
          path: `dependencies[${index}].description`,
          message: "Dependency description is required.",
        });
      }
      if (!isNonEmptyString(depRecord.owner)) {
        issues.push({
          path: `dependencies[${index}].owner`,
          message: "Dependency owner is required.",
        });
      }
      if (
        isNonEmptyString(depRecord.description) &&
        isNonEmptyString(depRecord.owner)
      ) {
        dependencies.push({
          description: depRecord.description.trim(),
          owner: depRecord.owner.trim(),
        });
      }
    }
  }

  const stakeholders = asStringArray(record.stakeholders);
  if (stakeholders === null) {
    issues.push({
      path: "stakeholders",
      message: "Stakeholders must be an array of non-empty strings.",
    });
  }

  if (!isNonEmptyString(record.workOwner)) {
    issues.push({
      path: "workOwner",
      message: "Owner for the resulting work is required.",
    });
  }

  if (!isNonEmptyString(record.dueDate)) {
    issues.push({
      path: "dueDate",
      message: "Due date for the resulting work is required.",
    });
  }

  if (!isNonEmptyString(record.acceptanceCriteria)) {
    issues.push({
      path: "acceptanceCriteria",
      message: "Acceptance criteria are required.",
    });
  }

  if (issues.length > 0) {
    return { valid: false, issues };
  }

  return {
    valid: true,
    issues: [],
    value: {
      decision: (record.decision as string).trim(),
      options,
      dependencies,
      stakeholders: stakeholders ?? [],
      workOwner: (record.workOwner as string).trim(),
      dueDate: (record.dueDate as string).trim(),
      acceptanceCriteria: (record.acceptanceCriteria as string).trim(),
    },
  };
}

/**
 * Markdown outline Buddy uses when presenting a trade-off brief in chat.
 */
export function formatTradeOffBriefMarkdown(brief: TradeOffBrief): string {
  const optionLines = brief.options
    .map((option) => `- **${option.name}** — trades away: ${option.tradesAway}`)
    .join("\n");
  const dependencyLines =
    brief.dependencies.length === 0
      ? "- _(none listed)_"
      : brief.dependencies
          .map((dep) => `- ${dep.description} — owner: ${dep.owner}`)
          .join("\n");
  const stakeholderLines =
    brief.stakeholders.length === 0
      ? "- _(none listed)_"
      : brief.stakeholders.map((name) => `- ${name}`).join("\n");

  return [
    "## Trade-off brief",
    "",
    `**Decision:** ${brief.decision}`,
    "",
    "**Options**",
    optionLines,
    "",
    "**Dependencies and owners**",
    dependencyLines,
    "",
    "**Stakeholders affected**",
    stakeholderLines,
    "",
    "**Resulting work**",
    `- Owner: ${brief.workOwner}`,
    `- Date: ${brief.dueDate}`,
    `- Acceptance criteria: ${brief.acceptanceCriteria}`,
  ].join("\n");
}
