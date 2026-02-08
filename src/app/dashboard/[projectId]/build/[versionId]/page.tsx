"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/user-context";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon, ClipboardIcon } from "lucide-react";
import { generateBuildPrompt } from "@/lib/build-prompt";
import { PrdReference } from "@/components/build-mode/prd-reference";
import { FeatureChecklist } from "@/components/build-mode/feature-checklist";
import { FeedbackEntryInput } from "@/components/build-mode/feedback-entry-input";
import { FeedbackEntryList } from "@/components/build-mode/feedback-entry-list";
import type { Version, Project, FeedbackEntry, FeedbackTag } from "@/types";

export default function BuildModePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const projectId = params.projectId as string;
  const versionId = params.versionId as string;

  const [version, setVersion] = useState<Version | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [entries, setEntries] = useState<FeedbackEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

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
      const [versionRes, projectRes, entriesRes] = await Promise.all([
        supabase.from("versions").select("*").eq("id", versionId).single(),
        supabase.from("projects").select("*").eq("id", projectId).single(),
        supabase
          .from("feedback_entries")
          .select("*")
          .eq("version_id", versionId)
          .order("created_at", { ascending: false }),
      ]);

      if (versionRes.data) setVersion(versionRes.data);
      if (projectRes.data) setProject(projectRes.data);
      if (entriesRes.data) setEntries(entriesRes.data);
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

        {/* Synthesize button — disabled placeholder, Commit 6-7 */}
        <div className="flex justify-center pt-4">
          <Button size="lg" disabled>
            Synthesize Feedback (coming soon)
          </Button>
        </div>
      </main>
    </div>
  );
}
