// Image compression utility
export function compressImage(file: File, maxWidth = 400, quality = 0.9): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions maintaining aspect ratio
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
      const newWidth = img.width * ratio;
      const newHeight = img.height * ratio;
      
      // Set canvas size
      canvas.width = newWidth;
      canvas.height = newHeight;
      
      // Enable better image smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      // Draw and compress
      ctx.drawImage(img, 0, 0, newWidth, newHeight);
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedDataUrl);
    };
    
    // Create object URL for the file
    img.src = URL.createObjectURL(file);
  });
}