import {PTCS} from 'ptcs-library/library.js';

// Assert function - move to library.html
if (!PTCS.assert) {
    PTCS.assert = test => {
        if (!test) {
            throw Error('Assertion failed');
        }
    };
}

// Naming conventions
// - wc = generic Web Component
// - su = ptcs-style-unit
// - sc = ptcs-style-context
// - el = generic DOM element

// Style Aggregator public interface
// - enlist(wc): Enlist web component (= get styling from style aggregator)
// - delist(wc): Delist enlisted web component
// - attachStyle(su): Attach a ptcs-style-unit
// - updateStyle(su): Update a ptcs-style-unit
// - detachStyle(su): Detach a ptcs-style-unit
// - attachContext(sc): Attach a ptcs-style-context
// - detachContext(sc): Detach a ptcs-style-context

// Added structures
// wc.__saSa, su.__saSa, sc.__saSa: containing style aggregator instance
// wc.__saSub: Set of sub-wc that are affected by wc.variant
// wc.__saCtx: Array of css keys (strings)
// wc.__saVariantObserver: MutationObserver watching @id and @variant
// wc.__saId: current id for wc. Only assigned on top-level components
// su.__saOldKey: CSS key (string) that style unit has been registered under


export class StyleAggregator {
    constructor() {
        // Map cssKey's to web components
        // mapWC: Map: cssKey -> Set of enlisted wc's that occurs in the cssKey context
        this.mapWC = new Map();

        // Map cssKey's to CSS styling
        // cssKey -> {
        //   css: string of combined CSS styling for this cssKey context,
        //   set: Set of contributing ptcs-style-units
        //   sheet: CSSStyleSheet - a constructable stylesheet containing css (when supported on platform)
        // }
        this.mapCSS = new Map();

        // Map subscribers to CB keys
        this.mapSubscriber = {};

        // Map partObservers
        this.partObservers = new Set();

        this._setStyle = PTCS.hasConstructableStylesheets ? this._setStyle_Ccss : this._setStyle_noCcss;

        // child contexts (ptcs-style-context elements)
        /** @type {Set} */
        this.subContexts = undefined;
    }

    // Create component key
    _wcName(wc) {
        const variant = wc.getAttribute('variant');

        return variant ? wc.tagName + '.' + variant : wc.tagName;
    }

    // Attach sub-wc that observes changes to wc@variant
    _attachSubWC(wc, wcSub) {
        if (wc.noWcStyle) {
            return;
        }

        if (!wc.__saSub) {
            wc.__saSub = new Set();
        }

        wc.__saSub.add(wcSub);
    }

    // Detach sub-wc that observes changes to wc@variant
    _detachSubWC(wc, wcSub) {
        if (wc.__saSub) {
            wc.__saSub.delete(wcSub);
        }
    }

    /**
     * Find containing WC
     * caches result
     * @param {HTMLElement} wc
     * @returns {HTMLElement}
     */
    _getParentComponent(wc) {
        if (!wc.hasOwnProperty('__saParent')) {
            wc.__saParent = wc.getRootNode().host;
        }
        return wc.__saParent;
    }

    // Find all cssKeys (contexts) for this component
    _findKeys(wc) {
        let r = [];

        if (!wc.noWcStyle) {
            r.push({key: this._wcName(wc)});
        }

        const parent = this._getParentComponent(wc);
        if (parent) {
            // What part-name does this component have in its parent component?
            const part = wc.getAttribute('part');
            if (part) {
                // Get context strings from parent and add our part name to them
                part.split(' ').forEach(atom => this._assignKeys(parent).forEach(item => {
                    r.push({key: item.key + ':' + atom});
                }));

                this._attachSubWC(parent, wc);
            }

            if (wc.__saVariantObserver) {
                wc.__saVariantObserver.observe(wc, {attributes: true, attributeOldValue: true, attributeFilter: ['variant', 'state-key']});
            }
        } else {
            // This is a top-level component. Keep track of its id
            wc.__saId = wc.getAttribute('id');

            if (wc.__saVariantObserver) {
                wc.__saVariantObserver.observe(wc, {attributes: true, attributeOldValue: true, attributeFilter: ['variant', 'state-key', 'id']});
            }
        }

        return r;
    }

