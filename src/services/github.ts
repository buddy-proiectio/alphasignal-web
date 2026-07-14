export interface SignalFrontmatter {
  title: string;
  date: string;
  category: "alpha_signal" | "alpha_signal_premarket";
  lang: "en" | "ko";
}

interface SignalListItem extends SignalFrontmatter {
  filename: string;
  contentLength: number;
}

interface GitHubContentItem {
  name: string;
  type: string;
}

const REPO = "buddy-proiectio/data";

function parseFrontmatter(raw: string): Record<string, string> | null {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;
  const result: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const val = line.slice(idx + 1).trim();
    if (key && val) result[key] = val;
  }
  return result;
}

async function listGitHubDir(dir: string): Promise<string[]> {
  const pat = process.env.GITHUB_PAT;
  if (!pat) {
    throw new Error("Missing GITHUB_PAT environment variable.");
  }

  const url = `https://api.github.com/repos/${REPO}/contents/${dir}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `token ${pat}`,
      Accept: "application/vnd.github.v3+json",
    },
    next: { tags: ["signal"] },
  });

  if (!res.ok) {
    throw new Error(
      `Failed to list GitHub directory ${dir}: ${res.statusText}`,
    );
  }

  const items: GitHubContentItem[] = await res.json();
  return items
    .filter((item) => item.type === "file" && item.name.endsWith(".md"))
    .map((item) => item.name);
}

async function fetchFileRaw(dir: string, filename: string): Promise<string> {
  const pat = process.env.GITHUB_PAT;
  if (!pat) {
    throw new Error("Missing GITHUB_PAT environment variable.");
  }

  const url = `https://api.github.com/repos/${REPO}/contents/${dir}/${filename}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `token ${pat}`,
      Accept: "application/vnd.github.v3.raw",
    },
    next: { tags: ["signal"] },
  });

  if (!res.ok) {
    throw new Error(
      `Failed to fetch ${dir}/${filename}: ${res.statusText}`,
    );
  }

  return res.text();
}

export async function fetchSignalList(): Promise<SignalListItem[]> {
  const [reportFiles, premarketFiles] = await Promise.all([
    listGitHubDir("report"),
    listGitHubDir("premarket"),
  ]);

  const tasks: Promise<SignalListItem | null>[] = [];

  for (const file of reportFiles) {
    tasks.push(
      fetchFileRaw("report", file).then((raw) => {
        const fm = parseFrontmatter(raw);
        if (!fm) return null;
        return {
          title: fm.title || file,
          date: fm.date || "",
          category: (fm.category as SignalFrontmatter["category"]) || "alpha_signal",
          lang: (fm.lang as SignalFrontmatter["lang"]) || "en",
          filename: file,
          contentLength: raw.length,
        };
      }),
    );
  }

  for (const file of premarketFiles) {
    tasks.push(
      fetchFileRaw("premarket", file).then((raw) => {
        const fm = parseFrontmatter(raw);
        if (!fm) return null;
        return {
          title: fm.title || file,
          date: fm.date || "",
          category: (fm.category as SignalFrontmatter["category"]) || "alpha_signal_premarket",
          lang: (fm.lang as SignalFrontmatter["lang"]) || "en",
          filename: file,
          contentLength: raw.length,
        };
      }),
    );
  }

  const results = await Promise.all(tasks);
  const signals = results.filter((s): s is SignalListItem => s !== null);

  signals.sort((a, b) => b.date.localeCompare(a.date));

  return signals;
}

export async function fetchSignalMarkdown(
  lang: string,
  type: string,
  date: string,
): Promise<string> {
  const pat = process.env.GITHUB_PAT;
  if (!pat) {
    throw new Error(
      "Missing GITHUB_PAT environment variable. Please configure it to fetch remote signal markdown.",
    );
  }
  const repo = REPO;
  const mappedType =
    type === "premarket"
      ? "premarket/alpha_signal_premarket"
      : "report/alpha_signal";
  const filename =
    lang === "ko" ? `${mappedType}_${date}_ko.md` : `${mappedType}_${date}.md`;

  const url = `https://api.github.com/repos/${repo}/contents/${filename}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `token ${pat}`,
      Accept: "application/vnd.github.v3.raw",
    },
    next: { tags: ["signal"] },
  });
  if (!res.ok) {
    throw new Error(
      `Failed to fetch markdown file from GitHub: ${res.statusText}`,
    );
  }
  return res.text();
}
