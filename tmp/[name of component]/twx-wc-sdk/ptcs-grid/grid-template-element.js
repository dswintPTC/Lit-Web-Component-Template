/* eslint-disable no-confusing-arrow */
/* global globalThis */

const assignField = Symbol('assign');
const eventField = Symbol('event-map');

// Default template string options
const prefix = '${';
const suffix = '}';


// eslint-disable-next-line no-shadow
export function parseText(text, interpolation) {
    const _prefix = interpolation ? interpolation.prefix : prefix;
    const _suffix = interpolation ? interpolation.suffix : suffix;
    if (!_prefix || !_suffix) {
        return text;
    }
    const lenPrefix = _prefix.length;
    const lenSuffix = _suffix.length;
    const a = []; // Result, if multi-part string
    let i = 0;
    let iNext;

    for (;; i = iNext + lenSuffix) {
        const i1 = text.indexOf(_prefix, i);

        if (i1 < 0) {
            break;
        }

        iNext = text.indexOf(_suffix, i1 + lenPrefix);
        if (iNext < 0) {
            break;
        }

        // Make sure we don't have nested ${   ${} }
        const i2 = text.indexOf(_prefix, i1 + lenPrefix);

        if (i2 >= 0 && i2 < iNext) {
            console.error(`Invalid value: ${text}`);
            return null;
        }

        if (i < i1) {
            a.push(text.substring(i, i1));
        }

        const expr = text.substring(i1 + lenPrefix, iNext);
        const modifierIx = expr.indexOf('|');
        if (modifierIx > 0) {
            const field = expr.substring(0, modifierIx).trim();
            const modifiers = expr.substring(modifierIx + 1).split('|').map(mod => mod.trim());
            a.push(item => modifiers.reduce((value, modify) => typeof globalThis[modify] === 'function' && globalThis[modify](value), item[field]));
        } else {
            const field = expr.trim();
            a.push(item => `${item[field]}`);
        }
    }

    if (!i) {
        return text;
    }

    if (i < text.length) {
        a.push(text.substring(i));
    }

    if (a.length === 1) {
        return a[0];
    }

    return item => a.map(t => typeof t === 'function' ? t(item) : t).join('');
}


// eventMap (string): (org-event-type ':' new-event-type ';') *
function decodeGridEventMap(eventMap) {
    if (!eventMap || typeof eventMap !== 'string') {
        return undefined;
    }
    const a = eventMap.split(';').map(s => s.trim()).map(s => s.split(':').map(s2 => s2.trim()));
    if (a.length > 0 && a.every(pair => pair.length === 2 && pair[0] && pair[1])) {
        const r = {};
        a.forEach(pair => {
            r[pair[0]] = pair[1];
        });
        return r;
    }

    console.error(`Invalid grid-event-map: ${JSON.stringify(eventMap)}`);
    return undefined;
}

// If the attribute name starts with 'strip.', then strip that from the name
function attrName(name) {
    if (name[5] === '.' && name.substring(0, 5).toLowerCase() === 'strip') {
        return name.substring(6);
    }
    return name;
}

function processElem(el, opt) {
    const attributes = el.attributes;
    const constAttr = {};
    const exprAttr = {};

    for (let i = 0; i < attributes.length; i++) {
        const name = attrName(attributes[i].name);
        const text = parseText(attributes[i].value, opt);
        switch (typeof text) {
            case 'string':
                constAttr[name] = text;
                break;

            case 'function':
                exprAttr[name] = text;
                break;
        }
    }

    // grid-events?
    const eventMap = decodeGridEventMap(constAttr['grid-event-map']);
    if (eventMap) {
        delete constAttr['grid-event-map'];
    }

    const sub = [];
    let text;
    for (let node = el.firstChild; node; node = node.nextSibling) {
        switch (node.nodeType) {
            case 1:
                sub.push(processElem(node, opt));
                break;

            case 3:
                text = parseText(node.textContent, opt);
                if (text) {
                    if (typeof text === 'function') {
                        sub.push({macro: text});
                    } else {
                        sub.push({text});
                    }
                }
                break;
        }
    }

    const reg = obj => {
        for (const key in obj) {
            return obj;
        }
        return undefined;
    };

    return {tagName: el.tagName, constAttr: reg(constAttr), exprAttr: reg(exprAttr), sub, eventMap};
}


function generateGridEvent(event) {
    const el = event.target;
    const evName = el[eventField] && el[eventField][event.type];
    if (!evName) {
        console.warn(`Unknow grid cell event: ${event.type}`);
        return;
    }

    const root1 = el.getRootNode();
    if (root1.nodeType === 11 && root1.host) {
        const root2 = root1.host.getRootNode(); // Root of ptcs-core-grid
        if (root2.nodeType === 11 && root2.host) {
            const grid = root2.host; // ptcs-grid
            if (grid.tagName === 'PTCS-GRID') {
                const detail = {target: el, event};

                const row = el.closest('ptcs-div.row');
                if (row) {
                    detail.index = row.index;
                    detail.item = grid.data && typeof grid.data.item === 'function' && grid.data.item(row.index);
                }

                grid.dispatchEvent(new CustomEvent(evName, {detail}));
                event.stopPropagation();
            }
        }
    }
}


function createElem(ctor, a) {
    const el = document.createElement(ctor.tagName);

    // Fixed attributes
    if (ctor.constAttr) {
        for (const name in ctor.constAttr) {
            el.setAttribute(name, ctor.constAttr[name]);
        }
    }

    // Item dependent attributes
    const exprAttr = ctor.exprAttr;
    if (exprAttr) {
        a.push(item => {
            for (const name in exprAttr) {
                el.setAttribute(name, exprAttr[name](item));
            }
        });
    }

    // Child nodes
    ctor.sub.forEach(sub => {
        if (sub.tagName) {
            el.appendChild(createElem(sub, a));
        } else if (sub.text) {
            // Fixed text node
            el.appendChild(document.createTextNode(sub.text));
        } else {
            // Item dependent text node
            console.assert(sub.macro);
            const macro = document.createTextNode(' ');
            el.appendChild(macro);
            a.push(item => {
                macro.textContent = sub.macro(item);
            });
        }
    });

    // events
    if (ctor.eventMap) {
        el[eventField] = ctor.eventMap;
        for (const evName in ctor.eventMap) {
            el.addEventListener(evName, generateGridEvent);
        }
    }

    // Grid cannot allow cell items to enable keyboard navigation.
    if (el.tabIndex >= 0) {
        el.tabIndex = -1; // Focusable, but not keyboard navigationable
        if (!el.hasAttribute('grid-action')) {
            el.setAttribute('grid-action', ''); // Treat as a grid action
        }
    }

    return el;
}


// {create(), assign(item)}
export function createTemplateElement(el, opt) {
    const ctor = processElem(el, Object.assign({prefix, suffix}, opt || {}));
    return {
        create: () => {
            const a = [];
            const tel = createElem(ctor, a);
            tel[assignField] = a;
            return tel;
        },

        assign: (tel, value, index, dataManager) => {
            const item = dataManager.item(index);
            tel[assignField].forEach(f => f(item));
        }
    };
}

// Returns label() function
export function createTemplateHeader(el) {
    const ctor = processElem(el, {prefix: null, suffix: null});
    return () => createElem(ctor, []);
}
