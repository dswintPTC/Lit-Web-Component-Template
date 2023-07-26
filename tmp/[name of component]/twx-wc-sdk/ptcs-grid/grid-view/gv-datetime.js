// data-viewer UI for DATETIME

import 'ptcs-label/ptcs-label';
import 'ptcs-datepicker/ptcs-datepicker';
import {createPTCLabelForGridCellWithUIProp} from './gv-text';


function createDatetime(cell, {format, minHeight, maxHeight, singleLine, halign, valign}) {
    const el = createPTCLabelForGridCellWithUIProp({singleLine, minHeight, maxHeight, halign, valign});
    el.setAttribute('variant', 'grid-item');
    el.setAttribute('disable-tooltip', '');
    cell.tooltipFunc = () => el.tooltipFunc();

    if (format) {
        el.__dateTimeFormat = format;
    }
    return el;
}

function createDatetimeFunc(format, config) {
    const singleLine = config.singleLineRows;
    const minHeight = config.minHeightRow;
    const maxHeight = config.maxHeightRow;
    const halign = config.halign;
    const valign = config.valign;
    return cell => createDatetime(cell, {format, singleLine, minHeight, maxHeight, halign, valign});
}

function updateDatetime(el, value) {
    if (value instanceof Date) {
        el.label = el.__dateTimeFormat ? `${el.__dateTimeFormat.format(value)}` : `${value}`;
    } else if (value) {
        el.label = `${value}`;
    } else {
        el.label = '';
    }
}

export function uiDatetime(config) {
    // eslint-disable-next-line no-nested-ternary
    const format = (config && config.locales)
        ? (config.options ? new Intl.DateTimeFormat(config.locales, config.options) : new Intl.DateTimeFormat(config.locales))
        : null;

    return {create: createDatetimeFunc(format, config), assign: updateDatetime, format: (format && format.format) || undefined};
}
