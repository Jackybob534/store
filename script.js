const video = document.getElementById('video');
const barcodeInfo = document.getElementById('barcode-info');
const scanWindow = document.getElementById('scan-window');

let codes = {
  "<|_|_||>": { shelf: "Health Potions", items: ["Potion", "Elixir"] },
  "<_|_|_||>": { shelf: "Weapons Rack", items: ["Sword", "Bow"] }
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

// Automatic scanning function
function scanBarcode() {
  if (!video.videoWidth || !video.videoHeight) return;

  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const lineHeight = 10; // vertical pixels per square
  const numLines = 3;    // scan multiple horizontal lines
  const yCenter = Math.floor(canvas.height / 2);
  const sliceWidth = Math.floor(canvas.width / 5); // exactly 5 symbols

  let combinedBarcode = '';

  for (let l = 0; l < numLines; l++) {
    let y = yCenter - Math.floor(numLines / 2) * lineHeight + l * lineHeight;
    let lineBarcode = '';

    for (let s = 0; s < 5; s++) { // 5 symbols
      const xStart = s * sliceWidth;
      let blackPixels = 0;

      for (let dx = 0; dx < sliceWidth; dx++) {
        for (let dy = 0; dy < lineHeight; dy++) {
          const pixel = ctx.getImageData(xStart + dx, y + dy, 1, 1).data;
          const brightness = (pixel[0] + pixel[1] + pixel[2]) / 3;
          if (brightness < 128) blackPixels++;
        }
      }

      lineBarcode += blackPixels > (sliceWidth * lineHeight / 2) ? '|' : '_';
    }

    combinedBarcode += lineBarcode;
  }

  // Take the middle line to reduce noise
  const barcodeRaw = combinedBarcode.slice(Math.floor(combinedBarcode.length / 3), Math.floor(2 * combinedBarcode.length / 3));

  // Optional start/end markers
  const startIndex = barcodeRaw.indexOf('<');
  const endIndex = barcodeRaw.indexOf('>', startIndex + 1);
  let barcodeData = barcodeRaw;

  if (startIndex !== -1 && endIndex !== -1) {
    barcodeData = barcodeRaw.slice(startIndex, endIndex + 1);
  }

  // Display whatever was read
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

// Automatic scanning every 300ms
setInterval(scanBarcode, 300);
