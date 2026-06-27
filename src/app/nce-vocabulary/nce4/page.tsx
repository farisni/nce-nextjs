import { articlesNce4 } from "@/app/mock";
import { NceVocabularyPage } from "@/components/nce-vocabulary-page";

export default function Nce4VocabularyRoute() {
  return <NceVocabularyPage articles={articlesNce4} title="NCE4 单词" />;
}
