// Data management
let people = [];
let editingId = null;

// Scripture verses for display between cards
const scriptures = [
    { verse: "A new commandment I give unto you, That ye love one another.", ref: "John 13:34" },
    { verse: "Charity is the pure love of Christ.", ref: "Moroni 7:47" },
    { verse: "Bear ye one another's burdens.", ref: "Galatians 6:2" },
    { verse: "Be not weary in well-doing.", ref: "2 Thessalonians 3:13" },
    { verse: "By love serve one another.", ref: "Galatians 5:13" },
    { verse: "Succor the weak, lift up the hands which hang down.", ref: "D&C 81:5" },
    { verse: "Pure religion is to visit the fatherless and widows in their affliction.", ref: "James 1:27" },
    { verse: "Inasmuch as ye have done it unto one of the least of these, ye have done it unto me.", ref: "Matthew 25:40" },
    { verse: "Let us not love in word, but in deed and in truth.", ref: "1 John 3:18" },
    { verse: "Strengthen thy brethren.", ref: "Luke 22:32" }
];

// DOM elements
const modal = document.getElementById('modal');
const addNewBtn = document.getElementById('addNewBtn');
const closeModal = document.getElementById('closeModal');
const cancelBtn = document.getElementById('cancelBtn');
const personForm = document.getElementById('personForm');
const peopleList = document.getElementById('peopleList');
const modalTitle = document.getElementById('modalTitle');
const exportBtn = document.getElementById('exportBtn');
const exportTextBtn = document.getElementById('exportTextBtn');
const importBtn = document.getElementById('importBtn');
const importFile = document.getElementById('importFile');
const searchInput = document.getElementById('searchInput');
const clearSearch = document.getElementById('clearSearch');
const statsBar = document.getElementById('statsBar');
const searchBar = document.getElementById('searchBar');

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    loadFromStorage();
    renderPeople();
    setupEventListeners();
    
    // Make functions globally available for onclick handlers
    window.toggleDetails = toggleDetails;
    window.editPerson = editPerson;
    window.deletePerson = deletePerson;
    window.quickContact = quickContact;
    
    // Prevent data loss on accidental page close if there's unsaved data in the modal
    window.addEventListener('beforeunload', (e) => {
        if (modal.classList.contains('active')) {
            e.preventDefault();
            e.returnValue = '';
        }
    });
});

function toggleAdditionalDetailsForm() {
    const additionalDetails = document.getElementById('additionalDetails');
    const toggleBtn = document.getElementById('toggleAdditionalDetails');
    
    if (additionalDetails && toggleBtn) {
        const isHidden = additionalDetails.style.display === 'none';
        additionalDetails.style.display = isHidden ? 'block' : 'none';
        toggleBtn.textContent = isHidden ? '− Hide Additional Details' : '+ Add Contact & Family Details (Optional)';
    }
}

// Event listeners
function setupEventListeners() {
    addNewBtn.addEventListener('click', () => openModal());
    closeModal.addEventListener('click', () => closeModalHandler());
    cancelBtn.addEventListener('click', () => closeModalHandler());
    personForm.addEventListener('submit', handleSubmit);
    exportBtn.addEventListener('click', exportData);
    exportTextBtn.addEventListener('click', exportTextData);
    importBtn.addEventListener('click', () => importFile.click());
    importFile.addEventListener('change', importData);
    
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }
    if (clearSearch) {
        clearSearch.addEventListener('click', () => {
            searchInput.value = '';
            handleSearch();
        });
    }
    
    const toggleAdditionalBtn = document.getElementById('toggleAdditionalDetails');
    if (toggleAdditionalBtn) {
        toggleAdditionalBtn.addEventListener('click', toggleAdditionalDetailsForm);
    }
    
    // Close modal on outside click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModalHandler();
        }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Escape key closes modal
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModalHandler();
        }
        // Ctrl/Cmd + K for search focus
        if ((e.ctrlKey || e.metaKey) && e.key === 'k' && searchInput) {
            e.preventDefault();
            searchInput.focus();
        }
    });
}

// Modal handlers
function openModal(person = null) {
    const sundayHint = document.getElementById('sundayHint');
    
    if (person) {
        editingId = person.id;
        modalTitle.textContent = 'Edit Entry';
        document.getElementById('familyName').value = person.familyName;
        document.getElementById('spouseName').value = person.spouseName || '';
        document.getElementById('spouseBirthday').value = person.spouseBirthday || '';
        document.getElementById('children').value = person.children || '';
        document.getElementById('phone').value = person.phone || '';
        document.getElementById('email').value = person.email || '';
        document.getElementById('address').value = person.address || '';
        document.getElementById('lastContact').value = person.lastContact;
        document.getElementById('whatsHeavy').value = person.whatsHeavy || '';
        document.getElementById('nextNudge').value = person.nextNudge || '';
        if (sundayHint) sundayHint.style.display = 'none';
    } else {
        editingId = null;
        modalTitle.textContent = 'Add Someone New';
        personForm.reset();
        // Set most recent Sunday as default last contact
        document.getElementById('lastContact').value = getMostRecentSunday();
        if (sundayHint) sundayHint.style.display = 'block';
    }
    modal.classList.add('active');
}

