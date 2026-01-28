// Global state
const networkInfo = {
    ipv4: null,
    ipv6: null,
    localIPs: new Set()
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeNetworkInfo();
});

async function initializeNetworkInfo() {
    updateTimestamp();

    // Fetch basic IP information first
    await Promise.all([
        fetchIPv4Info(),
        fetchIPv6Info()
    ]);

    // Initialize fingerprinting info (runs in background)
    initializeFingerprintInfo();
}

// Toggle details section
function toggleDetails() {
    const detailsSection = document.getElementById('detailsSection');
    const toggleBtn = document.getElementById('toggleBtn');
    const toggleText = document.getElementById('toggleText');

    if (detailsSection.classList.contains('collapsed')) {
        detailsSection.classList.remove('collapsed');
        detailsSection.classList.add('expanded');
        toggleBtn.classList.add('expanded');
        toggleText.textContent = 'Show Less Information';
    } else {
        detailsSection.classList.remove('expanded');
        detailsSection.classList.add('collapsed');
        toggleBtn.classList.remove('expanded');
        toggleText.textContent = 'Show More Information';
    }
}

// Initialize all fingerprinting information
async function initializeFingerprintInfo() {
    await Promise.all([
        detectLocalIPs(),
        displayBrowserInfo(),
        displayHardwareInfo(),
        displayDisplayInfo(),
        displayBrowserFeatures(),
        displayWebGLInfo(),
        displayCanvasFingerprint(),
        displayAudioFingerprint(),
        detectMediaDevices(),
        displaySecurityInfo(),
        detectFonts(),
        displayLocaleInfo(),
        detectPlugins()
    ]);
}

// Fetch IPv4 address and information
async function fetchIPv4Info() {
    try {
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResponse.json();
        networkInfo.ipv4 = ipData.ip;

        document.getElementById('ipv4').textContent = ipData.ip;
        document.getElementById('ipv4').classList.remove('loading');

        await fetchIPDetails(ipData.ip, 'ipv4');
    } catch (error) {
        console.error('Error fetching IPv4:', error);
        document.getElementById('ipv4').textContent = 'Unable to detect';
        document.getElementById('ipv4').classList.remove('loading');
        document.getElementById('ipv4').classList.add('error');
    }
}

// Fetch IPv6 address and information
async function fetchIPv6Info() {
    try {
        const ipResponse = await fetch('https://api64.ipify.org?format=json');
        const ipData = await ipResponse.json();

        if (ipData.ip.includes(':')) {
            networkInfo.ipv6 = ipData.ip;
            document.getElementById('ipv6').textContent = ipData.ip;
            document.getElementById('ipv6').classList.remove('loading');
            await fetchIPDetails(ipData.ip, 'ipv6');
        } else {
            document.getElementById('ipv6').textContent = 'Not available';
            document.getElementById('ipv6').classList.remove('loading');
            document.getElementById('ipv6').classList.add('error');
            updateIPDetails('ipv6', {
                isp: 'IPv6 not configured',
                location: '—',
                coords: '—',
                asn: '—'
            });
        }
    } catch (error) {
        console.error('Error fetching IPv6:', error);
        document.getElementById('ipv6').textContent = 'Not available';
        document.getElementById('ipv6').classList.remove('loading');
        document.getElementById('ipv6').classList.add('error');
    }
}

// Fetch detailed IP information
async function fetchIPDetails(ip, version) {
    try {
        const response = await fetch(`https://ipapi.co/${ip}/json/`);
        const data = await response.json();

        if (data.error) {
            throw new Error(data.reason || 'API error');
        }

        const details = {
            isp: data.org || 'Unknown',
            location: `${data.city || 'Unknown'}, ${data.region || ''}, ${data.country_name || 'Unknown'}`,
            coords: data.latitude && data.longitude ? `${data.latitude}, ${data.longitude}` : 'Unknown',
            timezone: data.timezone || 'Unknown',
            asn: data.asn || 'Unknown'
        };

        updateIPDetails(version, details);
    } catch (error) {
        console.error(`Error fetching details for ${version}:`, error);
        updateIPDetails(version, {
            isp: 'Unable to fetch',
            location: 'Unable to fetch',
            coords: 'Unable to fetch',
            timezone: version === 'ipv4' ? 'Unable to fetch' : undefined,
            asn: 'Unable to fetch'
        });
    }
}

