// script.js — VibePlan (online sync, auto-load, no system popups)
// Copy this whole file over your existing script.js

// ----------------- Utils: base64 <-> utf8 safe -----------------
function b64EncodeUnicode(str) {
  // utf8 -> base64
  return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
    function toSolidBytes(match, p1) {
      return String.fromCharCode('0x' + p1);
    }));
}

function b64DecodeUnicode(str) {
  // base64 -> utf8
  return decodeURIComponent(Array.prototype.map.call(atob(str), function(c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));
}

// ----------------- Config & state -----------------
const SETTINGS_KEY = 'vibeplan_settings';
const STORAGE_KEY = 'vibeplan_state';

let CONFIG = {
  owner: 'Roman-git-hub', // default prefilled
  repo: 'vibeplan',
  path: 'data.json',
  token: '' // read from settings (localStorage) on init
};

let state = {
  meta: { generated: new Date().toISOString() },
  items: []
};

function $ (id) { return document.getElementById(id); }

// ----------------- Storage -----------------
function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) CONFIG = JSON.parse(raw);
  } catch (e) { console.error('loadSettings err', e); }
  // reflect to UI if exists
  if ($('inpOwner')) $('inpOwner').value = CONFIG.owner || '';
  if ($('inpRepo')) $('inpRepo').value = CONFIG.repo || '';
  if ($('inpPath')) $('inpPath').value = CONFIG.path || 'data.json';
  if ($('inpToken')) $('inpToken').value = CONFIG.token || '';
}

function saveSettings() {
  CONFIG.owner = $('inpOwner').value.trim();
  CONFIG.repo = $('inpRepo').value.trim();
  CONFIG.path = $('inpPath').value.trim() || 'data.json';
  CONFIG.token = $('inpToken').value.trim();
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(CONFIG));
  updateStatus('Настройки сохранены локально');
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.items)) {
        state = parsed;
      } else {
        // backward-compat: if stored as array
        if (Array.isArray(parsed)) state.items = parsed;
      }
    }
  } catch (e) { console.error('loadFromStorage err', e); }
}

function saveToStorage() {
  try {
    state.meta = { generated: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) { console.error('saveToStorage err', e); }
}

// ----------------- Helpers -----------------
function updateStatus(t) {
  const el = $('syncStatus');
  if (el) el.textContent = 'Статус: ' + t;
  console.log(t);
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2,8);
}

function normalizeLoaded(parsed) {
  // Accept several shapes and convert to { meta, items: [ {id,title,...} ] }
  if (!parsed) return;

  // Case A: full state object with items array
  if (parsed.items && Array.isArray(parsed.items)) {
    return parsed;
  }

  // Case B: parsed is an array (legacy) -> assign to items
  if (Array.isArray(parsed)) {
    return { meta: { generated: new Date().toISOString() }, items: parsed.map(item => ensureItem(item)) };
  }

  // Case C: object where keys may be dates or other -> try to extract items array
  // If object has numeric keys or custom shape, try to find "items" or "list"
  if (typeof parsed === 'object') {
    if (parsed.items && Array.isArray(parsed.items)) return parsed;
    // if keys are days with arrays
    const possibleItems = [];
    for (const k in parsed) {
      const v = parsed[k];
      if (Array.isArray(v)) {
        v.forEach(it => possibleItems.push(ensureItem(it)));
      } else if (v && Array.isArray(v.ideas)) {
        v.ideas.forEach(it => possibleItems.push(ensureItem(it)));
      }
    }
    if (possibleItems.length) return { meta: { generated: new Date().toISOString() }, items: possibleItems };
  }

  // fallback: empty
  return { meta: { generated: new Date().toISOString() }, items: [] };
}

function ensureItem(it) {
  // normalize single idea item to {id,title,day,category,es,en,platforms,published}
  if (!it) return { id: uid(), title: 'Без названия', day: 'Пн', category: 'Животные', es: '', en: '', platforms: { tiktok: false, instagram: false, redbubble: false }, published: false };
  return {
    id: it.id || uid(),
    title: it.title || it.text || 'Без названия',
    day: it.day || it.date || 'Пн',
    category: it.category || 'Животные',
    es: it.es || '',
    en: it.en || '',
    platforms: it.platforms || { tiktok: !!it.t, instagram: !!it.i, redbubble: !!it.r } || { tiktok:false, instagram:false, redbubble:false },
    published: !!it.published
  };
}

