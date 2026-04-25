/**
 * Supabase veritabanı şeması için TypeScript tip tanımları.
 *
 * Bu dosya elle yazılmıştır; Faz 3'te Supabase CLI ile otomatik
 * üretilebilir:
 *   npx supabase gen types typescript --project-id <id> > src/lib/database.types.ts
 */

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string | null;
          display_name: string;
          bio: string;
          avatar_code: string;
          title_text: string;
          frame_color: string;
          role: "user" | "moderator" | "admin";
          permissions: string[];
          profile_completed: boolean;
          is_banned: boolean;
          banned_until: string | null;
          email_verified: boolean;
          email_verified_at: string | null;
          created_at: string;
          last_seen_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          display_name?: string;
          bio?: string;
          avatar_code?: string;
          title_text?: string;
          frame_color?: string;
          role?: "user" | "moderator" | "admin";
          permissions?: string[];
          profile_completed?: boolean;
          is_banned?: boolean;
          banned_until?: string | null;
          email_verified?: boolean;
          email_verified_at?: string | null;
          created_at?: string;
          last_seen_at?: string;
        };
        Update: {
          username?: string | null;
          display_name?: string;
          bio?: string;
          avatar_code?: string;
          title_text?: string;
          frame_color?: string;
          profile_completed?: boolean;
          last_seen_at?: string;
        };
        Relationships: [];
      };

      seasons: {
        Row: {
          id: number;
          season_number: number;
          phase: "prediction" | "result" | "auction" | "ended";
          prediction_starts_at: string;
          result_starts_at: string;
          auction_starts_at: string;
          ended_at: string | null;
          created_at: string;
        };
        Insert: {
          season_number: number;
          phase?: "prediction" | "result" | "auction" | "ended";
          prediction_starts_at: string;
          result_starts_at: string;
          auction_starts_at: string;
          ended_at?: string | null;
          created_at?: string;
        };
        Update: {
          phase?: "prediction" | "result" | "auction" | "ended";
          ended_at?: string | null;
        };
        Relationships: [];
      };

      wallets: {
        Row: {
          id: string;
          user_id: string;
          season_id: number;
          tp_balance: number;
          kp_balance: number;
          tp_earned_total: number;
          kp_earned_total: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          season_id: number;
          tp_balance?: number;
          kp_balance?: number;
          tp_earned_total?: number;
          kp_earned_total?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          tp_balance?: number;
          kp_balance?: number;
          tp_earned_total?: number;
          kp_earned_total?: number;
          updated_at?: string;
        };
        Relationships: [];
      };

      tp_transactions: {
        Row: {
          id: string;
          user_id: string;
          season_id: number;
          type: string;
          amount: number;
          balance_after: number;
          reference_id: string | null;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          season_id: number;
          type: string;
          amount: number;
          balance_after: number;
          reference_id?: string | null;
          note?: string | null;
          created_at?: string;
        };
        Update: Record<string, never>;
        Relationships: [];
      };

      kp_transactions: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          amount: number;
          balance_after: number;
          reference_id: string | null;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          amount: number;
          balance_after: number;
          reference_id?: string | null;
          note?: string | null;
          created_at?: string;
        };
        Update: Record<string, never>;
        Relationships: [];
      };

      relationships: {
        Row: {
          id: string;
          user_id: string;
          target_user_id: string;
          status: "pending" | "friends" | "blocked";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          target_user_id: string;
          status: "pending" | "friends" | "blocked";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: "pending" | "friends" | "blocked";
          updated_at?: string;
        };
        Relationships: [];
      };
    };

    Views: Record<string, never>;

    Functions: {
      get_active_season: {
        Args: Record<string, never>;
        Returns: Database["public"]["Tables"]["seasons"]["Row"];
      };
      get_active_wallet: {
        Args: { p_user_id: string };
        Returns: Database["public"]["Tables"]["wallets"]["Row"];
      };
    };
  };
};
