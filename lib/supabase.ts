import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import Constants from "expo-constants";
import { Platform } from "react-native";
import "react-native-url-polyfill/auto";

const extra = Constants.expoConfig?.extra as { SUPABASE_URL?: string; SUPABASE_ANON_KEY?: string };

const storage =
  Platform.OS === "web"
    ? {
        getItem: (key: string) =>
          typeof window !== "undefined"
            ? Promise.resolve(window.localStorage.getItem(key))
            : Promise.resolve(null),
        setItem: (key: string, value: string) =>
          typeof window !== "undefined"
            ? Promise.resolve(window.localStorage.setItem(key, value))
            : Promise.resolve(),
        removeItem: (key: string) =>
          typeof window !== "undefined"
            ? Promise.resolve(window.localStorage.removeItem(key))
            : Promise.resolve(),
      }
    : AsyncStorage;

export const supabase = createClient(extra.SUPABASE_URL!, extra.SUPABASE_ANON_KEY!, {
  auth: {
    storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === "web",
  },
});