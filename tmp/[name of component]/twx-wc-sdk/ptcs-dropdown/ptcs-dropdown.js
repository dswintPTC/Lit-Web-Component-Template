import {PolymerElement, html} from '@polymer/polymer/polymer-element.js';
import {PTCS} from 'ptcs-library/library.js';
import {ListSelection} from 'ptcs-list/list-selection.js';
import {createSubComponent} from 'ptcs-library/create-sub-component.js';
import '@polymer/polymer/lib/elements/dom-if.js';
import 'ptcs-hbar/ptcs-hbar.js';
import 'ptcs-label/ptcs-label.js';
import 'ptcs-button/ptcs-button.js';
import 'ptcs-list/ptcs-list.js';
import 'ptcs-icon/ptcs-icon.js';
import 'ptcs-icons/cds-icons.js';
import 'ptcs-behavior-styleable/ptcs-behavior-styleable.js';
import 'ptcs-behavior-focus/ptcs-behavior-focus.js';
import 'ptcs-behavior-tooltip/ptcs-behavior-tooltip.js';
import 'ptcs-behavior-validate/ptcs-behavior-validate.js';
import 'ptcs-behavior-tabindex/ptcs-behavior-tabindex.js';

const _listComponentConfig = `<ptcs-list part$="list" items="[[items]]" disabled="[[disabled]]"
multi-select="[[multiSelect]]" selected="{{selected}}" selected-indexes="{{selectedIndexes}}" selected-items="{{selectedItems}}"
selected-value="{{selectedValue}}" selector="[[selector]]" value-selector="[[valueSelector]]"
state-selector="[[stateSelector]]" treat-value-as-string="[[treatValueAsString]]" meta-selector="[[metaSelector]]"
alignment="[[alignment]]" auto-select-first-row="[[autoSelectFirstRow]]"
row-height="[[rowHeight]]" allow-no-item-selection="[[clearSelectionItem]]"
filter="[[filter]]" hint-text="[[filterHintText]]" tabindex$="[[_tabindex]]" _visible-items="{{_visibleItems}}"
clear-selection-label="[[clearSelectionLabel]]" item-meta="[[itemMeta]]"
owner-tooltip="[[tooltip]]" owner-tooltip-icon="[[tooltipIcon]]" no-matches-label="[[noMatchesLabel]]"
select-all-label="[[selectAllLabel]]" clear-selected-items-label="[[clearSelectedItemsLabel]]"
create-list-item-additional-properties="[[createListItemAdditionalProperties]]" is-dropdown$="true" hide-empty-list="[[comboboxMode]]">`;

