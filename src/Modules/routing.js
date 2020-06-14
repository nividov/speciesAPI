import { push, location } from "svelte-spa-router";

export const routing = {
    changeTo(location){
        push(location);
    },
    location(){
        return location;
    }
};
