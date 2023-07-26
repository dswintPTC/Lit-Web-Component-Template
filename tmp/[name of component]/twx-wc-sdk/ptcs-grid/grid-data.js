// Change callback interface
// selection = null || index || [index]
// {
//    dmView:         ()  // The data view has changed (items || sorting || filtering || tree view)
//    dmItem:         (index) // item(s) has changed. index can be number or array of numbers
//    dmInserted:     [[index, size], ...]
//    dmRemoved:      [[index, size], ...]
//    dmSelection:    (null || baseIndex || [baseIndex, ...]) // depends on selectMethod
//    dmSelected:     (baseIndex, selected)
//    dmSort:         (sort) // The sort function has changed
//    dmFilter:       (filter) // The filter function has been changed
//    dmSelectMethod: (method) // The selectMethod has changed
//    dmDepth:        (depth) // The depth that the tree grid has been expanded to
//
//   When updates are traced: traceUpdates(true)
//    dmUpdated:      (baseIndex, old)
//    dmCommit        // Changes have been commited
//    dmRollback      // Changes have been rolled back
// }

import {PTCS} from 'ptcs-library/library.js';

/* eslint-disable no-confusing-arrow, no-nested-ternary */

const initSeg = () => [[0, -1]];

// Folds / collapses sub-sequences in a (array of integers) and calls cb(first, num) - in revese order.
// Example:
//   [1, 2, 3, 5, 8, 9, 10, 14] => cb(14, 1); cb(8, 3); cb(5, 1); cb(1, 3)
//
// The integers in a must be unique and sorted
function foldIndexes(a, cb) {
    for (let i = a.length - 1; i >= 0; i--) {
        let n = 1;
        while (i > 0 && a[i - 1] + 1 === a[i]) {
            i--;
            n++;
        }
        cb(a[i], n);
    }
}

export class DataManager {

    constructor(items) {
        // Observers
        this._observers = new Set();

        // Manage state of data
        this._topItems = items instanceof Array ? items : []; // The data (top-level items)
        this._items = this._topItems; // All items, including sub-items
        this._seg = null; // Mounted tree view segments: [[baseIndex, parent.baseIndex], ...]
        this._view = null; // [index] = baseIndex (when view differs from this._items)

        // Projectors (sort || filter || tree)
        this._sort = null; // Sort function
        // WTF?
        this._defaultSort = null; // Default sort function
        this._filter = null; // Filter function
        this._subItems = null; // _subItems = (item, index) => [item, ...]
        this._subItemsState = null; // _subItemsState = (item, baseIndex) => true (open), false (closed), undefined (leaf), null (= need to check)
        this._depth = 0; // Currently reached expansion depth

        // Keeps track of tree (sub-node) content
        this._mapSubItems = null; // _mapSubItems.get(item) => {isOpen, level, start, end}

        // Selection
        // WTF?
        this._firstTimeSelectMethod = true;
        this._selectMethod = null; // 'none' || 'single' || 'multiple'
        this._selected = null; // null || Number || [Number]
        this._selectedSet = null; // Internal set of selected indexes. Created on-demand
        this._selectParentOnly = false;

        // Orginal versions of updated items: Map: item => [{$validation, field, ...}, ...]
        this._updatedItems = null; // Not enabled by default

        // Added or removed items
        this._changedLog = null; // [{baseIndex, [inserted || deleted]: [item, ...]}, ...]
        this._snapshot = null; // Saved snapshot, for rolling back data. Only used in Tree Grid (List Grid can rollback using only _changeLog)
    }

    get isTreeGrid() {
        return this._subItems !== null;
    }

    // observe changes
    observe(cbObj) {
        if (this._messing) {
            this._messing.push({on: cbObj});
        } else {
            this._observers.add(cbObj);
        }
    }

    // unobserve changes
    unobserve(cbObj) {
        if (this._messing) {
            this._messing.push({off: cbObj});
        } else {
            this._observers.delete(cbObj);
        }
    }

    // Notify observers
    _msg(msg, ...arg) {
        this._messing = []; // Avoid observe / unobserve during iteration
        this._observers.forEach(cbObj => {
            if (typeof cbObj[msg] === 'function') {
                cbObj[msg](...arg);
            }
        });
        this._messing.forEach(item => {
            if (item.on) {
                this._observers.add(item.on);
            } else if (item.off) {
                this._observers.delete(item.off);
            }
        });
        this._messing = null;
    }

    set items(_items) {
        this._items = this._topItems = _items instanceof Array ? _items : [];

        this._changeTreeProjection();
        this._selected = null;
        this._selectedSet = null;

        // Reset transaction (traced changes)
        if (this._updatedItems) {
            this._updatedItems = new Map();
        }
        if (this._changedLog) {
            this._changedLog = [];
        }
        this._snapshot = null;

        this._rebuildView();
        this._msg('dmView');
        this._msg('dmSelection', null);
    }

    // Size of data
    get length() {
        return this._view ? this._view.length : this._items.length;
    }

    // Size of base data
    get baseLength() {
        return this._items.length;
    }

    // Get data item
    item(index) {
        return this._items[this._view ? this._view[index] : index];
    }

    // Get item from base data
    baseItem(baseIndex) {
        return this._items[baseIndex];
    }

    // Translate index to base index
    baseIndex(index) {
        return this._view ? this._view[index] : index;
    }

    // Find tree depth of item / index
    treeLevel(index) {
        const bi = this.baseIndex(index);
        return bi >= 0 ? this.baseLevel(bi) : -1;
    }

    // treeLevel for baseIndex
    baseLevel(baseIndex) {
        if (baseIndex < this._topItems.length || !this._seg) {
            return 0;
        }
        // TODO: Use binary search
        for (let i = 1; i < this._seg.length; i++) {
            if (this._seg[i][0] > baseIndex) {
                return this._mapSubItems.get(this._items[this._seg[i - 1][1]]).level;
            }
        }
        return this._mapSubItems.get(this._items[this._seg[this._seg.length - 1][1]]).level;
    }

    // Get baseIndex of parent
    treeParent(baseIndex) {
        if (baseIndex < this._topItems.length || !this._seg) {
            return -1;
        }
        // TODO: Use binary search
        for (let i = 1; i < this._seg.length; i++) {
            if (this._seg[i][0] > baseIndex) {
                return this._seg[i - 1][1];
            }
        }
        return this._seg[this._seg.length - 1][1];
    }

    // Update validation properties of item
    _updateValidation(baseIndex, item, update, validation) {
        // Store original fields and validation of changes
        if (this._updatedItems) {
            let updatedItem = this._updatedItems.get(this._items[baseIndex]);
            if (!updatedItem) {
                updatedItem = {$validation: {}};
                this._updatedItems.set(this._items[baseIndex], updatedItem);
            }
            if (validation) {
                Object.assign(updatedItem.$validation, validation);
            }
            for (const field in update) {
                if (update[field] === updatedItem[field]) {
                    // Value has been restored
                    delete updatedItem[field];
                } else if (!updatedItem.hasOwnProperty(field)) {
                    // Value changed. Save original value
                    updatedItem[field] = item[field];
                }
                // Make sure any old outdated validation errors are removed
                if (validation && !validation.hasOwnProperty(field)) {
                    delete updatedItem.$validation[field];
                }
            }
        }
    }

    // Update data item
    updateItem(index, update, validation) {
        const baseIndex = this.baseIndex(index);
        if (!(0 <= baseIndex && baseIndex < this._items.length)) {
            throw new Error(`Invalid index: ${index}`);
        }
        const item = this.baseItem(baseIndex);

        this._updateValidation(baseIndex, item, update, validation);

        Object.assign(item, update);

        // TODO: this is very inneficient
        this._rebuildView();

        this._msg('dmItem', index);

        if (this._updatedItems) {
            this._msg('dmUpdated', baseIndex);
        }
    }

