import {PTCS} from 'ptcs-library/library.js';

/*
SelectManager - handles selection of arbitrary selection objects
   - cmp = compares two selection objects and returns: < 0, 0, > 0

Properties:
   - selectMethod: 'none' || 'single'      || 'multiple'
   - selection:     null  || single object || Array of objects

Methods:
   - observe(cbObj)
   - unobserve(cbObj)
   - select(object, selected?) // selected = undefined (toggle) || true || false

Callbacks:
   - selectionChanged(selection); // Whenever the entire selection is changed
   - selectedChanged(object, selected); // Individual callbacks for each object
*/

export class SelectionMgr {
    constructor(cmp) {
        console.assert(typeof cmp === 'function');
        this._cmp = cmp;
        this._observers = new Set(); // The observers
        this._selectMethod = undefined;
        this._selection = null;
    }

    // observe changes
    observe(cbObj) {
        this._observers.add(cbObj);
    }

    // unobserve changes
    unobserve(cbObj) {
        this._observers.delete(cbObj);
    }

    // Notify observers
    _msg(msg, ...arg) {
        this._observers.forEach(cbObj => {
            if (typeof cbObj[msg] === 'function') {
                cbObj[msg](...arg);
            }
        });
    }

    _find(sel) {
        return this._selection instanceof Array
            ? PTCS.binSearch(this._selection, i => this._cmp(this._selection[i], sel))
            : -1;
    }

    isSelected(sel) {
        if (this._selectMethod === 'single') {
            return this._selection !== null ? this._cmp(sel, this._selection) === 0 : false;
        }
        if (this._selectMethod === 'multiple') {
            return this._find(sel) >= 0;
        }
        return false;
    }

    // selectMethod: 'none' || 'single' || 'multiple'
    get selectMethod() {
        return this._selectMethod || 'none';
    }

    set selectMethod(method) {
        const old = this._selection;
        switch (method) {
            case null:
            case undefined:
            case '':
            case 'none':
                if (this._selectMethod === 'single') {
                    this._selectMethod = null;
                    this._selection = null;
                    if (old) {
                        this._msg('selectionChanged', this._selection);
                        this._msg('selectedChanged', old, false);
                    }
                } else if (this._selectMethod === 'multiple') {
                    this._selectMethod = null;
                    this._selection = null;
                    if (old) {
                        this._msg('selectionChanged', this._selection);
                        old.forEach(sel => this._msg('selectedChanged', sel, false));
                    }
                }
                break;
            case 'single':
                if (this._selectMethod !== 'single') {
                    this._selectMethod = 'single';
                    if (this._selection) {
                        this._selection = old.shift();
                        this._msg('selectionChanged', this._selection);
                        old.forEach(sel => this._msg('selectedChanged', sel, false));
                    }
                }
                break;
            case 'multi':
            case 'multiple':
                if (this._selectMethod !== 'multiple') {
                    this._selectMethod = 'multiple';
                    if (this._selection !== null) {
                        this._selection = [this._selection];
                    }
                }
                break;
            default:
                throw new Error('Invalid selectMethod: ' + method);
        }
        return this.selectMethod;
    }

    // Get current selection
    get selection() {
        return this._selection;
    }

    // Set new selection
    set selection(_selection) {
        const old = this._selection;
        if (old === null && _selection === null) {
            return this._selection; // No change
        }

        if (this._selectMethod === 'single') {
            if (_selection instanceof Array) {
                _selection = _selection[0];
            }
            if (old !== null && _selection !== null && this._cmp(_selection, old) === 0) {
                return this._selection; // No change
            }
            this._selection = _selection;
            this._msg('selectionChanged', this._selection);
            if (old !== null) {
                this._msg('selectedChanged', old, false);
            }
            if (_selection !== null) {
                this._msg('selectedChanged', _selection, true);
            }
        } else if (this._selectMethod === 'multiple') {
            console.assert(old === null || old instanceof Array);
            console.assert(_selection === null || _selection instanceof Array);
            const a1 = old || [];
            const a2 = this._sort(_selection || []);
            const s = []; // Selected
            const u = []; // Unselected
            let i1 = 0;
            let i2 = 0;
            while (i1 < a1.length && i2 < a2.length) {
                const c = this._cmp(a1[i1], a2[i2]);
                if (c < 0) {
                    u.push(a1[i1++]);
                } else if (c > 0) {
                    s.push(a2[i2++]);
                } else {
                    i1++;
                    i2++;
                }
            }
            while (i1 < a1.length) {
                u.push(a1[i1++]);
            }
            while (i2 < a2.length) {
                s.push(a2[i2++]);
            }
            if (s.length === 0 && u.length === 0) {
                return this._selection; // No change
            }
            this._selection = a2.length ? a2 : null;
            this._msg('selectionChanged', this._selection);
            u.forEach(sel => this._msg('selectedChanged', sel, false));
            s.forEach(sel => this._msg('selectedChanged', sel, true));
        }
        return this._selection;
    }

    _sort(a) {
        // Is array already sorted?
        for (let i = 1; i < a.length; i++) {
            if (this._cmp(a[i - 1], a[i]) >= 0) {
                // Not sorted: create sorted duplicated array
                a = a.slice().sort(this._cmp);

                // Remove duplicate entries
                for (let j = 1; j < a.length;) {
                    const c = this._cmp(a[j - 1], a[j]);
                    console.assert(c <= 0); // or array sort failed ...
                    if (c === 0) {
                        a.splice(j, 1);
                    } else {
                        j++;
                    }
                }
                break;
            }
        }
        return a;
    }

    select(sel, selected) {
        if (this._selectMethod === 'single') {
            const _selected = this.isSelected(sel);
            if (selected === _selected) {
                return selected; // No change
            }
            if (selected === undefined) {
                selected = !_selected; // Toggle
            }
            const old = this._selection;
            this._selection = selected ? sel : null;
            this._msg('selectionChanged', this._selection);
            if (old !== null) {
                this._msg('selectedChanged', old, false);
            }
            if (this._selection !== null) {
                this._msg('selectedChanged', this._selection, true);
            }
        } else if (this._selectMethod === 'multiple') {
            const index = this._find(sel);
            const _selected = (index >= 0);
            if (selected === _selected) {
                return selected; // No change
            }
            if (selected === undefined) {
                selected = !_selected; // Toggle
            }
            if (selected) {
                // Add to selection
                if (this._selection === null) {
                    this._selection = [sel];
                } else {
                    let pos = -1 - index;
                    if (this._cmp(sel, this._selection[pos]) > 0) {
                        pos++;
                    }
                    this._selection.splice(pos, 0, sel);
                }
            } else if (this._selection.length > 1) {
                this._selection.splice(index, 1);
            } else {
                this._selection = null;
            }

            this._msg('selectionChanged', this._selection);
            this._msg('selectedChanged', sel, selected);
        }
        return selected;
    }
}
