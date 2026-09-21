// Resource category pages — a three-column tree, like the Photos / Blog sidebars:
//
//   Categories (the hub's cards)  →  this category's sections  →  the section's links
//
// Nothing is selected when a page opens: the right-hand column shows the category's image + description
// until you pick a section.
//
// A category's content lives in markdown/<name>.md (falls back to seed/<name>.md until it is first edited):
//   ![alt](image)              (before the first ##: the category's picture)
//   > one-line description     (before the first ##: the category's description)
//   # Topic                    (optional, groups the sections below it; next line, optional:  > description)
//   ## Section                 (next line, optional:  > one-line description)
//   ### Sub-section            (next line, optional:  > description) — a header that breaks up the links
//   - **Link name**: notes     (the notes stay in the file, they aren't shown on the page)
//     - https://example.com    (or a path on this site, like /learning/alg/alg.html)
//
// Signed in as admin you can edit every layer: categories, the intro, sections, sub-sections and links.
// Categories can also be added without creating a page: category.html?c=<name> shows any category.

// A page with topics is a four-level tree: the title is the category, the first column lists its Topics,
// the second column the selected topic's Sections, the third the section's links (### sub-sections break them).
// Pages without any "# Topic" line keep the older layout (category list → sections → links).
//
// This one file drives two folders of category pages, which mirror each other:
//   navigation/resources/*.html → the "Saved Links" categories
//   navigation/learning/*.html  → the "Guides" categories (tutorials; the sub-sections are their secondary navigation)
// Which group a page belongs to comes from its folder; the category column lists just that group (hub-data.js).
const FOLDER = window.location.pathname.split('/').slice(-2, -1)[0];   // 'resources' or 'learning'
const GUIDE = FOLDER === 'learning';
const ROOT = '../../';                                                 // the site root, relative to this page
const HUB_TITLE = GUIDE ? 'Guides' : 'Saved Links';
const HUB_PAGE = GUIDE ? '../learning.html' : '../resources.html';     // the page the "< All ..." link goes back to
const HUB_BACK = GUIDE ? 'All Guides' : 'All Topics';
const SITE_SECTION = GUIDE ? 'Learning' : 'Resources';                  // "Learning - Algorithms" in the tab title
const PARAMS = new URLSearchParams(window.location.search);
const PAGE = (PARAMS.get('c') || window.location.pathname.split('/').pop().replace('.html', '')).toLowerCase().replace(/[^a-z0-9-]/g, '');
// technology.html has always read tech.md, the README says technology.md — accept either
// (the topic-tree pages: creating, consuming, exploring, learning, misc, technology, open-source, get-involved)
const TOPIC_PAGES = ['creating', 'consuming', 'exploring', 'learning', 'misc', 'technology', 'open-source', 'get-involved', 'careers'];
const MD_NAMES = {};
const HUB_DATA_URL = ROOT + 'data/resources.json';
const HUB_SAVE_URL = ROOT + 'admin/save-resources.php';

let mdFile = PAGE;          // the markdown file that loaded (saves always go to markdown/<name>.md)
let intro = { image: '', alt: '', description: '' };
let topicsData = [];        // [{ name, description }] — the "# Topic" headings, in file order
let curTopic = -1;          // index into topicsData, -1 = none selected
let foldersData = [];       // [{ name, description, topic, items, subfolders: [{ name, description, items }] }]
let hubData = [];           // the hub's raw sections (data/resources.json)
let categories = [];        // [{ title, desc, href, si, ii }]  — si/ii point back into hubData
let curSection = -1;        // -1 = nothing selected
let isAdmin = false;

// ── Parse markdown ───────────────────────────────────────────────
function parseMarkdown(markdown) {
    const folders = [], topics = [];
    const info = { image: '', alt: '', description: '' };
    let folder = null, sub = null, last = null, topic = null;

    markdown.split('\n').forEach(raw => {
        const line = raw.replace(/\r$/, '');
        const t = line.trim();
        if (line.startsWith('# ')) {
            topic = { name: line.slice(2).trim(), description: '' };
            topics.push(topic);
            folder = null; sub = null; last = null;
        } else if (line.startsWith('## ')) {
            folder = { name: line.slice(3).trim(), description: '', topic: topic ? topic.name : '', subfolders: [], items: [] };
            folders.push(folder);
            sub = null; last = null;
        } else if (line.startsWith('### ')) {
            if (!folder) return;
            sub = { name: line.slice(4).trim(), description: '', items: [] };
            folder.subfolders.push(sub);
            last = null;
        } else if (t.startsWith('- **')) {
            const m = t.match(/^- \*\*(.+?)\*\*:?\s*(.*)/);
            if (m && folder) {
                last = { name: m[1], description: m[2], link: '' };
                (sub ? sub.items : folder.items).push(last);
            }
        } else if (/^- (https?:|\/|\.\.?\/|mailto:)/i.test(t)) {
            if (last) last.link = t.slice(2).trim();
        } else if (t.startsWith('>')) {
            const d = t.replace(/^>\s?/, '');
            const target = sub || folder || topic || info;
            target.description = target.description ? target.description + ' ' + d : d;
        } else if (!folder) {
            const im = t.match(/^!\[([^\]]*)\]\(([^)]+)\)/);
            if (im) { info.alt = im[1]; info.image = im[2]; }
        }
    });
    return { intro: info, folders, topics };
}

