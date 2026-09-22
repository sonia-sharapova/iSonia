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
  // the tree can grow wider than the page (Page > Topic > Section > Sub-section > Links); keep the newest,
  // rightmost column in view instead of leaving it to scroll off unnoticed. Setting scrollLeft directly (rather
  // than the newest column's scrollIntoView) only scrolls the tree itself — scrollIntoView also nudges whichever
  // ancestor(s) don't fully contain the column, which included the whole page.
  const tree = document.querySelector('.res-tree-hub');
  if (tree) tree.scrollLeft = tree.scrollWidth;
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

// The My Links pages' full contents, as an inline column tree — the same shape as a category page's own tree
// (links.js): Page → Topic (only Technology & Careers have any) → Section → Sub-section → Links, each level
// opening one column further to the right. A page with no topics skips straight to its sections; a section with
// no sub-sections skips straight to its links; a section that does have sub-sections gets a dedicated column for
// them only on a page that has topics — otherwise (most pages) they break the links column with an inline header
// instead, same as that page's own tree does.
const GROUPS = [['professional', 'Professional'], ['misc', 'Misc.']];

let treeSelPage = null;     // slug of the page open in the tree, or null
let treeSelTopic = -1;      // index into that page's topics, -1 = none picked
let treeSelSection = -1;    // index into that page's (or topic's) sections, -1 = none picked
let treeSelSub = -1;        // index into the selected section's sub-sections, -1 = none / not applicable

function treeVisibleFolders(page) {
  if (!page.topics.length) return page.folders.map((f, i) => [f, i]);
  const t = page.topics[treeSelTopic];
  return t ? page.folders.map((f, i) => [f, i]).filter(([f]) => f.topic === t.name) : [];
}

// A section with sub-sections but no links of its own defaults to its first sub-section (same rule links.js uses).
function treeDefaultSub(page, fi) {
  const f = page.folders[fi];
  return f && f.subfolders.length && !f.items.length ? 0 : -1;
}

function selectTreePage(slug) {
  treeSelPage = slug === treeSelPage ? null : slug;     // clicking the open page closes it
  treeSelTopic = -1; treeSelSection = -1; treeSelSub = -1;
  render();
}
function selectTreeTopic(i) {
  treeSelTopic = i === treeSelTopic ? -1 : i;
  treeSelSection = -1; treeSelSub = -1;
  render();
}
function selectTreeSection(i) {
  const page = treeData[treeSelPage];
  treeSelSection = i === treeSelSection ? -1 : i;
  treeSelSub = treeSelSection >= 0 ? treeDefaultSub(page, treeSelSection) : -1;
  render();
}
function selectTreeSub(i) {
  const page = treeData[treeSelPage];
  treeSelSub = i === treeSelSub ? treeDefaultSub(page, treeSelSection) : i;
  render();
}

// Column 1: pick a page, grouped Professional / Misc. — always shown, this is the tree's starting point.
function treePagesCol() {
  const pages = Object.values(treeData);
  const groups = GROUPS.map(([id, label]) => [label, pages.filter(p => p.group === id)]).filter(([, ps]) => ps.length);
  return `<div class="res-col res-col-cats">` + groups.map(([label, ps]) => `
      <div class="sidebar-section">
        <h3 class="res-head">${esc(label)}</h3>
        <nav class="res-list">${ps.map(p => `<div class="res-row">
            <a class="res-link${p.slug === treeSelPage ? ' active' : ''}" href="#" onclick="event.preventDefault();selectTreePage('${p.slug}')">${esc(p.title)}</a>
          </div>`).join('')}</nav>
      </div>`).join('') + `</div>`;
}

// Column 2 on a page with topics: that page's Topics.
function treeTopicsCol(page) {
  const rows = page.topics.map((t, i) => `<div class="res-row">
      <a class="res-link${i === treeSelTopic ? ' active' : ''}" href="#" onclick="event.preventDefault();selectTreeTopic(${i})">${esc(t.name)}</a>
    </div>`).join('');
  return `<div class="res-col res-col-sections">
      <div class="res-head"><h2 class="res-title">${esc(page.title)}</h2></div>
      <nav class="res-list">${rows}</nav>
    </div>`;
}

// Column 2 (no topics) or column 3 (a topic picked): that page's or topic's Sections.
function treeSectionsCol(page) {
  const topic = page.topics[treeSelTopic];
  const rows = treeVisibleFolders(page).map(([f, i]) => `<div class="res-row">
      <a class="res-link${i === treeSelSection ? ' active' : ''}" href="#" onclick="event.preventDefault();selectTreeSection(${i})">${esc(f.name)}</a>
    </div>`).join('');
  return `<div class="res-col res-col-sections">
      <div class="res-head"><h2 class="res-title">${esc(topic ? topic.name : page.title)}</h2></div>
      <nav class="res-list">${rows}</nav>
    </div>`;
}

