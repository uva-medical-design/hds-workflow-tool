"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SaveStatusIndicator } from "@/components/phase-wizard/field-helpers";
import type { PhaseConfig } from "@/lib/phase-config";
import type { SaveStatus } from "@/lib/use-autosave";
import {
  AlertCircleIcon,
  ArrowLeftIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  LoaderIcon,
  SparklesIcon,
} from "lucide-react";

export type WizardStep =
  | "learning"
  | "input"
  | "synthesizing"
  | "review"
  | "iterating";

interface PhaseWizardShellProps {
  config: PhaseConfig;
  wizardStep: WizardStep;
  saveStatus: SaveStatus;
  canSkipLearning: boolean;
  onSkipToInputs: () => void;
  onStartInputs: () => void;
  onSynthesize: () => void;
  onAccept: () => void;
  onIterate: () => void;
  onSubmitIteration: () => void;
  onBack: () => void;
  synthesis: Record<string, any>;
  synthesisError: string | null;
  iterationCount: number;
  iterationFeedback: string;
  onIterationFeedbackChange: (feedback: string) => void;
  children: React.ReactNode;
}

// Render synthesis as readable sections instead of raw JSON
function SynthesisDisplay({ synthesis }: { synthesis: Record<string, any> }) {
  if (Object.keys(synthesis).length === 0) return null;

  // Handle raw_response fallback (when JSON parse failed)
  if (synthesis.raw_response) {
    return (
      <div className="whitespace-pre-wrap text-sm leading-relaxed">
        {synthesis.raw_response}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {Object.entries(synthesis).map(([key, value]) => {
        const label = key
          .replace(/_/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());

        if (Array.isArray(value)) {
          return (
            <div key={key} className="flex flex-col gap-1">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {label}
              </h4>
              <ul className="list-inside list-disc space-y-1 text-sm">
                {value.map((item, i) => (
                  <li key={i}>{String(item)}</li>
                ))}
              </ul>
            </div>
          );
        }

        return (
          <div key={key} className="flex flex-col gap-1">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {label}
            </h4>
            <p className="text-sm leading-relaxed">{String(value)}</p>
          </div>
        );
      })}
    </div>
  );
}

export function PhaseWizardShell({
  config,
  wizardStep,
  saveStatus,
  canSkipLearning,
  onSkipToInputs,
  onStartInputs,
  onSynthesize,
  onAccept,
  onIterate,
  onSubmitIteration,
  onBack,
  synthesis,
  synthesisError,
  iterationCount,
  iterationFeedback,
  onIterationFeedbackChange,
  children,
}: PhaseWizardShellProps) {
  const [learningExpanded, setLearningExpanded] = useState(true);

  const showForm =
    wizardStep === "input" ||
    wizardStep === "synthesizing" ||
    wizardStep === "review" ||
    wizardStep === "iterating";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-background">
        <div className="mx-auto flex max-w-3xl items-center gap-4 px-6 py-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeftIcon className="size-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-sm font-semibold">
              Phase {config.number}: {config.name}
            </h1>
            <p className="text-xs text-muted-foreground">
              {config.description}
            </p>
          </div>
          <SaveStatusIndicator status={saveStatus} />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-8">
        <div className="flex flex-col gap-8">
          {/* Micro-learning section */}
          {wizardStep === "learning" && (
            <Card>
              <CardContent className="flex flex-col gap-4 pt-6">
                <h2 className="text-lg font-semibold">
                  {config.microLearning.title}
                </h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {config.microLearning.content}
                </p>
                <div className="flex gap-3">
                  <Button onClick={onStartInputs}>Begin</Button>
                  {canSkipLearning && (
                    <Button variant="outline" onClick={onSkipToInputs}>
                      Skip to inputs
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Input form + collapsible learning */}
          {showForm && (
            <>
              {/* Collapsible micro-learning */}
              <div className="rounded-lg border border-border">
                <button
                  type="button"
                  className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium hover:bg-muted/50"
                  onClick={() => setLearningExpanded(!learningExpanded)}
                >
                  <span>{config.microLearning.title}</span>
                  {learningExpanded ? (
                    <ChevronUpIcon className="size-4 text-muted-foreground" />
                  ) : (
                    <ChevronDownIcon className="size-4 text-muted-foreground" />
                  )}
                </button>
                {learningExpanded && (
                  <div className="border-t px-4 py-3 text-sm leading-relaxed text-muted-foreground">
                    {config.microLearning.content}
                  </div>
                )}
              </div>

              {/* Phase form (children) */}
              <div>{children}</div>

              {/* Action bar */}
              {wizardStep === "input" && (
                <div className="flex items-center justify-end gap-3 border-t border-border pt-6">
                  <Button onClick={onSynthesize}>
                    <SparklesIcon className="size-4" />
                    Synthesize with AI
                  </Button>
                </div>
              )}

              {/* Synthesizing state */}
              {wizardStep === "synthesizing" && (
                <Card>
                  <CardContent className="flex items-center justify-center gap-3 py-12">
                    <LoaderIcon className="size-5 animate-spin text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Synthesizing with Claude...
                    </span>
                  </CardContent>
                </Card>
              )}

              {/* Synthesis review */}
              {wizardStep === "review" && (
                <div className="flex flex-col gap-6">
                  {/* Error state */}
                  {synthesisError && (
                    <Card>
                      <CardContent className="flex items-start gap-3 pt-6">
                        <AlertCircleIcon className="size-5 shrink-0 text-destructive" />
                        <div className="flex flex-col gap-1">
                          <p className="text-sm font-medium">
                            Synthesis Error
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {synthesisError}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            You can still accept your inputs and continue, or
                            try synthesizing again.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Synthesis content */}
                  {Object.keys(synthesis).length > 0 && (
                    <Card>
                      <CardContent className="flex flex-col gap-4 pt-6">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold">
                            AI Synthesis
                          </h3>
                          {iterationCount > 0 && (
                            <span className="text-xs text-muted-foreground">
                              Iteration {iterationCount + 1}
                            </span>
                          )}
                        </div>
                        <SynthesisDisplay synthesis={synthesis} />
                      </CardContent>
                    </Card>
                  )}

                  {/* No synthesis and no error */}
                  {Object.keys(synthesis).length === 0 && !synthesisError && (
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground">
                          No synthesis available. Click &ldquo;Synthesize with
                          AI&rdquo; to generate one.
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  <div className="flex items-center justify-end gap-3 border-t border-border pt-6">
                    {synthesisError && (
                      <Button variant="outline" onClick={onSynthesize}>
                        <SparklesIcon className="size-4" />
                        Try Again
                      </Button>
                    )}
                    <Button variant="outline" onClick={onIterate}>
                      Keep Iterating
                    </Button>
                    <Button onClick={onAccept}>Accept & Continue</Button>
                  </div>
                </div>
              )}

              {/* Iteration feedback */}
              {wizardStep === "iterating" && (
                <div className="flex flex-col gap-6">
                  <Card>
                    <CardContent className="flex flex-col gap-4 pt-6">
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="iteration-feedback">
                          What would you like to change?
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Tell the AI what to improve, add, remove, or
                          rephrase in the synthesis.
                        </p>
                        <Textarea
                          id="iteration-feedback"
                          value={iterationFeedback}
                          onChange={(e) =>
                            onIterationFeedbackChange(e.target.value)
                          }
                          placeholder="e.g., Focus more on the emotional dimension. The problem statement is too broad — narrow it to medication adherence in elderly patients."
                          rows={4}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex items-center justify-end gap-3 border-t border-border pt-6">
                    <Button
                      variant="outline"
                      onClick={() => onIterationFeedbackChange("")}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={onSubmitIteration}
                      disabled={!iterationFeedback.trim()}
                    >
                      <SparklesIcon className="size-4" />
                      Re-Synthesize
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
