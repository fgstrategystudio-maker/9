import { useState, useEffect } from "react";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { INITIAL_COMMESSE, INITIAL_SETUP, INITIAL_NETWORK } from "./data/initialData";
import Sidebar from "./components/Sidebar/Sidebar";
import Dashboard from "./components/Dashboard/Dashboard";
import Commesse from "./components/Commesse/Commesse";
import Fiscale from "./components/Fiscale/Fiscale";
import Setup from "./components/Setup/Setup";
import Network from "./components/Network/Network";
import PinGate from "./components/PinGate/PinGate";
import styles from "./App.module.css";
import { loadFromSupabase } from "./lib/supabase";
import { daysSinceLastBackup, exportData } from "./lib/backup";

const NEW_COSTS = [
  { id: 10, nome: "Supporto ai figli", importo: 250, tipo: "annuale", importoAnnuale: 3000 },
  { id: 11, nome: "Bollo Lancia Y", importo: 13, tipo: "annuale", importoAnnuale: 150 },
  { id: 12, nome: "Assicurazione Lancia", importo: 35, tipo: "annuale", importoAnnuale: 420 },
  { id: 13, nome: "Assicurazione sanitaria Allianz", importo: 83, tipo: "annuale", importoAnnuale: 1000 },
  { id: 14, nome: "Assicurazione infortuni AXA", importo: 17, tipo: "annuale", importoAnnuale: 200 },
];

// lordo per mese, netto calcolato al 65%
const STORICO_2026 = [
  { mese: "Gennaio 2026",  lordo: 1750, netto: 1138 },
  { mese: "Febbraio 2026", lordo: 1750, netto: 1138 },
  { mese: "Marzo 2026",    lordo: 1750, netto: 1138 },
  { mese: "Aprile 2026",   lordo: 2020, netto: 1313 },
  { mese: "Maggio 2026",   lordo: 2140, netto: 1391 },
];

export default function App() {
  const [unlocked, setUnlocked] = useState(false);
  const [backupBanner, setBackupBanner] = useState(false);
  const [commesse, setCommesse] = useLocalStorage("commesse", INITIAL_COMMESSE);
  const [setup, setSetup] = useLocalStorage("setup", INITIAL_SETUP);
  const [network, setNetwork] = useLocalStorage("network", INITIAL_NETWORK);
  const [view, setView] = useState("dashboard");

  useEffect(() => {
    setSetup((prev) => {
      const existingIds = new Set((prev.costiFissi || []).map((c) => c.id));
      const toAdd = NEW_COSTS.filter((c) => !existingIds.has(c.id));
      const needsCassa = prev.cassaIniziale === undefined || prev.cassaIniziale === null;
      const needsCrypto = prev.crypto === undefined || prev.crypto === null;
      const needsCryptoV2 = !prev._cryptoV2;
      const existingMesi = new Set((prev.incassatoStorico || []).map((r) => r.mese.toLowerCase()));
      const storicoToAdd = STORICO_2026.filter((r) => !existingMesi.has(r.mese.toLowerCase()));
      const storicoSenzaGiugno = (prev.incassatoStorico || []).filter(
        (r) => r.mese.toLowerCase() !== "giugno 2026"
      );
      const giugnoRimosso = storicoSenzaGiugno.length !== (prev.incassatoStorico || []).length;
      if (toAdd.length === 0 && !needsCassa && !needsCrypto && !needsCryptoV2 && storicoToAdd.length === 0 && !giugnoRimosso) return prev;
      return {
        ...prev,
        costiFissi: [...(prev.costiFissi || []), ...toAdd],
        incassatoStorico: [...storicoSenzaGiugno, ...storicoToAdd],
        ...(needsCassa ? { cassaIniziale: 17500 } : {}),
        ...(needsCrypto || needsCryptoV2 ? { crypto: 2000, cryptoAggiornato: "21/05/2026", _cryptoV2: true } : {}),
      };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUnlock = async () => {
    const days = daysSinceLastBackup();
    if (days >= 7) {
      exportData();
    } else if (days >= 5) {
      setBackupBanner(true);
    }
    setUnlocked(true);
    const rows = await loadFromSupabase();
    if (rows && rows.length > 0) {
      rows.forEach(({ key, value }) => {
        if (key === "commesse") setCommesse(value);
        else if (key === "setup") setSetup((prev) => ({
          ...value,
          incassatoStorico: (value.incassatoStorico || []).filter(
            (r) => r.mese.toLowerCase() !== "giugno 2026"
          ),
        }));
        else if (key === "network") setNetwork(value);
      });
    }
  };

  if (!unlocked) return <PinGate onUnlock={handleUnlock} />;

  return (
    <div className={styles.layout}>
      <Sidebar view={view} onNavigate={setView} />
      <main className={styles.main}>
        {backupBanner && (
          <div style={{
            background: "rgba(245,158,11,0.12)",
            border: "1px solid rgba(245,158,11,0.35)",
            borderRadius: 8,
            padding: "0.7rem 1rem",
            marginBottom: "1.25rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "0.5rem",
          }}>
            <span style={{ color: "#fbbf24", fontSize: "0.875rem" }}>
              Backup non recente — scarica una copia dei tuoi dati
            </span>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                onClick={() => { exportData(); setBackupBanner(false); }}
                style={{ background: "rgba(245,158,11,0.2)", border: "1px solid rgba(245,158,11,0.4)", color: "#fbbf24", borderRadius: 6, padding: "0.35rem 0.75rem", fontSize: "0.8rem", cursor: "pointer" }}
              >
                Scarica ora
              </button>
              <button
                onClick={() => setBackupBanner(false)}
                style={{ background: "transparent", border: "none", color: "#94a3b8", fontSize: "1.1rem", cursor: "pointer", padding: "0 0.25rem" }}
              >
                ✕
              </button>
            </div>
          </div>
        )}
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
        {view === "network" && (
          <Network network={network} setNetwork={setNetwork} />
        )}
      </main>
    </div>
  );
}
