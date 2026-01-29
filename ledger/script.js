// State
let tags = [];
let redactions = [];
let records = []; // All records stored in browser
let currentRecordId = null; // Currently editing record ID
let spartanMode = false; // Pre-fill GWOT combat infantry defaults

// DOM Elements
const form = document.getElementById('recordForm');
const newBtn = document.getElementById('newBtn');
const clearBtn = document.getElementById('clearBtn');
const importFile = document.getElementById('importFile');
const exportBtn = document.getElementById('exportBtn');
const copyBtn = document.getElementById('copyBtn');
const previewBtn = document.getElementById('previewBtn');
const saveRecordBtn = document.getElementById('saveRecordBtn');
const slugifyBtn = document.getElementById('slugifyBtn');
const publishWarning = document.getElementById('publishWarning');
const warningList = document.getElementById('warningList');
const previewModal = document.getElementById('previewModal');
const previewContent = document.getElementById('previewContent');
const closePreview = document.getElementById('closePreview');
const visibilitySelect = document.getElementById('visibility');

// Sidebar elements
const sidebar = document.getElementById('sidebar');
const toggleSidebar = document.getElementById('toggleSidebar');
const spartanToggle = document.getElementById('spartanToggle');
const quickAddInput = document.getElementById('quickAddInput');
const quickAddBtn = document.getElementById('quickAddBtn');
const batchToggle = document.getElementById('batchToggle');
const batchPanel = document.getElementById('batchPanel');
const batchInput = document.getElementById('batchInput');
const batchAddBtn = document.getElementById('batchAddBtn');
const cardList = document.getElementById('cardList');
const recordCount = document.getElementById('recordCount');
const exportAllBtn = document.getElementById('exportAllBtn');
const importAllFile = document.getElementById('importAllFile');
const editingIndicator = document.getElementById('editingIndicator');
const editingName = document.getElementById('editingName');
const cancelEdit = document.getElementById('cancelEdit');

// Chip input elements
const tagsInput = document.getElementById('tagsInput');
const tagsChips = document.getElementById('tagsChips');
const tagsHidden = document.getElementById('tags');
const redactionsInput = document.getElementById('redactionsInput');
const redactionsChips = document.getElementById('redactionsChips');
const redactionsHidden = document.getElementById('redactions');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadRecords();
    loadSpartanMode();
    setupChipInputs();
    setupEventListeners();
    renderCardList();
    checkPublishGates();
});

// Load Spartan mode state from localStorage
function loadSpartanMode() {
    spartanMode = localStorage.getItem('ledgerSpartanMode') === 'true';
    updateSpartanToggle();
}

// Toggle Spartan mode
function toggleSpartanMode() {
    spartanMode = !spartanMode;
    localStorage.setItem('ledgerSpartanMode', spartanMode);
    updateSpartanToggle();
}

// Update Spartan toggle button appearance
function updateSpartanToggle() {
    if (spartanMode) {
        spartanToggle.classList.add('active');
        spartanToggle.title = 'Spartan Mode ON - GWOT combat infantry defaults enabled';
    } else {
        spartanToggle.classList.remove('active');
        spartanToggle.title = 'Pre-fill GWOT combat infantry defaults';
    }
}

