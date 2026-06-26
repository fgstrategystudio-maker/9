(function(){
  function setup(el){
    var dir = parseFloat(el.getAttribute('data-dir')||'1');
    var paused=false, resumeT;
    function half(){ return el.scrollWidth/2; }
    function step(){
      if(!paused){
        el.scrollLeft += dir*0.5;
        var h=half();
        if(h>0){ if(el.scrollLeft>=h) el.scrollLeft-=h; else if(el.scrollLeft<=0) el.scrollLeft+=h; }
      }
      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
    function pause(){ paused=true; clearTimeout(resumeT); }
    function resumeSoon(){ clearTimeout(resumeT); resumeT=setTimeout(function(){paused=false;},1600); }
    ['mouseenter','wheel','touchstart','pointerdown'].forEach(function(ev){ el.addEventListener(ev,pause,{passive:true}); });
    ['mouseleave','touchend','pointerup'].forEach(function(ev){ el.addEventListener(ev,resumeSoon,{passive:true}); });
    var down=false,sx,sl;
    el.addEventListener('pointerdown',function(e){down=true;sx=e.clientX;sl=el.scrollLeft;el.style.cursor='grabbing';});
    window.addEventListener('pointermove',function(e){ if(down){ el.scrollLeft = sl-(e.clientX-sx); } });
    window.addEventListener('pointerup',function(){ down=false; el.style.cursor='grab'; });
  }
  document.querySelectorAll('.brand-marquee,.sector-marquee').forEach(setup);
})();
