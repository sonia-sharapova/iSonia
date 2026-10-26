// Hub pages: navigation/resources.html (Saved Links) and navigation/learning.html (Guides) — the card grids,
// with admin add / edit / delete. Reads and saves data/resources.json — needs hub-data.js first.

const SAVE_URL = '../admin/save-resources.php';
const DATA_URL = '../data/resources.json';

// <body data-hub="guides"> limits the page to the Guides section (learning.html)
const HUB_ONLY = document.body.dataset.hub || '';

// The hubs show their pages as column trees: Resources → Technology Links (resources/tech-*.html) and below it General
// Resources (the other pages in navigation/resources/*); Learning → its Guides (navigation/learning/*). `sec` is the
// hub section listing the pages, `dir` their folder.
const TREES = HUB_ONLY === 'guides'
  ? [{ sec: 'guides', dir: 'learning', groups: [['guides', 'Guides']], defaultGroup: 'guides' }]
  : [{ sec: 'tech', dir: 'resources', groups: [['tech', 'Technology']], defaultGroup: 'tech' },
     { sec: 'topics', dir: 'resources', groups: [['professional', 'Professional'], ['misc', 'Misc.']], defaultGroup: 'misc' },
     { sec: 'archive', dir: 'resources', groups: [['media', 'Media'], ['archives', 'Archives'], ['archives-collections', 'Archives & Collections']], defaultGroup: 'archives' }];
let TREE = TREES[0];

let sections = [];
let isAdmin = false;
let treeData = {};   // page slug -> { intro, folders, topics } for the open tree's pages (see useTree)

// current modal state
let modalSectionId = null;
let modalItemId = null;

async function init() {
  try {
    const s = await fetch('../admin/check-session.php').then(r => r.json());
    if (s.admin) { isAdmin = true; document.body.classList.add('admin-mode'); injectTreeModal(); }
  } catch(e) {}

  try {
    const r = await fetch(DATA_URL + '?t=' + Date.now());
    sections = r.ok ? await r.json() : [];
    if (!Array.isArray(sections)) sections = [];
    // older saved lists get the Saved Links / Guides layout; with no saved list yet, the defaults (the first save creates the file)
    sections = HubData.normalize(sections);
  } catch(e) { sections = HubData.normalize([]); }

  await loadTrees();
  render();
}

// ── More than one tree on a page ──
// The tree code below works on one tree's state at a time, kept in the tree* globals. Each tree's own copy lives on
// its TREES entry; useTree swaps it in. render() draws every tree, and a capture-phase listener on each tree's block
// (bindTreeBlocks) switches to that tree before any of its inline handlers run — the admin modals then keep acting
// on the tree they were opened from, since they cover the page while open.
let treeInUse = false;   // false until the first useTree: the globals don't hold any tree's state yet
function useTree(i) {
  const next = TREES[i];
  if (treeInUse && next === TREE) return;
  if (treeInUse) TREE.state = { treeData, treeSelPage, treeSelTopic, treeSelSection, treeSelSub, treePrevCols };
  TREE = next;
  GROUPS = TREE.groups;
  const st = TREE.state || { treeData: {}, treeSelPage: null, treeSelTopic: -1, treeSelSection: -1, treeSelSub: -1, treePrevCols: [] };
  ({ treeData, treeSelPage, treeSelTopic, treeSelSection, treeSelSub, treePrevCols } = st);
  treeInUse = true;
}
function treeIndex(secId) { return TREES.findIndex(t => t.sec === secId); }
async function loadTrees() {
  for (let i = 0; i < TREES.length; i++) { useTree(i); await loadTree(); }
  useTree(0);
}
function bindTreeBlocks() {
  document.querySelectorAll('#resources-body > .section-block').forEach(block => {
    const i = treeIndex(block.dataset.id);
    if (i < 0) return;
    ['click', 'keydown', 'dragstart', 'dragover', 'drop'].forEach(type => block.addEventListener(type, () => useTree(i), true));
  });
}

// ── Inline folder tree (the My Links pages' real content, browsable without leaving the hub) ──
async function fetchCategoryMarkdown(name) {
  for (const dir of ['markdown', 'seed']) {
    try {
      // no-cache: the server sends no caching headers for .md, so without this a browser can keep showing an old
      // copy after an admin save (it revalidates instead — a cheap 304 when nothing changed)
      const r = await fetch(`${TREE.dir}/${dir}/${name}.md`, { cache: 'no-cache' });
      if (r.ok) {
        const text = await r.text();
        if (!/^\s*<(!doctype|html)/i.test(text)) return text;
      }
    } catch (e) { /* try the next one */ }
  }
  return null;
}

