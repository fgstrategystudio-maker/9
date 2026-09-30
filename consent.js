// ── Cookie consent (GDPR / Consent Mode v2) ──
// Il consenso copre due famiglie: analitici (Google Analytics) e marketing
// (pixel ChatGPT Ads). Finche' l'utente non accetta, gtag resta su 'denied'
// per tutto e lo script del pixel non viene nemmeno scaricato: e' fgLoadAds,
// definita nella <head> di ogni pagina, a iniettarlo solo dopo il consenso.
(function(){
  var KEY = 'fg_consent';
  var saved = null;
  try { saved = localStorage.getItem(KEY); } catch(e){}

  function applyConsent(granted){
    var v = granted ? 'granted' : 'denied';
    if(window.gtag) gtag('consent','update',{
      analytics_storage: v,
      ad_storage: v,
      ad_user_data: v,
      ad_personalization: v
    });
    if(granted && typeof window.fgLoadAds === 'function') window.fgLoadAds();
  }

  if(saved==='granted'){ applyConsent(true);  return; }
  if(saved==='denied'){  applyConsent(false); return; }

  var lang = document.documentElement.getAttribute('lang') || 'it';
  var privacyHref = lang==='en' ? '/en/privacy' : lang==='pt' ? '/pt/privacy' : '/privacy';
  var link = ' <a href="'+privacyHref+'" style="color:inherit;text-decoration:underline">';

  var T = {
    it:{msg:'Usiamo cookie analitici e di marketing per capire come va il sito e misurare le campagne pubblicitarie. Se rifiuti il sito funziona lo stesso.'+link+'Privacy policy</a>.', acc:'Accetto',      rej:'Rifiuta'},
    en:{msg:'We use analytics and marketing cookies to see how the site performs and to measure our ad campaigns. Decline and the site works just the same.'+link+'Privacy policy</a>.', acc:'Accept',       rej:'Decline'},
    es:{msg:'Usamos cookies analíticas y de marketing para ver cómo funciona el sitio y medir las campañas publicitarias. Si las rechazas, el sitio funciona igual.'+link+'Política de privacidad</a>.', acc:'Acepto', rej:'Rechazar'},
    pt:{msg:'Usamos cookies analíticos e de marketing para entender como o site funciona e medir as campanhas publicitárias. Se recusar, o site funciona do mesmo jeito.'+link+'Política de privacidade</a>.', acc:'Aceito', rej:'Recusar'}
  };
  var t = T[lang]||T['it'];

  var b = document.createElement('div');
  b.id = 'cookie-banner';
  b.innerHTML = '<p>'+t.msg+'</p><div class="cookie-actions"><button class="cookie-btn cookie-accept">'+t.acc+'</button><button class="cookie-btn cookie-reject">'+t.rej+'</button></div>';
  document.body.appendChild(b);
  setTimeout(function(){ b.classList.add('show'); }, 1200);

  function dismiss(granted){
    try { localStorage.setItem(KEY, granted?'granted':'denied'); } catch(e){}
    applyConsent(granted);
    b.classList.remove('show');
    setTimeout(function(){ b.remove(); }, 450);
  }
  b.querySelector('.cookie-accept').addEventListener('click', function(){ dismiss(true); });
  b.querySelector('.cookie-reject').addEventListener('click', function(){ dismiss(false); });
})();