// ── Serialize back to markdown ───────────────────────────────────
function serializeToMarkdown(folders, info, topics) {
    const itemMd = it => `- **${it.name}**: ${it.description}\n` + (it.link ? `  - ${it.link}\n` : '');
    let md = '';
    if (info && (info.image || info.description)) {
        if (info.image) md += `![${info.alt || ''}](${info.image})\n`;
        if (info.description) md += `> ${info.description}\n`;
        md += '\n';
    }
    const folderMd = f => {
        md += `## ${f.name}\n` + (f.description ? `> ${f.description}\n` : '') + '\n';
        f.items.forEach(it => { md += itemMd(it); });
        f.subfolders.forEach(sf => {
            md += `\n### ${sf.name}\n` + (sf.description ? `> ${sf.description}\n` : '') + '\n';
            sf.items.forEach(it => { md += itemMd(it); });
        });
        md += '\n';
    };
    topics = topics || [];
    // sections that belong to no topic go first — after a "# Topic" line they would be read as part of it
    folders.filter(f => !topics.some(t => t.name === f.topic)).forEach(folderMd);
    topics.forEach(t => {
        md += `# ${t.name}\n` + (t.description ? `> ${t.description}\n` : '') + '\n';
        folders.filter(f => f.topic === t.name).forEach(folderMd);
    });
    return md;
}

// ── Save ─────────────────────────────────────────────────────────
async function saveMd() {
    try {
        const res = await fetch(ROOT + 'admin/save-resource-md.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ file: mdFile, dir: FOLDER, content: serializeToMarkdown(foldersData, intro, topicsData) })
        }).then(r => r.json());
        if (!res.success) alert('Save error: ' + (res.error || 'unknown'));
    } catch (e) { alert('Network error — changes not saved.'); }
}

async function saveHub() {
    try {
        const res = await fetch(HUB_SAVE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(hubData)
        }).then(r => r.json());
        if (!res.success) alert('Save error: ' + (res.error || 'unknown'));
    } catch (e) { alert('Network error — changes not saved.'); }
}

