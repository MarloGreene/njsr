/**
 * Buddy Letter Structured Narrative Engine
 * A deterministic writing assistant for VA supporting statements
 */

// ============================================================================
// STATEMENT MODE (BUDDY vs SELF)
// ============================================================================

let statementMode = 'buddy'; // 'buddy' or 'self'

/**
 * Toggle between buddy and self statement modes
 */
function setStatementMode(mode) {
    statementMode = mode;
    document.body.classList.toggle('self-mode', mode === 'self');

    // Update header
    const header = document.querySelector('header');
    const h1 = header?.querySelector('h1');
    if (h1) {
        // Remove any existing badge
        const existingBadge = h1.querySelector('.self-mode-badge');
        if (existingBadge) existingBadge.remove();

        if (mode === 'self') {
            const badge = document.createElement('span');
            badge.className = 'self-mode-badge';
            badge.textContent = 'PERSONAL';
            h1.appendChild(badge);
        }
    }

    // Update Section 1 UI
    const section1Title = document.getElementById('section1Title');
    const section1Intro = document.getElementById('section1Intro');
    const yourNameLabel = document.getElementById('yourNameLabel');
    const veteranNameGroup = document.getElementById('veteranNameGroup');
    const relationshipGroup = document.getElementById('relationshipGroup');
    const knowDurationGroup = document.getElementById('knowDurationGroup');
    const contactFrequencyGroup = document.getElementById('contactFrequencyGroup');

    if (mode === 'self') {
        if (section1Title) section1Title.textContent = 'Your Information';
        if (section1Intro) section1Intro.textContent = 'Provide your name for the personal statement. This will be used throughout the letter.';
        if (yourNameLabel) yourNameLabel.textContent = 'Your Full Name (the Veteran)';
        if (veteranNameGroup) veteranNameGroup.style.display = 'none';
        if (relationshipGroup) relationshipGroup.style.display = 'none';
        if (knowDurationGroup) knowDurationGroup.style.display = 'none';
        if (contactFrequencyGroup) contactFrequencyGroup.style.display = 'none';
    } else {
        if (section1Title) section1Title.textContent = 'Your Relationship';
        if (section1Intro) section1Intro.textContent = 'Establish your credibility as a witness. The stronger your connection, the more weight your letter carries.';
        if (yourNameLabel) yourNameLabel.textContent = 'Your Full Name';
        if (veteranNameGroup) veteranNameGroup.style.display = '';
        if (relationshipGroup) relationshipGroup.style.display = '';
        if (knowDurationGroup) knowDurationGroup.style.display = '';
        if (contactFrequencyGroup) contactFrequencyGroup.style.display = '';
    }

    // Update Section 4 UI (Symptoms)
    const section4Title = document.getElementById('section4Title');
    const section4Intro = document.getElementById('section4Intro');

    if (mode === 'self') {
        if (section4Title) section4Title.textContent = 'Your Symptoms';
        if (section4Intro) section4Intro.textContent = 'What symptoms do you experience? Check all that apply. Be honest and thorough.';
    } else {
        if (section4Title) section4Title.textContent = 'What You Observed';
        if (section4Intro) section4Intro.textContent = 'What changes did you personally witness in the veteran? Focus on observable behaviors, not diagnoses. Use "I observed..." language.';
    }

    // Update Section 5 UI (Impact)
    const section5Title = document.getElementById('section5Title');
    const section5Intro = document.getElementById('section5Intro');
    const specificExampleLabel = document.getElementById('specificExampleLabel');
    const specificExample = document.getElementById('specificExample');
    const specificExampleNote = document.getElementById('specificExampleNote');
    const ongoingYes = document.getElementById('ongoingYes');
    const ongoingWorsened = document.getElementById('ongoingWorsened');
    const ongoingNoContactItem = document.getElementById('ongoingNoContactItem');

    if (mode === 'self') {
        if (section5Title) section5Title.textContent = 'Impact on Your Life';
        if (section5Intro) section5Intro.textContent = 'How have these symptoms affected your daily life? This section demonstrates the real-world consequences.';
        if (specificExampleLabel) specificExampleLabel.textContent = 'Specific Example (strongly recommended)';
        if (specificExample) specificExample.placeholder = "Describe a specific incident that illustrates how your condition affects you. E.g., 'Last month I dropped to the ground when a car backfired, believing I was under attack.'";
        if (specificExampleNote) specificExampleNote.textContent = 'Specific incidents are powerful evidence in a personal statement.';
        if (ongoingYes) ongoingYes.textContent = 'Yes, I still experience these symptoms';
        if (ongoingWorsened) ongoingWorsened.textContent = 'Yes, and they have worsened over time';
        if (ongoingNoContactItem) ongoingNoContactItem.style.display = 'none';
    } else {
        if (section5Title) section5Title.textContent = 'Functional Impact';
        if (section5Intro) section5Intro.textContent = "How have these symptoms affected the veteran's daily life? This section demonstrates the real-world consequences.";
        if (specificExampleLabel) specificExampleLabel.textContent = 'Specific Example (strongly recommended)';
        if (specificExample) specificExample.placeholder = "Describe a specific incident you witnessed that illustrates the veteran's condition. E.g., 'I observed him drop to the ground and cover his head when a car backfired at the grocery store.'";
        if (specificExampleNote) specificExampleNote.textContent = 'Specific, observable incidents are the most powerful evidence in a buddy letter.';
        if (ongoingYes) ongoingYes.textContent = 'Yes, I still observe these symptoms';
        if (ongoingWorsened) ongoingWorsened.textContent = 'Yes, and they have worsened over time';
        if (ongoingNoContactItem) ongoingNoContactItem.style.display = '';
    }

    // Update tips
    updateTip(currentSection);

    // Save mode preference
    localStorage.setItem('buddyStatementMode', mode);
    saveProgress();
}

/**
 * Set up statement mode toggle listener
 */
function setupStatementModeToggle() {
    const modeRadios = document.querySelectorAll('input[name="statementMode"]');
    modeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            setStatementMode(e.target.value);
        });
    });

    // Load saved mode preference
    const savedMode = localStorage.getItem('buddyStatementMode');
    if (savedMode === 'self') {
        const selfRadio = document.querySelector('input[name="statementMode"][value="self"]');
        if (selfRadio) {
            selfRadio.checked = true;
            setStatementMode('self');
        }
    }
}

// ============================================================================
// SPARTAN MODE
// ============================================================================

/**
 * Spartan Mode - For combat infantry veterans who check all the boxes
 * Activation methods:
 *   - URL: ?spartan or ?s
 *   - Type "spartan" anywhere on page (not in an input)
 *   - Triple-click the header
 *   - Ctrl+Shift+S
 */

const SPARTAN_EXPOSURES = [
    'ied', 'vbied', 'small_arms', 'indirect', 'ambush', 'convoy',
    'witness_death', 'witness_injury', 'witness_civilian', 'remains',
    'lost_buddy', 'qrf', 'tbi', 'multiple_deploy'
];