    // Insert data item
    insertItem(item, baseIndex, validation) {
        if (this._mapSubItems) {
            if (baseIndex >= 0) {
                return this.insertTreeItem(item, baseIndex, 'after', validation);
            }
            if (this._topItems.length > 0) {
                return this.insertTreeItem(item, this._topItems.length - 1, 'after', validation);
            }

            // item is the only item
            this._items = this._topItems = [item];
            baseIndex = 0;
        } else {
            console.assert(this._items === this._topItems);
            if (0 <= baseIndex && baseIndex < this._items.length) {
                // Insert at specific position
                this._items.splice(baseIndex, 0, item);
            } else if (baseIndex === undefined || baseIndex === this._items.length) {
                // Append
                baseIndex = this._items.length;
                this._items.push(item);
            } else {
                throw new Error(`Invalid baseIndex: ${baseIndex}`);
            }
        }

        // Save change in changedLog?
        if (this._changedLog) {
            this._changedLog.push({baseIndex, inserted: [item]});
        }

        if (validation) {
            this._updateValidation(baseIndex, item, item, validation);
        }

        // TODO: very very inefficient
        this._rebuildView();

        // Find index
        // TODO: slow
        const index = this.translateBaseIndexToIndex(baseIndex);

        // Inform about change
        if (index >= 0) {
            this._msg('dmInserted', [[index, 1]]);
        }

        return index;
    }

    // Debug tool that verifies the integrity of the Tree Grid structure
    /*
    __verify(label) {
        if (!this._seg || this._seg.length < 2) {
            return; // No tree data
        }

        if (label) {
            console.log(`%c${label}`, 'font-weight: bold; color: navy');
        }

        // Show the verified structure in the console
        for (let i = 1; i < this._seg.length; i++) {
            const [start, parent] = this._seg[i];
            console.log(JSON.stringify([{start, parent}, this._mapSubItems.get(this._items[parent])]));
        }

        // Verify structure
        console.assert(this._seg[1][0] === this._topItems.length);

        for (let i = 1; i < this._seg.length; i++) {
            const [start, parent] = this._seg[i];
            const map = this._mapSubItems.get(this._items[parent]);
            console.assert(map.isOpen !== undefined);
            console.assert(start === map.start);
            console.assert((i + 1 < this._seg.length ? this._seg[i + 1][0] : this._items.length) === map.end);
            console.assert(this.baseLevel(parent) + 1 === map.level);
        }

        // All maps are even empty or part of this._seg
        if (this._mapSubItems.size > this._seg.length - 1) {
            this._mapSubItems.forEach((item, parent) => {
                console.assert(item.isOpen === undefined || this._seg.some(seg => this._items[seg[1]] === parent));
            });
        }
    }
    */

    // where: 'before' (as previous sibling), 'after' (as following sibling), 'child' (as first child of leaf node)
    insertTreeItem(item, baseIndex, where, validation) {
        if (!this._mapSubItems) {
            throw new Error('Can only insertTreeItem in a tree grid');
        }

        // Make sure baseIndex is valid
        if (!(0 <= baseIndex && baseIndex < this._items.length)) {
            throw new Error(`insertTreeItem: invalid baseIndex: ${baseIndex}`);
        }

        // Save current state?
        if (this._changedLog && !this._snapshot) {
            this._snapshot = this._createSnapshot();
        }

        //this.__verify('BEFORE');

        if (where === 'child') {
            // Add item as a child to a leaf node
            const m = this._mapSubItems.get(this._items[baseIndex]);
            if ((m ? m.isOpen : this._subItemsState(this._items[baseIndex], baseIndex)) !== undefined) {
                console.error('Node is non-leaf');
                return -1;
            }
            const map = this._registerSubNodes(baseIndex, [item], true);

            // TODO: inefficient
            this._rebuildView();

            const index = this.translateBaseIndexToIndex(map.start);

            this._msg('dmInserted', [[index, 1]]);

            //this.__verify('AFTER ADD CHILD');
            return index;
        }

        // Add item as previous or follwoing sibling
        const parentId = this.parentBaseIndex(baseIndex);
        const mapParent = parentId >= 0 && this._mapSubItems.get(this._items[parentId]);

        let newIndex;
        switch (where) {
            case 'before':
                newIndex = baseIndex;
                if (mapParent && mapParent.first === baseIndex) {
                    mapParent.first--;
                }
                break;

            case 'after':
                newIndex = baseIndex + 1;
                break;

            default:
                console.error('Invalid: ' + JSON.stringify(where));
                return -1;
        }

        if (mapParent) {
            mapParent.end++;
        }

        // Add item to data array
        if (baseIndex < this._topItems.length) {
            this._topItems.splice(newIndex, 0, item);
        }
        this._items.splice(newIndex, 0, item);

        // Adjust tree data
        if (this._seg) {
            // Remove deleted segments
            const upd = where === 'before' ? (a, b) => a > b : (a, b) => a >= b;

            for (let i = 1; i < this._seg.length; i++) {
                //const [start, parent] = this._seg[i];
                const seg = this._seg[i];

                if (seg[1] === parentId) {
                    continue;
                }
                if (upd(seg[0], newIndex)) { // seg.start
                    seg[0]++;
                }
                if (seg[1] >= newIndex) { // seg.parent
                    seg[1]++;
                }
                const map = this._mapSubItems.get(this._items[seg[1]]);
                if (upd(map.start, newIndex)) {
                    map.start++;
                }
                if (upd(map.end, newIndex)) {
                    map.end++;
                }
            }
        }

        // Adjust selection
        const mapSel = bi => bi >= newIndex ? bi + 1 : bi;

        // Update selection
        if (typeof this._selected === 'number') {
            this.selected = mapSel(this._selected);
        } else if (Array.isArray(this._selected)) {
            const a = this._selected.map(mapSel);
            if (!PTCS.sameArray(a, this._selected)) {
                this.selected = a;
            }
        }

        // Save change in changedLog?
        if (this._changedLog) {
            this._changedLog.push({newIndex, inserted: [item]});
        }

        if (validation) {
            this._updateValidation(newIndex, item, item, validation);
        }

        // TODO: inefficient
        this._rebuildView();

        // TODO: slow
        const index = this.translateBaseIndexToIndex(newIndex);

        // Inform about change
        if (index >= 0) {
            this._msg('dmInserted', [[index, 1]]);
        }

        //this.__verify('AFTER');

        return index;
    }


    // Remove data item
    deleteItem(index) {
        const baseIndex = this.baseIndex(index);
        if (!(0 <= baseIndex && baseIndex < this._items.length)) {
            return;
        }
        this.deleteBaseItems([baseIndex]);
    }

