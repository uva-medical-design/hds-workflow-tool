"use client";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CheckIcon,
  LoaderIcon,
  PencilIcon,
  SparklesIcon,
  XIcon,
} from "lucide-react";
import type { Phase4Inputs } from "@/types";
import type { PhaseFormProps } from ".";

type Phase4SubStep =
  | "journey_input"
  | "journey_synthesizing"
  | "journey_review"
  | "opportunities_input"
  | "hmw_generating"
  | "hmw_review";

function deriveInitialSubStep(data: Phase4Inputs): Phase4SubStep {
  if (data.opportunities_accepted) return "hmw_review";
  if (
    data.journey_map_accepted &&
    data.selected_opportunities.some((o) => o.hmw_options.length > 0)
  )
    return "hmw_review";
  if (data.journey_map_accepted) return "opportunities_input";
  if (data.journey_synthesis) return "journey_review";
  return "journey_input";
}

// Render synthesis as readable sections
function SynthesisDisplay({ synthesis }: { synthesis: Record<string, any> }) {
  if (!synthesis || Object.keys(synthesis).length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      {Object.entries(synthesis).map(([key, value]) => {
        const label = key
          .replace(/_/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());

        if (Array.isArray(value)) {
          // Handle array of objects (like friction_points)
          if (value.length > 0 && typeof value[0] === "object") {
            return (
              <div key={key} className="flex flex-col gap-1">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {label}
                </h4>
                <ul className="list-inside list-disc space-y-1 text-sm">
                  {value.map((item, i) => (
                    <li key={i}>
                      {typeof item === "object"
                        ? item.description || JSON.stringify(item)
                        : String(item)}
                    </li>
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

export function Phase4Form({ values, onChange }: PhaseFormProps) {
  const data = values as Phase4Inputs;
  const [subStep, setSubStep] = useState<Phase4SubStep>(() =>
    deriveInitialSubStep(data)
  );
  const [synthesisError, setSynthesisError] = useState<string | null>(null);
  const [showEditConfirm, setShowEditConfirm] = useState(false);

  // Track custom opportunity text input
  const [customOpportunity, setCustomOpportunity] = useState("");
  // Track which HMW is being edited inline
  const [editingHmwIndex, setEditingHmwIndex] = useState<number | null>(null);

  function update(patch: Partial<Phase4Inputs>) {
    onChange({ ...data, ...patch });
  }

  // ── Journey Step Helpers ──

  function updateStep(index: number, field: string, value: string) {
    const updated = [...data.journey_steps];
    updated[index] = { ...updated[index], [field]: value };
    update({ journey_steps: updated });
  }

  function addStep() {
    update({
      journey_steps: [
        ...data.journey_steps,
        { step: "", label: "neutral" as const, notes: "" },
      ],
    });
  }

  function removeStep(index: number) {
    update({
      journey_steps: data.journey_steps.filter((_, i) => i !== index),
    });
  }

  // ── Synthesis Calls ──

  async function synthesizeJourney() {
    setSubStep("journey_synthesizing");
    setSynthesisError(null);

    try {
      const res = await fetch("/api/synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phase: 4,
          inputs: data,
          subStep: "journey",
        }),
      });
      const result = await res.json();

      if (!res.ok || result.error) {
        setSynthesisError(result.error || "Journey synthesis failed");
        setSubStep("journey_input");
        return;
      }

      update({ journey_synthesis: result.synthesis });
      setSubStep("journey_review");
    } catch {
      setSynthesisError("Network error. Please try again.");
      setSubStep("journey_input");
    }
  }

  async function generateHmws() {
    setSubStep("hmw_generating");
    setSynthesisError(null);

    try {
      const res = await fetch("/api/synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phase: 4,
          inputs: data,
          subStep: "generate_hmw",
        }),
      });
      const result = await res.json();

      if (!res.ok || result.error) {
        setSynthesisError(result.error || "HMW generation failed");
        setSubStep("opportunities_input");
        return;
      }

      // Merge HMW options into selected_opportunities
      const hmwSets = result.synthesis?.hmw_sets || [];
      const updatedOpps = data.selected_opportunities.map((opp, i) => {
        const matchingSet = hmwSets[i];
        return {
          ...opp,
          hmw_options: matchingSet?.hmw_options || [],
          chosen_hmw: matchingSet?.hmw_options?.[0] || "",
          was_edited: false,
        };
      });

      update({ selected_opportunities: updatedOpps });
      setSubStep("hmw_review");
    } catch {
      setSynthesisError("Network error. Please try again.");
      setSubStep("opportunities_input");
    }
  }

  // ── Accept / Edit Handlers ──

  function acceptJourney() {
    update({ journey_map_accepted: true });
    setSubStep("opportunities_input");
  }

  function handleEditJourneyClick() {
    if (
      data.selected_opportunities.length > 0 ||
      data.opportunities_accepted
    ) {
      setShowEditConfirm(true);
    } else {
      setSubStep("journey_input");
      update({ journey_map_accepted: false });
    }
  }

  function confirmEditJourney() {
    setShowEditConfirm(false);
    update({
      journey_map_accepted: false,
      selected_opportunities: [],
      opportunities_accepted: false,
      opportunities_synthesis: null,
    });
    setSubStep("journey_input");
  }

  function acceptOpportunities() {
    update({ opportunities_accepted: true });
  }

  // ── Opportunity Selection ──

  function toggleOpportunity(stepIndex: number, description: string) {
    const exists = data.selected_opportunities.find(
      (o) => o.source_step_index === stepIndex
    );
    if (exists) {
      update({
        selected_opportunities: data.selected_opportunities.filter(
          (o) => o.source_step_index !== stepIndex
        ),
      });
    } else if (data.selected_opportunities.length < 3) {
      update({
        selected_opportunities: [
          ...data.selected_opportunities,
          {
            source_step_index: stepIndex,
            description,
            hmw_options: [],
            chosen_hmw: "",
            was_edited: false,
          },
        ],
      });
    }
  }

  function addCustomOpportunity() {
    if (!customOpportunity.trim()) return;
    if (data.selected_opportunities.length >= 3) return;
    update({
      selected_opportunities: [
        ...data.selected_opportunities,
        {
          source_step_index: "custom" as const,
          description: customOpportunity.trim(),
          hmw_options: [],
          chosen_hmw: "",
          was_edited: false,
        },
      ],
    });
    setCustomOpportunity("");
  }

  function removeOpportunity(index: number) {
    update({
      selected_opportunities: data.selected_opportunities.filter(
        (_, i) => i !== index
      ),
    });
  }

  // ── HMW Selection ──

  function selectHmw(oppIndex: number, hmw: string) {
    const updated = [...data.selected_opportunities];
    updated[oppIndex] = { ...updated[oppIndex], chosen_hmw: hmw, was_edited: false };
    update({ selected_opportunities: updated });
  }

  function updateEditedHmw(oppIndex: number, hmw: string) {
    const updated = [...data.selected_opportunities];
    updated[oppIndex] = { ...updated[oppIndex], chosen_hmw: hmw, was_edited: true };
    update({ selected_opportunities: updated });
  }

  // Friction and delight steps for opportunity selection
  const opportunitySteps = data.journey_steps
    .map((step, i) => ({ ...step, index: i }))
    .filter((s) => s.label === "friction" || s.label === "delight");

  const journeyAccepted = data.journey_map_accepted;

  return (
    <div className="flex flex-col gap-8">
      {/* ─── STEP A: Journey Map ─── */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`flex size-7 items-center justify-center rounded-full text-xs font-bold ${
              journeyAccepted
                ? "bg-green-100 text-green-700"
                : "bg-primary text-primary-foreground"
            }`}
          >
            {journeyAccepted ? <CheckIcon className="size-4" /> : "A"}
          </div>
          <h2 className="text-base font-semibold">Map the Journey</h2>
        </div>

        {/* Journey Input */}
        {subStep === "journey_input" && (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-muted-foreground">
              Map out each step your user takes today. Label each as friction,
              neutral, or delight.
            </p>
            {data.journey_steps.map((step, i) => (
              <Card key={i}>
                <CardContent className="flex flex-col gap-3 pt-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">
                      Step {i + 1}
                    </Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeStep(i)}
                    >
                      <XIcon className="size-3" />
                    </Button>
                  </div>
                  <Input
                    placeholder="What happens at this step?"
                    value={step.step}
                    onChange={(e) => updateStep(i, "step", e.target.value)}
                  />
                  <Select
                    value={step.label}
                    onValueChange={(v) => updateStep(i, "label", v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="friction">Friction</SelectItem>
                      <SelectItem value="neutral">Neutral</SelectItem>
                      <SelectItem value="delight">Delight</SelectItem>
                    </SelectContent>
                  </Select>
                  <Textarea
                    placeholder="Notes about this step..."
                    value={step.notes}
                    onChange={(e) => updateStep(i, "notes", e.target.value)}
                    rows={2}
                  />
                </CardContent>
              </Card>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addStep}
              className="w-fit"
            >
              + Add step
            </Button>

            {synthesisError && (
              <p className="text-sm text-destructive">{synthesisError}</p>
            )}

            <div className="flex justify-end pt-2">
              <Button
                onClick={synthesizeJourney}
                disabled={data.journey_steps.length < 3}
              >
                <SparklesIcon className="size-4" />
                Synthesize Journey
              </Button>
            </div>
          </div>
        )}

        {/* Journey Synthesizing */}
        {subStep === "journey_synthesizing" && (
          <Card>
            <CardContent className="flex items-center justify-center gap-3 py-12">
              <LoaderIcon className="size-5 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Analyzing your journey map...
              </span>
            </CardContent>
          </Card>
        )}

        {/* Journey Review */}
        {subStep === "journey_review" && (
          <div className="flex flex-col gap-4">
            <Card>
              <CardContent className="flex flex-col gap-4 pt-6">
                <h3 className="text-sm font-semibold">Journey Analysis</h3>
                <SynthesisDisplay
                  synthesis={
                    (data.journey_synthesis as Record<string, any>) || {}
                  }
                />
              </CardContent>
            </Card>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setSubStep("journey_input")}
              >
                Edit Journey
              </Button>
              <Button onClick={acceptJourney}>
                <CheckIcon className="size-4" />
                Accept & Continue
              </Button>
            </div>
          </div>
        )}

        {/* Journey Accepted (read-only summary) */}
        {journeyAccepted &&
          subStep !== "journey_input" &&
          subStep !== "journey_synthesizing" &&
          subStep !== "journey_review" && (
            <div className="flex flex-col gap-2">
              <Card className="bg-muted/30">
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">
                    {data.journey_steps.length} steps mapped &mdash;{" "}
                    {
                      data.journey_steps.filter((s) => s.label === "friction")
                        .length
                    }{" "}
                    friction,{" "}
                    {
                      data.journey_steps.filter((s) => s.label === "delight")
                        .length
                    }{" "}
                    delight
                  </p>
                </CardContent>
              </Card>
              <button
                type="button"
                className="w-fit text-xs text-muted-foreground underline hover:text-foreground"
                onClick={handleEditJourneyClick}
              >
                Edit journey map
              </button>
            </div>
          )}
      </div>

      {/* ─── Separator ─── */}
      {journeyAccepted && (
        <div className="border-t border-border" />
      )}

      {/* ─── STEP B: Find Opportunities ─── */}
      {journeyAccepted && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`flex size-7 items-center justify-center rounded-full text-xs font-bold ${
                data.opportunities_accepted
                  ? "bg-green-100 text-green-700"
                  : "bg-primary text-primary-foreground"
              }`}
            >
              {data.opportunities_accepted ? (
                <CheckIcon className="size-4" />
              ) : (
                "B"
              )}
            </div>
            <h2 className="text-base font-semibold">Find Opportunities</h2>
          </div>

          {/* Opportunities Input */}
          {subStep === "opportunities_input" && (
            <div className="flex flex-col gap-4">
              <p className="text-xs text-muted-foreground">
                Select 1-3 friction or delight points from your journey to
                explore as design opportunities. You can also add a custom
                opportunity.
              </p>

              {opportunitySteps.length === 0 && (
                <p className="text-sm text-muted-foreground italic">
                  No friction or delight steps found. Add a custom opportunity
                  below.
                </p>
              )}

              <div className="flex flex-col gap-2">
                {opportunitySteps.map((step) => {
                  const isSelected = data.selected_opportunities.some(
                    (o) => o.source_step_index === step.index
                  );
                  return (
                    <button
                      key={step.index}
                      type="button"
                      onClick={() => toggleOpportunity(step.index, step.step)}
                      disabled={
                        !isSelected &&
                        data.selected_opportunities.length >= 3
                      }
                      className={`flex items-center gap-3 rounded-lg border p-4 text-left transition-colors ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted/50"
                      } disabled:cursor-not-allowed disabled:opacity-50`}
                    >
                      <div
                        className={`flex size-5 items-center justify-center rounded-full border ${
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-muted-foreground/30"
                        }`}
                      >
                        {isSelected && <CheckIcon className="size-3" />}
                      </div>
                      <div className="flex-1">
                        <span
                          className={`mr-2 inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                            step.label === "friction"
                              ? "bg-red-100 text-red-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {step.label}
                        </span>
                        <span className="text-sm">{step.step}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Custom opportunity */}
              <div className="flex flex-col gap-2">
                <Label className="text-xs text-muted-foreground">
                  Or add a custom opportunity
                </Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Describe a design opportunity..."
                    value={customOpportunity}
                    onChange={(e) => setCustomOpportunity(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addCustomOpportunity}
                    disabled={
                      !customOpportunity.trim() ||
                      data.selected_opportunities.length >= 3
                    }
                  >
                    Add
                  </Button>
                </div>
              </div>

              {/* Selected opportunities summary */}
              {data.selected_opportunities.length > 0 && (
                <div className="flex flex-col gap-2">
                  <Label className="text-xs text-muted-foreground">
                    Selected ({data.selected_opportunities.length}/3)
                  </Label>
                  {data.selected_opportunities.map((opp, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-md border border-primary/20 bg-primary/5 px-3 py-2"
                    >
                      <span className="text-sm">{opp.description}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeOpportunity(i)}
                      >
                        <XIcon className="size-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
                <p className="text-xs leading-relaxed text-muted-foreground">
                  <strong>&ldquo;How Might We&rdquo;</strong> statements reframe
                  problems as opportunities. Instead of &ldquo;Patients
                  can&rsquo;t track medications,&rdquo; try &ldquo;How might we
                  make medication tracking feel effortless?&rdquo; The AI will
                  generate 3 HMW options for each opportunity you select.
                </p>
              </div>

              {synthesisError && (
                <p className="text-sm text-destructive">{synthesisError}</p>
              )}

              <div className="flex justify-end pt-2">
                <Button
                  onClick={generateHmws}
                  disabled={data.selected_opportunities.length === 0}
                >
                  <SparklesIcon className="size-4" />
                  Generate HMWs
                </Button>
              </div>
            </div>
          )}

          {/* HMW Generating */}
          {subStep === "hmw_generating" && (
            <Card>
              <CardContent className="flex items-center justify-center gap-3 py-12">
                <LoaderIcon className="size-5 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Generating &ldquo;How Might We&rdquo; statements...
                </span>
              </CardContent>
            </Card>
          )}

          {/* HMW Review */}
          {subStep === "hmw_review" && (
            <div className="flex flex-col gap-4">
              {data.selected_opportunities.map((opp, oppIndex) => (
                <Card key={oppIndex}>
                  <CardContent className="flex flex-col gap-3 pt-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">
                        {opp.description}
                      </h4>
                      {opp.source_step_index !== "custom" && (
                        <span className="text-[10px] text-muted-foreground">
                          Step {(opp.source_step_index as number) + 1}
                        </span>
                      )}
                    </div>

                    {/* HMW Radio Options */}
                    <div className="flex flex-col gap-2">
                      <Label className="text-xs text-muted-foreground">
                        Choose a &ldquo;How Might We&rdquo; statement
                      </Label>
                      {opp.hmw_options.map((hmw, hmwIndex) => (
                        <label
                          key={hmwIndex}
                          className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors ${
                            opp.chosen_hmw === hmw && !opp.was_edited
                              ? "border-primary bg-primary/5"
                              : "border-border hover:bg-muted/50"
                          }`}
                        >
                          <input
                            type="radio"
                            name={`hmw-${oppIndex}`}
                            checked={opp.chosen_hmw === hmw && !opp.was_edited}
                            onChange={() => selectHmw(oppIndex, hmw)}
                            className="mt-0.5"
                          />
                          <span className="text-sm">{hmw}</span>
                        </label>
                      ))}
                    </div>

                    {/* Edit Toggle */}
                    {editingHmwIndex === oppIndex ? (
                      <div className="flex flex-col gap-2">
                        <Textarea
                          value={opp.chosen_hmw}
                          onChange={(e) =>
                            updateEditedHmw(oppIndex, e.target.value)
                          }
                          rows={2}
                          placeholder="How might we..."
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-fit"
                          onClick={() => setEditingHmwIndex(null)}
                        >
                          Done
                        </Button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="flex w-fit items-center gap-1 text-xs text-muted-foreground underline hover:text-foreground"
                        onClick={() => setEditingHmwIndex(oppIndex)}
                      >
                        <PencilIcon className="size-3" />
                        Write your own
                      </button>
                    )}

                    {opp.was_edited && (
                      <div className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2">
                        <p className="text-xs text-muted-foreground">
                          Your HMW:
                        </p>
                        <p className="text-sm">{opp.chosen_hmw}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              {synthesisError && (
                <p className="text-sm text-destructive">{synthesisError}</p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setSubStep("opportunities_input")}
                >
                  Back to Opportunities
                </Button>
                <Button
                  onClick={acceptOpportunities}
                  disabled={data.selected_opportunities.some(
                    (o) => !o.chosen_hmw.trim()
                  )}
                >
                  <CheckIcon className="size-4" />
                  Accept Opportunities & HMWs
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Edit Confirmation Dialog ─── */}
      <Dialog open={showEditConfirm} onOpenChange={setShowEditConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Journey Map?</DialogTitle>
            <DialogDescription>
              Editing your journey map will reset your selected opportunities
              and HMW statements. You&apos;ll need to re-select them after
              making changes.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditConfirm(false)}
            >
              Cancel
            </Button>
            <Button onClick={confirmEditJourney}>
              Continue Editing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
