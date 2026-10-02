/**
 * Validates a payment image by verifying its contents against expected image types and size limit.
 *
 * @param {Uint8Array} bytes The image data to validate
 * @param {string} declaredType The expected MIME type (e.g. 'image/jpeg')
 * @returns {{mimeType: 'image/jpeg' | 'image/png' | 'image/webp', extension: string}}
 */
export function validatePaymentImage(bytes, declaredType) {
  if (!bytes || bytes.length === 0) {
    throw new Error('Image cannot be empty');
  }

  const MAX_SIZE = 5242880; // 5MB
  if (bytes.length > MAX_SIZE) {
    throw new Error('Image exceeds 5MB size limit');
  }

  // Check magic numbers for JPEG, PNG, WebP
  let detectedMime = null;
  let extension = null;

  if (bytes.length >= 3 && bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
    detectedMime = 'image/jpeg';
    extension = 'jpg';
  } else if (bytes.length >= 8 && 
             bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47 &&
             bytes[4] === 0x0D && bytes[5] === 0x0A && bytes[6] === 0x1A && bytes[7] === 0x0A) {
    detectedMime = 'image/png';
    extension = 'png';
  } else if (bytes.length >= 12 &&
             bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && // RIFF
             bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) { // WEBP
    detectedMime = 'image/webp';
    extension = 'webp';
  } else {
    throw new Error('Unsupported image format or corrupt header');
  }

  if (declaredType && declaredType !== detectedMime) {
    throw new Error('MIME type mismatch');
  }

  return { mimeType: detectedMime, extension };
}
