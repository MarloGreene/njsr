// URL Tools - Encoder, Decoder & Shortener
document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const encodeInput = document.getElementById('encodeInput');
    const encodeBtn = document.getElementById('encodeBtn');
    const encodeOutput = document.getElementById('encodeOutput');
    const copyEncodeBtn = document.getElementById('copyEncodeBtn');

    const decodeInput = document.getElementById('decodeInput');
    const decodeBtn = document.getElementById('decodeBtn');
    const decodeOutput = document.getElementById('decodeOutput');
    const copyDecodeBtn = document.getElementById('copyDecodeBtn');

    const shortenInput = document.getElementById('shortenInput');
    const customLength = document.getElementById('customLength');
    const customLengthValue = document.getElementById('customLengthValue');
    const shortenBtn = document.getElementById('shortenBtn');
    const shortUrlOutput = document.getElementById('shortUrlOutput');
    const copyShortBtn = document.getElementById('copyShortBtn');

    // URL Encoding
    encodeBtn.addEventListener('click', function() {
        const input = encodeInput.value.trim();
        if (!input) {
            showError('Please enter text to encode');
            return;
        }

        try {
            const encoded = encodeURIComponent(input);
            encodeOutput.value = encoded;
            encodeOutput.style.borderColor = '#28a745';
            setTimeout(() => encodeOutput.style.borderColor = '#e9ecef', 1000);
        } catch (error) {
            showError('Error encoding URL: ' + error.message);
        }
    });

    // URL Decoding
    decodeBtn.addEventListener('click', function() {
        const input = decodeInput.value.trim();
        if (!input) {
            showError('Please enter text to decode');
            return;
        }

        try {
            const decoded = decodeURIComponent(input);
            decodeOutput.value = decoded;
            decodeOutput.style.borderColor = '#28a745';
            setTimeout(() => decodeOutput.style.borderColor = '#e9ecef', 1000);
        } catch (error) {
            showError('Error decoding URL: ' + error.message);
            decodeOutput.value = 'Invalid encoded URL';
        }
    });

    // Short URL Generation
    shortenBtn.addEventListener('click', function() {
        const input = shortenInput.value.trim();
        if (!input) {
            showError('Please enter a URL to shorten');
            return;
        }

        // Basic URL validation
        if (!isValidUrl(input)) {
            showError('Please enter a valid URL');
            return;
        }

        const length = customLength.checked ? parseInt(customLengthValue.value) : 5;
        const shortUrl = generateShortUrl(length);
        shortUrlOutput.value = `https://short.url/${shortUrl}`;
        shortUrlOutput.style.borderColor = '#28a745';
        setTimeout(() => shortUrlOutput.style.borderColor = '#e9ecef', 1000);
    });

    // Custom length toggle
    customLength.addEventListener('change', function() {
        customLengthValue.disabled = !this.checked;
    });

    // Copy functionality
    copyEncodeBtn.addEventListener('click', function() {
        copyToClipboard(encodeOutput.value, 'Encoded URL copied!');
    });

    copyDecodeBtn.addEventListener('click', function() {
        copyToClipboard(decodeOutput.value, 'Decoded text copied!');
    });

    copyShortBtn.addEventListener('click', function() {
        copyToClipboard(shortUrlOutput.value, 'Short URL copied!');
    });

    // Enter key support
    [encodeInput, decodeInput, shortenInput].forEach(input => {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const button = this.closest('.tool-section').querySelector('.btn.primary');
                if (button) button.click();
            }
        });
    });

    // Utility functions
    function isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    function generateShortUrl(length = 5) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    function copyToClipboard(text, successMessage = 'Copied!') {
        if (!text) {
            showError('Nothing to copy');
            return;
        }

        navigator.clipboard.writeText(text).then(function() {
            showSuccess(successMessage);
        }).catch(function(err) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                showSuccess(successMessage);
            } catch (fallbackErr) {
                showError('Failed to copy: ' + fallbackErr.message);
            }
            document.body.removeChild(textArea);
        });
    }

    function showError(message) {
        // Simple error display - could be enhanced with toast notifications
        alert('❌ ' + message);
    }

    function showSuccess(message) {
        // Simple success display - could be enhanced with toast notifications
        alert('✅ ' + message);
    }

    // Auto-focus first input
    encodeInput.focus();
});