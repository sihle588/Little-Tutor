/* Tutor Dashboard: my learners, attendance, homework tracker, struggling, top learners, messages, add homework.
   Everything is based on the learners the tutor adds. Data lives in localStorage
   (lt_class + lt_users) and is shared with the learner pages. */
var selHw=null,selQuiz=null;

function el(tag,cls,txt){var e=document.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;return e}
function chip(name,cls,fn){var b=el(fn?'button':'span','chip '+cls,name);if(fn)b.onclick=fn;return b}
function plural(n,w){return n+' '+w+(n===1?'':'s')}
function when(iso){return new Date(iso).toLocaleString('en-GB',{weekday:'short',hour:'2-digit',minute:'2-digit'})}
function emptyNote(box,msg){box.appendChild(el('span','t-note',msg))}

function render(){
  var c=getClass(),R=roster();
  $('tBanner').textContent=c.name+' · '+plural(R.length,'Learner')+' · '+new Date().toLocaleDateString('en-GB',{weekday:'long'});
  $('tHello').textContent=R.length?'Welcome, '+curName+'. Here is how your class is doing today.':'Welcome, '+curName+'. Start by adding your learners below.';
  renderLearners(c,R);renderAttendance(c,R);renderHomework(c,R);renderStruggling(c,R);renderTop(R);renderMessages(c);renderAssigned(c,R);
}

/* ----- My learners ----- */
function renderLearners(c,R){
  var box=$('lList');box.innerHTML='';
  if(!R.length)emptyNote(box,'No learners yet. Add your first learner above.');
  R.forEach(function(r){
    var row=el('div','t-row'),b=el('b',null,r.name);b.appendChild(el('small',null,r.email+' · Grade '+r.grade));
    var del=el('button','t-del','Remove');del.onclick=function(){removeLearner(r)};
    row.appendChild(b);row.appendChild(del);box.appendChild(row);
  });
  if(document.activeElement!==$('cName'))$('cName').value=c.name;
  $('cGrade').value=c.grade;
}
$('lAdd').onclick=async function(){
  var n=$('lName').value.trim(),e=$('lEmail').value.trim().toLowerCase(),p=$('lPass').value,st=$('lStatus');
  if(!n){st.textContent='Please enter the learner’s name.';return}
  if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)){st.textContent='Please enter a valid email address.';return}
  await ready;users=readUsers();var c=getClass();
  if(has(e)){
    var r=users[e];
    if((r.role||'learner')!=='learner'){st.textContent='That email belongs to a tutor account.';return}
    if(r.tutor===cur){st.textContent='That learner is already in your class.';return}
    r.tutor=cur;saveUsers();
    st.textContent=r.name+' already had an account, so they were added to your class.';
  }else{
    if(p.length<6){st.textContent='Give the learner a temporary password of at least 6 characters.';return}
    var salt=hex(crypto.getRandomValues(new Uint8Array(8)));
    users[e]={name:n,role:'learner',grade:c.grade,salt:salt,hash:await hashPw(p,salt),p:blank(),tutor:cur};saveUsers();
    st.textContent=n+' was added. They can log in with '+e+' and the temporary password.';
  }
  $('lName').value='';$('lEmail').value='';$('lPass').value='';
  toast('Learner added');render();
};
function removeLearner(r){
  if(!confirm('Remove '+r.name+' from your class? Their account stays, but they will no longer appear on your dashboard.'))return;
  users=readUsers();if(users[r.email])delete users[r.email].tutor;saveUsers();
  toast(r.name+' removed');render();
}
$('cSave').onclick=function(){
  var c=getClass(),n=$('cName').value.trim();
  if(!n)return;
  c.name=n;c.grade=+$('cGrade').value;saveClass(c);
  grade=c.grade;S=CONTENT[grade]||CONTENT[8];fillSubjects();
  toast('Class saved');render();
};
function fillSubjects(){
  var dl=$('subjectList');dl.innerHTML='';
  S.forEach(function(s){var o=el('option');o.value=s.n;dl.appendChild(o)});
}

