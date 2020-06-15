<script>
    //heatMap is the parameter of the component that gets passed in.
    //The Map displayed to the user consists of 2 layers: the background and the heatMap.
    //The heatMap is the part that changes.
    export let heatMap
</script>

<div class="text-2xl mb-4 mt-8">Distribution Heat Map</div>

<div class="flex mapBody select-none">
    <div class="relative flex-grow container">
        <div class="over select-none">
            <img src={heatMap.west} alt="">
        </div>
        <div class="under select-none">
            <img src="./images/mapBackground/mapBackground1.png" alt="bild">
        </div>
    </div>
    <div class="relative flex-grow container">
        <div class="over select-none">
            <img src={heatMap.east} alt="">
        </div>
        <div class="under select-none">
            <img src="./images/mapBackground/mapBackground2.png" alt="bild">
        </div>
    </div>
</div>

<style>
    .under {
        width: 100%;
        position: absolute;
        left: 0px;
        top: 0px;
        z-index: 1;
    }
    .over {
        width: 100%;
        position: absolute ;
        left: 0px;
        top: 0px;
        z-index: 2;
    }
    .container {
        padding-top: 50%;
    }
    .mapBody {
        height: 100%;
    }
</style>