<!-- handles UI for establishing a connection -->
<script>
  import { onMount } from 'svelte';
  import { appState, yourPeerId, friendPeerId, connectionStatus } from '$lib/store.js';

  onMount(() => {
    setTimeout(() => {
      $yourPeerId = 'peer-' + Math.random().toString(36).substring(2, 9);
    }, 1500);
  });

  function handleConnect() {
    if (!$friendPeerId) {
      alert("Please enter a friend's Peer ID.");
      return;
    }
    $connectionStatus = 'connecting';
    setTimeout(() => {
      $connectionStatus = 'connected';
      $appState = 'composing';
    }, 2000);
  }
</script>

<div class="card">
  <h2>Establish Secure Link</h2>
  <p class="subtitle">Share your Peer ID with a friend, then enter their ID to connect.</p>
  
  <div class="peer-id-display">
    <span>Your Peer ID:</span>
    <input type="text" readonly value={$yourPeerId} on:click={e => e.target.select()} />
  </div>

  <div class="connect-form">
    <input type="text" bind:value={$friendPeerId} placeholder="Enter friend's Peer ID..." />
    <button on:click={handleConnect} disabled={$connectionStatus === 'connecting'}>
      {#if $connectionStatus === 'connecting'}Connecting...{:else}Connect{/if}
    </button>
  </div>
  <div class="status">Status: <span class={$connectionStatus}>{$connectionStatus}</span></div>
</div>
