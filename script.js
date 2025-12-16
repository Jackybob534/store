const video = document.getElementById('video');
const barcodeInfo = document.getElementById('barcode-info');
const scanWindow = document.getElementById('scan-window');

// Sample barcode data
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
    await video.play();
  } catch (err) {
    console.error("Camera error:", err);
    alert("Camera access is required.");
  }
}

startCamera();

// Helper: play beep sound using Web Audio API
function playBeep(frequency = 440, duration = 100) {
  const context = new AudioContext();
  const oscillator = context.createOscillator();
  oscillator.type = 'square';
  oscillator.frequency.value = frequency;
  oscillator.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + duration / 1000);
}

// Scan function
function scanBarcode() {
  if (!video.videoWidth || !video.videoHeight) return;

  // Play scan beep
  playBeep(440, 50);

  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const boxRect = scanWindow.getBoundingClientRect();
  const videoRect = video.getBoundingClientRect();

  // Map scan window to video coordinates
  const scaleX = canvas.width / videoRect.width;
  const scaleY = canvas.height / videoRect.height;
  const boxLeft = (boxRect.left - videoRect.left) * scaleX;
  const boxTop = (boxRect.top - videoRect.top) * scaleY;
  const boxWidth = boxRect.width * scaleX;
  const boxHeight = boxRect.height * scaleY;

  const numLines = 3;
  const sliceWidth = Math.floor(boxWidth / 5);
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

  const barcodeRaw = combinedBarcode.slice(Math.floor(combinedBarcode.length / 3), Math.floor(2 * combinedBarcode.length / 3));

  // Detect inside <…>
  const startIndex = barcodeRaw.indexOf('<');
  const endIndex = barcodeRaw.indexOf('>', startIndex + 1);

  if (startIndex !== -1 && endIndex !== -1) {
    const barcodeData = barcodeRaw.slice(startIndex + 1, endIndex);
    if (codes[barcodeData]) {
      barcodeInfo.textContent = `Detected: ${barcodeData}\nShelf: ${codes[barcodeData].shelf}\nItems: ${codes[barcodeData].items.join(', ')}`;
      scanWindow.style.borderColor = "#0f0"; // green highlight
      playBeep(880, 100); // success beep
    } else {
      barcodeInfo.textContent = `Detected: ${barcodeData}\nUnknown barcode`;
      scanWindow.style.borderColor = "#f00"; // red highlight
      playBeep(220, 150); // error beep
    }
  } else {
    barcodeInfo.textContent = 'No valid barcode detected';
    scanWindow.style.borderColor = "#0ff"; // default sky blue
  }
}

// Automatic scanning
setInterval(scanBarcode, 400);
