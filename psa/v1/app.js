/**
 * PTSD Symptom Awareness Tool
 * Interactive slider that reveals symptoms based on severity level
 * With Criterion A exposure tracking
 */

// VA Compensation rates (2025, single veteran, no dependents)
// Source: https://www.va.gov/disability/compensation-rates/veteran-rates/
const COMPENSATION_RATES = {
    0: 0,
    10: 180.42,
    20: 356.66,
    30: 552.47,
    40: 795.84,
    50: 1132.90,
    60: 1435.02,
    70: 1808.45,
    80: 2102.15,
    90: 2362.30,
    100: 3938.58
};

// Snap points for the slider
const SNAP_POINTS = [0, 10, 30, 50, 70, 90, 100];

// DOM Elements
const slider = document.getElementById('ptsdSlider');
const ratingDisplay = document.getElementById('ratingDisplay');
const compAmount = document.getElementById('compAmount');
const symptomItems = document.querySelectorAll('.symptom-item');
const symptomClusters = document.querySelectorAll('.symptom-cluster');
const exposureCheckboxes = document.querySelectorAll('.exposure-checkbox');
const exposureItems = document.querySelectorAll('.exposure-item');
const exposureCount = document.getElementById('exposureCount');
const exposureResult = document.getElementById('exposureResult');
const exposureMessage = document.getElementById('exposureMessage');
const sliderSection = document.getElementById('sliderSection');
const highRatingAlert = document.getElementById('highRatingAlert');

// Info card elements
const infoCards = {
    ptsd: document.getElementById('infoPtsd'),
    complex: document.getElementById('infoComplex'),
    tbi: document.getElementById('infoTbi'),
    mst: document.getElementById('infoMst'),
    grief: document.getElementById('infoGrief')
};

// Threshold for "high rating" visual state
const HIGH_RATING_THRESHOLD = 50;

/**
 * Initialize the application
 */
function init() {
    // Set up slider event listeners
    slider.addEventListener('input', handleSliderInput);
    slider.addEventListener('change', handleSliderChange);

    // Set up exposure checkbox listeners
    exposureItems.forEach(item => {
        item.addEventListener('click', handleExposureClick);
    });

    // Initial update
    updateDisplay(0);
    updateExposureDisplay();
}

/**
 * Handle exposure item clicks
 */
function handleExposureClick(e) {
    const item = e.currentTarget;
    const checkbox = item.querySelector('input[type="checkbox"]');

    // Toggle checkbox
    checkbox.checked = !checkbox.checked;

    // Update visual state
    if (checkbox.checked) {
        item.classList.add('checked', 'just-checked');
        setTimeout(() => item.classList.remove('just-checked'), 250);
    } else {
        item.classList.remove('checked');
    }

    updateExposureDisplay();
}

/**
 * Update exposure section display
 */
function updateExposureDisplay() {
    const checked = document.querySelectorAll('.exposure-checkbox:checked');
    const count = checked.length;

    // Update count display
    exposureCount.textContent = `${count} selected`;

    // Calculate suggested minimum rating based on exposures
    let totalWeight = 0;
    checked.forEach(cb => {
        totalWeight += parseInt(cb.dataset.weight) || 0;
    });

    // Cap at 100
    const suggestedRating = Math.min(100, totalWeight);

    // Update message based on exposures
    if (count === 0) {
        exposureMessage.textContent = 'Check your experiences above';
    } else if (count === 1) {
        exposureMessage.textContent = 'You may qualify for VA benefits';
    } else if (count <= 3) {
        exposureMessage.textContent = `${count} exposures — you likely qualify`;
    } else {
        exposureMessage.textContent = `${count} exposures — talk to a VSO`;
    }

    // Update info cards based on selections
    updateInfoCards(checked);

    // Auto-adjust slider to suggested rating based on exposures (only if current is lower)
    const currentSliderValue = parseInt(slider.value);
    if (count > 0 && suggestedRating > currentSliderValue) {
        // Animate slider to suggested rating (no cap - let them see the full potential)
        animateSliderTo(suggestedRating);
    }
}

/**
 * Update info cards based on selected exposures
 */
