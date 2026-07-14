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
  const repo = "buddy-proiectio/data";
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
