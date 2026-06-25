"use client";

import Link from "next/link";
import {
  Fragment,
  type CSSProperties,
  type FormEvent,
  type MouseEvent,
  use,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ArrowLeft,
  Bot,
  Copy,
  Eraser,
  Highlighter,
  MoreHorizontal,
  Send,
  Quote,
  Search,
  Share2,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { allArticles, getArticleList, nce2List, nce3List, nce4List, ieltsList, type Article, type ArticleListItem, type GrammarRelatedExample } from "@/app/mock";
import { grammarRelatedExamples } from "@/app/mock/ielts";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GooeyInput } from "@/components/ui/gooey-input";
import { useArticleSettings } from "@/stores/article-settings";
import FlipClock from "@/components/8starlabs-ui/flip-clock";
import { BorderBeam } from "@/components/ui/border-beam";
import { ShineBorder } from "@/components/ui/shine-border";

const LEVEL_ROUTES: Record<string, string> = {
  NCE2: "/nec2",
  NCE3: "/nec3",
  NCE4: "/nec4",
  IELTS16: "/itles",
};

const LEVEL_LABELS: Record<string, string> = {
  NCE2: "NCE2",
  NCE3: "NCE3",
  NCE4: "NCE4",
  IELTS16: "ITLES",
};

const LEVEL_LISTS: Record<string, ArticleListItem[]> = {
  NCE2: nce2List,
  NCE3: nce3List,
  NCE4: nce4List,
  IELTS16: ieltsList,
};

const LEVEL_DEFAULT_ARTICLE: Record<string, string> = {
  NCE2: "nce2-l1",
  NCE3: "nce3-l1",
  NCE4: "nce4-l1",
  IELTS16: "ielts-c1-t1-p1",
};

type GrammarSummaryNote = {
  key: string;
  title: string;
  body: string;
  relatedExamples?: GrammarRelatedExample[];
};

type GrammarSummaryGroup = {
  key: string;
  paragraphIndex: number;
  tone: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  notes: GrammarSummaryNote[];
};

type GrammarSummaryBlockMetric = {
  top: number;
  height: number;
};

type GrammarToneStyle = CSSProperties & {
  "--grammar-mark-color": string;
  "--grammar-title-bg": string;
};

function areGrammarSummaryMetricsEqual(
  currentMetrics: Record<number, GrammarSummaryBlockMetric>,
  nextMetrics: Record<number, GrammarSummaryBlockMetric>,
) {
  const currentKeys = Object.keys(currentMetrics);
  const nextKeys = Object.keys(nextMetrics);

  if (currentKeys.length !== nextKeys.length) {
    return false;
  }

  return nextKeys.every((key) => {
    const currentMetric = currentMetrics[Number(key)];
    const nextMetric = nextMetrics[Number(key)];

    return (
      currentMetric &&
      currentMetric.top === nextMetric.top &&
      currentMetric.height === nextMetric.height
    );
  });
}

const GRAMMAR_TONE_STYLES: Record<GrammarSummaryGroup["tone"], GrammarToneStyle> = {
  1: { "--grammar-mark-color": "var(--tone-1-strong)", "--grammar-title-bg": "var(--tone-1)" },
  2: { "--grammar-mark-color": "var(--tone-2-strong)", "--grammar-title-bg": "var(--tone-2)" },
  3: { "--grammar-mark-color": "var(--tone-3-strong)", "--grammar-title-bg": "var(--tone-3)" },
  4: { "--grammar-mark-color": "var(--tone-4-strong)", "--grammar-title-bg": "var(--tone-4)" },
  5: { "--grammar-mark-color": "var(--tone-5-strong)", "--grammar-title-bg": "var(--tone-5)" },
  6: { "--grammar-mark-color": "var(--tone-6-strong)", "--grammar-title-bg": "var(--tone-6)" },
  7: { "--grammar-mark-color": "var(--tone-7-strong)", "--grammar-title-bg": "var(--tone-7)" },
};