    // A variant attribute has been changed which affects the cssKeys
    _changeKey(wc, wcId, oldId) {
        wc.__saCtx.forEach((item, index) => {
            if (item.key.startsWith(oldId)) {
                this._detachFromKey(wc, item);
                item.key = wcId + item.key.substring(oldId.length);
                this._attachToKey(wc, item);

                if (item.style) {
                    item.style.setAttribute('ctx', item.key);
                }

                const cssBucket = this.mapCSS.get(item.key);
                if (cssBucket) {
                    this._setStyle(wc, index, cssBucket);
                }
            }
        });

        // Notify children
        if (wc.__saSub) {
            wc.__saSub.forEach(_wc => {
                this._changeKey(_wc, wcId, oldId);
            });
        }
    }

    _assignKeys(wc) {
        // Watch changes to @variant?
        if (!wc.__saVariantObserver && !wc.noWcStyle) {
            // Each element needs its own observer, because we cannot turn off observe() requests
            wc.__saVariantObserver = new MutationObserver(mutations => {
                // Changes must be processed in this order: (i) variant, (ii) id, (iii) state-key
                const m = {};
                mutations.forEach(mutation => {
                    m[mutation.attributeName] = mutation;
                });

                if (m.variant) {
                    if (wc.__saCtx[0]) {
                        const wcId = this._wcName(wc);
                        const oldId = wc.__saCtx[0].key;
                        if (wcId !== oldId) {
                            this._changeKey(wc, wcId, oldId);
                        }
                    }
                }
                if (m.id) {
                    if (wc.__saId) {
                        this._removeToplevelIdKey(wc);
                    }
                    wc.__saId = wc.getAttribute('id');
                    if (wc.__saId) {
                        this._addToplevelIdKey(wc);
                    }
                }
                const stateKey = m['state-key'];
                if (stateKey) {
                    this._changeStateKey(stateKey.target, stateKey.oldValue);
                }
            });
        }

        // Get the css keys
        if (!wc.__saCtx) {
            wc.__saCtx = this._findKeys(wc);
        }

        return wc.__saCtx;
    }

    // Register this component and all its sub-components to the id
    _addToplevelIdKey(wc) {
        PTCS.assert(wc.__saId);
        this._addIdKey(wc, this._wcName(wc), `#${wc.__saId}`);
    }

    // Unregister this component and all its sub-components from the id
    _removeToplevelIdKey(wc) {
        PTCS.assert(wc.__saId);
        this._removeIdKey(wc, `#${wc.__saId}`);
    }

    // Add id key
    _addIdKey(wc, wcName, id) {
        if (wc.__saCtx) {
            let r = [];

            // Compute new key values
            wc.__saCtx.forEach(item => {
                if (item.key.startsWith(wcName)) {
                    r.push({key: id + item.key.substring(wcName.length)});
                }
            });

            // Attach to new keys
            r.forEach(item => {
                wc.__saCtx.push(item);
                this._attachToKey(wc, item);

                const cssBucket = this.mapCSS.get(item.key);
                if (cssBucket) {
                    this._setStyle(wc, wc.__saCtx.length - 1, cssBucket);
                }
            });
        }

        // Notify children
        if (wc.__saSub) {
            wc.__saSub.forEach(_wc => this._addIdKey(_wc, wcName, id));
        }
    }

    // Remove id key
    _removeIdKey(wc, id) {
        if (wc.__saCtx) {
            let r = [];

            wc.__saCtx.forEach((item, index) => {
                if (item.key.startsWith(id)) {
                    r.unshift(index);

                    // Detach key from style aggregator
                    this._detachFromKey(wc, item);

                    // Detach <style> element from widget
                    if (item.style) {
                        item.style.parentNode.removeChild(item.style);
                        item.style = undefined;
                    }
                }
            });

            // Remove the items
            r.forEach(index => wc.__saCtx.splice(index, 1));
        }

        // Notify children
        if (wc.__saSub) {
            wc.__saSub.forEach(_wc => this._removeIdKey(_wc, id));
        }
    }

