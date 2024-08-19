
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
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
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        if (node.parentNode) {
            node.parentNode.removeChild(node);
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
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function to_number(value) {
        return value === '' ? null : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        if (value == null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    /**
     * The `onMount` function schedules a callback to run as soon as the component has been mounted to the DOM.
     * It must be called during the component's initialisation (but doesn't need to live *inside* the component;
     * it can be called from an external module).
     *
     * `onMount` does not run inside a [server-side component](/docs#run-time-server-side-component-api).
     *
     * https://svelte.dev/docs#run-time-svelte-onmount
     */
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    let render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = /* @__PURE__ */ Promise.resolve();
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
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        // Do not reenter flush while dirty components are updated, as this can
        // result in an infinite loop. Instead, let the inner flush handle it.
        // Reentrancy is ok afterwards for bindings etc.
        if (flushidx !== 0) {
            return;
        }
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            try {
                while (flushidx < dirty_components.length) {
                    const component = dirty_components[flushidx];
                    flushidx++;
                    set_current_component(component);
                    update(component.$$);
                }
            }
            catch (e) {
                // reset dirty state to not end up in a deadlocked state and then rethrow
                dirty_components.length = 0;
                flushidx = 0;
                throw e;
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
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
        seen_callbacks.clear();
        set_current_component(saved_component);
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
    /**
     * Useful for example to execute remaining `afterUpdate` callbacks before executing `destroy`.
     */
    function flush_render_callbacks(fns) {
        const filtered = [];
        const targets = [];
        render_callbacks.forEach((c) => fns.indexOf(c) === -1 ? filtered.push(c) : targets.push(c));
        targets.forEach((c) => c());
        render_callbacks = filtered;
    }
    const outroing = new Set();
    let outros;
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
        else if (callback) {
            callback();
        }
    }

    function destroy_block(block, lookup) {
        block.d(1);
        lookup.delete(block.key);
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        const updates = [];
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                // defer updates until all the DOM shuffling is done
                updates.push(() => block.p(child_ctx, dirty));
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        run_all(updates);
        return new_blocks;
    }
    function validate_each_keys(ctx, list, get_context, get_key) {
        const keys = new Set();
        for (let i = 0; i < list.length; i++) {
            const key = get_key(get_context(ctx, list, i));
            if (keys.has(key)) {
                throw new Error('Cannot have duplicate keys in a keyed each');
            }
            keys.add(key);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
                // if the component was destroyed immediately
                // it will update the `$$.on_destroy` reference to `null`.
                // the destructured on_destroy may still reference to the old array
                if (component.$$.on_destroy) {
                    component.$$.on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            flush_render_callbacks($$.after_update);
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
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: [],
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
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
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            if (!is_function(callback)) {
                return noop;
            }
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.59.2' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation, has_stop_immediate_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        if (has_stop_immediate_propagation)
            modifiers.push('stopImmediatePropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
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
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/components/CrudList.svelte generated by Svelte v3.59.2 */

    const { console: console_1 } = globals;
    const file$1 = "src/components/CrudList.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[16] = list[i];
    	return child_ctx;
    }

    // (67:4) {#if errorMessage}
    function create_if_block(ctx) {
    	let p;
    	let t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(/*errorMessage*/ ctx[2]);
    			set_style(p, "color", "red");
    			add_location(p, file$1, 67, 8, 3264);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*errorMessage*/ 4) set_data_dev(t, /*errorMessage*/ ctx[2]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(67:4) {#if errorMessage}",
    		ctx
    	});

    	return block;
    }

    // (80:4) {#each friends as friend (friend.id)}
    function create_each_block(key_1, ctx) {
    	let li;
    	let span;
    	let t0_value = /*friend*/ ctx[16].first_name + "";
    	let t0;
    	let t1;
    	let t2_value = /*friend*/ ctx[16].last_name + "";
    	let t2;
    	let t3;
    	let t4_value = /*friend*/ ctx[16].age + "";
    	let t4;
    	let t5;
    	let t6_value = /*friend*/ ctx[16].city + "";
    	let t6;
    	let t7;
    	let t8_value = /*friend*/ ctx[16].state + "";
    	let t8;
    	let t9;
    	let div;
    	let button0;
    	let t11;
    	let button1;
    	let t13;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[12](/*friend*/ ctx[16]);
    	}

    	function click_handler_1() {
    		return /*click_handler_1*/ ctx[13](/*friend*/ ctx[16]);
    	}

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			li = element("li");
    			span = element("span");
    			t0 = text(t0_value);
    			t1 = space();
    			t2 = text(t2_value);
    			t3 = text(", ");
    			t4 = text(t4_value);
    			t5 = text(", ");
    			t6 = text(t6_value);
    			t7 = text(", ");
    			t8 = text(t8_value);
    			t9 = space();
    			div = element("div");
    			button0 = element("button");
    			button0.textContent = "Update";
    			t11 = space();
    			button1 = element("button");
    			button1.textContent = "Delete";
    			t13 = space();
    			attr_dev(span, "class", "svelte-xogxz0");
    			add_location(span, file$1, 81, 12, 4156);
    			attr_dev(button0, "class", "svelte-xogxz0");
    			add_location(button0, file$1, 83, 16, 4341);
    			attr_dev(button1, "class", "svelte-xogxz0");
    			add_location(button1, file$1, 84, 16, 4454);
    			attr_dev(div, "class", "buttons svelte-xogxz0");
    			add_location(div, file$1, 82, 12, 4303);
    			attr_dev(li, "class", "friend-item svelte-xogxz0");
    			add_location(li, file$1, 80, 8, 4119);
    			this.first = li;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, span);
    			append_dev(span, t0);
    			append_dev(span, t1);
    			append_dev(span, t2);
    			append_dev(span, t3);
    			append_dev(span, t4);
    			append_dev(span, t5);
    			append_dev(span, t6);
    			append_dev(span, t7);
    			append_dev(span, t8);
    			append_dev(li, t9);
    			append_dev(li, div);
    			append_dev(div, button0);
    			append_dev(div, t11);
    			append_dev(div, button1);
    			append_dev(li, t13);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", click_handler, false, false, false, false),
    					listen_dev(button1, "click", click_handler_1, false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*friends*/ 1 && t0_value !== (t0_value = /*friend*/ ctx[16].first_name + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*friends*/ 1 && t2_value !== (t2_value = /*friend*/ ctx[16].last_name + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*friends*/ 1 && t4_value !== (t4_value = /*friend*/ ctx[16].age + "")) set_data_dev(t4, t4_value);
    			if (dirty & /*friends*/ 1 && t6_value !== (t6_value = /*friend*/ ctx[16].city + "")) set_data_dev(t6, t6_value);
    			if (dirty & /*friends*/ 1 && t8_value !== (t8_value = /*friend*/ ctx[16].state + "")) set_data_dev(t8, t8_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(80:4) {#each friends as friend (friend.id)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div;
    	let h20;
    	let t1;
    	let t2;
    	let input0;
    	let t3;
    	let input1;
    	let t4;
    	let input2;
    	let t5;
    	let input3;
    	let t6;
    	let input4;
    	let t7;
    	let button;
    	let t8_value = (/*editingFriend*/ ctx[3] ? 'Update' : 'Add') + "";
    	let t8;
    	let t9;
    	let h21;
    	let t11;
    	let ul;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let mounted;
    	let dispose;
    	let if_block = /*errorMessage*/ ctx[2] && create_if_block(ctx);
    	let each_value = /*friends*/ ctx[0];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*friend*/ ctx[16].id;
    	validate_each_keys(ctx, each_value, get_each_context, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			h20 = element("h2");
    			h20.textContent = "Add a new friend";
    			t1 = space();
    			if (if_block) if_block.c();
    			t2 = space();
    			input0 = element("input");
    			t3 = space();
    			input1 = element("input");
    			t4 = space();
    			input2 = element("input");
    			t5 = space();
    			input3 = element("input");
    			t6 = space();
    			input4 = element("input");
    			t7 = space();
    			button = element("button");
    			t8 = text(t8_value);
    			t9 = space();
    			h21 = element("h2");
    			h21.textContent = "Friends List";
    			t11 = space();
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(h20, file$1, 65, 4, 3207);
    			attr_dev(input0, "placeholder", "First Name");
    			attr_dev(input0, "class", "svelte-xogxz0");
    			add_location(input0, file$1, 69, 4, 3368);
    			attr_dev(input1, "placeholder", "Last Name");
    			attr_dev(input1, "class", "svelte-xogxz0");
    			add_location(input1, file$1, 70, 4, 3484);
    			attr_dev(input2, "type", "number");
    			attr_dev(input2, "placeholder", "Age");
    			attr_dev(input2, "class", "svelte-xogxz0");
    			add_location(input2, file$1, 71, 4, 3597);
    			attr_dev(input3, "placeholder", "City");
    			attr_dev(input3, "class", "svelte-xogxz0");
    			add_location(input3, file$1, 72, 4, 3706);
    			attr_dev(input4, "placeholder", "State");
    			attr_dev(input4, "class", "svelte-xogxz0");
    			add_location(input4, file$1, 73, 4, 3804);
    			attr_dev(button, "class", "svelte-xogxz0");
    			add_location(button, file$1, 74, 4, 3905);
    			attr_dev(div, "class", "svelte-xogxz0");
    			add_location(div, file$1, 64, 0, 3197);
    			add_location(h21, file$1, 77, 0, 4042);
    			attr_dev(ul, "class", "svelte-xogxz0");
    			add_location(ul, file$1, 78, 0, 4064);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h20);
    			append_dev(div, t1);
    			if (if_block) if_block.m(div, null);
    			append_dev(div, t2);
    			append_dev(div, input0);
    			set_input_value(input0, /*newFriend*/ ctx[1].first_name);
    			append_dev(div, t3);
    			append_dev(div, input1);
    			set_input_value(input1, /*newFriend*/ ctx[1].last_name);
    			append_dev(div, t4);
    			append_dev(div, input2);
    			set_input_value(input2, /*newFriend*/ ctx[1].age);
    			append_dev(div, t5);
    			append_dev(div, input3);
    			set_input_value(input3, /*newFriend*/ ctx[1].city);
    			append_dev(div, t6);
    			append_dev(div, input4);
    			set_input_value(input4, /*newFriend*/ ctx[1].state);
    			append_dev(div, t7);
    			append_dev(div, button);
    			append_dev(button, t8);
    			insert_dev(target, t9, anchor);
    			insert_dev(target, h21, anchor);
    			insert_dev(target, t11, anchor);
    			insert_dev(target, ul, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(ul, null);
    				}
    			}

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[7]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[8]),
    					listen_dev(input2, "input", /*input2_input_handler*/ ctx[9]),
    					listen_dev(input3, "input", /*input3_input_handler*/ ctx[10]),
    					listen_dev(input4, "input", /*input4_input_handler*/ ctx[11]),
    					listen_dev(button, "click", /*addOrUpdateFriend*/ ctx[4], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*errorMessage*/ ctx[2]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					if_block.m(div, t2);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*newFriend*/ 2 && input0.value !== /*newFriend*/ ctx[1].first_name) {
    				set_input_value(input0, /*newFriend*/ ctx[1].first_name);
    			}

    			if (dirty & /*newFriend*/ 2 && input1.value !== /*newFriend*/ ctx[1].last_name) {
    				set_input_value(input1, /*newFriend*/ ctx[1].last_name);
    			}

    			if (dirty & /*newFriend*/ 2 && to_number(input2.value) !== /*newFriend*/ ctx[1].age) {
    				set_input_value(input2, /*newFriend*/ ctx[1].age);
    			}

    			if (dirty & /*newFriend*/ 2 && input3.value !== /*newFriend*/ ctx[1].city) {
    				set_input_value(input3, /*newFriend*/ ctx[1].city);
    			}

    			if (dirty & /*newFriend*/ 2 && input4.value !== /*newFriend*/ ctx[1].state) {
    				set_input_value(input4, /*newFriend*/ ctx[1].state);
    			}

    			if (dirty & /*editingFriend*/ 8 && t8_value !== (t8_value = (/*editingFriend*/ ctx[3] ? 'Update' : 'Add') + "")) set_data_dev(t8, t8_value);

    			if (dirty & /*deleteFriend, friends, editFriend*/ 97) {
    				each_value = /*friends*/ ctx[0];
    				validate_each_argument(each_value);
    				validate_each_keys(ctx, each_value, get_each_context, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, ul, destroy_block, create_each_block, null, get_each_context);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    			if (detaching) detach_dev(t9);
    			if (detaching) detach_dev(h21);
    			if (detaching) detach_dev(t11);
    			if (detaching) detach_dev(ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			mounted = false;
    			run_all(dispose);
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

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('CrudList', slots, []);
    	let friends = []; // Define an array to hold the list of friends

    	let newFriend = {
    		first_name: '',
    		last_name: '',
    		age: '',
    		city: '',
    		state: ''
    	}; // Define an object to hold the new friend's details

    	let apiUrl = 'http://localhost:3000/friends'; // Define the base URL for the API
    	let errorMessage = ''; // Define a variable to hold error messages
    	let editingFriend = null; // What friend to update

    	// Fetch friends from API (GET request)
    	async function fetchFriends() {
    		const response = await fetch(apiUrl); // Make a GET request to the API endpoint
    		$$invalidate(0, friends = await response.json()); // Parse the response as JSON and assign it to the friends array
    	}

    	// Add a new friend (POST request) or update (PUT request)
    	async function addOrUpdateFriend() {
    		// Check if all fields of the new friend are filled
    		if (newFriend.first_name.trim() && newFriend.last_name.trim() && newFriend.age && newFriend.city.trim() && newFriend.state.trim()) {
    			$$invalidate(2, errorMessage = ''); // Clear any previous error messages

    			// Determine the request method and URL based on whether editing a friend
    			const method = editingFriend ? 'PUT' : 'POST';

    			const url = editingFriend ? `${apiUrl}/${newFriend.id}` : apiUrl;

    			const response = await fetch(url, {
    				method, // Specify the request method as POST or PUT
    				headers: { 'Content-Type': 'application/json' }, // Set the request headers to indicate JSON content
    				body: JSON.stringify(newFriend), // Convert the new friend object to JSON and send it in the request body
    				
    			});

    			if (response.ok) {
    				// If the response is OK (status 200-299)
    				$$invalidate(1, newFriend = {
    					first_name: '',
    					last_name: '',
    					age: '',
    					city: '',
    					state: ''
    				}); // Reset the new friend object to empty

    				$$invalidate(3, editingFriend = null); // Clear the editing friend
    				await fetchFriends(); // Fetch the updated list of friends
    			} else {
    				console.error('Failed to save friend'); // Log an error message if the request failed
    			}
    		} else {
    			$$invalidate(2, errorMessage = 'All fields are required.'); // Set an error message if validation fails
    		}
    	}

    	// Set up the form for editing a friend
    	function editFriend(friend) {
    		$$invalidate(1, newFriend = { ...friend }); // Populate the form with the friend's details
    		$$invalidate(3, editingFriend = friend); // Set the friend being edited
    	}

    	// Delete a friend (DELETE request)
    	async function deleteFriend(id) {
    		const response = await fetch(`${apiUrl}/${id}`, {
    			method: 'DELETE', // Specify the request method as DELETE
    			
    		});

    		if (response.ok) {
    			// If the response is OK
    			await fetchFriends(); // Fetch the updated list of friends
    		} else {
    			console.error('Failed to delete friend'); // Log an error message if the request failed
    		}
    	}

    	onMount(fetchFriends); // Fetch the list of friends when the component is mounted
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<CrudList> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		newFriend.first_name = this.value;
    		$$invalidate(1, newFriend);
    	}

    	function input1_input_handler() {
    		newFriend.last_name = this.value;
    		$$invalidate(1, newFriend);
    	}

    	function input2_input_handler() {
    		newFriend.age = to_number(this.value);
    		$$invalidate(1, newFriend);
    	}

    	function input3_input_handler() {
    		newFriend.city = this.value;
    		$$invalidate(1, newFriend);
    	}

    	function input4_input_handler() {
    		newFriend.state = this.value;
    		$$invalidate(1, newFriend);
    	}

    	const click_handler = friend => editFriend(friend);
    	const click_handler_1 = friend => deleteFriend(friend.id);

    	$$self.$capture_state = () => ({
    		onMount,
    		friends,
    		newFriend,
    		apiUrl,
    		errorMessage,
    		editingFriend,
    		fetchFriends,
    		addOrUpdateFriend,
    		editFriend,
    		deleteFriend
    	});

    	$$self.$inject_state = $$props => {
    		if ('friends' in $$props) $$invalidate(0, friends = $$props.friends);
    		if ('newFriend' in $$props) $$invalidate(1, newFriend = $$props.newFriend);
    		if ('apiUrl' in $$props) apiUrl = $$props.apiUrl;
    		if ('errorMessage' in $$props) $$invalidate(2, errorMessage = $$props.errorMessage);
    		if ('editingFriend' in $$props) $$invalidate(3, editingFriend = $$props.editingFriend);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		friends,
    		newFriend,
    		errorMessage,
    		editingFriend,
    		addOrUpdateFriend,
    		editFriend,
    		deleteFriend,
    		input0_input_handler,
    		input1_input_handler,
    		input2_input_handler,
    		input3_input_handler,
    		input4_input_handler,
    		click_handler,
    		click_handler_1
    	];
    }

    class CrudList extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CrudList",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.59.2 */
    const file = "src/App.svelte";

    function create_fragment(ctx) {
    	let main;
    	let h1;
    	let t1;
    	let crudlist;
    	let current;
    	crudlist = new CrudList({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			h1 = element("h1");
    			h1.textContent = "CRUD List";
    			t1 = space();
    			create_component(crudlist.$$.fragment);
    			attr_dev(h1, "class", "svelte-1tky8bj");
    			add_location(h1, file, 5, 1, 82);
    			attr_dev(main, "class", "svelte-1tky8bj");
    			add_location(main, file, 4, 0, 74);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			append_dev(main, t1);
    			mount_component(crudlist, main, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(crudlist.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(crudlist.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(crudlist);
    		}
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

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ CrudList });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
