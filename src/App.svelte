<script>
	import Tailwindcss from "./Tailwindcss.svelte";
	import Router from "svelte-spa-router";
	import LandingPage from "./Components/LandingPage.svelte";
	import SearchResult from "./Components/SearchResult.svelte";

	const routes = {
		"/": LandingPage,
		"/search/:first": SearchResult
	};
</script>



<Tailwindcss />

<Router {routes} />