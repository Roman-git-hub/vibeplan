// VibePlan — Strict online sync (no persisted local state)
// Committer info provided by user:
const COMMITTER = { name: "Roman-git-hub", email: "Roman_Web@outlook.com" };
let CONFIG = { owner: "Roman-git-hub", repo: "vibeplan", path: "data.json", token: "" };
let state = { meta: { generated: new Date().toISOString() }, items: [] };

const SYNC_DEBOUNCE = 700;
const SYNC_INTERVAL = 60000;
let debounceTimer = null;
let periodicTimer = null;

function $(id){ return document.getElementById(id); }

function sample(){ return { meta:{generated:new Date().toISOString()}, items:[ { day:'Пн', category:'Животные', title:'Cute dog tshirt', es:'Mi perro es mi familia', en:'My dog is my family', platforms:{tiktok:true,instagram:true,redbubble:false}, published:false } ] }; }

function updateStatus(t){ $('syncStatus').textContent = 'Статус: ' + t; }

function render(){ const week = $('weekGrid'); week.innerHTML=''; const days=['Пн','Вт','Ср','Чт','Пт','Сб','Вс']; for(const d of days){ const col = document.createElement('div'); col.className='card'; const title = document.createElement('div'); title.innerHTML = `<strong>${d}</strong>`; col.appendChild(title); const posts = state.items.filter(x=>x.day===d); if(posts.length===0){ const p = document.createElement('div'); p.className='small'; p.textContent='Нет идей'; col.appendChild(p); } else { posts.forEach(p=>{ const c = document.createElement('div'); c.className='idea-card'; c.innerHTML = `<h4>${p.title}</h4><div class='small'><em>ES:</em> ${p.es}<br><em>EN:</em> ${p.en}</div>`; const meta = document.createElement('div'); meta.className='idea-actions'; const cbTik = document.createElement('label'); cbTik.innerHTML = `<input type="checkbox" data-title="${encodeURIComponent(p.title)}" data-plat="tiktok" ${p.platforms.tiktok? 'checked':''}/> TikTok`; const cbIG = document.createElement('label'); cbIG.innerHTML = `<input type="checkbox" data-title="${encodeURIComponent(p.title)}" data-plat="instagram" ${p.platforms.instagram? 'checked':''}/> IG`; const cbRB = document.createElement('label'); cbRB.innerHTML = `<input type="checkbox" data-title="${encodeURIComponent(p.title)}" data-plat="redbubble" ${p.platforms.redbubble? 'checked':''}/> RB`; const edit = document.createElement('button'); edit.textContent='Ред'; edit.onclick=()=>openEdit(p); const del = document.createElement('button'); del.textContent='Del'; del.onclick=()=>{ if(confirm('Удалить?')){ const i = state.items.indexOf(p); if(i>-1) state.items.splice(i,1); render(); scheduleSync(); } }; meta.appendChild(cbTik); meta.appendChild(cbIG); meta.appendChild(cbRB); meta.appendChild(edit); meta.appendChild(del); c.appendChild(meta); col.appendChild(c); }); } week.appendChild(col); } bindCheckboxes(); updateStatus('Готово'); }

function bindCheckboxes(){ document.querySelectorAll('.idea-actions input[type="checkbox"]').forEach(cb=>{ cb.onchange = (e)=>{ const title = decodeURIComponent(e.target.dataset.title); const plat = e.target.dataset.plat; const item = state.items.find(x=>x.title===title); if(item){ item.platforms[plat] = e.target.checked; scheduleSync(); } }; }); }

function openEdit(item){ showModal('newModal'); const idx = state.items.indexOf(item); $('newModal').dataset.editIdx = idx; $('ideaCategory').value = item.category; $('ideaTitle').value = item.title; $('ideaTextES').value = item.es; $('ideaTextEN').value = item.en; $('platTik').checked = !!item.platforms.tiktok; $('platIG').checked = !!item.platforms.instagram; $('platRB').checked = !!item.platforms.redbubble; }

function showModal(id){ $(id).classList.add('show'); } function hideModal(id){ $(id).classList.remove('show'); }
function addNew(){ showModal('newModal'); delete $('newModal').dataset.editIdx; $('ideaCategory').value='Животные'; $('ideaTitle').value=''; $('ideaTextES').value=''; $('ideaTextEN').value=''; $('platTik').checked=true; $('platIG').checked=true; $('platRB').checked=false; }

function saveIdea(){ const edit = $('newModal').dataset.editIdx; const cat = $('ideaCategory').value; const title = $('ideaTitle').value.trim()||'Без названия'; const es = $('ideaTextES').value.trim(); const en = $('ideaTextEN').value.trim(); const p = { tiktok:!!$('platTik').checked, instagram:!!$('platIG').checked, redbubble:!!$('platRB').checked }; if(edit!==undefined){ const i = parseInt(edit); state.items[i].category = cat; state.items[i].title = title; state.items[i].es = es; state.items[i].en = en; state.items[i].platforms = p; } else { const days = ['Вс','Пн','Вт','Ср','Чт','Пт','Сб']; const day = days[new Date().getDay()]; state.items.push({ day, category:cat, title, es, en, platforms:p, published:false }); } hideModal('newModal'); render(); scheduleSync(); }

