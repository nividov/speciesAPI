<script>
    //imageData is the parameter for this compnent.
    export let imageData = [];

    //the functions are responsible for showing copyright information upon hovering an image
    function handleHover(imageData){
        document.querySelector("#infobox").classList.remove("hidden")
        document.querySelector("#infobox").innerHTML = `${imageData.license || ""} ${imageData.rightsHolder || ""}. Source by ${imageData.source}`
    }
    function handleLeave(){
        document.querySelector("#infobox").classList.add("hidden")
    }

</script>

<!-- if no image is present in the database, a dummy is loaded -->
{#if imageData.length === 0}
    <div class="flex">
        <img class="image" src="./images/noImages/sadPanda.jpg" alt="">
        <div class="text-4xl">sorry, no images found</div>
    </div>
{:else}
    <div class="imageContainer" on:mouseleave={handleLeave}>
        {#each imageData as imageData}
            <div class="cont">
                <img class="image noDrag" src="{imageData.URL}" alt="bild" on:mouseenter={() => handleHover(imageData)}>
            </div>
        {/each}
        <div class="info hidden" id="infobox"></div>
    </div>
{/if}


<style>
    .cont {
        position: relative;
    }
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
    .info {
        font-size: 1.2rem;
        position: fixed;
        width: 80%;
        margin-left: 10%;
        height: 50px;
        bottom: 10px;
        left: 0px;
        padding-top:5px;
        padding-bottom: 25px;
        background-color: white;
        border: 3px solid black;
        border-radius: 15px;
        text-align: center;
        vertical-align: text-bottom;
        z-index: 2;
        overflow: hidden;
    }
    .noDrag{
        user-select: none;
        -moz-user-select: none;
        -webkit-user-drag: none;
        -webkit-user-select: none;
        -ms-user-select: none;
    }
</style>

