## My Personal Website (iSonia, aka soniapolis.com)

### Folder Structure

```
iSonia/
├── archiveContent/           # Markdown content files 
│   ├── people.md             # Each category has its own markdown file
│   ├── videos.md
│   └── ...
├── archiveData/              # Generated JSON data
│   └── content.json          # Combined content from all markdown files
├── images/                   # Image assets
├── personal/
│   └── resources.html        # Resources page with archive interface
├── scripts/
│   ├── archiveBuild.js       # Markdown to JSON converter
│   ├── archiveComponents.js  # Reusable React components
│   └── archiveMain.js        # Main application logic
├── styles/
│   ├── stylesheet.css/
│   └── landing.css
├── package.json              # Dependencies and scripts
└── index.html

```

## Archiving
(/resources.html)

A modular, markdown-based content management system for the website. This system allows you to manage content in simple markdown files while automatically generating the necessary JSON data for display in the React-based archive interface.

### Overall Architecture
Instead of storing all content directly in the JavaScript file, the data is stored content in markdown files.
This archive module follows a clear separation of concerns:
- **Content**: Stored as markdown files in `archiveContent/` 
- **Data**: Generated JSON files in `archiveData/`
- **Presentation**: React components in `scripts/`
  
### Maintenance:
- Creates a build process that converts markdown to JSON
- Loads this JSON data dynamically in your React components

### Build Process
Build script that:
- Reads all markdown files
- Parses their front matter and content
- Generates a structured JSON file that your React app can consume


1. **Installation**

```bash
# Install dependencies
npm install
```

2. **Build Content**

```bash
# Process markdown files into JSON
npm run build
```

3. **Development Mode**

```bash
# Watch for changes in markdown files and rebuild automatically
npm run watch
```

### Content

Content is written in markdown files with a simple structure:

```markdown
---
title: CATEGORY TITLE
id: category-id
image: ../path/to/image.jpg
---

## Section Name {#section-id}
**Role**: Section role or description
**Image**: ../path/to/section-image.jpg

### Item Name {#item-id}
**Image**: ../path/to/item-image.jpg
**Category**: Item category
**Description**: Short description
**VideoUrl**: https://youtube.com/watch?v=example (optional)

Additional content goes here...

### Another Item {#another-id}
...
```

#### Content Rules

- Use `##` for main sections and `###` for items
- Add `{#id}` after headings to define IDs
- Use `**Key**: Value` format for metadata
- Standard markdown links: `[text](url)`
- Regular paragraph text for longer descriptions

### How It Works

1. `archiveBuild.js` reads all markdown files in the `archiveContent/` directory
2. It parses the front matter and hierarchical structure
3. Links and formatting are converted to HTML
4. The result is saved as JSON in `archiveData/content.json`
5. React components in the resources page load and display this JSON data

### Components

- **FileItem**: Displays a folder/file in the navigation tree
- **ContentDisplay**: Shows the selected item's details
- **ArchiveApp**: Main application that loads data and manages state

### Responsive Design

The archive interface is fully responsive:
- Desktop: Side-by-side navigation and content
- Mobile: Stacked layout with navigation above content

### Customization

- **Styles**: Edit the CSS in `styles/stylesheet.css`
- **Icons**: Replace or modify icons in `images/icons/`
- **Components**: Modify React components in `scripts/archiveComponents.js`

### Adding New Categories

1. Create a new markdown file in `archiveContent/` (e.g., `books.md`)
2. Follow the content structure described above
3. Run `npm run build` to update the JSON data
4. The new category will automatically appear in the interface


