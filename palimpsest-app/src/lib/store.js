import { writable } from 'svelte/store';

// This file holds all the application's shared data.
// Any component can import these stores to get or update the app's state.

// 'connecting', 'composing', or 'received'
export const appState = writable('connecting');

// WebRTC connection status and IDs
export const yourPeerId = writable('generating...');
export const friendPeerId = writable('');
export const connectionStatus = writable('disconnected'); // 'connecting', 'connected'

// Message data
export const secretMessage = writable('');
export const carrierImageFile = writable(null);
export const receivedImageURL = writable('https://placehold.co/600x400/232323/FFF?text=Carrier+Image');
export const decodedMessage = writable('This is the secret message that was hidden inside.');

