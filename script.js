const video = document.getElementById('video');
const barcodeInfo = document.getElementById('barcode-info');
let codes = {};

// Load barcode data
fetch('./codes.json')
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

// Normalize repeated bars/spaces
function normalizeBarcode(raw) {
  return raw.replace(/(\|)+/g, '|').replace(/(_)+/g, '_');
}

// Scan function
function scanBarcode() {
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  // Restrict scanning to "scan window"
  const startY = canvas.height * 0.4;
  const scanHeight = canvas.height * 0.2;

  let barcodeRaw = '';
  const sliceWidth = 5; // adjust depending on your barcode size

  for (let x = 0; x < canvas.width; x += sliceWidth) {
    let blackPixels = 0;
    for (let y = startY; y < startY + scanHeight; y++) {
      const pixel = ctx.getImageData(x, y, 1, 1).data;
      const brightness = (pixel[0] + pixel[1] + pixel[2]) / 3;
      if (brightness < 128) blackPixels++;
    }
    barcodeRaw += blackPixels > scanHeight / 2 ? '|' : '_';
  }

  // Extract between start/end markers
  const startMarker = '|>';
  const stopMarker = '<|';
  const startIndex = barcodeRaw.indexOf(startMarker);
  const stopIndex = barcodeRaw.indexOf(stopMarker, startIndex + startMarker.length);
  let barcodeData = null;

  if (startIndex !== -1 && stopIndex !== -1) {
    barcodeData = barcodeRaw.slice(startIndex + startMarker.length, stopIndex);
    barcodeData = normalizeBarcode(barcodeData);
  }

  if (barcodeData && codes[barcodeData]) {
    const info = codes[barcodeData];
    barcodeInfo.textContent = `Scanned barcode: ${barcodeData}\nShelf: ${info.shelf}\nItems: ${info.items.join(', ')}`;
  } else if (barcodeData) {
    barcodeInfo.textContent = `Scanned barcode: ${barcodeData}\nShelf: Unknown`;
  }
}

// Scan continuously
setInterval(scanBarcode, 500);
