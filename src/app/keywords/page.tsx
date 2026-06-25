"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { keywordCategories } from "@/app/mock/keywords";

export default function KeywordsPage() {
  const [category, setCategory] = useState(keywordCategories[0]?.title ?? "");

  const currentCat = keywordCategories.find((c) => c.title === category);
  const words = currentCat?.words ?? [];

  return (
    <main className="min-h-svh px-6 py-10">
      <section className="mx-auto w-full max-w-5xl">
        <h1 className="mb-6 text-2xl font-bold">IELTS 538 Keywords</h1>

        <div className="mb-6 flex flex-wrap gap-1.5">
          {keywordCategories.map((cat) => (
            <Badge
              key={cat.title}
              color={category === cat.title ? "blue" : "gray"}
              variant="dot"
              size="sm"
              className="cursor-pointer"
              onClick={() => setCategory(cat.title)}
            >
              {cat.title}
            </Badge>
          ))}
        </div>

        <p className="mb-4 text-sm text-muted-foreground">
          {currentCat?.description && `${currentCat.description} · `}
          {words.length} words
        </p>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead className="w-40">Word</TableHead>
              <TableHead className="w-16">POS</TableHead>
              <TableHead className="w-44">Meaning</TableHead>
              <TableHead>Synonyms</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {words.map((word, index) => (
              <TableRow key={`${word.word}-${index}`}>
                <TableCell className="text-muted-foreground">
                  {index + 1}
                </TableCell>
                <TableCell className="font-medium">{word.word}</TableCell>
                <TableCell className="text-muted-foreground">
                  {word.pos}
                </TableCell>
                <TableCell>{word.meaning}</TableCell>
                <TableCell className="text-muted-foreground">
                  {word.synonyms}
                  {word.notes ? (
                    <span className="ml-2 text-xs italic">{word.notes}</span>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
    </main>
  );
}
