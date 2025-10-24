// VibePlan script - fixed layout and responsive card actions with GitHub sync support
const CREDENTIALS = { user: "Roman", pass: "12345678" };
const STATE_KEY = "vibeplan_state_v1";
const SETTINGS_KEY = "vibeplan_settings_v1";

let state = null;
let settings = null;

function $(id){ return document.getElementById(id); }

function defaultIdeas(){
  return {
    weekStart: new Date().toISOString().slice(0,10),
    items: [
      { day: 'Пн', category:'Животные', title:'Cute dog tshirt', es:'Mi perro es mi familia — diseño divertido con huella', en:'My dog is my family — cute paw design', platforms:{tiktok:true,instagram:true,redbubble:true}, published:false },
      { day: 'Пн', category:'Экология', title:'Green Future', es:'Green Future / Futuro Verde — energía y esperanza', en:'Green Future — bright eco message', platforms:{tiktok:true,instagram:false,redbubble:true}, published:false },
      { day: 'Вт', category:'Принты', title:'Minimal cat poster', es:'Reina del sofá — póster minimalista', en:'Queen of the couch — minimal poster', platforms:{tiktok:false,instagram:true,redbubble:true}, published:false },
      { day: 'Вт', category:'Тренды', title:'TikTok quick eco tip', es:'Pequeñas acciones, gran impacto', en:'Small actions, big impact', platforms:{tiktok:true,instagram:true,redbubble:false}, published:false },
      { day: 'Ср', category:'Экология', title:'Plant trees', es:'Planta Más Árboles — llamada a la acción', en:'Plant More Trees — call to action', platforms:{tiktok:true,instagram:true,redbubble:true}, published:false },
      { day: 'Ср', category:'Животные', title:'Parrot art', es:'Colores vivos, amor por las aves', en:'Bright parrot art - perfect for mugs', platforms:{tiktok:false,instagram:true,redbubble:true}, published:false },
      { day: 'Чт', category:'Спорт', title:'Active life', es:'Mueve tu cuerpo — tips rápidos', en:'Move your body — short workout', platforms:{tiktok:true,instagram:false,redbubble:false}, published:false },
      { day: 'Чт', category:'Принты', title:'Eco tote bag', es:'Bolsas reutilizables con estilo', en:'Stylish reusable tote bags', platforms:{tiktok:false,instagram:true,redbubble:true}, published:false },
      { day: 'Пт', category:'Тренды', title:'Viral idea', es:'Challenge eco-friendly - invita a amigos', en:'Eco challenge - invite friends', platforms:{tiktok:true,instagram:true,redbubble:false}, published:false },
      { day: 'Пт', category:'Животные', title:'Bunny love', es:'Conejito tierno para posters y tazas', en:'Cute bunny for posters and mugs', platforms:{tiktok:false,instagram:true,redbubble:true}, published:false },
      { day: 'Сб', category:'Экология', title:'Save the ocean', es:'Salva el Océano — muestra la belleza marina', en:'Save the Ocean — show marine beauty', platforms:{tiktok:true,instagram:true,redbubble:true}, published:false },
      { day: 'Сб', category:'Принты', title:'Custom pet portrait', es:'Retrato personalizado a partir de foto', en:'Custom pet portrait from photo', platforms:{tiktok:false,instagram:true,redbubble:true}, published:false },
      { day: 'Вс', category:'Лайфстайл', title:'Relax & recharge', es:'Domingo de descanso y recarga', en:'Sunday rest and recharge', platforms:{tiktok:false,instagram:true,redbubble:false}, published:false }
    ]
  };
}

function loadState(){
  const raw = localStorage.getItem(STATE_KEY);
  if(raw) state = JSON.parse(raw);
  else { state = defaultIdeas(); saveState(); }
}

function saveState(){
  localStorage.setItem(STATE_KEY, JSON.stringify(state));
}

function loadSettings(){
  const raw = localStorage.getItem(SETTINGS_KEY);
  if(raw) settings = JSON.parse(raw);
  else settings = { ghOwner:'', ghRepo:'', ghPath:'ideas.json', ghToken:'' };
}

