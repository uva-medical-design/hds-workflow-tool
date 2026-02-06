"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SaveStatusIndicator } from "@/components/phase-wizard/field-helpers";
import type { PhaseConfig } from "@/lib/phase-config";
import type { SaveStatus } from "@/lib/use-autosave";
import {
  ArrowLeftIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  LoaderIcon,
  SparklesIcon,
} from "lucide-react";

export type WizardStep = "learning" | "input" | "synthesizing" | "review";

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
  onBack: () => void;
  synthesis: Record<string, any>;
  iterationCount: number;
  children: React.ReactNode;
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
  onBack,
  synthesis,
  iterationCount,
  children,
}: PhaseWizardShellProps) {
  const [learningExpanded, setLearningExpanded] = useState(true);

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

          {/* Input form + collapsible learning (when in input/review mode) */}
          {(wizardStep === "input" ||
            wizardStep === "synthesizing" ||
            wizardStep === "review") && (
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
                      {Object.keys(synthesis).length > 0 ? (
                        <div className="prose prose-sm max-w-none text-sm">
                          <pre className="whitespace-pre-wrap rounded-md bg-muted p-4 text-xs">
                            {JSON.stringify(synthesis, null, 2)}
                          </pre>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          AI synthesis will appear here once the backend is
                          connected (Step 5). Your inputs have been saved.
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  <div className="flex items-center justify-end gap-3 border-t border-border pt-6">
                    <Button variant="outline" onClick={onIterate}>
                      Keep Iterating
                    </Button>
                    <Button onClick={onAccept}>Accept & Continue</Button>
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
