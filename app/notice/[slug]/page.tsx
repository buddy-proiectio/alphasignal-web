import React from "react";
import fs from "fs/promises";
import path from "path";
import { notFound } from "next/navigation";
import { compileMDX } from "next-mdx-remote/rsc";
import Sponsorship from "../../../src/components/Sponsorship";
import Adsense from "../../../src/components/Adsense";

interface NoticeFrontmatter {
  title?: string;
  date?: string;
}

function formatNoticeDate(dateStr: string | undefined): string | null {
  if (!dateStr) return null;
  const dateObj = new Date(dateStr);
  const time = dateObj.getTime();
  if (isNaN(time)) return null;
  return dateObj.toLocaleString("ko-KR");
}

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function NoticeDetailPage({ params }: PageProps) {
  const { slug } = await params;

  // Sanitize the slug to prevent directory traversal
  const safeSlug = path.basename(slug);
  if (
    safeSlug !== slug ||
    slug.includes("..") ||
    slug.includes("/") ||
    slug.includes("\\")
  ) {
    notFound();
  }

  const mdxPath = path.join(process.cwd(), "content/notice", `${safeSlug}.mdx`);
  const mdPath = path.join(process.cwd(), "content/notice", `${safeSlug}.md`);

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
    options: { parseFrontmatter: true },
  });

  return (
    <div className="container" style={{ maxWidth: 800 }}>
      <header
        style={{
          marginBottom: "2rem",
          borderBottom: "1px solid hsl(var(--border))",
          paddingBottom: "1.5rem",
        }}
      >
        <div style={{ marginBottom: "1rem" }}>
          <span className="badge badge-notice">Notice</span>
        </div>
        <h1
          style={{
            fontSize: "2.5rem",
            fontWeight: 800,
            marginBottom: "0.5rem",
            color: "hsl(var(--foreground))",
          }}
        >
          {frontmatter.title || slug}
        </h1>
        {(() => {
          const formattedDate = formatNoticeDate(frontmatter.date);
          return formattedDate ? (
            <time style={{ color: "hsl(var(--muted))", fontSize: "0.9rem" }}>
              {formattedDate}
            </time>
          ) : null;
        })()}
      </header>

      <article className="prose" style={{ minHeight: "200px" }}>
        {content}
      </article>

      {/* Adsense Integration */}
      <Adsense slot="4567890123" />

      {/* Sponsorship Widget below article renderer */}
      <Sponsorship />
    </div>
  );
}