const SPARTAN_SYMPTOMS = [
    'nightmares', 'triggered', 'hypervigilant', 'startle',
    'anger', 'sleep_problems', 'avoid_conversations'
];

let spartanMode = false;
let spartanBuffer = '';
let headerClickCount = 0;
let headerClickTimer = null;

/**
 * Activate Spartan Mode
 */
function activateSpartanMode() {
    if (spartanMode) return; // Already active
    spartanMode = true;

    // Visual confirmation - subtle
    const header = document.querySelector('header');
    if (header) {
        header.style.background = 'linear-gradient(135deg, #1a365d 0%, #2d4a3e 100%)';

        // Add subtle badge
        const badge = document.createElement('span');
        badge.className = 'spartan-badge';
        badge.textContent = 'SPARTAN';
        badge.style.cssText = `
            font-size: 0.6rem;
            background: rgba(255,255,255,0.2);
            padding: 2px 6px;
            border-radius: 3px;
            margin-left: 8px;
            letter-spacing: 1px;
            vertical-align: middle;
        `;
        const h1 = header.querySelector('h1');
        if (h1 && !header.querySelector('.spartan-badge')) {
            h1.appendChild(badge);
        }
    }

    // Pre-fill combat infantry exposures
    SPARTAN_EXPOSURES.forEach(exp => {
        const checkbox = document.querySelector(`input[name="exposure"][value="${exp}"]`);
        if (checkbox && !checkbox.checked) {
            checkbox.checked = true;
            const item = checkbox.closest('.checkbox-item');
            if (item) item.classList.add('checked');
        }
    });

    // Pre-fill common symptoms
    SPARTAN_SYMPTOMS.forEach(sym => {
        const checkbox = document.querySelector(`input[name="symptom"][value="${sym}"]`);
        if (checkbox && !checkbox.checked) {
            checkbox.checked = true;
            const item = checkbox.closest('.checkbox-item');
            if (item) item.classList.add('checked');
        }
    });

    // Pre-set relationship to "served together"
    const relationship = document.querySelector('input[name="relationship"][value="served_together"]');
    if (relationship) {
        relationship.checked = true;
    }

    // Pre-fill 1-506 INF deployment context
    const serviceStart = document.getElementById('serviceStart');
    const serviceEnd = document.getElementById('serviceEnd');
    const location = document.getElementById('location');
    const unit = document.getElementById('unit');
    const theaterOif = document.querySelector('input[name="theater"][value="oif"]');

    if (serviceStart && !serviceStart.value) serviceStart.value = '2006-08';
    if (serviceEnd && !serviceEnd.value) serviceEnd.value = '2007-10';
    if (location && !location.value) location.value = 'FOB Warrior, Kirkuk, Iraq; Baqubah (surge operations)';
    if (unit && !unit.value) unit.value = 'Charlie Company, 2-35 Infantry Battalion, 3rd IBCT, 25th Infantry Division';
    if (theaterOif && !theaterOif.checked) {
        theaterOif.checked = true;
        const item = theaterOif.closest('.checkbox-item');
        if (item) item.classList.add('checked');
    }

    // Update sidebar tip for Spartan Mode
    const tipElement = document.getElementById('currentTip');
    if (tipElement) {
        tipElement.innerHTML = `<p><strong>Charlie Rock.</strong> 2-35 IN deployment data pre-filled. Sections 1-4 are expanded for review. Add your names above, then click "Add Specific Example" to open Section 5. That's what wins these.</p>`;
    }

    // Show the quick track panel
    const quickTrack = document.getElementById('spartanQuickTrack');
    if (quickTrack) {
        quickTrack.style.display = 'block';
    }

    // Expand sections with pre-filled data so users can see/review them
    [1, 2, 3, 4].forEach(num => {
        const section = document.getElementById(`section${num}`);
        if (section) {
            section.classList.remove('collapsed');
            section.classList.add('expanded');
        }
    });

    // Keep sections 5 and 6 collapsed - user needs to add specific example
    [5, 6].forEach(num => {
        const section = document.getElementById(`section${num}`);
        if (section) {
            section.classList.remove('expanded');
            section.classList.add('collapsed');
        }
    });

    // Scroll to top of section 1 for name entry
    scrollToSection(1);

    // Update nav pills to reflect expanded state
    updateNavPills();

    // Save state
    localStorage.setItem('buddySpartanMode', 'true');
    saveProgress();

    console.log('Spartan Mode activated. RLTW.');
}

/**
 * Check for Spartan Mode triggers on page load
 */
function checkSpartanTriggers() {
    // URL parameter check
    const params = new URLSearchParams(window.location.search);
    if (params.has('spartan') || params.has('s') || params.get('mode') === 'spartan') {
        setTimeout(activateSpartanMode, 100);
        return;
    }

    // Check localStorage for returning Spartan users
    if (localStorage.getItem('buddySpartanMode') === 'true') {
        spartanMode = true;
        // Re-apply visual indicator
        const header = document.querySelector('header');
        if (header) {
            header.style.background = 'linear-gradient(135deg, #1a365d 0%, #2d4a3e 100%)';
            const badge = document.createElement('span');
            badge.className = 'spartan-badge';
            badge.textContent = 'SPARTAN';
            badge.style.cssText = `
                font-size: 0.6rem;
                background: rgba(255,255,255,0.2);
                padding: 2px 6px;
                border-radius: 3px;
                margin-left: 8px;
                letter-spacing: 1px;
                vertical-align: middle;
            `;
            const h1 = header.querySelector('h1');
            if (h1 && !header.querySelector('.spartan-badge')) {
                h1.appendChild(badge);
            }
        }
        // Show quick track panel
        const quickTrack = document.getElementById('spartanQuickTrack');
        if (quickTrack) {
            quickTrack.style.display = 'block';
        }
    }
}

/**
 * Set up Spartan Mode keyboard triggers
 */
function setupSpartanTriggers() {
    // Type "spartan" anywhere (not in input)
    document.addEventListener('keypress', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
            return;
        }
        spartanBuffer += e.key.toLowerCase();
        if (spartanBuffer.length > 10) {
            spartanBuffer = spartanBuffer.slice(-10);
        }
        if (spartanBuffer.includes('spartan')) {
            spartanBuffer = '';
            activateSpartanMode();
        }
    });

    // Ctrl+Shift+S
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 's') {
            e.preventDefault();
            activateSpartanMode();
        }
    });

    // Triple-click header
    const header = document.querySelector('header');
    if (header) {
        header.addEventListener('click', () => {
            headerClickCount++;
            clearTimeout(headerClickTimer);
            headerClickTimer = setTimeout(() => {
                headerClickCount = 0;
            }, 500);

            if (headerClickCount >= 3) {
                headerClickCount = 0;
                activateSpartanMode();
            }
        });
    }
}

