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

// Line icons for the hub tiles, keyed by the page name (resources/<name>.html); anything else gets the generic page icon
const HUB_ICONS = {
  creating: '<path d="M4 20l4-1 11-11-3-3L5 16l-1 4z"/><path d="M14 6l3 3"/>',
  consuming: '<circle cx="12" cy="12" r="9"/><path d="M10 8.5l6 3.5-6 3.5z"/>',
  exploring: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
  learning: '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-4.5"/>',
  technology: '<rect x="6" y="6" width="12" height="12" rx="1"/><rect x="9.5" y="9.5" width="5" height="5"/><path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3"/>',
  'open-source': '<path d="M8 8l-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14"/>',
  'get-involved': '<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="9" r="2.5"/><path d="M17 14c2.5 0 4.5 2 4.5 5"/>',
  careers: '<rect x="3" y="7" width="18" height="13" rx="1.5"/><path d="M9 7V5h6v2M3 13h18"/>',
  misc: '<path d="M12 3l2.5 6 6.5.5-5 4.3 1.6 6.4-5.6-3.4-5.6 3.4L8 13.8 3 9.5l6.5-.5z"/>',
  'web-design': '<rect x="3" y="5" width="18" height="14" rx="1.5"/><path d="M3 9h18"/>',
  algorithms: '<circle cx="6" cy="6" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="12" cy="18" r="2"/><path d="M8 6h8M7 8l4 8M17 8l-4 8"/>',
  'machine-learning': '<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/>',
  hpc: '<rect x="4" y="4" width="16" height="6" rx="1"/><rect x="4" y="14" width="16" height="6" rx="1"/><path d="M8 7h.01M8 17h.01"/>',
  privacy: '<rect x="5" y="11" width="14" height="9" rx="1.5"/><path d="M8 11V8a4 4 0 018 0v3"/>',
  _page: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>'
};
function hubIcon(href) {
  const name = String(href || '').split('?')[0].split('/').pop().replace('.html', '');
  return `<svg class="cat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${HUB_ICONS[name] || HUB_ICONS._page}</svg>`;
}

// A tile: icon + title, then a short bullet list (or the description). On hover it slides right, turns green and shows an arrow.
function renderCards(sec) {
  return `<div class="category-grid">` +
    (sec.items||[]).map(item => `
      <a href="${esc(item.href)}" class="cat-tile">
        <div class="cat-head">
          ${hubIcon(item.href)}
          <span class="cat-title">${esc(item.title)}</span>
          <span class="cat-arrow" aria-hidden="true">→</span>
        </div>
        ${(item.bullets || []).length
          ? `<ul class="cat-list">${item.bullets.map(b => `<li>${esc(b)}</li>`).join('')}</ul>`
          : (item.desc ? `<p class="cat-desc">${esc(item.desc)}</p>` : '')}
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
  const bl = document.getElementById('item-bullets');
  if (bl) bl.value = item && item.bullets ? item.bullets.join('\n') : '';
  document.getElementById('item-modal').classList.add('active');
  setTimeout(() => document.getElementById('item-title').focus(), 60);
}
function closeItemModal() { document.getElementById('item-modal').classList.remove('active'); }

document.getElementById('item-save').onclick = async () => {
  const title = document.getElementById('item-title').value.trim();
  const href  = document.getElementById('item-href').value.trim();
  const desc  = document.getElementById('item-desc').value.trim();
  const bl = document.getElementById('item-bullets');
  const bullets = bl ? bl.value.split('\n').map(x => x.trim()).filter(Boolean) : null;
  if (!title || !href) { alert('Title and URL are required.'); return; }

  const sec = sections.find(s => s.id === modalSectionId);
  if (modalItemId) {
    const item = sec.items.find(i => i.id === modalItemId);
    item.title = title; item.href = href; item.desc = desc;
    if (bullets) item.bullets = bullets;
  } else {
    sec.items.push(bullets && bullets.length ? { id: uid(), title, href, desc, bullets } : { id: uid(), title, href, desc });
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
