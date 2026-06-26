"use client";

import { Suspense, type ReactNode } from "react";

import { AppSidebar } from "@/components/app-sidebar";

export function LearningLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-svh bg-background">
      <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-6 px-5 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-12">
          <Suspense fallback={null}>
            <AppSidebar />
          </Suspense>
          {children}
        </div>
      </div>
    </main>
  );
}