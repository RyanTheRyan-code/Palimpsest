<script>
  import { decodeMessage } from '$lib/steganography.js';
  import { fade, scale } from 'svelte/transition';

  let decodedText = '';
  let errorMsg = '';
  let isProcessing = false;
  let draggedOver = false;
  let fileInput;

  function handleDragOver(e) { e.preventDefault(); draggedOver = true; }
  function handleDragLeave() { draggedOver = false; }
  function handleDrop(e) {
    e.preventDefault(); draggedOver = false;
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }
  function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) processFile(file);
  }

  async function processFile(file) {
    isProcessing = true; errorMsg = ''; decodedText = '';
    if (!file.type.match(/(image\/.*|application\/pdf)/)) {
        errorMsg = "Unsupported file type. Please try PNG, WebP, JPG, or PDF.";
        isProcessing = false; return;
    }
    try {
        const result = await decodeMessage(file);
        if (!result) throw new Error("No hidden message found.");
        decodedText = result;
    } catch (e) {
        errorMsg = e.message;
    } finally {
        isProcessing = false;
    }
  }

  function copyText() {
    navigator.clipboard.writeText(decodedText);
    alert("Copied to clipboard!");
  }
</script>

<div class="decrypt-container" in:fade>
  <h2>Offline Decrypt Tool</h2>
  <p class="subtitle">Drag & drop an image here to reveal its hidden contents.</p>

  <div 
    class="drop-zone" 
    class:active={draggedOver}
    on:dragover={handleDragOver}
    on:dragleave={handleDragLeave}
    on:drop={handleDrop}
    on:click={() => fileInput.click()}
    role="button"
    tabindex="0"
    on:keypress={() => fileInput.click()}
  >
    <input type="file" bind:this={fileInput} hidden accept="image/*,application/pdf" on:change={handleFileSelect} />
    <div class="drop-icon">
        {#if isProcessing}<span class="loader"></span>{:else}🔓{/if}
    </div>
    <p>{isProcessing ? "Analyzing pixels..." : "Drop file or click to upload"}</p>
  </div>

  {#if decodedText}
    <div class="result-card" in:scale>
        <h3>Decoded Message:</h3>
        <div class="code-block">{decodedText}</div>
        <button class="copy-btn" on:click={copyText} style="background:var(--color-accent-secondary); border:none; padding:8px 16px; color:white; border-radius:4px; width:100%; cursor:pointer;">Copy Text</button>
    </div>
  {/if}

  {#if errorMsg}
    <div class="error-msg" in:fade>⚠️ {errorMsg}</div>
  {/if}
</div>