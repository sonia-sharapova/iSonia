// The hub list behind navigation/resources.html, navigation/learning.html and every category page.
// It lives in data/resources.json as sections of "cards"/"links", and has four groups:
//
//   By Function (id "cat")       → Create, Consume, Explore, Learn                 (navigation/resources/*.html;
//                                   kept in the saved data for hasNewTree()'s detection, but no longer shown on the
//                                   hub — hub.js filters this section out of render())
//   Technology Links (id "tech") → Computers, Educational, The Internet, Privacy & Security, Arrrrgh, General (resources/tech-*.html), shown first on the hub
//   General Resources (id "topics", formerly My Links)    → the 11 category pages: Technology, Web, Design, Careers, Software, Media,
//                                   Music, Archives, Culture, Ideas, Life (navigation/resources/*.html)
//   My Favourites (id "favourites") → Wayback Machine, Lainchan, LookMovie, Land Chad, Human Clock — a plain links
//                                   list, always reset to this exact set by normalize() (see favouritesSection())
//   Guides      (id "guides")    → the tutorial categories in navigation/learning/*.html
//
// Each Resources page is a topic tree (title → topics → sections → links), see links.js.
//
// normalize() is what every page runs the saved list through, so older saved copies still work: a list from
// before the current topic trees (no "Create" + "Career Resources" cards) gets the new Categories + My Links groups, and the Guides group
// is added if the saved list doesn't have one yet (the next admin save writes it out).

