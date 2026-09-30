// Manda una copia della lead a /api/lead, che la recapita su Telegram o via
// email dal nostro dominio.
//
// Non blocca l'invio: il form prosegue normalmente verso Web3Forms e il
// visitatore arriva sulla pagina di ringraziamento come sempre. Finche' il
// nuovo canale non e' collaudato le due strade convivono, cosi' nessuna lead
// puo' andare persa. keepalive tiene viva la richiesta anche mentre il
// browser sta gia' cambiando pagina.
(function () {
  document.addEventListener('submit', function (e) {
    var f = e.target;
    if (!f || f.tagName !== 'FORM') return;
    if (String(f.action || '').indexOf('web3forms') === -1) return;
    try {
      var dati = {};
      new FormData(f).forEach(function (v, k) {
        if (k === 'access_key' || k === 'redirect' || k === 'subject') return;
        dati[k] = v;
      });
      dati._page = location.pathname;
      fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dati),
        keepalive: true
      }).catch(function () {});
    } catch (err) { /* mai fermare l'invio del form */ }
  }, true);
})();
