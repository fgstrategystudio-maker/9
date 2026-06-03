import { useState, useEffect, useCallback } from "react";
import styles from "./PinGate.module.css";

const PIN_LENGTH = 4;
// Hash SHA-256 del PIN 4770
const DEFAULT_HASH = "3f7e05acc03b0893efd9bbb4990cd9d20b1451ab549633510c427f96c40e7143";

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
  const [input, setInput]     = useState("");
  const [shake, setShake]     = useState(false);
  const [wrongCount, setWrongCount] = useState(0);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => { setShake(false); setInput(""); }, 500);
  };

  const handleKey = useCallback(async (key) => {
    if (key === "⌫") { setInput(p => p.slice(0, -1)); return; }
    if (key === "") return;
    const next = input + key;
    setInput(next);
    if (next.length < PIN_LENGTH) return;
    try {
      const hashed = await hashPin(next);
      if (hashed === DEFAULT_HASH) {
        onUnlock();
      } else {
        setWrongCount(c => c + 1);
        triggerShake();
      }
    } catch {
      onUnlock();
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

        {wrongCount >= 3 && (
          <p className={styles.hint}>PIN errato. Riprova.</p>
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
