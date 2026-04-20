import { writable } from 'svelte/store';

export const appState = writable('connecting');

export const connectionStatus = writable('disconnected');
export const yourPeerId = writable('');
export const friendPeerId = writable('');

export const messages = writable([]);

export const secretMessage = writable('');
export const carrierImageFile = writable(null);

export const receivedImageURL = writable(null);
export const decodedMessage = writable('');

/**
 * Helper adds a message to volatile history
 * @param {string} sender - 'me' or 'friend'
 * @param {string} text - decoded text content
 * @param {string|null} imageBlobUrl - URL to the carrier image
 */
export const addMessage = (sender, text, imageBlobUrl = null) => {
  messages.update(history => [
    ...history,
    {
      id: crypto.randomUUID(),
      sender,
      text,
      image: imageBlobUrl,
      timestamp: Date.now()
    }
  ]);
};