/* ----- Attendance ----- */
function renderAttendance(c,R){
  var att=attendanceToday(c),absent=R.filter(function(r){return att[r.email]==='absent'});
  $('aCame').textContent=R.length-absent.length;$('aAbs').textContent=absent.length;
  var list=$('aList');list.innerHTML='';
  if(!R.length)emptyNote(list,'Add learners to take attendance.');
  else if(!absent.length)emptyNote(list,'Everyone is here today.');
  absent.forEach(function(r){list.appendChild(chip(r.name,'red',function(){mark(r.email,'present')}))});
  var all=$('aAll');all.innerHTML='';
  R.forEach(function(r){var gone=att[r.email]==='absent';all.appendChild(chip(r.name,gone?'red':'green',function(){mark(r.email,gone?'present':'absent')}))});
}
function mark(email,state){
  var c=getClass(),a=attendanceToday(c);
  if(state==='absent')a[email]='absent';else delete a[email];
  saveClass(c);render();
}

/* ----- Homework tracker ----- */
function renderHomework(c,R){
  var list=c.homework.slice().reverse(),sel=$('hSel');
  sel.innerHTML='';
  list.forEach(function(h){var o=el('option',null,h.subject+' – '+h.task);o.value=h.id;sel.appendChild(o)});
  if(selHw&&list.some(function(h){return h.id===selHw}))sel.value=selHw;
  selHw=sel.value||null;
  var h=list.filter(function(x){return x.id===selHw})[0],box=$('hList');box.innerHTML='';
  if(!h||!R.length){
    $('hDid').textContent=0;$('hNot').textContent=0;$('hRemind').disabled=true;
    $('hStatus').textContent=!R.length?'Add learners to track their homework.':'No homework assigned yet. Add some below.';return;
  }
  var not=R.filter(function(r){return !h.done[r.email]});
  $('hDid').textContent=R.length-not.length;$('hNot').textContent=not.length;
  if(!not.length)emptyNote(box,'Everyone has done this homework.');
  not.forEach(function(r){box.appendChild(chip(r.name,'red'))});
  $('hRemind').disabled=!not.length;
  var last=c.reminders.filter(function(r){return r.hw===h.id}).pop();
  $('hStatus').textContent=last?'Last reminder sent '+when(last.date)+' to '+plural(last.to.length,'learner')+'.':'';
}
$('hSel').onchange=function(){selHw=$('hSel').value;render()};
$('hRemind').onclick=function(){
  var c=getClass(),R=roster(),h=c.homework.filter(function(x){return x.id===selHw})[0];if(!h)return;
  var to=R.filter(function(r){return !h.done[r.email]}).map(function(r){return r.email});
  if(!to.length)return;
  c.reminders.push({hw:h.id,to:to,date:new Date().toISOString()});saveClass(c);
  toast('Reminder sent to '+plural(to.length,'learner'));render();
};

/* ----- Who is struggling: learners whose best score in the chosen quiz is below 50% ----- */
function quizSubjects(c){return(CONTENT[c.grade]||CONTENT[8]).filter(function(s){return s.quiz.length})}
function scorePct(r,id){
  var sub=(CONTENT[r.grade]||CONTENT[8]).filter(function(s){return s.id===id})[0];
  if(!sub||!sub.quiz.length||r.quiz[id]===undefined)return null;
  return Math.round(100*r.quiz[id]/sub.quiz.length);
}
function renderStruggling(c,R){
  var subs=quizSubjects(c),sel=$('sSel');sel.innerHTML='';
  subs.forEach(function(s){var o=el('option',null,s.n+' – '+s.topic);o.value=s.id;sel.appendChild(o)});
  if(selQuiz&&subs.some(function(s){return s.id===selQuiz}))sel.value=selQuiz;
  selQuiz=sel.value||null;
  var s=subs.filter(function(x){return x.id===selQuiz})[0],box=$('sList');box.innerHTML='';
  if(!s||!R.length){$('sHead').textContent=R.length?'No quizzes available for this grade yet.':'Add learners to see who is struggling.';$('sExtra').disabled=true;$('sStatus').textContent='';return}
  var low=R.filter(function(r){var p=scorePct(r,s.id);return p!==null&&p<50}).sort(function(a,b){return scorePct(a,s.id)-scorePct(b,s.id)});
  var tried=R.filter(function(r){return scorePct(r,s.id)!==null}).length;
  $('sHead').textContent=low.length?plural(low.length,'learner')+' failed the '+s.topic+' quiz (below 50%)':(tried?'No learners are below 50% in the '+s.topic+' quiz.':'No one has taken the '+s.topic+' quiz yet.');
  low.forEach(function(r){box.appendChild(chip(r.name+' · '+scorePct(r,s.id)+'%','red'))});
  if(tried<R.length)box.appendChild(el('p','t-note',plural(R.length-tried,'learner')+' not taken it yet.'));
  $('sExtra').disabled=!low.length;
  var x=c.extra.filter(function(z){return z.subject===s.id}).pop();
  if(x){var d=x.to.filter(function(e){return x.done[e]}).length;$('sStatus').textContent='Extra lesson sent '+when(x.date)+' to '+plural(x.to.length,'learner')+' · '+d+' completed.'}
  else $('sStatus').textContent='';
}
$('sSel').onchange=function(){selQuiz=$('sSel').value;render()};
$('sExtra').onclick=function(){
  var c=getClass(),R=roster(),s=quizSubjects(c).filter(function(x){return x.id===selQuiz})[0];if(!s)return;
  var to=R.filter(function(r){var p=scorePct(r,s.id);return p!==null&&p<50}).map(function(r){return r.email});
  if(!to.length)return;
  c.extra.push({id:'x'+Date.now(),subject:s.id,topic:s.topic,to:to,done:{},date:new Date().toISOString()});saveClass(c);
  toast('Extra lesson sent to '+plural(to.length,'learner'));render();
};

