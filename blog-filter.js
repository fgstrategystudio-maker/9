(function(){
  var grid=document.getElementById('blog-grid');
  if(!grid) return;
  var chips=document.querySelectorAll('#blog-filters .blog-chip');
  var empty=document.getElementById('blog-empty');
  var cards=Array.prototype.slice.call(grid.children).filter(function(el){return el.tagName==='A';});
  cards.forEach(function(c){var d=c.querySelector('div');c.setAttribute('data-cat',d?d.textContent.trim():'');});
  function apply(f){
    var shown=0;
    cards.forEach(function(c){
      var ok=(f==='all'||c.getAttribute('data-cat')===f);
      c.style.display=ok?'':'none';
      if(ok)shown++;
    });
    if(empty)empty.style.display=shown?'none':'block';
  }
  chips.forEach(function(ch){
    ch.addEventListener('click',function(){
      chips.forEach(function(x){x.classList.remove('active');});
      ch.classList.add('active');
      apply(ch.getAttribute('data-filter'));
    });
  });
})();
