/* Login / Register page (learners register themselves; the tutor account is a demo account) */
var mode='login';
function goHome(){location.replace(realRole==='tutor'?'tutor.html':'index.html')}
if(loadSession())goHome();

function setMode(m){mode=m;
  $('aLogin').classList.toggle('on',m==='login');$('aReg').classList.toggle('on',m==='register');
  $('aName').style.display=m==='register'?'block':'none';
  $('aGrade').style.display=m==='register'?'block':'none';
  $('demoBox').hidden=m==='register';
  $('aGo').textContent=m==='register'?'Create my account':'Log in';$('aErr').textContent='';}
async function go(){
  var err=$('aErr'),u=$('aUser').value.trim().toLowerCase(),p=$('aPass').value,n=$('aName').value.trim(),g=$('aGrade').value;
  if(!(window.crypto&&crypto.subtle)){err.textContent='Secure login is not available in this browser.';return}
  await ready;users=readUsers();
  if(mode==='register'){
    if(!n){err.textContent='Please enter your first name.';return}
    if(!g){err.textContent='Please choose your grade.';return}
    if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(u)){err.textContent='Please enter a valid email address.';return}
    if(p.length<6){err.textContent='Password must be at least 6 characters.';return}
    if(has(u)){err.textContent='That email is already registered.';return}
    var salt=hex(crypto.getRandomValues(new Uint8Array(8)));
    users[u]={name:n,role:'learner',grade:+g,salt:salt,hash:await hashPw(p,salt),p:blank()};saveUsers();
  }else{
    var r=has(u)?users[u]:null;
    if(!r||(await hashPw(p,r.salt))!==r.hash){err.textContent='Wrong email or password.';return}
  }
  setSession(u);loadSession();goHome();
}
$('aLogin').onclick=function(){setMode('login')};
$('aReg').onclick=function(){setMode('register')};
$('aGo').onclick=go;
$('dTutor').onclick=function(){$('aUser').value=DEMO_TUTOR;$('aPass').value=DEMO_PW.tutor};
['aName','aUser','aPass'].forEach(function(id){$(id).addEventListener('keydown',function(e){if(e.key==='Enter')go()})});