// Setup event listeners
function setupEventListeners() {
    newBtn.addEventListener('click', createNewRecord);
    clearBtn.addEventListener('click', clearForm);
    importFile.addEventListener('change', handleImport);
    exportBtn.addEventListener('click', exportRecord);
    copyBtn.addEventListener('click', copyToClipboard);
    previewBtn.addEventListener('click', showPreview);
    saveRecordBtn.addEventListener('click', saveCurrentRecord);
    slugifyBtn.addEventListener('click', slugifyCallSign);
    closePreview.addEventListener('click', () => previewModal.classList.remove('active'));
    visibilitySelect.addEventListener('change', checkPublishGates);

    // Sidebar controls
    toggleSidebar.addEventListener('click', () => sidebar.classList.toggle('visible'));
    spartanToggle.addEventListener('click', toggleSpartanMode);
    quickAddBtn.addEventListener('click', quickAddRecord);
    quickAddInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') quickAddRecord();
    });
    batchToggle.addEventListener('click', toggleBatchMode);
    batchAddBtn.addEventListener('click', batchAddRecords);
    exportAllBtn.addEventListener('click', exportAllRecords);
    importAllFile.addEventListener('change', importAllRecords);
    cancelEdit.addEventListener('click', cancelEditing);

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

    // Close modal on Escape, close sidebar on mobile
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (previewModal.classList.contains('active')) {
                previewModal.classList.remove('active');
            }
            if (sidebar.classList.contains('visible')) {
                sidebar.classList.remove('visible');
            }
        }
    });

    // Click outside sidebar to close on mobile
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 900 &&
            sidebar.classList.contains('visible') &&
            !sidebar.contains(e.target) &&
            e.target !== toggleSidebar) {
            sidebar.classList.remove('visible');
        }
    });
}

// Load records from localStorage
function loadRecords() {
    try {
        const saved = localStorage.getItem('ledgerRecords');
        records = saved ? JSON.parse(saved) : [];
    } catch (e) {
        console.error('Failed to load records:', e);
        records = [];
    }
}

// Save records to localStorage
function saveRecords() {
    localStorage.setItem('ledgerRecords', JSON.stringify(records));
    renderCardList();
}

// Generate unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// Quick add a record
function quickAddRecord() {
    const name = quickAddInput.value.trim();
    if (!name) return;

    const record = createMinimalRecord(name);
    records.unshift(record);
    saveRecords();

    quickAddInput.value = '';
    quickAddInput.focus();

    // Load the new record for editing
    loadRecordIntoForm(record._id);
}

// Batch add records
// Format: "Name, Initial VA%, Current VA%" or just "Name"
function batchAddRecords() {
    const lines = batchInput.value.split('\n').map(n => n.trim()).filter(Boolean);
    if (lines.length === 0) return;

    lines.forEach(line => {
        // Parse comma-separated values: Name, Initial%, Current%
        const parts = line.split(',').map(p => p.trim());
        const name = parts[0];
        const vaInitial = parts[1] ? parseInt(parts[1].replace('%', '')) : null;
        const vaCurrent = parts[2] ? parseInt(parts[2].replace('%', '')) : null;

        const record = createMinimalRecord(name, vaInitial, vaCurrent);
        records.push(record);
    });

    saveRecords();
    batchInput.value = '';

    // Close batch panel
    batchPanel.style.display = 'none';
    batchToggle.classList.remove('active');
}

// Create minimal record with just a name (and optional VA ratings)
function createMinimalRecord(name, vaInitial = null, vaCurrent = null) {
    const id = slugify(name);
    const record = {
        _id: generateId(), // Internal ID for tracking
        id: id,
        call_sign: name,
        type: 'prospect',
        visibility: 'private',
        status: 'new',
        first_contact: new Date().toISOString().split('T')[0],
        tags: [],
        redactions: [],
        narrative: `## Notes\n\nCreated: ${new Date().toLocaleDateString()}\n\n`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    // Add VA ratings if provided
    if (vaInitial !== null && !isNaN(vaInitial)) {
        record.va_initial = vaInitial;
    }
    if (vaCurrent !== null && !isNaN(vaCurrent)) {
        record.va_current = vaCurrent;
    }

    // Apply Spartan mode defaults for GWOT combat infantry
    if (spartanMode) {
        record.branch = 'Army';
        record.era = 'OIF/OEF';
        record.goal = '100% P&T PTSD';
        record.outcome = { condition: 'PTSD' };
        record.tags = ['gwot', 'combat-infantry'];
    }

    return record;
}

// Toggle batch mode
function toggleBatchMode() {
    const isVisible = batchPanel.style.display !== 'none';
    batchPanel.style.display = isVisible ? 'none' : 'block';
    batchToggle.classList.toggle('active', !isVisible);
    if (!isVisible) {
        batchInput.focus();
    }
}

// Render card list in sidebar
function renderCardList() {
    recordCount.textContent = records.length;

    if (records.length === 0) {
        cardList.innerHTML = '<div class="empty-list">No records yet. Add one above!</div>';
        return;
    }

    cardList.innerHTML = records.map(record => {
        const hasVA = record.va_initial !== undefined || record.va_current !== undefined;
        const vaDisplay = hasVA ? formatVAProgression(record.va_initial, record.va_current) : '';
        const reunionIcon = record.attends_reunions ? '<span class="reunion-badge" title="Attends reunions">🎖</span>' : '';

        return `
        <div class="record-card type-${record.type} ${currentRecordId === record._id ? 'active' : ''}"
             data-id="${record._id}">
            <div class="card-header">
                <div class="card-name">${escapeHtml(record.call_sign || record.id)} ${reunionIcon}</div>
                <div class="card-actions">
                    <button class="card-btn delete" data-id="${record._id}" title="Delete">&times;</button>
                </div>
            </div>
            ${hasVA ? `<div class="card-va">${vaDisplay}</div>` : ''}
            <div class="card-meta">
                <span class="card-badge type-${record.type}">${record.type}</span>
                ${record.status ? `<span class="card-badge">${record.status}</span>` : ''}
            </div>
        </div>
    `}).join('');

    // Add click listeners
    cardList.querySelectorAll('.record-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (!e.target.classList.contains('delete')) {
                loadRecordIntoForm(card.dataset.id);
            }
        });
    });

    // Add delete listeners
    cardList.querySelectorAll('.card-btn.delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteRecord(btn.dataset.id);
        });
    });
}

