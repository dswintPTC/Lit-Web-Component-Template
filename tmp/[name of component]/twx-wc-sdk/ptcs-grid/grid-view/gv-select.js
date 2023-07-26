// data-viewer UI for select control (#select)
import 'ptcs-checkbox/ptcs-checkbox';
import 'ptcs-radio/ptcs-radio';

import {sortIcon} from './sort';

import {PTCS} from 'ptcs-library/library.js';

/* eslint-disable no-confusing-arrow */

function singleCheckedChanged(ev) {
    const {dataMgr, index} = this.__editable;
    const checked = ev.detail.value;
    if (dataMgr && checked !== dataMgr.isSelected(index)) {
        dataMgr.select(dataMgr.baseIndex(index), checked, true);
    }
}

function multipleCheckedChanged(ev) {
    const {dataMgr, index} = this.__editable;
    const checked = ev.detail.value;
    if (dataMgr && checked !== dataMgr.isSelected(index)) {
        dataMgr.select(dataMgr.baseIndex(index), checked, true);
    }
}

function createSingleSelect() {
    const el = document.createElement('ptcs-radio');
    // remove default tabindex
    el.noTabindex = true;
    el.label = '';
    el.__editable = {};
    el.addEventListener('checked-changed', singleCheckedChanged);
    return el;
}

function createMultipleSelect(cell) {
    const el = document.createElement('ptcs-checkbox');
    el.label = '';
    el.__editable = {};
    el.addEventListener('checked-changed', multipleCheckedChanged);
    el.setAttribute('grid-action', '');
    el.setAttribute('part', 'row-selection-checkbox');
    // remove default tabindex
    el.noTabindex = true;

    PTCS.setbattr(cell, 'row-selection', true);

    return el;
}

function assignSelect(el, value, index, dataMgr) {
    // Keep track of where data belongs
    el.__editable.index = index;
    el.__editable.dataMgr = dataMgr;

    // Update status
    el.checked = dataMgr.isSelected(index);
}

export function uiSelect(config) {
    const selectMethod = config.selectMethod;

    const singleSelect = {create: createSingleSelect, assign: assignSelect, format: null};
    const multipleSelect = {create: cell => createMultipleSelect(cell), assign: assignSelect, format: null};

    return selectMethod === 'single' ? singleSelect : multipleSelect;
}

//
// This section implements the selection control in the grid header
//

// Custom element that observes a Data Manager when it is attached to the DOM and unobserves when it is detached
class GridSelectionObserver extends HTMLElement {
    static get is() {
        return 'ptcs-grid-selection-observer';
    }

    // Must be assign before the component is attached to the DOM
    set dataMgr(dataMgr) {
        this._dataMgr = dataMgr;
    }

    connectedCallback() {
        if (this._dataMgr) {
            this._dataMgr.observe(this);
        }
    }

    disconnectedCallback() {
        if (this._dataMgr) {
            this._dataMgr.unobserve(this);
        }
    }

    // Data manager events that might affect the header selection control
    dmSelection() {
        this._updateControl();
    }

    dmView() {
        this._updateControl();
    }

    dmRemoved() {
        this._updateControl();
    }

    dmInserted() {
        this._updateControl();
    }

    // Tell the selection control to update its status
    _updateControl() {
        if (this.firstChild && typeof this.firstChild.selectionChanged === 'function') {
            this.firstChild.selectionChanged();
        }
    }
}

customElements.define(GridSelectionObserver.is, GridSelectionObserver);


function createSingleSelectHeader() {
    return (dataMgr) => {
        const cntr = document.createElement('div');
        return cntr;
    };
}

function createMultipleSelectHeader(singleLine, maxHeight, sortSelection) {
    return (dataMgr, dataView) => {
        const cntr = document.createElement(GridSelectionObserver.is);
        cntr.dataMgr = dataMgr;
        cntr.style.display = 'inline-flex';
        const el = document.createElement('ptcs-checkbox');
        el.setAttribute('id', 'select-label');
        el.setAttribute('part', 'row-selection-checkbox');
        el.setAttribute('grid-action', '');
        // remove default tabindex
        el.noTabindex = true;
        el.label = '';

        // The number of selected items in the data manager
        const numSelected = dm => typeof dm.selected === 'number' ? 1 : (Array.isArray(dm.selected) && dm.selected.length);

        // Something has changed in the data manager, so the checkbox needs to update
        el.selectionChanged = function() {
            const n = dataMgr ? numSelected(dataMgr) : 0;
            el.setProperties({checked: n > 0, partial: 0 < n && n < dataMgr.length});
        };

        // The checkbox changed. If the new mode doesn't match the data manager, update its selection so it matches
        el.addEventListener('checked-changed', function(ev) {
            if (!dataMgr) {
                return;
            }
            const cbChecked = ev.detail.value;
            const dmChecked = numSelected(dataMgr) > 0;
            if (!cbChecked !== !dmChecked) {
                if (cbChecked) {
                    dataMgr.selectAllItems(true);
                } else {
                    dataMgr.unselectAllItems(true);
                }
            }
        });

        // Initialize state
        el.selectionChanged();

        cntr.appendChild(el);

        if (sortSelection) {
            // Vertically center the label and sort icon
            cntr.style.alignItems = 'center';
            cntr.appendChild(sortIcon(dataMgr, dataView, '#select'));
        }

        return cntr;
    };
}

// Create select header creating function
export function selectCreatorFunc(selectMethod, singleLine, maxHeight, sortSelection) {
    return selectMethod === 'single' ? createSingleSelectHeader(singleLine, maxHeight)
        : createMultipleSelectHeader(singleLine, maxHeight, sortSelection);
}
