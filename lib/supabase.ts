import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import Constants from "expo-constants";
import { Platform } from "react-native";
import "react-native-url-polyfill/auto";

const extra = Constants.expoConfig?.extra as {
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
};

const isBrowser = typeof window !== "undefined";

const memoryStorage = () => {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => Promise.resolve(store.get(key) ?? null),
    setItem: (key: string, value: string) => {
      store.set(key, value);
      return Promise.resolve();
    },
    removeItem: (key: string) => {
      store.delete(key);
      return Promise.resolve();
    },
  };
};

const webStorage = {
  getItem: (key: string) =>
    Promise.resolve(isBrowser ? window.localStorage.getItem(key) : null),
  setItem: (key: string, value: string) => {
    if (isBrowser) window.localStorage.setItem(key, value);
    return Promise.resolve();
  },
  removeItem: (key: string) => {
    if (isBrowser) window.localStorage.removeItem(key);
    return Promise.resolve();
  },
};

const storage =
  Platform.OS === "web"
    ? isBrowser
      ? webStorage
      : memoryStorage()
    : AsyncStorage;

export const supabase = createClient(
  extra.SUPABASE_URL!,
  extra.SUPABASE_ANON_KEY!,
  {
    auth: {
      storage,
      persistSession: Platform.OS !== "web" ? true : isBrowser,
      autoRefreshToken: Platform.OS !== "web" ? true : isBrowser,
      detectSessionInUrl: false,
    },
  },
);
