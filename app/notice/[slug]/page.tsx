import React from "react";
import fs from "fs/promises";
import path from "path";
import { notFound } from "next/navigation";
import { compileMDX } from "next-mdx-remote/rsc";
import Header from "../../../src/components/Header";

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
    <>
      <Header />
      <main className="max-w-[768px] mx-auto px-6 py-10">
        <header className="mb-10 pb-8 border-b border-slate-200 dark:border-slate-700">
          <div className="mb-4">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
              Notice
            </span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-3 leading-tight">
            {frontmatter.title || slug}
          </h1>
          {(() => {
            const formattedDate = formatNoticeDate(frontmatter.date);
            return formattedDate ? (
              <time className="text-slate-500 dark:text-slate-400 text-sm">
                {formattedDate}
              </time>
            ) : null;
          })()}
        </header>

        <article className="prose min-h-[200px]">{content}</article>
      </main>
    </>
  );
}
