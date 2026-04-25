import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Supabase bağlantı bilgileri eksik. .env dosyasında " +
      "EXPO_PUBLIC_SUPABASE_URL ve EXPO_PUBLIC_SUPABASE_KEY tanımlı olmalı."
  );
}

const isWeb = typeof document !== "undefined";
const isNative = !isWeb && typeof window !== "undefined";

const options: any = {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: isWeb,
  },
};

if (isNative) {
  try {
    // React Native: AsyncStorage. Web'de Supabase kendi default localStorage
    // adapter'ını kullansın — AsyncStorage'ın web wrapper'ı ilk yüklemede
    // localStorage'a erişmeden önce promise zincirinde takılabiliyor.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const AsyncStorage = require("@react-native-async-storage/async-storage").default;
    options.auth.storage = AsyncStorage;
  } catch (e) {
    // AsyncStorage yoksa default storage'a geri dön.
  }
}

/** Supabase istemcisi — uygulama genelinde tek örnek (singleton). */
export const supabase = createClient<Database>(supabaseUrl, supabaseKey, options);
