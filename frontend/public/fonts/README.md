# Coptic Font Setup Instructions

## Where to Place the Coptic Font File

To enable Coptic text display in the hymns library, please follow these steps:

### 1. Font File Location

Place your Coptic font file (`.ttf` format) in the following location:

```
frontend/public/fonts/coptic-font.ttf
```

### 2. File Structure

Your `frontend/public/fonts/` directory should look like this:

```
frontend/public/fonts/
├── README.md (this file)
└── coptic-font.ttf (your Coptic font file)
```

### 3. Font Requirements

- **Format**: TrueType Font (`.ttf`)
- **Name**: The file should be named exactly `coptic-font.ttf`
- **Characters**: Should include Coptic Unicode characters (U+2C80-U+2CFF)

### 4. CSS Integration

The font is already integrated into the CSS system. The following classes will automatically use the Coptic font:

- `.coptic-text` - For general Coptic text display
- `.coptic-input` - For Coptic text input fields
- `.hymn-lyrics` - For hymn lyrics display

### 5. Fallback Support

If the Coptic font is not available, the system will automatically fall back to:

1. Times New Roman
2. Serif fonts
3. System default fonts

### 6. Testing

After placing the font file, you can test it by:

1. Starting the frontend application
2. Navigating to the Hymns Library
3. Adding or editing a hymn with Coptic lyrics
4. The Coptic text should display using your custom font

### 7. Browser Support

The Coptic font will work in all modern browsers that support:

- `@font-face` CSS rule
- TrueType font format
- Unicode Coptic characters

### 8. Troubleshooting

If the Coptic font is not displaying correctly:

1. Check that the file is named exactly `coptic-font.ttf`
2. Verify the file is in the correct location: `frontend/public/fonts/`
3. Ensure the font file is not corrupted
4. Check browser developer tools for any font loading errors
5. Try refreshing the page with a hard reload (Ctrl+F5)

### 9. Alternative Font Sources

If you don't have a Coptic font file, you can find free Coptic fonts online:

- Google Fonts (if available)
- Coptic font repositories
- Academic institutions with Coptic studies programs

### 10. Performance Note

The font will be loaded once and cached by the browser for optimal performance.
