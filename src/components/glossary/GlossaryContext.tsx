import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import type { GlossaryEntry } from '@/data/types';

import { GlossarySheet } from './GlossarySheet';

interface GlossaryContextValue {
  open: (entry: GlossaryEntry) => void;
}

const GlossaryContext = createContext<GlossaryContextValue>({ open: () => {} });

/** 앱 어디서든 용어를 탭하면 하단 해설 시트가 뜨도록 하는 전역 컨텍스트 */
export function GlossaryProvider({ children }: { children: ReactNode }) {
  const [entry, setEntry] = useState<GlossaryEntry | null>(null);

  const open = useCallback((e: GlossaryEntry) => setEntry(e), []);
  const close = useCallback(() => setEntry(null), []);
  const value = useMemo(() => ({ open }), [open]);

  return (
    <GlossaryContext.Provider value={value}>
      {children}
      <GlossarySheet entry={entry} onClose={close} />
    </GlossaryContext.Provider>
  );
}

export function useGlossary() {
  return useContext(GlossaryContext);
}
