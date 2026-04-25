export type PredictionFilterTab =
  | "Tümü"
  | "Kısa Süreli"
  | "Uzun Süreli"
  | "Azalan Riskli";

export type PredictionTag = Exclude<PredictionFilterTab, "Tümü">;

export type PredictionItem = {
  id: string;
  category: string;
  timeLeft: string;
  title: string;
  description: string;
  longDescription: string;
  votes: number;
  comments: number;
  yesOdd: number;
  noOdd: number;
  accent: string;
  image: string;
  tabs: PredictionTag[];
};

export type CommentNode = {
  id: string;
  user: string;
  text: string;
  replies?: CommentNode[];
};

export type CommentItem = CommentNode;

export const homeFilterTabs: PredictionFilterTab[] = [
  "Tümü",
  "Kısa Süreli",
  "Uzun Süreli",
  "Azalan Riskli",
];

export const mockPredictions: PredictionItem[] = [
  {
    id: "1",
    category: "Futbol",
    timeLeft: "2s 14dk",
    title: "Galatasaray ilk yarıda gol bulur mu?",
    description:
      "İç saha baskısı ve form durumu sebebiyle ilk yarı gol ihtimali öne çıkıyor.",
    longDescription:
      "Takımın son haftalardaki iç saha başlangıç temposu, rakibin ilk yarı savunma kırılganlığı ve duran top etkinliği birlikte değerlendirildiğinde bu tahmin dikkat çekiyor. Özellikle erken baskı ve topa sahip olma oranı yüksek senaryolarda ilk yarı gol ihtimali artıyor.",
    votes: 0,
    comments: 0,
    yesOdd: 1.82,
    noOdd: 2.15,
    accent: "#2563eb",
    image:
      "https://images.unsplash.com/photo-1547347298-4074fc3086f0?auto=format&fit=crop&w=1200&q=80",
    tabs: ["Kısa Süreli"],
  },
  {
    id: "2",
    category: "Basketbol",
    timeLeft: "5s 08dk",
    title: "Maç toplam sayı 165.5 üst olur mu?",
    description:
      "İki takımın tempo verisi ve hücum verimliliği yüksek skor işareti veriyor.",
    longDescription:
      "Son karşılaşmalarda iki tarafın da geçiş hücumlarını daha sık kullandığı, üç sayı deneme hacminin yükseldiği ve bench katkısının arttığı görülüyor. Bu nedenle maçın belirlenen toplam sayı bandının üstünde bitme ihtimali güçlü hissediliyor.",
    votes: 0,
    comments: 0,
    yesOdd: 1.74,
    noOdd: 2.05,
    accent: "#7c3aed",
    image:
      "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1200&q=80",
    tabs: ["Kısa Süreli", "Azalan Riskli"],
  },
  {
    id: "3",
    category: "E-Spor",
    timeLeft: "1g 3s",
    title: "Seride ilk haritayı favori takım alır mı?",
    description:
      "Patch uyumu ve harita havuzu nedeniyle favori taraf bir adım önde duruyor.",
    longDescription:
      "Takımların son dönem veto eğilimleri, ilk harita tercihleri ve bireysel oyuncu formu analiz edildiğinde ilk haritada favori ekibin daha net bir avantaj yakaladığı görülüyor. Özellikle erken round kontrolü ve side tercihleri burada belirleyici olabilir.",
    votes: 0,
    comments: 0,
    yesOdd: 1.91,
    noOdd: 1.97,
    accent: "#ea580c",
    image:
      "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80",
    tabs: ["Uzun Süreli"],
  },
  {
    id: "4",
    category: "Tenis",
    timeLeft: "18s 20dk",
    title: "İlk set tie-break görür mü?",
    description:
      "Servis gücü yüksek iki oyuncunun eşleşmesinde set uzama ihtimali dikkat çekiyor.",
    longDescription:
      "Her iki oyuncunun da ilk servis yüzdesi, kısa rallilerdeki verimi ve son maçlarda tie-break oynama sıklığı birlikte değerlendirildiğinde bu tahmin daha kontrollü ama uzun senaryoya açık bir seçim olarak öne çıkıyor.",
    votes: 0,
    comments: 0,
    yesOdd: 2.22,
    noOdd: 1.68,
    accent: "#0f766e",
    image:
      "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=1200&q=80",
    tabs: ["Uzun Süreli", "Azalan Riskli"],
  },
];

export const mockComments: Record<string, CommentNode[]> = {};