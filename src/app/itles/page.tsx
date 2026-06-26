"use client";

import { ArticlePage } from "@/components/article-page";

export default function ItlesPage({
  searchParams,
}: {
  searchParams: Promise<{ article?: string | string[] }>;
}) {
  return <ArticlePage defaultLevel="IELTS16" searchParams={searchParams} />;
}
