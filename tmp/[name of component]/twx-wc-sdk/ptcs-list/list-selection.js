import {PTCS} from 'ptcs-library/library.js';

/* eslint-disable no-confusing-arrow, no-nested-ternary */
const _observedProps = ['items', 'multiSelect', 'selectedIndexes', 'selectedItems', 'selectedValue', 'selected', 'autoSelectFirstRow'];
const _selectionProps = ['_selectedIndexes', '_selectedItems', '_selectedValue', '_selected'];

export class ListSelection {
    /*
     * Observed and managed properties
     *
    static get properties() {
        return {
            _valueOf: Function // Extracts value from item

            // Items supplied by the client. Read-only
            items: {
                type:  Array,
                value: () => []
            },

            // Support multiple selections?
            multiSelect: {
                type:               Boolean,
                reflectToAttribute: true,
                observer:           '_multiSelectChanged'
            },

            // Indexes of selected items
            selectedIndexes: {
                type:   Array,
                notify: true,
                value:  () => []
            },

            selectedItems: {
                type:   Array,
                value:  () => [],
                notify: true
            },

            // Value of selected item, if single selection mode
            selectedValue: {
                type:               String,
                reflectToAttribute: true,
                notify:             true,
                observer:           '_selectedValueChanged'
            },

            // Index of selected object, if single selection mode
            selected: {
                type:     Number,
                notify:   true,
                observer: '_selectedChanged',
                value:    -1
            },

            autoSelectFirstRow: {
                type:     Boolean,
                value:    false,
                observer: '_autoSelectFirstRowChanged'
            }
        };
    }
    */

    constructor() {
        this._owner = null;
        this._valueOf = item => item;
        this._items = [];
        this._selectedIndexes = [];
        this._selectedItems = [];
        this._selectedValue = undefined;
        this._selected = -1;
    }

    bind(owner, forceUpdate = true) {
        // Can only be bound to a single selection component
        console.assert(owner);
        console.assert(!this._owner);

        this._owner = owner;

        // Start with the current owner values (don't notify)
        if (!forceUpdate) {
            _observedProps.forEach(name => {
                this[`_${name}`] = owner[name];
            });
        }

        // Initialize now, when all pieces has been pulled together
        this._selectedWork(() => {
            if (forceUpdate) {
                // Get initial values now - so they are reported
                _observedProps.forEach(name => {
                    this[`_${name}`] = owner[name];
                });
            }
            if (this._selectedValue !== undefined && this._selectedValue !== '') {
                this._selectedValueChanged(this._selectedValue);
            } else if (this._selected >= 0) {
                this._selectedChanged(this._selected);
            } else if (this._selectedIndexes && this._selectedIndexes.length > 0) {
                this._selectedIndexesChanged(this._selectedIndexes);
            } else if (this._selectedItems && this._selectedItems.length > 0) {
                this._selectedItemsChanged(this._selectedItems);
            } else if (this._autoSelectFirstRow) {
                this._autoSelectFirstRowChanged(this._autoSelectFirstRow);
            }
        }, forceUpdate);
    }

    unbind(owner) {
        console.assert(owner === this._owner);

        this._owner = undefined;
        this._unselectAll();
    }

    // Manipulate selection data and block all selection callbacks
    _selectedWork(doWork, forceUpdate = false) {
        if (!this.__protectSelectedWork) {
            const eq = (prop1, prop2) => {
                if (prop1 === prop2) {
                    return true;
                }
                if (prop1 instanceof Array && prop2 instanceof Array) {
                    if (prop1.length !== prop2.length) {
                        return false;
                    }
                    for (let i = 0; i < prop1.length; i++) {
                        if (prop1[i] !== prop2[i]) {
                            return false;
                        }
                    }
                    return true;
                }
                return false;
            };
            this.__protectSelectedWork = true;
            try {
                const old = _selectionProps.map(name => this[name]);
                //console.log(old);
                doWork();
                //console.log(_selectionProps.map(name => this[name]));
                const change = {};
                let update = false;
                _selectionProps.forEach((name, index) => {
                    if (!eq(old[index], this[name]) || forceUpdate) {
                        change[name.substring(1)] = this[name];
                        update = true;
                    }
                });

                if (update && this._owner) {
                    this._owner._updateSelection(change);
                }
            } catch (err) {
                console.error(err);
            } finally {
                this.__protectSelectedWork = undefined;
            }
        }
    }

    // Client changes an "atomic" property
    _propChange(name, value, forceUpdate = false) {
        const old = this[name];
        if (old !== value) {
            this._selectedWork(() => {
                this[name] = value;
                this[`${name}Changed`](value, old);
            }, forceUpdate);
        }
    }

    // Client changes an array property
    _arrayChange(name, cr, forceUpdate = false) {
        if (cr.path && cr.path !== name) {
            this[`_${name}ArrayChanged`](cr);
        } else {
            this._propChange(`_${name}`, cr.value, forceUpdate);
        }
    }

    /*
     * Client property operations
    */

    set valueOf(_valueOf) {
        if (typeof _valueOf === 'function') {
            this._propChange('_valueOf', _valueOf);
        }
    }

