import {PolymerElement, html} from '@polymer/polymer/polymer-element.js';
import {PTCS} from 'ptcs-library/library.js';
import 'ptcs-behavior-styleable/ptcs-behavior-styleable.js';
import 'ptcs-behavior-focus/ptcs-behavior-focus.js';
import 'ptcs-label/ptcs-label.js';
import 'ptcs-list/ptcs-list.js';
import 'ptcs-button/ptcs-button.js';
import 'ptcs-icons/cds-icons.js';

PTCS.ListShuttle = class extends PTCS.BehaviorTabindex(PTCS.BehaviorFocus(PTCS.BehaviorStyleable(PTCS.ThemableMixin(PolymerElement)))) {
    static get template() {
        return html`
        <style>
            :host {
                position: relative;
                width: 100%;
                height: 100%;
                box-sizing: border-box;

                display: inline-flex;
                justify-content: space-between;
                align-items: stretch;
            }

            #root {
                flex: 1 1 auto;

                display: grid;
                display: -ms-grid;
            }

            :host(:not([vertical])) #root {
                grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
                grid-template-rows: auto minmax(0, 1fr) 50px auto;

                -ms-grid-columns: 1fr 1fr;
                -ms-grid-rows: auto 1fr 50px auto;
            }

            :host([vertical]) #root {
                grid-template-columns: minmax(0, 1fr);
                grid-template-rows: auto minmax(0, 1fr) auto minmax(0, 1fr) auto;

                -ms-grid-columns: 1fr;
                -ms-grid-rows: auto 1fr auto 1fr auto;
            }

            :host(:not([vertical])) [part~=head] {
                grid-column: 1 / 3;
                grid-row: 1;

                -ms-grid-column: 1;
                -ms-grid-column-span: 2;
                -ms-grid-row: 1;
            }

            :host([vertical]) [part~=head] {
                grid-column: 1;
                grid-row: 1;

                -ms-grid-column: 1;
                -ms-grid-row: 1;
            }

            :host(:not([vertical])) [part~=source-list-container] {
                grid-column: 1;
                grid-row: 2 / 4;

                -ms-grid-column: 1;
                -ms-grid-row: 2;
                -ms-grid-row-span: 2;
            }

            :host([vertical]) [part~=source-list-container] {
                grid-column: 1;
                grid-row: 2;

                -ms-grid-column: 1;
                -ms-grid-row: 2;
            }

            :host(:not([vertical])) [part~=target-list-container] {
                grid-column: 2;
                grid-row: 2;

                -ms-grid-column: 2;
                -ms-grid-row: 2;
            }

            :host([vertical]) [part~=target-list-container] {
                grid-column: 1;
                grid-row: 4;

                -ms-grid-column: 1;
                -ms-grid-row: 4;
            }

            :host(:not([vertical])) [part~=source-buttons] {
                grid-column: 1;
                grid-row: 4;

                -ms-grid-column: 1;
                -ms-grid-row: 4;
            }

            :host([vertical]) [part~=source-buttons] {
                grid-column: 1;
                grid-row: 3;

                -ms-grid-column: 1;
                -ms-grid-row: 3;
            }

            :host(:not([vertical])) [part~=target-buttons] {
                grid-column: 2;
                grid-row: 3 / 5;

                -ms-grid-column: 2;
                -ms-grid-row: 3;
                -ms-grid-row-span: 2;
            }

            :host([vertical]) [part~=target-buttons] {
                grid-column: 1;
                grid-row: 5;

                -ms-grid-column: 1;
                -ms-grid-row: 5;
            }

            [part=label] {
                width: 100%;
            }

            [part~=source-list-container],
            [part~=target-list-container] {
                position: relative;
            }

            [part~=source-list],
            [part~=target-list] {
                width: 100%;
                height: 100%;
            }

            [part~=target-buttons] {
                display: flex;
                flex-wrap: wrap;
                flex-direction: row;
                justify-content: flex-start;
                align-items: flex-start;
            }

            [part~=move-buttons] {
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: flex-start;
            }

            /* Below style is needed for Edge/IE. The reason is that MB adds some styles that override
             * :host { ... box-sizing: border-box ...} for ptcs-button. These MB styles are applied in Edge/IE since
             * the component is not hidden by shadow root. */
            ptcs-button[part~=button] {
                box-sizing: border-box;
            }
        </style>

        <div id="root">
        <div part="head" hidden\$="[[_isEmpty(label)]]">
            <ptcs-label part="label" label="[[label]]" multi-line
                        horizontal-alignment="[[labelAlignment]]" variant="[[labelType]]"></ptcs-label>
        </div>
        <div part="source-list-container">
            <ptcs-list id="srclist" part="source-list" label="[[sourceLabel]]"
                       label-alignment="[[sourceLabelAlignment]]" label-type="[[sourceLabelType]]"
                       items="[[items]]" selector="[[selector]]" disabled="[[disabled]]"
                       clear-selected-items-label="[[clearSelectedItemsLabel]]" select-all-label="[[selectAllLabel]]"
                       filter="[[_filter]]" filter-string="{{sourceFilter}}" hide-filter="[[hideFilter]]"
                       hint-text="[[filterHintText]]"
                       multi-select="[[!singleSelect]]" on-selected-indexes-changed="_srcSelectionChanged"
                       exportparts\$="[[_exportsource]]" tabindex\$="[[_delegatedFocus]]"></ptcs-list>
        </div>
        <div part="source-buttons buttons">
            <ptcs-button part="add-button button" variant="primary"
                         label="[[addLabel]]" tabindex\$="[[_delegatedFocus]]"
                         disabled="[[_btnDisabled(disabled, _selectionSrc)]]" on-action="_addClick"></ptcs-button>
        </div>
        <div part="target-list-container">
            <ptcs-list id="dstlist" part="target-list" label="[[targetLabel]]"
                       label-alignment="[[targetLabelAlignment]]" label-type="[[targetLabelType]]"
                       items="[[_selectedItems]]" selector="[[selector]]" disabled="[[disabled]]"
                       clear-selected-items-label="[[clearSelectedItemsLabel]]" select-all-label="[[selectAllLabel]]"
                       multi-select="[[!singleSelect]]" on-selected-indexes-changed="_dstSelectionChanged"
                       exportparts\$="[[_exporttarget]]" tabindex\$="[[_delegatedFocus]]"></ptcs-list>
        </div>
        <div part="target-buttons buttons">
            <ptcs-button part="remove-button button" variant="primary" id="rembtn"
                         label="[[removeLabel]]" tabindex\$="[[_delegatedFocus]]"
                         disabled="[[_btnDisabled(disabled, _selectionDst)]]" on-action="_removeClick"></ptcs-button>
            <div part="move-buttons">
            <ptcs-button part="up-button button" variant="tertiary" id="upbtn"
                         label="[[labelUp]]" icon="cds:icon_ascending" tabindex\$="[[_delegatedFocus]]"
                         disabled="[[_btnDisabled(disabled, _canMoveUp)]]" on-action="_upClick"></ptcs-button>
            <ptcs-button part="down-button button" variant="tertiary" id="dnbtn"
                         label="[[labelDown]]" icon="cds:icon_descending" tabindex\$="[[_delegatedFocus]]"
                         disabled="[[_btnDisabled(disabled, _canMoveDn)]]" on-action="_downClick"></ptcs-button>
            </div>
        </div>
    </div>`;
    }

    static get is() {
        return 'ptcs-list-shuttle';
    }

    static get properties() {
        return {
            disabled: {
                type:               Boolean,
                reflectToAttribute: true
            },

            // Select value from item[]
            selector: {
                type: String
            },

            idSelector: {
                type: String
            },

            // List input
            items: {
                type:  Array,
                value: () => []
            },

            // Selected items in list input
            selectedItems: {
                type:   Array,
                value:  () => [],
                notify: true
            },

            // Extracted items from selectedItems that only contain existing items
            _selectedItems: {
                type: Array
            },

            _defaultselectedItems: {
                type:  Array,
                value: () => []
            },

            // Map: label => item[index]
            _label2item: {
                type:  Object,
                value: () => {}
            },

            singleSelect: {
                type:  Boolean,
                value: false
            },

            _selectionSrc: {
                type: Boolean
            },

            _selectionDst: {
                type: Boolean
            },

            _canMoveUp: {
                type:  Boolean,
                value: false
            },

            _canMoveDn: {
                type:  Boolean,
                value: false
            },

            hideFilter: {
                type: Boolean
            },

            filterHintText: {
                type:  String,
                value: 'Filter'
            },

            _filterSet: {
                type:  Set,
                value: () => new Set()
            },

            _filter: {
                type:     Function,
                computed: '_computeFilter(hideFilter, _filterSet)'
            },

            sourceFilter: {
                type:   String,
                value:  '',
                notify: true
            },

            _resizeObserver: {
                type: ResizeObserver
            },

            vertical: {
                type:               Boolean,
                reflectToAttribute: true
            },

            // Labels
            label: {
                type:  String,
                value: ''
            },

            labelType: {
                type:  String,
                value: 'sub-header'
            },

            labelAlignment: {
                type:  String,
                value: 'left'
            },

            sourceLabel: {
                type:  String,
                value: 'Source'
            },

            sourceLabelType: {
                type:  String,
                value: 'label'
            },

            sourceLabelAlignment: {
                type:  String,
                value: 'left'
            },

            targetLabel: {
                type:  String,
                value: 'Target'
            },

            targetLabelType: {
                type:  String,
                value: 'label'
            },

            targetLabelAlignment: {
                type:  String,
                value: 'left'
            },

            addLabel: {
                type:  String,
                value: 'Add'
            },

            removeLabel: {
                type:     String,
                value:    'Remove',
                observer: '_alignButtons'
            },

            labelUp: {
                type:     String,
                value:    'Up',
                observer: '_alignButtons'
            },

            labelDown: {
                type:     String,
                value:    'Down',
                observer: '_alignButtons'
            },

            collapsedBtns: {
                type:               Boolean,
                reflectToAttribute: true
            },

            selectAllLabel: {
                type:  String,
                value: 'Select All'
            },

            clearSelectedItemsLabel: {
                type:  String,
                value: 'Clear Selected Items'
            },

            _delegatedFocus: {
                type:  String,
                value: null
            },

            _exportsource: {
                type:     String,
                readOnly: true,
                value:    PTCS.exportparts('source-list-', PTCS.List)
            },

            _exporttarget: {
                type:     String,
                readOnly: true,
                value:    PTCS.exportparts('target-list-', PTCS.List)
            }
        };
    }

    static get observers() {
        return ['_itemsChanged(items, selectedItems, selector, idSelector)'];
    }

    ready() {
        super.ready();
        this._resizeObserver = new ResizeObserver(entries => {
            const bw = Number(ShadyCSS.getComputedStyleValue(this, '--ptcs-list-shuttle--break-width') || 530);
            const w = entries[0].contentRect.width;
            if (w > 0) {
                this.vertical = (w + 2) < bw;
            }
            this._alignButtons();
        });
    }

    connectedCallback() {
        super.connectedCallback();
        this._resizeObserver.observe(this);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this._resizeObserver.unobserve(this);
    }

    _btnDisabled(disabled, canDoAction) {
        return disabled || !canDoAction;
    }

    _isEmpty(label) {
        if (!label || label === '') {
            return true;
        }

        return false;
    }

    _computeFilter(hideFilter, _filterSet) {
        if (hideFilter) {
            return () => {
                return (item, index) => !_filterSet.has(this.items[index]);
            };
        }
        // eslint-disable-next-line no-unused-vars
        return (filterString, filterFunc) => {
            return (item, index) => !_filterSet.has(this.items[index]) && filterFunc(item, index);
        };
    }

    // The list-shuttle want to change selectedItems
    // Note: every change of selectedItems must go via a new array, otherwise the list-shuttle generates
    // change events for every micro-change (which clients considered to be a bug)
    _assignSelectedItems(selectedItems) {
        // Save current selection in dstlist
        const sel = this.$.dstlist.selectedIndexes.map(i => this._selectedItems[i]);

        // Update _selectedItems (show selectedItems in dstlist)
        this._selectedItems = selectedItems;

        // Restore saved selection
        const si = [];
        sel.forEach(item => {
            // Note: O(n^2) algorithm. (Probably not a problem for this function though, since n will - probably - be small)
            const ix = selectedItems.findIndex(item2 => item2 === item);
            if (ix >= 0) {
                si.push(ix);
            }
        });
        this.$.dstlist.selectedIndexes = si;

        // Notify client
        this.selectedItems = selectedItems;
    }

    _itemsChanged(items, selectedItems, selector, idSelector) {
        if (this._selectedItems === selectedItems) {
            // The list shuttle itself has changed the selected items. No processing needed
            return;
        }

        // Reset internal copy of selectedItems
        this._selectedItems = [];

        if (!(items instanceof Array)) {
            return; // No data
        }

        if (!(selectedItems instanceof Array)) {
            return; // Nothing selected
        }

        // This selectedItems has been given by the client, so use it as the default value
        if (this._defaultselectedItems !== selectedItems) {
            this._defaultselectedItems = selectedItems.slice(0);
        }

        if (selectedItems.length === 0 && this._filterSet.size === 0) {
            return; // Nothing selected
        }

        const selectedSelector = idSelector || selector;
        const getId = PTCS.makeSelector(selectedSelector);

        // Recompute labels?
        if (this._oldItems !== items || this._oldSelector !== selectedSelector) {
            this._oldItems = items;
            this._oldSelector = selectedSelector;
            this._label2item = {};
            items.forEach(item => {
                this._label2item[getId(item)] = item;
            });
        }

        // Map objects in selectedItems to objects in items
        this._filterSet = new Set();

        // Grab the actual selected items from the items array
        selectedItems.forEach(item => {
            const itemSrc = this._label2item[getId(item)];
            if (itemSrc) {
                this._filterSet.add(itemSrc);
            } else {
                console.warn('Unkown item in selectedItems: ' + getId(item));
            }
        });

        // The selectedItems that the shuttle will actually use
        this._selectedItems = [...this._filterSet];

        this.$.srclist.reFilter();
    }

    _addClick() {
        this.$.srclist.selectedIndexes.sort((x, y) => x - y).forEach(ix => {
            this._filterSet.add(this.items[ix]);
        });

        this._assignSelectedItems([...this._filterSet]);
        this.$.srclist.unselectAll();
        this.$.srclist.reFilter();

        if (this.singleSelect) {
            this.$.dstlist.selectItem(this._selectedItems.length - 1, true);
        }
    }

    _removeClick() {
        const si = this._dstSelectionSeg();
        const item = si.length && this._selectedItems[si[0][0]]; // First item that is selected
        for (let i = si.length - 1; i >= 0; i--) {
            const [from, to] = si[i];
            for (let j = from; j <= to; j++) {
                this._filterSet.delete(this._selectedItems[j]);
            }
        }

        this._assignSelectedItems([...this._filterSet]);
        this.$.dstlist.unselectAll();
        this.$.srclist.reFilter();

        if (this.singleSelect && item) {
            this.$.srclist.selectItem(this.$.srclist.items.findIndex(x => x === item), true);
        }
    }

    _dstSelectionSeg() {
        let r = [];
        const a = this.$.dstlist.selectedIndexes.sort((x, y) => x - y);
        for (let i = 0; i < a.length;) {
            let i2 = i + 1;
            while (i2 < a.length && a[i2 - 1] + 1 === a[i2]) {
                i2++;
            }
            r.push([a[i], a[i2 - 1]]);
            i = i2;
            if (i > 100) {
                break;
            }
        }
        return r;
    }

    _upClick() {
        const a = [...this._selectedItems];
        this._dstSelectionSeg().forEach(seg => {
            if (seg[0] > 0) {
                a.splice(seg[0] - 1, 0, ...a.splice(seg[0], seg[1] - seg[0] + 1));
            }
        });
        this._assignSelectedItems(a);
    }

    _downClick() {
        const a = [...this._selectedItems];
        this._dstSelectionSeg().forEach(seg => {
            if (seg[1] < a.length - 1) {
                a.splice(seg[0] + 1, 0, ...a.splice(seg[0], seg[1] - seg[0] + 1));
            }
        });
        this._assignSelectedItems(a);
    }

    _srcSelectionChanged() {
        this._selectionSrc = this.$.srclist.selectedIndexes.length > 0;
    }

    _dstSelectionChanged() {
        const segList = this._dstSelectionSeg();
        this.setProperties({
            _selectionDst: this.$.dstlist.selectedIndexes.length > 0,
            _canMoveUp:    segList.find(seg => seg[0] > 0),
            _canMoveDn:    segList.find(seg => seg[1] < this._selectedItems.length - 1)
        });
    }

    _resetToDefault() {
        this.selectedItems = this._defaultselectedItems.slice(0);
    }

    // Align the the target list buttons
    _alignButtons() {
        // Something may have affected the styling of the three buttons under the target list
        const e1 = this.$.rembtn;
        const e2 = this.$.upbtn;
        const e3 = this.$.dnbtn;
        if (!e1 || !e2 || !e3) {
            return;
        }

        // Reset styles
        e1.style.width = '';
        e2.style.width = '';
        e3.style.width = '';

        // Get new dimensions
        const b1 = e1.getBoundingClientRect();
        const b2 = e2.getBoundingClientRect();
        const collapsedBtns = b1.bottom < b2.top;
        const w1 = collapsedBtns ? b1.width : 0;
        const w2 = b2.width;
        const w3 = e3.getBoundingClientRect().width;
        const w = Math.max(w1, w2, w3);
        const ws = `${w}px`;

        if (collapsedBtns && w > w1) {
            e1.style.width = ws;
        }
        if (w > w2) {
            e2.style.width = ws;
        }
        if (w > w3) {
            e3.style.width = ws;
        }

        // Delay updating the state attribute until now
        this.collapsedBtns = collapsedBtns;
    }
};

customElements.define(PTCS.ListShuttle.is, PTCS.ListShuttle);
