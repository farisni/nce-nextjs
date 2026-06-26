import { articlesNce2 } from "@/app/mock";
import { NceVocabularyPage } from "@/components/nce-vocabulary-page";

export default function Nce2VocabularyRoute() {
  return <NceVocabularyPage articles={articlesNce2} title="NCE2 单词" />;
}
