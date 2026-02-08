// Prompts for AI analysis of build feedback

interface FeedbackSynthesisInput {
  projectName: string;
  versionNumber: string;
  prdContent: string;
  entries: Array<{ tag: string; content: string; created_at: string }>;
  checklist: Array<{ feature: string; status: string }>;
}

export function feedbackSynthesisPrompt(input: FeedbackSynthesisInput): string {
  const groupedEntries = groupByTag(input.entries);
  const checklistSummary = input.checklist
    .map((c) => `- [${c.status}] ${c.feature}`)
    .join("\n");

  return `You are analyzing build feedback for a healthcare design sprint project to recommend specific PRD updates.

**Project:** ${input.projectName}
**Version:** ${input.versionNumber}

## Current PRD
${input.prdContent}

## Feature Checklist Status
${checklistSummary || "(No checklist data)"}

## Build Feedback Entries

### Wins
${groupedEntries.win || "(None)"}

### Gaps
${groupedEntries.gap || "(None)"}

### Questions
${groupedEntries.question || "(None)"}

### Pivots
${groupedEntries.pivot || "(None)"}

### Notes
${groupedEntries.note || "(None)"}

---

Analyze the feedback patterns and propose specific PRD updates. Return valid JSON with this structure:

{
  "overall_assessment": "2-3 sentence summary of build progress and key findings",
  "patterns": {
    "wins": ["pattern 1", "pattern 2"],
    "gaps": ["pattern 1", "pattern 2"],
    "questions": ["unresolved question 1"]
  },
  "suggested_updates": [
    {
      "action": "+ Add" | "~ Change" | "- Remove",
      "section": "which PRD section to modify",
      "description": "what specifically to add/change/remove",
      "rationale": "why, based on which feedback entries"
    }
  ],
  "scope_assessment": "minor" | "major"
}

scope_assessment should be "minor" if updates are refinements/additions within existing scope, or "major" if feedback suggests fundamental rethinking of features or approach.

Output ONLY the JSON. No code fences, no explanation.`;
}

function groupByTag(
  entries: Array<{ tag: string; content: string; created_at: string }>
): Record<string, string> {
  const groups: Record<string, string[]> = {};
  for (const entry of entries) {
    if (!groups[entry.tag]) groups[entry.tag] = [];
    groups[entry.tag].push(`- ${entry.content}`);
  }
  const result: Record<string, string> = {};
  for (const [tag, items] of Object.entries(groups)) {
    result[tag] = items.join("\n");
  }
  return result;
}
