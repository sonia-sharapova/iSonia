// Shared by the collection pages (movies, anime, books, music, electronics):
//  - MediaExtras.goButton(item): the "watch / read / listen here ›" button in the preview
//    panel (or music's popup). It goes to the item's own `link` when the admin has set one,
//    otherwise to a search for the item on a site where it can usually be found.
//  - a "Resources" link list under the gallery, read from the Resources pages' live markdown
//    (navigation/resources/markdown/*.md, same parser as the tree via hub-data.js), so the
//    links are edited in the Resources tree rather than here.
// Each page sets <body data-media="movies|anime|books|music|electronics">.
const MediaExtras = (function () {
    const q = s => encodeURIComponent(String(s || '').trim());
    const CONFIG = {
        movies: {
            verb: 'Watch',
            search: m => 'https://www.justwatch.com/us/search?q=' + q(m.title),
            sources: [{ file: 'consuming', topic: 'Media', section: 'Film', skip: ['Anime & Animation'] },
                      { file: 'consuming', topic: 'Internet Culture', section: 'Streaming' }]
        },
        anime: {
            verb: 'Watch',
            search: m => 'https://www.justwatch.com/us/search?q=' + q(m.title),
            sources: [{ file: 'consuming', topic: 'Media', section: 'Film', sub: 'Anime & Animation' }]
        },
        books: {
            verb: 'Read',
            search: b => 'https://openlibrary.org/search?q=' + q(b.title + ' ' + (b.author || '')),
            sources: [{ file: 'consuming', topic: 'Media', section: 'Books & Magazines' }]
        },
        music: {
            verb: 'Listen',
            search: a => 'https://music.youtube.com/search?q=' + q(a.title + ' ' + (a.artist || '')),
            sources: [{ file: 'consuming', topic: 'Music', section: 'Free Music & Sound' }]
        },
        electronics: {
            verb: 'Find it',
            search: m => 'https://www.ebay.com/sch/i.html?_nkw=' + q(m.title),
            sources: [{ file: 'tech-computers', topic: 'Hardware & Electronics' }]
        }
    };
    const kind = document.body.dataset.media;
    const cfg = CONFIG[kind];

    const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
    const slug = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

    function goButton(item) {
        if (!cfg || !item) return '';
        const href = item.link || cfg.search(item);
        const label = cfg.verb === 'Find it' ? 'Find it here' : cfg.verb + ' here';
        return `<a class="media-go" href="${esc(href)}" target="_blank" rel="noopener">${label} <span aria-hidden="true">›</span></a>`;
    }

    // --- Resources section ---
    const mdCache = {};
    function loadMd(file) {
        if (!mdCache[file]) {
            const get = url => fetch(url, { cache: 'no-cache' }).then(r => { if (!r.ok) throw r; return r.text(); });
            mdCache[file] = get(`../navigation/resources/markdown/${file}.md`)
                .catch(() => get(`../navigation/resources/seed/${file}.md`))
                .then(md => HubData.parseMarkdown(md))
                .catch(() => null);
        }
        return mdCache[file];
    }

    // One source → { title, href, groups: [{ name, items }] } with only the items that have a link.
    // A source with a topic and no section takes the whole topic, one group per section.
    function pick(tree, src) {
        if (!tree) return null;
        if (!src.section) {
            const groups = tree.folders.filter(f => f.topic === src.topic)
                .map(f => ({ name: f.name, items: f.items.concat(...f.subfolders.map(sf => sf.items)).filter(it => it.link) }))
                .filter(g => g.items.length);
            return groups.length ? { title: src.topic, href: `../navigation/resources/${src.file}.html#${slug(src.topic)}`, groups } : null;
        }
        const f = tree.folders.find(f => f.name === src.section && (!src.topic || f.topic === src.topic));
        if (!f) return null;
        const linked = items => items.filter(it => it.link);
        const groups = [];
        if (!src.sub && linked(f.items).length) groups.push({ name: '', items: linked(f.items) });
        f.subfolders.forEach(sf => {
            if (src.sub ? sf.name !== src.sub : (src.skip || []).includes(sf.name)) return;
            if (linked(sf.items).length) groups.push({ name: src.sub ? '' : sf.name, items: linked(sf.items) });
        });
        const hash = [f.topic, f.name, src.sub].filter(Boolean).map(slug).join('/');
        return groups.length ? { title: src.sub || f.name, href: `../navigation/resources/${src.file}.html#${hash}`, groups } : null;
    }

    function linkList(items) {
        return '<ul class="media-res-links">' + items.map(it =>
            `<li><a href="${esc(it.link)}" target="_blank" rel="noopener"${it.description ? ` title="${esc(it.description)}"` : ''}>${esc(it.name)}</a>`
            + (it.description ? `<span class="media-res-note"> — ${esc(it.description)}</span>` : '') + '</li>').join('') + '</ul>';
    }

    function renderResources() {
        const main = document.querySelector('.archive-main');
        if (!cfg || !main) return;
        Promise.all(cfg.sources.map(s => loadMd(s.file).then(t => pick(t, s)))).then(blocks => {
            blocks = blocks.filter(Boolean);
            if (!blocks.length) return;
            const sec = document.createElement('section');
            sec.className = 'media-res';
            sec.innerHTML = '<h2 class="media-res-title">Resources</h2><hr>' + blocks.map(b => `
                <div class="media-res-block">
                    <h3 class="media-res-head">${esc(b.title)} <a class="media-res-more" href="${esc(b.href)}">more ›</a></h3>
                    ${b.groups.map(g => (g.name ? `<h4 class="media-res-sub">${esc(g.name)}</h4>` : '') + linkList(g.items)).join('')}
                </div>`).join('');
            main.appendChild(sec);
            main.classList.add('has-media-res');
        });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', renderResources);
    else renderResources();

    return { goButton };
})();
