// The hub list behind navigation/resources.html, navigation/learning.html and every category page.
// It lives in data/resources.json as sections of "cards", and has three groups:
//
//   Categories (id "cat")    → Creating, Consuming, Exploring, Learning, Misc.   (navigation/resources/*.html)
//   By Topic   (id "topics") → Tech, Open Source, Get Involved                    (navigation/resources/*.html)
//   Guides     (id "guides") → the tutorial categories in navigation/learning/*.html
//
// Each Resources page is a topic tree (title → topics → sections → links), see links.js.
//
// normalize() is what every page runs the saved list through, so older saved copies still work: a list from
// before the topic trees (no "Creating" card) gets the new Categories + By Topic groups, and the Guides group
// is added if the saved list doesn't have one yet (the next admin save writes it out).

const HubData = (() => {
    const cards = (folder, rows) => rows.map(([slug, title, desc]) => ({ id: slug, title, href: folder + '/' + slug + '.html', desc }));

    const saved = () => cards('resources', [
        ['creating', 'Creating', 'Design, music and the tools and references for making things.'],
        ['consuming', 'Consuming', 'Film, video, books, games, music and internet culture.'],
        ['exploring', 'Exploring', 'Galleries, archives, people and the corners of the web worth wandering.'],
        ['learning', 'Learning', 'Web development, music and audio, guides and free courses.'],
        ['misc', 'Misc.', 'Careers, software and tools, nostalgia, weird and fun, and everyday life.']
    ]);

    const topics = () => cards('resources', [
        ['technology', 'Tech', 'The web, programming, privacy, hardware, operating systems and more.'],
        ['open-source', 'Open Source', 'Free software, alternatives to big tech, and free things.'],
        ['get-involved', 'Get Involved', 'Communities and forums for tech, design and music.']
    ]);

    const guides = () => cards('learning', [
        ['web-design', 'Web Design Tutorials', 'Make your own website, from a first HTML page to hands-on projects.'],
        ['algorithms', 'Algorithms', 'A crash course in algorithms.'],
        ['machine-learning', 'Machine Learning', 'Overviews of machine learning and AI.'],
        ['hpc', 'High Performance Computing', 'Parallel computing, Go and HPC.'],
        ['privacy', 'Privacy', 'Take back control of your data.']
    ]);

    const savedSection = () => ({ id: 'cat', title: 'Categories', type: 'cards', intro: '', items: saved() });
    const topicsSection = () => ({ id: 'topics', title: 'By Topic', type: 'cards', intro: '', items: topics() });
    const guidesSection = () => ({ id: 'guides', title: 'Guides', type: 'cards', intro: "Step-by-step write-ups and how-tos I've put together.", items: guides() });

    const isGuides = sec => sec.id === 'guides';
    const isTutorialsCard = it => /(^|\/)tutorials\.html/.test(it.href || '');
    const hasNewTree = data => data.some(s => s.type === 'cards' && (s.items || []).some(it => /(^|\/)creating\.html/.test(it.href || '')));

    function normalize(data) {
        if (!Array.isArray(data)) data = [];
        if (!hasNewTree(data)) {
            // an older list of link categories: swap its cards for the new groups, keep every other section (Quick Links…)
            const rest = data.filter(s => !(s.type === 'cards' && !isGuides(s)));
            data = [savedSection(), topicsSection()].concat(rest);
        }
        data.forEach(s => {
            if (s.type !== 'cards') return;
            s.items = (s.items || []).filter(it => !isTutorialsCard(it));
        });
        if (!data.some(isGuides)) data.push(guidesSection());
        return data;
    }

    return { normalize, isGuides };
})();
