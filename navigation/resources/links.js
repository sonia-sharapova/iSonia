
// Parse markdown into folder structure
function parseMarkdownToFolders(markdown) {
    const lines = markdown.split('\n');
    const folders = [];
    let currentFolder = null;
    let currentSubfolder = null;
    let currentItems = [];

    lines.forEach(line => {
        // H2 = Main folder (## Category)
        if (line.startsWith('## ')) {
            if (currentFolder && currentItems.length > 0) {
                if (currentSubfolder) {
                    currentFolder.subfolders.push({
                        name: currentSubfolder,
                        items: currentItems
                    });
                } else {
                    currentFolder.items = currentItems;
                }
            }

            currentFolder = {
                name: line.replace('## ', '').trim(),
                subfolders: [],
                items: []
            };

            currentSubfolder = null;
            currentItems = [];
            folders.push(currentFolder);
        }
        // H3 = Subfolder (### Subcategory)
        else if (line.startsWith('### ')) {
            if (currentSubfolder && currentItems.length > 0) {
                currentFolder.subfolders.push({
                    name: currentSubfolder,
                    items: currentItems
                });
                currentItems = [];
            }
            currentSubfolder = line.replace('### ', '').trim();
        }
        // List item = Resource (- **Name**: Description)
        else if (line.trim().startsWith('- **')) {
            const match = line.match(/- \*\*(.+?)\*\*:?\s*(.+)/);
            if (match) {
                const name = match[1];
                const description = match[2];
                currentItems.push({ name, description, link: '' });
            }
        }
        // Link line (  - https://url.com)
        else if (line.trim().startsWith('- http')) {
            const link = line.trim().replace('- ', '');
            if (currentItems.length > 0) {
                currentItems[currentItems.length - 1].link = link;
            }
        }
    });

    // Add last folder
    if (currentFolder && currentItems.length > 0) {
        if (currentSubfolder) {
            currentFolder.subfolders.push({
                name: currentSubfolder,
                items: currentItems
            });
        } else {
            currentFolder.items = currentItems;
        }
    }

    return folders;
}

// Create table HTML
function createTable(items) {
    if (!items || items.length === 0) return '';

    let html = '<table class="resource-table"><thead><tr>';
    html += '<th class="col-name">NAME</th>';
    html += '<th class="col-description">DESCRIPTION</th>';
    html += '<th class="col-link">LINK</th>';
    html += '</tr></thead><tbody>';

    items.forEach(item => {
    html += '<tr>';
    html += `<td class="col-name" data-label="Name"><span class="resource-name">${item.name}</span></td>`;
    html += `<td class="col-description" data-label="Description"><span class="resource-description">${item.description}</span></td>`;
    html += `<td class="col-link" data-label="Link"><a href="${item.link}" class="resource-link" target="_blank" rel="noopener">${item.link}</a></td>`;
    html += '</tr>';
    });

    html += '</tbody></table>';
    return html;
}

// Render folder structure
function renderFolders(folders) {
    let html = '';

    folders.forEach((folder, index) => {
        const totalItems = folder.items.length + folder.subfolders.reduce((sum, sf) => sum + sf.items.length, 0);

        html += `<div class="folder-item" data-folder="${index}">`;
        html += `<div class="folder-header" onclick="toggleFolder(${index})">`;
        html += `<span class="folder-icon">▶</span>`;
        html += `<span class="folder-name">${folder.name}</span>`;
        html += `<span class="folder-count">(${totalItems} items)</span>`;
        html += `</div>`;
        html += `<div class="folder-content">`;

        // Main folder items
        if (folder.items.length > 0) {
            html += createTable(folder.items);
        }

        // Subfolders
        folder.subfolders.forEach((subfolder, subIndex) => {
            html += `<div style="margin: 20px; background: #fafafa; border-radius: 4px; padding: 15px;">`;
            html += `<h3 style="margin: 0 0 15px 0; font-size: 16px; color: #414141; font-weight: normal;">${subfolder.name}</h3>`;
            html += createTable(subfolder.items);
            html += `</div>`;
        });

        html += `</div>`;
        html += `</div>`;
    });

    return html;
}

// Toggle folder open/close
function toggleFolder(index) {
    const folderItem = document.querySelector(`[data-folder="${index}"]`);
    folderItem.classList.toggle('open');
}


