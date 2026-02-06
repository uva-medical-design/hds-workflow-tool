"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { XIcon } from "lucide-react";
import type { Phase5Inputs } from "@/types";
import type { PhaseFormProps } from ".";

export function Phase5Form({ values, onChange }: PhaseFormProps) {
  const data = values as Phase5Inputs;

  // Insight-to-feature mappings
  function updateInsight(index: number, field: string, value: string) {
    const updated = [...data.insight_to_feature];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ ...data, insight_to_feature: updated });
  }

  function addInsight() {
    onChange({
      ...data,
      insight_to_feature: [
        ...data.insight_to_feature,
        {
          insight: "",
          need: "",
          jtbd_connection: "",
          feature: "",
          rationale: "",
        },
      ],
    });
  }

  function removeInsight(index: number) {
    onChange({
      ...data,
      insight_to_feature: data.insight_to_feature.filter(
        (_, i) => i !== index
      ),
    });
  }

  // Feature priorities
  function updatePriority(
    index: number,
    field: string,
    value: string | number | boolean
  ) {
    const updated = [...data.feature_priorities];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ ...data, feature_priorities: updated });
  }

  function addPriority() {
    onChange({
      ...data,
      feature_priorities: [
        ...data.feature_priorities,
        { feature: "", impact: 3 as const, feasibility: 3 as const, in_mvp: false },
      ],
    });
  }

  function removePriority(index: number) {
    onChange({
      ...data,
      feature_priorities: data.feature_priorities.filter(
        (_, i) => i !== index
      ),
    });
  }

  // Reference apps
  function updateRefApp(index: number, field: string, value: string) {
    const updated = [...data.reference_apps];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ ...data, reference_apps: updated });
  }

  function addRefApp() {
    onChange({
      ...data,
      reference_apps: [
        ...data.reference_apps,
        { name: "", what_to_borrow: "" },
      ],
    });
  }

  function removeRefApp(index: number) {
    onChange({
      ...data,
      reference_apps: data.reference_apps.filter((_, i) => i !== index),
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Insight to feature */}
      <div className="flex flex-col gap-3">
        <Label>Insight → Feature Mapping</Label>
        <p className="text-xs text-muted-foreground">
          Connect each research insight to a concrete feature.
        </p>
        {data.insight_to_feature.map((item, i) => (
          <Card key={i}>
            <CardContent className="flex flex-col gap-3 pt-4">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">
                  Mapping {i + 1}
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeInsight(i)}
                >
                  <XIcon className="size-3" />
                </Button>
              </div>
              <Input
                placeholder="Insight"
                value={item.insight}
                onChange={(e) => updateInsight(i, "insight", e.target.value)}
              />
              <Input
                placeholder="User need"
                value={item.need}
                onChange={(e) => updateInsight(i, "need", e.target.value)}
              />
              <Input
                placeholder="JTBD connection"
                value={item.jtbd_connection}
                onChange={(e) =>
                  updateInsight(i, "jtbd_connection", e.target.value)
                }
              />
              <Input
                placeholder="Feature"
                value={item.feature}
                onChange={(e) => updateInsight(i, "feature", e.target.value)}
              />
              <Textarea
                placeholder="Rationale"
                value={item.rationale}
                onChange={(e) => updateInsight(i, "rationale", e.target.value)}
                rows={2}
              />
            </CardContent>
          </Card>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addInsight}
          className="w-fit"
        >
          + Add mapping
        </Button>
      </div>

      {/* Feature priorities */}
      <div className="flex flex-col gap-3">
        <Label>Feature Priorities</Label>
        <p className="text-xs text-muted-foreground">
          Rate impact and feasibility (1-5), then decide what makes the MVP.
        </p>
        {data.feature_priorities.map((fp, i) => (
          <Card key={i}>
            <CardContent className="flex flex-col gap-3 pt-4">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">
                  Feature {i + 1}
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removePriority(i)}
                >
                  <XIcon className="size-3" />
                </Button>
              </div>
              <Input
                placeholder="Feature name"
                value={fp.feature}
                onChange={(e) => updatePriority(i, "feature", e.target.value)}
              />
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <Label className="text-xs">Impact (1-5)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={5}
                    value={fp.impact}
                    onChange={(e) =>
                      updatePriority(i, "impact", Number(e.target.value))
                    }
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs">Feasibility (1-5)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={5}
                    value={fp.feasibility}
                    onChange={(e) =>
                      updatePriority(i, "feasibility", Number(e.target.value))
                    }
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={fp.in_mvp}
                  onChange={(e) =>
                    updatePriority(i, "in_mvp", e.target.checked)
                  }
                  className="rounded border-border"
                />
                Include in MVP
              </label>
            </CardContent>
          </Card>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addPriority}
          className="w-fit"
        >
          + Add feature
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="personality">Product personality</Label>
        <Textarea
          id="personality"
          value={data.product_personality}
          onChange={(e) =>
            onChange({ ...data, product_personality: e.target.value })
          }
          placeholder="If your product were a person, how would it behave? Calm and clinical? Warm and encouraging?"
          rows={3}
        />
      </div>

      {/* Reference apps */}
      <div className="flex flex-col gap-3">
        <Label>Reference Apps</Label>
        {data.reference_apps.map((app, i) => (
          <Card key={i}>
            <CardContent className="flex flex-col gap-3 pt-4">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">
                  Reference {i + 1}
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeRefApp(i)}
                >
                  <XIcon className="size-3" />
                </Button>
              </div>
              <Input
                placeholder="App name"
                value={app.name}
                onChange={(e) => updateRefApp(i, "name", e.target.value)}
              />
              <Textarea
                placeholder="What would you borrow from it?"
                value={app.what_to_borrow}
                onChange={(e) =>
                  updateRefApp(i, "what_to_borrow", e.target.value)
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
          onClick={addRefApp}
          className="w-fit"
        >
          + Add reference app
        </Button>
      </div>
    </div>
  );
}
