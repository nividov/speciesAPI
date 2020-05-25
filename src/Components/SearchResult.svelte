<script>
    import { push } from "svelte-spa-router";
    import { onMount } from "svelte";
    import { fetchWithName } from "../Modules/requestHandling";
    import { query } from "../Modules/store";

    export let params = {};

    let requestSuccess = false;
    let data = "";
1
    onMount(async () => {
        data = await fetchWithName(params.first);
        await checkData(data)
    });

    function checkData(data){
        if(data.matchType === "NONE"){

        } else if (data.matchType === "FUZZY"){
            
        } else if (data.matchType === "EXACT"){

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
<div id="hi">Your match type is: {data.matchType} </div>
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
