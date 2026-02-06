"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { XIcon } from "lucide-react";
import type { Phase3Inputs } from "@/types";
import type { PhaseFormProps } from ".";

export function Phase3Form({ values, onChange }: PhaseFormProps) {
  const data = values as Phase3Inputs;

  function update(field: keyof Phase3Inputs, value: unknown) {
    onChange({ ...data, [field]: value });
  }

  function updateTool(index: number, field: string, value: string) {
    const updated = [...data.current_tools];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ ...data, current_tools: updated });
  }

  function addTool() {
    onChange({
      ...data,
      current_tools: [
        ...data.current_tools,
        { name: "", strengths: "", gaps: "" },
      ],
    });
  }

  function removeTool(index: number) {
    onChange({
      ...data,
      current_tools: data.current_tools.filter((_, i) => i !== index),
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Label htmlFor="job_statement">
          Job statement: When [situation], I want to [motivation], so I can
          [outcome]
        </Label>
        <Textarea
          id="job_statement"
          value={data.job_statement}
          onChange={(e) => update("job_statement", e.target.value)}
          placeholder="When I am managing my medication schedule, I want to feel confident I'm taking the right dose, so I can avoid dangerous interactions..."
          rows={3}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="functional">Functional dimension</Label>
        <Textarea
          id="functional"
          value={data.functional_dimension}
          onChange={(e) => update("functional_dimension", e.target.value)}
          placeholder="What practical task needs to get done?"
          rows={3}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="emotional">Emotional dimension</Label>
        <Textarea
          id="emotional"
          value={data.emotional_dimension}
          onChange={(e) => update("emotional_dimension", e.target.value)}
          placeholder="How does the user want to feel?"
          rows={3}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="social">Social dimension</Label>
        <Textarea
          id="social"
          value={data.social_dimension}
          onChange={(e) => update("social_dimension", e.target.value)}
          placeholder="How does the user want to be perceived by others?"
          rows={3}
        />
      </div>

      {/* Current tools */}
      <div className="flex flex-col gap-3">
        <Label>Current Tools & Workarounds</Label>
        {data.current_tools.map((tool, i) => (
          <Card key={i}>
            <CardContent className="flex flex-col gap-3 pt-4">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">
                  Tool {i + 1}
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeTool(i)}
                >
                  <XIcon className="size-3" />
                </Button>
              </div>
              <Input
                placeholder="Tool or workaround name"
                value={tool.name}
                onChange={(e) => updateTool(i, "name", e.target.value)}
              />
              <Textarea
                placeholder="What works well?"
                value={tool.strengths}
                onChange={(e) => updateTool(i, "strengths", e.target.value)}
                rows={2}
              />
              <Textarea
                placeholder="Where does it fall short?"
                value={tool.gaps}
                onChange={(e) => updateTool(i, "gaps", e.target.value)}
                rows={2}
              />
            </CardContent>
          </Card>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addTool}
          className="w-fit"
        >
          + Add tool
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="inspiration">Cross-field inspiration</Label>
        <Textarea
          id="inspiration"
          value={data.cross_field_inspiration}
          onChange={(e) => update("cross_field_inspiration", e.target.value)}
          placeholder="Are there solutions from other industries that could apply here?"
          rows={3}
        />
      </div>
    </div>
  );
}