// ── Helpers ───────────────────────────────────────────────────────
function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function slug(s) {
    return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
function uid() { return Math.random().toString(36).slice(2, 9) + Date.now().toString(36); }
// category.html?c=design → "design";  resources/design.html → "design"
function catSlug(href) {
    const u = new URL(href, location.href);
    return (u.searchParams.get('c') || u.pathname.split('/').pop().replace('.html', '')).toLowerCase();
}
function isCurrent(cat) { return catSlug(cat.href) === PAGE; }
function isExternal(u) { return /^(https?:)?\/\//i.test(u) || /^mailto:/i.test(u); }
function pageTitle() {
    const h = document.querySelector('.page-title');
    return h ? h.textContent.trim() : SITE_SECTION;
}
function currentCategory() {
    return categories.find(isCurrent) || { title: pageTitle(), desc: '', href: location.href };
}

function useTopics() { return !GUIDE && (topicsData.length > 0 || TOPIC_PAGES.includes(PAGE)); }
// sections shown in the second column: the selected topic's (topic pages), or all of them
function visibleFolders() {
    if (!useTopics()) return foldersData.map((f, i) => [f, i]);
    const t = topicsData[curTopic];
    return t ? foldersData.map((f, i) => [f, i]).filter(([f]) => f.topic === t.name) : [];
}

// ── Categories: this group's cards from the hub, in the hub's order ──
async function loadHub() {
    let data = [];
    try {
        const r = await fetch(HUB_DATA_URL + '?t=' + Date.now());
        data = r.ok ? await r.json() : [];
    } catch (e) { /* not there yet */ }
    data = HubData.normalize(data);
    data.forEach(s => (s.items || []).forEach(it => { if (!it.id) it.id = uid(); }));
    return data;
}

function buildCategories() {
    const list = [];
    hubData.forEach((s, si) => {
        if (s.type !== 'cards' || HubData.isGuides(s) !== GUIDE) return;      // just this page's own group
        (s.items || []).forEach((it, ii) => {
            list.push({ title: it.title, desc: it.desc || '', href: new URL(it.href, new URL('../resources.html', location.href)).href, si, ii });
        });
    });
    if (!list.some(isCurrent)) list.push({ title: pageTitle(), desc: '', href: location.href, si: -1, ii: -1 });
    return list;
}

// ── Render ───────────────────────────────────────────────────────
function admRowBtns(fi, si, ii) {
    if (!isAdmin) return '';
    const s = si === null ? 'null' : si;
    return `<span class="res-adm">
        <button class="lnk-adm-btn lnk-edit" onclick="openRowModal(${fi},${s},${ii})" title="Edit link">✎</button>
        <button class="lnk-adm-btn lnk-del"  onclick="deleteRow(${fi},${s},${ii})" title="Remove link">✕</button>
      </span>`;
}

function linkList(items, fi, si) {
    if (!items.length) return isAdmin ? '<p class="res-empty">No links yet.</p>' : '';
    return '<ul class="res-links">' + items.map((it, ii) => {
        const tip = isAdmin && it.description ? ` title="${esc(it.description)}"` : '';
        const name = it.link
            ? `<a href="${esc(it.link)}"${isExternal(it.link) ? ' target="_blank" rel="noopener"' : ''}${tip}>${esc(it.name)}</a>`
            : `<span${tip}>${esc(it.name)}</span>`;
        return `<li>${name}${admRowBtns(fi, si, ii)}</li>`;
    }).join('') + '</ul>';
}

function categoriesCol() {
    // same two-part sidebar as Blogs / Photos / Art / Archives: one general link
    // ("< All Topics", back to the hub), then a titled list of every category
    const rows = categories.map((c, i) => `<div class="res-row">
        <a class="res-link${isCurrent(c) ? ' active' : ''}" href="${esc(c.href)}">${esc(c.title)}</a>
        ${isAdmin ? `<span class="res-adm">
          <button class="lnk-adm-btn lnk-edit" onclick="openCategoryModal(${i})" title="Rename / describe category">✎</button>
          <button class="lnk-adm-btn lnk-del"  onclick="deleteCategory(${i})" title="Remove category">✕</button>
        </span>` : ''}
      </div>`).join('');
    return `<div class="res-col res-col-cats">
        <div class="sidebar-section">
          <a class="sidebar-link res-back" href="${HUB_PAGE}">&lt; ${HUB_BACK}</a>
        </div>
        <div class="sidebar-section">
          <h3 class="res-head">${HUB_TITLE}</h3>
          <nav class="res-list">${rows}</nav>
          ${isAdmin ? '<button class="lnk-adm-add-row" onclick="openCategoryModal(null)">+ Add category</button>' : ''}
        </div>
      </div>`;
}

// First column of a topic page: the way back to the hub, then this category's topics
function topicsCol() {
    const rows = topicsData.map((t, i) => `<div class="res-row">
        <a class="res-link${i === curTopic ? ' active' : ''}" href="#${slug(t.name)}" data-t="${i}">${esc(t.name)}</a>
        ${isAdmin ? `<span class="res-adm">
          <button class="lnk-adm-btn lnk-edit" onclick="renameTopic(${i})" title="Rename topic">✎</button>
          <button class="lnk-adm-btn lnk-del"  onclick="deleteTopic(${i})" title="Delete topic and its sections">✕</button>
        </span>` : ''}
      </div>`).join('');
    return `<div class="res-col res-col-cats">
        <div class="sidebar-section">
          <a class="sidebar-link res-back" href="${HUB_PAGE}">&lt; ${HUB_BACK}</a>
        </div>
        <div class="sidebar-section">
          <h3 class="res-head">Topics</h3>
          <nav class="res-list">${rows}</nav>
          ${isAdmin ? '<button class="lnk-adm-add-row" onclick="addTopic()">+ Add topic</button>' : ''}
        </div>
      </div>`;
}

function sectionsCol() {
    const cat = currentCategory();
    const topic = topicsData[curTopic];
    const rows = visibleFolders().map(([f, i]) => `<div class="res-row">
        <a class="res-link${i === curSection ? ' active' : ''}" href="#${slug(f.name)}" data-i="${i}">${esc(f.name)}</a>
        ${isAdmin ? `<span class="res-adm">
          <button class="lnk-adm-btn lnk-edit" onclick="openFolderModal(${i})" title="Rename / describe">✎</button>
          <button class="lnk-adm-btn lnk-del"  onclick="deleteFolder(${i})" title="Delete section">✕</button>
        </span>` : ''}
      </div>`).join('');
    return `<div class="res-col res-col-sections">
        <div class="res-head"><h2 class="res-title">${esc(topic ? topic.name : cat.title)}</h2>${(topic ? topic.description : cat.desc) ? `<p class="res-sub">${esc(topic ? topic.description : cat.desc)}</p>` : ''}</div>
        <nav class="res-list">${rows}</nav>
        ${isAdmin && (topic || !useTopics()) ? '<button class="lnk-adm-add-row" onclick="openFolderModal(null)">+ Add section</button>' : ''}
      </div>`;
}

// Right-hand column while nothing is selected: the category's picture and description
function introCol() {
    const cat = currentCategory();
    const text = intro.description || cat.desc;
    const picture = intro.image
        ? `<img src="${esc(intro.image)}" alt="${esc(intro.alt || cat.title)}">`
        : `<div class="res-intro-placeholder" aria-hidden="true">
             <svg viewBox="0 0 120 80" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
               <path d="M14 14h20M14 14v44M14 36h20M14 58h20M34 14v0M52 14h26M52 36h40M52 58h30M34 36h18M34 58h18M34 14h18"/>
             </svg>
           </div>`;
    const hint = useTopics() && curTopic < 0
        ? (topicsData.length ? 'Choose a topic to get started.' : (isAdmin ? 'Nothing in here yet — add a topic on the left to start.' : 'Nothing in here yet.'))
        : foldersData.length
        ? 'Choose a section to see its links.'
        : (isAdmin ? 'Nothing in here yet — add a section on the left to start.' : 'Nothing in here yet.');
    return `<div class="res-col res-col-links res-intro">
        <div class="res-intro-image">${picture}</div>
        <h2 class="res-section-title">${esc(cat.title)}</h2>
        ${text ? `<p class="res-intro-text">${esc(text)}</p>` : ''}
        <p class="res-hint">${esc(hint)}</p>
        ${isAdmin ? '<button class="lnk-adm-add-row" onclick="openIntroModal()">✎ Edit picture &amp; description</button>' : ''}
      </div>`;
}

function linksCol() {
    const f = foldersData[curSection];
    if (!f) return introCol();
    let html = `<div class="res-head"><h2 class="res-section-title">${esc(f.name)}</h2>${f.description ? `<p class="res-sub">${esc(f.description)}</p>` : ''}</div>`;
    html += linkList(f.items, curSection, null);
    if (isAdmin) html += `<button class="lnk-adm-add-row" onclick="openRowModal(${curSection},null,null)">+ Add link</button>`;

    // sub-sections break the links with a header of their own
    f.subfolders.forEach((sf, si) => {
        html += `<div class="res-subgroup">
            <div class="res-subhead-row"><h3 class="res-subhead">${esc(sf.name)}</h3>${isAdmin ? `<span class="res-adm res-adm-show">
              <button class="lnk-adm-btn lnk-edit" onclick="openSubfolderModal(${curSection},${si})" title="Rename / describe">✎</button>
              <button class="lnk-adm-btn lnk-del"  onclick="deleteSubfolder(${curSection},${si})" title="Delete sub-section">✕</button></span>` : ''}</div>
            ${sf.description ? `<p class="res-sub">${esc(sf.description)}</p>` : ''}
            ${linkList(sf.items, curSection, si)}
            ${isAdmin ? `<button class="lnk-adm-add-row" onclick="openRowModal(${curSection},${si},null)">+ Add link</button>` : ''}
          </div>`;
    });
    if (isAdmin) html += `<div style="margin-top:18px;"><button class="lnk-adm-add-row" onclick="openSubfolderModal(${curSection},null)">+ Add sub-section</button></div>`;
    return `<div class="res-col res-col-links">${html}</div>`;
}

function rerender() {
    if (curSection >= foldersData.length) curSection = foldersData.length - 1;
    const tree = document.getElementById('res-tree');
    tree.classList.toggle('res-tree-topics', useTopics());
    tree.innerHTML = (useTopics() ? topicsCol() : categoriesCol()) + sectionsCol() + linksCol();
    // on a phone the two lists are scrolling chip rows — bring the current chip into view
    document.querySelectorAll('.res-list').forEach(list => {
        const a = list.querySelector('.res-link.active');
        if (a && list.scrollWidth > list.clientWidth) {
            list.scrollLeft = a.getBoundingClientRect().left - list.getBoundingClientRect().left + list.scrollLeft
                              - (list.clientWidth - a.offsetWidth) / 2;
        }
    });
}

function setHash() {
    const t = topicsData[curTopic], f = foldersData[curSection];
    const h = useTopics() ? (t ? slug(t.name) + (f ? '/' + slug(f.name) : '') : '') : (f ? slug(f.name) : '');
    history.replaceState(null, '', location.pathname + location.search + (h ? '#' + h : ''));
}

function selectTopic(i) {
    curTopic = i === curTopic ? -1 : i;         // clicking the open topic closes it → back to the intro
    curSection = -1;
    setHash();
    rerender();
}

function selectSection(i) {
    curSection = i === curSection ? -1 : i;     // clicking the open section closes it → back to the topic
    setHash();
    rerender();
}

// picking a topic or section is client-side; category links are ordinary page links
document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('a.res-link[data-i], a.res-link[data-t]');
    if (!a) return;
    e.preventDefault();
    if (a.dataset.t !== undefined) selectTopic(parseInt(a.dataset.t, 10));
    else selectSection(parseInt(a.dataset.i, 10));
});

