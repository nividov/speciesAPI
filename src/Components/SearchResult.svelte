<script>
    import { push } from "svelte-spa-router";
    import { onMount } from "svelte";
    import { get } from "svelte/store";
    import { fetchAll } from "../Modules/requestHandling";
    import { query } from "../Modules/store";
    import Images from "./Images.svelte";
    import Map from "./Map.svelte";
    query.useLocalStorage();
    export let params = {};

    let data = "";

    onMount(async () => {
        $query = params.first.replace(/%20/g, " ");
        data = await fetchAll(params.first);
        console.log(data);
    });
    
    async function processInput(input){
        let form = input.currentTarget;
        let name = form.elements.namedItem("latName").value;
        let apiRequestName = name.replace(/\s/g, "%20");

        await push(`/search/${apiRequestName}`);
        location.reload();
    }

</script>

<button on:click={() => push("/")}>Home</button>
<form on:submit|preventDefault={processInput} >
    <input bind:value={$query} type="text" name="latName">
</form>

{#if data.matchType === "FUZZY"}
    <div>{get(query)} was not found. Showing results for {data.canonicalName}</div>
{/if}

{#if data.matchType === "EXACT" || data.matchType === "FUZZY"}
    <div>{data.canonicalName}</div>
    <div><strong>also known as</strong>
        {#each data.vernacularNames as name, i}
            &ensp{name}{i === data.vernacularNames.length - 1 ? "." : ","}
        {/each}
    </div>
    <div class="pt-2">
        <div>Classification: </div>
        <ul>
            <li id="Reich">Kingdom: {data.classification.kingdom}</li>
            <li id="Stamm">Phylum: {data.classification.phylum}</li>
            <li id="Klasse">Class: {data.classification.class}</li>
            <li id="Ordnung">Order: {data.classification.order}</li>
            <li id="Familie">Family: {data.classification.family}</li>
            <li id="Gattung">Genus: {data.classification.genus}</li>
            <li id="Art">Species: {data.classification.species}</li>
        </ul>
    </div>
    <div class="block">
        <Map heatMap={data.heatMap} />
    </div>
    <div class="pt-2">
        <div>Images</div>
        <Images imageData={data.images} />
    </div>
{:else if data.matchType !== "EXACT" && data.matchType !== "FUZZY"}
    <div>Nothing found for {get(query)}</div>
{/if}


