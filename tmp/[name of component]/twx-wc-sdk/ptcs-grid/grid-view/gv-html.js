// data-viewer UI for HTML
import {assignHeightMinusCellPadding} from './gv-text';

function setMinH(el, minHeight) {
    el.style.minHeight = minHeight + 'px';
}

function setMaxH(el, maxHeight) {
    el.style.maxHeight = maxHeight + 'px';
}

// Create span element to render html content
function createHtml(cell, config) {
    const ctr = document.createElement('div');
    const el = document.createElement('span');

    if (config.maxHeightRow > 0 || config.minHeightRow > 0) {
        ctr.style.width = '100%';
        el.style.overflow = 'hidden';
        el.style.textOverflow = 'ellipsis';
        assignHeightMinusCellPadding(ctr, config.minHeightRow, config.maxHeightRow, setMinH, setMaxH);
    }

    if (config.minHeightRow) {
        ctr.style.display = 'flex';

        // eslint-disable-next-line no-nested-ternary
        ctr.style.alignItems = config.valign === 'top' ? 'flex-start' : (config.valign === 'bottom' ? 'flex-end' : config.valign);
        // eslint-disable-next-line no-nested-ternary
        ctr.style.justifyContent = config.halign === 'left' ? 'flex-start' : (config.halign === 'right' ? 'flex-end' : config.halign);
    }

    ctr.appendChild(el);
    ctr.setAttribute('part', 'cell-html');

    return ctr;
}

// Assign the html content
function assignHtml(el, value) {
    el.firstChild.innerHTML = typeof value === 'string' ? value : '';
}

export function uiHtml(config) {
    return {create: cell => createHtml(cell, config), assign: assignHtml};
}
