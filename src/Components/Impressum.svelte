<script>
    //this component is responsible for rendering the impressum upon pressing the impressum button
	let impressum = false
</script>

{#if impressum}
    <div id="impressum-box" class="select-none fixed z-40 mx-auto inset-0">
        <div class="bg-black opacity-50 fixed z-40 mx-auto inset-0 "></div>
        <div class="overlayContainer fixed z-40 mx-auto inset-0 px-16 pt-8 my-16 rounded-lg text-center">
            <div class="flex justify-center text-5xl mb-4">Impressum</div>
            <ul>
                <div>Marvin Kobald</div>
                <div>Prager Platz 6, 10779 Berlin</div>
                <div>telefone: +39 329 9692234</div>
                <div>email: marvinkobald@outlook.com</div>
            </ul>
            <div on:click={() => impressum = false} class="material-icons z-40 select-none absolute top-0 right-0 mt-2 mr-3 flex justify-center cursor-pointer border-2 border-black rounded-full bg-blue-300">
                close
            </div>
        </div>
    </div>
{/if}

<div class="impressum-button cursor-pointer" on:click={() => impressum = true}>Impressum</div>


<style>
	.overlayContainer{
		background-color: white;
		color: black;
		height: 25rem;
		max-width: 30rem;
		border-width: 3px;
		border-color: black;
    }
    .impressum-button {
        background-color: white;
        padding: .5rem;
        border: 2px solid black;
        border-radius: 5px;
    }
</style>