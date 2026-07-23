export interface SignalFrontmatter {
  title: string;
  date: string;
  category: "alpha_signal" | "alpha_signal_premarket";
  lang: "en" | "ko";
}

export interface SignalListItem extends SignalFrontmatter {
  filename: string;
  excerpt: string;
}

const REPO = "as-proiectio/data";
const FETCH_TIMEOUT = 10_000;

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

  signals.sort((a, b) => (b.date || "").localeCompare(a.date || ""));

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