const AI_INPUT_WIDTH = 360;
const AI_INPUT_HEIGHT = 44;
const AI_INPUT_OFFSET = 10;
const SELECTION_OFFSET_EXCLUDED_SELECTOR = "[data-selection-offset-excluded='true']";
const SIDE_TAB_TRIGGER_CLASS_NAME = "h-auto flex-none cursor-pointer rounded-none border-0 border-b-2 border-transparent !bg-transparent px-0 pb-1 shadow-none after:hidden data-[state=active]:border-primary data-[state=active]:!bg-transparent data-[state=active]:shadow-none";
const SIDE_TAB_CONTENT_CLASS_NAME = "mt-0 transition-[opacity,transform] duration-200 ease-out data-[state=inactive]:pointer-events-none data-[state=inactive]:absolute data-[state=inactive]:inset-x-0 data-[state=inactive]:top-0 data-[state=inactive]:translate-y-1 data-[state=inactive]:opacity-0 data-[state=active]:translate-y-0 data-[state=active]:opacity-100";

function buildParagraphStarts(paragraphs: string[]) {
  return paragraphs.reduce<number[]>((starts) => {
    const previousStart = starts.at(-1) ?? 0;
    const previousParagraph = paragraphs[starts.length - 1];

    starts.push(previousParagraph ? previousStart + previousParagraph.length : 0);
    return starts;
  }, []);
}

function getArticleParagraphs(article: Article) {
  return article.original.paragraphs.map((paragraph) =>
    paragraph.map((sentence) => sentence.text).join(" "),
  );
}

function getArticleParagraphTranslations(article: Article) {
  return article.original.paragraphs
    .map((paragraph) =>
      paragraph
        .map((sentence) => sentence.translation)
        .filter(Boolean)
        .join(""),
    );
}

function getRelatedExamplesForGrammar(noteBody: string) {
  if (noteBody.includes("as 引导原因状语")) {
    return grammarRelatedExamples.asReason;
  }

  if (noteBody.includes("as 引导伴随状语")) {
    return grammarRelatedExamples.asAccompanying;
  }

  return [];
}

function getGrammarSummaryGroups(article: Article): GrammarSummaryGroup[] {
  return article.original.paragraphs
    .map((paragraph, paragraphIndex) => ({
      key: `${article.id}-grammar-${paragraphIndex}`,
      paragraphIndex,
      tone: 1 as GrammarSummaryGroup["tone"],
      notes: paragraph.flatMap((sentence, sentenceIndex) =>
        (sentence.structureNotes ?? []).map((note, noteIndex) => ({
          key: `${article.id}-${paragraphIndex}-${sentenceIndex}-${noteIndex}`,
          title: note.title,
          body: note.body,
          relatedExamples: getRelatedExamplesForGrammar(note.body),
        })),
      ),
    }))
    .filter((group) => group.notes.length > 0)
    .map((group, index) => ({
      ...group,
      tone: ((index % 5) + 1) as GrammarSummaryGroup["tone"],
    }));
}

type HighlightRange = {
  start: number;
  end: number;
};

type StoredSelection = HighlightRange & {
  text: string;
};

type ArticleSelectionState = {
  articleId: string;
  selection: StoredSelection;
};

function isSelectionOffsetExcluded(node: Node) {
  const element = node instanceof Element ? node : node.parentElement;

  return Boolean(element?.closest(SELECTION_OFFSET_EXCLUDED_SELECTOR));
}

function getBoundaryOffset(container: HTMLElement, node: Node, nodeOffset: number) {
  let offset = 0;
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
    acceptNode(currentNode) {
      return isSelectionOffsetExcluded(currentNode)
        ? NodeFilter.FILTER_REJECT
        : NodeFilter.FILTER_ACCEPT;
    },
  });
  let current = walker.nextNode();

  while (current) {
    if (current === node) {
      return offset + nodeOffset;
    }

    offset += current.textContent?.length ?? 0;
    current = walker.nextNode();
  }

  return offset;
}

