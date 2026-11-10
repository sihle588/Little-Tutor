/* Learn page: search for a subject */
function doSearch(){renderSubjects($('subs'),$('search').value,function(s){location.href='subject.html?s='+s.id})}
if(requireLogin()){initChrome();$('search').addEventListener('input',doSearch);doSearch();$('search').focus()}
