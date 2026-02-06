"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Phase1Inputs } from "@/types";
import type { PhaseFormProps } from ".";

export function Phase1Form({ values, onChange }: PhaseFormProps) {
  const data = values as Phase1Inputs;

  function update(field: keyof Phase1Inputs, value: unknown) {
    onChange({ ...data, [field]: value });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Label htmlFor="topic_description">
          What healthcare problem caught your attention?
        </Label>
        <Textarea
          id="topic_description"
          value={data.topic_description}
          onChange={(e) => update("topic_description", e.target.value)}
          placeholder="Describe the healthcare problem area you want to explore..."
          rows={4}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="personal_connection">
          What is your personal connection to this problem?
        </Label>
        <Textarea
          id="personal_connection"
          value={data.personal_connection}
          onChange={(e) => update("personal_connection", e.target.value)}
          placeholder="A clinical rotation experience, a family member's story, something you read..."
          rows={3}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="observations">
          What have you observed about this problem?
        </Label>
        <Textarea
          id="observations"
          value={data.observations}
          onChange={(e) => update("observations", e.target.value)}
          placeholder="Specific moments, behaviors, or patterns you've noticed..."
          rows={4}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="research_notes">Research notes</Label>
        <Textarea
          id="research_notes"
          value={data.research_notes}
          onChange={(e) => update("research_notes", e.target.value)}
          placeholder="Any articles, data, or background reading that informs your understanding..."
          rows={4}
        />
      </div>

      {/* File uploads deferred to later iteration */}
      <div className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
        File uploads coming soon
      </div>
    </div>
  );
}
