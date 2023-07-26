// Fallback data-viewer UI for unknown baseTypes
import {createPTCLabelForGridCellWithUIProp} from './gv-text';

const optRef = Symbol('opt');
const textfieldRef = Symbol('textfieldRef'); // Attach column definition to input element


function createFallback(opt) {
    const el = document.createElement('div');
    el[optRef] = opt;
    el.style.width = '100%';
    el.style.display = 'flex';
    switch (opt.halign) {
        case 'center':
            el.style.justifyContent = 'center';
            break;
        case 'right':
            el.style.justifyContent = 'flex-end';
    }
    return el;
}

function assignFallback(el, value) {
    if (typeof value === 'function') {
        value = value();
    }

    if (value instanceof Node) {
        while (el.firstChild) {
            el.removeChild(el.firstChild);
        }
        if (el.parentNode) {
            el.parentNode.tooltipFunc = undefined;
        }
        el.appendChild(value);
        return;
    }

    if (!el[textfieldRef]) {
        el[textfieldRef] = createPTCLabelForGridCellWithUIProp(el[optRef]);
        el[textfieldRef].setAttribute('variant', 'grid-item');
        el[textfieldRef].setAttribute('disable-tooltip', '');
    }

    if (typeof value === 'string') {
        el[textfieldRef].label = value;
    } else {
        el[textfieldRef].label = 'unknown ' + typeof value;
    }

    if (el.firstChild !== el[textfieldRef]) {
        while (el.firstChild) {
            el.removeChild(el.firstChild);
        }
        el.appendChild(el[textfieldRef]);
        if (el.parentNode) {
            el.parentNode.tooltipFunc = () => el[textfieldRef].tooltipFunc();
        }
    }
}

export function uiFallback(config) {
    const singleLine = config.singleLineRows;
    const minHeight = config.minHeightRow;
    const maxHeight = config.maxHeightRow;
    const halign = config.halign;
    const valign = config.valign;

    return {create: () => createFallback({singleLine, minHeight, maxHeight, halign, valign}), assign: assignFallback};
}