    /*********************************************************************
     * DRAG-AND-DROP-GRID-ROWS
     *********************************************************************
    _computeTarget(index) {
        const afterLast = this._items.length;

        let baseIndexA, baseIndexB;

        if (index >= 0) {
            // Dropped on indexTo
            baseIndexA = index > 0 ? this.baseIndex(index - 1) : -1;
            baseIndexB = this.baseIndex(index);
        } else {
            // Dropped after last item
            baseIndexA = afterLast - 1;
            baseIndexB = afterLast;
        }

        const subA = this._mapSubItems && this._mapSubItems.get(this._items[baseIndexA]);
        if (subA && subA.isOpen === true && subA.start === baseIndexB) {
            return {baseIndex2: baseIndexB, firstChild: true, baseLevel2: subA.level};
        }

        const baseIndexP = this.treeParent(baseIndexA);
        const subP = this._mapSubItems && this._mapSubItems.get(this._items[baseIndexP]);
        if (subP && subP.isOpen === true && subP.end === baseIndexA + 1) {
            return {baseIndex2: baseIndexA + 1, lastChild: true, baseLevel2: subP.level};
        }

        return {baseIndex2: baseIndexB, baseLevel2: this.baseLevel(baseIndexA)};
    }

    // TODO: Update selections
    moveItem(indexFrom, indexTo) {
        if (this._sort) {
            alert('ERROR: Cannot rearrange grid items when data is sorted!');
            return;
        }

        // The moved item
        const baseIndex1 = this.baseIndex(indexFrom);
        if (!(0 <= baseIndex1 && baseIndex1 < this._items.length)) {
            return;
        }
        const baseLevel1 = this.baseLevel(baseIndex1);

        // Compute drop target
        // const {baseIndex2, baseLevel2, firstChild, lastChild} = this._computeTarget(indexTo);
        const {baseIndex2, baseLevel2, firstChild} = this._computeTarget(indexTo);

        if (!(0 <= baseIndex2 && baseIndex2 <= this._items.length)) {
            return;
        }

        // baseIndex2 after baseIndex1 has been removed
        const baseIndex2b = baseIndex1 < baseIndex2 ? baseIndex2 - 1 : baseIndex2;

        const min = Math.min(baseIndex1, baseIndex2);
        const max = Math.max(baseIndex1, baseIndex2);

        // Move the item in the items array
        const [item] = this._items.splice(baseIndex1, 1); // Remove from old place
        this._items.splice(baseIndex2b, 0, item); // Insert at new place

        // Is item top-level?
        if (this._topItems !== this._items) {
            if (baseIndex1 < this._topItems.length) {
                // Item is moved out of top-level items
                this._topItems.splice(baseIndex1, 1);
            }
            if (baseIndex2b < this._topItems.length) {
                // Item is moved back inside top-level items
                this._topItems.splice(baseIndex2b, 0, item);
            } else if (baseIndex2b === this._topItems.length && !firstChild) {
                this._topItems.push(item); // Moved to last top-level position
            }
        }

        // Remap old baseIndex to new baseIndex
        const map = bi => {
            if (bi <= min || bi >= max) {
                return bi; // Outside affected range
            }
            return baseIndex1 < baseIndex2 ? bi - 1 : bi + 1;
        };

        const map2 = bi => bi === baseIndex1 ? baseIndex2b : map(bi);

        this._seg.forEach(seg => {
            seg[0] = map(seg[0]); // First baseIndex of segment
            seg[1] = map2(seg[1]);
        });

        this._mapSubItems.forEach((m, v) => {
            m.start = map(m.start);
            m.end = map(m.end);
            if (m.start === m.end) {
                console.log('%cEMPTY!', 'color: red; font-weight: bold;');
            }
        });

        // Adjust level change, if any
        if (baseLevel1 !== baseLevel2) {
            const diff = baseLevel2 - baseLevel1;

            const fixLevel = bi => {
                const m = this._mapSubItems.get(this._items[bi]);
                if (m) {
                    m.level += diff;
                    for (let i = m.start; i < m.end; i++) {
                        fixLevel(i);
                    }
                }
            };

            fixLevel(baseIndex2b);
        }

        this._rebuildView();

        // Update selection
        const _selected = this._selected;
        if (typeof _selected === 'number') {
            this._selected = map2(_selected);
        } else if (Array.isArray(_selected)) {
            const sa = _selected.map(map2);
            if (!PTCS.sameArray(sa, _selected)) {
                this._selected = sa.sort((a, b) => a - b);
            }
        }

        // TODO: In what order should the client see these events?

        // Inform about changed view
        this._msg('dmView');

        // Inform about changed selection
        if (_selected !== this._selected) {
            this._msg('dmSelection', this._selected);
        }
    }
    **********************************************************************/

    _normalizeDeletedBaseIndexes(baseIndexes) {
        if (!this._seg) {
            // Not a Tree Grid
            return baseIndexes.filter(i => 0 <= i && i < this._items.length).sort((a, b) => a - b);
        }

        // Find children of all deleted items
        const set = new Set(baseIndexes);
        let size;
        do {
            size = set.size;
            for (let i = 1; i < this._seg.length; i++) {
                if (!set.has(this._seg[i][1])) {
                    continue; // This range should not be deleted
                }
                const end = i + 1 < this._seg.length ? this._seg[i + 1][0] : this._items.length;
                for (let x = this._seg[i][0]; x < end; x++) {
                    set.add(x);
                }
            }
        } while (size !== set.size);

        return [...set].filter(i => 0 <= i && i < this._items.length).sort((a, b) => a - b);
    }


    deleteBaseItems(_baseIndexes) {
        //this.__verify('BEFORE DELETE');

        // Save current state?
        if (this._changedLog && !this._snapshot && this._mapSubItems) {
            // Tree Model: save snapshot
            this._snapshot = this._createSnapshot();
        }

        // Expand, wash, sort
        const baseIndexes = this._normalizeDeletedBaseIndexes(_baseIndexes);

        // Restore all changed values in deleted items (in case of rollback)
        if (this._updatedItems && this._updatedItems.size > 0) {
            baseIndexes.forEach(baseIndex => {
                const item = this._items[baseIndex];
                const updated = this._updatedItems.get(item);
                if (updated) {
                    // Restore all changed values
                    for (const field in updated) {
                        if (field !== '$validation') {
                            item[field] = updated[field];
                        }
                    }
                    this._updatedItems.delete(item);
                }
            });
        }

        // Remove all removed items from _mapSubItems
        if (this._mapSubItems) {
            baseIndexes.forEach(baseIndex => this._mapSubItems.delete(this._items[baseIndex]));
        }

        // Delete the items
        foldIndexes(baseIndexes, (baseIndex, num) => {
            const deleted = this._items.splice(baseIndex, num);

            // Deleted top-level items?
            if (this._topItems !== this._items && baseIndex < this._topItems.length) {
                this._topItems.splice(baseIndex, num);
            }

            // Keep track of deleted items?
            if (this._changedLog) {
                this._changedLog.push({baseIndex, deleted});
            }
        });

        this._adjustAfterItemsDeleted(baseIndexes);

        //this.__verify('AFTER DELETE');
    }

    _createSelectedSet() {
        if (!this._selectedSet) {
            this._selectedSet = new Set(this.selected ? this.selected.map(ix => this._items[ix]) : []);
        }
    }

    // Quick test if an item is selected
    isSelected(index) {
        if (!this._selectedSet) {
            if (this._selected === null) {
                return false;
            }
            // Single selection?
            if (typeof this._selected === 'number') {
                if (this._view) {
                    return this._view[index] === this._selected;
                }
                return index === this._selected;
            }
            // Multi selection
            this._createSelectedSet();
        }
        return this._selectedSet.has(this.item(index));
    }

    // Test if an item is selected, as alternative to data.isSelected(data.translateBaseIndexToIndex(baseIndex))
    isSelectedBaseIndex(baseIndex) {
        if (!this._selectedSet) {
            if (this._selected === null) {
                return false;
            }
            if (typeof this._selected === 'number') {
                return this._selected === baseIndex;
            }
            this._createSelectedSet();
        }
        return this._selectedSet.has(this._items[baseIndex]);
    }

    // Translate baseIndex to view index. Slow if there is an active projection.
    translateBaseIndexToIndex(baseIndex) {
        if (!(0 <= baseIndex && baseIndex < this._items.length)) {
            return -1;
        }
        if (this._view) {
            return this._view.indexOf(baseIndex);
        }
        return baseIndex;
    }

    _indexOf(item) {
        return this._view ? this._view.findIndex(bi => this._items[bi] === item) : this._items.indexOf(item);
    }

    // WTF is defaultSort?
    get defaultSort() {
        return this._defaultSort;
    }

    set defaultSort(defaultSort) {
        this._defaultSort = defaultSort;

        this.applyDefaultSort();
    }

    applyDefaultSort() {
        this.sort = this._defaultSort;
    }

    get sort() {
        return this._sortOrg;
    }

    // Set sort function
    set sort(_sort) {
        if (this._sortOrg === _sort) {
            return; // No change
        }

        // Is the sort function a function?
        if (_sort && typeof _sort !== 'function') {
            throw Error('Invalid sort function');
        }

        // Sort by index if items have the same sort order
        const f = (i1, i2) => _sort(this._items[i1], this._items[i2], i1, i2, this) || i1 - i2;

        this._sortOrg = _sort;
        this._sort = _sort && f;

        if (!this._items.length) {
            // Nothing to sort
            this._msg('dmSort', this._sortOrg);
            this._view = null;
            return;
        }

        this._rebuildView();

        this._msg('dmSort', this._sortOrg);
        this._msg('dmView');
    }

    // Set filtering
    set filter(_filter) {
        // Only support function for now
        if (_filter && typeof _filter !== 'function') {
            throw Error('Invalid filter function');
        }

        if (_filter === this._filter) {
            return;
        }

        this._filter = _filter;

        this._rebuildView();

        this._msg('dmFilter', this._filter);
        this._msg('dmView');
    }

    // Get filter function
    get filter() {
        return this._filter;
    }

    // Tree Data
    set subItems(_subItems) {
        this._subItems = typeof _subItems === 'function' ? _subItems : null;
        this._changeTreeProjection();
        this._msg('dmView');
    }

    get maxExpandedRows() {
        return this._maxExpandedRows;
    }

