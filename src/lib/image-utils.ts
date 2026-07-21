/**
 * Client-Side WebP Conversion & Optimization Utilities
 * Automatically converts any image (JPEG, PNG, GIF, HEIC) to lightweight .webp format before Supabase Storage upload.
 */

export async function convertToWebP(file: File, quality = 0.85): Promise<File> {
  // If already WebP, return original
  if (file.type === "image/webp") {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const canvas = document.createElement("canvas");
      // Scale down overly large images to max 1920px width/height for optimal web performance
      let width = img.width;
      let height = img.height;
      const MAX_DIM = 1920;

      if (width > MAX_DIM || height > MAX_DIM) {
        if (width > height) {
          height = Math.round((height * MAX_DIM) / width);
          width = MAX_DIM;
        } else {
          width = Math.round((width * MAX_DIM) / height);
          height = MAX_DIM;
        }
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          const webpName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
          const webpFile = new File([blob], webpName, {
            type: "image/webp",
            lastModified: Date.now(),
          });
          resolve(webpFile);
        },
        "image/webp",
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file); // Fallback to original file on image load error
    };

    img.src = objectUrl;
  });
}

export async function convertMultipleToWebP(files: File[], quality = 0.85): Promise<File[]> {
  return Promise.all(files.map((file) => convertToWebP(file, quality)));
}
