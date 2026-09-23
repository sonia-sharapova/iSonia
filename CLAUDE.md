# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

iSonia is Sonia's personal website (soniapolis.com): a static multi-page HTML/CSS/vanilla-JS site with a small PHP admin backend for in-place content editing. There is no build step or framework for the site itself — pages are plain HTML that fetch JSON data files client-side. The one exception is `projects/synth-app/`, a standalone Vite+React subproject.

## Commands

**Run the site locally** (plain static server, no build needed):
```bash
python3 -m http.server 3000
```
(This matches the `iSonia` launch config in `.claude/launch.json`.) PHP admin endpoints (`admin/*.php`) need a PHP-capable server to actually work — `php -S localhost:3000` — the Python server will serve the HTML/JS/CSS but 404 on `.php` requests.

**`projects/synth-app/`** — separate Vite/React/Tailwind app, its own toolchain:
```bash
cd projects/synth-app
npm run dev      # dev server
npm run build    # production build
npm run lint     # eslint
```

**Deployment**: no CI. Deploys are manual, via `rsync` to the production server, e.g.:
```bash
rsync -avz root@soniapolis.com:/var/www/iSonia/images/photos/ ./images/photos/
```
`images/`, `data/backups/`, and `creations/blogs/backups/` are gitignored — they're managed directly on the server, not synced through git.

## Architecture

### Content is data-file-driven, edited through an admin panel

Editable content (books, movies, music, photo albums, blog posts, resource links) lives in JSON/Markdown under `data/` and `creations/blogs/`, not hardcoded in HTML. Pages `fetch()` these files at load time. Content is edited via a single-admin, session-authenticated PHP backend in `admin/`:

- `admin/login.php` verifies a password against `ADMIN_PASSWORD_HASH` (defined in the gitignored `admin/config.local.php`, generated once by the now-removed `setup.php`) and sets `$_SESSION['admin']`.
- `admin/check-session.php` + top-level `scripts/admin.js` (loaded on ~29 pages site-wide; injects the "ADMIN LOGIN/LOGOUT (moi)" link into `#admin-link-area`/`#admin-link-mobile`) show admin state. `scripts/siteStyle/admin.js` does not exist, despite older notes here referencing it.
- Each `admin/save-*.php` (`save-albums`, `save-books`, `save-movies`, `save-music`, `save-blog`, `save-resource-md`, `save-resources`, `save-art-categories`) requires `$_SESSION['admin']`, then **backs up the existing file** (timestamped copy into a `backups/` subfolder) before overwriting it with the POSTed content. This backup-then-overwrite pattern is consistent across all save endpoints — follow it if adding a new one.
- `admin/upload-image.php` handles image uploads for books/movies/music/albums (mime-type validated: jpeg/png/gif/webp).

### Blog system

`creations/blogs/*.md` are the source of truth, each with YAML frontmatter (`title`, `date`, `readTime`). `admin/list-posts.php` (read) and `admin/save-blog.php` (write) both parse frontmatter and regenerate `data/posts.json` (title/date/excerpt index) from the `.md` files on every save. `creations/blogs/entry.html` renders an individual post client-side with `marked.js` (loaded from CDN).

### Resources archive — two systems, only one is live

- **Live system**: `navigation/resources/markdown/*.md` (one file per category: general, media, music, opensource, technology) are rendered client-side by `navigation/resources/links.js` into `navigation/resources/{category}.html`. Edited via `admin/save-resource-md.php`, which writes directly back into `navigation/resources/markdown/` (or `navigation/learning/markdown/` for a Guides page — `links.js` sends `dir`).
- **Two mirrored groups, one hub.** `data/resources.json` (server-managed, not in git) holds the hub's card sections, and `navigation/resources/hub-data.js` is what every page normalizes it through: **Saved Links** (id `cat`, formerly "Categories" → `navigation/resources/*.html`) and **Guides** (id `guides` → `navigation/learning/*.html`: web-design, algorithms, machine-learning, hpc, privacy). Guide pages use the very same three-column tree (`links.js` reads its group from the page's folder), and a `##` section in a guide's markdown is its secondary navigation (e.g. HTML / CSS / Projects under Web Design Tutorials). `navigation/resources.html` shows only Saved Links, followed by an "Interested in learning more from me?" card linking to `learning.html`; `navigation/learning.html` (the LEARNING nav item) shows just Guides. Both are thin pages over `resources/hub.js` + `hub.css`, with `<body data-hub="guides">` limiting the Learning one. Guide content ships as `navigation/learning/seed/*.md` until it is first edited.
- **Topic trees (Resources).** The hub's `cat` group is **Categories** (Create, Consume, Explore, Learn) and its `topics` group is **By Topic** (Tech = `technology.html`, Open Source, Community = `get-involved.html`, Career Resources = `careers.html`, Misc.); `hub-data.js` swaps an older saved list for these when it lacks a `creating` + `careers` card. The hub shows them as plain icon tiles in the site's Optima style (four per row, five for By Topic; the Categories group has no heading, and a "More" block below links to the Learning page): icon + title, then the card's `bullets` (or its `desc`), and on hover the tile slides right, turns green and shows an arrow (`hub.js` `renderCards`/`HUB_ICONS`, `hub.css`). Each tile opens a four-level tree at 80% of the content width: the page title is the tile's title, column 1 lists its **Topics** with the open topic's **Sections** nested under it, column 2 lists the selected section's **sub-sections** (`###`; the column is left out when it has none), column 3 shows the links — all the section's, or just the chosen sub-section's (hash `#topic/section/sub-section`). On phones the sections come back as their own row of chips. In the markdown that is `# Topic` / `## Section` / `### header` (a `# Topic` line is optional — pages without one, i.e. Guides and the older link pages, keep the category-list → sections → links layout; `TOPIC_PAGES` in `links.js` lists the topic pages). The seed content for these pages (`navigation/resources/seed/{creating,consuming,exploring,learning,misc,technology,open-source,get-involved,careers}.md`) was generated by regrouping the older `docs/organized/markdown/*.md` sections; links can appear on more than one page.
- **Legacy/inactive system**: `scripts/resources/archiveBuild.js` is a Node script that converts markdown into `archiveData/content.json` + `structure.json` for a small React app (`scripts/resources/archiveMain.js` + `archiveComponents.js`, React loaded globally, not bundled). It reads from `scripts/archiveContent/`, which does not exist in this repo — this pipeline is not wired up to the admin backend and isn't the one actually serving the site. Don't extend it without first confirming with the user whether it's meant to be revived.

