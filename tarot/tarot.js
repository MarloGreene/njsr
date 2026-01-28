// Elements
const spreadBtns = document.querySelectorAll('.spread-btn');
const drawBtn = document.getElementById('drawBtn');
const readingArea = document.getElementById('readingArea');
const historySection = document.getElementById('historySection');
const historyList = document.getElementById('historyList');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');

// State
let selectedSpread = 1;
let history = JSON.parse(localStorage.getItem('tarotHistory') || '[]');

// Tarot deck data
const majorArcana = [
    { name: "The Fool", meaning: "New beginnings, innocence, spontaneity, a free spirit" },
    { name: "The Magician", meaning: "Manifestation, resourcefulness, power, inspired action" },
    { name: "The High Priestess", meaning: "Intuition, sacred knowledge, divine feminine, subconscious" },
    { name: "The Empress", meaning: "Femininity, beauty, nature, nurturing, abundance" },
    { name: "The Emperor", meaning: "Authority, establishment, structure, father figure" },
    { name: "The Hierophant", meaning: "Spiritual wisdom, tradition, conformity, institutions" },
    { name: "The Lovers", meaning: "Love, harmony, relationships, values alignment, choices" },
    { name: "The Chariot", meaning: "Control, willpower, success, determination, action" },
    { name: "Strength", meaning: "Inner strength, bravery, compassion, focus, persuasion" },
    { name: "The Hermit", meaning: "Soul searching, introspection, inner guidance, solitude" },
    { name: "Wheel of Fortune", meaning: "Good luck, karma, life cycles, destiny, turning point" },
    { name: "Justice", meaning: "Fairness, truth, cause and effect, law, accountability" },
    { name: "The Hanged Man", meaning: "Pause, surrender, letting go, new perspectives" },
    { name: "Death", meaning: "Endings, transformation, transition, letting go, change" },
    { name: "Temperance", meaning: "Balance, moderation, patience, purpose, meaning" },
    { name: "The Devil", meaning: "Shadow self, attachment, addiction, restriction, sexuality" },
    { name: "The Tower", meaning: "Sudden change, upheaval, chaos, revelation, awakening" },
    { name: "The Star", meaning: "Hope, faith, purpose, renewal, spirituality, serenity" },
    { name: "The Moon", meaning: "Illusion, fear, anxiety, subconscious, intuition" },
    { name: "The Sun", meaning: "Positivity, fun, warmth, success, vitality, joy" },
    { name: "Judgement", meaning: "Reflection, reckoning, inner calling, absolution" },
    { name: "The World", meaning: "Completion, accomplishment, travel, fulfillment" }
];

