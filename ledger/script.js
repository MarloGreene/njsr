// State
let tags = [];
let redactions = [];

// DOM Elements
const form = document.getElementById('recordForm');
const newBtn = document.getElementById('newBtn');
const clearBtn = document.getElementById('clearBtn');
const importFile = document.getElementById('importFile');
const exportBtn = document.getElementById('exportBtn');
const copyBtn = document.getElementById('copyBtn');
const previewBtn = document.getElementById('previewBtn');
const saveDraftBtn = document.getElementById('saveDraftBtn');
const slugifyBtn = document.getElementById('slugifyBtn');
const publishWarning = document.getElementById('publishWarning');
const warningList = document.getElementById('warningList');
const previewModal = document.getElementById('previewModal');
const previewContent = document.getElementById('previewContent');
const closePreview = document.getElementById('closePreview');
const visibilitySelect = document.getElementById('visibility');

// Chip input elements
const tagsInput = document.getElementById('tagsInput');
const tagsChips = document.getElementById('tagsChips');
const tagsHidden = document.getElementById('tags');
const redactionsInput = document.getElementById('redactionsInput');
const redactionsChips = document.getElementById('redactionsChips');
const redactionsHidden = document.getElementById('redactions');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadDraft();
    setupChipInputs();
    setupEventListeners();
    checkPublishGates();
});

// Setup event listeners
function setupEventListeners() {
    newBtn.addEventListener('click', createNewRecord);
    clearBtn.addEventListener('click', clearForm);
    importFile.addEventListener('change', handleImport);
    exportBtn.addEventListener('click', exportRecord);
    copyBtn.addEventListener('click', copyToClipboard);
    previewBtn.addEventListener('click', showPreview);
    saveDraftBtn.addEventListener('click', saveDraft);
    slugifyBtn.addEventListener('click', slugifyCallSign);
    closePreview.addEventListener('click', () => previewModal.classList.remove('active'));
    visibilitySelect.addEventListener('change', checkPublishGates);

    // Auto-check publish gates on relevant field changes
    document.getElementById('consent_to_share').addEventListener('change', checkPublishGates);
    document.getElementById('public_title').addEventListener('input', checkPublishGates);
    document.getElementById('public_blurb').addEventListener('input', checkPublishGates);

    // Close modal on outside click
    previewModal.addEventListener('click', (e) => {
        if (e.target === previewModal) {
            previewModal.classList.remove('active');
        }
    });

    // Close modal on Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && previewModal.classList.contains('active')) {
            previewModal.classList.remove('active');
        }
    });
}

// Setup chip inputs for tags and redactions
function setupChipInputs() {
    setupChipInput(tagsInput, tagsChips, 'tags');
    setupChipInput(redactionsInput, redactionsChips, 'redactions');
}

function setupChipInput(input, container, type) {
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const value = input.value.trim().replace(/,/g, '');
            if (value) {
                addChip(value, type);
                input.value = '';
            }
        } else if (e.key === 'Backspace' && !input.value) {
            // Remove last chip on backspace if input is empty
            const chips = type === 'tags' ? tags : redactions;
            if (chips.length > 0) {
                removeChip(chips.length - 1, type);
            }
        }
    });
}

function addChip(value, type) {
    const chips = type === 'tags' ? tags : redactions;
    const container = type === 'tags' ? tagsChips : redactionsChips;

    // Avoid duplicates
    if (chips.includes(value)) return;

    chips.push(value);
    renderChips(type);
    updateHiddenInput(type);
}

function removeChip(index, type) {
    const chips = type === 'tags' ? tags : redactions;
    chips.splice(index, 1);
    renderChips(type);
    updateHiddenInput(type);
}

function renderChips(type) {
    const chips = type === 'tags' ? tags : redactions;
    const container = type === 'tags' ? tagsChips : redactionsChips;

    container.innerHTML = chips.map((chip, index) => `
        <span class="chip">
            ${escapeHtml(chip)}
            <button type="button" class="chip-remove" data-index="${index}" data-type="${type}">&times;</button>
        </span>
    `).join('');

    // Add click listeners to remove buttons
    container.querySelectorAll('.chip-remove').forEach(btn => {
        btn.addEventListener('click', () => {
            removeChip(parseInt(btn.dataset.index), btn.dataset.type);
        });
    });
}

