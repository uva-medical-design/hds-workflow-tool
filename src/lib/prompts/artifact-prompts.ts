// Prompts for compiling the final PRD and generating the reveal.js story

interface PhaseDataEntry {
  phase: number;
  inputs: Record<string, any>;
  synthesis: Record<string, any>;
}

interface ProjectInfo {
  projectName: string;
  studentName: string;
}

export function prdCompilationPrompt(
  phases: PhaseDataEntry[],
  project: ProjectInfo
): string {
  const phaseBlocks = phases
    .sort((a, b) => a.phase - b.phase)
    .map(
      (p) => `## Phase ${p.phase} Data
**Inputs:**
${JSON.stringify(p.inputs, null, 2)}

**AI Synthesis:**
${JSON.stringify(p.synthesis, null, 2)}`
    )
    .join("\n\n---\n\n");

  return `You are compiling a complete Product Requirements Document (PRD) from a medical student's 7-phase design thinking sprint.

**Student:** ${project.studentName}
**Project:** ${project.projectName}

Below is all the data from their 7 phases of work. Compile this into a polished, comprehensive PRD in Markdown format.

${phaseBlocks}

---

Create a PRD with these sections. Use the student's actual insights and language wherever possible — don't genericize or dilute their specific observations:

# ${project.projectName} — Product Requirements Document

## 1. Problem Statement
Synthesize Phase 1 discovery into a clear problem definition.

## 2. User Personas
Build rich persona(s) from Phase 2 deep-dive data.

## 3. Jobs to Be Done
Structure the JTBD analysis from Phase 3 with functional, emotional, and social dimensions.

## 4. User Journey & Opportunities
Summarize the journey map and key opportunities from Phase 4.

## 5. Feature Specification
List MVP features with priorities from Phase 5. Include the insight-to-feature traceability.

## 6. Technical Specification
Constraints, success criteria, and tradeoffs from Phase 6.

## 7. Build Brief
Platform, deployment, edge cases, branding, and safety guardrails from Phase 7.

## 8. Appendix
Include the full build prompt from Phase 7 synthesis.

Output ONLY the Markdown content. Do not wrap in code fences. Write in a professional but accessible tone appropriate for a medical student audience.`;
}

export function storyGenerationPrompt(
  prdContent: string,
  branding: { primaryColor: string; tagline: string; projectName: string }
): string {
  return `You are generating a self-contained reveal.js HTML presentation that tells the design story of a healthcare project.

**Project:** ${branding.projectName}
**Primary Color:** ${branding.primaryColor || "#18181b"}
**Tagline:** ${branding.tagline || ""}

Here is the full PRD to base the story on:

---
${prdContent}
---

Create a complete, self-contained HTML file using reveal.js (loaded from CDN) that tells the design story in 8-12 slides:

1. **Title slide** — Project name, tagline, student name
2. **The Problem** — What healthcare problem was discovered
3. **The User** — Who this is designed for (persona)
4. **The Job** — What job the user is hiring a solution for
5. **The Journey** — Key friction points and opportunities
6. **The Solution** — MVP features and how they address the jobs
7. **Technical Approach** — Platform, constraints, key tradeoffs
8. **Build Brief** — What gets built and the guardrails
9. **Next Steps** — What success looks like

Design guidelines:
- Use the primary color as the accent color throughout
- Use a clean, modern design with generous whitespace
- Font: system-ui or sans-serif stack
- Keep text concise — bullet points, not paragraphs
- Use the reveal.js "white" theme as the base, customized with the brand color
- Load reveal.js from CDN: https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/
- The HTML must be completely self-contained (inline CSS, CDN JS)
- Include proper viewport meta tags for responsive display

Output ONLY the complete HTML file content. Do not wrap in code fences.`;
}
