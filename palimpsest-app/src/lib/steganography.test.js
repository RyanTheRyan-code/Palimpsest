import { describe, it, expect, vi } from 'vitest';
import { encodeMessage, decodeMessage } from './steganography.js';

/**
 * Generates a blank mock image for testing
 */
async function createTestImage(width = 100, height = 100) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    return new Promise(resolve => {
        canvas.toBlob(blob => {
            resolve(blob);
        });
    });
}

describe('Steganography Logic (PNG LSB)', () => {

    it('should correctly encode and decode a standard message', async () => {
        const testImage = await createTestImage();
        const secretText = "Professional Stego Test 123";

        const encodedBlob = await encodeMessage(testImage, secretText);
        expect(encodedBlob).toBeInstanceOf(Blob);

        const decodedText = await decodeMessage(encodedBlob);
        expect(decodedText).toBe(secretText);
    });

    it('should handle a long ASCII message at near-maximum capacity', async () => {
        const testImage = await createTestImage(50, 50);
        // 600 characters is well within the 75% limit
        const longSecret = "A".repeat(600); 

        const encodedBlob = await encodeMessage(testImage, longSecret);
        const decodedText = await decodeMessage(encodedBlob);
        
        expect(decodedText).toBe(longSecret);
        expect(decodedText.length).toBe(600);
    });

    it('should throw an error if the message is too long for the image', async () => {
        // Create a tiny image (only 4 pixels = 12 bits of space)
        const tinyImage = await createTestImage(2, 2); 
        const massiveText = "This message is far too long for a 2x2 image"; 

        await expect(encodeMessage(tinyImage, massiveText))
            .rejects
            .toThrow("Message is too long for this image.");
    });
});
