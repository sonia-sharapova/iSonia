# Real-Time Resources Editor - Setup Guide

## 🎯 What You've Got

A secure, real-time editor for your resources markdown files with:

- ✅ Password authentication
- ✅ Live markdown preview
- ✅ Auto-save with backups
- ✅ Session management
- ✅ Mobile-responsive interface

## 📁 Files Created

1. **editor.html** - Main editor interface
2. **save.php** - Backend save handler
3. **generate-hash.html** - Password hash generator (DELETE AFTER USE!)
4. **EDITOR_SETUP.md** - This file

## 🚀 Setup Instructions

### Step 1: Generate Your Password Hash

1. Open `generate-hash.html` in your browser
2. Enter a strong password (minimum 8 characters)
3. Click "Generate Hash"
4. Copy the generated hash

**Important:** Use a strong, unique password. This will protect your editor.

### Step 2: Update Configuration Files

**In editor.html (line ~144):**

```javascript
const PASSWORD_HASH = 'YOUR_PASSWORD_HASH_HERE';
```

Replace with:

```javascript
const PASSWORD_HASH = 'your_actual_hash_here';
```

**In save.php (line ~8):**

```php
define('PASSWORD_HASH', 'YOUR_PASSWORD_HASH_HERE');
```

Replace with:

```php
define('PASSWORD_HASH', 'your_actual_hash_here');
```

### Step 3: Upload Files to Server

Upload to your website's `navigation/` directory:

```
your-website/
└── navigation/
    ├── editor.html          ← Upload here
    ├── save.php            ← Upload here
    └── resources/
        └── markdown/
            ├── backups/    ← Create this folder (empty)
            ├── general.md
            ├── media.md
            ├── music.md
            ├── opensource.md
            ├── technology.md
            └── web.md
```

### Step 4: Set Permissions

Set proper file permissions on your server:

```bash
chmod 644 editor.html
chmod 644 save.php
chmod 755 resources/markdown/
chmod 755 resources/markdown/backups/
chmod 644 resources/markdown/*.md
```

### Step 5: Test the Editor

1. Navigate to `https://yoursite.com/navigation/editor.html`
2. Enter your password
3. Select a file from the left sidebar
4. Make an edit
5. Click "Save"

### Step 6: Security Cleanup

**CRITICAL:** Delete these files from your server:

- ❌ generate-hash.html (anyone can use this!)
- ❌ EDITOR_SETUP.md (optional, but recommended)

## 🔒 Security Features

### Authentication

- SHA-256 password hashing
- Session-based authentication
- No plain-text passwords

### File Protection

- Whitelist of allowed files
- Directory traversal prevention
- Automatic backups before save

### Backup System

- Automatic backup on every save
- Timestamped backup files
- Keeps last 10 versions per file
- Located in `resources/markdown/backups/`

## 💡 How to Use

### Logging In

1. Go to `editor.html`
2. Enter your password
3. Click "Login"

### Editing Files

1. Click a file in the left sidebar
2. Edit in the left pane
3. See live preview in the right pane
4. Click "Save" to save current file
5. Or "Save All" to save all modified files

### File Status Indicators

- **Green "Saved"** - No changes
- **Red "Unsaved changes"** - File modified

### Backups

Backups are automatically created in:
`resources/markdown/backups/filename_YYYY-MM-DD_HH-MM-SS.md`

To restore a backup:

1. Find the backup file
2. Copy its contents
3. Paste into editor
4. Save

## 🛡️ Security Best Practices

### 1. Use a Strong Password

Minimum requirements:

- At least 12 characters
- Mix of letters, numbers, symbols
- Not used anywhere else

### 2. Secure Your Server

- Use HTTPS (SSL certificate)
- Keep PHP updated
- Regular security audits

### 3. Access Control

Consider adding these to `.htaccess`:

```apache
# Restrict editor.html to your IP
<Files "editor.html">
    Order Deny,Allow
    Deny from all
    Allow from YOUR.IP.ADDRESS.HERE
</Files>

# Prevent direct access to save.php
<Files "save.php">
    Order Deny,Allow
    Deny from all
</Files>
```

### 4. Monitor Access

Check server logs regularly:

```bash
tail -f /var/log/apache2/access.log | grep editor.html
```

## 🔧 Troubleshooting

### "Failed to save" error

**Cause:** File permissions

**Solution:**

```bash
chmod 644 resources/markdown/*.md
chmod 755 resources/markdown/
```

### "Failed to load resource file"

**Cause:** Incorrect file paths

**Solution:** Check that FILES_BASE_PATH in editor.html matches your directory structure

### Preview not updating

**Cause:** Marked.js not loading

**Solution:** Check browser console for errors, ensure CDN is accessible

### Can't login

**Cause:** Hash mismatch

**Solution:** Regenerate hash and update both files

## 📱 Mobile Usage

The editor is mobile-responsive:

- File list becomes scrollable dropdown
- Editor and preview stack vertically
- Touch-friendly buttons

## ⚡ Performance

- Client-side markdown parsing (fast)
- Minimal server requests (only on save)
- Session storage (no cookies)
- Lightweight (~50KB total)

## 🎨 Customization

### Change Editor Theme

In `editor.html`, modify these styles:

```css
.editor-textarea {
  background: #1e1e1e;  /* Dark background */
  color: #d4d4d4;       /* Light text */
}
```

### Change Preview Styling

Modify `.preview-pane` styles to match your site's aesthetic.

### Add More Files

In `editor.html`, add to the `files` array:

```javascript
const files = [
  // ... existing files
  { name: 'newfile.md', lines: 100 }
];
```

And in `save.php`, add to `$allowedFiles`:

```php
$allowedFiles = [
  // ... existing files
  'newfile.md'
];
```

## 🆘 Emergency Restore

If something goes wrong:

1. Check `resources/markdown/backups/`
2. Find the latest backup before the issue
3. Copy the backup file to restore

## 📞 Support

If you encounter issues:

1. Check browser console (F12) for errors
2. Check server error logs
3. Verify file permissions
4. Confirm password hash matches in both files

## 🎉 You're All Set!

Your editor is ready to use at:
`https://yoursite.com/navigation/editor.html`

**Remember:** Delete `generate-hash.html` after setup!
