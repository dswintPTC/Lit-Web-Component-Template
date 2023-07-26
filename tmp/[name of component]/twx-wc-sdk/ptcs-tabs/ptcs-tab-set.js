import {PolymerElement, html} from '@polymer/polymer/polymer-element.js';
import {PTCS} from 'ptcs-library/library.js';
import './ptcs-tab.js';
import './ptcs-tabs.js';
import 'ptcs-page-select/ptcs-page-select.js';
import 'ptcs-behavior-styleable/ptcs-behavior-styleable.js';
import 'ptcs-behavior-focus/ptcs-behavior-focus.js';

PTCS.TabSet = class extends PTCS.BehaviorFocus(PTCS.BehaviorStyleable(PTCS.ThemableMixin(PolymerElement))) {
    static get template() {
        return html`
    <style>
        :host {
            display: flex;
            flex-direction: column;

            min-width: 168px;
            min-height: 36px;

            box-sizing: border-box;
            overflow: hidden;
        }
        [part="tabs-header"] {
            flex: none;
            overflow: hidden !important;
        }
        [part="pages"] {
            flex: auto;
        }

        [part="pages"].fixed {
            overflow: auto;
        }

        [part="divider"] {
            z-index: 12;
        }

        :host([disabled]) {
            pointer-events: none;
        }

        /* to override content-box definition in IDE mode (IE case) we have to generate rule with higher priority */
        ptcs-tabs, ptcs-tab {
            box-sizing: border-box;
        }

        /* Avoid scrollbar when focus border surronds overflow button */
        ptcs-tabs {
            padding-right: calc(1px + var(--ptcs-focus-overlay--border-width, 0px));
        }
    </style>

    <ptcs-tabs id="tabs-header" part="tabs-header" exportparts\$="[[_exportparts]]" orientation="horizontal"
               selected="{{selected}}" disabled\$="[[disabled]]"
               name-items="[[items]]" switch-tab-on-focus="[[switchTabOnFocus]]" style\$="height:[[_getTabNameHeight(tabNameHeight)]]">
        <template is="dom-repeat" items="[[items]]">
            <ptcs-tab part="tabs-tab" label-content="[[_text(item)]]" tab-number\$="[[_displayIndex(index)]]"
              hidden\$="[[_hidden(item)]]" disabled\$="[[_or(item.disabled, disabled)]]"
              style\$="height:[[_getTabNameHeight(tabNameHeight)]]" tabindex\$="[[_delegatedFocus]]">
              <ptcs-label part="tabs-tab-label" label="[[_text(item)]]" selected\$="[[_isTabSelected(index, selected)]]"
			  disabled\$="[[_or(item.disabled, disabled)]]" max-width="[[tabNameMaxWidth]]"></ptcs-label>
            </ptcs-tab>
        </template>
    </ptcs-tabs>
    <div part="divider" id="divider"></div>
    <ptcs-page-select id="pages" part="pages" selected="[[selected]]" disabled\$="[[disabled]]">
        <slot></slot>
    </ptcs-page-select>`;
    }

    static get is() {
        return 'ptcs-tab-set';
    }

    static get properties() {
        return {
            selected: {
                type:               Number,
                value:              0,
                notify:             true,
                reflectToAttribute: true,
                observer:           '_selectedChanged'
            },

            defaultTabNumber: {
                type:     Number,
                value:    1,
                observer: '_defaultTabNumber'
            },

            items: {
                type:     Array,
                value:    () => [],
                observer: '_itemsChanged'
            },

            tabHeight: {
                type:               Number,
                reflectToAttribute: true,
                observer:           '_heightChanged'
            },

            selectedTabValue: {
                type:     String,
                notify:   true,
                observer: '_selectedTabValueChanged'
            },

            disabled: {
                type:               Boolean,
                value:              false,
                reflectToAttribute: true
            },

            selectedTabName: {
                type:     String,
                notify:   true,
                observer: '_selectedTabNameChanged'
            },

            switchTabOnFocus: {
                type: Boolean
            },

            tabNameMaxWidth: {
                type:     Number,
                observer: '_tabNameMaxWidthChanged'
            },

            _exportparts: {
                type:     String,
                readOnly: true,
                value:    PTCS.exportparts('tabs-header-', PTCS.Tabs)
            },

            tabNameHeight: {
                type: Number
            },

            _delegatedFocus: {
                type:  String,
                value: null
            }
        };
    }

    ready() {
        super.ready();

        this.addEventListener('selected-changed', () => {
            // Verify if ptcs-tab-set contains nested ptcs-tab-set(s). Vaadin overflow computation may need refresh
            const nestedTabsets = this.querySelectorAll('ptcs-tab-set');
            nestedTabsets.forEach((tabset) => {
                const el = tabset.shadowRoot.querySelector('ptcs-tabs');
                if (el && el._updateOverflow && typeof el._updateOverflow === 'function') {
                    el._updateOverflow();
                }
            });
        });

        this.addEventListener('swap-tab', (ev) => {
            this.selected = ev.detail.selected;
            ev.stopPropagation();
        });
    }

    /**
 * overwritten from vaadin-list-mixin as the overflow model disallows the sideway scrolling
 * @param pixels
 * @private
 */
    _scroll(/*pixels*/) {
        return;
    }

    /**
 * this function is in use in ptcs-tab@tab-number attribute.itab-number is 1-based.
 * The same one-based indexis used in the slots: ptcs-mb-container@sub-widget
 * @param index
 * @returns {*}
 * @private
 */
    _displayIndex(index) {
        return index + 1;
    }

    _isTabSelected(index, selected) {
        return (selected === index);
    }

    _text(item) {
        if (item.name === null || item.name === '') {
            return '';
        }
        return item.name || String(item);
    }

    _hidden(item) {
        return item.visible === false;
    }

    _or(a, b) {
        return a || b;
    }

    _heightChanged(height) {
        if (height && height > 0) {
            this.$.pages.classList.add('fixed');
            this.$.pages.style.height = height + 'px';
        } else {
            this.$.pages.classList.remove('fixed');
            this.$.pages.style.height = null;
        }
    }

    _tabNameMaxWidthChanged() {
        // tabs.header needs to recompute the tab widths
        this.$['tabs-header'].refresh();
    }

    _selectedTabValueChanged(value) {
        this.selected = this.items.findIndex(item => item.value === value);
    }

    _selectedTabNameChanged(name) {
        this.selected = this.items.findIndex(item => (item.name || item) === name);
    }

    _selectedChanged(selected) {
        const selectedItem = selected >= 0 && this.items[selected];
        if (selectedItem) {
            this.selectedTabName = selectedItem.name || String(selectedItem);
            this.selectedTabValue = selectedItem.value;
        }
    }

    /**
 * one-based index for the default tab selection. when modified - it also updates current tab selection
 */
    _defaultTabNumber(newValue, oldValue) {
        if (newValue === oldValue) {
            return;
        }

        this.selected = newValue - 1;
    }

    _itemsChanged(items) {
        if (items && items.length) {
            if (this.selected > items.length - 1) {
                this.selected = items.length - 1;
            } else {
                // Make sure the new tab name and value are retrieved
                this._selectedChanged(this.selected);
            }
        }
    }

    _getTabNameHeight(tabNameHeight) {
        return tabNameHeight + 'px';
    }
};

customElements.define(PTCS.TabSet.is, PTCS.TabSet);
