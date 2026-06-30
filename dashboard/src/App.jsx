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
import { loadFromSupabase, enableSync } from "./lib/supabase";
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

// Migrazione idempotente dei dati "setup": applica i seed/correzioni una volta
// sola. Funzione pura, così la possiamo applicare sia ai dati locali sia a
// quelli appena caricati dal cloud.
function migrateSetup(prev) {
  const existingIds = new Set((prev.costiFissi || []).map((c) => c.id));
  const toAdd = NEW_COSTS.filter((c) => !existingIds.has(c.id));
  const needsCassa = prev.cassaIniziale === undefined || prev.cassaIniziale === null;
  const needsCrypto = prev.crypto === undefined || prev.crypto === null;
  const needsCryptoV2 = !prev._cryptoV2;
  const existingMesi = new Set((prev.incassatoStorico || []).map((r) => r.mese.toLowerCase()));
  const storicoToAdd = STORICO_2026.filter((r) => !existingMesi.has(r.mese.toLowerCase()));
  if (toAdd.length === 0 && !needsCassa && !needsCrypto && !needsCryptoV2 && storicoToAdd.length === 0) return prev;
  return {
    ...prev,
    costiFissi: [...(prev.costiFissi || []), ...toAdd],
    incassatoStorico: [...(prev.incassatoStorico || []), ...storicoToAdd],
    ...(needsCassa ? { cassaIniziale: 17500 } : {}),
    ...(needsCrypto || needsCryptoV2 ? { crypto: 2000, cryptoAggiornato: "21/05/2026", _cryptoV2: true } : {}),
  };
}

export default function App() {
  const [unlocked, setUnlocked] = useState(false);
  const [backupBanner, setBackupBanner] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [commesse, setCommesse] = useLocalStorage("commesse", INITIAL_COMMESSE);
  const [setup, setSetup] = useLocalStorage("setup", INITIAL_SETUP);
  const [network, setNetwork] = useLocalStorage("network", INITIAL_NETWORK);
  const [view, setView] = useState("dashboard");

  useEffect(() => {
    setSetup((prev) => migrateSetup(prev));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Carica lo stato dal cloud (fonte di verità) e abilita il sync SOLO dopo
  // un caricamento riuscito. Se il caricamento fallisce non abilitiamo il sync
  // (per non sovrascrivere il cloud con i dati locali vecchi) e segnaliamo l'errore.
  const loadCloud = async () => {
    setLoadError(false);
    const rows = await loadFromSupabase();
    if (rows === null) {
      setLoadError(true);
      return;
    }
    rows.forEach(({ key, value }) => {
      if (key === "commesse") setCommesse(value);
      else if (key === "setup") setSetup(migrateSetup(value));
      else if (key === "network") setNetwork(value);
    });
    enableSync();
    // Cloud vuoto (primo avvio): semina con lo stato locale già migrato.
    if (rows.length === 0) {
      setCommesse(commesse);
      setSetup((prev) => migrateSetup(prev));
      setNetwork(network);
    }
  };

  const handleUnlock = async () => {
    const days = daysSinceLastBackup();
    if (days >= 7) {
      exportData();
    } else if (days >= 5) {
      setBackupBanner(true);
    }
    setUnlocked(true);
    await loadCloud();
  };

  if (!unlocked) return <PinGate onUnlock={handleUnlock} />;

  return (
    <div className={styles.layout}>
      <Sidebar view={view} onNavigate={setView} />
      <main className={styles.main}>
        <div className={styles.mainInner}>
        {loadError && (
          <div className="notice warn" style={{ marginBottom: "var(--gap)", justifyContent: "space-between" }}>
            <span className="lab">Impossibile caricare i dati dal cloud — stai vedendo una copia locale che potrebbe non essere aggiornata. Non modificare nulla finché non ricarichi.</span>
            <button className="btn btn-ghost" onClick={loadCloud}>Riprova</button>
          </div>
        )}
        {backupBanner && (
          <div className="notice warn" style={{ marginBottom: "var(--gap)", justifyContent: "space-between" }}>
            <span className="lab">Backup non recente — scarica una copia dei tuoi dati</span>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-ghost" onClick={() => { exportData(); setBackupBanner(false); }}>
                Scarica ora
              </button>
              <button className="btn btn-quiet" onClick={() => setBackupBanner(false)}>
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
        </div>
      </main>
    </div>
  );
}