    set selectedValue(_selectedValue) {
        this._propChange('_selectedValue', _selectedValue);
    }

    set multiSelect(_multiSelect) {
        this._propChange('_multiSelect', _multiSelect);
    }

    set selected(_selected) {
        this._propChange('_selected', _selected);
    }

    set autoSelectFirstRow(_autoSelectFirstRow) {
        this._propChange('_autoSelectFirstRow', _autoSelectFirstRow);
    }

    itemsChanged(cr) {
        // When items change, make sure all selection properties generates callbacks, if there is a selection
        this._arrayChange('items', cr, this._selectedItems && this._selectedItems.length > 0);
    }

    selectedIndexesChanged(cr) {
        this._arrayChange('selectedIndexes', cr);
    }

    _xlateSelectedItemsToIndexes(selectedItems) {
        // Create a Set of the selected items / values
        const set = (selectedItems || []).reduce((a, item) => {
            a.add(item);
            const v = this._valueOf(item);
            if (v && v !== item) {
                a.add(v);
            }
            return a;
        }, new Set());

        // Create a selectedIndexes array
        return this._items.reduce((a, item, index) => {
            if (set.has(item)) {
                a.push(index);
            } else if (set.has(this._valueOf(item))) {
                a.push(index);
                a.mustAdjust = true; // selectedItems contains items that are not part of items
            }
            return a;
        }, []);
    }

    selectedItemsChanged(cr) {
        if (!this.__protectSelectedWork && this._items && this._items.length) {
            // If we get here then we know that the client has changed selectedItems
            // Translate the specified selection to actual items

            const si = this._xlateSelectedItemsToIndexes(cr.base);

            // Do we need to adjust selectedItems (does it have foreign objects or is it out-of-sync with si [=selectedIndexes])?
            if (si.mustAdjust || !PTCS.sameArray(cr.base, si, (item, index) => this._items[index] === item)) {
                // Adjust selectedItems and report adjusted change
                this._selectedItems = cr.base; // old value
                this._propChange('_selectedItems', si.map(index => this._items[index]));
                return;
            }

            if (PTCS.sameArray(si, this._selectedIndexes)) {
                return; // No change and no adjustment - do nothing
            }
        }

        // Report original change
        this._arrayChange('selectedItems', cr);
    }

    /*
     * Actual change handlers
     */

    _itemsArrayChanged(cr) {
        console.assert(cr.path !== 'items');
        if (cr.path === 'items.splices') {
            // Added / removed items
            if (cr.value.indexSplices) {
                this._selectedWork(() => {
                    cr.value.indexSplices.forEach(item => {
                        if (item.removed && item.removed.length) {
                            this._removeItems(item.index, item.index + item.removed.length, item.removed);
                        }
                        if (item.addedCount && item.addedCount) {
                            this._insertItems(item.index, item.index + item.addedCount, item.object);
                        }
                    });
                    this._selectedItems = this._selectedIndexes.map(index => this._items[index]).filter(item => item);
                }, true); // When items change, make sure all selection properties generates callbacks
            }
        }
    }

    _selectedIndexesArrayChanged(cr) {
        console.assert(cr.path !== 'selectedIndexes');
        if (cr.path === 'selectedIndexes.splices') {
            // Added / removed selection indexes
            this._selectedWork(() => {
                this._selectedIndexes = this._owner.selectedIndexes;
                this._selectedIndexesChanged(this._selectedIndexes);
            });
        }
    }

    _selectedItemsArrayChanged(cr) {
        // TODO: Handle selectedItems
        console.assert(cr.path !== 'selectedItems');
    }

    _itemsChanged(_items) {
        // A new list of items
        if (this._selectedValue !== undefined && this._selectedValue !== '' && !this._multiSelect) {
            // if the new list has the same value select it again
            this._selected = _items.findIndex(item => this._valueOf(item) === this._selectedValue);
            if (this._selected >= 0 && this._selected < _items.length) {
                this._selectedIndexes = [this._selected];
                this._selectedItems = [_items[this._selected]];
            } else {
                this._unselectAll();
                this._autoSelectFirstRowChanged(this._autoSelectFirstRow);
            }
        } else {
            this._unselectAll();
            this._autoSelectFirstRowChanged(this._autoSelectFirstRow);
        }
    }

    _unselectAll() {
        this._selectedIndexes = [];
        this._selectedItems = [];
        this._selectedValue = undefined;
        this._selected = -1;
    }

    _removeItems(start, end) {
        console.assert(this.__protectSelectedWork);
        const num = end - start;
        // Update selected
        const selected = (this._selected < start || this._selected >= end)
            ? this._selected < start ? this._selected : this._selected - num
            : -1;
        this._selected = selected;
        this._selectedValue = selected >= 0 ? this._valueOf(this._items[selected]) : undefined;
        // eslint-disable-next-line no-confusing-arrow
        this._selectedIndexes = this._selectedIndexes.filter(ix => (ix < start || ix >= end)).map(ix => (ix < start ? ix : ix - num));
    }

