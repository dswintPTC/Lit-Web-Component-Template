// data-viewer UI for NUMBER, LONG, INTEGER

import 'ptcs-label/ptcs-label';
import 'ptcs-textfield/ptcs-textfield';
import {createPTCLabelForGridCellWithUIProp} from './gv-text';

/* eslint-disable no-nested-ternary */

function toString(v) {
    if (!v) {
        return '';
    }
    return v.toString ? v.toString() : `${v}`;
}

function createNumber(cell, {format, minHeight, maxHeight, halign, valign}) {
    // Numbers are always single-line (I think) so avoid overhead computations
    const el = createPTCLabelForGridCellWithUIProp({singleLine: true, minHeight, maxHeight, halign, valign});
    el.setAttribute('variant', 'grid-item');
    el.setAttribute('disable-tooltip', '');
    cell.tooltipFunc = () => el.tooltipFunc();

    if (format) {
        el.__numberFormat = format;
    }

    return el;
}

function createRowNumber(cell, {singleLine, minHeight, maxHeight, halign, valign, selectMethod}) {
    const el = createNumber(cell, {singleLine, minHeight, maxHeight, halign, valign});

    // Align the row number label with the select checkbox
    el.setAttribute('part', `${el.getAttribute('part')}`);

    // Remove right padding if there is a select checkbox
    if (selectMethod === 'multiple') {
        cell.style.paddingRight = '0px';
    }

    return el;
}

function createNumberFunc(format, config) {
    const singleLine = config.singleLineRows;
    const minHeight = config.minHeightRow;
    const maxHeight = config.maxHeightRow;
    const halign = config.halign;
    const valign = config.valign;
    const selectMethod = config.selectMethod;
    const isRowNumber = config.showRowNumbers;

    if (isRowNumber) {
        return cell => createRowNumber(cell, {format, singleLine, minHeight, maxHeight, halign, valign, selectMethod});
    }

    return cell => createNumber(cell, {format, singleLine, minHeight, maxHeight, halign, valign});
}

function updateNumber(el, value, index, dataMgr) {
    if (value !== undefined) {
        el.label = el.__numberFormat ? `${el.__numberFormat.format(value)}` : `${value}`;
    } else {
        el.label = '';
    }
}

export function uiNumber(config) {
    const format = (config && config.locales)
        ? (config.options ? new Intl.NumberFormat(config.locales, config.options) : new Intl.NumberFormat(config.locales))
        : null;

    const formatNum = (format && format.format)
        ? v => [toString(v), format.format(v)] // Expose both raw string and formatted string
        : toString; // Raw string only

    return {create: createNumberFunc(format, config), assign: updateNumber, format: formatNum};
}
