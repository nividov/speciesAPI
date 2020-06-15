<script>
    //this component is responsible for rendering the impressum upon pressing the impressum button
	let impressum = false;
</script>

{#if impressum}
    <div id="impressum-box" class="select-none fixed z-40 mx-auto inset-0">
        <div class="bg-black opacity-50 fixed z-40 mx-auto inset-0 "></div>
        <div class="overlayContainer fixed z-40 mx-auto inset-0 px-16 pt-8 my-16 rounded-lg text-left">
            <div class="flex justify-center text-5xl mb-4">Impressum</div>
            <div>This Website was created as a school project.</div>
            <div class="flex mt-4">
                <div class="flex-1"><strong>Creator contact</strong></div>
                <div class="flex-1">nividov@outlook.com</div>
            </div>
            <div class="flex">
                <div class="flex-1"><strong>School</strong></div>
                <div class="flex-1">OSZ IMT</div>
            </div>
            <div class="flex">
                <div class="flex-1"><strong>Address</strong></div>
                <div class="flex-1">Haarlemer Straße 23-27</div>
            </div>
            <div class="flex">
                <div class="flex-1"></div>
                <div class="flex-1">12359 Berlin</div>
            </div>
            <div class="flex">
                <div class="flex-1"><strong>Email</strong></div>
                <div class="flex-1">webgroup@oszimt.de</div>
            </div>
            <div on:click={() => impressum = false} id="closeButton" class="material-icons z-40 select-none absolute top-0 right-0 mt-2 mr-3 flex justify-center cursor-pointer border-2 border-black rounded-full bg-black text-white">
                close
            </div>
        </div>
    </div>
{/if}

<div class="impressum-button cursor-pointer" id="impressumButton" on:click={() => impressum = true}>Impressum</div>


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