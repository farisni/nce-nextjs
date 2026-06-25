import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";

import { AppSidebar } from "@/components/app-sidebar";

export const metadata: Metadata = {
  title: "NCE BOOK",
  description: "New Concept English Reading",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full">
        <div className="flex h-svh flex-col overflow-hidden bg-background text-foreground md:flex-row">
          <Suspense fallback={null}>
            <AppSidebar />
          </Suspense>
          <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
        </div>
      </body>
    </html>
  );
}