// ============================================================================
// CONTROLLED VOCABULARY & TAXONOMY
// ============================================================================

/**
 * Canonical exposure categories with formal language
 */
const EXPOSURE_TAXONOMY = {
    ied: {
        canonical: "Improvised Explosive Device (IED) exposure",
        synonyms: ["ied", "roadside bomb", "blown up", "got hit", "eod", "pressure plate", "buried bomb"],
        narrative: "was exposed to an Improvised Explosive Device (IED) blast"
    },
    vbied: {
        canonical: "Vehicle-Borne Improvised Explosive Device (VBIED) exposure",
        synonyms: ["vbied", "car bomb", "svbied", "truck bomb", "vehicle bomb"],
        narrative: "was exposed to a Vehicle-Borne Improvised Explosive Device (VBIED) attack"
    },
    small_arms: {
        canonical: "small arms fire engagement",
        synonyms: ["firefight", "tic", "troops in contact", "gunfire", "shot at", "ak fire", "small arms"],
        narrative: "engaged in direct small arms fire exchanges with hostile forces"
    },
    indirect: {
        canonical: "indirect fire attack",
        synonyms: ["idf", "mortar", "rocket", "incoming", "107mm", "122mm", "katyusha"],
        narrative: "was subjected to indirect fire attacks including mortar and/or rocket fire"
    },
    ambush: {
        canonical: "ambush/complex attack",
        synonyms: ["ambush", "complex attack", "coordinated attack", "attacked"],
        narrative: "survived an ambush or complex coordinated attack"
    },
    rpg: {
        canonical: "Rocket-Propelled Grenade (RPG) attack",
        synonyms: ["rpg", "rocket attack", "rpg fire"],
        narrative: "was targeted by Rocket-Propelled Grenade (RPG) fire"
    },
    witness_death: {
        canonical: "witnessed death of service member",
        synonyms: ["saw someone die", "buddy killed", "watched die", "kia"],
        narrative: "witnessed the death of a fellow service member"
    },
    witness_injury: {
        canonical: "witnessed severe traumatic injury",
        synonyms: ["saw someone get hurt", "wounded", "injured", "blown up", "casualty"],
        narrative: "witnessed severe traumatic injuries to others"
    },
    witness_civilian: {
        canonical: "witnessed civilian casualties",
        synonyms: ["civilian death", "collateral", "innocent", "women and children"],
        narrative: "witnessed civilian casualties"
    },
    remains: {
        canonical: "handling of human remains",
        synonyms: ["human remains", "body parts", "dead bodies", "mortuary affairs"],
        narrative: "was involved in handling human remains"
    },
    lost_buddy: {
        canonical: "loss of close friend/battle buddy killed in action",
        synonyms: ["lost buddy", "friend killed", "battle buddy kia", "lost a friend"],
        narrative: "lost a close friend and battle buddy who was killed in action"
    },
    mst: {
        canonical: "Military Sexual Trauma (MST)",
        synonyms: ["mst", "sexual assault", "sexual harassment", "rape"],
        narrative: "experienced Military Sexual Trauma (MST)"
    },
    tbi: {
        canonical: "Traumatic Brain Injury (TBI) / blast exposure",
        synonyms: ["tbi", "concussion", "blast", "bell rung", "head injury"],
        narrative: "sustained blast exposure consistent with Traumatic Brain Injury (TBI)"
    },
    convoy: {
        canonical: "combat convoy operations",
        synonyms: ["convoy", "outside the wire", "otw", "mounted patrol", "route clearance"],
        narrative: "conducted regular combat convoy operations outside the wire"
    },
    qrf: {
        canonical: "Quick Reaction Force (QRF) response",
        synonyms: ["qrf", "first responder", "medevac", "cas evac"],
        narrative: "served as Quick Reaction Force (QRF), responding to active combat incidents"
    },
    multiple_deploy: {
        canonical: "multiple combat deployments",
        synonyms: ["multiple deployments", "several tours", "back to back"],
        narrative: "completed multiple combat deployments"
    }
};

/**
 * Symptom vocabulary with observational language
 */
const SYMPTOM_VOCABULARY = {
    // Intrusion symptoms
    nightmares: "recurring nightmares and disturbed sleep patterns",
    flashbacks: "flashback episodes where they appeared to relive traumatic events",
    triggered: "visible distress when exposed to reminders of their service",
    physical_reaction: "physical reactions to triggers including sweating and trembling",

    // Avoidance symptoms
    avoid_conversations: "consistent avoidance of any discussions about their military service",
    avoid_places: "avoidance of crowded public places",
    avoid_people: "withdrawal from friends and family members",
    avoid_activities: "abandonment of activities and hobbies they previously enjoyed",

    // Negative cognition/mood
    emotional_numb: "emotional numbness and difficulty connecting with others",
    negative_beliefs: "persistent negative beliefs about themselves and the world",
    guilt_blame: "excessive guilt and self-blame regarding events during their service",
    loss_interest: "marked loss of interest in life and future planning",
    detached: "detachment from loved ones and difficulty maintaining relationships",
    no_positive: "inability to experience positive emotions such as happiness or love",

    // Hyperarousal
    anger: "frequent anger outbursts and irritability disproportionate to the situation",
    hypervigilant: "constant hypervigilance, always scanning for threats in their environment",
    startle: "exaggerated startle response to unexpected sounds or movements",
    sleep_problems: "chronic difficulty falling or staying asleep",
    concentration: "significant difficulty concentrating on tasks",
    reckless: "engagement in reckless or self-destructive behaviors"
};

/**
 * Impact vocabulary
 */
const IMPACT_VOCABULARY = {
    job_loss: "has lost employment due to symptoms",
    job_difficulty: "has experienced significant difficulty maintaining steady employment",
    conflict_coworkers: "has had repeated conflicts with coworkers and supervisors",
    reduced_performance: "has shown noticeably reduced work performance",
    relationship_strain: "has experienced severe strain in personal relationships",
    divorce: "has gone through divorce or separation",
    isolation: "has become increasingly socially isolated",
    lost_friendships: "has lost long-standing friendships",
    self_care: "has difficulty maintaining basic self-care and hygiene",
    substance: "has increased alcohol or substance use as a coping mechanism",
    leave_house: "has difficulty leaving their home",
    routine_tasks: "struggles to complete routine daily tasks"
};

/**
 * Relationship phrases for credibility statements
 */
const RELATIONSHIP_PHRASES = {
    served_together: "I served alongside [VETERAN] in the same military unit",
    battle_buddy: "I was [VETERAN]'s battle buddy and direct teammate",
    squad_leader: "I served as [VETERAN]'s squad leader/NCO and was directly responsible for their welfare",
    platoon_leader: "I served as [VETERAN]'s platoon leader/commanding officer",
    spouse: "I am [VETERAN]'s spouse/domestic partner and have lived with them",
    family: "I am a close family member of [VETERAN] and have maintained regular contact",
    coworker: "I have worked alongside [VETERAN] as a colleague",
    friend: "I am a close personal friend of [VETERAN]"
};

