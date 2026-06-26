"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronsUpDown, Ellipsis } from "lucide-react";

import { type Article, type VocabItem } from "@/app/mock";
import { LearningLayout } from "@/components/learning-layout";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { GooeyInput } from "@/components/ui/gooey-input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

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
const ALL_LESSONS_VALUE = "all";

type NceVocabularyWord = VocabItem & {
  id: string;
  articleId: string;
  articleTitle: string;
  articleTitleCn?: string;
  lesson: number;
  sourceSentences: Array<Pick<Article["original"]["paragraphs"][number][number], "text" | "translation">>;
};

type NceVocabularyPageProps = {
  articles: Record<string, Article>;
  title: string;
};

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

function getWordTermParts(word: string) {
  const withoutParentheses = word.replace(/\([^)]*\)/g, " ");
  const parentheticalTerms = Array.from(word.matchAll(/\(([^)]*)\)/g), (match) => match[1]);

  return [withoutParentheses, ...parentheticalTerms]
    .flatMap((part) => part.split(/[\/;,]+|\s+-\s+/))
    .map((part) => part.trim())
    .filter((part) => normalizeSearchText(part).length > 2);
}

function getWordSearchTerms(word: string) {
  return getWordTermParts(word).map((part) => normalizeSearchText(part));
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function renderHighlightedSentence(text: string, word: string) {
  const highlightTerms = getWordTermParts(word)
    .sort((a, b) => b.length - a.length);

  if (!highlightTerms.length) {
    return text;
  }

  const normalizedHighlightTerms = highlightTerms.map((term) => normalizeSearchText(term));
  const highlightPattern = new RegExp(`(${highlightTerms.map(escapeRegExp).join("|")})`, "gi");

  return text.split(highlightPattern).map((part, index) => {
    if (!part) {
      return null;
    }

    const isHighlighted = normalizedHighlightTerms.includes(normalizeSearchText(part));

    if (!isHighlighted) {
      return <Fragment key={`${word}-text-${index}`}>{part}</Fragment>;
    }

    return (
      <span
        key={`${word}-highlight-${index}`}
        className="mx-0.5 rounded-[2px] bg-[linear-gradient(to_top,rgba(251,243,219,0.95)_48%,transparent_48%)] px-1 py-0.5 text-[1.18em] font-semibold text-foreground"
      >
        {part}
      </span>
    );
  });
}

function getSourceSentences(article: Article, word: string) {
  const searchTerms = getWordSearchTerms(word);

  if (!searchTerms.length) {
    return [];
  }

  return article.original.paragraphs
    .flat()
    .filter((sentence) => {
      const normalizedSentence = normalizeSearchText(sentence.text);

      return searchTerms.some((term) => normalizedSentence.includes(term));
    })
    .map(({ text, translation }) => ({ text, translation }));
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

function WordCell({ word, className }: { word: NceVocabularyWord; className?: string }) {
  const { ref, isTruncated } = useIsTruncated();

  const content = (
    <div ref={ref} className="max-w-full truncate">
      {word.word}
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

function MeaningCell({ word, className }: { word: NceVocabularyWord; className?: string }) {
  const { ref, isTruncated } = useIsTruncated();

  const content = (
    <div ref={ref} className="max-w-full truncate">
      {word.pos ? <span className="text-muted-foreground">{word.pos} </span> : null}
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

function ExpandedDetails({ word }: { word: NceVocabularyWord }) {
  return (
    <div className="max-w-[908px] py-2 text-sm">
      {word.sourceSentences.length ? (
        <div>
          <p className="text-xs font-medium text-muted-foreground">Sentences</p>
          <div className="mt-2 flex flex-col gap-2">
            {word.sourceSentences.map((sentence, index) => (
              <div key={`${word.id}-sentence-${index}`} className="rounded-md bg-background/70 p-3">
                <p className="text-base leading-7 text-foreground">{renderHighlightedSentence(sentence.text, word.word)}</p>
                <p className="mt-1 leading-6 text-muted-foreground">{sentence.translation}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function NceVocabularyPage({ articles, title }: NceVocabularyPageProps) {
  const articleOptions = useMemo(
    () => Object.values(articles).sort((a, b) => a.lesson - b.lesson),
    [articles],
  );
  const [isLessonSelectOpen, setIsLessonSelectOpen] = useState(false);
  const [selectedArticleId, setSelectedArticleId] = useState(
    articleOptions[0]?.id ?? ALL_LESSONS_VALUE,
  );
  const [lessonQuery, setLessonQuery] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedWordId, setExpandedWordId] = useState<string | null>(null);

  const selectedArticle = articleOptions.find((article) => article.id === selectedArticleId);
  const selectedArticleLabel = selectedArticle
    ? `L${selectedArticle.lesson} ${selectedArticle.title}`
    : "全部课文";
  const visibleArticleOptions = useMemo(() => {
    const normalizedQuery = lessonQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return articleOptions.slice(0, 10);
    }

    return articleOptions.filter((article) =>
      `l${article.lesson} ${article.title} ${article.titleCn ?? ""}`
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [articleOptions, lessonQuery]);
  const words = useMemo<NceVocabularyWord[]>(
    () => articleOptions.flatMap((article) => article.vocabulary.map((word, index) => ({
      ...word,
      id: `${article.id}-${index}-${word.word}`,
      articleId: article.id,
      articleTitle: article.title,
      articleTitleCn: article.titleCn,
      lesson: article.lesson,
      sourceSentences: getSourceSentences(article, word.word),
    }))),
    [articleOptions],
  );
  const selectedWords = useMemo(
    () => selectedArticleId === ALL_LESSONS_VALUE
      ? words
      : words.filter((word) => word.articleId === selectedArticleId),
    [selectedArticleId, words],
  );
  const filteredWords = useMemo(
    () => selectedWords.filter((word) => isFuzzyWordMatch(word.word, searchQuery)),
    [selectedWords, searchQuery],
  );
  const wordCountText = searchQuery.trim()
    ? `${filteredWords.length} / ${selectedWords.length} words`
    : `${selectedWords.length} words`;

  return (
    <LearningLayout>
      <section className="min-w-0 flex-[7]">
        <div className="mb-6 flex items-center gap-3">
          <h1 className="text-2xl font-bold">{title}</h1>
          <GooeyInput
            value={searchQuery}
            onValueChange={(value) => {
              setSearchQuery(value);
              setExpandedWordId(null);
            }}
            placeholder="Search..."
            collapsedWidth={115}
            expandedWidth={160}
            classNames={{ trigger: "h-8 text-xs", filterWrap: "h-8", buttonRow: "h-8", bubble: "size-8", bubbleSurface: "size-8 [&>svg]:size-3.5" }}
          />
        </div>

        <div className="mb-4 flex max-w-[940px] flex-wrap items-center gap-3">
          <p className="text-sm text-muted-foreground">{wordCountText}</p>
          <Popover
            open={isLessonSelectOpen}
            onOpenChange={(open) => {
              setIsLessonSelectOpen(open);

              if (!open) {
                setLessonQuery("");
              }
            }}
          >
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={isLessonSelectOpen}
                className="ml-auto w-[240px] justify-between"
              >
                <span className="truncate">{selectedArticleLabel}</span>
                <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[240px] p-0">
              <Command>
                {articleOptions.length > 10 ? (
                  <CommandInput
                    value={lessonQuery}
                    onValueChange={setLessonQuery}
                    placeholder="搜索课文..."
                  />
                ) : null}
                <CommandList className="max-h-[330px]">
                  <CommandEmpty>未找到</CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      value="全部课文 all lessons"
                      onSelect={() => {
                        setSelectedArticleId(ALL_LESSONS_VALUE);
                        setExpandedWordId(null);
                        setLessonQuery("");
                        setIsLessonSelectOpen(false);
                      }}
                    >
                      <Check className={cn("mr-2 size-4", selectedArticleId === ALL_LESSONS_VALUE ? "opacity-100" : "opacity-0")} />
                      全部课文
                    </CommandItem>
                    {visibleArticleOptions.map((article) => (
                      <CommandItem
                        key={article.id}
                        value={`L${article.lesson} ${article.title} ${article.titleCn ?? ""}`}
                        onSelect={() => {
                          setSelectedArticleId(article.id);
                          setExpandedWordId(null);
                          setLessonQuery("");
                          setIsLessonSelectOpen(false);
                        }}
                      >
                        <Check className={cn("mr-2 size-4", selectedArticleId === article.id ? "opacity-100" : "opacity-0")} />
                        L{article.lesson} {article.title}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <div className={TABLE_SHELL_CLASS}>
          <div aria-hidden="true" className={FIXED_CONTENT_HEADER_CLASS}>Lesson</div>
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
              <TableHead className={CONTENT_HEADER_CLASS}>Lesson</TableHead>
              <TableHead className={EXPAND_HEADER_CLASS} />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredWords.map((word, index) => {
              const isExpanded = expandedWordId === word.id;

              return (
                <Fragment key={word.id}>
                  <TableRow
                    className="group transition-none hover:!bg-transparent"
                    onDoubleClick={() => setExpandedWordId(isExpanded ? null : word.id)}
                  >
                    <TableCell className={cn(INDEX_COLUMN_CLASS, "text-muted-foreground")}>{index + 1}</TableCell>
                    <WordCell word={word} className={cn(WORD_COLUMN_CLASS, "text-[17px] font-medium")} />
                    <MeaningCell word={word} className={MEANING_COLUMN_CLASS} />
                    <TableCell className="relative z-0 overflow-hidden bg-background text-muted-foreground group-hover:bg-muted">
                      <div className="max-w-full truncate">
                        L{word.lesson} {word.articleTitle}
                      </div>
                    </TableCell>
                    <TableCell className={EXPAND_COLUMN_CLASS}>
                      <div className="flex justify-center">
                        <ExpandButton
                          isExpanded={isExpanded}
                          onClick={() => setExpandedWordId(isExpanded ? null : word.id)}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                  {isExpanded ? (
                    <TableRow className="group transition-none hover:!bg-transparent">
                      <TableCell colSpan={5} className="relative z-30 whitespace-normal bg-muted/40 px-4 py-3 text-foreground">
                        <ExpandedDetails word={word} />
                      </TableCell>
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
