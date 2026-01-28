let images = [];
let currentIndex = 0;
let cols = 4;
const grid = document.getElementById('grid');
const modal = document.getElementById('modal');
const fullImage = document.getElementById('fullImage');
const closeBtn = document.getElementById('close');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');
const filmstrip = document.getElementById('filmstrip');
const zoomControls = document.getElementById('zoomControls');
const counter = document.getElementById('counter');

grid.style.setProperty('--cols', cols);

// Load images from JSON
fetch('images.json')
    .then(response => response.json())
    .then(data => {
        images = data;
        renderGrid();
        // Default to 8-column grid
        cols = 8;
        grid.style.setProperty('--cols', cols);
        updateZoomButtons();
    })
    .catch(err => console.error('Error loading images:', err));

// Zoom controls
zoomControls.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON') {
        cols = parseInt(e.target.dataset.cols);
        grid.style.setProperty('--cols', cols);
        updateZoomButtons();
    }
});

function updateZoomButtons() {
    const buttons = zoomControls.querySelectorAll('button');
    buttons.forEach(btn => {
        if (parseInt(btn.dataset.cols) === cols) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

function renderGrid() {
    grid.innerHTML = '';
    images.forEach((img, index) => {
        const imgElement = document.createElement('img');
        imgElement.src = `thumb/${img}`;
        imgElement.className = 'thumbnail';
        imgElement.onclick = () => openModal(index);
        grid.appendChild(imgElement);
    });
}

function openModal(index) {
    currentIndex = index;
    fullImage.src = `img/${images[currentIndex]}`;
    modal.classList.remove('hidden');
    populateFilmstrip();
    updateCounter();
}

function populateFilmstrip() {
    filmstrip.innerHTML = '';
    images.forEach((img, i) => {
        const thumb = document.createElement('img');
        thumb.src = `thumb/${img}`;
        thumb.className = 'filmthumb';
        thumb.onclick = () => {
            currentIndex = i;
            fullImage.src = `img/${images[currentIndex]}`;
            updateFilmstripActive();
            updateCounter();
        };
        if (i === currentIndex) thumb.classList.add('active');
        filmstrip.appendChild(thumb);
    });
    updateFilmstripActive();
}

function updateFilmstripActive() {
    const thumbs = filmstrip.querySelectorAll('.filmthumb');
    thumbs.forEach((thumb, i) => {
        if (i === currentIndex) {
            thumb.classList.add('active');
        } else {
            thumb.classList.remove('active');
        }
    });
    // Center the active thumbnail
    const activeThumb = filmstrip.querySelector('.active');
    if (activeThumb) {
        const container = filmstrip;
        const containerWidth = container.offsetWidth;
        const thumbWidth = activeThumb.offsetWidth;
        const thumbLeft = activeThumb.offsetLeft;
        const scrollLeft = thumbLeft - (containerWidth / 2) + (thumbWidth / 2);
        container.scrollLeft = Math.max(0, scrollLeft);
    }
}

function updateCounter() {
    counter.textContent = `${currentIndex + 1} / ${images.length}`;
}

function closeModal() {
    modal.classList.add('hidden');
}

closeBtn.onclick = closeModal;

prevBtn.onclick = () => {
    currentIndex = (currentIndex - 1 + images.length) % images.length;
    fullImage.src = `img/${images[currentIndex]}`;
    updateFilmstripActive();
    updateCounter();
};

nextBtn.onclick = () => {
    currentIndex = (currentIndex + 1) % images.length;
    fullImage.src = `img/${images[currentIndex]}`;
    updateFilmstripActive();
    updateCounter();
};

// Zoom with mouse wheel
// Removed: grid.addEventListener('wheel', (e) => {
//     e.preventDefault();
//     if (e.deltaY > 0) {
//         cols = Math.max(1, cols - 1);
//     } else {
//         cols = Math.min(10, cols + 1);
//     }
//     grid.style.setProperty('--cols', cols);
// });

// Touch events for swipe
let startY, startX;
modal.addEventListener('touchstart', (e) => {
    startY = e.touches[0].clientY;
    startX = e.touches[0].clientX;
});

modal.addEventListener('touchmove', (e) => {
    if (!startY || !startX) return;
    const deltaY = e.touches[0].clientY - startY;
    const deltaX = e.touches[0].clientX - startX;
    if (Math.abs(deltaY) > Math.abs(deltaX) && deltaY > 50) {
        // Swipe down
        closeModal();
    } else if (Math.abs(deltaX) > 50) {
        if (deltaX > 0) {
            // Swipe right -> prev
            prevBtn.click();
        } else {
            // Swipe left -> next
            nextBtn.click();
        }
        startX = null; // Prevent multiple
    }
});

modal.addEventListener('touchend', () => {
    startY = null;
    startX = null;
});

// Click outside to close
modal.onclick = (e) => {
    if (e.target === modal) closeModal();
};

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    if (modal.classList.contains('hidden')) return;
    switch(e.key) {
        case 'Escape':
            closeModal();
            break;
        case 'ArrowLeft':
            prevBtn.click();
            break;
        case 'ArrowRight':
            nextBtn.click();
            break;
    }
});