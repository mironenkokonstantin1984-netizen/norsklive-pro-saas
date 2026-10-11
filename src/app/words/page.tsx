import './words.css';
import { getVisibleWords, shouldShowDraftWords } from '../../lib/words/catalog';
import { WordsSession } from '../../components/words/WordsSession';

export const dynamic = 'force-dynamic';

export default function WordsRoutePage() {
  const showDrafts = shouldShowDraftWords();
  const catalog = getVisibleWords({ showDrafts });

  return <WordsSession catalog={catalog} showDrafts={showDrafts} />;
}
