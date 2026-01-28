const searchInput = document.getElementById('searchInput');
const toolsList = document.getElementById('toolsList');
const sortButtons = document.querySelectorAll('.sort-btn');
let currentSort = 'default';
let focusedToolIndex = -1;

function sortTools(sortType) {
    const rows = Array.from(toolsList.querySelectorAll('.tool-row'));
    sortButtons.forEach(btn => btn.classList.remove('active'));
    document.querySelector('[data-sort="' + sortType + '"]').classList.add('active');

    rows.sort((a, b) => {
        switch (sortType) {
            case 'title':
                return a.dataset.title.localeCompare(b.dataset.title);
            case 'kind':
                return a.dataset.kind.localeCompare(b.dataset.kind);
            default:
                return parseInt(a.dataset.index) - parseInt(b.dataset.index);
        }
    });

    rows.forEach(row => toolsList.appendChild(row));
    // Reset focus after sorting
    focusedToolIndex = -1;
    updateToolFocus();
}

function filterTools() {
    const query = searchInput.value.toLowerCase();
    const rows = toolsList.querySelectorAll('.tool-row');
    let hasVisible = false;
    rows.forEach(row => {
        const title = row.dataset.title;
        const desc = row.dataset.description;
        const path = row.dataset.path;
        const visible = title.includes(query) || desc.includes(query) || path.includes(query);
        row.style.display = visible ? 'flex' : 'none';
        if (visible) hasVisible = true;
    });
    const noResults = document.querySelector('.no-results');
    if (noResults) noResults.remove();
    if (!hasVisible && query) {
        const noResultsDiv = document.createElement('div');
        noResultsDiv.className = 'no-results';
        noResultsDiv.textContent = 'No tools match your search.';
        toolsList.appendChild(noResultsDiv);
    }
    // Reset focus after filtering
    focusedToolIndex = -1;
    updateToolFocus();
}

function getVisibleTools() {
    return Array.from(toolsList.querySelectorAll('.tool-row')).filter(row =>
        row.style.display !== 'none'
    );
}

function updateToolFocus() {
    const visibleTools = getVisibleTools();
    visibleTools.forEach((tool, index) => {
        tool.classList.toggle('focused', index === focusedToolIndex);
    });
}

function navigateTools(direction) {
    const visibleTools = getVisibleTools();
    if (visibleTools.length === 0) return;

    const gridColumns = window.getComputedStyle(toolsList).gridTemplateColumns.split(' ').length;

    switch (direction) {
        case 'left':
            focusedToolIndex = Math.max(0, focusedToolIndex - 1);
            break;
        case 'right':
            focusedToolIndex = Math.min(visibleTools.length - 1, focusedToolIndex + 1);
            break;
        case 'up':
            focusedToolIndex = Math.max(0, focusedToolIndex - gridColumns);
            break;
        case 'down':
            focusedToolIndex = Math.min(visibleTools.length - 1, focusedToolIndex + gridColumns);
            break;
    }

    updateToolFocus();

    // Scroll focused tool into view
    if (focusedToolIndex >= 0 && visibleTools[focusedToolIndex]) {
        visibleTools[focusedToolIndex].scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'nearest'
        });
    }
}

function handleKeyDown(event) {
    // If search is focused, only handle Escape
    if (document.activeElement === searchInput) {
        if (event.key === 'Escape') {
            searchInput.blur();
            event.preventDefault();
        }
        return;
    }

    // Handle search focus
    if (event.key === '/') {
        searchInput.focus();
        event.preventDefault();
        return;
    }

    // Handle tool navigation
    switch (event.key) {
        case 'h':
        case 'ArrowLeft':
            navigateTools('left');
            event.preventDefault();
            break;
        case 'j':
        case 'ArrowDown':
            navigateTools('down');
            event.preventDefault();
            break;
        case 'k':
        case 'ArrowUp':
            navigateTools('up');
            event.preventDefault();
            break;
        case 'l':
        case 'ArrowRight':
            navigateTools('right');
            event.preventDefault();
            break;
        case 'Enter':
            const visibleTools = getVisibleTools();
            if (focusedToolIndex >= 0 && visibleTools[focusedToolIndex]) {
                visibleTools[focusedToolIndex].click();
            }
            event.preventDefault();
            break;
    }
}

searchInput.addEventListener('input', filterTools);
sortButtons.forEach(button => {
    button.addEventListener('click', () => {
        currentSort = button.dataset.sort;
        sortTools(currentSort);
    });
});

// Add keyboard navigation
document.addEventListener('keydown', handleKeyDown);

// Focus search input on page load
searchInput.focus();