async function loadTree() {
  const topicsSec = sections.find(s => s.id === TREE.sec);
  const pages = (topicsSec ? topicsSec.items : []).map(it => ({
    id: it.id,
    title: it.title,
    group: it.group || TREE.defaultGroup,
    expand: !!it.expand,
    slug: it.href.split('/').pop().replace('.html', '')
  }));
  const entries = await Promise.all(pages.map(async p => {
    const md = await fetchCategoryMarkdown(p.slug);
    return [p.slug, md ? { id: p.id, title: p.title, group: p.group, expand: p.expand, slug: p.slug, ...HubData.parseMarkdown(md) } : null];
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
  // By Function tags (Create/Consume/Explore/Learn — no longer shown on the hub); learning.html shows only the
  // Guides. My Favourites isn't rendered as its own top-level block here any more — it's nested inside the tree's
  // description column instead (treeHubIntroCol), under the hub's intro text.
  const shown = HUB_ONLY === 'guides' ? sections.filter(HubData.isGuides) : sections.filter(s => !HubData.isGuides(s) && s.id !== 'cat' && s.id !== 'favourites');
  const active = TREES.indexOf(TREE);
  body.innerHTML = shown.map(sec => renderSection(sec)).join('');
  useTree(active);
  bindTreeBlocks();
  fitReducedColumns();
  // every column narrows once it's no longer the one you're actively choosing from (hub.css/fitReducedColumns) —
  // this just keeps the newest, rightmost column in view on the rare window narrow enough that it still doesn't
  // all fit. Setting scrollLeft directly (rather than the newest column's scrollIntoView) only scrolls the tree
  // itself — scrollIntoView also nudges whichever ancestor(s) don't fully contain the column, which included the
  // whole page.
  document.querySelectorAll('.res-tree-hub').forEach(tree => { tree.scrollLeft = tree.scrollWidth; });
}

// A reduced column's CSS width (116px, hub.css) is just a fallback — it's re-measured here to whatever its own
// widest item actually needs (never narrower), so a longer name like "Networking & Servers" still gets truncated
// only as a last resort instead of routinely. scrollWidth reports an element's full unwrapped content width even
// while overflow:hidden is clipping it on screen, so this works without having to temporarily un-clip anything.
// Set as an inline flex-basis (not left to CSS) so it participates in the same width transition as everything
// else, easing from the @starting-style "before" size to this column's own real target instead of the shared
// 116px one.
function fitReducedColumns() {
  document.querySelectorAll('.res-tree-hub > .res-col-reduced').forEach(col => {
    let max = 0;
    col.querySelectorAll('.res-link, .res-title, .res-chevron-label').forEach(el => {
      max = Math.max(max, el.scrollWidth);
    });
    if (isAdmin) max += 48;   // the ✎ ✕ buttons after each row (treeAdmBtns)
    // capped, so with every level open (page → topic → section → sub-section) the links still get the room
    if (max > 0) col.style.flexBasis = Math.min(Math.max(max + 2, 90), 190) + 'px';
  });
}

function renderSection(sec) {
  // a tree's section (Technology Links, General Resources) is shown as the inline folder tree of its pages' real content
  const ti = treeIndex(sec.id);
  if (ti >= 0) useTree(ti);
  const items = ti >= 0 ? renderTree()
    : sec.type === 'cards' ? renderMenu(sec) : renderLinks(sec);
  // the tree's heading itself is a link back to its original (nothing-picked) view, wherever you've drilled to
  const header = ti >= 0
    ? `<a href="#" class="section-header section-header-link" onclick="event.preventDefault();resetTree()" title="Back to ${esc(sec.title)}">${esc(sec.title)}</a>`
    : `<div class="section-header">${esc(sec.title)}</div>`;

  return `
    <div class="section-block" data-id="${sec.id}">
      <div class="section-header-row">
        ${header}
        <button class="adm-plus admin-only" onclick="openItemModal('${sec.id}',null)" title="Add item">+</button>
      </div>
      ${items}
      <div class="admin-only" style="margin-top:6px;">
        <button class="adm-text-del" onclick="deleteSection('${sec.id}')">delete section</button>
      </div>
    </div>`;
}

// "My Links" heading's own click target: back to the tree's very first view, from anywhere in it.
function resetTree() {
  treeSelPage = null; treeSelTopic = -1; treeSelSection = -1; treeSelSub = -1;
  render();
}

// The My Links pages' full contents, as an inline column tree — the same shape as a category page's own tree
// (links.js): Page → Topic (only Technology & Careers have any) → Section → Sub-section → Links, each level
// opening one column further to the right. A page with no topics skips straight to its sections; a section with
// no sub-sections skips straight to its links; a section that does have sub-sections gets a dedicated column for
// them only on a page that has topics — otherwise (most pages) they break the links column with an inline header
// instead, same as that page's own tree does.
let GROUPS = TREE.groups;

let treeSelPage = null;     // slug of the page open in the tree, or null
let treeSelTopic = -1;      // index into that page's topics, -1 = none picked
let treeSelSection = -1;    // index into that page's (or topic's) sections, -1 = none picked
let treeSelSub = -1;        // index into the selected section's sub-sections, -1 = none / not applicable

// [{kind, reduced}, ...] for the picker columns as of the last render, positionally — so a column whose kind and
// reduced/full state haven't actually changed since last time can skip re-animating (see renderTree/res-col-static).
let treePrevCols = [];

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

// A column's header: a "‹" and the title, both wired to back out of that column's own pick and up to the
// previous one — the whole header is the click target, not just the small chevron. tabindex+role+keydown make it
// a real (keyboard-reachable) button, since it's a <div> rather than an <a> — it holds a heading, not link text.
function treeBackHead(action, titleText) {
  return `<div class="res-head res-head-back" tabindex="0" role="button" onclick="event.preventDefault();${action}" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();${action}}" title="Back">
      <span class="res-back-chevron">‹</span><h2 class="res-title">${esc(titleText)}</h2>
    </div>`;
}

// A column's opening <div>: the reduced/static modifier classes, plus — for a column whose reduced/full state
// just changed (i.e. not "same") — a transition-delay so that when more than one column changes at once, they
// settle right to left (the newest/rightmost first) instead of all shifting together. `delay` is in ms.
function treeColOpen(baseClass, reduced, same, delay) {
  const cls = baseClass + (reduced ? ' res-col-reduced' : '') + (same ? ' res-col-static' : '');
  const style = same ? '' : ` style="transition-delay:${delay}ms"`;
  return `<div class="${cls}"${style}>`;
}

// Column 1: pick a page, grouped Professional / Misc. — this is the tree's starting point, full size until a
// page is actually picked. Once one is, it reduces like any other column (smaller, shared width — see
// .res-col-reduced in hub.css) rather than disappearing: its own pages stay listed, just smaller, so you can
// still jump straight to a different one in the same group. The group header becomes a link back to the full
// picker (selectTreePage toggles the open page back off), and the other group — not part of what's open — is
// dropped rather than also shown reduced. `same`/`delay`: see treeColOpen and renderTree.
// An "expanded" page (Web Archives' pages: its hub item has expand: true) isn't listed itself — each of its sections
// is, under the page's group heading, and picking one opens that section straight away (sub-sections in a column of
// their own, then the links). The page stays the one being edited and saved, so every admin control still works.
function treeEntries(pages) {
  return pages.flatMap(p => p.expand
    ? p.folders.map((f, fi) => ({ title: f.name, group: p.group, call: `selectTreeExpanded('${p.slug}',${fi})`,
        active: p.slug === treeSelPage && fi === treeSelSection, adm: treeAdmBtns(`selectTreeExpanded('${p.slug}',${fi},true);openTreeModal('section',${fi})`, `selectTreeExpanded('${p.slug}',${fi},true);deleteTreeNode('section',${fi})`) }))
    : [{ title: p.title, group: p.group, call: `selectTreePage('${p.slug}')`, active: p.slug === treeSelPage, adm: treePageAdmBtns(p) }]);
}
function selectTreeExpanded(slug, fi, keep) {
  const open = treeSelPage === slug && treeSelSection === fi;
  if (open && !keep) { treeSelPage = null; treeSelSection = -1; treeSelSub = -1; render(); return; }   // clicking the open one closes it
  treeSelPage = slug; treeSelTopic = -1; treeSelSection = fi;
  treeSelSub = open ? treeSelSub : treeDefaultSub(treeData[slug], fi);
  if (!keep) render();
}

function treePagesCol(reduced, same, delay) {
  const entries = treeEntries(Object.values(treeData));
  const groups = GROUPS.map(([id, label]) => [id, label, entries.filter(e => e.group === id)]).filter(([, , es]) => es.length);
  const rows = es => es.map(e => `<div class="res-row">
              <a class="res-link${e.active ? ' active' : ''}" href="#" onclick="event.preventDefault();${e.call}">${esc(e.title)}</a>
              ${e.adm}
            </div>`).join('');
  if (reduced) {
    const cur = treeData[treeSelPage];
    const [, label, es] = groups.find(([id]) => id === (cur && cur.group)) || [null, '', []];
    return `${treeColOpen('res-col res-col-cats', true, same, delay)}
        <div class="sidebar-section">
          <a href="#" class="res-chevron-label" onclick="event.preventDefault();selectTreePage('${treeSelPage}')" title="Back to ${esc(label)}"><span>${esc(label)}</span></a>
          <nav class="res-list">${rows(es)}</nav>
        </div>
      </div>`;
  }
  return treeColOpen('res-col res-col-cats', false, same, delay) + groups.map(([, label, es]) => `
      <div class="sidebar-section">
        <h3 class="res-head">${esc(label)}</h3>
        <nav class="res-list">${rows(es)}</nav>
      </div>`).join('') + treeAddBtn('+ page', `openItemModal('${TREE.sec}',null)`) + `</div>`;
}

// Column 2 on a page with topics: that page's Topics. `reduced` (a later column is now the one you're choosing
// from) narrows this one down to a shared width, its items all one (smaller) size — see the .res-col-reduced
// rules in hub.css — rather than shrinking further with every extra level the way it used to. Its "‹" backs out
// to the page picker (same as the reduced pages column's own back-link).
function treeTopicsCol(page, reduced, same, delay) {
  const rows = page.topics.map((t, i) => `<div class="res-row"${treeDnd('topic:' + i, false)}>
      <a class="res-link${i === treeSelTopic ? ' active' : ''}" href="#" onclick="event.preventDefault();selectTreeTopic(${i})">${esc(t.name)}</a>
      ${treeAdmBtns(`openTreeModal('topic',${i})`, `deleteTreeNode('topic',${i})`)}
    </div>`).join('');
  return `${treeColOpen('res-col res-col-sections', reduced, same, delay)}
      ${treeBackHead(`selectTreePage('${treeSelPage}')`, page.title)}
      <nav class="res-list">${rows}</nav>
      ${treeAddBtn('+ topic', `openTreeModal('topic',null)`)}
    </div>`;
}

// Column 2 (no topics) or column 3 (a topic picked): that page's or topic's Sections. See treeTopicsCol re:
// reduced/same/delay. Its header backs out to the topic picker when there is one, otherwise to the page picker.
function treeSectionsCol(page, reduced, same, delay) {
  const topic = page.topics[treeSelTopic];
  const rows = treeVisibleFolders(page).map(([f, i]) => `<div class="res-row"${treeDnd('section:' + i, true)}>
      <a class="res-link${i === treeSelSection ? ' active' : ''}" href="#" onclick="event.preventDefault();selectTreeSection(${i})">${esc(f.name)}</a>
      ${treeAdmBtns(`openTreeModal('section',${i})`, `deleteTreeNode('section',${i})`)}
    </div>`).join('');
  const back = topic ? `selectTreeTopic(${treeSelTopic})` : `selectTreePage('${treeSelPage}')`;
  return `${treeColOpen('res-col res-col-sections', reduced, same, delay)}
      ${treeBackHead(back, topic ? topic.name : page.title)}
      <nav class="res-list">${rows}</nav>
      ${treeAddBtn('+ section', `openTreeModal('section',null)`)}
    </div>`;
}

// Sub-sections get their own column only on a page with topics (matching that page's own tree); see treeLinksCol
// for the other pages, where sub-sections break the links column with a header instead. Its header backs out to
// the section picker.
function treeSubsCol(page, reduced, same, delay) {
  const f = page.folders[treeSelSection];
  if (!f || !f.subfolders.length) return '';
  const rows = f.subfolders.map((sf, si) => `<div class="res-row"${treeDnd('sub:' + treeSelSection + ':' + si, true)}>
      <a class="res-link${si === treeSelSub ? ' active' : ''}" href="#" onclick="event.preventDefault();selectTreeSub(${si})">${esc(sf.name)}</a>
      ${treeAdmBtns(`openTreeModal('sub',${treeSelSection},${si})`, `deleteTreeNode('sub',${treeSelSection},${si})`)}
    </div>`).join('');
  return `${treeColOpen('res-col res-col-sections res-col-subs', reduced, same, delay)}
      ${treeBackHead(page.expand ? `selectTreePage('${treeSelPage}')` : `selectTreeSection(${treeSelSection})`, f.name)}
      <nav class="res-list">${rows}</nav>
    </div>`;
}

// fi/si say where the list lives (si -1 = the section's own links, not a sub-section's) — only used for the admin buttons
function treeLinkList(items, fi, si) {
  const add = treeAddBtn('+ link', `openTreeModal('link',${fi},${si},null)`);
  if (!items || !items.length) return '<p class="res-empty">No links yet.</p>' + add;
  return `<ul class="res-links">` + items.map((it, ii) => (it.link
    ? `<li${treeDnd(`link:${fi}:${si}:${ii}`, true)}><a href="${esc(it.link)}"${/^https?:/i.test(it.link) ? ' target="_blank" rel="noopener"' : ''}${isAdmin ? ' draggable="false"' : ''}>${esc(it.name)}</a>`
    : `<li${treeDnd(`link:${fi}:${si}:${ii}`, true)}>${esc(it.name)}`)
    + treeAdmBtns(`openTreeModal('link',${fi},${si},${ii})`, `deleteTreeNode('link',${fi},${si},${ii})`) + `</li>`
  ).join('') + `</ul>` + add;
}

function treeOpenLink(href, label) {
  return `<a href="${esc(href)}" class="res-open" title="Open ${esc(label)} on its own page">↗ open page</a>`;
}

// The hub's own intro blurb (the two lines above "My Links" — moved into #hub-intro, hidden, in resources.html)
// fills this same right-hand position before any page is picked, instead of leaving it empty. My Favourites (the
// hub's hand-picked shortcuts) sits right under it, in the same column — reusing renderSection so it keeps its
// header, admin +/delete controls and .fav-list markup exactly as it had them as a standalone section, just
// relocated to the right of the page picker instead of below the whole tree.
// The Learning page link (#hub-more in resources.html), under the Technology Links tree's intro text
function treeMoreNote() {
  const src = TREE.sec === 'tech' && document.getElementById('hub-more');
  return src ? src.innerHTML : '';
}

function treeHubIntroCol() {
  // the hub's intro text only once, in the first tree; My Favourites in General Resources; otherwise just a hint
  const src = TREE === TREES[0] && document.getElementById('hub-intro');
  const favSec = TREE.sec === 'topics' && sections.find(s => s.id === 'favourites');
  const hint = !src && !favSec ? '<p class="res-hint">Choose a page to see its sections.</p>' : '';
  return `<div class="res-col res-col-links res-intro">${src ? src.innerHTML : ''}${treeMoreNote()}${favSec ? renderSection(favSec) : ''}${hint}</div>`;
}

// The rightmost column while nothing with actual links is picked yet: the page's own picture (pages are the only
// level with one) plus its own description — just the page's, not a topic's (topics, sections and sub-sections
// are all "child nodes" and don't get description text, to keep the tree dense — see treeLinksCol too). Shown as
// soon as a page is picked (before any topic/section), and again at every level after that until a "child" — a
// section (or sub-section) that itself has links — takes over and shows those instead (treeLinksCol).
function treeIntroCol(page, useTopics) {
  const topic = page.topics[treeSelTopic];
  const own = topic && topic.image ? topic : page.intro;   // a topic with its own picture shows that instead
  const picture = own.image
    ? `<img src="${esc(own.image)}" alt="${esc(own.alt || page.title)}">`
    : `<div class="res-intro-placeholder" aria-hidden="true">
         <svg viewBox="0 0 120 80" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
           <path d="M14 14h20M14 14v44M14 36h20M14 58h20M34 14v0M52 14h26M52 36h40M52 58h30M34 36h18M34 58h18M34 14h18"/>
         </svg>
       </div>`;
  const hint = useTopics && !topic ? 'Choose a topic to get started.' : 'Choose a section to see its links.';
  return `<div class="res-col res-col-links res-intro">
      <div class="res-intro-image">${picture}
        <button class="adm-btn adm-edit admin-only res-image-edit" onclick="${topic ? `openTreeModal('topic',${treeSelTopic})` : `openTreeModal('page')`}" title="Change picture">✎ picture</button>
      </div>
      <h2 class="res-section-title">${esc(topic ? topic.name : page.title)}</h2>
      ${!topic && page.intro.description ? `<p class="res-intro-text">${esc(page.intro.description)}</p>` : ''}
      <p class="res-hint">${esc(hint)}</p>
      ${treeMoreNote()}
      ${treeMdBtn()}
    </div>`;
}

// The final column: the selected section's (or sub-section's) links — the "child" treeIntroCol hands off to.
// No description text here either (see treeIntroCol) — just the title and the links themselves.
function treeLinksCol(page, useTopics) {
  const f = page.folders[treeSelSection];
  if (useTopics || page.expand) {
    const topic = page.topics[treeSelTopic];
    const sel = f.subfolders[treeSelSub];
    const target = sel || f;
    // (a page without topics only takes the section in its hash)
    const hash = useTopics ? slugify(topic.name) + '/' + slugify(f.name) + (sel ? '/' + slugify(sel.name) : '') : slugify(f.name);
    const open = treeOpenLink(`${TREE.dir}/${page.slug}.html#${hash}`, target.name);
    return `<div class="res-col res-col-links">
        <div class="res-head"${treeDnd(sel ? `sub:${treeSelSection}:${treeSelSub}` : `section:${treeSelSection}`, false)}><h2 class="res-section-title">${esc(target.name)}</h2>${open}</div>
        ${treeNodeImage(target)}
        ${treeLinkList(target.items, treeSelSection, sel ? treeSelSub : -1)}
        ${treeAddBtn('+ sub-section', `openTreeModal('sub',${treeSelSection},null)`)}
        ${treeMdBtn()}
      </div>`;
  }
  // no topics: sub-sections break the list with their own header, inline in this column (same as that page itself)
  const open = treeOpenLink(`${TREE.dir}/${page.slug}.html#${slugify(f.name)}`, f.name);
  let html = `<div class="res-head"${treeDnd('section:' + treeSelSection, false)}><h2 class="res-section-title">${esc(f.name)}</h2>${open}</div>` + treeNodeImage(f);
  // a section that only holds sub-sections skips the "No links yet." (the admin still gets "+ link")
  html += f.items.length || !f.subfolders.length ? treeLinkList(f.items, treeSelSection, -1) : treeAddBtn('+ link', `openTreeModal('link',${treeSelSection},-1,null)`);
  f.subfolders.forEach((sf, si) => {
    html += `<div class="res-subgroup">
        <h3 class="res-subhead"${treeDnd(`sub:${treeSelSection}:${si}`, true)}>${esc(sf.name)}${treeAdmBtns(`openTreeModal('sub',${treeSelSection},${si})`, `deleteTreeNode('sub',${treeSelSection},${si})`)}</h3>
        ${treeNodeImage(sf)}
        ${treeLinkList(sf.items, treeSelSection, si)}
      </div>`;
  });
  html += treeAddBtn('+ sub-section', `openTreeModal('sub',${treeSelSection},null)`) + treeMdBtn();
  return `<div class="res-col res-col-links">${html}</div>`;
}

function renderTree() {
  const pages = Object.values(treeData);
  if (!pages.length) return '';
  const page = treeSelPage ? treeData[treeSelPage] : null;

  // Work out which picker columns are actually open (pages, then topics?/sections/subs? as applicable) before
  // rendering any of them. Every one of them reduces once something has opened up to its direct right — another
  // picker column, or (unlike before) the last picker itself once its own pick is what's now showing real links
  // rather than just a "choose one to continue" hint (hasSelection) — so the tree keeps narrowing all the way
  // down to whatever you're actually looking at, not just down to the last list you clicked in.
  const pickers = ['pages'];
  let useTopics = false;
  if (page && page.expand) {
    // the section was picked in the first column; its sub-sections (if any) get their own column
    const f = page.folders[treeSelSection];
    if (f && f.subfolders.length) pickers.push('subs');
  } else if (page) {
    useTopics = page.topics.length > 0;
    pickers.push(useTopics ? 'topics' : 'sections');
    if (useTopics && treeSelTopic >= 0) pickers.push('sections');
    if (useTopics && page.folders[treeSelSection] && page.folders[treeSelSection].subfolders.length) pickers.push('subs');
  }
  const last = pickers.length - 1;
  const hasSelection = !!(page && page.folders[treeSelSection]);
  const reducedAt = pickers.map((kind, i) => i !== last || hasSelection);
  // A column whose kind and reduced/full state match what was there last time (position for position) skips the
  // resize transition entirely — picking a different item in an already-reduced (or already-full) list, or
  // backing out through one, shouldn't replay a "shrink"/"grow" that isn't actually happening. See res-col-static.
  // A column that IS actually changing gets a transition-delay based on its distance from the last (rightmost)
  // picker, so when more than one column changes at once they settle right to left instead of all shifting
  // together — the newest change first, each one further left following a beat after.
  const cols = pickers.map((kind, i) => {
    const reduced = reducedAt[i];
    const prev = treePrevCols[i];
    const same = !!(prev && prev.kind === kind && prev.reduced === reduced);
    const delay = (last - i) * 45;
    if (kind === 'pages') return treePagesCol(reduced, same, delay);
    if (kind === 'topics') return treeTopicsCol(page, reduced, same, delay);
    if (kind === 'subs') return treeSubsCol(page, reduced, same, delay);
    return treeSectionsCol(page, reduced, same, delay);
  }).join('');
  treePrevCols = pickers.map((kind, i) => ({ kind, reduced: reducedAt[i] }));
  const terminal = page ? (page.folders[treeSelSection] ? treeLinksCol(page, useTopics) : treeIntroCol(page, useTopics)) : treeHubIntroCol();

  // "res-tree" (not just "res-tree-hub") so this also picks up mobile.css's shared phone treatment for the
  // category pages' own tree — stacking, chip rows, active-state theming — since it targets that class name
  return `<div class="res-tree res-tree-hub">${cols}${terminal}</div>`;
}

// ── Admin: edit the open page's sections, sub-sections and links in place ──
// Saves the whole page back to navigation/resources/markdown/<slug>.md (save-resource-md.php), the same file
// that page's own tree (links.js) edits.
function treeAdmBtns(edit, del) {
  return `<span class="admin-only tree-adm">
      <button class="adm-btn adm-edit" onclick="event.preventDefault();event.stopPropagation();${edit}" title="Edit">✎</button>
      <button class="adm-btn adm-del" onclick="event.preventDefault();event.stopPropagation();${del}" title="Delete">✕</button>
    </span>`;
}
// The first column's pages are the hub's own My Links items (data/resources.json), so they use the item modal
function treePageAdmBtns(p) {
  return p.id ? treeAdmBtns(`openItemModal('${TREE.sec}','${p.id}')`, `deleteItem('${TREE.sec}','${p.id}')`) : '';
}
function treeAddBtn(label, action) {
  return `<button class="adm-text-add admin-only" onclick="${action}">${esc(label)}</button>`;
}

let treeEdit = null;   // { kind: 'page' | 'topic' | 'section' | 'sub' | 'link', fi, si, ii } — a null index means "add new"
                       // (for a topic, fi is its index into page.topics; 'page' is the open page's own picture + description)

function treeNodeImage(node) {
  return node.image ? `<div class="res-node-image"><img src="${esc(node.image)}" alt="${esc(node.alt || node.name)}"></div>` : '';
}

function treeEditTarget(e) {
  const page = treeData[treeSelPage];
  if (e.kind === 'page') return page.intro;
  if (e.kind === 'topic') return e.fi === null ? null : page.topics[e.fi];
  const f = page.folders[e.fi];
  if (e.kind === 'section') return e.fi === null ? null : f;
  if (e.kind === 'sub') return e.si === null ? null : f.subfolders[e.si];
  const list = e.si >= 0 ? f.subfolders[e.si].items : f.items;
  return e.ii === null ? null : list[e.ii];
}

function openTreeModal(kind, fi, si, ii) {
  treeEdit = { kind, fi, si: si === undefined ? null : si, ii: ii === undefined ? null : ii };
  const cur = treeEditTarget(treeEdit);
  const noun = { page: 'Page picture', topic: 'Topic', section: 'Section', sub: 'Sub-section', link: 'Link' }[kind];
  document.getElementById('tree-modal-title').textContent = kind === 'page' ? treeData[treeSelPage].title + ': picture & description' : (cur ? 'Edit ' : 'Add ') + noun;
  document.getElementById('tree-name').value = cur && kind !== 'page' ? cur.name : '';
  document.getElementById('tree-image').value = cur && kind !== 'link' ? cur.image || '' : '';
  document.getElementById('tree-image-status').textContent = '';
  showTreeImagePreview();
  document.getElementById('tree-url').value = cur && kind === 'link' ? cur.link : '';
  document.getElementById('tree-desc').value = cur ? cur.description || '' : '';
  document.querySelectorAll('#tree-modal .tree-link-only').forEach(el => { el.style.display = kind === 'link' ? '' : 'none'; });
  document.querySelectorAll('#tree-modal .tree-image-only').forEach(el => { el.style.display = kind === 'link' ? 'none' : ''; });
  document.querySelectorAll('#tree-modal .tree-name-only').forEach(el => { el.style.display = kind === 'page' ? 'none' : ''; });
  document.getElementById('tree-modal').classList.add('active');
  setTimeout(() => document.getElementById('tree-name').focus(), 60);
}
function closeTreeModal() { document.getElementById('tree-modal').classList.remove('active'); }

async function saveTreeModal() {
  const name = document.getElementById('tree-name').value.trim();
  const link = document.getElementById('tree-url').value.trim();
  const description = document.getElementById('tree-desc').value.trim();
  const image = document.getElementById('tree-image').value.trim();
  const e = treeEdit;
  if (!name && e.kind !== 'page') { alert('Name is required.'); return; }
  const page = treeData[treeSelPage];
  const cur = treeEditTarget(e);
  if (e.kind !== 'link') {
    // the picture is set on whatever's being saved — the new node gets it below, an existing one right here
    if (cur) cur.image = image;
    if (cur && !image) cur.alt = '';
  }
  if (e.kind === 'page') {
    cur.description = description;
  } else if (cur && e.kind === 'topic') {
    page.folders.forEach(f => { if (f.topic === cur.name) f.topic = name; });   // sections point at their topic by name
    cur.name = name; cur.description = description;
  } else if (cur) {
    cur.name = name; cur.description = description;
    if (e.kind === 'link') cur.link = link;
  } else if (e.kind === 'topic') {
    page.topics.push({ name, description, image, alt: '' });
  } else if (e.kind === 'section') {
    const topic = page.topics[treeSelTopic];
    page.folders.push({ name, description, image, alt: '', topic: topic ? topic.name : '', subfolders: [], items: [] });
  } else if (e.kind === 'sub') {
    page.folders[e.fi].subfolders.push({ name, description, image, alt: '', items: [] });
  } else {
    const f = page.folders[e.fi];
    (e.si >= 0 ? f.subfolders[e.si].items : f.items).push({ name, description, link });
  }
  if (await persistTree(page)) { closeTreeModal(); render(); }
}

async function deleteTreeNode(kind, fi, si, ii) {
  const page = treeData[treeSelPage];
  if (kind === 'topic') {
    const t = page.topics[fi];
    if (!confirm(`Delete the topic "${t.name}" with all its sections and links?`)) return;
    page.topics.splice(fi, 1);
    page.folders = page.folders.filter(f => f.topic !== t.name);
    treeSelTopic = -1; treeSelSection = -1; treeSelSub = -1;
    await persistTree(page);
    render();
    return;
  }
  const f = page.folders[fi];
  if (kind === 'section') {
    if (!confirm(`Delete the section "${f.name}" and all its links?`)) return;
    page.folders.splice(fi, 1);
    if (treeSelSection === fi) { treeSelSection = -1; treeSelSub = -1; }
    else if (treeSelSection > fi) treeSelSection--;
  } else if (kind === 'sub') {
    if (!confirm(`Delete the sub-section "${f.subfolders[si].name}" and all its links?`)) return;
    f.subfolders.splice(si, 1);
    if (treeSelSub === si) treeSelSub = treeDefaultSub(page, fi);
    else if (treeSelSub > si) treeSelSub--;
  } else {
    const list = si >= 0 ? f.subfolders[si].items : f.items;
    if (!confirm(`Remove "${list[ii].name}"?`)) return;
    list.splice(ii, 1);
  }
  await persistTree(page);
  render();
}

async function persistTree(page) {
  try {
    const res = await fetch('../admin/save-resource-md.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file: page.slug, dir: TREE.dir, content: HubData.serializeMarkdown(page.folders, page.intro, page.topics) })
    }).then(r => r.json());
    if (!res.success) { alert('Save error: ' + (res.error || 'unknown')); return false; }
    return true;
  } catch(e) { alert('Network error — changes not saved.'); return false; }
}

// ── Admin: drag & drop, Finder style — dropping something ON an item moves it INTO that item ──
//   link        → section / sub-section: moves into it;  → another link: moves just before it
//   sub-section → section: moves into it;  → another sub-section: moves just before it;  → topic: becomes a section there
//   section     → topic: moves to that topic;  → another section: becomes its sub-section (only when it has none
//                 of its own — the markdown only goes two levels deep)
// Rows carry data-node="kind:indices" (treeDnd); moves stay within the open page and save it like any other edit.
function treeDnd(node, draggable) {
  if (!isAdmin) return '';
  return ` data-node="${node}"` + (draggable ? ' draggable="true"' : '');
}

let treeDragNode = null;

function parseNode(str) {
  const [kind, ...n] = str.split(':');
  const [a, b, c] = n.map(Number);
  return { kind, fi: a, si: b, ii: c };
}

// Can `src` be dropped on `dst`? (a quick check for the drag highlight; moveTreeNode does the work)
function treeCanDrop(src, dst) {
  if (src.kind === 'link') {
    if (dst.kind === 'section' || dst.kind === 'sub') return !(dst.kind === 'section' ? src.si === -1 && src.fi === dst.fi : src.fi === dst.fi && src.si === dst.si);
    if (dst.kind === 'link') return !(src.fi === dst.fi && src.si === dst.si && src.ii === dst.ii);
    return false;
  }
  if (src.kind === 'sub') {
    if (dst.kind === 'section') return dst.fi !== src.fi;
    if (dst.kind === 'sub') return !(dst.fi === src.fi && dst.si === src.si);
    return dst.kind === 'topic';
  }
  if (src.kind === 'section') return (dst.kind === 'topic') || (dst.kind === 'section' && dst.fi !== src.fi);
  return false;
}

async function moveTreeNode(src, dst) {
  const page = treeData[treeSelPage];
  const selF = page.folders[treeSelSection];
  const selS = selF ? selF.subfolders[treeSelSub] : null;
  const listOf = (fi, si) => si >= 0 ? page.folders[fi].subfolders[si].items : page.folders[fi].items;
  const take = (arr, obj) => arr.splice(arr.indexOf(obj), 1)[0];

  if (src.kind === 'link') {
    const fromList = listOf(src.fi, src.si);
    const item = fromList[src.ii];
    if (dst.kind === 'link') {
      const toList = listOf(dst.fi, dst.si);
      const before = toList[dst.ii];
      take(fromList, item);
      toList.splice(toList.indexOf(before), 0, item);
    } else {
      take(fromList, item);
      (dst.kind === 'sub' ? page.folders[dst.fi].subfolders[dst.si].items : page.folders[dst.fi].items).push(item);
    }
  } else if (src.kind === 'sub') {
    const from = page.folders[src.fi];
    const sub = from.subfolders[src.si];
    if (dst.kind === 'section') {
      const to = page.folders[dst.fi];
      take(from.subfolders, sub);
      to.subfolders.push(sub);
    } else if (dst.kind === 'sub') {
      const to = page.folders[dst.fi];
      const before = to.subfolders[dst.si];
      take(from.subfolders, sub);
      to.subfolders.splice(to.subfolders.indexOf(before), 0, sub);
    } else {
      take(from.subfolders, sub);
      page.folders.push({ name: sub.name, description: sub.description, image: sub.image, alt: sub.alt,
                          topic: page.topics[dst.fi].name, subfolders: [], items: sub.items });
    }
  } else if (src.kind === 'section') {
    const f = page.folders[src.fi];
    if (dst.kind === 'topic') {
      take(page.folders, f);
      f.topic = page.topics[dst.fi].name;
      page.folders.push(f);
    } else {
      if (f.subfolders.length) { alert(`"${f.name}" has sub-sections of its own, so it can't go inside another section. Move its sub-sections out first.`); return; }
      const to = page.folders[dst.fi];
      take(page.folders, f);
      to.subfolders.push({ name: f.name, description: f.description, image: f.image, alt: f.alt, items: f.items });
    }
  }

  // keep the same section / sub-section open wherever it ended up (or close it if it's no longer one)
  treeSelSection = selF ? page.folders.indexOf(selF) : -1;
  treeSelSub = treeSelSection >= 0 && selS ? page.folders[treeSelSection].subfolders.indexOf(selS) : -1;
  if (treeSelSection >= 0 && treeSelSub < 0) treeSelSub = treeDefaultSub(page, treeSelSection);
  const openF = page.folders[treeSelSection];
  if (openF && page.topics.length && treeSelTopic >= 0 && openF.topic !== page.topics[treeSelTopic].name) {
    treeSelTopic = page.topics.findIndex(t => t.name === openF.topic);
  }
  await persistTree(page);
  render();
}

function clearDropHighlight() {
  document.querySelectorAll('.tree-drop-over').forEach(el => el.classList.remove('tree-drop-over'));
}
document.addEventListener('dragstart', e => {
  const el = e.target.closest && e.target.closest('.res-tree-hub [data-node][draggable="true"]');
  if (!el) return;
  treeDragNode = parseNode(el.dataset.node);
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', el.dataset.node);
  el.classList.add('tree-dragging');
});
document.addEventListener('dragend', () => {
  treeDragNode = null;
  clearDropHighlight();
  document.querySelectorAll('.tree-dragging').forEach(el => el.classList.remove('tree-dragging'));
});
document.addEventListener('dragover', e => {
  if (!treeDragNode) return;
  const el = e.target.closest && e.target.closest('.res-tree-hub [data-node]');
  if (!el || !treeCanDrop(treeDragNode, parseNode(el.dataset.node))) { clearDropHighlight(); return; }
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  if (!el.classList.contains('tree-drop-over')) { clearDropHighlight(); el.classList.add('tree-drop-over'); }
});
document.addEventListener('drop', e => {
  if (!treeDragNode) return;
  const el = e.target.closest && e.target.closest('.res-tree-hub [data-node]');
  const src = treeDragNode;
  treeDragNode = null;
  clearDropHighlight();
  if (!el) return;
  const dst = parseNode(el.dataset.node);
  if (!treeCanDrop(src, dst)) return;
  e.preventDefault();
  moveTreeNode(src, dst);
});

// ── Admin: the open page's whole file as markdown, for reorganising in bulk ──
//   # Topic  /  ## Section  /  ### Sub-section  /  - **Link name**: notes  +  "  - https://…" on the next line
// Saving re-reads it into the tree exactly as the page would on load.
function treeMdBtn() {
  return treeAddBtn('✎ edit this page as markdown', 'openTreeMd()')
    + treeAddBtn('⬇ download as spreadsheet (CSV)', 'downloadTreeCsv()')
    + treeAddBtn('⬆ upload spreadsheet (CSV)', "document.getElementById('tree-csv-input').click()");
}
function openTreeMd() {
  const page = treeData[treeSelPage];
  document.getElementById('tree-md-title').textContent = page.title + ' — markdown';
  document.getElementById('tree-md-text').value = HubData.serializeMarkdown(page.folders, page.intro, page.topics);
  document.getElementById('tree-md-modal').classList.add('active');
}
function closeTreeMd() { document.getElementById('tree-md-modal').classList.remove('active'); }
async function saveTreeMd() {
  const page = treeData[treeSelPage];
  const parsed = HubData.parseMarkdown(document.getElementById('tree-md-text').value);
  if (!parsed.folders.length && page.folders.length && !confirm('This leaves the page with no sections at all. Save anyway?')) return;
  Object.assign(page, { intro: parsed.intro, folders: parsed.folders, topics: parsed.topics });
  treeSelTopic = -1; treeSelSection = -1; treeSelSub = -1;   // names may have changed — start the page over
  if (await persistTree(page)) { closeTreeMd(); render(); }
}

// ── Admin: the open page as a spreadsheet (CSV) — one row per link: Topic, Section, Sub-section, Name, URL, Notes ──
// Sort / regroup / rename it in Numbers, Excel or Google Sheets, then upload it back: the page is rebuilt in row
// order. A row with no Name keeps an empty section or sub-section. Descriptions and pictures aren't in the sheet —
// they're carried over from the current page by matching topic / section / sub-section names.
const CSV_COLS = ['Topic', 'Section', 'Sub-section', 'Name', 'URL', 'Notes'];

function csvCell(v) {
  v = String(v == null ? '' : v);
  return /[",\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
}
function parseCsv(text) {
  const rows = []; let row = [], cell = '', q = false;
  text = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += c;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows.filter(r => r.some(c => c.trim() !== ''));
}

function downloadTreeCsv() {
  const page = treeData[treeSelPage];
  const lines = [CSV_COLS];
  const topicOrder = page.topics.length ? page.topics.map(t => t.name) : [''];
  const folders = page.topics.length
    ? topicOrder.flatMap(tn => page.folders.filter(f => f.topic === tn)).concat(page.folders.filter(f => !page.topics.some(t => t.name === f.topic)))
    : page.folders;
  page.topics.filter(t => !page.folders.some(f => f.topic === t.name)).forEach(t => lines.push([t.name, '', '', '', '', '']));
  folders.forEach(f => {
    const add = (sub, items) => {
      if (!items.length) lines.push([f.topic || '', f.name, sub, '', '', '']);
      items.forEach(it => lines.push([f.topic || '', f.name, sub, it.name, it.link, it.description]));
    };
    if (f.items.length || !f.subfolders.length) add('', f.items);
    f.subfolders.forEach(sf => add(sf.name, sf.items));
  });
  const csv = '\uFEFF' + lines.map(r => r.map(csvCell).join(',')).join('\r\n') + '\r\n';
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  a.download = page.slug + '.csv';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

async function uploadTreeCsv(input) {
  const file = input.files[0]; input.value = '';
  if (!file) return;
  const page = treeData[treeSelPage];
  const rows = parseCsv(await file.text());
  if (!rows.length) { alert('That file is empty.'); return; }
  // columns are found by their header names (any order, any case); without a header row, the standard order
  const head = rows[0].map(h => h.trim().toLowerCase());
  const hasHead = head.includes('section') && head.includes('name');
  const col = name => { const i = head.indexOf(name.toLowerCase()); return hasHead ? i : CSV_COLS.indexOf(name); };
  const ix = Object.fromEntries(CSV_COLS.map(c => [c, col(c)]));
  const get = (r, c) => ix[c] >= 0 ? String(r[ix[c]] || '').trim() : '';

  const topics = [], folders = [];
  let skipped = 0;
  (hasHead ? rows.slice(1) : rows).forEach(r => {
    const tn = get(r, 'Topic'), sn = get(r, 'Section'), sub = get(r, 'Sub-section'), name = get(r, 'Name');
    if (tn && !topics.some(t => t.name === tn)) topics.push({ name: tn, description: '', image: '', alt: '' });
    if (!sn) { if (!tn) skipped++; return; }
    let f = folders.find(x => x.name === sn && x.topic === tn);
    if (!f) folders.push(f = { name: sn, description: '', image: '', alt: '', topic: tn, subfolders: [], items: [] });
    let list = f.items;
    if (sub) {
      let sf = f.subfolders.find(x => x.name === sub);
      if (!sf) f.subfolders.push(sf = { name: sub, description: '', image: '', alt: '', items: [] });
      list = sf.items;
    }
    if (name) list.push({ name, description: get(r, 'Notes'), link: get(r, 'URL') });
  });
  if (!folders.length) { alert('No sections found — the sheet needs at least a Section column with values.'); return; }

  // carry descriptions and pictures over from the current page, matched by name
  const keep = (to, from) => { if (from) { to.description = from.description; to.image = from.image; to.alt = from.alt; } };
  topics.forEach(t => keep(t, page.topics.find(o => o.name === t.name)));
  folders.forEach(f => {
    const old = page.folders.find(o => o.name === f.name && o.topic === f.topic) || page.folders.find(o => o.name === f.name);
    keep(f, old);
    if (old) f.subfolders.forEach(sf => keep(sf, old.subfolders.find(o => o.name === sf.name)));
  });

  const links = folders.reduce((n, f) => n + f.items.length + f.subfolders.reduce((m, sf) => m + sf.items.length, 0), 0);
  const before = page.folders.reduce((n, f) => n + f.items.length + f.subfolders.reduce((m, sf) => m + sf.items.length, 0), 0);
  const msg = `Replace "${page.title}" with this sheet?\n\n` +
    (topics.length ? `${topics.length} topics, ` : '') + `${folders.length} sections, ${links} links` +
    ` (currently ${before} links).` + (skipped ? `\n${skipped} row(s) with no section will be skipped.` : '') +
    `\n\nThe current version is backed up first.`;
  if (!confirm(msg)) return;
  Object.assign(page, { folders, topics });
  treeSelTopic = -1; treeSelSection = -1; treeSelSub = -1;
  if (await persistTree(page)) render();
}

function showTreeImagePreview() {
  const src = document.getElementById('tree-image').value;
  const img = document.getElementById('tree-image-preview');
  img.style.display = src ? '' : 'none';
  if (src) img.src = src;
}
async function uploadTreeImage(input) {
  const file = input.files[0]; input.value = '';
  if (!file) return;
  const status = document.getElementById('tree-image-status');
  status.textContent = 'Uploading…';
  const fd = new FormData(); fd.append('image', file); fd.append('type', 'resources');
  try {
    const up = await fetch('../admin/upload-image.php', { method: 'POST', body: fd }).then(r => r.json());
    if (!up.success) { status.textContent = 'Upload failed: ' + (up.error || 'unknown error'); return; }
    document.getElementById('tree-image').value = up.display || up.path;
    showTreeImagePreview();
    status.textContent = 'Uploaded — press Save.';
  } catch (e) { status.textContent = 'Upload failed (network).'; }
}
function removeTreeImage() {
  document.getElementById('tree-image').value = '';
  showTreeImagePreview();
  document.getElementById('tree-image-status').textContent = 'Picture removed — press Save.';
}

function injectTreeModal() {
  const m = document.createElement('div');
  m.className = 'res-modal';
  m.id = 'tree-modal';
  m.innerHTML = `<div class="res-modal-box">
      <h3 id="tree-modal-title">Edit</h3>
      <label class="tree-name-only">Name *</label>
      <input type="text" id="tree-name" class="tree-name-only">
      <label class="tree-link-only">URL</label>
      <input type="text" id="tree-url" class="tree-link-only" placeholder="https://...">
      <label>Description (optional)</label>
      <input type="text" id="tree-desc">
      <label class="tree-image-only">Picture (optional)</label>
      <div class="tree-image-only tree-image-row">
        <img id="tree-image-preview" alt="">
        <input type="hidden" id="tree-image">
        <label class="res-modal-cancel tree-image-btn">Upload…<input type="file" accept="image/*" hidden onchange="uploadTreeImage(this)"></label>
        <button type="button" class="res-modal-cancel" onclick="removeTreeImage()">Remove</button>
        <span id="tree-image-status"></span>
      </div>
      <div class="res-modal-actions">
        <button class="res-modal-save" onclick="saveTreeModal()">Save</button>
        <button class="res-modal-cancel" onclick="closeTreeModal()">Cancel</button>
      </div>
    </div>`;
  m.addEventListener('click', e => { if (e.target === m) closeTreeModal(); });
  m.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.tagName === 'INPUT') saveTreeModal(); });
  document.body.appendChild(m);

  const md = document.createElement('div');
  md.className = 'res-modal';
  md.id = 'tree-md-modal';
  md.innerHTML = `<div class="res-modal-box tree-md-box">
      <h3 id="tree-md-title">Markdown</h3>
      <p class="tree-md-help"># Topic &nbsp;·&nbsp; ## Section &nbsp;·&nbsp; ### Sub-section &nbsp;·&nbsp; - **Link name**: notes, then the URL on the next line as "  - https://…"</p>
      <textarea id="tree-md-text" spellcheck="false"></textarea>
      <div class="res-modal-actions">
        <button class="res-modal-save" onclick="saveTreeMd()">Save</button>
        <button class="res-modal-cancel" onclick="closeTreeMd()">Cancel</button>
      </div>
    </div>`;
  md.addEventListener('click', e => { if (e.target === md) closeTreeMd(); });
  document.body.appendChild(md);

  const csvInput = document.createElement('input');
  csvInput.type = 'file';
  csvInput.accept = '.csv,text/csv';
  csvInput.id = 'tree-csv-input';
  csvInput.hidden = true;
  csvInput.addEventListener('change', () => uploadTreeCsv(csvInput));
  document.body.appendChild(csvInput);
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

// My Favourites (the hub's hand-picked shortcuts): smaller and narrower than a Guides-style menu (its own
// .fav-list, not .menu-list), title only, no description.
function renderLinks(sec) {
  return `<ul class="fav-list">` +
    (sec.items||[]).map(item => `
      <li class="fav-item">
        <a href="${esc(item.href)}" class="fav-link">${esc(item.title)}</a>
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
  if (treeIndex(secId) >= 0) { if (treeSelPage && !sec.items.some(i => i.id === treeSelPage)) resetTree(); await loadTrees(); }
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
  if (treeIndex(modalSectionId) >= 0) await loadTrees();
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
