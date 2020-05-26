<script>
    import { push } from "svelte-spa-router";
    import { onMount } from "svelte";
    import { get } from "svelte/store";
    import { fetchAll } from "../Modules/requestHandling";
    import { query } from "../Modules/store";
    import Images from "./Images.svelte";
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
    <div>
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
    <Images imageData={data.images} />
{:else if data.matchType !== ""}
    <div>Nothing found for {get(query)}</div>
{/if}
