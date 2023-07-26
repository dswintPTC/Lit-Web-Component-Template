// Implement Simple API for View Configurator
// Columns are defined by ptcs-grid-columns-def elements
import {PTCS} from 'ptcs-library/library.js';
import {DataViewer} from './grid-view.js';
import {createTemplateHeader, createTemplateElement, parseText} from './grid-template-element.js';

/* eslint-disable no-confusing-arrow */

/* eslint-disable no-multi-spaces */
const prop2attr = {
    label:        'label',         // The column header label
    baseType:     'base-type',     // The data type of value
    value:        'value',         // Field name or "#index"
    headerHAlign: 'header-halign', // The horizontal alignment of the header
    headerVAlign: 'header-valign', // The vertical alignment of the header
    halign:       'halign',        // The horizontal alignment of the cell content
    valign:       'valign',        // The vertical alignment of the cell content
    width:        'width',         // The column width.
    minWidth:     'min-width',     // The minimum column width when the width property contains is a dynamic value
    sortable:     'sortable',      // A Boolean property that displays a sort icon in the column header
    editable:     'editable',      // A Boolean property that controls whether inline editing is enabled or disabled for the column cells
    resizable:    'resizable',     // A Boolean property that controls whether columns can be be resized by the user. (_Not yet implemented_)
    hidden:       'hidden',        // Hide column?
    treeToggle:   'tree-toggle',   // Expand / collapse tree grid node?
    config:       'config'         // Specific cell configuration. The data shape of this field depends on the baseType property.
};
/* eslint-enable no-multi-spaces */


// The occurance of a Boolean attribute means that the property is true, unless the attribute value is 'false'
const toBool = value => value !== null && value !== undefined && value !== 'false';

const toString = value => value;

const toConfig = value => {
    try {
        return JSON.parse(value);
    } catch (error) {
        console.error(`${error.message}: ${value}`);
    }
    return undefined;
};

const toInterpolation = _interpolation => typeof _interpolation === 'string' ? toConfig(_interpolation) : _interpolation;

const toColumnDefName = _columnDefName => _columnDefName ? String(_columnDefName).toUpperCase() : 'PTCS-GRID-COLUMN-DEF';

// Convert attribute value to property value
function parseValue(attrValue) {
    return parseText(attrValue, this._interpolation);
}

const prop2decode = {
    value:     parseValue,
    sortable:  toBool,
    editable:  toBool,
    resizable: toBool,
    hidden:    toBool,
    config:    toConfig
};


// Convert attribute value to property value
function decodeValue(propName, attrValue) {
    return (prop2decode[propName] || toString).call(this, attrValue);
}


// When the clients doesn't assign the value function
const noValueSpecified = () => 'undefined';

//
// The DataViewerAPI
//
export class DataViewerAPI extends DataViewer {

    constructor(gridEl, interpolation, columnDefName) {
        super();

        this._gridEl = gridEl;
        this._interpolation = toInterpolation(interpolation);
        this._columnDefName = toColumnDefName(columnDefName);
        this._loadColumns();
    }

    // Rebuild the column definitions
    rebuildColumnDefs() {
        if (this.__rebuildSoon) {
            return;
        }
        this.__rebuildSoon = true;
        requestAnimationFrame(() => {
            this.__rebuildSoon = undefined;
            this._loadColumns();
        });
    }

    // A change has occured in the DOM structure that defines the DataViewer
    mutationEvent(mutations) {
        // Ignore (attribute) changes on the grid element
        if (mutations.some(mutation => mutation.target !== this._gridEl)) {
            this.rebuildColumnDefs();
        }
    }

    set columnDefName(_columnDefName) {
        const columnDefName = toColumnDefName(_columnDefName);
        if (this._columnDefName !== columnDefName) {
            this._columnDefName = columnDefName;
            this.rebuildColumnDefs();
        }
    }

    get columnDefName() {
        return this._columnDefName;
    }

    set interpolation(_interpolation) {
        if (this._interpolation !== _interpolation) {
            this._interpolation = toInterpolation(_interpolation);
            this.rebuildColumnDefs();
        }
    }

    get interpolation() {
        return this._interpolation;
    }

    // Decode a ptcs-grid-columnd-def element
    _decodeColumn(coldef) {
        const column = {baseType: 'STRING', value: noValueSpecified};

        for (const propName in prop2attr) {
            const propValue = coldef[propName];
            if (propValue !== undefined) {
                column[propName] = propValue;
            } else if (coldef.hasAttribute(prop2attr[propName])) {
                column[propName] = decodeValue.call(this, propName, coldef.getAttribute(prop2attr[propName]));
            }
        }

        // Cell template / header element?
        if (coldef.firstElementChild) {
            const headerEl = coldef.querySelector(':scope > [grid-header]');
            const cellTmpl = coldef.querySelector(':scope > :not([grid-header])');
            if (headerEl) {
                column.label = createTemplateHeader(headerEl);
            }
            if (cellTmpl) {
                column.$uiCtrl = createTemplateElement(cellTmpl, this._interpolation);
            }
        }

        return column;
    }

    _slottedColDefs(slot) {
        return slot && [...slot.assignedElements()].filter(el => el.tagName === this._columnDefName);
    }

    _childrenColDefs() {
        const coldefs = [...this._gridEl.querySelectorAll(this._columnDefName)];
        if (coldefs.length) {
            return coldefs;
        }
        const template = this._gridEl.querySelector('template');
        return template ? [...template.content.querySelectorAll(this._columnDefName)] : [];
    }

    // Load the grid column specifications
    _loadColumns() {
        const slot = this._gridEl.querySelector('slot');
        const coldefs = this._slottedColDefs(slot) || this._childrenColDefs();
        this.columnsDef = coldefs.map(this._decodeColumn.bind(this));

        // Update slot mode
        if (slot) {
            this._setSlot(slot, coldefs);
        } else {
            this._clearSlot();
        }
    }

    _setSlot(slot, coldefs) {
        if (this._slotObserver) {
            if (PTCS.sameArray(this._slotted, coldefs)) {
                return; // Same elements as before. Do nothing
            }
            this._slotObserver.disconnect();
        } else {
            this._slotObserver = new MutationObserver(this.rebuildColumnDefs.bind(this));
            this._slotEl = slot;
            this._slotchangeFunc = this._slotchange.bind(this);
            this._slotEl.addEventListener('slotchange', this._slotchangeFunc);
        }
        this._slotted = coldefs;
        coldefs.forEach(coldef => this._slotObserver.observe(coldef, {childList: true, subtree: true, attributes: true, characterData: true}));
    }

    _clearSlot() {
        if (this._slotObserver) {
            this._slotObserver.disconnect();
            this._slotObserver = undefined;
            this._slotEl.removeEventListener('slotchange', this._slotchangeFunc);
            this._slotEl = undefined;
            this._slotted = undefined;
        }
    }

    _slotchange() {
        // The grid slot seems to generate at least one false change event, so to prevent a
        // full view rebuild, make sure that some elements actually has changed
        if (!PTCS.sameArray(this._slottedColDefs(this._gridEl.querySelector('slot')), this._slotted)) {
            this.rebuildColumnDefs();
        }
    }
}
