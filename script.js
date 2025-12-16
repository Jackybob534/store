const video = document.getElementById('video');
const barcodeInfo = document.getElementById('barcode-info');
const scanWindow = document.getElementById('scan-window');

// Known barcodes
let codes = {
  "<_|__|>": { shelf: "Health Potions", items: ["Potion", "Elixir"] },
  "<_|_|_||>": { shelf: "Weapons Rack", items: ["Sword", "Bow"] }
};

// Scan success sound
const scanSound = new Audio('scanSound.mp3'); // replace with your path

// Start camera (unchanged)
async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
    video.srcObject = stream;
    await video.play();
  } catch (err) {
    console.error("Camera access error:", err);
    alert("Camera access is required.");
  }
}
startCamera();

// Convert raw barcode to readable format with dots
function prettifyBarcode(raw) {
  return raw.split('').join('.'); // adds dots between every character
}

// Keep the scanner exactly the same as old system
function scanBarcode() {
  if (!video.videoWidth || !video.videoHeight) return;

  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const lineY = Math.floor(canvas.height / 2);
  const sliceWidth = Math.floor(canvas.width / 5);
  let barcodeRaw = '';

  for (let s = 0; s < 5; s++) {
    const xStart = s * sliceWidth;
    let blackPixels = 0;

    for (let dx = 0; dx < sliceWidth; dx++) {
      const pixel = ctx.getImageData(xStart + dx, lineY, 1, 1).data;
      const brightness = (pixel[0] + pixel[1] + pixel[2]) / 3;
      if (brightness < 128) blackPixels++;
    }

    barcodeRaw += blackPixels > (sliceWidth / 2) ? '|' : '_';
  }

  const barcodeData = `<${barcodeRaw}>`;
  const pretty = `<${prettifyBarcode(barcodeRaw)}>`; // add dots for clarity

  // Display info
  barcodeInfo.textContent = `Detected: ${pretty}`;

  if (codes[barcodeData]) {
    // play scan sound
    scanSound.currentTime = 0;
    scanSound.play().catch(err => console.warn("Sound play failed:", err));

    scanWindow.classList.add('detected');
    const info = codes[barcodeData];
    barcodeInfo.textContent += `\nShelf: ${info.shelf}\nItems: ${info.items.join(', ')}`;
  } else {
    scanWindow.classList.remove('detected');
  }
}

// Automatic scanning every 300ms
setInterval(scanBarcode, 300);
