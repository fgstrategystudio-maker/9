import { useState, useEffect, useCallback } from "react";
import styles from "./PinGate.module.css";

const PIN_LENGTH = 4;
// Hash SHA-256 del PIN 4770
const DEFAULT_HASH = "3f7e05acc03b0893efd9bbb4990cd9d20b1451ab549633510c427f96c40e7143";

const MAX_ATTEMPTS = 10;
const LOCK_MINUTES = 5;
const FAILS_KEY = "freelance_pin_fails";

function getFails() {
  try { return JSON.parse(localStorage.getItem(FAILS_KEY)) || { count: 0, lockedUntil: 0 }; }
  catch { return { count: 0, lockedUntil: 0 }; }
}
function lockedMinutes() {
  const f = getFails();
  return f.lockedUntil > Date.now() ? Math.ceil((f.lockedUntil - Date.now()) / 60000) : 0;
}

const KEYS = [
  ["1","2","3"],
  ["4","5","6"],
  ["7","8","9"],
  [""  ,"0","⌫"],
];

async function hashPin(pin) {
  const data = new TextEncoder().encode(pin);
  const buf  = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

export default function PinGate({ onUnlock }) {
  const [input, setInput]   = useState("");
  const [shake, setShake]   = useState(false);
  const [message, setMessage] = useState("");

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => { setShake(false); setInput(""); }, 500);
  };

  const handleKey = useCallback(async (key) => {
    if (key === "⌫") { setInput(p => p.slice(0, -1)); return; }
    if (key === "") return;
    const lockMin = lockedMinutes();
    if (lockMin) {
      setMessage(`Troppi tentativi. Riprova tra ${lockMin} min`);
      return;
    }
    const next = input + key;
    setInput(next);
    if (next.length < PIN_LENGTH) return;
    let hashed = null;
    try { hashed = await hashPin(next); } catch { /* crypto non disponibile */ }
    if (hashed === DEFAULT_HASH) {
      localStorage.removeItem(FAILS_KEY);
      onUnlock();
    } else {
      const f = getFails();
      const count = f.count + 1;
      if (count >= MAX_ATTEMPTS) {
        localStorage.setItem(FAILS_KEY, JSON.stringify({ count: 0, lockedUntil: Date.now() + LOCK_MINUTES * 60000 }));
        setMessage(`Troppi tentativi. Bloccato per ${LOCK_MINUTES} min`);
      } else {
        localStorage.setItem(FAILS_KEY, JSON.stringify({ count, lockedUntil: 0 }));
        setMessage(`PIN errato (${MAX_ATTEMPTS - count} tentativi rimasti)`);
      }
      triggerShake();
    }
  }, [input, onUnlock]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key >= "0" && e.key <= "9") handleKey(e.key);
      if (e.key === "Backspace") handleKey("⌫");
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleKey]);

  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <div className={styles.logo}>◆</div>
        <h1 className={styles.title}>Freelance Dashboard</h1>
        <p className={styles.subtitle}>Inserisci il PIN per accedere</p>

        <div className={`${styles.dots} ${shake ? styles.shake : ""}`}>
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <div key={i} className={`${styles.dot} ${i < input.length ? styles.dotFilled : ""}`} />
          ))}
        </div>

        {message && (
          <p className={styles.hint}>{message}</p>
        )}

        <div className={styles.keypad}>
          {KEYS.map((row, ri) => (
            <div key={ri} className={styles.keyRow}>
              {row.map((key, ki) => (
                <button
                  key={ki}
                  className={`${styles.key} ${key === "" ? styles.keyEmpty : ""} ${key === "⌫" ? styles.keyDel : ""}`}
                  onClick={() => handleKey(key)}
                  disabled={key === ""}
                >
                  {key}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