    set maxExpandedRows(val) {
        this._maxExpandedRows = val;
    }

    // _subItemsState returns sub-item state of item:
    // - true: has visible sub-items (or - check now)
    // - false: has hidden sub-items
    // - undefined: is leaf item (no sub-items)
    // - null: unknown - need to check
    set subItemsState(_subItemsState) {
        this._subItemsState = typeof _subItemsState === 'function' ? _subItemsState : null;
        this._changeTreeProjection();
        this._msg('dmView');
    }

    get depth() {
        return this._depth;
    }

    _setDepth(_depth) {
        this._depth = _depth;
        if (!this.__updateDepth) {
            this.__updateDepth = true;
            requestAnimationFrame(() => {
                this.__updateDepth = undefined;
                this._msg('dmDepth', this._depth);
            });
        }
    }

    _changeTreeProjection() {
        if (this._subItems && this._subItemsState) {
            this._items = this._topItems.slice();
            this._mapSubItems = new Map();
            this._seg = initSeg();
        } else {
            this._items = this._topItems;
            this._mapSubItems = null;
            this._seg = null;
            this._view = null;
        }

        if (this._depth) {
            this._setDepth(0);
        }

        this._rebuildView();
    }

    _registerSubNodes(baseIndex, sub, isOpen, level = 1 + this.baseLevel(baseIndex), ixs = null) {
        const item = this._items[baseIndex];
        console.assert(item);
        let map = this._mapSubItems.get(item);
        console.assert(!map || (map.isOpen === 'loading' && map.level === level));

        if (Array.isArray(sub) && sub.length > 0) {
            this._items.push(...sub);
            map = {isOpen, start: this._items.length - sub.length, end: this._items.length, level};
            this._mapSubItems.set(item, map);
            this._seg.push([map.start, baseIndex]);

            if (this.selectMethod === 'multiple' && this.isSelectedBaseIndex(baseIndex) && !this.selectParentOnly) {
                this._selectSubRange(map.start, map.end, ixs);
            }
        } else {
            map = {isOpen: undefined, level};
            this._mapSubItems.set(item, map);
        }

        if (this._depth < level) {
            this._setDepth(level);
        }

        return map;
    }

    // Return current toggle state for baseIndex ( true [open] | false [closed] | undefined [leaf] | null [unknown] | 'loading' | -1 [error] )
    toggleState(baseIndex) {
        const item = this._items[baseIndex];
        if (!item) {
            return -1;
        }
        const map = this._mapSubItems.get(item);
        return map ? map.isOpen : this._subItemsState(item, baseIndex);
    }

    // Return [first child, last child] | undefined (leaf) | null (unknown) | 'loading' | -1 (error)
    childRange(baseIndex) {
        const item = this._items[baseIndex];
        if (!item) {
            return -1;
        }
        const map = this._mapSubItems.get(item);
        return map ? [map.start, map.end - 1] : this._subItemsState(item, baseIndex);
    }

    parentBaseIndex(baseIndex) {
        if (baseIndex < this._topItems.length || !this._seg) {
            return -1;
        }
        // TODO: Use binary search
        for (let i = 1; i < this._seg.length; i++) {
            if (this._seg[i][0] > baseIndex) {
                return this._seg[i - 1][1];
            }
        }
        return this._seg[this._seg.length - 1][1];
    }


    // state:
    // - true:      open sub tree
    // - false:     close sub tree
    // - -1:        toggle sub tree
    // - undefined: return current state (true | false | undefined | null | 'loading')
    subTree(index, state) {
        if (this._items === this._topItems || index < 0 || index > this._view.length) {
            return undefined; // Not in tree mode or invalid index
        }

        const baseIndex = this._view[index];
        const item = this._items[baseIndex];
        let map = this._mapSubItems.get(item);
        if (map && map.isOpen === undefined) {
            return undefined; // Explicit Leaf Node
        }
        const oldState = map ? map.isOpen : this._subItemsState(item, baseIndex);

        if (oldState === 'loading' || oldState === undefined) {
            // Nothing to do if the node is still loading or it doesn't have any children
            return oldState;
        }

        switch (state) {
            case undefined:
                return oldState; // Return old state
            case true:
                if (oldState) {
                    return oldState; // Is already open
                }
                break;
            case false:
                if (!oldState) {
                    return oldState; // Is already closed
                }
                break;
            case -1:
                if (map && map.isOpen === undefined) {
                    return oldState; // Blocked. No sub-nodes
                }
                break;
            default:
                console.error(`Invalid call to subTree: ${JSON.stringify(state)}`);
                return oldState;
        }

        if (oldState) {
            // Number of descendants that needs to be removed
            const num = this._numOpenDescendants(map);

            // Close node
            map.isOpen = false;
            this._msg('dmItem', index);

            // Adjust view and report change
            if (num) {
                this._view.splice(index + 1, num);
                this._msg('dmRemoved', [[index + 1, num]]);
            }

            return false;
        }

        // Open node
        if (!map) {
            const sub = this._subItems(item, baseIndex);
            if (!sub) {
                return undefined;
            }
            if (sub instanceof Promise) {
                map = {isOpen: 'loading', level: 1 + this.treeLevel(index)};
                this._mapSubItems.set(item, map);
                sub.then(_sub => {
                    if (Array.isArray(_sub) && _sub.length > 0) {
                        map = this._registerSubNodes(baseIndex, _sub, true);

                        if (this._view[index] === baseIndex) {
                            if (this._maxExpandedRows && Number(this._maxExpandedRows) < this._view.length + _sub.length) {
                                map.isOpen = false;
                                this._msg('dmItem', index);
                                this._msg('openMaxExpandedRowsDialog');
                                return;
                            }

                            const added = this._add(map.start, map.end);
                            this._view.splice(index + 1, 0, ...added);
                            this._msg('dmInserted', [[index + 1, added.length]]);
                        } else {
                            this._rebuildView();
                            this._msg('dmView');
                        }
                    } else {
                        map.isOpen = undefined;
                        this._msg('dmItem', index);
                    }
                });
                this._msg('dmItem', index);
                return 'loading';
            }

            if (Array.isArray(sub) && sub.length > 0) {
                map = this._registerSubNodes(baseIndex, sub, false);
            } else {
                throw new Error('Unknown ');
            }
        }

        const added = this._add(map.start, map.end);

        if (this._maxExpandedRows && Number(this._maxExpandedRows) < this._view.length + added.length) {
            this._msg('openMaxExpandedRowsDialog');
            return null;
        }

        map.isOpen = true;
        this._msg('dmItem', index);

        this._view.splice(index + 1, 0, ...added);
        this._msg('dmInserted', [[index + 1, added.length]]);
        return true;
    }

    _rebuildView() {
        if (this._subItems && this._subItemsState) {
            this._rebuildTreeView();
        } else {
            this._rebuildListView();
        }
    }

    _add(start_, end_) {
        const view = [];

        let add;

        if (this._filter) {
            const subInFilter = (baseIndex, level) => {
                const nextLevel = level + 1;
                const item = this._items[baseIndex];
                let map = this._mapSubItems.get(item);
                if (!map) {
                    switch (this._subItemsState(item, baseIndex)) {
                        // Is items available
                        case true:
                        case false:
                            break;
                        case 'loading':
                            return true; // loading sub-items match, so better safe than sorry
                        case null:
                        default:
                            return false; // Either there are No subitems, or we do not know of sub-items
                    }
                    const sub = this._subItems(item, baseIndex);
                    if (!sub || sub.length === 0) {
                        this._mapSubItems.set(item, {});
                        return false; // Empty
                    }
                    if (Array.isArray(sub)) {
                        map = this._registerSubNodes(baseIndex, sub, false, nextLevel);
                    } else {
                        throw new Error('Unknown ');
                    }
                }
                for (let i = map.start; i < map.end; i++) {
                    if (this._filter(this._items[i], i) || subInFilter(i, nextLevel)) {
                        return true;
                    }
                }
                return false;
            };

            add = (start, end, level) => {
                if (level === undefined) {
                    level = this.baseLevel(start);
                }
                const a = [];
                for (let i = start; i < end; i++) {
                    if (this._filter(this._items[i], i) || subInFilter(i, level)) {
                        a.push(i);
                    }
                }
                if (a.length <= 0) {
                    return;
                }
                if (this._sort) {
                    a.sort(this._sort);
                }
                a.forEach(i => {
                    view.push(i);
                    const map = this._mapSubItems.get(this._items[i]);
                    if (map && map.isOpen) {
                        add(map.start, map.end, level + 1);
                    }
                });
            };

        } else if (this._sort) {

            add = (start, end) => {
                if (!(start < end)) {
                    return;
                }
                const a = [];
                for (let i = start; i < end; i++) {
                    a.push(i);
                }
                a.sort(this._sort);
                a.forEach(i => {
                    view.push(i);
                    const map = this._mapSubItems.get(this._items[i]);
                    if (map && map.isOpen) {
                        add(map.start, map.end);
                    }
                });
            };

        } else {

            add = (start, end) => {
                for (let i = start; i < end; i++) {
                    view.push(i);
                    const map = this._mapSubItems.get(this._items[i]);
                    if (map && map.isOpen) {
                        add(map.start, map.end);
                    }
                }
            };
        }

        add(start_, end_);

        return view;
    }