// Sub-sections get their own column only on a page with topics (matching that page's own tree); see treeLinksCol
// for the other pages, where sub-sections break the links column with a header instead.
function treeSubsCol(page) {
  const f = page.folders[treeSelSection];
  if (!f || !f.subfolders.length) return '';
  const rows = f.subfolders.map((sf, si) => `<div class="res-row">
      <a class="res-link${si === treeSelSub ? ' active' : ''}" href="#" onclick="event.preventDefault();selectTreeSub(${si})">${esc(sf.name)}</a>
    </div>`).join('');
  return `<div class="res-col res-col-sections res-col-subs">
      <div class="res-head"><h2 class="res-title">${esc(f.name)}</h2></div>
      <nav class="res-list">${rows}</nav>
    </div>`;
}

function treeLinkList(items) {
  if (!items || !items.length) return '<p class="res-empty">No links yet.</p>';
  return `<ul class="res-links">` + items.map(it => it.link
    ? `<li><a href="${esc(it.link)}"${/^https?:/i.test(it.link) ? ' target="_blank" rel="noopener"' : ''}>${esc(it.name)}</a></li>`
    : `<li>${esc(it.name)}</li>`
  ).join('') + `</ul>`;
}

function treeOpenLink(href, label) {
  return `<a href="${esc(href)}" class="res-open" title="Open ${esc(label)} on its own page">↗ open page</a>`;
}

// The rightmost column while nothing with actual links is picked yet: the page's own picture (pages are the only
// level with one) plus a description — the page's own, until a topic is picked, then that topic's. Shown as soon
// as a page is picked (before any topic/section), and again at every level after that until a "child" — a
// section (or sub-section) that itself has links — takes over and shows those instead (treeLinksCol).
function treeIntroCol(page, useTopics) {
  const topic = page.topics[treeSelTopic];
  const desc = topic ? topic.description : page.intro.description;
  const picture = page.intro.image
    ? `<img src="${esc(page.intro.image)}" alt="${esc(page.intro.alt || page.title)}">`
    : `<div class="res-intro-placeholder" aria-hidden="true">
         <svg viewBox="0 0 120 80" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
           <path d="M14 14h20M14 14v44M14 36h20M14 58h20M34 14v0M52 14h26M52 36h40M52 58h30M34 36h18M34 58h18M34 14h18"/>
         </svg>
       </div>`;
  const hint = useTopics && !topic ? 'Choose a topic to get started.' : 'Choose a section to see its links.';
  return `<div class="res-col res-col-links res-intro">
      <div class="res-intro-image">${picture}</div>
      <h2 class="res-section-title">${esc(topic ? topic.name : page.title)}</h2>
      ${desc ? `<p class="res-intro-text">${esc(desc)}</p>` : ''}
      <p class="res-hint">${esc(hint)}</p>
    </div>`;
}

// The final column: the selected section's (or sub-section's) links — the "child" treeIntroCol hands off to.
function treeLinksCol(page, useTopics) {
  const f = page.folders[treeSelSection];
  if (useTopics) {
    const topic = page.topics[treeSelTopic];
    const sel = f.subfolders[treeSelSub];
    const target = sel || f;
    const hash = slugify(topic.name) + '/' + slugify(f.name) + (sel ? '/' + slugify(sel.name) : '');
    const open = treeOpenLink(`resources/${page.slug}.html#${hash}`, target.name);
    return `<div class="res-col res-col-links">
        <div class="res-head"><h2 class="res-section-title">${esc(target.name)}</h2>${open}${target.description ? `<p class="res-sub">${esc(target.description)}</p>` : ''}</div>
        ${treeLinkList(target.items)}
      </div>`;
  }
  // no topics: sub-sections break the list with their own header, inline in this column (same as that page itself)
  const open = treeOpenLink(`resources/${page.slug}.html#${slugify(f.name)}`, f.name);
  let html = `<div class="res-head"><h2 class="res-section-title">${esc(f.name)}</h2>${open}${f.description ? `<p class="res-sub">${esc(f.description)}</p>` : ''}</div>`;
  html += treeLinkList(f.items);
  f.subfolders.forEach(sf => {
    html += `<div class="res-subgroup">
        <h3 class="res-subhead">${esc(sf.name)}</h3>
        ${sf.description ? `<p class="res-sub">${esc(sf.description)}</p>` : ''}
        ${treeLinkList(sf.items)}
      </div>`;
  });
  return `<div class="res-col res-col-links">${html}</div>`;
}

function renderTree() {
  const pages = Object.values(treeData);
  if (!pages.length) return '';
  const page = treeSelPage ? treeData[treeSelPage] : null;
  let cols = treePagesCol();
  if (page) {
    const useTopics = page.topics.length > 0;
    cols += useTopics ? treeTopicsCol(page) : treeSectionsCol(page);
    if (useTopics && treeSelTopic >= 0) cols += treeSectionsCol(page);
    if (useTopics) cols += treeSubsCol(page);
    cols += page.folders[treeSelSection] ? treeLinksCol(page, useTopics) : treeIntroCol(page, useTopics);
  }
  // "res-tree" (not just "res-tree-hub") so this also picks up mobile.css's shared phone treatment for the
  // category pages' own tree — stacking, chip rows, active-state theming — since it targets that class name
  return `<div class="res-tree res-tree-hub">${cols}</div>`;
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
