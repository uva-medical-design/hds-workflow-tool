// GitHub API helper for atomic multi-file commits using Trees API

interface FileEntry {
  path: string;
  content: string;
}

interface CommitResult {
  sha: string;
  url: string;
  fileUrls: Record<string, string>;
}

const GITHUB_API = "https://api.github.com";

function getConfig() {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;

  if (!token || token === "ghp_...") {
    throw new Error("GITHUB_TOKEN not configured");
  }
  if (!owner || !repo) {
    throw new Error("GITHUB_OWNER and GITHUB_REPO must be set");
  }

  return { token, owner, repo };
}

async function githubFetch(
  path: string,
  token: string,
  options: RequestInit = {}
) {
  const res = await fetch(`${GITHUB_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub API ${res.status}: ${body}`);
  }

  return res.json();
}

/**
 * Commit multiple files atomically using GitHub Trees + Commits API.
 *
 * 1. Get current HEAD SHA of main branch
 * 2. Create blobs for each file
 * 3. Create a tree with all blobs
 * 4. Create a commit referencing the tree
 * 5. Update the ref to point to the new commit
 */
export async function commitFiles(
  files: FileEntry[],
  message: string
): Promise<CommitResult> {
  const { token, owner, repo } = getConfig();
  const base = `/repos/${owner}/${repo}`;

  // 1. Get current HEAD SHA
  const ref = await githubFetch(`${base}/git/ref/heads/main`, token);
  const headSha: string = ref.object.sha;

  // 2. Create blobs for each file
  const blobResults = await Promise.all(
    files.map(async (file) => {
      const blob = await githubFetch(`${base}/git/blobs`, token, {
        method: "POST",
        body: JSON.stringify({
          content: file.content,
          encoding: "utf-8",
        }),
      });
      return { path: file.path, sha: blob.sha as string };
    })
  );

  // 3. Create tree
  const tree = await githubFetch(`${base}/git/trees`, token, {
    method: "POST",
    body: JSON.stringify({
      base_tree: headSha,
      tree: blobResults.map((b) => ({
        path: b.path,
        mode: "100644",
        type: "blob",
        sha: b.sha,
      })),
    }),
  });

  // 4. Create commit
  const commit = await githubFetch(`${base}/git/commits`, token, {
    method: "POST",
    body: JSON.stringify({
      message,
      tree: tree.sha,
      parents: [headSha],
    }),
  });

  // 5. Update ref
  await githubFetch(`${base}/git/refs/heads/main`, token, {
    method: "PATCH",
    body: JSON.stringify({ sha: commit.sha }),
  });

  // Build file URLs
  const fileUrls: Record<string, string> = {};
  for (const file of files) {
    fileUrls[file.path] =
      `https://github.com/${owner}/${repo}/blob/main/${file.path}`;
  }

  return {
    sha: commit.sha,
    url: commit.html_url || `https://github.com/${owner}/${repo}/commit/${commit.sha}`,
    fileUrls,
  };
}