function closeModalHandler() {
    modal.classList.remove('active');
    personForm.reset();
    editingId = null;
    // Reset additional details to hidden
    const additionalDetails = document.getElementById('additionalDetails');
    const toggleBtn = document.getElementById('toggleAdditionalDetails');
    if (additionalDetails) additionalDetails.style.display = 'none';
    if (toggleBtn) toggleBtn.textContent = '+ Add Contact & Family Details (Optional)';
}

// Form submission
function handleSubmit(e) {
    e.preventDefault();
    
    const personData = {
        id: editingId || Date.now(),
        familyName: document.getElementById('familyName').value.trim(),
        spouseName: document.getElementById('spouseName').value.trim(),
        spouseBirthday: document.getElementById('spouseBirthday').value.trim(),
        children: document.getElementById('children').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        email: document.getElementById('email').value.trim(),
        address: document.getElementById('address').value.trim(),
        lastContact: document.getElementById('lastContact').value,
        whatsHeavy: document.getElementById('whatsHeavy').value.trim(),
        nextNudge: document.getElementById('nextNudge').value.trim(),
        createdAt: editingId ? people.find(p => p.id === editingId).createdAt : Date.now()
    };
    
    if (editingId) {
        // Update existing
        const index = people.findIndex(p => p.id === editingId);
        people[index] = personData;
    } else {
        // Add new
        people.push(personData);
    }
    
    saveToStorage();
    renderPeople();
    closeModalHandler();
}

// Render people list
function renderPeople() {
    if (people.length === 0) {
        peopleList.innerHTML = `
            <div class="empty-state">
                <p>💕 Your ministering list is empty</p>
                <p>Click the button above to add your first family and begin this meaningful journey of service.</p>
            </div>
        `;
        if (statsBar) statsBar.style.display = 'none';
        if (searchBar) searchBar.style.display = 'none';
        return;
    }
    
    // Show stats and search
    if (statsBar) statsBar.style.display = 'flex';
    if (searchBar) searchBar.style.display = 'flex';
    
    updateStats();
    
    // Sort by last contact date (oldest first)
    const sortedPeople = [...people].sort((a, b) => 
        new Date(a.lastContact) - new Date(b.lastContact)
    );
    
    peopleList.innerHTML = sortedPeople.map((person, index) => {
        const daysAgo = getDaysSinceContact(person.lastContact);
        const needsAttention = daysAgo >= 30;
        
        // Add a scripture verse between each card
        const scriptureHtml = (index > 0) ? `
            <div class="between-scripture">
                <p class="scripture-text">"${scriptures[(index - 1) % scriptures.length].verse}"</p>
                <p class="scripture-ref">— ${scriptures[(index - 1) % scriptures.length].ref}</p>
            </div>
        ` : '';
        
        const personCard = `
            <div class="person-card ${needsAttention ? 'needs-attention' : ''}" data-id="${person.id}">
                <div class="person-header">
                    <h3 class="family-name">${escapeHtml(person.familyName)}</h3>
                    <div class="card-actions">
                        <button class="icon-btn toggle-details-btn" onclick="toggleDetails(${person.id})" title="Toggle Details">👁️</button>
                        <button class="icon-btn edit-btn" onclick="editPerson(${person.id})" title="Edit">✏️</button>
                        <button class="icon-btn delete-btn" onclick="deletePerson(${person.id})" title="Delete">🗑️</button>
                    </div>
                </div>
                
                ${needsAttention ? `
                    <div class="reminder-badge">
                        ⏰ It's been ${daysAgo} days since you last checked in
                    </div>
                ` : ''}
                
                <div class="last-contact-info">
                    <div class="person-detail">
                        <div class="detail-label">Last Contact</div>
                        <div class="detail-content">${formatDate(person.lastContact)}</div>
                    </div>
                    <div class="days-ago">(${daysAgo} ${daysAgo === 1 ? 'day' : 'days'} ago)</div>
                </div>
                
                <button class="quick-contact-btn" onclick="quickContact(${person.id})">✔️ Mark Contacted Today</button>
                
                <div class="full-details" id="details-${person.id}" style="display: none;">
                    ${person.spouseName || person.spouseBirthday ? `
                        <div class="person-detail">
                            <div class="detail-label">Spouse</div>
                            <div class="detail-content">
                                ${person.spouseName ? escapeHtml(person.spouseName) : ''}
                                ${person.spouseBirthday ? `<br><small>Birthday: ${escapeHtml(person.spouseBirthday)}</small>` : ''}
                            </div>
                        </div>
                    ` : ''}
                    
                    ${person.children ? `
                        <div class="person-detail">
                            <div class="detail-label">Children</div>
                            <div class="detail-content">${escapeHtml(person.children)}</div>
                        </div>
                    ` : ''}
                    
                    ${person.phone || person.email || person.address ? `
                        <div class="contact-info">
                            ${person.phone ? `<div class="contact-item"><a href="sms:${person.phone}" class="contact-link">📞 ${escapeHtml(person.phone)}</a></div>` : ''}
                            ${person.email ? `<div class="contact-item"><a href="mailto:${person.email}" class="contact-link">✉️ ${escapeHtml(person.email)}</a></div>` : ''}
                            ${person.address ? `<div class="contact-item"><a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(person.address)}" target="_blank" rel="noopener noreferrer" class="contact-link">🏠 ${escapeHtml(person.address)}</a></div>` : ''}
                        </div>
                    ` : ''}
                </div>
                
                ${person.whatsHeavy ? `
                    <div class="person-detail">
                        <div class="detail-label">What's Heavy Right Now</div>
                        <div class="detail-content">${escapeHtml(person.whatsHeavy)}</div>
                    </div>
                ` : ''}
                
                ${person.nextNudge ? `
                    <div class="person-detail">
                        <div class="detail-label">Next Gentle Nudge</div>
                        <div class="detail-content">${escapeHtml(person.nextNudge)}</div>
                    </div>
                ` : ''}
            </div>
        `;
        
        return scriptureHtml + personCard;
    }).join('');
}

