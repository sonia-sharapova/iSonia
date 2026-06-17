let foldersData = [];
let isAdmin = false;
// derive page name from URL: general.html → 'general'
const mdPageName = window.location.pathname.split('/').pop().replace('.html', '');

// ── Parse markdown ───────────────────────────────────────────────
function parseMarkdownToFolders(markdown) {
    const lines = markdown.split('\n');
    const folders = [];
    let currentFolder = null;
    let currentSubfolder = null;
    let currentItems = [];

    lines.forEach(line => {
        if (line.startsWith('## ')) {
            if (currentFolder) {
                if (currentSubfolder) {
                    currentFolder.subfolders.push({ name: currentSubfolder, items: currentItems });
                } else if (currentItems.length) {
                    currentFolder.items = currentItems;
                }
            }
            currentFolder = { name: line.replace('## ', '').trim(), subfolders: [], items: [] };
            currentSubfolder = null;
            currentItems = [];
            folders.push(currentFolder);
        } else if (line.startsWith('### ')) {
            if (currentSubfolder && currentItems.length) {
                currentFolder.subfolders.push({ name: currentSubfolder, items: currentItems });
                currentItems = [];
            }
            currentSubfolder = line.replace('### ', '').trim();
        } else if (line.trim().startsWith('- **')) {
            const match = line.match(/- \*\*(.+?)\*\*:?\s*(.*)/);
            if (match) currentItems.push({ name: match[1], description: match[2], link: '' });
        } else if (line.trim().startsWith('- http')) {
            const link = line.trim().replace('- ', '');
            if (currentItems.length) currentItems[currentItems.length - 1].link = link;
        }
    });

    if (currentFolder) {
        if (currentSubfolder) {
            currentFolder.subfolders.push({ name: currentSubfolder, items: currentItems });
        } else if (currentItems.length) {
            currentFolder.items = currentItems;
        }
    }
    return folders;
}

