/* Rewards page: total stars and badges */
function renderRewards(){
  $('rStars').textContent=P.stars;
  var c=getClass(),all=true,perfect=false;
  c.homework.filter(function(w){return w.grade===grade}).slice(-6).forEach(function(w){if(!(w.done&&w.done[cur]))all=false});
  S.forEach(function(s){s.hw.forEach(function(h){if(h.today&&P.hw[h.id]!==today())all=false});if(s.quiz.length&&(P.quiz[s.id]||0)===s.quiz.length)perfect=true});
  var ms=S.filter(function(s){return s.id==='maths'})[0];
  var on={b1:streakNow()>=5,b2:P.stars>=100,b3:!!ms&&mast(ms)>=80,b4:all,b5:perfect};
  Object.keys(on).forEach(function(id){$(id).classList.toggle('on',on[id])});
}
if(requireLogin()){initChrome();window.onProgress=renderRewards;renderRewards()}
