<script>

    export let heatMap

</script>
    
    
    <div class="flex">
        <div>
            <div class="over">
                <img src={heatMap.west} alt="">
            </div>
            <div class="under">
                <img src="./images/mapBackground/mapBackground1.png" alt="bild">
            </div>
        </div>
        <div>
            <img class="over" src={heatMap.east} alt="">
            <img class="under" src="./images/mapBackground/mapBackground2.png" alt="bild">
        </div>
    </div>



    <style>


    .under {
    position: relative;
    left: 0px;
    top: 0px;
    z-index: 1;
    }

    .over {
    position: relative ;
    left: 0px;
    top: 0px;
    z-index: 2;
    }

</style>