"use client";

import { useState, Fragment } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { vocabChapters, type VocabWord } from "@/app/mock/vocabulary";

export default function VocabularyPage() {
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [chapter, setChapter] = useState(vocabChapters[0]?.title ?? "");

  const currentChapter = vocabChapters.find((c) => c.title === chapter);
  const words: VocabWord[] = currentChapter
    ? currentChapter.groups.flat()
    : vocabChapters.flatMap((c) => c.groups.flat());

  const toggle = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <main className="min-h-svh px-6 py-10">
      <section className="mx-auto w-full max-w-5xl">
        <h1 className="mb-6 text-2xl font-bold">IELTS Vocabulary</h1>

        <Tabs value={chapter} onValueChange={setChapter} className="mb-6">
          <TabsList className="h-auto flex-wrap gap-1 bg-transparent p-0">
            {vocabChapters.map((ch) => (
              <TabsTrigger
                key={ch.title}
                value={ch.title}
                className="rounded-md px-3 py-1.5 text-xs data-[state=active]:bg-muted"
              >
                {ch.title}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <p className="mb-4 text-sm text-muted-foreground">
          {words.length} words
        </p>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead className="w-48">Word</TableHead>
              <TableHead className="w-56">Meaning</TableHead>
              <TableHead>Example</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {words.map((word, index) => {
              const isExpanded = expandedIds.has(word.id);
              return (
                <Fragment key={word.id}>
                  <TableRow
                    className="cursor-pointer select-none"
                    style={{
                      borderLeft: `4px solid var(--vocab-color-${word.colorIndex})`,
                    }}
                    onClick={() => toggle(word.id)}
                  >
                    <TableCell className="text-muted-foreground">
                      {index + 1}
                    </TableCell>
                    <TableCell className="font-medium">{word.word}</TableCell>
                    <TableCell>
                      <span className="text-muted-foreground">
                        {word.partOfSpeech}
                      </span>{" "}
                      {word.chinese}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {word.example}
                    </TableCell>
                  </TableRow>
                  {isExpanded && (
                    <TableRow>
                      <TableCell colSpan={4} className="bg-muted/30 py-3">
                        <div className="pl-28 text-sm text-muted-foreground">
                          {word.example}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </section>
    </main>
  );
}
