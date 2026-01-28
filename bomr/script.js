async function loadRandomImage() {
    try {
        const response = await fetch('manifest.json');
        const images = await response.json();
        if (images.length > 0) {
            const randomIndex = Math.floor(Math.random() * images.length);
            const imageSrc = 'images/' + images[randomIndex];
            document.getElementById('random-image').src = imageSrc;
        }
    } catch (error) {
        console.error('Error loading manifest:', error);
    }
}

loadRandomImage();