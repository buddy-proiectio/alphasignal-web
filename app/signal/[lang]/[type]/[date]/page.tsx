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

  const VALID_LANGS = ["ko", "en"] as const;
  const VALID_TYPES = ["alpha", "premarket"] as const;

  const isValidLang = VALID_LANGS.includes(
    lang as (typeof VALID_LANGS)[number],
  );
  const isValidType = VALID_TYPES.includes(
    type as (typeof VALID_TYPES)[number],
  );
  const isValidDate = /^\d{8}$/.test(date);

  if (!isValidLang || !isValidType || !isValidDate) {
    notFound();
  }

  let rawMarkdown: string;
  try {
    rawMarkdown = await fetchSignalMarkdown(lang, type, date);
  } catch (err) {
    console.error(
      `Failed to fetch signal markdown (${lang}/${type}/${date}):`,
      err,
    );
    notFound();
  }

  const { content, frontmatter } = await compileMDX<SignalFrontmatter>({
    source: rawMarkdown,
    options: { parseFrontmatter: true },
  });

  return (
    <div className="max-w-content mx-auto px-4 py-8">
      <header className="mb-8 pb-6 border-b border-slate-200 dark:border-slate-700">
        <div className="mb-4">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
            {type.toUpperCase()} SIGNAL ({lang.toUpperCase()})
          </span>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-2">
          {frontmatter.title ||
            `${type.toUpperCase()} Signal (${lang.toUpperCase()})`}
        </h1>
        <time className="text-slate-500 dark:text-slate-400 text-sm">
          {frontmatter.date || date}
        </time>
      </header>

      <article className="prose min-h-[200px]">{content}</article>

      <Adsense slot="7890123456" />
      <Sponsorship />
    </div>
  );
}
