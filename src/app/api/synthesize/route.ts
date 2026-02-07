import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getSystemPrompt, getUserPrompt } from "@/lib/prompts";

function stripCodeFences(text: string): string {
  const trimmed = text.trim();
  const match = trimmed.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?\s*```$/);
  return match ? match[1].trim() : trimmed;
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey || apiKey === "sk-ant-...") {
    return NextResponse.json(
      {
        error: "Anthropic API key not configured. Add ANTHROPIC_API_KEY to .env.local.",
        synthesis: null,
      },
      { status: 503 }
    );
  }

  let body: {
    phase: number;
    inputs: Record<string, any>;
    subStep?: string;
    previousSynthesis?: Record<string, any>;
    iterationFeedback?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body", synthesis: null },
      { status: 400 }
    );
  }

  const { phase, inputs, subStep, previousSynthesis, iterationFeedback } = body;

  if (!phase || phase < 1 || phase > 7) {
    return NextResponse.json(
      { error: "Phase must be between 1 and 7", synthesis: null },
      { status: 400 }
    );
  }

  if (!inputs || typeof inputs !== "object") {
    return NextResponse.json(
      { error: "Inputs are required", synthesis: null },
      { status: 400 }
    );
  }

  try {
    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 2048,
      system: getSystemPrompt(),
      messages: [
        {
          role: "user",
          content: getUserPrompt({
            phase,
            inputs,
            subStep,
            previousSynthesis,
            iterationFeedback,
          }),
        },
      ],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    const rawText = textBlock?.text || "{}";

    // Parse JSON response, fallback to wrapping raw text
    let synthesis: Record<string, any>;
    try {
      const cleaned = stripCodeFences(rawText);
      synthesis = JSON.parse(cleaned);
    } catch {
      synthesis = { raw_response: rawText };
    }

    return NextResponse.json({
      synthesis,
      model: message.model,
      tokensUsed: {
        input: message.usage.input_tokens,
        output: message.usage.output_tokens,
      },
    });
  } catch (err: any) {
    console.error("Synthesis API error:", err);

    const errorMessage =
      err?.status === 401
        ? "Invalid Anthropic API key"
        : err?.status === 429
          ? "Rate limit exceeded. Please wait a moment and try again."
          : "AI synthesis failed. Please try again.";

    return NextResponse.json(
      { error: errorMessage, synthesis: null },
      { status: err?.status || 500 }
    );
  }
}