    _setStyle_Ccss(wc, index, cssBucket) {
        const item = wc.__saCtx[index];

        PTCS.assert(item && item.key);

        // Has the sheet already been put at the right place?
        if (!item.sheet) {
            item.sheet = cssBucket.sheet;

            // Find insertion point
            const n = wc.__saCtx.length;
            let i;

            for (i = index + 1; i < n; i++) {
                if (wc.__saCtx[i].sheet) {
                    break;
                }
            }

            // Insert the stylesheet
            if (i < n) {
                //wc.shadowRoot.adoptedStyleSheets.insertBefore(item.sheet, wc.__saCtx[i].sheet);
                const a = [];
                wc.shadowRoot.adoptedStyleSheets.forEach(sheet => {
                    if (sheet === wc.__saCtx[i].sheet) {
                        a.push(item.sheet);
                    }
                    a.push(sheet);
                });
                PTCS.assert(a.find(x => x === item.sheet));
                wc.shadowRoot.adoptedStyleSheets = a;
            } else {
                wc.shadowRoot.adoptedStyleSheets = [...wc.shadowRoot.adoptedStyleSheets, item.sheet];
            }
        }

        PTCS.assert(item.sheet === cssBucket.sheet);
    }

    _setStyle_noCcss(wc, index, cssBucket) {
        const item = wc.__saCtx[index];

        PTCS.assert(item && item.key);

        // Must create <style> element?
        if (!item.style && cssBucket.css) {
            item.style = document.createElement('style');

            item.style.setAttribute('ctx', item.key);

            // Find insertion point
            const n = wc.__saCtx.length;
            let i;

            for (i = index + 1; i < n; i++) {
                if (wc.__saCtx[i].style) {
                    break;
                }
            }

            // Insert the <style>
            if (i < n) {
                wc.shadowRoot.insertBefore(item.style, wc.__saCtx[i].style);
            } else {
                wc.shadowRoot.append(item.style);
            }
        }

        // Assign the style content
        if (item.style) {
            item.style.innerText = cssBucket.css;
        }
    }

    // Attach element to CSS key
    _attachToKey(wc, item) {
        let elems = this.mapWC.get(item.key);

        if (!elems) {
            elems = new Set();
            this.mapWC.set(item.key, elems);
        }

        elems.add(wc);

        PTCS.assert(!item.sheet);

        // Inform subscribers
        const subscribers = this.mapSubscriber[item.key];
        if (subscribers) {
            subscribers.forEach(cbObj => cbObj.enlist(wc));
        }
    }

    // Detach element from CSS key
    _detachFromKey(wc, item) {
        const elems = this.mapWC.get(item.key);

        if (elems) {
            elems.delete(wc);
            if (elems.size === 0) {
                this.mapWC.delete(item.key);

                // Can the styling for this key be deleted too?
                const cssBucket = this.mapCSS.get(item.key);
                if (cssBucket && cssBucket.set.size === 0) {
                    this.mapCSS.delete(item.key);
                }
            }
        } else {
            console.warn('delisting component from unregistered key: ' + item.key);
        }

        if (item.sheet) {
            PTCS.assert(wc.shadowRoot.adoptedStyleSheets.find(x => x === item.sheet) === item.sheet);
            const a = [];
            wc.shadowRoot.adoptedStyleSheets.forEach(sheet => {
                if (sheet !== item.sheet) {
                    a.push(sheet);
                }
            });
            wc.shadowRoot.adoptedStyleSheets = a;
            PTCS.assert(!wc.shadowRoot.adoptedStyleSheets.find(x => x === item.sheet));

            item.sheet = undefined;
        }

        // Inform subscribers
        const subscribers = this.mapSubscriber[item.key];
        if (subscribers) {
            subscribers.forEach(cbObj => cbObj.delist(wc));
        }
    }

    // Attach a web component to the style manager structure
    _attachWC(wc) {
        // Compute CSS keys of this WC and bind them to style aggeregator
        this._assignKeys(wc).forEach((item, index) => {
            PTCS.assert(!item.style);

            // Inform style aggregator that this wc occurs in this context
            this._attachToKey(wc, item);

            // Add style element, if there is styling
            const cssBucket = this.mapCSS.get(item.key);
            if (cssBucket) {
                this._setStyle(wc, index, cssBucket);
            }
        });

        // Is the web component a top level component with an ID?
        if (wc.__saId) {
            this._addToplevelIdKey(wc);
        }
    }

