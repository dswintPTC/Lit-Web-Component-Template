// data-viewer UI for HYPERLINK

import 'ptcs-link/ptcs-link';
import 'ptcs-textfield/ptcs-textfield';


// Create ptcs-link
function createLink(cell, config) {
    const el = document.createElement('ptcs-link');
    el.singleLine = config.singleLineRows;
    el._zeroPaddingNoScroll = true;
    el._disScrollOnPtcsLabelEllipsMultiLine = true;
    el._disScrollOnPtcsLabelMaxHeight = config.maxHeightRow;
    el.style.minHeight = config.minHeightRow + 'px';

    // Disable the styling of the ptcs-label and the <a> within the link
    el.variant = 'grid-item';

    //eslint-disable-next-line no-nested-ternary
    el.verticalAlignment = config.valign === 'top' ? 'flex-start' : (config.valign === 'bottom' ? 'flex-end' : config.valign);

    if (config.target) {
        el.target = config.target;
    }

    el.setAttribute('part', 'cell-link');
    el.setAttribute('tabindex', '-1');
    el.setAttribute('grid-action', '');

    return el;
}

// Assign new value to ptcs-link
function assignLink(el, value) {
    if (typeof value === 'object' && value !== null) {
        el.href = value.href;
        el.label = value.label;

        return;
    }

    el.href = value;
    el.label = value;
}

// Extract link text(s)
function linkText(value) {
    if (value === null) {
        return null;
    }
    return typeof value === 'object' ? value.label : value;
}

export function uiHyperlink(config) {
    return {create: cell => createLink(cell, config), assign: assignLink, format: linkText};
}