function updateHiddenInput(type) {
    const chips = type === 'tags' ? tags : redactions;
    const hidden = type === 'tags' ? tagsHidden : redactionsHidden;
    hidden.value = chips.join(',');
}

// Slugify call sign to ID
function slugifyCallSign() {
    const callSign = document.getElementById('call_sign').value;
    if (!callSign) {
        alert('Please enter a call sign first.');
        return;
    }

    const slug = callSign
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

    document.getElementById('id').value = slug;
}

// Create new record with scaffold
function createNewRecord() {
    clearForm();

    // Set defaults
    document.getElementById('type').value = 'prospect';
    document.getElementById('visibility').value = 'private';
    document.getElementById('first_contact').value = new Date().toISOString().split('T')[0];

    // Set narrative scaffold
    document.getElementById('narrative').value = `## Initial Contact

Date: ${new Date().toLocaleDateString()}
Method:

## Background



## Current Situation



## Goals



## Action Items

- [ ]
- [ ]

## Notes

`;

    checkPublishGates();
}

// Clear form
function clearForm() {
    if (form.elements.length > 0 && document.getElementById('call_sign').value) {
        if (!confirm('Clear all form data?')) return;
    }

    form.reset();
    tags = [];
    redactions = [];
    renderChips('tags');
    renderChips('redactions');
    updateHiddenInput('tags');
    updateHiddenInput('redactions');
    checkPublishGates();
}

// Check publish gates
function checkPublishGates() {
    const visibility = document.getElementById('visibility').value;
    const consent = document.getElementById('consent_to_share').checked;
    const publicTitle = document.getElementById('public_title').value.trim();
    const publicBlurb = document.getElementById('public_blurb').value.trim();

    const warnings = [];

    if (visibility === 'public') {
        if (!consent) {
            warnings.push('Consent to share must be checked');
        }
        if (!publicTitle) {
            warnings.push('Public title is required');
        }
        if (!publicBlurb) {
            warnings.push('Public blurb is required');
        }
    }

    if (warnings.length > 0) {
        warningList.innerHTML = warnings.map(w => `<li>${w}</li>`).join('');
        publishWarning.style.display = 'block';
    } else {
        publishWarning.style.display = 'none';
    }

    return warnings.length === 0;
}

// Generate YAML front matter
function generateYAML() {
    const data = {};

    // Required fields
    data.id = document.getElementById('id').value || slugify(document.getElementById('call_sign').value);
    data.type = document.getElementById('type').value;
    data.visibility = document.getElementById('visibility').value;
    data.call_sign = document.getElementById('call_sign').value;

    // Optional identity fields
    if (document.getElementById('real_name').value) {
        data.real_name = document.getElementById('real_name').value;
    }
    if (document.getElementById('branch').value) {
        data.branch = document.getElementById('branch').value;
    }
    if (document.getElementById('era').value) {
        data.era = document.getElementById('era').value;
    }
    if (document.getElementById('deployments').value) {
        data.deployments = document.getElementById('deployments').value.split(',').map(s => s.trim()).filter(Boolean);
    }

    // Contact timeline
    if (document.getElementById('first_contact').value) {
        data.first_contact = document.getElementById('first_contact').value;
    }
    if (document.getElementById('last_contact').value) {
        data.last_contact = document.getElementById('last_contact').value;
    }

    // Status
    if (document.getElementById('status').value) {
        data.status = document.getElementById('status').value;
    }

    // Pipeline
    const pipeline = {};
    if (document.getElementById('pipeline_stage').value) {
        pipeline.stage = document.getElementById('pipeline_stage').value;
    }
    if (document.getElementById('pipeline_next_action').value) {
        pipeline.next_action = document.getElementById('pipeline_next_action').value;
    }
    if (document.getElementById('pipeline_next_due').value) {
        pipeline.next_due = document.getElementById('pipeline_next_due').value;
    }
    if (Object.keys(pipeline).length > 0) {
        data.pipeline = pipeline;
    }

    // Outcome
    const outcome = {};
    if (document.getElementById('outcome_rating').value) {
        outcome.rating = document.getElementById('outcome_rating').value;
    }
    if (document.getElementById('outcome_condition').value) {
        outcome.condition = document.getElementById('outcome_condition').value;
    }
    if (document.getElementById('outcome_decision_date').value) {
        outcome.decision_date = document.getElementById('outcome_decision_date').value;
    }
    if (document.getElementById('outcome_decision_time_days').value) {
        outcome.decision_time_days = parseInt(document.getElementById('outcome_decision_time_days').value);
    }
    if (document.getElementById('outcome_monthly_increase_usd').value) {
        outcome.monthly_increase_usd = parseFloat(document.getElementById('outcome_monthly_increase_usd').value);
    }
    if (Object.keys(outcome).length > 0) {
        data.outcome = outcome;
    }

    // Impact
    const impact = {};
    if (document.getElementById('impact_dependents').value) {
        impact.dependents = parseInt(document.getElementById('impact_dependents').value);
    }
    if (document.getElementById('impact_notes').value) {
        impact.notes = document.getElementById('impact_notes').value;
    }
    if (Object.keys(impact).length > 0) {
        data.impact = impact;
    }

    // Tags and redactions
    if (tags.length > 0) {
        data.tags = tags;
    }
    if (redactions.length > 0) {
        data.redactions = redactions;
    }

    // Public display
    if (document.getElementById('consent_to_share').checked) {
        data.consent_to_share = true;
    }
    if (document.getElementById('public_title').value) {
        data.public_title = document.getElementById('public_title').value;
    }
    if (document.getElementById('public_blurb').value) {
        data.public_blurb = document.getElementById('public_blurb').value;
    }

    return objectToYAML(data);
}

