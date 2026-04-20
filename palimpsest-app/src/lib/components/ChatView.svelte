<script>
  import { messages, secretMessage, carrierImageFile, friendPeerId, addMessage } from '$lib/store.js';
  import { sendData } from '$lib/webrtc.js';
  import { encodeMessage, decodeMessage } from '$lib/steganography.js';
  import { afterUpdate } from 'svelte';
  import { fade, fly } from 'svelte/transition';

  let isEncoding = false;
  let chatContainer;
  let revealedMessages = {}; 

  afterUpdate(() => {
    if (chatContainer) {
      chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: 'smooth' });
    }
  });

  function handleFileSelect(e) {
    const file = e.target.files[0];
    const validTypes = ['image/png', 'image/webp', 'application/pdf', 'image/jpeg', 'image/jpg'];
    if (file && validTypes.includes(file.type)) {
      carrierImageFile.set(file);
    } else {
      alert('Invalid file type.');
      e.target.value = null;
      carrierImageFile.set(null);
    }
  }

  async function handleSend() {
    if ((!$carrierImageFile && !$secretMessage) || isEncoding) return;
    if (!$carrierImageFile) {
        alert("Please select an image to hide your message in.");
        return;
    }

    isEncoding = true;
    try {
      const encodedBlob = await encodeMessage($carrierImageFile, $secretMessage);
      sendData(encodedBlob);

      const sentUrl = URL.createObjectURL(encodedBlob);
      addMessage('me', $secretMessage, sentUrl); 

      secretMessage.set('');
      carrierImageFile.set(null);
      
      const fileInput = document.getElementById('chat-file-input');
      if (fileInput) fileInput.value = '';
    } catch (error) {
        alert("Send failed: " + error.message);
    } finally {
        isEncoding = false;
    }
  }

  async function downloadImage(url) {
    let ext = 'png'; 
    try {
        const r = await fetch(url);
        const b = await r.blob();
        if (b.type === 'application/pdf') ext = 'pdf';
        else if (b.type === 'image/webp') ext = 'webp';
        else if (b.type === 'image/jpeg') ext = 'jpg';
    } catch (e) {}

    const a = document.createElement('a');
    a.href = url;
    a.download = `palimpsest_${Date.now()}.${ext}`; 
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  async function toggleReveal(msg) {
    if (msg.sender === 'me') return; 
    
    if (revealedMessages[msg.id]) {
        delete revealedMessages[msg.id];
        revealedMessages = { ...revealedMessages }; 
        return;
    }

    try {
        revealedMessages[msg.id] = "Decoding..."; 
        const response = await fetch(msg.image);
        const blob = await response.blob();
        const text = await decodeMessage(blob);
        revealedMessages[msg.id] = text;
    } catch (e) {
        revealedMessages[msg.id] = "Error: " + e.message;
    }
  }

  function handleImageError(event) {
    event.target.style.display = 'none';
    const fallback = event.target.nextElementSibling;
    if (fallback) fallback.style.display = 'flex';
  }
</script>

<div class="chat-container">
  <header class="chat-header">
    <div class="header-info">
      <h2>Secure Channel</h2>
      <div class="connection-status">
        <span class="status-dot"></span>
        <span class="peer-id">Connected to {$friendPeerId}</span>
      </div>
    </div>
  </header>

  <div class="messages-area" bind:this={chatContainer}>
    {#if $messages.length === 0}
      <div class="empty-state" in:fade>
        <span class="empty-icon">🛡️</span>
        <p>Encrypted P2P Tunnel Established</p>
        <small>Messages are transient and exist only in RAM.</small>
      </div>
    {/if}

    {#each $messages as msg (msg.id)}
      <div class="message-row {msg.sender === 'me' ? 'sent' : 'received'}" in:fly="{{ y: 20, duration: 300 }}">
        <div class="message-bubble">
          
          {#if msg.image}
            <div class="media-container" 
                 class:clickable={msg.sender !== 'me'}
                 on:click={() => toggleReveal(msg)} 
                 role="button" 
                 tabindex="0" 
                 on:keypress={()=>{}}>
                 
                <img src={msg.image} alt="Carrier" on:error={handleImageError} class={revealedMessages[msg.id] ? "" : "locked"} />
                
                <div class="file-fallback">
                    <span>📄 File</span>
                </div>

                {#if msg.sender !== 'me' && !revealedMessages[msg.id]}
                    <div class="lock-overlay" transition:fade>
                        <span class="lock-icon">🔒</span>
                        <span class="lock-text">Tap to Decrypt</span>
                    </div>
                {/if}
            </div>
          {/if}
          
          <div class="content-wrapper">
            {#if msg.sender === 'me'}
                <p class="message-text">{msg.text}</p>
            {:else}
                {#if revealedMessages[msg.id]}
                    <p class="message-text revealed" in:fade>{revealedMessages[msg.id]}</p>
                {:else}
                    <p class="message-text hidden">Encrypted Message</p>
                {/if}
            {/if}
          </div>
          
          <div class="message-meta">
            {#if msg.image}
                <button class="action-link" on:click|stopPropagation={() => downloadImage(msg.image)}>Save</button>
                <span class="separator">•</span>
            {/if}
            <span class="timestamp">{new Date(msg.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
          </div>

        </div>
      </div>
    {/each}
  </div>

  <footer class="composer-area">
    <div class="input-bar">
        <label for="chat-file-input" class="attach-btn" title="Attach Image/PDF">
            {#if $carrierImageFile}
                <span class="file-badge">1</span>
            {:else}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
            {/if}
        </label>
        <input id="chat-file-input" type="file" accept="image/png, image/jpeg, image/webp, application/pdf" on:change={handleFileSelect} hidden />
        
        <input 
            class="chat-input" 
            type="text" 
            placeholder={$carrierImageFile ? "Type secret message..." : "Select an image first..."}
            bind:value={$secretMessage} 
            on:keydown={(e) => e.key === 'Enter' && handleSend()}
        />
        
        <button class="chat-send-btn" on:click={handleSend} disabled={isEncoding || !$carrierImageFile || !$secretMessage}>
            {#if isEncoding}
                <span class="loader"></span>
            {:else}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            {/if}
        </button>
    </div>
    {#if $carrierImageFile}
        <div class="attachment-preview" transition:fly={{y:10}}>
            <small>Hiding message inside: <strong>{$carrierImageFile.name}</strong></small>
            <button class="clear-file" on:click={() => carrierImageFile.set(null)}>×</button>
        </div>
    {/if}
  </footer>
</div>