/**
 * Contact frequency phrases
 */
const FREQUENCY_PHRASES = {
    daily: "during which time we had daily contact",
    weekly: "during which time we had weekly contact",
    monthly: "during which time we maintained regular monthly contact",
    quarterly: "during which time we stayed in contact every few months",
    yearly: "during which time we maintained periodic contact"
};

/**
 * Theater of operations names
 */
const THEATER_NAMES = {
    oif: "Operation Iraqi Freedom (OIF)",
    oef: "Operation Enduring Freedom (OEF) in Afghanistan",
    oir: "Operation Inherent Resolve (OIR)",
    desert_storm: "Operation Desert Storm/Desert Shield",
    vietnam: "the Vietnam War",
    other: "overseas deployment",
    conus: "stateside duty"
};

// ============================================================================
// NORMALIZATION ENGINE
// ============================================================================

/**
 * Normalize informal text to canonical exposure categories
 * @param {string} text - User input text
 * @returns {Array} Array of matched exposures with confidence scores
 */
function normalizeExposureText(text) {
    const results = [];
    const lowerText = text.toLowerCase();

    for (const [key, exposure] of Object.entries(EXPOSURE_TAXONOMY)) {
        for (const synonym of exposure.synonyms) {
            if (lowerText.includes(synonym.toLowerCase())) {
                results.push({
                    key: key,
                    canonical: exposure.canonical,
                    matched: synonym,
                    confidence: synonym.length > 3 ? 'high' : 'medium'
                });
                break; // Only match once per category
            }
        }
    }

    return results;
}

/**
 * Generate suggestion panel content for ambiguous input
 * @param {Array} matches - Normalized matches
 * @returns {string} HTML content for suggestions
 */
function generateSuggestions(matches) {
    if (matches.length === 0) {
        return '<p class="no-match">No standard terminology matched. Consider selecting from the checkboxes above.</p>';
    }

    let html = '<ul class="suggestion-list">';
    for (const match of matches) {
        html += `<li class="${match.confidence}-confidence">
            <strong>${match.canonical}</strong>
            <span class="matched-term">(matched: "${match.matched}")</span>
        </li>`;
    }
    html += '</ul>';

    return html;
}

// ============================================================================
// NARRATIVE ASSEMBLY ENGINE
// ============================================================================

/**
 * Get all form data
 */
function getFormData() {
    const data = {
        // Section 1: Relationship
        yourName: document.getElementById('yourName')?.value || '',
        veteranName: document.getElementById('veteranName')?.value || '',
        relationship: document.querySelector('input[name="relationship"]:checked')?.value || '',
        knowYears: document.getElementById('knowYears')?.value || '0',
        knowMonths: document.getElementById('knowMonths')?.value || '0',
        contactFrequency: document.getElementById('contactFrequency')?.value || '',

        // Section 2: Context
        serviceStart: document.getElementById('serviceStart')?.value || '',
        serviceEnd: document.getElementById('serviceEnd')?.value || '',
        unit: document.getElementById('unit')?.value || '',
        location: document.getElementById('location')?.value || '',
        theaters: Array.from(document.querySelectorAll('input[name="theater"]:checked')).map(cb => cb.value),

        // Section 3: Exposures
        exposures: Array.from(document.querySelectorAll('input[name="exposure"]:checked')).map(cb => cb.value),
        exposureDetails: document.getElementById('exposureDetails')?.value || '',

        // Section 4: Symptoms
        symptoms: Array.from(document.querySelectorAll('input[name="symptom"]:checked')).map(cb => cb.value),

        // Section 5: Impact
        impacts: Array.from(document.querySelectorAll('input[name="impact"]:checked')).map(cb => cb.value),
        specificExample: document.getElementById('specificExample')?.value || '',
        ongoing: document.querySelector('input[name="ongoing"]:checked')?.value || 'yes'
    };

    return data;
}

/**
 * Format duration in natural language
 */
function formatDuration(years, months) {
    const y = parseInt(years) || 0;
    const m = parseInt(months) || 0;

    if (y === 0 && m === 0) return '';

    const parts = [];
    if (y > 0) parts.push(`${y} year${y !== 1 ? 's' : ''}`);
    if (m > 0) parts.push(`${m} month${m !== 1 ? 's' : ''}`);

    return parts.join(' and ');
}

/**
 * Format date range
 */
function formatDateRange(start, end) {
    if (!start && !end) return '';

    const formatMonth = (dateStr) => {
        if (!dateStr) return '';
        const [year, month] = dateStr.split('-');
        const date = new Date(year, month - 1);
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    };

    if (start && end) {
        return `from ${formatMonth(start)} to ${formatMonth(end)}`;
    } else if (start) {
        return `beginning ${formatMonth(start)}`;
    } else {
        return `through ${formatMonth(end)}`;
    }
}

/**
 * Self-mode symptom vocabulary (first-person)
 */
const SELF_SYMPTOM_VOCABULARY = {
    // Intrusion symptoms
    nightmares: "recurring nightmares and disturbed sleep",
    flashbacks: "flashback episodes where I relive traumatic events",
    triggered: "visible distress when exposed to reminders of my service",
    physical_reaction: "physical reactions to triggers including sweating and trembling",

    // Avoidance symptoms
    avoid_conversations: "I avoid any discussions about my military service",
    avoid_places: "I avoid crowded public places",
    avoid_people: "I have withdrawn from friends and family members",
    avoid_activities: "I have abandoned activities and hobbies I previously enjoyed",

    // Negative cognition/mood
    emotional_numb: "emotional numbness and difficulty connecting with others",
    negative_beliefs: "persistent negative beliefs about myself and the world",
    guilt_blame: "excessive guilt and self-blame regarding events during my service",
    loss_interest: "marked loss of interest in life and future planning",
    detached: "detachment from loved ones and difficulty maintaining relationships",
    no_positive: "inability to experience positive emotions such as happiness or love",

    // Hyperarousal
    anger: "frequent anger outbursts and irritability disproportionate to the situation",
    hypervigilant: "constant hypervigilance, always scanning for threats in my environment",
    startle: "exaggerated startle response to unexpected sounds or movements",
    sleep_problems: "chronic difficulty falling or staying asleep",
    concentration: "significant difficulty concentrating on tasks",
    reckless: "engagement in reckless or self-destructive behaviors"
};

/**
 * Self-mode impact vocabulary (first-person)
 */
