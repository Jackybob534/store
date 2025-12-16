const video = document.getElementById('video');
const barcodeInfo = document.getElementById('barcode-info');
const scanWindow = document.getElementById('scan-window');

// Known barcodes (with dots for clarity)
let codes = {
  "<_.|._.|._>": { shelf: "Health Potions", items: ["Potion", "Elixir"] },
  "<_._.|.|._>": { shelf: "Weapons Rack", items: ["Sword", "Bow"] }
};

// Scan success sound
const scanSound = new Audio('scanSound.mp3'); // Replace with your path

let lastDetected = null; // Tracks last detected known barcode

// Start camera
async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
    video.srcObject = stream;

    await new Promise(resolve => {
      video.onloadedmetadata = () => resolve();
    });

    video.play();
  } catch (err) {
    console.error("Camera access error:", err);
    alert("Camera access is required.");
  }
}
startCamera();

// Convert raw barcode to readable format with dots (display only)
function prettifyBarcode(raw) {
  return raw.split('').join('.');
}

// Normalize barcode for matching: add dots between characters
function normalizeBarcode(raw) {
  return raw.split('').join('.');
}

// Check barcode against known codes
function checkBarcode(barcodeRaw) {
  const barcodeData = `<${normalizeBarcode(barcodeRaw)}>`; // wrap in <>
  let found = null;

  if (codes[barcodeData]) {
    found = codes[barcodeData];
  }

  return { barcodeData, found };
}

// Scanning function — guarantees 5 symbols
function scanBarcode() {
  if (!video.videoWidth || !video.videoHeight) return;

  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const lineHeight = 5; 
  const lineY = Math.floor(canvas.height / 2) - Math.floor(lineHeight / 2);
  const sliceWidth = Math.floor(canvas.width / 5); // exactly 5 symbols
  let barcodeRaw = '';

  for (let s = 0; s < 5; s++) {
    const xStart = s * sliceWidth;
    let blackPixels = 0;

    for (let dx = 0; dx < sliceWidth; dx++) {
      for (let dy = 0; dy < lineHeight; dy++) {
        const pixel = ctx.getImageData(xStart + dx, lineY + dy, 1, 1).data;
        const brightness = (pixel[0] + pixel[1] + pixel[2]) / 3;
        if (brightness < 128) blackPixels++;
      }
    }

    barcodeRaw += blackPixels > (sliceWidth * lineHeight / 2) ? '|' : '_';
  }

  // Communication with codes
  const { barcodeData, found } = checkBarcode(barcodeRaw);

  // Display barcode with dots
  barcodeInfo.textContent = `Detected: ${barcodeData}`;

  if (found) {
    scanWindow.classList.add('detected');
    barcodeInfo.textContent += `\nShelf: ${found.shelf}\nItems: ${found.items.join(', ')}`;

    // Play sound only once per detection
    if (lastDetected !== barcodeData) {
      scanSound.currentTime = 0;
      scanSound.play().catch(err => console.warn("Sound play failed:", err));
      lastDetected = barcodeData;
    }
  } else {
    scanWindow.classList.remove('detected');
    lastDetected = null; // reset so next detection triggers sound
  }
}

// Automatic scanning every 300ms
setInterval(scanBarcode, 300);
