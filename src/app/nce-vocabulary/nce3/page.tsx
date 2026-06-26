import { articlesNce3 } from "@/app/mock";
import { NceVocabularyPage } from "@/components/nce-vocabulary-page";

export default function Nce3VocabularyRoute() {
  return <NceVocabularyPage articles={articlesNce3} title="NCE3 单词" />;
}
