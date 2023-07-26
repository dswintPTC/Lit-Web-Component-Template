/* Don't need a warning to make sure I have not confused "=>" with ">=" or "<=" */
/* eslint-disable no-confusing-arrow */

export class QuickFilter {
    constructor() {
        this.selectedItemText = '__selected__ Row Selected';
        this.selectedItemsText = '__selected__ Rows Selected';
    }

    set data(data) {
        if (this._data) {
            this._data.unobserve(this);
        }

        this._data = data;

        if (data) {
            this._data.observe(this);
            if (this._filterString) {
                this.filterString = this._filterString;
            }
        }
    }

    set view(view) {
        this._view = view;
    }

    dmSelectMethod(selectMethod) {
        this._selectMethod = selectMethod;
        if (this._data.selected && this._data.selected.length) {
            this._updateLabel(this._data.selected.length);
        } else {
            this._updateLabel(this._data.selected ? 1 : 0);
        }
    }

    dmSelection(selected) {
        const selection = !selected || Array.isArray(selected) ? selected : selected.selection;
        this._updateLabel(selection ? selection.length : 0);
    }

    set _selectedItemsLabel(label) {
        if (typeof this.setLabel === 'function') {
            this.setLabel(label);
        }
    }

    _updateLabel(selectedItems) {
        if (this._selectMethod !== 'multiple') {
            this._selectedItemsLabel = '';
            return;
        }
        const count = selectedItems !== undefined ? selectedItems : 0;
        if (count === 1) {
            this._assignLabel(count, this.selectedItemText);
        } else {
            this._assignLabel(count, this.selectedItemsText);
        }
    }

    _assignLabel(count, boilerplate) {
        const placeholder = '__selected__';
        const placeholderPos = boilerplate.indexOf(placeholder);
        if (placeholderPos !== -1) {
            const plen = placeholder.length;
            this._selectedItemsLabel = boilerplate.substr(0, placeholderPos) + ' ' + count + ' ' + boilerplate.substr(placeholderPos + plen);
        } else {
            this._selectedItemsLabel = count + ' ' + boilerplate;
        }
    }


    _showFilterChanged() {
        // Reset the search filter string when toggling the filter's visibility
        this.filterString = '';
    }

    set filterString(filterString) {
        this._filterString = filterString;
        const data = this._data;
        const view = this._view;
        if (!data) {
            return;
        }
        if (this._filterTO) {
            clearTimeout(this._filterTO);
        }
        const _f = filterString.toUpperCase();

        // If we have a configured view configurator, use it, otherwise operate directly on the data
        const filter = (view && view.columns)
            ? (item, index) => view.getRowStrings(item, index, data).some(s => s.toUpperCase().indexOf(_f) >= 0)
            : item => {
                for (const field in item) {
                    if (String(item[field]).toUpperCase().indexOf(_f) >= 0) {
                        return true;
                    }
                }
                return false;
            };

        if (this.clearFilteredSelection && data.selected) {
            // We need to unselect selected rows that will be filtered out
            switch (this._selectMethod) {
                case 'multiple':
                    data.selected.filter(i => !filter(data.baseItem(i), i)).forEach(i => data.select(i, false));
                    break;
                case 'single':
                    if (!filter(data.baseItem(data.selected), data.selected)) {
                        data.select(data.selected, false);
                    }
            }
        }

        // Assign filter function to data manager. _filterTO is a timer id, so filtering doesn't start until keyboard has been silent for 200ms
        this._filterTO = setTimeout(() => {
            this._filterTO = 0;
            if (!filterString) {
                // Reset filter
                data.filter = null;
            } else if (!this.clearFilteredSelection) {
                data.filter = (item, i) => data.isSelectedBaseIndex(i) || filter(item, i);
            } else {
                data.filter = filter;
            }
        }, 200);
    }
}