// #topic/section on topic pages, #section elsewhere; no match → nothing selected
function selectionFromHash() {
    const parts = location.hash.slice(1).split('/');
    if (useTopics()) {
        curTopic = topicsData.findIndex(t => slug(t.name) === parts[0]);
        const t = topicsData[curTopic];
        curSection = t && parts[1] ? foldersData.findIndex(f => f.topic === t.name && slug(f.name) === parts[1]) : -1;
    } else {
        curTopic = -1;
        curSection = foldersData.findIndex(f => slug(f.name) === parts[0]);
    }
}
window.addEventListener('hashchange', () => { selectionFromHash(); rerender(); });

// ── Admin actions ─────────────────────────────────────────────────
function deleteRow(fi, si, ii) {
    if (!confirm('Remove this link?')) return;
    (si === null ? foldersData[fi].items : foldersData[fi].subfolders[si].items).splice(ii, 1);
    saveMd().then(rerender);
}

function addTopic() {
    const name = (prompt('Name of the new topic:') || '').trim();
    if (!name) return;
    if (topicsData.some(t => t.name === name)) { alert('There is already a topic with that name.'); return; }
    topicsData.push({ name, description: '' });
    curTopic = topicsData.length - 1; curSection = -1;
    saveMd().then(() => { setHash(); rerender(); });
}

