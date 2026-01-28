// Elements
const historyList = document.getElementById('historyList');
const clearBtn = document.getElementById('clearBtn');

// Dice Tower Elements
const diceTower = document.getElementById('diceTower');
const towerDiceList = document.getElementById('towerDiceList');
const rollAllBtn = document.getElementById('rollAllBtn');
const clearTowerBtn = document.getElementById('clearTowerBtn');
const towerModifier = document.getElementById('towerModifier');
const resultsMat = document.getElementById('resultsMat');
const matDiceResults = document.getElementById('matDiceResults');
const matTotal = document.getElementById('matTotal');
const draggableDice = document.querySelectorAll('.draggable-die');

// Quick d20 Elements
const d20RollBtn = document.getElementById('d20RollBtn');
const d20Modifier = document.getElementById('d20Modifier');
const d20Result = document.getElementById('d20Result');
const d20ResultText = document.getElementById('d20ResultText');
const d20Svg = document.getElementById('d20Svg');
const d20Display = document.getElementById('d20Display');
const oneHandedRollBtn = document.getElementById('oneHandedRollBtn');
const oneHandedModifier = document.getElementById('oneHandedModifier');
const twoHandedRollBtn = document.getElementById('twoHandedRollBtn');
const twoHandedModifier = document.getElementById('twoHandedModifier');
const rangedRollBtn = document.getElementById('rangedRollBtn');
const rangedModifier = document.getElementById('rangedModifier');
const initiativeRollBtn = document.getElementById('initiativeRollBtn');
const initiativeModifier = document.getElementById('initiativeModifier');

let rollHistory = JSON.parse(localStorage.getItem('diceHistory')) || [];
let towerDice = [];

// Roll dice
function rollDice(sides) {
    return Math.floor(Math.random() * sides) + 1;
}

// Format time
function formatTime() {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
    });
}

// Add to history
function addToHistory(sides, result) {
    rollHistory.unshift({
        sides: sides,
        result: result,
        time: formatTime()
    });
    
    if (rollHistory.length > 20) {
        rollHistory = rollHistory.slice(0, 20);
    }
    
    localStorage.setItem('diceHistory', JSON.stringify(rollHistory));
    renderHistory();
}

// Render history
function renderHistory() {
    if (rollHistory.length === 0) {
        historyList.innerHTML = '<div class="empty-state">No rolls yet</div>';
        return;
    }
    
    historyList.innerHTML = '';
    rollHistory.forEach(roll => {
        const item = document.createElement('div');
        item.className = 'history-item';
        item.innerHTML = `
            <div>
                <span class="history-dice">${roll.sides}</span>
                <span class="history-time"> • ${roll.time}</span>
            </div>
            <div class="history-result">${roll.result}</div>
        `;
        historyList.appendChild(item);
    });
}

// Clear history
function clearHistory() {
    if (rollHistory.length === 0) return;
    
    if (confirm('Clear all roll history?')) {
        rollHistory = [];
        localStorage.removeItem('diceHistory');
        renderHistory();
    }
}

clearBtn.addEventListener('click', clearHistory);

renderHistory();

// ===== DICE TOWER FUNCTIONALITY =====

// Create SVG for a die based on sides
function createDieSVG(sides) {
    const svgClass = `d${sides}`;
    let shape = '';
    
    switch(sides) {
        case 4:
            shape = '<polygon points="50,10 90,90 10,90" class="die-face"/>';
            break;
        case 6:
            shape = '<rect x="20" y="20" width="60" height="60" class="die-face"/>';
            break;
        case 8:
            shape = '<polygon points="50,15 85,50 50,85 15,50" class="die-face"/>';
            break;
        case 10:
            shape = '<polygon points="50,10 80,35 80,65 50,90 20,65 20,35" class="die-face"/>';
            break;
        case 12:
            shape = '<polygon points="50,10 75,20 85,40 85,60 75,80 50,90 25,80 15,60 15,40 25,20" class="die-face"/>';
            break;
        case 20:
            shape = '<polygon points="50,5 70,25 85,25 90,45 80,65 65,80 35,80 20,65 10,45 15,25 30,25" class="die-face"/>';
            break;
        case 100:
            shape = '<circle cx="50" cy="50" r="40" class="die-face"/>';
            break;
    }
    
    return `<svg viewBox="0 0 100 100" class="die-svg ${svgClass}">${shape}<text x="50" y="58" class="die-number">d${sides}</text></svg>`;
}

// Drag and Drop handlers
draggableDice.forEach(die => {
    die.addEventListener('dragstart', handleDragStart);
    die.addEventListener('click', handleDieClick);
});

function handleDieClick(e) {
    const sides = parseInt(e.currentTarget.dataset.sides);
    rollSingleDie(sides);
}

