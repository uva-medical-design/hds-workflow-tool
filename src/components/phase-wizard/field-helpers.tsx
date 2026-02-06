"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SaveStatus } from "@/lib/use-autosave";
import { XIcon } from "lucide-react";

export function StringListField({
  label,
  items,
  onChange,
  placeholder,
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
}) {
  function updateItem(index: number, value: string) {
    const updated = [...items];
    updated[index] = value;
    onChange(updated);
  }

  function removeItem(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  function addItem() {
    onChange([...items, ""]);
  }

  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      {items.map((item, i) => (
        <div key={i} className="flex gap-2">
          <Input
            value={item}
            onChange={(e) => updateItem(i, e.target.value)}
            placeholder={placeholder}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => removeItem(i)}
            className="shrink-0"
          >
            <XIcon className="size-3" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addItem}
        className="w-fit"
      >
        + Add
      </Button>
    </div>
  );
}

export function SaveStatusIndicator({ status }: { status: SaveStatus }) {
  if (status === "idle") return null;

  const labels: Record<SaveStatus, string> = {
    idle: "",
    saving: "Saving...",
    saved: "Saved",
    error: "Save failed",
  };

  return (
    <span
      className={`text-xs ${status === "error" ? "text-destructive" : "text-muted-foreground"}`}
    >
      {labels[status]}
    </span>
  );
}
