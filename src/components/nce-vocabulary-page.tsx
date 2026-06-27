"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronsUpDown, Ellipsis, Search, Shuffle } from "lucide-react";

import { type Article, type VocabItem } from "@/app/mock";
import { LearningLayout } from "@/components/learning-layout";
import { InputGroup, InputField } from "@/components/ui/input-group";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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


interface SimilarRef {
  word: string;
  meaning?: string;
  reason?: string;
  file?: string;
  pronunciation?: string;
  phrase?: string;
}

interface RootRef {
  word: string;
  meaning: string;
  file: string;
  line: number;
  root_form: string;
}

function flattenSimilar(
  items: SimilarRef[] | Record<string, SimilarRef[]> | undefined,
): SimilarRef[] {
  if (!items) return [];
  if (Array.isArray(items)) return items;
  return Object.values(items).flat();
}

function flattenRoots(rootAffix: { roots?: Record<string, RootRef[]> } | undefined): SimilarRef[] {
  if (!rootAffix?.roots) return [];
  return Object.values(rootAffix.roots).flat().map((r) => ({
    word: r.word,
    meaning: r.meaning,
    reason: r.root_form,
  }));
}

function SimilarCard({ title, items, color, max = 8 }: { title: string; items: SimilarRef[]; color?: string; max?: number }) {
  if (items.length === 0) return null;
  return (
    <div className="rounded-md bg-background/70 p-3">
      <p className="mb-2 text-xs font-medium text-muted-foreground">{title}</p>
      <div className="flex flex-wrap gap-1">
        {items.slice(0, max).map((item, i) => (
          <span
            key={`${item.word}-${i}`}
            className="inline-flex items-center rounded-md border border-border/50 bg-background px-1.5 py-0.5 text-xs leading-tight text-foreground/80"
            title={item.reason ?? item.meaning ?? ""}
          >
            {item.word}
            {item.meaning ? <span className="ml-0.5 text-muted-foreground">{item.meaning}</span> : null}
          </span>
        ))}
      </div>
    </div>
  );
}

/* Similar words grid */
function SimilarWordsGrid({ sim }: { sim: Record<string, unknown> | undefined }) {
  if (!sim) return null;

  const spelling = flattenSimilar(sim.spelling as SimilarRef[] | Record<string, SimilarRef[]> | undefined);
  const pron = flattenSimilar(sim.pronunciation as SimilarRef[] | Record<string, SimilarRef[]> | undefined);
  const roots = flattenRoots(sim.root_affix as { roots?: Record<string, RootRef[]> } | undefined);
  const semantic = flattenSimilar(sim.semantic as SimilarRef[] | Record<string, SimilarRef[]> | undefined);
  const coll = flattenSimilar(sim.collocations as SimilarRef[] | Record<string, SimilarRef[]> | undefined);

  const cards = [
    { title: "拼写相似", items: spelling, color: "blue" },
    { title: "发音相似", items: pron, color: "violet" },
    { title: "词根词缀", items: roots, color: "emerald" },
    { title: "语义相关", items: semantic, color: "amber" },
    { title: "常用搭配", items: coll, color: "pink" },
  ].filter((c) => c.items.length > 0);

  if (cards.length === 0) return null;

  return (
    <div className="mt-4 grid grid-cols-3 gap-3">
      {cards.map((card) => (
        <SimilarCard key={card.title} title={card.title} items={card.items} color={card.color} />
      ))}
    </div>
  );
}

/* Similar words sections */
function SimilarWords({ sim, loading }: { sim: Record<string, unknown> | undefined; loading: boolean }) {
  if (loading) {
    return <div className="mt-4 text-xs text-muted-foreground animate-pulse">Loading similar words…</div>;
  }
  return <SimilarWordsGrid sim={sim} />;
}

function ExpandedDetails({ word }: { word: NceVocabularyWord }) {
  const [similarData, setSimilarData] = useState<Record<string, unknown> | null>(null);
  const [similarLoading, setSimilarLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setSimilarLoading(true);
    setSimilarData(null);
    fetch(`/api/similar-words?word=${encodeURIComponent(word.word)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          setSimilarData(data);
          setSimilarLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setSimilarLoading(false);
      });
    return () => { cancelled = true; };
  }, [word.word]);

  const sim = (similarData as Record<string, unknown> | null)?.similar as Record<string, unknown> | undefined;

  return (
    <div className="max-w-[908px] py-2 text-sm">
      {/* Sentences */}
      {word.sourceSentences.length ? (
        <div>
          <p className="text-xs font-medium text-muted-foreground">Sentences</p>
          <div className="mt-2 flex flex-col gap-2">
            {word.sourceSentences.slice(0, 1).map((sentence, index) => (
              <div key={`${word.id}-sentence-${index}`} className="rounded-md bg-background/70 p-3">
                <p className="text-base leading-7 text-foreground">{renderHighlightedSentence(sentence.text, word.word)}</p>
                <p className="mt-1 leading-6 text-muted-foreground">{sentence.translation}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Similar words sections */}
      <SimilarWords sim={sim} loading={similarLoading} />
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
        <div className="mb-6 flex items-center gap-2">
          <h1 className="text-2xl font-bold">{title}</h1>
          <InputGroup className="w-44">
            <InputField
              label=""
              placeholder="Search..."
              icon={Search}
              value={searchQuery}
              onChange={(value) => {
                setSearchQuery(value);
                setExpandedWordId(null);
              }}
              index={0}
              className="[&_input]:text-xs [&_svg]:size-3.5 [&>div]:py-1.5 [&>div]:px-2.5"
            />
          </InputGroup>
        </div>

        <div className="mb-4 flex max-w-[940px] flex-wrap items-center gap-3">
          <p className="text-sm text-muted-foreground">{wordCountText}</p>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const sorted = Object.values(articles).sort((a, b) => a.lesson - b.lesson);
                setSelectedArticleId(sorted[Math.floor(Math.random() * sorted.length)]?.id ?? ALL_LESSONS_VALUE);
                setExpandedWordId(null);
              }}
              className="grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              title="随机课文"
            >
              <Shuffle className="size-4" />
            </button>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-[220px] justify-between"
                >
                  <span className="truncate">{selectedArticleLabel}</span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[220px] p-0">
                <Command>
                  <CommandList>
                    <CommandEmpty>未找到</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="全部课文"
                        onSelect={() => {
                          setSelectedArticleId(ALL_LESSONS_VALUE);
                          setExpandedWordId(null);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedArticleId === ALL_LESSONS_VALUE ? "opacity-100" : "opacity-0"
                          )}
                        />
                        全部课文
                      </CommandItem>
                      {articleOptions.map((article) => (
                        <CommandItem
                          key={article.id}
                          value={`L${article.lesson} ${article.title}`}
                          onSelect={() => {
                            setSelectedArticleId(article.id);
                            setExpandedWordId(null);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedArticleId === article.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {`L${article.lesson} ${article.title}`}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className={TABLE_SHELL_CLASS}>
          <div aria-hidden="true" className={FIXED_CONTENT_HEADER_CLASS}>Lesson</div>
          <Table containerClassName={cn(TABLE_CONTAINER_CLASS, expandedWordId && "overflow-x-hidden")} className="min-w-[1248px] table-fixed border-separate border-spacing-0 [&_td]:border-b [&_td]:border-border/70 [&_th]:border-b [&_th]:border-border/70 [&_tr:last-child_td]:border-b-0">
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
                      <TableCell colSpan={5} className="relative z-50 whitespace-normal bg-muted/40 px-4 py-3 text-foreground">
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