// Load a record into the form
function loadRecordIntoForm(recordId) {
    const record = records.find(r => r._id === recordId);
    if (!record) return;

    currentRecordId = recordId;

    // Clear form first
    form.reset();
    tags = [];
    redactions = [];

    // Fill form fields
    document.getElementById('id').value = record.id || '';
    document.getElementById('call_sign').value = record.call_sign || '';
    document.getElementById('real_name').value = record.real_name || '';
    document.getElementById('branch').value = record.branch || '';
    document.getElementById('era').value = record.era || '';
    document.getElementById('deployments').value = Array.isArray(record.deployments)
        ? record.deployments.join(', ')
        : (record.deployments || '');
    document.getElementById('type').value = record.type || 'prospect';
    document.getElementById('visibility').value = record.visibility || 'private';
    document.getElementById('status').value = record.status || '';
    document.getElementById('first_contact').value = record.first_contact || '';
    document.getElementById('last_contact').value = record.last_contact || '';

    // Pipeline
    if (record.pipeline) {
        document.getElementById('pipeline_stage').value = record.pipeline.stage || '';
        document.getElementById('pipeline_next_action').value = record.pipeline.next_action || '';
        document.getElementById('pipeline_next_due').value = record.pipeline.next_due || '';
    }

    // Goal and VA Ratings
    document.getElementById('goal').value = record.goal || '';
    document.getElementById('va_initial').value = record.va_initial ?? '';
    document.getElementById('va_current').value = record.va_current ?? '';

    // Outcome
    if (record.outcome) {
        document.getElementById('outcome_rating').value = record.outcome.rating || '';
        document.getElementById('outcome_condition').value = record.outcome.condition || '';
        document.getElementById('outcome_decision_date').value = record.outcome.decision_date || '';
        document.getElementById('outcome_decision_time_days').value = record.outcome.decision_time_days || '';
        document.getElementById('outcome_monthly_increase_usd').value = record.outcome.monthly_increase_usd || '';
    }

    // Impact
    if (record.impact) {
        document.getElementById('impact_dependents').value = record.impact.dependents || '';
        document.getElementById('impact_notes').value = record.impact.notes || '';
    }

    // Engagement
    document.getElementById('attends_reunions').checked = record.attends_reunions || false;
    document.getElementById('reunions_attended').value = record.reunions_attended || '';
    document.getElementById('last_reunion').value = record.last_reunion || '';
    document.getElementById('engagement_level').value = record.engagement_level || '';

    // Tags and redactions
    if (record.tags && Array.isArray(record.tags)) {
        tags = [...record.tags];
        renderChips('tags');
        updateHiddenInput('tags');
    }
    if (record.redactions && Array.isArray(record.redactions)) {
        redactions = [...record.redactions];
        renderChips('redactions');
        updateHiddenInput('redactions');
    }

    // Public display
    document.getElementById('consent_to_share').checked = record.consent_to_share || false;
    document.getElementById('public_title').value = record.public_title || '';
    document.getElementById('public_blurb').value = record.public_blurb || '';

    // Narrative
    document.getElementById('narrative').value = record.narrative || '';

    // Show editing indicator
    editingIndicator.style.display = 'flex';
    editingName.textContent = record.call_sign || record.id;

    // Update card list to show active
    renderCardList();
    checkPublishGates();

    // Scroll to form on mobile
    if (window.innerWidth <= 900) {
        sidebar.classList.remove('visible');
        document.querySelector('.record-form').scrollIntoView({ behavior: 'smooth' });
    }
}