// Update IP details in the DOM
function updateIPDetails(version, details) {
    document.getElementById(`${version}-isp`).textContent = details.isp;
    document.getElementById(`${version}-isp`).classList.remove('loading');

    document.getElementById(`${version}-location`).textContent = details.location;
    document.getElementById(`${version}-location`).classList.remove('loading');

    document.getElementById(`${version}-coords`).textContent = details.coords;
    document.getElementById(`${version}-coords`).classList.remove('loading');

    if (details.timezone && version === 'ipv4') {
        document.getElementById(`${version}-timezone`).textContent = details.timezone;
        document.getElementById(`${version}-timezone`).classList.remove('loading');
    }

    document.getElementById(`${version}-asn`).textContent = details.asn;
    document.getElementById(`${version}-asn`).classList.remove('loading');
}

// Detect local IP addresses using WebRTC
async function detectLocalIPs() {
    const localIPsElement = document.getElementById('local-ips');

    try {
        const pc = new RTCPeerConnection({
            iceServers: [{urls: 'stun:stun.l.google.com:19302'}]
        });

        pc.createDataChannel('');
        pc.createOffer().then(offer => pc.setLocalDescription(offer));

        pc.onicecandidate = (ice) => {
            if (!ice || !ice.candidate || !ice.candidate.candidate) {
                if (networkInfo.localIPs.size === 0) {
                    localIPsElement.textContent = 'Unable to detect';
                    localIPsElement.classList.remove('loading');
                }
                return;
            }

            const candidateStr = ice.candidate.candidate;
            const ipMatch = candidateStr.match(/([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9:]+)/);

            if (ipMatch && ipMatch[1]) {
                const ip = ipMatch[1];
                if (!ip.startsWith('0.') && !ip.startsWith('127.') && ip !== '::1' && !ip.includes('.local')) {
                    networkInfo.localIPs.add(ip);
                    localIPsElement.textContent = Array.from(networkInfo.localIPs).join(', ');
                    localIPsElement.classList.remove('loading');
                }
            }
        };

        setTimeout(() => {
            pc.close();
            if (networkInfo.localIPs.size === 0) {
                localIPsElement.textContent = 'Unable to detect';
                localIPsElement.classList.remove('loading');
            }
        }, 3000);

    } catch (error) {
        console.error('Error detecting local IPs:', error);
        localIPsElement.textContent = 'WebRTC not available';
        localIPsElement.classList.remove('loading');
    }
}

// Display browser and system information
function displayBrowserInfo() {
    const ua = navigator.userAgent;
    let browserName = 'Unknown';
    let browserVersion = 'Unknown';

    if (ua.indexOf('Firefox') > -1) {
        browserName = 'Firefox';
        browserVersion = ua.match(/Firefox\/([0-9.]+)/)?.[1] || 'Unknown';
    } else if (ua.indexOf('Edg') > -1) {
        browserName = 'Edge';
        browserVersion = ua.match(/Edg\/([0-9.]+)/)?.[1] || 'Unknown';
    } else if (ua.indexOf('Chrome') > -1) {
        browserName = 'Chrome';
        browserVersion = ua.match(/Chrome\/([0-9.]+)/)?.[1] || 'Unknown';
    } else if (ua.indexOf('Safari') > -1) {
        browserName = 'Safari';
        browserVersion = ua.match(/Version\/([0-9.]+)/)?.[1] || 'Unknown';
    }

    document.getElementById('browser-info').textContent = `${browserName} ${browserVersion}`;

    const platform = navigator.platform || navigator.userAgentData?.platform || 'Unknown';
    document.getElementById('platform-info').textContent = platform;

    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection) {
        const effectiveType = connection.effectiveType || 'Unknown';
        const downlink = connection.downlink ? `${connection.downlink} Mbps` : '';
        document.getElementById('connection-type').textContent = `${effectiveType}${downlink ? ' - ' + downlink : ''}`;
    } else {
        document.getElementById('connection-type').textContent = 'Unknown';
    }
}

