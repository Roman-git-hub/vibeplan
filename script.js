// VibePlan — Online sync (fixed) - saves checkboxes and cards reliably
const STORAGE_KEY = 'vibeplan_data_online_v1';
const SETTINGS_KEY = 'vibeplan_settings_online_v1';

let CONFIG = { owner: 'Roman-git-hub', repo: 'vibeplan', path: 'data.json', token: '' };
let state = { meta: { generated: new Date().toISOString() }, items: [] };

function $(id){ return document.getElementById(id); }

function loadFromStorage(){
  try{ const raw = localStorage.getItem(STORAGE_KEY); if(raw) state = JSON.parse(raw); }catch(e){ console.error('load local err', e); }
}

function saveToStorage(){ try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }catch(e){ console.error('save err', e); } }

function loadSettings(){
  try{ const s = localStorage.getItem(SETTINGS_KEY); if(s) CONFIG = JSON.parse(s);
    $('inpOwner').value = CONFIG.owner || '';
    $('inpRepo').value = CONFIG.repo || '';
    $('inpPath').value = CONFIG.path || 'data.json';
    $('inpToken').value = CONFIG.token || '';
  }catch(e){ console.error('load settings err', e); }
}

function saveSettings(){
  CONFIG.owner = $('inpOwner').value.trim();
  CONFIG.repo = $('inpRepo').value.trim();
  CONFIG.path = $('inpPath').value.trim() || 'data.json';
  CONFIG.token = $('inpToken').value.trim();
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(CONFIG));
  updateStatus('Настройки сохранены локально');
}

// sample data if empty
function sampleData(){ return { meta:{generated:new Date().toISOString()}, items: [ { day:'Пн', category:'Животные', title:'Cute dog tshirt', es:'Mi perro es mi familia', en:'My dog is my family', platforms:{tiktok:true,instagram:true,redbubble:false}, published:false } ] }; }

