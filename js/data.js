/* Little Tutor – content setup. Each grade has its own file in js/content/ that fills CONTENT[grade].
   A subject has: homework, one tutor lesson and a quiz. Subjects marked with ph() are placeholders
   until the CAPS topics, homework and quiz questions are added. */
var CONTENT={};
function ph(id,n,s,k){return{id:id,n:n,s:s,topic:'CAPS topics coming soon',k:k||'',hw:[],tut:null,quiz:[]}}
