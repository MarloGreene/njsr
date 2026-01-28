// Battle Buddy Checker
// Data structure
let roster = [];
let assigned = {};
let currentView = 'platoon';
let currentPerson = null;

// DOM elements
const nameInput = document.getElementById('nameInput');
const addNameBtn = document.getElementById('addName');
const rosterList = document.getElementById('rosterList');
const orgChart = document.getElementById('orgChart');
const chartTitle = document.getElementById('chartTitle');
const platoonView = document.getElementById('platoonView');
const sectionView = document.getElementById('sectionView');
const customView = document.getElementById('customView');
const modal = document.getElementById('personModal');
const closeModal = document.querySelector('.close');
const savePersonBtn = document.getElementById('savePerson');
const callsignInput = document.getElementById('callsign');
const contactInput = document.getElementById('contact');
const photoUrlInput = document.getElementById('photoUrl');
const notesTextarea = document.getElementById('notes');
const positionSelect = document.getElementById('positionSelect');
const assignPositionBtn = document.getElementById('assignPosition');

// Initialize
loadData();
renderRoster();
renderOrgChart();

// Event listeners
nameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addName();
});
addNameBtn.addEventListener('click', addName);

platoonView.addEventListener('click', () => setView('platoon'));
sectionView.addEventListener('click', () => setView('section'));
customView.addEventListener('click', () => setView('custom'));

closeModal.addEventListener('click', () => modal.style.display = 'none');
savePersonBtn.addEventListener('click', savePersonDetails);
assignPositionBtn.addEventListener('click', assignFromModal);

// Drag and drop
let draggedElement = null;

document.addEventListener('dragstart', (e) => {
    if (e.target.classList.contains('person')) {
        draggedElement = e.target;
        e.target.classList.add('dragging');
    }
});

document.addEventListener('dragend', (e) => {
    if (draggedElement) {
        draggedElement.classList.remove('dragging');
        draggedElement = null;
    }
});

document.addEventListener('dragover', (e) => {
    e.preventDefault();
});

document.addEventListener('drop', (e) => {
    e.preventDefault();
    if (draggedElement && e.target.classList.contains('position')) {
        const personId = draggedElement.dataset.id;
        const positionId = e.target.dataset.position;
        assignPerson(personId, positionId);
    }
});

// Functions
function addName() {
    const name = nameInput.value.trim();
    if (name) {
        const person = {
            id: Date.now().toString(),
            name: name,
            status: 'green',
            callsign: '',
            contact: '',
            photoUrl: '',
            notes: ''
        };
        roster.push(person);
        nameInput.value = '';
        saveData();
        renderRoster();
    }
}

function renderRoster() {
    rosterList.innerHTML = '';
    roster.forEach(person => {
        const personEl = createPersonElement(person);
        // Mark if assigned somewhere
        const isAssigned = Object.values(assigned).includes(person);
        if (isAssigned) {
            personEl.classList.add('assigned');
        }
        rosterList.appendChild(personEl);
    });
}

function createPersonElement(person) {
    const div = document.createElement('div');
    div.className = 'person';
    div.draggable = true;
    div.dataset.id = person.id;
    div.innerHTML = `
        <span class="person-name">${person.name}</span>
        <span class="status-indicator status-${person.status}"></span>
    `;
    div.addEventListener('click', (e) => {
        if (!e.target.closest('.status-indicator')) {
            openPersonModal(person);
        }
    });
    div.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        cycleStatus(person.id);
    });
    return div;
}

function cycleStatus(personId) {
    const person = roster.find(p => p.id === personId) || Object.values(assigned).find(p => p.id === personId);
    if (person) {
        const statuses = ['green', 'yellow', 'red', 'black'];
        const currentIndex = statuses.indexOf(person.status);
        person.status = statuses[(currentIndex + 1) % statuses.length];
        saveData();
        renderAll();
    }
}

function assignPerson(personId, positionId) {
    const person = roster.find(p => p.id === personId);
    if (person) {
        assigned[positionId] = person;
        saveData();
        renderAll();
    }
}

