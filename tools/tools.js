// tools.js - Optional enhancements for the tools page

document.addEventListener('DOMContentLoaded', () => {
    // Add search/filter functionality
    addSearchFunctionality();
    
    // Add card click tracking (optional analytics)
    trackCardClicks();
    
    // Add keyboard navigation
    addKeyboardNavigation();
});

function addSearchFunctionality() {
    // Create search input
    const header = document.querySelector('.page-header');
    const searchContainer = document.createElement('div');
    searchContainer.className = 'search-container';
    searchContainer.innerHTML = `
        <input 
            type="text" 
            id="toolSearch" 
            class="tool-search" 
            placeholder="🔍 Search tools..."
            autocomplete="off"
        >
    `;
    
    // Add CSS for search
    const style = document.createElement('style');
    style.textContent = `
        .search-container {
            max-width: 500px;
            margin: 1.5rem auto 0;
        }
        
        .tool-search {
            width: 100%;
            padding: 0.75rem 1rem;
            font-size: 1rem;
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            color: var(--text-primary);
            transition: all 0.3s ease;
        }
        
        .tool-search:focus {
            outline: none;
            border-color: var(--accent-blue);
            box-shadow: 0 0 0 3px rgba(88, 166, 255, 0.1);
        }
        
        .tool-search::placeholder {
            color: var(--text-secondary);
        }
        
        .tool-card.hidden {
            display: none;
        }
        
        .category.empty {
            display: none;
        }
        
        .no-results {
            text-align: center;
            padding: 3rem;
            color: var(--text-secondary);
            font-size: 1.1rem;
        }
    `;
    document.head.appendChild(style);
    
    header.appendChild(searchContainer);
    
    const searchInput = document.getElementById('toolSearch');
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();
        filterTools(searchTerm);
    });
}

function filterTools(searchTerm) {
    const toolCards = document.querySelectorAll('.tool-card');
    const categories = document.querySelectorAll('.category');
    let visibleCount = 0;
    
    // Remove existing no-results message
    const existingNoResults = document.querySelector('.no-results');
    if (existingNoResults) {
        existingNoResults.remove();
    }
    
    toolCards.forEach(card => {
        const title = card.querySelector('h3').textContent.toLowerCase();
        const description = card.querySelector('p').textContent.toLowerCase();
        const matches = title.includes(searchTerm) || description.includes(searchTerm);
        
        if (matches) {
            card.classList.remove('hidden');
            visibleCount++;
        } else {
            card.classList.add('hidden');
        }
    });
    
    // Hide/show categories based on whether they have visible cards
    categories.forEach(category => {
        const visibleCards = category.querySelectorAll('.tool-card:not(.hidden)');
        if (visibleCards.length === 0) {
            category.classList.add('empty');
        } else {
            category.classList.remove('empty');
        }
    });
    
    // Show no results message if nothing matches
    if (visibleCount === 0 && searchTerm !== '') {
        const toolsGrid = document.querySelector('.tools-grid');
        const noResults = document.createElement('div');
        noResults.className = 'no-results';
        noResults.textContent = `No tools found matching "${searchTerm}"`;
        toolsGrid.appendChild(noResults);
    }
}

function trackCardClicks() {
    const toolCards = document.querySelectorAll('.tool-card a');
    toolCards.forEach(link => {
        link.addEventListener('click', (e) => {
            const toolName = e.target.textContent;
            // You could send this to analytics if desired
            console.log(`Tool clicked: ${toolName}`);
        });
    });
}

function addKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
        // Press '/' to focus search
        if (e.key === '/' && !e.target.matches('input')) {
            e.preventDefault();
            const searchInput = document.getElementById('toolSearch');
            if (searchInput) {
                searchInput.focus();
            }
        }
        
        // Press 'Escape' to clear search
        if (e.key === 'Escape') {
            const searchInput = document.getElementById('toolSearch');
            if (searchInput && document.activeElement === searchInput) {
                searchInput.value = '';
                filterTools('');
                searchInput.blur();
            }
        }
    });
}

// Add smooth scroll to top button
const addScrollToTop = () => {
    const button = document.createElement('button');
    button.className = 'scroll-to-top';
    button.innerHTML = '↑';
    button.setAttribute('aria-label', 'Scroll to top');
    
    const style = document.createElement('style');
    style.textContent = `
        .scroll-to-top {
            position: fixed;
            bottom: 2rem;
            right: 2rem;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: var(--accent-blue);
            color: var(--bg-primary);
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
            z-index: 1000;
            box-shadow: 0 4px 12px rgba(88, 166, 255, 0.3);
        }
        
        .scroll-to-top.visible {
            opacity: 1;
            visibility: visible;
        }
        
        .scroll-to-top:hover {
            background: var(--accent-purple);
            transform: translateY(-4px);
        }
    `;
    document.head.appendChild(style);
    document.body.appendChild(button);
    
    // Show/hide based on scroll position
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            button.classList.add('visible');
        } else {
            button.classList.remove('visible');
        }
    });
    
    button.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
};

addScrollToTop();
