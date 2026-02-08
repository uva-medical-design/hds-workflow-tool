// Generates a Claude Code-optimized build prompt from PRD content

interface BuildPromptOptions {
  prdContent: string;
  projectName: string;
}

export function generateBuildPrompt({
  prdContent,
  projectName,
}: BuildPromptOptions): string {
  // Try to extract key sections from the PRD markdown
  const sections = parsePrdSections(prdContent);

  const parts: string[] = [
    `# Build: ${projectName}`,
    "",
    "You are building a healthcare application based on the following Product Requirements Document.",
    "Follow the PRD closely. Build the MVP features first, then iterate.",
    "",
  ];

  if (sections.buildBrief) {
    parts.push("## Build Brief", sections.buildBrief, "");
  }

  if (sections.features) {
    parts.push("## MVP Features", sections.features, "");
  }

  if (sections.technical) {
    parts.push("## Technical Spec", sections.technical, "");
  }

  if (sections.problem) {
    parts.push("## Problem Context", sections.problem, "");
  }

  // Always include the full PRD as reference
  parts.push(
    "---",
    "",
    "## Full PRD Reference",
    "",
    prdContent
  );

  return parts.join("\n");
}

interface PrdSections {
  problem: string | null;
  features: string | null;
  technical: string | null;
  buildBrief: string | null;
}

function parsePrdSections(markdown: string): PrdSections {
  const result: PrdSections = {
    problem: null,
    features: null,
    technical: null,
    buildBrief: null,
  };

  const sectionRegex = /^##\s+\d*\.?\s*(.*)/gm;
  const sections: { title: string; start: number }[] = [];
  let match;

  while ((match = sectionRegex.exec(markdown)) !== null) {
    sections.push({ title: match[1].trim().toLowerCase(), start: match.index });
  }

  for (let i = 0; i < sections.length; i++) {
    const start = sections[i].start;
    const end = i + 1 < sections.length ? sections[i + 1].start : markdown.length;
    const content = markdown.slice(start, end).trim();
    const title = sections[i].title;

    if (title.includes("problem")) {
      result.problem = content;
    } else if (title.includes("feature")) {
      result.features = content;
    } else if (title.includes("technical")) {
      result.technical = content;
    } else if (title.includes("build brief") || title.includes("appendix")) {
      result.buildBrief = content;
    }
  }

  return result;
}
