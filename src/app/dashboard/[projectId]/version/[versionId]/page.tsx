"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/user-context";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Version, Project } from "@/types";
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  ExternalLinkIcon,
  DownloadIcon,
  FileTextIcon,
  PresentationIcon,
} from "lucide-react";

export default function VersionViewPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const projectId = params.projectId as string;
  const versionId = params.versionId as string;

  const [version, setVersion] = useState<Version | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPrd, setShowPrd] = useState(false);

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
      const [versionRes, projectRes] = await Promise.all([
        supabase.from("versions").select("*").eq("id", versionId).single(),
        supabase.from("projects").select("*").eq("id", projectId).single(),
      ]);

      if (versionRes.data) setVersion(versionRes.data);
      if (projectRes.data) setProject(projectRes.data);
      setLoading(false);
    }

    fetchData();
  }, [versionId, projectId]);

  function handleDownloadPrd() {
    if (!version?.prd_content) return;
    const blob = new Blob([version.prd_content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project?.slug || "project"}-prd-${version.version_number}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleDownloadStory() {
    if (!version?.story_content) return;
    const blob = new Blob([version.story_content], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project?.slug || "project"}-story-${version.version_number}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handlePreviewStory() {
    if (!version?.story_content) return;
    const blob = new Blob([version.story_content], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading version...</p>
      </div>
    );
  }

  if (!version) {
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
              {project?.name || "Project"} &mdash; {version.version_number}
            </h1>
            <p className="text-xs text-muted-foreground">
              Generated {new Date(version.created_at).toLocaleDateString()}
            </p>
          </div>
          <span className="text-sm font-bold tracking-tight">
            &lt;mdp&gt;
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8">
        {/* Success banner */}
        <Card className="mb-6 border-foreground/20">
          <CardContent className="flex items-center gap-3 pt-6">
            <CheckCircleIcon className="size-6 text-foreground" />
            <div>
              <p className="font-medium">
                Design sprint complete — {version.version_number} generated
              </p>
              <p className="text-sm text-muted-foreground">
                Your PRD and design story have been compiled from all 7 phases of work.
                {version.github_commit_sha && " Artifacts committed to GitHub."}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Artifact cards */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* PRD Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileTextIcon className="size-5" />
                <CardTitle className="text-base">
                  Product Requirements Document
                </CardTitle>
              </div>
              <CardDescription>
                Full PRD compiled from your 7-phase design sprint
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPrd(!showPrd)}
              >
                {showPrd ? "Hide PRD" : "View PRD"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadPrd}
                disabled={!version.prd_content}
              >
                <DownloadIcon className="mr-2 size-3" />
                Download Markdown
              </Button>
              {version.prd_url && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(version.prd_url!, "_blank")}
                >
                  <ExternalLinkIcon className="mr-2 size-3" />
                  View on GitHub
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Story Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <PresentationIcon className="size-5" />
                <CardTitle className="text-base">Design Story</CardTitle>
              </div>
              <CardDescription>
                Reveal.js presentation of your design journey
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviewStory}
                disabled={!version.story_content}
              >
                <ExternalLinkIcon className="mr-2 size-3" />
                Preview Presentation
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadStory}
                disabled={!version.story_content}
              >
                <DownloadIcon className="mr-2 size-3" />
                Download HTML
              </Button>
              {version.story_url && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(version.story_url!, "_blank")}
                >
                  <ExternalLinkIcon className="mr-2 size-3" />
                  View on GitHub
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* GitHub info */}
        {version.github_commit_sha && (
          <Card className="mt-4">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                Commit:{" "}
                <code className="text-xs">{version.github_commit_sha.slice(0, 7)}</code>
                {version.github_commit_url && (
                  <>
                    {" "}
                    &mdash;{" "}
                    <a
                      href={version.github_commit_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-foreground"
                    >
                      View on GitHub
                    </a>
                  </>
                )}
              </p>
            </CardContent>
          </Card>
        )}

        {/* PRD content (expandable) */}
        {showPrd && version.prd_content && (
          <Card className="mt-4">
            <CardContent className="pt-6">
              <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap font-mono text-xs leading-relaxed">
                {version.prd_content}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Back to project */}
        <div className="mt-8 flex justify-center">
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/${projectId}`)}
          >
            <ArrowLeftIcon className="mr-2 size-3" />
            Back to Project
          </Button>
        </div>
      </main>
    </div>
  );
}
