/* eslint-disable no-confusing-arrow */
import {PropertyObserver} from './property-observer.js';

const polymerField = Symbol('polymer');


function hasChanged(value, old) {
    return value !== old;
}


function addImmediateObserver(el, propName, observers) {
    const _propName = `__${propName}$`;

    Object.defineProperty(el, propName, {
        get: function() {
            return this[_propName];
        },

        set: function(value) {
            const old = this[_propName];
            const x = observers.find(item => item.hasChanged);
            if ((x ? x.hasChanged : hasChanged)(value, old)) {
                this[_propName] = value;
                observers.forEach(({observer}) => this[observer](value, old));
                this.requestUpdate(propName, old);
            }
        }
    });
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function addReadOnlyProperty(el, propName) {
    const _propName = `__${propName}$`;

    Object.defineProperty(el, propName, {
        get: function() {
            return this[_propName];
        }
    });

    el[`_set${capitalizeFirstLetter(propName)}`] = function(value) {
        const old = this[_propName];
        this[_propName] = value;
        this.requestUpdate(propName, old);
    };
}

// Lit 2 Polymer Wrapper (for porting Polymer components)
export const L2Pw = superClass => class extends superClass {

    constructor() {
        super();
        // Implement $[id] to address elements in the shadow dom
        this.$ = new Proxy(this, {
            get(target, property) {
                const el = target.shadowRoot.getElementById(property);
                console.assert(el, `Cannot find $.${property}`);
                return el;
            }
        });

        const {immediateObserver, readOnly} = this._lit2polymerTables();
        for (const propName in immediateObserver) {
            addImmediateObserver(this, propName, immediateObserver[propName]);
        }

        for (const propName of readOnly) {
            addReadOnlyProperty(this, propName);
        }
    }

    // Decode property value, observer, computed, and observers arrays
    _lit2polymerTables() {
        if (this.constructor[polymerField]) {
            return this.constructor[polymerField];
        }

        const decl = {values: [], observer: {}, immediateObserver: {}, computers: {}, observers: {}, notify: new Set(), readOnly: new Set()};

        this.constructor[polymerField] = decl;

        const isComputed = new Set();

        const add = (obj, key, func) => {
            if (!obj[key]) {
                obj[key] = [func];
            } else {
                obj[key].push(func);
            }
        };

        const next = el => {
            for (let pof = Object.getPrototypeOf(el); pof; pof = Object.getPrototypeOf(pof)) {
                if (pof.constructor !== el.constructor) {
                    return pof;
                }
            }
            return null;
        };

        // Find all validated properties with validation function and arguments
        for (let el = this; el; el = next(el)) {
            const {properties, observers} = el.constructor;

            // Property declarations
            if (properties) {
                for (const propName in properties) {
                    const {value, observer, observeWhen, computed, notify, readOnly} = properties[propName];

                    if (value !== undefined && decl.values.findIndex(item => item[0] === propName) === -1) {
                        decl.values.push([propName, value]);
                    }

                    if (observer) {
                        if (typeof this[observer] !== 'function') {
                            throw new Error(`Invalid observer: ${observer}`);
                        }

                        if (observeWhen === 'immediate') {
                            if (properties[propName].noAccessor !== true) {
                                console.error(`${this.tagName}:${propName} - observeWhen: 'immediate' requires noAccessor: true`);
                            }
                            add(decl.immediateObserver, propName, {observer, hasChanged: properties[propName].hasChanged});
                        } else {
                            add(decl.observer, propName, observer);
                        }
                    }

                    if (computed && !isComputed.has(propName)) {
                        isComputed.add(propName); // Ony use highest level computed field

                        const m = /(\w+)\((.+)\)/.exec(computed);
                        if (!m) {
                            throw new Error(`Invalid computed expression: ${computed}`);
                        }

                        const args = m[2].split(',').map(s => s.trim());
                        if (!args.every(s => /^(\$|\w+\$?)$/.test(s))) {
                            throw new Error(`Invalid computed expression arguments: ${computed}`);
                        }

                        const method = m[1];
                        if (typeof this[method] !== 'function') {
                            throw new Error(`Invalid computed method: ${computed}`);
                        }

                        const f = function() {
                            this[propName] = this[method](...args.map(argName => this[argName]));
                        };

                        args.forEach(argName => add(decl.computers, argName, f));
                    }

                    if (notify) {
                        decl.notify.add(propName);
                    }

                    if (readOnly) {
                        decl.readOnly.add(propName);
                    }
                }
            }

            // observers property - for multi propery observers
            if (observers) {
                observers.forEach(call => {
                    const m = /(\w+)\((.+)\)/.exec(call);
                    if (!m) {
                        throw new Error(`Invalid observer expression: ${call}`);
                    }

                    const args = m[2].split(',').map(s => s.trim());
                    if (!args.every(s => /^(\$|\w+\$?)$/.test(s))) {
                        throw new Error(`Invalid observer expression arguments: ${call}`);
                    }

                    const method = m[1];
                    if (typeof this[method] !== 'function') {
                        throw new Error(`Invalid observer: : ${call}`);
                    }

                    const f = function() {
                        this[method](...args.map(propName => this[propName]));
                    };

                    args.forEach(propName => add(decl.observers, propName, f));
                });
            }
        }

        return decl;
    }

    ready() {
        // Do nothing
    }

    firstUpdated() {
        super.firstUpdated();

        const {values, readOnly} = this._lit2polymerTables();
        this._preventChangeEvent = new Set(); // Prevents a change event dispatching for props with default values

        const apply = f => typeof f === 'function' ? f.apply(this) : f;

        // Apply default values
        values.forEach(item => {
            if (this[item[0]] === undefined) {
                if (readOnly.has(item[0])) {
                    this[`_set${capitalizeFirstLetter(item[0])}`](apply(item[1]));
                } else {
                    this[item[0]] = apply(item[1]);
                }
            }
            this._preventChangeEvent.add(item[0]);
        });

        this.ready();
    }

    // Lit pre update: compute dependent values
    willUpdate(changedProperties) {
        super.willUpdate(changedProperties);

        const {computers} = this._lit2polymerTables();

        const call = new Set();

        changedProperties.forEach((oldValue, propName) => {
            if (computers[propName]) {
                computers[propName].forEach(f => call.add(f));
            }
        });

        call.forEach(f => f.call(this));
    }

    // Lit post update: call observers and generate change callbacks
    updated(changedProperties) {
        super.updated(changedProperties);

        const {notify, observer, observers} = this.constructor[polymerField];

        const call = new Set();

        changedProperties.forEach((oldValue, propName) => {
            if (oldValue === this[propName]) {
                return; // Ignore change, since it has already changed back
            }
            if (notify.has(propName) && !(this._preventChangeEvent && this._preventChangeEvent.has(propName))) {
                this.dispatchEvent(new CustomEvent(`${window.camelToDashCase(propName)}-changed`, {detail: {value: this[propName]}}));
            }
            if (observer[propName]) {
                observer[propName].forEach(funcName => this[funcName](this[propName], oldValue));
            }
            if (observers[propName]) {
                observers[propName].forEach(f => call.add(f));
            }
        });

        this._preventChangeEvent = undefined;
        call.forEach(f => f.call(this));
    }

    setProperties(properties) {
        for (const name in properties) {
            this[name] = properties[name];
        }
    }

    notifyPath(path) {
        console.log(`%cnotifyPath(${JSON.stringify(path)})`, 'background: blue; color: white');
    }

    _createPropertyObserver(propName, callback) {
        const cb = () => {
            if (typeof callback === 'function') {
                return callback;
            }
            if (typeof this[callback] === 'function') {
                return this[callback];
            }

            // Late binding (callback function not available yet)
            return (...arg) => this[callback](...arg);
        };

        const {readOnly} = this._lit2polymerTables();

        new PropertyObserver(this, readOnly.has(propName) ? `__${propName}$` : propName, cb());
    }

    _createMethodObserver(propName, callback) {
        console.log(`%c$_createMethodObserver(${propName}, ${callback})`, 'background: red; color: white');
    }
};
