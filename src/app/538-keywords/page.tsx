"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LearningLayout } from "@/components/learning-layout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { keywordCategories, type Keyword } from "@/app/mock/ielts-538-vocabulary";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { GooeyInput } from "@/components/ui/gooey-input";
import { cn } from "@/lib/utils";
import { Ellipsis } from "lucide-react";

const INDEX_COLUMN_CLASS = "sticky left-0 z-30 w-14 bg-background pl-3 group-hover:bg-muted";
const WORD_COLUMN_CLASS = "sticky left-14 z-30 w-36 bg-background group-hover:bg-muted";
const MEANING_COLUMN_CLASS = "sticky left-[200px] z-30 w-72 bg-background group-hover:bg-muted";
const INDEX_HEADER_CLASS = "sticky left-0 z-40 w-14 bg-background";
const WORD_HEADER_CLASS = "sticky left-14 z-40 w-36 bg-background";
const MEANING_HEADER_CLASS = "sticky left-[200px] z-40 w-72 bg-background";
const CONTENT_HEADER_CLASS = "bg-background text-transparent";
const EXPAND_COLUMN_CLASS = "sticky right-0 z-30 w-12 bg-background text-center group-hover:bg-muted";
const EXPAND_HEADER_CLASS = "sticky right-0 z-40 w-12 bg-background";
const TABLE_SHELL_CLASS = "relative max-w-[940px]";
const TABLE_CONTAINER_CLASS = "isolate max-w-[940px] overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] after:pointer-events-none after:absolute after:inset-y-0 after:left-0 after:z-20 after:w-[488px] after:bg-background after:content-[''] [&::-webkit-scrollbar]:hidden";
const FIXED_CONTENT_HEADER_CLASS = "pointer-events-none absolute left-[488px] right-12 top-0 z-50 flex h-10 items-center border-b border-border/70 bg-background px-2 text-sm font-medium text-foreground";

function normalizeSearchText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function isFuzzyWordMatch(word: string, query: string) {
  const target = normalizeSearchText(word);
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) {
    return true;
  }

  if (target.includes(normalizedQuery)) {
    return true;
  }

  let queryIndex = 0;

  for (const char of target) {
    if (char === normalizedQuery[queryIndex]) {
      queryIndex += 1;
    }

    if (queryIndex === normalizedQuery.length) {
      return true;
    }
  }

  return false;
}

function useIsTruncated() {
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

  return { ref, isTruncated };
}

function WordCell({ word, className }: { word: Keyword; className?: string }) {
  const { ref, isTruncated } = useIsTruncated();
  const wordParts = word.word.split("/");
  const hasWordSeparator = wordParts.length > 1;

  const content = (
    <div ref={ref} className={cn("max-w-full", hasWordSeparator ? "flex flex-col leading-snug" : "truncate")}>
      {hasWordSeparator
        ? wordParts.map((part, index) => (
          <span key={`${word.word}-${part}-${index}`} className="truncate">
            {part}
          </span>
        ))
        : word.word}
    </div>
  );

  if (!isTruncated) {
    return <TableCell className={className}>{content}</TableCell>;
  }

  return (
    <TableCell className={className}>
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="text-sm">{word.word}</p>
        </TooltipContent>
      </Tooltip>
    </TableCell>
  );
}

function MeaningCell({ word, className }: { word: Keyword; className?: string }) {
  const { ref, isTruncated } = useIsTruncated();

  const content = (
    <div ref={ref} className="max-w-full truncate">
      {word.pos ? (
        <>
          <span className="text-muted-foreground">{word.pos}</span>{" "}
        </>
      ) : null}
      {word.meaning}
    </div>
  );

  if (!isTruncated) {
    return <TableCell className={className}>{content}</TableCell>;
  }

  return (
    <TableCell className={className}>
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="text-sm">{word.meaning}</p>
        </TooltipContent>
      </Tooltip>
    </TableCell>
  );
}

function ExpandButton({ isExpanded, onClick }: { isExpanded: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={isExpanded ? "Collapse row" : "Expand row"}
      aria-expanded={isExpanded}
      onClick={onClick}
      className="grid size-5 shrink-0 cursor-pointer place-items-center rounded text-muted-foreground transition-colors hover:bg-background/80 hover:text-foreground"
    >
      <Ellipsis className={cn("size-3.5 transition-colors", isExpanded && "text-foreground")} />
    </button>
  );
}

function ExpandedKeywordDetails({ word }: { word: Keyword }) {
  return (
    <div className="grid gap-3 py-2 text-sm sm:grid-cols-[160px_minmax(0,1fr)]">
      <div>
        <p className="text-xs font-medium text-muted-foreground">Word</p>
        <p className="mt-1 text-[15px] font-medium text-foreground">{word.word}</p>
      </div>
      <div>
        <p className="text-xs font-medium text-muted-foreground">Meaning</p>
        <p className="mt-1 text-foreground">
          {word.pos ? <span className="text-muted-foreground">{word.pos} </span> : null}
          {word.meaning}
        </p>
      </div>
      <div className="sm:col-span-2">
        <p className="text-xs font-medium text-muted-foreground">Synonyms</p>
        <p className="mt-1 whitespace-normal leading-6 text-muted-foreground">{word.synonyms}</p>
      </div>
      {word.notes ? (
        <div className="sm:col-span-2">
          <p className="text-xs font-medium text-muted-foreground">Notes</p>
          <p className="mt-1 whitespace-normal leading-6 text-muted-foreground">{word.notes}</p>
        </div>
      ) : null}
    </div>
  );
}

