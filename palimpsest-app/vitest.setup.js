import { vi } from 'vitest';

global._mockPixelCache = new Map();

HTMLCanvasElement.prototype.getContext = function() {
  return {
    drawImage: (image) => {
      if (image._src && global._mockPixelCache.has(image._src)) {
        const cached = global._mockPixelCache.get(image._src);
        this._pixelBuffer = new Uint8ClampedArray(cached.data);
      }
    },
    getImageData: (x, y, w, h) => {
      const width = w || this.width || 100;
      const height = h || this.height || 100;
      if (!this._pixelBuffer) this._pixelBuffer = new Uint8ClampedArray(width * height * 4);
      return { data: this._pixelBuffer, width, height };
    },
    putImageData: (imageData) => {
      this._pixelBuffer = new Uint8ClampedArray(imageData.data);
    },
    canvas: this
  };
};

HTMLCanvasElement.prototype.toBlob = function(callback, type = 'image/png') {
  const blobId = `mock-blob-${Math.random()}`;
  global._mockPixelCache.set(blobId, {
    data: this._pixelBuffer || new Uint8ClampedArray(this.width * this.height * 4),
    width: this.width,
    height: this.height
  });
  setTimeout(() => {
    const blob = new Blob(['fake'], { type });
    blob._mockId = blobId;
    callback(blob);
  }, 0);
};

// Image Mock
global.Image = class {
  constructor() {
    this.onload = null;
    this._src = '';
    this.width = 100;
    this.height = 100;
  }
  set src(val) {
    this._src = val;
    setTimeout(() => this.onload?.(), 10);
  }
  get src() { return this._src; }
};

// Filereader Mock (Expanded for PDF/WebP/JPEG)
global.FileReader = class {
  constructor() {
    this.onload = null;
    this.result = null;
  }
  readAsDataURL(blob) {
    const result = blob._mockId || 'data:image/png;base64,mock';
    setTimeout(() => this.onload?.({ target: { result } }), 10);
  }
  readAsArrayBuffer(blob) {
    const result = blob._mockBuffer || new ArrayBuffer(100);
    setTimeout(() => {
        this.result = result;
        this.onload?.({ target: { result } });
    }, 10);
  }
  readAsText(blob) {
    const result = blob._mockText || "";
    setTimeout(() => {
        this.result = result;
        this.onload?.({ target: { result } });
    }, 10);
  }
};

// Mocking URL.createObjectURL for the Chat/Received views
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = vi.fn();
