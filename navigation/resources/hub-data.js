// The hub list behind navigation/resources.html, navigation/learning.html and every category page.
// It lives in data/resources.json as sections of "cards"/"links", and has four groups:
//
//   By Function (id "cat")       → Create, Consume, Explore, Learn                 (navigation/resources/*.html;
//                                   kept in the saved data for hasNewTree()'s detection, but no longer shown on the
//                                   hub — hub.js filters this section out of render())
//   My Links    (id "topics")    → the 11 category pages: Technology, Web, Design, Careers, Software, Media,
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

    // The 11 real category pages (navigation/resources/seed/<slug>.md) — Tutorials/Guides stay on the Learning page.
    // Each carries a "group" so the hub's tree nests them under Professional / Misc. Titles are kept to 1-2 words
    // (an "&"-joined pair condensed down to the more central one) so they read on one line even in the tree's
    // narrower, reduced columns — the description still carries the fuller meaning.
    const topics = () => groupedCards('resources', [
        ['technology', 'Technology', 'Programming, computers and how they work.', 'professional'],
        ['web', 'Web', 'How the web works, how to build for it, and the corners worth exploring.', 'professional'],
        ['design', 'Design', 'Inspiration, tools and assets for design work.', 'professional'],
        ['careers', 'Careers', 'Jobs, studios, festivals and open calls.', 'professional'],
        ['software', 'Software', 'Free software, alternatives and handy online tools.', 'professional'],
        ['media', 'Media', 'Film, video, anime, games and things to read.', 'misc'],
        ['music', 'Music', 'Free sound, radio, discovery and learning.', 'misc'],
        ['archives', 'Archives', "Libraries, museums and the internet's memory.", 'misc'],
        ['culture', 'Culture', 'Personal sites, forums, nostalgia and the strange.', 'misc'],
        ['ideas', 'Ideas', 'The thinkers, arguments and theories behind it all.', 'misc'],
        ['life', 'Life', 'Everyday guides, free courses and life admin.', 'misc']
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
    const topicsSection = () => ({ id: 'topics', title: 'My Links', type: 'cards', intro: '', items: topics() });
    const guidesSection = () => ({ id: 'guides', title: 'Guides', type: 'cards', intro: "Step-by-step write-ups and how-tos I've put together.", items: guides() });
    const favouritesSection = () => ({ id: 'favourites', title: 'My Favourites', type: 'links', intro: '', items: favourites() });

    const isGuides = sec => sec.id === 'guides';
    const isTutorialsCard = it => /(^|\/)tutorials\.html/.test(it.href || '');
    // the current lists have both a Create and a Career Resources card; older saved lists have neither / only one
    const hasNewTree = data => {
        const hrefs = data.filter(s => s.type === 'cards').flatMap(s => (s.items || []).map(it => it.href || ''));
        return hrefs.some(h => /(^|\/)creating\.html/.test(h)) && hrefs.some(h => /(^|\/)careers\.html/.test(h));
    };
    // the 11-category Quick Links has a Web card; the older 5-bucket one (technology/open-source/get-involved/careers/misc) does not
    const hasElevenTopics = data => {
        const sec = data.find(s => s.id === 'topics');
        return !!sec && (sec.items || []).some(it => /(^|\/)web\.html/.test(it.href || ''));
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
            if (s.id === 'topics') s.title = 'My Links';
            s.items = (s.items || []).filter(it => !isTutorialsCard(it));
        });
        // the hub's own hand-picked shortcuts — always exactly Wayback/Lainchan/LookMovie/Land Chad/Human Clock
        const favIdx = data.findIndex(s => s.type === 'links' && s.id !== 'topics');
        if (favIdx >= 0) data[favIdx] = favouritesSection();
        else data.push(favouritesSection());
        if (!data.some(isGuides)) data.push(guidesSection());
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

    return { normalize, isGuides, parseMarkdown };
})();
