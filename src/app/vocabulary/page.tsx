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
import { vocabWords, type VocabWord } from "@/app/mock/vocabulary";


export default function VocabularyPage() {
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  
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
        <div className="mb-6">
          <h1 className="text-2xl font-bold">自然地理</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {vocabWords.length} words
          </p>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead className="w-16">Vol</TableHead>
              <TableHead className="w-44">词</TableHead>
              <TableHead className="w-60">词义</TableHead>
              <TableHead>例句</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vocabWords.map((word, index) => {
              const isExpanded = expandedIds.has(word.id);
                            return (
                <Fragment key={word.id}>
                  <TableRow
                    className="cursor-pointer select-none"
                    style={{ borderLeft: `4px solid var(--vocab-color-${word.colorIndex})` }}
                    onClick={() => toggle(word.id)}
                  >
                    <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                    <TableCell />
                    <TableCell className="font-medium">{word.word}</TableCell>
                    <TableCell>
                      <span className="text-muted-foreground">{word.partOfSpeech}</span>{" "}
                      {word.chinese}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{word.example}</TableCell>
                  </TableRow>
                  {isExpanded && word.phoneticSymbol && (
                    <TableRow>
                      <TableCell colSpan={5} className="bg-muted/30 py-3">
                        <div className="flex flex-col gap-2 pl-20">
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-muted-foreground">/{word.phoneticSymbol}/</span>
                          </div>
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
