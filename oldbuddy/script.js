// Buddy Letter Assistant - Data Collection
// All data stored locally in browser localStorage

(function() {
    'use strict';

    const STORAGE_KEY = 'buddyLetterData';

    // DOM Elements
    const form = document.getElementById('buddyLetterForm');
    const relationshipSelect = document.getElementById('relationship');
    const writerNameGroup = document.getElementById('writerNameGroup');
    const serviceInfoHeader = document.getElementById('serviceInfoHeader');
    const veteranNameLabel = document.getElementById('veteranNameLabel');
    const treatmentLabel = document.getElementById('treatmentLabel');
    const frequencyContactGroup = document.getElementById('frequencyContactGroup');
    const saveBtn = document.getElementById('saveBtn');
    const clearBtn = document.getElementById('clearBtn');
    const continueBtn = document.getElementById('continueBtn');
    const exportBtn = document.getElementById('exportBtn');
    const saveIndicator = document.getElementById('saveIndicator');
    const exportModal = document.getElementById('exportModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const exportTxtBtn = document.getElementById('exportTxtBtn');
    const exportJsonBtn = document.getElementById('exportJsonBtn');

    // Initialize
    init();

    function init() {
        loadSavedData();
        attachEventListeners();
        updateUIForRelationship();
    }

    // Event Listeners
    function attachEventListeners() {
        // Relationship change
        relationshipSelect.addEventListener('change', updateUIForRelationship);

        // Auto-save on input changes (debounced)
        const formInputs = form.querySelectorAll('input, select, textarea');
        formInputs.forEach(input => {
            input.addEventListener('change', debounce(autoSave, 1000));
        });

        // Button clicks
        saveBtn.addEventListener('click', manualSave);
        clearBtn.addEventListener('click', clearForm);
        continueBtn.addEventListener('click', continueToLetter);
        exportBtn.addEventListener('click', openExportModal);
        closeModalBtn.addEventListener('click', closeExportModal);
        exportTxtBtn.addEventListener('click', exportAsText);
        exportJsonBtn.addEventListener('click', exportAsJson);

        // Close modal on background click
        exportModal.addEventListener('click', (e) => {
            if (e.target === exportModal) {
                closeExportModal();
            }
        });
    }

    // Update UI based on relationship selection
    function updateUIForRelationship() {
        const relationship = relationshipSelect.value;
        const isSelf = relationship === 'self';

        // Show/hide writer name field
        if (isSelf) {
            writerNameGroup.classList.add('hidden');
            frequencyContactGroup.classList.add('hidden');
            serviceInfoHeader.textContent = 'My Service Information';
            veteranNameLabel.textContent = 'My Full Name';
            treatmentLabel.textContent = 'Have you sought treatment?';
        } else {
            writerNameGroup.classList.remove('hidden');
            frequencyContactGroup.classList.remove('hidden');
            serviceInfoHeader.textContent = 'Veteran\'s Service Information';
            veteranNameLabel.textContent = 'Veteran\'s Full Name';
            treatmentLabel.textContent = 'Has the Veteran sought treatment?';
        }
    }

    // Collect form data
    function collectFormData() {
        const data = {
            relationship: document.getElementById('relationship').value,
            timestamp: new Date().toISOString()
        };

        // Writer information (buddy letters only)
        if (data.relationship !== 'self') {
            data.writer = {
                name: document.getElementById('writerName').value.trim(),
                relationship: data.relationship
            };
        }

        // Veteran information
        data.veteran = {
            name: document.getElementById('veteranName').value.trim(),
            branch: document.getElementById('branch').value,
            unit: document.getElementById('unit').value.trim(),
            startDate: document.getElementById('startDate').value,
            endDate: document.getElementById('endDate').value
        };

        // Locations
        data.locations = Array.from(document.querySelectorAll('input[name="location"]:checked'))
            .map(checkbox => checkbox.value);
        data.otherLocation = document.getElementById('otherLocation').value.trim();

        // Exposures
        data.exposures = Array.from(document.querySelectorAll('input[name="exposure"]:checked'))
            .map(checkbox => checkbox.value);

        // Symptoms
        data.symptoms = Array.from(document.querySelectorAll('input[name="symptom"]:checked'))
            .map(checkbox => checkbox.value);

        // Timeline & Impact
        data.timeline = {
            beforeDeployment: document.getElementById('beforeDeployment').value,
            whenSymptomsStarted: document.getElementById('whenSymptomsStarted').value,
            symptomDuration: document.getElementById('symptomDuration').value,
            symptomProgression: document.getElementById('symptomProgression').value,
            treatmentSought: document.getElementById('treatmentSought').value
        };

        // Impact on daily life
        data.impact = Array.from(document.querySelectorAll('input[name="impact"]:checked'))
            .map(checkbox => checkbox.value);

        // Additional details
        data.details = {
            specificIncidents: document.getElementById('specificIncidents').value.trim(),
            observationPeriod: document.getElementById('observationPeriod').value.trim(),
            frequencyContact: document.getElementById('frequencyContact').value
        };

        return data;
    }

    // Save data to localStorage
    function saveData(data) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            return false;
        }
    }

    // Load saved data from localStorage
    function loadSavedData() {
        try {
            const savedData = localStorage.getItem(STORAGE_KEY);
            if (!savedData) return;

            const data = JSON.parse(savedData);

            // Relationship
            if (data.relationship) {
                document.getElementById('relationship').value = data.relationship;
            }

            // Writer information
            if (data.writer) {
                if (data.writer.name) document.getElementById('writerName').value = data.writer.name;
            }

            // Veteran information
            if (data.veteran) {
                if (data.veteran.name) document.getElementById('veteranName').value = data.veteran.name;
                if (data.veteran.branch) document.getElementById('branch').value = data.veteran.branch;
                if (data.veteran.unit) document.getElementById('unit').value = data.veteran.unit;
                if (data.veteran.startDate) document.getElementById('startDate').value = data.veteran.startDate;
                if (data.veteran.endDate) document.getElementById('endDate').value = data.veteran.endDate;
            }

            // Locations
            if (data.locations && Array.isArray(data.locations)) {
                data.locations.forEach(location => {
                    const checkbox = document.querySelector(`input[name="location"][value="${location}"]`);
                    if (checkbox) checkbox.checked = true;
                });
            }
            if (data.otherLocation) document.getElementById('otherLocation').value = data.otherLocation;

            // Exposures
            if (data.exposures && Array.isArray(data.exposures)) {
                data.exposures.forEach(exposure => {
               Timeline & Impact
            if (data.timeline) {
                if (data.timeline.beforeDeployment) {
                    document.getElementById('beforeDeployment').value = data.timeline.beforeDeployment;
                }
                if (data.timeline.whenSymptomsStarted) {
                    document.getElementById('whenSymptomsStarted').value = data.timeline.whenSymptomsStarted;
                }
                if (data.timeline.symptomDuration) {
                    document.getElementById('symptomDuration').value = data.timeline.symptomDuration;
                }
                if (data.timeline.symptomProgression) {
                    document.getElementById('symptomProgression').value = data.timeline.symptomProgression;
                }
                if (data.timeline.treatmentSought) {
                    document.getElementById('treatmentSought').value = data.timeline.treatmentSought;
                }
            }

            // Impact on daily life
            if (data.impact && Array.isArray(data.impact)) {
                data.impact.forEach(impact => {
                    const checkbox = document.querySelector(`input[name="impact"][value="${impact}"]`);
                    if (checkbox) checkbox.checked = true;
                });
            }

            //      const checkbox = document.querySelector(`input[name="exposure"][value="${exposure}"]`);
                    if (checkbox) checkbox.checked = true;
                });
            }

            // Symptoms
            if (data.symptoms && Array.isArray(data.symptoms)) {
                data.symptoms.forEach(symptom => {
                    const checkbox = document.querySelector(`input[name="symptom"][value="${symptom}"]`);
                    if (checkbox) checkbox.checked = true;
                });
            }

            // Additional details
            if (data.details) {
                if (data.details.specificIncidents) {
                    document.getElementById('specificIncidents').value = data.details.specificIncidents;
                }
                if (data.details.observationPeriod) {
                    document.getElementById('observationPeriod').value = data.details.observationPeriod;
                }
                if (data.details.frequencyContact) {
                    document.getElementById('frequencyContact').value = data.details.frequencyContact;
                }
            }

            updateUIForRelationship();
        } catch (error) {
            console.error('Error loading saved data:', error);
        }
    }

    // Auto-save
    function autoSave() {
        const data = collectFormData();
        if (saveData(data)) {
            showSaveIndicator('Auto-saved', 'success');
        }
    }

    // Manual save
    function manualSave() {
        const data = collectFormData();
        if (saveData(data)) {
            showSaveIndicator('Progress saved successfully!', 'success');
        } else {
            showSaveIndicator('Error saving data. Please try again.', 'error');
        }
    }

    // Clear form
    function clearForm() {
        if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
            localStorage.removeItem(STORAGE_KEY);
            form.reset();
            
            updateUIForRelationship();
            
            showSaveIndicator('All data cleared', 'success');
        }
    }

    // Continue to letter generation
    function continueToLetter() {
        // First save current data
        const data = collectFormData();
        
        // Basic validation
        if (!data.veteran.name) {
            alert('Please enter the veteran\'s name before continuing.');
            document.getElementById('veteranName').focus();
            return;
        }

        if (!data.relationship) {
            alert('Please select your relationship to the veteran before continuing.');
            document.getElementById('relationship').focus();
            return;
        }

        if (data.relationship !== 'self' && !data.writer.name) {
            alert('Please enter your name before continuing.');
            document.getElementById('writerName').focus();
            return;
        }

        if (data.symptoms.length === 0 && data.exposures.length === 0) {
            if (!confirm('You haven\'t selected any symptoms or exposures. Continue anyway?')) {
                return;
            }
        }

        // Save data
        if (saveData(data)) {
            showSaveIndicator('Data saved! Ready to generate letter...', 'success');
            
            // TODO: Navigate to letter generation page
            // For now, just show a message
            setTimeout(() => {
                alert('Letter generation feature coming next! Your data has been saved.');
            }, 500);
        } else {
            showSaveIndicator('Error saving data. Please try again.', 'error');
        }
    }

    // Export modal functions
    function openExportModal() {
        // Save current data first
        const data = collectFormData();
        saveData(data);
        exportModal.classList.add('show');
    }

    function closeExportModal() {
        exportModal.classList.remove('show');
    }

    // Export as JSON
    function exportAsJson() {
        const data = collectFormData();
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `buddy-letter-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        closeExportModal();
        showSaveIndicator('Data exported as JSON', 'success');
    }

    // Export as formatted text
    function exportAsText() {
        const data = collectFormData();
        const text = formatDataAsText(data);
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `buddy-letter-info-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        closeExportModal();
        showSaveIndicator('Data exported as text file', 'success');
    }

    // Format data as human-readable text
    function formatDataAsText(data) {
        let text = 'BUDDY LETTER INFORMATION\n';
        text += 'Generated: ' + new Date().toLocaleDateString() + '\n';
        text += '='.repeat(60) + '\n\n';

        // Relationship
        if (data.relationship) {
            const relationshipMap = {
                'self': 'Self (I am the Veteran)',
                'fellow-service-member': 'Fellow Service Member (peer/same unit)',
                'squad-leader': 'I was their Squad/Team Leader',
                'platoon-leader': 'I was their Platoon Leader/Sergeant',
                'company-commander': 'I was their Company Commander',
                'subordinate': 'They were my leader/supervisor',
                'roommate': 'Roommate/Bunkmate',
                'medic': 'Medic/Corpsman',
                'medical-provider': 'Medical Provider (Doctor/Nurse/PA)',
                'chaplain': 'Chaplain/Religious Leader',
                'spouse': 'Spouse/Partner',
                'parent': 'Parent',
                'child': 'Child',
                'sibling': 'Sibling',
                'family': 'Other Family Member',
                'friend': 'Friend',
                'other': 'Other'
            };
            text += 'RELATIONSHIP TO VETERAN\n';
            text += relationshipMap[data.relationship] || data.relationship;
            text += '\n\n';
        }

        // Writer information
        if (data.writer && data.writer.name) {
            text += 'WRITER INFORMATION\n';
            text += 'Name: ' + data.writer.name + '\n';
            text += '\n';
        }

        // Veteran information
        text += 'VETERAN INFORMATION\n';
        if (data.veteran.name) text += 'Name: ' + data.veteran.name + '\n';
        if (data.veteran.branch) text += 'Branch: ' + data.veteran.branch.toUpperCase() + '\n';
        if (data.veteran.unit) text += 'Unit: ' + data.veteran.unit + '\n';
        if (data.veteran.startDate || data.veteran.endDate) {
            text += 'Service Period: ' + (data.veteran.startDate || '?') + ' to ' + (data.veteran.endDate || '?') + '\n';
        }
        text += '\n';

        // Deployment locations
        if (data.locations && data.locations.length > 0) {
            text += 'DEPLOYMENT LOCATIONS\n';
            data.locations.forEach(loc => {
                text += '• ' + formatValue(loc) + '\n';
            });
            if (data.otherLocation) {
                text += '• Other: ' + data.otherLocation + '\n';
            }
            text += '\n';
        }

        // Combat exposures
        if (data.exposures && data.exposures.length > 0) {
            text += 'COMBAT EXPOSURES & EXPERIENCES\n';
            data.exposures.forEach(exp => {
                text += '• ' + formatValue(exp) + '\n';
            });
            text += '\n';
        }

        // Timeline
        if (data.timeline) {
            text += 'TIMELINE & SERVICE CONNECTION\n';
            if (data.timeline.beforeDeployment) {
                text += 'Before Deployment: ' + formatValue(data.timeline.beforeDeployment) + '\n';
            }
            if (data.timeline.whenSymptomsStarted) {
                text += 'When Symptoms Started: ' + formatValue(data.timeline.whenSymptomsStarted) + '\n';
            }
            if (data.timeline.symptomDuration) {
                text += 'Duration of Symptoms: ' + formatValue(data.timeline.symptomDuration) + '\n';
            }
            if (data.timeline.symptomProgression) {
                text += 'Symptom Progression: ' + formatValue(data.timeline.symptomProgression) + '\n';
            }
            if (data.timeline.treatmentSought) {
                text += 'Treatment: ' + formatValue(data.timeline.treatmentSought) + '\n';
            }
            text += '\n';
        }

        // Symptoms by category
        if (data.symptoms && data.symptoms.length > 0) {
            text += 'OBSERVED SYMPTOMS\n';
            
            const symptomCategories = {
                'Re-experiencing': ['nightmares', 'flashbacks', 'intrusive-thoughts', 'distress-reminders'],
                'Avoidance': ['avoid-conversations', 'avoid-people', 'emotional-numbness', 'memory-gaps', 'loss-of-interest', 'detachment'],
                'Hyperarousal': ['hypervigilance', 'exaggerated-startle', 'irritability', 'difficulty-concentrating', 'sleep-problems', 'reckless-behavior'],
                'Mood & Cognitive': ['negative-beliefs', 'guilt-shame', 'blame', 'negative-emotional-state', 'inability-positive-emotions'],
                'Behavioral Changes': ['substance-abuse', 'social-withdrawal', 'relationship-problems', 'work-problems', 'personality-change']
            };

            for (const [category, symptoms] of Object.entries(symptomCategories)) {
                const categorySymptoms = data.symptoms.filter(s => symptoms.includes(s));
                if (categorySymptoms.length > 0) {
                    text += '\n' + category + ':\n';
                    categorySymptoms.forEach(symptom => {
                        text += '  • ' + formatValue(symptom) + '\n';
                    });
                }
            }
            text += '\n';
        }

        // Impact on daily life
        if (data.impact && data.impact.length > 0) {
            text += 'IMPACT ON DAILY LIFE & FUNCTIONING\n';
            data.impact.forEach(imp => {
                text += '• ' + formatValue(imp) + '\n';
            });
            text += '\n';
        }

        // Additional details
        if (data.details) {
            text += 'ADDITIONAL DETAILS\n';
            if (data.details.observationPeriod) {
                text += 'Duration of Observation: ' + data.details.observationPeriod + '\n';
            }
            if (data.details.frequencyContact) {
                text += 'Frequency of Contact: ' + formatValue(data.details.frequencyContact) + '\n';
            }
            if (data.details.specificIncidents) {
                text += '\nSpecific Incidents:\n' + data.details.specificIncidents + '\n';
            }
            text += '\n';
        }

        text += '='.repeat(60) + '\n';
        text += 'End of Report\n';

        return text;
    }

    // Format values for display
    function formatValue(value) {
        return value
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    // Show save indicator
    function showSaveIndicator(message, type) {
        saveIndicator.textContent = message;
        saveIndicator.className = `save-indicator show ${type}`;
        
        setTimeout(() => {
            saveIndicator.classList.remove('show');
        }, 3000);
    }

    // Utility: Debounce function
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

    // Export data (for debugging)
    window.getBuddyLetterData = function() {
        const savedData = localStorage.getItem(STORAGE_KEY);
        return savedData ? JSON.parse(savedData) : null;
    };

})();
