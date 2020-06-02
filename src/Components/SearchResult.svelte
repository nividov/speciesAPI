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

<div class="containerSearch flex">
    <button on:click={() => push("/")} class="material-icons border-none homeButton">home</button>
    <form on:submit|preventDefault={processInput} class="form">
        <input bind:value={$query} type="text" name="latName" class="input" autofocus>
        <div class="material-icons goArrow"> arrow_forward</div>
    </form>
</div>
<!-- <form on:submit|preventDefault={processInput} >
    <input bind:value={$query} type="text" name="latName">
</form> -->

{#if data.matchType === "FUZZY"}
    <div>{get(query)} was not found. Showing results for {data.canonicalName}</div>
{/if}

{#if data.matchType === "EXACT" || data.matchType === "FUZZY"}
    <div class="resultsListBody">
        <div class="text-4xl"><strong>{data.canonicalName}</strong></div>
        <div class="text-xl"><strong>also known as</strong>
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
        <Map heatMap={data.heatMap} />
        <div class="pt-2">
            <div>Images</div>
            <Images imageData={data.images} />
        </div>
    </div>
{:else if data.matchType !== "EXACT" && data.matchType !== "FUZZY"}
    <div>Nothing found for {get(query)}</div>
{/if}

<style>
    .input {
        width: 100%;
        height: 52px;
        font-size: 1.4rem;
        padding-left: 1rem;
        background-color: transparent;
        border-color: transparent;
    }
    input:focus{
        outline: none;
    }
    .containerSearch {
        margin-left:1rem;
        margin-top: 20px;
        margin-bottom: 40px;
        width: 30%;
    }
    .form {
        display: flex;
        background-color: white;
        border-radius: 6px;
        align-items: center;
        cursor: pointer;
        border: 1px solid grey;
        width: 100%;
    }
    .goArrow {
        margin-right: 1rem;
        font-size: 2rem;
    }
    .homeButton {
        margin-right: 1rem;
        font-size: 2rem;
    }
    .resultsListBody {
        margin-left: 2rem;
        margin-right: 8rem;
    }
</style>