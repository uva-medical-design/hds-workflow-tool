"use client";

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
import { StringListField } from "@/components/phase-wizard/field-helpers";
import { XIcon } from "lucide-react";
import type { Phase4Inputs } from "@/types";
import type { PhaseFormProps } from ".";

export function Phase4Form({ values, onChange }: PhaseFormProps) {
  const data = values as Phase4Inputs;

  function update(field: keyof Phase4Inputs, value: unknown) {
    onChange({ ...data, [field]: value });
  }

  function updateStep(
    index: number,
    field: string,
    value: string
  ) {
    const updated = [...data.journey_steps];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ ...data, journey_steps: updated });
  }

  function addStep() {
    onChange({
      ...data,
      journey_steps: [
        ...data.journey_steps,
        { step: "", label: "neutral" as const, notes: "" },
      ],
    });
  }

  function removeStep(index: number) {
    onChange({
      ...data,
      journey_steps: data.journey_steps.filter((_, i) => i !== index),
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Journey steps */}
      <div className="flex flex-col gap-3">
        <Label>Journey Steps</Label>
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
      </div>

      <StringListField
        label="Opportunities"
        items={data.opportunities}
        onChange={(items) => update("opportunities", items)}
        placeholder="A design opportunity you identified..."
      />

      <StringListField
        label='How Might We... Statements'
        items={data.hmw_statements}
        onChange={(items) => update("hmw_statements", items)}
        placeholder="How might we..."
      />

      <div className="flex flex-col gap-2">
        <Label htmlFor="selected_opportunity">
          Selected opportunity to pursue
        </Label>
        <Textarea
          id="selected_opportunity"
          value={data.selected_opportunity}
          onChange={(e) => update("selected_opportunity", e.target.value)}
          placeholder="Which opportunity will you focus on and why?"
          rows={3}
        />
      </div>
    </div>
  );
}
