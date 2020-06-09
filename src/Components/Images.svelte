<script>

    export let imageData = [];

</script>

<div class="imageContainer">
    {#each imageData as imageData}
        <div class="cont">
            <img class="image" src="{imageData.URL}" alt="bild">
        </div>
    {/each}
</div>

<style>
    .image {
        width: 20rem;
        height: 20rem;
        object-fit: cover;
        padding: 5px;
    }
    .imageContainer {
        display: flex;
        flex-wrap: wrap;
        max-width: 80rem;
    }
</style>

