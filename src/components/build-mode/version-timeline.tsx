"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { timeAgo } from "@/lib/time-utils";
import type { Version } from "@/types";

const TRIGGER_LABELS: Record<string, string> = {
  phase_7_complete: "Design sprint",
  build_feedback: "Build feedback",
  manual_revision: "Manual revision",
};

interface VersionTimelineProps {
  versions: Version[];
  currentVersionId: string;
  projectId: string;
  onNavigate: (versionId: string) => void;
}

export function VersionTimeline({
  versions,
  currentVersionId,
  projectId,
  onNavigate,
}: VersionTimelineProps) {
  if (versions.length <= 1) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Version History</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />

          <div className="space-y-3">
            {versions.map((v) => {
              const isCurrent = v.id === currentVersionId;
              const diffTags = v.diff_summary || { added: [], changed: [], removed: [] };
              const totalChanges =
                (diffTags.added?.length || 0) +
                (diffTags.changed?.length || 0) +
                (diffTags.removed?.length || 0);

              return (
                <div key={v.id} className="relative flex items-start gap-3 pl-6">
                  {/* Timeline dot */}
                  <div
                    className={`absolute left-0 top-1.5 size-[15px] rounded-full border-2 ${
                      isCurrent
                        ? "border-foreground bg-foreground"
                        : "border-border bg-background"
                    }`}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-medium ${
                          isCurrent ? "" : "text-muted-foreground"
                        }`}
                      >
                        {v.version_number}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {TRIGGER_LABELS[v.trigger] || v.trigger}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {timeAgo(v.created_at)}
                      </span>
                    </div>

                    {totalChanges > 0 && (
                      <div className="mt-0.5 flex gap-1.5">
                        {(diffTags.added?.length || 0) > 0 && (
                          <span className="text-xs text-green-600 dark:text-green-400">
                            +{diffTags.added.length} added
                          </span>
                        )}
                        {(diffTags.changed?.length || 0) > 0 && (
                          <span className="text-xs text-amber-600 dark:text-amber-400">
                            ~{diffTags.changed.length} changed
                          </span>
                        )}
                        {(diffTags.removed?.length || 0) > 0 && (
                          <span className="text-xs text-red-600 dark:text-red-400">
                            -{diffTags.removed.length} removed
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {!isCurrent && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0 text-xs"
                      onClick={() => onNavigate(v.id)}
                    >
                      View
                    </Button>
                  )}
                  {isCurrent && (
                    <span className="shrink-0 text-xs text-muted-foreground pt-0.5">
                      Current
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
