"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/user-context";
import type { Project, PhaseData } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PHASE_CONFIGS } from "@/lib/phase-config";
import { ArrowLeftIcon, CheckCircleIcon, CircleIcon, PlayCircleIcon } from "lucide-react";

export default function ProjectWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<Project | null>(null);
  const [phaseDataMap, setPhaseDataMap] = useState<Record<number, PhaseData>>({});
  const [loading, setLoading] = useState(true);

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
    if (!projectId) return;

    async function fetchProject() {
      const [projectRes, phasesRes] = await Promise.all([
        supabase.from("projects").select("*").eq("id", projectId).single(),
        supabase.from("phase_data").select("*").eq("project_id", projectId),
      ]);

      if (projectRes.data) setProject(projectRes.data);
      if (phasesRes.data) {
        const map: Record<number, PhaseData> = {};
        for (const pd of phasesRes.data) {
          map[pd.phase] = pd;
        }
        setPhaseDataMap(map);
      }
      setLoading(false);
    }

    fetchProject();
  }, [projectId]);

  function getPhaseStatus(phaseNumber: number) {
    const pd = phaseDataMap[phaseNumber];
    if (!project) return "locked";
    if (pd?.status === "accepted" || pd?.status === "skipped") return "completed";
    if (phaseNumber === project.current_phase) return "current";
    if (phaseNumber < project.current_phase) return "completed";
    return "locked";
  }

  if (loading || !project) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">
          {loading ? "Loading project..." : "Project not found"}
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
            onClick={() => router.push("/dashboard")}
          >
            <ArrowLeftIcon className="size-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold">
              {project.name || "Untitled Project"}
            </h1>
            <p className="text-xs text-muted-foreground">
              Phase {project.current_phase} of 7
            </p>
          </div>
          <span className="text-sm font-bold tracking-tight">
            &lt;mdp&gt;
          </span>
        </div>
      </header>

      {/* Phase List */}
      <main className="mx-auto max-w-4xl px-6 py-8">
        <div className="flex flex-col gap-3">
          {PHASE_CONFIGS.map((phase) => {
            const status = getPhaseStatus(phase.number);
            return (
              <Card
                key={phase.number}
                className={`transition-colors ${
                  status === "current"
                    ? "border-foreground/30"
                    : status === "locked"
                      ? "opacity-50"
                      : ""
                } ${status !== "locked" ? "cursor-pointer hover:border-foreground/20" : ""}`}
                onClick={() => {
                  if (status !== "locked") {
                    router.push(`/dashboard/${projectId}/phase/${phase.number}`);
                  }
                }}
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    {status === "completed" ? (
                      <CheckCircleIcon className="size-5 text-foreground" />
                    ) : status === "current" ? (
                      <PlayCircleIcon className="size-5 text-foreground" />
                    ) : (
                      <CircleIcon className="size-5 text-muted-foreground/40" />
                    )}
                    <div className="flex-1">
                      <CardTitle className="text-base">
                        Phase {phase.number}: {phase.name}
                      </CardTitle>
                      <CardDescription>{phase.description}</CardDescription>
                    </div>
                    {status === "current" && (
                      <Button size="sm" variant="outline">
                        Continue
                      </Button>
                    )}
                    {status === "completed" && (
                      <span className="text-xs text-muted-foreground">
                        Completed
                      </span>
                    )}
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}
