// data-viewer UI for TEXT
import {PTCS} from 'ptcs-library/library.js';
import 'ptcs-label/ptcs-label';
import 'ptcs-textarea/ptcs-textarea';


function __assignHeights(el, minHeight, maxHeight, setMin, setMax) {
    const cell = el.closest('.cell');
    if (!cell) {
        // Label is not in a cell?
        return;
    }
    const {paddingTop, paddingBottom} = getComputedStyle(cell);
    const top = PTCS.cssDecodeSize(paddingTop, cell, true) || 0;
    const bottom = PTCS.cssDecodeSize(paddingBottom, cell, true) || 0;
    if (top + bottom > 0) {
        if (minHeight > 0) {
            setMin(el, Math.max(1, minHeight - top - bottom));
        }
        if (maxHeight > 0) {
            setMax(el, Math.max(1, maxHeight - top - bottom));
        }
    }
}

export function assignHeightMinusCellPadding(el, minHeight, maxHeight, setMin, setMax) {
    if (el.isConnected) {
        __assignHeights(el, minHeight, maxHeight, setMin, setMax);
    } else if (minHeight > 0 || maxHeight > 0) {
        // Cell has no padding yet, so assume zero padding
        if (minHeight > 0) {
            setMin(el, minHeight);
        }
        if (maxHeight > 0) {
            setMax(el, maxHeight);
        }
        requestAnimationFrame(() => {
            if (el.isConnected) {
                __assignHeights(el, minHeight, maxHeight, setMin, setMax);
            }
        });
    }
}

function setMinHeight(el, minHeight) {
    // Does nothing
}

function setMaxHeight(el, maxHeight) {
    el.maxHeight = maxHeight;
}

export function createPTCLabelForGridCellWithUIProp({singleLine, minHeight, maxHeight, halign, valign, part}) {
    const el = document.createElement('ptcs-label');
    el.disclosureControl = 'ellipsis';
    el.disScrollOnEllipsMultiLine = true;
    //eslint-disable-next-line no-nested-ternary
    el.verticalAlignment = valign === 'top' ? 'flex-start' : (valign === 'bottom' ? 'flex-end' : valign);
    el.horizontalAlignment = halign || 'left';

    if (!singleLine) {
        el.multiLine = true;
        assignHeightMinusCellPadding(el, minHeight, maxHeight, setMinHeight, setMaxHeight);
    }

    el.setAttribute('part', part || 'cell-label state-value');
    return el;
}

function createText(cell, {singleLine, minHeight, maxHeight, halign, valign}) {
    const el = createPTCLabelForGridCellWithUIProp({singleLine, minHeight, maxHeight, halign, valign});
    el.setAttribute('variant', 'grid-item');
    el.setAttribute('disable-tooltip', '');
    cell.tooltipFunc = () => el.tooltipFunc();

    return el;
}

export function createTextFunc(config) {
    const singleLine = config.singleLineRows;
    const minHeight = config.minHeightRow;
    const maxHeight = config.maxHeightRow;
    const halign = config.halign;
    const valign = config.valign;
    return cell => createText(cell, {singleLine, minHeight, maxHeight, halign, valign});
}

export function updateText(el, value) {
    el.label = value;
}

export function uiText(config) {
    return {create: createTextFunc(config), assign: updateText};
}
