// Charlie Company Cooperative - The After Deployment Brief
// Progress tracking, self-assessment, and navigation

// State
let completedSections = new Set();
let assessmentAnswers = {};

// DOM Elements
const progressBar = document.getElementById('progressBar');
const sectionNav = document.getElementById('sectionNav');
const assessmentModal = document.getElementById('assessmentModal');
const assessmentContainer = document.getElementById('assessmentContainer');
const summarySection = document.getElementById('summary');
const summaryContent = document.getElementById('summaryContent');

// Assessment questions
const assessmentQuestions = [
    {
        id: 'sleep',
        category: 'Sleep',
        text: 'How often do you have trouble falling or staying asleep?',
        options: ['Rarely', 'Sometimes', 'Often', 'Almost Always']
    },
    {
        id: 'hypervigilance',
        category: 'Hypervigilance',
        text: 'How often do you find yourself scanning for threats in everyday situations?',
        options: ['Rarely', 'Sometimes', 'Often', 'Almost Always']
    },
    {
        id: 'irritability',
        category: 'Irritability',
        text: 'How often do small things trigger disproportionate anger or frustration?',
        options: ['Rarely', 'Sometimes', 'Often', 'Almost Always']
    },
    {
        id: 'avoidance',
        category: 'Avoidance',
        text: 'How often do you avoid places, conversations, or media that might trigger memories?',
        options: ['Rarely', 'Sometimes', 'Often', 'Almost Always']
    },
    {
        id: 'detachment',
        category: 'Detachment',
        text: 'How often do you feel emotionally disconnected from people close to you?',
        options: ['Rarely', 'Sometimes', 'Often', 'Almost Always']
    },
    {
        id: 'startle',
        category: 'Startle Response',
        text: 'How often do sudden noises or movements cause an intense physical reaction?',
        options: ['Rarely', 'Sometimes', 'Often', 'Almost Always']
    },
    {
        id: 'intrusion',
        category: 'Intrusive Thoughts',
        text: 'How often do unwanted memories or images from deployment enter your mind?',
        options: ['Rarely', 'Sometimes', 'Often', 'Almost Always']
    },
    {
        id: 'nightmares',
        category: 'Nightmares',
        text: 'How often do you have disturbing dreams related to your service?',
        options: ['Rarely', 'Sometimes', 'Often', 'Almost Always']
    }
];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadProgress();
    setupEventListeners();
    updateProgressBar();
    updateNavigation();
    checkAllComplete();
});

// Load progress from localStorage
function loadProgress() {
    try {
        const saved = localStorage.getItem('c3Progress');
        if (saved) {
            const data = JSON.parse(saved);
            completedSections = new Set(data.completedSections || []);
            assessmentAnswers = data.assessmentAnswers || {};
        }
    } catch (e) {
        console.error('Failed to load progress:', e);
    }
}

// Save progress to localStorage
function saveProgress() {
    const data = {
        completedSections: Array.from(completedSections),
        assessmentAnswers: assessmentAnswers,
        lastVisit: new Date().toISOString()
    };
    localStorage.setItem('c3Progress', JSON.stringify(data));
}

// Setup event listeners
function setupEventListeners() {
    // Section navigation
    sectionNav.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const sectionNum = item.dataset.section;
            const section = document.getElementById(`section-${sectionNum}`);
            if (section) {
                section.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // Complete buttons
    document.querySelectorAll('.btn-complete').forEach(btn => {
        btn.addEventListener('click', () => {
            const sectionNum = btn.dataset.section;
            completeSection(sectionNum);
        });
    });

    // Symptom card clicks (Section 2)
    document.querySelectorAll('.symptom-card').forEach(card => {
        card.addEventListener('click', () => {
            card.classList.toggle('checked');
        });
    });

    // Assessment tool button
    document.querySelectorAll('[data-tool="symptom-check"]').forEach(btn => {
        btn.addEventListener('click', openAssessment);
    });

    // Close assessment
    document.getElementById('closeAssessment').addEventListener('click', closeAssessment);
    assessmentModal.addEventListener('click', (e) => {
        if (e.target === assessmentModal) {
            closeAssessment();
        }
    });

    // Scroll tracking
    window.addEventListener('scroll', () => {
        updateProgressBar();
        updateActiveSection();
    });

    // Escape key to close modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && assessmentModal.classList.contains('active')) {
            closeAssessment();
        }
    });
}