// Convert object to YAML string (simple implementation)
function objectToYAML(obj, indent = 0) {
    const spaces = '  '.repeat(indent);
    let yaml = '';

    for (const [key, value] of Object.entries(obj)) {
        if (value === null || value === undefined) continue;

        if (Array.isArray(value)) {
            yaml += `${spaces}${key}:\n`;
            value.forEach(item => {
                yaml += `${spaces}  - ${typeof item === 'string' ? escapeYAMLString(item) : item}\n`;
            });
        } else if (typeof value === 'object') {
            yaml += `${spaces}${key}:\n`;
            yaml += objectToYAML(value, indent + 1);
        } else if (typeof value === 'string') {
            yaml += `${spaces}${key}: ${escapeYAMLString(value)}\n`;
        } else if (typeof value === 'boolean') {
            yaml += `${spaces}${key}: ${value}\n`;
        } else {
            yaml += `${spaces}${key}: ${value}\n`;
        }
    }

    return yaml;
}

// Escape YAML string if needed
function escapeYAMLString(str) {
    if (!str) return '""';
    // Quote strings that contain special characters or look like other types
    if (/[:#\[\]{}|>&*!?,]/.test(str) || /^\s|\s$/.test(str) || /^(true|false|null|yes|no)$/i.test(str)) {
        return `"${str.replace(/"/g, '\\"')}"`;
    }
    return str;
}

// Generate full record content
function generateRecord() {
    const yaml = generateYAML();
    const narrative = document.getElementById('narrative').value;

    return `---\n${yaml}---\n\n${narrative}`;
}

// Export record as .md file
function exportRecord() {
    const callSign = document.getElementById('call_sign').value;
    if (!callSign) {
        alert('Please enter a call sign.');
        return;
    }

    const content = generateRecord();
    const id = document.getElementById('id').value || slugify(callSign);
    const filename = `${id}.md`;

    downloadFile(filename, content, 'text/markdown');
}

// Copy to clipboard
function copyToClipboard() {
    const content = generateRecord();

    navigator.clipboard.writeText(content).then(() => {
        const originalText = copyBtn.textContent;
        copyBtn.textContent = 'Copied!';
        copyBtn.style.background = '#38a169';
        copyBtn.style.color = 'white';
        setTimeout(() => {
            copyBtn.textContent = originalText;
            copyBtn.style.background = '';
            copyBtn.style.color = '';
        }, 2000);
    }).catch(() => {
        // Fallback
        const textarea = document.createElement('textarea');
        textarea.value = content;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        alert('Copied to clipboard!');
    });
}

// Show preview
function showPreview() {
    previewContent.textContent = generateRecord();
    previewModal.classList.add('active');
}

// Save draft to localStorage
function saveDraft() {
    const draft = {
        call_sign: document.getElementById('call_sign').value,
        id: document.getElementById('id').value,
        real_name: document.getElementById('real_name').value,
        branch: document.getElementById('branch').value,
        era: document.getElementById('era').value,
        deployments: document.getElementById('deployments').value,
        type: document.getElementById('type').value,
        visibility: document.getElementById('visibility').value,
        status: document.getElementById('status').value,
        first_contact: document.getElementById('first_contact').value,
        last_contact: document.getElementById('last_contact').value,
        pipeline_stage: document.getElementById('pipeline_stage').value,
        pipeline_next_action: document.getElementById('pipeline_next_action').value,
        pipeline_next_due: document.getElementById('pipeline_next_due').value,
        outcome_rating: document.getElementById('outcome_rating').value,
        outcome_condition: document.getElementById('outcome_condition').value,
        outcome_decision_date: document.getElementById('outcome_decision_date').value,
        outcome_decision_time_days: document.getElementById('outcome_decision_time_days').value,
        outcome_monthly_increase_usd: document.getElementById('outcome_monthly_increase_usd').value,
        impact_dependents: document.getElementById('impact_dependents').value,
        impact_notes: document.getElementById('impact_notes').value,
        tags: tags,
        redactions: redactions,
        consent_to_share: document.getElementById('consent_to_share').checked,
        public_title: document.getElementById('public_title').value,
        public_blurb: document.getElementById('public_blurb').value,
        narrative: document.getElementById('narrative').value,
        savedAt: new Date().toISOString()
    };

    localStorage.setItem('ledgerDraft', JSON.stringify(draft));

    const originalText = saveDraftBtn.textContent;
    saveDraftBtn.textContent = 'Saved!';
    setTimeout(() => {
        saveDraftBtn.textContent = originalText;
    }, 2000);
}

// Load draft from localStorage
function loadDraft() {
    const saved = localStorage.getItem('ledgerDraft');
    if (!saved) return;

    try {
        const draft = JSON.parse(saved);

        // Only load if there's actual content
        if (!draft.call_sign && !draft.narrative) return;

        // Fill form fields
        Object.keys(draft).forEach(key => {
            const el = document.getElementById(key);
            if (el) {
                if (el.type === 'checkbox') {
                    el.checked = draft[key];
                } else if (el.tagName !== 'BUTTON') {
                    el.value = draft[key] || '';
                }
            }
        });

        // Restore tags and redactions
        if (draft.tags && Array.isArray(draft.tags)) {
            tags = draft.tags;
            renderChips('tags');
            updateHiddenInput('tags');
        }
        if (draft.redactions && Array.isArray(draft.redactions)) {
            redactions = draft.redactions;
            renderChips('redactions');
            updateHiddenInput('redactions');
        }

        checkPublishGates();
    } catch (e) {
        console.error('Failed to load draft:', e);
    }
}

// Handle file import
function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const content = event.target.result;
        parseMarkdownRecord(content);
    };
    reader.readAsText(file);

    // Reset file input
    e.target.value = '';
}

