/* Quiz page: pick a subject, then answer with instant feedback (quiz.html?s=maths) */
var qSub=null,qi=0,qsc=0,qGain=0;
function renderQuiz(){
  var box=$('qbox'),pk=$('qpick');
  if(!qSub){$('qTitle').textContent='Choose a quiz';box.hidden=true;pk.hidden=false;renderSubjects(pk,'',function(s){if(!s.quiz.length){toast('Quiz questions for this subject are coming soon');return}location.href='quiz.html?s='+s.id});return}
  pk.hidden=true;box.hidden=false;box.innerHTML='';$('qTitle').textContent=qSub.n+' Quiz';
  var Q=qSub.quiz;
  if(qi>=Q.length){
    var pct=Math.round(100*qsc/Q.length),r=document.createElement('div');
    r.innerHTML='<div class="big"></div><p style="text-align:center;font-weight:700;margin:0 0 12px"></p>';
    r.querySelector('.big').textContent=qsc+' / '+Q.length;
    r.querySelector('p').textContent=(pct>=80?'Great work! You scored '+pct+'%, so you have mastered this topic.':'You scored '+pct+'%. Below 80%, so review the tutor examples and try again.')+(qGain?' You earned '+qGain+' stars.':'');
    var b=document.createElement('button');b.className='go';b.style.width='100%';b.textContent='Try again';b.onclick=function(){qi=0;qsc=0;renderQuiz()};
    var c=document.createElement('a');c.className='link';c.style.cssText='display:block;text-align:center;margin-top:12px';c.href='quiz.html';c.textContent='Choose another subject';
    r.appendChild(b);r.appendChild(c);box.appendChild(r);return;
  }
  var item=Q[qi],h=document.createElement('div');h.className='mrow';h.innerHTML='<span>Question '+(qi+1)+' of '+Q.length+'</span><span>Score '+qsc+'</span>';
  var q=document.createElement('p');q.style.cssText='font-weight:800;font-size:19px;margin:6px 0 12px';q.textContent=item[0];
  var o=document.createElement('div');o.className='opts';o.style.flexDirection='column';
  var fb=document.createElement('div');fb.style.marginTop='12px';
  item[1].forEach(function(txt,k){var b=document.createElement('button');b.textContent=txt;b.onclick=function(){
    Array.prototype.forEach.call(o.children,function(x){x.disabled=true});
    var ok=k===item[2];if(ok)qsc++;
    b.style.background=ok?'var(--green)':'#e5383b';b.style.color='#fff';b.style.borderColor='transparent';
    var m=document.createElement('div');m.className='msg bot';m.style.maxWidth='100%';m.textContent=(ok?'Correct! ':'Not quite. ')+item[3];fb.appendChild(m);
    var n=document.createElement('button');n.className='go';n.style.cssText='width:100%;margin-top:10px';n.textContent=qi===Q.length-1?'See my results':'Next question';
    n.onclick=function(){qi++;if(qi>=Q.length)finishQuiz();renderQuiz()};fb.appendChild(n);
  };o.appendChild(b)});
  box.appendChild(h);box.appendChild(q);box.appendChild(o);box.appendChild(fb);
}
function finishQuiz(){
  var best=P.quiz[qSub.id]||0;qGain=Math.max(0,qsc-best)*2;
  if(qsc>best)P.quiz[qSub.id]=qsc;
  award(qGain);
}
if(requireLogin()){
  initChrome();
  var id=new URLSearchParams(location.search).get('s');
  qSub=S.filter(function(s){return s.id===id})[0]||null;
  if(qSub&&!qSub.quiz.length)qSub=null;
  renderQuiz();
}
