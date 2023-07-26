import {select} from 'd3-selection';
import {curveStepBefore, curveStepAfter, curveStep} from 'd3-shape';

export const markersSet = new Set(['circle', 'square', 'diamond', 'triangle', 'plus', 'cross']);

export const showValuesSet = new Set(['above', 'below', 'on']);

export const steps = new Set([curveStepBefore, curveStepAfter, curveStep]);

export const markerScale = markerSize => {
    switch (markerSize) {
        case 'small':
            return 0.5;
        case undefined:
        case null:
        case '':
        case 'medium':
            return 1;
        case 'large':
            return 1.5;
        case 'xlarge':
            return 2;
        default: {
            const v = +markerSize;
            if (!isNaN(v) && v > 0) {
                return v / 16;
            }
        }
    }
    return 1;
};

export function removeChildren(el, selector) {
    if (typeof selector === 'string') {
        [...el.querySelectorAll(`:scope > ${selector}`)].forEach(e => e.remove());
    } else {
        while (el.firstChild) {
            el.removeChild(el.lastChild);
        }
    }
}

export function drawMarkers({el, flipAxes, marker, markerSize, xPos, yPos, legend, stateKey, depField, data, selected, cb}) {
    const _marker = `#ptc-${marker}-wb`;

    const markerPosFunc = () => {
        const scale = markerScale(markerSize);

        if (scale === 1) {
            return flipAxes
                ? (d, i) => `translate(${yPos(d, i)}px,${xPos(d, i)}px)`
                : (d, i) => `translate(${xPos(d, i)}px,${yPos(d, i)}px)`;
        }

        return flipAxes
            ? (d, i) => `translate(${yPos(d, i)}px,${xPos(d, i)}px) scale(${scale})`
            : (d, i) => `translate(${xPos(d, i)}px,${yPos(d, i)}px) scale(${scale})`;
    };

    const setPos = markerPosFunc();

    function showMarker(d, i) {
        this.setAttribute('legend', typeof legend === 'function' ? legend(d, i) : legend);
        this.setAttribute('state-key', stateKey);
        this._depfield = depField ? depField(d) : undefined;
        this.setAttribute('href', _marker);

        //this.setAttribute('x-index', pointIx)
        //this.setAttribute('selected', selected);

        this.style.transform = setPos(d, i);

        if (cb) {
            cb.call(this, d, i);
        }
    }

    // Root element should only contain basic markers
    removeChildren(el, ':not(use[part=marker])');

    const createMarkerEl = (d, i) => {
        const markerEl = document.createElementNS('http://www.w3.org/2000/svg', 'use');
        markerEl.setAttribute('part', 'marker');
        markerEl.setAttribute('state-key', stateKey);
        return markerEl;
    };

    const join = select(el)
        .selectAll('use[part=marker]')
        .data((marker && marker !== 'none') ? data : []);

    join.enter()
        .append(createMarkerEl)
        .attr('selected', selected)
        .each(showMarker);

    join.attr('selected', selected)
        .each(showMarker);

    join.exit().remove();
}


export function updateMarkerSelection({el, marker, data, selected}) {
    select(el)
        .selectAll('use[part=marker]')
        .data((marker && marker !== 'none') ? data : [])
        .attr('selected', selected);
}


function setLabelPosFunc(showValues, marker, markerSize, flipAxes) {
    const hasMarker = markersSet.has(marker);
    const dy = 8 * markerScale(markerSize);

    if (showValues === 'above' && hasMarker) {
        return flipAxes
            ? (x, y, w, h, f) => f(y - w / 2, x - dy - h)
            : (x, y, w, h, f) => f(x - w / 2, y - dy - h);
    }

    if (showValues === 'below' && hasMarker) {
        return flipAxes
            ? (x, y, w, _, f) => f(y - w / 2, x + dy)
            : (x, y, w, _, f) => f(x - w / 2, y + dy);
    }

    return flipAxes
        ? (x, y, w, h, f) => f(y - w / 2, x - h / 2)
        : (x, y, w, h, f) => f(x - w / 2, y - h / 2);
}


export function drawValues({el, data, label, legend, stateKey, depField, xPos, yPos, showValues, marker, markerSize, flipAxes, fit}) {
    const setPos = setLabelPosFunc(showValues, marker, markerSize, flipAxes);

    const createValueEl = (d, i) => {
        const valueEl = document.createElement('ptcs-label');
        valueEl.setAttribute('part', 'value');
        valueEl.setAttribute('state-key', stateKey);
        return valueEl;
    };

    function assignLabel(d) {
        this.setAttribute('legend', legend);
        this._depfield = depField ? depField(d) : undefined;
        this.label = label(d);
        this.style.visibility = 'hidden';
    }

    function placeLabel(d) {
        setPos(xPos(d), yPos(d), this.clientWidth, this.clientHeight, (x, y) => {
            if (!fit || fit(x, y, this.clientWidth, this.clientHeight)) {
                this.style.transform = `translate(${x}px,${y}px)`;
                this.style.visibility = '';
            }
        });
    }

    removeChildren(el, ':not(ptcs-label[part=value])');

    const join = select(el)
        .selectAll('ptcs-label[part=value]')
        .data(data);

    join.enter()
        .append(createValueEl)
        .attr('variant', 'label')
        .property('horizontalAlignment', 'center')
        .each(assignLabel)
        .each(placeLabel);

    join.each(assignLabel);

    join.exit().remove();

    // Place the changed labels in a separate step (much faster)
    join.each(placeLabel);
}
