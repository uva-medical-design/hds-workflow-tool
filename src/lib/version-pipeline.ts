// Shared version generation pipeline
// Extracted from phase wizard's handlePhase7Artifacts for reuse in build feedback loop

import { supabase } from "@/lib/supabase";
import type { VersionTrigger } from "@/types";

interface GenerateVersionOptions {
  projectId: string;
  projectName: string;
  projectSlug: string;
  studentName: string;
  versionNumber: string;
  trigger: VersionTrigger;
  triggerDetails: Record<string, unknown>;
  prdContent: string;
  storyContent: string;
  diffSummary: { added: string[]; changed: string[]; removed: string[] };
  onStep?: (step: string) => void;
}

interface VersionResult {
  versionId: string;
  versionNumber: string;
  commitSha: string | null;
  commitUrl: string | null;
}

export async function generateNewVersion(
  opts: GenerateVersionOptions
): Promise<VersionResult> {
  const {
    projectId,
    projectName,
    projectSlug,
    studentName,
    versionNumber,
    trigger,
    triggerDetails,
    prdContent,
    storyContent,
    diffSummary,
    onStep,
  } = opts;

  // Step 1: Commit to GitHub (optional, failure doesn't stop flow)
  onStep?.("Committing artifacts to GitHub...");
  const metadata = {
    projectId,
    projectName,
    studentName,
    version: versionNumber,
    generatedAt: new Date().toISOString(),
    trigger,
  };

  let commitResult: {
    sha: string | null;
    commitUrl: string | null;
    fileUrls: Record<string, string> | null;
  } = { sha: null, commitUrl: null, fileUrls: null };

  try {
    const commitRes = await fetch("/api/commit-artifacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        files: [
          { name: "prd.md", content: prdContent },
          { name: "story.html", content: storyContent },
          {
            name: "metadata.json",
            content: JSON.stringify(metadata, null, 2),
          },
        ],
        studentName,
        projectSlug,
        version: versionNumber,
      }),
    });
    const commitData = await commitRes.json();
    if (commitRes.ok && !commitData.error) {
      commitResult = commitData;
    }
  } catch {
    console.warn("GitHub commit failed, saving version without URLs");
  }

  // Step 2: Create version record
  onStep?.("Saving version record...");
  const prdUrl = commitResult.fileUrls
    ? Object.entries(commitResult.fileUrls).find(([k]) =>
        k.endsWith("prd.md")
      )?.[1] || null
    : null;
  const storyUrl = commitResult.fileUrls
    ? Object.entries(commitResult.fileUrls).find(([k]) =>
        k.endsWith("story.html")
      )?.[1] || null
    : null;

  const { data: version, error: versionError } = await supabase
    .from("versions")
    .insert({
      project_id: projectId,
      version_number: versionNumber,
      trigger,
      trigger_details: triggerDetails,
      prd_url: prdUrl,
      story_url: storyUrl,
      prd_content: prdContent,
      story_content: storyContent,
      diff_summary: diffSummary,
      github_commit_sha: commitResult.sha,
      github_commit_url: commitResult.commitUrl,
    })
    .select()
    .single();

  if (versionError || !version) {
    throw new Error(
      "Failed to save version: " + (versionError?.message || "Unknown error")
    );
  }

  return {
    versionId: version.id,
    versionNumber: version.version_number,
    commitSha: commitResult.sha,
    commitUrl: commitResult.commitUrl,
  };
}

export function getNextVersion(
  lastVersion: string | null,
  isMajor = false
): string {
  if (!lastVersion) return "v1.0";
  const match = lastVersion.match(/^v(\d+)\.(\d+)$/);
  if (!match) return "v1.0";
  const major = parseInt(match[1]);
  const minor = parseInt(match[2]);
  if (isMajor) return `v${major + 1}.0`;
  return `v${major}.${minor + 1}`;
}
