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

// Scan function for horizontal barcode (multi-line)
function scanBarcode() {
  if (!video.videoWidth || !video.videoHeight) return;

  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const lineHeight = 10; // vertical pixels per line
  const numLines = 3;    // number of horizontal lines to scan
  const yCenter = Math.floor(canvas.height / 2);
  const sliceWidth = 1;   // every pixel

  let combinedBarcode = '';

  for (let l = 0; l < numLines; l++) {
    let y = yCenter - Math.floor(numLines / 2) * lineHeight + l * lineHeight;
    let lineBarcode = '';

    for (let x = 0; x < canvas.width; x += sliceWidth) {
      let blackPixels = 0;

      for (let dy = 0; dy < lineHeight; dy++) {
        const pixel = ctx.getImageData(x, y + dy, 1, 1).data;
        const brightness = (pixel[0] + pixel[1] + pixel[2]) / 3;
        if (brightness < 128) blackPixels++;
      }

      lineBarcode += blackPixels > lineHeight / 2 ? '|' : '_';
    }

    combinedBarcode += lineBarcode;
  }

  // Remove repeated sequences from multiple lines by taking middle line only
  const barcodeRaw = combinedBarcode.slice(Math.floor(combinedBarcode.length / 3), Math.floor(2 * combinedBarcode.length / 3));

  // Add dot between every character
  const rawWithDots = barcodeRaw.split('').join('.');

  // Optional start/end markers
  const startMarker = '<';
  const endMarker = '>';
  const startIndex = rawWithDots.indexOf(startMarker);
  const endIndex = rawWithDots.indexOf(endMarker, startIndex + 1);

  let barcodeData = rawWithDots; // default: everything
  if (startIndex !== -1 && endIndex !== -1) {
    barcodeData = rawWithDots.slice(startIndex + 1, endIndex);
  }

  // Display what was read
  barcodeInfo.textContent = `Detected: ${barcodeData}`;

  // Highlight if known
  if (codes[barcodeData]) {
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
