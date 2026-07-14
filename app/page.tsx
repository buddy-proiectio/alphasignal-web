import React from "react";
import fs from "fs/promises";
import path from "path";
import { compileMDX } from "next-mdx-remote/rsc";
import PremiumDashboard, {
  NoticeData,
  SignalData,
} from "../src/components/PremiumDashboard";
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

  const notices: NoticeData[] = await Promise.all(
    mdxFiles.map(async (file) => {
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
      };
    }),
  );

  // Sort notices by date descending
  notices.sort((a, b) => getSafeTime(b.date) - getSafeTime(a.date));

  // Define premium signals matching data in buddy-proiectio/data repo
  const signals: SignalData[] = [];

  return (
    <>
      <Analytics gaId="G-BUDDYPREM" />
      <PremiumDashboard notices={notices} initialSignals={signals} />
    </>
  );
}
