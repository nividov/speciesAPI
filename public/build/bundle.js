
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
    function get_store_value(store) {
        let value;
        subscribe(store, _ => value = _)();
        return value;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function set_store_value(store, ret, value = ret) {
        store.set(value);
        return ret;
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
    function set_input_value(input, value) {
        if (value != null || input.value) {
            input.value = value;
        }
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

    const location$1 = derived(loc, $loc => $loc.location);
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
    		location: location$1,
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

    const query = writableLocalStorage("query", "");

    /* src\Components\LandingPage.svelte generated by Svelte v3.21.0 */
    const file = "src\\Components\\LandingPage.svelte";

    function create_fragment$2(ctx) {
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
    	let dispose;

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
    			if (img.src !== (img_src_value = "./images/background/bg" + /*rand*/ ctx[1] + ".jpg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "background");
    			attr_dev(img, "id", "backgroundImage");
    			attr_dev(img, "class", "backgroundImage svelte-1av47en");
    			add_location(img, file, 26, 0, 636);
    			attr_dev(div0, "class", div0_class_value = "text-2xl " + (/*rand*/ ctx[1] === 1 ? "" : "text-white") + " font-semibold");
    			add_location(div0, file, 28, 4, 791);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "name", "latName");
    			attr_dev(input, "class", "input svelte-1av47en");
    			input.autofocus = true;
    			add_location(input, file, 30, 8, 972);
    			attr_dev(button, "class", "material-icons goArrow svelte-1av47en");
    			add_location(button, file, 31, 8, 1060);
    			attr_dev(form, "class", "form svelte-1av47en");
    			attr_dev(form, "name", "landing-form");
    			add_location(form, file, 29, 4, 883);
    			attr_dev(div1, "class", "fixed z-40 containerLanding svelte-1av47en");
    			add_location(div1, file, 27, 0, 744);
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
    			set_input_value(input, /*$query*/ ctx[0]);
    			append_dev(form, t3);
    			append_dev(form, button);
    			input.focus();
    			if (remount) run_all(dispose);

    			dispose = [
    				listen_dev(input, "input", /*input_input_handler*/ ctx[2]),
    				listen_dev(button, "click", processInput, false, false, false),
    				listen_dev(form, "submit", prevent_default(processInput), false, true, false)
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$query*/ 1 && input.value !== /*$query*/ ctx[0]) {
    				set_input_value(input, /*$query*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div1);
    			run_all(dispose);
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

    function processInput(input) {
    	let form = input.currentTarget;
    	let name = form.elements.namedItem("latName").value;
    	let apiRequestName = name.replace(/\s/g, "%20");
    	push(`/search/${apiRequestName}`);
    }

    function getRandomInt(min, max) {
    	min = Math.ceil(min);
    	max = Math.floor(max);
    	return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let $query;
    	validate_store(query, "query");
    	component_subscribe($$self, query, $$value => $$invalidate(0, $query = $$value));
    	query.useLocalStorage();
    	set_store_value(query, $query = "");
    	let rand = getRandomInt(1, 10);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<LandingPage> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("LandingPage", $$slots, []);

    	function input_input_handler() {
    		$query = this.value;
    		query.set($query);
    	}

    	$$self.$capture_state = () => ({
    		push,
    		query,
    		processInput,
    		getRandomInt,
    		rand,
    		$query
    	});

    	$$self.$inject_state = $$props => {
    		if ("rand" in $$props) $$invalidate(1, rand = $$props.rand);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [$query, rand, input_input_handler];
    }

    class LandingPage extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "LandingPage",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    async function fetchAll(userInput){
        await fetchClassification(userInput);
        if(obj.matchType !== "FUZZY" && obj.matchType !== "EXACT"){
            return obj;
        }
        await fetchImageData(obj.id);
        await fetchVernacularNames(obj.id);
        await pushHeatmapURL(obj.id);
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
                pushImageData(res);
            });
    }

    async function fetchVernacularNames(id){
        await fetch(`https://api.gbif.org/v1/species/${id}/vernacularNames`)
            .then((response) => {
                return response.json();
            })
            .then((res) => {
                pushVernacularNames(res);
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

    function pushImageData(data){
        data.results.forEach(el => {
            let newObj = {
                URL: el.identifier,
                source: el.source,
                created: el.created,
                license: el.license,
                rightsHolder: el.rightsHolder
            };
            obj.images.push(newObj);
        });
    }

    function pushVernacularNames(data){
        let newArr = [];
        data.results.forEach(el => {
            newArr.push(el.vernacularName);
        });
        newArr = [...new Set(newArr)]; //to filter the unique values
        obj.vernacularNames = newArr;
    }

    function pushHeatmapURL(id){
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

    const file$1 = "src\\Components\\Images.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[0] = list[i];
    	return child_ctx;
    }

    // (12:0) {:else}
    function create_else_block$1(ctx) {
    	let div;
    	let each_value = /*imageData*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "imageContainer svelte-5facdj");
    			add_location(div, file$1, 12, 4, 271);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*imageData*/ 1) {
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
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(12:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (7:0) {#if imageData.length === 0}
    function create_if_block$1(ctx) {
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
    			attr_dev(img, "class", "image svelte-5facdj");
    			if (img.src !== (img_src_value = "./images/noImages/sadPanda.jpg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			add_location(img, file$1, 8, 8, 121);
    			attr_dev(div0, "class", "text-4xl");
    			add_location(div0, file$1, 9, 8, 194);
    			attr_dev(div1, "class", "flex");
    			add_location(div1, file$1, 7, 4, 93);
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
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(7:0) {#if imageData.length === 0}",
    		ctx
    	});

    	return block;
    }

    // (14:8) {#each imageData as imageData}
    function create_each_block(ctx) {
    	let div;
    	let img;
    	let img_src_value;
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			img = element("img");
    			t = space();
    			attr_dev(img, "class", "image svelte-5facdj");
    			if (img.src !== (img_src_value = /*imageData*/ ctx[0].URL)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "bild");
    			add_location(img, file$1, 15, 16, 389);
    			attr_dev(div, "class", "cont");
    			add_location(div, file$1, 14, 12, 353);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, img);
    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*imageData*/ 1 && img.src !== (img_src_value = /*imageData*/ ctx[0].URL)) {
    				attr_dev(img, "src", img_src_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(14:8) {#each imageData as imageData}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*imageData*/ ctx[0].length === 0) return create_if_block$1;
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
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { imageData = [] } = $$props;
    	const writable_props = ["imageData"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Images> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Images", $$slots, []);

    	$$self.$set = $$props => {
    		if ("imageData" in $$props) $$invalidate(0, imageData = $$props.imageData);
    	};

    	$$self.$capture_state = () => ({ imageData });

    	$$self.$inject_state = $$props => {
    		if ("imageData" in $$props) $$invalidate(0, imageData = $$props.imageData);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [imageData];
    }

    class Images extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { imageData: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Images",
    			options,
    			id: create_fragment$3.name
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

    const file$2 = "src\\Components\\Map.svelte";

    function create_fragment$4(ctx) {
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
    			attr_dev(div0, "class", "text-2xl mb-4 mt-4");
    			add_location(div0, file$2, 6, 0, 55);
    			if (img0.src !== (img0_src_value = /*heatMap*/ ctx[0].west)) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "");
    			add_location(img0, file$2, 11, 12, 234);
    			attr_dev(div1, "class", "over svelte-sqsh5");
    			add_location(div1, file$2, 10, 8, 202);
    			if (img1.src !== (img1_src_value = "./images/mapBackground/mapBackground1.png")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "bild");
    			add_location(img1, file$2, 14, 12, 324);
    			attr_dev(div2, "class", "under svelte-sqsh5");
    			add_location(div2, file$2, 13, 8, 291);
    			attr_dev(div3, "class", "relative flex-grow container svelte-sqsh5");
    			add_location(div3, file$2, 9, 4, 150);
    			if (img2.src !== (img2_src_value = /*heatMap*/ ctx[0].east)) attr_dev(img2, "src", img2_src_value);
    			attr_dev(img2, "alt", "");
    			add_location(img2, file$2, 19, 12, 506);
    			attr_dev(div4, "class", "over svelte-sqsh5");
    			add_location(div4, file$2, 18, 8, 474);
    			if (img3.src !== (img3_src_value = "./images/mapBackground/mapBackground2.png")) attr_dev(img3, "src", img3_src_value);
    			attr_dev(img3, "alt", "bild");
    			add_location(img3, file$2, 22, 12, 596);
    			attr_dev(div5, "class", "under svelte-sqsh5");
    			add_location(div5, file$2, 21, 8, 563);
    			attr_dev(div6, "class", "relative flex-grow container svelte-sqsh5");
    			add_location(div6, file$2, 17, 4, 422);
    			attr_dev(div7, "class", "flex mapBody svelte-sqsh5");
    			add_location(div7, file$2, 8, 0, 118);
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
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { heatMap: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Map",
    			options,
    			id: create_fragment$4.name
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
    const file$3 = "src\\Components\\SearchResult.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	child_ctx[8] = i;
    	return child_ctx;
    }

    // (44:4) {#if data.matchType === "FUZZY"}
    function create_if_block_2(ctx) {
    	let div;
    	let t0;
    	let t1_value = get_store_value(query) + "";
    	let t1;
    	let t2;
    	let t3_value = /*data*/ ctx[0].canonicalName + "";
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
    			attr_dev(div, "class", "pl-12 pt-2");
    			add_location(div, file$3, 44, 8, 1575);
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
    			if (dirty & /*data*/ 1 && t3_value !== (t3_value = /*data*/ ctx[0].canonicalName + "")) set_data_dev(t3, t3_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(44:4) {#if data.matchType === \\\"FUZZY\\\"}",
    		ctx
    	});

    	return block;
    }

    // (83:67) 
    function create_if_block_1(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = `Nothing found for ${get_store_value(query)}`;
    			add_location(div, file$3, 83, 4, 3351);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(83:67) ",
    		ctx
    	});

    	return block;
    }

    // (50:0) {#if data.matchType === "EXACT" || data.matchType === "FUZZY"}
    function create_if_block$2(ctx) {
    	let div9;
    	let div0;
    	let strong0;
    	let t0_value = /*data*/ ctx[0].canonicalName + "";
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
    	let div5;
    	let div4;
    	let t9;
    	let ul;
    	let li0;
    	let t10;
    	let t11_value = /*data*/ ctx[0].classification.kingdom + "";
    	let t11;
    	let t12;
    	let li1;
    	let t13;
    	let t14_value = /*data*/ ctx[0].classification.phylum + "";
    	let t14;
    	let t15;
    	let li2;
    	let t16;
    	let t17_value = /*data*/ ctx[0].classification.class + "";
    	let t17;
    	let t18;
    	let li3;
    	let t19;
    	let t20_value = /*data*/ ctx[0].classification.order + "";
    	let t20;
    	let t21;
    	let li4;
    	let t22;
    	let t23_value = /*data*/ ctx[0].classification.family + "";
    	let t23;
    	let t24;
    	let li5;
    	let t25;
    	let t26_value = /*data*/ ctx[0].classification.genus + "";
    	let t26;
    	let t27;
    	let li6;
    	let t28;
    	let t29_value = /*data*/ ctx[0].classification.species + "";
    	let t29;
    	let t30;
    	let div6;
    	let t31;
    	let div8;
    	let div7;
    	let t33;
    	let current;
    	let dispose;
    	let each_value = /*data*/ ctx[0].vernacularNames;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const map = new Map$1({
    			props: { heatMap: /*data*/ ctx[0].heatMap },
    			$$inline: true
    		});

    	const images = new Images({
    			props: { imageData: /*data*/ ctx[0].images },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div9 = element("div");
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
    			div5 = element("div");
    			div4 = element("div");
    			div4.textContent = "Classification";
    			t9 = space();
    			ul = element("ul");
    			li0 = element("li");
    			t10 = text("Kingdom: ");
    			t11 = text(t11_value);
    			t12 = space();
    			li1 = element("li");
    			t13 = text("Phylum: ");
    			t14 = text(t14_value);
    			t15 = space();
    			li2 = element("li");
    			t16 = text("Class: ");
    			t17 = text(t17_value);
    			t18 = space();
    			li3 = element("li");
    			t19 = text("Order: ");
    			t20 = text(t20_value);
    			t21 = space();
    			li4 = element("li");
    			t22 = text("Family: ");
    			t23 = text(t23_value);
    			t24 = space();
    			li5 = element("li");
    			t25 = text("Genus: ");
    			t26 = text(t26_value);
    			t27 = space();
    			li6 = element("li");
    			t28 = text("Species: ");
    			t29 = text(t29_value);
    			t30 = space();
    			div6 = element("div");
    			create_component(map.$$.fragment);
    			t31 = space();
    			div8 = element("div");
    			div7 = element("div");
    			div7.textContent = "Images";
    			t33 = space();
    			create_component(images.$$.fragment);
    			add_location(strong0, file$3, 51, 30, 1836);
    			attr_dev(div0, "class", "text-4xl");
    			add_location(div0, file$3, 51, 8, 1814);
    			add_location(strong1, file$3, 52, 34, 1915);
    			attr_dev(div1, "class", "text-xl mb-4");
    			add_location(div1, file$3, 52, 8, 1889);
    			attr_dev(img, "id", "wikipediaLogo");
    			if (img.src !== (img_src_value = "./images/Wikipedia/wikipedia.ico")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "wikipedia_logo");
    			attr_dev(img, "class", "svelte-hfpx15");
    			add_location(img, file$3, 58, 12, 2202);
    			attr_dev(div2, "class", "text-xl pl-2");
    			add_location(div2, file$3, 59, 12, 2300);
    			attr_dev(div3, "class", "cursor-pointer flex mb-4");
    			add_location(div3, file$3, 57, 8, 2125);
    			attr_dev(div4, "class", "text-2xl mb-2");
    			add_location(div4, file$3, 62, 12, 2408);
    			attr_dev(li0, "id", "Reich");
    			add_location(li0, file$3, 64, 16, 2509);
    			attr_dev(li1, "id", "Stamm");
    			add_location(li1, file$3, 65, 16, 2585);
    			attr_dev(li2, "id", "Klasse");
    			add_location(li2, file$3, 66, 16, 2659);
    			attr_dev(li3, "id", "Ordnung");
    			add_location(li3, file$3, 67, 16, 2732);
    			attr_dev(li4, "id", "Familie");
    			add_location(li4, file$3, 68, 16, 2806);
    			attr_dev(li5, "id", "Gattung");
    			add_location(li5, file$3, 69, 16, 2882);
    			attr_dev(li6, "id", "Art");
    			add_location(li6, file$3, 70, 16, 2956);
    			attr_dev(ul, "class", "text-xl");
    			add_location(ul, file$3, 63, 12, 2471);
    			attr_dev(div5, "class", "");
    			add_location(div5, file$3, 61, 8, 2380);
    			add_location(div6, file$3, 73, 8, 3057);
    			attr_dev(div7, "class", "text-2xl");
    			add_location(div7, file$3, 78, 12, 3166);
    			attr_dev(div8, "class", "pt-2");
    			add_location(div8, file$3, 77, 8, 3134);
    			attr_dev(div9, "class", "resultsListBody svelte-hfpx15");
    			add_location(div9, file$3, 50, 4, 1775);
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, div9, anchor);
    			append_dev(div9, div0);
    			append_dev(div0, strong0);
    			append_dev(strong0, t0);
    			append_dev(div9, t1);
    			append_dev(div9, div1);
    			append_dev(div1, strong1);
    			append_dev(div1, t3);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			append_dev(div9, t4);
    			append_dev(div9, div3);
    			append_dev(div3, img);
    			append_dev(div3, t5);
    			append_dev(div3, div2);
    			append_dev(div9, t7);
    			append_dev(div9, div5);
    			append_dev(div5, div4);
    			append_dev(div5, t9);
    			append_dev(div5, ul);
    			append_dev(ul, li0);
    			append_dev(li0, t10);
    			append_dev(li0, t11);
    			append_dev(ul, t12);
    			append_dev(ul, li1);
    			append_dev(li1, t13);
    			append_dev(li1, t14);
    			append_dev(ul, t15);
    			append_dev(ul, li2);
    			append_dev(li2, t16);
    			append_dev(li2, t17);
    			append_dev(ul, t18);
    			append_dev(ul, li3);
    			append_dev(li3, t19);
    			append_dev(li3, t20);
    			append_dev(ul, t21);
    			append_dev(ul, li4);
    			append_dev(li4, t22);
    			append_dev(li4, t23);
    			append_dev(ul, t24);
    			append_dev(ul, li5);
    			append_dev(li5, t25);
    			append_dev(li5, t26);
    			append_dev(ul, t27);
    			append_dev(ul, li6);
    			append_dev(li6, t28);
    			append_dev(li6, t29);
    			append_dev(div9, t30);
    			append_dev(div9, div6);
    			mount_component(map, div6, null);
    			append_dev(div9, t31);
    			append_dev(div9, div8);
    			append_dev(div8, div7);
    			append_dev(div8, t33);
    			mount_component(images, div8, null);
    			current = true;
    			if (remount) dispose();
    			dispose = listen_dev(div3, "click", /*openWikipedia*/ ctx[2], false, false, false);
    		},
    		p: function update(ctx, dirty) {
    			if ((!current || dirty & /*data*/ 1) && t0_value !== (t0_value = /*data*/ ctx[0].canonicalName + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*data*/ 1) {
    				each_value = /*data*/ ctx[0].vernacularNames;
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

    			if ((!current || dirty & /*data*/ 1) && t11_value !== (t11_value = /*data*/ ctx[0].classification.kingdom + "")) set_data_dev(t11, t11_value);
    			if ((!current || dirty & /*data*/ 1) && t14_value !== (t14_value = /*data*/ ctx[0].classification.phylum + "")) set_data_dev(t14, t14_value);
    			if ((!current || dirty & /*data*/ 1) && t17_value !== (t17_value = /*data*/ ctx[0].classification.class + "")) set_data_dev(t17, t17_value);
    			if ((!current || dirty & /*data*/ 1) && t20_value !== (t20_value = /*data*/ ctx[0].classification.order + "")) set_data_dev(t20, t20_value);
    			if ((!current || dirty & /*data*/ 1) && t23_value !== (t23_value = /*data*/ ctx[0].classification.family + "")) set_data_dev(t23, t23_value);
    			if ((!current || dirty & /*data*/ 1) && t26_value !== (t26_value = /*data*/ ctx[0].classification.genus + "")) set_data_dev(t26, t26_value);
    			if ((!current || dirty & /*data*/ 1) && t29_value !== (t29_value = /*data*/ ctx[0].classification.species + "")) set_data_dev(t29, t29_value);
    			const map_changes = {};
    			if (dirty & /*data*/ 1) map_changes.heatMap = /*data*/ ctx[0].heatMap;
    			map.$set(map_changes);
    			const images_changes = {};
    			if (dirty & /*data*/ 1) images_changes.imageData = /*data*/ ctx[0].images;
    			images.$set(images_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(map.$$.fragment, local);
    			transition_in(images.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(map.$$.fragment, local);
    			transition_out(images.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div9);
    			destroy_each(each_blocks, detaching);
    			destroy_component(map);
    			destroy_component(images);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(50:0) {#if data.matchType === \\\"EXACT\\\" || data.matchType === \\\"FUZZY\\\"}",
    		ctx
    	});

    	return block;
    }

    // (54:12) {#each data.vernacularNames as name, i}
    function create_each_block$1(ctx) {
    	let t0;
    	let t1_value = /*name*/ ctx[6] + "";
    	let t1;

    	let t2_value = (/*i*/ ctx[8] === /*data*/ ctx[0].vernacularNames.length - 1
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
    			if (dirty & /*data*/ 1 && t1_value !== (t1_value = /*name*/ ctx[6] + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*data*/ 1 && t2_value !== (t2_value = (/*i*/ ctx[8] === /*data*/ ctx[0].vernacularNames.length - 1
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
    		source: "(54:12) {#each data.vernacularNames as name, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
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
    	let if_block0 = /*data*/ ctx[0].matchType === "FUZZY" && create_if_block_2(ctx);
    	const if_block_creators = [create_if_block$2, create_if_block_1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*data*/ ctx[0].matchType === "EXACT" || /*data*/ ctx[0].matchType === "FUZZY") return 0;
    		if (/*data*/ ctx[0].matchType !== "EXACT" && /*data*/ ctx[0].matchType !== "FUZZY") return 1;
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
    			attr_dev(button0, "class", "material-icons border-none homeButton svelte-hfpx15");
    			add_location(button0, file$3, 37, 8, 1143);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "name", "latName");
    			attr_dev(input, "class", "input svelte-hfpx15");
    			input.autofocus = true;
    			add_location(input, file$3, 39, 12, 1320);
    			attr_dev(button1, "class", "material-icons goArrow svelte-hfpx15");
    			add_location(button1, file$3, 40, 12, 1412);
    			attr_dev(form, "class", "form svelte-hfpx15");
    			add_location(form, file$3, 38, 8, 1247);
    			attr_dev(div0, "class", "flex formContainer svelte-hfpx15");
    			add_location(div0, file$3, 36, 4, 1101);
    			attr_dev(div1, "class", "containerSearch svelte-hfpx15");
    			add_location(div1, file$3, 35, 0, 1066);
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
    			set_input_value(input, /*$query*/ ctx[1]);
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
    			input.focus();
    			if (remount) run_all(dispose);

    			dispose = [
    				listen_dev(button0, "click", /*click_handler*/ ctx[4], false, false, false),
    				listen_dev(input, "input", /*input_input_handler*/ ctx[5]),
    				listen_dev(button1, "click", processInput$1, false, false, false),
    				listen_dev(form, "submit", prevent_default(processInput$1), false, true, false)
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$query*/ 2 && input.value !== /*$query*/ ctx[1]) {
    				set_input_value(input, /*$query*/ ctx[1]);
    			}

    			if (/*data*/ ctx[0].matchType === "FUZZY") {
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
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    async function processInput$1(input) {
    	let form = input.currentTarget;
    	let name = form.elements.namedItem("latName").value;
    	let apiRequestName = name.replace(/\s/g, "%20");
    	await push(`/search/${apiRequestName}`);
    	location.reload();
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let $query;
    	validate_store(query, "query");
    	component_subscribe($$self, query, $$value => $$invalidate(1, $query = $$value));
    	let { params = {} } = $$props;
    	let data = "";

    	onMount(async () => {
    		set_store_value(query, $query = params.first.replace(/%20/g, " "));
    		$$invalidate(0, data = await fetchAll(params.first));
    		console.log(data);
    	});

    	function openWikipedia() {
    		let parameter = data.canonicalName.replace(/%20/g, "_");
    		window.open(`https://en.wikipedia.org/wiki/${parameter}`, "_blank");
    	}

    	const writable_props = ["params"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$1.warn(`<SearchResult> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("SearchResult", $$slots, []);
    	const click_handler = () => push("/");

    	function input_input_handler() {
    		$query = this.value;
    		query.set($query);
    	}

    	$$self.$set = $$props => {
    		if ("params" in $$props) $$invalidate(3, params = $$props.params);
    	};

    	$$self.$capture_state = () => ({
    		push,
    		onMount,
    		get: get_store_value,
    		fetchAll,
    		query,
    		Images,
    		Map: Map$1,
    		params,
    		data,
    		processInput: processInput$1,
    		openWikipedia,
    		$query
    	});

    	$$self.$inject_state = $$props => {
    		if ("params" in $$props) $$invalidate(3, params = $$props.params);
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [data, $query, openWikipedia, params, click_handler, input_input_handler];
    }

    class SearchResult extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { params: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SearchResult",
    			options,
    			id: create_fragment$5.name
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

    function create_fragment$6(ctx) {
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
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    const app = new App({
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