function renameTopic(i) {
    const t = topicsData[i];
    const name = (prompt('Rename topic:', t.name) || '').trim();
    if (!name || name === t.name) return;
    if (topicsData.some(x => x.name === name)) { alert('There is already a topic with that name.'); return; }
    foldersData.forEach(f => { if (f.topic === t.name) f.topic = name; });
    t.name = name;
    saveMd().then(() => { setHash(); rerender(); });
}

function deleteTopic(i) {
    const t = topicsData[i];
    const n = foldersData.filter(f => f.topic === t.name).length;
    if (!confirm(`Delete topic "${t.name}"${n ? ` and its ${n} section${n === 1 ? '' : 's'} with all their links` : ''}?`)) return;
    foldersData = foldersData.filter(f => f.topic !== t.name);
    topicsData.splice(i, 1);
    curTopic = -1; curSection = -1;
    saveMd().then(() => { setHash(); rerender(); });
}

function deleteFolder(fi) {
    if (!confirm(`Delete section "${foldersData[fi].name}" and all its links?`)) return;
    foldersData.splice(fi, 1);
    curSection = -1;
    saveMd().then(rerender);
}

function deleteSubfolder(fi, si) {
    if (!confirm(`Delete sub-section "${foldersData[fi].subfolders[si].name}" and its links?`)) return;
    foldersData[fi].subfolders.splice(si, 1);
    saveMd().then(rerender);
}

async function deleteCategory(i) {
    const c = categories[i];
    if (!confirm(`Remove the category "${c.title}" from the list?\n\nIts page and links stay on the server; only the entry in the category list is removed.`)) return;
    if (c.si >= 0) hubData[c.si].items.splice(c.ii, 1);
    await saveHub();
    if (isCurrent(c)) { location.href = HUB_PAGE; return; }
    categories = buildCategories(); rerender();
}

// ── Modals ────────────────────────────────────────────────────────
let _row = { fi: null, si: null, ii: null };
let _fm = { fi: null, si: null, sub: false };
let _cat = null;

