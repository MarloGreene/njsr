const https = require('https');
const fs = require('fs');

const url = 'https://www.eff.org/files/2016/07/18/eff_large_wordlist.txt';

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        const lines = data.split('\n');
        const words = lines.map(line => {
            const parts = line.trim().split('\t');
            return parts[1]; // The word is in the second column
        }).filter(word => word && word.length > 2); // Filter out empty and short words

        // Shuffle the words for randomness
        for (let i = words.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [words[i], words[j]] = [words[j], words[i]];
        }

        // Take first 5000 words or so
        const selectedWords = words.slice(0, 5000);

        const jsContent = `// Word list for passphrase generation
const words = [
${selectedWords.map(word => `    '${word}'`).join(',\n')}
];

function generateRandomNumber() {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return (array[0] % 9000000000) + 1000000000; // 10-digit number
}

function generateRandomPassword(length = 12) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    const array = new Uint32Array(length);
    crypto.getRandomValues(array);
    let password = '';
    for (let i = 0; i < length; i++) {
        password += chars.charAt(array[i] % chars.length);
    }
    return password;
}

function generateRandomPassphrase(wordCount = 4) {
    const array = new Uint32Array(wordCount);
    crypto.getRandomValues(array);
    let passphrase = [];
    for (let i = 0; i < wordCount; i++) {
        passphrase.push(words[array[i] % words.length]);
    }
    return passphrase.join(' ');
}

function updateDisplays() {
    document.getElementById('random-number').textContent = generateRandomNumber();
    document.getElementById('random-password').textContent = generateRandomPassword();
    document.getElementById('random-passphrase').textContent = generateRandomPassphrase();
}

async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showToast();
    } catch (err) {
        console.error('Failed to copy: ', err);
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showToast();
    }
}

function showToast() {
    const toast = document.getElementById('toast');
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2000);
}

document.addEventListener('DOMContentLoaded', () => {
    updateDisplays();

    document.getElementById('regenerate-btn').addEventListener('click', updateDisplays);

    document.querySelectorAll('.clickable').forEach(el => {
        el.addEventListener('click', (e) => {
            const text = e.target.textContent;
            copyToClipboard(text);
        });
    });
});`;

        fs.writeFileSync('script.js', jsContent);
        console.log('Updated script.js with crypto randomness and large word list.');
    });
}).on('error', (err) => {
    console.error('Error fetching word list:', err);
});