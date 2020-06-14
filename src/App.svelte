<script>
	import Tailwindcss from "./Tailwindcss.svelte";
	import Router from "svelte-spa-router";
	import LandingPage from "./Components/LandingPage.svelte";
	import SearchResult from "./Components/SearchResult.svelte";

	//here the routes for the single page apllication are defined. The second route leads
	//to the component SearchResult and can render it with a parameter, called 'first'. So
	//whatever stands in the URL at the position of 'first', will be passed as parameter.
	const routes = {
		"/": LandingPage,
		"/search/:first": SearchResult
	};
</script>

<Tailwindcss />

<Router {routes} />