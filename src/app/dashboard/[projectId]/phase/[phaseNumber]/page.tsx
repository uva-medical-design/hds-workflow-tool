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
  const [wizardStep, setWizardStep] = useState<WizardStep>("learning");
  const [loading, setLoading] = useState(true);

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

  // Synthesize (placeholder for Step 5)
  async function handleSynthesize() {
    setWizardStep("synthesizing");

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

    // Placeholder: Step 5 will replace with actual Claude API call
    setTimeout(() => {
      setSynthesis({});
      setWizardStep("review");
    }, 1500);
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

  // Iterate: save current synthesis to history, back to input
  async function handleIterate() {
    const currentHistory = phaseData?.iteration_history || [];
    const updatedHistory = [
      ...currentHistory,
      { synthesis, iterated_at: new Date().toISOString() },
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

    setSynthesis({});
    setIterationCount(updatedHistory.length);
    setWizardStep("input");
  }

  const PhaseForm = getPhaseForm(phaseNumber);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading...</p>
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
      onBack={() => router.push(`/dashboard/${projectId}`)}
      synthesis={synthesis}
      iterationCount={iterationCount}
    >
      <PhaseForm values={inputs} onChange={setInputs} />
    </PhaseWizardShell>
  );
}
