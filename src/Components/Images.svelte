<script>

    export let imageData = [];

</script>

{#if imageData.length === 0}
    <div class="flex">
        <img class="image" src="./images/noImages/sadPanda.jpg" alt="">
        <div class="text-4xl">sorry, no images found</div>
    </div>
{:else}
    <div class="imageContainer">
        {#each imageData as imageData}
            <div class="cont">
                <img class="image" src="{imageData.URL}" alt="bild">
            </div>
        {/each}
    </div>
{/if}

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

