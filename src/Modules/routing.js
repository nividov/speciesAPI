import { push } from "svelte-spa-router";

export const routing = {
    changeTo(location){
        push(location);
    }
};
