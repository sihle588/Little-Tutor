/* Subject page: homework, quiz link and AI tutor for one subject (subject.html?s=maths) */
var cs=null;
function renderSubject(){
  var s=cs,m=mast(s);
  $('sTitle').textContent=s.n;$('sTopic').textContent='Topic: '+s.topic+' · Goal: 80%';
  $('sPct').textContent=m+'%';$('sBar').style.width=m+'%';
  var l=$('sHw');l.innerHTML='';s.hw.forEach(function(h){l.appendChild(taskEl(s,h))});
  if(!s.hw.length)l.innerHTML='<div class="note">No homework yet for this subject.</div>';
}

/* ---------- AI tutor ---------- */
var sheet,chat,opts;
function tsay(t,c){var d=document.createElement('div');d.className='msg '+c;d.textContent=t;chat.appendChild(d);chat.scrollTop=chat.scrollHeight}
function tchoose(list){opts.innerHTML='';list.forEach(function(o){var b=document.createElement('button');b.textContent=o[0];b.onclick=function(){opts.innerHTML='';tsay(o[0],'me');setTimeout(o[1],400)};opts.appendChild(b)})}
function ask(s){
  tsay('Your turn: '+s.tut.q,'bot');
  tchoose(s.tut.o.map(function(t,k){return[t,function(){
    if(k===s.tut.a){tsay('Correct, great thinking! Want to test yourself with the '+s.n+' quiz?','bot');
      tchoose([['Take the quiz',function(){location.href='quiz.html?s='+s.id}],['Not now',function(){tsay('No problem. I’m here when you need me.','bot');opts.innerHTML=''}]])}
    else{tsay('Nearly! Re-read the explanation above, then try again.','bot');tchoose([['Try again',function(){ask(s)}]])}
  }]}));
}
function startTutor(s){
  chat.innerHTML='';opts.innerHTML='';$('tTitle').textContent='AI Tutor: '+s.n;
  tsay('Hi '+curName+'! Let’s work on '+s.topic+'. '+s.tut.e,'bot');
  setTimeout(function(){ask(s)},600);sheet.classList.add('open');
}

if(requireLogin()){
  var id=new URLSearchParams(location.search).get('s');
  cs=S.filter(function(s){return s.id===id})[0];
  if(!cs){location.replace('learn.html')}
  else{
    initChrome();sheet=$('sheet');chat=$('chat');opts=$('opts');
    $('close').onclick=function(){sheet.classList.remove('open')};
    $('sTutor').onclick=function(){cs.tut?startTutor(cs):toast('Tutor lessons for this subject are coming soon')};
    $('sQuiz').onclick=function(e){if(!cs.quiz.length){e.preventDefault();toast('Quiz questions for this subject are coming soon')}};
    $('sQuiz').href='quiz.html?s='+cs.id;
    window.onProgress=renderSubject;renderSubject();
  }
}
