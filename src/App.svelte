<script>
	import Tailwindcss from "./Tailwindcss.svelte";
	import Router from "svelte-spa-router";
	import LandingPage from "./Components/LandingPage.svelte";

	const routes = {
		"/": LandingPage
	};
</script>



<Tailwindcss />

<Router {routes} />