// ----------------- Render UI -----------------
function render() {
  const week = $('weekGrid');
  if (!week) return;
  week.innerHTML = '';
  const days = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];

  days.forEach(d => {
    const col = document.createElement('div');
    col.className = 'card';

    const title = document.createElement('div');
    title.innerHTML = `<strong>${d}</strong>`;
    col.appendChild(title);

    const posts = state.items.filter(x => x.day === d);
    if (posts.length === 0) {
      const p = document.createElement('div');
      p.className = 'small';
      p.textContent = 'Нет идей';
      col.appendChild(p);
    } else {
      posts.forEach(item => {
        const c = document.createElement('div');
        c.className = 'idea-card';

        c.innerHTML = `
          <h4>${escapeHtml(item.title)}</h4>
          <div class="small"><em>ES:</em> ${escapeHtml(item.es)}<br><em>EN:</em> ${escapeHtml(item.en)}</div>
        `;

        const plats = document.createElement('div');
        plats.className = 'idea-platforms';
        plats.innerHTML = `
          <label><input type="checkbox" data-id="${item.id}" data-plat="tiktok" ${item.platforms.tiktok ? 'checked' : ''} /> TikTok</label>
          <label><input type="checkbox" data-id="${item.id}" data-plat="instagram" ${item.platforms.instagram ? 'checked' : ''} /> Instagram</label>
          <label><input type="checkbox" data-id="${item.id}" data-plat="redbubble" ${item.platforms.redbubble ? 'checked' : ''} /> RedBubble</label>
        `;

        const actions = document.createElement('div');
        actions.className = 'idea-actions';
        const edit = document.createElement('button');
        edit.textContent = 'Изменить';
        edit.onclick = () => openEdit(item.id);

        const del = document.createElement('button');
        del.textContent = 'Удалить';
        // immediate delete (no confirm)
        del.onclick = () => {
          const idx = state.items.findIndex(s => s.id === item.id);
          if (idx > -1) {
            state.items.splice(idx, 1);
            saveToStorage();
            render();
            updateStatus('Идея удалена локально');
          }
        };

        actions.appendChild(edit);
        actions.appendChild(del);

        c.appendChild(plats);
        c.appendChild(actions);
        col.appendChild(c);
      });
    }

    week.appendChild(col);
  });

  bindCheckboxes();
}

function escapeHtml(s) {
  if (!s) return '';
  return String(s).replace(/[&<>"']/g, function (c) {
    return ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[c];
  });
}

function bindCheckboxes() {
  document.querySelectorAll('.idea-platforms input[type="checkbox"]').forEach(cb => {
    cb.onchange = (e) => {
      const id = e.target.dataset.id;
      const plat = e.target.dataset.plat;
      const item = state.items.find(x => x.id === id);
      if (item) {
        item.platforms[plat] = !!e.target.checked;
        saveToStorage();
        updateStatus('Изменения сохранены локально');
      }
    };
  });
}

// ----------------- Modals: add/edit -----------------
function openEdit(id) {
  const item = state.items.find(x => x.id === id);
  if (!item) return;
  // populate modal inputs (if you use same modal structure)
  if ($('ideaDay')) $('ideaDay').value = item.day;
  if ($('ideaCategory')) $('ideaCategory').value = item.category;
  if ($('ideaTitle')) $('ideaTitle').value = item.title;
  if ($('ideaTextES')) $('ideaTextES').value = item.es;
  if ($('ideaTextEN')) $('ideaTextEN').value = item.en;
  if ($('platTik')) $('platTik').checked = !!item.platforms.tiktok;
  if ($('platIG')) $('platIG').checked = !!item.platforms.instagram;
  if ($('platRB')) $('platRB').checked = !!item.platforms.redbubble;
  $('newModal').dataset.editId = id;
  showModal('newModal');
}

