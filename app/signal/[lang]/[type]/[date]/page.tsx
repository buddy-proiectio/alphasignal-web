import React from "react";
import { notFound } from "next/navigation";
import { fetchSignalMarkdown } from "../../../../../src/services/github";
import { compileMDX } from "next-mdx-remote/rsc";

interface SignalFrontmatter {
  title?: string;
  date?: string;
}

interface PageProps {
  params: Promise<{
    lang: string;
    type: string;
    date: string;
  }>;
}

export default async function SignalDetailPage({ params }: PageProps) {
  const { lang, type, date } = await params;

  let rawMarkdown: string;
  try {
    rawMarkdown = await fetchSignalMarkdown(lang, type, date);
  } catch (err) {
    console.error(`Failed to fetch signal markdown (${lang}/${type}/${date}):`, err);
    notFound();
  }

  // Parse frontmatter and compile MDX dynamically
  const { content, frontmatter } = await compileMDX<SignalFrontmatter>({
    source: rawMarkdown,
    options: { parseFrontmatter: true }
  });

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "2rem" }}>
      <header style={{ marginBottom: "2rem", borderBottom: "1px solid #eee", paddingBottom: "1rem" }}>
        <h1 style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>
          {frontmatter.title || `${type.toUpperCase()} Signal (${lang.toUpperCase()})`}
        </h1>
        <time style={{ color: "#666" }}>
          {frontmatter.date || date}
        </time>
      </header>
      <article className="prose" style={{ lineHeight: 1.6 }}>
        {content}
      </article>
    </div>
  );
}
