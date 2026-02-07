import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { storyGenerationPrompt } from "@/lib/prompts/artifact-prompts";

function stripCodeFences(text: string): string {
  const trimmed = text.trim();
  const match = trimmed.match(/^```(?:\w+)?\s*\n?([\s\S]*?)\n?\s*```$/);
  return match ? match[1].trim() : trimmed;
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey || apiKey === "sk-ant-...") {
    return NextResponse.json(
      { error: "Anthropic API key not configured" },
      { status: 503 }
    );
  }

  let body: {
    prdContent: string;
    branding: {
      primaryColor: string;
      tagline: string;
      projectName: string;
    };
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { prdContent, branding } = body;

  if (!prdContent) {
    return NextResponse.json(
      { error: "prdContent is required" },
      { status: 400 }
    );
  }

  try {
    const client = new Anthropic({ apiKey });
    const prompt = storyGenerationPrompt(prdContent, {
      primaryColor: branding?.primaryColor || "#18181b",
      tagline: branding?.tagline || "",
      projectName: branding?.projectName || "Untitled Project",
    });

    const message = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 8192,
      system:
        "You are a presentation designer creating a reveal.js HTML story for a healthcare design sprint project. Output a complete, self-contained HTML file only.",
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    const storyContent = stripCodeFences(textBlock?.text || "");

    return NextResponse.json({ storyContent });
  } catch (err: any) {
    console.error("Generate story error:", err);

    const errorMessage =
      err?.status === 401
        ? "Invalid Anthropic API key"
        : err?.status === 429
          ? "Rate limit exceeded. Please wait and try again."
          : "Story generation failed. Please try again.";

    return NextResponse.json(
      { error: errorMessage },
      { status: err?.status || 500 }
    );
  }
}
