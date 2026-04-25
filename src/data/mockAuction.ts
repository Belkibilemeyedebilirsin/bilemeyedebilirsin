/**
 * Açık artırma mock seed verisi.
 *
 * endsAt değerleri uygulama açılışından itibaren hesaplanır,
 * böylece iş kuralları (son 1 saat / 30 dk / 10 dk / 5 dk fazları)
 * her çalıştırmada gerçekçi şekilde test edilebilir.
 */

import type { Auction } from "../types/auction";

const NOW = Date.now();
const H = 3_600_000;
const M = 60_000;

export const mockAuctions: Auction[] = [
  {
    id: "auc1",
    name: "Kraliyet Çerçevesi",
    category: "Çerçeve",
    accent: "#f59e0b",
    endsAt: NOW + 28 * H,
    starterBid: 100,
    currentBid: 650,
    highestBidderId: "mert1905",
    highestBidderUsername: "mert1905",
    participantCount: 5,
    bids: [
      { userId: "mert1905", username: "mert1905", totalAmount: 650, lastBidAt: NOW - 45 * M },
      { userId: "courtvision", username: "courtvision", totalAmount: 500, lastBidAt: NOW - 2 * H },
      { userId: "ecoentry", username: "ecoentry", totalAmount: 350, lastBidAt: NOW - 4 * H },
    ],
    status: "active",
  },
  {
    id: "auc2",
    name: "Gece Operatörü İnsan Modeli",
    category: "İnsan Modeli",
    accent: "#14b8a6",
    endsAt: NOW + 9 * H,
    starterBid: 100,
    currentBid: 1180,
    highestBidderId: "courtvision",
    highestBidderUsername: "courtvision",
    participantCount: 8,
    bids: [
      { userId: "courtvision", username: "courtvision", totalAmount: 1180, lastBidAt: NOW - 25 * M },
      { userId: "mert1905", username: "mert1905", totalAmount: 900, lastBidAt: NOW - 1.5 * H },
      { userId: "analizci34", username: "analizci34", totalAmount: 720, lastBidAt: NOW - 3 * H },
    ],
    status: "active",
  },
  {
    id: "auc3",
    name: "Yıldız Avcısı Ünvanı",
    category: "Ünvan",
    accent: "#8b5cf6",
    endsAt: NOW + 49 * H,
    starterBid: 100,
    currentBid: 420,
    highestBidderId: "ecoentry",
    highestBidderUsername: "ecoentry",
    participantCount: 3,
    bids: [
      { userId: "ecoentry", username: "ecoentry", totalAmount: 420, lastBidAt: NOW - 2 * H },
      { userId: "fragusta", username: "fragusta", totalAmount: 250, lastBidAt: NOW - 5 * H },
    ],
    status: "active",
  },
];
