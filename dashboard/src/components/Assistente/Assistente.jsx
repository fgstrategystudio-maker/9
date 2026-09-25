import { useState, useRef } from "react";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { getMeseCorrente, pagamentiDelMese, stessoMese, etichettaMese, chiaveMese } from "../../utils/helpers";
import Icon from "../Icon";
import styles from "./Assistente.module.css";

const nf = new Intl.NumberFormat("it-IT");
const fmtN = (n) => nf.format(Math.round(n ?? 0));

const STATI = ["In corso", "In scadenza", "Da chiarire", "Sospeso", "Concluso", "Perso"];
const CAMPI_NUM = ["lordoMensile", "lordoProgetto", "oreMensili", "upsellTarget"];
const CAMPI_STR = ["stato", "tipo", "inizio", "fine", "priorita", "servizio", "note"];
const CAMPI_BOOL = ["splitMezzoMese"];
const LABEL_CAMPO = {
  lordoMensile: "Fee lorda mensile", lordoProgetto: "Lordo progetto", oreMensili: "Ore/mese",
  upsellTarget: "Upsell target", stato: "Stato", tipo: "Tipo", inizio: "Inizio", fine: "Fine",
  splitMezzoMese: "Split 50/50", priorita: "Priorità", servizio: "Servizio", note: "Note",
};

const ESEMPI = [
  "Grano mi ha pagato 500 invece di 800 questo mese",
  "L'Assistedile rinnova a 1.200 €/mese fino a dicembre",
  "Segna conclusa la commessa Sering",
];

