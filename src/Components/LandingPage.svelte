<script>
    import { push } from "svelte-spa-router";
    import { query } from "../Modules/store";

    query.useLocalStorage();

    $query = "";

    function processInput(input){
        let form = input.currentTarget;
        let name = form.elements.namedItem("latName").value;
        let apiRequestName = name.replace(/\s/g, "%20");
        if(name === ""){
            return;
        }
        push(`/search/${apiRequestName}`);
    }

    function getRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    let rand = getRandomInt(1, 10);

</script>

<img src="./images/background/bg{rand}.jpg" alt="background" id="backgroundImage" class="backgroundImage">
<div class="fixed z-40 containerLanding select-none">
    <div class="text-2xl {rand === 1 ? "" : "text-white"} font-semibold">SpeciesINFO</div>
    <form on:submit|preventDefault={processInput} class="form" name="landing-form">
        <input bind:value={$query} type="text" name="latName" class="input">
        <button class="material-icons goArrow" on:click={processInput}> arrow_forward </button>
    </form>
</div>

<style>
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
</style>
