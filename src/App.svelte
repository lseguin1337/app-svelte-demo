<svelte:options tag="app-workspace" />

<script lang="typescript">
  import { ZoningClient } from '@contentsquare/uxanalytics-client';
  import { ClientFactory, AppContextFactory } from '@uxanalytics/core';
  import Panel from './Panel.svelte';

  const context = AppContextFactory.get();
  const zoningClient = ClientFactory.get(ZoningClient as any);
  // console.log(zoningClient, Panel);
  const zonings$ = zoningClient.getZonings(context.projectId);
</script>

<section>
  <h1>Workspace APP</h1>
  <p>Welcome in the app</p>
  {#await zonings$}
    loading...
  {:then zonings}
    {#each zonings as zoning}
      <div>{zoning.name}</div>
    {/each}
  {:catch e}
    error "{e.message}"
  {/await}
  <Panel></Panel>
</section>

<style>
  h1 {
    color: red;
  }
</style>