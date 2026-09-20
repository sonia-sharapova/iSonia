// Resource category pages — a three-column tree, like the Photos / Blog sidebars:
//
//   Categories (from the hub, resources.html)  →  this category's sections  →  the section's links
//
// Content comes from markdown/<page>.md:
//   ## Section                 (next line, optional:  > one-line description)
//   ### Sub-section            (next line, optional:  > description) — shown as a header that breaks up the links
//   - **Link name**: notes     (the notes stay in the file for you, but aren't shown on the page)
//     - https://example.com
const PAGE = window.location.pathname.split('/').pop().replace('.html', '');
// technology.html has always read tech.md, the README says technology.md — accept either
const MD_NAMES = { technology: ['technology', 'tech'] };
const HUB_DATA_URL = '../../data/resources.json';
const FALLBACK_CATEGORIES = ['general', 'media', 'music', 'opensource', 'technology', 'web'];

let mdFile = PAGE;          // the markdown file that actually loaded (where saves go)
let foldersData = [];       // [{ name, description, items, subfolders: [{ name, description, items }] }]
let categories = [];        // [{ title, desc, href }]
let curSection = 0;
let isAdmin = false;
let loadError = '';

// ── Parse markdown ───────────────────────────────────────────────
function parseMarkdownToFolders(markdown) {
    const folders = [];
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
        } else if (/^- https?:/i.test(t)) {
            if (last) last.link = t.slice(2).trim();
        } else if (t.startsWith('>') && folder) {
            const target = sub || folder;
            const d = t.replace(/^>\s?/, '');
            target.description = target.description ? target.description + ' ' + d : d;
        }
    });
    return folders;
}

// ── Serialize back to markdown ───────────────────────────────────
function serializeToMarkdown(folders) {
    const itemMd = it => `- **${it.name}**: ${it.description}\n` + (it.link ? `  - ${it.link}\n` : '');
    let md = '';
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
        const res = await fetch('../../admin/save-resource-md.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ file: mdFile, content: serializeToMarkdown(foldersData) })
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
function pageOf(href) {
    return new URL(href, location.href).pathname.split('/').pop().replace('.html', '');
}
function isCurrent(cat) { return pageOf(cat.href) === PAGE; }
function pageTitle() {
    const h = document.querySelector('.page-title');
    return h ? h.textContent.trim() : 'Resources';
}
function currentCategory() {
    return categories.find(isCurrent) || { title: pageTitle(), desc: '', href: location.href };
}

// ── Categories: the hub's cards, in the hub's order ───────────────
async function loadCategories() {
    // "Guides" sits at the top of the hub as a fixed section (it isn't in resources.json)
    const list = [{ title: 'Guides & Tutorials', desc: "Step-by-step write-ups and how-tos I've put together.", href: '../../creations/tutorials.html' }];
    let fromHub = 0;
    try {
        const r = await fetch(HUB_DATA_URL + '?t=' + Date.now());
        const data = r.ok ? await r.json() : [];
        (Array.isArray(data) ? data : []).filter(s => s.type === 'cards').forEach(s => {
            (s.items || []).forEach(it => {
                list.push({ title: it.title, desc: it.desc || '', href: new URL(it.href, new URL('../resources.html', location.href)).href });
                fromHub++;
            });
        });
    } catch (e) { /* hub data unavailable — fall through to the fallback */ }

    // Hub unreachable, or it doesn't list this page: keep the tree usable anyway
    if (!fromHub) {
        FALLBACK_CATEGORIES.forEach(n => list.push({
            title: n === 'opensource' ? 'Open Source' : n.charAt(0).toUpperCase() + n.slice(1),
            desc: '', href: n + '.html'
        }));
    }
    if (!list.some(isCurrent)) list.push({ title: pageTitle(), desc: '', href: location.href });
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
            ? `<a href="${esc(it.link)}" target="_blank" rel="noopener"${tip}>${esc(it.name)}</a>`
            : `<span${tip}>${esc(it.name)}</span>`;
        return `<li>${name}${admRowBtns(fi, si, ii)}</li>`;
    }).join('') + '</ul>';
}