const SELF_IMPACT_VOCABULARY = {
    job_loss: "I have lost employment due to my symptoms",
    job_difficulty: "I have experienced significant difficulty maintaining steady employment",
    conflict_coworkers: "I have had repeated conflicts with coworkers and supervisors",
    reduced_performance: "my work performance has noticeably declined",
    relationship_strain: "my personal relationships have become severely strained",
    divorce: "I have gone through divorce or separation",
    isolation: "I have become increasingly socially isolated",
    lost_friendships: "I have lost long-standing friendships",
    self_care: "I have difficulty maintaining basic self-care and hygiene",
    substance: "I have increased alcohol or substance use as a coping mechanism",
    leave_house: "I have difficulty leaving my home",
    routine_tasks: "I struggle to complete routine daily tasks"
};

/**
 * Generate the complete buddy letter
 */
function generateLetter() {
    const data = getFormData();

    // Check if we're in self mode
    if (statementMode === 'self') {
        return generateSelfLetter(data);
    }

    const veteranFirst = data.veteranName.split(' ')[0] || 'the veteran';
    const paragraphs = [];

    // -------------------------------------------------------------------------
    // SECTION 1: Opening & Credibility Statement
    // -------------------------------------------------------------------------
    let opening = 'To Whom It May Concern:\n\n';

    // Build credibility statement
    let credibility = `I, ${data.yourName || '[YOUR NAME]'}, am writing this statement in support of ${data.veteranName || '[VETERAN NAME]'}'s claim for VA disability benefits. `;

    if (data.relationship && RELATIONSHIP_PHRASES[data.relationship]) {
        credibility += RELATIONSHIP_PHRASES[data.relationship].replace('[VETERAN]', data.veteranName || 'the veteran');
    }

    const duration = formatDuration(data.knowYears, data.knowMonths);
    if (duration) {
        credibility += ` for ${duration}`;
    }

    if (data.contactFrequency && FREQUENCY_PHRASES[data.contactFrequency]) {
        credibility += `, ${FREQUENCY_PHRASES[data.contactFrequency]}`;
    }

    credibility += '.';
    paragraphs.push(credibility);

    // -------------------------------------------------------------------------
    // SECTION 2: Context & Timeline
    // -------------------------------------------------------------------------
    let context = '';

    if (data.unit || data.location || data.theaters.length > 0 || data.serviceStart) {
        const contextParts = [];

        if (data.unit) {
            contextParts.push(`${data.veteranName || 'The veteran'} served with ${data.unit}`);
        }

        if (data.theaters.length > 0) {
            const theaterNames = data.theaters
                .filter(t => THEATER_NAMES[t])
                .map(t => THEATER_NAMES[t]);
            if (theaterNames.length > 0) {
                if (contextParts.length > 0) {
                    contextParts.push(`during ${theaterNames.join(' and ')}`);
                } else {
                    contextParts.push(`${data.veteranName || 'The veteran'} served during ${theaterNames.join(' and ')}`);
                }
            }
        }

        if (data.location) {
            contextParts.push(`stationed at/near ${data.location}`);
        }

        const dateRange = formatDateRange(data.serviceStart, data.serviceEnd);
        if (dateRange) {
            contextParts.push(dateRange);
        }

        if (contextParts.length > 0) {
            context = contextParts.join(', ') + '.';
            paragraphs.push(context);
        }
    }

    // -------------------------------------------------------------------------
    // SECTION 3: Exposure Description
    // -------------------------------------------------------------------------
    if (data.exposures.length > 0) {
        let exposureText = `During this time, I have personal knowledge that ${data.veteranName || 'the veteran'} `;

        const exposureNarratives = data.exposures
            .filter(e => EXPOSURE_TAXONOMY[e])
            .map(e => EXPOSURE_TAXONOMY[e].narrative);

        if (exposureNarratives.length === 1) {
            exposureText += exposureNarratives[0] + '.';
        } else if (exposureNarratives.length === 2) {
            exposureText += exposureNarratives.join(' and ') + '.';
        } else if (exposureNarratives.length > 2) {
            const last = exposureNarratives.pop();
            exposureText += exposureNarratives.join(', ') + ', and ' + last + '.';
        }

        paragraphs.push(exposureText);
    }

    // -------------------------------------------------------------------------
    // SECTION 4: Observed Symptoms
    // -------------------------------------------------------------------------
    if (data.symptoms.length > 0) {
        let symptomText = `Following these experiences, I personally observed significant changes in ${veteranFirst}'s behavior and demeanor. Specifically, I observed `;

        const symptomDescriptions = data.symptoms
            .filter(s => SYMPTOM_VOCABULARY[s])
            .map(s => SYMPTOM_VOCABULARY[s]);

        if (symptomDescriptions.length === 1) {
            symptomText += symptomDescriptions[0] + '.';
        } else if (symptomDescriptions.length === 2) {
            symptomText += symptomDescriptions.join(' and ') + '.';
        } else if (symptomDescriptions.length > 2) {
            const last = symptomDescriptions.pop();
            symptomText += symptomDescriptions.join('; ') + '; and ' + last + '.';
        }

        paragraphs.push(symptomText);
    }

    // -------------------------------------------------------------------------
    // SECTION 5: Functional Impact
    // -------------------------------------------------------------------------
    if (data.impacts.length > 0) {
        let impactText = `These symptoms have had a significant impact on ${veteranFirst}'s daily life. `;
        impactText += `I have observed that ${data.veteranName || 'the veteran'} `;

        const impactDescriptions = data.impacts
            .filter(i => IMPACT_VOCABULARY[i])
            .map(i => IMPACT_VOCABULARY[i]);

        if (impactDescriptions.length === 1) {
            impactText += impactDescriptions[0] + '.';
        } else if (impactDescriptions.length === 2) {
            impactText += impactDescriptions.join(' and ') + '.';
        } else if (impactDescriptions.length > 2) {
            const last = impactDescriptions.pop();
            impactText += impactDescriptions.join(', ') + ', and ' + last + '.';
        }

        paragraphs.push(impactText);
    }

    // -------------------------------------------------------------------------
    // SECTION 6: Specific Example
    // -------------------------------------------------------------------------
    if (data.specificExample && data.specificExample.trim()) {
        const exampleText = `As a specific example of the behaviors I have observed: ${data.specificExample.trim()}`;
        paragraphs.push(exampleText);
    }

    // -------------------------------------------------------------------------
    // SECTION 7: Current Status / Persistence
    // -------------------------------------------------------------------------
    let persistenceText = '';
    switch (data.ongoing) {
        case 'yes':
            persistenceText = `These symptoms and behaviors continue to the present day. I continue to observe the same patterns of behavior described above.`;
            break;
        case 'worsened':
            persistenceText = `These symptoms and behaviors have continued and, in my observation, have worsened over time. ${veteranFirst}'s condition appears to have deteriorated since I first began observing these changes.`;
            break;
        case 'no_contact':
            persistenceText = `Although I am no longer in regular contact with ${data.veteranName || 'the veteran'}, my observations during the time we were in contact were consistent with the symptoms described above.`;
            break;
    }
    if (persistenceText) {
        paragraphs.push(persistenceText);
    }

    // -------------------------------------------------------------------------
    // SECTION 8: Closing Affirmation
    // -------------------------------------------------------------------------
    let closing = `I am providing this statement of my own free will, based on my personal observations and knowledge. `;
    closing += `The statements contained herein are true and correct to the best of my knowledge and belief. `;
    closing += `I am willing to provide additional information or testimony if required to support ${data.veteranName || 'the veteran'}'s claim.`;
    paragraphs.push(closing);

    // Signature block
    const today = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    let signature = `\n\nRespectfully submitted,\n\n\n`;
    signature += `_________________________________\n`;
    signature += `${data.yourName || '[YOUR NAME]'}\n`;
    signature += `Date: ${today}\n\n`;
    signature += `Contact Information:\n`;
    signature += `Phone: _________________________\n`;
    signature += `Email: _________________________\n`;
    signature += `Address: _______________________`;

    // Assemble final letter
    const letter = opening + paragraphs.join('\n\n') + signature;

    return letter;
}

