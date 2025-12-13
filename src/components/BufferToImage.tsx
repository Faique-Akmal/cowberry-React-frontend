export const bufferToImageUrl = (
  bufferObject: any,
  mimeType = "image/jpeg"
) => {
  // If it's already a URL string
  if (typeof bufferObject === "string") return bufferObject;

  // If missing or null
  if (!bufferObject || !bufferObject.data || !Array.isArray(bufferObject.data)) {
    return null;
  }

  try {
    // Convert array to typed array
    const byteArray = new Uint8Array(bufferObject.data);

    // Convert to Blob
    const blob = new Blob([byteArray], { type: mimeType });

    // Blob → temporary image URL
    return URL.createObjectURL(blob);
  } catch (err) {
    console.error("Error converting buffer to image:", err);
    return null;
  }
};
