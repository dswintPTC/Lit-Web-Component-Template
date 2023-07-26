import {PolymerElement} from '@polymer/polymer/polymer-element.js';
import {PTCS} from 'ptcs-library/library.js';
import 'ptcs-style-unit/style-aggregator.js';
import {PropertyObserver} from 'ptcs-library/property-observer';


PTCS.StateUnit = class extends PolymerElement {
    static get is() {
        return 'ptcs-state-unit';
    }

    static get properties() {
        return {
            // Web component name in uppercase letters + an optional case sensitive `.${variant}`
            // or single #id (for top-level components). The component name can be concatenated
            // to ID with a `.` as a separator. Doing so is recommended for future compbility
            // Examples:
            //   - PTCS-BUTTON            -> matches ptcs-button:not([variant])
            //   - PTCS-BUTTON.primary    -> matches ptcs-button:[variant=primary]
            //   - #my-button             -> macthes any component with id 'my-button'
            //   - #my-button.PTCS-BUTTON -> same as '#my-button', but also specifies the expected component
            wc: {
                type:     String,
                observer: '_subscribe'
            },

            // Part name, if state should be pushed into a specific sub-part
            // Can specify several parts with ':' as separator
            // Example:
            //   - part - the state is atatched to all sub-parts with the name part
            //   - part1:part2:part3 -> the state is attached into the deepest part (part3).
            //                          All parts that matches this path will be targetet
            part: {
                type:     String,
                observer: '_subscribe'
            },

            // The name of the property on the target components that should be observed
            property: {
                type:     String,
                observer: '_subscribe'
            },

            // Forcefully create a property on the target component if it doesn't exist
            enforce: {
                type:     Boolean,
                value:    false,
                observer: '_subscribe'
            },

            // The state itself: {name, func}
            state: {
                type:     Object,
                observer: '_subscribe'
            },

            // Only observe states with specific state-key
            stateKey: {
                type:     String,
                observer: '_stateKeyChanged'
            },

            // Style Aggregator subscription information
            _subscribedAs: {
                type: Object // {cssKey, property, state}
            }
        };
    }

    ready() {
        super.ready();
        this.style.display = 'none';
    }

    connectedCallback() {
        super.connectedCallback();
        this._connected = true;
        this._subscribe();
    }

    disconnectedCallback() {
        this._unsubscribe();
        this._connected = undefined;
        super.disconnectedCallback();
    }

    get cssKey() {
        return this.part ? `${this.wc}:${this.part}` : this.wc;
    }

    get funcKey() {
        return `__$tate_${this._subscribedAs.state.name}_${this._subscribedAs.property}`;
    }

    // Create state observer function for Polymer element
    _createStateFunc1(wc, funcKey) {
        const attrName = `ptcstate-${this._subscribedAs.state.name}`;
        let func = this._subscribedAs.state.func;

        function updateState(value, _2) {
            if (value instanceof PTCS.StateUnit) {
                console.assert(attrName === `ptcstate-${value._subscribedAs.state.name}`);
                console.assert(!_2 || !func, 'Duplicate states for same component');
                func = _2 ? value._subscribedAs.state.func : undefined;
                if (!func) {
                    this.removeAttribute(attrName);
                }
            } else if (func) {
                const state = func(value);
                if (state) {
                    this.setAttribute(attrName, state);
                } else {
                    this.removeAttribute(attrName);
                }
            }
        }

        wc._createPropertyObserver(this.property, funcKey, true);

        return updateState;
    }

    // Create state observer function for non-Polymer element
    _createStateFunc2(el) {
        const attrName = `ptcstate-${this._subscribedAs.state.name}`;
        let func = this._subscribedAs.state.func;
        let propertyObserver;

        function updateState(value, _2) {
            if (value instanceof PTCS.StateUnit) {
                console.assert(attrName === `ptcstate-${value._subscribedAs.state.name}`);
                console.assert(!_2 || !func, 'Duplicate states for same component');
                func = _2 ? value._subscribedAs.state.func : undefined;
                if (func) {
                    // Restart observing
                    propertyObserver = new PropertyObserver(this, value.property, updateState);
                } else {
                    // Stop observing
                    this.removeAttribute(attrName);
                    propertyObserver.cancel();
                    propertyObserver = undefined;
                }
            } else if (func) {
                const state = func(value);
                if (state) {
                    this.setAttribute(attrName, state);
                } else {
                    this.removeAttribute(attrName);
                }
            }
        }

        propertyObserver = new PropertyObserver(el, this.property, updateState);

        return updateState;
    }

    // Callback: a web component enlists to this state
    _enlist(wc) {
        if (!(this._subscribedAs.property in wc)) {
            if (this.enforce) {
                wc[this._subscribedAs.property] = undefined;
            } else {
                // Property does not exist
                return;
            }
        }

        const func = this.funcKey;
        if (!wc[func]) {
            // Create new observer for this state + property
            if (wc._createPropertyObserver) {
                wc[func] = this._createStateFunc1(wc, func);
            } else {
                wc[func] = this._createStateFunc2(wc);
            }
        } else {
            // Take over ownership
            wc[func](this, true);
        }
        // Set attribute now
        wc[func](wc[this.property]);
    }

    // Callback: a web component delists from this state
    _delist(wc) {
        const func = this.funcKey;
        if (wc[func]) {
            wc[func](this, false);
        }
    }

    enlist(wc) {
        if (!this.stateKey || this.stateKey === wc.getAttribute('state-key')) {
            this._enlist(wc);
        }
    }

    delist(wc) {
        if (!this.stateKey || this.stateKey === wc.getAttribute('state-key')) {
            this._delist(wc);
        }
    }

    changeStateKey(wc, stateKey, old) {
        if (this.stateKey) {
            if (this.stateKey === old) {
                this._delist(wc);
            }
            if (this.stateKey === stateKey) {
                this._enlist(wc);
            }
        }
    }

    _stateKeyChanged(stateKey, old) {
        if (!this._subscribedAs || stateKey === old || (!stateKey && !old)) {
            return;
        }

        const updateStateKey = wc => {
            const sk = wc.getAttribute('state-key');
            if (!old || sk === old) {
                this._delist(wc);
            }
            if (!stateKey || sk === stateKey) {
                this._enlist(wc);
            }
        };

        PTCS.styleAggregator.query(this._subscribedAs.cssKey, updateStateKey, this);
    }

    // Subscribe to styleAggregator
    _subscribe() {
        if (!this._connected) {
            return;
        }
        const r = {cssKey: this.cssKey, property: this.property, state: this.state, enforce: this.enforce};
        // eslint-disable-next-line max-len
        if (this._subscribedAs && this._subscribedAs.cssKey === r.cssKey && this._subscribedAs.property === r.property && this._subscribedAs.state === r.state && this._subscribedAs.enforce === r.enforce) {
            return;
        }
        this._unsubscribe();
        if (r.cssKey && r.property && r.state && r.state.name && typeof r.state.func === 'function') {
            this._subscribedAs = r;
            PTCS.styleAggregator.subscribe(this._subscribedAs.cssKey, this);
            PTCS.styleAggregator.query(this._subscribedAs.cssKey, this.enlist.bind(this), this);
        }
    }

    // Unsubscribe from styleAggregator
    _unsubscribe() {
        if (this._subscribedAs) {
            PTCS.styleAggregator.query(this._subscribedAs.cssKey, this.delist.bind(this), this);
            PTCS.styleAggregator.unsubscribe(this._subscribedAs.cssKey, this);
            this._subscribedAs = undefined;
        }
    }
};

customElements.define(PTCS.StateUnit.is, PTCS.StateUnit);
