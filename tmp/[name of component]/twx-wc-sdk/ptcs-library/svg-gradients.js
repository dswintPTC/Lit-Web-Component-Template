import {select} from 'd3-selection';

// All web components that use svg gradients
const wcMap = new Map();

// All Style Aggregators that has changed styling
const saSet = new Set();

// Refresh gradients?
let refresh = false;

// Convert "to (left || right)? (top || bottom)?" to angle
const toAngle = {
    top:         0,
    bottom:      180,
    left:        270,
    right:       90,
    topleft:     315,
    lefttop:     315,
    topright:    45,
    righttop:    45,
    bottomright: 135,
    rightbottom: 135
};


// Convert arbitrary angle unit to degrees
const angleUnit = {
    deg:  a => a,
    grad: a => (90 * a) / 100,
    turn: a => 360 * a,
    rad:  a => (90 * a) / Math.PI
};


// Is color a valid color?
function isColor(color) {
    // "#" hexdigit hexdigit hexdigit (hexdigit hexdigit hexdigit)?
    // "rgb("integer, integer, integer")"
    // "rgb("integer "%", integer "%", integer "%)"
    //  color-keyword [a-z]+

    // eslint-disable-next-line max-len
    const m = /(#[0-9a-f]{3}([0-9a-f]{3})?)|(rgb\(([0-9]+(,[0-9]+){2})|([0-9]+%(,[0-9]+%){2})\))|(rgba\([0-9]+(,[0-9]+){2},[0-9]*(\.[0-9]*)?\))|([a-z]+)/g.exec(color);
    return !!m;
}


// Convert ID specifier to rgb(r,g,b) or rgba(r,g,b,a)
function replacer(match, p1) {
    const args = p1.split('-');
    switch (args.length) {
        case 3:
            return `rgb(${args.join(',')})`;
        case 4:
            return `rgba(${args.join(',')})`;
    }

    return match;
}

export function getGradientCSS(key) {
    if (!key) {
        return key; // Invalid gradient key
    }

    const m = key.match(/^url\(['"]#L(.*)['"]\)$/);

    if (!m) {
        return key; // Invalid gradient key
    }

    const args = m[1].split('S').map(s => s.replaceAll(/R([\dP.-]+)E/g, replacer).replaceAll('P', '%').replaceAll('X', ' ').replaceAll('H', '#'));

    if (!args.length) {
        return key; // Invalid gradient key
    }

    return `linear-gradient(${args.join(',')})`;
}

// Decode key gradient and store values in gmap
function decodeGradient(key, gmap) {
    if (!key) {
        return;
    }

    const id = `L${key}`;
    if (gmap[id]) {
        return; // Already processed, because this gradient is used in several places
    }

    const args = key.split('S').map(s => s.replaceAll(/R([\dP.-]+)E/g, replacer).replaceAll('P', '%').replaceAll('X', ' ').replaceAll('H', '#'));
    if (!args.length) {
        return; // Invalid gradient key
    }

    // Is first argument an angle? Explicit angle or "to 'side'"?
    let angle = 0;
    const m = /^(([\d.]+)([degratun]+))|(to\s([leftrighopbm\s]+))/.exec(args[0]);

    if (m) {
        // deg, grad, rad, turn: 360deg = 400grad = 1turn = (4 * Math.PI)rad
        args.shift();

        if (m[2] && m[3]) {
            const f = angleUnit[m[3]];
            const a = Number(m[2]);
            if (!f || isNaN(a)) {
                console.warn('Invalid angle: ' + m[1]);
                return;
            }
            angle = f(a);
        } else {
            angle = toAngle[m[5].replaceAll(' ', '').toLowerCase()] || 0;
        }
    }

    const decoded = [];

    decoded.angle = angle;

    // Map index to default percentage
    const f = (i, n) => {
        if (i <= 0) {
            return 0;
        }
        if (i >= n - 1) {
            return 100;
        }
        return Math.round(i * 100 / (n - 1));
    };

    for (let i = 0; i < args.length; i++) {
        // percentage color | color percentage | color
        const m2 = /^(\d+)%\s+(.+)$|^(.+)\s+(\d+)%$/.exec(args[i]);
        const color = m2 ? (m2[2] || m2[3]) : args[i];

        if (!isColor(color)) {
            console.warn('invalid color: ' + color);
            return;
        }

        const percentage = m2 ? Number(m2[1] || m2[4]) : f(i, args.length);
        if (isNaN(percentage)) {
            console.warn('invalid percentage: ' + color);
            return;
        }

        decoded.push([color, percentage]);
    }

    gmap[id] = decoded;
}


// Collect svg CSS gradients from the shadow root CSS styling (that is, all gradients defined by fill: url(#<gradient-id>; )
export function collectSvgGradients(el) {
    const gmap = {};

    function process(styleSheet) {
        try {
            for (const rule of styleSheet.cssRules) {
                if (rule instanceof CSSStyleRule) {
                    const fill = rule.style.fill;
                    const value = fill && fill.toString();
                    const m = value && /url\("#L([0-9A-Za-z-.]+)"\).*/.exec(value);
                    decodeGradient(m && m[1], gmap);
                }
            }
        } catch (error) {
            console.error('cssRules exception error');
        }
    }

    for (const styleSheet of el.shadowRoot.styleSheets) {
        process(styleSheet);
    }

    for (const styleSheet of el.shadowRoot.adoptedStyleSheets) {
        process(styleSheet);
    }

    const result = [];

    for (const id in gmap) {
        result.push({id, args: gmap[id]});
    }

    return result;
}


// configure gradient
function configureGradientEl(d) {
    if (this.getAttribute('id') === d.id) {
        return; // No change
    }

    this.setAttribute('id', d.id);
    this.setAttribute('gradientTransform', `rotate(${d.args.angle - 90} 0.5 0.5)`);

    const join = select(this)
        .selectAll('stop')
        .data(d.args);

    join.enter()
        .append('stop')
        .attr('offset', arg => `${arg[1]}%`)
        .attr('stop-color', arg => arg[0]);

    join.attr('offset', arg => `${arg[1]}%`)
        .attr('stop-color', arg => arg[0]);

    join.exit().remove();
}


// Create requested gradients
function addGradients(wc, _defs) {
    const gradients = collectSvgGradients(wc);
    const defs = typeof _defs === 'function' ? _defs(gradients.length) : _defs;

    if (!defs) {
        return; // Don't wan't to create gradient elements
    }

    const join = select(defs)
        .selectAll('linearGradient')
        .data(gradients);

    join.enter()
        .append('linearGradient')
        .each(configureGradientEl);

    join.each(configureGradientEl);

    join.exit().remove();
}


// Whenever the style aggregator is updated...
function styleAggregatorEvent(ev) {
    const sa = ev.detail.sa;
    if (ev.detail.type !== 'styling' || saSet.has(sa)) {
        return; // Irrelevant or already handled
    }

    // Do any component use the changed style aggregator?
    for (const k of wcMap) {
        if (k[0].__saSa === sa) {
            saSet.add(sa);

            if (!refresh) {
                refresh = true;
                requestAnimationFrame(() => {
                    refresh = false;
                    wcMap.forEach(map => {
                        if (saSet.has(map.wc.__saSa)) {
                            addGradients(map.wc, map.defs);
                        }
                    });
                    saSet.clear();
                });
            }

            return; // Found at least one affected component. No need to check others
        }
    }
}


export function enableSvgGradients(wc, defs) {
    console.assert(!wcMap.get(wc));

    if (wcMap.size === 0) {
        document.addEventListener('style-aggregator', styleAggregatorEvent, {passive: true});
    }

    wcMap.set(wc, {wc, defs});

    // For unknown reasons (bug?) the stylesheets is not always ready after it has been added by the style aggregator, so let's give it (a long) time
    setTimeout(() => addGradients(wc, defs), 100);
}


export function disableSvgGradients(wc) {
    console.assert(wcMap.get(wc));

    wcMap.delete(wc);

    if (wcMap.size === 0) {
        document.removeEventListener('style-aggregator', styleAggregatorEvent);
    }
}