// Parse markdown record with YAML front matter
function parseMarkdownRecord(content) {
    // Split front matter from body
    const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);

    if (!frontMatterMatch) {
        alert('Invalid record format. Expected YAML front matter.');
        return;
    }

    const yamlContent = frontMatterMatch[1];
    const narrative = frontMatterMatch[2].trim();

    // Parse YAML (simple parser)
    const data = parseYAML(yamlContent);

    // Fill form
    if (data.id) document.getElementById('id').value = data.id;
    if (data.type) document.getElementById('type').value = data.type;
    if (data.visibility) document.getElementById('visibility').value = data.visibility;
    if (data.call_sign) document.getElementById('call_sign').value = data.call_sign;
    if (data.real_name) document.getElementById('real_name').value = data.real_name;
    if (data.branch) document.getElementById('branch').value = data.branch;
    if (data.era) document.getElementById('era').value = data.era;
    if (data.deployments) {
        document.getElementById('deployments').value = Array.isArray(data.deployments)
            ? data.deployments.join(', ')
            : data.deployments;
    }
    if (data.first_contact) document.getElementById('first_contact').value = data.first_contact;
    if (data.last_contact) document.getElementById('last_contact').value = data.last_contact;
    if (data.status) document.getElementById('status').value = data.status;

    // Pipeline
    if (data.pipeline) {
        if (data.pipeline.stage) document.getElementById('pipeline_stage').value = data.pipeline.stage;
        if (data.pipeline.next_action) document.getElementById('pipeline_next_action').value = data.pipeline.next_action;
        if (data.pipeline.next_due) document.getElementById('pipeline_next_due').value = data.pipeline.next_due;
    }

    // Outcome
    if (data.outcome) {
        if (data.outcome.rating) document.getElementById('outcome_rating').value = data.outcome.rating;
        if (data.outcome.condition) document.getElementById('outcome_condition').value = data.outcome.condition;
        if (data.outcome.decision_date) document.getElementById('outcome_decision_date').value = data.outcome.decision_date;
        if (data.outcome.decision_time_days) document.getElementById('outcome_decision_time_days').value = data.outcome.decision_time_days;
        if (data.outcome.monthly_increase_usd) document.getElementById('outcome_monthly_increase_usd').value = data.outcome.monthly_increase_usd;
    }

    // Impact
    if (data.impact) {
        if (data.impact.dependents) document.getElementById('impact_dependents').value = data.impact.dependents;
        if (data.impact.notes) document.getElementById('impact_notes').value = data.impact.notes;
    }

    // Tags and redactions
    if (data.tags && Array.isArray(data.tags)) {
        tags = data.tags;
        renderChips('tags');
        updateHiddenInput('tags');
    }
    if (data.redactions && Array.isArray(data.redactions)) {
        redactions = data.redactions;
        renderChips('redactions');
        updateHiddenInput('redactions');
    }

    // Public display
    if (data.consent_to_share) document.getElementById('consent_to_share').checked = true;
    if (data.public_title) document.getElementById('public_title').value = data.public_title;
    if (data.public_blurb) document.getElementById('public_blurb').value = data.public_blurb;

    // Narrative
    document.getElementById('narrative').value = narrative;

    checkPublishGates();
}