function rollSingleDie(sides) {
    // Clear results mat
    matDiceResults.innerHTML = '';
    matTotal.classList.remove('show');
    
    // Animate and roll
    const result = rollDice(sides);
    
    const dieResultElement = document.createElement('div');
    dieResultElement.className = 'mat-die-result';
    dieResultElement.innerHTML = `
        ${createDieSVG(sides)}
        <div class="mat-die-value">${result}</div>
    `;
    matDiceResults.appendChild(dieResultElement);
    
    // Show total
    setTimeout(() => {
        matTotal.innerHTML = `Result: <strong>${result}</strong>`;
        matTotal.classList.add('show');
        
        // Add to history
        addToHistory(`d${sides}`, result);
    }, 300);
}

function handleDragStart(e) {
    const sides = parseInt(e.target.dataset.sides || e.target.closest('.draggable-die').dataset.sides);
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/plain', sides);
}

diceTower.addEventListener('dragover', handleDragOver);
diceTower.addEventListener('dragleave', handleDragLeave);
diceTower.addEventListener('drop', handleDrop);

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    diceTower.classList.add('drag-over');
}

function handleDragLeave(e) {
    if (e.target === diceTower) {
        diceTower.classList.remove('drag-over');
    }
}

function handleDrop(e) {
    e.preventDefault();
    diceTower.classList.remove('drag-over');
    
    const sides = parseInt(e.dataTransfer.getData('text/plain'));
    if (sides) {
        addDieToTower(sides);
    }
}

// Add die to tower
function addDieToTower(sides) {
    towerDice.push(sides);
    renderTowerDice();
    updateTowerButtons();
}

// Render tower dice
function renderTowerDice() {
    towerDiceList.innerHTML = '';
    
    towerDice.forEach((sides, index) => {
        const dieElement = document.createElement('div');
        dieElement.className = 'tower-die';
        dieElement.innerHTML = `
            ${createDieSVG(sides)}
            <button class="die-remove-btn" data-index="${index}">×</button>
        `;
        towerDiceList.appendChild(dieElement);
    });
    
    // Add remove listeners
    document.querySelectorAll('.die-remove-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index);
            removeDieFromTower(index);
        });
    });
}

// Remove die from tower
function removeDieFromTower(index) {
    towerDice.splice(index, 1);
    renderTowerDice();
    updateTowerButtons();
}

// Clear all dice from tower
function clearTower() {
    towerDice = [];
    renderTowerDice();
    updateTowerButtons();
    clearResultsMat();
}

// Update tower buttons visibility
function updateTowerButtons() {
    if (towerDice.length > 0) {
        rollAllBtn.style.display = 'block';
        clearTowerBtn.style.display = 'block';
    } else {
        rollAllBtn.style.display = 'none';
        clearTowerBtn.style.display = 'none';
    }
}

// Clear results mat
function clearResultsMat() {
    matDiceResults.innerHTML = '<div class="mat-empty">Roll dice to see results</div>';
    matTotal.classList.remove('show');
}

// Roll all dice in tower
function rollAllDice() {
    if (towerDice.length === 0) return;
    
    const modifier = parseInt(towerModifier.value) || 0;
    
    // Clear previous results
    matDiceResults.innerHTML = '';
    
    const results = [];
    let totalDelay = 0;
    
    // Roll each die with staggered animation
    towerDice.forEach((sides, index) => {
        setTimeout(() => {
            const result = rollDice(sides);
            results.push({ sides, result });
            
            const dieResultElement = document.createElement('div');
            dieResultElement.className = 'mat-die-result';
            dieResultElement.innerHTML = `
                ${createDieSVG(sides)}
                <div class="mat-die-value">${result}</div>
            `;
            matDiceResults.appendChild(dieResultElement);
            
            // Show total after all dice are rolled
            if (results.length === towerDice.length) {
                setTimeout(() => {
                    const diceTotal = results.reduce((sum, r) => sum + r.result, 0);
                    const total = diceTotal + modifier;
                    
                    let totalHTML = '';
                    if (modifier !== 0) {
                        const modSign = modifier >= 0 ? '+' : '';
                        totalHTML = `Dice: <strong>${diceTotal}</strong> ${modSign}${modifier} = <strong>${total}</strong>`;
                    } else {
                        totalHTML = `Total: <strong>${total}</strong>`;
                    }
                    
                    matTotal.innerHTML = totalHTML;
                    matTotal.classList.add('show');
                    
                    // Add to history
                    const diceDescription = towerDice.reduce((acc, sides) => {
                        acc[sides] = (acc[sides] || 0) + 1;
                        return acc;
                    }, {});
                    const diceString = Object.entries(diceDescription)
                        .map(([sides, count]) => `${count}d${sides}`)
                        .join(' + ');
                    const historyLabel = modifier !== 0 ? `${diceString} ${modifier >= 0 ? '+' : ''}${modifier}` : diceString;
                    addToHistory(historyLabel, total);
                }, 300);
            }
        }, totalDelay);
        
        totalDelay += 150;
    });
}

