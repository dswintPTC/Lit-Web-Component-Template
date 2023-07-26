import {PolymerElement, html} from '@polymer/polymer/polymer-element.js';
import {PTCS} from 'ptcs-library/library.js';
import 'ptcs-behavior-styleable/ptcs-behavior-styleable.js';
import 'ptcs-behavior-focus/ptcs-behavior-focus.js';
import 'ptcs-behavior-tooltip/ptcs-behavior-tooltip.js';
import 'ptcs-label/ptcs-label.js';
import './ptcs-menu-item.js';

PTCS.MenuSubmenu = class extends PTCS.BehaviorTooltip(PTCS.BehaviorFocus(PTCS.BehaviorStyleable(PTCS.ThemableMixin(PolymerElement)))) {
    static get template() {
        return html`
        <style>
            :host {
                display: inline-flex;
                flex-wrap: nowrap;

                min-width: 34px;
                min-height: 19px;

                box-sizing: border-box;

                white-space: nowrap;
                overflow: hidden;
                outline: none;
            }

            :host([hidden]) {
                display: none;
            }

            :host([disabled]) {
                cursor: default;
            }

            [part=root] {
                display: flex;
                width: 100%;
                flex-direction: column;
                justify-content: space-between;
            }

        </style>

        <ptcs-vbar id="root" part="root">
            <template id="body" is="dom-repeat" items="[[items]]">
                <ptcs-menu-item variant="[[variant]]" part="menu-item" text="[[item.label]]" compact-mode="[[compactMode]]"
                    disabled="[[item.disabled]]" icon-width="[[iconWidth]]" icon-height="[[iconHeight]]"
                    icon="[[item.icon]]" all-siblings-childless="[[_allItemsChildless(items)]]"
                    tooltip="[[item.tooltip]]" tooltip-icon="[[item.tooltipIcon]]" 
                    menu-max-width="[[menuMaxWidth]]" menu-min-width="[[menuMinWidth]]"
                    level="[[level]]" submenu="[[item.content]]"
                    max-submenu-items="[[maxSubmenuItems]]" allow-missing-icons="[[allowMissingIcons]]"
                    more-items-icon="[[moreItemsIcon]]" more-items-label="[[moreItemsLabel]]"
                    display-icons="[[displayIcons]]" item="[[item]]" __az-navigation="[[__azNavigation]]"></ptcs-menu-item>
            </template>
        </ptcs-vbar>`;
    }

    static get is() {
        return 'ptcs-menu-submenu';
    }

    static get properties() {
        return {
            items: {
                type:  Array,
                value: () => []
            },

            parentItem: {
                type: Object
            },

            allowMissingIcons: {
                type: Boolean
            },

            displayIcons: {
                type: Boolean
            },

            compactMode: {
                type: Boolean
            },

            iconWidth: {
                type: String
            },

            iconHeight: {
                type: String
            },

            maxSubmenuItems: {
                type: Number
            },

            moreItemsIcon: {
                type: String
            },

            moreItemsLabel: {
                type: String
            },

            menuMaxWidth: {
                type:     String,
                observer: '_menuMaxWidthChanged'
            },

            menuMinWidth: {
                type:     String,
                observer: '_menuMinWidthChanged'
            },

            level: {
                type:               Number,
                reflectToAttribute: true
            },

            role: {
                type:               String,
                value:              'menu',
                reflectToAttribute: true
            },

            _parent: {
                type: Object
            },

            _selectedItem: {
                type:  Object,
                value: null
            },

            _focusedItem: {
                type:  Number,
                value: 0
            },

            // Set if the popup menu can't be displayed in the "normal" location since it would
            // not fit in the window (it will get a border set in theming in these conditions)
            overflow: {
                type:               Boolean,
                value:              false,
                reflectToAttribute: true
            },

            disabled: {
                type:               Boolean,
                value:              false,
                reflectToAttribute: true
            },

            variant: {
                type:               String,
                value:              'dark',
                reflectToAttribute: true
            },

            // Temporary property that disables the a-z navigation by default. Currently a-z navigation is enabled only for ptcs menu button.
            __azNavigation: {
                type:  Boolean,
                value: false
            }
        };
    }

    ready() {
        super.ready();

        this.addEventListener('click', ev => this._click(ev), true);

        setTimeout(() => {
            // When the popup is displayed, always focus on the first visible item
            this._focusedItem = this._getTopVisibleItem();
        }, 200);

        // For keyboard navigation / managing focus
        this.addEventListener('keydown', ev => this._keyDown(ev));
    }

    _getTopVisibleItem() {
        // The "title" area is now gone, so start from the top
        return 0;
    }

    _allItemsChildless(items) {
        // Scan all items in this popup and check if they are all without submenu/content (these
        // items will be themed differently)
        if (Array.isArray(items) && items.find(item => item.content)) {
            return false;
        }
        return true;
    }

    _menuMaxWidthChanged(menuMaxWidth) {
        if (menuMaxWidth) {
            const stringValue = menuMaxWidth + '';
            if (stringValue.match(/^[0-9]+([,.][0-9]+)?$/)) {
                this.style.maxWidth = menuMaxWidth + 'px';
            } else {
                this.style.maxWidth = menuMaxWidth;
            }
        } else {
            this.style.removeProperty('max-width');
        }
    }

    _menuMinWidthChanged(menuMinWidth) {
        if (menuMinWidth) {
            const stringValue = menuMinWidth + '';
            if (stringValue.match(/^[0-9]+([,.][0-9]+)?$/)) {
                this.style.minWidth = menuMinWidth + 'px';
            } else {
                this.style.minWidth = menuMinWidth;
            }
        } else {
            this.style.removeProperty('min-width');
        }
    }

    _getMenuItemElements() {
        return this.$.root.querySelectorAll('[part=menu-item]');
    }

    _getMenuItemEl(index) {
        const menuItemElts = this._getMenuItemElements();
        return menuItemElts[index];
    }

    // Callback for BehaviorFocus
    _initTrackFocus() {
        this._trackFocus(this, () => this._getMenuItemEl(this._focusedItem));
    }

    _click(ev) {
        const _inRect = (x, y, rect) => x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;

        const menuItemElts = this._getMenuItemElements();
        for (let i = 1; i < menuItemElts.length; i++) {
            if (_inRect(ev.clientX, ev.clientY, menuItemElts[i].getBoundingClientRect())) {
                // Found the correct ptcs-menu-item
                this._focusedItem = i;
                return;
            }
        }
    }

    _containsPoint(x, y) {
        let menuItemElts = this._getMenuItemElements();
        for (let i = 0; i < menuItemElts.length; i++) {
            if (menuItemElts[i]._containsPoint(x, y)) {
                return true;
            }
        }
        // Nope, not within the scope of this popup (or its subitems)
        return false;
    }

    _setSelectedItem(item) {
        if (this._selectedItem) {
            // Make sure the previous _selectedItem is closed
            this._selectedItem._closeChildren();
            this._selectedItem = null;
        }
        if (item) {
            this._selectedItem = item;
        }
    }

    _closeParents(selectionMade) {
        // Notify the parent item to close this popup and all popups further "up" the chain...
        this._parent._closeParents(selectionMade);
        this._selectedItem = null;
        this._focusedItem = this._getTopVisibleItem();
    }

    _closeChildren() {
        // Only the "selected" item can have any popups
        if (this._selectedItem) {
            // Make sure the previous _selectedItem is closed
            this._selectedItem._closeChildren();
            this._selectedItem = null;
            this._focusedItem = this._getTopVisibleItem();
        }
    }

    _closeCurrentPopup() {
        this._parent._closeCurrentPopup();
        this._selectedItem = null;
        this._focusedItem = this._getTopVisibleItem();
    }

    _keyDown(ev) {
        const menuItemElts = this._getMenuItemElements();
        const numElts = menuItemElts.length;
        const topVisibleItem = this._getTopVisibleItem();

        if (this.__azNavigation && ev.key.match(/^[a-zA-Z0-9]$/)) {
            let nextIndex = this._focusedItem < (numElts - 1) ? this._focusedItem + 1 : topVisibleItem;

            while (nextIndex !== this._focusedItem && !this.items[nextIndex].label.toLowerCase().startsWith(ev.key.toLowerCase())) {
                nextIndex = nextIndex < (numElts - 1) ? nextIndex + 1 : topVisibleItem;
            }

            if (this.items[nextIndex].label.toLowerCase().startsWith(ev.key.toLowerCase())) {
                this._focusedItem = nextIndex;
            }

            return;
        }

        switch (ev.key) {
            case 'Escape':
                // Pressing ESC in a popup should close the entire chain of popups
                this._closeParents();
                ev.preventDefault();
                break;
            case 'Tab':
                // Pressing TAB in a popup should close the entire chain of popups and cause menubar to lose focus
                this._closeParents();
                break;
            case 'ArrowLeft':
                // Go "back" one level
                this._closeCurrentPopup();
                ev.preventDefault();
                break;
            case 'ArrowUp':
                this._focusedItem = this._focusedItem > topVisibleItem ? this._focusedItem - 1 : numElts - 1;
                ev.preventDefault();
                break;
            case 'ArrowDown':
                this._focusedItem = this._focusedItem < (numElts - 1) ? this._focusedItem + 1 : topVisibleItem;
                ev.preventDefault();
                break;
            case 'Home':
                this._focusedItem = topVisibleItem;
                ev.preventDefault();
                break;
            case 'End':
                this._focusedItem = numElts - 1;
                ev.preventDefault();
                break;
            case 'ArrowRight':
                if (menuItemElts[this._focusedItem].submenu && menuItemElts[this._focusedItem].submenu.length > 0) {
                    menuItemElts[this._focusedItem]._activate();
                }
                ev.preventDefault();
                break;
            case ' ':
            case 'Enter':
                menuItemElts[this._focusedItem]._activate();
                ev.preventDefault();
                break;
        }
    }
};

customElements.define(PTCS.MenuSubmenu.is, PTCS.MenuSubmenu);