// Complete a section
function completeSection(sectionNum) {
    completedSections.add(sectionNum);
    saveProgress();
    updateNavigation();
    updateProgressBar();

    // Scroll to next section
    const nextNum = parseInt(sectionNum) + 1;
    const nextSection = document.getElementById(`section-${nextNum}`);
    if (nextSection) {
        setTimeout(() => {
            nextSection.scrollIntoView({ behavior: 'smooth' });
        }, 300);
    }

    // Check if all complete
    checkAllComplete();
}

// Update progress bar
function updateProgressBar() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = (scrollTop / docHeight) * 100;
    progressBar.style.width = `${scrollPercent}%`;
}

// Update navigation state
function updateNavigation() {
    sectionNav.querySelectorAll('.nav-item').forEach(item => {
        const sectionNum = item.dataset.section;
        if (completedSections.has(sectionNum)) {
            item.classList.add('completed');
        } else {
            item.classList.remove('completed');
        }
    });
}

// Update active section in nav
function updateActiveSection() {
    const sections = document.querySelectorAll('.content-section[data-section]');
    let activeSection = null;

    sections.forEach(section => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= 150 && rect.bottom > 150) {
            activeSection = section.dataset.section;
        }
    });

    sectionNav.querySelectorAll('.nav-item').forEach(item => {
        if (item.dataset.section === activeSection) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

// Check if all sections complete
function checkAllComplete() {
    if (completedSections.size >= 5) {
        showSummary();
    }
}

// Show summary section
function showSummary() {
    summarySection.style.display = 'block';

    // Generate summary content
    const checkedSymptoms = document.querySelectorAll('.symptom-card.checked').length;
    const totalSymptoms = document.querySelectorAll('.symptom-card').length;

    let summaryHTML = `
        <div class="summary-stat">
            <span>Sections Completed</span>
            <span>${completedSections.size} of 5</span>
        </div>
        <div class="summary-stat">
            <span>Symptoms Identified</span>
            <span>${checkedSymptoms} of ${totalSymptoms}</span>
        </div>
    `;

    if (Object.keys(assessmentAnswers).length > 0) {
        const score = calculateAssessmentScore();
        summaryHTML += `
            <div class="summary-stat">
                <span>Self-Assessment Score</span>
                <span>${score.total} / ${score.max}</span>
            </div>
        `;
    }

    summaryHTML += `
        <div class="summary-stat">
            <span>Progress Saved</span>
            <span>Yes - stored locally</span>
        </div>
    `;

    summaryContent.innerHTML = summaryHTML;
}

// Assessment functions
function openAssessment() {
    renderAssessment();
    assessmentModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeAssessment() {
    assessmentModal.classList.remove('active');
    document.body.style.overflow = '';
}

function renderAssessment() {
    let html = `
        <div class="assessment-header">
            <h3>Symptom Self-Check</h3>
            <p>Answer honestly. This is for your awareness only.</p>
        </div>
    `;

    assessmentQuestions.forEach((q, index) => {
        const currentAnswer = assessmentAnswers[q.id];
        html += `
            <div class="assessment-question" data-question="${q.id}">
                <p><strong>${index + 1}.</strong> ${q.text}</p>
                <div class="assessment-options">
                    ${q.options.map((opt, i) => `
                        <button class="assessment-option ${currentAnswer === i ? 'selected' : ''}"
                                data-question="${q.id}"
                                data-value="${i}">
                            ${opt}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    });

    html += `
        <div class="assessment-actions">
            <button class="btn-assessment btn-assessment-secondary" id="clearAssessment">Clear</button>
            <button class="btn-assessment btn-assessment-primary" id="submitAssessment">See Results</button>
        </div>
    `;

    assessmentContainer.innerHTML = html;

    // Add option click handlers
    assessmentContainer.querySelectorAll('.assessment-option').forEach(opt => {
        opt.addEventListener('click', () => {
            const questionId = opt.dataset.question;
            const value = parseInt(opt.dataset.value);

            // Update UI
            opt.parentElement.querySelectorAll('.assessment-option').forEach(o => {
                o.classList.remove('selected');
            });
            opt.classList.add('selected');

            // Save answer
            assessmentAnswers[questionId] = value;
            saveProgress();
        });
    });

    // Clear button
    document.getElementById('clearAssessment').addEventListener('click', () => {
        assessmentAnswers = {};
        saveProgress();
        renderAssessment();
    });

    // Submit button
    document.getElementById('submitAssessment').addEventListener('click', showAssessmentResults);
}

function showAssessmentResults() {
    const answeredCount = Object.keys(assessmentAnswers).length;
    if (answeredCount < assessmentQuestions.length) {
        alert(`Please answer all ${assessmentQuestions.length} questions.`);
        return;
    }

    const score = calculateAssessmentScore();

    let html = `
        <div class="assessment-results">
            <div class="assessment-header">
                <h3>Your Results</h3>
            </div>
            <div class="results-score">${score.total}</div>
            <div class="results-label">out of ${score.max} possible</div>

            <div class="results-breakdown">
    `;

    assessmentQuestions.forEach(q => {
        const value = assessmentAnswers[q.id];
        const level = value <= 1 ? 'low' : (value === 2 ? 'moderate' : 'high');
        const levelText = value <= 1 ? 'Low' : (value === 2 ? 'Moderate' : 'High');

        html += `
            <div class="results-item">
                <span class="results-category">${q.category}</span>
                <span class="results-value ${level}">${levelText}</span>
            </div>
        `;
    });

    html += `
            </div>

            <p style="color: var(--text-secondary); margin-bottom: 20px;">
                ${getScoreInterpretation(score.total, score.max)}
            </p>

            <div class="assessment-actions">
                <button class="btn-assessment btn-assessment-secondary" id="retakeAssessment">Retake</button>
                <button class="btn-assessment btn-assessment-primary" id="closeResults">Continue</button>
            </div>
        </div>
    `;

    assessmentContainer.innerHTML = html;

    document.getElementById('retakeAssessment').addEventListener('click', () => {
        assessmentAnswers = {};
        saveProgress();
        renderAssessment();
    });

    document.getElementById('closeResults').addEventListener('click', closeAssessment);
}

function calculateAssessmentScore() {
    let total = 0;
    const max = assessmentQuestions.length * 3; // Max 3 per question

    Object.values(assessmentAnswers).forEach(value => {
        total += value;
    });

    return { total, max };
}

function getScoreInterpretation(score, max) {
    const percent = (score / max) * 100;

    if (percent < 25) {
        return "Your responses suggest relatively low symptom intensity. This doesn't mean your experiences aren't valid — any level of disruption matters.";
    } else if (percent < 50) {
        return "Your responses indicate moderate symptom presence. This is common among combat veterans and is worth addressing. The tools here can help.";
    } else if (percent < 75) {
        return "Your responses suggest significant symptom intensity. This level of disruption impacts daily life. Consider using the resources provided and connecting with others who understand.";
    } else {
        return "Your responses indicate high symptom intensity across multiple areas. This is serious but not hopeless. What you're experiencing is real, and there are paths forward. You don't have to figure this out alone.";
    }
}

// Utility: Reset all progress (for testing)
function resetProgress() {
    localStorage.removeItem('c3Progress');
    completedSections = new Set();
    assessmentAnswers = {};
    updateNavigation();
    location.reload();
}

// Expose for console debugging
window.c3 = {
    resetProgress,
    completedSections: () => completedSections,
    assessmentAnswers: () => assessmentAnswers
};
