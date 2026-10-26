// Top navigation dropdowns: hovering (or tabbing to) a HOME / PROJECTS / RESOURCES / LEARNING / ABOUT item shows
// that section's sub-pages under it. Loaded on every page with the fixed .navigation bar; it finds the items by
// their text, so the bar's markup stays as it is on each page. Desktop only — on a phone the bar is the bottom tab
// row (styles/mobile.css), which has no room for menus. Links are root-relative, so they work from any folder.
(function () {
    const MENUS = {
        HOME: [
            ['Writing', '/creations/blogs.html'],
            ['Photography', '/photos.html'],
            ['Art', '/creations/art.html'],
            ['Collections', '/personal/physical-collections.html']
        ],
        PROJECTS: [
            ['Professional', '/navigation/portfolio.html'],
            ['Interactive', '/creations/interactive.html']
        ],
        RESOURCES: [
            ['Technology Resources', '/navigation/resources.html#tech'],
            ['General Resources', '/navigation/resources.html#general'],
            ['Archives', '/navigation/resources.html#archives']
        ],
        LEARNING: [
            ['Web Design', '/navigation/learning/web-design.html'],
            ['Algorithms', '/navigation/learning/algorithms.html'],
            ['Machine Learning', '/navigation/learning/machine-learning.html'],
            ['High Performance Computing', '/navigation/learning/hpc.html'],
            ['Privacy', '/navigation/learning/privacy.html']
        ],
        ABOUT: [
            ['About Me', '/navigation/about.html'],
            ['Resume', '/navigation/portfolio/resume.html'],
            ['Contact', '/index.html?contact=1']
        ]
    };

    const css = `
@media (hover: hover) and (min-width: 769px) {
    .nav-group { position: relative; display: flex; }
    .nav-menu {
        position: absolute; top: 100%; left: 50%;
        min-width: 170px; margin-top: 12px; padding: 8px 0;
        background: whitesmoke; border: 1px solid #ddd; border-radius: 2px;
        box-shadow: 0 6px 18px rgba(0,0,0,0.08);
        opacity: 0; visibility: hidden;
        transform: translate(-50%, -4px);
        transition: opacity 0.18s ease, transform 0.18s ease, visibility 0.18s;
        z-index: 41;
    }
    /* a bridge over the gap, so the pointer can travel from the item to its menu */
    .nav-menu::before { content: ""; position: absolute; left: 0; right: 0; top: -14px; height: 14px; }
    .nav-group:hover .nav-menu, .nav-group:focus-within .nav-menu {
        opacity: 1; visibility: visible; transform: translate(-50%, 0);
    }
    .nav-menu a {
        display: block; padding: 7px 18px; white-space: nowrap;
        font-family: 'Optima', arial, sans-serif; font-size: 15px;
        color: #555; text-decoration: none;
        transition: color 0.15s ease, padding-left 0.15s ease;
    }
    .nav-menu a:hover, .nav-menu a:focus-visible { color: #45a049; padding-left: 22px; }
}
/* elsewhere (the phone tab bar) the wrapper drops out of the layout, so each item is still the bar's own flex child */
@media not ((hover: hover) and (min-width: 769px)) { .nav-group { display: contents; } .nav-menu { display: none; } }`;

    function build() {
        const nav = document.querySelector('.navigation');
        if (!nav || nav.dataset.menus) return;
        nav.dataset.menus = '1';
        const style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);
        nav.querySelectorAll(':scope > a.nav-item').forEach(item => {
            const links = MENUS[item.textContent.trim().toUpperCase()];
            if (!links) return;
            const group = document.createElement('div');
            group.className = 'nav-group';
            item.replaceWith(group);
            group.appendChild(item);
            const menu = document.createElement('div');
            menu.className = 'nav-menu';
            links.forEach(([label, href]) => {
                const a = document.createElement('a');
                a.href = href;
                a.textContent = label;
                menu.appendChild(a);
            });
            group.appendChild(menu);
        });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
    else build();
})();