// Display hardware information
function displayHardwareInfo() {
    document.getElementById('cpu-cores').textContent = navigator.hardwareConcurrency || 'Unknown';
    document.getElementById('device-memory').textContent = navigator.deviceMemory ? `${navigator.deviceMemory} GB` : 'Unknown';
    document.getElementById('touch-points').textContent = navigator.maxTouchPoints || '0';

    // Battery status
    if (navigator.getBattery) {
        navigator.getBattery().then(battery => {
            const level = Math.round(battery.level * 100);
            const charging = battery.charging ? 'Charging' : 'Not Charging';
            document.getElementById('battery-status').textContent = `${level}% (${charging})`;
        }).catch(() => {
            document.getElementById('battery-status').textContent = 'Not available';
        });
    } else {
        document.getElementById('battery-status').textContent = 'Not available';
    }
}

// Display screen/display information
function displayDisplayInfo() {
    document.getElementById('screen-resolution').textContent = `${window.screen.width}x${window.screen.height}`;
    document.getElementById('color-depth').textContent = `${window.screen.colorDepth}-bit`;
    document.getElementById('pixel-ratio').textContent = window.devicePixelRatio || '1';

    const orientation = window.screen.orientation?.type ||
                       (window.innerWidth > window.innerHeight ? 'landscape' : 'portrait');
    document.getElementById('orientation').textContent = orientation;
}

// Display browser features
function displayBrowserFeatures() {
    document.getElementById('language').textContent = navigator.language || 'Unknown';
    document.getElementById('cookies-enabled').textContent = navigator.cookieEnabled ? 'Yes' : 'No';
    document.getElementById('dnt').textContent = navigator.doNotTrack || 'Not set';

    // Storage quota
    if (navigator.storage && navigator.storage.estimate) {
        navigator.storage.estimate().then(estimate => {
            const used = (estimate.usage / 1024 / 1024).toFixed(2);
            const quota = (estimate.quota / 1024 / 1024 / 1024).toFixed(2);
            document.getElementById('storage-quota').textContent = `${used} MB / ${quota} GB`;
        }).catch(() => {
            document.getElementById('storage-quota').textContent = 'Unknown';
        });
    } else {
        document.getElementById('storage-quota').textContent = 'Not available';
    }
}

// WebGL fingerprinting
function displayWebGLInfo() {
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

        if (gl) {
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            const vendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR);
            const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
            const version = gl.getParameter(gl.VERSION);

            document.getElementById('webgl-vendor').textContent = vendor;
            document.getElementById('webgl-renderer').textContent = renderer;
            document.getElementById('webgl-version').textContent = version;

            const hash = simpleHash(vendor + renderer + version);
            document.getElementById('webgl-hash').textContent = hash;
        } else {
            document.getElementById('webgl-vendor').textContent = 'Not supported';
            document.getElementById('webgl-renderer').textContent = 'Not supported';
            document.getElementById('webgl-version').textContent = 'Not supported';
            document.getElementById('webgl-hash').textContent = 'N/A';
        }
    } catch (error) {
        console.error('WebGL error:', error);
        document.getElementById('webgl-vendor').textContent = 'Error';
    }
}

