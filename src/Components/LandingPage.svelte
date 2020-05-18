<script>
    import { push } from "svelte-spa-router";



    function processInput(input){

        let form = input.currentTarget;
        let name = form.elements.namedItem("latName").value;
        let apiRequestName = name.replace(/\s/g, "%20");


        push(`/search/${apiRequestName}`);
    }

</script>

<form on:submit|preventDefault={processInput} >
    <div>Your request</div>
    <input type="text" name="latName">
</form>