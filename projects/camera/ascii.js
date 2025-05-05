// ASCII utility functions - simplified for reliability
console.log('Loading ASCII Utils...');

// Create the global object immediately to ensure it exists
window.AsciiUtils = {};

// Define the character sets as part of the AsciiUtils object
window.AsciiUtils.ASCII_CHARS = {
    'low': [' ', '.', ':', '+', '#'],  // Minimal set with fewer characters
    'normal': [' ', '.', ':', '+', '#', '@'],  // Balanced set
    'high': [' ', '.', ':', '+', '#', '%', '&', '*', '^', '$', '?', '@']  // Full detailed set with all characters
};

// Define the color schemes
window.AsciiUtils.COLOR_SCHEMES = {
    'default': {
        backgroundColor: 'black',
        textColor: 'white'
    },
    'matrix': {
        backgroundColor: 'black',
        textColor: '#0F0' // Matrix green
    },
    'retro': {
        backgroundColor: '#331800',
        textColor: '#FFAA00'
    },
    'shadow': {
        backgroundColor: '#222',
        textColor: '#AAA'
    }
};

// Get ASCII characters based on contrast level
window.AsciiUtils.getAsciiChars = function(contrastLevel) {
    console.log('Getting ASCII chars for:', contrastLevel);
    return window.AsciiUtils.ASCII_CHARS[contrastLevel] || window.AsciiUtils.ASCII_CHARS['normal'];
};

// Get color scheme
window.AsciiUtils.getColorScheme = function(scheme) {
    console.log('Getting color scheme for:', scheme);
    return window.AsciiUtils.COLOR_SCHEMES[scheme] || window.AsciiUtils.COLOR_SCHEMES['default'];
};

// Save ASCII art
window.AsciiUtils.saveAsciiArt = function(canvas, format) {
    console.log('Saving ASCII art as:', format);
    if (format === 'image' && canvas) {
        try {
            const link = document.createElement('a');
            link.download = 'ascii-art.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (error) {
            console.error('Error saving ASCII art:', error);
            alert('Error saving image: ' + error.message);
        }
    }
};

// Test the utilities to make sure they're working
console.log('ASCII Utils loaded and ready!');
console.log('Test - Low contrast chars:', window.AsciiUtils.getAsciiChars('low').length, 'characters');
console.log('Test - Matrix colors:', window.AsciiUtils.getColorScheme('matrix'));