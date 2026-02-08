"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import type { FeedbackTag } from "@/types";

const TAG_CONFIG: { tag: FeedbackTag; label: string; color: string }[] = [
  { tag: "win", label: "Win", color: "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700" },
  { tag: "gap", label: "Gap", color: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700" },
  { tag: "question", label: "Question", color: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700" },
  { tag: "pivot", label: "Pivot", color: "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-700" },
];

interface FeedbackEntryInputProps {
  onSubmit: (content: string, tag: FeedbackTag) => Promise<void>;
  disabled?: boolean;
}

export function FeedbackEntryInput({ onSubmit, disabled }: FeedbackEntryInputProps) {
  const [content, setContent] = useState("");
  const [tag, setTag] = useState<FeedbackTag>("note");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    const trimmed = content.trim();
    if (!trimmed || submitting) return;

    setSubmitting(true);
    try {
      await onSubmit(trimmed, tag);
      setContent("");
      setTag("note");
    } finally {
      setSubmitting(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <Textarea
          placeholder="Log an observation about your build..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={3}
          disabled={disabled || submitting}
          className="mb-3 resize-none"
        />
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            {TAG_CONFIG.map(({ tag: t, label, color }) => (
              <button
                key={t}
                type="button"
                onClick={() => setTag(t)}
                className={`rounded-full border px-2.5 py-0.5 text-xs font-medium transition-opacity ${color} ${
                  tag === t ? "opacity-100 ring-1 ring-offset-1" : "opacity-50"
                }`}
              >
                {label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setTag("note")}
              className={`rounded-full border px-2.5 py-0.5 text-xs font-medium border-border text-muted-foreground transition-opacity ${
                tag === "note" ? "opacity-100 ring-1 ring-offset-1" : "opacity-50"
              }`}
            >
              Note
            </button>
          </div>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!content.trim() || submitting || disabled}
          >
            {submitting ? "Saving..." : "Submit"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
