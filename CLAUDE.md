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
- `admin/check-session.php` + `scripts/siteStyle/admin.js` inject an "ADMIN LOGIN/LOGOUT" link into every page's sidebar based on session state.
- Each `admin/save-*.php` (`save-albums`, `save-books`, `save-movies`, `save-music`, `save-blog`, `save-resource-md`, `save-resources`) requires `$_SESSION['admin']`, then **backs up the existing file** (timestamped copy into a `backups/` subfolder) before overwriting it with the POSTed content. This backup-then-overwrite pattern is consistent across all save endpoints — follow it if adding a new one.
- `admin/upload-image.php` handles image uploads for books/movies/music/albums (mime-type validated: jpeg/png/gif/webp).

### Blog system

`creations/blogs/*.md` are the source of truth, each with YAML frontmatter (`title`, `date`, `readTime`). `admin/list-posts.php` (read) and `admin/save-blog.php` (write) both parse frontmatter and regenerate `data/posts.json` (title/date/excerpt index) from the `.md` files on every save. `creations/blogs/entry.html` renders an individual post client-side with `marked.js` (loaded from CDN).

### Resources archive — two systems, only one is live

- **Live system**: `navigation/resources/markdown/*.md` (one file per category: general, media, music, opensource, technology) are rendered client-side by `navigation/resources/links.js` into `navigation/resources/{category}.html`. Edited via `admin/save-resource-md.php`, which writes directly back into `navigation/resources/markdown/`.
- **Legacy/inactive system**: `scripts/resources/archiveBuild.js` is a Node script that converts markdown into `archiveData/content.json` + `structure.json` for a small React app (`scripts/resources/archiveMain.js` + `archiveComponents.js`, React loaded globally, not bundled). It reads from `scripts/archiveContent/`, which does not exist in this repo — this pipeline is not wired up to the admin backend and isn't the one actually serving the site. Don't extend it without first confirming with the user whether it's meant to be revived.

### `misc/` is a superseded old copy of the site

`misc/` (home, about, resources, projects, photos, tools, articles, hardware, landing) is an earlier version of the whole site, not linked from current navigation (`index.html`'s nav points at `navigation/`, `creations/`, `personal/`, `photos.html`). Treat it as historical reference, not something to edit alongside the current pages.

### Design

No CSS custom-property/design-token system — values are hardcoded per stylesheet. `styles/stylesheet.css` is the shared base (Optima font, `#f5f5f5` background, `#666` muted text, minimalist look); page/section-specific styles are split into their own files (`homepage.css`, `gallery.css`, `blogs.css`, `categories.css`, `clock.css`, `lessons.css`, `landing.css`) and included per page rather than through one global sheet.

### Navigation map

- `index.html` — home
- `navigation/portfolio.html`, `navigation/about.html`, `navigation/contact.html` — about/portfolio/contact
- `navigation/resources.html` + `navigation/resources/*` — curated links archive (see above)
- `creations/projects.html`, `creations/blogs.html`, `creations/tutorials.html`, `creations/games.html`, `creations/art.html` — creative work sections
- `photos.html` — photo galleries (backed by `data/albums.json`)
- `personal/music.html`, `personal/movies.html`, `personal/books.html`, `personal/cards.html` — personal favorites/collections (backed by their respective `data/*.json`)
- `projects/` — standalone interactive projects (camera/ASCII effects, dots, bezier, screenshot garden, the synth app)
- `game/`, `learning/` — misc interactive experiments and course/learning notes, not part of main nav flow
