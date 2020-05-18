<script>
    import {onMount} from "svelte";
    import { newFetch } from "../Modules/requestHandling";

    export let params = {};
    let data = "";

    onMount(async () => {
        let dat = await newFetch(params.first);
        data = await dat.kingdom;
    });
    

</script>


<div id="hi">Your name is: {data} </div>