// ── Serialize back to markdown ───────────────────────────────────
function serializeToMarkdown(folders) {
    let md = '';
    folders.forEach(folder => {
        md += `## ${folder.name}\n\n`;
        folder.items.forEach(item => {
            md += `- **${item.name}**: ${item.description}\n`;
            if (item.link) md += `  - ${item.link}\n`;
        });
        folder.subfolders.forEach(sf => {
            md += `\n### ${sf.name}\n\n`;
            sf.items.forEach(item => {
                md += `- **${item.name}**: ${item.description}\n`;
                if (item.link) md += `  - ${item.link}\n`;
            });
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
            body: JSON.stringify({ file: mdPageName, content: serializeToMarkdown(foldersData) })
        }).then(r => r.json());
        if (!res.success) alert('Save error: ' + (res.error || 'unknown'));
    } catch(e) { alert('Network error — changes not saved.'); }
}

// ── Render ───────────────────────────────────────────────────────
function createTable(items, folderIdx, subIdx) {
    if (!items || !items.length) return isAdmin
        ? `<div style="padding:8px 4px;font-size:13px;color:#bbb;">No items yet.</div>`
        : '';

    let html = '<table class="resource-table"><thead><tr>';
    html += '<th class="col-name">NAME</th>';
    html += '<th class="col-description">DESCRIPTION</th>';
    html += '<th class="col-link">LINK</th>';
    if (isAdmin) html += '<th style="width:30px;"></th>';
    html += '</tr></thead><tbody>';

    items.forEach((item, itemIdx) => {
        html += '<tr>';
        html += `<td class="col-name" data-label="Name"><span class="resource-name">${esc(item.name)}</span></td>`;
        html += `<td class="col-description" data-label="Description"><span class="resource-description">${esc(item.description)}</span></td>`;
        html += `<td class="col-link" data-label="Link"><a href="${esc(item.link)}" class="resource-link" target="_blank" rel="noopener">${esc(item.link)}</a></td>`;
        if (isAdmin) {
            const sf = subIdx !== null ? subIdx : 'null';
            html += `<td style="text-align:center;white-space:nowrap;">
              <button class="lnk-adm-btn lnk-edit" onclick="openRowModal(${folderIdx},${sf},${itemIdx})">✎</button>
              <button class="lnk-adm-btn lnk-del"  onclick="deleteRow(${folderIdx},${sf},${itemIdx})">✕</button>
            </td>`;
        }
        html += '</tr>';
    });
    html += '</tbody></table>';

    if (isAdmin) {
        const sf = subIdx !== null ? subIdx : 'null';
        html += `<button class="lnk-adm-add-row" onclick="openRowModal(${folderIdx},${sf},null)">+ Add Row</button>`;
    }
    return html;
}

function renderFolders(folders) {
    let html = '';
    folders.forEach((folder, fi) => {
        const totalItems = folder.items.length + folder.subfolders.reduce((s, sf) => s + sf.items.length, 0);
        html += `<div class="folder-item" data-folder="${fi}">`;
        html += `<div class="folder-header" onclick="toggleFolder(${fi})">`;
        html += `<span class="folder-icon">▶</span>`;
        html += `<span class="folder-name">${esc(folder.name)}</span>`;
        html += `<span class="folder-count">(${totalItems} items)</span>`;
        if (isAdmin) {
            html += `<span onclick="event.stopPropagation();" style="margin-left:10px;display:inline-flex;gap:5px;">
              <button class="lnk-adm-btn lnk-edit" onclick="openFolderModal(${fi})">✎ rename</button>
              <button class="lnk-adm-btn lnk-del"  onclick="deleteFolder(${fi})">✕ section</button>
            </span>`;
        }
        html += `</div><div class="folder-content">`;
        if (folder.items.length > 0 || isAdmin) html += createTable(folder.items, fi, null);
        folder.subfolders.forEach((sf, si) => {
            html += `<div style="margin:20px;background:#fafafa;border-radius:4px;padding:15px;">`;
            html += `<h3 style="margin:0 0 15px;font-size:16px;color:#414141;font-weight:normal;">${esc(sf.name)}</h3>`;
            html += createTable(sf.items, fi, si);
            html += `</div>`;
        });
        if (isAdmin) {
            html += `<button class="lnk-adm-add-row" style="margin:8px 0 12px;" onclick="openSubfolderModal(${fi})">+ Add Sub-section</button>`;
        }
        html += `</div></div>`;
    });

    if (isAdmin) {
        html += `<div style="margin-top:20px;padding-top:16px;border-top:1px dashed #ddd;">
          <button class="lnk-adm-add-row" onclick="openFolderModal(null)">+ Add Section</button>
        </div>`;
    }
    return html;
}

// ── Admin actions ─────────────────────────────────────────────────
function deleteRow(fi, si, ii) {
    if (!confirm('Remove this row?')) return;
    if (si === null) foldersData[fi].items.splice(ii, 1);
    else foldersData[fi].subfolders[si].items.splice(ii, 1);
    saveMd().then(rerender);
}

function deleteFolder(fi) {
    if (!confirm(`Delete section "${foldersData[fi].name}" and all its rows?`)) return;
    foldersData.splice(fi, 1);
    saveMd().then(rerender);
}

// ── Modals ────────────────────────────────────────────────────────
let _modalFi = null, _modalSi = null, _modalIi = null;

function openRowModal(fi, si, ii) {
    _modalFi = fi; _modalSi = si; _modalIi = ii;
    const items = si === null ? foldersData[fi].items : foldersData[fi].subfolders[si].items;
    const item  = ii !== null ? items[ii] : null;
    document.getElementById('lnk-modal-title').textContent = ii !== null ? 'Edit Row' : 'Add Row';
    document.getElementById('lnk-row-name').value = item ? item.name        : '';
    document.getElementById('lnk-row-desc').value = item ? item.description : '';
    document.getElementById('lnk-row-url').value  = item ? item.link        : '';
    document.getElementById('lnk-folder-modal').style.display = 'none';
    document.getElementById('lnk-row-modal').style.display    = 'flex';
    setTimeout(() => document.getElementById('lnk-row-name').focus(), 50);
}

function saveRow() {
    const name = document.getElementById('lnk-row-name').value.trim();
    const desc = document.getElementById('lnk-row-desc').value.trim();
    const url  = document.getElementById('lnk-row-url').value.trim();
    if (!name) { alert('Name is required.'); return; }
    const items = _modalSi === null ? foldersData[_modalFi].items : foldersData[_modalFi].subfolders[_modalSi].items;
    if (_modalIi !== null) {
        items[_modalIi] = { name, description: desc, link: url };
    } else {
        items.push({ name, description: desc, link: url });
    }
    saveMd().then(() => { closeModals(); rerender(); });
}

let _folderFi = null;
function openFolderModal(fi) {
    _folderFi = fi;
    const folder = fi !== null ? foldersData[fi] : null;
    document.getElementById('lnk-folder-modal-title').textContent = fi !== null ? 'Rename Section' : 'Add Section';
    document.getElementById('lnk-folder-name').value = folder ? folder.name : '';
    document.getElementById('lnk-row-modal').style.display    = 'none';
    document.getElementById('lnk-folder-modal').style.display = 'flex';
    setTimeout(() => document.getElementById('lnk-folder-name').focus(), 50);
}

function saveFolder() {
    const name = document.getElementById('lnk-folder-name').value.trim();
    if (!name) { alert('Name is required.'); return; }
    if (_folderFi !== null) {
        foldersData[_folderFi].name = name;
    } else {
        foldersData.push({ name, subfolders: [], items: [] });
    }
    saveMd().then(() => { closeModals(); rerender(); });
}

let _subFi = null;
function openSubfolderModal(fi) {
    _subFi = fi;
    document.getElementById('lnk-folder-modal-title').textContent = 'Add Sub-section';
    document.getElementById('lnk-folder-name').value = '';
    document.getElementById('lnk-row-modal').style.display    = 'none';
    document.getElementById('lnk-folder-modal').style.display = 'flex';
    document.getElementById('lnk-folder-modal').dataset.mode = 'sub';
    setTimeout(() => document.getElementById('lnk-folder-name').focus(), 50);
}

function saveFolder() {
    const name = document.getElementById('lnk-folder-name').value.trim();
    if (!name) { alert('Name is required.'); return; }
    const mode = document.getElementById('lnk-folder-modal').dataset.mode;
    if (mode === 'sub') {
        foldersData[_subFi].subfolders.push({ name, items: [] });
        document.getElementById('lnk-folder-modal').dataset.mode = '';
    } else if (_folderFi !== null) {
        foldersData[_folderFi].name = name;
    } else {
        foldersData.push({ name, subfolders: [], items: [] });
    }
    saveMd().then(() => { closeModals(); rerender(); });
}

function closeModals() {
    document.getElementById('lnk-row-modal').style.display    = 'none';
    document.getElementById('lnk-folder-modal').style.display = 'none';
}

// ── Inject admin UI into DOM ──────────────────────────────────────
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
            margin: 8px 4px 4px; font-size: 12px; color: #1d60c0;
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

    // Row modal
    const rowModal = document.createElement('div');
    rowModal.id = 'lnk-row-modal';
    rowModal.className = 'lnk-modal-overlay';
    rowModal.innerHTML = `
        <div class="lnk-modal-box">
          <h3 id="lnk-modal-title">Add Row</h3>
          <label>Name *</label><input id="lnk-row-name" placeholder="e.g. GitHub">
          <label>Description</label><input id="lnk-row-desc" placeholder="Short description">
          <label>URL</label><input id="lnk-row-url" placeholder="https://...">
          <div class="lnk-modal-actions">
            <button class="lnk-save" onclick="saveRow()">Save</button>
            <button class="lnk-cancel" onclick="closeModals()">Cancel</button>
          </div>
        </div>`;
    rowModal.addEventListener('click', e => { if (e.target === rowModal) closeModals(); });
    document.body.appendChild(rowModal);

    // Folder modal
    const folderModal = document.createElement('div');
    folderModal.id = 'lnk-folder-modal';
    folderModal.className = 'lnk-modal-overlay';
    folderModal.innerHTML = `
        <div class="lnk-modal-box">
          <h3 id="lnk-folder-modal-title">Add Section</h3>
          <label>Name *</label><input id="lnk-folder-name" placeholder="e.g. Tutorials">
          <div class="lnk-modal-actions">
            <button class="lnk-save" onclick="saveFolder()">Save</button>
            <button class="lnk-cancel" onclick="closeModals()">Cancel</button>
          </div>
        </div>`;
    folderModal.addEventListener('click', e => { if (e.target === folderModal) closeModals(); });
    document.body.appendChild(folderModal);
}

// ── Helpers ───────────────────────────────────────────────────────
function esc(s) {
    return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function rerender() {
    document.getElementById('folder-navigation').innerHTML = renderFolders(foldersData);
}

function toggleFolder(index) {
    document.querySelector(`[data-folder="${index}"]`).classList.toggle('open');
}

// ── Load ─────────────────────────────────────────────────────────
async function loadMarkdown() {
    const mdPath = `./markdown/${mdPageName}.md`;
    try {
        const r = await fetch(mdPath);
        if (!r.ok) throw new Error('Status ' + r.status);
        const markdown = await r.text();
        foldersData = parseMarkdownToFolders(markdown);

        // check admin before rendering
        try {
            const s = await fetch('../../admin/check-session.php').then(r => r.json());
            if (s.admin) { isAdmin = true; injectAdminUI(); }
        } catch(e) {}

        rerender();
    } catch(e) {
        document.getElementById('folder-navigation').innerHTML =
            '<div class="loading">Failed to load resources: ' + e.message + '</div>';
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(loadMarkdown, 100));
} else {
    setTimeout(loadMarkdown, 100);
}