function escapeHtml(s){ if(!s) return ''; return s.replace(/[&<>"']/g, function(c){ return ({ '&':'&amp;','<':'&lt;','>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]; }); }

function render(){
  const week = $('weekGrid'); week.innerHTML = '';
  const days = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
  days.forEach(d=>{
    const col = document.createElement('div'); col.className='card';
    const title = document.createElement('div'); title.innerHTML = `<strong>${d}</strong>`; col.appendChild(title);
    const posts = state.items.filter(x=>x.day===d);
    if(posts.length===0){
      const p = document.createElement('div'); p.className='small'; p.textContent='Нет идей'; col.appendChild(p);
    } else {
      posts.forEach((p)=>{
        const idxGlobal = state.items.indexOf(p);
        const c = document.createElement('div'); c.className='idea-card';
        c.innerHTML = `<h4>${escapeHtml(p.title)}</h4><div class='small'><em>ES:</em> ${escapeHtml(p.es)}<br><em>EN:</em> ${escapeHtml(p.en)}</div>`;

        const plats = document.createElement('div'); plats.className='idea-platforms';
        plats.innerHTML = `
          <label><input type="checkbox" data-idx="${idxGlobal}" data-id="${encodeURIComponent(p.title)}" data-plat="tiktok" ${p.platforms.tiktok? 'checked':''}/> TikTok</label>
          <label><input type="checkbox" data-idx="${idxGlobal}" data-id="${encodeURIComponent(p.title)}" data-plat="instagram" ${p.platforms.instagram? 'checked':''}/> Instagram</label>
          <label><input type="checkbox" data-idx="${idxGlobal}" data-id="${encodeURIComponent(p.title)}" data-plat="redbubble" ${p.platforms.redbubble? 'checked':''}/> RedBubble</label>
        `;

        const actions = document.createElement('div'); actions.className='idea-actions';
        const edit = document.createElement('button'); edit.textContent='Изменить'; edit.onclick = ()=>openEdit(p);
        const del = document.createElement('button'); del.textContent='Удалить'; del.onclick = ()=>{ const i = state.items.indexOf(p); if(i>-1){ state.items.splice(i,1); saveToStorage(); render(); updateStatus('Идея удалена'); } };

        actions.appendChild(edit); actions.appendChild(del);
        c.appendChild(plats); c.appendChild(actions); col.appendChild(c);
      });
    }
    week.appendChild(col);
  });
  bindCheckboxes();
}

function bindCheckboxes(){
  document.querySelectorAll('.idea-platforms input[type="checkbox"]').forEach(cb=>{
    cb.onchange = (e)=>{
      const idx = parseInt(e.target.dataset.idx,10);
      const plat = e.target.dataset.plat;
      if(!isNaN(idx) && state.items[idx]){
        state.items[idx].platforms[plat] = e.target.checked;
        saveToStorage();
        updateStatus('Изменения сохранены локально');
      }
    };
  });
}

function openEdit(item){
  showModal('newModal');
  const idx = state.items.indexOf(item);
  $('newModal').dataset.editIdx = idx;
  $('ideaDay').value = item.day;
  $('ideaCategory').value = item.category;
  $('ideaTitle').value = item.title;
  $('ideaTextES').value = item.es;
  $('ideaTextEN').value = item.en;
  $('platTik').checked = !!item.platforms.tiktok;
  $('platIG').checked = !!item.platforms.instagram;
  $('platRB').checked = !!item.platforms.redbubble;
}

function showModal(id){ $(id).classList.add('show'); }
function hideModal(id){ $(id).classList.remove('show'); }
function addNew(){ showModal('newModal'); delete $('newModal').dataset.editIdx; $('ideaDay').value='Пн'; $('ideaCategory').value='Животные'; $('ideaTitle').value=''; $('ideaTextES').value=''; $('ideaTextEN').value=''; $('platTik').checked=true; $('platIG').checked=true; $('platRB').checked=false; }

function saveIdea(){
  const edit = $('newModal').dataset.editIdx;
  const day = $('ideaDay').value;
  const cat = $('ideaCategory').value.trim() || 'Без категории';
  const title = $('ideaTitle').value.trim() || ('Без названия ' + (new Date().getTime()%1000));
  const es = $('ideaTextES').value.trim();
  const en = $('ideaTextEN').value.trim();
  const p = { tiktok:!!$('platTik').checked, instagram:!!$('platIG').checked, redbubble:!!$('platRB').checked };
  if(edit!==undefined){
    const i = parseInt(edit,10);
    state.items[i] = { day, category:cat, title, es, en, platforms:p, published:false };
  } else {
    state.items.push({ day, category:cat, title, es, en, platforms:p, published:false });
  }
  hideModal('newModal');
  saveToStorage();
  render();
  updateStatus('Идея сохранена локально');
}

function exportTXT(){
  let out='';
  const days=['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
  for(const d of days){
    out+=d+'\n';
    const posts = state.items.filter(x=>x.day===d);
    for(const p of posts){
      out+=`- ${p.title} | ES:${p.es} | EN:${p.en} | T:${p.platforms.tiktok?1:0} I:${p.platforms.instagram?1:0} R:${p.platforms.redbubble?1:0}\n`;
    }
    out+='\n';
  }
  const blob = new Blob([out],{type:'text/plain'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'vibeplan.txt'; a.click();
  updateStatus('Экспорт готов');
}

// GitHub helpers
function ghHeaders(){ return { Authorization: 'token ' + CONFIG.token, Accept: 'application/vnd.github.v3+json' }; }

async function fetchRemote(){
  updateStatus('Загружаю с GitHub...');
  const api = `https://api.github.com/repos/${CONFIG.owner}/${CONFIG.repo}/contents/${CONFIG.path}`;
  try{
    const r = await fetch(api, { headers: ghHeaders() });
    if(r.status===200){
      const j = await r.json();
      const raw = atob(j.content.replace(/\n/g,''));
      const parsed = JSON.parse(raw);
      if(parsed && parsed.items) state = parsed;
      saveToStorage();
      render();
      updateStatus('Данные загружены из GitHub');
      return j.sha;
    } else if(r.status===404){
      updateStatus('Файл не найден — будет создан при синхронизации');
      return null;
    } else {
      const t = await r.text();
      updateStatus('Ошибка загрузки: '+r.status);
      console.error('fetchRemote err', t);
      return null;
    }
  }catch(e){
    console.error('fetchRemote exception', e);
    updateStatus('Ошибка при загрузке с GitHub');
    return null;
  }
}

async function pushRemote(){
  // ensure current local state saved
  saveToStorage();
  updateStatus('Отправка на GitHub...');
  const api = `https://api.github.com/repos/${CONFIG.owner}/${CONFIG.repo}/contents/${CONFIG.path}`;
  let sha = null;
  try{
    const g = await fetch(api, { headers: ghHeaders() });
    if(g.ok){ const gj = await g.json(); sha = gj.sha; }
  }catch(e){ console.warn('get sha failed', e); }

  try{
    const json = JSON.stringify(state, null, 2);
    const content = btoa(unescape(encodeURIComponent(json)));
    const body = { message: 'VibePlan: update', content: content, committer: { name: CONFIG.owner || 'user', email: CONFIG.owner ? CONFIG.owner + '@users.noreply.github.com' : 'no-reply' } };
    if(sha) body.sha = sha;
    const res = await fetch(api, { method:'PUT', headers: Object.assign({ 'Content-Type':'application/json' }, ghHeaders()), body: JSON.stringify(body) });
    if(res.ok){ updateStatus('✅ Синхронизация успешна'); return true; } else { const t = await res.text(); console.error('push err', t); updateStatus('Ошибка записи: '+res.status); return false; }
  }catch(e){
    console.error('push exception', e);
    updateStatus('Ошибка при отправке на GitHub');
    return false;
  }
}

function updateStatus(t){ $('syncStatus').textContent = 'Статус: ' + t; }

// initialization
function init(){
  loadSettings();
  loadFromStorage();
  if(!state || !state.items || !state.items.length) state = sampleData();
  render();

  $('btnNew').onclick = addNew;
  $('btnSync').onclick = async ()=>{
    if(!CONFIG.token || !CONFIG.owner || !CONFIG.repo){ updateStatus('Заполните настройки (owner, repo, token)'); showModal('settingsModal'); return; }
    await pushRemote();
  };
  $('btnFetch').onclick = async ()=>{
    if(!CONFIG.token || !CONFIG.owner || !CONFIG.repo){ updateStatus('Заполните настройки (owner, repo, token)'); showModal('settingsModal'); return; }
    await fetchRemote();
  };
  $('btnExport').onclick = exportTXT;
  $('btnSettings').onclick = ()=>showModal('settingsModal');
  $('saveSettings').onclick = ()=>{ saveSettings(); hideModal('settingsModal'); };
  $('closeSettings').onclick = ()=>hideModal('settingsModal');
  $('saveIdea').onclick = saveIdea;
  $('closeNew').onclick = ()=>hideModal('newModal');
  updateStatus('Готово');
  window.addEventListener('beforeunload', ()=>{ saveToStorage(); });
}

document.addEventListener('DOMContentLoaded', init);
