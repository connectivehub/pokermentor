// This script will download placeholder avatar images for the Poker Mentor game
const fs = require('fs');
const path = require('path');
const https = require('https');

// URLs for placeholder avatar images
const avatarUrls = [
  'https://cdn-icons-png.flaticon.com/512/3006/3006876.png', // Player avatar
  'https://cdn-icons-png.flaticon.com/512/4128/4128176.png', // Jackson
  'https://cdn-icons-png.flaticon.com/512/219/219966.png',   // Tony
  'https://cdn-icons-png.flaticon.com/512/4128/4128240.png', // Olivia
  'https://cdn-icons-png.flaticon.com/512/2922/2922510.png', // Sophie
  'https://cdn-icons-png.flaticon.com/512/4128/4128349.png'  // Marcus
];

// Create directory if it doesn't exist
const avatarDir = path.join(__dirname, '../public/images/avatars');
if (!fs.existsSync(avatarDir)) {
  fs.mkdirSync(avatarDir, { recursive: true });
}

// Download each avatar
avatarUrls.forEach((url, index) => {
  const filename = path.join(avatarDir, `avatar-${index + 1}.png`);
  const file = fs.createWriteStream(filename);
  
  https.get(url, (response) => {
    response.pipe(file);
    
    file.on('finish', () => {
      file.close();
      console.log(`Downloaded avatar-${index + 1}.png`);
    });
  }).on('error', (err) => {
    fs.unlink(filename);
    console.error(`Error downloading avatar-${index + 1}.png:`, err.message);
  });
}); 