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

// Scan function
function scanBarcode() {
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const startY = canvas.height * 0.4;
  const scanHeight = canvas.height * 0.2;

  let barcodeRaw = '';
  const sliceWidth = 5;

  for (let x = 0; x < canvas.width; x += sliceWidth) {
    let blackPixels = 0;
    for (let y = startY; y < startY + scanHeight; y++) {
      const pixel = ctx.getImageData(x, y, 1, 1).data;
      const brightness = (pixel[0] + pixel[1] + pixel[2]) / 3;
      if (brightness < 128) blackPixels++;
    }
    barcodeRaw += blackPixels > scanHeight / 2 ? '|' : '_';
  }

  // Add dot between every character
  const rawWithDots = barcodeRaw.split('').join('.');

  const startMarker = '<';
  const stopMarker = '>';
  const startIndex = rawWithDots.indexOf(startMarker);
  const stopIndex = rawWithDots.indexOf(stopMarker, startIndex + 1);

  let barcodeData = null;
  let message = '';

  if (startIndex !== -1 && stopIndex !== -1) {
    // Both markers found
    barcodeData = rawWithDots.slice(startIndex + 1, stopIndex);
    message = `Full barcode detected: ${barcodeData}`;
  } else if (startIndex !== -1) {
    // Only start marker
    message = 'Start marker < detected, waiting for end marker >';
  } else if (stopIndex !== -1) {
    // Only end marker
    message = 'End marker > detected, waiting for start marker <';
  } else {
    message = 'No markers detected';
  }

  // Display results
  barcodeInfo.textContent = message;

  // Highlight scan window if full barcode matches JSON
  if (barcodeData && codes[barcodeData]) {
    scanWindow.classList.add('detected');
    const info = codes[barcodeData];
    barcodeInfo.textContent += `\nShelf: ${info.shelf}\nItems: ${info.items.join(', ')}`;
  } else {
    scanWindow.classList.remove('detected');
  }
}

// Manual scan
scanButton.addEventListener('click', scanBarcode);

// Automatic scan every 500ms
setInterval(scanBarcode, 500);
