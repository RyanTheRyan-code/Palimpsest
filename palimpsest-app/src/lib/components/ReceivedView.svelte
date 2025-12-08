<!-- displays a received message and allows downloading the carrier -->
<script>
  import { appState, receivedImageURL, decodedMessage, friendPeerId } from '$lib/store.js';

  let fileType = 'unknown';
  let blobSize = 0;

  $: if ($receivedImageURL) {
    detectFileType($receivedImageURL);
  }

  async function detectFileType(url) {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      blobSize = blob.size;
      
      if (blob.type === 'application/pdf') {
        fileType = 'pdf';
      } else if (blob.type.startsWith('image/')) {
        fileType = 'image';
      } else {
        fileType = 'unknown';
      }
    } catch (e) {
      console.error("Error detecting file type:", e);
    }
  }

  function handleDownload() {
    if (!$receivedImageURL) return;

    const a = document.createElement('a');
    a.href = $receivedImageURL;
    
    let ext = 'bin';
    if (fileType === 'pdf') {
        ext = 'pdf';
        triggerDownload(a, ext);
    } else if (fileType === 'image') {
        fetch($receivedImageURL).then(r => r.blob()).then(b => {
             if (b.type === 'image/webp') ext = 'webp';
             else if (b.type === 'image/jpeg') ext = 'jpg';
             else ext = 'png';
             triggerDownload(a, ext);
        });
    } else {
        triggerDownload(a, ext);
    }
  }

  function triggerDownload(element, ext) {
    const timestamp = new Date().toISOString().slice(0,19).replace(/[:T]/g,"-");
    element.download = `palimpsest_carrier_${timestamp}.${ext}`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  function handleReply() {
    receivedImageURL.set(null);
    decodedMessage.set('');
    appState.set('composing');
  }
</script>

<div class="card">
  <h2>Message Received</h2>
  <p class="subtitle">A message was decoded from the following carrier sent by {$friendPeerId}:</p>

  <div class="received-content">
    
    {#if $receivedImageURL}
      {#if fileType === 'image'}
        <img src={$receivedImageURL} alt="Received Carrier" />
      {:else if fileType === 'pdf'}
        <div class="pdf-preview">
          <div class="pdf-icon">📄</div>
          <p><strong>PDF Document</strong></p>
          <small>{(blobSize / 1024).toFixed(1)} KB</small>
        </div>
      {/if}
    {/if}

    <div class="decoded-text-box">
      <h3>Decoded Message:</h3>
      <p>{$decodedMessage || "No message found."}</p>
    </div>
  </div>
  
  <div class="action-buttons">
    <button class="secondary-btn" on:click={handleDownload}>Download Carrier File</button>
    <button on:click={handleReply}>Compose a Reply</button>
  </div>
</div>

<style>
  
  .received-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  .pdf-preview {
    background-color: var(--color-input);
    border: 1px solid var(--color-border);
    border-radius: 12px;
    width: 100%;
    padding: 2rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: var(--color-text-primary);
    box-sizing: border-box;
  }

  .pdf-icon {
    font-size: 3rem;
    margin-bottom: 0.5rem;
  }

  .pdf-preview small {
    color: var(--color-text-secondary);
    margin-top: 0.5rem;
  }

  .action-buttons {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: 100%;
  }
</style>