function addNew() {
  // clear modal
  delete $('newModal').dataset.editId;
  if ($('ideaDay')) $('ideaDay').value = 'Пн';
  if ($('ideaCategory')) $('ideaCategory').value = 'Животные';
  if ($('ideaTitle')) $('ideaTitle').value = '';
  if ($('ideaTextES')) $('ideaTextES').value = '';
  if ($('ideaTextEN')) $('ideaTextEN').value = '';
  if ($('platTik')) $('platTik').checked = true;
  if ($('platIG')) $('platIG').checked = true;
  if ($('platRB')) $('platRB').checked = false;
  showModal('newModal');
}

function saveIdeaFromModal() {
  const editId = $('newModal').dataset.editId;
  const day = $('ideaDay').value || 'Пн';
  const category = ($('ideaCategory').value || 'Животные').trim();
  const title = ($('ideaTitle').value || ('Без названия ' + (Date.now()%1000))).trim();
  const es = $('ideaTextES').value || '';
  const en = $('ideaTextEN').value || '';
  const platforms = { tiktok: !!$('platTik').checked, instagram: !!$('platIG').checked, redbubble: !!$('platRB').checked };

  if (editId) {
    const idx = state.items.findIndex(x => x.id === editId);
    if (idx > -1) {
      state.items[idx] = Object.assign({}, state.items[idx], { day, category, title, es, en, platforms });
    }
  } else {
    state.items.push({
      id: uid(),
      day,
      category,
      title,
      es,
      en,
      platforms,
      published: false
    });
  }

  hideModal('newModal');
  saveToStorage();
  render();
  updateStatus('Идея сохранена локально');
}

function showModal(id) { const m = $(id); if (m) m.classList.add('show'); }
function hideModal(id) { const m = $(id); if (m) m.classList.remove('show'); }

// ----------------- GitHub sync -----------------
function ghHeaders() {
  return { Authorization: 'token ' + (CONFIG.token || ''), Accept: 'application/vnd.github.v3+json' };
}

async function fetchRemote() {
  updateStatus('Загружаю с GitHub...');
  const api = `https://api.github.com/repos/${CONFIG.owner}/${CONFIG.repo}/contents/${CONFIG.path}`;
  try {
    const r = await fetch(api, { headers: ghHeaders() });
    if (r.status === 200) {
      const j = await r.json();
      const raw = b64DecodeUnicode(j.content.replace(/\n/g, ''));
      let parsed;
      try { parsed = JSON.parse(raw); } catch (e) { parsed = null; }
      const normalized = normalizeLoaded(parsed);
      state = normalized;
      saveToStorage();
      render();
      updateStatus('Данные загружены из GitHub');
      return j.sha;
    } else if (r.status === 404) {
      updateStatus('Файл не найден в репозитории — будет создан при синхронизации');
      return null;
    } else {
      const txt = await r.text();
      updateStatus('Ошибка загрузки: ' + r.status);
      console.error('fetchRemote error', r.status, txt);
      return null;
    }
  } catch (e) {
    console.error('fetchRemote exception', e);
    updateStatus('Ошибка при загрузке с GitHub');
    return null;
  }
}

async function pushRemote() {
  updateStatus('Подготовка — сохраняю локально...');
  saveToStorage(); // ensure latest local
  updateStatus('Отправка на GitHub...');

  const api = `https://api.github.com/repos/${CONFIG.owner}/${CONFIG.repo}/contents/${CONFIG.path}`;
  let sha = null;
  try {
    const g = await fetch(api, { headers: ghHeaders() });
    if (g.ok) {
      const gj = await g.json();
      sha = gj.sha;
    }
  } catch (e) {
    console.warn('pushRemote get sha failed', e);
  }

  try {
    const json = JSON.stringify(state, null, 2);
    const content = b64EncodeUnicode(json);
    const body = { message: 'VibePlan: update', content: content, committer: { name: CONFIG.owner || 'user', email: (CONFIG.owner ? CONFIG.owner + '@users.noreply.github.com' : 'no-reply') } };
    if (sha) body.sha = sha;

    const res = await fetch(api, {
      method: 'PUT',
      headers: Object.assign({ 'Content-Type': 'application/json' }, ghHeaders()),
      body: JSON.stringify(body)
    });

    if (res.ok) {
      updateStatus('✅ Синхронизация успешна');
      return true;
    } else {
      const t = await res.text();
      updateStatus('Ошибка записи: ' + res.status);
      console.error('pushRemote error', res.status, t);
      return false;
    }
  } catch (e) {
    console.error('pushRemote exception', e);
    updateStatus('Ошибка при отправке на GitHub');
    return false;
  }
}

