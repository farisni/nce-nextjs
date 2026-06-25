import { articlesNce2 } from "./nce2";
import { articlesNce3 } from "./nce3";
import { articlesNce4 } from "./nce4";
import { articlesIelts } from "./ielts";

export type { Article, VocabItem, SentenceNote, SentenceData, GrammarRelatedExample } from "./types";
export { articlesIelts } from "./ielts";
export { articlesNce2 } from "./nce2";
export { articlesNce3 } from "./nce3";
export { articlesNce4 } from "./nce4";

export const allArticles: Record<string, (typeof articlesNce2)[string]> = {
  ...articlesNce2,
  ...articlesNce3,
  ...articlesNce4,
  ...articlesIelts,
};

export interface ArticleListItem {
  id: string;
  title: string;
  titleCn?: string;
  level: string;
  lesson: number;
  paragraphCount: number;
  vocabularyCount: number;
  keyArticle?: boolean;
}

export function getArticleList(articles: Record<string, { id: string; title: string; titleCn?: string; level: string; lesson: number; original: { paragraphs: unknown[][] }; vocabulary: unknown[]; keyArticle?: boolean }>): ArticleListItem[] {
  return Object.values(articles)
    .sort((a, b) => a.lesson - b.lesson)
    .map((article) => ({
      id: article.id,
      title: article.title,
      titleCn: article.titleCn,
      level: article.level,
      lesson: article.lesson,
      paragraphCount: article.original.paragraphs.length,
      vocabularyCount: article.vocabulary.length,
      keyArticle: article.keyArticle,
    }));
}

export const nce2List = getArticleList(articlesNce2);
export const nce3List = getArticleList(articlesNce3);
export const nce4List = getArticleList(articlesNce4);
export const ieltsList = getArticleList(articlesIelts);
