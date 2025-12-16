const video = document.getElementById('video');
const scanButton = document.getElementById('scan-button');
const loading = document.getElementById('loading');
const barcodeInfo = document.getElementById('barcode-info');

let codes = {};

// Load barcode data
fetch('codes.json')
  .then(res => res.json())
  .then(data => codes = data)
  .catch(err => console.error("Failed to load codes.json:", err));

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

// Helper: get vertical slice from canvas to detect line/space
function getBarcodeFromCanvas(canvas) {
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;
  const sliceWidth = 5; // pixels per slice
  let barcode = '';

  for (let x = 0; x < width; x += sliceWidth) {
    let blackPixels = 0;
    for (let y = 0; y < height; y++) {
      const pixel = ctx.getImageData(x, y, 1, 1).data;
      const brightness = (pixel[0] + pixel[1] + pixel[2]) / 3;
      if (brightness < 128) blackPixels++;
    }
    // If mostly black, mark as line, else space
    barcode += blackPixels > height / 2 ? '|' : '_';
  }
  return barcode;
}

// Scan button click
scanButton.addEventListener('click', () => {
  loading.style.display = 'block';
  barcodeInfo.textContent = '';

  // Create canvas to read frame
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  // Small delay to simulate processing
  setTimeout(() => {
    const scannedCode = getBarcodeFromCanvas(canvas);

    loading.style.display = 'none';

    if (codes[scannedCode]) {
      const info = codes[scannedCode];
      barcodeInfo.textContent = `Scanned barcode: ${scannedCode}\nShelf: ${info.shelf}\nItems: ${info.items.join(', ')}`;
    } else {
      barcodeInfo.textContent = `Scanned barcode: ${scannedCode}\nShelf: Unknown`;
    }
  }, 1000);
});