// ----------------- Init -----------------
function init() {
  // hook buttons if present
  if ($('btnNew')) $('btnNew').onclick = addNew;
  if ($('btnSync')) $('btnSync').onclick = async () => {
    // ensure settings saved from UI to CONFIG
    if ($('inpOwner')) CONFIG.owner = $('inpOwner').value.trim();
    if ($('inpRepo')) CONFIG.repo = $('inpRepo').value.trim();
    if ($('inpPath')) CONFIG.path = $('inpPath').value.trim() || 'data.json';
    if ($('inpToken')) CONFIG.token = $('inpToken').value.trim();
    // save settings locally
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(CONFIG));
    if (!CONFIG.owner || !CONFIG.repo || !CONFIG.token) {
      updateStatus('Заполните owner/repo/token в настройках перед синхронизацией');
      showModal('settingsModal');
      return;
    }
    await pushRemote();
  };
  if ($('btnFetch')) $('btnFetch').onclick = async () => {
    // load settings from UI to CONFIG (so user can edit before fetch)
    if ($('inpOwner')) CONFIG.owner = $('inpOwner').value.trim();
    if ($('inpRepo')) CONFIG.repo = $('inpRepo').value.trim();
    if ($('inpPath')) CONFIG.path = $('inpPath').value.trim() || 'data.json';
    if ($('inpToken')) CONFIG.token = $('inpToken').value.trim();
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(CONFIG));
    if (!CONFIG.owner || !CONFIG.repo || !CONFIG.token) {
      updateStatus('Заполните owner/repo/token в настройках перед загрузкой');
      showModal('settingsModal');
      return;
    }
    await fetchRemote();
  };
  if ($('btnExport')) $('btnExport').onclick = exportTXT;
  if ($('btnSettings')) $('btnSettings').onclick = () => showModal('settingsModal');
  if ($('saveSettings')) $('saveSettings').onclick = () => { saveSettings(); hideModal('settingsModal'); };
  if ($('closeSettings')) $('closeSettings').onclick = () => hideModal('settingsModal');
  if ($('saveIdea')) $('saveIdea').onclick = saveIdeaFromModal;
  if ($('closeNew')) $('closeNew').onclick = () => hideModal('newModal');

  // load settings and state
  loadSettings();
  loadFromStorage();

  // if settings include token & repo, auto-fetch current data from GitHub
  if (CONFIG && CONFIG.owner && CONFIG.repo && CONFIG.token) {
    // start auto fetch but don't block UI
    fetchRemote().then(() => {
      // ensure at least render
      render();
    }).catch(() => { render(); });
  } else {
    // just render local state (or sample if empty)
    if (!state || !state.items || !state.items.length) {
      // keep whatever local state exists; if empty - seed sample
      state = state && state.items && state.items.length ? state : { meta: { generated: new Date().toISOString() }, items: [] };
    }
    render();
  }

  // best-effort save on unload
  window.addEventListener('beforeunload', () => { saveToStorage(); });
  updateStatus('Готово');
}

function exportTXT() {
  let out = '';
  const days = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
  for (const d of days) {
    out += d + '\n';
    const posts = state.items.filter(x => x.day === d);
    for (const p of posts) {
      out += `- ${p.title} | ES:${p.es} | EN:${p.en} | T:${p.platforms.tiktok ? 1 : 0} I:${p.platforms.instagram ? 1 : 0} R:${p.platforms.redbubble ? 1 : 0}\n`;
    }
    out += '\n';
  }
  const blob = new Blob([out], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'vibeplan.txt';
  a.click();
  updateStatus('Экспорт готов');
}

document.addEventListener('DOMContentLoaded', init);
