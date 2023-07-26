/* eslint-disable no-confusing-arrow */

let _counter = 0;

export function createSubComponent(mainCmpnt, subConfig) {
    function isAttr(value) {
        return value[value.length - 1] === '$';
    }

    function is1way(value) {
        return value[0] === '[' && value[1] === '[' && value[value.length - 1] === ']' && value[value.length - 2] === ']';
    }

    function is2way(value) {
        return value[0] === '{' && value[1] === '{' && value[value.length - 1] === '}' && value[value.length - 2] === '}';
    }

    function assign1way(r, value) {
        // Strip '[[' and ']]'
        value = value.substring(2, value.length - 2);
        if (value.indexOf('(') > 0) {
            // Function call
            r.method = value;
        } else if (value[0] === '!') {
            // Invert property
            r.prop = value.substring(1);
            r.invert = true;
        } else {
            r.prop = value;
        }
    }

    function decodeComponentConfig() {
        const m = /^<([a-zA-Z0-9$-]+)([^>]*)>$/m.exec(subConfig);
        if (!m) {
            throw new Error('Invalid mount configuration: ' + subConfig);
        }
        const propMap = m[2].split(/\s+([-_a-zA-Z0-9$]+="[^"]*")/).filter(s => s !== '').map(s => {
            const _m = /([-_a-zA-Z0-9$]+)="([^"]*)"/.exec(s);
            if (!_m) {
                throw new Error('Invalid: ' + s);
            }
            const r = {};
            const name = _m[1];
            const value = _m[2];

            if (isAttr(name)) {
                Object.assign(r, {dst: name.substring(0, name.length - 1), attr: true});
            } else {
                r.dst = window.dashToCamelCase(name);
            }

            if (is1way(value)) {
                assign1way(r, value);
            } else if (is2way(value)) {
                if (!value.match(/\{\{[-_a-zA-Z0-9$]+\}\}/g)) {
                    throw new Error('Invalid 2-way binding: ' + s);
                }
                const prop = value.substring(2, value.length - 2);
                Object.assign(r, {prop, watch: true});
            } else {
                r.value = value;
            }
            return r;
        });
        return {component: m[1], propMap};
    }

    const {component, propMap} = decodeComponentConfig();

    const el = document.createElement(component);

    // Callback that sends propery changes to sub component
    const propChange = (prop, value) => {
        if (prop.attr) {
            if (value === false || value === undefined) {
                el.removeAttribute(prop.dst);
            } else {
                el.setAttribute(prop.dst, value === true ? '' : value);
            }
        } else {
            el[prop.dst] = value;
        }
    };

    // Callback that gets property changes from sub component
    const propWatch = ev => {
        const propName = window.dashToCamelCase(ev.type.substring(0, ev.type.length - 8)); // remove '_changed'
        const value = ev.detail.value;
        const path = ev.detail.path;
        if (path) {
            if (path.endsWith('.splices')) {
                mainCmpnt.notifySplices(path.substring(0, path.length - 8), value);
            } else {
                mainCmpnt.notifyPath(path, value);
            }
        } else {
            mainCmpnt[propName] = value;
        }
    };

    // Assign properties / attributes and add bindings
    propMap.forEach(item => {
        if (item.value) {
            // Fixed value
            propChange(item, item.value);
        } else if (item.prop) {
            // Dependent on single property
            if (item.invert) {
                // Initialize property in sub component
                propChange(item, !mainCmpnt[item.prop]);

                // Inform sub component about any changes
                mainCmpnt._createPropertyObserver(item.prop, v => propChange(item, !v));
            } else {
                // Initialize property in sub component
                propChange(item, mainCmpnt[item.prop]);

                // Inform sub component about any changes
                mainCmpnt._createPropertyObserver(item.prop, v => propChange(item, v));
            }
            if (item.watch) {
                // Listen to changes from list
                el.addEventListener(`${window.camelToDashCase(item.prop)}-changed`, propWatch);
            }
        }
    });

    // Create method observers and make inital calls
    propMap.forEach(item => {
        if (item.method) {
            const invert = item.method[0] === '!';
            const iArg = item.method.indexOf('(');
            const funcName = item.method.substring(invert ? 1 : 0, iArg);
            const assingFunc = `${funcName}$csc${_counter++}`;
            const args = item.method.substring(iArg + 1, item.method.indexOf(')'));

            mainCmpnt[assingFunc] = invert
                ? function(...arg) {
                    propChange(item, !this[funcName](...arg));
                }
                : function(...arg) {
                    propChange(item, this[funcName](...arg));
                };
            mainCmpnt._createMethodObserver(`${assingFunc}(${args})`, false);

            const propData = s => s[0] !== '!' ? mainCmpnt[s] : !mainCmpnt[s.substring(1)];

            mainCmpnt[assingFunc](...args.replace(/,/g, ' ').split(/\s+(!?[-_a-zA-Z0-9$]+)/).filter(s => s !== '').map(propData));
        }
    });

    el.__$mainCmpnt = mainCmpnt;

    return el;
}
