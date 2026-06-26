// ── Cookie consent (GDPR / Consent Mode v2) ──
(function(){
  var KEY = 'fg_consent';
  var saved = localStorage.getItem(KEY);
  function applyConsent(granted){
    if(window.gtag) gtag('consent','update',{
      analytics_storage: granted?'granted':'denied',
      ad_storage:'denied', ad_user_data:'denied', ad_personalization:'denied'
    });
  }
  if(saved==='granted'){ applyConsent(true);  return; }
  if(saved==='denied'){  applyConsent(false); return; }
  var lang = document.documentElement.getAttribute('lang')||'it';
  var privacyHref = lang==='en' ? '/en/privacy' : lang==='pt' ? '/pt/privacy' : '/privacy';
  var T = {
    it:{msg:'Ci aiuti a migliorare il sito? Usiamo solo cookie analitici anonimi. <a href="'+privacyHref+'" style="color:inherit;text-decoration:underline">Privacy policy</a>.',  acc:'Sì, accetto',  rej:'No grazie'},
    en:{msg:'Help us improve the site? We only use anonymous analytics cookies. <a href="'+privacyHref+'" style="color:inherit;text-decoration:underline">Privacy policy</a>.',       acc:'Yes, accept',  rej:'No thanks'},
    pt:{msg:'Nos ajude a melhorar o site? Usamos apenas cookies analíticos anônimos. <a href="'+privacyHref+'" style="color:inherit;text-decoration:underline">Política de privacidade</a>.', acc:'Sim, aceitar', rej:'Não, obrigado'}
  };
  var t = T[lang]||T['it'];
  var b = document.createElement('div');
  b.id = 'cookie-banner';
  b.innerHTML = '<p>'+t.msg+'</p><div class="cookie-actions"><button class="cookie-btn cookie-accept">'+t.acc+'</button><button class="cookie-btn cookie-reject">'+t.rej+'</button></div>';
  document.body.appendChild(b);
  setTimeout(function(){ b.classList.add('show'); }, 3000);
  function dismiss(granted){
    localStorage.setItem(KEY, granted?'granted':'denied');
    applyConsent(granted);
    b.classList.remove('show');
    setTimeout(function(){ b.remove(); }, 450);
  }
  b.querySelector('.cookie-accept').addEventListener('click', function(){ dismiss(true); });
  b.querySelector('.cookie-reject').addEventListener('click', function(){ dismiss(false); });
})();