const fs = require('fs');
const https = require('https');
const path = require('path');

const images = [
    {
        url: 'https://raw.githubusercontent.com/yourusername/energy-monitoring-assets/main/machines/cnc-machine.png',
        filename: 'cnc-machine.png'
    },
    {
        url: 'https://raw.githubusercontent.com/yourusername/energy-monitoring-assets/main/machines/robot-arm.png',
        filename: 'robot-arm.png'
    },
    {
        url: 'https://raw.githubusercontent.com/yourusername/energy-monitoring-assets/main/machines/manufacturing-machine.png',
        filename: 'manufacturing-machine.png'
    },
    {
        url: 'https://raw.githubusercontent.com/yourusername/energy-monitoring-assets/main/machines/industrial-robot.png',
        filename: 'industrial-robot.png'
    },
    {
        url: 'https://raw.githubusercontent.com/yourusername/energy-monitoring-assets/main/machines/gear1.png',
        filename: 'gear1.png'
    },
    {
        url: 'https://raw.githubusercontent.com/yourusername/energy-monitoring-assets/main/machines/gear2.png',
        filename: 'gear2.png'
    }
];

// Create the machines directory if it doesn't exist
const dir = path.join(__dirname);
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
}

// Download each image
images.forEach(image => {
    const file = fs.createWriteStream(path.join(dir, image.filename));
    https.get(image.url, response => {
        response.pipe(file);
        file.on('finish', () => {
            file.close();
            console.log(`Downloaded ${image.filename}`);
        });
    }).on('error', err => {
        fs.unlink(path.join(dir, image.filename));
        console.error(`Error downloading ${image.filename}:`, err.message);
    });
}); 