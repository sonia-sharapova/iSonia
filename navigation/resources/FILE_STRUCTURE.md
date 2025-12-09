# File Structure Guide

## Complete File Tree

```
outputs/
│
├── resources.html                    # Main resources landing page
├── resource-template.html            # Template for creating new category pages
├── README.md                         # Documentation
│
└── resources/
    │
    ├── markdown/                     # ← EDIT THESE FILES TO UPDATE CONTENT
    │   ├── general.md               # 380 lines - Search engines, guides, archives
    │   ├── media.md                 # 185 lines - Movies, videos, people
    │   ├── music.md                 # 159 lines - Music archives & tutorials
    │   ├── opensource.md            # 391 lines - Free software & privacy
    │   └── technology.md            # 997 lines - Programming & web dev
    │
    ├── general.html                 # Displays general.md content
    ├── media.html                   # Displays media.md content
    ├── music.html                   # Displays music.md content
    ├── opensource.html              # Displays opensource.md content
    └── technology.html              # Displays technology.md content
```

## Quick Start

### To Update Resources:

1. Open the appropriate `.md` file in `resources/markdown/`
2. Edit using markdown syntax
3. Save the file
4. The HTML pages will automatically render your changes

### Example Edit:

```markdown
## New Category

- **Cool Site**: Description of the site
  - https://coolsite.com

- **Another Site**: Another description
  - https://anothersite.com
```

## Implementation Steps

### 1. Upload Files to Your Server

Place these files in your website's `navigation/` directory:

```
your-website/
└── navigation/
    ├── resources.html
    └── resources/
        ├── markdown/
        │   ├── general.md
        │   ├── media.md
        │   ├── music.md
        │   ├── opensource.md
        │   └── technology.md
        ├── general.html
        ├── media.html
        ├── music.html
        ├── opensource.html
        └── technology.html
```

### 2. Update Navigation Links

Make sure your main navigation points to:
- `../navigation/resources.html` (main page)
- `../navigation/resources/general.html` (category pages)

### 3. Customize

- Edit the `.md` files to add/remove/update resources
- Modify the CSS in the HTML files to match your site's style
- Add new categories by creating new `.md` files and corresponding HTML pages

## Features

✓ Clean, minimal design matching your site aesthetic
✓ Easy-to-edit markdown files
✓ Mobile responsive
✓ Fast loading with client-side markdown parsing
✓ Organized by clear categories
✓ 1,500+ curated resources

## Categories Overview

| Category | File | Resources |
|----------|------|-----------|
| General | general.md | Search engines, guides, archives, tools, blogs |
| Media | media.md | Movies, videos, influential people |
| Music | music.md | Collections, community, tutorials |
| OpenSource | opensource.md | Free software, privacy, streaming |
| Technology | technology.md | Programming, web dev, career resources |

## Maintenance

- Links should be checked periodically for dead URLs
- New resources can be added to appropriate sections
- Categories can be reorganized as needed
- Consider adding timestamps for when resources were last verified
