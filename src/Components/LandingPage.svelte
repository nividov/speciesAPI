<script>
    import { push } from "svelte-spa-router";
    import { query } from "../Modules/store";

    query.useLocalStorage()

    $query = ""

    function processInput(input){
        let form = input.currentTarget;
        let name = form.elements.namedItem("latName").value;
        let apiRequestName = name.replace(/\s/g, "%20");

        push(`/search/${apiRequestName}`);
    }

</script>

<img src="./images/background/th.jpg" alt="background" id="backgroundImage" class="backgroundImage">
<div class="fixed z-40 containerLanding">
    <div class="text-2xl text-white font-semibold">SpeciesAPI</div>
    <form on:submit|preventDefault={processInput} class="form">
        <input bind:value={$query} type="text" name="latName" class="input" autofocus>
        <div class="material-icons goArrow"> arrow_forward</div>
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
        font-size: 2rem;
    }
</style>