const HubData = (() => {
    // rows: [slug, title, description, [bullets shown on the hub tile]]
    const cards = (folder, rows) => rows.map(([slug, title, desc, bullets]) => {
        const c = { id: slug, title, href: folder + '/' + slug + '.html', desc };
        if (bullets) c.bullets = bullets;
        return c;
    });
    // like cards(), but each row also carries a "group" ('professional' or 'misc') for the hub's two-group tree
    const groupedCards = (folder, rows) => rows.map(([slug, title, desc, group]) => ({
        id: slug, title, href: folder + '/' + slug + '.html', desc, group
    }));

    const saved = () => cards('resources', [
        ['creating', 'Create', 'Design resources, media guides, and DIY projects.',
            ['Design Resources', 'Media Guides: Music, art, games', 'DIY and Projects']],
        ['consuming', 'Consume', 'Film, video, games, music and internet things.',
            ['Media: Film, video, games, music, etc.', 'Internet things']],
        ['exploring', 'Explore', 'Archives, the internet and notable figures.',
            ['Archives', 'Internet', 'Notable figures']],
        ['learning', 'Learn', 'Free courses, materials and guides.',
            ['Free courses and materials', 'Guides on web dev, audio, etc.']]
    ]);

    // The General Resources category pages (navigation/resources/seed/<slug>.md) — Tutorials/Guides stay on the Learning page.
    // Each carries a "group" so the hub's tree nests them under Professional / Misc. Titles are kept to 1-2 words
    // (an "&"-joined pair condensed down to the more central one) so they read on one line even in the tree's
    // narrower, reduced columns — the description still carries the fuller meaning.
    const topics = () => groupedCards('resources', [
        // (Technology, Web, Software and Torrents & Streaming were folded into the Technology Links tree — their pages
        // and markdown are still there, unlisted; Media, Archives and Archives & Collections are in Web Archives)
        ['design', 'Design', 'Inspiration, tools and assets for design work.', 'professional'],
        ['careers', 'Careers', 'Jobs, studios, festivals and open calls.', 'professional'],
        ['culture', 'Culture', 'Personal sites, forums, nostalgia and the strange.', 'misc'],
        ['ideas', 'Ideas', 'The thinkers, arguments and theories behind it all.', 'misc'],
        ['life', 'Life', 'Everyday guides, free courses and life admin.', 'misc'],
        // moved out of Technology Links (seed/<slug>.md, from the technology_tree spreadsheet)
        ['guides', 'Guides', 'How-tos, free stuff, shopping and handy online tools.', 'misc'],
        ['silly', 'Silly', 'Silly and miscellaneous corners of the internet.', 'misc']
    ]);

    const guides = () => cards('learning', [
        ['web-design', 'Web Design Tutorials', 'Make your own website, from a first HTML page to hands-on projects.'],
        ['algorithms', 'Algorithms', 'A crash course in algorithms.'],
        ['machine-learning', 'Machine Learning', 'Overviews of machine learning and AI.'],
        ['hpc', 'High Performance Computing', 'Parallel computing, Go and HPC.'],
        ['privacy', 'Privacy', 'Take back control of your data.']
    ]);

    // The hub's own hand-picked shortcuts — a plain links list, not category pages.
    const favourites = () => [
        { id: 'wayback', title: 'Wayback Machine', href: 'https://archive.org/web/', desc: 'Web archive' },
        { id: 'lainchan', title: 'Lainchan', href: 'https://lainchan.org/', desc: 'Technology Board' },
        { id: 'lookmovie', title: 'LookMovie', href: 'https://www.lookmovie2.to/', desc: 'Movie Streaming' },
        { id: 'landchad', title: 'Land Chad', href: 'https://landchad.net/', desc: 'Guides on setting up websites and servers' },
        { id: 'humanclock', title: 'Human Clock', href: 'https://humanclock.com/', desc: 'So cute!' }
    ];

    const savedSection = () => ({ id: 'cat', title: 'By Function', type: 'cards', intro: '', items: saved() });
    const topicsSection = () => ({ id: 'topics', title: 'General Resources', type: 'cards', intro: '', items: topics() });
    // Technology Links: four topic-tree pages (seed/tech-*.md, built from the technology_tree spreadsheet), the hub's
    // first tree; the pages above follow it as General Resources.
    // Web Archives: the archive-ish category pages, as the hub's third tree (below General Resources)
    const archiveSection = () => ({ id: 'archive', title: 'Web Archives', type: 'cards', intro: '', items: groupedCards('resources', [
        ['media', 'Media', 'Film, video, music, anime, games and things to read.', 'media'],
        ['archives', 'Archives', "Libraries, museums and the internet's memory.", 'archives'],
        ['archives-collections', 'Archives & Collections', 'Collections, galleries and general archives.', 'archives']
    ]).map(it => ({ ...it, expand: true })) });   // each page's sections are listed in the first column (hub.js treeEntries)
    const techSection = () => ({ id: 'tech', title: 'Technology Links', type: 'cards', intro: '', items: groupedCards('resources', [
        ['tech-computers', 'Computers', 'AI, maths, operating systems, hardware, tech culture and guides.', 'tech'],
        ['tech-educational', 'Educational', 'Courses, programming languages, references, projects and video tutorials.', 'tech'],
        ['tech-internet', 'The Internet', 'The web, how to design for it and how to browse it.', 'tech'],
        ['tech-privacy', 'Privacy & Security', 'Security tools, privacy guides and anonymity tools, piracy and hacking.', 'tech'],
        ['tech-arrrrgh', 'Arrrrgh', 'Open source and free media.', 'tech'],
        ['community', 'Community', 'Blogs, interviews, news, magazines, forums and personal sites.', 'tech']
    ]) });
    const guidesSection = () => ({ id: 'guides', title: 'Guides', type: 'cards', intro: "Step-by-step write-ups and how-tos I've put together.", items: guides() });
    const favouritesSection = () => ({ id: 'favourites', title: 'My Favourites', type: 'links', intro: '', items: favourites() });

    // shown with each section's picture on the hub until a page is picked (admin-editable there, saved as `intro`)
    const SECTION_INTROS = {
        tech: 'Computers, programming, the web, privacy and the communities around them.',
        topics: 'Design, careers, culture, ideas, everyday guides and the sillier corners of the internet.',
        archive: "Film, music, books and games, and the libraries and collections keeping the internet's memory."
    };

    const isGuides = sec => sec.id === 'guides';
    const isTutorialsCard = it => /(^|\/)tutorials\.html/.test(it.href || '');
    // the current lists have both a Create and a Career Resources card; older saved lists have neither / only one
    const hasNewTree = data => {
        const hrefs = data.filter(s => s.type === 'cards').flatMap(s => (s.items || []).map(it => it.href || ''));
        return hrefs.some(h => /(^|\/)creating\.html/.test(h)) && hrefs.some(h => /(^|\/)careers\.html/.test(h));
    };
    // the current General Resources list has the Silly page (from the technology spreadsheet); older saved lists don't
    const hasElevenTopics = data => {
        const sec = data.find(s => s.id === 'topics');
        return !!sec && (sec.items || []).some(it => /(^|\/)silly\.html/.test(it.href || ''));
    };
    // group ('professional' / 'misc') was added after the 11-category list; backfill it onto an older saved copy
    const hasGroups = data => {
        const sec = data.find(s => s.id === 'topics');
        return !!sec && (sec.items || []).every(it => it.group === 'professional' || it.group === 'misc');
    };

    function normalize(data) {
        if (!Array.isArray(data)) data = [];
        if (!hasNewTree(data)) {
            // an older list of link categories: swap its cards for the new groups, keep every other section (Quick Links…)
            const rest = data.filter(s => !(s.type === 'cards' && !isGuides(s)));
            data = [savedSection(), topicsSection()].concat(rest);
        } else if (!hasElevenTopics(data) || !hasGroups(data)) {
            // the 5-bucket Quick Links, or an 11-item one saved before Professional/Misc grouping — replace with the current list
            data = data.map(s => s.id === 'topics' ? topicsSection() : s);
        }
        data.forEach(s => {
            if (s.type !== 'cards') return;
            if (s.id === 'cat' && (s.title === 'Categories' || s.title === 'Saved Links')) s.title = 'By Function';
            if (s.id === 'topics') s.title = 'General Resources';
            s.items = (s.items || []).filter(it => !isTutorialsCard(it));
        });
        // the hub's own hand-picked shortcuts — always exactly Wayback/Lainchan/LookMovie/Land Chad/Human Clock
        const favIdx = data.findIndex(s => s.type === 'links' && s.id !== 'topics');
        if (favIdx >= 0) data[favIdx] = favouritesSection();
        else data.push(favouritesSection());
        // (a list saved while Technology Links was still the single tech-links page gets the four pages instead)
        const techAt = data.findIndex(s => s.id === 'tech');
        if (techAt >= 0 && (data[techAt].items || []).some(it => /(^|\/)tech-links\.html/.test(it.href || ''))) data.splice(techAt, 1);
        if (!data.some(s => s.id === 'tech')) {
            const at = data.findIndex(s => s.id === 'topics');
            data.splice(at >= 0 ? at : data.length, 0, techSection());
        }
        // Web Archives, right after General Resources — and its pages taken out of General Resources if a saved list has them
        // (a list saved before the pages were expanded into their own groups gets the current ones)
        const archAt = data.findIndex(s => s.id === 'archive');
        if (archAt >= 0 && !(data[archAt].items || []).every(it => it.expand && it.group !== 'archives-collections')) data.splice(archAt, 1);
        if (!data.some(s => s.id === 'archive')) {
            const at = data.findIndex(s => s.id === 'topics');
            data.splice(at >= 0 ? at + 1 : data.length, 0, archiveSection());
        }
        const archiveHrefs = data.find(s => s.id === 'archive').items.map(it => it.href);
        data.forEach(s => { if (s.id === 'topics') s.items = (s.items || []).filter(it => !archiveHrefs.includes(it.href)); });
        if (!data.some(isGuides)) data.push(guidesSection());
        data.forEach(s => {
            if (s.id === 'tech') s.title = 'Technology Resources';
            if (s.id === 'archive') s.title = 'Archives';
            if (s.id in SECTION_INTROS && !s.intro) s.intro = SECTION_INTROS[s.id];   // the hub's section description
        });
        return data;
    }

    // Parses a category's markdown (see links.js's file-format comment) into
    // { intro: {image, alt, description}, folders: [section...], topics: [topic...] }.
    // Shared by links.js (the category tree pages) and hub.js (the hub's inline folder tree).
    function parseMarkdown(markdown) {
        const folders = [], topics = [];
        const info = { image: '', alt: '', description: '' };
        let folder = null, sub = null, last = null, topic = null;

        markdown.split('\n').forEach(raw => {
            const line = raw.replace(/\r$/, '');
            const t = line.trim();
            if (line.startsWith('# ')) {
                topic = { name: line.slice(2).trim(), description: '', image: '', alt: '' };
                topics.push(topic);
                folder = null; sub = null; last = null;
            } else if (line.startsWith('## ')) {
                folder = { name: line.slice(3).trim(), description: '', image: '', alt: '', topic: topic ? topic.name : '', subfolders: [], items: [] };
                folders.push(folder);
                sub = null; last = null;
            } else if (line.startsWith('### ')) {
                if (!folder) return;
                sub = { name: line.slice(4).trim(), description: '', image: '', alt: '', items: [] };
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
            } else {
                // an image line right after a heading (or at the top of the file) belongs to
                // whichever entity is currently open — the same "innermost wins" target as descriptions
                const im = t.match(/^!\[([^\]]*)\]\(([^)]+)\)/);
                if (im) {
                    const target = sub || folder || topic || info;
                    target.alt = im[1]; target.image = im[2];
                }
            }
        });
        return { intro: info, folders, topics };
    }

    // The reverse of parseMarkdown — what the admin saves (links.js on the category pages, hub.js on the hub).
    function serializeMarkdown(folders, info, topics) {
        const itemMd = it => `- **${it.name}**: ${it.description}\n` + (it.link ? `  - ${it.link}\n` : '');
        let md = '';
        if (info && (info.image || info.description)) {
            if (info.image) md += `![${info.alt || ''}](${info.image})\n`;
            if (info.description) md += `> ${info.description}\n`;
            md += '\n';
        }
        const folderMd = f => {
            md += `## ${f.name}\n` + (f.image ? `![${f.alt || ''}](${f.image})\n` : '') + (f.description ? `> ${f.description}\n` : '') + '\n';
            f.items.forEach(it => { md += itemMd(it); });
            f.subfolders.forEach(sf => {
                md += `\n### ${sf.name}\n` + (sf.image ? `![${sf.alt || ''}](${sf.image})\n` : '') + (sf.description ? `> ${sf.description}\n` : '') + '\n';
                sf.items.forEach(it => { md += itemMd(it); });
            });
            md += '\n';
        };
        topics = topics || [];
        // sections that belong to no topic go first — after a "# Topic" line they would be read as part of it
        folders.filter(f => !topics.some(t => t.name === f.topic)).forEach(folderMd);
        topics.forEach(t => {
            md += `# ${t.name}\n` + (t.image ? `![${t.alt || ''}](${t.image})\n` : '') + (t.description ? `> ${t.description}\n` : '') + '\n';
            folders.filter(f => f.topic === t.name).forEach(folderMd);
        });
        return md;
    }

    return { normalize, isGuides, parseMarkdown, serializeMarkdown };
})();
