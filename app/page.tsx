import React from "react";
import fs from "fs/promises";
import path from "path";
import { compileMDX } from "next-mdx-remote/rsc";
import Header from "../src/components/Header";
import FilterBarClient from "../src/components/FilterBarClient";
import { ContentItem } from "../src/components/ContentCard";
import { fetchSignalList } from "../src/services/github";
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
        contentLength: source.length,
      };
    }),
  );

  // Sort notices by date descending
  notices.sort((a, b) => getSafeTime(b.date) - getSafeTime(a.date));

  // Fetch signals from GitHub
  let signals: ContentItem[] = [];
  try {
    const signalList = await fetchSignalList();
    signals = signalList.map((s) => {
      const d = new Date(s.date);
      const dateYMD = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
      return {
        type: "signal" as const,
        title: s.title,
        date: s.date,
        category: s.category,
        lang: s.lang,
        href: `/signal/${s.lang}/${s.category === "alpha_signal_premarket" ? "premarket" : "alpha"}/${dateYMD}`,
        contentLength: s.contentLength,
      };
    });
  } catch (err) {
    console.warn("Failed to fetch signals from GitHub:", err);
  }

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
