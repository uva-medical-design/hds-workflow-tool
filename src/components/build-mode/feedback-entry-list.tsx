"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TrashIcon } from "lucide-react";
import type { FeedbackEntry, FeedbackTag } from "@/types";

const TAG_STYLES: Record<FeedbackTag, string> = {
  win: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  gap: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  question: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  pivot: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  note: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

const TAG_LABELS: Record<FeedbackTag, string> = {
  win: "Win",
  gap: "Gap",
  question: "Question",
  pivot: "Pivot",
  note: "Note",
};

interface FeedbackEntryListProps {
  entries: FeedbackEntry[];
  onDelete: (id: string) => Promise<void>;
}

export function FeedbackEntryList({ entries, onDelete }: FeedbackEntryListProps) {
  if (entries.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-8 text-center">
        <p className="text-sm text-muted-foreground">
          No feedback entries yet. Start logging observations as you build.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {entries.map((entry) => (
        <Card key={entry.id} className="group">
          <CardContent className="flex items-start gap-3 py-3 pt-3">
            <span
              className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                TAG_STYLES[entry.tag]
              }`}
            >
              {TAG_LABELS[entry.tag]}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm whitespace-pre-wrap">{entry.content}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {new Date(entry.created_at).toLocaleString()}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => onDelete(entry.id)}
            >
              <TrashIcon className="size-3" />
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
