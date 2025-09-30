<!-- displays a received message -->
<script>
  import { appState, receivedImageURL, decodedMessage } from '$lib/store.js';
</script>

<div class="card">
  <h2>Message Received</h2>
  <p class="subtitle">A message was decoded from the following carrier image:</p>

  <div class="received-content">
    <img src={$receivedImageURL} alt="Carrier" />
    <div class="decoded-text-box">
      <h3>Decoded Message:</h3>
      <p>{$decodedMessage}</p>
    </div>
  </div>
  
  <button on:click={() => $appState = 'composing'}>Compose a Reply</button>
</div>
