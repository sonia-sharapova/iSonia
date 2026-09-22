// The hub list behind navigation/resources.html, navigation/learning.html and every category page.
// It lives in data/resources.json as sections of "cards", and has three groups:
//
//   By Function (id "cat")    → Create, Consume, Explore, Learn                    (navigation/resources/*.html;
//                                shown on the hub as plain tags, not a browsable card group — see hub.js)
//   Quick Links (id "topics") → Tech, Open Source, Community, Career Resources, Misc.  (navigation/resources/*.html)
//   Guides      (id "guides") → the tutorial categories in navigation/learning/*.html
//
// The hub's own hand-picked shortcuts (Wayback Machine, Lainchan, …) are a separate "My Favourites" links section,
// kept as-is in data/resources.json.
//
// Each Resources page is a topic tree (title → topics → sections → links), see links.js.
//
// normalize() is what every page runs the saved list through, so older saved copies still work: a list from
// before the current topic trees (no "Create" + "Career Resources" cards) gets the new Categories + Quick Links groups, and the Guides group
// is added if the saved list doesn't have one yet (the next admin save writes it out).

const HubData = (() => {
    // rows: [slug, title, description, [bullets shown on the hub tile]]
    const cards = (folder, rows) => rows.map(([slug, title, desc, bullets]) => {
        const c = { id: slug, title, href: folder + '/' + slug + '.html', desc };
        if (bullets) c.bullets = bullets;
        return c;
    });

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

    const topics = () => cards('resources', [
        ['technology', 'Tech', 'The web, programming, privacy, hardware, operating systems and more.',
            ['World Wide Web', 'Programming', 'Computers']],
        ['open-source', 'Open Source', 'Free software, alternatives to big tech, and free things.',
            ['Free software', 'Big tech alternatives', 'Free things']],
        ['get-involved', 'Community', 'Blogs, forums and events for tech, design and music.',
            ['Blogs', 'Forums', 'Events']],
        ['careers', 'Career Resources', 'Job boards, networking and freelance options.',
            ['Job boards and networking', 'Freelance options', 'Design / Tech / General']],
        ['misc', 'Misc.', 'Software and tools, nostalgia, weird and fun, and everyday life.',
            ['Software & Tools', 'Nostalgia', 'Weird', 'Life']]
    ]);

    const guides = () => cards('learning', [
        ['web-design', 'Web Design Tutorials', 'Make your own website, from a first HTML page to hands-on projects.'],
        ['algorithms', 'Algorithms', 'A crash course in algorithms.'],
        ['machine-learning', 'Machine Learning', 'Overviews of machine learning and AI.'],
        ['hpc', 'High Performance Computing', 'Parallel computing, Go and HPC.'],
        ['privacy', 'Privacy', 'Take back control of your data.']
    ]);

    const savedSection = () => ({ id: 'cat', title: 'By Function', type: 'cards', intro: '', items: saved() });
    const topicsSection = () => ({ id: 'topics', title: 'Quick Links', type: 'cards', intro: '', items: topics() });
    const guidesSection = () => ({ id: 'guides', title: 'Guides', type: 'cards', intro: "Step-by-step write-ups and how-tos I've put together.", items: guides() });

    const isGuides = sec => sec.id === 'guides';
    const isTutorialsCard = it => /(^|\/)tutorials\.html/.test(it.href || '');
    // the current lists have both a Create and a Career Resources card; older saved lists have neither / only one
    const hasNewTree = data => {
        const hrefs = data.filter(s => s.type === 'cards').flatMap(s => (s.items || []).map(it => it.href || ''));
        return hrefs.some(h => /(^|\/)creating\.html/.test(h)) && hrefs.some(h => /(^|\/)careers\.html/.test(h));
    };

    function normalize(data) {
        if (!Array.isArray(data)) data = [];
        if (!hasNewTree(data)) {
            // an older list of link categories: swap its cards for the new groups, keep every other section (My Favourites…)
            const rest = data.filter(s => !(s.type === 'cards' && !isGuides(s)));
            data = [savedSection(), topicsSection()].concat(rest);
        }
        data.forEach(s => {
            if (s.type !== 'cards') return;
            if (s.id === 'cat' && (s.title === 'Categories' || s.title === 'Saved Links')) s.title = 'By Function';
            if (s.id === 'topics' && s.title === 'By Topic') s.title = 'Quick Links';
            // the hub's original hand-curated links section (Wayback Machine, Lainchan, …) — give it its name
            if (s.type === 'links' && s.id !== 'topics' && (s.title === 'Quick Links' || s.title === 'Categories')) s.title = 'My Favourites';
            s.items = (s.items || []).filter(it => !isTutorialsCard(it));
        });
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
