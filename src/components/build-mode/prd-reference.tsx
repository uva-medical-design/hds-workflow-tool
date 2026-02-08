"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDownIcon, ChevronUpIcon, ExternalLinkIcon } from "lucide-react";
import type { Version, Project } from "@/types";

interface PrdReferenceProps {
  version: Version;
  project: Project;
}

export function PrdReference({ version, project }: PrdReferenceProps) {
  const [expanded, setExpanded] = useState(false);

  // Extract a short summary from the PRD (first ~3 lines after the title)
  const summary = extractSummary(version.prd_content || "");

  function handleViewStory() {
    if (!version.story_content) return;
    const blob = new Blob([version.story_content], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            PRD Reference
          </CardTitle>
          <div className="flex gap-2">
            {version.story_content && (
              <Button variant="ghost" size="sm" onClick={handleViewStory}>
                <ExternalLinkIcon className="mr-1 size-3" />
                View Story
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <>
                  <ChevronUpIcon className="mr-1 size-3" />
                  Collapse
                </>
              ) : (
                <>
                  <ChevronDownIcon className="mr-1 size-3" />
                  Expand PRD
                </>
              )}
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {project.name} &mdash; {version.version_number}
        </p>
      </CardHeader>
      {!expanded && summary && (
        <CardContent className="pt-0">
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
            {summary}
          </p>
        </CardContent>
      )}
      {expanded && version.prd_content && (
        <CardContent className="pt-0">
          <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap font-mono text-xs leading-relaxed max-h-[60vh] overflow-y-auto">
            {version.prd_content}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

function extractSummary(prd: string): string {
  const lines = prd.split("\n").filter((l) => l.trim() && !l.startsWith("#"));
  return lines.slice(0, 3).join(" ").slice(0, 300);
}
