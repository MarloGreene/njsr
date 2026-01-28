const typeSelect = document.getElementById('type');
const color1Input = document.getElementById('color1');
const color2Input = document.getElementById('color2');
const angleInput = document.getElementById('angle');
const angleValue = document.getElementById('angleValue');
const stripesCheckbox = document.getElementById('stripes');
const preview = document.getElementById('preview');

function updateBackground() {
    const type = typeSelect.value;
    const color1 = color1Input.value;
    const color2 = color2Input.value;
    const angle = angleInput.value;
    const isStripes = stripesCheckbox.checked;

    let gradient;
    if (isStripes) {
        gradient = `repeating-linear-gradient(${angle}deg, ${color1} 0% 50%, ${color2} 50% 100%)`;
    } else {
        if (type === 'linear') {
            gradient = `linear-gradient(${angle}deg, ${color1}, ${color2})`;
        } else if (type === 'radial') {
            gradient = `radial-gradient(${color1}, ${color2})`;
        } else if (type === 'conic') {
            gradient = `conic-gradient(from ${angle}deg, ${color1}, ${color2})`;
        }
    }

    preview.style.background = gradient;
    preview.style.backgroundRepeat = 'repeat';
    preview.style.backgroundSize = '100px 100px'; // arbitrary size for tiling effect

    // Save to localStorage
    localStorage.setItem('bg_type', type);
    localStorage.setItem('bg_color1', color1);
    localStorage.setItem('bg_color2', color2);
    localStorage.setItem('bg_angle', angle);
    localStorage.setItem('bg_stripes', isStripes);
}

function updateAngleValue() {
    angleValue.textContent = angleInput.value + '°';
}

function loadSettings() {
    const type = localStorage.getItem('bg_type') || 'linear';
    const color1 = localStorage.getItem('bg_color1') || '#ff0000';
    const color2 = localStorage.getItem('bg_color2') || '#0000ff';
    const angle = localStorage.getItem('bg_angle') || '0';
    const stripes = localStorage.getItem('bg_stripes') === 'true';

    typeSelect.value = type;
    color1Input.value = color1;
    color2Input.value = color2;
    angleInput.value = angle;
    stripesCheckbox.checked = stripes;
    updateAngleValue();
    updateBackground();
}

// Event listeners
typeSelect.addEventListener('change', updateBackground);
color1Input.addEventListener('input', updateBackground);
color2Input.addEventListener('input', updateBackground);
color2Input.addEventListener('change', updateBackground); // for color inputs
angleInput.addEventListener('input', () => {
    updateAngleValue();
    updateBackground();
});
stripesCheckbox.addEventListener('change', updateBackground);

// Load on page load
window.addEventListener('load', loadSettings);