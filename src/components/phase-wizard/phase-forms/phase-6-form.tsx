"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StringListField } from "@/components/phase-wizard/field-helpers";
import { XIcon } from "lucide-react";
import type { Phase6Inputs } from "@/types";
import type { PhaseFormProps } from ".";

export function Phase6Form({ values, onChange }: PhaseFormProps) {
  const data = values as Phase6Inputs;

  function update(field: keyof Phase6Inputs, value: unknown) {
    onChange({ ...data, [field]: value });
  }

  function updateTradeoff(index: number, field: string, value: string) {
    const updated = [...data.tradeoff_decisions];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ ...data, tradeoff_decisions: updated });
  }

  function addTradeoff() {
    onChange({
      ...data,
      tradeoff_decisions: [
        ...data.tradeoff_decisions,
        { question: "", choice: "", rationale: "" },
      ],
    });
  }

  function removeTradeoff(index: number) {
    onChange({
      ...data,
      tradeoff_decisions: data.tradeoff_decisions.filter(
        (_, i) => i !== index
      ),
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Label htmlFor="constraints">Technical constraints</Label>
        <Textarea
          id="constraints"
          value={data.technical_constraints}
          onChange={(e) => update("technical_constraints", e.target.value)}
          placeholder="What technical limitations exist? (e.g., must work offline, no backend, HIPAA considerations)"
          rows={3}
        />
      </div>

      <StringListField
        label="Success criteria"
        items={data.success_criteria}
        onChange={(items) => update("success_criteria", items)}
        placeholder="A measurable outcome that defines success..."
      />

      <div className="flex flex-col gap-2">
        <Label htmlFor="accessibility">Accessibility requirements</Label>
        <Textarea
          id="accessibility"
          value={data.accessibility_requirements}
          onChange={(e) =>
            update("accessibility_requirements", e.target.value)
          }
          placeholder="What accessibility standards matter? (e.g., screen reader support, large text, color contrast)"
          rows={3}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="security">Security requirements</Label>
        <Textarea
          id="security"
          value={data.security_requirements}
          onChange={(e) => update("security_requirements", e.target.value)}
          placeholder="What security considerations apply? (e.g., health data handling, authentication needs)"
          rows={3}
        />
      </div>

      {/* Tradeoff decisions */}
      <div className="flex flex-col gap-3">
        <Label>Tradeoff Decisions</Label>
        <p className="text-xs text-muted-foreground">
          Document key tradeoffs and your reasoning.
        </p>
        {data.tradeoff_decisions.map((td, i) => (
          <Card key={i}>
            <CardContent className="flex flex-col gap-3 pt-4">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">
                  Tradeoff {i + 1}
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeTradeoff(i)}
                >
                  <XIcon className="size-3" />
                </Button>
              </div>
              <Input
                placeholder="The question (e.g., Speed vs. polish?)"
                value={td.question}
                onChange={(e) => updateTradeoff(i, "question", e.target.value)}
              />
              <Input
                placeholder="Your choice"
                value={td.choice}
                onChange={(e) => updateTradeoff(i, "choice", e.target.value)}
              />
              <Textarea
                placeholder="Why?"
                value={td.rationale}
                onChange={(e) =>
                  updateTradeoff(i, "rationale", e.target.value)
                }
                rows={2}
              />
            </CardContent>
          </Card>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addTradeoff}
          className="w-fit"
        >
          + Add tradeoff
        </Button>
      </div>
    </div>
  );
}