### `misc/` is a superseded old copy of the site

`misc/` (home, about, resources, projects, photos, tools, articles, hardware, landing) is an earlier version of the whole site, not linked from current navigation (`index.html`'s nav points at `navigation/`, `creations/`, `personal/`, `photos.html`). Treat it as historical reference, not something to edit alongside the current pages.

### Design

No CSS custom-property/design-token system — values are hardcoded per stylesheet. `styles/stylesheet.css` is the shared base (Optima font, `#f5f5f5` background, `#666` muted text, minimalist look); page/section-specific styles are split into their own files (`homepage.css`, `gallery.css`, `blogs.css`, `categories.css`, `clock.css`, `lessons.css`, `landing.css`) and included per page rather than through one global sheet.

**Shared page-title + content pattern.** Every top-level page (Photos, Projects, Blogging, Art, About, Portfolio, …) uses the same skeleton, all defined once in `styles/stylesheet.css`:

```html
<div class="title-container">
  <div class="nav-links">...SEE: writing / photography / art...</div>
  <h1 class="page-title">Page Name</h1>
  <hr>
</div>

<div class="content">
  ...page-specific content...
</div>
```

`.title-container` and `.content` (`.container` is an older equivalent, still used by a couple of pages) both resolve to `width: 80%; margin: 0 auto; box-sizing: border-box;`, and both get capped to `max-width: 1200px` on screens ≥1500px wide (see the `@media (min-width: 1500px)` block in `styles/stylesheet.css`). A page's own stylesheet/inline `<style>` may add to `.content` (flex/grid direction, gap, inner padding) but must not redeclare `width` or the left/right `margin` — doing so, or inventing a page-specific wrapper class instead of reusing `.content`, breaks alignment with `.title-container` and (worse, since it's easy to miss below ~1500px) drifts wider than the title on large screens. `photos.html` had exactly this bug via a bespoke `.photos-wrap` class before it was renamed to `.content`. A live visual reference for this pattern lives at `navigation/styleguide.html`.

