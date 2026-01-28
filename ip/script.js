document.addEventListener('DOMContentLoaded', function() {
    loadData();
    const refreshBtn = document.getElementById('refresh-btn');
    refreshBtn.addEventListener('click', async function() {
        if (refreshBtn.disabled) return; // Rate limit
        refreshBtn.disabled = true;
        refreshBtn.textContent = 'Refreshing...';
        try {
            await loadData();
            showToast();
        } finally {
            setTimeout(() => {
                refreshBtn.disabled = false;
                refreshBtn.textContent = 'Refresh Data';
            }, 5000); // Re-enable after 5 seconds
        }
    });
});

function showToast() {
    const toast = document.getElementById('toast');
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000); // Hide after 3 seconds
}

async function loadData() {
    updateLastUpdated();
    await loadIPInfo();
    loadFingerprintingData();
}

function updateLastUpdated() {
    const now = new Date();
    document.getElementById('last-updated').textContent = `Last updated: ${now.toLocaleString()}`;
}

async function loadIPInfo() {
    const ipDetails = document.getElementById('ip-details');
    const geoDetails = document.getElementById('geo-details');
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        // Fetch IPv4
        const ipv4Response = await fetch('https://api.ipify.org?format=json', { signal: controller.signal });
        clearTimeout(timeoutId);
        const ipv4Data = await ipv4Response.json();
        if (!ipv4Data || typeof ipv4Data.ip !== 'string') throw new Error('Invalid IPv4 response');

        // Fetch IPv6 with new controller
        const controller6 = new AbortController();
        const timeoutId6 = setTimeout(() => controller6.abort(), 10000);
        const ipv6Response = await fetch('https://api64.ipify.org?format=json', { signal: controller6.signal });
        clearTimeout(timeoutId6);
        const ipv6Data = await ipv6Response.json();
        if (!ipv6Data || typeof ipv6Data.ip !== 'string') throw new Error('Invalid IPv6 response');

        ipDetails.innerHTML = `
            <p><strong>IPv4 Address:</strong> <span class="copyable" data-ip="${ipv4Data.ip}">${ipv4Data.ip}</span></p>
            <p><strong>IPv6 Address:</strong> <span class="copyable" data-ip="${ipv6Data.ip}">${ipv6Data.ip}</span></p>
        `;

        // Add click handlers for copying
        document.querySelectorAll('.copyable').forEach(span => {
            span.addEventListener('click', function() {
                const ip = this.getAttribute('data-ip');
                navigator.clipboard.writeText(ip).then(() => {
                    // Temporarily change text to indicate copied
                    const originalText = this.textContent;
                    this.textContent = 'Copied!';
                    setTimeout(() => {
                        this.textContent = originalText;
                    }, 1000);
                }).catch(err => {
                    console.error('Failed to copy: ', err);
                    alert('Failed to copy to clipboard. Please check permissions.');
                });
            });
        });

        // Fetch geolocation
        const geoController = new AbortController();
        const geoTimeoutId = setTimeout(() => geoController.abort(), 10000);
        const geoResponse = await fetch(`https://ipapi.co/${ipv4Data.ip}/json/`, { signal: geoController.signal });
        clearTimeout(geoTimeoutId);
        const geoData = await geoResponse.json();
        if (geoData.error) {
            geoDetails.innerHTML = '<p>Geolocation information not available.</p>';
        } else {
            // Validate geo data
            if (typeof geoData.country_name !== 'string') geoData.country_name = 'Unknown';
            geoDetails.innerHTML = `
                <p><strong>Country:</strong> ${geoData.country_name} (${geoData.country_code || 'N/A'})</p>
                <p><strong>Region:</strong> ${geoData.region || 'N/A'}</p>
                <p><strong>City:</strong> ${geoData.city || 'N/A'}</p>
                <p><strong>ISP:</strong> ${geoData.org || 'N/A'}</p>
                <p><strong>Timezone:</strong> ${geoData.timezone || 'N/A'}</p>
            `;
        }
    } catch (error) {
        if (error.name === 'AbortError') {
            ipDetails.innerHTML = '<p>Error: Request timed out. Please try again.</p>';
            geoDetails.innerHTML = '<p>Geolocation request timed out.</p>';
        } else {
            ipDetails.innerHTML = '<p>Error loading IP information. Please check your connection.</p>';
            geoDetails.innerHTML = '<p>Error loading geolocation information.</p>';
        }
        console.error('Error fetching IP or geo:', error);
    }
}

