import type { Metadata } from "next";
import "./globals.css";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TooltipProvider } from "@/components/ui/tooltip";

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
        <TooltipProvider>
          <ScrollArea className="h-svh min-w-0 bg-background text-foreground">
            {children}
          </ScrollArea>
        </TooltipProvider>
      </body>
    </html>
  );
}