// Simple YAML parser (handles our specific schema)
function parseYAML(yaml) {
    const result = {};
    const lines = yaml.split('\n');
    let currentKey = null;
    let currentObject = result;
    let objectStack = [result];
    let indentStack = [0];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim() || line.trim().startsWith('#')) continue;

        const indent = line.search(/\S/);
        const trimmed = line.trim();

        // Handle list items
        if (trimmed.startsWith('- ')) {
            const value = trimmed.substring(2).trim().replace(/^["']|["']$/g, '');
            if (currentKey && Array.isArray(currentObject[currentKey])) {
                currentObject[currentKey].push(value);
            }
            continue;
        }

        // Handle key-value pairs
        const colonIndex = trimmed.indexOf(':');
        if (colonIndex > 0) {
            const key = trimmed.substring(0, colonIndex).trim();
            let value = trimmed.substring(colonIndex + 1).trim();

            // Adjust object context based on indent
            while (indent <= indentStack[indentStack.length - 1] && objectStack.length > 1) {
                objectStack.pop();
                indentStack.pop();
                currentObject = objectStack[objectStack.length - 1];
            }

            if (value === '') {
                // Check if next line is a list or nested object
                const nextLine = lines[i + 1];
                if (nextLine && nextLine.trim().startsWith('- ')) {
                    currentObject[key] = [];
                    currentKey = key;
                } else {
                    // Nested object
                    currentObject[key] = {};
                    objectStack.push(currentObject[key]);
                    indentStack.push(indent);
                    currentObject = currentObject[key];
                }
            } else {
                // Parse value
                value = value.replace(/^["']|["']$/g, ''); // Remove quotes
                if (value === 'true') value = true;
                else if (value === 'false') value = false;
                else if (/^\d+$/.test(value)) value = parseInt(value);
                else if (/^\d+\.\d+$/.test(value)) value = parseFloat(value);

                currentObject[key] = value;
                currentKey = key;
            }
        }
    }

    return result;
}

// Utility functions
function slugify(str) {
    return str
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function downloadFile(filename, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
