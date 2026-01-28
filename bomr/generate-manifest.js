const fs = require('fs');
const path = require('path');

const imagesDir = path.join(__dirname, 'images');
const manifestPath = path.join(__dirname, 'manifest.json');

try {
    const files = fs.readdirSync(imagesDir);
    const images = files.filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
    });
    fs.writeFileSync(manifestPath, JSON.stringify(images, null, 2));
    console.log(`Manifest generated with ${images.length} images.`);
} catch (error) {
    console.error('Error generating manifest:', error);
}