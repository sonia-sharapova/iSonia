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
//   ## Section                 (next line, optional:  > one-line description)
//   ### Sub-section            (next line, optional:  > description) — a header that breaks up the links
//   - **Link name**: notes     (the notes stay in the file, they aren't shown on the page)
//     - https://example.com    (or a path on this site, like /learning/alg/alg.html)
//
// Signed in as admin you can edit every layer: categories, the intro, sections, sub-sections and links.
// Categories can also be added without creating a page: category.html?c=<name> shows any category.

// navigation/learning.html reuses this tree for the Learning section (Guides & Tutorials, which used to be a
// Resources category): same sections → links layout, but no category column, no hub, and it lives one folder up.
const LEARNING = /\/learning\.html$/.test(window.location.pathname);
const ROOT = LEARNING ? '../' : '../../';                 // the site root, relative to this page
const MD_BASE = LEARNING ? './resources/' : './';          // where markdown/ and seed/ are
const PARAMS = new URLSearchParams(window.location.search);
const PAGE = LEARNING ? 'tutorials' : (PARAMS.get('c') || window.location.pathname.split('/').pop().replace('.html', '')).toLowerCase().replace(/[^a-z0-9-]/g, '');
// technology.html has always read tech.md, the README says technology.md — accept either
const MD_NAMES = { technology: ['technology', 'tech'] };
const HUB_DATA_URL = ROOT + 'data/resources.json';
const HUB_SAVE_URL = ROOT + 'admin/save-resources.php';
const LEARNING_INFO = { title: 'Learning', desc: "Guides, tutorials and step-by-step write-ups I've put together." };
// Guides & Tutorials used to be a Resources category; it now lives in Learning, so the hub must never list it
const isTutorialsCard = it => /(^|\/)tutorials\.html/.test(it.href || '');

// used until data/resources.json exists (the first category you add or edit creates it)
const DEFAULT_HUB = [{
    id: 'cat', title: 'Categories', type: 'cards', intro: '', items: [
        ['technology', 'Technology', 'Programming, computers and how they work.'],
        ['web', 'Web', 'How the web works, how to build for it, and the corners worth exploring.'],
        ['design', 'Design', 'Inspiration, tools and assets for design work.'],
        ['careers', 'Careers & Opportunities', 'Jobs, studios, festivals and open calls.'],
        ['software', 'Software & Tools', 'Free software, alternatives and handy online tools.'],
        ['media', 'Media', 'Film, video, anime, games and things to read.'],
        ['music', 'Music & Audio', 'Free sound, radio, discovery and learning.'],
        ['archives', 'Archives & Collections', "Libraries, museums and the internet's memory."],
        ['culture', 'Internet Culture', 'Forums, nostalgia and the strange.'],
        ['ideas', 'Ideas & People', 'The thinkers, arguments and theories behind it all.'],
        ['life', 'Learning & Life', 'Everyday guides, free courses and life admin.']
    ].map(([slug, title, desc]) => ({ id: slug, title, href: 'resources/' + slug + '.html', desc }))
}];

let mdFile = PAGE;          // the markdown file that loaded (saves always go to markdown/<name>.md)
let intro = { image: '', alt: '', description: '' };
let foldersData = [];       // [{ name, description, items, subfolders: [{ name, description, items }] }]
let hubData = [];           // the hub's raw sections (data/resources.json)
let categories = [];        // [{ title, desc, href, si, ii }]  — si/ii point back into hubData
let curSection = -1;        // -1 = nothing selected
let isAdmin = false;

// ── Parse markdown ───────────────────────────────────────────────
function parseMarkdown(markdown) {
    const folders = [];
    const info = { image: '', alt: '', description: '' };
    let folder = null, sub = null, last = null;

    markdown.split('\n').forEach(raw => {
        const line = raw.replace(/\r$/, '');
        const t = line.trim();
        if (line.startsWith('## ')) {
            folder = { name: line.slice(3).trim(), description: '', subfolders: [], items: [] };
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
            const target = sub || folder || info;
            target.description = target.description ? target.description + ' ' + d : d;
        } else if (!folder) {
            const im = t.match(/^!\[([^\]]*)\]\(([^)]+)\)/);
            if (im) { info.alt = im[1]; info.image = im[2]; }
        }
    });
    return { intro: info, folders };
}

// ── Serialize back to markdown ───────────────────────────────────
function serializeToMarkdown(folders, info) {
    const itemMd = it => `- **${it.name}**: ${it.description}\n` + (it.link ? `  - ${it.link}\n` : '');
    let md = '';
    if (info && (info.image || info.description)) {
        if (info.image) md += `![${info.alt || ''}](${info.image})\n`;
        if (info.description) md += `> ${info.description}\n`;
        md += '\n';
    }
    folders.forEach(f => {
        md += `## ${f.name}\n` + (f.description ? `> ${f.description}\n` : '') + '\n';
        f.items.forEach(it => { md += itemMd(it); });
        f.subfolders.forEach(sf => {
            md += `\n### ${sf.name}\n` + (sf.description ? `> ${sf.description}\n` : '') + '\n';
            sf.items.forEach(it => { md += itemMd(it); });
        });
        md += '\n';
    });
    return md;
}

