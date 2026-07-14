import React from "react";
import fs from "fs/promises";
import path from "path";
import { compileMDX } from "next-mdx-remote/rsc";
import Header from "../src/components/Header";
import FilterBarClient from "../src/components/FilterBarClient";
import { ContentItem } from "../src/components/ContentCard";
import Analytics from "../src/components/Analytics";

interface NoticeFrontmatter {
  title?: string;
  date?: string;
}

function getSafeTime(dateStr: string | undefined): number {
  if (!dateStr) return 0;
  const time = new Date(dateStr).getTime();
  return isNaN(time) ? 0 : time;
}

export default async function Home() {
  const dirPath = path.join(process.cwd(), "content/notice");
  let files: string[] = [];
  try {
    files = await fs.readdir(dirPath);
  } catch (err) {
    console.warn("Failed to read notices directory:", err);
  }

  const mdxFiles = files.filter(
    (file) => file.endsWith(".mdx") || file.endsWith(".md"),
  );

  const notices: ContentItem[] = await Promise.all(
    mdxFiles.map(async (file) => {
      const slug = file.replace(/\.mdx?$/, "");
      const filePath = path.join(dirPath, file);
      const source = await fs.readFile(filePath, "utf-8");

      const { frontmatter } = await compileMDX<NoticeFrontmatter>({
        source,
        options: { parseFrontmatter: true },
      });

      return {
        type: "notice" as const,
        slug,
        title: frontmatter.title || slug,
        date: frontmatter.date || "",
        category: "notice",
        href: `/notice/${slug}`,
      };
    }),
  );

  // Sort notices by date descending
  notices.sort((a, b) => getSafeTime(b.date) - getSafeTime(a.date));

  // Define signals (empty for now, will be populated from GitHub API)
  const signals: ContentItem[] = [];

  // Combine all items for "all" category
  const allItems: ContentItem[] = [...notices, ...signals];

  return (
    <>
      <Analytics gaId="G-BUDDYPREM" />
      <Header />
      <FilterBarClient allItems={allItems} notices={notices} signals={signals} />
    </>
  );
}
