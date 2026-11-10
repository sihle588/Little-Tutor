/* Forgot password page: reset a password with a demo 6-digit code (no email, no backend) */
var fUser=null,fCode='',fTries=0;

function show(n){['s1','s2','s3','s4'].forEach(function(id,i){$(id).hidden=(i+1)!==n})}
function newCode(){var a=new Uint32Array(1);crypto.getRandomValues(a);return String(100000+(a[0]%900000))}

/* Steps 1-2: find the account and "send" the code (shown on screen for the demo) */
async function sendCode(){
  await ready;users=readUsers();
  var u=$('fUser').value.trim().toLowerCase(),err=$('fErr1');
  if(!u){err.textContent='Please enter your email address.';return}
  if(!has(u)){err.textContent='No account found with that email address.';return}
  fUser=u;fCode=newCode();fTries=0;err.textContent='';
  $('fDemo').textContent=fCode;$('fCode').value='';$('fErr2').textContent='';
  show(2);$('fCode').focus();
}

/* Steps 3-4: check the code the learner typed */
function checkCode(){
  var c=$('fCode').value.trim(),err=$('fErr2');
  if(!/^\d{6}$/.test(c)){err.textContent='Please enter the 6-digit code.';return}
  if(c!==fCode){
    fTries++;
    if(fTries>=5){fCode='';$('fErr1').textContent='Too many wrong codes. Please start again.';show(1);return}
    err.textContent='That code is not correct. Try again.';return;
  }
  err.textContent='';show(3);$('fNew').focus();
}

/* Step 5: check the new password, save it, show success */
async function savePw(){
  var p=$('fNew').value,q=$('fConfirm').value,err=$('fErr3');
  if(p.length<6){err.textContent='Password must be at least 6 characters.';return}
  if(p!==q){err.textContent='The two passwords do not match.';return}
  if(!(window.crypto&&crypto.subtle)){err.textContent='Secure password saving is not available in this browser.';return}
  var salt=hex(crypto.getRandomValues(new Uint8Array(8)));
  users[fUser].salt=salt;users[fUser].hash=await hashPw(p,salt);
  try{localStorage.setItem('lt_users',JSON.stringify(users))}
  catch(e){err.textContent='Could not save. Please allow storage in your browser.';return}
  fCode='';err.textContent='';show(4);
}

$('fSend').onclick=sendCode;
$('fVerify').onclick=checkCode;
$('fSave').onclick=savePw;
[['fUser',sendCode],['fCode',checkCode],['fNew',savePw],['fConfirm',savePw]].forEach(function(x){
  $(x[0]).addEventListener('keydown',function(e){if(e.key==='Enter')x[1]()});
});