function renderOrgChart() {
    orgChart.innerHTML = '';
    if (currentView === 'platoon') {
        renderPlatoonChart();
    } else if (currentView === 'section') {
        renderSectionChart();
    } else if (currentView === 'custom') {
        renderCustomChart();
    }
}

function renderPlatoonChart() {
    chartTitle.textContent = 'Platoon Organization';
    
    // Platoon HQ
    const hqDiv = document.createElement('div');
    hqDiv.className = 'org-level';
    hqDiv.innerHTML = '<h3>Platoon HQ</h3>';
    const hqGrid = document.createElement('div');
    hqGrid.className = 'platoon-grid';
    ['Platoon Leader', 'Platoon Sergeant', 'Platoon Medic', 'Platoon RTO'].forEach(pos => {
        hqGrid.appendChild(createPositionElement(`hq-${pos.replace(' ', '-')}`, pos));
    });
    hqDiv.appendChild(hqGrid);
    orgChart.appendChild(hqDiv);

    // 3 Squads
    for (let i = 1; i <= 3; i++) {
        const squadDiv = document.createElement('div');
        squadDiv.className = 'org-level';
        squadDiv.innerHTML = `<h3>Squad ${i}</h3>`;
        const squadGrid = document.createElement('div');
        squadGrid.className = 'squad-grid';
        
        // Squad Leader
        squadGrid.appendChild(createPositionElement(`squad${i}-leader`, `Squad ${i} Leader`));
        
        // 3 Fireteams
        for (let j = 1; j <= 3; j++) {
            const fireteamDiv = document.createElement('div');
            fireteamDiv.className = 'fireteam-grid';
            [`Fireteam ${j} Leader`, 'Rifleman', 'Rifleman', 'Rifleman'].forEach((pos, k) => {
                fireteamDiv.appendChild(createPositionElement(`squad${i}-ft${j}-${k}`, pos));
            });
            squadGrid.appendChild(fireteamDiv);
        }
        
        squadDiv.appendChild(squadGrid);
        orgChart.appendChild(squadDiv);
    }
}

function renderSectionChart() {
    chartTitle.textContent = 'Section Organization';
    
    const sectionDiv = document.createElement('div');
    sectionDiv.className = 'org-level';
    sectionDiv.innerHTML = '<h3>Section</h3>';
    const sectionGrid = document.createElement('div');
    sectionGrid.className = 'platoon-grid';
    ['Section Leader', 'Section 2IC', 'Section Medic'].forEach(pos => {
        sectionGrid.appendChild(createPositionElement(`section-${pos.replace(' ', '-')}`, pos));
    });
    sectionDiv.appendChild(sectionGrid);
    orgChart.appendChild(sectionDiv);

    // 2 Teams
    for (let i = 1; i <= 2; i++) {
        const teamDiv = document.createElement('div');
        teamDiv.className = 'org-level';
        teamDiv.innerHTML = `<h3>Team ${i}</h3>`;
        const teamGrid = document.createElement('div');
        teamGrid.className = 'squad-grid';
        ['Team Leader', 'Rifleman', 'Rifleman', 'Rifleman', 'Rifleman'].forEach((pos, j) => {
            teamGrid.appendChild(createPositionElement(`team${i}-${j}`, pos));
        });
        teamDiv.appendChild(teamGrid);
        orgChart.appendChild(teamDiv);
    }
}

function renderCustomChart() {
    chartTitle.textContent = 'Custom Squad';
    
    const customDiv = document.createElement('div');
    customDiv.className = 'org-level';
    customDiv.innerHTML = '<h3>Your Squad</h3>';
    const customGrid = document.createElement('div');
    customGrid.className = 'platoon-grid';
    ['Squad Leader', 'Team Leader 1', 'Team Leader 2', 'Medic', 'RTO', 'Rifleman 1', 'Rifleman 2', 'Rifleman 3', 'Rifleman 4', 'Rifleman 5'].forEach((pos, i) => {
        customGrid.appendChild(createPositionElement(`custom-${i}`, pos));
    });
    customDiv.appendChild(customGrid);
    orgChart.appendChild(customDiv);
}

