/* Tutor Dashboard: attendance, homework tracker, struggling, top learners, messages, add homework.
   All data lives in localStorage (lt_class + lt_users) and is shared with the learner pages. */
var selHw=null;

function el(tag,cls,txt){var e=document.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;return e}
function chip(name,cls,fn){var b=el(fn?'button':'span','chip '+cls,name);if(fn)b.onclick=fn;return b}
function plural(n,w){return n+' '+w+(n===1?'':'s')}
function when(iso){return new Date(iso).toLocaleString('en-GB',{weekday:'short',hour:'2-digit',minute:'2-digit'})}

function render(){
  var c=getClass(),R=roster();
  $('tBanner').textContent=CLASS_NAME+' · '+plural(R.length,'Learner')+' · '+new Date().toLocaleDateString('en-GB',{weekday:'long'});
  $('tHello').textContent='Welcome, '+curName+'. Here is how your class is doing today.';
  renderAttendance(c,R);renderHomework(c,R);renderStruggling(c,R);renderTop(R);renderMessages(c,R);renderAssigned(c,R);
}

/* ----- Attendance ----- */
function renderAttendance(c,R){
  var att=attendanceToday(c),absent=R.filter(function(r){return att[r.email]==='absent'});
  $('aCame').textContent=R.length-absent.length;$('aAbs').textContent=absent.length;
  var list=$('aList');list.innerHTML='';
  if(!absent.length)list.appendChild(el('span','t-note','Everyone is here today.'));
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
  var list=c.homework.filter(function(h){return h.grade===CLASS_GRADE}).slice().reverse(),sel=$('hSel');
  sel.innerHTML='';
  list.forEach(function(h){var o=el('option',null,h.subject+' – '+h.task);o.value=h.id;sel.appendChild(o)});
  if(selHw&&list.some(function(h){return h.id===selHw}))sel.value=selHw;
  selHw=sel.value||null;
  var h=list.filter(function(x){return x.id===selHw})[0],box=$('hList');box.innerHTML='';
  if(!h){$('hDid').textContent=0;$('hNot').textContent=0;$('hRemind').disabled=true;$('hStatus').textContent='No homework assigned yet.';return}
  var not=R.filter(function(r){return !h.done[r.email]});
  $('hDid').textContent=R.length-not.length;$('hNot').textContent=not.length;
  if(!not.length)box.appendChild(el('span','t-note','Everyone has done this homework.'));
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

/* ----- Who is struggling ----- */
function renderStruggling(c,R){
  var sc=c.scores.fractions||{};
  var low=R.filter(function(r){return sc[r.email]!=null&&sc[r.email]<50}).sort(function(a,b){return sc[a.email]-sc[b.email]});
  $('sHead').textContent=low.length?plural(low.length,'learner')+' failed Fractions quiz (below 50%)':'No learners are below 50% in the Fractions quiz.';
  var box=$('sList');box.innerHTML='';
  low.forEach(function(r){box.appendChild(chip(r.name+' · '+sc[r.email]+'%','red'))});
  $('sExtra').disabled=!low.length;
  var x=c.extra.filter(function(z){return z.topic==='Fractions'}).pop();
  if(x){var d=x.to.filter(function(e){return x.done[e]}).length;$('sStatus').textContent='Extra lesson sent '+when(x.date)+' to '+plural(x.to.length,'learner')+' · '+d+' completed.'}
  else $('sStatus').textContent='';
}
$('sExtra').onclick=function(){
  var c=getClass(),R=roster(),sc=c.scores.fractions||{};
  var to=R.filter(function(r){return sc[r.email]!=null&&sc[r.email]<50}).map(function(r){return r.email});
  if(!to.length)return;
  c.extra.push({id:'x'+Date.now(),topic:'Fractions',to:to,done:{},date:new Date().toISOString()});saveClass(c);
  toast('Extra lesson sent to '+plural(to.length,'learner'));render();
};

/* ----- Who is doing well ----- */
function renderTop(R){
  var top=R.slice().sort(function(a,b){return b.stars-a.stars}).slice(0,3),ol=$('topList');ol.innerHTML='';
  top.forEach(function(r,i){var li=el('li');li.appendChild(el('span','rank',i+1));li.appendChild(el('span',null,r.name));li.appendChild(el('span','stars',r.stars+' stars'));ol.appendChild(li)});
}

/* ----- Message to all ----- */
function renderMessages(c,R){
  var box=$('mSent');box.innerHTML='';
  c.messages.filter(function(m){return m.grade===CLASS_GRADE}).slice(0,3).forEach(function(m){
    var d=el('div','t-sent');d.appendChild(el('small',null,'Sent '+when(m.date)));d.appendChild(document.createTextNode(m.text));box.appendChild(d);
  });
}
$('mSend').onclick=function(){
  var t=$('mText').value.trim();
  if(!t){$('mStatus').textContent='Please type a message first.';return}
  var c=getClass(),R=roster();
  c.messages.unshift({id:'m'+Date.now(),text:t,date:new Date().toISOString(),grade:CLASS_GRADE});saveClass(c);
  $('mText').value='';$('mStatus').textContent='';toast('Message sent to '+plural(R.length,'learner'));render();
};

/* ----- Add homework ----- */
function renderAssigned(c,R){
  var box=$('nList');box.innerHTML='';
  var list=c.homework.filter(function(h){return h.grade===CLASS_GRADE}).slice().reverse();
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
  c.homework.push({id:id,subject:s,task:t,due:d,grade:CLASS_GRADE,created:new Date().toISOString(),done:{}});saveClass(c);
  selHw=id;$('nSubject').value='';$('nTask').value='';$('nDue').value=today();st.textContent='';
  toast('Homework added. Learners can see it now.');render();
};

if(requireLogin(true)){
  initChrome();
  var dl=$('subjectList');S.forEach(function(s){var o=el('option');o.value=s.n;dl.appendChild(o)});
  $('nDue').value=today();
  render();liveSync(render);
}
