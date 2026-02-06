"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StringListField } from "@/components/phase-wizard/field-helpers";
import { XIcon } from "lucide-react";
import type { Phase2Inputs } from "@/types";
import type { PhaseFormProps } from ".";

export function Phase2Form({ values, onChange }: PhaseFormProps) {
  const data = values as Phase2Inputs;

  function update(field: keyof Phase2Inputs, value: unknown) {
    onChange({ ...data, [field]: value });
  }

  function updateSecondaryUser(
    index: number,
    field: string,
    value: string
  ) {
    const updated = [...data.secondary_users];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ ...data, secondary_users: updated });
  }

  function addSecondaryUser() {
    onChange({
      ...data,
      secondary_users: [...data.secondary_users, { name: "", notes: "" }],
    });
  }

  function removeSecondaryUser(index: number) {
    onChange({
      ...data,
      secondary_users: data.secondary_users.filter((_, i) => i !== index),
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <StringListField
        label="Who are the stakeholders?"
        items={data.stakeholders}
        onChange={(items) => update("stakeholders", items)}
        placeholder="e.g., Patients, Nurses, Pharmacists..."
      />

      <div className="flex flex-col gap-2">
        <Label htmlFor="primary_user">
          Describe your primary user
        </Label>
        <Textarea
          id="primary_user"
          value={data.primary_user_description}
          onChange={(e) => update("primary_user_description", e.target.value)}
          placeholder="Who is the person you're designing for? What's their role, age range, tech comfort?"
          rows={3}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="user_context">
          What is their daily context?
        </Label>
        <Textarea
          id="user_context"
          value={data.user_context}
          onChange={(e) => update("user_context", e.target.value)}
          placeholder="Where do they encounter this problem? What's their environment like?"
          rows={3}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="goals">What are their goals?</Label>
        <Textarea
          id="goals"
          value={data.goals}
          onChange={(e) => update("goals", e.target.value)}
          placeholder="What is this person trying to accomplish?"
          rows={3}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="frustrations">What frustrates them?</Label>
        <Textarea
          id="frustrations"
          value={data.frustrations}
          onChange={(e) => update("frustrations", e.target.value)}
          placeholder="What pain points, workarounds, or barriers do they face?"
          rows={3}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="coping">How do they cope today?</Label>
        <Textarea
          id="coping"
          value={data.coping_strategies}
          onChange={(e) => update("coping_strategies", e.target.value)}
          placeholder="What workarounds or tools do they currently use?"
          rows={3}
        />
      </div>

      {/* Secondary users */}
      <div className="flex flex-col gap-3">
        <Label>Secondary Users</Label>
        {data.secondary_users.map((user, i) => (
          <Card key={i}>
            <CardContent className="flex flex-col gap-3 pt-4">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">
                  Secondary User {i + 1}
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeSecondaryUser(i)}
                >
                  <XIcon className="size-3" />
                </Button>
              </div>
              <Input
                placeholder="Name or role"
                value={user.name}
                onChange={(e) => updateSecondaryUser(i, "name", e.target.value)}
              />
              <Textarea
                placeholder="How are they affected?"
                value={user.notes}
                onChange={(e) =>
                  updateSecondaryUser(i, "notes", e.target.value)
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
          onClick={addSecondaryUser}
          className="w-fit"
        >
          + Add secondary user
        </Button>
      </div>
    </div>
  );
}
