import { describe, it, expect } from 'vitest';
import { encodePDF, decodePDF } from './pdfSteg.js';

describe('Steganography Logic (PDF Ghost Object Injection)', () => {

    it('should correctly encode a message into a PDF', async () => {
        const pdfContent = "%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj";
        const pdfBlob = new Blob([pdfContent], { type: 'application/pdf' });
        
        // Mocking the ArrayBuffer because FileReader can't read 'Blob' correctly in some JSDOM envs
        const encoder = new TextEncoder();
        pdfBlob._mockBuffer = encoder.encode(pdfContent).buffer;

        const secret = "PDF Secret Message";
        const encodedBlob = await encodePDF(pdfBlob, secret);

        expect(encodedBlob).toBeInstanceOf(Blob);
        expect(encodedBlob.type).toBe('application/pdf');
    });

    it('should correctly extract a hidden message from a PDF', async () => {
        const secret = "PDF Secret 123";
        const base64Secret = btoa(unescape(encodeURIComponent(secret)));
        const mockPdfWithSecret = `%PDF-1.4\n99999 0 obj\n<< /PalimpsestHiddenData (${base64Secret}) >>\nendobj`;
        
        const blob = new Blob([mockPdfWithSecret], { type: 'application/pdf' });
        blob._mockText = mockPdfWithSecret;

        const result = await decodePDF(blob);
        expect(result).toBe(secret);
    });

    it('should return empty string if no message is found in PDF', async () => {
        const cleanPdf = "%PDF-1.4\nNo data here";
        const blob = new Blob([cleanPdf], { type: 'application/pdf' });
        blob._mockText = cleanPdf;

        const result = await decodePDF(blob);
        expect(result).toBe("");
    });
});