**Content starts where the title starts.** The page's first content element sits flush with the title's left edge and the `.content` box ends at its right edge — no extra side inset or narrower/wider inner box (the old `padding: 0 20px` on `.content.has-sidebar`, blogs.css's `.content`, the resources tree, About's 60% card and the portfolio's 90% panel were all removed for this). Measuring title vs. `.content` vs. first child at ~1385px on every page is how to confirm it.

Every page in this pattern should also have the `<hr>` title-underline — `blogs.html` and `art.html` were both missing it until this was written up.

**Shared sidebar pattern.** Pages with a left nav column (Photos, Blogging, Art, the personal archive pages, and the Resources tree) add `class="has-sidebar"` to `.content` and `class="sidebar"` to the nav column, both defined once in `styles/stylesheet.css` (`.content.has-sidebar`, `.sidebar`, `.sidebar-link` — shared with the Resources tree's `.res-link`). Every sidebar has the same two-part anatomy, so its position and rhythm match across pages: a first `.sidebar-section` holding the one general tab ("All Posts", "All Photos", "Highlights", "See All"), then a second `.sidebar-section` with an `<h3 class="sidebar-title">` (the horizontal rule) and the specific tabs ("Highlights" on Blogs, "Albums", "Categories", "Archives"). Pages should not redefine these — a page-specific main-content wrapper (e.g. `.archive-main`, `.art-main`, `.photos-main`) only ever adds `flex: 1; min-width: 0;`, never its own width/margin. Below 768px the shared rule hides `.sidebar` entirely — a page whose sidebar is the *only* way to switch content (like `art.html`'s single-section-at-a-time view) needs its own `body.m2.p-<page> .sidebar` override in `styles/mobile.css` to keep it visible there instead, reflowed into something that fits a phone width (see the `p-art` block for the pattern: a wrapped row of chip-style links).

`personal/physical-collections.html` and its six collection pages — `movies.html`, `music.html`, `books.html`, `anime.html`, `electronics.html`, `cards.html` — all carry exactly this sidebar ("See All" / Movies / Music / Books / Anime / Electronics / Pokémon Cards), with the current page's link carrying `class="sidebar-link active"` — same component as Photos' album list or Blogs' "All Posts", not a separate nav row, so it's copied into all seven pages and a new collection goes in each. On phones `styles/mobile.css` keeps it visible as a chip row (like `p-art`). `physical-collections.html` is the "See All" landing page (description + a plain link list into each collection). `archives.html` (Media Archives) is an older, separate hub with no sidebar links from the detail pages. Every collection except Pokémon Cards is admin-editable the same way: `data/<name>.json` + `admin/save-<name>.php` + an `upload-image.php` type. `cards.html` nests its own pre-existing `.cards-nav` tab bar (about/collection/rare/trainers/project) inside this sidebar's main column; the two are independent navigation levels (which archive vs. which tab within Pokémon Cards).

**Top nav active-page highlighting.** The fixed `.navigation` bar (HOME/PROJECTS/RESOURCES/LEARNING/ABOUT) marks the current page's item with `aria-current="page"` — styled via `.nav-item[aria-current="page"]` in `styles/stylesheet.css` (green text + underline; mobile has its own version in `styles/mobile.css`). Since only 5 items exist, pages without a literal 1:1 match highlight the umbrella section they belong to: `creations/projects.html` (the umbrella), `creations/interactive.html`, `creations/games.html`, all of `navigation/portfolio/*` and the standalone `projects/*` demo pages → **PROJECTS**. The pages reached through the SEE: row — `creations/blogs.html` + `blogs/entry.html` (writing), `photos.html` (photography), `creations/art.html` (art), all of `personal/*` (archive) — highlight their own **SEE: tab** instead (`aria-current="page"` on that `.sub-nav-item`, green + underlined) and carry no top-nav highlight; `navigation/resources.html` + all of `navigation/resources/*` → **RESOURCES**; `navigation/learning.html` + the `learning/web/*` tutorial pages → **LEARNING**. Pages with no natural section carry no `aria-current` at all rather than a forced/incorrect one — every page previously had `aria-current="page"` hardcoded onto HOME from copy-paste, which was the bug this fixed.

### Navigation map

- `index.html` — home
- `navigation/about.html`, `navigation/contact.html` — about/contact
- `creations/projects.html` — the **Projects** umbrella (the PROJECTS nav item; there is no separate PORTFOLIO item any more): two sections, Interactive Projects and Portfolio, each a header, a "See all" link and a plain link list. The interactive list is hand-copied from the cards in `creations/interactive.html` (the full thumbnail grid, whose "BACK TO ALL PROJECTS" links the `projects/*` demos use), so a new interactive project goes in both. Projects are grouped under their category (Webcam Fun / Creative / Tools / Games / Misc.) as a header with a line under it — on both pages — rather than tagged on every card; the mobile filter chips hide whole groups by `data-category`.
- `navigation/portfolio.html` — just redirects to `navigation/portfolio/imaging.html` (the Portfolio "See all" target). Each portfolio project is its own static page in `navigation/portfolio/` (`imaging`, `tracing`, `nn`, `os`, `web`, `resume`) so a refresh keeps you on that project; they share `portfolio.css`/`portfolio.js` and repeat the topic list, so adding a project means a new page + a `<li>` in every page's list
- `navigation/resources.html` + `navigation/resources/*` — curated links archive (see above)
- `navigation/learning.html` + `navigation/learning/*.html` — the LEARNING top-nav page: the Guides hub and its category pages (see the Resources section above; there is no longer a single Guides & Tutorials category)
- `creations/blogs.html`, `creations/games.html`, `creations/art.html` — creative work sections (`creations/tutorials.html` just redirects to `navigation/resources/tutorials.html`)
- `photos.html` — photo galleries (backed by `data/albums.json`)
- `personal/physical-collections.html` — "See All" landing page for the collections (`personal/archives.html` is an older Media Archives hub); `personal/music.html`, `personal/movies.html`, `personal/books.html`, `personal/cards.html` — personal favorites/collections (backed by their respective `data/*.json`); `personal/anime.html`, `personal/electronics.html` — same gallery + preview layout as movies (electronics started as a copy of anime; `data/electronics.json` is created by its first admin save)
- `projects/` — standalone interactive projects (camera/ASCII effects, dots, bezier, screenshot garden, the synth app)
- `game/` — misc interactive experiments, not part of main nav flow; `learning/` — course/tutorial pages, linked from the Learning page
