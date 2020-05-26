<script>

    export let imageData = []

</script>


{#each imageData as imageData}

    <img src="{imageData.URL}" alt="bild">

{/each}