// ── Save ─────────────────────────────────────────────────────────
async function saveMd() {
    try {
        const res = await fetch(ROOT + 'admin/save-resource-md.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ file: mdFile, content: serializeToMarkdown(foldersData, intro) })
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
    return h ? h.textContent.trim() : 'Resources';
}
function currentCategory() {
    if (LEARNING) return { title: LEARNING_INFO.title, desc: LEARNING_INFO.desc, href: location.href };
    return categories.find(isCurrent) || { title: pageTitle(), desc: '', href: location.href };
}

// ── Categories: the hub's cards, in the hub's order ──
async function loadHub() {
    let data = [];
    try {
        const r = await fetch(HUB_DATA_URL + '?t=' + Date.now());
        data = r.ok ? await r.json() : [];
    } catch (e) { /* not there yet */ }
    if (!Array.isArray(data) || !data.some(s => s.type === 'cards' && (s.items || []).length)) {
        data = JSON.parse(JSON.stringify(DEFAULT_HUB));
    }
    data.forEach(s => { if (s.type === 'cards') s.items = (s.items || []).filter(it => !isTutorialsCard(it)); });
    data.forEach(s => (s.items || []).forEach(it => { if (!it.id) it.id = uid(); }));
    return data;
}

function buildCategories() {
    const list = [];
    hubData.forEach((s, si) => {
        if (s.type !== 'cards') return;
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
          <a class="sidebar-link res-back" href="../resources.html">&lt; All Topics</a>
        </div>
        <div class="sidebar-section">
          <h3 class="res-head">Categories</h3>
          <nav class="res-list">${rows}</nav>
          ${isAdmin ? '<button class="lnk-adm-add-row" onclick="openCategoryModal(null)">+ Add category</button>' : ''}
        </div>
      </div>`;
}

function sectionsCol() {
    const cat = currentCategory();
    const rows = foldersData.map((f, i) => `<div class="res-row">
        <a class="res-link${i === curSection ? ' active' : ''}" href="#${slug(f.name)}" data-i="${i}">${esc(f.name)}</a>
        ${isAdmin ? `<span class="res-adm">
          <button class="lnk-adm-btn lnk-edit" onclick="openFolderModal(${i})" title="Rename / describe">✎</button>
          <button class="lnk-adm-btn lnk-del"  onclick="deleteFolder(${i})" title="Delete section">✕</button>
        </span>` : ''}
      </div>`).join('');
    return `<div class="res-col res-col-sections">
        <div class="res-head"><h2 class="res-title">${esc(cat.title)}</h2>${cat.desc ? `<p class="res-sub">${esc(cat.desc)}</p>` : ''}</div>
        <nav class="res-list">${rows}</nav>
        ${isAdmin ? '<button class="lnk-adm-add-row" onclick="openFolderModal(null)">+ Add section</button>' : ''}
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
    const hint = foldersData.length
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
    tree.classList.toggle('res-tree-2col', LEARNING);
    tree.innerHTML = (LEARNING ? '' : categoriesCol()) + sectionsCol() + linksCol();
    // on a phone the two lists are scrolling chip rows — bring the current chip into view
    document.querySelectorAll('.res-list').forEach(list => {
        const a = list.querySelector('.res-link.active');
        if (a && list.scrollWidth > list.clientWidth) {
            list.scrollLeft = a.getBoundingClientRect().left - list.getBoundingClientRect().left + list.scrollLeft
                              - (list.clientWidth - a.offsetWidth) / 2;
        }
    });
}

function selectSection(i) {
    if (i === curSection) {           // clicking the open section closes it → back to the intro
        curSection = -1;
        history.replaceState(null, '', location.pathname + location.search);
    } else {
        curSection = i;
        history.replaceState(null, '', location.pathname + location.search + '#' + slug(foldersData[i].name));
    }
    rerender();
}

// picking a section is client-side; category links are ordinary page links
document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('a.res-link[data-i]');
    if (!a) return;
    e.preventDefault();
    selectSection(parseInt(a.dataset.i, 10));
});

function sectionFromHash() {
    const h = location.hash.slice(1);
    return foldersData.findIndex(f => slug(f.name) === h);      // -1 when there is no match → nothing selected
}
window.addEventListener('hashchange', () => { curSection = sectionFromHash(); rerender(); });

// ── Admin actions ─────────────────────────────────────────────────
function deleteRow(fi, si, ii) {
    if (!confirm('Remove this link?')) return;
    (si === null ? foldersData[fi].items : foldersData[fi].subfolders[si].items).splice(ii, 1);
    saveMd().then(rerender);
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
    if (isCurrent(c)) { location.href = '../resources.html'; return; }
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
        foldersData.push({ name, description, subfolders: [], items: [] });
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
        let sec = hubData.find(s => s.type === 'cards');
        if (!sec) { sec = { id: uid(), title: 'Categories', type: 'cards', intro: '', items: [] }; hubData.push(sec); }
        sec.items.push({ id: uid(), title, href: 'resources/category.html?c=' + name, desc });
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
                const r = await fetch(`${MD_BASE}${dir}/${n}.md`);
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
    if (markdown !== null) ({ intro, folders: foldersData } = parseMarkdown(markdown));

    try {
        const s = await fetch(ROOT + 'admin/check-session.php').then(r => r.json());
        if (s.admin) { isAdmin = true; document.body.classList.add('admin-mode'); injectAdminUI(); }
    } catch (e) { /* not logged in */ }

    if (!LEARNING) {
        hubData = await loadHub();
        categories = buildCategories();
    }

    // the page title follows the category list, so renaming a category renames its page too
    const found = LEARNING ? null : categories.find(isCurrent);
    if (found && found.si !== -1) {
        const h = document.querySelector('.page-title');
        if (h) h.textContent = found.title;
        document.title = 'Resources - ' + found.title;
    }

    curSection = sectionFromHash();
    rerender();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(loadResources, 100));
} else {
    setTimeout(loadResources, 100);
}
