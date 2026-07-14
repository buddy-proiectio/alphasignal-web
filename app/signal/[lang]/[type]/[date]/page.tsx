import React from "react";
import { notFound } from "next/navigation";
import { fetchSignalMarkdown } from "../../../../../src/services/github";
import { compileMDX } from "next-mdx-remote/rsc";
import Sponsorship from "../../../../../src/components/Sponsorship";
import Adsense from "../../../../../src/components/Adsense";

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

  if (lang !== "ko" && lang !== "en") {
    notFound();
  }
  if (type !== "alpha" && type !== "premarket") {
    notFound();
  }
  if (!/^\d{8}$/.test(date)) {
    notFound();
  }

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
    <div className="container" style={{ maxWidth: 800 }}>
      <header style={{ marginBottom: "2rem", borderBottom: "1px solid hsl(var(--border))", paddingBottom: "1.5rem" }}>
        <div style={{ marginBottom: "1rem" }}>
          <span className="badge badge-premium">
            {type.toUpperCase()} SIGNAL ({lang.toUpperCase()})
          </span>
        </div>
        <h1 style={{ fontSize: "2.5rem", fontWeight: 800, marginBottom: "0.5rem", color: "hsl(var(--foreground))" }}>
          {frontmatter.title || `${type.toUpperCase()} Signal (${lang.toUpperCase()})`}
        </h1>
        <time style={{ color: "hsl(var(--muted))", fontSize: "0.9rem" }}>
          {frontmatter.date || date}
        </time>
      </header>

      <article className="prose" style={{ minHeight: "200px" }}>
        {content}
      </article>

      {/* Adsense Integration */}
      <Adsense slot="7890123456" />

      {/* Sponsorship Widget below article renderer */}
      <Sponsorship />
    </div>
  );
}