function updateInfoCards(checkedBoxes) {
    // Collect all info types that should be shown
    const activeInfoTypes = new Set();

    checkedBoxes.forEach(cb => {
        const infoTypes = cb.dataset.info;
        if (infoTypes) {
            infoTypes.split(',').forEach(type => activeInfoTypes.add(type.trim()));
        }
    });

    // Also show complex PTSD if multiple high-weight exposures are checked
    const highWeightCount = Array.from(checkedBoxes).filter(cb =>
        parseInt(cb.dataset.weight) >= 20
    ).length;
    if (highWeightCount >= 3) {
        activeInfoTypes.add('complex');
    }

    // Update visibility of each info card
    Object.keys(infoCards).forEach(type => {
        const card = infoCards[type];
        if (card) {
            if (activeInfoTypes.has(type)) {
                card.classList.add('visible');
            } else {
                card.classList.remove('visible');
            }
        }
    });
}

/**
 * Animate slider to target value
 */
function animateSliderTo(target) {
    const current = parseInt(slider.value);
    const snappedTarget = snapToNearest(target);

    if (current >= snappedTarget) return;

    // Animate over 500ms
    const duration = 500;
    const steps = 20;
    const increment = (snappedTarget - current) / steps;
    let step = 0;

    const animate = () => {
        step++;
        const newValue = Math.round(current + (increment * step));
        slider.value = newValue;
        updateDisplay(newValue);

        if (step < steps) {
            setTimeout(animate, duration / steps);
        } else {
            slider.value = snappedTarget;
            updateDisplay(snappedTarget);
        }
    };

    animate();
}

/**
 * Handle real-time slider input
 */
function handleSliderInput(e) {
    const value = parseInt(e.target.value);
    updateDisplay(value);
}

/**
 * Handle slider change (snap to nearest valid value)
 */
function handleSliderChange(e) {
    const value = parseInt(e.target.value);
    const snappedValue = snapToNearest(value);

    if (value !== snappedValue) {
        slider.value = snappedValue;
        updateDisplay(snappedValue);
    }
}

/**
 * Snap value to nearest valid snap point
 */
function snapToNearest(value) {
    let closest = SNAP_POINTS[0];
    let minDiff = Math.abs(value - closest);

    for (const point of SNAP_POINTS) {
        const diff = Math.abs(value - point);
        if (diff < minDiff) {
            minDiff = diff;
            closest = point;
        }
    }

    return closest;
}

/**
 * Update the display based on slider value
 */
function updateDisplay(value) {
    // Update rating display
    ratingDisplay.textContent = `${value}%`;

    // Update compensation amount
    const compensation = getCompensation(value);
    compAmount.textContent = formatCurrency(compensation);

    // Update symptom checkboxes
    updateSymptoms(value);

    // Update cluster highlights
    updateClusterHighlights();

    // Update high rating state (50%+)
    updateHighRatingState(value);
}

/**
 * Show/hide high rating alert and styling when above threshold
 */
function updateHighRatingState(value) {
    const isHighRating = value > HIGH_RATING_THRESHOLD;
    const ratingBar = document.querySelector('.rating-bar');

    // Toggle high-rating class on rating bar
    if (ratingBar) {
        ratingBar.classList.toggle('high-rating', isHighRating);
    }

    // Show/hide alert
    highRatingAlert.classList.toggle('visible', isHighRating);
}

/**
 * Get compensation for a given rating
 */
function getCompensation(rating) {
    // Find the applicable rate (round down to nearest 10)
    const applicableRating = Math.floor(rating / 10) * 10;
    return COMPENSATION_RATES[applicableRating] || 0;
}

/**
 * Format number as currency (compact, no cents)
 */
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

/**
 * Update symptom checkboxes based on slider value
 */
function updateSymptoms(sliderValue) {
    symptomItems.forEach(item => {
        const threshold = parseInt(item.dataset.threshold);
        const checkbox = item.querySelector('input[type="checkbox"]');
        const wasChecked = item.classList.contains('checked');
        const shouldBeChecked = sliderValue >= threshold;

        if (shouldBeChecked && !wasChecked) {
            // Check it
            checkbox.checked = true;
            item.classList.add('checked', 'just-checked');

            // Remove animation class after animation completes
            setTimeout(() => {
                item.classList.remove('just-checked');
            }, 250);
        } else if (!shouldBeChecked && wasChecked) {
            // Uncheck it
            checkbox.checked = false;
            item.classList.remove('checked');
        }
    });
}

/**
 * Highlight clusters that have checked items
 */
function updateClusterHighlights() {
    symptomClusters.forEach(cluster => {
        const hasChecked = cluster.querySelector('.symptom-item.checked');
        cluster.classList.toggle('active', !!hasChecked);
    });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
