import React from "react";
import fs from "fs/promises";
import path from "path";
import { notFound } from "next/navigation";
import { compileMDX } from "next-mdx-remote/rsc";

interface NoticeFrontmatter {
  title: string;
  date: string;
}

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function NoticeDetailPage({ params }: PageProps) {
  const { slug } = await params;
  
  const mdxPath = path.join(process.cwd(), "content/notice", `${slug}.mdx`);
  const mdPath = path.join(process.cwd(), "content/notice", `${slug}.md`);
  
  let source: string;
  try {
    source = await fs.readFile(mdxPath, "utf-8");
  } catch {
    try {
      source = await fs.readFile(mdPath, "utf-8");
    } catch {
      notFound();
    }
  }

  const { content, frontmatter } = await compileMDX<NoticeFrontmatter>({
    source,
    options: { parseFrontmatter: true }
  });

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "2rem" }}>
      <header style={{ marginBottom: "2rem", borderBottom: "1px solid #eee", paddingBottom: "1rem" }}>
        <h1 style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>{frontmatter.title || slug}</h1>
        {frontmatter.date && (
          <time style={{ color: "#666" }}>
            {new Date(frontmatter.date).toLocaleString("ko-KR")}
          </time>
        )}
      </header>
      <article className="prose" style={{ lineHeight: 1.6 }}>
        {content}
      </article>
    </div>
  );
}