function readSelection(container: HTMLElement | null): StoredSelection | null {
  const selection = window.getSelection();

  if (!container || !selection || selection.rangeCount === 0) {
    return null;
  }

  const range = selection.getRangeAt(0);

  if (range.collapsed || !container.contains(range.commonAncestorContainer)) {
    return null;
  }

  if (
    isSelectionOffsetExcluded(range.startContainer) ||
    isSelectionOffsetExcluded(range.endContainer)
  ) {
    return null;
  }

  const start = getBoundaryOffset(container, range.startContainer, range.startOffset);
  const end = getBoundaryOffset(container, range.endContainer, range.endOffset);
  const text = selection.toString().replace(/\s+/g, " ").trim();

  if (!text || start === end) {
    return null;
  }

  return {
    start: Math.min(start, end),
    end: Math.max(start, end),
    text,
  };
}

function mergeHighlights(highlights: HighlightRange[]) {
  return highlights
    .toSorted((left, right) => left.start - right.start)
    .reduce<HighlightRange[]>((merged, range) => {
      const previous = merged.at(-1);

      if (!previous || range.start > previous.end) {
        merged.push(range);
        return merged;
      }

      previous.end = Math.max(previous.end, range.end);
      return merged;
    }, []);
}

function renderHighlightedText(
  text: string,
  paragraphStart: number,
  highlights: HighlightRange[],
) {
  const paragraphEnd = paragraphStart + text.length;
  const relevantHighlights = highlights.filter(
    (highlight) => highlight.start < paragraphEnd && highlight.end > paragraphStart,
  );

  if (relevantHighlights.length === 0) {
    return text;
  }

  const parts: React.ReactNode[] = [];
  let cursor = 0;

  relevantHighlights.forEach((highlight, index) => {
    const start = Math.max(highlight.start - paragraphStart, 0);
    const end = Math.min(highlight.end - paragraphStart, text.length);

    if (start > cursor) {
      parts.push(
        <Fragment key={`text-${paragraphStart}-${index}`}>
          {text.slice(cursor, start)}
        </Fragment>,
      );
    }

    parts.push(
      <mark
        key={`mark-${paragraphStart}-${index}`}
        className="rounded-sm bg-yellow-200 px-0.5 text-yellow-950"
      >
        {text.slice(start, end)}
      </mark>,
    );

    cursor = end;
  });

  if (cursor < text.length) {
    parts.push(<Fragment key={`text-${paragraphStart}-tail`}>{text.slice(cursor)}</Fragment>);
  }

  return parts;
}

type ArticlePageProps = {
  defaultLevel: string;
  searchParams: Promise<{ article?: string | string[] }>;
};

export function ArticlePage({ defaultLevel, searchParams }: ArticlePageProps) {
  const query = use(searchParams);
  const articleParam = Array.isArray(query.article) ? query.article[0] : query.article;
  const defaultArticleId = LEVEL_DEFAULT_ARTICLE[defaultLevel] ?? Object.keys(LEVEL_LISTS[defaultLevel] ?? {})[0] ?? "nce3-l1";

  if (!articleParam) {
    return <IeltsArticleList defaultLevel={defaultLevel} />;
  }

  const selectedArticleId = articleParam;
  const article = allArticles[selectedArticleId] ?? allArticles[defaultArticleId];

  return <ArticleReader article={article} defaultLevel={defaultLevel} />;
}

function IeltsArticleList({ defaultLevel }: { defaultLevel: string }) {
  const articles = LEVEL_LISTS[defaultLevel] ?? getArticleList(allArticles);
  const levelLabel = LEVEL_LABELS[defaultLevel] ?? "ITLES";

  return (
    <main className="min-h-svh px-6 py-10">
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-3">
        <div className="flex items-center gap-3 pb-1">
          <h1 className="text-3xl font-semibold tracking-normal">{levelLabel}</h1>
          <GooeyInput placeholder="Search..." collapsedWidth={115} expandedWidth={160} classNames={{ trigger: "h-8 text-xs", filterWrap: "h-8", buttonRow: "h-8", bubble: "size-8", bubbleSurface: "size-8 [&>svg]:size-3.5" }} />
        </div>
        <div className="h-px w-4/5 bg-border" />

        <div>
          {articles.map((article, index) => (
            <Fragment key={article.id}>
              {index > 0 && (
                <div className="h-px w-3/5 bg-border" />
              )}
              <Link
                href={`${LEVEL_ROUTES[article.level] ?? "/itles"}?article=${article.id}`}
                className="group flex items-start justify-between gap-5 py-1 transition-colors hover:text-primary"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <h2 className="text-base font-medium text-foreground group-hover:text-primary">
                      {article.title}
                    </h2>
                    <span className="text-xs text-muted-foreground">
                      {article.level} / Lesson {article.lesson}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{article.titleCn}</p>
                  <p className="text-xs text-muted-foreground">
                    {article.paragraphCount} paragraphs / {article.vocabularyCount} words
                  </p>
                </div>
              </Link>
            </Fragment>
          ))}
        </div>
      </section>
    </main>
  );
}

