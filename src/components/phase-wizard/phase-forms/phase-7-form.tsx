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
import type { Phase7Inputs } from "@/types";
import type { PhaseFormProps } from ".";

export function Phase7Form({ values, onChange }: PhaseFormProps) {
  const data = values as Phase7Inputs;

  function update(field: keyof Phase7Inputs, value: unknown) {
    onChange({ ...data, [field]: value });
  }

  function updateBranding(field: string, value: string) {
    onChange({ ...data, branding: { ...data.branding, [field]: value } });
  }

  function updateGuardrails(field: "never_do" | "always_do", items: string[]) {
    onChange({
      ...data,
      safety_guardrails: { ...data.safety_guardrails, [field]: items },
    });
  }

  function updateEdgeCase(index: number, field: string, value: string) {
    const updated = [...data.edge_cases];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ ...data, edge_cases: updated });
  }

  function addEdgeCase() {
    onChange({
      ...data,
      edge_cases: [
        ...data.edge_cases,
        { scenario: "", expected_behavior: "" },
      ],
    });
  }

  function removeEdgeCase(index: number) {
    onChange({
      ...data,
      edge_cases: data.edge_cases.filter((_, i) => i !== index),
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Label>Build platform</Label>
        <Select
          value={data.platform}
          onValueChange={(v) => update("platform", v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="claude_code">Claude Code</SelectItem>
            <SelectItem value="replit">Replit</SelectItem>
            <SelectItem value="lovable">Lovable</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="project_name">Project name</Label>
        <Input
          id="project_name"
          value={data.project_name}
          onChange={(e) => update("project_name", e.target.value)}
          placeholder="Your app's name"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="deployment_goal">Deployment goal</Label>
        <Textarea
          id="deployment_goal"
          value={data.deployment_goal}
          onChange={(e) => update("deployment_goal", e.target.value)}
          placeholder="What should the deployed prototype look like? (e.g., hosted web app, local demo)"
          rows={2}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="time_constraint">Time constraint</Label>
        <Input
          id="time_constraint"
          value={data.time_constraint}
          onChange={(e) => update("time_constraint", e.target.value)}
          placeholder="e.g., 4 hours of build time"
        />
      </div>

      {/* Edge cases */}
      <div className="flex flex-col gap-3">
        <Label>Edge Cases</Label>
        {data.edge_cases.map((ec, i) => (
          <Card key={i}>
            <CardContent className="flex flex-col gap-3 pt-4">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">
                  Edge Case {i + 1}
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeEdgeCase(i)}
                >
                  <XIcon className="size-3" />
                </Button>
              </div>
              <Input
                placeholder="Scenario"
                value={ec.scenario}
                onChange={(e) => updateEdgeCase(i, "scenario", e.target.value)}
              />
              <Input
                placeholder="Expected behavior"
                value={ec.expected_behavior}
                onChange={(e) =>
                  updateEdgeCase(i, "expected_behavior", e.target.value)
                }
              />
            </CardContent>
          </Card>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addEdgeCase}
          className="w-fit"
        >
          + Add edge case
        </Button>
      </div>

      {/* Branding */}
      <div className="flex flex-col gap-3">
        <Label>Branding</Label>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <Label className="text-xs">Primary color</Label>
            <div className="flex gap-2">
              <Input
                value={data.branding.primary_color}
                onChange={(e) =>
                  updateBranding("primary_color", e.target.value)
                }
                placeholder="#3B82F6"
              />
              {data.branding.primary_color && (
                <div
                  className="size-9 shrink-0 rounded-md border"
                  style={{ backgroundColor: data.branding.primary_color }}
                />
              )}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs">Tagline</Label>
            <Input
              value={data.branding.tagline}
              onChange={(e) => updateBranding("tagline", e.target.value)}
              placeholder="Your app's tagline"
            />
          </div>
        </div>
      </div>

      {/* Safety guardrails */}
      <StringListField
        label="Safety: Never do"
        items={data.safety_guardrails.never_do}
        onChange={(items) => updateGuardrails("never_do", items)}
        placeholder="Something the app should never do..."
      />

      <StringListField
        label="Safety: Always do"
        items={data.safety_guardrails.always_do}
        onChange={(items) => updateGuardrails("always_do", items)}
        placeholder="Something the app should always do..."
      />
    </div>
  );
}