    _rebuildTreeView() {
        this._view = this._add(0, this._topItems.length);
    }

    _rebuildListView() {
        const view = [];

        if (this._filter) {
            const add = (start, end) => {
                for (let i = start; i < end; i++) {
                    if (this._filter(this._items[i], i)) {
                        view.push(i);
                    }
                }
                if (this._sort) {
                    view.sort(this._sort);
                }
            };

            add(0, this._topItems.length);

        } else if (this._sort) {

            const add = (start, end) => {
                for (let i = start; i < end; i++) {
                    view.push(i);
                }
                view.sort(this._sort);
            };

            add(0, this._topItems.length);

        } else {

            this._view = null;
            return;
        }

        this._view = view;
    }

    _numOpenDescendants(map_) {
        let count;

        if (this._filter) {
            const subInFilter = baseIndex => {
                const item = this._items[baseIndex];
                let map = this._mapSubItems.get(item);
                if (!map) {
                    switch (this._subItemsState(item, baseIndex)) {
                        // Is items available
                        case true:
                        case false:
                            break;
                        case null:
                        case 'loading':
                            // For now: when filtering and children are unknown, don't include item
                            // return true; // Don't know if sub-items match, so better safe than sorry
                        // eslint-disable-next-line no-fallthrough
                        default:
                            return false; // No subitems
                    }
                    const sub = this._subItems(item, baseIndex);
                    if (!sub || sub.length === 0) {
                        this._mapSubItems.set(item, {});
                        return false; // Empty
                    }
                    if (Array.isArray(sub)) {
                        map = this._registerSubNodes(baseIndex, sub, false);
                    } else {
                        throw new Error('Unknown ');
                    }
                }
                for (let i = map.start; i < map.end; i++) {
                    if (this._filter(this._items[i], i) || subInFilter(i)) {
                        return true;
                    }
                }
                return false;
            };

            count = map => {
                if (!map || !map.isOpen) {
                    return 0;
                }
                let num = 0;
                for (let i = map.start; i < map.end; i++) {
                    const add = count(this._mapSubItems.get(this._items[i]));
                    if (add || this._filter(this._items[i], i) || subInFilter(i)) {
                        num++;
                    }
                    num += add;
                }
                return num;
            };

        } else {
            count = map => {
                if (!map || !map.isOpen) {
                    return 0;
                }
                let num = map.end - map.start;
                for (let i = map.start; i < map.end; i++) {
                    num += count(this._mapSubItems.get(this._items[i]));
                }
                return num;
            };
        }

        return count(map_);
    }

    numOpenDescendants(index) {
        if (this._items === this._topItems || index < 0 || index > this._view.length) {
            return 0; // Not in tree mode or invalid index
        }
        const baseIndex = this._view[index];
        const item = this._items[baseIndex];
        const map = this._mapSubItems.get(item);
        return (map && map.isOpen) ? this._numOpenDescendants(map) : 0;
    }

    _enumerateLoadedDescendants(baseIndex, cb) {
        let process;

        if (this._filter) {
            const subInFilter = _baseIndex => {
                const item = this._items[_baseIndex];
                let map = this._mapSubItems.get(item);

                if (!map) {
                    return false;
                }

                for (let i = map.start; i < map.end; i++) {
                    if (this._filter(this._items[i], i) || subInFilter(i)) {
                        return true;
                    }
                }

                return false;
            };

            process = map => {
                if (map) {
                    let i, start;
                    const ixs = [];
                    for (i = map.start; i < map.end; i++) {
                        if (this._filter(this._items[i], i) || subInFilter(i)) {
                            if (start === undefined) {
                                start = i;
                            }

                            ixs.push(i);
                        } else if (start !== undefined) {
                            cb(start, i);
                            start = undefined;
                        }
                    }

                    if (start !== undefined) {
                        cb(start, map.end);
                    }

                    for (i of ixs) {
                        process(this._mapSubItems.get(this._items[i]));
                    }
                }
            };
        } else {
            process = map => {
                if (map) {
                    cb(map.start, map.end);
                    for (let i = map.start; i < map.end; i++) {
                        process(this._mapSubItems.get(this._items[i]));
                    }
                }
            };
        }

        process(this._mapSubItems && this._mapSubItems.get(this._items[baseIndex]));
    }

    getExpandedItems(cb) {
        if (this._mapSubItems) {
            for (const [item, value] of this._mapSubItems) {
                cb(item, value.isOpen);
            }
        }
    }

    // Collapse (close) all sub-nodes: only show top-level nodes
    collapseAll() {
        if (this._view) {
            this._view.forEach(baseIndex => {
                const map = this._mapSubItems.get(this._items[baseIndex]);
                if (map && map.isOpen) {
                    map.isOpen = false;
                }
            });

            this._rebuildView();
            this._msg('dmView');
        }
    }

    // Show all nodes, on every level
    expandAll() {
        const ixs = [];
        const expand = map_ => {
            for (let baseIndex = map_.start; baseIndex < map_.end; baseIndex++) {
                const item = this._items[baseIndex];
                let map = this._mapSubItems.get(item);
                if (map) {
                    if (map.isOpen === undefined) {
                        continue; // Explict Leaf node
                    }
                    map.isOpen = true;
                } else if (this._subItemsState(item, baseIndex) !== undefined && this._subItemsState(item, baseIndex) !== null) {
                    const sub = this._subItems(item, baseIndex);
                    if (sub) {
                        map = this._registerSubNodes(baseIndex, sub, true, 1 + map_.level, ixs);
                    }
                }
                if (map) {
                    expand(map);
                }
            }
        };

        if (this._view) {
            this._view.forEach((baseIndex, index) => {
                const item = this._items[baseIndex];
                let map = this._mapSubItems.get(item);
                if (map) {
                    if (map.isOpen === undefined) {
                        return; // Explict Leaf node
                    }
                    map.isOpen = true;
                } else if (this._subItemsState(item, baseIndex) !== undefined && this._subItemsState(item, baseIndex) !== null) {
                    const sub = this._subItems(item, baseIndex);
                    if (sub) {
                        map = this._registerSubNodes(baseIndex, sub, true, 1 + this.baseLevel(baseIndex), ixs);
                    }
                }
                if (map) {
                    expand(map);
                }
            });
        }

        this._rebuildView();
        this._addSelectedBaseIndexes(ixs);
        this._msg('dmView');
    }

    // 'collapsed', 'partial', 'expanded'
    get expandState() {
        if (!this._mapSubItems) {
            return undefined; // Not tree data
        }

        let collapsed, expanded;

        for (let i = 0; i < this._view.length; i++) {
            const baseIndex = this._view[i];
            const item = this._items[baseIndex];
            switch (this._subItemsState(item, baseIndex)) {
                case null:
                    return undefined; // This concept is not supported when children are dynamically loaded
                case undefined:
                    break;
                default: {
                    const map = this._mapSubItems.get(item);
                    if (map && map.isOpen) {
                        if (collapsed) {
                            return 'partial';
                        }
                        expanded = true;
                    } else if (!map || map.isOpen !== undefined) { // Ignore explicit leafs
                        if (expanded) {
                            return 'partial';
                        }
                        collapsed = true;
                    }
                }
            }
        }

        if (expanded) {
            return 'expanded'; // All nodes are expanded
        }
        return collapsed ? 'collapsed' : undefined;
    }

