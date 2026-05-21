import { useState, useEffect } from "react";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { INITIAL_COMMESSE, INITIAL_SETUP } from "./data/initialData";
import Sidebar from "./components/Sidebar/Sidebar";
import Dashboard from "./components/Dashboard/Dashboard";
import Commesse from "./components/Commesse/Commesse";
import Fiscale from "./components/Fiscale/Fiscale";
import Setup from "./components/Setup/Setup";
import styles from "./App.module.css";

const NEW_COSTS = [
  { id: 10, nome: "Supporto ai figli", importo: 250, tipo: "annuale", importoAnnuale: 3000 },
  { id: 11, nome: "Bollo Lancia Y", importo: 13, tipo: "annuale", importoAnnuale: 150 },
  { id: 12, nome: "Assicurazione Lancia", importo: 35, tipo: "annuale", importoAnnuale: 420 },
  { id: 13, nome: "Assicurazione sanitaria Allianz", importo: 83, tipo: "annuale", importoAnnuale: 1000 },
  { id: 14, nome: "Assicurazione infortuni AXA", importo: 17, tipo: "annuale", importoAnnuale: 200 },
];

export default function App() {
  const [commesse, setCommesse] = useLocalStorage("commesse", INITIAL_COMMESSE);
  const [setup, setSetup] = useLocalStorage("setup", INITIAL_SETUP);
  const [view, setView] = useState("dashboard");
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    setSetup((prev) => {
      const existingIds = new Set((prev.costiFissi || []).map((c) => c.id));
      const toAdd = NEW_COSTS.filter((c) => !existingIds.has(c.id));
      const needsCassa = prev.cassaIniziale === undefined || prev.cassaIniziale === null;
      const needsCrypto = prev.crypto === undefined || prev.crypto === null;
      const needsCryptoV2 = !prev._cryptoV2; // forza aggiornamento a 2000€ del 21/05/2026
      if (toAdd.length === 0 && !needsCassa && !needsCrypto && !needsCryptoV2) return prev;
      return {
        ...prev,
        costiFissi: [...(prev.costiFissi || []), ...toAdd],
        ...(needsCassa ? { cassaIniziale: 17500 } : {}),
        ...(needsCrypto || needsCryptoV2 ? { crypto: 2000, cryptoAggiornato: "21/05/2026", _cryptoV2: true } : {}),
      };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (setup.pin && !unlocked) {
    return <PinLock onUnlock={() => setUnlocked(true)} correctPin={setup.pin} />;
  }

  return (
    <div className={styles.layout}>
      <Sidebar view={view} onNavigate={setView} />
      <main className={styles.main}>
        {view === "dashboard" && (
          <Dashboard commesse={commesse} setup={setup} setSetup={setSetup} />
        )}
        {view === "commesse" && (
          <Commesse
            commesse={commesse}
            setCommesse={setCommesse}
            setup={setup}
          />
        )}
        {view === "fiscale" && (
          <Fiscale setup={setup} />
        )}
        {view === "setup" && (
          <Setup setup={setup} setSetup={setSetup} />
        )}
      </main>
    </div>
  );
}

function PinLock({ correctPin, onUnlock }) {
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    if (input === correctPin) {
      onUnlock();
    } else {
      setError(true);
      setInput("");
      setTimeout(() => setError(false), 1800);
    }
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "#0b1120",
    }}>
      <div style={{
        background: "#111827", border: "1px solid rgba(255,255,255,.1)", borderRadius: 16,
        padding: "2.5rem 2rem", width: "100%", maxWidth: 340, textAlign: "center",
      }}>
        <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🔒</div>
        <h1 style={{ color: "#e2e8f0", fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.35rem" }}>
          Dashboard
        </h1>
        <p style={{ color: "#64748b", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
          Inserisci il PIN per accedere
        </p>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <input
            type="password"
            inputMode="numeric"
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="••••"
            style={{
              background: error ? "rgba(239,68,68,.08)" : "rgba(255,255,255,.05)",
              border: `1px solid ${error ? "#ef4444" : "rgba(255,255,255,.12)"}`,
              borderRadius: 8, padding: "0.65rem 1rem", color: "#e2e8f0",
              fontSize: "1.25rem", letterSpacing: "0.3em", textAlign: "center",
              outline: "none", transition: "border-color .2s",
            }}
          />
          {error && (
            <p style={{ color: "#ef4444", fontSize: "0.8rem", margin: 0 }}>PIN errato</p>
          )}
          <button
            type="submit"
            style={{
              background: "rgba(200,169,110,0.15)", border: "1px solid rgba(200,169,110,0.35)",
              color: "#c8a96e", borderRadius: 8, padding: "0.65rem", fontSize: "0.9rem",
              fontWeight: 600, cursor: "pointer",
            }}
          >
            Sblocca
          </button>
        </form>
      </div>
    </div>
  );
}
