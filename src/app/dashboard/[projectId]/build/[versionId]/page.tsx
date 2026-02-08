"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/user-context";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon, ClipboardIcon } from "lucide-react";
import { generateBuildPrompt } from "@/lib/build-prompt";
import { generateNewVersion, getNextVersion } from "@/lib/version-pipeline";
import { PrdReference } from "@/components/build-mode/prd-reference";
import { FeatureChecklist } from "@/components/build-mode/feature-checklist";
import { FeedbackEntryInput } from "@/components/build-mode/feedback-entry-input";
import { FeedbackEntryList } from "@/components/build-mode/feedback-entry-list";
import { SynthesisResults } from "@/components/build-mode/synthesis-results";
import { VersionTimeline } from "@/components/build-mode/version-timeline";
import type { Version, Project, FeedbackEntry, FeedbackTag } from "@/types";

type SynthesisState = "idle" | "synthesizing" | "results" | "generating";

export default function BuildModePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const projectId = params.projectId as string;
  const versionId = params.versionId as string;

  const [version, setVersion] = useState<Version | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [entries, setEntries] = useState<FeedbackEntry[]>([]);
  const [allVersions, setAllVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Synthesis state machine
  const [synthesisState, setSynthesisState] = useState<SynthesisState>("idle");
  const [synthesisData, setSynthesisData] = useState<any>(null);
  const [synthesisError, setSynthesisError] = useState<string | null>(null);
  const [generationStep, setGenerationStep] = useState("");

  useEffect(() => {
    if (!user) {
      const timeout = setTimeout(() => {
        const stored = localStorage.getItem("hds-user");
        if (!stored) router.push("/");
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [user, router]);

  useEffect(() => {
    if (!versionId || !projectId) return;

    async function fetchData() {
      const [versionRes, projectRes, entriesRes, versionsRes] =
        await Promise.all([
          supabase.from("versions").select("*").eq("id", versionId).single(),
          supabase.from("projects").select("*").eq("id", projectId).single(),
          supabase
            .from("feedback_entries")
            .select("*")
            .eq("version_id", versionId)
            .order("created_at", { ascending: false }),
          supabase
            .from("versions")
            .select("*")
            .eq("project_id", projectId)
            .order("created_at", { ascending: false }),
        ]);

      if (versionRes.data) setVersion(versionRes.data);
      if (projectRes.data) setProject(projectRes.data);
      if (entriesRes.data) setEntries(entriesRes.data);
      if (versionsRes.data) setAllVersions(versionsRes.data);
      setLoading(false);
    }

    fetchData();
  }, [versionId, projectId]);

  const handleSubmitEntry = useCallback(
    async (content: string, tag: FeedbackTag) => {
      const { data, error } = await supabase
        .from("feedback_entries")
        .insert({
          version_id: versionId,
          project_id: projectId,
          content,
          tag,
        })
        .select()
        .single();

      if (error) throw new Error("Failed to save entry");
      if (data) {
        setEntries((prev) => [data, ...prev]);
      }
    },
    [versionId, projectId]
  );

  const handleDeleteEntry = useCallback(async (id: string) => {
    const { error } = await supabase
      .from("feedback_entries")
      .delete()
      .eq("id", id);

    if (!error) {
      setEntries((prev) => prev.filter((e) => e.id !== id));
    }
  }, []);

  async function handleCopyBuildPrompt() {
    if (!version?.prd_content) return;
    const prompt = generateBuildPrompt({
      prdContent: version.prd_content,
      projectName: project?.name || "Project",
    });
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSynthesize() {
    setSynthesisState("synthesizing");
    setSynthesisError(null);

    try {
      const res = await fetch("/api/synthesize-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versionId, projectId }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setSynthesisError(data.error || "Synthesis failed");
        setSynthesisState("idle");
        return;
      }

      setSynthesisData(data.synthesis);
      setSynthesisState("results");
    } catch {
      setSynthesisError("Network error. Please try again.");
      setSynthesisState("idle");
    }
  }

  async function handleAcceptSynthesis(
    selectedUpdates: Array<{
      action: string;
      section: string;
      description: string;
      rationale: string;
    }>,
    isMajor: boolean
  ) {
    if (!version || !project) return;

    setSynthesisState("generating");
    setSynthesisError(null);

    try {
      // Step 1: Generate revised PRD
      setGenerationStep("Generating revised PRD...");
      const prdRes = await fetch("/api/generate-prd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          revisionInstructions: {
            previousPrd: version.prd_content,
            updates: selectedUpdates,
            projectName: project.name || "Untitled",
          },
        }),
      });
      const prdData = await prdRes.json();
      if (!prdRes.ok || prdData.error) {
        throw new Error(prdData.error || "PRD revision failed");
      }

      // Step 2: Generate updated story
      setGenerationStep("Creating updated design story...");
      const branding = {
        primaryColor: "#18181b",
        tagline: "",
        projectName: project.name || "Untitled",
      };
      const storyRes = await fetch("/api/generate-story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prdContent: prdData.prdContent,
          branding,
        }),
      });
      const storyData = await storyRes.json();
      if (!storyRes.ok || storyData.error) {
        throw new Error(storyData.error || "Story generation failed");
      }

      // Step 3: Compute version number
      const nextVersion = getNextVersion(version.version_number, isMajor);

      // Step 4: Create version record (+ GitHub commit)
      const diffSummary = {
        added: selectedUpdates
          .filter((u) => u.action.startsWith("+"))
          .map((u) => u.description),
        changed: selectedUpdates
          .filter((u) => u.action.startsWith("~"))
          .map((u) => u.description),
        removed: selectedUpdates
          .filter((u) => u.action.startsWith("-"))
          .map((u) => u.description),
      };

      const result = await generateNewVersion({
        projectId,
        projectName: project.name || "Untitled",
        projectSlug: project.slug || "project",
        studentName: user?.name || "Unknown",
        versionNumber: nextVersion,
        trigger: "build_feedback",
        triggerDetails: {
          previousVersionId: versionId,
          updatesApplied: selectedUpdates.length,
          isMajor,
        },
        prdContent: prdData.prdContent,
        storyContent: storyData.storyContent,
        diffSummary,
        onStep: setGenerationStep,
      });

      // Navigate to the new version's build page
      router.push(`/dashboard/${projectId}/build/${result.versionId}`);
    } catch (err: any) {
      console.error("Version generation error:", err);
      setSynthesisError(err.message || "Version generation failed");
      setSynthesisState("results");
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading build mode...</p>
      </div>
    );
  }

  if (!version || !project) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Version not found</p>
      </div>
    );
  }

  // Full-screen generating state
  if (synthesisState === "generating") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6">
        <div className="size-8 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground" />
        <p className="text-sm font-medium">{generationStep}</p>
        <p className="text-xs text-muted-foreground">
          Generating a new version from your feedback — this may take a minute.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-4xl items-center gap-4 px-6 py-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/dashboard/${projectId}`)}
          >
            <ArrowLeftIcon className="size-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold">
              {project.name || "Project"} &mdash; {version.version_number}{" "}
              &mdash; Build Mode
            </h1>
            <p className="text-xs text-muted-foreground">
              Log observations as you build your prototype
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyBuildPrompt}
            disabled={!version.prd_content}
          >
            <ClipboardIcon className="mr-2 size-3" />
            {copied ? "Copied!" : "Copy Build Prompt"}
          </Button>
          <span className="text-sm font-bold tracking-tight">
            &lt;mdp&gt;
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8 space-y-6">
        {/* PRD Reference (collapsible) */}
        <PrdReference version={version} project={project} />

        {/* Feature Checklist */}
        <FeatureChecklist
          versionId={versionId}
          projectId={projectId}
          prdContent={version.prd_content}
        />

        {/* Feedback Stream */}
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Feedback Log
          </h2>
          <div className="space-y-4">
            <FeedbackEntryInput onSubmit={handleSubmitEntry} />
            <FeedbackEntryList
              entries={entries}
              onDelete={handleDeleteEntry}
            />
          </div>
        </div>

        {/* Synthesis Error */}
        {synthesisError && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950">
            <p className="text-sm text-red-800 dark:text-red-300">
              {synthesisError}
            </p>
          </div>
        )}

        {/* Synthesis Results */}
        {synthesisState === "results" && synthesisData && (
          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              AI Synthesis
            </h2>
            <SynthesisResults
              synthesis={synthesisData}
              currentVersion={version.version_number}
              onAccept={handleAcceptSynthesis}
              onSkip={() => {
                setSynthesisState("idle");
                setSynthesisData(null);
              }}
              accepting={false}
            />
          </div>
        )}

        {/* Synthesize Button */}
        {synthesisState === "idle" && (
          <div className="flex justify-center pt-4">
            <Button
              size="lg"
              onClick={handleSynthesize}
              disabled={entries.length === 0}
            >
              {entries.length === 0
                ? "Add feedback to synthesize"
                : "Synthesize Feedback"}
            </Button>
          </div>
        )}

        {synthesisState === "synthesizing" && (
          <div className="flex justify-center pt-4">
            <div className="flex items-center gap-3">
              <div className="size-5 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground" />
              <p className="text-sm text-muted-foreground">
                Analyzing feedback patterns...
              </p>
            </div>
          </div>
        )}

        {/* Version Timeline */}
        <VersionTimeline
          versions={allVersions}
          currentVersionId={versionId}
          projectId={projectId}
          onNavigate={(vid) =>
            router.push(`/dashboard/${projectId}/build/${vid}`)
          }
        />
      </main>
    </div>
  );
}