export default function KeywordsPage() {
  const [category, setCategory] = useState(keywordCategories[0]?.title ?? "");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedWordKey, setExpandedWordKey] = useState<string | null>(null);

  const currentCat = keywordCategories.find((c) => c.title === category);
  const isSearching = searchQuery.trim().length > 0;
  const categoryWords = useMemo(() => currentCat?.words ?? [], [currentCat]);
  const allWords = useMemo(() => keywordCategories.flatMap((cat) => cat.words), []);
  const words = isSearching ? allWords : categoryWords;
  const filteredWords = useMemo(
    () => words.filter((word) => isFuzzyWordMatch(word.word, searchQuery)),
    [words, searchQuery],
  );
  const wordCountText = isSearching
    ? `${filteredWords.length} / ${words.length} words`
    : `${words.length} words`;

  return (
    <LearningLayout>
      <section className="min-w-0 flex-[7]">
        <div className="mb-6 flex items-center gap-3">
          <h1 className="text-2xl font-bold">538 考点词</h1>
          <GooeyInput value={searchQuery} onValueChange={setSearchQuery} placeholder="Search..." collapsedWidth={130} expandedWidth={180} classNames={{ trigger: "h-9 text-xs", filterWrap: "h-9", buttonRow: "h-9", bubble: "size-9", bubbleSurface: "size-9 [&>svg]:size-3.5" }} />
        </div>

        <div className="mb-4 flex max-w-[940px] flex-wrap items-center gap-3">
          <p className="text-sm text-muted-foreground">
            {!isSearching && currentCat?.description ? `${currentCat.description} · ` : null}
            {wordCountText}
          </p>
          <div className="ml-auto flex flex-wrap justify-end gap-2">
            {keywordCategories.map((cat) => (
              <Badge
                key={cat.title}
                color={category === cat.title ? "blue" : "gray"}
                variant="dot"
                size="lg"
                className="cursor-pointer py-2"
                onClick={() => setCategory(cat.title)}
              >
                {cat.title}
              </Badge>
            ))}
          </div>
        </div>

        <div className={TABLE_SHELL_CLASS}>
          <div aria-hidden="true" className={FIXED_CONTENT_HEADER_CLASS}>Synonyms</div>
          <Table containerClassName={TABLE_CONTAINER_CLASS} className="min-w-[1248px] table-fixed border-separate border-spacing-0 [&_td]:border-b [&_td]:border-border/70 [&_th]:border-b [&_th]:border-border/70 [&_tr:last-child_td]:border-b-0">
          <colgroup>
            <col style={{ width: 56 }} />
            <col style={{ width: 144 }} />
            <col style={{ width: 288 }} />
            <col style={{ width: 712 }} />
            <col style={{ width: 48 }} />
          </colgroup>
          <TableHeader>
            <TableRow>
              <TableHead className={INDEX_HEADER_CLASS}>#</TableHead>
              <TableHead className={WORD_HEADER_CLASS}>Word</TableHead>
              <TableHead className={MEANING_HEADER_CLASS}>Meaning</TableHead>
              <TableHead className={CONTENT_HEADER_CLASS}>Synonyms</TableHead>
              <TableHead className={EXPAND_HEADER_CLASS} />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredWords.map((word, index) => {
              const wordKey = `${word.word}-${index}`;
              const isExpanded = expandedWordKey === wordKey;

              return (
              <Fragment key={wordKey}>
              <TableRow
                className="group transition-none hover:!bg-transparent"
                onDoubleClick={() => setExpandedWordKey(isExpanded ? null : wordKey)}
              >
                <TableCell className={cn(INDEX_COLUMN_CLASS, "text-muted-foreground")}>
                  {index + 1}
                </TableCell>
                <WordCell word={word} className={cn(WORD_COLUMN_CLASS, "text-[17px] font-medium")} />
                <MeaningCell word={word} className={MEANING_COLUMN_CLASS} />
                <TableCell className="relative z-0 overflow-hidden bg-background text-muted-foreground group-hover:bg-muted">
                  <div className="max-w-full truncate">
                    {word.synonyms}
                    {word.notes ? (
                      <span className="ml-2 text-xs italic">{word.notes}</span>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell className={EXPAND_COLUMN_CLASS}>
                  <div className="flex justify-center">
                    <ExpandButton
                      isExpanded={isExpanded}
                      onClick={() => setExpandedWordKey(isExpanded ? null : wordKey)}
                    />
                  </div>
                </TableCell>
              </TableRow>
              {isExpanded ? (
                <TableRow className="group transition-none hover:!bg-transparent">
                  <TableCell className={cn(INDEX_COLUMN_CLASS, "bg-muted/40 group-hover:bg-muted/40")} />
                  <TableCell className={cn(WORD_COLUMN_CLASS, "bg-muted/40 group-hover:bg-muted/40")} />
                  <TableCell className={cn(MEANING_COLUMN_CLASS, "bg-muted/40 group-hover:bg-muted/40")} />
                  <TableCell className="relative z-0 whitespace-normal bg-muted/40 text-foreground">
                    <ExpandedKeywordDetails word={word} />
                  </TableCell>
                  <TableCell className={cn(EXPAND_COLUMN_CLASS, "bg-muted/40 group-hover:bg-muted/40")} />
                </TableRow>
              ) : null}
              </Fragment>
              );
            })}
          </TableBody>
          </Table>
        </div>
      </section>
    </LearningLayout>
  );
}