    // Remove a web component from the style manager structure
    _detachWC(wc) {
        // Turn off @variant watcher
        if (wc.__saVariantObserver) {
            wc.__saVariantObserver.disconnect();
            wc.__saVariantObserver = undefined;
        }

        if (wc.__saCtx) {
            wc.__saCtx.forEach(item => {
                // Detach key from style aggregator
                this._detachFromKey(wc, item);

                // Detach <style> elements from widget
                if (item.style) {
                    item.style.parentNode.removeChild(item.style);
                    item.style = undefined;
                }
            });

            // Discard CSS keys
            wc.__saCtx = undefined;

            // Discard ID, if any
            wc.__saId = undefined;
        }

        // Detach from parent wc
        if (wc.getAttribute('part')) {
            const parent = this._getParentComponent(wc);
            if (parent) {
                this._detachSubWC(parent, wc);
            }
        }
    }

    // A Web Component wants to use the style manager service
    enlist(wc) {
        const aggr = this.findAggregator(wc);
        if (aggr === this) {
            // If main widget key has changed ... (a variant has been assigned)
            if (wc.__saCtx && wc.__saCtx[0]) {
                const key = this._wcName(wc);
                const old = wc.__saCtx[0].key;
                if (key !== old) {
                    wc.__saCtx[0].key = key;
                    PTCS.assert(!wc.__saCtx[0].style);
                    // Notify children
                    if (wc.__saSub) {
                        wc.__saSub.forEach(_wc => this._changeKey(_wc, key + ':', old + ':'));
                    }
                }
            }

            this._attachWC(wc);
        } else {
            aggr.enlist(wc);
        }
    }

    // A Web Component wants to leave the style manager
    delist(wc) {
        PTCS.assert(wc.__saSa);
        if (wc.__saSa === this) {
            this._detachWC(wc);
            wc.__saSa = null;
            delete wc.__saParent;
        } else {
            wc.__saSa.delist(wc);
        }
    }

    // Assign a CSS unit to all WC's that are using it
    _assignCSS(cssKey, cssBucket) {
        const elems = this.mapWC.get(cssKey);

        if (!elems) {
            return;
        }

        elems.forEach(el => {
            const i = el.__saCtx.findIndex(item => item.key === cssKey);
            PTCS.assert(i >= 0);
            this._setStyle(el, i, cssBucket);
        });
    }

