import { describe, it, expect } from 'vitest';
import { encodeWebP, decodeWebP } from './webpSteg.js';

/**
 * Generates a minimal valid WebP buffer for testing
 * Offset 0 - RIFF (4 bytes)
 * Offset 4 - File Size (4 bytes)
 * Offset 8 - WEBP (4 bytes)
 * Offset 12 - VP8X (the start of a real chunk)
 */
function createMinimalWebP() {
    const buffer = new Uint8Array(100);
    buffer.set([0x52, 0x49, 0x46, 0x46], 0);
    new DataView(buffer.buffer).setUint32(4, 92, true);
    buffer.set([0x57, 0x45, 0x42, 0x50], 8);
    buffer.set([0x56, 0x50, 0x38, 0x58], 12);
    
    const blob = new Blob([buffer], { type: 'image/webp' });
    blob._mockBuffer = buffer.buffer;
    return blob;
}

describe('Steganography Logic (WebP Chunk Injection)', () => {

    it('should correctly encode a message into a WebP chunk', async () => {
        const webpImage = createMinimalWebP();
        const secret = "WebP Secret 123";

        const encodedBlob = await encodeWebP(webpImage, secret);
        expect(encodedBlob).toBeInstanceOf(Blob);
        expect(encodedBlob.type).toBe('image/webp');
    });

    it('should throw error for invalid file types', async () => {
        const fakeFile = new Blob(['Not a WebP'], { type: 'image/webp' });
        fakeFile._mockBuffer = (new Uint8Array([1, 2, 3])).buffer;

        await expect(encodeWebP(fakeFile, "Hello"))
            .rejects
            .toThrow("Invalid WebP file structure.");
    });
});