    /*
    _updateProjection(force = false) {
        console.error('SHOULD BE UNREACHABLE');
        if (!this._items.length) {
            // Nothing to project
            this._projection = null;
            return;
        }

        if (this._filter) {
            const a = [];
            this._items.forEach((item, index, _) => {
                if (this._filter(item, index, _)) {
                    a.push(index);
                }
            });
            this._projection = new Uint32Array(a);
            if (this._sort) {
                this._projection.sort(this._sort);
            }
        } else if (this._sort) {
            // Is the current projection reduced by a previous filter?
            if (!this._projection || this._projection.length !== this._items.length || force) {
                this._createProjection(true).sort(this._sort);
            }
        } else {
            // No projection: use raw items
            this._projection = null;
        }

        // Items has been filtered and sorted. Now re-group them
        this._groupItems();
    }
    */

    // Reset both filtering and sorting
    // Avoid doing it in separate steps, because it forces multiple projection remaps
    resetView() {
        this._filter = null;
        this._sort = this._sortOrg = null;
        this._rebuildView();
        this._msg('dmFilter', this._filter);
        this._msg('dmSort', this._sortOrg);
        this._msg('dmView');
    }

    // Notify about unselected items
    _notifyUnselect(old) {
        if (typeof old === 'number') {
            this._msg('dmSelected', old, false);
        } else if (old instanceof Array) {
            old.forEach(ix => this._msg('dmSelected', ix, false));
        }
    }

    // Notify about unselected items - assume complex case
    _selectedChanges(selected, old) {
        const toArray = x => {
            if (x instanceof Array) {
                return x;
            }
            return typeof x === 'number' ? [x] : [];
        };
        const a = toArray(selected);
        const b = toArray(old);
        let i = 0;
        let j = 0;
        while (i < a.length && j < b.length) {
            const x = a[i];
            const y = b[j];
            if (x < y) {
                this._msg('dmSelected', x, true);
                i++;
            } else if (x > y) {
                this._msg('dmSelected', y, false);
                j++;
            } else {
                i++;
                j++;
            }
        }
        while (j < b.length) {
            this._msg('dmSelected', b[j++], false);
        }
        while (i < a.length) {
            this._msg('dmSelected', a[i++], true);
        }
    }

    // selectMethod: 'none' || 'single' || 'multiple'
    get selectMethod() {
        return this._selectMethod || 'none';
    }

    set selectMethod(method) {
        let __updateDefaultSelection = false;

        // Normalize method
        switch (method) {
            case undefined:
            case '':
            case 'none':
                method = null;
                break;
            case 'multi':
                method = 'multiple';
                break;
            case null: // Correct value for 'none'
            case 'single':
            case 'multiple':
                break;
            default:
                throw Error('Invalid selectMethod: ' + method);
        }

        if (this._firstTimeSelectMethod && method !== null) {
            this._firstTimeSelectMethod = false;
            __updateDefaultSelection = true;
        }

        // Apply new method
        if (method === this._selectMethod) {
            return this.selectMethod; // No change
        }
        this._selectMethod = method;
        this._msg('dmSelectMethod', this.selectMethod);

        if (__updateDefaultSelection) {
            this.applyDefaultSelected();
            return this.selectMethod;
        }

        // Convert current selection, if any
        switch (method) {
            case null: // 'none'
                if (this._selected) {
                    const old = this._selected;
                    this._selected = null;
                    this._selectedSet = null;
                    this._notifyUnselect(old);
                    this._msg('dmSelection', this._selected);
                }
                break;
            case 'single':
                if (this._selected instanceof Array) {
                    if (this._selected.length === 1) {
                        this._selected = this._selected[0];
                    } else {
                        // Strip all selections except the first
                        const old = this._selected.slice(1);
                        this._selected = this._selected[0];
                        this._selectedSet = null;
                        this._notifyUnselect(old);
                        this._msg('dmSelection', this._selected);
                    }
                }
                break;
            case 'multiple':
                if (typeof this._selected === 'number') {
                    // Convert type
                    this._selected = [this._selected];
                }
                break;
        }
        return this.selectMethod;
    }

    // WTF is defaultSelected?
    // Get default selection
    get defaultSelected() {
        return this._defaultSelected;
    }

    set defaultSelected(_selected) {
        if (_selected === this._defaultSelected) {
            return;
        }
        this._defaultSelected = _selected;
        this.applyDefaultSelected();
    }

    applyDefaultSelected() {
        this.selected = this._defaultSelected;
    }

    get selectParentOnly() {
        return this._selectParentOnly;
    }

    set selectParentOnly(val) {
        if (val === this._selectParentOnly) {
            return;
        }
        this._selectParentOnly = val;
    }

    // Get current selection
    get selected() {
        return this._selected;
    }

    set selected(_selected) {
        this.setSelected(_selected);
    }

    setSelected(_selected, directSelection) {
        const old = this._selected;
        if (_selected === old || (_selected === undefined && old === null)) {
            return;
        }
        const length = this._items.length;
        if (typeof _selected === 'number') {
            if (_selected < 0 || _selected >= length) {
                if (this._selected === null) {
                    return; // No change
                }
                this._selected = null;
            } else if (this.selectMethod === 'single') {
                this._selected = _selected;
            } else if (this.selectMethod === 'multiple') {
                if (this._selected instanceof Array && this._selected.length === 1 && this._selected[0] === _selected) {
                    return; // No change
                }
                this._selected = [_selected];
            } else {
                return; // DataMgr doesn't handle selections
            }
        } else if (_selected instanceof Array) {
            // Sort array and remove invalid values
            const s = _selected.filter(index => (0 <= index && index < length)).sort((a, b) => a - b);
            let selected;
            if (s.length === 0) {
                if (this._selected === null) {
                    return; // No change
                }
                selected = null;
            } else {
                // Discard duplicates
                selected = [];
                let prev;
                s.forEach(index => {
                    if (prev !== index) {
                        selected.push(index);
                        prev = index;
                    }
                });
                if (this._selectMethod === 'single') {
                    if (this._selected === selected[0]) {
                        return; // No change
                    }
                    selected = selected[0];
                } else if (this._selectMethod !== 'multiple') {
                    return; // DataMgr doesn't handle selections
                }
            }
            // Is it the same selection?
            if (Array.isArray(selected) && Array.isArray(this._selected)) {
                // Same selection?
                if (this._selected.length === selected.length && this._selected.every((d, i) => selected[i] === d)) {
                    return; // Same values
                }
            }
            this._selected = selected;
        } else if (this._selected || typeof this._selected === 'number') {
            this._selected = null;
        }
        this._directSelection = directSelection;
        this._selectedSet = null;
        this._selectedChanges(this._selected, old);
        this._msg('dmSelection', this._selected);
    }

    // ixs must be unique list of newly selected baseIndexes (no repetion and no indexes may already be part of this._selected)
    _addSelectedBaseIndexes(ixs) {
        if (ixs.length) {
            this._selected = [...(this._selected || []), ...ixs].sort((a, b) => a - b);
            ixs.forEach(bi => this._msg('dmSelected', bi, true));
            this._msg('dmSelection', this._selected);
        }
    }

    _selectSubRange(start, end, ixs) {
        console.assert(this.selectMethod === 'multiple');
        const _ixs = ixs || [];
        for (let i = start; i < end; i++) {
            const item = this._items[i];
            if (!this._selectedSet.has(item)) {
                this._selectedSet.add(item);
                _ixs.push(i);
            }
        }

        if (!ixs) {
            this._addSelectedBaseIndexes(_ixs);
        }
    }

    _multiSelect(baseIndex, ix, directSelection) {
        console.assert(this.selectMethod === 'multiple');
        console.assert(ix < 0 || this._selected[ix] > baseIndex);

        this._createSelectedSet();
        this._selectedSet.add(this._items[baseIndex]);

        const ixs = [baseIndex];
        if (!this.selectParentOnly) {
            this._enumerateLoadedDescendants(baseIndex, (start, end) => this._selectSubRange(start, end, ixs));
        }

        if (ixs.length > 1) {
            this.setSelected([...(this._selected || []), ...ixs].sort((a, b) => a - b), directSelection);
        } else if (ix >= 0) {
            // does not trigger the set selected() function, manually set _directSelection
            this._directSelection = directSelection;
            this._selected.splice(ix, 0, baseIndex);
        } else if (this._selected) {
            // does not trigger the set selected() function, manually set _directSelection
            this._directSelection = directSelection;
            console.assert(this._selected[this._selected.length - 1] < baseIndex);
            this._selected.push(baseIndex);
        } else {
            this.setSelected([baseIndex], directSelection);
        }

        ixs.forEach(bi => this._msg('dmSelected', bi, true));
    }

