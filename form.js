// ── Invio del modulo contatti senza uscire dal sito ──
//
// Prima il modulo faceva una POST vera a api.web3forms.com, che poi
// rimandava a /grazie: il browser usciva dal sito e rientrava. Per
// Analytics web3forms diventava percio' un sito che ci porta traffico,
// e ogni richiesta apriva una sessione nuova attribuita a lui, invece
// che a chi aveva davvero portato la persona - Google, ChatGPT Ads,
// LinkedIn. Qui l'invio parte in background e il browser non si muove,
// quindi la sessione non si spezza e l'origine resta quella vera.
//
// La riserva e' l'invio classico: se il JavaScript non c'e', se fetch
// non c'e', o se la rete cade, il modulo torna a funzionare come prima.
// Nel caso peggiore arrivano due email invece di zero richieste.
(function () {
  'use strict';

  var MARCA = 'fg_lead_inviata';   // lo legge /grazie per non ricontare
  var INVIO = { it: 'Invio…', en: 'Sending…', es: 'Enviando…', pt: 'Enviando…' };

  if (!window.fetch || !window.FormData || !window.FormData.prototype.delete) return;

  function lingua() {
    var l = (document.documentElement.getAttribute('lang') || 'it').slice(0, 2);
    return /^(it|en|es|pt)$/.test(l) ? l : 'it';
  }

  function misura() {
    // L'evento parte qui, una volta per invio riuscito, e non al
    // caricamento di /grazie: li' lo rifaceva partire ogni ricarica.
    try {
      if (window.gtag) gtag('event', 'generate_lead',
        { method: 'web3forms', form: 'contatti', language: lingua() });
    } catch (e) {}
    try {
      if (window.oaiq) oaiq('measure', 'lead_created', { type: 'customer_action' });
    } catch (e) {}
  }

  document.addEventListener('submit', function (e) {
    var f = e.target;
    if (!f || f.tagName !== 'FORM' || f.getAttribute('data-inviato')) return;
    if ((f.getAttribute('action') || '').indexOf('api.web3forms.com') < 0) return;

    var dati = new FormData(f);
    // Col campo redirect l'API risponde con un rinvio al nostro sito, e
    // la fetch si fermerebbe sulle regole CORS, che su /grazie non ci
    // sono. Togliendolo l'API risponde in JSON, come vuole lei per gli
    // invii in background.
    var dove = dati.get('redirect') || '/grazie';
    dati.delete('redirect');

    e.preventDefault();
    f.setAttribute('data-inviato', '1');

    var tasto = f.querySelector('[type="submit"]');
    var prima = null;
    if (tasto) {
      prima = tasto.innerHTML;
      tasto.disabled = true;
      tasto.textContent = INVIO[lingua()];
    }

    function allaVecchiaManiera() {
      f.removeAttribute('data-inviato');
      if (tasto) { tasto.disabled = false; tasto.innerHTML = prima; }
      f.submit();           // non ripassa di qui: submit() non scatena l'evento
    }

    fetch(f.action, {
      method: 'POST',
      body: dati,
      headers: { Accept: 'application/json' }
    }).then(function (r) {
      // Basta che il server l'abbia presa. Se la risposta e' arrivata ma
      // non si capisce, NON si reinvia: la richiesta e' gia' partita e
      // si manderebbe due volte.
      if (!r.ok) throw new Error(r.status);
      misura();
      try { sessionStorage.setItem(MARCA, String(Date.now())); } catch (er) {}
      location.href = dove;
    }).catch(allaVecchiaManiera);
  }, true);
})();
