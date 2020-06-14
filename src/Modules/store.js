//this js file delivers the store to the components. A store is a value that components can
//subscribe to. This means that every time the value of the store changes, the subscribed component
//get notified about that change and they receive the new value. This way, we can store a
//variable, that is accessible by many components and its value is always consistent.

import { writable } from "svelte/store";

const writableLocalStorage = (key, startValue) => {
  const { subscribe, set } = writable(startValue);

	return {
    subscribe,
    set,
    useLocalStorage: () => {
      const json = localStorage.getItem(key);
      if (json) {
        set(JSON.parse(json));
      }

      subscribe(current => {
        localStorage.setItem(key, JSON.stringify(current));
      });
    }
  };
};

export const query = writableLocalStorage("query", "");