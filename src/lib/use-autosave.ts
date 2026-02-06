"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export function useAutosave(
  projectId: string,
  phase: number,
  inputs: Record<string, any>,
  enabled: boolean = true
) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>("");

  const save = useCallback(
    async (data: Record<string, any>) => {
      setSaveStatus("saving");
      const { error } = await supabase.from("phase_data").upsert(
        {
          project_id: projectId,
          phase,
          inputs: data,
          status: "in_progress",
        },
        { onConflict: "project_id,phase" }
      );
      setSaveStatus(error ? "error" : "saved");
    },
    [projectId, phase]
  );

  useEffect(() => {
    if (!enabled) return;
    const serialized = JSON.stringify(inputs);
    if (serialized === lastSavedRef.current) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      lastSavedRef.current = serialized;
      save(inputs);
    }, 500);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [inputs, enabled, save]);

  return { saveStatus };
}
