<!-- handles composing and sending a message -->
<script>
  import { secretMessage, carrierImageFile, friendPeerId } from '$lib/store.js';
  import { sendData } from '$lib/webrtc.js';
  import { encodeMessage } from '$lib/steganography.js';

  let isEncoding = false;

  function handleFileSelect(e) {
    const file = e.target.files[0];
    const validTypes = ['image/png', 'image/webp', 'application/pdf', 'image/jpeg', 'image/jpg'];
    
    if (file && validTypes.includes(file.type)) {
      carrierImageFile.set(file);
    } else {
      alert('Please select a PNG, JPEG, WebP, or PDF file.');
      e.target.value = null;
      carrierImageFile.set(null);
    }
  }

  async function handleEncodeAndSend() {
    if (!$carrierImageFile || !$secretMessage) {
      alert('Please select a valid file and enter a secret message.');
      return;
    }

    isEncoding = true;
    try {
      const encodedBlob = await encodeMessage($carrierImageFile, $secretMessage);
      sendData(encodedBlob);
      alert(`Secret message sent to ${$friendPeerId}!`);
      
      secretMessage.set('');
      carrierImageFile.set(null);
      document.querySelector('input[type="file"]').value = '';

    } catch (error) {
        console.error("Encoding/Sending Error:", error);
        alert("Failed to send: " + error.message);
    } finally {
        isEncoding = false;
    }
  }
</script>

<div class="card">
  <h2>Compose Secret Message</h2>
  <div class="status">Status: <span class="connected">Connected to {$friendPeerId}</span></div>
  
  <div class="form-group">
    <label for="image-upload">1. Select Carrier (PNG, JPG, WebP, PDF)</label>
    <input 
      id="image-upload" 
      type="file" 
      accept="image/png, image/jpeg, image/webp, application/pdf" 
      on:change={handleFileSelect} 
    />
  </div>

  <div class="form-group">
    <label for="secret-message">2. Write Your Secret Message</label>
    <textarea id="secret-message" bind:value={$secretMessage} placeholder="Your message goes here..."></textarea>
  </div>
  
  <button class="send-btn" on:click={handleEncodeAndSend} disabled={isEncoding}>
    {#if isEncoding}Encoding...{:else}Encode & Send{/if}
  </button>
</div>