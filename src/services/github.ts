import { extractExcerpt } from "@/utils/extract-excerpt";

export interface SignalFrontmatter {
  title: string;
  date: string;
  category: "alpha_signal" | "alpha_signal_premarket";
  lang: "en" | "ko";
}

interface SignalListItem extends SignalFrontmatter {
  filename: string;
  excerpt: string;
}

interface GitHubContentItem {
  name: string;
  type: string;
}

const REPO = "buddy-proiectio/data";
const FETCH_TIMEOUT = 10_000;

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

function githubFetch(url: string, raw = false): Promise<Response> {
  const pat = process.env.GITHUB_PAT;
  if (!pat) {
    throw new Error("Missing GITHUB_PAT environment variable.");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  return fetch(url, {
    headers: {
      Authorization: `token ${pat}`,
      Accept: raw
        ? "application/vnd.github.v3.raw"
        : "application/vnd.github.v3+json",
    },
    next: { tags: ["signal"], revalidate: 60 },
    signal: controller.signal,
  }).finally(() => clearTimeout(timer));
}

async function listGitHubDir(dir: string): Promise<string[]> {
  const res = await githubFetch(
    `https://api.github.com/repos/${REPO}/contents/${dir}`,
  );

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
  const res = await githubFetch(
    `https://api.github.com/repos/${REPO}/contents/${dir}/${filename}`,
    true,
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch ${dir}/${filename}: ${res.statusText}`);
  }

  return res.text();
}

function buildSignalItem(
  file: string,
  raw: string,
  defaultCategory: "alpha_signal" | "alpha_signal_premarket",
): SignalListItem | null {
  const fm = parseFrontmatter(raw);
  if (!fm) return null;
  const lang = (fm.lang as SignalFrontmatter["lang"]) || "en";
  return {
    title: fm.title || file,
    date: fm.date || "",
    category: (fm.category as SignalFrontmatter["category"]) || defaultCategory,
    lang,
    filename: file,
    excerpt: extractExcerpt(raw),
  };
}

export async function fetchSignalList(): Promise<SignalListItem[]> {
  const res = await githubFetch(
    `https://api.github.com/repos/${REPO}/contents/signals.json`,
    true,
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch signals.json: ${res.statusText}`);
  }

  const rawText = await res.text();
  const signals: SignalListItem[] = JSON.parse(rawText);

  signals.sort((a, b) => b.date.localeCompare(a.date));

  return signals;
}

export async function fetchSignalMarkdown(
  lang: string,
  type: string,
  date: string,
): Promise<string> {
  const mappedType =
    type === "premarket"
      ? "premarket/alpha_signal_premarket"
      : "report/alpha_signal";
  const filename =
    lang === "ko" ? `${mappedType}_${date}_ko.md` : `${mappedType}_${date}.md`;

  const res = await githubFetch(
    `https://api.github.com/repos/${REPO}/contents/${filename}`,
    true,
  );

  if (!res.ok) {
    throw new Error(
      `Failed to fetch markdown file from GitHub: ${res.statusText}`,
    );
  }
  return res.text();
}
