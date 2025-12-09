# Resources Archive

This is the resources section of Sonia's website, organized into categories with markdown files for easy editing.

## Structure

```
resources/
├── markdown/              # All markdown content files
│   ├── general.md        # Search engines, guides, archives, tools
│   ├── media.md          # Movies, videos, influential people
│   ├── music.md          # Music archives, tutorials, community
│   ├── opensource.md     # Free software, privacy tools, torrents
│   └── technology.md     # Programming, web dev, career resources
│
├── general.html          # General resources page
├── media.html            # Media resources page  
├── music.html            # Music resources page
├── opensource.html       # Open source resources page
└── technology.html       # Technology resources page
```

## How to Edit

1. **To add or update resources**: Edit the corresponding `.md` file in the `resources/markdown/` directory
2. **Markdown format**: Each resource follows this structure:
   ```markdown
   ## Category Name
   
   ### Subcategory (optional)
   - **Resource Name**: Description
     - https://url.com
   ```

3. **After editing**: The HTML pages will automatically render the updated markdown

## Categories

### General Resources
- Alternative search engines
- Search specific media
- Guides & how-tos
- Useful tools and info
- Archives and collections
- Personal blogs and sites

### Media Resources
- Influential people (nerds and philosophers)
- Full movies
- Cool, funny, and music videos
- Tutorial videos

### Music & Audio
- Music collections and archives
- Community platforms
- General music tools
- Tutorials and info

### OpenSource & FreeWare
- Community resources
- Free media (books, music, photos)
- Open source software
- Privacy and security tools
- Streaming and torrents

### Technology
- AI, cryptography, emulators
- Hardware and internet resources
- Math and OS guides
- Career resources (interview prep, job boards)
- Coding projects
- Programming resources
- Web design and development

## Adding New Categories

1. Create a new markdown file in `resources/markdown/`
2. Copy one of the existing HTML files and update:
   - The title
   - The markdown fetch path
3. Add the new category to the main resources.html page

## Notes

- Links are periodically checked but some may become outdated
- All markdown files use consistent formatting for easy parsing
- The design follows the site's minimalist aesthetic
- Mobile-responsive styling is included