/**
 * Generate a personal statement (self-mode letter)
 */
function generateSelfLetter(data) {
    const myName = data.yourName || '[YOUR NAME]';
    const paragraphs = [];

    // -------------------------------------------------------------------------
    // SECTION 1: Opening
    // -------------------------------------------------------------------------
    let opening = 'To Whom It May Concern:\n\n';

    // Build opening statement
    let intro = `I, ${myName}, am writing this personal statement in support of my claim for VA disability benefits.`;
    paragraphs.push(intro);

    // -------------------------------------------------------------------------
    // SECTION 2: Service Context & Timeline
    // -------------------------------------------------------------------------
    if (data.unit || data.location || data.theaters.length > 0 || data.serviceStart) {
        const contextParts = [];

        if (data.unit) {
            contextParts.push(`I served with ${data.unit}`);
        } else {
            contextParts.push('I served in the United States military');
        }

        if (data.theaters.length > 0) {
            const theaterNames = data.theaters
                .filter(t => THEATER_NAMES[t])
                .map(t => THEATER_NAMES[t]);
            if (theaterNames.length > 0) {
                contextParts.push(`during ${theaterNames.join(' and ')}`);
            }
        }

        if (data.location) {
            contextParts.push(`stationed at/near ${data.location}`);
        }

        const dateRange = formatDateRange(data.serviceStart, data.serviceEnd);
        if (dateRange) {
            contextParts.push(dateRange);
        }

        if (contextParts.length > 0) {
            paragraphs.push(contextParts.join(', ') + '.');
        }
    }

    // -------------------------------------------------------------------------
    // SECTION 3: Exposure Description
    // -------------------------------------------------------------------------
    if (data.exposures.length > 0) {
        let exposureText = 'During my service, I ';

        // Convert third-person narratives to first-person
        const exposureNarratives = data.exposures
            .filter(e => EXPOSURE_TAXONOMY[e])
            .map(e => {
                // Convert "was exposed to" → "was exposed to"
                // Convert "engaged in" → "engaged in"
                // etc. - mostly works as-is since narrative is about the action
                return EXPOSURE_TAXONOMY[e].narrative;
            });

        if (exposureNarratives.length === 1) {
            exposureText += exposureNarratives[0] + '.';
        } else if (exposureNarratives.length === 2) {
            exposureText += exposureNarratives.join(' and ') + '.';
        } else if (exposureNarratives.length > 2) {
            const last = exposureNarratives.pop();
            exposureText += exposureNarratives.join(', ') + ', and ' + last + '.';
        }

        paragraphs.push(exposureText);
    }

    // -------------------------------------------------------------------------
    // SECTION 4: Symptoms Experienced
    // -------------------------------------------------------------------------
    if (data.symptoms.length > 0) {
        let symptomText = 'As a result of these experiences, I have developed the following symptoms: ';

        const symptomDescriptions = data.symptoms
            .filter(s => SELF_SYMPTOM_VOCABULARY[s])
            .map(s => SELF_SYMPTOM_VOCABULARY[s]);

        if (symptomDescriptions.length === 1) {
            symptomText += symptomDescriptions[0] + '.';
        } else if (symptomDescriptions.length === 2) {
            symptomText += symptomDescriptions.join(' and ') + '.';
        } else if (symptomDescriptions.length > 2) {
            const last = symptomDescriptions.pop();
            symptomText += symptomDescriptions.join('; ') + '; and ' + last + '.';
        }

        paragraphs.push(symptomText);
    }

    // -------------------------------------------------------------------------
    // SECTION 5: Functional Impact
    // -------------------------------------------------------------------------
    if (data.impacts.length > 0) {
        let impactText = 'These symptoms have had a significant impact on my daily life. ';

        const impactDescriptions = data.impacts
            .filter(i => SELF_IMPACT_VOCABULARY[i])
            .map(i => SELF_IMPACT_VOCABULARY[i]);

        if (impactDescriptions.length === 1) {
            impactText += impactDescriptions[0] + '.';
        } else if (impactDescriptions.length === 2) {
            impactText += impactDescriptions.join(' and ') + '.';
        } else if (impactDescriptions.length > 2) {
            const last = impactDescriptions.pop();
            impactText += impactDescriptions.join(', ') + ', and ' + last + '.';
        }

        paragraphs.push(impactText);
    }

    // -------------------------------------------------------------------------
    // SECTION 6: Specific Example
    // -------------------------------------------------------------------------
    if (data.specificExample && data.specificExample.trim()) {
        const exampleText = `As a specific example: ${data.specificExample.trim()}`;
        paragraphs.push(exampleText);
    }

    // -------------------------------------------------------------------------
    // SECTION 7: Current Status / Persistence
    // -------------------------------------------------------------------------
    let persistenceText = '';
    switch (data.ongoing) {
        case 'yes':
            persistenceText = 'These symptoms continue to the present day and affect my daily functioning.';
            break;
        case 'worsened':
            persistenceText = 'These symptoms have continued and have worsened over time. My condition has deteriorated since these symptoms first began.';
            break;
        case 'no_contact':
            // This option is hidden in self-mode, but handle it just in case
            persistenceText = 'These symptoms have persisted since my service.';
            break;
    }
    if (persistenceText) {
        paragraphs.push(persistenceText);
    }

    // -------------------------------------------------------------------------
    // SECTION 8: Closing Affirmation
    // -------------------------------------------------------------------------
    let closing = 'I am providing this statement of my own free will. ';
    closing += 'The statements contained herein are true and correct to the best of my knowledge and belief. ';
    closing += 'I am willing to provide additional information or testimony if required to support my claim.';
    paragraphs.push(closing);

    // Signature block
    const today = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    let signature = `\n\nRespectfully submitted,\n\n\n`;
    signature += `_________________________________\n`;
    signature += `${myName}\n`;
    signature += `Date: ${today}\n\n`;
    signature += `Contact Information:\n`;
    signature += `Phone: _________________________\n`;
    signature += `Email: _________________________\n`;
    signature += `Address: _______________________`;

    // Assemble final letter
    const letter = opening + paragraphs.join('\n\n') + signature;

    return letter;
}

