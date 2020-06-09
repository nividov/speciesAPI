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

    function openWikipedia() {
        let parameter = data.canonicalName.replace(/%20/g, "_");
        window.open(`https://en.wikipedia.org/wiki/${parameter}`,"_blank")
    }

</script>

<div class="containerSearch">
    <div class="flex formContainer">
        <button on:click={() => push("/")} class="material-icons border-none homeButton">home</button>
        <form on:submit|preventDefault={processInput} class="form">
            <input bind:value={$query} type="text" name="latName" class="input" autofocus>
            <button class="material-icons goArrow" on:click={processInput}> arrow_forward</button>
        </form>
    </div>
    {#if data.matchType === "FUZZY"}
        <div class="pl-12 pt-2">No results for {get(query)}. Showing results for {data.canonicalName} instead</div>
    {/if}
</div>


{#if data.matchType === "EXACT" || data.matchType === "FUZZY"}
    <div class="resultsListBody">
        <div class="text-4xl"><strong>{data.canonicalName}</strong></div>
        <div class="text-xl mb-4"><strong>also known as</strong>
            {#each data.vernacularNames as name, i}
                &ensp{name}{i === data.vernacularNames.length - 1 ? "." : ","}
            {/each}
        </div>
        <div on:click={openWikipedia} class="cursor-pointer flex mb-4">
            <img id="wikipediaLogo" src="./images/Wikipedia/wikipedia.ico" alt="wikipedia_logo">
            <div class="text-xl pl-2">show Wikipedia article</div>
        </div>
        <div class="">
            <div class="text-2xl mb-2"> Classification </div>
            <ul class="text-xl">
                <li id="Reich">Kingdom: {data.classification.kingdom}</li>
                <li id="Stamm">Phylum: {data.classification.phylum}</li>
                <li id="Klasse">Class: {data.classification.class}</li>
                <li id="Ordnung">Order: {data.classification.order}</li>
                <li id="Familie">Family: {data.classification.family}</li>
                <li id="Gattung">Genus: {data.classification.genus}</li>
                <li id="Art">Species: {data.classification.species}</li>
            </ul>
        </div>
        <div>
            <Map heatMap={data.heatMap} />
        </div>

        <div class="pt-2">
            <div class="text-2xl">Images</div>
            <Images imageData={data.images} />
        </div>
    </div>
{:else if data.matchType !== "EXACT" && data.matchType !== "FUZZY"}
    <div>Nothing found for {get(query)}</div>
{/if}

<style>
    .formContainer{
        max-width: 30rem;
    }
    #wikipediaLogo{
        height: 2rem;
    }
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
        background-color: rgb(189, 189, 189);
        padding-left:1rem;
        padding-top: 30px;
        padding-bottom: 30px;
        width: 100%;
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
        border: none;
        height: 100%;
    }
    .homeButton {
        margin-right: 1rem;
        font-size: 2rem;
    }
    .resultsListBody {
        margin-top: 1.5rem;
        margin-left: 4rem;
        margin-right: 8rem;
        max-width: 80rem;
    }
</style>