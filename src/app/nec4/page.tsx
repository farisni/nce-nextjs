"use client";

import { ArticlePage } from "@/components/article-page";

export default function Nec4Page({
  searchParams,
}: {
  searchParams: Promise<{ article?: string | string[] }>;
}) {
  return <ArticlePage defaultLevel="NCE4" searchParams={searchParams} />;
}
