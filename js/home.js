/* Home page: greeting, week streak, to-do list (tutor + subject homework), mastery, tutor notes */
function renderHome(){
  var c=getClass();
  $('gradeLine').textContent='Good day! · Grade '+grade;
  $('hiName').textContent='Hi, '+curName+'!';
  var st=streakNow();
  $('streakNote').textContent=st+' Day Streak'+(st?' – keep it going!':' – finish a task or quiz today to start one');
  var d=new Date(),dow=(d.getDay()+6)%7,h='';
  ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].forEach(function(n,i){var x=new Date();x.setDate(x.getDate()-dow+i);h+='<div class="day'+(P.days.indexOf(ds(x))>-1?' done':'')+(i===dow?' today':'')+'">'+n+'<i></i></div>'});
  $('week').innerHTML=h;

  var list=$('tasks'),n=0,t=0;list.innerHTML='';
 (inClass()?c.homework:[]).slice(-6).forEach
  S.forEach(function(s){s.hw.forEach(function(w){if(w.today){t++;if(P.hw[w.id]===today())n++;list.appendChild(taskEl(s,w))}})});
  if(!t)list.innerHTML='<div class="note">Nothing to do today. Enjoy your day!</div>';
  $('count').textContent=n+' of '+t+' done';

  var ms=S.filter(function(s){return s.id==='maths'})[0];
  if(ms&&ms.quiz.length){
    var m=mast(ms);
    $('mTitle').textContent=ms.topic+' Mastery';
    $('mPct').textContent=m+'%';$('mPct').style.color=m>=80?'var(--green)':'var(--orange)';$('mbar').style.width=m+'%';
    $('mNote').textContent=m>=80?'Mastered! Great work on '+ms.topic+'.':'Score 80% or more in the Maths quiz to master '+ms.topic+'.';
  }else{$('mTitle').textContent='Mastery';$('mPct').textContent='0%';$('mbar').style.width='0%';$('mNote').textContent='Take a quiz to start building your mastery.'}
  renderFromTutor(c);
}
function renderFromTutor(c){
  var box=$('tutorBox'),any=false,seen={};box.innerHTML='';
  c.reminders.forEach(function(r){
    if(r.to.indexOf(cur)<0||seen[r.hw])return;
    var h=c.homework.filter(function(x){return x.id===r.hw})[0];
    if(!h||(h.done&&h.done[cur]))return;
    seen[r.hw]=1;any=true;
    var d=document.createElement('div');d.className='tmsg remind';d.textContent='Reminder: please finish '+h.subject+' – '+h.task;box.appendChild(d);
  });
  (inClass()?c.messages:[]).slice(0,3).forEach
    any=true;var d=document.createElement('div');d.className='tmsg';
    var s=document.createElement('small');s.textContent=new Date(m.date).toLocaleString('en-GB',{weekday:'short',hour:'2-digit',minute:'2-digit'});
    d.appendChild(s);d.appendChild(document.createTextNode(m.text));box.appendChild(d);
  });
  $('tutorCard').hidden=!any;
  var ex=c.extra.filter(function(x){return x.to.indexOf(cur)>-1&&!x.done[cur]}),eb=$('extraBox');eb.innerHTML='';
  ex.forEach(function(x){
    var b=document.createElement('button');b.className='go';b.style.cssText='width:100%;margin-bottom:8px';b.textContent='Start extra lesson: '+x.topic;
    b.onclick=function(){openExtra(x)};eb.appendChild(b);
  });
  $('extraCard').hidden=!ex.length;
}
if(requireLogin()){initChrome();window.onProgress=renderHome;liveSync(renderHome);renderHome()}
