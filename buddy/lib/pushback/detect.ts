import { PUSHBACK_TRIGGER_RULES } from "./triggers";
import type {
  DetectedPushbackTrigger,
  PushbackDetectionResult,
  PushbackLevel,
} from "./types";

const MAX_QUESTIONS_STANDARD = 3;
const MAX_QUESTIONS_GENTLE = 1;

function normalizeInput(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/**
 * Scan PM message text for pushback triggers and return prioritized questions.
 */
export function detectPushbackTriggers(
  message: string,
  level: PushbackLevel = "standard",
): PushbackDetectionResult {
  const input = normalizeInput(message);
  if (!input) {
    return {
      triggers: [],
      questions: [],
      level,
      withholdDrafts: level === "tough",
    };
  }

  const detected: DetectedPushbackTrigger[] = [];

  for (const rule of PUSHBACK_TRIGGER_RULES) {
    for (const pattern of rule.patterns) {
      const match = input.match(pattern);
      if (match) {
        detected.push({
          id: rule.id,
          domain: rule.domain,
          question: rule.question,
          matchedText: match[0],
        });
        break;
      }
    }
  }

  detected.sort((left, right) => {
    const leftPriority =
      PUSHBACK_TRIGGER_RULES.find((rule) => rule.id === left.id)?.priority ??
      99;
    const rightPriority =
      PUSHBACK_TRIGGER_RULES.find((rule) => rule.id === right.id)?.priority ??
      99;
    return leftPriority - rightPriority;
  });

  const maxQuestions =
    level === "gentle"
      ? MAX_QUESTIONS_GENTLE
      : level === "standard"
        ? MAX_QUESTIONS_STANDARD
        : MAX_QUESTIONS_STANDARD;

  const questions = [
    ...new Set(detected.map((trigger) => trigger.question)),
  ].slice(0, maxQuestions);

  const withholdDrafts = level === "tough" && questions.length > 0;

  return {
    triggers: detected,
    questions,
    level,
    withholdDrafts,
  };
}
