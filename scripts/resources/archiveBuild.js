// archiveBuild.js - Converts markdown files to JSON
const fs = require('fs');
const path = require('path');

// Simple frontmatter parser
function parseFrontMatter(content) {
    const frontMatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
    const match = content.match(frontMatterRegex);

    if (!match) {
        return { data: {}, content };
    }

    const frontMatter = match[1];
    const contentWithoutFrontMatter = match[2];

    // Parse frontmatter into an object
    const data = {};
    frontMatter.split('\n').forEach(line => {
        const colonIndex = line.indexOf(':');
        if (colonIndex !== -1) {
            const key = line.slice(0, colonIndex).trim();
            const value = line.slice(colonIndex + 1).trim();
            data[key] = value;
        }
    });

    return { data, content: contentWithoutFrontMatter };
}

// Process video tags in content
function processVideoTags(text) {
    if (!text) return {
        processedText: text,
        videoEmbed: null
    };

    // Find YouTube video tags
    const videoMatch = text.match(/<youtube id="([^"]+)">([^<]+)<\/youtube>/);

    if (!videoMatch) {
        return {
            processedText: text,
            videoEmbed: null
        };
    }

    // Extract video data
    const videoEmbed = {
        type: 'youtube',
        id: videoMatch[1],
        title: videoMatch[2]
    };

    // Remove the tag from the text
    const processedText = text.replace(/<youtube id="[^"]+">([^<]+)<\/youtube>/, '');

    return {
        processedText,
        videoEmbed
    };
}

// Convert HTML-like links in description to actual HTML
function convertLinksToHTML(description) {
    if (!description) return '';

    // Convert Markdown-style links: [text](url)
    description = description.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" class="text-green-600 hover:underline">$1</a>');

    // Convert bullet points
    description = description.replace(/^- (.*)$/gm, '• $1');

    // Convert new lines to <br> tags
    description = description.replace(/\n\n/g, '<br><br>');

    return description;
}

// Simple markdown parser for our specific format
function parseMarkdownStructure(markdown) {
    const { data: metadata, content } = parseFrontMatter(markdown);

    // Split content by headings to parse the hierarchy
    const lines = content.split('\n');
    const structure = {
        title: metadata.title || '',
        id: metadata.id || '',
        image: metadata.image || '',
        items: []
    };

    let currentSection = null;
    let currentItem = null;
    let contentBuffer = [];

    // Process line by line
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Main section (## heading)
        if (line.startsWith('## ')) {
            // Save previous section if exists
            if (currentSection) {
                if (currentItem) {
                    if (contentBuffer.length > 0) {
                        const { processedText, videoEmbed } = processVideoTags(contentBuffer.join('\n').trim());
                        currentItem.description = processedText;
                        if (videoEmbed) {
                            currentItem.videoEmbed = videoEmbed;
                        }
                        contentBuffer = [];
                    }
                    currentSection.items.push(currentItem);
                    currentItem = null;
                }
                structure.items.push(currentSection);
            }

            // Extract section ID from {#id} pattern
            const idMatch = line.match(/{#([^}]+)}/);
            const id = idMatch ? idMatch[1] : '';

            // Extract name (remove {#id} part)
            const name = line.replace(/^## /, '').replace(/{#[^}]+}/, '').trim();

            currentSection = {
                id,
                name,
                items: []
            };

            currentItem = null;
            contentBuffer = [];
        }
        // Subsection (### heading)
        else if (line.startsWith('### ')) {
            // Save previous item if exists
            if (currentItem && currentSection) {
                if (contentBuffer.length > 0) {
                    const { processedText, videoEmbed } = processVideoTags(contentBuffer.join('\n').trim());
                    currentItem.description = processedText;
                    if (videoEmbed) {
                        currentItem.videoEmbed = videoEmbed;
                    }
                    contentBuffer = [];
                }
                currentSection.items.push(currentItem);
            }

            // Extract ID from {#id} pattern
            const idMatch = line.match(/{#([^}]+)}/);
            const id = idMatch ? idMatch[1] : '';

            // Extract name (remove {#id} part)
            const name = line.replace(/^### /, '').replace(/{#[^}]+}/, '').trim();

            currentItem = { id, name };
        }
        // Parse metadata lines (like **Key**: Value)
        else if (line.match(/^\*\*([^:]+)\*\*:\s*(.*)/)) {
            const match = line.match(/^\*\*([^:]+)\*\*:\s*(.*)/);
            const key = match[1].toLowerCase();
            const value = match[2].trim();

            if (key === 'video') {
                // Process video embedding tag
                const videoMatch = value.match(/<youtube id="([^"]+)">([^<]+)<\/youtube>/);
                if (videoMatch) {
                    if (currentItem) {
                        currentItem.videoEmbed = {
                            type: 'youtube',
                            id: videoMatch[1],
                            title: videoMatch[2]
                        };
                    } else if (currentSection) {
                        currentSection.videoEmbed = {
                            type: 'youtube',
                            id: videoMatch[1],
                            title: videoMatch[2]
                        };
                    }
                }
            } else {
                // Regular metadata
                if (currentItem) {
                    currentItem[key] = value;
                } else if (currentSection) {
                    currentSection[key] = value;
                }
            }
        }
        // Content lines
        else {
            contentBuffer.push(line);
        }
    }

    // Add the last section/item
    if (currentSection) {
        if (currentItem) {
            if (contentBuffer.length > 0) {
                const { processedText, videoEmbed } = processVideoTags(contentBuffer.join('\n').trim());
                currentItem.description = processedText;
                if (videoEmbed) {
                    currentItem.videoEmbed = videoEmbed;
                }
            }
            currentSection.items.push(currentItem);
        }
        structure.items.push(currentSection);
    }

    return structure;
}

// Main function to process all category files
function processCategories() {
    const contentDir = path.join(__dirname, '../archiveContent');
    const outputDir = path.join(__dirname, '../archiveData');

    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const categoryFiles = fs.readdirSync(contentDir).filter(file => file.endsWith('.md'));
    const data = {};

    for (const file of categoryFiles) {
        const filePath = path.join(contentDir, file);
        const category = path.basename(file, '.md');

        // Read file content
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const structure = parseMarkdownStructure(fileContent);

        // Process descriptions to convert links and formatting
        if (structure.items) {
            structure.items.forEach(section => {
                if (section.description) {
                    section.description = convertLinksToHTML(section.description);
                }

                if (section.items) {
                    section.items.forEach(item => {
                        if (item.description) {
                            item.description = convertLinksToHTML(item.description);
                        }
                    });
                }
            });
        }

        data[category] = structure;
    }

    // Write the combined content to a JSON file
    fs.writeFileSync(
        path.join(outputDir, 'content.json'),
        JSON.stringify(data, null, 2)
    );

    // Create a structure.json file for navigation
    const structure = Object.keys(data).map(key => ({
        id: key,
        title: data[key].title || key,
        image: data[key].image || null
    }));

    fs.writeFileSync(
        path.join(outputDir, 'structure.json'),
        JSON.stringify(structure, null, 2)
    );

    console.log('Archive content generated successfully!');
    console.log(`Processed ${Object.keys(data).length} category files.`);
}

processCategories();