function openRowModal(fi, si, ii) {
    _row = { fi, si, ii };
    const items = si === null ? foldersData[fi].items : foldersData[fi].subfolders[si].items;
    const item = ii !== null ? items[ii] : null;
    document.getElementById('lnk-modal-title').textContent = ii !== null ? 'Edit Link' : 'Add Link';
    document.getElementById('lnk-row-name').value = item ? item.name : '';
    document.getElementById('lnk-row-desc').value = item ? item.description : '';
    document.getElementById('lnk-row-url').value = item ? item.link : '';
    showModal('lnk-row-modal');
    setTimeout(() => document.getElementById('lnk-row-name').focus(), 50);
}

function saveRow() {
    const name = document.getElementById('lnk-row-name').value.trim();
    const desc = document.getElementById('lnk-row-desc').value.trim();
    const url = document.getElementById('lnk-row-url').value.trim();
    if (!name) { alert('Name is required.'); return; }
    const { fi, si, ii } = _row;
    const items = si === null ? foldersData[fi].items : foldersData[fi].subfolders[si].items;
    const entry = { name, description: desc, link: url };
    if (ii !== null) items[ii] = entry; else items.push(entry);
    saveMd().then(() => { closeModals(); rerender(); });
}

// One modal for sections and sub-sections: fi === null → new section; sub → a sub-section (si null → new)
function openFolderModal(fi) {
    _fm = { fi, si: null, sub: false };
    showFolderModal(fi !== null ? 'Edit Section' : 'Add Section', fi !== null ? foldersData[fi] : null);
}
function openSubfolderModal(fi, si) {
    _fm = { fi, si, sub: true };
    showFolderModal(si !== null ? 'Edit Sub-section' : 'Add Sub-section', si !== null ? foldersData[fi].subfolders[si] : null);
}
function showFolderModal(title, f) {
    document.getElementById('lnk-folder-modal-title').textContent = title;
    document.getElementById('lnk-folder-name').value = f ? f.name : '';
    document.getElementById('lnk-folder-desc').value = f ? (f.description || '') : '';
    showModal('lnk-folder-modal');
    setTimeout(() => document.getElementById('lnk-folder-name').focus(), 50);
}

function saveFolder() {
    const name = document.getElementById('lnk-folder-name').value.trim();
    const description = document.getElementById('lnk-folder-desc').value.trim();
    if (!name) { alert('Name is required.'); return; }
    const { fi, si, sub } = _fm;
    if (sub) {
        if (si !== null) Object.assign(foldersData[fi].subfolders[si], { name, description });
        else foldersData[fi].subfolders.push({ name, description, items: [] });
    } else if (fi !== null) {
        Object.assign(foldersData[fi], { name, description });
    } else {
        const t = useTopics() ? topicsData[curTopic] : null;
        if (useTopics() && !t) { alert('Pick a topic on the left first.'); return; }
        foldersData.push({ name, description, topic: t ? t.name : '', subfolders: [], items: [] });
        curSection = foldersData.length - 1;
    }
    saveMd().then(() => { closeModals(); rerender(); });
}

// The category's picture + description (shown while nothing is selected)
function openIntroModal() {
    document.getElementById('lnk-intro-desc').value = intro.description || '';
    document.getElementById('lnk-intro-image').value = intro.image || '';
    document.getElementById('lnk-intro-status').textContent = '';
    showModal('lnk-intro-modal');
}
async function uploadIntroImage(input) {
    const file = input.files[0]; input.value = '';
    if (!file) return;
    const status = document.getElementById('lnk-intro-status');
    status.textContent = 'Uploading…';
    const fd = new FormData(); fd.append('image', file); fd.append('type', 'resources');
    try {
        const up = await fetch(ROOT + 'admin/upload-image.php', { method: 'POST', body: fd }).then(r => r.json());
        if (!up.success) { status.textContent = 'Upload failed: ' + (up.error || 'unknown error'); return; }
        document.getElementById('lnk-intro-image').value = up.display || up.path;
        status.textContent = 'Uploaded — press Save.';
    } catch (e) { status.textContent = 'Upload failed (network).'; }
}
function saveIntro() {
    intro.description = document.getElementById('lnk-intro-desc').value.trim();
    intro.image = document.getElementById('lnk-intro-image').value.trim();
    saveMd().then(() => { closeModals(); rerender(); });
}

