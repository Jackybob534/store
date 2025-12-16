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

  setTimeout(() => {
    let scannedCode = getBarcodeFromCanvas(canvas);

    // Look for start and stop markers
    const startMarker = '|>';
    const stopMarker = '<|';
    const startIndex = scannedCode.indexOf(startMarker);
    const stopIndex = scannedCode.indexOf(stopMarker, startIndex + startMarker.length);

    let barcodeData = null;

    if (startIndex !== -1 && stopIndex !== -1) {
      barcodeData = scannedCode.slice(startIndex + startMarker.length, stopIndex);
    }

    loading.style.display = 'none';

    if (barcodeData && codes[barcodeData]) {
      const info = codes[barcodeData];
      barcodeInfo.textContent = `Scanned barcode: ${barcodeData}\nShelf: ${info.shelf}\nItems: ${info.items.join(', ')}`;
    } else {
      barcodeInfo.textContent = `Scanned barcode: ${barcodeData || 'None'}\nShelf: Unknown`;
    }
  }, 1000);
});
