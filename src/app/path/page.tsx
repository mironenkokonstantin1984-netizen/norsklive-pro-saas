import { PathHome } from '../../components/path/PathHome';
import { getVisibleWords } from '../../lib/words/catalog';

export default function PathPage() {
  const visibleIds = getVisibleWords().map((w) => w.id);
  return <PathHome visibleWordIds={visibleIds} />;
}
