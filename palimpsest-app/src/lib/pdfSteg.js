
const STAG_KEY = "/PalimpsestHiddenData";

/**
 * hides secret message inside a PDF file
 * @param {File} pdfFile - PDF file
 * @param {string} message - secret message to hide
 * @returns {Promise<Blob>} - modified PDF Blob
 */
export async function encodePDF(pdfFile, message) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (event) => {
            try {
                const originalBytes = new Uint8Array(event.target.result);

                const base64Message = btoa(unescape(encodeURIComponent(message)));

                const ghostObjectStr = `
% Palimpsest Steganography Data
99999 0 obj
<< ${STAG_KEY} (${base64Message}) >>
endobj
`;
                
                const encoder = new TextEncoder();
                const ghostBytes = encoder.encode(ghostObjectStr);

                const combinedBytes = new Uint8Array(originalBytes.length + ghostBytes.length);
                combinedBytes.set(originalBytes);
                combinedBytes.set(ghostBytes, originalBytes.length);

                const stegoBlob = new Blob([combinedBytes], { type: 'application/pdf' });
                resolve(stegoBlob);

            } catch (err) {
                reject(new Error("PDF Encoding Failed: " + err.message));
            }
        };

        reader.onerror = () => reject(new Error("Failed to read PDF file"));
        reader.readAsArrayBuffer(pdfFile);
    });
}

/**
 * extracts secret message from a PDF file
 * @param {Blob} pdfBlob - PDF file
 * @returns {Promise<string>} - decoded message
 */
export async function decodePDF(pdfBlob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (event) => {
            try {
                const fileContent = event.target.result;

                const regex = new RegExp(`${STAG_KEY}\\s*\\(([^)]+)\\)`);
                const match = fileContent.match(regex);

                if (match && match[1]) {
                    const base64Message = match[1];
                    const originalMessage = decodeURIComponent(escape(atob(base64Message)));
                    resolve(originalMessage);
                } else {
                    resolve("");
                }

            } catch (err) {
                console.error("PDF Decoding Error:", err);
                resolve(""); 
            }
        };

        reader.onerror = () => reject(new Error("Failed to read PDF file"));
        
        reader.readAsText(pdfBlob);
    });
}