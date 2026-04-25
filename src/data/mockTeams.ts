import type { Team } from "../types/team";

const NOW = Date.now();
const DAY = 86_400_000;

export const mockTeams: Team[] = [
  {
    id: "team-alpha",
    name: "Alpha Analistler",
    tag: "ALPH",
    desc: "Futbol ve basketbol odaklı, veri bazlı tahmin yapan rekabetçi takım.",
    members: [
      { userId: "mert1905", role: "kurucu", joinedAt: NOW - 30 * DAY },
      { userId: "courtvision", role: "yonetici", joinedAt: NOW - 28 * DAY },
      { userId: "analizci34", role: "uye", joinedAt: NOW - 25 * DAY },
      { userId: "futbolx", role: "uye", joinedAt: NOW - 20 * DAY },
    ],
    invites: [
      {
        id: "inv-alpha-1",
        teamId: "team-alpha",
        toUserId: "tempozone",
        fromUserId: "mert1905",
        status: "bekliyor",
        createdAt: NOW - DAY,
      },
    ],
    applications: [
      {
        id: "app-alpha-1",
        teamId: "team-alpha",
        fromUserId: "tenisx",
        status: "bekliyor",
        createdAt: NOW - 2 * DAY,
      },
    ],
    messages: [
      {
        id: "tm-alpha-1",
        userId: "mert1905",
        userName: "Mert1905",
        text: "Haftalık strateji toplantısı yarın 20:00.",
        createdAt: NOW - 3 * DAY,
      },
      {
        id: "tm-alpha-2",
        userId: "courtvision",
        userName: "courtvision",
        text: "Basketbol maçları için yeni analiz hazır, paylaşıyorum.",
        createdAt: NOW - 2 * DAY,
      },
      {
        id: "tm-alpha-3",
        userId: "analizci34",
        userName: "analizci34",
        text: "Harika! İnceleyeyim.",
        createdAt: NOW - 2 * DAY + 60_000,
      },
    ],
    createdAt: NOW - 30 * DAY,
  },
  {
    id: "team-tempo",
    name: "Tempo Zone",
    tag: "TMPO",
    desc: "Kısa süreli ve canlı tahminlerde uzmanlaşmış dinamik takım.",
    members: [
      { userId: "tempozone", role: "kurucu", joinedAt: NOW - 15 * DAY },
      { userId: "canliyorum", role: "yonetici", joinedAt: NOW - 14 * DAY },
      { userId: "potadanaliz", role: "uye", joinedAt: NOW - 10 * DAY },
    ],
    invites: [],
    applications: [],
    messages: [
      {
        id: "tm-tempo-1",
        userId: "tempozone",
        userName: "tempozone",
        text: "Bu hafta 3 büyük maç var, hazırlıklı olalım.",
        createdAt: NOW - DAY,
      },
    ],
    createdAt: NOW - 15 * DAY,
  },
  {
    id: "team-espor",
    name: "E-Spor Merkezi",
    tag: "ESPR",
    desc: "E-spor tahminlerine odaklanan, draft ve veto analizleri yapan takım.",
    members: [
      { userId: "ecoentry", role: "kurucu", joinedAt: NOW - 20 * DAY },
      { userId: "fragusta", role: "yonetici", joinedAt: NOW - 18 * DAY },
      { userId: "courtreader", role: "uye", joinedAt: NOW - 12 * DAY },
      { userId: "tenisx", role: "uye", joinedAt: NOW - 8 * DAY },
    ],
    invites: [
      {
        id: "inv-espor-goktug",
        teamId: "team-espor",
        toUserId: "goktug",
        fromUserId: "ecoentry",
        status: "bekliyor",
        createdAt: NOW - DAY,
      },
    ],
    applications: [],
    messages: [
      {
        id: "tm-espor-1",
        userId: "ecoentry",
        userName: "ecoentry",
        text: "Yeni sezon draft analizlerini paylaşıyorum.",
        createdAt: NOW - 5 * DAY,
      },
      {
        id: "tm-espor-2",
        userId: "fragusta",
        userName: "fragusta",
        text: "Harika! Veto listesine baktım, mantıklı görünüyor.",
        createdAt: NOW - 5 * DAY + 120_000,
      },
    ],
    createdAt: NOW - 20 * DAY,
  },
];