// Save current record
function saveCurrentRecord() {
    const callSign = document.getElementById('call_sign').value.trim();
    if (!callSign) {
        alert('Please enter a call sign.');
        return;
    }

    const recordData = getFormData();

    if (currentRecordId) {
        // Update existing record
        const index = records.findIndex(r => r._id === currentRecordId);
        if (index !== -1) {
            records[index] = {
                ...records[index],
                ...recordData,
                updatedAt: new Date().toISOString()
            };
        }
    } else {
        // Create new record
        const newRecord = {
            _id: generateId(),
            ...recordData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        records.unshift(newRecord);
        currentRecordId = newRecord._id;
    }

    saveRecords();

    // Update editing indicator
    editingIndicator.style.display = 'flex';
    editingName.textContent = callSign;

    // Visual feedback
    const originalText = saveRecordBtn.textContent;
    saveRecordBtn.textContent = 'Saved!';
    setTimeout(() => {
        saveRecordBtn.textContent = originalText;
    }, 2000);
}

// Get form data as object
function getFormData() {
    const data = {
        id: document.getElementById('id').value || slugify(document.getElementById('call_sign').value),
        call_sign: document.getElementById('call_sign').value,
        type: document.getElementById('type').value,
        visibility: document.getElementById('visibility').value,
    };

    // Optional fields
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
    if (document.getElementById('first_contact').value) {
        data.first_contact = document.getElementById('first_contact').value;
    }
    if (document.getElementById('last_contact').value) {
        data.last_contact = document.getElementById('last_contact').value;
    }
    if (document.getElementById('status').value) {
        data.status = document.getElementById('status').value;
    }

    // Goal and VA Ratings
    if (document.getElementById('goal').value) {
        data.goal = document.getElementById('goal').value;
    }
    if (document.getElementById('va_initial').value !== '') {
        data.va_initial = parseInt(document.getElementById('va_initial').value);
    }
    if (document.getElementById('va_current').value !== '') {
        data.va_current = parseInt(document.getElementById('va_current').value);
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

    // Engagement
    if (document.getElementById('attends_reunions').checked) {
        data.attends_reunions = true;
    }
    if (document.getElementById('reunions_attended').value) {
        data.reunions_attended = document.getElementById('reunions_attended').value;
    }
    if (document.getElementById('last_reunion').value) {
        data.last_reunion = document.getElementById('last_reunion').value;
    }
    if (document.getElementById('engagement_level').value) {
        data.engagement_level = document.getElementById('engagement_level').value;
    }

    // Tags and redactions
    if (tags.length > 0) {
        data.tags = [...tags];
    }
    if (redactions.length > 0) {
        data.redactions = [...redactions];
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

    // Narrative
    data.narrative = document.getElementById('narrative').value;

    return data;
}

// Delete record
function deleteRecord(recordId) {
    const record = records.find(r => r._id === recordId);
    if (!record) return;

    if (!confirm(`Delete "${record.call_sign}"?`)) return;

    records = records.filter(r => r._id !== recordId);
    saveRecords();

    // Clear form if deleting current record
    if (currentRecordId === recordId) {
        cancelEditing();
    }
}

// Cancel editing
function cancelEditing() {
    currentRecordId = null;
    editingIndicator.style.display = 'none';
    clearFormSilent();
    renderCardList();
}

// Export all records as JSON
function exportAllRecords() {
    if (records.length === 0) {
        alert('No records to export.');
        return;
    }

    const exportData = {
        version: 1,
        exportedAt: new Date().toISOString(),
        records: records
    };

    const content = JSON.stringify(exportData, null, 2);
    downloadFile('ledger-records.json', content, 'application/json');
}

// Import records from JSON
function importAllRecords(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const data = JSON.parse(event.target.result);

            if (data.records && Array.isArray(data.records)) {
                const count = data.records.length;

                if (confirm(`Import ${count} records? This will add to your existing records.`)) {
                    // Add internal IDs if missing
                    data.records.forEach(record => {
                        if (!record._id) {
                            record._id = generateId();
                        }
                        // Check for duplicate internal IDs
                        if (records.some(r => r._id === record._id)) {
                            record._id = generateId();
                        }
                    });

                    records = [...data.records, ...records];
                    saveRecords();
                    alert(`Imported ${count} records.`);
                }
            } else {
                alert('Invalid file format. Expected a JSON file with a "records" array.');
            }
        } catch (err) {
            alert('Failed to parse JSON file.');
            console.error(err);
        }
    };
    reader.readAsText(file);
    e.target.value = '';
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
            const chips = type === 'tags' ? tags : redactions;
            if (chips.length > 0) {
                removeChip(chips.length - 1, type);
            }
        }
    });
}