function exportTXT(){ let out=''; const days=['Пн','Вт','Ср','Чт','Пт','Сб','Вс']; for(const d of days){ out+=d+'\n'; const posts = state.items.filter(x=>x.day===d); for(const p of posts){ out+=`- ${p.title} | ES:${p.es} | EN:${p.en} | T:${p.platforms.tiktok?1:0} I:${p.platforms.instagram?1:0} R:${p.platforms.redbubble?1:0}\n`; } out+='\n'; } const blob = new Blob([out],{type:'text/plain'}); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'vibeplan.txt'; a.click(); updateStatus('Экспорт готов'); }

// GitHub API helpers
function ghHeaders(){ return { Authorization: 'token ' + CONFIG.token, Accept: 'application/vnd.github.v3+json' }; }

async function fetchRemote(){ updateStatus('Загрузка с GitHub...'); const api = `https://api.github.com/repos/${CONFIG.owner}/${CONFIG.repo}/contents/${CONFIG.path}`; try{ const r = await fetch(api, { headers: ghHeaders() }); if(r.status===200){ const j = await r.json(); const raw = atob(j.content); const parsed = JSON.parse(raw); state = parsed; render(); return j.sha; } else if(r.status===404){ state = sample(); render(); return null; } else { const t = await r.text(); updateStatus('Ошибка загрузки: '+r.status); throw new Error(t); } }catch(e){ updateStatus('Ошибка сети'); throw e; } }

async function pushRemote(){ updateStatus('Отправляю...'); const api = `https://api.github.com/repos/${CONFIG.owner}/${CONFIG.repo}/contents/${CONFIG.path}`; try{ const getR = await fetch(api, { headers: ghHeaders() }); let sha = null; if(getR.status===200){ const g = await getR.json(); sha = g.sha; } const content = btoa(unescape(encodeURIComponent(JSON.stringify(state, null, 2)))); const body = { message: 'VibePlan: update', content: content, committer: { name: COMMITTER.name, email: COMMITTER.email } }; if(sha) body.sha = sha; const put = await fetch(api, { method:'PUT', headers: Object.assign({ 'Content-Type':'application/json' }, ghHeaders()), body: JSON.stringify(body) }); if(put.ok){ updateStatus('✅ Синхронизировано'); } else { const t = await put.text(); updateStatus('Ошибка записи: '+put.status); console.error('push error', put.status, t); } }catch(e){ updateStatus('Ошибка сети при записи'); console.error(e); } }

function scheduleSync(){ if(!CONFIG.token) return; if(debounceTimer) clearTimeout(debounceTimer); debounceTimer = setTimeout(()=>{ pushRemote(); }, SYNC_DEBOUNCE); }

function startPeriodic(){ if(!CONFIG.token) return; if(periodicTimer) clearInterval(periodicTimer); periodicTimer = setInterval(()=>{ pushRemote(); }, SYNC_INTERVAL); }

function init(){ // UI handlers
  $('btnNew').onclick = addNew; $('btnExport').onclick = exportTXT; $('btnSettings').onclick = ()=>showModal('settingsModal'); $('btnForceSync').onclick = ()=>{ if(!CONFIG.token){ alert('Вставьте PAT в Настройках'); return; } pushRemote(); };
  $('saveSettings').onclick = ()=>{ CONFIG.owner = $('inpOwner').value.trim(); CONFIG.repo = $('inpRepo').value.trim(); CONFIG.path = $('inpPath').value.trim()||'data.json'; CONFIG.token = $('inpToken').value.trim(); hideModal('settingsModal'); if(!CONFIG.token){ updateStatus('Токен не указан — только просмотр'); state = sample(); render(); return; } fetchRemote().then(()=>{ startPeriodic(); }).catch(e=>{ alert('Ошибка при подключении: '+e.message); }); };
  $('closeSettings').onclick = ()=>hideModal('settingsModal'); $('saveIdea').onclick = saveIdea; $('closeNew').onclick = ()=>hideModal('newModal');
  // initial
  state = sample(); render(); updateStatus('Ожидает подключения — открой Настройки и вставь PAT'); // no persistent token by design
  window.addEventListener('beforeunload', ()=>{ if(CONFIG.token){ // best-effort: try to save
    try{ navigator.sendBeacon && navigator.sendBeacon(`https://api.github.com/repos/${CONFIG.owner}/${CONFIG.repo}/contents/${CONFIG.path}`, JSON.stringify(state)); }catch(e){} } });
}

document.addEventListener('DOMContentLoaded', init);
