<script>
    import { push } from "svelte-spa-router";
    import { query } from "../Modules/store";

    function processInput(input){
        let form = input.currentTarget;
        let name = form.elements.namedItem("latName").value;
        let apiRequestName = name.replace(/\s/g, "%20");

        push(`/search/${apiRequestName}`);
    }

</script>

<form on:submit|preventDefault={processInput} >
    <div>Your request</div>
    <input bind:value={$query} type="text" name="latName">
</form>