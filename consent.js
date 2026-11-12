// ── Consenso cookie (GDPR / Consent Mode v2) ──
//
// Tre categorie: necessari (sempre attivi), analitici (Google Analytics) e
// marketing (pixel ChatGPT Ads). Finche' non si sceglie, gtag resta su
// 'denied' per tutto e lo script del pixel non viene nemmeno scaricato: e'
// fgLoadAds, definita nella <head> di ogni pagina, a iniettarlo dopo.
//
// Due chiavi, e il motivo per cui sono due:
//   fg_consent       'granted' | 'denied', e vale solo per il MARKETING.
//                    La legge lo snippet del pixel nella <head> di ogni
//                    pagina del sito: il nome e il significato non si
//                    toccano, o quelle pagine andrebbero riscritte tutte.
//   fg_consent_pref  {"a":bool,"m":bool,...}, la scelta per categoria.
//
// Lo stile sta qui dentro e non nei fogli del sito: il banner nasce da
// questo script, e averlo scritto in quattro CSS diversi voleva dire
// quattro banner leggermente diversi sulla stessa cosa, che per
// un'informativa e' il posto sbagliato dove avere varianti.
(function () {
  'use strict';

  var CHIAVE = 'fg_consent';
  var DETT = 'fg_consent_pref';
  var NIENTE = { a: false, m: false };

  var lang = (document.documentElement.getAttribute('lang') || 'it').slice(0, 2);
  if (!/^(it|en|es|pt)$/.test(lang)) lang = 'it';

  // Spagnolo e italiano condividono le informative, come gia' faceva il
  // banner precedente: le pagine /es/privacy e /es/cookie-policy non ci sono.
  var radice = (lang === 'en' || lang === 'pt') ? '/' + lang : '';

  var T = {
    it: {
      testo: 'Usiamo cookie tecnici e, solo col tuo consenso, cookie analitici e di marketing. Se rifiuti, il sito funziona lo stesso.',
      privacy: 'Privacy policy', cookie: 'Cookie policy',
      pers: 'Personalizza', rif: 'Rifiuta', acc: 'Accetta',
      titolo: 'Preferenze cookie',
      rifT: 'Rifiuta tutto', accT: 'Accetta tutto', salva: 'Salva',
      cat: [
        ['Necessari', 'Fanno funzionare il sito e ricordano questa scelta. Non si possono disattivare.'],
        ['Analitici', 'Google Analytics, per capire quali pagine servono davvero. I dati sono aggregati.'],
        ['Marketing', 'Il pixel di ChatGPT Ads, per misurare le campagne pubblicitarie.']
      ]
    },
    en: {
      testo: 'We use technical cookies and, only with your consent, analytics and marketing cookies. Decline and the site works just the same.',
      privacy: 'Privacy policy', cookie: 'Cookie policy',
      pers: 'Customise', rif: 'Decline', acc: 'Accept',
      titolo: 'Cookie preferences',
      rifT: 'Decline all', accT: 'Accept all', salva: 'Save',
      cat: [
        ['Necessary', 'They make the site work and remember this choice. They cannot be switched off.'],
        ['Analytics', 'Google Analytics, to see which pages actually earn their place. The data is aggregated.'],
        ['Marketing', 'The ChatGPT Ads pixel, to measure advertising campaigns.']
      ]
    },
    es: {
      testo: 'Usamos cookies técnicas y, solo con tu consentimiento, cookies analíticas y de marketing. Si las rechazas, el sitio funciona igual.',
      privacy: 'Política de privacidad', cookie: 'Política de cookies',
      pers: 'Personalizar', rif: 'Rechazar', acc: 'Acepto',
      titolo: 'Preferencias de cookies',
      rifT: 'Rechazar todo', accT: 'Aceptar todo', salva: 'Guardar',
      cat: [
        ['Necesarias', 'Hacen funcionar el sitio y recuerdan esta elección. No se pueden desactivar.'],
        ['Analíticas', 'Google Analytics, para saber qué páginas sirven de verdad. Los datos son agregados.'],
        ['Marketing', 'El píxel de ChatGPT Ads, para medir las campañas publicitarias.']
      ]
    },
    pt: {
      testo: 'Usamos cookies técnicos e, apenas com o seu consentimento, cookies analíticos e de marketing. Se recusar, o site funciona do mesmo jeito.',
      privacy: 'Política de privacidade', cookie: 'Política de cookies',
      pers: 'Personalizar', rif: 'Recusar', acc: 'Aceito',
      titolo: 'Preferências de cookies',
      rifT: 'Recusar tudo', accT: 'Aceitar tudo', salva: 'Guardar',
      cat: [
        ['Necessários', 'Fazem o site funcionar e guardam esta escolha. Não podem ser desativados.'],
        ['Analíticos', 'Google Analytics, para entender quais páginas realmente servem. Os dados são agregados.'],
        ['Marketing', 'O pixel do ChatGPT Ads, para medir as campanhas publicitárias.']
      ]
    }
  }[lang];

  // ── memoria ──────────────────────────────────────────────────────────

  function leggi() {
    try {
      var d = localStorage.getItem(DETT);
      if (d) { var p = JSON.parse(d); return { a: !!p.a, m: !!p.m }; }
      // Scelta fatta col banner precedente, che aveva un solo interruttore.
      var v = localStorage.getItem(CHIAVE);
      if (v === 'granted') return { a: true, m: true };
      if (v === 'denied') return { a: false, m: false };
    } catch (e) {}
    return null;
  }

  function scrivi(p) {
    try {
      localStorage.setItem(DETT, JSON.stringify({ a: p.a, m: p.m, v: 2, t: Date.now() }));
      localStorage.setItem(CHIAVE, p.m ? 'granted' : 'denied');
    } catch (e) {}
  }

  function applica(p) {
    var a = p.a ? 'granted' : 'denied';
    var m = p.m ? 'granted' : 'denied';
    if (window.gtag) gtag('consent', 'update', {
      analytics_storage: a,
      ad_storage: m,
      ad_user_data: m,
      ad_personalization: m
    });
    if (p.m && typeof window.fgLoadAds === 'function') window.fgLoadAds();
  }

  // Lo stato con cui la pagina e' partita: serve per sapere se, dopo la
  // scelta, quello che sta girando nella pagina e' ancora quello giusto.
  var iniziale = leggi();
  var base = iniziale || NIENTE;
  applica(base);

  // ── stile ────────────────────────────────────────────────────────────

  var CSS = [
    '#fg-cookie{position:fixed;left:16px;right:16px;bottom:16px;z-index:9999;max-width:540px;margin-left:auto;',
    'background:#121212;color:#C9C6BF;border-radius:14px;padding:18px 20px;box-shadow:0 18px 50px rgba(18,18,18,.28);',
    'font:400 14px/1.55 "Geist","Helvetica Neue",Arial,sans-serif;transform:translateY(160%);',
    'transition:transform .5s cubic-bezier(.2,.7,.1,1)}',
    '#fg-cookie.fgc-on{transform:none}',
    '#fg-cookie p{margin:0 0 14px}',
    '#fg-cookie a{color:#F7F6F2;text-underline-offset:3px}',
    '#fg-cookie [hidden]{display:none}',
    '.fgc-barra{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}',
    '.fgc-dx{display:flex;align-items:center;gap:10px;margin-left:auto}',
    '.fgc-b{font:500 14px/1 inherit;border:1px solid transparent;border-radius:999px;padding:10px 19px;',
    'cursor:pointer;white-space:nowrap}',
    '.fgc-si{background:#F7F6F2;color:#121212}',
    '.fgc-si:hover{background:#E8DFD2}',
    '.fgc-no{background:transparent;color:#C9C6BF;border-color:rgba(247,246,242,.28)}',
    '.fgc-no:hover{border-color:rgba(247,246,242,.65);color:#F7F6F2}',
    '.fgc-link{background:none;border:0;color:rgba(247,246,242,.62);font:400 13px/1 inherit;cursor:pointer;',
    'padding:8px 2px;text-decoration:underline;text-underline-offset:3px;white-space:nowrap}',
    '.fgc-link:hover{color:#F7F6F2}',
    '#fg-cookie :focus-visible{outline:2px solid #8A6F4E;outline-offset:2px;border-radius:4px}',
    '.fgc-tit{margin:0 0 10px!important;color:#F7F6F2;font-weight:500}',
    '.fgc-cat{list-style:none;margin:0 0 16px;padding:0}',
    '.fgc-cat li{border-top:1px solid rgba(247,246,242,.13)}',
    '.fgc-cat label{display:flex;gap:12px;align-items:flex-start;padding:11px 0;cursor:pointer}',
    '.fgc-cat b{display:block;color:#F7F6F2;font-weight:500;font-size:13.5px;margin-bottom:2px}',
    '.fgc-cat span{display:block;font-size:12.5px;line-height:1.5;color:rgba(247,246,242,.58)}',
    '.fgc-sw{appearance:none;-webkit-appearance:none;flex:0 0 auto;margin:1px 0 0;width:34px;height:20px;',
    'border-radius:999px;background:rgba(247,246,242,.22);position:relative;cursor:pointer;transition:background .25s}',
    '.fgc-sw::after{content:"";position:absolute;top:3px;left:3px;width:14px;height:14px;border-radius:50%;',
    'background:#F7F6F2;transition:transform .25s}',
    '.fgc-sw:checked{background:#8A6F4E}',
    '.fgc-sw:checked::after{transform:translateX(14px)}',
    '.fgc-sw:disabled{opacity:.45;cursor:default}',
    '@media(max-width:560px){#fg-cookie{left:10px;right:10px;bottom:10px;padding:16px;font-size:13.5px}',
    '.fgc-b{padding:9px 14px;font-size:13.5px}.fgc-link{font-size:12.5px}.fgc-dx{gap:8px}}',
    '@media(prefers-reduced-motion:reduce){#fg-cookie{transition:none}}'
  ].join('');

  function stile() {
    if (document.getElementById('fg-cookie-css')) return;
    var s = document.createElement('style');
    s.id = 'fg-cookie-css';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  // ── banner ───────────────────────────────────────────────────────────

  var box = null;

  function esc(t) {
    return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  }

  function interruttore(k, acceso, bloccato) {
    return '<input type="checkbox" class="fgc-sw"' + (k ? ' data-cat="' + k + '"' : '') +
      (acceso ? ' checked' : '') + (bloccato ? ' disabled' : '') + '>';
  }

  function costruisci() {
    stile();
    box = document.createElement('div');
    box.id = 'fg-cookie';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-label', esc(T.titolo));

    var voci = T.cat.map(function (c, i) {
      var k = i === 1 ? 'a' : i === 2 ? 'm' : '';
      var acceso = i === 0 ? true : (i === 1 ? base.a : base.m);
      return '<li><label>' + interruttore(k, acceso, i === 0) +
        '<span><b>' + esc(c[0]) + '</b><span>' + esc(c[1]) + '</span></span></label></li>';
    }).join('');

    box.innerHTML =
      '<div data-vista="banner">' +
        '<p>' + esc(T.testo) + ' <a href="' + radice + '/privacy">' + esc(T.privacy) + '</a>' +
        ' &middot; <a href="' + radice + '/cookie-policy">' + esc(T.cookie) + '</a>.</p>' +
        '<div class="fgc-barra">' +
          '<button type="button" class="fgc-link" data-az="apri">' + esc(T.pers) + '</button>' +
          '<span class="fgc-dx">' +
            '<button type="button" class="fgc-b fgc-no" data-az="rifiuta">' + esc(T.rif) + '</button>' +
            '<button type="button" class="fgc-b fgc-si" data-az="accetta">' + esc(T.acc) + '</button>' +
          '</span>' +
        '</div>' +
      '</div>' +
      '<div data-vista="pannello" hidden tabindex="-1">' +
        '<p class="fgc-tit">' + esc(T.titolo) + '</p>' +
        '<ul class="fgc-cat">' + voci + '</ul>' +
        '<div class="fgc-barra">' +
          '<button type="button" class="fgc-link" data-az="rifiuta">' + esc(T.rifT) + '</button>' +
          '<span class="fgc-dx">' +
            '<button type="button" class="fgc-b fgc-no" data-az="accetta">' + esc(T.accT) + '</button>' +
            '<button type="button" class="fgc-b fgc-si" data-az="salva">' + esc(T.salva) + '</button>' +
          '</span>' +
        '</div>' +
      '</div>';

    document.body.appendChild(box);
    box.addEventListener('click', function (e) {
      var b = e.target.closest('[data-az]');
      if (!b) return;
      var az = b.getAttribute('data-az');
      if (az === 'apri') return vista('pannello');
      if (az === 'accetta') return decidi({ a: true, m: true });
      if (az === 'rifiuta') return decidi({ a: false, m: false });
      if (az === 'salva') return decidi(scelte());
    });
    return box;
  }

  function scelte() {
    var p = { a: false, m: false };
    box.querySelectorAll('.fgc-sw[data-cat]').forEach(function (i) {
      p[i.getAttribute('data-cat')] = i.checked;
    });
    return p;
  }

  function vista(quale) {
    box.querySelectorAll('[data-vista]').forEach(function (v) {
      v.hidden = v.getAttribute('data-vista') !== quale;
    });
    if (quale === 'pannello') box.querySelector('[data-vista="pannello"]').focus();
  }

  function mostra(quale) {
    if (!box) costruisci();
    // Gli interruttori ripartono sempre dalla scelta in vigore, cosi'
    // riaprendo il pannello si vede davvero cosa e' attivo adesso.
    var ora = leggi() || NIENTE;
    box.querySelectorAll('.fgc-sw[data-cat]').forEach(function (i) {
      i.checked = ora[i.getAttribute('data-cat')];
    });
    vista(quale);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { box.classList.add('fgc-on'); });
    });
  }

  function decidi(p) {
    scrivi(p);
    applica(p);
    box.classList.remove('fgc-on');
    setTimeout(function () { if (box) box.remove(); box = null; }, 500);

    // Si ricarica solo se cambia davvero quello che gira nella pagina: cosi'
    // gtag riparte col consenso giusto gia' dalla <head> e il pixel non
    // resta in memoria dopo un rifiuto. Rifiutare appena arrivati non
    // cambia niente, e li' ricaricare sarebbe solo uno sfarfallio.
    if (p.a !== base.a || p.m !== base.m) {
      setTimeout(function () { location.reload(); }, 520);
    }
  }

  // Per tornarci sopra dopo: il bottone della cookie policy, o ?cookie=1.
  window.fgCookiePrefs = function () { mostra('pannello'); };

  if (/[?&]cookie=1/.test(location.search)) return mostra('pannello');
  if (iniziale) return;
  setTimeout(function () { mostra('banner'); }, 1200);
})();
