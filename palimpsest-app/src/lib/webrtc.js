import Peer from 'peerjs';
import { 
  appState, 
  yourPeerId, 
  friendPeerId, 
  connectionStatus, 
  addMessage 
} from '$lib/store.js';

let peer = null;
let conn = null;

const METERED_DOMAIN = "palimpsest.metered.live";
const METERED_API_KEY = "7be12dc85334b1ea8f2b1c53d539aa24fe5f";

async function getIceServers() {
  try {
    console.log("Fetching TURN credentials from Metered...");
    const response = await fetch(`https://${METERED_DOMAIN}/api/v1/turn/credentials?apiKey=${METERED_API_KEY}`);
    
    if (!response.ok) {
        throw new Error(`Metered API Error: ${response.status} ${response.statusText}`);
    }

    const servers = await response.json();
    console.log("Successfully fetched TURN servers:", servers);
    return servers;
  } catch (error) {
    console.error("Failed to fetch Metered TURN servers:", error);
    console.warn("Falling back to public STUN servers. Connection might fail on strict networks.");
    return [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ];
  }
}

function detectMimeType(arrayBuffer) {
  const header = new Uint8Array(arrayBuffer.slice(0, 12));
  if (header[0] === 0x25 && header[1] === 0x50 && header[2] === 0x44 && header[3] === 0x46) return 'application/pdf';
  if (header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4E && header[3] === 0x47) return 'image/png';
  if (header[0] === 0xFF && header[1] === 0xD8 && header[2] === 0xFF) return 'image/jpeg';
  if (header[0] === 0x52 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x46) return 'image/webp';
  return 'application/octet-stream';
}

export async function initPeer() {
  if (peer) return;

  console.log("Initializing Peer...");
  
  const iceServers = await getIceServers();

  const peerConfig = {
      config: {
          iceServers: iceServers
      },
      debug: 1
  };

  peer = new Peer(peerConfig);

  peer.on('open', (id) => {
    console.log('PeerJS Ready with ID:', id);
    yourPeerId.set(id);
  });

  peer.on('connection', (incomingConn) => {
    console.log('Incoming connection from:', incomingConn.peer);
    
    if (conn) {
        console.warn("Closing existing connection to accept new one.");
        conn.close();
    }

    conn = incomingConn;
    friendPeerId.set(conn.peer);
    setupConnectionListeners(conn);
  });

  peer.on('error', (err) => {
      console.error("PeerJS Error:", err);
  });
}

export function connectToPeer(id) {
  if (!peer || !peer.open) {
    console.warn("Peer not ready yet. Queuing connect...");
    const checkInterval = setInterval(() => {
        if (peer && peer.open) {
            clearInterval(checkInterval);
            connectToPeer(id);
        }
    }, 200);
    return;
  }
  
  if (conn && conn.peer === id && conn.open) {
      console.log("Already connected to this peer.");
      return;
  }

  console.log('Initiating connection to:', id);
  connectionStatus.set('connecting');
  
  if (conn) conn.close();

  conn = peer.connect(id, { reliable: true });
  
  friendPeerId.set(id);
  setupConnectionListeners(conn);
}

function setupConnectionListeners(connection) {
    connection.on('open', () => {
        console.log(`Connection OPEN with ${connection.peer}`);
        connectionStatus.set('connected');
        appState.set('connected');
    });

    connection.on('data', async (data) => {
        console.log('DATA RECEIVED');
        const mimeType = detectMimeType(data);
        const receivedBlob = new Blob([data], { type: mimeType });
        const objectUrl = URL.createObjectURL(receivedBlob);
        addMessage('friend', '', objectUrl); 
    });

    connection.on('close', () => {
        console.log("Connection closed.");
        connectionStatus.set('disconnected');
        appState.set('connecting');
        conn = null;
    });

    connection.on('error', (err) => {
        console.error('Connection Error:', err);
        connectionStatus.set('disconnected');
    });
}

export function sendData(data) {
  if (conn && conn.open) {
      try {
        conn.send(data);
        console.log("Data sent successfully.");
      } catch (e) {
          console.error("Send failed:", e);
          alert("Error sending data.");
      }
  } else {
    alert('Connection is lost or not open.');
  }
}