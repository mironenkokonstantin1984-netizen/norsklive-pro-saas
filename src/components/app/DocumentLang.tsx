'use client';

import { useEffect } from 'react';
import { applyDocumentLang } from '../../lib/documentLang';
import { readPathPrefs } from '../../lib/path/storage';

/** Sets `<html lang>` from the saved L1 setting once the page is in the browser. */
export function DocumentLang() {
  useEffect(() => {
    applyDocumentLang(readPathPrefs().l1);
  }, []);
  return null;
}
