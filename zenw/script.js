const editor = document.getElementById('editor');
const themeToggle = document.getElementById('theme-toggle');
const fontFamily = document.getElementById('font-family');
const fontSize = document.getElementById('font-size');
const exportBtn = document.getElementById('export-btn');
const importBtn = document.getElementById('import-btn');
const importLabel = document.getElementById('import-label');
const fileSelect = document.getElementById('file-select');
const newFileBtn = document.getElementById('new-file');
const saveAsBtn = document.getElementById('save-as');

// Load files and current file
let files = JSON.parse(localStorage.getItem('zenWriterFiles')) || {};
let currentFile = localStorage.getItem('zenWriterCurrentFile') || 'untitled.txt';

if (!files[currentFile]) {
    files[currentFile] = '';
    localStorage.setItem('zenWriterFiles', JSON.stringify(files));
}

editor.value = files[currentFile];

// Function to update file select dropdown
function updateFileSelect() {
    fileSelect.innerHTML = '';
    for (let name in files) {
        let option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        if (name === currentFile) option.selected = true;
        fileSelect.appendChild(option);
    }
}

updateFileSelect();

// Load theme
const savedTheme = localStorage.getItem('zenWriterTheme') || 'dark';
if (savedTheme === 'light') {
    document.body.classList.add('light-mode');
    themeToggle.textContent = 'Dark Mode';
}

// Load font settings
const savedFontFamily = localStorage.getItem('zenWriterFontFamily') || 'Arial';
fontFamily.value = savedFontFamily;
editor.style.fontFamily = savedFontFamily;

const savedFontSize = localStorage.getItem('zenWriterFontSize') || '16';
fontSize.value = savedFontSize;
editor.style.fontSize = savedFontSize + 'px';

// Auto-save
editor.addEventListener('input', () => {
    files[currentFile] = editor.value;
    localStorage.setItem('zenWriterFiles', JSON.stringify(files));
});

// Save on page unload to ensure no data is lost
window.addEventListener('beforeunload', () => {
    files[currentFile] = editor.value;
    localStorage.setItem('zenWriterFiles', JSON.stringify(files));
});

// Theme toggle
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light-mode');
    const isLight = document.body.classList.contains('light-mode');
    themeToggle.textContent = isLight ? 'Dark Mode' : 'Light Mode';
    localStorage.setItem('zenWriterTheme', isLight ? 'light' : 'dark');
});

// Font family change
fontFamily.addEventListener('change', () => {
    editor.style.fontFamily = fontFamily.value;
    localStorage.setItem('zenWriterFontFamily', fontFamily.value);
});

// Font size change
fontSize.addEventListener('input', () => {
    editor.style.fontSize = fontSize.value + 'px';
    localStorage.setItem('zenWriterFontSize', fontSize.value);
});

// File select change
fileSelect.addEventListener('change', () => {
    files[currentFile] = editor.value; // save current
    localStorage.setItem('zenWriterFiles', JSON.stringify(files));
    currentFile = fileSelect.value;
    localStorage.setItem('zenWriterCurrentFile', currentFile);
    editor.value = files[currentFile];
});

// New file
newFileBtn.addEventListener('click', () => {
    let name = prompt('Enter new file name:');
    if (name && name.trim()) {
        name = name.trim();
        if (!files[name]) {
            files[name] = '';
            localStorage.setItem('zenWriterFiles', JSON.stringify(files));
            currentFile = name;
            localStorage.setItem('zenWriterCurrentFile', currentFile);
            editor.value = '';
            updateFileSelect();
        } else {
            alert('File already exists.');
        }
    }
});

// Save as
saveAsBtn.addEventListener('click', () => {
    let name = prompt('Save as (file name):');
    if (name && name.trim()) {
        name = name.trim();
        files[name] = editor.value;
        localStorage.setItem('zenWriterFiles', JSON.stringify(files));
        currentFile = name;
        localStorage.setItem('zenWriterCurrentFile', currentFile);
        updateFileSelect();
    }
});

// Export
exportBtn.addEventListener('click', () => {
    const blob = new Blob([editor.value], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentFile;
    a.click();
    URL.revokeObjectURL(url);
});

// Import
importLabel.addEventListener('click', () => {
    importBtn.click();
});

importBtn.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        let name = prompt('Import as file name:', file.name);
        if (name && name.trim()) {
            name = name.trim();
            const reader = new FileReader();
            reader.onload = (e) => {
                files[name] = e.target.result;
                localStorage.setItem('zenWriterFiles', JSON.stringify(files));
                currentFile = name;
                localStorage.setItem('zenWriterCurrentFile', currentFile);
                editor.value = files[name];
                updateFileSelect();
            };
            reader.readAsText(file);
        }
    }
});