# Editor Quick Reference

## 🚀 Quick Start (5 minutes)

1. Open `generate-hash.html` → Enter password → Copy hash
2. Edit `editor.html` line 144: Paste your hash
3. Edit `save.php` line 8: Paste your hash
4. Upload files to server
5. Create folder: `resources/markdown/backups/`
6. Delete `generate-hash.html`
7. Done! Visit `yoursite.com/navigation/editor.html`

## 🔑 Files & Locations

```
navigation/
├── editor.html              ← Main editor
├── save.php                ← Backend handler
└── resources/
    └── markdown/
        ├── backups/        ← Auto-created backups
        ├── general.md
        ├── media.md
        ├── music.md
        ├── opensource.md
        ├── technology.md
        └── web.md
```

## 💾 Keyboard Shortcuts

- `Ctrl/Cmd + S` - Save current file
- `Ctrl/Cmd + Shift + S` - Save all files
- `Ctrl/Cmd + E` - Toggle edit/preview focus
- `Tab` - Indent in editor
- `Shift + Tab` - Outdent in editor

## 🎯 Common Tasks

### Add a New Resource

```markdown
## Category Name

- **Site Name**: Description here
  - https://example.com
```

### Create New Category

```markdown
## New Category Name

### Optional Subcategory

- **Resource**: Description
  - https://link.com
```

### Reorder Resources

Just cut and paste in the editor!

## ⚠️ Important Notes

✅ DO:

- Keep backups enabled
- Use strong password
- Log out when done
- Check preview before saving
- Save regularly

❌ DON'T:

- Share your password
- Leave editor open unattended
- Delete backup folder
- Edit files directly on server (use editor)
- Keep `generate-hash.html` on server

## 🔒 Security Checklist

- [ ] Strong password set (12+ characters)
- [ ] Hash updated in both files
- [ ] `generate-hash.html` deleted
- [ ] Backups folder created
- [ ] Correct file permissions
- [ ] HTTPS enabled on site
- [ ] Only you have password

## 🆘 Emergency Recovery

**If you get locked out:**

1. Re-upload fresh `generate-hash.html`
2. Generate new hash
3. Update both files
4. Delete generator again

**If file gets corrupted:**

1. Go to `resources/markdown/backups/`
2. Find `filename_TIMESTAMP.md`
3. Copy content
4. Paste in editor
5. Save

## 📱 Access URLs

**Editor:** `https://yoursite.com/navigation/editor.html`
**Live Site:** `https://yoursite.com/navigation/resources/web.html`

## 🎨 Markdown Cheat Sheet

```markdown
## Heading 2 (Category)
### Heading 3 (Subcategory)

- **Bold**: Description
  - https://link.com

*italic* or _italic_
**bold** or __bold__
[Link Text](https://url.com)
```

## 💡 Pro Tips

1. **Preview Everything** - Always check preview pane
2. **Save Often** - Changes saved to session until you click Save
3. **Use Search** - Browser's Ctrl+F works in editor
4. **Backup Before Major Changes** - Manual backup via copy-paste
5. **Test Links** - Click links in preview to verify

## 🎯 File Statistics

- general.md: ~380 lines
- media.md: ~185 lines  
- music.md: ~159 lines
- opensource.md: ~391 lines
- technology.md: ~997 lines
- web.md: ~450 lines

## 📊 Backup Info

- **Location:** `resources/markdown/backups/`
- **Format:** `filename_YYYY-MM-DD_HH-MM-SS.md`
- **Retention:** Last 10 versions per file
- **Automatic:** On every save

## ⚡ Performance Tips

- Editor loads all files on startup
- Preview updates as you type
- Save only writes changed files
- Backups cleaned up automatically

---

**Remember:** This editor gives you direct control over your resource files. With great power comes great responsibility - always preview before saving!
