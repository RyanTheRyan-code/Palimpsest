
const CHUNK_ID = "steg";

/**
 * appends a custom RIFF chunk
 * @param {File} webpFile - WebP file
 * @param {string} message - secret message
 * @returns {Promise<Blob>} - modified WebP
 */
export async function encodeWebP(webpFile, message) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (event) => {
            try {
                const originalBytes = new Uint8Array(event.target.result);
                const dataView = new DataView(originalBytes.buffer);

                const isRIFF = originalBytes[0] === 0x52 && originalBytes[1] === 0x49 && originalBytes[2] === 0x46 && originalBytes[3] === 0x46;
                const isWEBP = originalBytes[8] === 0x57 && originalBytes[9] === 0x45 && originalBytes[10] === 0x42 && originalBytes[11] === 0x50;

                if (!isRIFF || !isWEBP) {
                    reject(new Error("Invalid WebP file structure."));
                    return;
                }

                const encoder = new TextEncoder();
                const messageBytes = encoder.encode(message);
                
                const isOdd = messageBytes.length % 2 !== 0;
                const chunkDataSize = messageBytes.length + (isOdd ? 1 : 0);
                
                const totalChunkSize = 8 + chunkDataSize;

                const chunkBuffer = new Uint8Array(totalChunkSize);
                const chunkView = new DataView(chunkBuffer.buffer);

                chunkBuffer.set([0x73, 0x74, 0x65, 0x67], 0); 
                
                chunkView.setUint32(4, messageBytes.length, true); 

                chunkBuffer.set(messageBytes, 8);

                const currentRiffSize = dataView.getUint32(4, true);
                const newRiffSize = currentRiffSize + totalChunkSize;
                
                dataView.setUint32(4, newRiffSize, true);

                const finalBuffer = new Uint8Array(originalBytes.length + chunkBuffer.length);
                finalBuffer.set(originalBytes);
                finalBuffer.set(chunkBuffer, originalBytes.length);

                resolve(new Blob([finalBuffer], { type: 'image/webp' }));

            } catch (err) {
                reject(new Error("WebP Encoding Failed: " + err.message));
            }
        };

        reader.onerror = () => reject(new Error("Failed to read WebP file"));
        reader.readAsArrayBuffer(webpFile);
    });
}

/**
 * extracts secret message from a WebP file
 * @param {Blob} webpBlob - WebP file
 * @returns {Promise<string>} - decoded message
 */
export async function decodeWebP(webpBlob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (event) => {
            try {
                const buffer = event.target.result;
                const view = new DataView(buffer);
                const bytes = new Uint8Array(buffer);

                let offset = 12; 

                while (offset < buffer.byteLength) {
                    if (offset + 8 > buffer.byteLength) break;

                    const chunkId = String.fromCharCode(
                        bytes[offset], bytes[offset+1], bytes[offset+2], bytes[offset+3]
                    );
                    
                    const chunkSize = view.getUint32(offset + 4, true);

                    if (chunkId === CHUNK_ID) {
                        const messageBytes = bytes.slice(offset + 8, offset + 8 + chunkSize);
                        const decoder = new TextDecoder();
                        resolve(decoder.decode(messageBytes));
                        return;
                    }

                    const padding = (chunkSize % 2 !== 0) ? 1 : 0;
                    offset += 8 + chunkSize + padding;
                }

                resolve("");

            } catch (err) {
                console.error("WebP Decoding Error:", err);
                resolve("");
            }
        };

        reader.onerror = () => reject(new Error("Failed to read WebP file"));
        reader.readAsArrayBuffer(webpBlob);
    });
}