"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/user-context";
import { useAutosave } from "@/lib/use-autosave";
import { getPhaseConfig } from "@/lib/phase-config";
import { getPhaseForm } from "@/components/phase-wizard/phase-forms";
import {
  PhaseWizardShell,
  type WizardStep,
} from "@/components/phase-wizard/phase-wizard-shell";
import type { PhaseData, Project } from "@/types";

export default function PhaseWizardPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const projectId = params.projectId as string;
  const phaseNumber = Number(params.phaseNumber);
  const config = getPhaseConfig(phaseNumber);

  const [project, setProject] = useState<Project | null>(null);
  const [phaseData, setPhaseData] = useState<PhaseData | null>(null);
  const [inputs, setInputs] = useState<Record<string, any>>(
    config.emptyInputs
  );
  const [synthesis, setSynthesis] = useState<Record<string, any>>({});
  const [iterationCount, setIterationCount] = useState(0);
  const [iterationFeedback, setIterationFeedback] = useState("");
  const [synthesisError, setSynthesisError] = useState<string | null>(null);
  const [wizardStep, setWizardStep] = useState<WizardStep>("learning");
  const [loading, setLoading] = useState(true);
  const [generatingArtifacts, setGeneratingArtifacts] = useState(false);
  const [artifactStep, setArtifactStep] = useState("");

  // Redirect if no user
  useEffect(() => {
    if (!user) {
      const timeout = setTimeout(() => {
        const stored = localStorage.getItem("hds-user");
        if (!stored) router.push("/");
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [user, router]);

  // Validate phase number
  useEffect(() => {
    if (phaseNumber < 1 || phaseNumber > 7) {
      router.push(`/dashboard/${projectId}`);
    }
  }, [phaseNumber, projectId, router]);

  // Fetch project and phase data
  useEffect(() => {
    if (!projectId) return;

    async function fetchData() {
      const [projectRes, phaseRes] = await Promise.all([
        supabase.from("projects").select("*").eq("id", projectId).single(),
        supabase
          .from("phase_data")
          .select("*")
          .eq("project_id", projectId)
          .eq("phase", phaseNumber)
          .single(),
      ]);

      if (!projectRes.data) {
        router.push("/dashboard");
        return;
      }

      setProject(projectRes.data);

      // Check if phase is locked (beyond current phase)
      if (phaseNumber > projectRes.data.current_phase) {
        router.push(`/dashboard/${projectId}`);
        return;
      }

      if (phaseRes.data) {
        setPhaseData(phaseRes.data);
        // Merge saved inputs with empty defaults (in case schema evolved)
        setInputs({ ...config.emptyInputs, ...phaseRes.data.inputs });
        setSynthesis(phaseRes.data.synthesis || {});
        setIterationCount(
          (phaseRes.data.iteration_history || []).length
        );

        // Determine initial wizard step based on status
        if (
          phaseRes.data.status === "accepted" ||
          phaseRes.data.status === "skipped"
        ) {
          setWizardStep("review");
        } else if (
          Object.keys(phaseRes.data.inputs || {}).some(
            (k) => {
              const v = (phaseRes.data.inputs as Record<string, any>)[k];
              return v !== "" && v !== null && !(Array.isArray(v) && v.length === 0);
            }
          )
        ) {
          // Has some inputs already — go straight to input step
          setWizardStep("input");
        }
      }

      setLoading(false);
    }

    fetchData();
  }, [projectId, phaseNumber, config.emptyInputs, router]);

  // Autosave (only when in input step)
  const { saveStatus } = useAutosave(
    projectId,
    phaseNumber,
    inputs,
    wizardStep === "input" && !loading
  );

  // Can skip learning on return visits
  const canSkipLearning =
    phaseData?.status === "accepted" ||
    phaseData?.status === "skipped" ||
    (phaseData !== null &&
      Object.keys(phaseData.inputs || {}).some(
        (k) => {
          const v = (phaseData.inputs as Record<string, any>)[k];
          return v !== "" && v !== null && !(Array.isArray(v) && v.length === 0);
        }
      ));

  // Synthesize via Claude API
  async function handleSynthesize() {
    setWizardStep("synthesizing");
    setSynthesisError(null);

    // Save current inputs before synthesizing
    await supabase.from("phase_data").upsert(
      {
        project_id: projectId,
        phase: phaseNumber,
        inputs,
        status: "in_progress",
      },
      { onConflict: "project_id,phase" }
    );

    try {
      const res = await fetch("/api/synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phase: phaseNumber,
          inputs,
          ...(iterationFeedback && {
            previousSynthesis: synthesis,
            iterationFeedback,
          }),
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setSynthesisError(data.error || "Synthesis failed");
        setWizardStep("review");
        return;
      }

      setSynthesis(data.synthesis);
      setIterationFeedback("");
      setWizardStep("review");
    } catch {
      setSynthesisError("Network error. Please try again.");
      setWizardStep("review");
    }
  }

  // Accept synthesis and advance
  async function handleAccept() {
    // Update phase_data status
    await supabase.from("phase_data").upsert(
      {
        project_id: projectId,
        phase: phaseNumber,
        inputs,
        synthesis,
        status: "accepted",
        accepted_at: new Date().toISOString(),
      },
      { onConflict: "project_id,phase" }
    );

    // Phase 7: trigger artifact generation pipeline
    if (phaseNumber === 7) {
      await handlePhase7Artifacts();
      return;
    }

    // Advance project to next phase if this is the current phase
    if (project && phaseNumber === project.current_phase && phaseNumber < 7) {
      await supabase
        .from("projects")
        .update({
          current_phase: phaseNumber + 1,
          current_step: "input",
        })
        .eq("id", projectId);
    }

    router.push(`/dashboard/${projectId}`);
  }

  // Phase 7 artifact generation: PRD → Story → GitHub commit → Version record
  async function handlePhase7Artifacts() {
    setGeneratingArtifacts(true);
    setSynthesisError(null);

    try {
      // Step 1: Generate PRD
      setArtifactStep("Generating PRD from all 7 phases...");
      const prdRes = await fetch("/api/generate-prd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      const prdData = await prdRes.json();
      if (!prdRes.ok || prdData.error) {
        throw new Error(prdData.error || "PRD generation failed");
      }

      // Step 2: Generate story
      setArtifactStep("Creating reveal.js design story...");
      const branding = (inputs as any).branding || {};
      const projectName = (inputs as any).project_name || project?.name || "Untitled";
      const storyRes = await fetch("/api/generate-story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prdContent: prdData.prdContent,
          branding: {
            primaryColor: branding.primary_color || "#18181b",
            tagline: branding.tagline || "",
            projectName,
          },
        }),
      });
      const storyData = await storyRes.json();
      if (!storyRes.ok || storyData.error) {
        throw new Error(storyData.error || "Story generation failed");
      }

      // Step 3: Determine version number
      const { data: existingVersions } = await supabase
        .from("versions")
        .select("version_number")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(1);

      const nextVersion = getNextVersion(
        existingVersions?.[0]?.version_number || null
      );

      // Step 4: Attempt GitHub commit
      setArtifactStep("Committing artifacts to GitHub...");
      const metadata = {
        projectId,
        projectName,
        studentName: user?.name || "Unknown",
        version: nextVersion,
        generatedAt: new Date().toISOString(),
        phases: 7,
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
              { name: "prd.md", content: prdData.prdContent },
              { name: "story.html", content: storyData.storyContent },
              { name: "metadata.json", content: JSON.stringify(metadata, null, 2) },
            ],
            studentName: user?.name || "Unknown",
            projectSlug: project?.slug || "project",
            version: nextVersion,
          }),
        });
        const commitData = await commitRes.json();
        if (commitRes.ok && !commitData.error) {
          commitResult = commitData;
        }
      } catch {
        // GitHub commit failed — continue without it
        console.warn("GitHub commit failed, saving version without URLs");
      }

      // Step 5: Create version record in Supabase
      setArtifactStep("Saving version record...");
      const prdUrl = commitResult.fileUrls
        ? Object.entries(commitResult.fileUrls).find(([k]) => k.endsWith("prd.md"))?.[1] || null
        : null;
      const storyUrl = commitResult.fileUrls
        ? Object.entries(commitResult.fileUrls).find(([k]) => k.endsWith("story.html"))?.[1] || null
        : null;

      const { data: version, error: versionError } = await supabase
        .from("versions")
        .insert({
          project_id: projectId,
          version_number: nextVersion,
          trigger: "phase_7_complete",
          trigger_details: { phase: 7 },
          prd_url: prdUrl,
          story_url: storyUrl,
          prd_content: prdData.prdContent,
          story_content: storyData.storyContent,
          diff_summary: { added: ["Initial PRD", "Design Story"], changed: [], removed: [] },
          github_commit_sha: commitResult.sha,
          github_commit_url: commitResult.commitUrl,
        })
        .select()
        .single();

      if (versionError) {
        throw new Error("Failed to save version: " + versionError.message);
      }

      // Mark project as completed
      await supabase
        .from("projects")
        .update({ status: "completed" })
        .eq("id", projectId);

      // Navigate to version page
      router.push(`/dashboard/${projectId}/version/${version.id}`);
    } catch (err: any) {
      console.error("Phase 7 artifact generation error:", err);
      setSynthesisError(err.message || "Artifact generation failed");
      setGeneratingArtifacts(false);
      setArtifactStep("");
    }
  }

  function getNextVersion(lastVersion: string | null): string {
    if (!lastVersion) return "v1.0";
    const match = lastVersion.match(/^v(\d+)\.(\d+)$/);
    if (!match) return "v1.0";
    const major = parseInt(match[1]);
    const minor = parseInt(match[2]);
    return `v${major}.${minor + 1}`;
  }

  // Iterate: save current synthesis to history, go to iterate step for feedback
  async function handleIterate() {
    setWizardStep("iterating");
  }

  // Submit iteration with feedback
  async function handleSubmitIteration() {
    const currentHistory = phaseData?.iteration_history || [];
    const updatedHistory = [
      ...currentHistory,
      { synthesis, feedback: iterationFeedback, iterated_at: new Date().toISOString() },
    ];

    await supabase.from("phase_data").upsert(
      {
        project_id: projectId,
        phase: phaseNumber,
        inputs,
        synthesis: {},
        iteration_history: updatedHistory,
        status: "in_progress",
      },
      { onConflict: "project_id,phase" }
    );

    setIterationCount(updatedHistory.length);
    // Go straight to synthesizing with the feedback
    handleSynthesize();
  }

  const PhaseForm = getPhaseForm(phaseNumber);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (generatingArtifacts) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6">
        <div className="size-8 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground" />
        <p className="text-sm font-medium">{artifactStep}</p>
        <p className="text-xs text-muted-foreground">
          This may take a minute — we&apos;re compiling your full design sprint into a PRD and design story.
        </p>
      </div>
    );
  }

  return (
    <PhaseWizardShell
      config={config}
      wizardStep={wizardStep}
      saveStatus={saveStatus}
      canSkipLearning={canSkipLearning ?? false}
      onSkipToInputs={() => setWizardStep("input")}
      onStartInputs={() => setWizardStep("input")}
      onSynthesize={handleSynthesize}
      onAccept={handleAccept}
      onIterate={handleIterate}
      onSubmitIteration={handleSubmitIteration}
      onBack={() => router.push(`/dashboard/${projectId}`)}
      synthesis={synthesis}
      synthesisError={synthesisError}
      iterationCount={iterationCount}
      iterationFeedback={iterationFeedback}
      onIterationFeedbackChange={setIterationFeedback}
    >
      <PhaseForm values={inputs} onChange={setInputs} />
    </PhaseWizardShell>
  );
}
