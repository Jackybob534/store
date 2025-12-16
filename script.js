const video = document.getElementById('video');
const barcodeInfo = document.getElementById('barcode-info');
const scanWindow = document.getElementById('scan-window');

// Known barcodes
let codes = {
  "<_|__|>": { shelf: "Health Potions", items: ["Potion", "Elixir"] },
  "<_|_|_||>": { shelf: "Weapons Rack", items: ["Sword", "Bow"] }
};

// Start camera
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

// Normalize repeated bars/underscores
function normalizeBarcode(raw) {
  return raw.replace(/(\|)+/g, '|').replace(/(_)+/g, '_');
}

// Check barcode against known codes
function checkBarcode(barcodeRaw) {
  const barcodeData = `<${normalizeBarcode(barcodeRaw)}>`;
  let found = null;

  // Exact match
  if (codes[barcodeData]) {
    found = codes[barcodeData];
  } else {
    // Optional fallback: includes match
    for (let key in codes) {
      if (barcodeData.includes(key)) {
        found = codes[key];
        break;
      }
    }
  }

  return { barcodeData, found };
}

// Scanning function
function scanBarcode() {
  if (!video.videoWidth || !video.videoHeight) return;

  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const lineY = Math.floor(canvas.height / 2); // middle line
  const sliceWidth = Math.floor(canvas.width / 5); // 5 symbols
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

  // Use communication layer
  const { barcodeData, found } = checkBarcode(barcodeRaw);
  barcodeInfo.textContent = `Detected: ${barcodeData}`;

  if (found) {
    scanWindow.classList.add('detected');
    barcodeInfo.textContent += `\nShelf: ${found.shelf}\nItems: ${found.items.join(', ')}`;
  } else {
    scanWindow.classList.remove('detected');
  }
}

// Automatic scanning every 300ms
setInterval(scanBarcode, 300);
