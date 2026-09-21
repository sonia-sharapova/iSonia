// Hub pages: navigation/resources.html (Saved Links) and navigation/learning.html (Guides) — the card grids,
// with admin add / edit / delete. Reads and saves data/resources.json — needs hub-data.js first.

const SAVE_URL = '../admin/save-resources.php';
const DATA_URL = '../data/resources.json';

// <body data-hub="guides"> limits the page to the Guides section (learning.html)
const HUB_ONLY = document.body.dataset.hub || '';

let sections = [];
let isAdmin = false;

// current modal state
let modalSectionId = null;
let modalItemId = null;

async function init() {
  try {
    const s = await fetch('../admin/check-session.php').then(r => r.json());
    if (s.admin) { isAdmin = true; document.body.classList.add('admin-mode'); }
  } catch(e) {}

  try {
    const r = await fetch(DATA_URL + '?t=' + Date.now());
    sections = r.ok ? await r.json() : [];
    if (!Array.isArray(sections)) sections = [];
    // older saved lists get the Saved Links / Guides layout; with no saved list yet, the defaults (the first save creates the file)
    sections = HubData.normalize(sections);
  } catch(e) { sections = HubData.normalize([]); }

  render();
}

function uid() { return Math.random().toString(36).slice(2,9) + Date.now().toString(36); }
function esc(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Render ───────────────────────────────────────────────────────
function render() {
  const body = document.getElementById('resources-body');
  // resources.html shows the Saved Links (the Guides live on learning.html, which it links to);
  // learning.html shows only the Guides
  const shown = HUB_ONLY === 'guides' ? sections.filter(HubData.isGuides) : sections.filter(s => !HubData.isGuides(s));
  body.innerHTML = shown.map(sec => renderSection(sec)).join('');
}

function renderSection(sec) {
  const items = sec.type === 'cards' ? renderCards(sec) : renderLinks(sec);
  return `
    <div class="section-block" data-id="${sec.id}">
      <div class="section-header-row">
        <div class="section-header">${esc(sec.title)}</div>
        <button class="adm-plus admin-only" onclick="openItemModal('${sec.id}',null)" title="Add item">+</button>
      </div>
      ${sec.intro ? `<div class="resources-intro"><p>${esc(sec.intro)}</p></div>` : ''}
      ${items}
      <div class="admin-only" style="margin-top:6px;">
        <button class="adm-text-del" onclick="deleteSection('${sec.id}')">delete section</button>
      </div>
    </div>`;
}

function renderCards(sec) {
  return `<div class="category-grid">` +
    (sec.items||[]).map(item => `
      <a href="${esc(item.href)}" class="category-card">
        <div class="category-title">${esc(item.title)}</div>
        <div class="category-count">${esc(item.desc)}</div>
        <span class="item-admin-btns admin-only">
          <button class="adm-btn adm-edit" onclick="event.preventDefault();openItemModal('${sec.id}','${item.id}')">✎</button>
          <button class="adm-btn adm-del"  onclick="event.preventDefault();deleteItem('${sec.id}','${item.id}')">✕</button>
        </span>
      </a>`).join('') +
    `</div>`;
}

function renderLinks(sec) {
  return `<ul class="subcategory-list">` +
    (sec.items||[]).map(item => `
      <li class="subcategory-item">
        <a href="${esc(item.href)}" class="subcategory-link">
          <span><span style="font-weight:bold">${esc(item.title)}:</span> ${esc(item.desc)}<hr></span>
        </a>
        <span class="item-admin-btns admin-only" style="top:8px;">
          <button class="adm-btn adm-edit" onclick="openItemModal('${sec.id}','${item.id}')">✎</button>
          <button class="adm-btn adm-del"  onclick="deleteItem('${sec.id}','${item.id}')">✕</button>
        </span>
      </li>`).join('') +
    `</ul>`;
}

// ── Delete ───────────────────────────────────────────────────────
async function deleteSection(id) {
  if (!confirm('Delete this entire section?')) return;
  sections = sections.filter(s => s.id !== id);
  await persist();
  render();
}

async function deleteItem(secId, itemId) {
  if (!confirm('Remove this item?')) return;
  const sec = sections.find(s => s.id === secId);
  sec.items = sec.items.filter(i => i.id !== itemId);
  await persist();
  render();
}

// ── Item modal ───────────────────────────────────────────────────
function openItemModal(secId, itemId) {
  modalSectionId = secId;
  modalItemId = itemId;
  const sec = sections.find(s => s.id === secId);
  const item = itemId ? sec.items.find(i => i.id === itemId) : null;
  document.getElementById('item-modal-title').textContent = itemId ? 'Edit Item' : 'Add Item';
  document.getElementById('item-title').value = item ? item.title : '';
  document.getElementById('item-href').value  = item ? item.href  : '';
  document.getElementById('item-desc').value  = item ? item.desc  : '';
  document.getElementById('item-modal').classList.add('active');
  setTimeout(() => document.getElementById('item-title').focus(), 60);
}
function closeItemModal() { document.getElementById('item-modal').classList.remove('active'); }

document.getElementById('item-save').onclick = async () => {
  const title = document.getElementById('item-title').value.trim();
  const href  = document.getElementById('item-href').value.trim();
  const desc  = document.getElementById('item-desc').value.trim();
  if (!title || !href) { alert('Title and URL are required.'); return; }

  const sec = sections.find(s => s.id === modalSectionId);
  if (modalItemId) {
    const item = sec.items.find(i => i.id === modalItemId);
    item.title = title; item.href = href; item.desc = desc;
  } else {
    sec.items.push({ id: uid(), title, href, desc });
  }
  await persist();
  closeItemModal();
  render();
};

document.getElementById('item-modal').addEventListener('click', e => { if (e.target === e.currentTarget) closeItemModal(); });

// ── Section modal ─────────────────────────────────────────────────
function openSectionModal(id) {
  const sec = id ? sections.find(s => s.id === id) : null;
  document.getElementById('section-modal-title').textContent = id ? 'Edit Section' : 'Add Section';
  document.getElementById('section-title').value = sec ? sec.title : '';
  document.getElementById('section-type').value  = sec ? sec.type  : 'cards';
  document.getElementById('section-intro').value = sec ? (sec.intro||'') : '';
  document.getElementById('section-modal').classList.add('active');
  setTimeout(() => document.getElementById('section-title').focus(), 60);
}
function closeSectionModal() { document.getElementById('section-modal').classList.remove('active'); }

document.getElementById('section-save').onclick = async () => {
  const title = document.getElementById('section-title').value.trim();
  const type  = document.getElementById('section-type').value;
  const intro = document.getElementById('section-intro').value.trim();
  if (!title) { alert('Title is required.'); return; }
  sections.push({ id: uid(), title, type, intro, items: [] });
  await persist();
  closeSectionModal();
  render();
};

document.getElementById('section-modal').addEventListener('click', e => { if (e.target === e.currentTarget) closeSectionModal(); });

// ── Persist ───────────────────────────────────────────────────────
async function persist() {
  try {
    const res = await fetch(SAVE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sections)
    }).then(r => r.json());
    if (!res.success) alert('Save error: ' + (res.error||'unknown'));
  } catch(e) { alert('Network error — changes not saved.'); }
}

init();
