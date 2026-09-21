# Applying the new structure

The site now ships with the new tree as **seed** content (`navigation/resources/seed/*.md`), so it shows up
immediately and can be edited after logging in. Nothing on the server is overwritten by a deploy.

How each category finds its content, in order:
1. `navigation/resources/markdown/<name>.md` — what the admin editor saves (server-managed, not in git)
2. `navigation/resources/seed/<name>.md` — the starting content that ships with the site

So for the **new** categories (design, careers, software, archives, culture, ideas, life, tutorials) the seed
is used until you first edit them. For the four categories that already exist on the server
(technology, web, media, music) the old server files still win — to switch them to the new structure, either
* delete/rename those four files in `markdown/` on the server (the seed then shows and the old lists are gone), or
* `rsync` the new ones over them: `rsync -avz navigation/resources/docs/organized/markdown/{technology,web,media,music}.md root@soniapolis.com:/var/www/iSonia/navigation/resources/markdown/`

The category list itself is `data/resources.json` (server-managed). `resources.json` in this folder is the new
list (Guides & Tutorials last); until it exists on the server, the site falls back to the same list.