function addChip(value, type) {
    const chips = type === 'tags' ? tags : redactions;
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
    document.getElementById('id').value = slugify(callSign);
}

// Create new record with scaffold
function createNewRecord() {
    cancelEditing();

    document.getElementById('type').value = 'prospect';
    document.getElementById('visibility').value = 'private';
    document.getElementById('first_contact').value = new Date().toISOString().split('T')[0];

    // Apply Spartan mode defaults
    if (spartanMode) {
        document.getElementById('branch').value = 'Army';
        document.getElementById('era').value = 'OIF/OEF';
        document.getElementById('goal').value = '100% P&T PTSD';
        document.getElementById('outcome_condition').value = 'PTSD';
        tags = ['gwot', 'combat-infantry'];
        renderChips('tags');
        updateHiddenInput('tags');
    }

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

    document.getElementById('call_sign').focus();
    checkPublishGates();
}

// Clear form
function clearForm() {
    if (document.getElementById('call_sign').value && !confirm('Clear all form data?')) return;
    clearFormSilent();
}

function clearFormSilent() {
    form.reset();
    tags = [];
    redactions = [];
    renderChips('tags');
    renderChips('redactions');
    updateHiddenInput('tags');
    updateHiddenInput('redactions');
    currentRecordId = null;
    editingIndicator.style.display = 'none';
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
        if (!consent) warnings.push('Consent to share must be checked');
        if (!publicTitle) warnings.push('Public title is required');
        if (!publicBlurb) warnings.push('Public blurb is required');
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
    const data = getFormData();
    // Remove internal fields
    delete data._id;
    delete data.createdAt;
    delete data.updatedAt;
    return objectToYAML(data);
}

