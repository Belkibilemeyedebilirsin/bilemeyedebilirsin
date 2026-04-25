export type RelativeTimeInput = {
  agoMinutes?: number;
  createdAt?: number;
};

export function formatRelativeTime(
  input: RelativeTimeInput,
  nowTs = Date.now()
) {
  let minutes = 0;

  if (typeof input.createdAt === "number") {
    minutes = Math.max(0, Math.floor((nowTs - input.createdAt) / 60000));
  } else {
    minutes = Math.max(0, input.agoMinutes ?? 0);
  }

  if (minutes < 1) return "şimdi";
  if (minutes < 60) return `${minutes}dk önce`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}sa önce`;

  const days = Math.floor(hours / 24);
  return `${days}g önce`;
}

/* Eski importlar bozulmasın diye bunu da bırakıyoruz */
export function formatRelativeAgo(agoMinutes?: number) {
  return formatRelativeTime({ agoMinutes });
}

/** Kapanış zamanına kalan süreyi formatlar: "1g 3s", "2s 14dk", "45dk", "Kapandı" */
export function formatTimeLeft(closesAt: number, nowTs = Date.now()): string {
  const diff = closesAt - nowTs;
  if (diff <= 0) return "Kapandı";

  const totalMinutes = Math.floor(diff / 60_000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return hours > 0 ? `${days}g ${hours}s` : `${days}g`;
  if (hours > 0) return minutes > 0 ? `${hours}s ${minutes}dk` : `${hours}s`;
  return `${totalMinutes < 1 ? "<1" : totalMinutes}dk`;
}