const input = document.getElementById('password');
const generateBtn = document.getElementById('generate');

input.addEventListener('input', () => {
    const pwd = input.value;
    const strength = calculateStrength(pwd);
    document.getElementById('strength').textContent = 'Strength: ' + strength;
    const time = calculateTime(pwd);
    document.getElementById('time').textContent = 'Estimated time to crack: ' + time;
});

generateBtn.addEventListener('click', () => {
    const pwd = generatePassword();
    input.value = pwd;
    input.dispatchEvent(new Event('input'));
});

function calculateStrength(pwd) {
    if (pwd.length === 0) return 'None';
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (/[a-z]/.test(pwd)) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^a-zA-Z0-9]/.test(pwd)) score += 1;
    const levels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
    return levels[Math.min(score, 5)];
}

function calculateTime(pwd) {
    if (pwd.length === 0) return 'Instantly';
    const charset = getCharsetSize(pwd);
    const combinations = Math.pow(charset, pwd.length);
    const guessesPerSecond = 1e10; // Rough estimate: 10 billion guesses per second (modern hardware)
    const seconds = combinations / guessesPerSecond;
    return formatTime(seconds);
}

function getCharsetSize(pwd) {
    let size = 0;
    if (/[a-z]/.test(pwd)) size += 26;
    if (/[A-Z]/.test(pwd)) size += 26;
    if (/[0-9]/.test(pwd)) size += 10;
    if (/[^a-zA-Z0-9]/.test(pwd)) size += 32; // Approximate for symbols and special chars
    return Math.max(size, 1);
}

function formatTime(seconds) {
    if (seconds < 1) return 'Less than a second';
    if (seconds < 60) return Math.round(seconds) + ' seconds';
    const minutes = seconds / 60;
    if (minutes < 60) return Math.round(minutes) + ' minutes';
    const hours = minutes / 60;
    if (hours < 24) return Math.round(hours) + ' hours';
    const days = hours / 24;
    if (days < 365) return Math.round(days) + ' days';
    const years = days / 365;
    if (years < 1000) return Math.round(years) + ' years';
    const millennia = years / 1000;
    return Math.round(millennia) + ' millennia';
}

function generatePassword() {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    let pwd = '';
    for (let i = 0; i < 16; i++) {
        pwd += chars[Math.floor(Math.random() * chars.length)];
    }
    return pwd;
}