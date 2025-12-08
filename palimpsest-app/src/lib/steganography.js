import { encodePDF, decodePDF } from '$lib/pdfSteg.js';
import { encodeWebP, decodeWebP } from '$lib/webpSteg.js';
import { encodeJPEG, decodeJPEG } from '$lib/jpegDCTSteg.js';

const MESSAGE_TERMINATOR = "|||";

function loadImageToCanvas(imageFile) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (fileEvent) => {
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        canvas.width = image.width;
        canvas.height = image.height;
        ctx.drawImage(image, 0, 0);
        resolve({ canvas, ctx });
      };
      image.onerror = reject;
      image.src = fileEvent.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(imageFile);
  });
}

export async function encodeMessage(file, message) {
  if (file.type === 'application/pdf') {
    return encodePDF(file, message);
  }

  if (file.type === 'image/webp') {
    return encodeWebP(file, message);
  }

  if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
    const buffer = await file.arrayBuffer();
    return encodeJPEG(buffer, message); 
  }

  console.log("Routing to PNG LSB Engine...");
  const { canvas, ctx } = await loadImageToCanvas(file);
  const messageToHide = message + MESSAGE_TERMINATOR;
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixelData = imageData.data;

  let messageInBinary = '';
  for (let i = 0; i < messageToHide.length; i++) {
    const binaryChar = messageToHide[i].charCodeAt(0).toString(2).padStart(8, '0');
    messageInBinary += binaryChar;
  }

  if (messageInBinary.length > pixelData.length * 0.75) {
      throw new Error("Message is too long for this image.");
  }

  let dataIndex = 0;
  for (let i = 0; i < messageInBinary.length; i++) {
    if ((dataIndex + 1) % 4 === 0) dataIndex++;

    const pixelStartIndex = Math.floor(dataIndex / 4) * 4;
    pixelData[pixelStartIndex + 3] = 255; 

    const bit = parseInt(messageInBinary[i]);
    
    if (bit === 1) {
        pixelData[dataIndex] |= 1;
    } else {
        pixelData[dataIndex] &= ~1;
    }
    
    dataIndex++;
  }

  ctx.putImageData(imageData, 0, 0);

  return new Promise(resolve => {
    canvas.toBlob(resolve, 'image/png');
  });
}

export async function decodeMessage(file) {
  if (file.type === 'application/pdf') return decodePDF(file);
  if (file.type === 'image/webp') return decodeWebP(file);
  if (file.type === 'image/jpeg' || file.type === 'image/jpg') return decodeJPEG(file);

  console.log("Routing to PNG LSB Decoder...");
  const { ctx, canvas } = await loadImageToCanvas(file);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixelData = imageData.data;

  let extractedBits = []; 
  let decodedText = '';
  
  const MAX_BITS = 100000; 
  
  for (let i = 0; i < pixelData.length; i++) {
      if ((i + 1) % 4 === 0) continue;
      
      const lsb = pixelData[i] % 2;
      extractedBits.push(lsb);

      if (extractedBits.length % 8 === 0) {
          const currentByteVal = parseInt(extractedBits.slice(-8).join(''), 2);
          const char = String.fromCharCode(currentByteVal);
          decodedText += char;

          if (decodedText.endsWith(MESSAGE_TERMINATOR)) {
              return decodedText.substring(0, decodedText.length - MESSAGE_TERMINATOR.length);
          }
      }

      if (extractedBits.length > MAX_BITS) {
          throw new Error("No hidden message found.");
      }
  }

  throw new Error("No hidden message found.");
}