export default function Assistente({ commesse, setCommesse, setup, setSetup }) {
  const [open, setOpen] = useState(false);
  const [testo, setTesto] = useState("");
  const [loading, setLoading] = useState(false);
  const [errore, setErrore] = useState(null);
  const [proposta, setProposta] = useState(null);
  const [esito, setEsito] = useState(null);
  const [modalita, setModalita] = useLocalStorage("assistenteModalita", "veloce");
  const [elapsedMs, setElapsedMs] = useState(0);
  const [tempo, setTempo] = useState(null); // { ms, modello, fallback }
  const timerRef = useRef(null);

  const secondi = (ms) => (ms / 1000).toFixed(1).replace(".", ",");

  const byId = (id) => commesse.find((c) => c.id === id);
  const meseCorrente = getMeseCorrente();

  // Controllo di coerenza: per ogni totale mese proposto, confronta con la
  // somma dei pagamenti per cliente (già registrati + nuovi nella proposta).
  function avvisiCoerenza(azioni) {
    const avvisi = [];
    for (const inc of azioni.filter((a) => a.tipo === "registra_incasso" && a.mese)) {
      const esistenti = pagamentiDelMese(commesse, inc.mese).reduce((s, p) => s + p.importo, 0);
      const nuovi = azioni
        .filter((a) => a.tipo === "registra_pagamento" && stessoMese(a.mese, inc.mese) && byId(a.id))
        .reduce((s, a) => s + (Number(a.importo) || 0), 0);
      const somma = esistenti + nuovi;
      if (somma > 0 && Math.round(somma) !== Math.round(Number(inc.lordo))) {
        avvisi.push(
          `Attenzione: il totale proposto per ${inc.mese} è ${fmtN(inc.lordo)} €, ma la somma dei pagamenti per cliente è ${fmtN(somma)} €` +
          ` (${fmtN(esistenti)} già registrati + ${fmtN(nuovi)} nuovi). Se mancano clienti va bene, altrimenti verifica prima di applicare.`
        );
      }
    }
    return avvisi;
  }

  function buildContesto() {
    return {
      oggi: new Date().toISOString().slice(0, 10),
      fattoreNetto: setup.fattoreNetto,
      commesse: commesse.map((c) => ({
        id: c.id, cliente: c.cliente, servizio: c.servizio, tipo: c.tipo, stato: c.stato,
        lordoMensile: c.lordoMensile, lordoProgetto: c.lordoProgetto,
        inizio: c.inizio, fine: c.fine, oreMensili: c.oreMensili,
        upsellTarget: c.upsellTarget, splitMezzoMese: !!c.splitMezzoMese,
        pagamenti: (c.pagamenti || []).map((p) => ({ mese: p.mese, importo: p.importo, nota: p.nota })),
      })),
      incassatoStorico: setup.incassatoStorico || [],
    };
  }

  async function chiedi() {
    if (!testo.trim() || loading) return;
    setLoading(true); setErrore(null); setProposta(null); setEsito(null); setTempo(null);
    const t0 = Date.now();
    setElapsedMs(0);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setElapsedMs(Date.now() - t0), 100);
    const ctrl = new AbortController();
    const timeoutId = setTimeout(() => ctrl.abort(), 65000);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: ctrl.signal,
        body: JSON.stringify({ istruzione: testo.trim(), contesto: buildContesto(), modalita }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (json.error === "missing_api_key") {
          setErrore("Assistente non configurato: crea una chiave gratuita su aistudio.google.com e aggiungila come GEMINI_API_KEY nelle variabili d'ambiente su Vercel, poi rideploya.");
        } else {
          setErrore("L'assistente non ha risposto. Riprova tra poco."
            + (json.message ? ` — dettaglio: ${String(json.message).slice(0, 220)}` : ""));
        }
        return;
      }
      const p = json.result;
      if (!p || !Array.isArray(p.azioni)) { setErrore("Risposta non valida dall'assistente."); return; }
      setTempo({ ms: Date.now() - t0, modello: json.modello, fallback: !!json.fallback });
      setProposta(p);
    } catch (err) {
      setErrore(err?.name === "AbortError"
        ? "L'assistente sta impiegando troppo tempo: richiesta interrotta. Riprova, o prova l'altra modalità."
        : "Connessione all'assistente fallita. Riprova.");
    } finally {
      clearTimeout(timeoutId);
      clearInterval(timerRef.current);
      setLoading(false);
    }
  }

  // Anteprima leggibile di un'azione (null = azione non applicabile, viene scartata)
  function descrivi(a) {
    if (a.tipo === "nessuna_azione") return { label: a.motivo || "Nessuna azione necessaria.", applicabile: false };
    if (a.tipo === "registra_pagamento") {
      const c = byId(a.id);
      const importo = Number(a.importo);
      if (!c || !chiaveMese(a.mese) || !(importo > 0)) return null;
      return {
        label: `Pagamento da «${c.cliente}» — ${etichettaMese(a.mese)}: ${fmtN(importo)} €${a.testo ? ` (${a.testo})` : ""}`,
        motivo: a.motivo, applicabile: true,
      };
    }
    if (a.tipo === "registra_incasso") {
      if (!chiaveMese(a.mese) || !(Number(a.lordo) >= 0)) return null;
      const esistente = (setup.incassatoStorico || []).find((r) => stessoMese(r.mese, a.mese));
      const netto = Math.round(Number(a.lordo) * setup.fattoreNetto);
      return {
        label: `${esistente ? "Aggiorna" : "Registra"} incasso ${etichettaMese(a.mese)}: ${fmtN(a.lordo)} € lordo (netto ${fmtN(netto)} €)` +
          (esistente ? ` — era ${fmtN(esistente.lordo)} €` : ""),
        motivo: a.motivo, applicabile: true,
      };
    }
    if (a.tipo === "aggiorna_commessa") {
      const c = byId(a.id);
      if (!c || !a.campi) return null;
      const cambi = Object.entries(a.campi)
        .filter(([k]) => CAMPI_NUM.includes(k) || CAMPI_STR.includes(k) || CAMPI_BOOL.includes(k))
        .filter(([k, v]) => !(k === "stato" && !STATI.includes(v)))
        .map(([k, v]) => `${LABEL_CAMPO[k] || k}: ${c[k] ?? "—"} → ${v}`);
      if (cambi.length === 0) return null;
      return { label: `Aggiorna «${c.cliente}» — ${cambi.join(" · ")}`, motivo: a.motivo, applicabile: true };
    }
    if (a.tipo === "aggiungi_nota") {
      const c = byId(a.id);
      if (!c || !a.testo) return null;
      return { label: `Nota su «${c.cliente}»: “${a.testo}”`, motivo: a.motivo, applicabile: true };
    }
    return null;
  }

  function applica() {
    const oggi = new Date().toLocaleDateString("it-IT");
    let applicate = 0;
    const riepilogo = [];
    for (const a of proposta.azioni) {
      if (!descrivi(a)?.applicabile) continue;
      if (a.tipo === "registra_pagamento") {
        const importo = Number(a.importo);
        const mese = etichettaMese(a.mese);
        const pagamento = { mese, importo, nota: a.testo || "", data: new Date().toISOString().slice(0, 10) };
        setCommesse((prev) => prev.map((c) =>
          c.id === a.id ? { ...c, pagamenti: [...(c.pagamenti || []), pagamento] } : c
        ));
        riepilogo.push(`Pagamento ${fmtN(importo)} € da «${byId(a.id)?.cliente}» (${mese}) → nel dettaglio della commessa, sezione «Incassi registrati»`);
        applicate++;
      } else if (a.tipo === "registra_incasso") {
        const lordo = Number(a.lordo);
        const mese = etichettaMese(a.mese);
        const eMeseCorrente = stessoMese(mese, meseCorrente);
        riepilogo.push(`Totale ${mese}: ${fmtN(lordo)} € lordo → ${eMeseCorrente ? "nei box del mese in alto, " : ""}in «Incassato storico», nella Panoramica e nella card anno su anno`);
        setSetup((prev) => {
          const netto = Math.round(lordo * prev.fattoreNetto);
          const rows = prev.incassatoStorico || [];
          // Sostituisce TUTTE le righe dello stesso mese (unifica eventuali doppioni)
          const altre = rows.filter((r) => !stessoMese(r.mese, mese));
          return { ...prev, incassatoStorico: [...altre, { mese, lordo, netto }] };
        });
        applicate++;
      } else if (a.tipo === "aggiorna_commessa") {
        const puliti = {};
        for (const [k, v] of Object.entries(a.campi || {})) {
          if (CAMPI_NUM.includes(k)) puliti[k] = v === null || v === "" ? null : Number(v);
          else if (CAMPI_BOOL.includes(k)) puliti[k] = !!v;
          else if (k === "stato") { if (STATI.includes(v)) puliti[k] = v; }
          else if (CAMPI_STR.includes(k)) puliti[k] = v == null ? null : String(v);
        }
        setCommesse((prev) => prev.map((c) => (c.id === a.id ? { ...c, ...puliti } : c)));
        riepilogo.push(`Commessa «${byId(a.id)?.cliente}» aggiornata → la vedi in Commesse (e nei box in alto se è cambiata la fee)`);
        applicate++;
      } else if (a.tipo === "aggiungi_nota") {
        setCommesse((prev) => prev.map((c) =>
          c.id === a.id ? { ...c, note: `${c.note ? c.note + "\n" : ""}[${oggi}] ${a.testo}` } : c
        ));
        riepilogo.push(`Nota aggiunta a «${byId(a.id)?.cliente}» → la vedi aprendo la commessa in Commesse`);
        applicate++;
      }
    }
    setProposta(null);
    setTesto("");
    setEsito(applicate > 0
      ? { titolo: `✓ ${applicate === 1 ? "Modifica applicata" : applicate + " modifiche applicate"} e salvate`, righe: riepilogo }
      : { titolo: "Nessuna modifica da applicare.", righe: [] });
  }

  const anteprime = proposta ? proposta.azioni.map(descrivi).filter(Boolean) : [];
  const avvisi = proposta ? avvisiCoerenza(proposta.azioni) : [];
  const applicabili = anteprime.filter((d) => d.applicabile).length;

  return (
    <section className="panel">
      <button className={styles.head} onClick={() => setOpen((v) => !v)}>
        <span className="panel-title"><Icon name="spark" size={15} />Assistente AI</span>
        <span className="panel-note">
          {open ? "chiudi ▲" : "scrivi cosa è successo, penso io ad aggiornare ▼"}
        </span>
      </button>

      {open && (
        <div className={styles.body}>
          <div className={styles.inputRow}>
            <textarea
              className="textarea"
              rows={2}
              placeholder='Es. "Grano mi ha pagato 500 invece di 800 questo mese"'
              value={testo}
              onChange={(e) => setTesto(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) chiedi(); }}
            />
            <button className="btn btn-primary" onClick={chiedi} disabled={loading || !testo.trim()}>
              {loading ? `Ci penso… ${secondi(elapsedMs)} s` : "Chiedi"}
            </button>
          </div>

          <div className={styles.modalitaRow}>
            <button
              className={modalita === "veloce" ? styles.modAttiva : styles.mod}
              onClick={() => setModalita("veloce")}
              type="button"
            >⚡ Veloce</button>
            <button
              className={modalita === "preciso" ? styles.modAttiva : styles.mod}
              onClick={() => setModalita("preciso")}
              type="button"
            >🎯 Preciso</button>
            <span className={styles.modHint}>
              {modalita === "veloce"
                ? "1–2 secondi, ideale tutti i giorni"
                : "più riflessivo, per richieste ambigue o complesse"}
            </span>
          </div>

          {!proposta && !loading && !errore && !esito && (
            <div className={styles.esempi}>
              {ESEMPI.map((e) => (
                <button key={e} className={styles.esempio} onClick={() => setTesto(e)}>{e}</button>
              ))}
            </div>
          )}

          {errore && <p className={styles.errore}>{errore}</p>}
          {esito && (
            <div className={styles.esito}>
              <div>{esito.titolo}</div>
              {esito.righe.length > 0 && (
                <ul className={styles.esitoRighe}>
                  {esito.righe.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              )}
              {esito.righe.some((r) => r.startsWith("Pagamento")) && !esito.righe.some((r) => r.startsWith("Totale")) && (
                <p className={styles.esitoNota}>
                  Nota: i pagamenti per cliente non cambiano da soli il totale del mese nello storico.
                  Per aggiornarlo chiedi all&apos;assistente «aggiorna il totale del mese» oppure correggilo in Setup → Storico incassato.
                </p>
              )}
            </div>
          )}

          {proposta && (
            <div className={styles.proposta}>
              <p className={styles.spiegazione}>{proposta.spiegazione}</p>
              {avvisi.map((w, i) => <p key={i} className={styles.avviso}>{w}</p>)}
              {tempo && (
                <p className={styles.tempoNota}>
                  risposta in {secondi(tempo.ms)} s
                  {tempo.fallback && " · modello predefinito occupato, usato quello alternativo"}
                </p>
              )}
              <ul className={styles.azioni}>
                {anteprime.map((d, i) => (
                  <li key={i} className={d.applicabile ? "" : styles.nonApplicabile}>
                    <Icon name={d.applicabile ? "check" : "alert"} size={14} />
                    <span>
                      {d.label}
                      {d.motivo && <span className={styles.motivo}> — {d.motivo}</span>}
                    </span>
                  </li>
                ))}
                {anteprime.length === 0 && <li className={styles.nonApplicabile}><Icon name="alert" size={14} /><span>Nessuna azione valida proposta.</span></li>}
              </ul>
              <div className={styles.azioniBar}>
                <button className="btn btn-ghost" onClick={() => setProposta(null)}>Annulla</button>
                {applicabili > 0 && (
                  <button className="btn btn-primary" onClick={applica}>
                    <Icon name="check" size={15} /> Applica {applicabili === 1 ? "la modifica" : `${applicabili} modifiche`}
                  </button>
                )}
              </div>
            </div>
          )}

          <p className={styles.disclaimer}>
            Le modifiche vengono applicate solo dopo la tua conferma. Controlla sempre i numeri proposti.
          </p>
        </div>
      )}
    </section>
  );
}
