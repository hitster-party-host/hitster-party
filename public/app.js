const s=io();let me=null,state=null,yt=null,pending=null,clockStarted=false;
const $=id=>document.getElementById(id);const show=(id,on=true)=>$(id).classList.toggle('hidden',!on);
$('showJoin').onclick=()=>show('joinBox');$('year').oninput=e=>$('yearOut').value=e.target.value;
$('create').onclick=()=>s.emit('create',{name:$('name').value},done);$('join').onclick=()=>s.emit('join',{name:$('name').value,code:$('code').value},done);
function done(r){if(!r.ok){$('error').textContent=r.error;return}me=r.id;history.replaceState(null,'',`/?room=${r.code}`);show('entry',false);show('game');$('roomBadge').textContent=`חדר ${r.code}`;show('roomBadge')}
const q=new URLSearchParams(location.search).get('room');if(q){show('joinBox');$('code').value=q}
$('start').onclick=()=>s.emit('start');$('guess').onclick=()=>s.emit('guess',{year:+$('year').value});$('reveal').onclick=()=>s.emit('reveal');$('next').onclick=()=>s.emit('next');
$('tapHint').onclick=()=>{if(yt?.playVideo)yt.playVideo()};
window.onYouTubeIframeAPIReady=()=>{if(pending)loadYT(pending)};
function loadYT(id){if(!window.YT?.Player){pending=id;return}pending=null;if(yt?.loadVideoById){yt.loadVideoById(id);return}yt=new YT.Player('player',{height:'100%',width:'100%',videoId:id,playerVars:{playsinline:1,controls:1,rel:0,origin:location.origin},events:{onReady:()=>{},onStateChange:e=>{if(e.data===YT.PlayerState.PLAYING){show('tapHint',false);if(!clockStarted){clockStarted=true;s.emit('playback')}}},onAutoplayBlocked:()=>show('tapHint')}})}
s.on('state',r=>{const changed=state?.round!==r.round;state=r;render(changed)});s.on('playback-started',()=>{$('prompt').textContent='השיר מתנגן — איזו שנה?'});
function render(changed){const mine=state.players.find(p=>p.id===me),host=state.hostId===me;document.querySelectorAll('.host').forEach(x=>x.classList.toggle('hidden',!host));$('round').textContent=state.round;$('bigcode').textContent=state.code;show('lobby',state.phase==='lobby');show('playing',state.phase==='playing');show('revealed',state.phase==='reveal');
 $('players').innerHTML=state.players.map(p=>`<div><span><i class="dot"></i>${esc(p.name)}${p.id===state.hostId?' 👑':''}</span><b class="${p.ready?'ready':''}">${p.score} ${p.ready?'✓':''}</b></div>`).join('');
 if(state.phase==='playing'){if(changed){clockStarted=false;$('prompt').textContent=host?'הפעילו את השיר':'מחכים שהמארח יפעיל את השיר…';$('year').value=2000;$('yearOut').value=2000}show('hostPlayer',host);if(host&&state.current)loadYT(state.current.id);const locked=mine?.guess!=null;$('guess').disabled=locked;$('year').disabled=locked;show('locked',locked)}
 if(state.phase==='reveal'){const x=state.reveal;$('song').textContent=`${x.title} — ${x.artist}`;$('answerYear').textContent=x.year;const last=mine?.timeline.find(t=>t.title===x.title&&t.year===x.year);$('myResult').textContent=last?`ניחשת ${last.guess}. ${Math.abs(last.guess-x.year)===0?'בול! +3':Math.abs(last.guess-x.year)<=2?'קרוב מאוד! +2':Math.abs(last.guess-x.year)<=5?'קרוב! +1':'לא הפעם'}`:''}
 $('timeline').innerHTML=mine?.timeline.length?mine.timeline.map(t=>`<div class="tile"><b>${t.year}</b><strong>${esc(t.title)}</strong><small>${esc(t.artist)}</small></div>`).join(''):'<span class="empty">השירים שצברת יופיעו כאן</span>'}
function esc(x){return String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