// A category = one card in the hub list. New ones open at category.html?c=<name>, so no page needs creating.
function openCategoryModal(i) {
    _cat = i;
    const c = i !== null ? categories[i] : null;
    document.getElementById('lnk-cat-modal-title').textContent = c ? 'Edit Category' : 'Add Category';
    document.getElementById('lnk-cat-title').value = c ? c.title : '';
    document.getElementById('lnk-cat-desc').value = c ? c.desc : '';
    document.getElementById('lnk-cat-slug').value = c ? catSlug(c.href) : '';
    document.getElementById('lnk-cat-slug').disabled = !!c;
    showModal('lnk-cat-modal');
    setTimeout(() => document.getElementById('lnk-cat-title').focus(), 50);
}
async function saveCategory() {
    const title = document.getElementById('lnk-cat-title').value.trim();
    const desc = document.getElementById('lnk-cat-desc').value.trim();
    let name = document.getElementById('lnk-cat-slug').value.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (!title) { alert('Title is required.'); return; }
    if (_cat !== null) {
        const c = categories[_cat];
        const hit = hubData.flatMap(s => s.items || []).find(it => catSlug(new URL(it.href, new URL('../resources.html', location.href)).href) === catSlug(c.href));
        if (hit) Object.assign(hit, { title, desc });
    } else {
        name = name || slug(title);
        if (categories.some(c => catSlug(c.href) === name)) { alert('A category with that page name already exists.'); return; }
        let sec = hubData.find(s => s.type === 'cards' && HubData.isGuides(s) === GUIDE);
        if (!sec) { sec = { id: GUIDE ? 'guides' : uid(), title: HUB_TITLE, type: 'cards', intro: '', items: [] }; hubData.push(sec); }
        sec.items.push({ id: uid(), title, href: FOLDER + '/category.html?c=' + name, desc });
    }
    await saveHub();
    closeModals();
    categories = buildCategories();
    rerender();
}

function showModal(id) {
    ['lnk-row-modal', 'lnk-folder-modal', 'lnk-intro-modal', 'lnk-cat-modal'].forEach(m => { document.getElementById(m).style.display = 'none'; });
    document.getElementById(id).style.display = 'flex';
}
function closeModals() {
    ['lnk-row-modal', 'lnk-folder-modal', 'lnk-intro-modal', 'lnk-cat-modal'].forEach(m => { document.getElementById(m).style.display = 'none'; });
}

