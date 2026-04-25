import { supabase } from "../lib/supabase";

/**
 * Kullanıcının aktif bir ban (veya isteğe bağlı mute) cezası olup olmadığını kontrol eder.
 */
export async function checkUserRestriction(userId: string, actionType: "ban" | "mute" = "ban"): Promise<{ restricted: boolean; reason?: string }> {
  const { data, error } = await (supabase as any)
    .from("moderation_records")
    .select("reason, expires_at")
    .eq("user_id", userId)
    .eq("action_type", actionType)
    .eq("is_active", true)
    .or(`expires_at.is.null,expires_at.gte.${new Date().toISOString()}`)
    .limit(1)
    .maybeSingle();

  if (data) {
    return { restricted: true, reason: data.reason || "Kural ihlali nedeniyle erişiminiz kısıtlandı." };
  }
  return { restricted: false };
}