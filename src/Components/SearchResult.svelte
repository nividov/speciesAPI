<script>
    import { push } from "svelte-spa-router";
    import { onMount } from "svelte";
    import { get } from "svelte/store";
    import { fetchWithName, fetchAll } from "../Modules/requestHandling";
    import { query } from "../Modules/store";
    query.useLocalStorage();
    export let params = {};

    let data = "";

    onMount(async () => {
        $query = params.first.replace(/%20/g, " ");
        data = await fetchWithName(params.first);
        fetchAll(params.first)
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
            <li id="Reich">Kingdom: {data.kingdom || "... loading ..."}</li>
            <li id="Stamm">Phylum: {data.phylum}</li>
            <li id="Klasse">Class: {data.class}</li>
            <li id="Ordnung">Order: {data.order}</li>
            <li id="Familie">Family: {data.family || "... loading ..."}</li>
            <li id="Gattung">Genus: {data.genus}</li>
            <li id="Art">Species: {data.species}</li>
        </ul>
    </div>
{:else}
    <div>Nothing found for {get(query)}</div>
{/if}