    _insertItems(start, end) {
        console.assert(this.__protectSelectedWork);
        const num = end - start;
        const selected = this._selected >= start ? this._selected + num : this._selected;
        this._selected = selected;
        this._selectedValue = selected >= 0 ? this._valueOf(this._items[selected]) : undefined;
        // eslint-disable-next-line no-confusing-arrow
        this._selectedIndexes = this._selectedIndexes.map(ix => (ix >= start ? ix + num : ix));
    }

    _valueOfChanged(_valueOf) {
        if (this._selected >= 0) {
            this._selectedValue = this._valueOf(this._items[this._selected]);
        }
    }

    _multiSelectChanged(_multiSelect) {
        // Transfer selected items between modes
        if (!_multiSelect && this._selectedIndexes.length > 1) {
            this._selected = this._selectedIndexes[0];
            this._selectedChanged(this._selected);
        }
    }

    _selectedIndexesChanged(_selectedIndexes) {
        if (this._multiSelect) {
            // Make sure indexes are sorted
            for (let i = 1; i < _selectedIndexes.length; i++) {
                if (_selectedIndexes[i - 1] >= _selectedIndexes[i]) {
                    _selectedIndexes.sort((a, b) => a - b);
                    // Unique indexes
                    for (i = 1; i < _selectedIndexes.length; i++) {
                        if (_selectedIndexes[i - 1] === _selectedIndexes[i]) {
                            this._selectedIndexes = _selectedIndexes = [...new Set(_selectedIndexes)];
                            break;
                        }
                    }
                    break;
                }
            }
            this._selectedItems = _selectedIndexes.map(index => this._items[index]).filter(item => item);
        } else if (_selectedIndexes.length > 0) {
            // Single selection mode. Only use selectedIndexes[0]
            this._selected = _selectedIndexes[0];
            this._selectedValue = this._valueOf(this._items[this._selected]);
            this._selectedItems = [this._items[this._selected]];
        } else {
            this._unselectAll();
        }
    }

    _selectedItemsChanged(_selectedItems) {
        if (!this._items || this._items.length === 0) {
            return;
        }

        const match = PTCS.sameArray(_selectedItems, this._selectedIndexes, (item, index) => this._items[index] === item);
        if (match) {
            return; // selecteItems follows selectedIndexes. No action is needed.
        }

        // Compute selectedIndexes according to selectedItems
        const si = this._xlateSelectedItemsToIndexes(_selectedItems);

        // Assign selection, according to selection mode
        if (this._multiSelect) {
            this._selectedIndexes = si;
        } else if (si && si.length > 0) {
            // Single selection mode. Only use selectedItems[0]
            const selected = si[0];
            this._selected = selected;
            this._selectedIndexes = selected >= 0 ? [selected] : [];
        } else {
            this._unselectAll();
        }

        // Adjust selectedItems
        this._selectedItems = this._selectedIndexes.map(index => this._items[index]);
    }


    // Someone or something changed _selectedValue
    _selectedValueChanged(_selectedValue) {
        if (!this._items || this._items.length === 0) {
            return;
        }
        if (this._multiSelect) {
            if (this._filter && this._itemsIndexFiltered) {
                this._selectedIndexes = this._itemsIndexFiltered.filter(index => this._valueOf(this._items[index]) === _selectedValue);
            } else {
                const si = [];
                this._items.forEach((item, index) => {
                    if (this._valueOf(item) === _selectedValue) {
                        si.push(index);
                    }
                });
                this._selectedIndexes = si;
            }
        } else {
            let selected = (this._filter && this._itemsIndexFiltered)
                ? this._itemsIndexFiltered.findIndex(index => this._valueOf(this._items[index]) === _selectedValue)
                : this._items.findIndex(item => this._valueOf(item) === _selectedValue);
            selected = selected === -1 && this._autoSelectFirstRow ? 0 : selected;
            this._selected = selected;
            this._selectedIndexes = selected >= 0 ? [selected] : [];
        }
        this._selectedItems = this._selectedIndexes.map(index => this._items[index]).filter(item => item);
    }

    _selectedChanged() {
        if (!this._items.length === 0) {
            return;
        }
        if (this._selected >= 0 && this._items[this._selected]) {
            this._selectedValue = this._valueOf(this._items[this._selected]);
            this._selectedIndexes = [this._selected];
            this._selectedItems = [this._items[this._selected]];
        } else {
            this._selectedValue = undefined;
            this._selectedIndexes = [];
            this._selectedItems = [];
        }
    }

    _autoSelectFirstRowChanged(_autoSelectFirstRow) {
        if (!this._multiSelect && this._items && this._items.length) {
            const selectedIndexesLength = this._selectedIndexes ? this._selectedIndexes.length : 0;
            if (_autoSelectFirstRow && selectedIndexesLength === 0) {
                this._selected = 0;
                this._selectedValue = this._valueOf(this._items[this._selected]);
                this._selectedIndexes = [this._selected];
                this._selectedItems = [this._items[this._selected]];
            } else if (!_autoSelectFirstRow && selectedIndexesLength === 1) {
                // This is not correct but done anyway so the Thingworx IDE reflects the change
                this._unselectAll();
            }
        }
    }
}
