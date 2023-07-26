import {PolymerElement, html} from '@polymer/polymer/polymer-element.js';
import {PTCS} from 'ptcs-library/library.js';
import {ListSelection} from 'ptcs-list/list-selection.js';
import '@polymer/polymer/lib/elements/dom-repeat.js';
import '@polymer/polymer/lib/elements/dom-if.js';
import 'ptcs-behavior-styleable/ptcs-behavior-styleable.js';
import 'ptcs-behavior-focus/ptcs-behavior-focus.js';
import 'ptcs-behavior-tabindex/ptcs-behavior-tabindex.js';
import {setTooltipByFocus} from 'ptcs-behavior-tooltip/ptcs-behavior-tooltip.js';
import 'ptcs-behavior-validate/ptcs-behavior-validate.js';
import 'ptcs-label/ptcs-label.js';
import 'ptcs-textfield/ptcs-textfield.js';
import 'ptcs-checkbox/ptcs-checkbox.js';
import 'ptcs-radio/ptcs-radio.js';
import 'ptcs-link/ptcs-link.js';
import 'ptcs-v-scroller/ptcs-v-scroller.js';
import './ptcs-list-item.js';
import 'ptcs-icons/cds-icons.js';

/* eslint-disable no-confusing-arrow */
PTCS.List = class extends PTCS.BehaviorTabindex(PTCS.BehaviorValidate(PTCS.BehaviorFocus(
    PTCS.BehaviorStyleable(PTCS.ThemableMixin(PolymerElement))))) {
    static get template() {
        return html`
        <style>
          :host {
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            align-items: stretch;
            min-width: 34px;
            min-height: 34px;
            box-sizing: border-box;
            overflow: hidden;
          }

          [part=label][hidden] {
            display: none;
          }

          [part=label] {
            display: block;
            padding-bottom: 4px;
            flex-shrink: 0;
            min-height: unset;
            min-width: unset;
          }

          [part=item-checkbox] {
            grid-column: 1;
            grid-row: 1;
            -ms-grid-column: 1;
            -ms-grid-row: 1;

            align-self: center;
            font-size: inherit;
            min-height: unset;
          }

          [part=item-radio] {
            grid-column: 1;
            grid-row: 1;

            align-self: center;
            font-size: inherit;
            min-height: unset;
          }

          [part=list-item][hidden] {
              display: none;
          }

          :host(:not([multi-select])) [part=item-checkbox] {
            display: none;
          }

          :host(:not([radio-button-selection])) [part=item-radio] {
            display: none;
          }

          :host(:not([multi-select])) [part=multi-select] {
            display: none;
          }

          :host([_hide-list]) [part=list-container] {
            display: none;
          }

          [part=multi-select][hidden] {
            display: none;
          }

          [part=multi-select] {
            display: flex;
            justify-content: space-between;
            align-items: center;

            flex: 0 0 auto;
          }

          [part=link] {
            flex: 1 1 auto;
          }

          [part=no-matches][hidden] {
            display: none;
          }

          [part=no-matches] {
            display: flex;
            justify-content: space-between;
            align-items: center;

            flex: 0 0 auto;
          }

          [part=no-matches-label] {
            flex: 1 1 auto;
          }

          [part=item-meta] {
            grid-column: 2;
            grid-row: 2;
            -ms-grid-column: 2;
            -ms-grid-row: 2;

            justify-content: stretch;
            align-content: center;
          }

          [part=item-meta][hidden] {
            display: none;
          }

          :host(:not([disabled])) [part=list-item]:not([disabled]):hover {
            cursor: pointer;
          }

          [part=filter] {
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
            flex-wrap: nowrap;

            flex: 0 0 auto;
          }

          [part=filter][hidden] {
            display: none !important;
          }

          [part=filter-field] {
            flex: 1 1 auto;
          }

          :host(:not([disabled])) [part=icon-close] {
            cursor: pointer;
          }

          [part=list-container] {
            flex: 1 1 auto;
            box-sizing: border-box;
            overflow: hidden;

            display: flex;
            flex-direction: column;
            flex-wrap: nowrap;
            justify-content: space-between;
            align-items: stretch;
          }

          [part=list-items-container] {
            flex: 1 1 auto;
            box-sizing: border-box;
          }

          /* Do not change the following selector as it could have side-effects e.g. on label of item for resetting single selection list */
          ptcs-div[part~=item-value] {
            grid-column: 2;
            grid-row: 1;

            -ms-grid-column: 2;
            -ms-grid-row: 1;

            display: flex;

            justify-content: flex-start;
            align-items: center;

            overflow: hidden;
          }

          [part~=item-value] {
            max-width: 100%;
          }

          [part=list-item] {
            min-height: var(--ptcs-list-item--height, 34px);
            width: 100%;
            box-sizing: border-box;
          }

          ptcs-list-item {
            display: grid;
            display: -ms-grid;

            grid-template-columns: auto 1fr;
            grid-template-rows: 1fr auto;

            -ms-grid-columns: auto 1fr;
            -ms-grid-rows: 1fr auto;
          }

          /* Hide meta row? */
          ptcs-list-item[label-meta=''] {
            grid-template-rows: 1fr;
            -ms-grid-rows: 1fr;
          }

          .unselect-item {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: stretch;
            align-content: stretch;
          }

          .unselect-item > [part~=item-value] {
            flex: 1 1 auto;
            position: relative;
          }

          .center-item-value {
            grid-column: 2;
            grid-row: 1;
            -ms-grid-column: 2;
            -ms-grid-row: 1;

            display: flex;
            flex-direction: row;
            justify-content: flex-start;
            align-items: center;
            width: 100%;
          }
          :host([alignment=left]) .center-item-value {
            -ms-grid-column-align: start;
          }
          :host([alignment=center]) .center-item-value {
            -ms-grid-column-align: center;
          }
          :host([alignment=right]) .center-item-value {
            -ms-grid-column-align: end;
          }

          /* The border settings from the Theme Engine should only affect the list item separator */
          /* NOTE: This should have been handled by the Theme Engine, but we don't want this to show up un the Style Tab */
          [part=list-item]:first-child {
            border-top: none !important;
          }
          [part=list-item] {
            border-left: none !important;
            border-right: none !important;
            border-bottom: none !important;
          }
        </style>

        <ptcs-label part="label" hidden\$="[[!label]]" label="[[label]]"
                    horizontal-alignment="[[labelAlignment]]" variant="[[labelType]]"></ptcs-label>

        <div id="list-container" part="list-container">
          <!-- filter list -->
          <div part="filter" hidden\$="[[_filterHidden(filter, hideFilter)]]" stretch="">
              <ptcs-textfield part="filter-field" icon="cds:icon_filter" text="{{filterString}}"
              hint-text="[[hintText]]" disabled="[[disabled]]" tabindex\$="[[_delegatedFocus]]"
              tooltip="[[ownerTooltip]]" tooltip-icon=[[ownerTooltipIcon]]
              exportparts\$="[[_exportFilter]]"></ptcs-textfield>
          </div>

          <!-- select all / clear selections -->
          <div part="multi-select" hidden\$="[[!_chunkerLength2]]">
            <ptcs-link part="link" variant="secondary" label="[[_multiSelectLabel(selectedIndexes.length, _chunkerLength)]]"
            disabled="[[disabled]]" on-click="_clickMultiSelect" tabindex\$="[[_delegatedFocus]]"
            exportparts\$="[[_exportLink]]"></ptcs-link>
          </div>

          <!-- the list items -->
          <ptcs-v-scroller part="list-items-container" id="chunker" num-items="[[_chunkerLength2]]" on-dblclick="_dblClick"
            tabindex\$="[[_delegatedFocus]]"></ptcs-v-scroller>

          <!-- Label displayed when the filter hides "everything" -->
          <div part="no-matches" hidden\$="[[_hideNoMatches(_chunkerLength2, noMatchesLabel)]]">
            <ptcs-label part="no-matches-label" variant="label" label="[[noMatchesLabel]]"
              disabled="[[disabled]]"></ptcs-label>
          </div>

        </div>`;
    }

    static get is() {
        return 'ptcs-list';
    }

    static get properties() {
        return {
            label: {
                type:  String,
                value: ''
            },

            // {type: 'text' | 'image' | 'checkbox'| 'html' | 'function' }; }
            // {type: 'link', target: link @target attribute}
            // Default: {type: 'text'}
            itemMeta: {
                type: Object
            },

            labelAlignment: { // 'left', 'center', 'right'
                type:               String,
                value:              'left',
                reflectToAttribute: true
            },

            labelType: { // 'header', 'sub-header', 'label', 'body'
                type:  String,
                value: 'label'
            },

            alignment: { // 'left', 'center', 'right'
                type:               String,
                value:              'left',
                reflectToAttribute: true,
                observer:           '_alignmentChanged'
            },

            // Items supplied by the client. Read-only
            items: {
                type:  Array,
                value: () => []
            },

            selectedItems: {
                type:   Array,
                notify: true
            },

            // Number of items that are visible in the list (read-only)
            _visibleItems: {
                type:   Number,
                notify: true
            },

            // Array of indexes to filtered items
            _itemsIndexFiltered: {
                type: Array
            },

            // Number of items visible in chunker
            _chunkerLength: {
                type:     Number,
                value:    0,
                observer: '_chunkerLengthChanged'
            },

            // Slowly tracks _chunkerLength, to avoid unnessecary v-scroller refreshs
            _chunkerLength2: {
                type:  Number,
                value: 0
            },

            // A Boolean (filter on/off) or a JS "array filter" function
            filter: {
                value: false
            },

            // Filter string entered in filter textfield
            filterString: {
                type:   String,
                value:  '',
                notify: true
            },

            // Current JS array filter function
            _filter: {
                type:     Function,
                computed: '_computeFilter(filter, filterString, _hidden)',
                observer: '_filterChanged'
            },

            // Allows the filter textfield to be hidden even when there is an active filter
            hideFilter: {
                type: Boolean
            },

            _hideList: {
                type:               Boolean,
                reflectToAttribute: true,
                computed:           '_computeHideList(noMatchesLabel, _visibleItems, hideEmptyList)'
            },

            hideEmptyList: {
                type: Boolean
            },

            // Selection
            multiSelect: {
                type:               Boolean,
                reflectToAttribute: true,
                observer:           '_multiSelectChanged'
            },

            //Radio button selection for single selection
            radioButtonSelection: {
                type:               Boolean,
                reflectToAttribute: true,
                observer:           '_radioButtonSelectionChanged'
            },
            // Indexes of selected items
            selectedIndexes: {
                type:   Array,
                notify: true,
                value:  () => []
            },

            // For validation
            _selectedIndexesLength: {
                type:     Number,
                validate: '_validateList(required, extraValidation)'
            },

            // Set of selected items, if multiSelect
            _selectedSet: {
                type: Set
            },

            // Value of selected item, if single selection mode
            selectedValue: {
                type:               String,
                reflectToAttribute: true,
                notify:             true,
                observer:           '_selectedValueChanged', // Only for informing _selectionMgr
            },

            // Index of selected object, if single selection mode
            selected: {
                type:     Number,
                notify:   true,
                value:    -1,
                observer: '_selectedChanged' // Only for informing _selectionMgr
            },

            // _selected = +selected (=> make sure it is a number)
            _selected: {
                type: Number
            },

            // Select label from item
            selector: {
                value:    null,
                observer: '_selectorChanged'
            },

            // Select value from item (defaults to selector)
            valueSelector: {
                value: null
            },

            // Select enabled / disabled mode from item
            stateSelector: {
                value:    null,
                observer: '_stateSelectorChanged'
            },

            // Select meta label from item
            metaSelector: {
                value:    null,
                observer: '_metaSelectorChanged'
            },

            treatValueAsString: {
                type:     Boolean,
                observer: '_updateReturnOriginalValue'
            },

            returnOriginalValue: {
                type:     Boolean,
                value:    false,
                observer: '_updateTreatValueAsString'
            },

            disabled: {
                type:               Boolean,
                reflectToAttribute: true,
                observer:           '_disabledChanged'
            },

            autoSelectFirstRow: {
                type:     Boolean,
                observer: '_autoSelectFirstRowChanged', // Only for informing _selectionMgr
            },

            multiLine: {
                type:     Boolean,
                value:    false,
                observer: '_multiLineChanged'
            },

            rowHeight: {
                type:     String,
                value:    '34',
                observer: '_rowHeightChanged'
            },

            allowNoItemSelection: {
                type:     Boolean,
                observer: '_allowNoItemSelectionChanged'
            },

            hintText: {
                type:  String,
                value: 'Filter'
            },

            noMatchesLabel: {
                type: String
            },

            clearSelectionLabel: {
                type:     String,
                observer: '_clearSelectionLabelChanged'
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

            createListItemAdditionalProperties: Function,

            // Tooltip data provided by list owner (like a dropdown) to be shown during list item truncation tooltip
            ownerTooltip: {
                type:     String,
                observer: '_ownerTooltipChanged'
            },

            ownerTooltipIcon: {
                type:     String,
                observer: '_ownerTooltipIconChanged'

            },

            // Validation properties
            required: {
                type:    Boolean,
                isValue: required => !!required
            },

            requiredMessage: {
                type: String
            },

            // ARIA attributes

            ariaDisabled: {
                type:               String,
                computed:           '_compute_ariaDisabled(disabled)',
                reflectToAttribute: true
            },

            ariaMultiselectable: {
                type:               String,
                computed:           '_compute_ariaMultiselectable(multiSelect)',
                reflectToAttribute: true
            },

            role: {
                type:               String,
                value:              'listbox',
                reflectToAttribute: true
            },

            _exportFilter: {
                type:     String,
                readOnly: true,
                value:    PTCS.exportparts('filter-field-', PTCS.Textfield)
            },

            _exportLink: {
                type:     String,
                readOnly: true,
                value:    PTCS.exportparts('link-', PTCS.Link)
            }
        };
    }

    static get observers() {
        return [
            '_itemsChanged(items.*)',
            '_itemMetaChanged(itemMeta.*)',
            '_valueSelectorChanged(valueSelector, treatValueAsString, selector)',
            '_selectedIndexesChanged(selectedIndexes.*)', // Only for informing _selectionMgr
            '_selectedItemsChanged(selectedItems.*)' // Only for informing _selectionMgr
        ];
    }

    constructor(...arg) {
        super(arg);
        // Default values, sometimes needed during initialization
        this._label = item => item || '';
        this._meta = () => '';
        this._value = () => undefined;
        this._disabled = () => false;
        this._hidden = null;
    }

    ready() {
        super.ready();
        this.$.chunker.createItemElement = (index, el) => this._createListItem(index, el);

        this._selectionMgr = new ListSelection();
        this._selectionMgr.valueOf = this._value;
        this._selectionMgr.bind(this, !this.silentSelectionInit);

        // If there is a current selection, process it
        if (Array.isArray(this.selectedItems) && this.selectedItems.length > 0) {
            this._updateSelection({selectedItems: this.selectedItems, selected: this.selected}, true);
        }

        this.addEventListener('click', ev => this._onClick(ev));

        // When the users interacts with the list
        const interacted = () => {
            this._userInteracted = true;
        };

        // All the ways that the user can interact with the list
        ['mousedown', 'keydown', 'touchstart'].forEach(evName =>
            this.$['list-container'].addEventListener(evName, interacted, {capture: true}));

        this.addEventListener('validity-changed', () => {
            this._chunkerLengthChanged(this._chunkerLength);
            this._refreshChunker();
            this.$.chunker.focusedItemIndex = this._itemIndexToViewIndex(this._selected);
        });

        // Show the validation message when we lose focus
        this.addEventListener('blur', () => {
            if (this._userInteracted) {
                this._stayUnvalidated = false;
            }
        });

        if (this._stayUnvalidated === undefined) {
            this._stayUnvalidated = true;
        }
    }

    // Callback from _selectionMgr
    _updateSelection(change, noUpdate) {
        if (this.multiSelect) {
            if (change.hasOwnProperty('selectedItems')) {
                this._selectedSet = new Set(change.selectedItems);
            }
            this.reFilter();
            requestAnimationFrame(() => this._refreshSelection());
        } else {
            this._selectedSet = undefined;
            if (change.hasOwnProperty('selected')) {
                const old = this._selected;
                switch (change.selected) {
                    case undefined:
                    case '':
                    case false:
                    case true:
                    case null:
                        this._selected = -1;
                        break;

                    default: {
                        const _selected = +change.selected;
                        this._selected = _selected >= 0 ? _selected : -1;
                    }
                }
                if (old !== this._selected) {
                    const unfiltered = ix => this._filter && ix >= 0 && !this._filter(this.items[ix], ix);
                    if (unfiltered(old) || unfiltered(this._selected)) {
                        this.reFilter();
                    }

                    requestAnimationFrame(() => {
                        if (old >= 0) {
                            this._refreshIndex(old);
                        }
                        if (this._selected >= 0) {
                            this._refreshIndex(this._selected);
                            this.scrollToIndex(this._selected);
                        }
                    });

                    // Change keyboard focus indicator
                    if (0 <= this._selected && this._selected < this.items.length) {
                        this.$.chunker.performUpdate();
                        this.$.chunker.focusedItemIndex = this._itemIndexToViewIndex(this._selected);
                    }
                }
            }
        }
        if (!noUpdate) {
            this.setProperties(change);
        }
    }

    resetFocus() {
        this.$.chunker.focusedItemIndex = 0;
    }

    resetFocusLast() {
        // Set the focus to the *last* item
        this.$.chunker.focusItem(this.$.chunker.numItems - 1);
    }

    resetMultiSelect() {
        this.unselectAll();
    }

    get list() {
        // Used by the dropdown to set the focus to the list object, not the filter or the 'Select All...'
        return this.$.chunker;
    }

    _refreshSelection() {
        const listItems = this.$.chunker.querySelectorAll('ptcs-list-item');
        for (let i = 0; i < listItems.length; i++) {
            const el = listItems[i];
            const selected = this.isSelectedIndex(+el.getAttribute('index'));
            const attr = el.hasAttribute('selected');
            if (selected !== attr) {
                if (selected) {
                    el.setAttribute('selected', '');
                } else {
                    el.removeAttribute('selected');
                }
            }
        }
    }

    isSelectedIndex(index) {
        return this._selectedSet ? this._selectedSet.has(this.items[index]) : index === this._selected;
    }

    isSelectedItem(item) {
        return this._selectedSet ? this._selectedSet.has(item) : this.items[this._selected] === item;
    }

    scrollToIndex(index) {
        if (this.__scrollActivated) {
            return;
        }
        this.__scrollActivated = true;
        requestAnimationFrame(() => {
            this.__scrollActivated = false;
            const ixView = this._itemIndexToViewIndex(index);
            if (ixView >= 0) {
                this.$.chunker.scrollTo(ixView);
            }
        });
    }

    reFilter(force) {
        if (this._filter || force) {
            this._filterChanged(this._filter);
        }
    }

    // Private functions
    _createUnselectItem(el) {
        // Create
        if (!el || !el.classList.contains('unselect-item')) {
            el = document.createElement('div');
            el.setAttribute('class', 'unselect-item');
            el.setAttribute('part', 'list-item');
            el.setAttribute('index', '-1');
            el.addEventListener('click', ev => this._clickUnselect(ev));
            PTCS.setbattr(el, 'disabled', this.disabled);

            const elValue = document.createElement('ptcs-div');
            elValue.setAttribute('part', 'item-value');
            PTCS.setbattr(elValue, 'disabled', this.disabled);

            const elLabel = document.createElement('ptcs-label');
            elLabel.setAttribute('variant', 'list-item');
            elLabel.style.width = '100%';

            elValue.appendChild(elLabel);
            el.appendChild(elValue);

            el.tooltipFunc = () => {
                if (typeof elLabel.tooltipFunc === 'function') {
                    return elLabel.tooltipFunc();
                }
                return '';
            };
            el.tooltipIcon = this.ownerTooltipIcon;
        }

        // Update
        el.firstChild.firstChild.setProperties({
            multiLine:           this.multiLine,
            label:               this.clearSelectionLabel || 'None',
            horizontalAlignment: this.alignment,
            tooltip:             this.ownerTooltip,
            tooltipIcon:         this.ownerTooltipIcon,
            disabled:            this.disabled
        });

        return el;
    }

    _updateUnselectItemDisabled() {
        const el = this.$.chunker.querySelector('.unselect-item');
        if (el) {
            const elValue = el.firstChild;
            const elLabel = elValue.firstChild;
            PTCS.setbattr(el, 'disabled', this.disabled);
            PTCS.setbattr(elValue, 'disabled', this.disabled);
            PTCS.setbattr(elLabel, 'disabled', this.disabled);
        }
    }

    _clearSelectionLabelChanged() {
        if (this.allowNoItemSelection) {
            // Only affects the first item
            this.$.chunker.refresh(0);
        }
    }

    _createValidationItem(el) {
        if (!el || !el.getAttribute('validation-item')) {
            el = document.createElement('div');
            PTCS.setbattr(el, 'validation-item', true);
            this._validationMessageEl.singleLine = true;
            el.addEventListener('mousedown', () => this.resetFocus());
            el.appendChild(this._validationMessageEl);
        }

        return el;
    }

    _createListItem(index, el) {
        if (this._validationAsListItem()) {
            if (index === 0) {
                return this._createValidationItem(el);
            }
            // Adjust index
            --index;
        }

        if (this.allowNoItemSelection) {
            if (index === 0) {
                return this._createUnselectItem(el);
            }
            // Adjust index
            --index;
        }

        const ix = this._filter ? this._itemsIndexFiltered[index] : index;
        const item = this.items[ix];

        // Create
        if (!el || el.tagName !== 'PTCS-LIST-ITEM') {
            el = document.createElement('ptcs-list-item');
            el.setAttribute('part', 'list-item');
            el.addEventListener('selected-changed', ev => this._onItemSelectedChanged(el, ev.detail.value));
            el.itemMeta = this.itemMeta;
        }

        // Update
        el.setAttribute('index', ix);
        el.setProperties({
            label:                this._label(item),
            labelMeta:            this._meta(item) || false,
            selected:             this.isSelectedIndex(ix),
            disabled:             this.disabled || this._disabled(item),
            multiSelect:          this.multiSelect,
            multiLine:            this.multiLine,
            alignment:            this.alignment,
            ownerTooltip:         this.ownerTooltip,
            ownerTooltipIcon:     this.ownerTooltipIcon,
            radioButtonSelection: this.radioButtonSelection
        });

        if (this.createListItemAdditionalProperties) {
            // Make sure that the item is initialized before sending it to createListItemAdditionalProperties
            if (typeof el._getItem === 'function') {
                el._getItem();
            }
            this.createListItemAdditionalProperties(el, item);
        }

        return el;
    }

    // Translate item index to scroller index
    _itemIndexToViewIndex(index) {
        if (this._filter) {
            // Remap index to filtered list
            index = this._itemsIndexFiltered.findIndex(i => i === index);
        }

        const validationAsListItem = this._validationAsListItem();

        if (validationAsListItem || this.allowNoItemSelection) {
            const extra = validationAsListItem && this.allowNoItemSelection ? 2 : 1;
            return index + extra;
        }
        return index;
    }

    // item[index] has changed. Reflect the change in the virtual scroller
    _refreshIndex(index) {
        if (this.__refreshChunkerOn) {
            return;
        }
        const ixView = this._itemIndexToViewIndex(index);
        if (ixView >= 0) {
            this.$.chunker.refresh(ixView);
        }
    }

    // Hide filter?
    _filterHidden(filter, hideFilter) {
        // If filter is falsy, then hide the list filter field - unless filter is a string
        return (!filter && filter !== '') || hideFilter;
    }

    _itemsChanged(cr) {
        switch (cr.path) {
            case 'items':
            case 'items.splices':
            case 'items.length':
                break;
            default: {
                // Has a property changed on an item?
                const m = /items\.(\d+)\..*/g.exec(cr.path);
                if (m) {
                    this._refreshIndex(+m[1]);
                } else {
                    return; // Ignore all other changes
                }
            }
        }

        this.reFilter(true);
        this._refreshChunker();

        if (this._selectionMgr) {
            this._selectionMgr.itemsChanged(cr);
        }

        // The items changed, so the list should now be considered as non yet interacted
        this._userInteracted = undefined;
        this._stayUnvalidated = true;
    }

    _itemMetaChanged(cr) {
        const list = this.$.chunker.querySelectorAll('ptcs-list-item');
        if (cr.path === 'itemMeta') {
            for (let i = list.length - 1; i >= 0; i--) {
                list[i].itemMeta = cr.value;
            }
        } else {
            for (let i = list.length - 1; i >= 0; i--) {
                list[i]._itemMetaChanged(cr);
            }
        }
    }

    _refreshChunker() {
        if (this.__refreshChunkerOn) {
            return;
        }
        this.__refreshChunkerOn = true;
        requestAnimationFrame(() => {
            if (this._waitOnChunkerLength || !this.__refreshChunkerOn) {
                // If the chunker length has changed, then make sure the chunker knows that before refreshing,
                // or if the refresh request has already been handled, don't do it again
                return;
            }
            this.$.chunker.refresh();
            this.__refreshChunkerOn = false;
        });
    }

    // The ptcs-list-item has changed its selection state (perhaps a user click?)
    _onItemSelectedChanged(el, selected) {
        const index = +el.getAttribute('index');
        if (this.isSelectedIndex(index) === (!!selected)) {
            return; // No change
        }

        if (this.multiSelect) {
            this.$.chunker.focusedItemIndex = this._itemIndexToViewIndex(index);
            if (selected) {
                this.push('selectedIndexes', index);
            } else {
                const i = this.selectedIndexes.findIndex(ix => ix === index);
                if (i >= 0) {
                    this.splice('selectedIndexes', i, 1);
                }
            }
        } else {
            this.selectedIndexes = selected ? [index] : [];
        }

        // Re-check tooltip
        // This function will almost always be caused by a user click, so we should
        // not have to worry about performance
        setTooltipByFocus(); // Clear cached entry
        setTooltipByFocus(el); // Retry with element
    }

    _chunkerLengthChanged(_chunkerLength, oldValue) {
        if (!this._waitOnChunkerLength) {
            this._waitOnChunkerLength = true;
            requestAnimationFrame(() => {
                this._waitOnChunkerLength = false;
                const validationAsListItem = this._validationAsListItem();
                if (validationAsListItem || this.allowNoItemSelection) {
                    // Add a validation message item first, and/or an "Unselect" item first, if there are any items to unselect
                    const extra = validationAsListItem && this.allowNoItemSelection ? 2 : 1;
                    this._chunkerLength2 = this._chunkerLength ? extra + this._chunkerLength : 0;
                } else {
                    this._chunkerLength2 = this._chunkerLength;
                }
                // Is there a pending chunker refresh?
                if (this.__refreshChunkerOn) {
                    this.$.chunker.refresh();
                    this.__refreshChunkerOn = false;
                }
            });
        }
        this._visibleItems = _chunkerLength;
    }

    // Public function
    selectItem(index, selectOnly, noscroll) {
        const item = this.items[index];
        if (!item) {
            return;
        }
        const selected = this.isSelectedIndex(index);

        if (selected) {
            if (selectOnly) {
                return; // Item is already selected
            }
            // Unselect the item
            if (this.multiSelect) {
                const ix = this.selectedIndexes.findIndex(i => i === index);
                if (ix >= 0) {
                    this.splice('selectedIndexes', index, 1);
                }
            } else {
                this.selectedIndexes = [];
            }
        } else if (this.multiSelect) {
            this.push('selectedIndexes', index);
        } else {
            this.selected = index;
        }

        if (selectOnly && !selected && !noscroll) {
            this.scrollToIndex(index);
        }
    }

    _multiSelectChanged(multiSelect) {
        // Transfer selected items between modes
        if (multiSelect) {
            if (this._selected >= 0) {
                this.reFilter();
            }
        } else if (this.selectedIndexes && this.selectedIndexes.length > 1) {
            this.reFilter();
        }
        this._refreshChunker();

        if (this._selectionMgr) {
            this._selectionMgr.multiSelect = multiSelect;
        }
    }

    _radioButtonSelectionChanged() {
        this._refreshChunker();
    }

    // Expose the function that creates list labels
    static labelFunc(selector, itemMeta) {
        let _label;

        if (!selector) {
            _label = item => item;
        } else if (typeof selector === 'string') {
            _label = item => item[selector];
        } else if (selector.constructor && selector.call && selector.apply) {
            _label = selector; // item => selector(item);
        } else {
            console.error('Invalid ptcs-list label selector', selector);
            _label = item => item;
        }

        if (!itemMeta || (itemMeta.type !== 'link' && itemMeta.type !== 'function')) {
            return item => {
                const retLabel = item ? _label(item) : '';
                if (retLabel === undefined || retLabel === null) {
                    return '';
                }
                return typeof retLabel !== 'string' ? retLabel.toString() : retLabel;
            };
        }
        return item => {
            const retLabel = item ? _label(item) : '';
            return (retLabel === undefined || retLabel === null) ? '' : retLabel;
        };
    }

    // Selectors: pulls information from the items
    _selectorChanged(selector) {
        this._label = PTCS.List.labelFunc(selector, this.itemMeta);
        this._refreshChunker();
    }

    static valueFunc(valueSelector, treatValueAsString, selector) {
        // Use label selector as default
        if (!valueSelector) {
            valueSelector = selector;
        }

        // Create selector function
        let _value;
        if (!valueSelector) {
            _value = item => item;
        } else if (typeof valueSelector === 'string') {
            _value = item => item[valueSelector];
        } else if (typeof valueSelector === 'function') {
            _value = valueSelector;
        } else {
            console.error('Invalid ptcs-list value selector', valueSelector);
            _value = item => item; // Fallback
        }

        if (treatValueAsString) {
            return item => {
                const retValue = item ? _value(item) : '';
                if (retValue === undefined || retValue === null) {
                    return '';
                }
                return typeof retValue === 'string' ? retValue : retValue.toString();
            };
        }
        return item => item !== undefined && item !== '' ? _value(item) : undefined;
    }

    _valueSelectorChanged(valueSelector, treatValueAsString, selector) {
        this._value = PTCS.List.valueFunc(valueSelector, treatValueAsString, selector);
        if (this._selectionMgr) {
            this._selectionMgr.valueOf = this._value;
        }
    }

    _stateSelectorChanged(stateSelector) {
        if (typeof stateSelector === 'string') {
            const _checkState = (stateToCheck) => {
                return item => {
                    if (!item) {
                        return false;
                    }
                    const state = item[stateSelector];
                    if (typeof state !== 'string') {
                        return false;
                    }
                    return state.toLowerCase() === stateToCheck;
                };
            };

            this._disabled = _checkState('disabled');
            this._hidden = _checkState('hidden');

        } else if (typeof stateSelector === 'function') {
            const _checkState = (stateToCheck) => {
                return item => {
                    if (!item) {
                        return false;
                    }
                    const state = stateSelector(item);
                    if (typeof state !== 'string') {
                        return false;
                    }
                    return state.toLowerCase() === stateToCheck;
                };
            };

            this._disabled = _checkState('disabled');
            this._hidden = _checkState('hidden');
        } else {
            this._disabled = () => false;
            this._hidden = null;
        }

        this._refreshChunker();
    }

    _metaSelectorChanged(metaSelector) {
        if (!metaSelector) {
            this._meta = () => '';
        } else {
            let _meta;
            if (typeof metaSelector === 'string') {
                _meta = item => item[metaSelector];
            } else if (metaSelector.constructor && metaSelector.call && metaSelector.apply) {
                _meta = metaSelector; // item => metaSelector(item);
            } else {
                console.error('Invalid ptcs-list metaSelector', metaSelector);
                _meta = () => '';
            }

            this._meta = item => {
                const retMeta = item ? _meta(item) : '';
                if (retMeta === undefined || retMeta === null) {
                    return '';
                }

                return typeof retMeta !== 'string' ? retMeta.toString() : retMeta;
            };
        }

        this._refreshChunker();
    }


    // Filtering
    _computeFilter(filter, filterString, _hidden) {
        const _shown = _hidden ? (item) => !_hidden(item) : null;
        if (filter === undefined || filter === null || filter === 0) {
            return _shown;
        }
        const q = (filterString || '').toLowerCase();
        if (!q) {
            return typeof filter === 'function' ? filter(filterString, (_shown ? _shown : () => true)) : _shown;
        }
        const f = _shown ? item => this._filterMatch(item, q) && _shown(item) : item => this._filterMatch(item, q);

        return typeof filter === 'function' ? filter(filterString, f) : f;
    }

    _filterMatch(item, fs) {
        if (this.isSelectedItem(item)) {
            return true;
        }

        const label = this._label(item);
        if (typeof label === 'string' && label.toLowerCase().indexOf(fs) >= 0) {
            return true;
        }

        const meta = this._meta(item);
        if (typeof meta === 'string' && meta.replace(/\s/g, '').toLowerCase().indexOf(fs) >= 0) {
            return true;
        }

        return false;
    }

    get topindex() {
        // Used by the dropdown in combobox mode to get the best "suggested" hit
        return this._itemsIndexFiltered.length > 0 ? this._itemsIndexFiltered[0] : -1;
    }

    _filterChanged(_filter) {
        if (_filter) {
            // Collect indexes to filtered items
            const filtered = [];
            for (let n = this.items.length, i = 0; i < n; i++) {
                if (_filter(this.items[i], i)) {
                    filtered.push(i);
                }
            }
            this._itemsIndexFiltered = filtered;
            this._chunkerLength = filtered.length;
        } else {
            this._chunkerLength = this.items.length;
            this._itemsIndexFiltered = [];
        }
        this._refreshChunker();
    }

    _rowHeightChanged(rowHeight) {
        const m = /^ *([0-9]+\.?[0-9]*)([a-zA-Z]*) *$/g.exec(rowHeight || '');

        if (!m) {
            this.updateStyles({'--ptcs-list-item--height': '34px'});
        } else {
            this.updateStyles({'--ptcs-list-item--height': m[1] + (m[2] || 'px')});
        }
    }

    _multiSelectLabel(numSel, numAll) {
        // Anything to select or unselect?
        if (!numAll) {
            return '';
        }

        // Only search list if anything is selected
        return numSel
            ? this.clearSelectedItemsLabel // At least one item is selected
            : this.selectAllLabel; // No displayed items are selected
    }

    _clickMultiSelect() {
        if (this.disabled || !this.items.length) {
            return;
        }
        if (this.selectedIndexes.length) {
            this.unselectAll();
        } else {
            this.selectAll();
        }

    }

    _clickUnselect() {
        if (this.disabled) {
            return;
        }
        this.unselectAll();
        this.$.chunker.focusedItemIndex = this._validationAsListItem() ? 1 : 0; // Move focus to unselect item
    }

    _selIx(ev, cb) {
        for (let el = ev.srcElement; el; el = el.parentNode) {
            const ix = el.getAttribute ? el.getAttribute('index') : null;

            if (ix) {
                const m = / *(-?[0-9]+) */g.exec(ix);

                if (m) {
                    cb(el, Number(m[1]));
                    break;
                }
            }
        }
    }

    _dblClick(ev) {
        if (this.disabled) {
            return;
        }

        this._selIx(ev, (el, ix) => {
            if (ix >= 0) {
                this.dispatchEvent(new CustomEvent('DoubleClicked', {
                    bubbles:  true,
                    composed: true,
                    detail:   {key: ix}
                }));
            }
        });
    }

    unselectAll() {
        if (!this.selectedIndexes || this.selectedIndexes.length === 0) {
            // No selections
            return; // Important: don't touch selectedIndexes if it has not been initialized
        }

        this.selectedIndexes = [];
    }

    selectAll() {
        if (this.items.length === 0 || !this.multiSelect) {
            return; // Nothing to select or invalid use
        }

        // Select all items
        this.selectedIndexes = this._filter ? this._itemsIndexFiltered.map(i => i) : this.items.map((_, index) => index);
    }

    refresh() {
        // If client needs a refresh
        this._refreshChunker();
    }


    _disabledChanged() {
        this._refreshChunker();
        this._updateUnselectItemDisabled();
    }

    _multiLineChanged() {
        this._refreshChunker();
    }

    _alignmentChanged() {
        this._refreshChunker();
    }

    _allowNoItemSelectionChanged() {
        this._chunkerLengthChanged(this._chunkerLength);
        this._refreshChunker();
    }

    _hideNoMatches(numitems, noMatchesLabel) {
        return numitems > 0 || !noMatchesLabel;
    }

    set freezeListHeight(freeze) {
        if (freeze) {
            const bb = this.$.chunker.getBoundingClientRect();
            this.$.chunker.style.height = `${bb.bottom - bb.top}px`;
        } else {
            this.$.chunker.style.height = '';
        }
    }

    //--------------------------------------------------------------------
    // Inform _selectionMgr about changed properties
    // This *should* have been done via Polymer Change Events, so we can turn on / off the observing
    // and give the whole responsiblility to the selectionMgr. Unfortunately, those events are not
    // always fired. I still don't know if this is a bug or a Polymer feature; I have not been able
    // to find any information about it. Therefore this kludge is necessary
    _selectedIndexesChanged(cr) {
        if (cr.value === undefined) {
            return;
        }
        if (this._userInteracted) {
            this._stayUnvalidated = this.selectedIndexes.length === 0;
        }
        this._selectedIndexesLength = this.selectedIndexes && this.selectedIndexes.length ? this.selectedIndexes.length : 0;
        if (this._selectionMgr) {
            this._selectionMgr.selectedIndexesChanged(cr);
        }
    }

    _selectedItemsChanged(cr) {
        if (cr.value === undefined) {
            return;
        }
        if (this._selectionMgr) {
            this._selectionMgr.selectedItemsChanged(cr);
        }
    }

    _selectedValueChanged(selectedValue) {
        if (selectedValue === undefined) {
            return;
        }
        if (this._selectionMgr) {
            this._selectionMgr.selectedValue = selectedValue;
        }
    }

    _selectedChanged(selected) {
        if (selected === undefined) {
            return;
        }
        if (this._selectionMgr) {
            this._selectionMgr.selected = selected;
        }
    }

    _autoSelectFirstRowChanged(autoSelectFirstRow) {
        if (autoSelectFirstRow === undefined) {
            return;
        }
        if (this._selectionMgr) {
            this._selectionMgr.autoSelectFirstRow = autoSelectFirstRow;
        }
    }

    _insertValidationMessage(messageElement) {
        const prevHeight = this.$.chunker.offsetHeight;
        this.shadowRoot.appendChild(messageElement);
        this._hasFixedHeight = this.$.chunker.offsetHeight < prevHeight;

        // In case there is a fixed height, insert the message as the first list-item
        if (this._hasFixedHeight) {
            this.shadowRoot.removeChild(messageElement);
            this._chunkerLengthChanged(this._chunkerLength);
            this._refreshChunker();
        }

        messageElement.setAttribute('pos', this._hasFixedHeight ? 'list-item' : 'bottom');
    }

    _computeHideList(noMatchesLabel, _visibleItems, hideEmptyList) {
        return !noMatchesLabel && !_visibleItems && hideEmptyList;
    }

    // ARIA attributes

    _compute_ariaDisabled(disabled) {
        return disabled ? 'true' : false;
    }

    _compute_ariaMultiselectable(multiSelect) {
        return multiSelect ? 'true' : false;
    }

    static get $parts() {
        if (!this._$parts) {
            this._$parts = [
                'label', 'list', 'list-item', 'multi-select', 'link', 'filter',
                'filter-field', 'icon-close', 'list-container', 'list-items-container',
                'item-checkbox', 'item-value', /*'state-value',*/ 'item-meta', 'item-radio',
                ...PTCS.partnames('filter-field-', PTCS.Textfield),
                ...PTCS.partnames('link-', PTCS.Link)
            ];
        }
        return this._$parts;
    }

    _ownerTooltipChanged(ownerTooltip) {
        const list = this.$.chunker.querySelectorAll('ptcs-list-item');
        if (list) {
            for (let i = list.length - 1; i >= 0; i--) {
                list[i].ownerTooltip = ownerTooltip;
            }
        }
    }

    _ownerTooltipIconChanged(ownerTooltipIcon) {
        const list = this.$.chunker.querySelectorAll('ptcs-list-item');
        if (list) {
            for (let i = list.length - 1; i >= 0; i--) {
                list[i].ownerTooltipIcon = ownerTooltipIcon;
            }
        }
    }

    _onClick(ev) {
        if (!this.disabled && !this.isIDE) {
            ev.preventDefault();
        }
    }

    _validateList(required, extraValidation, _selectedIndexesLength) {
        let messages = [];

        if (!required) {
            return undefined; // No internal validation enabled
        }

        if (_selectedIndexesLength === 0) {
            messages.push(this.requiredMessage);
            return messages;
        }

        return typeof extraValidation === 'function' ? extraValidation(this) : true;
    }

    _validationAsListItem() {
        return this._hasFixedHeight && this._showCurrentValidity();
    }

    _updateTreatValueAsString(v) {
        this.treatValueAsString = !v;
    }

    _updateReturnOriginalValue(v) {
        this.returnOriginalValue = !v;
    }
};

customElements.define(PTCS.List.is, PTCS.List);