PTCS.Dropdown = class extends PTCS.BehaviorTabindex(PTCS.BehaviorValidate(PTCS.BehaviorTooltip(PTCS.BehaviorFocus(
    PTCS.BehaviorStyleable(PTCS.ThemableMixin(PolymerElement)), ['open', 'closed'])))) {

    static get template() {
        return html`
    <style>
      :host {
        display: inline-flex;
        flex-direction: column;
        width: 100%;
      }

      :host([value-hide]) {
          width: auto;
      }

      [part=label] {
        flex: 0 0 auto;

        flex-shrink: 0;
      }

      [part=label][hidden] {
        display: none;
      }

      [part=select-box] {
        display: flex;
        flex-flow: row nowrap;
        place-content: center space-between;
        align-items: center;
        flex-grow: 1;
        box-sizing: border-box;
      }

      /* #select[part~=select-box] - added specifity for IE/Edge to be stronger than theme styling */
      :host([display-mode=small]) #select[part~=select-box] {
        min-height: unset;
        border-style: hidden;
        background-color: transparent;
      }

      :host(:not([label=""])) [part="label"] {
        display: inline-flex;
        padding-bottom: 4px;
      }

      /* value element */
      ptcs-list-item[part=list-item] {
        height: 100%;
        width: calc(100% - 18px);
      }

      [part~=selected-item-value] {
        grid-row: 1;
        grid-column: 2;
        -ms-grid-row: 1;
        -ms-grid-column: 2;
        align-self: center;
        overflow: hidden;
        max-width: 100%;
      }

      ptcs-label[variant=list-item] {
        max-width: 100%;
      }

      :host([alignment=left]) [part~=selected-item-value] {
        justify-self: start;
      }

      :host([alignment=center]) [part~=selected-item-value] {
        justify-self: center;
      }

      :host([alignment=right]) [part~=selected-item-value] {
        justify-self: end;
      }

      /* value first child - responsible for alignment */
      div[part=list-item] {
        max-width: 100%;
        height: 100%;
        display: flex;

        justify-content: flex-start; /* flex-start / center / flex-end */
        align-items: center; /* vertical alignment */
      }

      .img-dropdown {
        max-width: 100%;
      }

      /* CSS selector for ptcs-tabs dropdown implementation */
      ptcs-list-item[hidden]{
        display: none;
      }

      ptcs-list-item {
        display: grid;
        display: -ms-grid;

        grid-template-columns: auto minmax(0, 1fr);
        grid-template-rows: 1fr auto;

        -ms-grid-columns: auto 1fr;
        -ms-grid-rows: 1fr auto;

        overflow: hidden;
      }

      /* For IE and Edge that don't support align-self: center; or justify-self */
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

    </style>

    <ptcs-label id="label" part="label" label="[[label]]" hidden\$="[[_hideLabel(label)]]"
	multi-line="" horizontal-alignment="[[labelAlignment]]" disable-tooltip></ptcs-label>

    <ptcs-div id="select" part="select-box" display-mode\$="[[displayMode]]" state-key\$="[[_stateKey(_selectedIndexesLength)]]">
      <ptcs-list-item id="item" part="list-item" disabled="[[disabled]]" disable-tooltip item-value="selected-item-value"
        label="[[_value]]" item-meta="[[_itemType]]" alignment="[[alignment]]" hint="[[hintText]]" hidden$="[[valueHide]]"></ptcs-list-item>
    </ptcs-div>`;

    /* NOTE: _initList() creates this element
    <ptcs-list part="list" items="[[items]]" disabled="[[disabled]]"
	multi-select="[[multiSelect]]" selected="{{selected}}" selected-indexes="{{selectedIndexes}}" selected-items="{{selectedItems}}"
	selected-value="{{selectedValue}}" selector="[[selector]]" value-selector="[[valueSelector]]"
	state-selector="[[stateSelector]]" treat-value-as-string="[[treatValueAsString]]" meta-selector="[[metaSelector]]"
	alignment="[[alignment]]" auto-select-first-row="[[autoSelectFirstRow]]"
    row-height="[[rowHeight]]" allow-no-item-selection="[[clearSelectionItem]]"
    filter="[[filter]]" hint-text="[[filterHintText]]" tabindex\$="[[tabindex]]"
    clear-selection-label="[[clearSelectionLabel]]" item-meta="[[itemMeta]]"
    select-all-label="[[selectAllLabel]]" clear-selected-items-label="[[clearSelectedItemsLabel]]"
    create-list-item-additional-properties="[[createListItemAdditionalProperties]]">
    </ptcs-list>`;
    */
    }

    static get is() {
        return 'ptcs-dropdown';
    }

    static get properties() {
        return {
            displayMode: {
                type:     String,
                value:    'default',
                observer: '_displayModeChanged'
            },

            items: {
                type:  Array,
                value: () => []
            },

            noMatchesLabel: {
                type: String
            },

            selectedItems: {
                type:   Array,
                value:  () => [],
                notify: true
            },

            _visibleItems: {
                type:     Number,
                observer: '_visibleItemsChanged'
            },

            hintText: {
                type:               String,
                value:              '',
                reflectToAttribute: true
            },

            // Should the 'filter' option of the list be activated?
            filter: {
                value: false
            },

            // Hint text of the *filter* (the dropdown has a separate one)
            filterHintText: {
                type:  String,
                value: 'Filter'
            },

            // Flag set when the dropdown is used within a combobox (this makes slight changes to things
            // like the focus and shrinking the dropdown list when shown above the dropdown)
            comboboxMode: {
                type:  Boolean,
                value: false
            },

            clearSelectionLabel: {
                type:               String,
                value:              '',
                reflectToAttribute: true
            },

            clearSelectionItem: {
                type:  Boolean,
                value: false
            },

            itemMeta: {
                type:  Object,
                value: {type: 'text'}
            },

            icon: {
                type: String
            },

            _itemType: {
                type:     String,
                computed: '_computeItemType(itemMeta.*, selectedIndexes.length)'
            },

            _value: {
                type: String
            },

            _list: {
                type: Object
            },

            _listBody: {
                type: Object
            },

            _listId: {
                type: String
            },

            _labelFunc: {
                type: Function
            },

            label: {
                type:               String,
                value:              '',
                reflectToAttribute: true,
                defaultValue:       ''
            },

            labelAlignment: { // 'left', 'center', 'right'
                type:               String,
                value:              'left',
                reflectToAttribute: true
            },

            alignment: { // 'left', 'center', 'right'
                type:               String,
                value:              'left',
                reflectToAttribute: true
            },

            valueHide: {
                type:               Boolean,
                value:              false,
                reflectToAttribute: true
            },

            disabled: {
                type:               Boolean,
                value:              false,
                reflectToAttribute: true,
                observer:           '_reflect_disabled_to_small_button'
            },

            // 'closed' || 'open'
            mode: {
                type:     String,
                value:    'closed',
                observer: '_modeChanged',
                notify:   true
            },

            multiSelect: {
                type:     Boolean, // undefined, "single", "multiple"
                value:    false,
                observer: '_multiSelectChanged' // Only for informing _selectionMgr
            },

            selectedIndexes: {
                type:   Array,
                notify: true,
                value:  () => []
            },

            // For validation
            _selectedIndexesLength: {
                type:     Number,
                validate: '_validateDropdown(required, extraValidation)'
            },

            selected: {
                type:     Number,
                notify:   true,
                observer: '_selectedChanged' // Only for informing _selectionMgr
            },

            selectedValue: {
                type:     String,
                notify:   true,
                observer: '_selectedValueChanged',
                validate: '_validateSelectedValue(extraValidation)'
            },

            selector: {
                value: null
            },

            valueSelector: {
                value: null
            },

            stateSelector: {
                value: null
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

            metaSelector: {
                value: null
            },

            autoSelectFirstRow: {
                type:     Boolean,
                value:    false,
                observer: '_autoSelectFirstRowChanged' // Only for informing _selectionMgr
            },

            rowHeight: {
                type:  String,
                value: '34'
            },

            maxListHeight: {
                type: Number
            },

            listMaxWidth: {
                type:  Number,
                value: 330
            },

            _tabindex: {
                type:     String,
                computed: '_computeTabindex(tabindex)'
            },

            selectAllLabel: {
                type:  String,
                value: 'Select All'
            },

            clearSelectedItemsLabel: {
                type:  String,
                value: 'Clear Selected Items'
            },

            allLabel: {
                type:  String,
                value: 'All'
            },

            selectedLabel: {
                type:  String,
                value: 'Selected'
            },

            listMarginTop: {
                type:  Number,
                value: 8
            },

            // Handles its own focus styling - no need for FocusBehavior to track its position
            _ownFocusStyling: {
                type:     Boolean,
                value:    true,
                readOnly: true
            },

            createListItemAdditionalProperties: Function,

            // To override the default dropdown list position (mainly an ad hoc adjustment for ptcs-tabs for now)
            customListPosRect: {
                type: Object
            },

            // Validation properties
            required: {
                type:    Boolean,
                isValue: required => !!required
            },

            requiredMessage: {
                type: String
            }
        };
    }

    static get observers() {
        return [
            '_updateSelectedStateForSmallButton(displayMode, mode)',
            '_createLabelFunc(selector, itemMeta)',
            '_createValueFunc(valueSelector, treatValueAsString, selector)',
            '_computeValue(hintText, selectedIndexes.length, selectedIndexes.0)',
            '_itemsChanged(items.*)',
            '_selectedIndexesChanged(selectedIndexes.*)',
            '_selectedItemsChanged(selectedItems.*)'
        ];
    }

    constructor() {
        super();
        this._selectionMgr = new ListSelection();
    }

    ready() {
        super.ready();
        this.$.select.addEventListener('click', () => this._onClick());
        this.tooltipFunc = this._monitorTooltip.bind(this);
        this.addEventListener('focus', this._showTooltip);
        this.addEventListener('blur', this._tooltipClose);
        this._trackFocus(this, this.$.select);
        this.addEventListener('keydown', ev => {
            switch (ev.key) {
                case ' ':
                case 'ArrowDown':
                case 'Enter':
                    this.$.select.click();
                    ev.preventDefault();
            }
        });
        this._selectionMgr.bind(this);

        if (this._stayUnvalidated === undefined) {
            this._stayUnvalidated = true;
        }
    }

    connectedCallback() {
        super.connectedCallback();
        if (this._list) {
            this._attachList();
        }
    }

    disconnectedCallback() {
        // Remove the dropdown list
        if (this._list && this._list.parentNode) {
            document.body.removeChild(this._list);
        }
        super.disconnectedCallback();
    }

    // Called by the combobox to access the list object
    createPopupList() {
        if (!this._list) {
            this._initList();
        }
        return this._list;
    }

    resetFocus() {
        if (this._list !== undefined) {
            this._list.resetFocus();
        }
    }

    resetMultiSelect() {
        if (this._list !== undefined) {
            this._list.resetMultiSelect();
        } else {
            this.selectedIndexes = [];
        }
    }

    _attachList() {
        if (this._list.parentElement) {
            // The list is already at place
            return;
        }
        this._list.__saSa = this.__saSa;
        document.body.appendChild(this._list);
    }

    _selectedValueChanged(selectedValue, oldValue) {
        if (arguments.length > 1) {
            // Polymer observer has been triggered - selectedValue was changed and it is different from the oldValue
            if ((selectedValue === undefined || selectedValue === '') && (oldValue === undefined || oldValue === '')) {
                // no real change in the selected value
            } else {
                this.dispatchEvent(new CustomEvent('SelectedValueChanged', {
                    bubbles: true
                }));
            }
        }

        if (selectedValue === undefined) {
            return;
        }
        const selectedIndexesLength = this.selectedIndexes ? this.selectedIndexes.length : 0;
        const selectedIndexes_0 = this.selectedIndexes ? this.selectedIndexes[0] : 0;
        this._selectedIndexesLength = selectedIndexesLength;

        this._computeValue(this.hintText, selectedIndexesLength, selectedIndexes_0);

        if (this._selectionMgr) {
            this._selectionMgr.selectedValue = selectedValue;
        }
    }

    _displayModeChanged(displayMode) {
        let el = this.shadowRoot.getElementById('icon');
        if (el) {
            this.$.select.removeChild(el);
        }

        if (displayMode === 'small') {
            el = document.createElement('ptcs-button');
            el.setAttribute('mode', 'icon');
            el.setAttribute('variant', 'small');
            el.setAttribute('exportparts', PTCS.exportparts('icon-', PTCS.Button));
            // remove default tabindex
            el.noTabindex = true;
        } else {
            // 'default'
            el = document.createElement('ptcs-icon');
        }
        if (this.icon) {
            el.setAttribute('icon', this.icon);
        } else {
            el.setAttribute('icon', 'cds:icon_chevron_right_mini');
        }
        el.setAttribute('exportparts', PTCS.exportparts('icon-', PTCS.Icon));
        el.setAttribute('part', 'icon');
        el.setAttribute('id', 'icon');

        this.$.select.appendChild(el);

        if (!this.icon) {
            el.performUpdate();
            switch (el.tagName) {
                case 'PTCS-BUTTON': el.shadowRoot.querySelector('ptcs-icon').style.transform = 'rotate(90deg)'; break;
                case 'PTCS-ICON': el.style.transform = 'rotate(90deg)'; break;
            }
        }
    }

    _reflect_disabled_to_small_button(disabled) {
        let el = this.shadowRoot.getElementById('icon');
        if (el) {
            el.disabled = disabled;
        }
    }

    _updateSelectedStateForSmallButton(displayMode, mode) {
        let el = this.shadowRoot.getElementById('icon');

        if (!el) {
            return;
        }

        if (displayMode === 'small' && mode === 'open') {
            el.setAttribute('selected', '');
        } else {
            el.removeAttribute('selected');
        }
    }

    _computeItemType(cr, selectedIndexes_length) {
        if (selectedIndexes_length !== 1) {
            return {type: 'text'};
        }

        return cr.base;
    }

    _createLabelFunc(selector, itemMeta) {
        this._labelFunc = PTCS.List.labelFunc(selector, itemMeta);
    }

    _createValueFunc(valueSelector, treatValueAsString, selector) {
        if (this._selectionMgr) {
            this._selectionMgr.valueOf = PTCS.List.valueFunc(valueSelector, treatValueAsString, selector);
        }
    }

    _computeValue(hintText, selectedIndexes_length, selectedIndexes_0) {
        if (this.selectedIndexes === undefined) {
            return;
        }

        const f = () => {
            if (!selectedIndexes_length) {
                // Nothing is selected
                return hintText || '';
            }
            if (selectedIndexes_length === 1) {
                if (!this._labelFunc) {
                    this._createLabelFunc(this.selector, this.itemMeta);
                }
                return this._labelFunc(this.items[selectedIndexes_0]);
            }

            return selectedIndexes_length !== this.items.length
                ? `${selectedIndexes_length} ${this.selectedLabel}`
                : `${this.allLabel} ${this.selectedLabel}`;
        };
        this._value = f();
    }

    _hideLabel(label) {
        return !label;
    }

    _modeChanged(mode) {
        if (mode === 'open') {
            this.setAttribute('open', '');
            this.removeAttribute('closed');
            this._showList();
        } else {
            this.setAttribute('closed', '');
            this.removeAttribute('open');
            if (this._list) {
                this._hideList();

                // Inform client that the dropdown list closed
                requestAnimationFrame(() => {
                    this.dispatchEvent(new CustomEvent('dropdown-closed', {
                        bubbles:  false,
                        composed: false,
                        detail:   this.selectedValue
                    }));
                });
            }
        }
    }

    _getFirstSubFocusable(cntr) {
        for (let el = cntr.firstChild; el; el = el.nextSibling) {
            if (el.tabIndex >= 0) {
                const br = el.getBoundingClientRect();
                if (br.width || br.height) {
                    return el;
                }
            }
            let el2 = this._getFirstSubFocusable(el);
            if (el2) {
                return el2;
            }
        }
        return null;
    }


    // _list usage
    _showList() {
        // Make sure we have a list
        if (!this._list) {
            this._initList();
        }
        if (this._list) {
            this._attachList();
        }
        // No restriction on the list body
        this._listBody.maxHeight = '';

        // Default list dimensions according to visual design - width: 330px, height: 571px
        // The max-height depends on if the list shows a filter and/or a multi-select
        // select-all option. A proper support for that would be complex. Subtracting 34px
        // for each such option is _hopefully_ a acceptable fallback for now. Subtracting
        // 24px from max-with is mainly for handling scrollbars
        const _list = this._list;
        const box = this.$.select.getBoundingClientRect();
        const above = box.top;
        const below = window.innerHeight - box.bottom;
        const extra = 4 + this.listMarginTop + (_list.multiSelect ? 34 : 0) + (_list.filter && !_list.hideFilter ? 34 : 0);
        const maxHeight = Math.min(Math.max(above, below) - extra, this.maxListHeight > 0 ? this.maxListHeight : 571);
        const maxWidth = Math.min(window.innerWidth - 24, Math.max(this.listMaxWidth, box.width));

        this._listBody.style.maxHeight = `${maxHeight}px`;

        _list.style.maxWidth = `${maxWidth}px`;
        _list.style.minWidth = `${Math.min(maxWidth, this.offsetWidth)}px`;
        _list.style.visibility = 'hidden'; // prevent list from displaying before it's ready
        _list.style.display = 'block'; // replace 'none' by 'block' - it becomes all dimensions to be normal
        if (!this.comboboxMode) {
            _list.style.width = '';
        }
        _list.style.left = '0'; // Avoid scrollbar jump
        _list.style.top = '0';

        // Need to wait a few animation frames for the list to stabilize (100ms ~ 6 animation frames)
        setTimeout(() => {
            this._list.style.visibility = ''; // show list in proper place

            const dim = this._get_dimension();
            this._set_list_position(dim); // set list position

            if (this.mode === 'open') {
                if (!this._close_ev) {
                    // Close the dropdown if the user clicks anywhere outside of it
                    this._close_ev = () => {
                        if (document.activeElement === this._list) {
                            if (!this.comboboxMode) {
                                this.focus();
                            }
                        }
                        this.mode = 'closed';
                    };
                    if (!PTCS.isAndroid) {
                        window.addEventListener('resize', this._close_ev);
                    }
                    document.addEventListener('mousedown', this._close_ev);
                }
                if (!this._keydown_ev) {
                    // Close the dropdown if the user presses TAB, ENTER or ESC
                    this._keydown_ev = ev => {
                        switch (ev.key) {
                            case 'Enter':
                            case 'Escape':
                                ev.preventDefault();
                                this.mode = 'closed';
                                if (!this.comboboxMode) {
                                    this.focus();
                                }
                                break;
                            case 'Tab': {
                                const root = this._list.shadowRoot;
                                const elem = ev.shiftKey
                                    ? this._getFirstSubFocusable(root)
                                    : root.querySelector('[part=list-items-container]');
                                if (root.activeElement === elem) {
                                    this.mode = 'closed';
                                    if (!this.comboboxMode) {
                                        this.focus();
                                    }
                                    ev.preventDefault();
                                }
                            }
                        }
                    };

                    this._list.addEventListener('keydown', this._keydown_ev);
                }
                // Close single selection lists if user makes a selection
                if (!this.multiSelect && !this._singleSelect_ev) {
                    this._singleSelect_ev = () => {
                        this.mode = 'closed';
                        if (!this.comboboxMode) {
                            this.focus();
                        }
                    };
                    this._list.addEventListener('selected-changed', this._singleSelect_ev);
                }

                if (this.selected >= 0 && !this.comboboxMode) {
                    this._list.scrollToIndex(this.selected);
                }

                // We should initially focus on the list items (the 'list' accessor on the list returns this
                // object), unless we are in "combobox" mode, in which case the focus should remain with the
                // text field
                if (!this.comboboxMode) {
                    this._list.focus();
                }
            }

            // Keep track of list position
            this.track_position(dim);

            this._stayUnvalidated = true; // Open list in unvalidated state
        }, 100);
    }

    _hideList() {
        if (this._close_ev) {
            document.removeEventListener('mousedown', this._close_ev);
            window.removeEventListener('resize', this._close_ev);
            this._close_ev = null;
        }
        if (this._keydown_ev) {
            this._list.removeEventListener('keydown', this._keydown_ev);
            this._keydown_ev = null;
        }
        if (this._singleSelect_ev) {
            this._list.removeEventListener('selected-changed', this._singleSelect_ev);
            this._singleSelect_ev = null;
        }

        this._list.style.display = 'none';
        if (!this.comboboxMode) {
            this._list.style.width = '';
        }
        this._list.style.top = '';
        this._list.style.left = '';
        this._list.freezeListHeight = false;

        // Reset filter string when closing popup
        this._list.filterString = '';
        if (this._list) {
            this._list.remove();
        }

        this._stayUnvalidated = false; // Validate when list is closed
    }

    // _list usage
    _initList() {
        console.assert(!this._list);
        console.assert(this._selectionMgr);

        // Thanks and goodbye to the selection mananger
        // This task will now be handled by the popup list
        this._selectionMgr.unbind(this);
        this._selectionMgr = undefined;

        // Create popup list
        this._list = createSubComponent(this, _listComponentConfig);
        this._list.silentSelectionInit = true; // Don't re-notify selection manager settings
        this._attachList();

        // It is smelly to access internal parts in ptcs-list, but ...
        this._listBody = this._list.shadowRoot.querySelector('[part=list-items-container]');
        console.assert(this._listBody);

        this.setExternalComponentId();

        // update css rules of the list
        this._list.style.position = 'absolute';
        this._list.style.zIndex = '99996';
        this._list.style.boxSizing = 'border-box';
        this._list.style.cursor = 'pointer';

        // add 2 css rules for just created list. put these rules as a first <style> child so later added rules were able
        // to override them
        let style = document.createElement('style');
        style.appendChild(document.createTextNode('[part=list-container] { background: #ffffff; box-sizing: border-box; '));
        style.appendChild(document.createTextNode('[part=list-item] { box-sizing: border-box; padding-left: 8px; padding-right: 8px; }'));
        this._list.shadowRoot.insertBefore(style, this._list.shadowRoot.firstChild);

        let filterElt = this._list.shadowRoot.querySelector('[part=filter]');

        if (filterElt) {
            filterElt.addEventListener('click', (e) => {
                e.cancelBubble = true;
            });
        }

        this._list.addEventListener('click', (e) => {
            if (!this.multiSelect) {
                this.mode = 'closed';
                if (!this.comboboxMode) {
                    this.focus();
                }
            }
            e.stopImmediatePropagation();
        });

        this._list.addEventListener('mousedown', (e) => {
            e.cancelBubble = true;
        });
    }

    _get_dimension() {
        return {
            dd:           this.getBoundingClientRect(),
            // Get window dimension
            windowWidth:  window.innerWidth,
            windowHeight: window.innerHeight,
            // Get current scroll offset
            scrollDx:     document.documentElement.scrollLeft + document.body.scrollLeft,
            scrollDy:     document.documentElement.scrollTop + document.body.scrollTop,
            // Where is the dropdown box?
            box:          this.$.select.getBoundingClientRect()
        };
    }

    _diff_dimension(r1, r2) {
        if (r1.windowWidth !== r2.windowWidth || r1.windowHeight !== r2.windowHeight) {
            return true;
        }
        if (r1.scrollDx !== r2.scrollDx || r1.scrollDy !== r2.scrollDy) {
            return true;
        }
        if (r1.box.width !== r2.box.width || r1.box.bottom !== r2.box.bottom || r1.box.left !== r2.box.left) {
            return true;
        }

        return false;
    }

    _set_list_position(r) {
        const dw = (!this._list.style.width && PTCS.isFirefox) ? PTCS.getVerticalScrollbarWidth(this._listBody) : 0;
        const bbList = this._list.getBoundingClientRect();
        const smallModeAllignemt = this.displayMode === 'small' ? 8 : 0;
        let x;
        if (r.windowWidth - r.box.left - bbList.width > 0) {
            x = r.box.left;
        } else if (r.windowWidth > r.box.right && r.box.right - smallModeAllignemt - bbList.width > 0) {
            x = r.box.right - smallModeAllignemt - bbList.width;
        } else if (r.windowWidth - bbList.width - dw - 24 > 0) {
            x = r.windowWidth - bbList.width - dw - 24;
        } else {
            x = 2;
        }
        let y = this._noSpaceForMessage ? r.dd.bottom : r.box.bottom + this.listMarginTop;
        if (y + bbList.height >= r.windowHeight) {
            // Show popup list above dropdown instead
            y = Math.max(r.box.top - this.listMarginTop - bbList.height, 2);
            if (this.comboboxMode) {
                // TW-96675 The popup list height should shrink to fit when displayed above the dropdown
                this._listBody.style.height = '';
            } else {
                // TW-87200 When the popup list is displayed above the dropdown value box and is filtered, the list should retain its height.
                this._list.freezeListHeight = true;
            }
        }

        // Set list position
        if (this.customListPosRect) {
            // Dropdown invoked with custom positioning (e.g. ptcs-tabs, ptcs-breadcrumb, ptcs-combobox), may need to be refined for more use cases
            if (this.customListPosRect.left > 0) {
                this._list.style.left = `${this.customListPosRect.left}px`;
            } else {
                this._list.style.left = `${r.scrollDx + this.customListPosRect.right - bbList.width}px`;
            }
            this._list.style.top = `${r.scrollDy + Math.min(this.customListPosRect.top + this.customListPosRect.height, y)}px`;
        } else {
            this._list.style.left = `${r.scrollDx + x}px`;
            this._list.style.top = `${r.scrollDy + y}px`;
        }

        // Freeze list width?
        if (!this._list.style.width) {
            // adding 0.1px, fixing minor delta calculation between list and v-scroller
            this._list.style.width = `${bbList.width + dw + 0.1}px`;
        }
    }

    _isHidden() {
        return !(this.offsetWidth || this.offsetHeight || this.getClientRects().length);
    }

    // Keep track of list position, if the droplist box is moved or the view is scrolled
    track_position(rOld) {
        if (this.mode === 'open') {
            if (this._isHidden()) {
                this.mode = 'closed';
            } else {
                const rNew = this._get_dimension();
                if (this._diff_dimension(rOld, rNew)) {
                    if (rNew.box.bottom < 0 || rNew.box.top > rNew.windowHeight) {
                        // The dropdown anchor has been scrolled out of sight. Close the popup
                        this.mode = 'closed';
                        return;
                    }
                    this._set_list_position(rNew);
                }

                // Take a fresh look at things in 0.2 seconds
                setTimeout(() => this.track_position(rNew), 200);
            }
        }
    }

    _onClick() {
        if (this.disabled || !this.items || this.items.length === 0) {
            return;
        }
        this.mode = (this.mode === 'open' ? 'closed' : 'open');
    }

    _monitorTooltip() { // Implements ptcs-dropdown's tooltip behavior on label truncation
        const el = this.shadowRoot.querySelector('[part~=selected-item-value]').querySelector('ptcs-label');
        if (el && el.isTruncated()) { // Truncated label to be used as tooltip?
            if (!this.selectedIndexes.length) {
                // Nothing is selected, label is the hinttext
                if (this.tooltip && this.tooltip !== this.hintText) {
                    return el.label + '\n\n' + this.tooltip;
                }
            } else if (this.tooltip && this.tooltip !== this.label) {
                return el.label + '\n\n' + this.tooltip;
            }
            return el.label;
        }
        // No truncation
        if (!this.selectedIndexes.length && this.tooltip && this.tooltip === this.hintText) {
            return ''; // No selection: Don't show tooltip if same as hint text
        }
        if (this.tooltip === this.label) {
            return ''; // Don't show tooltip if same as label
        }
        return this.tooltip || ''; // No label truncation, but possibly dropdown's own tooltip
    }

    _showTooltip(ev) {
        const tooltip = this.tooltipFunc;
        this._tooltipEnter(this, ev.clientX, ev.clientY, tooltip, {showAnyway: true});
    }

    getExternalComponentId() {
        return this._listId;
    }

    /*
     * Sets an id for external component
     */
    setExternalComponentId(id) {
        if (id) {
            this._listId = id;
        } else if (!this._listId) {
            this._listId = 'ptcs-dropdown-list-' + performance.now().toString().replace('.', '');
        }
        if (this._list) {
            this._list.setAttribute('id', this._listId);
        }
    }

    // Callback from _selectionMgr
    _updateSelection(change) {
        this.setProperties(change);
    }

    _itemsChanged(cr) {
        // If the item changes and the selectedValue remains unchanged, the selected label may still be different
        if (this.selectedValue !== undefined && this.selectedValue !== '') {
            const selectedValue = this.selectedValue;
            requestAnimationFrame(() => {
                if (selectedValue === this.selectedValue) {
                    this._selectedValueChanged(selectedValue);
                }
            });
        }
        if (this._selectionMgr) {
            this._selectionMgr.itemsChanged(cr);
        }
    }

    //--------------------------------------------------------------------
    // Inform _selectionMgr about changed properties
    // This *should* have been done via Polymer Change Events, so we can turn on / off the observing
    // and give the whole responsiblility to the selectionMgr. Unfortunately, those events are not
    // always fired. I still don't know if this is a bug or a Polymer feature; I have not been able
    // to find any information about it. Therefore this kludge is necessary
    _multiSelectChanged(multiSelect) {
        if (this._selectionMgr) {
            this._selectionMgr.multiSelect = multiSelect;
        }
    }

    _stateKey(_selectedIndexesLength) {
        return _selectedIndexesLength ? 'selected' : undefined;
    }

    _selectedIndexesChanged(cr) {
        if (cr.value === undefined) {
            return;
        }
        this._selectedIndexesLength = this.selectedIndexes && this.selectedIndexes.length ? this.selectedIndexes.length : 0;
        if (this._selectionMgr) {
            this._selectionMgr.selectedIndexesChanged(cr);
        }
        if (this.mode === 'open') {
            this._stayUnvalidated = this._selectedIndexesLength === 0; // Change to unvalidated state when no items are selected
        }

        // Update _depfield
        if (typeof this.createListItemAdditionalProperties === 'function') {
            this.$.select.__stateValueEl = this.$.item.__stateValueEl;
            this.createListItemAdditionalProperties(this.$.select, this._selectedIndexesLength === 1 && this.items[this.selectedIndexes[0]]);
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

    _computeTabindex(tabindex) {
        return tabindex && typeof tabindex === 'string' && '0';
    }

    reFilter() {
        if (this._list) {
            this._list.reFilter();
        }
    }

    _insertValidationMessage(messageElement) {
        this.defaultInsertValidationMessageForVerticalLayout(messageElement);
    }

    static get $parts() {
        if (!this._$parts) {
            this._$parts = [
                'label', 'select-box', 'list-item', 'selected-item-value', 'icon',
                ...PTCS.partnames('icon-', PTCS.Icon)
                //...PTCS.partnames('icon-', PTCS.Button) // Ignore this (for now). Keep parts list at resonable size
            ];
        }
        return this._$parts;
    }

    _validateDropdown(required, extraValidation, _selectedIndexesLength) {
        let messages = [];

        if (!required) {
            return undefined; // No internal validation enabled
        }

        if (required && _selectedIndexesLength === 0) {
            messages.push(this.requiredMessage);
        }

        if (messages.length) {
            return messages;
        }

        return typeof extraValidation === 'function' ? extraValidation(this) : true;
    }

    _validateSelectedValue(extraValidation) {
        return typeof extraValidation === 'function' ? extraValidation(this) : true;
    }

    _updateTreatValueAsString(v) {
        this.treatValueAsString = !v;
    }

    _updateReturnOriginalValue(v) {
        this.returnOriginalValue = !v;
    }

    _visibleItemsChanged(/*_visibleItems*/) {
        if (this.mode === 'open' && this.comboboxMode) {
            // Debounce _showList calls
            if (!this.__callShowList) {
                this.__callShowList = true;
                requestAnimationFrame(() => {
                    this.__callShowList = false;
                    this._showList();
                });
            }
        }
    }

};

customElements.define(PTCS.Dropdown.is, PTCS.Dropdown);
