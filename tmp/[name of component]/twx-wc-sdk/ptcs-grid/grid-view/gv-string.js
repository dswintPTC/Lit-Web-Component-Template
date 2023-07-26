// data-viewer UI for STRING

import 'ptcs-label/ptcs-label';
import 'ptcs-textfield/ptcs-textfield';
import 'ptcs-dropdown/ptcs-dropdown';
import {createPTCLabelForGridCellWithUIProp} from './gv-text';

// ptcs-label that displays the string
function createString(cell, {singleLine, minHeight, maxHeight, halign, valign}) {
    const el = createPTCLabelForGridCellWithUIProp({singleLine, minHeight, maxHeight, halign, valign});
    el.setAttribute('variant', 'grid-item');
    el.setAttribute('disable-tooltip', '');
    cell.tooltipFunc = () => el.tooltipFunc();

    return el;
}

// Assign new string to ptcs-label
function assignString(el, value) {
    el.label = value;
}

export function uiString(config) {
    const singleLine = config.singleLineRows;
    const minHeight = config.minHeightRow;
    const maxHeight = config.maxHeightRow;
    const halign = config.halign;
    const valign = config.valign;

    return {create: cell => createString(cell, {singleLine, minHeight, maxHeight, halign, valign}), assign: assignString};
}
