import fs from "fs/promises";
import path from "path";
import { compileMDX } from "next-mdx-remote/rsc";

interface NoticeFrontmatter {
  title?: string;
  date?: string;
}

export interface NoticeItem {
  slug: string;
  title: string;
  date: string;
  href: string;
}

export async function getLatestNotice(): Promise<NoticeItem | null> {
  const dirPath = path.join(process.cwd(), "content/notice");
  try {
    const files = await fs.readdir(dirPath);
    const mdxFiles = files.filter(
      (file) => file.endsWith(".mdx") || file.endsWith(".md"),
    );

    if (mdxFiles.length === 0) return null;

    const noticesResults = await Promise.all(
      mdxFiles.map(async (file) => {
        try {
          const slug = file.replace(/\.mdx?$/, "");
          const filePath = path.join(dirPath, file);
          const source = await fs.readFile(filePath, "utf-8");

          const { frontmatter } = await compileMDX<NoticeFrontmatter>({
            source,
            options: { parseFrontmatter: true },
          });

          return {
            slug,
            title: frontmatter.title || slug,
            date: frontmatter.date || "",
            href: `/notice/${slug}`,
          };
        } catch (e) {
          console.warn(`Failed to parse notice ${file}:`, e);
          return null;
        }
      }),
    );

    const notices = noticesResults.filter((n): n is NoticeItem => n !== null);

    // Sort notices by date descending
    notices.sort((a, b) => (b.date || "").localeCompare(a.date || ""));

    return notices[0] || null;
  } catch (err) {
    console.warn("Failed to get latest notice:", err);
    return null;
  }
}