// Edit person
function editPerson(id) {
    const person = people.find(p => p.id === id);
    if (person) {
        openModal(person);
    }
}

// Delete person
function deletePerson(id) {
    const person = people.find(p => p.id === id);
    if (person && confirm(`Remove ${person.familyName} from your list?`)) {
        people = people.filter(p => p.id !== id);
        saveToStorage();
        renderPeople();
    }
}

// Utility functions
function getDaysSinceContact(dateString) {
    const lastContact = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today - lastContact);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

function getTodayDate() {
    const today = new Date();
    return today.toISOString().split('T')[0];
}

function getMostRecentSunday() {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const daysToSubtract = dayOfWeek; // If today is Sunday (0), subtract 0. If Monday (1), subtract 1, etc.
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - daysToSubtract);
    return sunday.toISOString().split('T')[0];
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// LocalStorage functions
function saveToStorage() {
    try {
        localStorage.setItem('ministeringMemories', JSON.stringify(people));
    } catch (e) {
        console.error('Error saving to localStorage:', e);
        showToast('⚠️ Error saving data. Storage may be full.');
    }
}

function loadFromStorage() {
    const stored = localStorage.getItem('ministeringMemories');
    if (stored) {
        try {
            people = JSON.parse(stored);
        } catch (e) {
            console.error('Error loading data:', e);
            people = [];
        }
    }
}

// Import/Export functions
function exportData() {
    const dataStr = JSON.stringify(people, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ministering-notes-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('✓ JSON file exported successfully!');
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const importedData = JSON.parse(e.target.result);
            if (Array.isArray(importedData)) {
                if (people.length > 0) {
                    if (confirm('This will replace your current notes. Continue?')) {
                        people = importedData;
                        saveToStorage();
                        renderPeople();
                        alert('Notes imported successfully!');
                    }
                } else {
                    people = importedData;
                    saveToStorage();
                    renderPeople();
                    alert('Notes imported successfully!');
                }
            } else {
                alert('Invalid file format. Please select a valid ministering notes file.');
            }
        } catch (error) {
            alert('Error reading file. Please select a valid JSON file.');
            console.error('Import error:', error);
        }
        // Reset file input
        event.target.value = '';
    };
    reader.readAsText(file);
}

function toggleDetails(id) {
    const detailsDiv = document.getElementById(`details-${id}`);
    const card = document.querySelector(`[data-id="${id}"]`);
    const toggleBtn = card?.querySelector('.toggle-details-btn');
    
    if (detailsDiv) {
        const isHidden = detailsDiv.style.display === 'none' || detailsDiv.style.display === '';
        detailsDiv.style.display = isHidden ? 'block' : 'none';
        if (toggleBtn) {
            toggleBtn.style.opacity = isHidden ? '1' : '0.6';
        }
    }
}

function quickContact(id) {
    const person = people.find(p => p.id === id);
    if (person) {
        person.lastContact = getTodayDate();
        saveToStorage();
        renderPeople();
        showToast(`✓ Marked ${person.familyName} as contacted today!`);
    }
}