/* ----- Who is doing well: most stars earned ----- */
function renderTop(R){
  var top=R.filter(function(r){return r.stars>0}).sort(function(a,b){return b.stars-a.stars}).slice(0,3),ol=$('topList');ol.innerHTML='';
  if(!top.length){var li=el('li');li.appendChild(el('span','t-note',R.length?'No stars earned yet. They appear as learners finish homework and quizzes.':'Add learners to see your top performers.'));ol.appendChild(li);return}
  top.forEach(function(r,i){var li=el('li');li.appendChild(el('span','rank',i+1));li.appendChild(el('span',null,r.name));li.appendChild(el('span','stars',r.stars+' stars'));ol.appendChild(li)});
}

/* ----- Message to all ----- */
function renderMessages(c){
  var box=$('mSent');box.innerHTML='';
  c.messages.slice(0,3).forEach(function(m){
    var d=el('div','t-sent');d.appendChild(el('small',null,'Sent '+when(m.date)));d.appendChild(document.createTextNode(m.text));box.appendChild(d);
  });
}
$('mSend').onclick=function(){
  var t=$('mText').value.trim(),R=roster();
  if(!t){$('mStatus').textContent='Please type a message first.';return}
  if(!R.length){$('mStatus').textContent='Add learners first, then send your message.';return}
  var c=getClass();
  c.messages.unshift({id:'m'+Date.now(),text:t,date:new Date().toISOString()});saveClass(c);
  $('mText').value='';$('mStatus').textContent='';toast('Message sent to '+plural(R.length,'learner'));render();
};

/* ----- Add homework ----- */
function renderAssigned(c,R){
  var box=$('nList');box.innerHTML='';
  var list=c.homework.slice().reverse();
  if(!list.length)box.appendChild(el('p','t-note','Nothing assigned yet.'));
  list.forEach(function(h){
    var did=R.filter(function(r){return h.done[r.email]}).length;
    var d=el('div','t-item');d.appendChild(el('b',null,h.subject+' – '+h.task));d.appendChild(el('small',null,'Due '+h.due+' · '+did+' of '+R.length+' done'));box.appendChild(d);
  });
}
$('nAdd').onclick=function(){
  var s=$('nSubject').value.trim(),t=$('nTask').value.trim(),d=$('nDue').value,st=$('nStatus');
  if(!s||!t||!d){st.textContent='Please fill in the subject, the task and the due date.';return}
  var c=getClass(),id='hw'+Date.now();
  c.homework.push({id:id,subject:s,task:t,due:d,created:new Date().toISOString(),done:{}});saveClass(c);
  selHw=id;$('nSubject').value='';$('nTask').value='';$('nDue').value=today();st.textContent='';
  toast('Homework added. Your learners can see it now.');render();
};

if(requireLogin(true)){
  initChrome();fillSubjects();
  $('nDue').value=today();
  render();liveSync(render);
}