import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { validatePaymentImage } from '../../src/lib/server/paymentImageValidation.mjs';

describe('validatePaymentImage', () => {
  it('rejects empty bytes', () => {
    assert.throws(() => validatePaymentImage(new Uint8Array(0), 'image/jpeg'), /Image cannot be empty/);
    assert.throws(() => validatePaymentImage(null, 'image/jpeg'), /Image cannot be empty/);
  });

  it('rejects size > 5MB', () => {
    const large = new Uint8Array(5242881);
    // add fake jpeg header so it doesn't fail on header if size check is after
    large[0] = 0xFF; large[1] = 0xD8; large[2] = 0xFF;
    assert.throws(() => validatePaymentImage(large, 'image/jpeg'), /Image exceeds 5MB size limit/);
  });

  it('accepts exact 5MB size', () => {
    const exact = new Uint8Array(5242880);
    exact[0] = 0xFF; exact[1] = 0xD8; exact[2] = 0xFF;
    const result = validatePaymentImage(exact, 'image/jpeg');
    assert.equal(result.mimeType, 'image/jpeg');
    assert.equal(result.extension, 'jpg');
  });

  it('accepts valid JPEG', () => {
    const data = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0]);
    const result = validatePaymentImage(data, 'image/jpeg');
    assert.equal(result.mimeType, 'image/jpeg');
    assert.equal(result.extension, 'jpg');
  });

  it('accepts valid PNG', () => {
    const data = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00]);
    const result = validatePaymentImage(data, 'image/png');
    assert.equal(result.mimeType, 'image/png');
    assert.equal(result.extension, 'png');
  });

  it('accepts valid WebP', () => {
    const data = new Uint8Array([
      0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 
      0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38, 0x00
    ]);
    const result = validatePaymentImage(data, 'image/webp');
    assert.equal(result.mimeType, 'image/webp');
    assert.equal(result.extension, 'webp');
  });

  it('rejects unsupported image format or corrupt header', () => {
    const data = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]); // GIF
    assert.throws(() => validatePaymentImage(data, 'image/gif'), /Unsupported image format or corrupt header/);
    
    const tooShort = new Uint8Array([0xFF, 0xD8]);
    assert.throws(() => validatePaymentImage(tooShort, 'image/jpeg'), /Unsupported image format or corrupt header/);
  });

  it('rejects MIME type mismatch', () => {
    const data = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0]);
    assert.throws(() => validatePaymentImage(data, 'image/png'), /MIME type mismatch/);
  });
});
