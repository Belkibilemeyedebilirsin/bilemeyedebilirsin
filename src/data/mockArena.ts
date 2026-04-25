import type { PredictionChoice } from "../types";

export type ArenaPost = {
    id: string;
    user: string;
    avatar: string;
    time: string;
    note: string;
    selectionCount: number;
    stake: number;
    totalOdds: number;
    maxWin: number;
    selections: {
      id: string;
      predictionId: string;
      title: string;
      category: string;
      choice: PredictionChoice;
      odd: number;
    }[];
  };
  
  export const mockArenaPosts: ArenaPost[] = [
    {
      id: "ar1",
      user: "Mert1905",
      avatar: "M",
      time: "8 dk önce",
      note: "Bugün iki maç birleştirip orta riskli bir kupon yaptım.",
      selectionCount: 2,
      stake: 180,
      totalOdds: 3.24,
      maxWin: 583.2,
      selections: [
        {
          id: "a1",
          predictionId: "1",
          title: "Galatasaray ilk yarıda gol bulur mu?",
          category: "Futbol",
          choice: "EVET",
          odd: 1.82,
        },
        {
          id: "a2",
          predictionId: "2",
          title: "Maç toplam sayı 165.5 üst olur mu?",
          category: "Basketbol",
          choice: "EVET",
          odd: 1.78,
        },
      ],
    },
    {
      id: "ar2",
      user: "ecoentry",
      avatar: "E",
      time: "21 dk önce",
      note: "İlk harita tarafında ters köşe denedim, oranı sevdim.",
      selectionCount: 1,
      stake: 90,
      totalOdds: 1.97,
      maxWin: 177.3,
      selections: [
        {
          id: "a3",
          predictionId: "3",
          title: "Seride ilk haritayı favori takım alır mı?",
          category: "E-Spor",
          choice: "HAYIR",
          odd: 1.97,
        },
      ],
    },
    {
      id: "ar3",
      user: "courtvision",
      avatar: "C",
      time: "48 dk önce",
      note: "Bu kuponun tempo tarafına güveniyorum.",
      selectionCount: 2,
      stake: 130,
      totalOdds: 3.51,
      maxWin: 456.3,
      selections: [
        {
          id: "a4",
          predictionId: "2",
          title: "Maç toplam sayı 165.5 üst olur mu?",
          category: "Basketbol",
          choice: "EVET",
          odd: 1.74,
        },
        {
          id: "a5",
          predictionId: "3",
          title: "Seride ilk haritayı favori takım alır mı?",
          category: "E-Spor",
          choice: "EVET",
          odd: 2.02,
        },
      ],
    },
  ];