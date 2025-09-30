<!-- handles composing and sending messages -->
<script>
  import { appState, secretMessage, carrierImageFile, connectionStatus, friendPeerId } from '$lib/store.js';

  function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file && file.type === 'image/png') {
      $carrierImageFile = file;
    } else {
      alert('Please select a PNG image.');
      $carrierImageFile = null;
    }
  }

  function handleEncodeAndSend() {
    if (!$carrierImageFile || !$secretMessage) {
      alert('Please select a PNG image and enter a secret message.');
      return;
    }
    alert(`Sending "${$secretMessage}" hidden in ${$carrierImageFile.name}...`);
    $secretMessage = '';
    $carrierImageFile = null;
    document.querySelector('input[type="file"]').value = '';
  }
</script>

<div class="card">
  <h2>Compose Secret Message</h2>
  <div class="status">Status: <span class="connected">Connected to {$friendPeerId}</span></div>
  
  <div class="form-group">
    <label for="image-upload">1. Select Carrier Image (PNG)</label>
    <input id="image-upload" type="file" accept="image/png" on:change={handleFileSelect} />
  </div>

  <div class="form-group">
    <label for="secret-message">2. Write Your Secret Message</label>
    <textarea id="secret-message" bind:value={$secretMessage} placeholder="Your message goes here..."></textarea>
  </div>
  
  <button class="send-btn" on:click={handleEncodeAndSend}>Encode & Send</button>

  <button class="secondary-btn" on:click={() => $appState = 'received'}> (Simulate Receive) </button>
</div>