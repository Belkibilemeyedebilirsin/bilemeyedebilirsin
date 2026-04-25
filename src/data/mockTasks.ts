export type TaskPeriod = "daily" | "weekly" | "seasonal";

export type TaskItem = {
  id: string;
  title: string;
  description: string;
  current: number;
  target: number;
  rewardTp: number;
  rewardKp?: number;
  period: TaskPeriod;
};

export const mockTasks: TaskItem[] = [
  // ─── GÜNLÜK ────────────────────────────────────────────────
  {
    id: "d1",
    title: "Günlük Yoklama",
    description: "Uygulamaya giriş yap",
    current: 1,
    target: 1,
    rewardTp: 50,
    period: "daily",
  },
  {
    id: "d2",
    title: "Keskin Tahmin",
    description: "1 tahmin tuttur",
    current: 0,
    target: 1,
    rewardTp: 100,
    period: "daily",
  },
  {
    id: "d3",
    title: "Arena Katılımı",
    description: "Arenada 1 tahmin paylaş",
    current: 0,
    target: 1,
    rewardTp: 100,
    period: "daily",
  },
  {
    id: "d4",
    title: "Sohbetçi Ruh",
    description: "Genel sohbette 5 mesaj at",
    current: 0,
    target: 5,
    rewardTp: 50,
    period: "daily",
  },
  {
    id: "d5",
    title: "Yorum Bırak",
    description: "Tahmine yorum yap",
    current: 0,
    target: 1,
    rewardTp: 50,
    period: "daily",
  },
  {
    id: "d6",
    title: "Profil Avcısı",
    description: "Birinin profilini incele",
    current: 0,
    target: 1,
    rewardTp: 50,
    period: "daily",
  },
  {
    id: "d7",
    title: "Tahmin Keşfi",
    description: "En az 1 tahmin incele",
    current: 0,
    target: 1,
    rewardTp: 50,
    period: "daily",
  },
  {
    id: "d8",
    title: "Geri Döndün",
    description: "Gün içinde tekrar giriş yap",
    current: 0,
    target: 1,
    rewardTp: 50,
    period: "daily",
  },
  {
    id: "d9",
    title: "Detaylı İnceleme",
    description: "4 farklı tahmin incele",
    current: 0,
    target: 4,
    rewardTp: 100,
    period: "daily",
  },

  // ─── HAFTALIK ──────────────────────────────────────────────
  {
    id: "tw1",
    title: "10 tahmin yap",
    description: "Hafta boyunca toplam 10 farklı tahmin seçimi yap.",
    current: 4,
    target: 10,
    rewardTp: 400,
    period: "weekly",
  },
  {
    id: "tw2",
    title: "3 farklı kategoride tahmin",
    description: "Bu hafta en az 3 farklı kategoride tahmin yap.",
    current: 1,
    target: 3,
    rewardTp: 300,
    rewardKp: 20,
    period: "weekly",
  },
  {
    id: "tw3",
    title: "5 kupon olustur",
    description: "Bu hafta 5 adet tekli veya çoklu kupon oluştur.",
    current: 2,
    target: 5,
    rewardTp: 350,
    period: "weekly",
  },
  {
    id: "tw4",
    title: "Haftalık streak: 5 gün giriş",
    description: "Bu hafta 5 gün üst üste uygulamaya giriş yap.",
    current: 3,
    target: 5,
    rewardTp: 250,
    rewardKp: 30,
    period: "weekly",
  },
  {
    id: "tw5",
    title: "Bir arkadaşa mesaj gönder",
    description: "Arkadaş listendeki birine en az bir doğrudan mesaj gönder.",
    current: 0,
    target: 1,
    rewardTp: 150,
    period: "weekly",
  },

  // ─── SEZONLUK ──────────────────────────────────────────────
  {
    id: "ts1",
    title: "50 tahmin yap",
    description: "Bu sezon boyunca toplam 50 tahmin seçimi yap.",
    current: 14,
    target: 50,
    rewardTp: 1500,
    rewardKp: 100,
    period: "seasonal",
  },
  {
    id: "ts2",
    title: "İlk kuponu kazan",
    description: "Bu sezonda en az bir kupon veya tekli tahmini başarıyla kazan.",
    current: 1,
    target: 1,
    rewardTp: 500,
    rewardKp: 50,
    period: "seasonal",
  },
  {
    id: "ts3",
    title: "Arena'da 10 paylaşım yap",
    description: "Bu sezon boyunca 10 adet kupon paylaşımı yap.",
    current: 3,
    target: 10,
    rewardTp: 800,
    rewardKp: 60,
    period: "seasonal",
  },
  {
    id: "ts4",
    title: "Sezon toplam 2000 TP yatır",
    description: "Bu sezon boyunca tahminlere toplamda 2000 TP yatır.",
    current: 650,
    target: 2000,
    rewardTp: 1000,
    rewardKp: 80,
    period: "seasonal",
  },
];