// ── Inject admin UI into DOM (only when logged in) ────────────────
function injectAdminUI() {
    const style = document.createElement('style');
    style.textContent = `
        .lnk-adm-btn {
            background: none; border: 1px solid #ddd; cursor: pointer;
            font-size: 11px; padding: 2px 6px; border-radius: 2px;
            font-family: 'Optima', arial, sans-serif; color: #999;
            min-height: unset !important; min-width: unset !important;
        }
        .lnk-edit { color: #1d60c0; border-color: rgba(0,80,200,0.25); }
        .lnk-edit:hover { background: rgba(0,80,200,0.08); }
        .lnk-del  { color: #c00; border-color: rgba(200,0,0,0.2); }
        .lnk-del:hover  { background: rgba(200,0,0,0.08); }
        .lnk-adm-add-row {
            margin: 8px 0 4px; font-size: 12px; color: #1d60c0;
            background: rgba(0,80,200,0.06); border: 1px solid rgba(0,80,200,0.2);
            padding: 4px 10px; cursor: pointer; border-radius: 2px;
            font-family: 'Optima', arial, sans-serif;
            min-height: unset !important; min-width: unset !important;
        }
        .lnk-adm-add-row:hover { background: rgba(0,80,200,0.14); }
        .lnk-modal-overlay {
            display: none; position: fixed; inset: 0;
            background: rgba(0,0,0,0.4); z-index: 800;
            align-items: center; justify-content: center;
        }
        .lnk-modal-box {
            background: #fff; padding: 26px 30px 28px; width: 400px;
            max-width: 94vw; border: 1px solid #ddd;
        }
        .lnk-modal-box h3 { font-weight: 300; font-size: 18px; margin: 0 0 16px; color: #444; }
        .lnk-modal-box label { display: block; font-size: 12px; color: #999; margin: 10px 0 3px; }
        .lnk-modal-box input, .lnk-modal-box textarea {
            width: 100%; box-sizing: border-box; border: 1px solid #ddd;
            padding: 7px 9px; font-family: 'Optima', arial, sans-serif;
            font-size: 14px; color: #444; background: #fafafa; outline: none;
            min-height: unset !important;
        }
        .lnk-modal-box textarea { resize: vertical; min-height: 70px !important; }
        .lnk-modal-actions { display: flex; gap: 10px; margin-top: 16px; }
        .lnk-save {
            background: rgba(210,245,250,0.5); border: 1px solid rgba(143,97,77,0.35);
            color: #1d60c0; font-family: 'Optima', arial, sans-serif;
            font-size: 14px; padding: 7px 18px; cursor: pointer;
            min-height: unset !important;
        }
        .lnk-save:hover { background: #c2e2e787; }
        .lnk-cancel {
            background: none; border: 1px solid #ddd; color: #999;
            font-family: 'Optima', arial, sans-serif;
            font-size: 14px; padding: 7px 14px; cursor: pointer;
            min-height: unset !important;
        }
        .lnk-cancel:hover { border-color: #aaa; color: #555; }
        .lnk-modal-hint { font-size: 12px; color: #aaa; margin: 4px 0 0; }
    `;
    document.head.appendChild(style);

    const make = (id, html) => {
        const el = document.createElement('div');
        el.id = id; el.className = 'lnk-modal-overlay';
        el.innerHTML = `<div class="lnk-modal-box">${html}</div>`;
        el.addEventListener('click', e => { if (e.target === el) closeModals(); });
        document.body.appendChild(el);
    };
    const actions = save => `<div class="lnk-modal-actions"><button class="lnk-save" onclick="${save}">Save</button><button class="lnk-cancel" onclick="closeModals()">Cancel</button></div>`;

    make('lnk-row-modal', `<h3 id="lnk-modal-title">Add Link</h3>
        <label>Name *</label><input id="lnk-row-name" placeholder="e.g. GitHub">
        <label>Notes (kept in the file, not shown on the page)</label><input id="lnk-row-desc" placeholder="Short description">
        <label>URL (https://… or a path on this site, like /learning/alg/alg.html)</label><input id="lnk-row-url" placeholder="https://...">
        ${actions('saveRow()')}`);
    make('lnk-folder-modal', `<h3 id="lnk-folder-modal-title">Add Section</h3>
        <label>Name *</label><input id="lnk-folder-name" placeholder="e.g. Search Engines">
        <label>Description (one line, shown under the title)</label><input id="lnk-folder-desc" placeholder="e.g. Ways to find things">
        ${actions('saveFolder()')}`);
    make('lnk-intro-modal', `<h3>Category picture &amp; description</h3>
        <label>Description (shown while nothing is selected)</label><textarea id="lnk-intro-desc" placeholder="What this category is about"></textarea>
        <label>Picture (address, or upload one)</label><input id="lnk-intro-image" placeholder="/images/resources/…">
        <div style="margin-top:8px;"><input type="file" accept="image/*" onchange="uploadIntroImage(this)" style="border:none;background:none;padding:0;"></div>
        <p class="lnk-modal-hint" id="lnk-intro-status"></p>
        ${actions('saveIntro()')}`);
    make('lnk-cat-modal', `<h3 id="lnk-cat-modal-title">Add Category</h3>
        <label>Title *</label><input id="lnk-cat-title" placeholder="e.g. Design">
        <label>Description</label><input id="lnk-cat-desc" placeholder="One line shown under the title">
        <label>Page name (letters, numbers, dashes — fixed once created)</label><input id="lnk-cat-slug" placeholder="design">
        <p class="lnk-modal-hint">New categories open at category.html?c=&lt;page name&gt;. Add sections from that page.</p>
        ${actions('saveCategory()')}`);
}

// ── Load ─────────────────────────────────────────────────────────
async function fetchMarkdown() {
    const names = MD_NAMES[PAGE] || [PAGE];
    // markdown/ is what the admin edits; seed/ ships with the site and is used until the first edit
    for (const dir of ['markdown', 'seed']) {
        for (const n of names) {
            try {
                const r = await fetch(`./${dir}/${n}.md`);
                if (r.ok) {
                    const text = await r.text();
                    if (!/^\s*<(!doctype|html)/i.test(text)) { mdFile = names[0]; if (dir === 'markdown') mdFile = n; return text; }
                }
            } catch (e) { /* try the next one */ }
        }
    }
    return null;
}

async function loadResources() {
    const markdown = await fetchMarkdown();
    // no file yet = a new, empty category (the first section you add creates it)
    if (markdown !== null) ({ intro, folders: foldersData, topics: topicsData } = parseMarkdown(markdown));

    try {
        const s = await fetch(ROOT + 'admin/check-session.php').then(r => r.json());
        if (s.admin) { isAdmin = true; document.body.classList.add('admin-mode'); injectAdminUI(); }
    } catch (e) { /* not logged in */ }

    hubData = await loadHub();
    categories = buildCategories();

    // the page title follows the category list, so renaming a category renames its page too
    const found = categories.find(isCurrent);
    if (found && found.si !== -1) {
        const h = document.querySelector('.page-title');
        if (h) h.textContent = found.title;
        document.title = SITE_SECTION + ' - ' + found.title;
    }

    selectionFromHash();
    rerender();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(loadResources, 100));
} else {
    setTimeout(loadResources, 100);
}
