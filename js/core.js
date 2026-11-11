/* Little Tutor – shared logic used by every page:
   storage, accounts and roles, class data shared by tutor and learners,
   progress (stars + streak), header, and the homework / lesson panels */
var $=function(i){return document.getElementById(i)};
var store=null,sess=null;
try{store=window.localStorage}catch(e){}
try{sess=window.sessionStorage}catch(e){}

var DEMO_TUTOR='likuwe.tutor@gmail.com';
var DEMO_PW={tutor:'tutor123'};
var users=readUsers();
var realUser=null,realRole='learner',cur=null,curName='',grade=8,P=blank(),S=[];

/* ---------- accounts ---------- */
function readUsers(){try{return JSON.parse(store.getItem('lt_users')||'{}')}catch(e){return{}}}
function saveUsers(){try{store.setItem('lt_users',JSON.stringify(users))}catch(e){}}
function has(u){return Object.prototype.hasOwnProperty.call(users,u)}
function blank(){return{stars:0,streak:0,last:'',days:[],hw:{},quiz:{}}}
function save(){users=readUsers();if(cur&&users[cur]){users[cur].p=P;saveUsers()}}
function hex(b){return Array.from(new Uint8Array(b)).map(function(x){return x.toString(16).padStart(2,'0')}).join('')}
async function hashPw(pw,salt){return hex(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(salt+pw)))}

