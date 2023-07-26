import {PolymerElement, html} from '@polymer/polymer/polymer-element.js';
import {PTCS} from 'ptcs-library/library.js';
import 'ptcs-behavior-styleable/ptcs-behavior-styleable.js';
import 'ptcs-behavior-focus/ptcs-behavior-focus.js';
import 'ptcs-behavior-tooltip/ptcs-behavior-tooltip.js';
import 'ptcs-label/ptcs-label.js';
import './ptcs-menu-item.js';
import './ptcs-menu-submenu.js';

PTCS.MenuFlyout = class extends PTCS.BehaviorTooltip(PTCS.BehaviorFocus(PTCS.BehaviorStyleable(PTCS.ThemableMixin(PolymerElement)))) {
    static get template() {
        return html`
      <style>
        :host {
          display: block;
          cursor: default;
          flex-wrap: nowrap;

          height: 100%;
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

        [part=navigator-items] {
            display: flex;
            box-sizing: border-box;
            flex-direction: column;
            justify-content: space-between;
            width: 100%;
            height: 100%;
        }

        [part=primary-items] {
            display: flex;
            box-sizing: border-box;
            flex-direction: column;
            align-items: flex-start;
            width: 100%;
        }

        [part=profile-items] {
            display: flex;
            box-sizing: border-box;
            flex-direction: column;
            align-items: flex-start;
            width: 100%;
        }

        [part=menu-item][hidden] {
            display: none;
        }

      </style>

      <div id="navigatoritems" part="navigator-items">
        <div part="primary-items" id="primaryitems">
          <template id="bodytemplate" is="dom-repeat" items="[[_primaryItems]]">
            <ptcs-menu-item variant="dark" part="menu-item" text="[[item.label]]" compact-mode="[[compactMode]]"
              icon-width="[[iconWidth]]" icon-height="[[iconHeight]]"
              icon="[[item.icon]]" menu-max-width="[[menuMaxWidth]]" menu-min-width="[[menuMinWidth]]"
              level="0" submenu="[[item.content]]" disabled="[[disabled]]"
              max-submenu-items="[[maxSubmenuItems]]" allow-missing-icons="[[allowMissingIcons]]"
              more-items-icon="[[moreItemsIcon]]" more-items-label="[[moreItemsLabel]]"
              display-icons="[[displayIconsInUpperRegion]]" hidden$="[[_hideRegion(compactMode, displayIconsInUpperRegion)]]"
              item="[[item]]"></ptcs-menu-item>
          </template>
        </div>
        <div part="profile-items" id="profileitems">
          <template id="profiletemplate" is="dom-repeat" items="[[_profileItems]]">
            <ptcs-menu-item variant="dark" part="menu-item" text="[[item.label]]" compact-mode="[[compactMode]]"
              icon="[[item.icon]]" icon-width="[[iconWidth]]" icon-height="[[iconHeight]]"
              menu-max-width="[[menuMaxWidth]]" menu-min-width="[[menuMinWidth]]"
              level="0" submenu="[[item.content]]" disabled="[[disabled]]"
              max-submenu-items="[[maxSubmenuItems]]" allow-missing-icons="[[allowMissingIcons]]"
              more-items-icon="[[moreItemsIcon]]" more-items-label="[[moreItemsLabel]]"
              display-icons="[[displayIconsInLowerRegion]]" hidden$="[[_hideRegion(compactMode, displayIconsInLowerRegion)]]"
              item="[[item]]"></ptcs-menu-item>
          </template>
        </div>
      </div>`;
    }

    static get is() {
        return 'ptcs-menu-flyout';
    }

    static get properties() {
        return {
            // "Top" menu items
            items: {
                type:  Array,
                value: () => []
            },

            // "Bottom" menu items
            items2: {
                type:  Array,
                value: () => []
            },

            hideBrandingArea: {
                type: Boolean
            },

            // Processed "top" items
            _primaryItems: {
                type:  Array,
                value: () => [],
            },

            // Processed "bottom" items
            _profileItems: {
                type:  Array,
                value: () => [],
            },

            iconWidth: {
                type: String
            },

            iconHeight: {
                type: String
            },

            maxMenuItems: {
                type: Number
            },

            maxSubmenuItems: {
                type: Number
            },

            _menuItemsFit: {
                type: Number
            },

            moreItemsIcon: {
                type: String
            },

            moreItemsLabel: {
                type: String
            },

            allowMissingIcons: {
                type: Boolean
            },

            displayIconsInUpperRegion: {
                type: Boolean
            },

            displayIconsInLowerRegion: {
                type: Boolean
            },

            compactMode: {
                type:               Boolean,
                value:              false,
                reflectToAttribute: true
            },

            menuMaxWidth: {
                type: String
            },

            menuMinWidth: {
                type: String
            },

            _selectedItem: {
                type:     Object,
                value:    null,
                observer: '_selectedChanged'
            },

            // This keeps track of the "currently selected" top-level item (which is not always the same as _selectedItem)
            _selectedTopLevelItem: {
                type:  Object,
                value: null
            },

            _resizeObserver: {
                type: ResizeObserver
            },

            _focusedItem: {
                type: Number
            },

            role: {
                type:               String,
                value:              'menubar',
                reflectToAttribute: true
            },

            ariaOrientation: {
                type:               String,
                value:              'vertical',
                reflectToAttribute: true
            },

            disabled: {
                type:               Boolean,
                value:              false,
                reflectToAttribute: true
            }
        };
    }

    static get observers() {
        return [
            '_processItems(items, items2, maxMenuItems, _menuItemsFit, maxSubmenuItems, allowMissingIcons)',
        ];
    }

    ready() {
        super.ready();

        this._resizeObserver = new ResizeObserver(entries => {
            // Wrap the _handleOverflow() call to avoid unit test issues
            requestAnimationFrame(() => {
                this._handleOverflow();
            });
        });

        this.addEventListener('click', ev => this._click(ev), true);

        // For keyboard navigation / managing focus
        this.addEventListener('keydown', ev => this._keyDown(ev));

        this.addEventListener('blur', () => {
            const menuItemElts = this._getMenuItemElements();
            this.dispatchEvent(new CustomEvent('lost-focus', {
                bubbles:  true,
                composed: true,
                detail:   {cmpnt: 'flyout', el: menuItemElts[this._focusedItem]}
            }));
        });

        this._clickOutsideHandler = ev => {
            if (this._isEventOutside(ev)) {
                ev.preventDefault();
                ev.stopPropagation();
                this._closeChildren();

                // Reset focus according to requirements
                this.focus();
                document.activeElement.blur();
            }
        };

        this._mouseOutsideHandler = ev => {
            if (this._isEventOutside(ev)) {
                ev.preventDefault();
                ev.stopPropagation();
            }
        };
    }

    connectedCallback() {
        super.connectedCallback();

        this._resizeObserver.observe(this);

        // We should close all popups if the window is resized...
        window.addEventListener('resize', this._windowResized(this));
    }

    disconnectedCallback() {
        super.disconnectedCallback();

        this._resizeObserver.unobserve(this);

        window.removeEventListener('resize', this._windowResized(this));

        if (this._clickOutsideHandler) {
            document.removeEventListener('click', this._clickOutsideHandler, true);
        }

        if (this._mouseOutsideHandler) {
            document.removeEventListener('mousedown', this._mouseOutsideHandler, true);
            document.removeEventListener('mouseup', this._mouseOutsideHandler, true);
        }
    }

    _hideRegion(compactMode, displayIconsInRegion) {
        if (compactMode && !displayIconsInRegion) {
            return true;
        }
        return false;
    }

    _numHiddenItems(primaryElts) {
        let hidden = 0;

        for (let i = 0; i < primaryElts.length; i++) {
            if (primaryElts[i].hasAttribute('hidden')) {
                hidden++;
            }
        }

        return hidden;
    }

    _handleOverflow() {
        const primaryElts = this.$.primaryitems;
        const profileElts = this.$.profileitems;
        const containerElt = this.$.navigatoritems;

        if (primaryElts && profileElts) {
            // Get the areas they currently occupy...
            const primaryRect = primaryElts.getBoundingClientRect();
            const profileRect = profileElts.getBoundingClientRect();

            // How many items are there "currently" within the "top" part?
            const menuItemElts = primaryElts.querySelectorAll('[part=menu-item]');
            let numItems = menuItemElts.length;
            if (numItems <= 0) {
                return;
            }

            const sizeItem = primaryRect.height / numItems;

            const heightTotal = containerElt.clientHeight;
            const heightProfile = profileRect.height;

            // New spec---the top half should normally use up at most *half* of the available space...
            const heightAvailable = Math.min(heightTotal - heightProfile, heightTotal / 2);
            const numFits = Math.floor(heightAvailable / sizeItem);

            // Finally, set the _menuItemsFit property---this is observed, so it will force re-processing
            // of the items
            if (this._menuItemsFit !== numFits) {
                this._menuItemsFit = numFits;
            }
        }
    }

    _selectedChanged(selectedItem, old) {
        if (old && !old.isEmptyTopLevelItem) {
            // Turn OFF EventListeners
            document.removeEventListener('click', this._clickOutsideHandler, true);
            document.removeEventListener('mousedown', this._mouseOutsideHandler, true);
            document.removeEventListener('mouseup', this._mouseOutsideHandler, true);
        }
        if (selectedItem && !selectedItem.isEmptyTopLevelItem) {
            // Turn ON EventListeners
            document.addEventListener('click', this._clickOutsideHandler, true);
            document.addEventListener('mousedown', this._mouseOutsideHandler, true);
            document.addEventListener('mouseup', this._mouseOutsideHandler, true);
        }
    }

    // Is a given key present anywhere within an item (including sub-items)?
    scanItemForKey(item, selectedKey, matchSelectorF) {
        if (item.content && item.content.length > 0) {
            // Scan sub-items recursively
            return item.content.find(subitem => this.scanItemForKey(subitem, selectedKey, matchSelectorF));
        }

        // No subitems, test the item itself
        return matchSelectorF(item) === selectedKey;
    }


    // Somebody has set the selection from the outside
    selectKey(selectedKey, matchSelectorF) {
        const allItemEls = this.shadowRoot.querySelectorAll('[part=menu-item]');
        for (let i = 0; i < allItemEls.length; i++) {
            const itemEl = allItemEls[i];
            if (this.scanItemForKey(itemEl.item, selectedKey, matchSelectorF)) {
                if (this._selectedTopLevelItem && this._selectedTopLevelItem !== itemEl) {
                    this._selectedTopLevelItem.selected = false;
                }
                this._selectedTopLevelItem = itemEl;
                itemEl.selected = true;
                //itemEl.select();
                return true;
            }
        }

        return false;
    }

    _processItems(items, items2, maxMenuItems, menuItemsFit, maxSubmenuItems, allowMissingIcons) {
        if (maxMenuItems === undefined || isNaN(maxMenuItems) || menuItemsFit < maxMenuItems) {
            // The desired maximum number of items does not fit within the height...
            maxMenuItems = menuItemsFit;
        }

        let primaryItems = [...items], profileItems = [...items2];

        // Now some "extra" processing---if the number of "top" items are greater than the number allowed
        // in the settings, then create a "dummy" entry for these ("More items...") and move the remaining
        // ones there...
        if (primaryItems.length > maxMenuItems) {
            const moreItems = primaryItems.splice(maxMenuItems > 0 ? maxMenuItems - 1 : 0);
            let more = {};
            more.icon = this.moreItemsIcon;
            more.label = this.moreItemsLabel;
            more.content = moreItems;
            primaryItems.push(more);
        }

        // Done, use the new values
        this._primaryItems = primaryItems;
        this._profileItems = profileItems;
    }

    _getMenuItemElements() {
        return this.$.navigatoritems.querySelectorAll('[part=menu-item]');
    }

    _getItemEl(index) {
        const menuItemElts = this._getMenuItemElements();
        return menuItemElts[index];
    }

    // Callback for BehaviorFocus
    _initTrackFocus() {
        this._trackFocus(this, () => this._getItemEl(this._focusedItem));
    }

    _click(ev) {
        if (this.disabled) {
            // No changing the focused item when disabled
            return;
        }

        const _inRect = (x, y, rect) => x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;

        const menuItemElts = this._getMenuItemElements();
        for (let i = 0; i < menuItemElts.length; i++) {
            if (_inRect(ev.clientX, ev.clientY, menuItemElts[i].getBoundingClientRect())) {
                // Found the correct ptcs-menu-item
                this._focusedItem = i;
                return;
            }
        }
    }

    _getFirstFocusedItem() {
        const menuItemElts = this._getMenuItemElements();
        for (let i = 0; i < menuItemElts.length; i++) {
            if (!menuItemElts[i].hidden) {
                return i;
            }
        }
        // Failure
        return 0;
    }

    _getLastFocusedItem() {
        const menuItemElts = this._getMenuItemElements();
        for (let i = menuItemElts.length - 1; i >= 0; i--) {
            if (!menuItemElts[i].hidden) {
                return i;
            }
        }
        // Failure
        return 0;
    }

    _getPrevFocusedItem() {
        const menuItemElts = this._getMenuItemElements();
        for (let i = this._focusedItem - 1; i >= 0; i--) {
            if (!menuItemElts[i].hidden) {
                return i;
            }
        }
        return this._getLastFocusedItem();
    }

    _getNextFocusedItem() {
        const menuItemElts = this._getMenuItemElements();
        for (let i = this._focusedItem + 1; i < menuItemElts.length; i++) {
            if (!menuItemElts[i].hidden) {
                return i;
            }
        }
        return this._getFirstFocusedItem();
    }

    // Shift focus from ptcs-menu-flyout to another menubar subcomponent (header or footer)
    _focusOn(targetId) {
        this._focusedItem = null;
        this.dispatchEvent(new CustomEvent('focus-on', {
            bubbles:  true,
            composed: true,
            detail:   {id: targetId}
        }));
    }

    _keyDown(ev) {
        if (this.disabled) {
            return;
        }

        const menuItemElts = this._getMenuItemElements();
        switch (ev.key) {
            case 'ArrowUp':
                if (this._focusedItem === this._getFirstFocusedItem()) {
                    this._focusOn('header-arrowup');
                } else {
                    this._focusedItem = this._getPrevFocusedItem();
                }
                ev.preventDefault();
                break;
            case 'ArrowDown':
                if (this._focusedItem === this._getLastFocusedItem()) {
                    if (this.hideBrandingArea) {
                        this._focusOn('header');
                    } else {
                        this._focusOn('footer');
                    }
                } else {
                    this._focusedItem = this._getNextFocusedItem();
                }
                ev.preventDefault();
                break;
            case 'Home':
                this._focusOn('header');
                ev.preventDefault();
                break;
            case 'End':
                if (this.hideBrandingArea) {
                    this._focusedItem = this._getLastFocusedItem();
                } else {
                    this._focusOn('footer');
                }
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
            case 'Tab':
                this._closeChildren();
                break;
        }
    }

    keyboardNavigate(itemPosition) {
        if (itemPosition === 'first') {
            this._focusedItem = this._getFirstFocusedItem();
        } else if (itemPosition === 'last') {
            this._focusedItem = this._getLastFocusedItem();
        }
        this.focus();
    }

    _setSelectedItem(item) {
        if (this._selectedItem) {
            // Make sure the previous _selectedItem is closed
            this._selectedItem._closeChildren();
        }
        this._selectedItem = item;
    }

    _closeParents() {
        // When we get here, all the popups have already been closed, so all we need to do is to
        // remove the selection and reclaim the focus()...
        this._selectedItem = null;
        this.focus();
        if (this._selectedTopLevelItem) {
            this._selectedTopLevelItem.selected = true;
        }
    }

    _closeChildren() {
        // Only the "selected" item can have any popups
        if (this._selectedItem) {
            // Make sure the previous _selectedItem is closed
            this._selectedItem._closeChildren();
            this._selectedItem = null;
        }
        if (this._selectedTopLevelItem) {
            this._selectedTopLevelItem.selected = true;
        }
    }

    _isEventOutside(/**@type {MouseEvent}*/ ev) {
        const menuItemElts = this._getMenuItemElements();
        return Array.prototype.reduce.call(menuItemElts, (outside, menuItemElt) => {
            return outside && !menuItemElt._containsPoint(ev.clientX, ev.clientY);
        }, true);
    }

    _windowResized(menuElt) {
        return (ev) => {
            menuElt._closeChildren();
        };
    }
};

customElements.define(PTCS.MenuFlyout.is, PTCS.MenuFlyout);
