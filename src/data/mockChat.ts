export type ChatMessage = {
  id: string;
  user: string;
  text: string;
  time: string;
  agoMinutes?: number;
  createdAt?: number;
  mine?: boolean;
  isAnnouncement?: boolean;
};

export type ChatRoom = {
  id: string;
  name: string;
  desc: string;
  online: number;
  vibe: string;
  messages: ChatMessage[];
  ownerUserId?: string;
};

export type DirectMessageThread = {
  userId: string;
  messages: ChatMessage[];
};

export const chatVibeOptions = [
  "Temkinli",
  "Analitik",
  "Stratejik",
  "Hızlı Akış",
  "Topluluk",
  "Sakin",
] as const;

export const mockChatRooms: ChatRoom[] = [
  {
    id: "r1",
    name: "Canlı Futbol Odası",
    desc: "Anlık maç yorumları, ilk yarı / skor odaklı sohbetler.",
    online: 148,
    vibe: "Hızlı Akış",
    ownerUserId: "mert1905",
    messages: [
      {
        id: "m1",
        user: "Mert1905",
        text: "İlk yarı tarafında tempo yüksek başlar gibi.",
        time: "12:41",
        agoMinutes: 40,
      },
      {
        id: "m2",
        user: "Göktuğ",
        text: "Ben de o tarafa yakın hissediyorum.",
        time: "12:42",
        agoMinutes: 35,
        mine: true,
      },
      {
        id: "m3",
        user: "futbolx",
        text: "Rakip erken kapanırsa oran güzel kalır.",
        time: "12:43",
        agoMinutes: 32,
      },
    ],
  },
  {
    id: "r2",
    name: "Basketbol Tempo Room",
    desc: "Tempo, üst/alt ve oyuncu performansı üzerine odaklı oda.",
    online: 92,
    vibe: "Analitik",
    ownerUserId: "courtvision",
    messages: [
      {
        id: "m4",
        user: "courtvision",
        text: "Üst tarafında bench katkısı kritik olacak.",
        time: "13:02",
        agoMinutes: 95,
      },
      {
        id: "m5",
        user: "potadanaliz",
        text: "Faul çizgisi verimi gelirse rahat aşılır.",
        time: "13:03",
        agoMinutes: 90,
      },
    ],
  },
  {
    id: "r3",
    name: "E-Spor Draft Masası",
    desc: "Harita veto, side seçimi ve seri akışı konuşuluyor.",
    online: 71,
    vibe: "Stratejik",
    ownerUserId: "ecoentry",
    messages: [
      {
        id: "m6",
        user: "ecoentry",
        text: "İlk map veto tarafı favoriyi öne atıyor.",
        time: "14:10",
        agoMinutes: 280,
      },
      {
        id: "m7",
        user: "fragusta",
        text: "Ben yine ters köşe arıyorum.",
        time: "14:11",
        agoMinutes: 260,
      },
    ],
  },
  {
    id: "r4",
    name: "Az Riskli Kuponlar",
    desc: "Daha dengeli ve kontrollü kupon arayanlar için oda.",
    online: 116,
    vibe: "Temkinli",
    ownerUserId: "analizci34",
    messages: [
      {
        id: "m8",
        user: "tempozone",
        text: "Tekli ve düşük oran kombinasyonları daha güvenli.",
        time: "15:05",
        agoMinutes: 1620,
      },
      {
        id: "m9",
        user: "analizci34",
        text: "Uzun süreli seçimlerde sabır daha değerli.",
        time: "15:08",
        agoMinutes: 1500,
      },
    ],
  },
];

export const generalChatMessages: ChatMessage[] = [
  {
    id: "g0",
    user: "Admin",
    text: "Sezon 1 başladı! Bu hafta en yüksek TP kazanan oyuncuya özel rozet verilecek. Tahminlerinizi yapın, kuponu doldurun!",
    time: "09:00",
    agoMinutes: 90,
    isAnnouncement: true,
  },
  {
    id: "g1",
    user: "Göktuğ",
    text: "Genel sohbete hoş geldiniz.",
    time: "10:10",
    agoMinutes: 20,
    mine: true,
  },
  {
    id: "g2",
    user: "Mert1905",
    text: "Bugün futbol tarafında hareket var.",
    time: "10:12",
    agoMinutes: 18,
  },
  {
    id: "g3",
    user: "courtvision",
    text: "Basketbol çizgileri de ilginç açıldı.",
    time: "10:13",
    agoMinutes: 90,
  },
  {
    id: "g4",
    user: "ecoentry",
    text: "Akşam e-spor serisinde fırsat olabilir.",
    time: "10:15",
    agoMinutes: 1520,
  },
];

export const mockDirectMessageThreads: DirectMessageThread[] = [];