function categoriesCol() {
    return `<div class="res-col res-col-cats">
        <div class="res-head"><h2 class="res-title">Categories</h2><p class="res-sub">Browse the archive.</p></div>
        <nav class="res-list">${categories.map(c =>
            `<a class="res-link${isCurrent(c) ? ' active' : ''}" href="${esc(c.href)}">${esc(c.title)}</a>`).join('')}</nav>
        <a class="res-back" href="../resources.html">← All resources</a>
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

function linksCol() {
    const f = foldersData[curSection];
    if (!f) {
        return `<div class="res-col res-col-links"><p class="res-empty">${esc(loadError || 'Nothing here yet.')}</p></div>`;
    }
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
    if (curSection >= foldersData.length) curSection = Math.max(0, foldersData.length - 1);
    document.getElementById('res-tree').innerHTML = categoriesCol() + sectionsCol() + linksCol();
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
    curSection = i;
    history.replaceState(null, '', '#' + slug(foldersData[i].name));
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
    const i = foldersData.findIndex(f => slug(f.name) === h);
    return i >= 0 ? i : 0;
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
    saveMd().then(rerender);
}

function deleteSubfolder(fi, si) {
    if (!confirm(`Delete sub-section "${foldersData[fi].subfolders[si].name}" and its links?`)) return;
    foldersData[fi].subfolders.splice(si, 1);
    saveMd().then(rerender);
}

// ── Modals ────────────────────────────────────────────────────────
let _row = { fi: null, si: null, ii: null };
let _fm = { fi: null, si: null, sub: false };

function openRowModal(fi, si, ii) {
    _row = { fi, si, ii };
    const items = si === null ? foldersData[fi].items : foldersData[fi].subfolders[si].items;
    const item = ii !== null ? items[ii] : null;
    document.getElementById('lnk-modal-title').textContent = ii !== null ? 'Edit Link' : 'Add Link';
    document.getElementById('lnk-row-name').value = item ? item.name : '';
    document.getElementById('lnk-row-desc').value = item ? item.description : '';
    document.getElementById('lnk-row-url').value = item ? item.link : '';
    document.getElementById('lnk-folder-modal').style.display = 'none';
    document.getElementById('lnk-row-modal').style.display = 'flex';
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
    const f = fi !== null ? foldersData[fi] : null;
    showFolderModal(fi !== null ? 'Edit Section' : 'Add Section', f);
}
function openSubfolderModal(fi, si) {
    _fm = { fi, si, sub: true };
    const sf = si !== null ? foldersData[fi].subfolders[si] : null;
    showFolderModal(si !== null ? 'Edit Sub-section' : 'Add Sub-section', sf);
}
function showFolderModal(title, f) {
    document.getElementById('lnk-folder-modal-title').textContent = title;
    document.getElementById('lnk-folder-name').value = f ? f.name : '';
    document.getElementById('lnk-folder-desc').value = f ? (f.description || '') : '';
    document.getElementById('lnk-row-modal').style.display = 'none';
    document.getElementById('lnk-folder-modal').style.display = 'flex';
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

function closeModals() {
    document.getElementById('lnk-row-modal').style.display = 'none';
    document.getElementById('lnk-folder-modal').style.display = 'none';
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
        .lnk-modal-overlay[style*="flex"] { display: flex; }
        .lnk-modal-box {
            background: #fff; padding: 26px 30px 28px; width: 400px;
            max-width: 94vw; border: 1px solid #ddd;
        }
        .lnk-modal-box h3 { font-weight: 300; font-size: 18px; margin: 0 0 16px; color: #444; }
        .lnk-modal-box label { display: block; font-size: 12px; color: #999; margin: 10px 0 3px; }
        .lnk-modal-box input {
            width: 100%; box-sizing: border-box; border: 1px solid #ddd;
            padding: 7px 9px; font-family: 'Optima', arial, sans-serif;
            font-size: 14px; color: #444; background: #fafafa; outline: none;
            min-height: unset !important;
        }
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
    `;
    document.head.appendChild(style);

    const rowModal = document.createElement('div');
    rowModal.id = 'lnk-row-modal';
    rowModal.className = 'lnk-modal-overlay';
    rowModal.innerHTML = `
        <div class="lnk-modal-box">
          <h3 id="lnk-modal-title">Add Link</h3>
          <label>Name *</label><input id="lnk-row-name" placeholder="e.g. GitHub">
          <label>Notes (kept in the file, not shown on the page)</label><input id="lnk-row-desc" placeholder="Short description">
          <label>URL</label><input id="lnk-row-url" placeholder="https://...">
          <div class="lnk-modal-actions">
            <button class="lnk-save" onclick="saveRow()">Save</button>
            <button class="lnk-cancel" onclick="closeModals()">Cancel</button>
          </div>
        </div>`;
    rowModal.addEventListener('click', e => { if (e.target === rowModal) closeModals(); });
    document.body.appendChild(rowModal);

    const folderModal = document.createElement('div');
    folderModal.id = 'lnk-folder-modal';
    folderModal.className = 'lnk-modal-overlay';
    folderModal.innerHTML = `
        <div class="lnk-modal-box">
          <h3 id="lnk-folder-modal-title">Add Section</h3>
          <label>Name *</label><input id="lnk-folder-name" placeholder="e.g. Search Engines">
          <label>Description (one line, shown under the title)</label><input id="lnk-folder-desc" placeholder="e.g. Ways to find things">
          <div class="lnk-modal-actions">
            <button class="lnk-save" onclick="saveFolder()">Save</button>
            <button class="lnk-cancel" onclick="closeModals()">Cancel</button>
          </div>
        </div>`;
    folderModal.addEventListener('click', e => { if (e.target === folderModal) closeModals(); });
    document.body.appendChild(folderModal);
}

// ── Load ─────────────────────────────────────────────────────────
async function loadMarkdown() {
    const names = MD_NAMES[PAGE] || [PAGE];
    let markdown = null;
    for (const n of names) {
        try {
            const r = await fetch(`./markdown/${n}.md`);
            if (r.ok) { markdown = await r.text(); mdFile = n; break; }
        } catch (e) { /* try the next name */ }
    }
    if (markdown === null) loadError = "Couldn't load this category's links.";
    else foldersData = parseMarkdownToFolders(markdown);

    try {
        const s = await fetch('../../admin/check-session.php').then(r => r.json());
        if (s.admin) { isAdmin = true; document.body.classList.add('admin-mode'); injectAdminUI(); }
    } catch (e) { /* not logged in */ }

    categories = await loadCategories();
    curSection = sectionFromHash();
    rerender();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(loadMarkdown, 100));
} else {
    setTimeout(loadMarkdown, 100);
}
