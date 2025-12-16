const video = document.getElementById('video');
const barcodeInfo = document.getElementById('barcode-info');
const scanWindow = document.getElementById('scan-window');

const scanSound = document.getElementById('scanSound');
const successSound = document.getElementById('successSound');
const errorSound = document.getElementById('errorSound');

let codes = {
  "■□■■□": { shelf: "Health Potions", items: ["Potion", "Elixir"] },
  "□■□■□": { shelf: "Weapons Rack", items: ["Sword", "Bow"] },
  "■■□□■": { shelf: "Magic Items", items: ["Wand", "Spellbook"] }
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

  // Play scan attempt sound
  scanSound.currentTime = 0;
  scanSound.play();

  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  // Middle box coordinates
  const boxWidth = scanWindow.offsetWidth;
  const boxHeight = scanWindow.offsetHeight;
  const boxLeft = (canvas.width - boxWidth) / 2;
  const boxTop = (canvas.height - boxHeight) / 2;

  const numLines = 3; // scan multiple horizontal lines inside the box
  const sliceWidth = Math.floor(boxWidth / 5); // 5 squares

  let combinedBarcode = '';

  for (let l = 0; l < numLines; l++) {
    const y = boxTop + Math.floor((l + 0.5) * (boxHeight / numLines));
    let lineBarcode = '';

    for (let s = 0; s < 5; s++) {
      const xStart = boxLeft + s * sliceWidth;
      let blackPixels = 0;

      for (let dx = 0; dx < sliceWidth; dx++) {
        for (let dy = 0; dy < Math.floor(boxHeight / numLines); dy++) {
          const pixel = ctx.getImageData(xStart + dx, y + dy, 1, 1).data;
          const brightness = (pixel[0] + pixel[1] + pixel[2]) / 3;
          if (brightness < 128) blackPixels++;
        }
      }

      lineBarcode += blackPixels > (sliceWidth * (boxHeight / numLines) / 2) ? '■' : '□';
    }

    combinedBarcode += lineBarcode;
  }

  // Take middle line to reduce noise
  const barcodeRaw = combinedBarcode.slice(Math.floor(combinedBarcode.length / 3), Math.floor(2 * combinedBarcode.length / 3));

  // Only detect inside <…>
  const startIndex = barcodeRaw.indexOf('<');
  const endIndex = barcodeRaw.indexOf('>', startIndex + 1);

  if (startIndex !== -1 && endIndex !== -1) {
    const barcodeData = barcodeRaw.slice(startIndex + 1, endIndex);
    barcodeInfo.textContent = `Detected: ${barcodeData}`;

    if (codes[barcodeData]) {
      scanWindow.classList.add('detected');
      const info = codes[barcodeData];
      barcodeInfo.textContent += `\nShelf: ${info.shelf}\nItems: ${info.items.join(', ')}`;
      successSound.currentTime = 0;
      successSound.play();
    } else {
      scanWindow.classList.remove('detected');
      errorSound.currentTime = 0;
      errorSound.play();
    }
  } else {
    scanWindow.classList.remove('detected');
    barcodeInfo.textContent = 'No valid barcode detected';
    errorSound.currentTime = 0;
    errorSound.play();
  }
}

// Automatic scan every 300ms
setInterval(scanBarcode, 300);
