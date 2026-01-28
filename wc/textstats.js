// Elements
const textInput = document.getElementById('textInput');
const charCount = document.getElementById('charCount');
const charNoSpaces = document.getElementById('charNoSpaces');
const wordCount = document.getElementById('wordCount');
const sentenceCount = document.getElementById('sentenceCount');
const paragraphCount = document.getElementById('paragraphCount');
const lineCount = document.getElementById('lineCount');
const readingTime = document.getElementById('readingTime');
const speakingTime = document.getElementById('speakingTime');
const clearBtn = document.getElementById('clearBtn');
const copyBtn = document.getElementById('copyBtn');
const clearStorageBtn = document.getElementById('clearStorageBtn');

// Load saved text
const savedText = localStorage.getItem('textStatsContent');
if (savedText) {
    textInput.value = savedText;
}

// Calculate statistics
function calculateStats() {
    const text = textInput.value;
    
    // Auto-save to localStorage
    localStorage.setItem('textStatsContent', text);
    
    // Character count
    const chars = text.length;
    charCount.textContent = chars.toLocaleString();
    
    // Characters without spaces
    const charsNoSpaces = text.replace(/\s/g, '').length;
    charNoSpaces.textContent = charsNoSpaces.toLocaleString();
    
    // Word count
    const words = text.trim().length === 0 ? 0 : text.trim().split(/\s+/).length;
    wordCount.textContent = words.toLocaleString();
    
    // Sentence count (approximate - counts periods, exclamation marks, question marks)
    const sentences = text.trim().length === 0 ? 0 : 
        text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    sentenceCount.textContent = sentences.toLocaleString();
    
    // Paragraph count (separated by one or more blank lines)
    const paragraphs = text.trim().length === 0 ? 0 : 
        text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;
    paragraphCount.textContent = paragraphs.toLocaleString();
    
    // Line count
    const lines = text.trim().length === 0 ? 0 : text.split('\n').length;
    lineCount.textContent = lines.toLocaleString();
    
    // Reading time (average reading speed: 200-250 words per minute)
    const readingMinutes = words === 0 ? 0 : Math.ceil(words / 200);
    readingTime.textContent = readingMinutes;
    
    // Speaking time (average speaking speed: 125-150 words per minute)
    const speakingMinutes = words === 0 ? 0 : Math.ceil(words / 130);
    speakingTime.textContent = speakingMinutes;
}

// Clear text
function clearText() {
    if (textInput.value.length === 0) return;
    
    if (confirm('Clear all text?')) {
        textInput.value = '';
        localStorage.removeItem('textStatsContent');
        calculateStats();
        textInput.focus();
    }
}

// Clear saved text from storage
function clearStorage() {
    if (confirm('Clear saved text from browser storage?')) {
        localStorage.removeItem('textStatsContent');
        textInput.value = '';
        calculateStats();
    }
}

// Copy stats to clipboard
function copyStats() {
    const stats = `Text Statistics:
━━━━━━━━━━━━━━━━━━━━━━
Characters: ${charCount.textContent}
Characters (no spaces): ${charNoSpaces.textContent}
Words: ${wordCount.textContent}
Sentences: ${sentenceCount.textContent}
Paragraphs: ${paragraphCount.textContent}
Lines: ${lineCount.textContent}
Reading Time: ${readingTime.textContent} min
Speaking Time: ${speakingTime.textContent} min`;
    
    navigator.clipboard.writeText(stats).then(() => {
        const originalText = copyBtn.textContent;
        copyBtn.textContent = 'Copied!';
        copyBtn.style.background = '#4CAF50';
        setTimeout(() => {
            copyBtn.textContent = originalText;
            copyBtn.style.background = '';
        }, 2000);
    });
}

// Event listeners
textInput.addEventListener('input', calculateStats);
clearBtn.addEventListener('click', clearText);
copyBtn.addEventListener('click', copyStats);
clearStorageBtn.addEventListener('click', clearStorage);

// Initialize
calculateStats();
