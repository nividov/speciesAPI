<script>
    import { routing } from "../Modules/routing.js";
    import Impressum from "./Impressum.svelte";

    //upon submitting the search form, the input is first processed and brought into the correct
    //format so that it can be written into the request URL
    let input = "";
    let showSugg = false;

    function processInput(){
        let name = document.getElementById("landingInput").value;
        let URLname = input.replace(/\s/g, "_");
        if(input === ""){
            return;
        }
        routing.changeTo(`/search/${URLname}`);
    }

    //this logic is responsible for delivering a random number that is used to determine
    //the background image.
    function getRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    let rand = getRandomInt(1, 10);

</script>

<img src="./images/background/bg{rand}.jpg" alt="background" id="backgroundImage" class="backgroundImage noDrag">
<div class="fixed z-40 containerLanding select-none">
    <div class="text-2xl {rand === 1 ? "" : "text-white"} font-semibold">SpeciesINFO</div>
    <form on:submit|preventDefault={processInput} class="form" name="landing-form">
        <input on:focus={() => {showSugg = true}} type="text" bind:value={input} name="latName" id="landingInput" class="input" placeholder="eg. Turdus merula" autocomplete="off">
        <button class="material-icons goArrow" id="landingSubmit" on:click={processInput}> arrow_forward </button>
    </form>
    {#if showSugg}
        <div class="suggestions">
            <div class="titel">Try:</div>
            <div class="item" on:click={() => {input = "Turdus merula"; processInput();}}>Turdus merula</div>
            <div class="item" on:click={() => {input = "Panthera tigris"; processInput();}}>Panthera tigris</div>
            <div class="item" on:click={() => {input = "Apis mellifera"; processInput();}}>Apis mellifera</div>
        </div>
    {/if}
</div>

<div class="impressum">
    <Impressum />
</div>


<style>
    .suggestions {
        background: white;
        border-radius: 6px;
        padding: 5px;
        margin-top: 5px;
    }
    .suggestions .titel {
        font-size: 1.5rem;
        margin-bottom: 2px;
    }
    .suggestions .item {
        font-size: 1.2rem;
        padding-top: 2px;
        padding-bottom: 2px;
        cursor: pointer;
    }
    .backgroundImage {
		height: 100%;
		min-width: 100%;
		position: fixed;
		top: 0;
		left: 0;
		object-fit: cover;
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
    .containerLanding {
        margin-left:5rem;
        margin-top: 100px;
        width: 30%;
    }
    .form {
        display: flex;
        background-color: white;
        border-radius: 6px;
        align-items: center;
        cursor: pointer;
    }
    .goArrow {
        margin-right: 1rem;
        margin-left: 1rem;
        font-size: 2rem;
        border: none;
        height: 52px;
    }
    .goArrow:focus {
        border: 2px solid black
    }
    .impressum {
        position: absolute;
        left: calc(100% - 14ch);
        bottom: 10px;
        max-width: 12ch;
    }
    .noDrag{
        user-select: none;
        -moz-user-select: none;
        -webkit-user-drag: none;
        -webkit-user-select: none;
        -ms-user-select: none;
    }

</style>
