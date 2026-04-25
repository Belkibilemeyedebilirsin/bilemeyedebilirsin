export type LeaderboardUser = {
    id: string;
    rank: number;
    name: string;
    avatar: string;
    tp: number;
    streak: number;
    winRate: number;
    title: string;
    frameColor: string;
    titleColor: string;
    /** Sezon sıralamasındaki pozisyon. Backend entegrasyonuna kadar isteğe bağlı. */
    seasonRank?: number;
    /** Sezon puanı (TP bazlı). Backend entegrasyonuna kadar isteğe bağlı. */
    seasonScore?: number;
  };
  
  export const mockLeaderboard: LeaderboardUser[] = [
    {
      id: "u1",
      rank: 1,
      name: "Mert1905",
      avatar: "M",
      tp: 28450,
      streak: 9,
      winRate: 78,
      title: "Altın Stratejist",
      frameColor: "#f59e0b",
      titleColor: "#92400e",
    },
    {
      id: "u2",
      rank: 2,
      name: "courtvision",
      avatar: "C",
      tp: 26120,
      streak: 7,
      winRate: 74,
      title: "Okyanus Avcısı",
      frameColor: "#38bdf8",
      titleColor: "#0369a1",
    },
    {
      id: "u3",
      rank: 3,
      name: "ecoentry",
      avatar: "E",
      tp: 24890,
      streak: 6,
      winRate: 72,
      title: "Gölgeli Analist",
      frameColor: "#c084fc",
      titleColor: "#7e22ce",
    },
    {
      id: "u4",
      rank: 4,
      name: "analizci34",
      avatar: "A",
      tp: 23010,
      streak: 5,
      winRate: 70,
      title: "Saf İsabet",
      frameColor: "#22c55e",
      titleColor: "#166534",
    },
    {
      id: "u5",
      rank: 5,
      name: "fragusta",
      avatar: "F",
      tp: 21980,
      streak: 4,
      winRate: 69,
      title: "Kırmızı Komuta",
      frameColor: "#fb7185",
      titleColor: "#be123c",
    },
    {
      id: "u6",
      rank: 6,
      name: "Göktuğ",
      avatar: "G",
      tp: 20840,
      streak: 7,
      winRate: 68,
      title: "Yükselen Analist",
      frameColor: "#14b8a6",
      titleColor: "#0f766e",
    },
    {
      id: "u7",
      rank: 7,
      name: "potadanaliz",
      avatar: "P",
      tp: 19860,
      streak: 3,
      winRate: 66,
      title: "Tempo Gözcüsü",
      frameColor: "#60a5fa",
      titleColor: "#1d4ed8",
    },
    {
      id: "u8",
      rank: 8,
      name: "canliyorum",
      avatar: "Y",
      tp: 19120,
      streak: 2,
      winRate: 64,
      title: "Keskin Biletçi",
      frameColor: "#34d399",
      titleColor: "#047857",
    },
    {
      id: "u9",
      rank: 9,
      name: "futbolx",
      avatar: "F",
      tp: 18470,
      streak: 4,
      winRate: 63,
      title: "Risk Ustası",
      frameColor: "#f97316",
      titleColor: "#c2410c",
    },
    {
      id: "u10",
      rank: 10,
      name: "tempozone",
      avatar: "T",
      tp: 17990,
      streak: 1,
      winRate: 61,
      title: "Sessiz Avcı",
      frameColor: "#a78bfa",
      titleColor: "#6d28d9",
    },
  ];