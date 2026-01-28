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

// Readability elements
const fleschScore = document.getElementById('fleschScore');
const fleschDesc = document.getElementById('fleschDesc');
const gradeLevel = document.getElementById('gradeLevel');
const gradeDesc = document.getElementById('gradeDesc');
const syllableCount = document.getElementById('syllableCount');
const avgSyllables = document.getElementById('avgSyllables');

// Load saved text
const savedText = localStorage.getItem('textStatsContent');
if (savedText) {
    textInput.value = savedText;
}

// Count syllables in a word (approximation)
function countSyllables(word) {
    word = word.toLowerCase().replace(/[^a-z]/g, '');
    if (word.length <= 2) return 1;

    // Remove silent e at end
    word = word.replace(/e$/, '');

    // Count vowel groups
    const matches = word.match(/[aeiouy]+/g);
    let count = matches ? matches.length : 1;

    // Minimum 1 syllable
    return Math.max(1, count);
}

// Get Flesch Reading Ease description
function getFleschDescription(score) {
    if (score >= 90) return 'Very Easy (5th grade)';
    if (score >= 80) return 'Easy (6th grade)';
    if (score >= 70) return 'Fairly Easy (7th grade)';
    if (score >= 60) return 'Standard (8th-9th grade)';
    if (score >= 50) return 'Fairly Difficult (10th-12th)';
    if (score >= 30) return 'Difficult (College)';
    return 'Very Difficult (Graduate)';
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
    const words = text.trim().length === 0 ? [] : text.trim().split(/\s+/);
    const wordCountNum = words.length === 1 && words[0] === '' ? 0 : words.length;
    wordCount.textContent = wordCountNum.toLocaleString();

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
    const readingMinutes = wordCountNum === 0 ? 0 : Math.ceil(wordCountNum / 200);
    readingTime.textContent = readingMinutes;

    // Speaking time (average speaking speed: 125-150 words per minute)
    const speakingMinutes = wordCountNum === 0 ? 0 : Math.ceil(wordCountNum / 130);
    speakingTime.textContent = speakingMinutes;

    // Readability calculations
    if (wordCountNum === 0 || sentences === 0) {
        fleschScore.textContent = '--';
        fleschDesc.textContent = 'Enter text to analyze';
        gradeLevel.textContent = '--';
        gradeDesc.textContent = 'Flesch-Kincaid';
        syllableCount.textContent = '0';
        avgSyllables.textContent = '0';
        return;
    }

    // Count total syllables
    let totalSyllables = 0;
    words.forEach(word => {
        totalSyllables += countSyllables(word);
    });

    syllableCount.textContent = totalSyllables.toLocaleString();

    const avgSyllablesPerWord = totalSyllables / wordCountNum;
    avgSyllables.textContent = avgSyllablesPerWord.toFixed(2);

    // Flesch Reading Ease: 206.835 - 1.015*(words/sentences) - 84.6*(syllables/words)
    const flesch = 206.835 - (1.015 * (wordCountNum / sentences)) - (84.6 * avgSyllablesPerWord);
    const fleschRounded = Math.round(Math.max(0, Math.min(100, flesch)));
    fleschScore.textContent = fleschRounded;
    fleschDesc.textContent = getFleschDescription(fleschRounded);

    // Flesch-Kincaid Grade Level: 0.39*(words/sentences) + 11.8*(syllables/words) - 15.59
    const grade = (0.39 * (wordCountNum / sentences)) + (11.8 * avgSyllablesPerWord) - 15.59;
    const gradeRounded = Math.max(0, Math.round(grade * 10) / 10);
    gradeLevel.textContent = gradeRounded.toFixed(1);
    gradeDesc.textContent = gradeRounded <= 5 ? 'Elementary' :
                            gradeRounded <= 8 ? 'Middle School' :
                            gradeRounded <= 12 ? 'High School' :
                            gradeRounded <= 16 ? 'College' : 'Graduate';
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
Speaking Time: ${speakingTime.textContent} min

Readability:
━━━━━━━━━━━━━━━━━━━━━━
Flesch Reading Ease: ${fleschScore.textContent} (${fleschDesc.textContent})
Grade Level: ${gradeLevel.textContent} (${gradeDesc.textContent})
Syllables: ${syllableCount.textContent}
Avg Syllables/Word: ${avgSyllables.textContent}`;

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
