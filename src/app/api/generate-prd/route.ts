import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createServerClient } from "@/lib/supabase";
import { prdCompilationPrompt } from "@/lib/prompts/artifact-prompts";

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey || apiKey === "sk-ant-...") {
    return NextResponse.json(
      { error: "Anthropic API key not configured" },
      { status: 503 }
    );
  }

  let body: { projectId: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { projectId } = body;
  if (!projectId) {
    return NextResponse.json(
      { error: "projectId is required" },
      { status: 400 }
    );
  }

  try {
    const supabase = createServerClient();

    // Fetch project with user info
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*, users!projects_user_id_fkey(name)")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Fetch all 7 phase_data rows
    const { data: phases, error: phasesError } = await supabase
      .from("phase_data")
      .select("phase, inputs, synthesis")
      .eq("project_id", projectId)
      .order("phase");

    if (phasesError || !phases || phases.length === 0) {
      return NextResponse.json(
        { error: "No phase data found for this project" },
        { status: 404 }
      );
    }

    const studentName =
      (project.users as any)?.name || "Unknown Student";
    const projectName = project.name || "Untitled Project";

    const prompt = prdCompilationPrompt(
      phases.map((p) => ({
        phase: p.phase,
        inputs: p.inputs as Record<string, any>,
        synthesis: p.synthesis as Record<string, any>,
      })),
      { projectName, studentName }
    );

    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 8192,
      system:
        "You are a technical writer compiling a Product Requirements Document for a healthcare design sprint project. Output clean Markdown only.",
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    const prdContent = textBlock?.text || "";

    return NextResponse.json({ prdContent });
  } catch (err: any) {
    console.error("Generate PRD error:", err);

    const errorMessage =
      err?.status === 401
        ? "Invalid Anthropic API key"
        : err?.status === 429
          ? "Rate limit exceeded. Please wait and try again."
          : "PRD generation failed. Please try again.";

    return NextResponse.json(
      { error: errorMessage },
      { status: err?.status || 500 }
    );
  }
}
