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