    _multiUnselect(baseIndex, ix, directSelection) {
        console.assert(this.selectMethod === 'multiple');
        console.assert(Array.isArray(this._selected) && this._selected[ix] === baseIndex);

        this._createSelectedSet();
        this._selectedSet.delete(this._items[baseIndex]);

        const ixs = [baseIndex];
        this._enumerateLoadedDescendants(baseIndex, (from, to) => {
            for (let i = from; i < to; i++) {
                const item = this._items[i];
                if (this._selectedSet.has(item)) {
                    this._selectedSet.delete(item);
                    ixs.push(i);
                }
            }
        });

        if (ixs.length > 1) {
            const a = this._selected.filter(bi => this._selectedSet.has(this._items[bi]));
            let selectedValue = a.length > 0 ? a : null;
            this.setSelected(selectedValue, directSelection);
        } else if (this._selected.length === 1) {
            this.setSelected(null, directSelection);
        } else {
            // does not trigger the set selected() function, manually set _directSelection
            this._directSelection = directSelection;
            this._selected.splice(ix, 1);
        }

        ixs.forEach(bi => this._msg('dmSelected', bi, false));
    }

    // Were rows directly selected
    get directSelection() {
        return this._directSelection;
    }

    // Individually select / unselect items
    // selected === true -> select
    // selected === false -> unselect
    // else -> toggle selection
    select(baseIndex, select, directSelection) {
        if (this.selectMethod === 'single') {
            const old = this._selected;
            if (select === true) {
                if (old === baseIndex) {
                    return; // No change
                }
                this.setSelected(baseIndex, directSelection);
            } else if (select === false) {
                if (old !== baseIndex) {
                    return; // No change
                }
                this.setSelected(null, directSelection);
            } else { // toggle
                let selectedValue = this._selected !== baseIndex ? baseIndex : null;
                this.setSelected(selectedValue, directSelection);
            }
            this._notifyUnselect(old);
            if (this._selected !== null) {
                this._msg('dmSelected', this._selected, true);
            }
        } else if (this.selectMethod === 'multiple') {
            const ix = Array.isArray(this._selected) ? this._selected.findIndex(x => x >= baseIndex) : -1;
            const wasSelected = ix >= 0 && this._selected[ix] === baseIndex;
            const selected = select === undefined ? !wasSelected : !!select;

            if (selected === wasSelected) {
                // No change
                return;
            }
            if (selected) {
                this._multiSelect(baseIndex, ix, directSelection);
            } else {
                this._multiUnselect(baseIndex, ix, directSelection);
            }
        } else {
            return; // Selection support not enabled
        }
        this._msg('dmSelection', this._selected);
    }

    selectAllItems(directSelection) {
        if (this._view) {
            const ixs = [];
            for (let baseIndex of this._view) {
                ixs.push(baseIndex);
                this._enumerateLoadedDescendants(baseIndex, (from, to) => {
                    for (let i = from; i < to; i++) {
                        ixs.push(i);
                    }
                });
            }

            this.setSelected(ixs, directSelection);
        } else {
            this.setSelected([...Array(this._items.length).keys()], directSelection);
        }
    }

    unselectAllItems(directSelection) {
        this.setSelected(null, directSelection);
    }

    //
    // Adjust for changes to items array
    //
    _adjustAfterItemsDeleted(baseIndexes) {

        // Map old (selection) index to new index
        const map = ix => {
            const cmp = i => baseIndexes[i] - ix;
            const r = PTCS.binSearch(baseIndexes, cmp);
            if (r >= 0) {
                return -1; // index has been removed
            }
            const p = -r - 1; // Where did we find the item?
            return baseIndexes[p] < ix ? ix - p - 1 : ix - p; // Adjust index
        };

        // Adjust tree data
        if (this._seg) {
            const remove = [];
            for (let i = 1; i < this._seg.length; i++) {
                const seg = this._seg[i];
                const parent = map(seg[1]);
                if (parent === -1) {
                    // Parent / segment has been removed
                    remove.push(i);
                } else {
                    let start = map(seg[0]);
                    if (start === -1) {
                        // First child has been removed. Search for an unremoved child
                        const end = i + 1 < this._seg.length ? this._seg[i + 1][0] : this._items.length + baseIndexes.length;
                        // eslint-disable-next-line curly
                        for (let ix = seg[0] + 1; ix < end && start === -1; start = map(ix++));
                    }
                    if (start === -1) {
                        // All children has been removed
                        remove.push(i);
                        const m = this._mapSubItems.get(this._items[parent]);
                        m.isOpen = m.start = m.end = undefined;
                    } else {
                        seg[0] = start;
                        seg[1] = parent;
                    }
                }
            }

            // Remove deleted segments
            foldIndexes(remove, (index, num) => this._seg.splice(index, num));

            for (let i = 1; i < this._seg.length; i++) {
                const [start, parent] = this._seg[i];
                const x = this._mapSubItems.get(this._items[parent]);
                console.assert(x);
                x.start = start;
                x.end = i + 1 < this._seg.length ? this._seg[i + 1][0] : this._items.length;
            }
        }

        // Collect indexes that will be removed
        let unprojected; // Removed indexes from projection view

        if (this._view) {
            // Compute changed indexes and collect removed indexes
            unprojected = [];

            this._view.forEach((bi, i) => {
                const bi2 = map(bi);
                if (bi2 !== bi) {
                    if (bi2 === -1) {
                        unprojected.push(i); // Register for removal
                    } else {
                        this._view[i] = bi2; // Adjust
                    }
                }
            });

            // Truncate removed entries from projection
            foldIndexes(unprojected, (index, num) => this._view.splice(index, num));
        }

        // Adjust selection
        if (this._selected instanceof Array) {
            const _selected = this._selected.reduce((a, i) => {
                const i2 = map(i);
                if (i2 >= 0) {
                    a.push(i2);
                }
                return a;
            }, []);
            this._selected = _selected.length > 0 ? _selected : null;
        } else if (this._selected >= 0 && this._selected !== null) {
            const _selected = map(this._selected);
            this._selected = _selected >= 0 ? _selected : null;
        }

        // Inform about removed
        const indexes = unprojected || baseIndexes;
        const removed = [];
        foldIndexes(indexes, (index, num) => removed.push([index, num]));

        this._msg('dmSelection', this._selected);
        this._msg('dmRemoved', removed);
        return removed;
    }

    //
    // Trace updated items
    //

    // Turn on / off record keeping of updated items
    traceUpdates(enable) {
        if (enable !== false) {
            if (!this._updatedItems) {
                this._updatedItems = new Map();
                this._changedLog = [];
                this._snapshot = null;
            }
        } else if (this._updatedItems) {
            this._updatedItems = null;
            this._changedLog = null;
            this._snapshot = null;
            this._msg('dmCommit'); // Implicit commit of any changes
        }
    }

    // Get update record for item, if any
    updatedItem(index) {
        return (this._updatedItems && this._updatedItems.get(this._items[this.baseIndex(index)])) || undefined;
    }

    // Get update record for item, if any
    updatedBaseItem(baseIndex) {
        return (this._updatedItems && this._updatedItems.get(this._items[baseIndex])) || undefined;
    }

    // Are all changes valid?
    get isValid() {
        if (!this._updatedItems) {
            return true; // Not tracing changes
        }
        let isValid = true;
        this._updatedItems.forEach(item => {
            // TODO?: Abort iteration on first error? (Throw and catch exception?)
            // eslint-disable-next-line no-unused-vars
            for (const k in item.$validation) {
                isValid = false; // Found validation errors
            }
        });
        return isValid;
    }

