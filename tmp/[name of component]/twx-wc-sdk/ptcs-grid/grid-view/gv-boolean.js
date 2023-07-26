// data-viewer UI for IMAGELINK

import 'ptcs-checkbox/ptcs-checkbox';
import {createPTCLabelForGridCellWithUIProp} from './gv-text';

/* eslint-disable no-confusing-arrow*/

const valign = (v) => {
    //eslint-disable-next-line no-nested-ternary
    return v === 'top' ? 'flex-start' : (v === 'bottom' ? 'flex-end' : v);
};

function createCheckbox(cell, config) {
    const el = document.createElement('ptcs-checkbox');
    el.setAttribute('part', 'cell-checkbox');
    // remove default tabindex
    el.noTabindex = true;
    el.label = '';
    el._zeroPadding = true; // Reset padding (override theming)
    el.verticalAlignment = valign(config.valign);

    return el;
}

function assignCheckbox(el, value) {
    el.checked = !!value;
    el.disabled = true;
}

function createBoolString(cell, config) {
    const singleLine = config.singleLineRows;
    const minHeight = config.minHeightRow;
    const maxHeight = config.maxHeightRow;
    const el = createPTCLabelForGridCellWithUIProp({singleLine, minHeight, maxHeight, valign: config.valign});
    el.setAttribute('variant', 'grid-item');
    el.__boolType = config.boolType;
    return el;
}

function assignBoolString(el, value) {
    el.label = el.__boolType === 'notext' ? '' : `${!!value}`;
}

export function uiBoolean(config) {
    const format = v => v ? 'true' : 'false';
    const boolType = config && config.boolType;
    if (boolType === 'checkbox') {
        return {create: cell => createCheckbox(cell, config), assign: assignCheckbox, format};
    }
    return {create: cell => createBoolString(cell, config), assign: assignBoolString, format};
}
