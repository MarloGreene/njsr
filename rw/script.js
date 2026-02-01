// RunWritr - A writing environment with a side-scrolling ASCII companion

const editor = document.getElementById('editor');
const runnerEl = document.getElementById('runner');
const wordCountEl = document.getElementById('word-count');
const speedIndicator = document.getElementById('speed-indicator');
const starsEl = document.getElementById('stars');
const cloudsEl = document.getElementById('clouds');
const hillsEl = document.getElementById('hills');
const sceneryEl = document.getElementById('scenery');
const groundEl = document.getElementById('ground');
const modeToggle = document.getElementById('mode-toggle');
const themeToggle = document.getElementById('theme-toggle');
const vimToggle = document.getElementById('vim-toggle');
const vimIndicator = document.getElementById('vim-indicator');

// ============================================
// DISPLAY MODES: ASCII vs UNICODE
// ============================================

const CHAR_SETS = {
    ascii: {
        stars: ['.', '*', '+', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
        clouds: ['   ', '   ', '   ', '(__)', '.--.', "('\")", '   ', '   '],
        cloudBottom: { '(__)': ' \\/ ', '.--.': '(  )' },
        hills: ['_', '_', '_', '/', '\\', '^', '_', '_', 'm', 'n'],
        ground: [
            { char: '_', weight: 30 },
            { char: '.', weight: 10 },
            { char: ',', weight: 8 },
            { char: "'", weight: 5 },
            { char: '-', weight: 15 },
            { char: '=', weight: 10 },
            { char: '~', weight: 5 }
        ],
        scenery: {
            tree: '  |  \n /|\\ \n  |  ',
            bigTree: '  ^  \n /|\\ \n/|||\\\n  |  ',
            rock: 'ite. ',
            bush: ' .:. ',
            flower: '  *  ',
            flowers: ' *|* ',
            grass: ' ,,, ',
            empty: '     '
        },
        runner: {
            walk: [
                '  o  \n /|\\ \n / > ',
                '  o  \n /|\\ \n | | ',
                '  o  \n /|\\ \n < \\ ',
                '  o  \n /|\\ \n | | '
            ],
            run: [
                '  o  \n</|  \n / > ',
                '  o  \n /|> \n | | ',
                '  o  \n  |\\>\n < \\ ',
                '  o  \n<|\\ \n | | '
            ],
            sprint: [
                ' _o  \n</   \n |\\  ',
                '  o_ \n   \\>\n  /| ',
                ' \\o/ \n  |  \n /|  ',
                ' _o/ \n<|   \n  \\> '
            ],
            stumble: [
                '  o  \n /|  \n / \\ ',
                ' \\o  \n  |\\ \n / \\ ',
                '  \\o/\n   | \n  /| ',
                ' _o_ \n  |  \n / \\ ',
                '  o  \n /|\\ \n / \\ '
            ],
            jump: [
                '  o  \n /|\\ \n / \\ ',
                ' \\o/ \n  |  \n /^\\ ',
                ' \\o/ \n  |  \n     ',
                ' \\o/ \n  |  \n     ',
                ' \\o/ \n  |  \n /^\\ ',
                '  o  \n /|\\ \n / \\ '
            ],
            leap: [
                '  o  \n /|\\ \n / \\ ',
                ' \\o/ \n  |  \n /^\\ ',
                '  \\o/\n   | \n     ',
                '   \\o/\n    | \n      ',
                '    \\o/\n     | \n       ',
                '     \\o\n     /|\n       ',
                '     o \n    /|\\\n    / \\'
            ],
            victory: [
                ' \\o/ \n  |  \n / \\ ',
                ' \\o/ \n  |  \n / \\ ',
                '  o  \n /|\\ \n / \\ ',
                ' \\o/ \n  |  \n / \\ '
            ],
            // Vim normal mode - standing with clipboard
            clipboard: [
                '  o   \n /|_n \n / \\  ',
                '  o   \n /|_n \n / \\  ',
                '  o.  \n /|_n \n / \\  ',
                '  o   \n /|_n \n / \\  '
            ],
            // Vim - thinking/scanning document
            thinking: [
                '  o?  \n /|_n \n / \\  ',
                '  o   \n /|_n \n /|   ',
                '  o!  \n /|_n \n / \\  ',
                '  o   \n /|_n \n  |\\  '
            ],
            // Vim - editing action (delete/yank)
            editing: [
                '  o   \n\\|/_n \n / \\  ',
                '  o~  \n |/_n \n / \\  ',
                '  o   \n/|\\_n \n / \\  '
            ]
        }
    },
    unicode: {
        stars: ['✦', '✧', '⋆', '∘', '·', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
        clouds: ['   ', '   ', '   ', ' ☁ ', '◜◝ ', '   ', '   ', '   '],
        cloudBottom: { ' ☁ ': '   ', '◜◝ ': '◟◞ ' },
        hills: ['▁', '▁', '▁', '╱', '╲', '△', '▁', '▁', '∩', '⌒'],
        ground: [
            { char: '━', weight: 30 },
            { char: '═', weight: 20 },
            { char: '─', weight: 15 },
            { char: '▁', weight: 10 },
            { char: '▂', weight: 5 },
            { char: '·', weight: 8 },
            { char: '∙', weight: 5 }
        ],
        scenery: {
            tree: '  ●  \n ╱│╲ \n  │  ',
            bigTree: '  ◆  \n ╱│╲ \n╱███╲\n  │  ',
            rock: ' ◖◗ ',
            bush: ' ◠◡◠ ',
            flower: '  ❀  ',
            flowers: ' ✿❀✿ ',
            grass: ' ⌇⌇⌇ ',
            empty: '     '
        },
        runner: {
            walk: [
                '  ●  \n ╱│╲ \n ╱ ╲ ',
                '  ●  \n ╱│╲ \n │ │ ',
                '  ●  \n ╱│╲ \n ╲ ╱ ',
                '  ●  \n ╱│╲ \n │ │ '
            ],
            run: [
                '  ●  \n╱╱│  \n ╱ ╲ ',
                '  ●  \n ╱│╲╲\n │ │ ',
                '  ●  \n  │╲╲\n ╲ ╱ ',
                '  ●  \n╱│╲ \n │ │ '
            ],
            sprint: [
                ' ─●  \n╱╱   \n │╲  ',
                '  ●─ \n   ╲╲\n  ╱│ ',
                ' ╲●╱ \n  │  \n ╱│  ',
                ' ─●╱ \n╱│   \n  ╲╲ '
            ],
            stumble: [
                '  ●  \n ╱│  \n ╱ ╲ ',
                ' ╲●  \n  │╲ \n ╱ ╲ ',
                '  ╲●╱\n   │ \n  ╱│ ',
                ' ─●─ \n  │  \n ╱ ╲ ',
                '  ●  \n ╱│╲ \n ╱ ╲ '
            ],
            jump: [
                '  ●  \n ╱│╲ \n ╱ ╲ ',
                ' ╲●╱ \n  │  \n ╱▲╲ ',
                ' ╲●╱ \n  │  \n     ',
                ' ╲●╱ \n  │  \n     ',
                ' ╲●╱ \n  │  \n ╱▲╲ ',
                '  ●  \n ╱│╲ \n ╱ ╲ '
            ],
            leap: [
                '  ●  \n ╱│╲ \n ╱ ╲ ',
                ' ╲●╱ \n  │  \n ╱▲╲ ',
                '  ╲●╱\n   │ \n     ',
                '   ╲●╱\n    │ \n      ',
                '    ╲●╱\n     │ \n       ',
                '     ╲●\n     ╱│\n       ',
                '     ● \n    ╱│╲\n    ╱ ╲'
            ],
            victory: [
                ' ╲●╱ \n  │  \n ╱ ╲ ',
                ' ╲●╱ \n  │  \n ╱ ╲ ',
                '  ●  \n ╱│╲ \n ╱ ╲ ',
                ' ╲●╱ \n  │  \n ╱ ╲ '
            ],
            // Vim normal mode - standing with clipboard
            clipboard: [
                '  ●   \n ╱│▄█ \n ╱ ╲  ',
                '  ●   \n ╱│▄█ \n ╱ ╲  ',
                '  ●∘  \n ╱│▄█ \n ╱ ╲  ',
                '  ●   \n ╱│▄█ \n ╱ ╲  '
            ],
            // Vim - thinking/scanning
            thinking: [
                '  ●？ \n ╱│▄█ \n ╱ ╲  ',
                '  ●   \n ╱│▄█ \n ╱│   ',
                '  ●！ \n ╱│▄█ \n ╱ ╲  ',
                '  ●   \n ╱│▄█ \n  │╲  '
            ],
            // Vim - editing action
            editing: [
                '  ●   \n╲│╱▄█ \n ╱ ╲  ',
                '  ●～ \n │╱▄█ \n ╱ ╲  ',
                '  ●   \n╱│╲▄█ \n ╱ ╲  '
            ]
        }
    }
};

// Current display mode
let displayMode = localStorage.getItem('runwritr-mode') || 'ascii';
let theme = localStorage.getItem('runwritr-theme') || 'dark';

function getChars() {
    return CHAR_SETS[displayMode];
}

// ============================================
// VIM MODE
// ============================================

const vim = {
    enabled: localStorage.getItem('runwritr-vim') === 'true',
    mode: 'normal', // 'normal' or 'insert'
    commandBuffer: '',
    countBuffer: '',
    yankBuffer: '',
    lastAction: null,
    commandTimeout: null
};

// Vim command definitions
const VIM_MOTIONS = {
    'h': (count) => moveCursor(-count, 0),
    'l': (count) => moveCursor(count, 0),
    'j': (count) => moveCursorLines(count),
    'k': (count) => moveCursorLines(-count),
    'w': (count) => moveByWord(count, 'forward', 'start'),
    'b': (count) => moveByWord(count, 'backward', 'start'),
    'e': (count) => moveByWord(count, 'forward', 'end'),
    '0': () => moveToLinePos('start'),
    '$': () => moveToLinePos('end'),
    '^': () => moveToLinePos('firstChar'),
    'G': (count, hasCount) => hasCount ? gotoLine(count) : gotoLine(Infinity),
    'gg': () => gotoLine(1)
};

const VIM_ACTIONS = {
    'x': (count) => { deleteChars(count); triggerEditAnimation(); },
    'dd': (count) => { deleteLines(count); triggerEditAnimation(); },
    'dw': (count) => { deleteWords(count); triggerEditAnimation(); },
    'd$': () => { deleteToLineEnd(); triggerEditAnimation(); },
    'D': () => { deleteToLineEnd(); triggerEditAnimation(); },
    'yy': (count) => { yankLines(count); triggerEditAnimation(); },
    'yw': (count) => { yankWords(count); triggerEditAnimation(); },
    'y$': () => { yankToLineEnd(); triggerEditAnimation(); },
    'p': (count) => { paste(count, 'after'); triggerEditAnimation(); },
    'P': (count) => { paste(count, 'before'); triggerEditAnimation(); },
    'u': () => document.execCommand('undo'),
    'i': () => enterInsertMode('atCursor'),
    'I': () => enterInsertMode('lineStart'),
    'a': () => enterInsertMode('afterCursor'),
    'A': () => enterInsertMode('lineEnd'),
    'o': () => enterInsertMode('newLineBelow'),
    'O': () => enterInsertMode('newLineAbove')
};

function triggerEditAnimation() {
    if (vim.enabled && vim.mode === 'normal') {
        state.currentAnimation = 'editing';
        state.frameIndex = 0;
        vim.lastAction = Date.now();
    }
}

// Cursor movement helpers
function moveCursor(charDelta, lineDelta) {
    const pos = editor.selectionStart;
    const text = editor.value;
    let newPos = pos + charDelta;
    newPos = Math.max(0, Math.min(text.length, newPos));
    editor.setSelectionRange(newPos, newPos);
}

function moveCursorLines(delta) {
    const text = editor.value;
    const pos = editor.selectionStart;

    // Find current line info
    const beforeCursor = text.substring(0, pos);
    const currentLineStart = beforeCursor.lastIndexOf('\n') + 1;
    const colPos = pos - currentLineStart;

    // Find target line
    const lines = text.split('\n');
    let currentLine = beforeCursor.split('\n').length - 1;
    let targetLine = currentLine + delta;
    targetLine = Math.max(0, Math.min(lines.length - 1, targetLine));

    // Calculate new position
    let newPos = 0;
    for (let i = 0; i < targetLine; i++) {
        newPos += lines[i].length + 1;
    }
    newPos += Math.min(colPos, lines[targetLine].length);

    editor.setSelectionRange(newPos, newPos);
}

function moveByWord(count, direction, position) {
    const text = editor.value;
    let pos = editor.selectionStart;

    for (let i = 0; i < count; i++) {
        if (direction === 'forward') {
            // Skip current word
            while (pos < text.length && /\w/.test(text[pos])) pos++;
            // Skip whitespace
            while (pos < text.length && /\s/.test(text[pos])) pos++;
            // If position is 'end', go to end of next word
            if (position === 'end') {
                while (pos < text.length && /\w/.test(text[pos])) pos++;
                pos = Math.max(0, pos - 1);
            }
        } else {
            pos--;
            // Skip whitespace
            while (pos > 0 && /\s/.test(text[pos])) pos--;
            // Skip to start of word
            while (pos > 0 && /\w/.test(text[pos - 1])) pos--;
        }
    }

    pos = Math.max(0, Math.min(text.length, pos));
    editor.setSelectionRange(pos, pos);
}

function moveToLinePos(position) {
    const text = editor.value;
    const pos = editor.selectionStart;
    const beforeCursor = text.substring(0, pos);
    const lineStart = beforeCursor.lastIndexOf('\n') + 1;
    const lineEnd = text.indexOf('\n', pos);
    const actualLineEnd = lineEnd === -1 ? text.length : lineEnd;

    let newPos;
    if (position === 'start') {
        newPos = lineStart;
    } else if (position === 'end') {
        newPos = actualLineEnd;
    } else if (position === 'firstChar') {
        newPos = lineStart;
        while (newPos < actualLineEnd && /\s/.test(text[newPos])) newPos++;
    }

    editor.setSelectionRange(newPos, newPos);
}

function gotoLine(lineNum) {
    const lines = editor.value.split('\n');
    const targetLine = Math.min(lineNum, lines.length) - 1;
    let pos = 0;
    for (let i = 0; i < targetLine && i < lines.length; i++) {
        pos += lines[i].length + 1;
    }
    editor.setSelectionRange(pos, pos);
}

// Editing helpers
function deleteChars(count) {
    const pos = editor.selectionStart;
    const text = editor.value;
    const deleted = text.substring(pos, pos + count);
    vim.yankBuffer = deleted;
    editor.value = text.substring(0, pos) + text.substring(pos + count);
    editor.setSelectionRange(pos, pos);
    saveContent();
}

function deleteLines(count) {
    const text = editor.value;
    const pos = editor.selectionStart;
    const lines = text.split('\n');
    const beforeCursor = text.substring(0, pos);
    const currentLine = beforeCursor.split('\n').length - 1;

    const endLine = Math.min(currentLine + count, lines.length);
    const deletedLines = lines.slice(currentLine, endLine);
    vim.yankBuffer = deletedLines.join('\n') + '\n';

    lines.splice(currentLine, count);
    editor.value = lines.join('\n');

    // Position cursor at start of current line (or last line if we deleted to end)
    const newLineNum = Math.min(currentLine, lines.length - 1);
    let newPos = 0;
    for (let i = 0; i < newLineNum; i++) {
        newPos += lines[i].length + 1;
    }
    editor.setSelectionRange(newPos, newPos);
    saveContent();
}

function deleteWords(count) {
    const startPos = editor.selectionStart;
    moveByWord(count, 'forward', 'start');
    const endPos = editor.selectionStart;

    const text = editor.value;
    vim.yankBuffer = text.substring(startPos, endPos);
    editor.value = text.substring(0, startPos) + text.substring(endPos);
    editor.setSelectionRange(startPos, startPos);
    saveContent();
}

function deleteToLineEnd() {
    const pos = editor.selectionStart;
    const text = editor.value;
    const lineEnd = text.indexOf('\n', pos);
    const actualEnd = lineEnd === -1 ? text.length : lineEnd;

    vim.yankBuffer = text.substring(pos, actualEnd);
    editor.value = text.substring(0, pos) + text.substring(actualEnd);
    editor.setSelectionRange(pos, pos);
    saveContent();
}

function yankLines(count) {
    const text = editor.value;
    const pos = editor.selectionStart;
    const lines = text.split('\n');
    const beforeCursor = text.substring(0, pos);
    const currentLine = beforeCursor.split('\n').length - 1;

    const endLine = Math.min(currentLine + count, lines.length);
    vim.yankBuffer = lines.slice(currentLine, endLine).join('\n') + '\n';
}

function yankWords(count) {
    const startPos = editor.selectionStart;
    moveByWord(count, 'forward', 'start');
    const endPos = editor.selectionStart;

    vim.yankBuffer = editor.value.substring(startPos, endPos);
    editor.setSelectionRange(startPos, startPos);
}

function yankToLineEnd() {
    const pos = editor.selectionStart;
    const text = editor.value;
    const lineEnd = text.indexOf('\n', pos);
    const actualEnd = lineEnd === -1 ? text.length : lineEnd;
    vim.yankBuffer = text.substring(pos, actualEnd);
}

function paste(count, position) {
    if (!vim.yankBuffer) return;

    const pos = editor.selectionStart;
    const text = editor.value;
    const toInsert = vim.yankBuffer.repeat(count);

    // Check if yanked content is lines (ends with newline)
    const isLinewise = vim.yankBuffer.endsWith('\n');

    let insertPos;
    if (isLinewise) {
        if (position === 'after') {
            // Find end of current line
            const lineEnd = text.indexOf('\n', pos);
            insertPos = lineEnd === -1 ? text.length : lineEnd + 1;
        } else {
            // Find start of current line
            const beforeCursor = text.substring(0, pos);
            insertPos = beforeCursor.lastIndexOf('\n') + 1;
        }
    } else {
        insertPos = position === 'after' ? pos + 1 : pos;
    }

    insertPos = Math.min(insertPos, text.length);
    editor.value = text.substring(0, insertPos) + toInsert + text.substring(insertPos);
    editor.setSelectionRange(insertPos + toInsert.length, insertPos + toInsert.length);
    saveContent();
}

function enterInsertMode(position) {
    const text = editor.value;
    const pos = editor.selectionStart;

    switch (position) {
        case 'afterCursor':
            editor.setSelectionRange(pos + 1, pos + 1);
            break;
        case 'lineStart':
            moveToLinePos('firstChar');
            break;
        case 'lineEnd':
            moveToLinePos('end');
            break;
        case 'newLineBelow': {
            const lineEnd = text.indexOf('\n', pos);
            const insertPos = lineEnd === -1 ? text.length : lineEnd;
            editor.value = text.substring(0, insertPos) + '\n' + text.substring(insertPos);
            editor.setSelectionRange(insertPos + 1, insertPos + 1);
            saveContent();
            break;
        }
        case 'newLineAbove': {
            const beforeCursor = text.substring(0, pos);
            const lineStart = beforeCursor.lastIndexOf('\n') + 1;
            editor.value = text.substring(0, lineStart) + '\n' + text.substring(lineStart);
            editor.setSelectionRange(lineStart, lineStart);
            saveContent();
            break;
        }
    }

    vim.mode = 'insert';
    updateVimIndicator();

    // Trigger typing animation
    state.lastKeystroke = Date.now();
    state.currentAnimation = 'walk';
}

function processVimCommand(key) {
    // Clear timeout
    if (vim.commandTimeout) {
        clearTimeout(vim.commandTimeout);
        vim.commandTimeout = null;
    }

    // Handle count prefix
    if (/[1-9]/.test(key) && !vim.commandBuffer) {
        vim.countBuffer += key;
        return;
    }
    if (/[0-9]/.test(key) && vim.countBuffer) {
        vim.countBuffer += key;
        return;
    }

    // Build command
    vim.commandBuffer += key;

    const count = parseInt(vim.countBuffer) || 1;
    const hasCount = vim.countBuffer.length > 0;
    const cmd = vim.commandBuffer;

    // Check for exact matches first
    if (VIM_ACTIONS[cmd]) {
        VIM_ACTIONS[cmd](count, hasCount);
        resetVimCommand();
        return;
    }

    if (VIM_MOTIONS[cmd]) {
        VIM_MOTIONS[cmd](count, hasCount);
        resetVimCommand();
        return;
    }

    // Check for partial matches (commands that need more input)
    const partialMatches = [...Object.keys(VIM_ACTIONS), ...Object.keys(VIM_MOTIONS)]
        .filter(c => c.startsWith(cmd) && c !== cmd);

    if (partialMatches.length > 0) {
        // Wait for more input
        vim.commandTimeout = setTimeout(() => {
            resetVimCommand();
        }, 1000);
        return;
    }

    // No match - reset
    resetVimCommand();
}

function resetVimCommand() {
    vim.commandBuffer = '';
    vim.countBuffer = '';
    if (vim.commandTimeout) {
        clearTimeout(vim.commandTimeout);
        vim.commandTimeout = null;
    }
}

function updateVimIndicator() {
    if (!vimIndicator) return;

    if (!vim.enabled) {
        vimIndicator.textContent = '';
        vimIndicator.className = 'hidden';
        return;
    }

    vimIndicator.className = vim.mode;
    if (vim.mode === 'normal') {
        const cmdDisplay = vim.countBuffer + vim.commandBuffer;
        vimIndicator.textContent = '-- NORMAL --' + (cmdDisplay ? ' ' + cmdDisplay : '');
    } else {
        vimIndicator.textContent = '-- INSERT --';
    }
}

function saveContent() {
    localStorage.setItem('runwritr-content', editor.value);
}

// ============================================
// PARALLAX WORLD GENERATION
// ============================================

function generateStars(width) {
    const chars = getChars().stars;
    let rows = ['', '', ''];
    for (let i = 0; i < width; i++) {
        for (let r = 0; r < 3; r++) {
            rows[r] += chars[Math.floor(Math.random() * chars.length)];
        }
    }
    return rows.join('\n');
}

function generateClouds(width) {
    const chars = getChars();
    let row1 = '', row2 = '';
    for (let i = 0; i < width / 4; i++) {
        const p = chars.clouds[Math.floor(Math.random() * chars.clouds.length)];
        row1 += p + ' ';
        row2 += (chars.cloudBottom[p] || '    ') + ' ';
    }
    return row1 + '\n' + row2;
}

function generateHills(width) {
    const segments = getChars().hills;
    let row = '';
    for (let i = 0; i < width; i++) {
        row += segments[Math.floor(Math.random() * segments.length)];
    }
    return row;
}

function generateGround(width) {
    const segments = getChars().ground;
    const totalWeight = segments.reduce((sum, s) => sum + s.weight, 0);
    let row = '';
    for (let i = 0; i < width; i++) {
        let r = Math.random() * totalWeight;
        for (const seg of segments) {
            r -= seg.weight;
            if (r <= 0) {
                row += seg.char;
                break;
            }
        }
    }
    return row;
}

function generateScenery(width) {
    const chars = getChars().scenery;
    const objects = ['empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty',
                     'tree', 'bush', 'flower', 'flowers', 'grass', 'rock', 'bigTree',
                     'empty', 'empty', 'empty', 'empty', 'empty'];

    let sceneryData = [];
    for (let i = 0; i < width / 8; i++) {
        const obj = objects[Math.floor(Math.random() * objects.length)];
        sceneryData.push({ type: obj, sprite: chars[obj] });
    }
    return sceneryData;
}

// World state
const WORLD_WIDTH = 500;
let world = {
    stars: '',
    clouds: '',
    hills: '',
    ground: '',
    scenery: [],
    offset: 0
};

function regenerateWorld() {
    world.stars = generateStars(WORLD_WIDTH);
    world.clouds = generateClouds(WORLD_WIDTH);
    world.hills = generateHills(WORLD_WIDTH);
    world.ground = generateGround(WORLD_WIDTH);
    world.scenery = generateScenery(WORLD_WIDTH);
}

regenerateWorld();

// Scroll speeds
const SCROLL_SPEEDS = {
    stars: 0.1,
    clouds: 0.3,
    hills: 0.6,
    scenery: 0.9,
    ground: 1.0
};

// ============================================
// STATE MANAGEMENT
// ============================================

const state = {
    currentAnimation: 'walk',
    frameIndex: 0,
    keystrokeTimes: [],
    lastKeystroke: Date.now(),
    scrollSpeed: 0.5,
    targetScrollSpeed: 0.5,
    wordCountMilestone: 0,
    jumpHeight: 0
};

const SPEED_THRESHOLDS = { walk: 0, run: 2, sprint: 5 };
const SCROLL_MULTIPLIERS = {
    walk: 0.5, run: 2, sprint: 4, stumble: 0.3,
    jump: 1.5, leap: 3, victory: 1,
    clipboard: 0.1, thinking: 0.15, editing: 0.2
};
const FRAME_RATES = {
    walk: 180, run: 100, sprint: 60, stumble: 120,
    jump: 80, leap: 80, victory: 150,
    clipboard: 400, thinking: 300, editing: 120
};
const SPEED_WINDOW = 2000;

// ============================================
// TYPING SPEED CALCULATION
// ============================================

function getTypingSpeed() {
    const now = Date.now();
    const recent = state.keystrokeTimes.filter(t => now - t < SPEED_WINDOW);
    if (recent.length < 2) return 0;
    return recent.length / ((now - recent[0]) / 1000);
}

function getAnimationForSpeed(speed) {
    if (speed >= SPEED_THRESHOLDS.sprint) return 'sprint';
    if (speed >= SPEED_THRESHOLDS.run) return 'run';
    return 'walk';
}

// ============================================
// RENDERING
// ============================================

function renderWorld() {
    const viewWidth = Math.ceil(window.innerWidth / 8) + 10;
    const offset = Math.floor(state.scrollSpeed * world.offset);

    const starsOffset = Math.floor(offset * SCROLL_SPEEDS.stars) % WORLD_WIDTH;
    const cloudsOffset = Math.floor(offset * SCROLL_SPEEDS.clouds) % WORLD_WIDTH;
    const hillsOffset = Math.floor(offset * SCROLL_SPEEDS.hills) % WORLD_WIDTH;
    const groundOffset = Math.floor(offset * SCROLL_SPEEDS.ground) % WORLD_WIDTH;
    const sceneryOffset = Math.floor(offset * SCROLL_SPEEDS.scenery);

    function getLoopedView(content, scrollOffset, width) {
        const lines = content.split('\n');
        return lines.map(line => {
            const doubled = line + line;
            const start = scrollOffset % line.length;
            return doubled.slice(start, start + width);
        }).join('\n');
    }

    starsEl.textContent = getLoopedView(world.stars, starsOffset, viewWidth);
    cloudsEl.textContent = getLoopedView(world.clouds, cloudsOffset, viewWidth);
    hillsEl.textContent = getLoopedView(world.hills, hillsOffset, viewWidth);
    groundEl.textContent = getLoopedView(world.ground, groundOffset, viewWidth);
    renderScenery(sceneryOffset, viewWidth);
}

function renderScenery(offset, viewWidth) {
    const spacing = 8;
    const startIndex = Math.floor(offset / spacing) % world.scenery.length;
    const pixelOffset = offset % spacing;

    let row = '';
    const numVisible = Math.ceil(viewWidth / spacing) + 2;

    for (let i = 0; i < numVisible; i++) {
        const idx = (startIndex + i) % world.scenery.length;
        const obj = world.scenery[idx];
        const sprite = obj.sprite.split('\n')[0] || '     ';
        row += sprite.padEnd(spacing, ' ').slice(0, spacing);
    }

    sceneryEl.textContent = row.slice(Math.floor(pixelOffset));
}

function renderRunner() {
    const frames = getChars().runner[state.currentAnimation];
    if (!frames) {
        console.warn('Missing frames for animation:', state.currentAnimation);
        return;
    }
    const frame = frames[state.frameIndex % frames.length];
    runnerEl.textContent = frame;
    runnerEl.style.bottom = (22 + state.jumpHeight) + 'px';
}

function updateStats() {
    const text = editor.value.trim();
    const words = text ? text.split(/\s+/).length : 0;
    wordCountEl.textContent = words + ' word' + (words !== 1 ? 's' : '');

    // Don't show speed labels if in vim normal mode
    if (vim.enabled && vim.mode === 'normal') {
        speedIndicator.textContent = '';
        speedIndicator.className = '';
        return;
    }

    const labels = {
        walk: 'stroll', run: 'jogging', sprint: 'blazing!',
        stumble: 'oops!', jump: 'nice!', leap: 'new chapter!', victory: 'milestone!'
    };
    speedIndicator.textContent = labels[state.currentAnimation] || '';
    speedIndicator.className = state.currentAnimation;
}

// ============================================
// ANIMATION LOOP
// ============================================

let lastAnimationFrame = 0;

function gameLoop(timestamp) {
    // Determine target scroll speed based on vim mode
    if (vim.enabled && vim.mode === 'normal') {
        // In normal mode, very slow scroll (clipboard/thinking animation)
        if (!['editing'].includes(state.currentAnimation)) {
            const timeSinceAction = Date.now() - (vim.lastAction || 0);
            if (timeSinceAction < 500) {
                state.targetScrollSpeed = SCROLL_MULTIPLIERS.editing;
            } else if (vim.commandBuffer || vim.countBuffer) {
                state.currentAnimation = 'thinking';
                state.targetScrollSpeed = SCROLL_MULTIPLIERS.thinking;
            } else {
                state.currentAnimation = 'clipboard';
                state.targetScrollSpeed = SCROLL_MULTIPLIERS.clipboard;
            }
        }
    }

    state.scrollSpeed += (state.targetScrollSpeed - state.scrollSpeed) * 0.1;
    world.offset += state.scrollSpeed;

    const frameRate = FRAME_RATES[state.currentAnimation] || 180;
    if (timestamp - lastAnimationFrame > frameRate) {
        lastAnimationFrame = timestamp;

        const frames = getChars().runner[state.currentAnimation];
        if (frames) {
            state.frameIndex++;

            if (['stumble', 'jump', 'leap', 'victory', 'editing'].includes(state.currentAnimation)) {
                if (state.frameIndex >= frames.length) {
                    if (vim.enabled && vim.mode === 'normal') {
                        state.currentAnimation = 'clipboard';
                    } else {
                        const speed = getTypingSpeed();
                        state.currentAnimation = getAnimationForSpeed(speed);
                    }
                    state.frameIndex = 0;
                    state.jumpHeight = 0;
                } else if (state.currentAnimation === 'jump' || state.currentAnimation === 'leap') {
                    const progress = state.frameIndex / (frames.length - 1);
                    const maxHeight = state.currentAnimation === 'leap' ? 40 : 25;
                    state.jumpHeight = Math.sin(progress * Math.PI) * maxHeight;
                }
            } else {
                state.frameIndex = state.frameIndex % frames.length;
            }
        }
    }

    // Idle timeout (only in insert mode or vim disabled)
    const now = Date.now();
    if ((!vim.enabled || vim.mode === 'insert') &&
        now - state.lastKeystroke > 2000 &&
        !['stumble', 'jump', 'leap', 'victory'].includes(state.currentAnimation)) {
        state.targetScrollSpeed = SCROLL_MULTIPLIERS.walk;
        if (state.currentAnimation !== 'walk') {
            state.currentAnimation = 'walk';
            state.frameIndex = 0;
        }
    }

    renderWorld();
    renderRunner();
    updateStats();
    updateVimIndicator();
    requestAnimationFrame(gameLoop);
}

// ============================================
// INPUT HANDLING
// ============================================

editor.addEventListener('keydown', (e) => {
    // Vim mode handling
    if (vim.enabled) {
        if (vim.mode === 'normal') {
            e.preventDefault();

            // Escape in normal mode - just reset command buffer
            if (e.key === 'Escape') {
                resetVimCommand();
                return;
            }

            processVimCommand(e.key);
            return;
        } else {
            // Insert mode - Escape returns to normal mode
            if (e.key === 'Escape') {
                e.preventDefault();
                vim.mode = 'normal';
                state.currentAnimation = 'clipboard';
                state.frameIndex = 0;
                updateVimIndicator();
                return;
            }
        }
    }

    // Regular typing handling (vim disabled or insert mode)
    const now = Date.now();

    if (e.key.length === 1 || e.key === 'Enter') {
        state.keystrokeTimes.push(now);
        state.lastKeystroke = now;
        state.keystrokeTimes = state.keystrokeTimes.filter(t => now - t < SPEED_WINDOW);

        const speed = getTypingSpeed();
        const newAnimation = getAnimationForSpeed(speed);

        if (!['stumble', 'jump', 'leap', 'victory'].includes(state.currentAnimation)) {
            if (newAnimation !== state.currentAnimation) {
                state.currentAnimation = newAnimation;
                state.frameIndex = 0;
            }
            state.targetScrollSpeed = SCROLL_MULTIPLIERS[newAnimation];
        }
    }

    if (e.key === 'Backspace') {
        state.currentAnimation = 'stumble';
        state.frameIndex = 0;
        state.targetScrollSpeed = SCROLL_MULTIPLIERS.stumble;
        return;
    }

    if (['.', '!', '?'].includes(e.key)) {
        state.currentAnimation = 'jump';
        state.frameIndex = 0;
        state.jumpHeight = 0;
        state.targetScrollSpeed = SCROLL_MULTIPLIERS.jump;
        return;
    }

    if (e.key === 'Enter' && editor.value.endsWith('\n')) {
        state.currentAnimation = 'leap';
        state.frameIndex = 0;
        state.jumpHeight = 0;
        state.targetScrollSpeed = SCROLL_MULTIPLIERS.leap;
        return;
    }
});

// Word count milestone check
setInterval(() => {
    const text = editor.value.trim();
    const words = text ? text.split(/\s+/).length : 0;
    const milestone = Math.floor(words / 100);
    if (milestone > state.wordCountMilestone && words > 0) {
        state.wordCountMilestone = milestone;
        state.currentAnimation = 'victory';
        state.frameIndex = 0;
    }
}, 500);

// ============================================
// MODE & THEME TOGGLES
// ============================================

function updateModeButton() {
    modeToggle.textContent = displayMode === 'ascii' ? 'ASCII' : 'UTF-8';
}

function updateThemeButton() {
    themeToggle.textContent = theme;
}

function updateVimButton() {
    if (vimToggle) {
        vimToggle.textContent = vim.enabled ? 'vim:on' : 'vim:off';
        vimToggle.classList.toggle('active', vim.enabled);
    }
}

modeToggle.addEventListener('click', () => {
    displayMode = displayMode === 'ascii' ? 'unicode' : 'ascii';
    localStorage.setItem('runwritr-mode', displayMode);
    updateModeButton();
    regenerateWorld();
});

themeToggle.addEventListener('click', () => {
    theme = theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('runwritr-theme', theme);
    document.body.classList.toggle('light', theme === 'light');
    updateThemeButton();
});

if (vimToggle) {
    vimToggle.addEventListener('click', () => {
        vim.enabled = !vim.enabled;
        localStorage.setItem('runwritr-vim', vim.enabled);
        updateVimButton();

        if (vim.enabled) {
            vim.mode = 'normal';
            state.currentAnimation = 'clipboard';
            state.frameIndex = 0;
        } else {
            vim.mode = 'insert';
            state.currentAnimation = 'walk';
        }
        updateVimIndicator();
        editor.focus();
    });
}

// Apply saved settings
if (theme === 'light') {
    document.body.classList.add('light');
}
updateModeButton();
updateThemeButton();
updateVimButton();

// Initialize vim state
if (vim.enabled) {
    vim.mode = 'normal';
    state.currentAnimation = 'clipboard';
    updateVimIndicator();
}

// ============================================
// FILE MANAGEMENT
// ============================================

const fileSelect = document.getElementById('file-select');
const newFileBtn = document.getElementById('new-file');
const deleteFileBtn = document.getElementById('delete-file');

const fileManager = {
    files: {},
    currentFile: 'untitled.txt'
};

function loadFiles() {
    try {
        const saved = localStorage.getItem('runwritr-files');
        fileManager.files = saved ? JSON.parse(saved) : {};
    } catch (e) {
        console.error('Failed to parse files:', e);
        fileManager.files = {};
    }

    fileManager.currentFile = localStorage.getItem('runwritr-current') || 'untitled.txt';

    // Ensure current file exists
    if (!fileManager.files[fileManager.currentFile]) {
        fileManager.files[fileManager.currentFile] = '';
    }

    // Migrate old single-file content if exists
    const oldContent = localStorage.getItem('runwritr-content');
    if (oldContent && Object.keys(fileManager.files).length <= 1) {
        fileManager.files[fileManager.currentFile] = oldContent;
        localStorage.removeItem('runwritr-content');
        saveFiles();
    }
}

function saveFiles() {
    localStorage.setItem('runwritr-files', JSON.stringify(fileManager.files));
    localStorage.setItem('runwritr-current', fileManager.currentFile);
}

function updateFileSelect() {
    fileSelect.innerHTML = '';
    const sortedFiles = Object.keys(fileManager.files).sort();
    for (const name of sortedFiles) {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        if (name === fileManager.currentFile) option.selected = true;
        fileSelect.appendChild(option);
    }
}

function switchFile(filename) {
    // Save current file
    fileManager.files[fileManager.currentFile] = editor.value;

    // Switch to new file
    fileManager.currentFile = filename;
    editor.value = fileManager.files[filename] || '';

    // Update word count milestone
    const words = editor.value.trim() ? editor.value.trim().split(/\s+/).length : 0;
    state.wordCountMilestone = Math.floor(words / 100);

    saveFiles();
    updateFileSelect();
}

function createNewFile() {
    const name = prompt('New file name:');
    if (!name || !name.trim()) return;

    const cleanName = name.trim().replace(/[<>:"/\\|?*]/g, ''); // Sanitize filename
    if (!cleanName) {
        alert('Invalid filename');
        return;
    }

    if (fileManager.files[cleanName]) {
        alert('File already exists');
        return;
    }

    // Save current file first
    fileManager.files[fileManager.currentFile] = editor.value;

    // Create and switch to new file
    fileManager.files[cleanName] = '';
    fileManager.currentFile = cleanName;
    editor.value = '';
    state.wordCountMilestone = 0;

    saveFiles();
    updateFileSelect();
    editor.focus();
}

function deleteCurrentFile() {
    const files = Object.keys(fileManager.files);
    if (files.length <= 1) {
        alert('Cannot delete the last file');
        return;
    }

    if (!confirm(`Delete "${fileManager.currentFile}"?`)) return;

    delete fileManager.files[fileManager.currentFile];

    // Switch to first remaining file
    const remaining = Object.keys(fileManager.files).sort();
    fileManager.currentFile = remaining[0];
    editor.value = fileManager.files[fileManager.currentFile] || '';

    const words = editor.value.trim() ? editor.value.trim().split(/\s+/).length : 0;
    state.wordCountMilestone = Math.floor(words / 100);

    saveFiles();
    updateFileSelect();
}

// File management event listeners
fileSelect.addEventListener('change', () => {
    switchFile(fileSelect.value);
});

newFileBtn.addEventListener('click', createNewFile);
deleteFileBtn.addEventListener('click', deleteCurrentFile);

// ============================================
// INITIALIZATION
// ============================================

loadFiles();
updateFileSelect();
editor.value = fileManager.files[fileManager.currentFile] || '';

const initialWords = editor.value.trim() ? editor.value.trim().split(/\s+/).length : 0;
state.wordCountMilestone = Math.floor(initialWords / 100);

editor.addEventListener('input', () => {
    fileManager.files[fileManager.currentFile] = editor.value;
    saveFiles();
});

requestAnimationFrame(gameLoop);
