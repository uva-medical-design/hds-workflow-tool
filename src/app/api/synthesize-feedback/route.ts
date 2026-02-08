import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createServerClient } from "@/lib/supabase";
import { feedbackSynthesisPrompt } from "@/lib/prompts/feedback-prompts";

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey || apiKey === "sk-ant-...") {
    return NextResponse.json(
      { error: "Anthropic API key not configured" },
      { status: 503 }
    );
  }

  let body: { versionId: string; projectId: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { versionId, projectId } = body;
  if (!versionId || !projectId) {
    return NextResponse.json(
      { error: "versionId and projectId are required" },
      { status: 400 }
    );
  }

  try {
    const supabase = createServerClient();

    // Fetch version, project, feedback entries, and checklist in parallel
    const [versionRes, projectRes, entriesRes, checklistRes] =
      await Promise.all([
        supabase.from("versions").select("*").eq("id", versionId).single(),
        supabase.from("projects").select("*").eq("id", projectId).single(),
        supabase
          .from("feedback_entries")
          .select("tag, content, created_at")
          .eq("version_id", versionId)
          .order("created_at"),
        supabase
          .from("feature_checklist")
          .select("feature, status")
          .eq("version_id", versionId)
          .order("sort_order"),
      ]);

    if (!versionRes.data || !projectRes.data) {
      return NextResponse.json(
        { error: "Version or project not found" },
        { status: 404 }
      );
    }

    const version = versionRes.data;
    const project = projectRes.data;
    const entries = entriesRes.data || [];
    const checklist = checklistRes.data || [];

    if (entries.length === 0) {
      return NextResponse.json(
        { error: "No feedback entries to synthesize" },
        { status: 400 }
      );
    }

    const prompt = feedbackSynthesisPrompt({
      projectName: project.name || "Untitled Project",
      versionNumber: version.version_number,
      prdContent: version.prd_content || "",
      entries,
      checklist,
    });

    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 4096,
      system:
        "You are a design thinking coach analyzing build feedback to recommend PRD updates. Output valid JSON only.",
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    const rawText = textBlock?.text || "{}";

    // Parse the JSON response
    let synthesis: Record<string, unknown>;
    try {
      // Strip any code fences if present
      const cleaned = rawText
        .replace(/^```(?:json)?\s*\n?/g, "")
        .replace(/\n?\s*```$/g, "")
        .trim();
      synthesis = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        { error: "Failed to parse AI synthesis response" },
        { status: 500 }
      );
    }

    // Save synthesis to build_feedback table
    // Check for existing record first (no unique constraint on version_id)
    const { data: existingFeedback } = await supabase
      .from("build_feedback")
      .select("id")
      .eq("version_id", versionId)
      .limit(1)
      .single();

    if (existingFeedback) {
      await supabase
        .from("build_feedback")
        .update({
          ai_analysis: synthesis,
          suggested_updates: (synthesis as any).suggested_updates || [],
        })
        .eq("id", existingFeedback.id);
    } else {
      await supabase.from("build_feedback").insert({
        version_id: versionId,
        project_id: projectId,
        ai_analysis: synthesis,
        suggested_updates: (synthesis as any).suggested_updates || [],
      });
    }

    return NextResponse.json({ synthesis });
  } catch (err: any) {
    console.error("Synthesize feedback error:", err);

    const errorMessage =
      err?.status === 401
        ? "Invalid Anthropic API key"
        : err?.status === 429
          ? "Rate limit exceeded. Please wait and try again."
          : "Feedback synthesis failed. Please try again.";

    return NextResponse.json(
      { error: errorMessage },
      { status: err?.status || 500 }
    );
  }
}
