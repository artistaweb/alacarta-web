type OptimizeOptions = {
  maxWidth: number;
  maxHeight: number;
  quality: number;
};

async function loadImage(file: File) {
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.decoding = "async";
    image.src = url;
    await image.decode();
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function optimizeImage(file: File, options: OptimizeOptions) {
  if (!file.type.startsWith("image/")) {
    throw new Error("El archivo no es una imagen válida.");
  }

  const image = await loadImage(file);
  const scale = Math.min(
    options.maxWidth / image.width,
    options.maxHeight / image.height,
    1
  );
  const targetWidth = Math.max(1, Math.round(image.width * scale));
  const targetHeight = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("No se pudo preparar el canvas.");
  }

  context.drawImage(image, 0, 0, targetWidth, targetHeight);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(
      (result) => resolve(result),
      "image/webp",
      options.quality
    );
  });

  if (!blob) {
    throw new Error("No se pudo exportar la imagen optimizada.");
  }

  const baseName = file.name.replace(/\.[^/.]+$/, "");
  return new File([blob], `${baseName}.webp`, { type: "image/webp" });
}

export function optimizeCoverImage(file: File) {
  return optimizeImage(file, {
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 0.86,
  });
}

export function optimizeGalleryImage(file: File) {
  return optimizeImage(file, {
    maxWidth: 1600,
    maxHeight: 1200,
    quality: 0.82,
  });
}
