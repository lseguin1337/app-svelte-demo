<svelte:options tag="workspace-panel" />

<script lang="typescript">
  import { AppContextFactory } from '@uxanalytics/core';

  const context = AppContextFactory.get();
  console.log(context);
</script>

<section>
  <h1>My Panel</h1>
  <p>Welcome the panel</p>
  <csm-button icon="zoning" on:csmClick={() => alert('csm button clicked')}>csm button</csm-button>
</section>

<style>
  h1 { color: green; }
</style>