"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

interface SuggestedUpdate {
  action: string;
  section: string;
  description: string;
  rationale: string;
}

interface SynthesisData {
  overall_assessment: string;
  patterns: {
    wins: string[];
    gaps: string[];
    questions: string[];
  };
  suggested_updates: SuggestedUpdate[];
  scope_assessment: "minor" | "major";
}

interface SynthesisResultsProps {
  synthesis: SynthesisData;
  currentVersion: string;
  onAccept: (selectedUpdates: SuggestedUpdate[], isMajor: boolean) => void;
  onSkip: () => void;
  accepting: boolean;
}

export function SynthesisResults({
  synthesis,
  currentVersion,
  onAccept,
  onSkip,
  accepting,
}: SynthesisResultsProps) {
  const [selected, setSelected] = useState<Set<number>>(
    new Set(synthesis.suggested_updates.map((_, i) => i))
  );
  const [isMajor, setIsMajor] = useState(
    synthesis.scope_assessment === "major"
  );

  function toggleUpdate(index: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  function handleAccept() {
    const selectedUpdates = synthesis.suggested_updates.filter((_, i) =>
      selected.has(i)
    );
    onAccept(selectedUpdates, isMajor);
  }

  const nextVersion = computeNextVersion(currentVersion, isMajor);

  return (
    <div className="space-y-4">
      {/* Overall Assessment */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">
            Synthesis Results
          </CardTitle>
          <CardDescription>{synthesis.overall_assessment}</CardDescription>
        </CardHeader>
      </Card>

      {/* Patterns */}
      <div className="grid gap-3 md:grid-cols-3">
        {synthesis.patterns.wins.length > 0 && (
          <Card>
            <CardContent className="pt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-green-600 dark:text-green-400">
                Wins
              </p>
              <ul className="space-y-1">
                {synthesis.patterns.wins.map((w, i) => (
                  <li key={i} className="text-xs text-muted-foreground">
                    {w}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
        {synthesis.patterns.gaps.length > 0 && (
          <Card>
            <CardContent className="pt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
                Gaps
              </p>
              <ul className="space-y-1">
                {synthesis.patterns.gaps.map((g, i) => (
                  <li key={i} className="text-xs text-muted-foreground">
                    {g}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
        {synthesis.patterns.questions.length > 0 && (
          <Card>
            <CardContent className="pt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
                Open Questions
              </p>
              <ul className="space-y-1">
                {synthesis.patterns.questions.map((q, i) => (
                  <li key={i} className="text-xs text-muted-foreground">
                    {q}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Suggested Updates */}
      {synthesis.suggested_updates.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Suggested PRD Updates
            </CardTitle>
            <CardDescription>
              Select the updates to include in the next version
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            {synthesis.suggested_updates.map((update, i) => (
              <label
                key={i}
                className="flex items-start gap-3 rounded-md p-2 transition-colors hover:bg-muted/50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selected.has(i)}
                  onChange={() => toggleUpdate(i)}
                  className="mt-1 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-mono font-bold ${
                        update.action.startsWith("+")
                          ? "text-green-600 dark:text-green-400"
                          : update.action.startsWith("~")
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {update.action}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {update.section}
                    </span>
                  </div>
                  <p className="text-sm">{update.description}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {update.rationale}
                  </p>
                </div>
              </label>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Scope + Actions */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsMajor(false)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-opacity ${
                  !isMajor
                    ? "border-foreground/30 opacity-100"
                    : "border-border opacity-50"
                }`}
              >
                Minor ({currentVersion} → {computeNextVersion(currentVersion, false)})
              </button>
              <button
                type="button"
                onClick={() => setIsMajor(true)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-opacity ${
                  isMajor
                    ? "border-foreground/30 opacity-100"
                    : "border-border opacity-50"
                }`}
              >
                Major ({currentVersion} → {computeNextVersion(currentVersion, true)})
              </button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onSkip} disabled={accepting}>
                Skip
              </Button>
              <Button
                size="sm"
                onClick={handleAccept}
                disabled={selected.size === 0 || accepting}
              >
                {accepting
                  ? "Generating..."
                  : `Accept & Generate ${nextVersion}`}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function computeNextVersion(current: string, isMajor: boolean): string {
  const match = current.match(/^v(\d+)\.(\d+)$/);
  if (!match) return "v1.1";
  const major = parseInt(match[1]);
  const minor = parseInt(match[2]);
  if (isMajor) return `v${major + 1}.0`;
  return `v${major}.${minor + 1}`;
}