function ArticleReader({ article, defaultLevel }: { article: Article; defaultLevel: string }) {
  const isIelts = article.level === "IELTS16";
  const articleParagraphs = useMemo(() => getArticleParagraphs(article), [article]);
  const paragraphStarts = useMemo(
    () => buildParagraphStarts(articleParagraphs),
    [articleParagraphs],
  );
  const articleParagraphTranslations = useMemo(
    () => getArticleParagraphTranslations(article),
    [article],
  );
  const grammarSummaryGroups = useMemo(
    () => getGrammarSummaryGroups(article),
    [article],
  );
  const articleBodyRef = useRef<HTMLDivElement>(null);
  const paragraphRefs = useRef<Array<HTMLParagraphElement | null>>([]);
  const grammarSummaryRef = useRef<HTMLDivElement>(null);
  const [selectionState, setSelectionState] = useState<ArticleSelectionState | null>(null);
  const highlightsByArticleId = useArticleSettings((s) => s.highlightsByArticleId);
  const addHighlight = useArticleSettings((s) => s.addHighlight);
  const clearHighlights = useArticleSettings((s) => s.clearHighlights);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatPosition, setChatPosition] = useState({ x: 24, y: 24 });
  const [chatContext, setChatContext] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [activeSideTab, setActiveSideTab] = useState<"grammar" | "vocabulary">("grammar");
  const [activeGrammarMoreKey, setActiveGrammarMoreKey] = useState("");
  const [grammarSummaryBlockMetrics, setGrammarSummaryBlockMetrics] = useState<
    Record<number, GrammarSummaryBlockMetric>
  >({});
  const showNotes = useArticleSettings((s) => s.showNotes);
  const setShowNotes = useArticleSettings((s) => s.setShowNotes);
  const citationStyle = useArticleSettings((s) => s.citationStyle);
  const setCitationStyle = useArticleSettings((s) => s.setCitationStyle);
  const [lastAction, setLastAction] = useState("No selection action yet.");

  const hasGrammarSummary = grammarSummaryGroups.length > 0;
  const visibleActiveSideTab = hasGrammarSummary ? activeSideTab : "vocabulary";
  const visibleActiveGrammarMoreKey = grammarSummaryGroups.some((group) =>
    group.notes.some((note) => note.key === activeGrammarMoreKey),
  )
    ? activeGrammarMoreKey
    : "";
  const selection = selectionState?.articleId === article.id ? selectionState.selection : null;
  const highlights = highlightsByArticleId[article.id] ?? [];
  const hasSelection = selection !== null;
  const selectionPreview = hasSelection
    ? selection.text.length > 72
      ? `${selection.text.slice(0, 72)}...`
      : selection.text
    : "No text selected";

  const syncGrammarSummaryLayout = useCallback(() => {
    const summaryElement = grammarSummaryRef.current;

    if (!summaryElement) {
      return;
    }

    const summaryTop = summaryElement.getBoundingClientRect().top;
    const nextMetrics: Record<number, GrammarSummaryBlockMetric> = {};

    for (const group of grammarSummaryGroups) {
      const paragraphElement = paragraphRefs.current[group.paragraphIndex];

      if (!paragraphElement) {
        continue;
      }

      const paragraphRect = paragraphElement.getBoundingClientRect();
      const naturalTop = Math.max(0, Math.round(paragraphRect.top - summaryTop));
      const naturalHeight = Math.max(1, Math.ceil(paragraphRect.height));

      nextMetrics[group.paragraphIndex] = { top: naturalTop, height: naturalHeight };
    }

    setGrammarSummaryBlockMetrics((currentMetrics) =>
      areGrammarSummaryMetricsEqual(currentMetrics, nextMetrics)
        ? currentMetrics
        : nextMetrics,
    );
  }, [grammarSummaryGroups]);

  useLayoutEffect(() => {
    syncGrammarSummaryLayout();
  }, [visibleActiveSideTab, syncGrammarSummaryLayout]);

  useEffect(() => {
    let frame = 0;

    function scheduleSync() {
      if (frame) {
        cancelAnimationFrame(frame);
      }

      frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(() => {
          frame = 0;
          syncGrammarSummaryLayout();
        });
      });
    }

    const resizeObserver = new ResizeObserver(scheduleSync);

    paragraphRefs.current.forEach((element) => {
      if (element) {
        resizeObserver.observe(element);
      }
    });

    window.addEventListener("resize", scheduleSync);
    scheduleSync();
    void document.fonts?.ready.then(scheduleSync);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", scheduleSync);

      if (frame) {
        cancelAnimationFrame(frame);
      }
    };
  }, [visibleActiveSideTab, syncGrammarSummaryLayout]);

  function syncSelection() {
    const nextSelection = readSelection(articleBodyRef.current);

    setSelectionState(
      nextSelection ? { articleId: article.id, selection: nextSelection } : null,
    );
  }

  function syncContextMenu(event: MouseEvent<HTMLElement>) {
    syncSelection();

    const maxX = window.innerWidth - AI_INPUT_WIDTH - 16;
    const maxY = window.innerHeight - AI_INPUT_HEIGHT - 16;

    setChatPosition({
      x: Math.max(16, Math.min(event.clientX + AI_INPUT_OFFSET, maxX)),
      y: Math.max(16, Math.min(event.clientY + AI_INPUT_OFFSET, maxY)),
    });
  }

  function copySelection() {
    if (!selection) {
      return;
    }

    void navigator.clipboard.writeText(selection.text);
    setLastAction(`Copied: "${selectionPreview}"`);
  }

  function highlightSelection() {
    if (!selection) {
      return;
    }

    addHighlight(article.id, { start: selection.start, end: selection.end });
    setLastAction(`Highlighted: "${selectionPreview}"`);
    window.getSelection()?.removeAllRanges();
  }

  function openAiChat() {
    const context = selection?.text ?? "";

    setChatContext(context);
    setIsChatOpen(true);
    setLastAction(
      context
        ? `Opened AI chat for: "${selectionPreview}"`
        : "Opened AI chat without a selected passage.",
    );

  }

  function sendChatMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const message = chatInput.trim();

    if (!message) {
      return;
    }

    setLastAction(
      chatContext
        ? `AI prompt sent for selected text: "${message}"`
        : `AI prompt sent for article: "${message}"`,
    );
    setChatInput("");
  }

  return (
    <main className="min-h-svh bg-background">
      <div className="mx-auto flex w-full max-w-[1040px] flex-col gap-6 px-5 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-stretch">
          <section className="min-w-0 flex-[7]">
            <div className="flex items-center justify-between gap-4 pb-4 relative after:absolute after:bottom-0 after:inset-x-0 after:h-px after:bg-border">
              <Button variant="outline" size="sm" asChild>
                <Link href={LEVEL_ROUTES[article.level] ?? "/itles"}>
                  <ArrowLeft />
                  Articles
                </Link>
              </Button>
              <Button variant="outline" size="sm" disabled>
                Lesson {article.lesson}
              </Button>
            </div>
            <header className="mb-6 mt-4 space-y-3">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link href={LEVEL_ROUTES[article.level] ?? "/itles"}>{article.level}</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Lesson {article.lesson}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
              <h1 className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-3xl font-semibold tracking-normal text-balance pl-[2.25rem]">
                {article.title}
                <span className="text-xl font-normal text-muted-foreground">
                  {article.titleCn}
                </span>
              </h1>
            </header>

            <ContextMenu>
              <ContextMenuTrigger asChild>
                <article
                  className="selection:bg-primary selection:text-primary-foreground"
                  onContextMenu={syncContextMenu}
                  onMouseUp={syncSelection}
                >
                  <div ref={articleBodyRef} className="space-y-7">
                    {articleParagraphs.map((paragraph, index) => (
                      <div key={paragraphStarts[index]} className="space-y-2">
                        <p
                          ref={(element) => {
                            paragraphRefs.current[index] = element;
                          }}
                          className="text-[1.15rem] leading-[2] text-foreground [text-indent:2em] article-text"
                        >
                          {renderHighlightedText(
                            paragraph,
                            paragraphStarts[index],
                            highlights,
                          )}
                        </p>
                        {isIelts && articleParagraphTranslations[index] ? (
                          <p
                            data-selection-offset-excluded="true"
                            className="text-[0.95rem] leading-8 text-muted-foreground [text-indent:2em] font-normal article-text"
                          >
                            {articleParagraphTranslations[index]}
                          </p>
                        ) : null}
                      </div>
                    ))}
                    {!isIelts && article.notesOnText?.length ? (
                      <div className="article-notes">
                        <h2 className="section-title">课文注释</h2>
                        {article.notesOnText.map((note, i) => (
                          <div key={i} className="note-item">
                            <span className="note-index">{i + 1}.</span>
                            <span className="note-label">{note.title}</span>
                            <span className="note-body">{note.body}</span>
                          </div>
                        ))}
                      </div>
                    ) : null}
                    {!isIelts && articleParagraphTranslations.some(Boolean) && (
                      <div className="mt-10 pt-6">
                        <h2 className="mb-4 text-lg font-semibold text-foreground">参考译文</h2>
                        {articleParagraphTranslations.filter(Boolean).map((trans, i) => (
                          <p
                            key={i}
                            className="text-[0.95rem] leading-8 text-muted-foreground [text-indent:2em] font-normal article-text"
                          >
                            {trans}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              </ContextMenuTrigger>
              <ContextMenuContent className="w-64">
                <ContextMenuLabel>Selection</ContextMenuLabel>
                <div className="px-2 py-1.5 text-xs leading-5 text-muted-foreground">
                  {selectionPreview}
                </div>
                <ContextMenuSeparator />
                <ContextMenuItem disabled={!hasSelection} onSelect={copySelection}>
                  <Copy />
                  Copy text
                  <ContextMenuShortcut>Ctrl+C</ContextMenuShortcut>
                </ContextMenuItem>
                <ContextMenuItem
                  disabled={!hasSelection}
                  onSelect={() => setLastAction(`Quoted: "${selectionPreview}"`)}
                >
                  <Quote />
                  Quote selection
                </ContextMenuItem>
                <ContextMenuItem disabled={!hasSelection} onSelect={highlightSelection}>
                  <Highlighter />
                  Highlight
                </ContextMenuItem>
                <ContextMenuItem
                  disabled={!hasSelection}
                  onSelect={() =>
                    setLastAction(`Searching notes for: "${selectionPreview}"`)
                  }
                >
                  <Search />
                  Search notes
                </ContextMenuItem>
                <ContextMenuItem
                  disabled={!hasSelection}
                  onSelect={() => setLastAction(`Shared excerpt: "${selectionPreview}"`)}
                >
                  <Share2 />
                  Share excerpt
                </ContextMenuItem>
                <ContextMenuItem onSelect={openAiChat}>
                  <Bot />
                  Ask AI
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuCheckboxItem
                  checked={showNotes}
                  onCheckedChange={(checked) => setShowNotes(checked === true)}
                >
                  Show annotation notes
                </ContextMenuCheckboxItem>
                <ContextMenuItem
                  disabled={highlights.length === 0}
                  onSelect={() => {
                    clearHighlights(article.id);
                    setLastAction("Cleared all highlights.");
                  }}
                >
                  <Eraser />
                  Clear highlights
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuRadioGroup
                  value={citationStyle}
                  onValueChange={setCitationStyle}
                >
                  <ContextMenuRadioItem value="mla">MLA citation</ContextMenuRadioItem>
                  <ContextMenuRadioItem value="apa">APA citation</ContextMenuRadioItem>
                  <ContextMenuRadioItem value="chicago">
                    Chicago citation
                  </ContextMenuRadioItem>
                </ContextMenuRadioGroup>
              </ContextMenuContent>
            </ContextMenu>
          </section>

          <div className="hidden w-px shrink-0 bg-[linear-gradient(to_bottom,transparent,var(--border)_15%,var(--border)_85%,transparent)] lg:block" />

          <aside className="min-w-0 flex-[3] space-y-7">
            <div className="flex justify-start lg:pt-4">
              <FlipClock size="sm" variant="outline" className="scale-75 origin-top-left ml-2" />
            </div>
            <section className="space-y-4 lg:pt-0">
              <Tabs
                value={visibleActiveSideTab}
                onValueChange={(value) => setActiveSideTab(value as "grammar" | "vocabulary")}
              >
                <TabsList variant="line" className="h-auto w-full justify-start gap-5 rounded-none bg-transparent p-0 text-sm font-medium">
                  <TabsTrigger
                    value="grammar"
                    className={SIDE_TAB_TRIGGER_CLASS_NAME}
                  >
                    语法摘要
                  </TabsTrigger>
                  <TabsTrigger
                    value="vocabulary"
                    className={SIDE_TAB_TRIGGER_CLASS_NAME}
                  >
                    课文单词
                  </TabsTrigger>
                </TabsList>

                <div className="relative mt-4">
                  <TabsContent
                    value="grammar"
                    forceMount
                    className={SIDE_TAB_CONTENT_CLASS_NAME}
                  >
                    <div
                      ref={grammarSummaryRef}
                      className="flex min-h-40 flex-col overflow-visible"
                    >
                      {grammarSummaryGroups.map((group, groupIndex) => {
                        const metric = grammarSummaryBlockMetrics[group.paragraphIndex];
                        const previousGroup = grammarSummaryGroups[groupIndex - 1];
                        const previousMetric = previousGroup
                          ? grammarSummaryBlockMetrics[previousGroup.paragraphIndex]
                          : null;
                        const spacerHeight = metric
                          ? groupIndex === 0
                            ? metric.top
                            : Math.max(
                                0,
                                metric.top - ((previousMetric?.top ?? 0) + (previousMetric?.height ?? 0)),
                              )
                          : 0;
                        const isExpanded = group.notes.some((note) => note.key === visibleActiveGrammarMoreKey);

                        return (
                          <div
                            key={group.key}
                            className="box-border"
                            style={{
                              marginTop: spacerHeight,
                              minHeight: metric?.height,
                            }}
                          >
                            <div
                              className={
                                "relative box-border overflow-visible pl-[13px] before:absolute before:top-0 before:bottom-0 before:left-0 before:w-[3px] before:rounded-full before:bg-[var(--grammar-mark-color)] before:content-[''] " +
                                (isExpanded ? "z-10 bg-background" : "")
                              }
                              style={GRAMMAR_TONE_STYLES[group.tone]}
                            >
                              {group.notes.map((note) => {
                                const hasRelatedExamples = Boolean(note.relatedExamples?.length);
                                const isMoreActive = visibleActiveGrammarMoreKey === note.key;

                                return (
                                  <Collapsible
                                    key={note.key}
                                    open={isMoreActive}
                                    onOpenChange={(open) => {
                                      if (hasRelatedExamples) {
                                        setActiveGrammarMoreKey(open ? note.key : "");
                                      }
                                    }}
                                    className="flex flex-col gap-1 border-b py-[7px] last:border-b-0"
                                  >
                                    <span className="w-fit rounded-md bg-[var(--grammar-title-bg)] px-1.5 py-px text-[0.95rem] font-normal text-foreground">
                                      {note.title}
                                    </span>
                                    <p className="text-[0.82rem] leading-[1.65] text-muted-foreground">
                                      {note.body}
                                      {hasRelatedExamples ? (
                                        <CollapsibleTrigger asChild>
                                          <button
                                            type="button"
                                            className={
                                              "ml-1 inline-flex size-4 translate-y-0.5 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground " +
                                              (isMoreActive ? "bg-accent text-foreground" : "")
                                            }
                                            aria-label={isMoreActive ? "Hide related examples" : "Show related examples"}
                                          >
                                            <MoreHorizontal className="size-3.5" />
                                          </button>
                                        </CollapsibleTrigger>
                                      ) : null}
                                    </p>
                                    <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                                      <div className="mt-2 flex max-h-[520px] flex-col gap-2 overflow-hidden rounded-md bg-muted/50 px-2.5 py-1">
                                        {note.relatedExamples?.map((example, exampleIndex) => (
                                          <div key={`${example.source}-${exampleIndex}`} className="flex flex-col gap-1">
                                            <span className="w-fit rounded-sm bg-[var(--grammar-title-bg)] px-1.5 py-px text-xs font-normal text-foreground">
                                              {example.source}
                                            </span>
                                            <span className="text-[0.78rem] leading-[1.55] text-foreground">
                                              {example.sentence}
                                            </span>
                                            <span className="text-[0.76rem] leading-[1.55] text-muted-foreground">
                                              {example.note}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </CollapsibleContent>
                                  </Collapsible>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </TabsContent>

                  <TabsContent
                    value="vocabulary"
                    forceMount
                    className={SIDE_TAB_CONTENT_CLASS_NAME}
                  >
                    <div className="divide-y divide-border">
                      {article.vocabulary.map((item) => (
                        <div key={item.word} className="flex flex-wrap items-baseline gap-x-2 gap-y-1 py-1">
                          <span className="text-[0.95rem] text-foreground">{item.word}</span>
                          {item.phonetic && item.phonetic !== "//" ? (
                            <span className="text-[0.75rem] text-muted-foreground/60">{item.phonetic}</span>
                          ) : null}
                          <span className="text-xs text-muted-foreground">{item.pos}</span>
                          <span className="text-[0.82rem] leading-6 text-muted-foreground">
                            {item.meaning}
                          </span>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </section>

            <section className="space-y-2 border-t pt-4 text-sm text-muted-foreground">
              <p>{lastAction}</p>
              <p>
                {highlights.length} highlight{highlights.length === 1 ? "" : "s"} /
                Notes {showNotes ? "shown" : "hidden"} / {citationStyle.toUpperCase()}
              </p>
            </section>
          </aside>
        </div>

        {isChatOpen ? (
          <form
            className="fixed z-50 flex h-11 w-[min(360px,calc(100vw-2rem))] items-center rounded-full bg-popover text-popover-foreground shadow-lg"
            style={{ left: chatPosition.x, top: chatPosition.y }}
            onSubmit={sendChatMessage}
          >
            <ShineBorder shineColor={["#ef4444", "#eab308", "#3b82f6"]} borderWidth={2} />
            <div className="relative z-10 flex h-full w-full items-center gap-1.5 rounded-full bg-popover px-2.5">
            <Bot className="size-4 shrink-0 text-muted-foreground" />
            <input
              value={chatInput}
              onChange={(event) => setChatInput(event.target.value)}
              placeholder={
                chatContext
                  ? "Ask AI about selection..."
                  : "Ask AI..."
              }
              className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              aria-label="Ask AI"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-6 rounded-full"
              onClick={() => setIsChatOpen(false)}
              aria-label="Close AI input"
            >
              <X className="size-3.5" />
            </Button>
            <Button type="submit" size="icon" className="size-6 rounded-full p-0" aria-label="Send AI prompt">
              <Send className="size-3.5 -translate-x-px translate-y-px" />
            </Button>
            </div>
          </form>
        ) : null}
      </div>
    </main>
  );
}