/* ---------- dates, streak, mastery ---------- */
function ds(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function today(){return ds(new Date())}
function ago(n){var d=new Date();d.setDate(d.getDate()-n);return ds(d)}
function streakNow(){return(P.last===today()||P.last===ago(1))?P.streak:0}
function mast(s){return s.quiz.length?Math.round(100*(P.quiz[s.id]||0)/s.quiz.length):0}

/* ---------- tutor demo account (created once) + one-time clean-up of the old demo learners ---------- */
var OLD_DEMO=['Sihle','Thabo','Lerato','Naledi','Sipho','Zanele','Ayanda','Kagiso','Nomsa','Lwazi','Palesa','Tumelo','Anele','Bongani','Refilwe','Mpho','Zodwa','Karabo','Neo','Lindiwe','Siyabonga','Amahle','Themba','Ntombi','Mandla','Busisiwe','Kabelo','Nandi'];
function em(n){return n.toLowerCase()+'.learner@gmail.com'}

async function seedDemo(){
  try{
    if(!(window.crypto&&crypto.subtle))return;
    var u=readUsers(),changed=false;
    if(!store.getItem('lt_clean_v3')){
      OLD_DEMO.forEach(function(n){var e=em(n);if(u[e]){delete u[e];changed=true}});
      store.removeItem('lt_class');store.setItem('lt_clean_v3','1');
    }
    if(!u[DEMO_TUTOR]){
      var salt=hex(crypto.getRandomValues(new Uint8Array(8)));
      u[DEMO_TUTOR]={name:'Likuwe',role:'tutor',grade:0,salt:salt,hash:await hashPw(DEMO_PW.tutor,salt),p:blank()};changed=true;
    }
    users=u;if(changed)saveUsers();
    getClass();
  }catch(e){}
}

/* ---------- class data shared by the tutor and the tutor's learners (key: lt_class) ---------- */
function getClass(){
  try{
    var c=JSON.parse(store.getItem('lt_class'));
    if(c&&c.homework){c.name=c.name||'Grade 10A';c.grade=c.grade||10;c.messages=c.messages||[];c.reminders=c.reminders||[];c.extra=c.extra||[];c.attendance=c.attendance||{};return c}
  }catch(e){}
  var c={name:'Grade 10A',grade:10,homework:[],messages:[],reminders:[],extra:[],attendance:{}};
  saveClass(c);return c;
}
function saveClass(c){try{store.setItem('lt_class',JSON.stringify(c))}catch(e){}}
/* the tutor's own learners: accounts the tutor added (they carry the tutor's email in .tutor) */
function roster(){
  users=readUsers();
  return Object.keys(users).filter(function(e){var r=users[e];return(r.role||'learner')==='learner'&&r.tutor===cur})
    .map(function(e){var r=users[e];return{email:e,name:r.name,grade:r.grade||8,stars:(r.p&&r.p.stars)||0,quiz:(r.p&&r.p.quiz)||{}}})
    .sort(function(a,b){return a.name.localeCompare(b.name)});
}
/* a learner only sees tutor homework and messages once the tutor has added them to the class */
function inClass(){return !!(users[cur]&&users[cur].tutor)}
function attendanceToday(c){
  if(!c.attendance[today()]){c.attendance[today()]={};saveClass(c)}
  return c.attendance[today()];
}
/* refresh a page when the other tab (tutor or learner) changes shared data */
function liveSync(fn){
  window.addEventListener('storage',function(e){
    if(e.key==='lt_class'||e.key==='lt_users'){users=readUsers();if(cur&&users[cur])P=Object.assign(blank(),users[cur].p||{});fn()}
  });
}

/* ---------- login session (cleared when the tab closes) ---------- */
function setSession(u){try{sess.setItem('lt_session',u)}catch(e){}}
function loadSession(){
  var u=null;try{u=sess.getItem('lt_session')}catch(e){}
  users=readUsers();
  if(!u||!has(u))return false;
  realUser=u;realRole=users[u].role||'learner';
  cur=u;curName=users[u].name;
  grade=realRole==='tutor'?getClass().grade:(users[u].grade||8);
  S=CONTENT[grade]||CONTENT[8];
  P=Object.assign(blank(),users[u].p||{});
  return true;
}
/* learner pages are for learners, the tutor dashboard is for the tutor */
function requireLogin(tutorOnly){
  if(!loadSession()){location.replace('login.html');return false}
  if(tutorOnly&&realRole!=='tutor'){location.replace('index.html');return false}
  if(!tutorOnly&&realRole==='tutor'){location.replace('tutor.html');return false}
  return true;
}
function logout(){save();try{sess.removeItem('lt_session')}catch(e){}location.href='login.html'}

/* ---------- header ---------- */
function refreshHeader(){if($('streakN'))$('streakN').textContent=streakNow();if($('starCount'))$('starCount').textContent=P.stars}
function initChrome(){
  $('avatar').textContent=curName.charAt(0).toUpperCase();
  var pg=document.body.dataset.page;
  document.querySelectorAll('.nav a').forEach(function(a){a.classList.toggle('on',a.dataset.page===pg)});
  $('logout').onclick=logout;
  if($('vClose'))$('vClose').onclick=function(){$('vsheet').classList.remove('open')};
  refreshHeader();
}
var tt;
function toast(m){var t=$('toast');t.textContent=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(function(){t.classList.remove('show')},1800)}

/* ---------- stars and streak ---------- */
function award(n){
  var fresh=P.last!==today();
  P.stars+=n;
  if(fresh){P.streak=P.last===ago(1)?P.streak+1:1;P.last=today();P.days.push(today());P.days=P.days.slice(-30)}
  save();refreshHeader();
  if(window.onProgress)window.onProgress();
  toast((n?'+'+n+' stars':'Nice work')+(fresh?' · Streak '+P.streak:''));
}

/* ---------- shared components ---------- */
function taskEl(s,h){
  var el=document.createElement('div'),dn=P.hw[h.id]===today();
  el.className='task'+(dn?' done':'');el.dataset.c=s.id==='nat'?'g':(s.id==='eng'?'p':'b');
  el.innerHTML='<div class="box"></div><div class="t"><b></b><small></small></div>';
  el.querySelector('.box').textContent=dn?'✓':'';
  el.querySelector('b').textContent=s.s+' – '+h.t;el.querySelector('small').textContent=h.d;
  el.onclick=function(){dn?toast('Already completed'):openCheck(s,h)};
  return el;
}
/* homework added by the tutor */
function tutorTaskEl(h){
  var el=document.createElement('div'),dn=!!(h.done&&h.done[cur]);
  el.className='task'+(dn?' done':'');el.dataset.c='p';
  el.innerHTML='<div class="box"></div><div class="t"><b></b><small></small></div>';
  el.querySelector('.box').textContent=dn?'✓':'';
  el.querySelector('b').textContent=h.subject+' – '+h.task;
  el.querySelector('small').textContent='From your tutor · Due '+h.due;
  el.onclick=function(){dn?toast('Already completed'):openNote(h)};
  return el;
}
function renderSubjects(el,q,pick){
  el.innerHTML='';q=(q||'').toLowerCase().trim();var c=0;
  S.forEach(function(s){
    if(q&&(s.n+' '+s.topic+' '+s.k).toLowerCase().indexOf(q)<0)return;c++;
    var b=document.createElement('div');b.className='card sub';
    b.innerHTML='<div class="mrow"><span></span><span></span></div><small></small><div class="bar"><div></div></div>';
    var sp=b.querySelectorAll('span');sp[0].textContent=s.n;sp[1].textContent=mast(s)+'%';
    b.querySelector('small').textContent='Topic: '+s.topic;b.querySelector('.bar div').style.width=mast(s)+'%';
    b.onclick=function(){pick(s)};el.appendChild(b);
  });
  if(!c)el.innerHTML='<div class="note">No subject found. Try another word, for example Maths or Science.</div>';
}

/* ---------- side panel used for homework checks, notes and extra lessons ---------- */
function panel(title){
  var vs=$('vsheet'),vc=$('vChat'),vo=$('vOpts');
  vc.innerHTML='';vo.innerHTML='';$('vTitle').textContent=title;
  return{vs:vs,vo:vo,close:function(ms){setTimeout(function(){vs.classList.remove('open')},ms||1000)},
    say:function(t,c){var d=document.createElement('div');d.className='msg '+c;d.textContent=t;vc.appendChild(d);vc.scrollTop=vc.scrollHeight}};
}
/* subject homework: only ticked after a correct answer */
function openCheck(s,h){
  var p=panel('Check: '+s.s+' – '+h.t);
  p.say('You can only mark this complete once you have really done it. Answer this question about your work.','bot');p.say(h.q,'bot');
  h.o.forEach(function(txt,k){var b=document.createElement('button');b.textContent=txt;b.onclick=function(){
    p.vo.innerHTML='';p.say(txt,'me');
    if(k===h.a){p.say('Correct! Your homework is now marked complete.','bot');P.hw[h.id]=today();award(10);p.close()}
    else{p.say('Not quite. Finish the work first, then try again. It stays unticked until you get it right.','bot');var r=document.createElement('button');r.textContent='Try again';r.onclick=function(){openCheck(s,h)};p.vo.appendChild(r)}
  };p.vo.appendChild(b)});
  p.vs.classList.add('open');
}
/* tutor homework: learner writes a short note, then it is marked complete for the tutor to see */
function openNote(h){
  var p=panel('Mark complete: '+h.subject);
  p.say('Your tutor will see this. Write one or two sentences about what you did or your answer.','bot');p.say(h.task,'bot');
  var ta=document.createElement('textarea');ta.className='inp';ta.rows=3;ta.placeholder='What did you do?';ta.style.cssText='flex-basis:100%;resize:vertical';
  var b=document.createElement('button');b.className='go';b.style.cssText='flex-basis:100%';b.textContent='Mark as complete';
  b.onclick=function(){
    var t=ta.value.trim();
    if(t.length<10){p.say('Please write a little more (at least 10 characters).','bot');return}
    var c=getClass(),x=c.homework.filter(function(y){return y.id===h.id})[0];
    if(!x)return;
    x.done[cur]={note:t,at:new Date().toISOString()};saveClass(c);
    p.vo.innerHTML='';p.say('Well done! Your homework is marked complete.','bot');award(10);p.close();
  };
  p.vo.appendChild(ta);p.vo.appendChild(b);p.vs.classList.add('open');
}
/* extra lesson sent by the tutor (uses the tutor lesson of the chosen subject) */
function openExtra(x){
  var s=S.filter(function(z){return z.id===x.subject})[0];
  if(!s||!s.tut){toast('This lesson is not available yet');return}
  var t=s.tut,p=panel('Extra lesson: '+x.topic);
  p.say('Your tutor sent you this extra lesson. '+t.e,'bot');p.say('Your turn: '+t.q,'bot');
  t.o.forEach(function(txt,k){var b=document.createElement('button');b.textContent=txt;b.onclick=function(){
    p.vo.innerHTML='';p.say(txt,'me');
    if(k===t.a){
      var c=getClass(),y=c.extra.filter(function(z){return z.id===x.id})[0];if(y)y.done[cur]=true;saveClass(c);
      p.say('Correct! Extra lesson complete.','bot');award(10);p.close();
    }else{p.say('Nearly! Re-read the lesson above, then try again.','bot');var r=document.createElement('button');r.textContent='Try again';r.onclick=function(){openExtra(x)};p.vo.appendChild(r)}
  };p.vo.appendChild(b)});
  p.vs.classList.add('open');
}

var ready=seedDemo();