// The hub list behind navigation/resources.html, navigation/learning.html and every category page.
// It lives in data/resources.json as sections of "cards", and has three groups:
//
//   By Function (id "cat")   → Create, Consume, Explore, Learn                    (navigation/resources/*.html)
//   By Topic   (id "topics") → Tech, Open Source, Community, Career Resources, Misc.  (navigation/resources/*.html)
//   Guides     (id "guides") → the tutorial categories in navigation/learning/*.html
//
// Each Resources page is a topic tree (title → topics → sections → links), see links.js.
//
// normalize() is what every page runs the saved list through, so older saved copies still work: a list from
// before the current topic trees (no "Create" + "Career Resources" cards) gets the new Categories + By Topic groups, and the Guides group
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
    const topicsSection = () => ({ id: 'topics', title: 'By Topic', type: 'cards', intro: '', items: topics() });
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
            // an older list of link categories: swap its cards for the new groups, keep every other section (Quick Links…)
            const rest = data.filter(s => !(s.type === 'cards' && !isGuides(s)));
            data = [savedSection(), topicsSection()].concat(rest);
        }
        data.forEach(s => {
            if (s.type !== 'cards') return;
            if (s.id === 'cat' && (s.title === 'Categories' || s.title === 'Saved Links')) s.title = 'By Function';
            s.items = (s.items || []).filter(it => !isTutorialsCard(it));
        });
        if (!data.some(isGuides)) data.push(guidesSection());
        return data;
    }

    return { normalize, isGuides };
})();
