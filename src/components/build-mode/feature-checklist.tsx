"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { extractMvpFeatures } from "@/lib/prd-parser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { FeatureChecklistItem, ChecklistStatus } from "@/types";

const STATUS_CYCLE: ChecklistStatus[] = ["not_started", "partial", "working"];

const STATUS_CONFIG: Record<
  ChecklistStatus,
  { label: string; color: string; bg: string }
> = {
  not_started: {
    label: "Not Started",
    color: "text-zinc-500",
    bg: "bg-zinc-100 dark:bg-zinc-800",
  },
  partial: {
    label: "Partial",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-100 dark:bg-amber-900/30",
  },
  working: {
    label: "Working",
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-100 dark:bg-green-900/30",
  },
};

interface FeatureChecklistProps {
  versionId: string;
  projectId: string;
  prdContent: string | null;
}

export function FeatureChecklist({
  versionId,
  projectId,
  prdContent,
}: FeatureChecklistProps) {
  const [items, setItems] = useState<FeatureChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch or initialize checklist
  useEffect(() => {
    async function loadChecklist() {
      // Try to fetch existing checklist items
      const { data: existing } = await supabase
        .from("feature_checklist")
        .select("*")
        .eq("version_id", versionId)
        .order("sort_order");

      if (existing && existing.length > 0) {
        setItems(existing);
        setLoading(false);
        return;
      }

      // No existing items — parse PRD and create them
      if (!prdContent) {
        setLoading(false);
        return;
      }

      const features = extractMvpFeatures(prdContent);
      if (features.length === 0) {
        setLoading(false);
        return;
      }

      const rows = features.map((feature, i) => ({
        version_id: versionId,
        project_id: projectId,
        feature,
        status: "not_started" as const,
        sort_order: i,
      }));

      const { data: inserted } = await supabase
        .from("feature_checklist")
        .insert(rows)
        .select();

      if (inserted) setItems(inserted);
      setLoading(false);
    }

    loadChecklist();
  }, [versionId, projectId, prdContent]);

  const handleToggle = useCallback(
    async (id: string, currentStatus: ChecklistStatus) => {
      const currentIdx = STATUS_CYCLE.indexOf(currentStatus);
      const nextStatus = STATUS_CYCLE[(currentIdx + 1) % STATUS_CYCLE.length];

      // Optimistic update
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, status: nextStatus } : item
        )
      );

      await supabase
        .from("feature_checklist")
        .update({ status: nextStatus })
        .eq("id", id);
    },
    []
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="py-4">
          <p className="text-xs text-muted-foreground">Loading checklist...</p>
        </CardContent>
      </Card>
    );
  }

  if (items.length === 0) return null;

  const workingCount = items.filter((i) => i.status === "working").length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            Feature Checklist
          </CardTitle>
          <span className="text-xs text-muted-foreground">
            {workingCount}/{items.length} working
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-1.5">
          {items.map((item) => {
            const config = STATUS_CONFIG[item.status];
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleToggle(item.id, item.status)}
                className="flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-muted/50"
              >
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${config.bg} ${config.color}`}
                >
                  {config.label}
                </span>
                <span className="text-sm">{item.feature}</span>
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Click to cycle: Not Started → Partial → Working
        </p>
      </CardContent>
    </Card>
  );
}
