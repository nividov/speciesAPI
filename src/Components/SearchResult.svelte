<script>
    import { routing } from "../Modules/routing.js";
    import { onMount } from "svelte";
    import { fetchAll } from "../Modules/requestHandling";
    import Images from "./Images.svelte";
    import Map from "./Map.svelte";
    import Impressum from "./Impressum.svelte";

    //params is the object, where the parameter of the URL is written into
    export let params = {};

    //into data all the information coming from the API call is written
    let data = "";

    //this function is executed, when the component is rendered. It is then responsible for starting the API
    //call with the URL parameter.
    onMount(async () => {
        document.querySelector("#inputField").value = params.first.replace(/_/g, " ");
        let fetchName = params.first.replace(/_/g, "%20");
        data = await fetchAll(fetchName);
    });

    //on the result page, the user can fire another search. This function processes the new
    //input and fires the request.
    async function processInput(){
        let name = document.getElementById("inputField").value;
        let URLname = name.replace(/\s/g, "_");
        if(name === ""){
            return;
        }
        routing.changeTo(`/search/${URLname}`);
        let fetchName = name.replace(/\s/g, "%20");
        data = await fetchAll(fetchName);
    }

    //This function transorms the sceintific name so that it can be used in the Wikipedia URL
    //and opens the appropriate article.
    function openWikipedia() {
        let parameter = data.canonicalName.replace(/%20/g, "_");
        window.open(`https://en.wikipedia.org/wiki/${parameter}`,"_blank");
    }

    //This function is responsible to trigger a new load of data when the user navigates with the
    //back or forward button
    window.addEventListener("hashchange", function(){
        let name = window.location.href;
        let input = document.getElementById("inputField").value.replace(/\s/g, "_");
        if(name.indexOf(input) === -1){
            processBack();
        }
    });
    async function processBack() {
        let URL = window.location.href;
        let name = URL.substring(URL.lastIndexOf("/") + 1)
        console.log(name)
        let fetchName = name.replace(/_/g, "%20");
        document.getElementById("inputField").value = name.replace(/_/g, " ")
        data = await fetchAll(fetchName);
    }

</script>

<div class="containerSearch">
    <div class="flex formContainer">
        <button on:click={() => routing.changeTo("/")} class="material-icons border-none homeButton">home</button>
        <form on:submit|preventDefault={processInput} class="form">
            <input type="text" id="inputField" name="latName" class="input">
            <button class="material-icons goArrow" on:click={processInput}> arrow_forward</button>
        </form>
    </div>
    {#if data.matchType === "FUZZY"}
        <div class="pl-12 pt-2">No results for {params.first.replace(/_/g, " ")}. Showing results for {data.canonicalName} instead</div>
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

        <div>
            <div class="text-2xl mt-8 mb-4">Images</div>
            <Images imageData={data.images} />
        </div>
    </div>
    <div class="footer">
        <div class="gbif">
            Search results kindly provided by gbif.org
        </div>
        <div class="impressum">
            <Impressum />
        </div>
    </div>


{:else if data.matchType !== "EXACT" && data.matchType !== "FUZZY"}
    <div>Nothing found for {params.first.replace(/_/g, " ")}</div>
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
    .footer {
        height: 6rem;
        padding-top: .75rem;
        text-align: center;
        background-color: rgb(0, 132, 255);
        margin-top: 2rem;
    }
    .gbif {
        font-size: 2rem;
        color: white;
    }
    .impressum {
        position: relative;
        bottom: 40px;
        left: calc(100% - 14ch);
        max-width: 12ch;
    }
</style>