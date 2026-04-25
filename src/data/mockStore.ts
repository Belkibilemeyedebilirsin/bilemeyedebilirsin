import type { ItemRarity } from "../types";

export type StoreCategory =
  | "Kostüm"
  | "Avatar"
  | "Çerçeve"
  | "İnsan Modeli"
  | "Ünvan";

export type StoreItem = {
  id: string;
  name: string;
  category: StoreCategory;
  currency: "KP";
  price: number;
  rarity: ItemRarity;
  isNew?: boolean;
  accent: string;
};

export const storeCategories: StoreCategory[] = [
  "Kostüm",
  "Avatar",
  "Çerçeve",
  "İnsan Modeli",
  "Ünvan",
];

export const mockStoreItems: StoreItem[] = [
  {
    id: "st1",
    name: "Gece Avcısı Kostümü",
    category: "Kostüm",
    currency: "KP",
    price: 980,
    rarity: "Epik",
    isNew: true,
    accent: "#0f766e",
  },
  {
    id: "st2",
    name: "Altın Çizgi Avatar",
    category: "Avatar",
    currency: "KP",
    price: 320,
    rarity: "Nadir",
    accent: "#1d4ed8",
  },
  {
    id: "st3",
    name: "Kraliyet Çerçevesi",
    category: "Çerçeve",
    currency: "KP",
    price: 90,
    rarity: "Efsane",
    accent: "#f59e0b",
  },
  {
    id: "st4",
    name: "Neon Kontur Çerçeve",
    category: "Çerçeve",
    currency: "KP",
    price: 640,
    rarity: "Epik",
    accent: "#a855f7",
  },
  {
    id: "st5",
    name: "Mavi Operatör Modeli",
    category: "İnsan Modeli",
    currency: "KP",
    price: 140,
    rarity: "Efsane",
    isNew: true,
    accent: "#14b8a6",
  },
  {
    id: "st6",
    name: "Yükselen Analist Ünvanı",
    category: "Ünvan",
    currency: "KP",
    price: 410,
    rarity: "Nadir",
    accent: "#0f766e",
  },
  {
    id: "st7",
    name: "Keskin Biletçi Ünvanı",
    category: "Ünvan",
    currency: "KP",
    price: 55,
    rarity: "Epik",
    accent: "#e11d48",
  },
  {
    id: "st8",
    name: "Kutup Avatarı",
    category: "Avatar",
    currency: "KP",
    price: 280,
    rarity: "Nadir",
    accent: "#0ea5e9",
  },
];