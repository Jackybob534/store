const video = document.getElementById('video');
const barcodeInfo = document.getElementById('barcode-info');
const scanButton = document.getElementById('scan-button');
const scanWindow = document.getElementById('scan-window');

let codes = {
  "__|_||": { shelf: "Health Potions", items: ["Potion", "Elixir"] },
  "_|_|_|": { shelf: "Weapons Rack", items: ["Sword", "Bow"] }
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

// Scan function using OCR
async function scanText() {
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  scanWindow.textContent = "Scanning...";

  const { data: { text } } = await Tesseract.recognize(canvas, 'eng', {
    logger: m => console.log(m)
  });

  const detectedText = text.replace(/\s+/g, ''); // remove spaces/newlines

  if (!detectedText) {
    barcodeInfo.textContent = "No text detected";
    scanWindow.textContent = "No text detected";
    return;
  }

  // Check if detected text matches codes
  const info = codes[detectedText];
  if (info) {
    barcodeInfo.textContent = `Scanned barcode: ${detectedText}\nShelf: ${info.shelf}\nItems: ${info.items.join(', ')}`;
    scanWindow.textContent = detectedText;
    scanWindow.classList.add('detected');
  } else {
    barcodeInfo.textContent = `Detected text: ${detectedText}\nShelf: Unknown`;
    scanWindow.textContent = detectedText;
    scanWindow.classList.remove('detected');
  }
}

// Manual scan button
scanButton.addEventListener('click', scanText);