// Event listeners for tower
rollAllBtn.addEventListener('click', rollAllDice);
clearTowerBtn.addEventListener('click', clearTower);

// ===== QUICK D20 ROLLER =====
function rollQuickD20(rollType = 'custom', modifierValue = null) {
    const modifier = modifierValue !== null ? modifierValue : (parseInt(d20Modifier.value) || 0);
    
    // Add rolling animation
    d20Svg.classList.add('rolling');
    d20ResultText.textContent = '?';
    d20Result.textContent = '';
    
    // Animate through random numbers
    let counter = 0;
    const animationInterval = setInterval(() => {
        d20ResultText.textContent = rollDice(20);
        counter++;
        if (counter >= 10) {
            clearInterval(animationInterval);
        }
    }, 50);
    
    // Final result after animation
    setTimeout(() => {
        const baseRoll = rollDice(20);
        const total = baseRoll + modifier;
        
        d20ResultText.textContent = baseRoll;
        d20Svg.classList.remove('rolling');
        
        // Display result with modifier if present
        let rollTypeLabel = '';
        let rollTypeColor = '#6c5ce7';
        
        if (rollType === 'onehanded') {
            rollTypeLabel = '🗡️ One-Handed Attack: ';
            rollTypeColor = '#e74c3c';
        } else if (rollType === 'twohanded') {
            rollTypeLabel = '⚔️ Two-Handed Attack: ';
            rollTypeColor = '#c0392b';
        } else if (rollType === 'ranged') {
            rollTypeLabel = '🏹 Ranged Attack: ';
            rollTypeColor = '#27ae60';
        } else if (rollType === 'initiative') {
            rollTypeLabel = '🎯 Initiative Roll: ';
            rollTypeColor = '#4ecdc4';
        }
        
        if (modifier !== 0) {
            const modSign = modifier >= 0 ? '+' : '';
            d20Result.innerHTML = `
                <div style="font-size: 0.85rem; color: #666; margin-bottom: 0.25rem;">${rollTypeLabel}</div>
                <div style="font-size: 0.9rem; color: #666;">Roll: ${baseRoll} ${modSign}${modifier}</div>
                <div style="color: ${rollTypeColor}; margin-top: 0.25rem; font-size: 2rem;">${total}</div>
            `;
        } else {
            d20Result.innerHTML = `
                <div style="font-size: 0.85rem; color: #666; margin-bottom: 0.25rem;">${rollTypeLabel}</div>
                <div style="color: ${rollTypeColor}; font-size: 2rem;">${baseRoll}</div>
            `;
        }
        
        // Add to history
        let description = 'd20';
        if (rollType === 'onehanded') {
            description = modifier !== 0 ? `1H Attack: d20${modifier >= 0 ? '+' : ''}${modifier}` : '1H Attack: d20';
        } else if (rollType === 'twohanded') {
            description = modifier !== 0 ? `2H Attack: d20${modifier >= 0 ? '+' : ''}${modifier}` : '2H Attack: d20';
        } else if (rollType === 'ranged') {
            description = modifier !== 0 ? `Ranged: d20${modifier >= 0 ? '+' : ''}${modifier}` : 'Ranged: d20';
        } else if (rollType === 'initiative') {
            description = modifier !== 0 ? `Initiative: d20${modifier >= 0 ? '+' : ''}${modifier}` : 'Initiative: d20';
        } else if (modifier !== 0) {
            description = `d20${modifier >= 0 ? '+' : ''}${modifier}`;
        }
        
        addToHistory(description, total);
    }, 500);
}

function rollOneHanded() {
    const modifier = parseInt(oneHandedModifier.value) || 0;
    rollQuickD20('onehanded', modifier);
}

function rollTwoHanded() {
    const modifier = parseInt(twoHandedModifier.value) || 0;
    rollQuickD20('twohanded', modifier);
}

function rollRanged() {
    const modifier = parseInt(rangedModifier.value) || 0;
    rollQuickD20('ranged', modifier);
}

function rollInitiative() {
    const modifier = parseInt(initiativeModifier.value) || 0;
    rollQuickD20('initiative', modifier);
}

// Click on d20 display to roll
d20Display.addEventListener('click', () => rollQuickD20('custom'));
d20RollBtn.addEventListener('click', () => rollQuickD20('custom'));
oneHandedRollBtn.addEventListener('click', rollOneHanded);
twoHandedRollBtn.addEventListener('click', rollTwoHanded);
rangedRollBtn.addEventListener('click', rollRanged);
initiativeRollBtn.addEventListener('click', rollInitiative);

