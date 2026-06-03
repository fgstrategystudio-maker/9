import { useState } from "react";
import { syncToSupabase } from "../lib/supabase";

const SYNC_KEYS = ["commesse", "setup", "network"]

export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
      if (SYNC_KEYS.includes(key)) {
        syncToSupabase(key, valueToStore)
      }
    } catch (error) {
      console.error("localStorage write error:", error);
    }
  };

  return [storedValue, setValue];
}