function createPositionElement(id, title) {
    const div = document.createElement('div');
    div.className = 'position';
    div.dataset.position = id;
    div.innerHTML = `<div class="position-title">${title}</div>`;
    
    if (assigned[id]) {
        const personEl = createPersonElement(assigned[id]);
        personEl.draggable = false;
        personEl.addEventListener('dblclick', () => {
            delete assigned[id];
            roster.push(assigned[id]);
            saveData();
            renderAll();
        });
        div.appendChild(personEl);
    }
    
    return div;
}

function setView(view) {
    currentView = view;
    document.querySelectorAll('.view-toggle button').forEach(btn => btn.classList.remove('active'));
    if (view === 'platoon') platoonView.classList.add('active');
    else if (view === 'section') sectionView.classList.add('active');
    else if (view === 'custom') customView.classList.add('active');
    renderOrgChart();
}

function openPersonModal(person) {
    currentPerson = person;
    document.getElementById('personName').textContent = person.name;
    callsignInput.value = person.callsign;
    contactInput.value = person.contact;
    photoUrlInput.value = person.photoUrl;
    notesTextarea.value = person.notes;
    
    // Populate position select
    positionSelect.innerHTML = '<option value="">Select Position</option>';
    const positions = getPositionsForView(currentView);
    positions.forEach(pos => {
        const option = document.createElement('option');
        option.value = pos.id;
        option.textContent = pos.title;
        positionSelect.appendChild(option);
    });
    
    modal.style.display = 'block';
}

function savePersonDetails() {
    if (currentPerson) {
        currentPerson.callsign = callsignInput.value;
        currentPerson.contact = contactInput.value;
        currentPerson.photoUrl = photoUrlInput.value;
        currentPerson.notes = notesTextarea.value;
        saveData();
        modal.style.display = 'none';
        renderAll();
    }
}

function renderAll() {
    renderRoster();
    renderOrgChart();
}

function getPositionsForView(view) {
    const positions = [];
    if (view === 'platoon') {
        // Platoon HQ
        ['Platoon Leader', 'Platoon Sergeant', 'Platoon Medic', 'Platoon RTO'].forEach(pos => {
            positions.push({id: `hq-${pos.replace(' ', '-')}`, title: pos});
        });
        // Squads
        for (let i = 1; i <= 3; i++) {
            positions.push({id: `squad${i}-leader`, title: `Squad ${i} Leader`});
            for (let j = 1; j <= 3; j++) {
                positions.push({id: `squad${i}-ft${j}-0`, title: `Squad ${i} Fireteam ${j} Leader`});
                for (let k = 1; k <= 3; k++) {
                    positions.push({id: `squad${i}-ft${j}-${k}`, title: `Squad ${i} Fireteam ${j} Rifleman ${k}`});
                }
            }
        }
    } else if (view === 'section') {
        ['Section Leader', 'Section 2IC', 'Section Medic'].forEach(pos => {
            positions.push({id: `section-${pos.replace(' ', '-')}`, title: pos});
        });
        for (let i = 1; i <= 2; i++) {
            positions.push({id: `team${i}-0`, title: `Team ${i} Leader`});
            for (let j = 1; j <= 4; j++) {
                positions.push({id: `team${i}-${j}`, title: `Team ${i} Rifleman ${j}`});
            }
        }
    } else if (view === 'custom') {
        ['Squad Leader', 'Team Leader 1', 'Team Leader 2', 'Medic', 'RTO', 'Rifleman 1', 'Rifleman 2', 'Rifleman 3', 'Rifleman 4', 'Rifleman 5'].forEach((pos, i) => {
            positions.push({id: `custom-${i}`, title: pos});
        });
    }
    return positions;
}

function assignFromModal() {
    if (currentPerson && positionSelect.value) {
        assignPerson(currentPerson.id, positionSelect.value);
    }
}

function saveData() {
    const data = {
        roster: roster,
        assigned: assigned,
        currentView: currentView
    };
    localStorage.setItem('battleBuddyData', JSON.stringify(data));
}

function loadData() {
    const data = localStorage.getItem('battleBuddyData');
    if (data) {
        const parsed = JSON.parse(data);
        roster = parsed.roster || [];
        assigned = parsed.assigned || {};
        currentView = parsed.currentView || 'platoon';
        setView(currentView);
    }
}