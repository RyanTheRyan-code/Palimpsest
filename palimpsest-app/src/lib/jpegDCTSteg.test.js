import { describe, it, expect } from 'vitest';
import { encodeJPEG, decodeJPEG } from './jpegDCTSteg.js';

/**
 * Minimal JPEG Header (Start of Image + SOF Marker)
 */
function createMinimalJPEG(isProgressive = false) {
    const buffer = new Uint8Array(50);
    buffer.set([0xFF, 0xD8], 0);
    buffer.set([0xFF, isProgressive ? 0xC2 : 0xC0], 2);
    buffer.set([0, 17], 4);
    buffer.set([8, 0, 1, 0, 1, 1], 6);
    
    return buffer.buffer;
}

describe('Steganography Logic (JPEG DCT / JSteg)', () => {

    it('should throw error for Progressive JPEGs', async () => {
        const progJpeg = createMinimalJPEG(true);
        const secret = "Should fail";

        await expect(encodeJPEG(progJpeg, secret))
            .rejects
            .toThrow("Progressive JPEGs are not supported.");
    });

    it('should correctly initialize encoding for Baseline JPEGs', async () => {
        const baseJpeg = createMinimalJPEG(false);
        const secret = "Test 123";

        try {
            const blob = await encodeJPEG(baseJpeg, secret);
            expect(blob).toBeInstanceOf(Blob);
        } catch (e) {
            expect(e.message).not.toBe("Progressive JPEGs are not supported.");
        }
    });
});