// Convert object to YAML string
function objectToYAML(obj, indent = 0) {
    const spaces = '  '.repeat(indent);
    let yaml = '';

    for (const [key, value] of Object.entries(obj)) {
        if (value === null || value === undefined || key === 'narrative') continue;

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

function escapeYAMLString(str) {
    if (!str) return '""';
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
    downloadFile(`${id}.md`, content, 'text/markdown');
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

// Handle file import (single .md file)
function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const content = event.target.result;
        parseMarkdownRecord(content);
    };
    reader.readAsText(file);
    e.target.value = '';
}

// Parse markdown record with YAML front matter
function parseMarkdownRecord(content) {
    const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);

    if (!frontMatterMatch) {
        alert('Invalid record format. Expected YAML front matter.');
        return;
    }

    const yamlContent = frontMatterMatch[1];
    const narrative = frontMatterMatch[2].trim();
    const data = parseYAML(yamlContent);

    // Create new record or update current
    cancelEditing();

    // Fill form from parsed data
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

    // Goal and VA Ratings
    if (data.goal) document.getElementById('goal').value = data.goal;
    if (data.va_initial !== undefined) document.getElementById('va_initial').value = data.va_initial;
    if (data.va_current !== undefined) document.getElementById('va_current').value = data.va_current;

    if (data.pipeline) {
        if (data.pipeline.stage) document.getElementById('pipeline_stage').value = data.pipeline.stage;
        if (data.pipeline.next_action) document.getElementById('pipeline_next_action').value = data.pipeline.next_action;
        if (data.pipeline.next_due) document.getElementById('pipeline_next_due').value = data.pipeline.next_due;
    }

    if (data.outcome) {
        if (data.outcome.rating) document.getElementById('outcome_rating').value = data.outcome.rating;
        if (data.outcome.condition) document.getElementById('outcome_condition').value = data.outcome.condition;
        if (data.outcome.decision_date) document.getElementById('outcome_decision_date').value = data.outcome.decision_date;
        if (data.outcome.decision_time_days) document.getElementById('outcome_decision_time_days').value = data.outcome.decision_time_days;
        if (data.outcome.monthly_increase_usd) document.getElementById('outcome_monthly_increase_usd').value = data.outcome.monthly_increase_usd;
    }

    if (data.impact) {
        if (data.impact.dependents) document.getElementById('impact_dependents').value = data.impact.dependents;
        if (data.impact.notes) document.getElementById('impact_notes').value = data.impact.notes;
    }

    // Engagement
    if (data.attends_reunions) document.getElementById('attends_reunions').checked = true;
    if (data.reunions_attended) document.getElementById('reunions_attended').value = data.reunions_attended;
    if (data.last_reunion) document.getElementById('last_reunion').value = data.last_reunion;
    if (data.engagement_level) document.getElementById('engagement_level').value = data.engagement_level;

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

    if (data.consent_to_share) document.getElementById('consent_to_share').checked = true;
    if (data.public_title) document.getElementById('public_title').value = data.public_title;
    if (data.public_blurb) document.getElementById('public_blurb').value = data.public_blurb;

    document.getElementById('narrative').value = narrative;
    checkPublishGates();
}

// Simple YAML parser
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

        if (trimmed.startsWith('- ')) {
            const value = trimmed.substring(2).trim().replace(/^["']|["']$/g, '');
            if (currentKey && Array.isArray(currentObject[currentKey])) {
                currentObject[currentKey].push(value);
            }
            continue;
        }

        const colonIndex = trimmed.indexOf(':');
        if (colonIndex > 0) {
            const key = trimmed.substring(0, colonIndex).trim();
            let value = trimmed.substring(colonIndex + 1).trim();

            while (indent <= indentStack[indentStack.length - 1] && objectStack.length > 1) {
                objectStack.pop();
                indentStack.pop();
                currentObject = objectStack[objectStack.length - 1];
            }

            if (value === '') {
                const nextLine = lines[i + 1];
                if (nextLine && nextLine.trim().startsWith('- ')) {
                    currentObject[key] = [];
                    currentKey = key;
                } else {
                    currentObject[key] = {};
                    objectStack.push(currentObject[key]);
                    indentStack.push(indent);
                    currentObject = currentObject[key];
                }
            } else {
                value = value.replace(/^["']|["']$/g, '');
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

// Format VA progression for display
function formatVAProgression(initial, current) {
    const initStr = initial !== undefined ? `${initial}%` : '?';
    const currStr = current !== undefined ? `${current}%` : '?';

    if (initial !== undefined && current !== undefined) {
        const diff = current - initial;
        const arrow = diff > 0 ? '↑' : (diff < 0 ? '↓' : '→');
        const diffClass = diff > 0 ? 'va-up' : (diff < 0 ? 'va-down' : 'va-same');
        return `<span class="${diffClass}">${initStr} ${arrow} ${currStr}</span>`;
    }

    return `${initStr} → ${currStr}`;
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