const minorArcana = {
    wands: [
        { name: "Ace of Wands", meaning: "Inspiration, new opportunities, growth, potential" },
        { name: "Two of Wands", meaning: "Planning, making decisions, leaving comfort zone" },
        { name: "Three of Wands", meaning: "Progress, expansion, foresight, overseas opportunities" },
        { name: "Four of Wands", meaning: "Celebration, harmony, marriage, home, community" },
        { name: "Five of Wands", meaning: "Conflict, disagreements, competition, tension" },
        { name: "Six of Wands", meaning: "Success, public recognition, progress, self-confidence" },
        { name: "Seven of Wands", meaning: "Challenge, competition, perseverance, standing your ground" },
        { name: "Eight of Wands", meaning: "Speed, action, movement, quick decisions, travel" },
        { name: "Nine of Wands", meaning: "Resilience, courage, persistence, test of faith" },
        { name: "Ten of Wands", meaning: "Burden, extra responsibility, hard work, completion" },
        { name: "Page of Wands", meaning: "Inspiration, exploration, discovery, free spirit" },
        { name: "Knight of Wands", meaning: "Energy, passion, adventure, impulsiveness" },
        { name: "Queen of Wands", meaning: "Courage, confidence, independence, determination" },
        { name: "King of Wands", meaning: "Natural leader, vision, entrepreneur, honour" }
    ],
    cups: [
        { name: "Ace of Cups", meaning: "Love, new relationships, compassion, creativity" },
        { name: "Two of Cups", meaning: "Unified love, partnership, mutual attraction" },
        { name: "Three of Cups", meaning: "Celebration, friendship, creativity, collaborations" },
        { name: "Four of Cups", meaning: "Meditation, contemplation, apathy, reevaluation" },
        { name: "Five of Cups", meaning: "Regret, failure, disappointment, pessimism" },
        { name: "Six of Cups", meaning: "Revisiting the past, childhood memories, innocence" },
        { name: "Seven of Cups", meaning: "Opportunities, choices, wishful thinking, illusion" },
        { name: "Eight of Cups", meaning: "Disappointment, abandonment, withdrawal, escapism" },
        { name: "Nine of Cups", meaning: "Contentment, satisfaction, gratitude, wish come true" },
        { name: "Ten of Cups", meaning: "Divine love, harmony, alignment, happy family" },
        { name: "Page of Cups", meaning: "Creative opportunities, intuitive messages, curiosity" },
        { name: "Knight of Cups", meaning: "Romance, charm, imagination, following your heart" },
        { name: "Queen of Cups", meaning: "Compassion, calm, comfort, emotional stability" },
        { name: "King of Cups", meaning: "Emotional balance, control, diplomacy, generosity" }
    ],
    swords: [
        { name: "Ace of Swords", meaning: "Breakthroughs, clarity, sharp mind, new ideas" },
        { name: "Two of Swords", meaning: "Difficult decisions, weighing options, stalemate" },
        { name: "Three of Swords", meaning: "Heartbreak, emotional pain, sorrow, grief" },
        { name: "Four of Swords", meaning: "Rest, relaxation, meditation, contemplation" },
        { name: "Five of Swords", meaning: "Conflict, defeat, winning at all costs" },
        { name: "Six of Swords", meaning: "Transition, change, rite of passage, releasing baggage" },
        { name: "Seven of Swords", meaning: "Betrayal, deception, getting away with something" },
        { name: "Eight of Swords", meaning: "Negative thoughts, self-imposed restriction, imprisonment" },
        { name: "Nine of Swords", meaning: "Anxiety, worry, fear, depression, nightmares" },
        { name: "Ten of Swords", meaning: "Painful endings, deep wounds, betrayal, loss" },
        { name: "Page of Swords", meaning: "New ideas, curiosity, thirst for knowledge, vigilance" },
        { name: "Knight of Swords", meaning: "Ambitious, action-oriented, driven, fast thinking" },
        { name: "Queen of Swords", meaning: "Independent, unbiased judgment, clear boundaries" },
        { name: "King of Swords", meaning: "Mental clarity, intellectual power, authority, truth" }
    ],
    pentacles: [
        { name: "Ace of Pentacles", meaning: "Opportunity, prosperity, new venture, manifestation" },
        { name: "Two of Pentacles", meaning: "Multiple priorities, time management, adaptability" },
        { name: "Three of Pentacles", meaning: "Teamwork, collaboration, learning, implementation" },
        { name: "Four of Pentacles", meaning: "Saving money, security, conservatism, scarcity" },
        { name: "Five of Pentacles", meaning: "Financial loss, poverty, insecurity, isolation" },
        { name: "Six of Pentacles", meaning: "Giving, receiving, sharing wealth, generosity" },
        { name: "Seven of Pentacles", meaning: "Long-term view, sustainable results, perseverance" },
        { name: "Eight of Pentacles", meaning: "Apprenticeship, skill development, quality, dedication" },
        { name: "Nine of Pentacles", meaning: "Abundance, luxury, self-sufficiency, independence" },
        { name: "Ten of Pentacles", meaning: "Wealth, inheritance, family, establishment, retirement" },
        { name: "Page of Pentacles", meaning: "Manifestation, opportunities, new beginnings, ambition" },
        { name: "Knight of Pentacles", meaning: "Hard work, productivity, routine, conservatism" },
        { name: "Queen of Pentacles", meaning: "Nurturing, practical, providing, down-to-earth" },
        { name: "King of Pentacles", meaning: "Wealth, business, leadership, security, abundance" }
    ]
};

