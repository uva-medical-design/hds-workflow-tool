import { NextRequest, NextResponse } from "next/server";
import { commitFiles } from "@/lib/github";

interface ArtifactFile {
  name: string;
  content: string;
}

export async function POST(request: NextRequest) {
  let body: {
    files: ArtifactFile[];
    studentName: string;
    projectSlug: string;
    version: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { files, studentName, projectSlug, version } = body;

  if (!files?.length || !studentName || !projectSlug || !version) {
    return NextResponse.json(
      { error: "files, studentName, projectSlug, and version are required" },
      { status: 400 }
    );
  }

  // Build file paths: students/{slug}/projects/{slug}/versions/{version}/
  const studentSlug = toKebabCase(studentName);
  const basePath = `students/${studentSlug}/projects/${projectSlug}/versions/${version}`;

  const fileEntries = files.map((f) => ({
    path: `${basePath}/${f.name}`,
    content: f.content,
  }));

  try {
    const result = await commitFiles(
      fileEntries,
      `${version}: ${projectSlug} artifacts for ${studentName}`
    );

    return NextResponse.json({
      sha: result.sha,
      commitUrl: result.url,
      fileUrls: result.fileUrls,
    });
  } catch (err: any) {
    console.error("Commit artifacts error:", err);

    // Return a clear error so the caller can still save the version without GitHub URLs
    return NextResponse.json(
      {
        error: err.message || "GitHub commit failed",
        sha: null,
        commitUrl: null,
        fileUrls: null,
      },
      { status: 502 }
    );
  }
}

function toKebabCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