// Canvas fingerprinting
function displayCanvasFingerprint() {
    try {
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 50;
        const ctx = canvas.getContext('2d');

        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillStyle = '#f60';
        ctx.fillRect(0, 0, 200, 50);
        ctx.fillStyle = '#069';
        ctx.fillText('Browser Fingerprint', 2, 2);

        const dataURL = canvas.toDataURL();
        const hash = simpleHash(dataURL);

        document.getElementById('canvas-hash').textContent = hash;
        document.getElementById('canvas-supported').textContent = 'Yes';
    } catch (error) {
        console.error('Canvas error:', error);
        document.getElementById('canvas-hash').textContent = 'Error';
        document.getElementById('canvas-supported').textContent = 'No';
    }
}

// Audio context fingerprinting
function displayAudioFingerprint() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
            const context = new AudioContext();
            const oscillator = context.createOscillator();
            const analyser = context.createAnalyser();
            const gainNode = context.createGain();
            const scriptProcessor = context.createScriptProcessor(4096, 1, 1);

            gainNode.gain.value = 0;
            oscillator.connect(analyser);
            analyser.connect(scriptProcessor);
            scriptProcessor.connect(gainNode);
            gainNode.connect(context.destination);
            oscillator.start(0);

            scriptProcessor.onaudioprocess = function(event) {
                const output = event.outputBuffer.getChannelData(0);
                const hash = simpleHash(output.slice(0, 100).join(''));
                document.getElementById('audio-hash').textContent = hash;
                document.getElementById('audio-context').textContent = 'Available';

                oscillator.stop();
                scriptProcessor.disconnect();
                oscillator.disconnect();
                analyser.disconnect();
                gainNode.disconnect();
            };

            setTimeout(() => {
                if (document.getElementById('audio-hash').textContent === '—') {
                    document.getElementById('audio-hash').textContent = 'Timeout';
                    document.getElementById('audio-context').textContent = 'Available';
                }
            }, 1000);
        } else {
            document.getElementById('audio-context').textContent = 'Not available';
            document.getElementById('audio-hash').textContent = 'N/A';
        }
    } catch (error) {
        console.error('Audio error:', error);
        document.getElementById('audio-context').textContent = 'Error';
        document.getElementById('audio-hash').textContent = 'Error';
    }
}

// Detect media devices
async function detectMediaDevices() {
    try {
        if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
            const devices = await navigator.mediaDevices.enumerateDevices();

            const hasCamera = devices.some(device => device.kind === 'videoinput');
            const hasMicrophone = devices.some(device => device.kind === 'audioinput');
            const hasSpeakers = devices.some(device => device.kind === 'audiooutput');

            document.getElementById('has-camera').textContent = hasCamera ? 'Detected' : 'Not detected';
            document.getElementById('has-microphone').textContent = hasMicrophone ? 'Detected' : 'Not detected';
            document.getElementById('has-speakers').textContent = hasSpeakers ? 'Detected' : 'Not detected';
        } else {
            document.getElementById('has-camera').textContent = 'API not available';
            document.getElementById('has-microphone').textContent = 'API not available';
            document.getElementById('has-speakers').textContent = 'API not available';
        }
    } catch (error) {
        console.error('Media devices error:', error);
        document.getElementById('has-camera').textContent = 'Error';
        document.getElementById('has-microphone').textContent = 'Error';
        document.getElementById('has-speakers').textContent = 'Error';
    }
}

// Display security information
function displaySecurityInfo() {
    const webrtcAvailable = !!(window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection);
    document.getElementById('webrtc-status').textContent = webrtcAvailable ? 'Enabled' : 'Disabled';

    const webrtcLeakElement = document.getElementById('webrtc-leak');
    if (webrtcAvailable) {
        webrtcLeakElement.textContent = 'Possible';
        webrtcLeakElement.classList.add('status-warning');
    } else {
        webrtcLeakElement.textContent = 'Protected';
        webrtcLeakElement.classList.add('status-ok');
    }

    document.getElementById('protocol').textContent = window.location.protocol.replace(':', '').toUpperCase();
    document.getElementById('referrer').textContent = document.referrer || 'Direct';
}

