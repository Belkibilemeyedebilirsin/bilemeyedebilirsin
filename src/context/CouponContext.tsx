import React, { createContext, useContext, useMemo, useState } from "react";
import type { PredictionChoice } from "../types";

/**
 * Geriye dönük uyumluluk için re-export.
 * PredictionCard ve diğer tüketiciler bu ismi import etmeye devam edebilir.
 */
export type CouponChoice = PredictionChoice;

export type CouponSelection = {
  predictionId: string;
  title: string;
  category: string;
  choice: CouponChoice;
  odd: number;
};

type CouponContextType = {
  selections: CouponSelection[];
  selectionCount: number;
  totalOdds: number;
  stakeTp: string;
  arenaNote: string;
  isCouponPanelOpen: boolean;
  upsertSelection: (selection: CouponSelection) => void;
  removeSelection: (predictionId: string) => void;
  clearSelections: () => void;
  setStakeTp: (value: string) => void;
  setArenaNote: (value: string) => void;
  openCouponPanel: () => void;
  closeCouponPanel: () => void;
};

const CouponContext = createContext<CouponContextType | undefined>(undefined);

export function CouponProvider({ children }: { children: React.ReactNode }) {
  const [selections, setSelections] = useState<CouponSelection[]>([]);
  const [stakeTp, setStakeTp] = useState("");
  const [arenaNote, setArenaNote] = useState("");
  const [isCouponPanelOpen, setIsCouponPanelOpen] = useState(false);

  const upsertSelection = (selection: CouponSelection) => {
    setSelections((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.predictionId === selection.predictionId
      );

      if (existingIndex === -1) {
        // Yeni seçim: listeye ekle.
        return [...prev, selection];
      }

      // Aynı soruda seçim değiştirilirse (örn: EVET iken HAYIR'a basarsa) yeni seçimi uygula
      const next = [...prev];
      next[existingIndex] = selection;
      return next;
    });
  };

  const removeSelection = (predictionId: string) => {
    setSelections((prev) =>
      prev.filter((item) => item.predictionId !== predictionId)
    );
  };

  const clearSelections = () => {
    setSelections([]);
    setStakeTp("");
    setArenaNote("");
  };

  const totalOdds = useMemo(() => {
    if (selections.length === 0) return 0;
    return selections.reduce((acc, item) => acc * item.odd, 1);
  }, [selections]);

  const value = useMemo(
    () => ({
      selections,
      selectionCount: selections.length,
      totalOdds,
      stakeTp,
      arenaNote,
      isCouponPanelOpen,
      upsertSelection,
      removeSelection,
      clearSelections,
      setStakeTp,
      setArenaNote,
      openCouponPanel: () => setIsCouponPanelOpen(true),
      closeCouponPanel: () => setIsCouponPanelOpen(false),
    }),
    [selections, totalOdds, stakeTp, arenaNote, isCouponPanelOpen]
  );

  return (
    <CouponContext.Provider value={value}>{children}</CouponContext.Provider>
  );
}

export function useCoupon() {
  const context = useContext(CouponContext);

  if (!context) {
    throw new Error("useCoupon must be used inside CouponProvider");
  }

  return context;
}