// Create full deck
const fullDeck = [
    ...majorArcana,
    ...minorArcana.wands,
    ...minorArcana.cups,
    ...minorArcana.swords,
    ...minorArcana.pentacles
];

// Spread positions
const spreadPositions = {
    1: ["Your Card"],
    3: ["Past", "Present", "Future"],
    5: ["Present", "Challenge", "Past", "Future", "Outcome"]
};

// Select spread
spreadBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        spreadBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedSpread = parseInt(btn.dataset.spread);
        updateDeckDisplay();
    });
});

// Update deck display based on spread
function updateDeckDisplay() {
    const deck = document.getElementById('deck');
    deck.innerHTML = '';
    
    for (let i = 0; i < selectedSpread; i++) {
        const cardBack = document.createElement('div');
        cardBack.className = 'card-back';
        
        const pattern = document.createElement('div');
        pattern.className = 'card-pattern';
        
        cardBack.appendChild(pattern);
        deck.appendChild(cardBack);
    }
}

// Draw cards
let cardsDrawn = false;

drawBtn.addEventListener('click', () => {
    if (cardsDrawn) {
        // Reset for new reading
        document.getElementById('deck').style.display = 'block';
        updateDeckDisplay();
        readingArea.innerHTML = '';
        drawBtn.textContent = 'Draw Cards';
        cardsDrawn = false;
    } else {
        drawCards();
    }
});

function drawCards() {
    // Shuffle and draw
    const shuffled = [...fullDeck].sort(() => Math.random() - 0.5);
    const drawn = shuffled.slice(0, selectedSpread);
    
    // Add reversed chance (30%)
    const cards = drawn.map(card => ({
        ...card,
        reversed: Math.random() < 0.3
    }));
    
    // Hide deck
    document.getElementById('deck').style.display = 'none';
    
    // Display cards
    readingArea.innerHTML = '';
    
    cards.forEach((card, index) => {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'drawn-card';
        if (card.reversed) cardDiv.classList.add('reversed');
        
        const position = document.createElement('div');
        position.className = 'card-position';
        position.textContent = spreadPositions[selectedSpread][index];
        
        const name = document.createElement('div');
        name.className = 'card-name';
        name.textContent = card.name;
        
        const meaning = document.createElement('div');
        meaning.className = 'card-meaning';
        meaning.textContent = card.meaning;
        
        cardDiv.appendChild(position);
        cardDiv.appendChild(name);
        cardDiv.appendChild(meaning);
        
        readingArea.appendChild(cardDiv);
    });
    
    // Update button
    drawBtn.textContent = 'New Reading';
    cardsDrawn = true;
    
    // Save to history
    saveReading(cards);
}

function saveReading(cards) {
    const reading = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        spread: selectedSpread,
        cards: cards.map(c => `${c.name}${c.reversed ? ' (R)' : ''}`)
    };
    
    history.unshift(reading);
    
    // Keep last 20
    if (history.length > 20) {
        history = history.slice(0, 20);
    }
    
    localStorage.setItem('tarotHistory', JSON.stringify(history));
    renderHistory();
}

function renderHistory() {
    if (history.length === 0) {
        historySection.style.display = 'none';
        return;
    }
    
    historySection.style.display = 'block';
    historyList.innerHTML = '';
    
    history.forEach(reading => {
        const item = document.createElement('div');
        item.className = 'history-item';
        
        const date = document.createElement('div');
        date.className = 'history-date';
        const d = new Date(reading.timestamp);
        date.textContent = d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
        
        const cards = document.createElement('div');
        cards.className = 'history-cards';
        cards.textContent = reading.cards.join(' • ');
        
        item.appendChild(date);
        item.appendChild(cards);
        historyList.appendChild(item);
    });
}

function clearHistory() {
    if (confirm('Clear all reading history?')) {
        history = [];
        localStorage.removeItem('tarotHistory');
        renderHistory();
    }
}

// Event listeners
clearHistoryBtn.addEventListener('click', clearHistory);

// Initialize
renderHistory();
updateDeckDisplay();
