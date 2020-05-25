<script>
    import { push } from "svelte-spa-router";
    import { onMount } from "svelte";
    import { get } from "svelte/store";
    import { fetchWithName } from "../Modules/requestHandling";
    import { query } from "../Modules/store";
    query.useLocalStorage();
    export let params = {};

    let requestSuccess = false;
    let data = "";

    onMount(async () => {
        data = await fetchWithName(params.first);
        await checkData(data)
    });

    function checkData(data){
        if(data.matchType === "NONE"){
            console.log("not nice")
        } else if (data.matchType === "FUZZY"){
            console.log("medium nice")
        } else if (data.matchType === "EXACT"){
            console.log("nice")
        }
    };
    
    async function processInput(input){
        let form = input.currentTarget;
        let name = form.elements.namedItem("latName").value;
        let apiRequestName = name.replace(/\s/g, "%20");

        await push(`/search/${apiRequestName}`);
        location.reload();
    }

</script>

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
            <li id="Stamm"></li>
            <li id="Klasse"></li>
            <li id="Ordnung"></li>
            <li id="Familie">Family: {data.family || "... loading ..."}</li>
            <li id="Gattung"></li>
            <li id="Art"></li>
        </ul>
    </div>
{/if}

{#if data.matchType === "NONE"}
    <div>Nothing found for {get(query)}</div>
{/if}