function loadFingerprintingData() {
    const tbody = document.querySelector('#fingerprint-table tbody');
    const data = collectFingerprintingData();

    for (const [key, value] of Object.entries(data)) {
        const row = document.createElement('tr');
        const keyCell = document.createElement('td');
        const valueCell = document.createElement('td');

        keyCell.textContent = key;
        valueCell.textContent = value;

        row.appendChild(keyCell);
        row.appendChild(valueCell);
        tbody.appendChild(row);
    }
}

function collectFingerprintingData() {
    const data = {};

    // Basic navigator properties
    data['User Agent'] = navigator.userAgent;
    data['Platform'] = navigator.platform;
    data['Language'] = navigator.language;
    data['Languages'] = navigator.languages ? navigator.languages.join(', ') : 'N/A';
    data['Cookie Enabled'] = navigator.cookieEnabled;
    data['Do Not Track'] = navigator.doNotTrack || 'N/A';
    data['Online'] = navigator.onLine;

    // Screen properties
    data['Screen Width'] = screen.width;
    data['Screen Height'] = screen.height;
    data['Screen Color Depth'] = screen.colorDepth;
    data['Screen Pixel Depth'] = screen.pixelDepth;
    data['Device Pixel Ratio'] = window.devicePixelRatio || 'N/A';

    // Window properties
    data['Window Inner Width'] = window.innerWidth;
    data['Window Inner Height'] = window.innerHeight;

    // Timezone
    data['Timezone'] = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Plugins
    const plugins = [];
    if (navigator.plugins) {
        for (let i = 0; i < navigator.plugins.length; i++) {
            plugins.push(navigator.plugins[i].name);
        }
    }
    data['Plugins'] = plugins.length > 0 ? plugins.join(', ') : 'None or not accessible';

    // Canvas fingerprint
    data['Canvas Fingerprint'] = getCanvasFingerprint();

    // WebGL info
    data['WebGL Vendor'] = getWebGLInfo('VENDOR');
    data['WebGL Renderer'] = getWebGLInfo('RENDERER');

    // Hardware Concurrency
    data['Hardware Concurrency'] = navigator.hardwareConcurrency || 'N/A';

    // Max Touch Points
    data['Max Touch Points'] = navigator.maxTouchPoints || 'N/A';

    // Connection (if available)
    if (navigator.connection) {
        data['Connection Effective Type'] = navigator.connection.effectiveType || 'N/A';
        data['Connection Downlink'] = navigator.connection.downlink || 'N/A';
    } else {
        data['Connection Info'] = 'Not available';
    }

    // Battery (if available)
    if ('getBattery' in navigator) {
        navigator.getBattery().then(battery => {
            data['Battery Charging'] = battery.charging;
            data['Battery Level'] = battery.level;
        }).catch(() => {
            data['Battery Info'] = 'Not available or permission denied';
        });
    } else {
        data['Battery Info'] = 'Not supported';
    }

    // Geolocation (just check if supported)
    data['Geolocation Supported'] = 'geolocation' in navigator;

    // WebRTC (check if supported)
    data['WebRTC Supported'] = 'RTCPeerConnection' in window;

    return data;
}

function getCanvasFingerprint() {
    try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('Fingerprint', 2, 2);
        return canvas.toDataURL().slice(-50); // Last 50 chars for brevity
    } catch (e) {
        return 'Error generating canvas fingerprint';
    }
}

function getWebGLInfo(type) {
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!gl) return 'WebGL not supported';
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (!debugInfo) return 'Debug info not available';
        return type === 'VENDOR' ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    } catch (e) {
        return 'Error getting WebGL info';
    }
}