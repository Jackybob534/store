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

// Scan function (only detects if start/end markers exist)
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

  // Only scan if start and end markers exist
  const startMarker = '<';
  const stopMarker = '>';
  const startIndex = rawWithDots.indexOf(startMarker);
  const stopIndex = rawWithDots.indexOf(stopMarker, startIndex + 1);

  if (startIndex !== -1 && stopIndex !== -1) {
    const barcodeData = rawWithDots.slice(startIndex + 1, stopIndex);

    // Display results
    barcodeInfo.textContent = `Scanned barcode: ${barcodeData}`;

    if (codes[barcodeData]) {
      scanWindow.classList.add('detected');
      const info = codes[barcodeData];
      barcodeInfo.textContent += `\nShelf: ${info.shelf}\nItems: ${info.items.join(', ')}`;
    } else {
      scanWindow.classList.remove('detected');
      barcodeInfo.textContent += `\nShelf: Unknown`;
    }
  } else {
    // No valid barcode
    scanWindow.classList.remove('detected');
    barcodeInfo.textContent = `No valid barcode detected`;
  }
}

// Manual scan
scanButton.addEventListener('click', scanBarcode);

// Automatic scan every 500ms
setInterval(scanBarcode, 500);
