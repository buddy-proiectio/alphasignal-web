import React from "react";
import fs from "fs/promises";
import path from "path";
import Link from "next/link";
import { compileMDX } from "next-mdx-remote/rsc";

interface NoticeFrontmatter {
  title: string;
  date: string;
}

export default async function NoticePage() {
  const dirPath = path.join(process.cwd(), "content/notice");
  let files: string[] = [];
  try {
    files = await fs.readdir(dirPath);
  } catch (err) {
    console.error("Failed to read notices directory:", err);
  }

  const mdxFiles = files.filter((file) => file.endsWith(".mdx") || file.endsWith(".md"));

  const notices = await Promise.all(
    mdxFiles.map(async (file) => {
      const slug = file.replace(/\.mdx?$/, "");
      const filePath = path.join(dirPath, file);
      const source = await fs.readFile(filePath, "utf-8");
      
      const { frontmatter } = await compileMDX<NoticeFrontmatter>({
        source,
        options: { parseFrontmatter: true }
      });

      return {
        slug,
        title: frontmatter.title || slug,
        date: frontmatter.date || "",
      };
    })
  );

  // Sort notices by date descending
  notices.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "2rem" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "1.5rem" }}>공지사항</h1>
      {notices.length === 0 ? (
        <p>등록된 공지사항이 없습니다.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {notices.map((notice) => (
            <li key={notice.slug} style={{ marginBottom: "1rem", borderBottom: "1px solid #eee", paddingBottom: "1rem" }}>
              <Link href={`/notice/${notice.slug}`} style={{ textDecoration: "none", color: "#0070f3" }}>
                <h2 style={{ fontSize: "1.25rem", margin: "0 0 0.5rem 0" }}>{notice.title}</h2>
              </Link>
              <small style={{ color: "#666" }}>{new Date(notice.date).toLocaleString("ko-KR")}</small>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