    _cssKey(cssKey) {
        if (!cssKey || cssKey[0] !== '#') {
            return cssKey;
        }

        // If key specifies a component name (i.e. matches #id.component), then strip the component name
        const m = /^(#[\w-]+)(\.[\w-]+)(:.+)?$/.exec(cssKey);

        if (!m) {
            return cssKey;
        }

        return m[3] ? m[1] + m[3] : m[1];
    }

    // Attach a style unit
    _attachCSS(su) {
        const cssKey = this._cssKey(su.__saOldKey = su.cssKey);

        if (!cssKey) {
            return;
        }

        // Add css to this cssKey
        let cssBucket = this.mapCSS.get(cssKey);
        if (!cssBucket) {
            cssBucket = {
                css:   '',
                set:   new Set(),
                sheet: PTCS.hasConstructableStylesheets ? new CSSStyleSheet() : undefined
            };
            this.mapCSS.set(cssKey, cssBucket);
        }

        cssBucket.set.add(su);
        cssBucket.css += su.textContent;
        if (cssBucket.sheet) {
            cssBucket.sheet.replaceSync(cssBucket.css);
        }

        // Update web components
        this._assignCSS(cssKey, cssBucket);
    }

    // Detach a style unit
    _detachCSS(su) {
        const cssKey = this._cssKey(su.__saOldKey);

        if (!cssKey) {
            return;
        }

        // Clear CSS key
        su.__saOldKey = undefined;

        // Remove style unit from CSS key bucket
        const cssBucket = this.mapCSS.get(cssKey);

        PTCS.assert(cssBucket);

        cssBucket.set.delete(su);
        if (cssBucket.set.size === 0) {
            // The cssBucket can only be deleted if no web components are attached to it
            if (!this.mapWC.get(cssKey)) {
                this.mapCSS.delete(cssKey);
            }
        }

        // Update style content
        this._regenerateStyles(cssKey, cssBucket);
    }

    // Regenerate the CSS for a specfic cssKey (a style unit has been changed / removed)
    _regenerateStyles(cssKey, cssBucket) {
        let css = '';

        cssBucket.set.forEach(su => {
            css += su.textContent;
        });

        cssBucket.css = css;

        if (cssBucket.sheet) {
            // Using Constructable Stylesheets: update the stylesheet
            cssBucket.sheet.replaceSync(cssBucket.css);
        } else {
            // Not using Constructable Stylesheets: update web components
            this._assignCSS(cssKey, cssBucket);
        }
    }

    // Tell the world that this style aggregator has changed some styling
    _sendSuEvent() {
        if (!this._suEventOn) {
            this._suEventOn = true;
            requestAnimationFrame(() => {
                this._suEventOn = undefined;
                document.dispatchEvent(new CustomEvent('style-aggregator', {detail: {sa: this, type: 'styling'}}));
            });
        }
    }

    // Attach a ptcs-style-unit
    attachStyle(su) {
        const aggr = this.findAggregator(su);
        if (aggr === this) {
            PTCS.assert(!su.__saOldKey);
            this._attachCSS(su);
            this._sendSuEvent();
        } else {
            aggr.attachStyle(su);
        }
    }

    // Update a ptcs-style-unit (something has changed)
    updateStyle(su) {
        PTCS.assert(su.__saSa);
        if (su.__saSa === this) {
            // Has CSS Key changed?
            if (su.cssKey !== su.__saOldKey) {
                this._detachCSS(su);
                this._attachCSS(su);
            }

            // Update style content
            if (su.cssKey) {
                const cssKey = this._cssKey(su.cssKey);
                PTCS.assert(this.mapCSS.get(cssKey));
                this._regenerateStyles(cssKey, this.mapCSS.get(cssKey));
            }
            this._sendSuEvent();
        } else {
            su.__saSa.updateStyle(su);
        }
    }

    // Detach a ptcs-style-unit
    detachStyle(su) {
        PTCS.assert(su.__saSa);
        if (su.__saSa === this) {
            PTCS.assert(su.cssKey === su.__saOldKey);
            this._detachCSS(su);
            su.__saSa = null;
            delete su.__saParent;
            this._sendSuEvent();
        } else {
            su.__saSa.detachStyle(su);
        }
    }

    //
    // Interface for keeping track of web components
    //

    // cb: wc => {...}
    query(cssKey, cb, el) {
        el = el || cb;
        const aggr = el.__saSa || ((el instanceof Element) && this.findAggregator(el)) || this;
        if (aggr === this) {
            const items = this.mapWC.get(cssKey);
            if (items) {
                items.forEach(cb);
            }
            this.partObservers.forEach(partObserver => partObserver.queryKey(cssKey, cb));
        } else {
            aggr.query(cssKey, cb, el);
        }
    }

    // cbObj: {enlist: wc => {...}, delist: wc => {...}}
    subscribe(cssKey, cbObj, el) {
        el = el || cbObj;
        const aggr = ((el instanceof Element) && this.findAggregator(el)) || this;

        if (aggr === this) {
            const set = this.mapSubscriber[cssKey];
            if (!set) {
                this.mapSubscriber[cssKey] = new Set([cbObj]);

                // Inform partObservers about subscription
                this.partObservers.forEach(partObserver => partObserver.observeKey(cssKey));
            } else {
                set.add(cbObj);
            }
        } else {
            aggr.subscribe(cssKey, cbObj, el);
        }
    }

    unsubscribe(cssKey, cbObj, el) {
        el = el || cbObj;
        const aggr = el.__saSa || this;

        if (aggr === this) {
            const set = this.mapSubscriber[cssKey];
            if (set) {
                set.delete(cbObj);
                if (set.size === 0) {
                    delete this.mapSubscriber[cssKey];

                    // Inform partObservers about unsubscription
                    this.partObservers.forEach(partObserver => partObserver.unobserveKey(cssKey));
                }
            }
            el.__saSa = null;
            delete el.__saParent;
        } else {
            el.__saSa.unsubscribe(cssKey, cbObj, el);
        }
    }

    _changeStateKey(wc, oldStateKey) {
        if (!wc.__saCtx) {
            return; // Should never happen
        }
        // Inform subscribers
        const newStateKey = wc.getAttribute('state-key');
        wc.__saCtx.forEach(item => {
            const subscribers = this.mapSubscriber[item.key];
            if (subscribers) {
                subscribers.forEach(cbObj => {
                    if (typeof cbObj.changeStateKey === 'function') {
                        cbObj.changeStateKey(wc, newStateKey, oldStateKey);
                    }
                });
            }
        });
    }

    // A partObserver observerves non-stylable elements that are out of reach for the style aggregator
    attachPartObserver(partObserver) {
        const aggr = this.findAggregator(partObserver);
        if (aggr !== this) {
            return aggr.attachPartObserver(partObserver);
        }

        this.partObservers.add(partObserver);
        for (const cssKey in this.mapSubscriber) {
            partObserver.observeKey(cssKey);
        }
        return this;
    }

    // Detach partObserver
    detachPartObserver(partObserver) {
        console.assert(this.findAggregator(partObserver) === this);

        this.partObservers.delete(partObserver);
    }

    // Attach a ptcs-style-context
    attachContext(sc) {
        const aggr = this.findAggregator(sc);
        if (aggr === this) {
            // TODO: check, could children be attached before parent?
            // If yes, additional processing required to migrate
            // components from one context to another
            // Currently is just for future developments
            this.subContexts = this.subContexts || new Set();
            this.subContexts.add(sc);
        } else {
            aggr.attachContext(sc);
        }
    }

    // Detach a ptcs-style-context
    detachContext(sc) {
        PTCS.assert(sc.__saSa);
        if (sc.__saSa === this) {
            this.subContexts.delete(sc);
            sc.__saSa = null;
            delete sc.__saParent;
        } else {
            sc.__saSa.detachContext(sc);
        }
    }

    // Is root aggregator
    get isRoot() {
        return this === PTCS.styleAggregator;
    }

    /**
     * Has sub aggregators
     * @returns {boolean}
     */

    get hasContexts() {
        return this.subContexts && this.subContexts.size;
    }

    /**
     * Find closest light DOM ancestor or self <ptcs-style-context> element
     * Traversing shadow boundaries
     *
     * @param {Element} el - DOM element
     * @returns {Element}
     */

    _findAggregatorInternal(el) {
        if (!el.__saSa) {
            const parent = this._getParentComponent(el);
            if (parent) {
                el.__saSa = this._findAggregatorInternal(parent);
            } else {
                const context = el.parentElement.closest('ptcs-style-context');
                el.__saSa = context ? context.styleAggregator : PTCS.styleAggregator;
            }
        }
        return el.__saSa;
    }

    /**
     * Find aggregator for element.
     * Skip search if single aggregator
     *
     * @param {Element} el - DOM element
     * @return {StyleAggregator}
     */

    findAggregator(el) {
        return (this.isRoot && this.hasContexts) ? this._findAggregatorInternal(el) : (el.__saSa = this);
    }
}

console.assert(!PTCS.styleAggregator, 'The styleAggregator has already been loaded');

// Load StyleAggregator
if (!window.ShadyCSS || window.ShadyCSS.nativeShadow) {
    PTCS.hasConstructableStylesheets = ('adoptedStyleSheets' in Document.prototype) && ('replace' in CSSStyleSheet.prototype);

    console.log(`load styleAggregator,${PTCS.hasConstructableStylesheets ? '' : ' not'} using Constructable Stylesheets`);

    PTCS.styleAggregator = new StyleAggregator();

    // Any components waiting to be enlisted?
    if (PTCS.__styleable) {
        PTCS.__styleable.forEach(el => PTCS.styleAggregator.enlist(el));
    }
} else {
    console.error('Browser doesn\'t support Web Components');
}

PTCS.__styleable = undefined;