function updateStats() {
    if (!people || people.length === 0) return;
    
    const totalCount = people.length;
    const attentionCount = people.filter(p => getDaysSinceContact(p.lastContact) >= 30).length;
    const recentCount = people.filter(p => getDaysSinceContact(p.lastContact) <= 7).length;
    
    const totalEl = document.getElementById('totalCount');
    const attentionEl = document.getElementById('attentionCount');
    const recentEl = document.getElementById('recentCount');
    
    if (totalEl) totalEl.textContent = totalCount;
    if (attentionEl) attentionEl.textContent = attentionCount;
    if (recentEl) recentEl.textContent = recentCount;
}

function handleSearch() {
    if (!searchInput) return;
    
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    if (clearSearch) {
        clearSearch.style.display = searchTerm ? 'inline-block' : 'none';
    }
    
    const allCards = document.querySelectorAll('.person-card');
    const allScriptures = document.querySelectorAll('.between-scripture');
    
    if (!searchTerm) {
        allCards.forEach(card => card.style.display = 'block');
        allScriptures.forEach(scripture => scripture.style.display = 'block');
        return;
    }
    
    allScriptures.forEach(scripture => scripture.style.display = 'none');
    
    allCards.forEach(card => {
        const text = card.textContent.toLowerCase();
        if (text.includes(searchTerm)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

function showToast(message) {
    // Remove existing toast if any
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function exportTextData() {
    if (people.length === 0) {
        alert('No notes to export!');
        return;
    }
    
    // Sort by last contact date (oldest first)
    const sortedPeople = [...people].sort((a, b) => 
        new Date(a.lastContact) - new Date(b.lastContact)
    );
    
    let textContent = '═══════════════════════════════════════════════════════\n';
    textContent += '       MINISTERING MEMORY HELPER - NOTES EXPORT\n';
    textContent += '       Church of Jesus Christ of Latter-day Saints\n';
    textContent += '═══════════════════════════════════════════════════════\n\n';
    textContent += `Exported: ${new Date().toLocaleDateString('en-US', { 
        year: 'numeric', month: 'long', day: 'numeric', 
        hour: '2-digit', minute: '2-digit' 
    })}\n`;
    textContent += `Total Families: ${people.length}\n\n`;
    textContent += '═══════════════════════════════════════════════════════\n\n';
    
    sortedPeople.forEach((person, index) => {
        const daysAgo = getDaysSinceContact(person.lastContact);
        const needsAttention = daysAgo >= 30;
        
        textContent += `${index + 1}. ${person.familyName.toUpperCase()}\n`;
        textContent += '───────────────────────────────────────────────────────\n';
        
        // Family information
        if (person.spouseName || person.spouseBirthday || person.children) {
            textContent += '\nFamily Information:\n';
            if (person.spouseName) {
                textContent += `  Spouse: ${person.spouseName}`;
                if (person.spouseBirthday) textContent += ` (Birthday: ${person.spouseBirthday})`;
                textContent += '\n';
            }
            if (person.children) {
                textContent += `  Children:\n`;
                textContent += `    ${person.children.split('\n').join('\n    ')}\n`;
            }
        }
        
        // Contact information
        if (person.phone || person.email || person.address) {
            textContent += '\nContact Information:\n';
            if (person.phone) textContent += `  Phone: ${person.phone}\n`;
            if (person.email) textContent += `  Email: ${person.email}\n`;
            if (person.address) textContent += `  Address: ${person.address}\n`;
        }
        
        // Last contact
        textContent += `\nLast Contact: ${formatDate(person.lastContact)} (${daysAgo} ${daysAgo === 1 ? 'day' : 'days'} ago)`;
        if (needsAttention) {
            textContent += ' ⚠️ NEEDS ATTENTION\n';
        } else {
            textContent += '\n';
        }
        
        // What's heavy
        if (person.whatsHeavy) {
            textContent += `\nWhat's Heavy Right Now:\n`;
            textContent += `  ${person.whatsHeavy.split('\n').join('\n  ')}\n`;
        }
        
        // Next nudge
        if (person.nextNudge) {
            textContent += `\nNext Gentle Nudge:\n`;
            textContent += `  ${person.nextNudge.split('\n').join('\n  ')}\n`;
        }
        
        textContent += '\n═══════════════════════════════════════════════════════\n\n';
    });
    
    textContent += '\n"Remember the worth of souls is great in the sight of God."\n';
    textContent += '— Doctrine & Covenants 18:10\n\n';
    textContent += '"By this shall all men know that ye are my disciples,\n';
    textContent += 'if ye have love one to another."\n';
    textContent += '— John 13:35\n';
    
    // Create and download file
    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ministering-notes-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('✓ Text file exported successfully!');
}
