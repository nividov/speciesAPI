
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            callbacks.slice().forEach(fn => fn(event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.21.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src\Tailwindcss.svelte generated by Svelte v3.21.0 */

    function create_fragment(ctx) {
    	const block = {
    		c: noop,
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Tailwindcss> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Tailwindcss", $$slots, []);
    	return [];
    }

    class Tailwindcss extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Tailwindcss",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe,
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
    }

    function regexparam (str, loose) {
    	if (str instanceof RegExp) return { keys:false, pattern:str };
    	var c, o, tmp, ext, keys=[], pattern='', arr = str.split('/');
    	arr[0] || arr.shift();

    	while (tmp = arr.shift()) {
    		c = tmp[0];
    		if (c === '*') {
    			keys.push('wild');
    			pattern += '/(.*)';
    		} else if (c === ':') {
    			o = tmp.indexOf('?', 1);
    			ext = tmp.indexOf('.', 1);
    			keys.push( tmp.substring(1, !!~o ? o : !!~ext ? ext : tmp.length) );
    			pattern += !!~o && !~ext ? '(?:/([^/]+?))?' : '/([^/]+?)';
    			if (!!~ext) pattern += (!!~o ? '?' : '') + '\\' + tmp.substring(ext);
    		} else {
    			pattern += '/' + tmp;
    		}
    	}

    	return {
    		keys: keys,
    		pattern: new RegExp('^' + pattern + (loose ? '(?=$|\/)' : '\/?$'), 'i')
    	};
    }

    /* node_modules\svelte-spa-router\Router.svelte generated by Svelte v3.21.0 */

    const { Error: Error_1, Object: Object_1, console: console_1 } = globals;

    // (209:0) {:else}
    function create_else_block(ctx) {
    	let switch_instance_anchor;
    	let current;
    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		return { $$inline: true };
    	}

    	if (switch_value) {
    		var switch_instance = new switch_value(switch_props());
    		switch_instance.$on("routeEvent", /*routeEvent_handler_1*/ ctx[10]);
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					switch_instance.$on("routeEvent", /*routeEvent_handler_1*/ ctx[10]);
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(209:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (207:0) {#if componentParams}
    function create_if_block(ctx) {
    	let switch_instance_anchor;
    	let current;
    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		return {
    			props: { params: /*componentParams*/ ctx[1] },
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		var switch_instance = new switch_value(switch_props(ctx));
    		switch_instance.$on("routeEvent", /*routeEvent_handler*/ ctx[9]);
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = {};
    			if (dirty & /*componentParams*/ 2) switch_instance_changes.params = /*componentParams*/ ctx[1];

    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props(ctx));
    					switch_instance.$on("routeEvent", /*routeEvent_handler*/ ctx[9]);
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(207:0) {#if componentParams}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*componentParams*/ ctx[1]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error_1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function wrap(route, userData, ...conditions) {
    	// Check if we don't have userData
    	if (userData && typeof userData == "function") {
    		conditions = conditions && conditions.length ? conditions : [];
    		conditions.unshift(userData);
    		userData = undefined;
    	}

    	// Parameter route and each item of conditions must be functions
    	if (!route || typeof route != "function") {
    		throw Error("Invalid parameter route");
    	}

    	if (conditions && conditions.length) {
    		for (let i = 0; i < conditions.length; i++) {
    			if (!conditions[i] || typeof conditions[i] != "function") {
    				throw Error("Invalid parameter conditions[" + i + "]");
    			}
    		}
    	}

    	// Returns an object that contains all the functions to execute too
    	const obj = { route, userData };

    	if (conditions && conditions.length) {
    		obj.conditions = conditions;
    	}

    	// The _sveltesparouter flag is to confirm the object was created by this router
    	Object.defineProperty(obj, "_sveltesparouter", { value: true });

    	return obj;
    }

    /**
     * @typedef {Object} Location
     * @property {string} location - Location (page/view), for example `/book`
     * @property {string} [querystring] - Querystring from the hash, as a string not parsed
     */
    /**
     * Returns the current location from the hash.
     *
     * @returns {Location} Location object
     * @private
     */
    function getLocation() {
    	const hashPosition = window.location.href.indexOf("#/");

    	let location = hashPosition > -1
    	? window.location.href.substr(hashPosition + 1)
    	: "/";

    	// Check if there's a querystring
    	const qsPosition = location.indexOf("?");

    	let querystring = "";

    	if (qsPosition > -1) {
    		querystring = location.substr(qsPosition + 1);
    		location = location.substr(0, qsPosition);
    	}

    	return { location, querystring };
    }

    const loc = readable(getLocation(), // eslint-disable-next-line prefer-arrow-callback
    function start(set) {
    	const update = () => {
    		set(getLocation());
    	};

    	window.addEventListener("hashchange", update, false);

    	return function stop() {
    		window.removeEventListener("hashchange", update, false);
    	};
    });

    const location = derived(loc, $loc => $loc.location);
    const querystring = derived(loc, $loc => $loc.querystring);

    function push(location) {
    	if (!location || location.length < 1 || location.charAt(0) != "/" && location.indexOf("#/") !== 0) {
    		throw Error("Invalid parameter location");
    	}

    	// Execute this code when the current call stack is complete
    	return nextTickPromise(() => {
    		window.location.hash = (location.charAt(0) == "#" ? "" : "#") + location;
    	});
    }

    function pop() {
    	// Execute this code when the current call stack is complete
    	return nextTickPromise(() => {
    		window.history.back();
    	});
    }

    function replace(location) {
    	if (!location || location.length < 1 || location.charAt(0) != "/" && location.indexOf("#/") !== 0) {
    		throw Error("Invalid parameter location");
    	}

    	// Execute this code when the current call stack is complete
    	return nextTickPromise(() => {
    		const dest = (location.charAt(0) == "#" ? "" : "#") + location;

    		try {
    			window.history.replaceState(undefined, undefined, dest);
    		} catch(e) {
    			// eslint-disable-next-line no-console
    			console.warn("Caught exception while replacing the current page. If you're running this in the Svelte REPL, please note that the `replace` method might not work in this environment.");
    		}

    		// The method above doesn't trigger the hashchange event, so let's do that manually
    		window.dispatchEvent(new Event("hashchange"));
    	});
    }

    function link(node) {
    	// Only apply to <a> tags
    	if (!node || !node.tagName || node.tagName.toLowerCase() != "a") {
    		throw Error("Action \"link\" can only be used with <a> tags");
    	}

    	// Destination must start with '/'
    	const href = node.getAttribute("href");

    	if (!href || href.length < 1 || href.charAt(0) != "/") {
    		throw Error("Invalid value for \"href\" attribute");
    	}

    	// Add # to every href attribute
    	node.setAttribute("href", "#" + href);
    }

    function nextTickPromise(cb) {
    	return new Promise(resolve => {
    			setTimeout(
    				() => {
    					resolve(cb());
    				},
    				0
    			);
    		});
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let $loc,
    		$$unsubscribe_loc = noop;

    	validate_store(loc, "loc");
    	component_subscribe($$self, loc, $$value => $$invalidate(4, $loc = $$value));
    	$$self.$$.on_destroy.push(() => $$unsubscribe_loc());
    	let { routes = {} } = $$props;
    	let { prefix = "" } = $$props;

    	/**
     * Container for a route: path, component
     */
    	class RouteItem {
    		/**
     * Initializes the object and creates a regular expression from the path, using regexparam.
     *
     * @param {string} path - Path to the route (must start with '/' or '*')
     * @param {SvelteComponent} component - Svelte component for the route
     */
    		constructor(path, component) {
    			if (!component || typeof component != "function" && (typeof component != "object" || component._sveltesparouter !== true)) {
    				throw Error("Invalid component object");
    			}

    			// Path must be a regular or expression, or a string starting with '/' or '*'
    			if (!path || typeof path == "string" && (path.length < 1 || path.charAt(0) != "/" && path.charAt(0) != "*") || typeof path == "object" && !(path instanceof RegExp)) {
    				throw Error("Invalid value for \"path\" argument");
    			}

    			const { pattern, keys } = regexparam(path);
    			this.path = path;

    			// Check if the component is wrapped and we have conditions
    			if (typeof component == "object" && component._sveltesparouter === true) {
    				this.component = component.route;
    				this.conditions = component.conditions || [];
    				this.userData = component.userData;
    			} else {
    				this.component = component;
    				this.conditions = [];
    				this.userData = undefined;
    			}

    			this._pattern = pattern;
    			this._keys = keys;
    		}

    		/**
     * Checks if `path` matches the current route.
     * If there's a match, will return the list of parameters from the URL (if any).
     * In case of no match, the method will return `null`.
     *
     * @param {string} path - Path to test
     * @returns {null|Object.<string, string>} List of paramters from the URL if there's a match, or `null` otherwise.
     */
    		match(path) {
    			// If there's a prefix, remove it before we run the matching
    			if (prefix && path.startsWith(prefix)) {
    				path = path.substr(prefix.length) || "/";
    			}

    			// Check if the pattern matches
    			const matches = this._pattern.exec(path);

    			if (matches === null) {
    				return null;
    			}

    			// If the input was a regular expression, this._keys would be false, so return matches as is
    			if (this._keys === false) {
    				return matches;
    			}

    			const out = {};
    			let i = 0;

    			while (i < this._keys.length) {
    				out[this._keys[i]] = matches[++i] || null;
    			}

    			return out;
    		}

    		/**
     * Dictionary with route details passed to the pre-conditions functions, as well as the `routeLoaded` and `conditionsFailed` events
     * @typedef {Object} RouteDetail
     * @property {SvelteComponent} component - Svelte component
     * @property {string} name - Name of the Svelte component
     * @property {string} location - Location path
     * @property {string} querystring - Querystring from the hash
     * @property {Object} [userData] - Custom data passed by the user
     */
    		/**
     * Executes all conditions (if any) to control whether the route can be shown. Conditions are executed in the order they are defined, and if a condition fails, the following ones aren't executed.
     * 
     * @param {RouteDetail} detail - Route detail
     * @returns {bool} Returns true if all the conditions succeeded
     */
    		checkConditions(detail) {
    			for (let i = 0; i < this.conditions.length; i++) {
    				if (!this.conditions[i](detail)) {
    					return false;
    				}
    			}

    			return true;
    		}
    	}

    	// Set up all routes
    	const routesList = [];

    	if (routes instanceof Map) {
    		// If it's a map, iterate on it right away
    		routes.forEach((route, path) => {
    			routesList.push(new RouteItem(path, route));
    		});
    	} else {
    		// We have an object, so iterate on its own properties
    		Object.keys(routes).forEach(path => {
    			routesList.push(new RouteItem(path, routes[path]));
    		});
    	}

    	// Props for the component to render
    	let component = null;

    	let componentParams = null;

    	// Event dispatcher from Svelte
    	const dispatch = createEventDispatcher();

    	// Just like dispatch, but executes on the next iteration of the event loop
    	const dispatchNextTick = (name, detail) => {
    		// Execute this code when the current call stack is complete
    		setTimeout(
    			() => {
    				dispatch(name, detail);
    			},
    			0
    		);
    	};

    	const writable_props = ["routes", "prefix"];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Router> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Router", $$slots, []);

    	function routeEvent_handler(event) {
    		bubble($$self, event);
    	}

    	function routeEvent_handler_1(event) {
    		bubble($$self, event);
    	}

    	$$self.$set = $$props => {
    		if ("routes" in $$props) $$invalidate(2, routes = $$props.routes);
    		if ("prefix" in $$props) $$invalidate(3, prefix = $$props.prefix);
    	};

    	$$self.$capture_state = () => ({
    		readable,
    		derived,
    		wrap,
    		getLocation,
    		loc,
    		location,
    		querystring,
    		push,
    		pop,
    		replace,
    		link,
    		nextTickPromise,
    		createEventDispatcher,
    		regexparam,
    		routes,
    		prefix,
    		RouteItem,
    		routesList,
    		component,
    		componentParams,
    		dispatch,
    		dispatchNextTick,
    		$loc
    	});

    	$$self.$inject_state = $$props => {
    		if ("routes" in $$props) $$invalidate(2, routes = $$props.routes);
    		if ("prefix" in $$props) $$invalidate(3, prefix = $$props.prefix);
    		if ("component" in $$props) $$invalidate(0, component = $$props.component);
    		if ("componentParams" in $$props) $$invalidate(1, componentParams = $$props.componentParams);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*component, $loc*/ 17) {
    			// Handle hash change events
    			// Listen to changes in the $loc store and update the page
    			 {
    				// Find a route matching the location
    				$$invalidate(0, component = null);

    				let i = 0;

    				while (!component && i < routesList.length) {
    					const match = routesList[i].match($loc.location);

    					if (match) {
    						const detail = {
    							component: routesList[i].component,
    							name: routesList[i].component.name,
    							location: $loc.location,
    							querystring: $loc.querystring,
    							userData: routesList[i].userData
    						};

    						// Check if the route can be loaded - if all conditions succeed
    						if (!routesList[i].checkConditions(detail)) {
    							// Trigger an event to notify the user
    							dispatchNextTick("conditionsFailed", detail);

    							break;
    						}

    						$$invalidate(0, component = routesList[i].component);

    						// Set componentParams onloy if we have a match, to avoid a warning similar to `<Component> was created with unknown prop 'params'`
    						// Of course, this assumes that developers always add a "params" prop when they are expecting parameters
    						if (match && typeof match == "object" && Object.keys(match).length) {
    							$$invalidate(1, componentParams = match);
    						} else {
    							$$invalidate(1, componentParams = null);
    						}

    						dispatchNextTick("routeLoaded", detail);
    					}

    					i++;
    				}
    			}
    		}
    	};

    	return [
    		component,
    		componentParams,
    		routes,
    		prefix,
    		$loc,
    		RouteItem,
    		routesList,
    		dispatch,
    		dispatchNextTick,
    		routeEvent_handler,
    		routeEvent_handler_1
    	];
    }

    class Router extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { routes: 2, prefix: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Router",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get routes() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set routes(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get prefix() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set prefix(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const routing = {
        changeTo(location){
            push(location);
        }
    };

    /* src\Components\Impressum.svelte generated by Svelte v3.21.0 */

    const file = "src\\Components\\Impressum.svelte";

    // (6:0) {#if impressum}
    function create_if_block$1(ctx) {
    	let div20;
    	let div0;
    	let t0;
    	let div19;
    	let div1;
    	let t2;
    	let div2;
    	let t4;
    	let div5;
    	let div3;
    	let strong0;
    	let t6;
    	let div4;
    	let t8;
    	let div8;
    	let div6;
    	let strong1;
    	let t10;
    	let div7;
    	let t12;
    	let div11;
    	let div9;
    	let strong2;
    	let t14;
    	let div10;
    	let t16;
    	let div14;
    	let div12;
    	let t17;
    	let div13;
    	let t19;
    	let div17;
    	let div15;
    	let strong3;
    	let t21;
    	let div16;
    	let t23;
    	let div18;
    	let dispose;

    	const block = {
    		c: function create() {
    			div20 = element("div");
    			div0 = element("div");
    			t0 = space();
    			div19 = element("div");
    			div1 = element("div");
    			div1.textContent = "Impressum";
    			t2 = space();
    			div2 = element("div");
    			div2.textContent = "This Website was created as a school project.";
    			t4 = space();
    			div5 = element("div");
    			div3 = element("div");
    			strong0 = element("strong");
    			strong0.textContent = "Creator contact";
    			t6 = space();
    			div4 = element("div");
    			div4.textContent = "nividov@outlook.com";
    			t8 = space();
    			div8 = element("div");
    			div6 = element("div");
    			strong1 = element("strong");
    			strong1.textContent = "School";
    			t10 = space();
    			div7 = element("div");
    			div7.textContent = "OSZ IMT";
    			t12 = space();
    			div11 = element("div");
    			div9 = element("div");
    			strong2 = element("strong");
    			strong2.textContent = "Address";
    			t14 = space();
    			div10 = element("div");
    			div10.textContent = "Haarlemer Straße 23-27";
    			t16 = space();
    			div14 = element("div");
    			div12 = element("div");
    			t17 = space();
    			div13 = element("div");
    			div13.textContent = "12359 Berlin";
    			t19 = space();
    			div17 = element("div");
    			div15 = element("div");
    			strong3 = element("strong");
    			strong3.textContent = "Email";
    			t21 = space();
    			div16 = element("div");
    			div16.textContent = "webgroup@oszimt.de";
    			t23 = space();
    			div18 = element("div");
    			div18.textContent = "close";
    			attr_dev(div0, "class", "bg-black opacity-50 fixed z-40 mx-auto inset-0 ");
    			add_location(div0, file, 7, 8, 250);
    			attr_dev(div1, "class", "flex justify-center text-5xl mb-4");
    			add_location(div1, file, 9, 12, 436);
    			add_location(div2, file, 10, 12, 512);
    			add_location(strong0, file, 12, 36, 643);
    			attr_dev(div3, "class", "flex-1");
    			add_location(div3, file, 12, 16, 623);
    			attr_dev(div4, "class", "flex-1");
    			add_location(div4, file, 13, 16, 699);
    			attr_dev(div5, "class", "flex mt-4");
    			add_location(div5, file, 11, 12, 582);
    			add_location(strong1, file, 16, 36, 834);
    			attr_dev(div6, "class", "flex-1");
    			add_location(div6, file, 16, 16, 814);
    			attr_dev(div7, "class", "flex-1");
    			add_location(div7, file, 17, 16, 881);
    			attr_dev(div8, "class", "flex");
    			add_location(div8, file, 15, 12, 778);
    			add_location(strong2, file, 20, 36, 1004);
    			attr_dev(div9, "class", "flex-1");
    			add_location(div9, file, 20, 16, 984);
    			attr_dev(div10, "class", "flex-1");
    			add_location(div10, file, 21, 16, 1052);
    			attr_dev(div11, "class", "flex");
    			add_location(div11, file, 19, 12, 948);
    			attr_dev(div12, "class", "flex-1");
    			add_location(div12, file, 24, 16, 1170);
    			attr_dev(div13, "class", "flex-1");
    			add_location(div13, file, 25, 16, 1214);
    			attr_dev(div14, "class", "flex");
    			add_location(div14, file, 23, 12, 1134);
    			add_location(strong3, file, 28, 36, 1342);
    			attr_dev(div15, "class", "flex-1");
    			add_location(div15, file, 28, 16, 1322);
    			attr_dev(div16, "class", "flex-1");
    			add_location(div16, file, 29, 16, 1388);
    			attr_dev(div17, "class", "flex");
    			add_location(div17, file, 27, 12, 1286);
    			attr_dev(div18, "id", "closeButton");
    			attr_dev(div18, "class", "material-icons z-40 select-none absolute top-0 right-0 mt-2 mr-3 flex justify-center cursor-pointer border-2 border-black rounded-full bg-black text-white");
    			add_location(div18, file, 31, 12, 1466);
    			attr_dev(div19, "class", "overlayContainer fixed z-40 mx-auto inset-0 px-16 pt-8 my-16 rounded-lg text-left svelte-1p06u1e");
    			add_location(div19, file, 8, 8, 327);
    			attr_dev(div20, "id", "impressum-box");
    			attr_dev(div20, "class", "select-none fixed z-40 mx-auto inset-0");
    			add_location(div20, file, 6, 4, 169);
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, div20, anchor);
    			append_dev(div20, div0);
    			append_dev(div20, t0);
    			append_dev(div20, div19);
    			append_dev(div19, div1);
    			append_dev(div19, t2);
    			append_dev(div19, div2);
    			append_dev(div19, t4);
    			append_dev(div19, div5);
    			append_dev(div5, div3);
    			append_dev(div3, strong0);
    			append_dev(div5, t6);
    			append_dev(div5, div4);
    			append_dev(div19, t8);
    			append_dev(div19, div8);
    			append_dev(div8, div6);
    			append_dev(div6, strong1);
    			append_dev(div8, t10);
    			append_dev(div8, div7);
    			append_dev(div19, t12);
    			append_dev(div19, div11);
    			append_dev(div11, div9);
    			append_dev(div9, strong2);
    			append_dev(div11, t14);
    			append_dev(div11, div10);
    			append_dev(div19, t16);
    			append_dev(div19, div14);
    			append_dev(div14, div12);
    			append_dev(div14, t17);
    			append_dev(div14, div13);
    			append_dev(div19, t19);
    			append_dev(div19, div17);
    			append_dev(div17, div15);
    			append_dev(div15, strong3);
    			append_dev(div17, t21);
    			append_dev(div17, div16);
    			append_dev(div19, t23);
    			append_dev(div19, div18);
    			if (remount) dispose();
    			dispose = listen_dev(div18, "click", /*click_handler*/ ctx[1], false, false, false);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div20);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(6:0) {#if impressum}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let t0;
    	let div;
    	let dispose;
    	let if_block = /*impressum*/ ctx[0] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			t0 = space();
    			div = element("div");
    			div.textContent = "Impressum";
    			attr_dev(div, "class", "impressum-button cursor-pointer svelte-1p06u1e");
    			attr_dev(div, "id", "impressumButton");
    			add_location(div, file, 38, 0, 1768);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div, anchor);
    			if (remount) dispose();
    			dispose = listen_dev(div, "click", /*click_handler_1*/ ctx[2], false, false, false);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*impressum*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					if_block.m(t0.parentNode, t0);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let impressum = false;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Impressum> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Impressum", $$slots, []);
    	const click_handler = () => $$invalidate(0, impressum = false);
    	const click_handler_1 = () => $$invalidate(0, impressum = true);
    	$$self.$capture_state = () => ({ impressum });

    	$$self.$inject_state = $$props => {
    		if ("impressum" in $$props) $$invalidate(0, impressum = $$props.impressum);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [impressum, click_handler, click_handler_1];
    }

    class Impressum extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Impressum",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src\Components\LandingPage.svelte generated by Svelte v3.21.0 */
    const file$1 = "src\\Components\\LandingPage.svelte";

    function create_fragment$3(ctx) {
    	let img;
    	let img_src_value;
    	let t0;
    	let div1;
    	let div0;
    	let t1;
    	let div0_class_value;
    	let t2;
    	let form;
    	let input;
    	let t3;
    	let button;
    	let t5;
    	let div2;
    	let current;
    	let dispose;
    	const impressum = new Impressum({ $$inline: true });

    	const block = {
    		c: function create() {
    			img = element("img");
    			t0 = space();
    			div1 = element("div");
    			div0 = element("div");
    			t1 = text("SpeciesINFO");
    			t2 = space();
    			form = element("form");
    			input = element("input");
    			t3 = space();
    			button = element("button");
    			button.textContent = "arrow_forward";
    			t5 = space();
    			div2 = element("div");
    			create_component(impressum.$$.fragment);
    			if (img.src !== (img_src_value = "./images/background/bg" + /*rand*/ ctx[0] + ".jpg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "background");
    			attr_dev(img, "id", "backgroundImage");
    			attr_dev(img, "class", "backgroundImage noDrag svelte-1jxe90");
    			add_location(img, file$1, 26, 0, 883);
    			attr_dev(div0, "class", div0_class_value = "text-2xl " + (/*rand*/ ctx[0] === 1 ? "" : "text-white") + " font-semibold");
    			add_location(div0, file$1, 28, 4, 1057);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "name", "latName");
    			attr_dev(input, "id", "landingInput");
    			attr_dev(input, "class", "input svelte-1jxe90");
    			add_location(input, file$1, 30, 8, 1238);
    			attr_dev(button, "class", "material-icons goArrow svelte-1jxe90");
    			attr_dev(button, "id", "landingSubmit");
    			add_location(button, file$1, 31, 8, 1314);
    			attr_dev(form, "class", "form svelte-1jxe90");
    			attr_dev(form, "name", "landing-form");
    			add_location(form, file$1, 29, 4, 1149);
    			attr_dev(div1, "class", "fixed z-40 containerLanding select-none svelte-1jxe90");
    			add_location(div1, file$1, 27, 0, 998);
    			attr_dev(div2, "class", "impressum svelte-1jxe90");
    			add_location(div2, file$1, 35, 0, 1445);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, img, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, t1);
    			append_dev(div1, t2);
    			append_dev(div1, form);
    			append_dev(form, input);
    			append_dev(form, t3);
    			append_dev(form, button);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, div2, anchor);
    			mount_component(impressum, div2, null);
    			current = true;
    			if (remount) run_all(dispose);

    			dispose = [
    				listen_dev(button, "click", processInput, false, false, false),
    				listen_dev(form, "submit", prevent_default(processInput), false, true, false)
    			];
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(impressum.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(impressum.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div1);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(div2);
    			destroy_component(impressum);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function processInput() {
    	let name = document.getElementById("landingInput").value;
    	let URLname = name.replace(/\s/g, "_");

    	if (name === "") {
    		return;
    	}

    	routing.changeTo(`/search/${URLname}`);
    }

    //this logic is responsible for delivering a random number that is used to determine
    //the background image.
    function getRandomInt(min, max) {
    	min = Math.ceil(min);
    	max = Math.floor(max);
    	return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let rand = getRandomInt(1, 10);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<LandingPage> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("LandingPage", $$slots, []);

    	$$self.$capture_state = () => ({
    		routing,
    		Impressum,
    		processInput,
    		getRandomInt,
    		rand
    	});

    	$$self.$inject_state = $$props => {
    		if ("rand" in $$props) $$invalidate(0, rand = $$props.rand);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [rand];
    }

    class LandingPage extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "LandingPage",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    //this helper module is responsible for handling the requests and the data. Therefore, the GUI components don't
    //have to handle the data, just display them in a correct way.
    //'fetch...' functions trigger the API requests; 'set...' functions are responsible for packing the retrieved data
    //into the final object 'obj'

    //this function starts the fetch calls. Each fetchCall will retrieve information form the API server
    //and then write the information into the obj object, which will be passed.
    async function fetchAll(userInput){
        await fetchClassification(userInput);
        if(obj.matchType !== "FUZZY" && obj.matchType !== "EXACT"){
            return obj;
        }
        await fetchImageData(obj.id);
        await fetchVernacularNames(obj.id);
        await setHeatmapURL(obj.id);
        return obj;
    }
    async function fetchClassification(name){
        await fetch(`https://api.gbif.org/v1/species/match?name=${name}`)
            .then((response) => {
                return response.json();
            })
            .then((res) => {
                setClassification(res);
                setId(res);
                setMatchType(res);
                setCanonicalName(res);
            });
    }
    async function fetchImageData(id){
        await fetch(`https://api.gbif.org/v1/species/${id}/media`)
            .then((response) => {
                return response.json();
            })
            .then((res) => {
                setImageData(res);
            });
    }

    async function fetchVernacularNames(id){
        await fetch(`https://api.gbif.org/v1/species/${id}/vernacularNames`)
            .then((response) => {
                return response.json();
            })
            .then((res) => {
                setVernacularNames(res);
            });
    }

    function setClassification(data){
        obj.classification.kingdom = data.kingdom;
        obj.classification.phylum = data.phylum;
        obj.classification.class = data.class;
        obj.classification.order = data.order;
        obj.classification.family = data.family;
        obj.classification.genus = data.genus;
        obj.classification.species = data.species;
    }

    function setId(data){
        obj.id = data.speciesKey;
    }

    function setMatchType(data){
        obj.matchType = data.matchType;
    }

    function setCanonicalName(data){
        obj.canonicalName = data.canonicalName;
    }

    function setImageData(data){
        let newArr = [];
        data.results.forEach(el => {
            let newObj = {
                URL: el.identifier,
                source: el.source,
                created: el.created,
                license: el.license,
                rightsHolder: el.rightsHolder
            };
            newArr.push(newObj);
        });
        obj.images = newArr;
    }

    function setVernacularNames(data){
        let newArr = [];
        data.results.forEach(el => {
            newArr.push(el.vernacularName);
        });
        newArr = [...new Set(newArr)]; //to filter the unique values
        obj.vernacularNames = newArr;
    }

    function setHeatmapURL(id){
        obj.heatMap.west = `https://api.gbif.org/v2/map/occurrence/density/0/0/0@4x.png?style=classic.point&srs=EPSG:4326&taxonKey=${id}`;
        obj.heatMap.east = `https://api.gbif.org/v2/map/occurrence/density/0/1/0@4x.png?style=classic.point&srs=EPSG:4326&taxonKey=${id}`;
    }

    let obj = {
        id: 0,
        matchType: "",
        canonicalName: "",
        classification: {
            kingdom: "",
            phylum: "",
            class: "",
            order: "",
            family: "",
            genus: "",
            species: ""
        },
        images: [],
        vernacularNames: [],
        heatMap: {
            west: "",
            east: ""
        }
    };

    /* src\Components\Images.svelte generated by Svelte v3.21.0 */

    const file$2 = "src\\Components\\Images.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[0] = list[i];
    	return child_ctx;
    }

    // (22:0) {:else}
    function create_else_block$1(ctx) {
    	let div1;
    	let t;
    	let div0;
    	let dispose;
    	let each_value = /*imageData*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			div0 = element("div");
    			attr_dev(div0, "class", "info hidden svelte-1ikeplx");
    			attr_dev(div0, "id", "infobox");
    			add_location(div0, file$2, 28, 8, 1151);
    			attr_dev(div1, "class", "imageContainer svelte-1ikeplx");
    			add_location(div1, file$2, 22, 4, 854);
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, div1, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			append_dev(div1, t);
    			append_dev(div1, div0);
    			if (remount) dispose();
    			dispose = listen_dev(div1, "mouseleave", handleLeave, false, false, false);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*imageData, handleHover*/ 1) {
    				each_value = /*imageData*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div1, t);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_each(each_blocks, detaching);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(22:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (17:0) {#if imageData.length === 0}
    function create_if_block$2(ctx) {
    	let div1;
    	let img;
    	let img_src_value;
    	let t0;
    	let div0;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			img = element("img");
    			t0 = space();
    			div0 = element("div");
    			div0.textContent = "sorry, no images found";
    			attr_dev(img, "class", "image svelte-1ikeplx");
    			if (img.src !== (img_src_value = "./images/noImages/sadPanda.jpg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			add_location(img, file$2, 18, 8, 704);
    			attr_dev(div0, "class", "text-4xl");
    			add_location(div0, file$2, 19, 8, 777);
    			attr_dev(div1, "class", "flex");
    			add_location(div1, file$2, 17, 4, 676);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, img);
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(17:0) {#if imageData.length === 0}",
    		ctx
    	});

    	return block;
    }

    // (24:8) {#each imageData as imageData}
    function create_each_block(ctx) {
    	let div;
    	let img;
    	let img_src_value;
    	let dispose;

    	function mouseenter_handler(...args) {
    		return /*mouseenter_handler*/ ctx[1](/*imageData*/ ctx[0], ...args);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			img = element("img");
    			attr_dev(img, "class", "image noDrag svelte-1ikeplx");
    			if (img.src !== (img_src_value = /*imageData*/ ctx[0].URL)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "bild");
    			add_location(img, file$2, 25, 16, 1000);
    			attr_dev(div, "class", "cont svelte-1ikeplx");
    			add_location(div, file$2, 24, 12, 964);
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, div, anchor);
    			append_dev(div, img);
    			if (remount) dispose();
    			dispose = listen_dev(img, "mouseenter", mouseenter_handler, false, false, false);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*imageData*/ 1 && img.src !== (img_src_value = /*imageData*/ ctx[0].URL)) {
    				attr_dev(img, "src", img_src_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(24:8) {#each imageData as imageData}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*imageData*/ ctx[0].length === 0) return create_if_block$2;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function handleHover(imageData) {
    	document.querySelector("#infobox").classList.remove("hidden");
    	document.querySelector("#infobox").innerHTML = `${imageData.license || ""} ${imageData.rightsHolder || ""}. Source by ${imageData.source}`;
    }

    function handleLeave() {
    	document.querySelector("#infobox").classList.add("hidden");
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { imageData = [] } = $$props;
    	const writable_props = ["imageData"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Images> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Images", $$slots, []);
    	const mouseenter_handler = imageData => handleHover(imageData);

    	$$self.$set = $$props => {
    		if ("imageData" in $$props) $$invalidate(0, imageData = $$props.imageData);
    	};

    	$$self.$capture_state = () => ({ imageData, handleHover, handleLeave });

    	$$self.$inject_state = $$props => {
    		if ("imageData" in $$props) $$invalidate(0, imageData = $$props.imageData);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [imageData, mouseenter_handler];
    }

    class Images extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { imageData: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Images",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get imageData() {
    		throw new Error("<Images>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set imageData(value) {
    		throw new Error("<Images>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Components\Map.svelte generated by Svelte v3.21.0 */

    const file$3 = "src\\Components\\Map.svelte";

    function create_fragment$5(ctx) {
    	let div0;
    	let t1;
    	let div7;
    	let div3;
    	let div1;
    	let img0;
    	let img0_src_value;
    	let t2;
    	let div2;
    	let img1;
    	let img1_src_value;
    	let t3;
    	let div6;
    	let div4;
    	let img2;
    	let img2_src_value;
    	let t4;
    	let div5;
    	let img3;
    	let img3_src_value;

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			div0.textContent = "Distribution Heat Map";
    			t1 = space();
    			div7 = element("div");
    			div3 = element("div");
    			div1 = element("div");
    			img0 = element("img");
    			t2 = space();
    			div2 = element("div");
    			img1 = element("img");
    			t3 = space();
    			div6 = element("div");
    			div4 = element("div");
    			img2 = element("img");
    			t4 = space();
    			div5 = element("div");
    			img3 = element("img");
    			attr_dev(div0, "class", "text-2xl mb-4 mt-8");
    			add_location(div0, file$3, 7, 0, 253);
    			if (img0.src !== (img0_src_value = /*heatMap*/ ctx[0].west)) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "");
    			add_location(img0, file$3, 12, 12, 456);
    			attr_dev(div1, "class", "over select-none svelte-sqsh5");
    			add_location(div1, file$3, 11, 8, 412);
    			if (img1.src !== (img1_src_value = "./images/mapBackground/mapBackground1.png")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "bild");
    			add_location(img1, file$3, 15, 12, 558);
    			attr_dev(div2, "class", "under select-none svelte-sqsh5");
    			add_location(div2, file$3, 14, 8, 513);
    			attr_dev(div3, "class", "relative flex-grow container svelte-sqsh5");
    			add_location(div3, file$3, 10, 4, 360);
    			if (img2.src !== (img2_src_value = /*heatMap*/ ctx[0].east)) attr_dev(img2, "src", img2_src_value);
    			attr_dev(img2, "alt", "");
    			add_location(img2, file$3, 20, 12, 752);
    			attr_dev(div4, "class", "over select-none svelte-sqsh5");
    			add_location(div4, file$3, 19, 8, 708);
    			if (img3.src !== (img3_src_value = "./images/mapBackground/mapBackground2.png")) attr_dev(img3, "src", img3_src_value);
    			attr_dev(img3, "alt", "bild");
    			add_location(img3, file$3, 23, 12, 854);
    			attr_dev(div5, "class", "under select-none svelte-sqsh5");
    			add_location(div5, file$3, 22, 8, 809);
    			attr_dev(div6, "class", "relative flex-grow container svelte-sqsh5");
    			add_location(div6, file$3, 18, 4, 656);
    			attr_dev(div7, "class", "flex mapBody select-none svelte-sqsh5");
    			add_location(div7, file$3, 9, 0, 316);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div7, anchor);
    			append_dev(div7, div3);
    			append_dev(div3, div1);
    			append_dev(div1, img0);
    			append_dev(div3, t2);
    			append_dev(div3, div2);
    			append_dev(div2, img1);
    			append_dev(div7, t3);
    			append_dev(div7, div6);
    			append_dev(div6, div4);
    			append_dev(div4, img2);
    			append_dev(div6, t4);
    			append_dev(div6, div5);
    			append_dev(div5, img3);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*heatMap*/ 1 && img0.src !== (img0_src_value = /*heatMap*/ ctx[0].west)) {
    				attr_dev(img0, "src", img0_src_value);
    			}

    			if (dirty & /*heatMap*/ 1 && img2.src !== (img2_src_value = /*heatMap*/ ctx[0].east)) {
    				attr_dev(img2, "src", img2_src_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div7);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { heatMap } = $$props;
    	const writable_props = ["heatMap"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Map> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Map", $$slots, []);

    	$$self.$set = $$props => {
    		if ("heatMap" in $$props) $$invalidate(0, heatMap = $$props.heatMap);
    	};

    	$$self.$capture_state = () => ({ heatMap });

    	$$self.$inject_state = $$props => {
    		if ("heatMap" in $$props) $$invalidate(0, heatMap = $$props.heatMap);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [heatMap];
    }

    class Map$1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { heatMap: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Map",
    			options,
    			id: create_fragment$5.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*heatMap*/ ctx[0] === undefined && !("heatMap" in props)) {
    			console.warn("<Map> was created without expected prop 'heatMap'");
    		}
    	}

    	get heatMap() {
    		throw new Error("<Map>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set heatMap(value) {
    		throw new Error("<Map>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Components\SearchResult.svelte generated by Svelte v3.21.0 */

    const { console: console_1$1 } = globals;
    const file$4 = "src\\Components\\SearchResult.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	child_ctx[8] = i;
    	return child_ctx;
    }

    // (71:4) {#if data.matchType === "FUZZY"}
    function create_if_block_2(ctx) {
    	let div;
    	let t0;
    	let t1_value = /*params*/ ctx[0].first.replace(/_/g, " ") + "";
    	let t1;
    	let t2;
    	let t3_value = /*data*/ ctx[1].canonicalName + "";
    	let t3;
    	let t4;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text("No results for ");
    			t1 = text(t1_value);
    			t2 = text(". Showing results for ");
    			t3 = text(t3_value);
    			t4 = text(" instead");
    			attr_dev(div, "class", "pl-12 pt-2 text-white");
    			add_location(div, file$4, 71, 8, 2951);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, t1);
    			append_dev(div, t2);
    			append_dev(div, t3);
    			append_dev(div, t4);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*params*/ 1 && t1_value !== (t1_value = /*params*/ ctx[0].first.replace(/_/g, " ") + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*data*/ 2 && t3_value !== (t3_value = /*data*/ ctx[1].canonicalName + "")) set_data_dev(t3, t3_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(71:4) {#if data.matchType === \\\"FUZZY\\\"}",
    		ctx
    	});

    	return block;
    }

    // (140:124) 
    function create_if_block_1(ctx) {
    	let div0;
    	let img;
    	let img_src_value;
    	let t0;
    	let div2;
    	let div1;
    	let t1;
    	let t2_value = /*params*/ ctx[0].first.replace(/_/g, " ") + "";
    	let t2;
    	let t3;

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			div2 = element("div");
    			div1 = element("div");
    			t1 = text("Nothing found for \"");
    			t2 = text(t2_value);
    			t3 = text("\"");
    			attr_dev(img, "class", "flex justify-center sadPanda2 svelte-1raseii");
    			if (img.src !== (img_src_value = "./images/noResult/sadPanda2.jpg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			add_location(img, file$4, 141, 8, 6012);
    			attr_dev(div0, "class", "flex justify-center pt-32");
    			add_location(div0, file$4, 140, 4, 5963);
    			add_location(div1, file$4, 144, 8, 6175);
    			attr_dev(div2, "class", "flex justify-center pt-8 text-6xl");
    			add_location(div2, file$4, 143, 4, 6118);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, img);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			append_dev(div1, t1);
    			append_dev(div1, t2);
    			append_dev(div1, t3);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*params*/ 1 && t2_value !== (t2_value = /*params*/ ctx[0].first.replace(/_/g, " ") + "")) set_data_dev(t2, t2_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(140:124) ",
    		ctx
    	});

    	return block;
    }

    // (77:0) {#if data.matchType === "EXACT" || data.matchType === "FUZZY"}
    function create_if_block$3(ctx) {
    	let div31;
    	let div0;
    	let strong0;
    	let t0_value = /*data*/ ctx[1].canonicalName + "";
    	let t0;
    	let t1;
    	let div1;
    	let strong1;
    	let t3;
    	let t4;
    	let div3;
    	let img;
    	let img_src_value;
    	let t5;
    	let div2;
    	let t7;
    	let div27;
    	let div4;
    	let t9;
    	let div26;
    	let div7;
    	let div5;
    	let strong2;
    	let t11;
    	let div6;
    	let t12_value = /*data*/ ctx[1].classification.kingdom + "";
    	let t12;
    	let t13;
    	let div10;
    	let div8;
    	let strong3;
    	let t15;
    	let div9;
    	let t16_value = /*data*/ ctx[1].classification.phylum + "";
    	let t16;
    	let t17;
    	let div13;
    	let div11;
    	let strong4;
    	let t19;
    	let div12;
    	let t20_value = /*data*/ ctx[1].classification.class + "";
    	let t20;
    	let t21;
    	let div16;
    	let div14;
    	let strong5;
    	let t23;
    	let div15;
    	let t24_value = /*data*/ ctx[1].classification.order + "";
    	let t24;
    	let t25;
    	let div19;
    	let div17;
    	let strong6;
    	let t27;
    	let div18;
    	let t28_value = /*data*/ ctx[1].classification.family + "";
    	let t28;
    	let t29;
    	let div22;
    	let div20;
    	let strong7;
    	let t31;
    	let div21;
    	let t32_value = /*data*/ ctx[1].classification.genus + "";
    	let t32;
    	let t33;
    	let div25;
    	let div23;
    	let strong8;
    	let t35;
    	let div24;
    	let t36_value = /*data*/ ctx[1].classification.species + "";
    	let t36;
    	let t37;
    	let div28;
    	let t38;
    	let div30;
    	let div29;
    	let t40;
    	let t41;
    	let div34;
    	let div32;
    	let t43;
    	let div33;
    	let current;
    	let dispose;
    	let each_value = /*data*/ ctx[1].vernacularNames;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const map = new Map$1({
    			props: { heatMap: /*data*/ ctx[1].heatMap },
    			$$inline: true
    		});

    	const images = new Images({
    			props: { imageData: /*data*/ ctx[1].images },
    			$$inline: true
    		});

    	const impressum = new Impressum({ $$inline: true });

    	const block = {
    		c: function create() {
    			div31 = element("div");
    			div0 = element("div");
    			strong0 = element("strong");
    			t0 = text(t0_value);
    			t1 = space();
    			div1 = element("div");
    			strong1 = element("strong");
    			strong1.textContent = "also known as";
    			t3 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t4 = space();
    			div3 = element("div");
    			img = element("img");
    			t5 = space();
    			div2 = element("div");
    			div2.textContent = "show Wikipedia article";
    			t7 = space();
    			div27 = element("div");
    			div4 = element("div");
    			div4.textContent = "Classification";
    			t9 = space();
    			div26 = element("div");
    			div7 = element("div");
    			div5 = element("div");
    			strong2 = element("strong");
    			strong2.textContent = "Kingdom";
    			t11 = space();
    			div6 = element("div");
    			t12 = text(t12_value);
    			t13 = space();
    			div10 = element("div");
    			div8 = element("div");
    			strong3 = element("strong");
    			strong3.textContent = "Phylum";
    			t15 = space();
    			div9 = element("div");
    			t16 = text(t16_value);
    			t17 = space();
    			div13 = element("div");
    			div11 = element("div");
    			strong4 = element("strong");
    			strong4.textContent = "Class";
    			t19 = space();
    			div12 = element("div");
    			t20 = text(t20_value);
    			t21 = space();
    			div16 = element("div");
    			div14 = element("div");
    			strong5 = element("strong");
    			strong5.textContent = "Order";
    			t23 = space();
    			div15 = element("div");
    			t24 = text(t24_value);
    			t25 = space();
    			div19 = element("div");
    			div17 = element("div");
    			strong6 = element("strong");
    			strong6.textContent = "Family";
    			t27 = space();
    			div18 = element("div");
    			t28 = text(t28_value);
    			t29 = space();
    			div22 = element("div");
    			div20 = element("div");
    			strong7 = element("strong");
    			strong7.textContent = "Genus";
    			t31 = space();
    			div21 = element("div");
    			t32 = text(t32_value);
    			t33 = space();
    			div25 = element("div");
    			div23 = element("div");
    			strong8 = element("strong");
    			strong8.textContent = "Species";
    			t35 = space();
    			div24 = element("div");
    			t36 = text(t36_value);
    			t37 = space();
    			div28 = element("div");
    			create_component(map.$$.fragment);
    			t38 = space();
    			div30 = element("div");
    			div29 = element("div");
    			div29.textContent = "Images";
    			t40 = space();
    			create_component(images.$$.fragment);
    			t41 = space();
    			div34 = element("div");
    			div32 = element("div");
    			div32.textContent = "Search results kindly provided by gbif.org";
    			t43 = space();
    			div33 = element("div");
    			create_component(impressum.$$.fragment);
    			add_location(strong0, file$4, 78, 30, 3244);
    			attr_dev(div0, "class", "text-4xl");
    			add_location(div0, file$4, 78, 8, 3222);
    			add_location(strong1, file$4, 79, 34, 3323);
    			attr_dev(div1, "class", "text-xl mb-4");
    			add_location(div1, file$4, 79, 8, 3297);
    			attr_dev(img, "id", "wikipediaLogo");
    			if (img.src !== (img_src_value = "./images/Wikipedia/wikipedia.ico")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "wikipedia_logo");
    			attr_dev(img, "class", "svelte-1raseii");
    			add_location(img, file$4, 85, 12, 3610);
    			attr_dev(div2, "class", "text-xl pl-2");
    			add_location(div2, file$4, 86, 12, 3708);
    			attr_dev(div3, "class", "cursor-pointer flex mb-4");
    			add_location(div3, file$4, 84, 8, 3533);
    			attr_dev(div4, "class", "text-2xl mb-2");
    			add_location(div4, file$4, 89, 12, 3807);
    			add_location(strong2, file$4, 92, 40, 3984);
    			attr_dev(div5, "class", "flex-1");
    			add_location(div5, file$4, 92, 20, 3964);
    			attr_dev(div6, "class", "flex-1");
    			add_location(div6, file$4, 93, 20, 4036);
    			attr_dev(div7, "class", "flex");
    			add_location(div7, file$4, 91, 16, 3924);
    			add_location(strong3, file$4, 96, 40, 4193);
    			attr_dev(div8, "class", "flex-1");
    			add_location(div8, file$4, 96, 20, 4173);
    			attr_dev(div9, "class", "flex-1");
    			add_location(div9, file$4, 97, 20, 4244);
    			attr_dev(div10, "class", "flex");
    			add_location(div10, file$4, 95, 16, 4133);
    			add_location(strong4, file$4, 100, 40, 4400);
    			attr_dev(div11, "class", "flex-1");
    			add_location(div11, file$4, 100, 20, 4380);
    			attr_dev(div12, "class", "flex-1");
    			add_location(div12, file$4, 101, 20, 4450);
    			attr_dev(div13, "class", "flex");
    			add_location(div13, file$4, 99, 16, 4340);
    			add_location(strong5, file$4, 104, 40, 4605);
    			attr_dev(div14, "class", "flex-1");
    			add_location(div14, file$4, 104, 20, 4585);
    			attr_dev(div15, "class", "flex-1");
    			add_location(div15, file$4, 105, 20, 4655);
    			attr_dev(div16, "class", "flex");
    			add_location(div16, file$4, 103, 16, 4545);
    			add_location(strong6, file$4, 108, 40, 4810);
    			attr_dev(div17, "class", "flex-1");
    			add_location(div17, file$4, 108, 20, 4790);
    			attr_dev(div18, "class", "flex-1");
    			add_location(div18, file$4, 109, 20, 4861);
    			attr_dev(div19, "class", "flex");
    			add_location(div19, file$4, 107, 16, 4750);
    			add_location(strong7, file$4, 112, 40, 5017);
    			attr_dev(div20, "class", "flex-1");
    			add_location(div20, file$4, 112, 20, 4997);
    			attr_dev(div21, "class", "flex-1");
    			add_location(div21, file$4, 113, 20, 5067);
    			attr_dev(div22, "class", "flex");
    			add_location(div22, file$4, 111, 16, 4957);
    			add_location(strong8, file$4, 116, 40, 5222);
    			attr_dev(div23, "class", "flex-1");
    			add_location(div23, file$4, 116, 20, 5202);
    			attr_dev(div24, "class", "flex-1");
    			add_location(div24, file$4, 117, 20, 5274);
    			attr_dev(div25, "class", "flex");
    			add_location(div25, file$4, 115, 16, 5162);
    			attr_dev(div26, "class", "text-xl classification svelte-1raseii");
    			add_location(div26, file$4, 90, 12, 3870);
    			add_location(div27, file$4, 88, 8, 3788);
    			add_location(div28, file$4, 121, 8, 5399);
    			attr_dev(div29, "class", "text-2xl mt-8 mb-4");
    			add_location(div29, file$4, 125, 12, 5493);
    			add_location(div30, file$4, 124, 8, 5474);
    			attr_dev(div31, "class", "resultsListBody svelte-1raseii");
    			add_location(div31, file$4, 77, 4, 3183);
    			attr_dev(div32, "class", "gbif svelte-1raseii");
    			add_location(div32, file$4, 130, 8, 5649);
    			attr_dev(div33, "class", "impressum svelte-1raseii");
    			add_location(div33, file$4, 133, 8, 5749);
    			attr_dev(div34, "class", "footer svelte-1raseii");
    			add_location(div34, file$4, 129, 4, 5619);
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, div31, anchor);
    			append_dev(div31, div0);
    			append_dev(div0, strong0);
    			append_dev(strong0, t0);
    			append_dev(div31, t1);
    			append_dev(div31, div1);
    			append_dev(div1, strong1);
    			append_dev(div1, t3);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			append_dev(div31, t4);
    			append_dev(div31, div3);
    			append_dev(div3, img);
    			append_dev(div3, t5);
    			append_dev(div3, div2);
    			append_dev(div31, t7);
    			append_dev(div31, div27);
    			append_dev(div27, div4);
    			append_dev(div27, t9);
    			append_dev(div27, div26);
    			append_dev(div26, div7);
    			append_dev(div7, div5);
    			append_dev(div5, strong2);
    			append_dev(div7, t11);
    			append_dev(div7, div6);
    			append_dev(div6, t12);
    			append_dev(div26, t13);
    			append_dev(div26, div10);
    			append_dev(div10, div8);
    			append_dev(div8, strong3);
    			append_dev(div10, t15);
    			append_dev(div10, div9);
    			append_dev(div9, t16);
    			append_dev(div26, t17);
    			append_dev(div26, div13);
    			append_dev(div13, div11);
    			append_dev(div11, strong4);
    			append_dev(div13, t19);
    			append_dev(div13, div12);
    			append_dev(div12, t20);
    			append_dev(div26, t21);
    			append_dev(div26, div16);
    			append_dev(div16, div14);
    			append_dev(div14, strong5);
    			append_dev(div16, t23);
    			append_dev(div16, div15);
    			append_dev(div15, t24);
    			append_dev(div26, t25);
    			append_dev(div26, div19);
    			append_dev(div19, div17);
    			append_dev(div17, strong6);
    			append_dev(div19, t27);
    			append_dev(div19, div18);
    			append_dev(div18, t28);
    			append_dev(div26, t29);
    			append_dev(div26, div22);
    			append_dev(div22, div20);
    			append_dev(div20, strong7);
    			append_dev(div22, t31);
    			append_dev(div22, div21);
    			append_dev(div21, t32);
    			append_dev(div26, t33);
    			append_dev(div26, div25);
    			append_dev(div25, div23);
    			append_dev(div23, strong8);
    			append_dev(div25, t35);
    			append_dev(div25, div24);
    			append_dev(div24, t36);
    			append_dev(div31, t37);
    			append_dev(div31, div28);
    			mount_component(map, div28, null);
    			append_dev(div31, t38);
    			append_dev(div31, div30);
    			append_dev(div30, div29);
    			append_dev(div30, t40);
    			mount_component(images, div30, null);
    			insert_dev(target, t41, anchor);
    			insert_dev(target, div34, anchor);
    			append_dev(div34, div32);
    			append_dev(div34, t43);
    			append_dev(div34, div33);
    			mount_component(impressum, div33, null);
    			current = true;
    			if (remount) dispose();
    			dispose = listen_dev(div3, "click", /*openWikipedia*/ ctx[3], false, false, false);
    		},
    		p: function update(ctx, dirty) {
    			if ((!current || dirty & /*data*/ 2) && t0_value !== (t0_value = /*data*/ ctx[1].canonicalName + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*data*/ 2) {
    				each_value = /*data*/ ctx[1].vernacularNames;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if ((!current || dirty & /*data*/ 2) && t12_value !== (t12_value = /*data*/ ctx[1].classification.kingdom + "")) set_data_dev(t12, t12_value);
    			if ((!current || dirty & /*data*/ 2) && t16_value !== (t16_value = /*data*/ ctx[1].classification.phylum + "")) set_data_dev(t16, t16_value);
    			if ((!current || dirty & /*data*/ 2) && t20_value !== (t20_value = /*data*/ ctx[1].classification.class + "")) set_data_dev(t20, t20_value);
    			if ((!current || dirty & /*data*/ 2) && t24_value !== (t24_value = /*data*/ ctx[1].classification.order + "")) set_data_dev(t24, t24_value);
    			if ((!current || dirty & /*data*/ 2) && t28_value !== (t28_value = /*data*/ ctx[1].classification.family + "")) set_data_dev(t28, t28_value);
    			if ((!current || dirty & /*data*/ 2) && t32_value !== (t32_value = /*data*/ ctx[1].classification.genus + "")) set_data_dev(t32, t32_value);
    			if ((!current || dirty & /*data*/ 2) && t36_value !== (t36_value = /*data*/ ctx[1].classification.species + "")) set_data_dev(t36, t36_value);
    			const map_changes = {};
    			if (dirty & /*data*/ 2) map_changes.heatMap = /*data*/ ctx[1].heatMap;
    			map.$set(map_changes);
    			const images_changes = {};
    			if (dirty & /*data*/ 2) images_changes.imageData = /*data*/ ctx[1].images;
    			images.$set(images_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(map.$$.fragment, local);
    			transition_in(images.$$.fragment, local);
    			transition_in(impressum.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(map.$$.fragment, local);
    			transition_out(images.$$.fragment, local);
    			transition_out(impressum.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div31);
    			destroy_each(each_blocks, detaching);
    			destroy_component(map);
    			destroy_component(images);
    			if (detaching) detach_dev(t41);
    			if (detaching) detach_dev(div34);
    			destroy_component(impressum);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(77:0) {#if data.matchType === \\\"EXACT\\\" || data.matchType === \\\"FUZZY\\\"}",
    		ctx
    	});

    	return block;
    }

    // (81:12) {#each data.vernacularNames as name, i}
    function create_each_block$1(ctx) {
    	let t0;
    	let t1_value = /*name*/ ctx[6] + "";
    	let t1;

    	let t2_value = (/*i*/ ctx[8] === /*data*/ ctx[1].vernacularNames.length - 1
    	? "."
    	: ",") + "";

    	let t2;

    	const block = {
    		c: function create() {
    			t0 = space();
    			t1 = text(t1_value);
    			t2 = text(t2_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, t2, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data*/ 2 && t1_value !== (t1_value = /*name*/ ctx[6] + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*data*/ 2 && t2_value !== (t2_value = (/*i*/ ctx[8] === /*data*/ ctx[1].vernacularNames.length - 1
    			? "."
    			: ",") + "")) set_data_dev(t2, t2_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(t2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(81:12) {#each data.vernacularNames as name, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let div1;
    	let div0;
    	let button0;
    	let t1;
    	let form;
    	let input;
    	let t2;
    	let button1;
    	let t4;
    	let t5;
    	let current_block_type_index;
    	let if_block1;
    	let if_block1_anchor;
    	let current;
    	let dispose;
    	let if_block0 = /*data*/ ctx[1].matchType === "FUZZY" && create_if_block_2(ctx);
    	const if_block_creators = [create_if_block$3, create_if_block_1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*data*/ ctx[1].matchType === "EXACT" || /*data*/ ctx[1].matchType === "FUZZY") return 0;
    		if (/*data*/ ctx[1].matchType !== "EXACT" && /*data*/ ctx[1].matchType !== "FUZZY" && /*data*/ ctx[1].matchType !== "" && /*data*/ ctx[1].matchType !== undefined) return 1;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			button0 = element("button");
    			button0.textContent = "home";
    			t1 = space();
    			form = element("form");
    			input = element("input");
    			t2 = space();
    			button1 = element("button");
    			button1.textContent = "arrow_forward";
    			t4 = space();
    			if (if_block0) if_block0.c();
    			t5 = space();
    			if (if_block1) if_block1.c();
    			if_block1_anchor = empty();
    			attr_dev(button0, "class", "material-icons border-none homeButton svelte-1raseii");
    			add_location(button0, file$4, 64, 8, 2521);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "id", "inputField");
    			attr_dev(input, "name", "latName");
    			attr_dev(input, "class", "input svelte-1raseii");
    			add_location(input, file$4, 66, 12, 2710);
    			attr_dev(button1, "class", "material-icons goArrow svelte-1raseii");
    			add_location(button1, file$4, 67, 12, 2788);
    			attr_dev(form, "class", "form svelte-1raseii");
    			add_location(form, file$4, 65, 8, 2637);
    			attr_dev(div0, "class", "flex formContainer svelte-1raseii");
    			add_location(div0, file$4, 63, 4, 2479);
    			attr_dev(div1, "class", "containerSearch svelte-1raseii");
    			add_location(div1, file$4, 62, 0, 2444);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, button0);
    			append_dev(div0, t1);
    			append_dev(div0, form);
    			append_dev(form, input);
    			append_dev(form, t2);
    			append_dev(form, button1);
    			append_dev(div1, t4);
    			if (if_block0) if_block0.m(div1, null);
    			insert_dev(target, t5, anchor);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(target, anchor);
    			}

    			insert_dev(target, if_block1_anchor, anchor);
    			current = true;
    			if (remount) run_all(dispose);

    			dispose = [
    				listen_dev(button0, "click", /*click_handler*/ ctx[5], false, false, false),
    				listen_dev(button1, "click", /*processInput*/ ctx[2], false, false, false),
    				listen_dev(form, "submit", prevent_default(/*processInput*/ ctx[2]), false, true, false)
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*data*/ ctx[1].matchType === "FUZZY") {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_2(ctx);
    					if_block0.c();
    					if_block0.m(div1, null);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) {
    					if_blocks[current_block_type_index].p(ctx, dirty);
    				}
    			} else {
    				if (if_block1) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block1 = if_blocks[current_block_type_index];

    					if (!if_block1) {
    						if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block1.c();
    					}

    					transition_in(if_block1, 1);
    					if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
    				} else {
    					if_block1 = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (if_block0) if_block0.d();
    			if (detaching) detach_dev(t5);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d(detaching);
    			}

    			if (detaching) detach_dev(if_block1_anchor);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { params = {} } = $$props;

    	//into data all the information coming from the API call is written
    	let data = "";

    	//this function is executed, when the component is rendered. It is then responsible for starting the API
    	//call with the URL parameter.
    	onMount(async () => {
    		document.querySelector("#inputField").value = params.first.replace(/_/g, " ");
    		let fetchName = params.first.replace(/_/g, "%20");
    		$$invalidate(1, data = await fetchAll(fetchName));
    	});

    	//on the result page, the user can fire another search. This function processes the new
    	//input and fires the request.
    	async function processInput() {
    		let name = document.getElementById("inputField").value;
    		let URLname = name.replace(/\s/g, "_");

    		if (name === "") {
    			return;
    		}

    		routing.changeTo(`/search/${URLname}`);
    		let fetchName = name.replace(/\s/g, "%20");
    		$$invalidate(1, data = await fetchAll(fetchName));
    	}

    	//This function transorms the sceintific name so that it can be used in the Wikipedia URL
    	//and opens the appropriate article.
    	function openWikipedia() {
    		let parameter = data.canonicalName.replace(/%20/g, "_");
    		window.open(`https://en.wikipedia.org/wiki/${parameter}`, "_blank");
    	}

    	//This function is responsible to trigger a new load of data when the user navigates with the
    	//back or forward button
    	window.addEventListener("hashchange", function () {
    		let name = window.location.href;
    		let input = document.getElementById("inputField").value.replace(/\s/g, "_");

    		if (name.indexOf(input) === -1) {
    			processBack();
    		}
    	});

    	async function processBack() {
    		let URL = window.location.href;
    		let name = URL.substring(URL.lastIndexOf("/") + 1);
    		console.log(name);
    		let fetchName = name.replace(/_/g, "%20");
    		document.getElementById("inputField").value = name.replace(/_/g, " ");
    		$$invalidate(1, data = await fetchAll(fetchName));
    	}

    	const writable_props = ["params"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$1.warn(`<SearchResult> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("SearchResult", $$slots, []);
    	const click_handler = () => routing.changeTo("/");

    	$$self.$set = $$props => {
    		if ("params" in $$props) $$invalidate(0, params = $$props.params);
    	};

    	$$self.$capture_state = () => ({
    		routing,
    		onMount,
    		fetchAll,
    		Images,
    		Map: Map$1,
    		Impressum,
    		params,
    		data,
    		processInput,
    		openWikipedia,
    		processBack
    	});

    	$$self.$inject_state = $$props => {
    		if ("params" in $$props) $$invalidate(0, params = $$props.params);
    		if ("data" in $$props) $$invalidate(1, data = $$props.data);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [params, data, processInput, openWikipedia, processBack, click_handler];
    }

    class SearchResult extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { params: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SearchResult",
    			options,
    			id: create_fragment$6.name
    		});
    	}

    	get params() {
    		throw new Error("<SearchResult>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set params(value) {
    		throw new Error("<SearchResult>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\App.svelte generated by Svelte v3.21.0 */

    function create_fragment$7(ctx) {
    	let t;
    	let current;
    	const tailwindcss = new Tailwindcss({ $$inline: true });

    	const router = new Router({
    			props: { routes: /*routes*/ ctx[0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(tailwindcss.$$.fragment);
    			t = space();
    			create_component(router.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(tailwindcss, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(router, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tailwindcss.$$.fragment, local);
    			transition_in(router.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tailwindcss.$$.fragment, local);
    			transition_out(router.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(tailwindcss, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(router, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	const routes = {
    		"/": LandingPage,
    		"/search/:first": SearchResult
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);

    	$$self.$capture_state = () => ({
    		Tailwindcss,
    		Router,
    		LandingPage,
    		SearchResult,
    		routes
    	});

    	return [routes];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    const app = new App({
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