// ============================================================================
// UI MANAGEMENT - Collapsible Sections
// ============================================================================

let currentSection = 1;
const totalSections = 6;

/**
 * Toggle a section's expanded/collapsed state
 */
function toggleSection(sectionNum) {
    const section = document.getElementById(`section${sectionNum}`);
    if (!section) return;

    const isExpanded = section.classList.contains('expanded');

    if (isExpanded) {
        section.classList.remove('expanded');
        section.classList.add('collapsed');
    } else {
        section.classList.remove('collapsed');
        section.classList.add('expanded');

        // If expanding section 6 (Review), generate the letter
        if (sectionNum === 6) {
            const letterContent = document.getElementById('letterContent');
            if (letterContent) {
                letterContent.textContent = generateLetter();
            }
        }
    }

    updateNavPills();
    saveProgress();
}

/**
 * Scroll to and expand a section
 */
function scrollToSection(sectionNum) {
    const section = document.getElementById(`section${sectionNum}`);
    if (!section) return;

    // Expand the section if collapsed
    if (section.classList.contains('collapsed')) {
        section.classList.remove('collapsed');
        section.classList.add('expanded');

        // If expanding section 6 (Review), generate the letter
        if (sectionNum === 6) {
            const letterContent = document.getElementById('letterContent');
            if (letterContent) {
                letterContent.textContent = generateLetter();
            }
        }
    }

    // Scroll to the section with offset for sticky nav
    const navHeight = document.querySelector('.section-nav')?.offsetHeight || 50;
    const sectionTop = section.getBoundingClientRect().top + window.pageYOffset - navHeight - 10;

    window.scrollTo({
        top: sectionTop,
        behavior: 'smooth'
    });

    currentSection = sectionNum;
    updateNavPills();
    updateTip(sectionNum);
    saveProgress();
}

/**
 * Toggle all sections expanded/collapsed
 */
function toggleAllSections() {
    const sections = document.querySelectorAll('.form-section');
    const expandAllBtn = document.querySelector('.nav-pill.expand-all');

    // Check if most sections are collapsed
    let collapsedCount = 0;
    sections.forEach(s => {
        if (s.classList.contains('collapsed')) collapsedCount++;
    });

    const shouldExpand = collapsedCount > sections.length / 2;

    sections.forEach((section, index) => {
        if (shouldExpand) {
            section.classList.remove('collapsed');
            section.classList.add('expanded');

            // Generate letter if expanding section 6
            if (index === 5) {
                const letterContent = document.getElementById('letterContent');
                if (letterContent) {
                    letterContent.textContent = generateLetter();
                }
            }
        } else {
            section.classList.remove('expanded');
            section.classList.add('collapsed');
        }
    });

    if (expandAllBtn) {
        expandAllBtn.textContent = shouldExpand ? 'Collapse All' : 'Expand All';
    }

    updateNavPills();
}

/**
 * Update navigation pill active states based on scroll position
 */
function updateNavPills() {
    const sections = document.querySelectorAll('.form-section');
    const navPills = document.querySelectorAll('.nav-pill[data-section]');

    // Find expanded sections
    const expandedSections = [];
    sections.forEach((section, index) => {
        if (section.classList.contains('expanded')) {
            expandedSections.push(index + 1);
        }
    });

    navPills.forEach(pill => {
        const sectionNum = parseInt(pill.dataset.section);
        pill.classList.toggle('active', expandedSections.includes(sectionNum));
    });
}

/**
 * Legacy function - now just scrolls to and expands section
 */
function showSection(sectionNum) {
    scrollToSection(sectionNum);
}

/**
 * Navigate to next section (legacy support)
 */
function nextSection() {
    if (currentSection < totalSections) {
        scrollToSection(currentSection + 1);
    }
}

/**
 * Navigate to previous section (legacy support)
 */
function prevSection() {
    if (currentSection > 1) {
        scrollToSection(currentSection - 1);
    }
}

/**
 * Regenerate the letter
 */
function regenerateLetter() {
    const letterContent = document.getElementById('letterContent');
    if (letterContent) {
        letterContent.textContent = generateLetter();
    }
}

/**
 * Copy letter to clipboard
 */
function copyLetter(e) {
    const letterContent = document.getElementById('letterContent');
    if (letterContent) {
        // Find the button - either from event or by selector
        const btn = e?.target?.closest('button') || document.querySelector('.output-controls button:nth-child(2)');
        const originalHTML = btn ? btn.innerHTML : null;

        navigator.clipboard.writeText(letterContent.textContent).then(() => {
            // Visual feedback
            if (btn) {
                btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Copied!';
                setTimeout(() => {
                    btn.innerHTML = originalHTML;
                }, 2000);
            }
        }).catch(() => {
            // Fallback for older browsers
            const range = document.createRange();
            range.selectNode(letterContent);
            window.getSelection().removeAllRanges();
            window.getSelection().addRange(range);
            document.execCommand('copy');
            window.getSelection().removeAllRanges();
        });
    }
}

/**
 * Reset the form
 */
function resetForm() {
    if (confirm('Are you sure you want to start a new letter? All current data will be cleared.')) {
        localStorage.removeItem('buddyLetterProgress');
        localStorage.removeItem('buddySpartanMode');
        localStorage.removeItem('buddyStatementMode');
        location.reload();
    }
}

/**
 * Update sidebar tip based on current section and mode
 */
function updateTip(sectionNum) {
    const buddyTips = {
        1: "Establish your credibility early. The VA gives more weight to statements from people who had frequent, direct contact with the veteran.",
        2: "Be specific about dates and locations. Vague timelines weaken your statement. If you don't remember exact dates, give your best estimate.",
        3: "Use standard military terminology when possible. This makes your letter easier for VA raters to process.",
        4: 'Focus on what you observed, not what you think the veteran felt. "I saw him jump at loud noises" is stronger than "He seemed scared."',
        5: "Specific examples are powerful. One detailed incident is worth more than ten vague statements.",
        6: "Review everything carefully. Make sure every statement is truthful and based on your own observations."
    };

    const selfTips = {
        1: "Your personal statement is your chance to explain your experiences in your own words. Be thorough and honest.",
        2: "Be specific about dates and locations. Vague timelines weaken your statement. If you don't remember exact dates, give your best estimate.",
        3: "Use standard military terminology when possible. This makes your statement easier for VA raters to process.",
        4: "Be honest about your symptoms. Describe how they affect your daily life. Don't minimize or exaggerate.",
        5: "Specific examples are powerful. Describe incidents that illustrate how your condition affects you day-to-day.",
        6: "Review everything carefully. Make sure every statement is truthful and accurate."
    };

    const tips = statementMode === 'self' ? selfTips : buddyTips;

    const tipElement = document.getElementById('currentTip');
    if (tipElement && tips[sectionNum]) {
        tipElement.innerHTML = `<p>${tips[sectionNum]}</p>`;
    }
}

