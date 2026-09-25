import { useState, useRef } from "react";
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
  // Ultimo valore scritto: più aggiornamenti funzionali nello stesso evento
  // (es. l'assistente che registra pagamenti su due commesse) devono
  // comporsi, non ripartire tutti dal valore del render precedente.
  const latestRef = useRef(storedValue);

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(latestRef.current) : value;
      latestRef.current = valueToStore;
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
