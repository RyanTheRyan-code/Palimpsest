<script>
  import { appState } from '$lib/store.js';

  import ConnectingView from '$lib/components/ConnectingView.svelte';
  import ComposingView from '$lib/components/ComposingView.svelte';
  import ReceivedView from '$lib/components/ReceivedView.svelte';
</script>

<main>
  <div class="header">
    <h1>Palimpsest</h1>
    <p>Secure, Deniable, Peer-to-Peer Messaging</p>
  </div>

  {#if $appState === 'connecting'}
    <ConnectingView />
  {:else if $appState === 'composing'}
    <ComposingView />
  {:else if $appState === 'received'}
    <ReceivedView />
  {/if}
</main>

<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap');

  :global(body) {
    background-color: #1a1a1a;
    color: #e0e0e0;
    font-family: 'Inter', sans-serif;
    margin: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
  }

  main {
    width: 100%;
    max-width: 500px;
    padding: 20px;
    text-align: center;
  }

  .header {
    margin-bottom: 2rem;
  }

  h1 {
    font-size: 2.5rem;
    color: #fff;
    font-weight: 700;
    margin: 0;
  }

  .header p {
    color: #999;
    font-size: 1rem;
  }
</style>

