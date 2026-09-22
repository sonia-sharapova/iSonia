// Hub pages: navigation/resources.html (Saved Links) and navigation/learning.html (Guides) — the card grids,
// with admin add / edit / delete. Reads and saves data/resources.json — needs hub-data.js first.

const SAVE_URL = '../admin/save-resources.php';
const DATA_URL = '../data/resources.json';

// <body data-hub="guides"> limits the page to the Guides section (learning.html)
const HUB_ONLY = document.body.dataset.hub || '';

let sections = [];
let isAdmin = false;
let treeData = {};   // page slug -> { intro, folders, topics } for the inline folder tree (the My Links category pages)

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

  if (HUB_ONLY !== 'guides') await loadTree();
  render();
}

// ── Inline folder tree (the My Links pages' real content, browsable without leaving the hub) ──
async function fetchCategoryMarkdown(name) {
  for (const dir of ['markdown', 'seed']) {
    try {
      const r = await fetch(`resources/${dir}/${name}.md`);
      if (r.ok) {
        const text = await r.text();
        if (!/^\s*<(!doctype|html)/i.test(text)) return text;
      }
    } catch (e) { /* try the next one */ }
  }
  return null;
}

async function loadTree() {
  const topicsSec = sections.find(s => s.id === 'topics');
  const pages = (topicsSec ? topicsSec.items : []).map(it => ({
    title: it.title,
    group: it.group || 'misc',
    slug: it.href.split('/').pop().replace('.html', '')
  }));
  const entries = await Promise.all(pages.map(async p => {
    const md = await fetchCategoryMarkdown(p.slug);
    return [p.slug, md ? { title: p.title, group: p.group, slug: p.slug, ...HubData.parseMarkdown(md) } : null];
  }));
  treeData = Object.fromEntries(entries.filter(([, v]) => v));
}

function uid() { return Math.random().toString(36).slice(2,9) + Date.now().toString(36); }
function esc(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Render ───────────────────────────────────────────────────────
function render() {
  const body = document.getElementById('resources-body');
  // resources.html shows the Saved Links (the Guides live on learning.html, which it links to), minus the
  // By Function tags (Create/Consume/Explore/Learn — no longer shown on the hub); learning.html shows only the Guides
  const shown = HUB_ONLY === 'guides' ? sections.filter(HubData.isGuides) : sections.filter(s => !HubData.isGuides(s) && s.id !== 'cat');
  body.innerHTML = shown.map(sec => renderSection(sec)).join('');
}

function renderSection(sec) {
  // "topics" (My Links) is shown as the inline folder tree of its pages' real content
  const items = sec.id === 'topics' ? renderTree()
    : sec.type === 'cards' ? renderMenu(sec) : renderLinks(sec);
  return `
    <div class="section-block" data-id="${sec.id}">
      <div class="section-header-row">
        <div class="section-header">${esc(sec.title)}</div>
        <button class="adm-plus admin-only" onclick="openItemModal('${sec.id}',null)" title="Add item">+</button>
      </div>
      ${items}
      <div class="admin-only" style="margin-top:6px;">
        <button class="adm-text-del" onclick="deleteSection('${sec.id}')">delete section</button>
      </div>
    </div>`;
}

// The My Links pages' full contents, as one expandable folder tree: Group > Page > Topic > Section > Sub-section > links.
const GROUPS = [['professional', 'Professional'], ['misc', 'Misc.']];

function renderTree() {
  const pages = Object.values(treeData);
  if (!pages.length) return '';
  const groups = GROUPS.map(([id, label]) => [label, pages.filter(p => p.group === id)]).filter(([, ps]) => ps.length);
  return `<div class="res-tree-wrap">` + groups.map(([label, ps]) => `
      <details class="res-tree-node res-tree-group" open>
        <summary><span class="res-tree-name">${esc(label)}</span></summary>
        <div class="res-tree-children">${ps.map(renderTreePage).join('')}</div>
      </details>`).join('') + `</div>`;
}

function renderTreePage(page) {
  const body = page.topics.length
    ? page.topics.map(t => renderTreeTopic(page, t)).join('')
    : page.folders.map(f => renderTreeFolder(page, f)).join('');
  return `<details class="res-tree-node res-tree-page">
      <summary><span class="res-tree-name">${esc(page.title)}</span></summary>
      <div class="res-tree-children">${body}</div>
    </details>`;
}

function renderTreeTopic(page, topic) {
  const folders = page.folders.filter(f => f.topic === topic.name);
  return `<details class="res-tree-node res-tree-topic">
      <summary><span class="res-tree-name">${esc(topic.name)}</span></summary>
      <div class="res-tree-children">${folders.map(f => renderTreeFolder(page, f)).join('')}</div>
    </details>`;
}

function renderTreeFolder(page, folder) {
  const anchor = `resources/${page.slug}.html#${slugify(folder.name)}`;
  const openLink = `<a href="${esc(anchor)}" class="res-tree-open" title="Open ${esc(folder.name)} on its own page" onclick="event.stopPropagation()">↗</a>`;
  const linksHtml = renderTreeLinks(folder.items);
  const subsHtml = folder.subfolders.map(sf => `
      <details class="res-tree-node res-tree-sub">
        <summary><span class="res-tree-name">${esc(sf.name)}</span>${openLink}</summary>
        <div class="res-tree-children">${renderTreeLinks(sf.items)}</div>
      </details>`).join('');
  const hasChildren = folder.items.length || folder.subfolders.length;
  if (!hasChildren) return `<div class="res-tree-leaf"><span class="res-tree-name">${esc(folder.name)}</span></div>`;
  return `<details class="res-tree-node res-tree-folder">
      <summary><span class="res-tree-name">${esc(folder.name)}</span>${openLink}</summary>
      <div class="res-tree-children">${linksHtml}${subsHtml}</div>
    </details>`;
}

function renderTreeLinks(items) {
  if (!items || !items.length) return '';
  return `<ul class="res-tree-links">` + items.map(it => it.link
    ? `<li><a href="${esc(it.link)}" class="res-tree-link"${/^https?:/i.test(it.link) ? ' target="_blank" rel="noopener"' : ''}>${esc(it.name)}</a></li>`
    : `<li>${esc(it.name)}</li>`
  ).join('') + `</ul>`;
}

function slugify(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

// A standard menu list: title only, no description — Guides (and any other card group besides By Function).
function renderMenu(sec) {
  return `<ul class="menu-list">` +
    (sec.items||[]).map(item => `
      <li class="menu-item">
        <a href="${esc(item.href)}" class="menu-link">${esc(item.title)}</a>
        <span class="item-admin-btns admin-only">
          <button class="adm-btn adm-edit" onclick="event.preventDefault();openItemModal('${sec.id}','${item.id}')">✎</button>
          <button class="adm-btn adm-del"  onclick="event.preventDefault();deleteItem('${sec.id}','${item.id}')">✕</button>
        </span>
      </li>`).join('') +
    `</ul>`;
}

// Quick Links (the hub's hand-picked shortcuts): title only, no description.
function renderLinks(sec) {
  return `<ul class="menu-list">` +
    (sec.items||[]).map(item => `
      <li class="menu-item">
        <a href="${esc(item.href)}" class="menu-link">${esc(item.title)}</a>
        <span class="item-admin-btns admin-only">
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