// ============================================================================
// PERSISTENCE
// ============================================================================

/**
 * Save current progress to localStorage
 */
function saveProgress() {
    const data = getFormData();
    data.currentSection = currentSection;
    data.statementMode = statementMode;

    // Save expanded sections
    const expandedSections = [];
    document.querySelectorAll('.form-section.expanded').forEach(section => {
        const num = parseInt(section.dataset.section);
        if (num) expandedSections.push(num);
    });
    data.expandedSections = expandedSections;

    localStorage.setItem('buddyLetterProgress', JSON.stringify(data));
}

/**
 * Load saved progress
 */
function loadProgress() {
    const saved = localStorage.getItem('buddyLetterProgress');
    if (!saved) return;

    try {
        const data = JSON.parse(saved);

        // Restore statement mode first
        if (data.statementMode) {
            const modeRadio = document.querySelector(`input[name="statementMode"][value="${data.statementMode}"]`);
            if (modeRadio) {
                modeRadio.checked = true;
                setStatementMode(data.statementMode);
            }
        }

        // Restore text inputs
        const textFields = ['yourName', 'veteranName', 'knowYears', 'knowMonths', 'unit', 'location',
                          'serviceStart', 'serviceEnd', 'exposureDetails', 'specificExample'];
        textFields.forEach(field => {
            const el = document.getElementById(field);
            if (el && data[field]) {
                el.value = data[field];
            }
        });

        // Restore select
        if (data.contactFrequency) {
            const select = document.getElementById('contactFrequency');
            if (select) select.value = data.contactFrequency;
        }

        // Restore relationship radio
        if (data.relationship) {
            const radio = document.querySelector(`input[name="relationship"][value="${data.relationship}"]`);
            if (radio) radio.checked = true;
        }

        // Restore ongoing radio
        if (data.ongoing) {
            const radio = document.querySelector(`input[name="ongoing"][value="${data.ongoing}"]`);
            if (radio) radio.checked = true;
        }

        // Restore checkboxes
        ['theater', 'exposure', 'symptom', 'impact'].forEach(name => {
            const values = data[name + 's'] || data.theaters || [];
            values.forEach(val => {
                const cb = document.querySelector(`input[name="${name}"][value="${val}"]`);
                if (cb) cb.checked = true;
            });
        });

        // Restore expanded sections
        if (data.expandedSections && data.expandedSections.length > 0) {
            document.querySelectorAll('.form-section').forEach(section => {
                const num = parseInt(section.dataset.section);
                if (data.expandedSections.includes(num)) {
                    section.classList.remove('collapsed');
                    section.classList.add('expanded');
                } else {
                    section.classList.remove('expanded');
                    section.classList.add('collapsed');
                }
            });
        }

        // Update current section
        if (data.currentSection) {
            currentSection = data.currentSection;
        }

        // Update nav pills
        updateNavPills();

    } catch (e) {
        console.error('Error loading saved progress:', e);
    }
}

// ============================================================================
// EVENT LISTENERS & INITIALIZATION
// ============================================================================

/**
 * Set up exposure detail normalization
 */
function setupNormalization() {
    const exposureDetails = document.getElementById('exposureDetails');
    const suggestionPanel = document.getElementById('suggestionPanel');
    const suggestionContent = document.getElementById('suggestionContent');

    if (exposureDetails && suggestionPanel && suggestionContent) {
        let debounceTimer;

        exposureDetails.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                const text = exposureDetails.value;
                if (text.length > 3) {
                    const matches = normalizeExposureText(text);
                    if (matches.length > 0) {
                        suggestionContent.innerHTML = generateSuggestions(matches);
                        suggestionPanel.style.display = 'block';
                    } else {
                        suggestionPanel.style.display = 'none';
                    }
                } else {
                    suggestionPanel.style.display = 'none';
                }
            }, 300);
        });
    }
}

/**
 * Set up auto-save on input changes
 */
function setupAutoSave() {
    const form = document.querySelector('.form-container');
    if (form) {
        form.addEventListener('change', saveProgress);
        form.addEventListener('input', debounce(saveProgress, 1000));
    }
}

/**
 * Debounce utility
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Initialize the application
 */
function init() {
    // Set up statement mode toggle first (before loading progress)
    setupStatementModeToggle();

    // Load any saved progress
    loadProgress();

    // Set up normalization engine
    setupNormalization();

    // Set up auto-save
    setupAutoSave();

    // Update initial tip
    updateTip(currentSection);

    // Set up checkbox visual states
    document.querySelectorAll('.checkbox-item input').forEach(input => {
        input.addEventListener('change', function() {
            this.closest('.checkbox-item').classList.toggle('checked', this.checked);
        });
        // Initialize state
        if (input.checked) {
            input.closest('.checkbox-item').classList.add('checked');
        }
    });

    // Set up Spartan Mode triggers
    setupSpartanTriggers();
    checkSpartanTriggers();

    // Set up scroll-based nav pill highlighting
    setupScrollSpy();

    // Update nav pills initial state
    updateNavPills();
}

/**
 * Set up scroll spy for nav pills
 */
function setupScrollSpy() {
    let ticking = false;

    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                updateScrollSpyNavPills();
                ticking = false;
            });
            ticking = true;
        }
    });
}

/**
 * Update nav pills based on scroll position
 */
function updateScrollSpyNavPills() {
    const sections = document.querySelectorAll('.form-section');
    const navPills = document.querySelectorAll('.nav-pill[data-section]');
    const navHeight = document.querySelector('.section-nav')?.offsetHeight || 50;

    let currentInView = null;

    sections.forEach((section, index) => {
        const rect = section.getBoundingClientRect();
        // Section is in view if its top is above center and bottom is below nav
        if (rect.top < window.innerHeight / 2 && rect.bottom > navHeight) {
            currentInView = index + 1;
        }
    });

    if (currentInView) {
        navPills.forEach(pill => {
            const sectionNum = parseInt(pill.dataset.section);
            // Mark as active if it's the current section in view AND it's expanded
            const section = document.getElementById(`section${sectionNum}`);
            const isExpanded = section && section.classList.contains('expanded');
            pill.classList.toggle('active', sectionNum === currentInView && isExpanded);
        });
    }
}

// Start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Make functions available globally for onclick handlers
window.nextSection = nextSection;
window.prevSection = prevSection;
window.showSection = showSection;
window.toggleSection = toggleSection;
window.scrollToSection = scrollToSection;
window.toggleAllSections = toggleAllSections;
window.regenerateLetter = regenerateLetter;
window.copyLetter = copyLetter;
window.resetForm = resetForm;
