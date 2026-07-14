export function extractExcerpt(markdown: string, maxLength = 120): string {
  const text = markdown
    .replace(/^---[\s\S]*?---/, "")
    .replace(/<[^>]+>/g, "")
    .replace(/#{1,6}\s*/g, "")
    .replace(/\*\*|__/g, "")
    .replace(/\*|_/g, "")
    .replace(/`{1,3}[^`]*`{1,3}/g, "")
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/\[([^\]]+)\]\(.*?\)/g, "$1")
    .replace(/>\s*/g, "")
    .replace(/[-*+]\s+/g, "")
    .replace(/\d+\.\s+/g, "")
    .replace(/\|/g, " ")
    .replace(/\n+/g, " ")
    .trim();

  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).replace(/\s+\S*$/, "") + "...";
}
