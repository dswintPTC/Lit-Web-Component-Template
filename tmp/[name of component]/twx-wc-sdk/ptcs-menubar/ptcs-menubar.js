import {PolymerElement, html} from '@polymer/polymer/polymer-element.js';
import {PTCS} from 'ptcs-library/library.js';
import 'ptcs-behavior-styleable/ptcs-behavior-styleable.js';
import 'ptcs-behavior-focus/ptcs-behavior-focus.js';
import 'ptcs-behavior-tooltip/ptcs-behavior-tooltip.js';
import 'ptcs-behavior-tabindex/ptcs-behavior-tabindex.js';
import 'ptcs-label/ptcs-label.js';
import 'ptcs-accordion/ptcs-accordion.js';
import './ptcs-menu-item.js';
import './ptcs-menu-submenu.js';
import './ptcs-menu-flyout.js';
import './ptcs-menu-header.js';
import './ptcs-menu-footer.js';
import './ptcs-menu-thumb.js';
import 'ptcs-icons/cds-icons.js';

PTCS.Menubar = class extends PTCS.BehaviorTabindex(PTCS.BehaviorTooltip(PTCS.BehaviorFocus(
    PTCS.BehaviorStyleable(PTCS.ThemableMixin(PolymerElement))))) {
    static get template() {
        return html`
      <style>
        :host {
          cursor: default;
          display: inline-flex;
          flex-wrap: nowrap;

          height: 100%;

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
            flex-direction: row;
            box-sizing: border-box;
            width: 100%;
            position: relative;
        }

        [part=expand] {
            display: flex;
            flex-direction: column;
            flex-shrink: 0;
            box-sizing: border-box;
            height: 100%;
        }

        [part=handle][hidden] {
            display: none;
        }

        [part=handle]:not([disabled]) {
            cursor: ew-resize;
        }

        [part=handle]:not([hidden]) {
            display: flex;
            position: absolute;
            flex-shrink: 0;
            flex-direction: row;
            align-items: center;
        }

        [part=handle]:not([hidden]):before {
            position: absolute;
            content: '';
            top: -20px;
            right: -10px;
            left: 0px;
            bottom: -20px;
        }

        [part=header-icon]:not([disabled]) {
            cursor: pointer;
        }

        [part=main-area] {
            height: 100%;
            display: flex;
            flex-direction: column;
            box-sizing: border-box;
        }

        [part=header] {
            display: flex;
            flex-direction: row;
            box-sizing: border-box;
            align-items: center;
            flex-grow: 0;
            flex-shrink: 0;
        }

        [part=header][hidden] {
            display: none;
        }

        [part=footer] {
            flex-grow: 0;
            flex-shrink: 0;
            box-sizing: border-box;
        }

        [part=items-area] {
            height: 100%;
            box-sizing: border-box;
            overflow: hidden auto;
        }

        [part=flyout] {
            width: 100%;
        }

        [part=items-area]::-webkit-scrollbar {
            width: 6px;
        }

        [part=items-area]::-webkit-scrollbar-thumb {
            width: 6px;
            background-color: #909090;
            border-radius: 3px;
        }

        [part=accordion][hidden] {
            display: none;
        }

      </style>

      <div id="root" part="root">
        <div id="mainarea" part="main-area">
          <ptcs-menu-header id="header" part="header" hidden$="[[_hideHeader(alwaysOpen)]]" display-icons="true"
            icon-width="[[iconWidth]]" icon-height="[[iconHeight]]" compact-mode="[[compactMode]]" icon="cds:icon_hamburger"
            disabled="[[disabled]]" ignore-click tabindex\$="[[_delegatedFocus]]">
          </ptcs-menu-header>
          <div id="itemsarea" part="items-area">
            <template is="dom-if" if="[[_isFlyout(menuType)]]">
              <ptcs-menu-flyout
                id="flyout"
                icon-width="[[iconWidth]]"
                icon-height="[[iconHeight]]"
                part="flyout"
                items="[[items]]"
                items2="[[items2]]"
                allow-missing-icons="[[allowMissingIcons]]"
                display-icons-in-upper-region="[[displayIconsInUpperRegion]]"
                display-icons-in-lower-region="[[displayIconsInLowerRegion]]"
                compact-mode="[[compactMode]]"
                more-items-icon="[[moreItemsIcon]]"
                more-items-label="[[moreItemsLabel]]"
                max-menu-items="[[maxMenuItems]]"
                max-submenu-items="[[maxSubmenuItems]]"
                menu-max-width="[[menuMaxWidth]]"
                menu-min-width="[[menuMinWidth]]"
                disabled="[[disabled]]"
                hide-branding-area="[[hideBrandingArea]]"></ptcs-menu-flyout>
            </template>
            <template is="dom-if" if="[[_isAccordion(menuType)]]">
              <ptcs-accordion
                id="accordion"
                icon-width="[[iconWidth]]"
                icon-height="[[iconHeight]]"
                part="accordion"
                variant="menu"
                items="[[_mergeItems(items, items2)]]"
                multiple-open-items="true"
                trigger-can-collapse="true"
                trigger-type="plus/minus"
                allow-missing-icons="[[allowMissingIcons]]"
                display-icons="[[displayIconsInUpperRegion]]"
                disabled="[[disabled]]"
                hidden$="[[_hideIfCompactMode(compactMode)]]"></ptcs-accordion>
            </template>
          </div>
          <ptcs-menu-footer id="footer" part="footer" compact-mode="[[compactMode]]" item="[[brandingItem]]" tabindex="-1"
            text="[[brandingItem.label]]" icon="[[brandingItem.icon]]" logo="[[brandingItem.logo]]" disabled="[[brandingItem.disabled]]"
            hidden$="[[_hideBrandingArea(hideBrandingArea, item)]]"></ptcs-menu-footer>
        </div>
        <div id="expand" part="expand">
          <div part="handle" id="handle" hidden$="[[resizeHandleHidden]]" disabled$="[[disabled]]">
            <ptcs-menu-thumb part="handle-icon" id="handleicon" tabindex\$="[[_delegatedFocus]]"></ptcs-menu-thumb>
          </div>
        </div>
      </div>`;
    }

    static get is() {
        return 'ptcs-menubar';
    }

    static get properties() {
        return {
            menuType: {
                type:  String,
                value: 'flyout'
            },

            items: {
                type:  Array,
                value: () => []
            },

            items2: {
                type:  Array,
                value: () => []
            },

            maxMenuItems: {
                type: Number
            },

            maxSubmenuItems: {
                type: Number
            },

            moreItemsIcon: {
                type:  String,
                value: 'cds:icon_more_horizontal'
            },

            moreItemsLabel: {
                type:  String,
                value: 'More...'
            },

            hideBrandingArea: {
                type: Boolean
            },

            brandingItem: {
                type:  Object,
                value: null
            },

            iconWidth: {
                type: String
            },

            iconHeight: {
                type: String
            },

            allowMissingIcons: {
                type:     Boolean,
                observer: '_updateFillMissingIcons'
            },

            fillMissingIcons: {
                type:     Boolean,
                value:    false,
                observer: '_updateAllowMissingIcons'
            },

            stayOpenAfterSelection: {
                type:  Boolean,
                value: false
            },

            alwaysOpen: {
                type:  Boolean,
                value: false
            },

            preventResize: {
                type:  Boolean,
                value: false
            },

            displayIconsInUpperRegion: {
                type:  Boolean,
                value: false
            },

            displayIconsInLowerRegion: {
                type:  Boolean,
                value: false
            },

            compactMode: {
                type:               Boolean,
                observer:           '_updateDisableCompactMode',
                reflectToAttribute: true
            },

            disableCompactMode: {
                type:     Boolean,
                value:    false,
                observer: '_updateCompactMode'
            },

            resizeHandleHidden: {
                type:               Boolean,
                computed:           '_hideIfCompactMode(compactMode, preventResize)',
                readOnly:           true,
                reflectToAttribute: true
            },

            minWidth: {
                type:     String,
                observer: '_minWidthChanged'
            },

            maxWidth: {
                type:     String,
                observer: '_maxWidthChanged'
            },

            compactWidth: {
                type: String
            },

            menuMaxWidth: {
                type: String
            },

            menuMinWidth: {
                type: String
            },

            matchSelectorF: {
                // Function that determines if a given menu item matches a 'selectedKey' string---this allows
                // the user to use any property in the item, not just matching e.g. the title
                type: Function
            },

            selectedKey: {
                // The 'key' to select (interpreted by the matchSelectorF function)
                type: String
            },

            selectedIndexesPrimary: {
                type:   Array,
                notify: true,
                value:  () => []
            },

            selectedIndexesSecondary: {
                type:   Array,
                notify: true,
                value:  () => []
            },

            disabled: {
                type:               Boolean,
                value:              false,
                reflectToAttribute: true
            },

            _delegatedFocus: {
                type:  String,
                value: null
            }
        };
    }

    static get observers() {
        return [
            '_selectedKeyChanged(selectedKey, matchSelectorF)',
            '_observeMenuTypeAlwaysOpen(menuType, alwaysOpen)'
        ];
    }

    ready() {
        super.ready();

        // The new "reveal" icon should also toggle the compact mode...
        this.$.header.addEventListener('click', ev => this._toggleCompactMode());

        // For keyboard navigation from HEADER
        this.$.header.addEventListener('keydown', ev => this._keyboardNavigateMenubarHeader(ev));

        // For keyboard navigation from FOOTER
        this.$.footer.addEventListener('keydown', ev => this._keyboardNavigateMenubarFooter(ev));

        // For keyboard navigation from HANDLE
        this.$.handleicon.addEventListener('keydown', ev => this._keyboardNavigateHandle(ev));

        // Keyboard navigation from ptcs-menu-flyout to put focus on topmost item, or footer
        this.addEventListener('focus-on', (ev) => this._focusOnEvent(ev));

        // To store what subcomponent last had focus
        this.addEventListener('lost-focus', (ev) => this._lostFocusOn(ev));

        // For Shift-Tab return
        this.addEventListener('focus', (ev) => this._menubarFocus(ev));
        this.addEventListener('click', () => {
            this._lastFocusedSubcomponent = undefined;
        });

        this.addEventListener('action', ev => this._selectionMade(ev));

        this.$.handle.addEventListener('touchstart', ev => this._mouseDown(ev, true));
        this.$.handle.addEventListener('mousedown', ev => this._mouseDown(ev));
        this.$.header.addEventListener('keydown', ev => this._resizeMenu(ev));
        this.$.handleicon.addEventListener('keydown', ev => this._resizeMenu(ev));
    }

    connectedCallback() {
        super.connectedCallback();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
    }

    _hideBrandingArea(hideBrandingArea, item) {
        return hideBrandingArea || (item && !item.label && !item.icon && !item.logo);
    }

    _isFlyout(menuType) {
        return menuType === 'flyout';
    }

    _isAccordion(menuType) {
        return menuType === 'nested';
    }

    _minWidthChanged(minWidth) {
        if (this.compactMode) {
            // In compactMode, the min-width is temporarily disabled---so store it for later use
            this.__previousMinWidth = minWidth;
            return;
        }
        const v = PTCS.cssDecodeSize(minWidth);
        this.style.minWidth = v > 0 ? `${v}px` : '';
    }

    _maxWidthChanged(maxWidth) {
        if (this.compactMode) {
            // In compactMode, the max-width is temporarily disabled---so store it for later use
            this.__previousMaxWidth = maxWidth;
            return;
        }
        const v = PTCS.cssDecodeSize(maxWidth);
        this.style.maxWidth = v > 0 ? `${v}px` : '';
    }

    _adjustWidth(compactMode) {
        // The compactMode has changed, so adjust the width(s) accordingly
        if (compactMode) {
            // Store the width values (if any) in the previous "expanded" mode
            this.__previousWidth = this.style.width;
            this.__previousMinWidth = this.minWidth;
            this.__previousMaxWidth = this.maxWidth;

            // Set the width and temporarily disable the max/min widths while we are in compact mode
            const v = PTCS.cssDecodeSize(this.compactWidth);
            this.style.width = v > 0 ? `${v}px` : '';
            this.style.minWidth = this.style.maxWidth = 'unset';
        } else {
            // Reset the values to what they were before (or to what they were updated to while in compactMode)
            this.style.width = this.__previousWidth;
            this._minWidthChanged(this.__previousMinWidth);
            this._maxWidthChanged(this.__previousMaxWidth);
        }
    }

    _updateWidth(delta) {
        const cs = getComputedStyle(this);
        const widthStr = cs.getPropertyValue('width');
        const initialWidth = Number(widthStr.substr(0, widthStr.indexOf('px'))) || 0;
        this.style.width = `${initialWidth + delta}px`;
    }

    _resizeMenu(ev) {
        // Resize shouldn't work if we are in compact mode or if preventResize is set...
        if (this.preventResize || this.compactMode) {
            return;
        }
        switch (ev.key) {
            case 'ArrowRight':
                this._updateWidth(4);
                break;
            case 'ArrowLeft':
                this._updateWidth(-4);
                break;
        }
    }

    _selectedKeyChanged(selectedKey, matchSelectorF) {
        if (selectedKey && typeof matchSelectorF === 'function') {
            if (this.menuType === 'flyout') {
                const flyoutEl = this.shadowRoot.querySelector('[part=flyout]');
                if (!flyoutEl.selectKey(selectedKey, matchSelectorF)) {
                    // Not found, clear selection
                    flyoutEl._setSelectedItem();
                    // Clear any "top-level" selection as well
                    if (flyoutEl._selectedTopLevelItem) {
                        flyoutEl._selectedTopLevelItem.selected = false;
                        flyoutEl._selectedTopLevelItem = null;
                    }
                }
            } else if (this.menuType === 'nested') {
                const accordionEl = this.shadowRoot.querySelector('[part=accordion]');
                if (!accordionEl.selectKey(selectedKey, matchSelectorF)) {
                    // Not found, clear selection
                    accordionEl._clearSelection();
                }
            }
        }
    }

    _selectionMade(ev) {
        // Clear any previous "manual" selection
        this.selectedKey = '';

        // Intercept all menu selections and "collapse" the menu (if so configured)
        if (this.menuType === 'nested' && !this.stayOpenAfterSelection && !this.alwaysOpen) {
            this.compactMode = true;
        }
    }

    _hideHeader(alwaysOpen) {
        if (alwaysOpen) {
            this.compactMode = false;
        }
        return !!alwaysOpen;
    }

    _hideIfCompactMode(compactMode, preventResize) {
        if (preventResize) {
            return true;
        }
        return !!compactMode;
    }

    __getXPosFromEvent(ev) {
        let posX;
        if (ev.clientX) {
            posX = ev.clientX;
        } else if (ev.targetTouches) {
            posX = ev.targetTouches[0].clientX;
            // Prevent default behavior
            ev.preventDefault();
        }

        return posX;
    }

    _resize(ev, initialPosX, initialWidth) {
        const posX = this.__getXPosFromEvent(ev);
        const delta = posX - initialPosX;
        this.style.width = `${initialWidth + delta}px`;
        ev.preventDefault();
    }

    _mouseDown(ev, touch = false) {
        if (this.disabled) {
            return;
        }

        const posX = this.__getXPosFromEvent(ev);

        // Get the inital Width of the menu
        const cs = getComputedStyle(this);
        const widthStr = cs.getPropertyValue('width');
        const initialWidth = Number(widthStr.substr(0, widthStr.indexOf('px'))) || 0;

        const mouseMoveEv = touch ? 'touchmove' : 'mousemove';
        const mouseUpEv = touch ? 'touchend' : 'mouseup';

        let mmv = ev1 => this._resize(ev1, posX, initialWidth);

        let mup = () => {
            // Done resizing
            window.removeEventListener(mouseMoveEv, mmv);
            window.removeEventListener(mouseUpEv, mup);
        };

        window.addEventListener(mouseMoveEv, mmv);
        window.addEventListener(mouseUpEv, mup);
    }

    _mergeItems(items, items2) {
        return [...items, ...items2];
    }

    _toggleCompactMode() {
        if (this.disabled) {
            // Disable the handle as well
            return;
        }

        // In case the current item was showing a tooltip, close it...
        this._tooltipClose();

        this.compactMode = !this.compactMode;
    }

    _updateFillMissingIcons(v) {
        this.fillMissingIcons = !v;
    }

    _updateAllowMissingIcons(v) {
        this.allowMissingIcons = !v;
    }

    _updateDisableCompactMode(v) {
        this.disableCompactMode = !v;
    }

    _updateCompactMode(v) {
        this.compactMode = !v;

        this._adjustWidth(this.compactMode);
    }

    _getLastVisibleAccordionItem(item) {
        if (item.hasAttribute('sub-accordion') && item.hasAttribute('opened')) {
            const subItemCollapse = item.shadowRoot.querySelector('ptcs-collapse');
            const subItemAccordion = subItemCollapse.querySelector('ptcs-accordion:last-of-type');
            const subItemAccordionItem = subItemAccordion.shadowRoot.querySelector('ptcs-accordion-item:last-of-type');
            if (subItemAccordionItem.hasAttribute('sub-accordion')) {
                this._getLastVisibleAccordionItem(subItemAccordionItem);
            }
            return subItemAccordionItem;
        }
        return item;
    }

    _observeMenuTypeAlwaysOpen(menuType, alwaysOpen) {
        this._lastFocusedSubcomponent = undefined;
        // Set a timeout to account for the dom-if delay to create the accordion (when menuType = nested)
        setTimeout(() => {
            if (menuType === 'flyout') {
                const flyoutEl = this.shadowRoot.querySelector('[part=flyout]');
                if (flyoutEl) {
                    // Tab focus should target the flyout when the header is hidden (alwaysOpen is true)
                    flyoutEl.setAttribute('tabindex', alwaysOpen ? this._delegatedFocus : '-1');
                }
            } else if (menuType === 'nested') {
                const accordionEl = this.$.itemsarea.querySelector('[part=accordion]');
                if (accordionEl) {
                    // Tab focus should target the accordion when the header is hidden (alwaysOpen is true)
                    accordionEl.setAttribute('tabindex', alwaysOpen ? this._delegatedFocus : '-1');
                    accordionEl.addEventListener('keydown', ev => this._accordionKeydown(ev));
                }
            }
        }, 100);
    }

    _accordionKeydown(ev) {
        const accordionEl = this.$.itemsarea.querySelector('[part=accordion]');
        const accordionItemInFocus = accordionEl.deepFocusEl;
        const firstItem = accordionEl.shadowRoot.querySelector('ptcs-accordion-item:first-of-type');
        const lastItemRoot = accordionEl.shadowRoot.querySelector('ptcs-accordion-item:last-of-type');
        const lastVisibleItem = this._getLastVisibleAccordionItem(lastItemRoot);

        // Header is visible when alwaysOpen is false, Footer is visible when hideBrandingArea is false
        if (!this.alwaysOpen && (ev.key === 'Home' ||
                            (ev.key === 'ArrowUp' && this._lastAccordionItemInFocus === firstItem) ||
                            (ev.key === 'ArrowDown' && this._lastAccordionItemInFocus === lastVisibleItem && this.hideBrandingArea))) {
            this.$.header.focus();
            ev.preventDefault();
        } else if (ev.key === 'ArrowUp' && this.alwaysOpen && accordionItemInFocus === firstItem) {
            accordionEl._setFirstDeepFocus();
            ev.preventDefault();
        } else if (ev.key === 'ArrowDown' && accordionItemInFocus === lastVisibleItem) {
            accordionEl._setLastDeepFocus();
            ev.preventDefault();
        } else if (!this.hideBrandingArea && (ev.key === 'End' ||
                            (ev.key === 'ArrowDown' && this._lastAccordionItemInFocus === lastVisibleItem) ||
                            (ev.key === 'ArrowUp' && this.alwaysOpen &&
                                (this._lastAccordionItemInFocus === firstItem || !this._lastAccordionItemInFocus)))) {
            this.$.footer.focus();
            ev.preventDefault();
        }
        if (ev.key.startsWith('Arrow') || ev.key === 'Tab' || ev.key === 'End' || ev.key === 'Home') {
            this._lastAccordionItemInFocus = accordionItemInFocus;
        }
    }
    // For keyboard navigation from HANDLE back to menubar
    _keyboardNavigateHandle(ev) {
        if (ev.key === 'Tab' && ev.shiftKey) {
            // Shift-Tab:ing from the handle back into the menubar to select a previously focused item
            this.$.handleicon.dispatchEvent(new CustomEvent('focus-on', {
                bubbles:  true,
                composed: true,
                detail:   {id: 'menubar'}
            }));
            ev.preventDefault();
        } else if (ev.key === 'Tab') {
            // Losing focus by Tab:ing out from the handle
            this._lostFocusFromHandle = true;
        }
    }

    // For keyboard navigation from HEADER
    _keyboardNavigateMenubarHeader(ev) {
        if (ev.key === ' ' || ev.key === 'Enter') {
            this._toggleCompactMode();
            ev.preventDefault();
        } else if (ev.key === 'End' || ev.key === 'ArrowUp') {
            if (this.hideBrandingArea) {
                if (this.menuType === 'flyout') {
                    this._keyboardNavigateFlyout('last');
                } else if (this.menuType === 'nested') {
                    this._keyboardNavigateAccordion('last');
                }
            } else {
                this.$.footer.focus();
            }
            ev.preventDefault();
        } else if (ev.key === 'ArrowDown') {
            if (this.menuType === 'flyout') {
                this._keyboardNavigateFlyout('first');
            } else if (this.menuType === 'nested') {
                if (this.compactMode && !this.hideBrandingArea) {
                    this.$.footer.focus();
                } else if (!this.compactMode) {
                    this._keyboardNavigateAccordion('first');
                }
            }
            ev.preventDefault();
        }
    }

    // For keyboard navigation from FOOTER
    _keyboardNavigateMenubarFooter(ev) {
        if (ev.key === 'Home' || ev.key === 'ArrowDown') {
            if (!this.alwaysOpen) {
                this.$.header.focus();
            } else if (this.menuType === 'flyout') {
                this._keyboardNavigateFlyout('first');
            } else if (this.menuType === 'nested') {
                this._keyboardNavigateAccordion('first');
            }
            ev.preventDefault();
        } else if (ev.key === 'ArrowUp') {
            if (this.menuType === 'flyout') {
                this._keyboardNavigateFlyout('last');
            } else if (this.menuType === 'nested') {
                if (!this.compactMode) {
                    this._keyboardNavigateAccordion('last');
                } else if (!this.alwaysOpen) {
                    this.$.header.focus();
                }
            }
            ev.preventDefault();
        }
    }

    // Toolbar in focus. Restore last item in focus?
    _menubarFocus(ev) {
        if (ev) {
            ev.preventDefault();
        }
        if (!this._lastFocusedSubcomponent) {
            // No subcomponent has had focus, put focus on topmost item
            if (this.alwaysOpen) {
                // No header
                if (this.menuType === 'flyout') {
                    this._keyboardNavigateFlyout('first');
                } else if (this.menuType === 'nested') {
                    this._keyboardNavigateAccordion('first');
                }
            } else {
                this.$.header.focus();
            }
        } else if (this._lostFocusFromHandle && !this.resizeHandleHidden) {
            // We previously lost focus via handle, put focus back on handle
            this._lostFocusFromHandle = false;
            this.$.handleicon.focus();
        } else if (this._lastFocusedItem) {
            // _lastFocusedItem holds last focused item at root level of the flyout
            const flyoutEl = this.shadowRoot.querySelector('[part=flyout]');
            if (flyoutEl) {
                flyoutEl.focus();
                this._lastFocusedItem.focus();
            }
        } else if (this._lastFocusedSubcomponent === 'header' && !this.alwaysOpen) {
            this.$.header.focus();
        } else if (this._lastFocusedSubcomponent === 'footer' && !this.hideBrandingArea) {
            this.$.footer.focus();
        } else if (this._lastFocusedSubcomponent === 'accordion') {
            if (!this.compactMode) {
                const accordionEl = this.$.itemsarea.querySelector('[part=accordion]');
                if (accordionEl) {
                    accordionEl.focus();
                }
            }
        }
    }

    // To keep track of which subcomponent had focus last
    _lostFocusOn(ev) {
        this._lastFocusedSubcomponent = ev.detail.cmpnt;
        this._lastFocusedItem = ev.detail.el;
    }

    // Move focus to subcomponent?
    _focusOnEvent(ev) {
        switch (ev.detail.id) {
            case 'header':
                if (this.alwaysOpen) {
                    this._keyboardNavigateFlyout('first');
                } else {
                    this.$.header.focus();
                }
                break;
            case 'header-arrowup':
                if (this.alwaysOpen) {
                    if (this.hideBrandingArea) {
                        this._keyboardNavigateFlyout('last');
                    } else {
                        this.$.footer.focus();
                    }
                } else {
                    this.$.header.focus();
                }
                break;
            case 'footer':
                this.$.footer.focus();
                break;
            case 'menubar':
                this._menubarFocus();
                break;
        }
    }

    // Navigate from menubar to an item in flyout
    _keyboardNavigateFlyout(item) {
        const flyoutEl = this.$.itemsarea.querySelector('[part=flyout]');
        if (flyoutEl) {
            flyoutEl.keyboardNavigate(item);
        }
    }

    // Navigate from menubar to accordion
    _keyboardNavigateAccordion(item) {
        const accordionEl = this.$.itemsarea.querySelector('[part=accordion]');
        if (accordionEl) {
            accordionEl.focus();
            if (item === 'first') {
                accordionEl._setFirstDeepFocus();
            } else if (item === 'last') {
                accordionEl._setLastDeepFocus();
            }
            const accordionItemInFocus = accordionEl.deepFocusEl;
            this._lastAccordionItemInFocus = accordionItemInFocus;
            accordionItemInFocus.scrollIntoViewIfNeeded();
        }
    }
};

customElements.define(PTCS.Menubar.is, PTCS.Menubar);
