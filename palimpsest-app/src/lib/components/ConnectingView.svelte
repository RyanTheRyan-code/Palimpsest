<script>
  import { onMount } from 'svelte';
  import { yourPeerId, friendPeerId, connectionStatus } from '$lib/store.js';
  import { initPeer, connectToPeer } from '$lib/webrtc.js';

  let autoConnectTriggered = false;

  onMount(() => {
    initPeer();
    const params = new URLSearchParams(window.location.search);
    const targetId = params.get('connect');
    if (targetId) {
      friendPeerId.set(targetId);
      autoConnectTriggered = true;
    }
  });

  $: if ($yourPeerId && autoConnectTriggered && $friendPeerId) {
      autoConnectTriggered = false; 
      if ($connectionStatus === 'disconnected') {
          setTimeout(() => {
              handleConnect();
          }, 1000); 
      }
  }

  function handleConnect() {
    if (!$friendPeerId) {
      alert("Please enter a friend's Peer ID.");
      return;
    }
    connectToPeer($friendPeerId);
  }

  function cancelConnection() {
    connectionStatus.set('disconnected');
    friendPeerId.set(''); 
  }

  function copyLink() {
    const url = `${window.location.origin}${window.location.pathname}?connect=${$yourPeerId}`;
    navigator.clipboard.writeText(url).then(() => {
      alert("Link copied to clipboard! Send this to your friend.");
    });
  }
</script>

<div class="card">
  <h2>Establish Secure Link</h2>
  <p class="subtitle">Share your Peer ID or Link with a friend to connect.</p>
  
  <div class="peer-id-display">
    <span>Your Peer ID:</span>
    <input type="text" readonly value={$yourPeerId} on:click={e => e.target.select()} />
  </div>

  <div style="margin-bottom: 1rem;">
     <button class="secondary-btn" on:click={copyLink} disabled={!$yourPeerId}>
       🔗 Copy Shareable Link
     </button>
  </div>

  <div class="divider">OR</div>

  <div class="connect-form">
    <input type="text" bind:value={$friendPeerId} placeholder="Enter friend's Peer ID..." />
    
    {#if $connectionStatus === 'connecting'}
      <button class="cancel-btn" on:click={cancelConnection}>Cancel</button>
    {:else}
      <button on:click={handleConnect}>Connect</button>
    {/if}
  </div>
  <div class="status">Status: <span class={$connectionStatus}>{$connectionStatus}</span></div>
</div>