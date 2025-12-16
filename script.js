const video = document.getElementById('video');
const barcodeInfo = document.getElementById('barcode-info');
const scanButton = document.getElementById('scan-button');
const scanWindow = document.getElementById('scan-window');

let codes = {
  "_._.|._.||.|": { shelf: "Health Potions", items: ["Potion", "Elixir"] },
  "_._.|._.|._.|": { shelf: "Weapons Rack", items: ["Sword", "Bow"] },
  "_._.|.|._.||.": { shelf: "Magic Items", items: ["Wand", "Spellbook"] },
  "_|_|_._||.|": { shelf: "Armor Rack", items: ["Shield", "Helmet"] }
};

// Start camera
async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
    video.srcObject = stream;
    video.play();
  } catch (err) {
    console.error("Error accessing camera:", err);
    alert("Camera access is required.");
  }
}

startCamera();

// Scan function for horizontal barcode
function scanBarcode() {
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const y = Math.floor(canvas.height / 2); // horizontal line in middle
  const lineHeight = 5; // thickness of the line
  const sliceWidth = 1; // read every pixel horizontally

  let barcodeRaw = '';

  for (let x = 0; x < canvas.width; x += sliceWidth) {
    let blackPixels = 0;

    for (let dy = 0; dy < lineHeight; dy++) {
      const pixel = ctx.getImageData(x, y + dy, 1, 1).data;
      const brightness = (pixel[0] + pixel[1] + pixel[2]) / 3;
      if (brightness < 128) blackPixels++;
    }

    barcodeRaw += blackPixels > lineHeight / 2 ? '|' : '_';
  }

  // Add dot between every character
  const rawWithDots = barcodeRaw.split('').join('.');

  // Display whatever was read
  barcodeInfo.textContent = `Detected: ${rawWithDots}`;

  // Highlight if known code
  if (codes[rawWithDots]) {
    scanWindow.classList.add('detected');
    const info = codes[rawWithDots];
    barcodeInfo.textContent += `\nShelf: ${info.shelf}\nItems: ${info.items.join(', ')}`;
  } else {
    scanWindow.classList.remove('detected');
  }
}

// Manual scan
scanButton.addEventListener('click', scanBarcode);

// Automatic scan every 500ms
setInterval(scanBarcode, 500);