// Font detection
function detectFonts() {
    const baseFonts = ['monospace', 'sans-serif', 'serif'];
    const testFonts = ['Arial', 'Verdana', 'Times New Roman', 'Courier New', 'Georgia', 'Palatino', 'Garamond', 'Comic Sans MS', 'Trebuchet MS', 'Impact'];
    const detectedFonts = [];

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const baseWidths = {};
    baseFonts.forEach(font => {
        ctx.font = '72px ' + font;
        baseWidths[font] = ctx.measureText('mmmmmmmmmmlli').width;
    });

    testFonts.forEach(font => {
        let detected = false;
        baseFonts.forEach(baseFont => {
            ctx.font = '72px ' + font + ',' + baseFont;
            const width = ctx.measureText('mmmmmmmmmmlli').width;
            if (width !== baseWidths[baseFont]) {
                detected = true;
            }
        });
        if (detected) {
            detectedFonts.push(font);
        }
    });

    document.getElementById('fonts-detected').textContent = detectedFonts.length > 0 ? `${detectedFonts.length} detected` : 'None';
    document.getElementById('font-hash').textContent = simpleHash(detectedFonts.join(','));
}

// Display locale information
function displayLocaleInfo() {
    try {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        document.getElementById('timezone').textContent = timezone;

        const offset = new Date().getTimezoneOffset();
        const offsetHours = Math.abs(Math.floor(offset / 60));
        const offsetMinutes = Math.abs(offset % 60);
        const offsetSign = offset <= 0 ? '+' : '-';
        document.getElementById('timezone-offset').textContent = `UTC${offsetSign}${offsetHours}:${offsetMinutes.toString().padStart(2, '0')}`;

        const languages = navigator.languages || [navigator.language];
        document.getElementById('languages').textContent = languages.join(', ');
    } catch (error) {
        console.error('Locale error:', error);
        document.getElementById('timezone').textContent = 'Error';
    }
}

// Detect plugins
function detectPlugins() {
    const pluginCount = navigator.plugins ? navigator.plugins.length : 0;
    document.getElementById('plugin-count').textContent = pluginCount;

    // Check for PDF viewer
    const hasPDF = Array.from(navigator.plugins || []).some(plugin =>
        plugin.name.toLowerCase().includes('pdf')
    ) || navigator.mimeTypes['application/pdf']?.enabledPlugin;
    document.getElementById('pdf-viewer').textContent = hasPDF ? 'Detected' : 'Not detected';

    // Simple ad blocker detection
    const adBlocker = document.createElement('div');
    adBlocker.className = 'ad ads advertisement';
    adBlocker.style.cssText = 'position:absolute;top:-999px;left:-999px;';
    document.body.appendChild(adBlocker);

    setTimeout(() => {
        const hasAdBlocker = adBlocker.offsetHeight === 0;
        document.getElementById('ad-blocker').textContent = hasAdBlocker ? 'Likely' : 'Not detected';
        document.body.removeChild(adBlocker);
    }, 100);
}

// Simple hash function
function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(16).substring(0, 8);
}

// Copy to clipboard functionality
function copyToClipboard(elementId) {
    const element = document.getElementById(elementId);
    const text = element.textContent;

    if (text === 'Loading...' || text === 'Unable to detect' || text === 'Not available') {
        return;
    }

    navigator.clipboard.writeText(text).then(() => {
        const button = element.nextElementSibling;
        const originalText = button.textContent;
        button.textContent = '✓';
        button.style.background = '#10b981';

        setTimeout(() => {
            button.textContent = originalText;
            button.style.background = '';
        }, 1500);
    }).catch(err => {
        console.error('Failed to copy:', err);
        alert('Failed to copy to clipboard');
    });
}

// Update timestamp
function updateTimestamp() {
    const now = new Date();
    const formatted = now.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
    document.getElementById('timestamp').textContent = formatted;
}