function saveSettings(){
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function renderWeek(){
  const weekGrid = $('weekGrid');
  weekGrid.innerHTML = '';
  const days = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
  for(const d of days){
    const col = document.createElement('div');
    col.className = 'card';
    const title = document.createElement('div'); title.className='dayTitle';
    title.innerHTML = `<strong>${d}</strong><span class="small">день</span>`;
    col.appendChild(title);
    const posts = state.items.filter(it=>it.day===d);
    if(!posts.length){
      const p = document.createElement('div'); p.className='small'; p.textContent='Нет идей на этот день';
      col.appendChild(p);
    } else {
      // For stable references, we will iterate by index in state.items and render those that match day.
      state.items.forEach((post, globalIdx)=>{
        if(post.day !== d) return;
        const card = document.createElement('div'); card.className='idea-card';
        const h = document.createElement('h4'); h.textContent = post.title;
        const langDiv = document.createElement('div'); langDiv.className='langs';
        langDiv.innerHTML = `<em>ES:</em> ${post.es}<br><em>EN:</em> ${post.en}`;
        const meta = document.createElement('div'); meta.className='meta';
        // platform checkboxes (visual only, persist)
        const cbTik = document.createElement('label'); cbTik.className='checkbox-inline';
        cbTik.innerHTML = `<input type="checkbox" data-idx="${globalIdx}" data-plat="tiktok" ${post.platforms.tiktok? 'checked':''}/> TikTok`;
        const cbIG = document.createElement('label'); cbIG.className='checkbox-inline';
        cbIG.innerHTML = `<input type="checkbox" data-idx="${globalIdx}" data-plat="instagram" ${post.platforms.instagram? 'checked':''}/> Instagram`;
        const cbRB = document.createElement('label'); cbRB.className='checkbox-inline';
        cbRB.innerHTML = `<input type="checkbox" data-idx="${globalIdx}" data-plat="redbubble" ${post.platforms.redbubble? 'checked':''}/> RedBubble`;
        meta.appendChild(cbTik); meta.appendChild(cbIG); meta.appendChild(cbRB);
        // actions
        const actions = document.createElement('div'); actions.className='idea-actions';
        const pubBtn = document.createElement('button'); pubBtn.textContent = post.published? '✅ Опубликовано':'Отметить';
        pubBtn.dataset.action = 'togglePub'; pubBtn.dataset.idx = globalIdx;
        const editBtn = document.createElement('button'); editBtn.textContent = 'Редактировать';
        editBtn.dataset.action = 'edit'; editBtn.dataset.idx = globalIdx;
        const delBtn = document.createElement('button'); delBtn.textContent = 'Удалить';
        delBtn.dataset.action = 'del'; delBtn.dataset.idx = globalIdx;
        actions.appendChild(pubBtn); actions.appendChild(editBtn); actions.appendChild(delBtn);
        // assemble
        card.appendChild(h); card.appendChild(langDiv); card.appendChild(meta); card.appendChild(actions);
        col.appendChild(card);
      });
    }
    weekGrid.appendChild(col);
  }
  // wire events
  document.querySelectorAll('.checkbox-inline input[type="checkbox"]').forEach(cb=>cb.onchange = onPlatformToggle);
  document.querySelectorAll('.idea-actions button').forEach(b=>b.onclick = onActionClick);
}

function onPlatformToggle(e){
  const idx = parseInt(e.target.dataset.idx);
  const plat = e.target.dataset.plat;
  if(typeof idx !== 'number' || !state.items[idx]) return;
  state.items[idx].platforms[plat] = e.target.checked;
  saveState();
}

function onActionClick(e){
  const action = e.target.dataset.action;
  const idx = parseInt(e.target.dataset.idx);
  if(action === 'togglePub'){
    state.items[idx].published = !state.items[idx].published;
    saveState(); renderWeek();
  } else if(action === 'edit'){
    openNewModal(state.items[idx]);
  } else if(action === 'del'){
    if(confirm('Удалить идею?')){
      state.items.splice(idx,1); saveState(); renderWeek();
    }
  }
}

// UI and modals
function showModal(id){ $(id).classList.add('show'); }
function hideModal(id){ $(id).classList.remove('show'); }

function initUI(){
  $('loginBtn').onclick = onLogin;
  $('btnLogout').onclick = onLogout;
  $('btnNew').onclick = ()=> openNewModal();
  $('btnExport').onclick = exportTXT;
  $('btnSettings').onclick = ()=> showSettings();
  $('saveSettings').onclick = saveSettingsUI;
  $('syncBtn').onclick = syncNow;
  $('closeSettings').onclick = ()=> hideModal('settingsModal');
  $('closeNew').onclick = ()=> hideModal('newModal');
  $('saveIdea').onclick = saveIdeaFromModal;
  $('loginUser').value = CREDENTIALS.user;
}

function onLogin(){
  const u = $('loginUser').value.trim();
  const p = $('loginPass').value;
  if(u===CREDENTIALS.user && p===CREDENTIALS.pass){
    hideModal('loginModal');
    loadState();
    loadSettings();
    renderWeek();
  } else {
    alert('Неверный логин или пароль');
  }
}

function onLogout(){ location.reload(); }

function openNewModal(post){
  showModal('newModal');
  if(post){
    const idx = state.items.indexOf(post);
    $('newModal').dataset.editIdx = idx;
    $('ideaCategory').value = post.category || 'Животные';
    $('ideaTitle').value = post.title || '';
    $('ideaTextES').value = post.es || '';
    $('ideaTextEN').value = post.en || '';
    $('forTikTok').checked = !!post.platforms.tiktok;
    $('forIG').checked = !!post.platforms.instagram;
    $('forRB').checked = !!post.platforms.redbubble;
  } else {
    delete $('newModal').dataset.editIdx;
    $('ideaCategory').value = 'Животные';
    $('ideaTitle').value = '';
    $('ideaTextES').value = '';
    $('ideaTextEN').value = '';
    $('forTikTok').checked = true;
    $('forIG').checked = true;
    $('forRB').checked = false;
  }
}

function saveIdeaFromModal(){
  const cat = $('ideaCategory').value;
  const title = $('ideaTitle').value.trim() || 'Без названия';
  const es = $('ideaTextES').value.trim();
  const en = $('ideaTextEN').value.trim();
  const p = { tiktok:!!$('forTikTok').checked, instagram:!!$('forIG').checked, redbubble:!!$('forRB').checked };
  const editIdx = $('newModal').dataset.editIdx;
  if(editIdx !== undefined){
    const i = parseInt(editIdx);
    state.items[i].category = cat;
    state.items[i].title = title;
    state.items[i].es = es;
    state.items[i].en = en;
    state.items[i].platforms = p;
  } else {
    // add to today's day
    const days = ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'];
    const today = new Date().getDay();
    const day = days[today];
    state.items.push({ day, category:cat, title, es, en, platforms:p, published:false });
  }
  saveState(); hideModal('newModal'); renderWeek();
}

function exportTXT(){
  let out = '';
  const days = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
  for(const d of days){
    out += d + '\n';
    const posts = state.items.filter(it=>it.day===d);
    for(const p of posts){
      out += `- ${p.title} | ES: ${p.es} | EN: ${p.en} | TikTok:${p.platforms.tiktok?'Y':'N'} IG:${p.platforms.instagram?'Y':'N'} RB:${p.platforms.redbubble?'Y':'N'} | Published:${p.published? 'Y':'N'}\n`;
    }
    out += '\n';
  }
  const blob = new Blob([out], {type:'text/plain;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'vibeplan_week.txt'; a.click();
  URL.revokeObjectURL(url);
}

// Settings UI
function showSettings(){
  showModal('settingsModal');
  loadSettings();
  $('ghOwner').value = settings.ghOwner || '';
  $('ghRepo').value = settings.ghRepo || '';
  $('ghPath').value = settings.ghPath || 'ideas.json';
  $('ghToken').value = settings.ghToken || '';
}

function saveSettingsUI(){
  settings.ghOwner = $('ghOwner').value.trim();
  settings.ghRepo = $('ghRepo').value.trim();
  settings.ghPath = $('ghPath').value.trim() || 'ideas.json';
  settings.ghToken = $('ghToken').value.trim();
  saveSettings();
  hideModal('settingsModal');
  alert('Настройки сохранены локально. Для синхронизации нажмите "Синхронизировать сейчас".');
}

// GitHub sync (basic)
async function syncNow(){
  if(!settings.ghOwner || !settings.ghRepo || !settings.ghToken){
    alert('Заполните настройки GitHub (owner, repo, token) в настройках.');
    showSettings();
    return;
  }
  const apiBase = `https://api.github.com/repos/${settings.ghOwner}/${settings.ghRepo}/contents/${settings.ghPath}`;
  let sha = null;
  try{
    const resGet = await fetch(apiBase, { headers: { Authorization: 'token ' + settings.ghToken }});
    if(resGet.ok){
      const j = await resGet.json();
      sha = j.sha;
    }
  }catch(e){}
  const content = btoa(unescape(encodeURIComponent(JSON.stringify(state, null, 2))));
  const body = { message: 'Update VibePlan ideas', content };
  if(sha) body.sha = sha;
  const res = await fetch(apiBase, {
    method: 'PUT',
    headers: { Authorization: 'token ' + settings.ghToken, 'Content-Type':'application/json' },
    body: JSON.stringify(body)
  });
  if(res.ok) alert('Синхронизировано с GitHub.');
  else {
    const text = await res.text();
    alert('Ошибка при синхронизации: ' + res.status + '\n' + text);
  }
}

// init
function start(){
  initUI();
  loadState();
  loadSettings();
  showModal('loginModal');
}

start();
