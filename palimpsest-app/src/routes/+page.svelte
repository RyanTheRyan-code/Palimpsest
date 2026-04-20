<script>
  import { appState } from '$lib/store.js';
  import '../app.css';

  import ConnectingView from '$lib/components/ConnectingView.svelte';
  import ChatView from '$lib/components/ChatView.svelte';
  import DecryptView from '$lib/components/DecryptView.svelte';

  let currentTab = 'chat'; 
</script>

<main>
  <div class="header">
    <div class="title-row">
        <h1>Palimpsest</h1>
        <div class="nav-toggle">
            <button class:active={currentTab === 'chat'} on:click={() => currentTab = 'chat'}>Chat</button>
            <button class:active={currentTab === 'tools'} on:click={() => currentTab = 'tools'}>Decrypt Tool</button>
        </div>
    </div>
    <p>Secure, Deniable, Peer-to-Peer Messaging</p>
  </div>

  {#if currentTab === 'tools'}
    <DecryptView />
  {:else}
    {#if $appState === 'connecting'}
        <ConnectingView />
    {:else if $appState === 'connected'}
        <ChatView />
    {/if}
  {/if}
</main>