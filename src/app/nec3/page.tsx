"use client";

import { use } from "react";
import { ArticlePage } from "@/components/article-page";

export default function Nec3Page({
  searchParams,
}: {
  searchParams: Promise<{ article?: string | string[] }>;
}) {
  return <ArticlePage defaultLevel="NCE3" searchParams={searchParams} />;
}
