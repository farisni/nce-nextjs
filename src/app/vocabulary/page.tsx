"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { vocabChapters, type VocabWord } from "@/app/mock/vocabulary";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

function MeaningCell({ word }: { word: VocabWord }) {
  const ref = useRef<HTMLDivElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  const check = useCallback(() => {
    if (ref.current) {
      setIsTruncated(ref.current.scrollWidth > ref.current.clientWidth);
    }
  }, []);

  useEffect(() => {
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [check]);

  const content = (
    <div ref={ref} className="truncate max-w-full">
      <span className="text-muted-foreground">
        {word.partOfSpeech}
      </span>{" "}
      {word.chinese}
    </div>
  );

  if (!isTruncated) return content;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <p className="text-sm">{word.chinese}</p>
      </TooltipContent>
    </Tooltip>
  );
}

export default function VocabularyPage() {
  const [chapter, setChapter] = useState(vocabChapters[0]?.title ?? "");

  const currentChapter = vocabChapters.find((c) => c.title === chapter);
  const words: VocabWord[] = currentChapter
    ? currentChapter.groups.flat()
    : vocabChapters.flatMap((c) => c.groups.flat());

  return (
    <main className="min-h-svh px-6 py-10">
      <section className="mx-auto w-full max-w-4xl">
        <h1 className="mb-6 text-2xl font-bold">雅思词汇真经</h1>

        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {words.length} words
          </p>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="w-[220px] justify-between"
              >
                {chapter || "选择章节..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[220px] p-0">
              <Command>
                <CommandInput placeholder="搜索章节..." />
                <CommandList>
                  <CommandEmpty>未找到</CommandEmpty>
                  <CommandGroup>
                    {vocabChapters.map((ch) => (
                      <CommandItem
                        key={ch.title}
                        value={ch.title}
                        onSelect={() => setChapter(ch.title)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            chapter === ch.title ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {ch.title}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <Table className="table-fixed [&_tr]:border-b-[0.5px]">
          <colgroup>
            <col style={{ width: 20 }} />
            <col style={{ width: 70 }} />
            <col style={{ width: 110 }} />
            <col style={{ width: 120 }} />
          </colgroup>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Word</TableHead>
              <TableHead>Meaning</TableHead>
              <TableHead>Example</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {words.map((word, index) => (
              <TableRow
                key={word.id}
                style={{
                  borderLeft: `4px solid var(--vocab-color-${word.colorIndex})`,
                }}
              >
                <TableCell className="text-muted-foreground">
                  {index + 1}
                </TableCell>
                <TableCell className="font-medium">{word.word}</TableCell>
                <MeaningCell word={word} />
                <TableCell className="text-muted-foreground">
                  {word.example}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
    </main>
  );
}
