const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const imgDir = './img';
const thumbDir = './thumb';

if (!fs.existsSync(thumbDir)) {
    fs.mkdirSync(thumbDir);
}

const images = fs.readdirSync(imgDir)
  .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
  .sort(); // sort alphabetically

// Sanitize filenames
images.forEach((img, i) => {
    const oldPath = path.join(imgDir, img);
    let newImg = img.replace(/\$/g, 'S').replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '_');
    if (newImg !== img) {
        const newPath = path.join(imgDir, newImg);
        try {
            fs.renameSync(oldPath, newPath);
            images[i] = newImg;
            console.log(`Renamed ${img} to ${newImg}`);
        } catch (e) {
            console.error(`Failed to rename ${img}:`, e.message);
        }
    }
});

// Generate thumbnails
images.forEach(img => {
    const input = path.join(imgDir, img);
    const output = path.join(thumbDir, img);
    try {
        execSync(`magick "${input}" -resize "200x200>" "${output}"`);
        console.log(`Generated thumb for ${img}`);
    } catch (e) {
        console.error(`Failed to create thumb for ${img}:`, e.message);
    }
});

fs.writeFileSync('images.json', JSON.stringify(images, null, 2));
console.log('images.json updated with', images.length, 'images');