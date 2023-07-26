import {PolymerElement} from '@polymer/polymer/polymer-element.js';
import {PTCS} from 'ptcs-library/library.js';
import {PropertyObserver} from 'ptcs-library/property-observer.js';
import './style-aggregator.js';

// The ptcs-part-observer observes part elements (i.e. elements that has a part attribute) among
// its descentant nodes, and informs any subscriber to the style aggregator about any changes.
// ptcs-part-observer only starts observing elements when there is a subscriber targeting these nodes.
// If not, this component is be very light-weight

PTCS.PartObserver = class extends PolymerElement {
    static get is() {
        return 'ptcs-part-observer';
    }

    constructor() {
        super();

        // Is a MutationObserver watching the child elements?
        this._observing = false;
        this._mutationObserver = null;

        // All observed parts under each context: Map(context -> Set(part))
        this._observeContexts = new Map();

        // Current context keys of this element
        this._contextKeys = undefined;
    }

    connectedCallback() {
        super.connectedCallback();

        // Get styleAggregator in current context
        this._styleAggregator = PTCS.styleAggregator.attachPartObserver(this);

        // Watch the (private) context properties of this component
        this._parent = this.getRootNode().host;
        if (!this._parent) {
            console.warn('ptcs-part-observer is useless unless it resides in a shadow dom');
            return;
        }

        // Do parent component already have contexts?
        if (this._parent.__saCtx) {
            this._contextSwitch(this._parent.__saCtx);
        }

        // Observe any changes to the context keys of the parent
        this._contextObserver = new PropertyObserver(
            this._parent,
            '__saCtx',
            this._contextSwitch.bind(this),
            this._touchingContext.bind(this));

        // Check if child elements should be observed
        this._maybeStartObserving();
    }

    disconnectedCallback() {
        if (this._observing) {
            const all = this.querySelectorAll('[part]');
            for (let i = all.length - 1; i >= 0; i--) {
                this._removedEl(all[i]);
            }
        }
        this._parent = undefined;
        this._maybeStopObserving();
        this._contextObserver.cancel();
        this._contextObserver = undefined;
        this._contextKeys = undefined;
        this._styleAggregator.detachPartObserver(this);
        super.disconnectedCallback();
    }

    _cmpCtx(a, b) {
        return a.localeCompare(b);
    }

    _computeRelevantDiff(old, ctx) {
        const added = []; // Added contexts
        const removed = []; // Removed contexts
        let i = old.length - 1;
        let j = ctx.length - 1;
        while (i >= 0 && j >= 0) {
            if (old[i] === ctx[j]) {
                i--;
                j--;
            } else if (this._cmpCtx(old[i], ctx[j]) > 0) {
                if (this._observeContexts.has(old[i])) {
                    removed.push(old[i]);
                }
                i--;
            } else {
                if (this._observeContexts.has(ctx[j])) {
                    added.push(ctx[j]);
                }
                j--;
            }
        }
        while (i >= 0) {
            if (this._observeContexts.has(old[i])) {
                removed.push(old[i]);
            }
            i--;
        }
        while (j >= 0) {
            if (this._observeContexts.has(ctx[j])) {
                added.push(ctx[j]);
            }
            j--;
        }
        return {added, removed};
    }

    _contextSwitch(value) {
        this.__checkContextArray = undefined; // Checking now
        const old = this._contextKeys;
        this._contextKeys = value instanceof Array ? value.map(item => item.key).sort(this._cmpCtx) : undefined;

        const {added, removed} = this._computeRelevantDiff(old || [], this._contextKeys || []);

        if (this._observing) {
            this._maybeStopObserving();
        } else {
            this._maybeStartObserving();
        }

        if (added.length === 0 && removed.length === 0) {
            return; // No relevant change
        }

        // Update all affected children
        const all = this.querySelectorAll('[part]');
        for (let i = all.length - 1; i >= 0; i--) {
            const el = all[i];
            const parts = el.getAttribute('part').split(' ');

            if (removed.length) {
                parts.forEach(atom => removed.forEach(key => {
                    if (this._observeContexts.get(key).has(atom)) {
                        this._removeKey(el, `${key}:${atom}`);
                    }
                }));
            }
            if (added.length) {
                parts.forEach(atom => added.forEach(key => {
                    if (this._observeContexts.get(key).has(atom)) {
                        this._insertKey(el, `${key}:${atom}`);
                    }
                }));
            }
        }
    }

    // Someone is touching the context array. If items are added to or removed from the
    // array there won't be any _contextSwitch(), so the values must be checked manually
    _touchingContext(value) {
        if (this.__checkContextArray) {
            return; // Already started a check callback
        }
        this.__checkContextArray = true;
        requestAnimationFrame(() => {
            if (this.__checkContextArray) {
                this._contextSwitch(this._parent.__saCtx);
            }
        });
    }

    // Get the relevant cssKeys for el
    _resolveKeys(el) {
        const part = el.getAttribute('part');
        if (!part) {
            // This element is not a part element
            return null;
        }

        // Append part name(s) to context keys
        const parts = part.split(' ');
        const r = [];

        this._contextKeys.forEach(key => {
            const ctx = this._observeContexts.get(key);
            if (ctx) {
                parts.forEach(atom => {
                    if (ctx.has(atom)) {
                        r.push(`${key}:${atom}`);
                    }
                });
            }
        });

        return r;
    }

    _removedEl(el) {
        const keys = this._resolveKeys(el);
        if (keys) {
            keys.forEach(key => this._removeKey(el, key));
        }
    }

    _addedEl(el) {
        const keys = this._resolveKeys(el);
        if (keys) {
            keys.forEach(key => this._insertKey(el, key));
        }
    }

    _changedStateKey(el, oldValue) {
        const keys = this._resolveKeys(el);
        if (keys) {
            const stateKey = el.getAttribute('state-key');
            keys.forEach(key => {
                const subscribers = this._styleAggregator.mapSubscriber[key];
                if (subscribers) {
                    subscribers.forEach(cbObj => {
                        if (typeof cbObj.changeStateKey === 'function') {
                            cbObj.changeStateKey(el, stateKey, oldValue);
                        }
                    });
                }
            });
        }
    }

    _removeKey(el, key) {
        const subscribers = this._styleAggregator.mapSubscriber[key];
        if (subscribers) {
            subscribers.forEach(cbObj => cbObj.delist(el));
        }
    }

    _insertKey(el, key) {
        const subscribers = this._styleAggregator.mapSubscriber[key];
        if (subscribers) {
            subscribers.forEach(cbObj => cbObj.enlist(el));
        }
    }

    _splitKey(cssKey) {
        const i = cssKey.lastIndexOf(':');
        if (i === -1) {
            return null;
        }
        return {ctx: cssKey.substring(0, i), part: cssKey.substring(i + 1)};
    }

    _maybeStartObserving() {
        if (this._observing || !this._parent || !this._contextKeys) {
            return;
        }
        if (this._contextKeys.some(ctx => this._observeContexts.has(ctx))) {
            if (!this._mutationObserver) {
                this._mutationObserver = new MutationObserver(mutations => {
                    mutations.forEach(item => {
                        // Removed nodes
                        for (let i = item.removedNodes.length - 1; i >= 0; i--) {
                            const el = item.removedNodes[i];
                            const sub = el.querySelectorAll('[part]');
                            for (let j = sub.length - 1; j >= 0; j--) {
                                this._removedEl(sub[j]);
                            }
                            this._removedEl(el);
                        }
                        // Added nodes
                        for (let i = item.addedNodes.length - 1; i >= 0; i--) {
                            this._addedEl(item.addedNodes[i]);
                        }
                        // state-key changes
                        if (item.attributeName) {
                            if (item.attributeName === 'state-key') {
                                this._changedStateKey(item.target, item.oldValue);
                            } else {
                                // eslint-disable-next-line max-len
                                console.warn('Changed ' + item.attributeName + ' from ' + item.oldValue + ' to ' + item.target.getAttribute(item.attributeName));
                            }
                        }
                    });
                });
            }
            this._mutationObserver.observe(this, {
                childList:         true,
                subtree:           true,
                attributes:        true,
                attributeOldValue: true,
                attributeFilter:   ['part', 'state-key']}
            );

            this._observing = true;
        }
    }

    _maybeStopObserving() {
        if (!this._observing) {
            return;
        }
        if (!this._parent || !this._contextKeys || !this._contextKeys.some(ctx => this._observeContexts.has(ctx))) {
            this._mutationObserver.disconnect();
            this._observing = false;
        }
    }

    observeKey(cssKey) {
        const k = this._splitKey(cssKey);
        if (!k) {
            return;
        }
        const parts = this._observeContexts.get(k.ctx);
        if (parts) {
            parts.add(k.part);
        } else {
            this._observeContexts.set(k.ctx, new Set([k.part]));
            this._maybeStartObserving(); // Context has been added
        }
    }

    unobserveKey(cssKey) {
        const k = this._splitKey(cssKey);
        if (!k) {
            return;
        }
        const parts = this._observeContexts.get(k.ctx);
        if (parts) {
            parts.delete(k.part);
            if (parts.length === 0) {
                this._observeContexts.delete(k.ctx);
                this._maybeStopObserving(); // Context has been removed
            }
        }
    }

    queryKey(cssKey, cb) {
        const k = this._splitKey(cssKey);
        if (!k || !this._contextKeys || !this._contextKeys.some(ctx => ctx === k.ctx)) {
            return; // The cssKey is not relevant
        }

        const parts = this.querySelectorAll(`[part~="${k.part}"]`);
        for (let i = parts.length - 1; i >= 0; i--) {
            cb(parts[i]);
        }
    }
};

customElements.define(PTCS.PartObserver.is, PTCS.PartObserver);