    submitIfValid(baseIndex, field) {
        const updated = this.updatedBaseItem(baseIndex);
        const item = updated && this.baseItem(baseIndex);
        if (!item) {
            return;
        }

        if (field) {
            // Cell update
            if (!updated.hasOwnProperty(field) || updated.$validation[field]) {
                return; // field is unassigned or invalid
            }

            // Delete backupped field value
            delete updated[field];

            // Should item changed record be dropped?
            let dropItem = true;

            // eslint-disable-next-line no-unused-vars
            for (const f in updated) {
                if (item[f] !== updated[f]) {
                    dropItem = false; // Found remaining change
                    break;
                }
            }
            if (dropItem) {
                this._updatedItems.delete(this._items[baseIndex]);
            }
        } else {
            // Row update
            for (const f in updated.$validation) {
                return; // Found invalid change
            }
            this._updatedItems.delete(this._items[baseIndex]);
        }

        // Inform about change
        const index = this.translateBaseIndexToIndex(baseIndex);
        if (index >= 0) {
            this._msg('dmItem', index);
        }
    }

    // Get all valid edited items for 'cell' or 'row' level
    getEditedItems(level) {
        if (!this._updatedItems) {
            return null;
        }
        const a = [];

        this._updatedItems.forEach((update, item) => {
            const validation = update.$validation;
            if (level === 'cell') {
                for (const field in update) {
                    if (field !== '$validation' && !validation[field]) {
                        // Found a valid change in item2
                        let _item = null;
                        for (const _field in validation) { // Restore invalid values to original values
                            if (!_item) {
                                _item = Object.assign({}, item);
                            }
                            _item[_field] = update[_field];
                        }
                        a.push(_item || item);
                    }
                }
            } else {
                // eslint-disable-next-line no-unused-vars
                for (const field in validation) {
                    // The whole row is not valid. Don't add
                    return;
                }
                // The changed row is valid. Report it
                a.push(item);
            }
        });

        return a.length ? a : null;
    }

    // Get changed items
    get changedItems() {
        if (!this._updatedItems) {
            return null;
        }
        const a = [];

        this._updatedItems.forEach((update, item) => {
            for (const field in update) {
                if (field !== '$validation' && update[field] !== item[field]) {
                    a.push(item);
                    break;
                }
            }
        });

        return a.length ? a : null;
    }

    // Get deleted items
    get deletedItems() {
        if (!this._changedLog) {
            return null;
        }
        const a = this._changedLog.reduce((acc, item) => {
            if (item.deleted) {
                acc.push(...item.deleted);
            }
            return acc;
        }, []);
        return a.length ? a : null;
    }

    // Get inserted items
    get insertedItems() {
        if (!this._changedLog) {
            return null;
        }
        const set = this._changedLog.reduce((acc, item) => {
            if (item.inserted) {
                item.inserted.forEach(_item => acc.add(_item));
            } else if (item.deleted) {
                // Inserted item might have been deleted
                item.deleted.forEach(_item => acc.delete(_item));
            }
            return acc;
        }, new Set());
        return set.size ? [...set] : null;
    }

    // Rollback all updated items
    rollbackUpdates() {
        if (!this._updatedItems) {
            return; // No active transaction
        }

        this._msg('dmRollback');

        const _updatedItems = this._updatedItems;
        const _changedLog = this._changedLog;
        const _snapshot = this._snapshot;


        // Stop tracking changes (during rollback)
        this._updatedItems = null;
        this._changedLog = null;
        this._snapshot = null;

        // Restore all changed values
        _updatedItems.forEach((update, item) => {
            for (const field in update) {
                if (field !== '$validation') {
                    item[field] = update[field];
                }
            }
        });

        // Refresh items with restored values
        _updatedItems.forEach((update, item) => {
            const index = this._indexOf(item);
            if (index >= 0) {
                this._msg('dmItem', index);
            }
        });

        if (_snapshot) {
            this._restoreSnapshot(_snapshot);
        } else {
            this._rollbackChangedLog(_changedLog);
        }

        // Start tracking changes again
        this._updatedItems = new Map();
        this._changedLog = [];

        this._msg('dmRollback', true);
    }

    // Use the changedLog to rollback changes.
    // NOTE: rollbacks in the Tree Grid is too complex for the changeLog, so that mode uses a snapshot instead. Far more RAM, far less complexity
    _rollbackChangedLog(changedLog) {
        // Restore removed / added items (via _changeLog)
        const inserted = [];
        const removed = [];

        const flushInserted = () => {
            if (inserted.length) {
                inserted.sort((a, b) => a[0] - b[0]);

                let tail = inserted[0];
                const a = [tail];

                for (let i = 1; i < inserted.length; i++) {
                    console.assert(tail[0] + tail[1] <= inserted[i][0]);
                    if (tail[0] + tail[1] === inserted[i][0]) {
                        tail[1] += inserted[i][1];
                    } else {
                        tail = inserted[i];
                        a.push(tail);
                    }
                }

                this._rebuildView();

                this._msg('dmInserted', a);
                inserted.length = 0;
            }
        };

        const flushRemoved = () => {
            if (removed.length) {
                removed.sort((a, b) => a[0] - b[0]);

                let tail = removed[0];
                const a = [tail];

                for (let i = 1; i < removed.length; i++) {
                    if (tail[0] === removed[i][0]) {
                        tail[1] += removed[i][1];
                    } else {
                        tail = removed[i];
                        a.push(tail);
                    }
                }
                removed.length = 0;

                // Collect removed base indexes
                const baseIndexes = a.reduce((acc, v) => {
                    for (let i = 0; i < v[1]; i++) {
                        acc.push(v[0] + i);
                    }
                    return acc;
                }, []);

                // Adjust state and report changed to client
                // Removing items from a projection can be done faster than recomputing the entire projection
                this._adjustAfterItemsDeleted(baseIndexes);
            }
        };

        const insert = (baseIndex, count) => {
            flushRemoved();
            inserted.forEach(change => {
                if (change[0] >= baseIndex) {
                    change[0] += count;
                }
            });
            inserted.push([baseIndex, count]);
        };

        const remove = (baseIndex, count) => {
            flushInserted();
            removed.forEach(change => {
                if (change[0] >= baseIndex) {
                    change[0] -= count;
                }
            });
            removed.push([baseIndex, count]);
        };

        for (let i = changedLog.length - 1; i >= 0; --i) {
            const change = changedLog[i];
            if (change.deleted) {
                // Restore removed items
                this._items.splice(change.baseIndex, 0, ...change.deleted);
                insert(change.baseIndex, change.deleted.length);
            } else if (change.inserted) {
                // Remove inserted items
                flushInserted();
                this._items.splice(change.baseIndex, change.inserted.length);
                remove(change.baseIndex, change.inserted.length);
            }
        }

        flushRemoved();
        flushInserted();
    }

    // Create snapshot of data
    _createSnapshot() {
        if (!this._mapSubItems) {
            return [...this._items];
        }

        // Tree grid
        const tree = [];
        for (let i = 1; i < this._seg.length; i++) {
            const [start, parent] = this._seg[i];
            const map = this._mapSubItems.get(this._items[parent]);
            tree.push([parent, start, map.end, map.isOpen, map.level]);
        }

        return {items: [...this._items], tree};
    }

    // Restore snapshot
    _restoreSnapshot(snapshot) {
        if (this._subItems && this._subItemsState) {
            // Tree grid
            if (!snapshot || !Array.isArray(snapshot.items) || !Array.isArray(snapshot.tree)) {
                console.error('Invalid snapshot');
                return;
            }

            this._items = snapshot.items;
            this._topItems = snapshot.items.slice(0, snapshot.tree[0] ? snapshot.tree[0][1] : snapshot.items.length);
            this._mapSubItems = new Map();
            this._seg = initSeg();

            snapshot.tree.forEach(([parent, start, end, isOpen, level]) => {
                this._seg.push([start, parent]);
                this._mapSubItems.set(this._items[parent], {start, end, isOpen, level});
            });

            //this.__verify();

        } else {
            // Normal grid
            if (!Array.isArray(snapshot)) {
                console.error('Invalid snapshot');
                return;
            }
            this._items = this._topItems = snapshot;
            this._mapSubItems = null;
            this._seg = null;
            this._view = null;
        }

        this._rebuildView();
        this._msg('dmView');
    }

    // Commit all updated items
    commitUpdates() {
        if (this._updatedItems) {
            this._updatedItems = new Map();
            this._changedLog = [];
            this._snapshot = null;
            this._msg('dmCommit');
        }
    }
}
