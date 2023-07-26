import {html} from '@polymer/polymer/polymer-element.js';
import {PTCS} from 'ptcs-library/library.js';
import {TabsElement} from '@vaadin/vaadin-tabs/src/vaadin-tabs.js';
import 'ptcs-dropdown/ptcs-dropdown.js';
import 'ptcs-button/ptcs-button.js';
import 'ptcs-behavior-styleable/ptcs-behavior-styleable.js';
import 'ptcs-icons/cds-icons.js';

/* eslint-disable no-confusing-arrow */
const $_documentContainer = document.createElement('template');
$_documentContainer.innerHTML = `<dom-module id="ptcs-tabs-default-theme" theme-for="vaadin-tabs ptcs-tabs">
  <template>
    <style>

      [part=tabs-list] {
        width: auto;
      }

      :host {
        -webkit-tap-highlight-color: transparent;
      }

      :host([orientation="horizontal"]) {
        line-height: initial;
      }

      [part="tabs"] {
        overflow: hidden !important;
      }

      [part="tabs"] ::slotted(ptcs-tab) {
        white-space: nowrap;
        color: var(--theme-color-mid-01, #80858E);
        border-color: var(--theme-color-light-01, #D8DBDE);
        border-width: 2px;
        font-size: 16px;
        text-align: left;
      }

      :host(:not([disabled])) [part="tabs"] ::slotted(ptcs-tab) {
        cursor: pointer;
      }

      :host [part="tabs"] ::slotted(ptcs-tab:hover) {
        color: var(--theme-color-dark-01, #232b2d);
      }

      /* Horizontal tabs styles */
      /* Firefox requires the extra [part="tabs"] before the ::slotted */
      :host([orientation="horizontal"]) [part="tabs"] ::slotted(ptcs-tab) {
        display: flex;
        justify-content: center;
        border-bottom: 2px solid transparent;
        position: relative;
        z-index: 11;
        padding: 0px;
        margin-left: 24px;
        margin-right: 24px;
        font-weight: normal;
        width: auto;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      :host([orientation="horizontal"]) [part="tabs"] ::slotted(ptcs-tab:first-of-type) {
        margin-left: 0px;
      }

      :host([orientation="horizontal"]:not([_overflow-dropdown])) [part="tabs"] ::slotted(ptcs-tab:last-of-type) {
        margin-right: 0px !important;
      }

      :host([orientation="horizontal"]) [part="tabs"] ::slotted(ptcs-tab[selected]) {
        color: var(--theme-color-dark-01, #232b2d);;
        border-color: var(--theme-color-primary-mid-01, #0094C8);
        font-weight: 600;
        z-index: 13;
      }

      /* Hide tab which is not visible */
      :host([orientation="horizontal"]) [part="tabs"] ::slotted(ptcs-tab:not([visible])) {
        display: none;
      }

      /* Remove margin-left on overflow when a tab is selected and becomes the only visible tab, using reflected property _oneTabLeft */
      :host([orientation="horizontal"][_one-tab-left]) [part="tabs"] ::slotted(ptcs-tab[selected]) {
        margin-left: 0px !important;
      }

      /* Vertical tab styles */
      /* Per design system, vertical is not supported - should we turn this off somehow? */
      :host([orientation="vertical"]) [part="tabs"] ::slotted(ptcs-tab) {
        border-left: 2px solid transparent;
      }

      :host([orientation="vertical"]) [part="tabs"] ::slotted(ptcs-tab[selected]) {
        border-left-color: currentColor;
      }

      :host [part="tabs-list"] {
        opacity:0;
        visibility: hidden;
        z-index: 13;
        display: none;
      }

      :host([_overflow-dropdown]) [part="tabs-list"] {
        opacity: 1;
        visibility: visible;
        display: inline-flex;
      }

      :host [part="back-button"],
      :host [part="forward-button"] {
        display: none;
     }

    :host([orientation=vertical]) [part="tabs-list"] {
        display: none;
    }

    </style>
  </template>
</dom-module>`;

document.head.appendChild($_documentContainer.content);
let template = null;

PTCS.Tabs = class extends PTCS.BehaviorStyleable(TabsElement) {
    static get is() {
        return 'ptcs-tabs';
    }

    // Add tabs dropdown list
    static get template() {
        if (template) {
            return template;
        }
        let stemplate = super.template.cloneNode(true);
        template = html`
      ${stemplate}
      <ptcs-dropdown id="tabslist" part="tabs-list" display-mode="small" icon="cds:icon_more_horizontal_mini" tabindex="-1"
      exportparts="select-box : tabs-list-select-box, icon : tabs-list-icon"
      items="[[_offScreenItems]]" disabled="[[disabled]]" state-selector="[[_itemStateSelector]]" selector="name"
      selected-value="[[selectedValue]]" on-selected-indexes-changed="_selectOverflowTab"
      custom-list-pos-rect="[[_tabsDropdownRect]]" value-hide disable-no-item-selection></ptcs-dropdown>`;
        return template;
    }

    static get properties() {
        return {
            disabled: {
                type:               Boolean,
                value:              false,
                reflectToAttribute: true
            },
            nameItems: {
                type:     Array,
                value:    () => [],
                observer: '_nameItemsChanged'
            },
            switchTabOnFocus: {
                type: Boolean
            },
            _offScreenItems: {
                type: Array
            },
            selected: {
                type:     Number,
                value:    0,
                observer: '_selectedChanged'
            },
            selectedValue: {
                type: String
            },
            _tabsWidth: {
                type: Array
            },
            _overflowDropdown: {
                type:               Boolean,
                reflectToAttribute: true
            },
            _oneTabLeft: {
                type:               Boolean,
                reflectToAttribute: true
            },
            _resizeObserver: {
                type: ResizeObserver
            }
        };
    }

    static get observers() {
        return [
            '_replaceTabindex(selected, disabled)'
        ];
    }

    ready() {
        super.ready();
        this.addEventListener('tab-focus', this._handleFocusedTab.bind(this));

        this.$.tabslist.valueSelector = item => item.value || item.name;

        this._resizeObserver = new ResizeObserver(() => {
            if (this.items) {
                this._updateOverflow();
                this._refreshTabsList();
            }
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

    _itemStateSelector(item) {
        if (!item) {
            return undefined;
        }
        if (item.visible === false) {
            return 'hidden';
        }
        if (item.disabled) {
            return 'disabled';
        }
        return undefined;
    }

    _replaceTabindex(selected) {
        const tabsTab = this.querySelectorAll('[part=tabs-tab]');
        if (tabsTab.length > 0) {
            for (let i = 0; i < tabsTab.length; i++) {
                tabsTab[i].setAttribute('tabindex', selected === i || selected === -1 ? '0' : '-1');
            }
        }
    }

    _nameItemsChanged(nameItems) {
        // Need to recompute tab widths
        this._tabsWidth = undefined;

        // Create offscreen items
        this._offScreenItems = nameItems.map(item => typeof item === 'string' ? {name: item, visible: false} : PTCS.clone(item));

        // Is selected item disabled or hidden?
        // Cannot use this code, because the MUB IDE starts withs hidden tabs...
        /*
        const available = item => !item.disabled && item.visible !== false;
        const selectedItem = this.selected >= 0 && nameItems && nameItems[this.selected];
        if (selectedItem && !available(selectedItem)) {
            this.selected = this.nameItems.findIndex(available);
            console.log('%c SELECTED ITEM IS HIDDEN / DISABLED. Switch to Tab ' + (this.selected + 1), 'background: red; color: white;');
        }
        */

        this._refreshTabsList();
    }

    // Swap to selected tab
    _dispatchSwapTab(selected) {
        if (this.nameItems && selected !== undefined && this.nameItems[selected] !== undefined) {
            this.dispatchEvent(new CustomEvent('swap-tab', {
                bubbles:  true, composed: true,
                detail:   {selected: selected}
            }));

            this._refreshTabsList();
        }
    }

    // Autoselect tab when it gets focus?
    _handleFocusedTab(ev) {
        if (this.switchTabOnFocus) {
            const selected = ev.detail.selected;
            // Disabled tab can get focus, but is not selectable
            if (!this.nameItems[selected].disabled) {
                this._dispatchSwapTab(selected);
            }
        }
    }

    // Keep selected tab in sync with the dropdown
    _selectedChanged(selected) {
        if (selected !== undefined && this.nameItems && this.nameItems[selected] !== undefined) {
            const selectedItem = this.nameItems[selected];

            if (typeof selectedItem === 'string') {
                this.selectedValue = selectedItem;
            } else {
                this.selectedValue = selectedItem.value || selectedItem.name;
            }

            this._dispatchSwapTab(selected);
        }
    }

    _refreshTabsList() {
        if (!this.__refreshOn) {
            this.__refreshOn = true;
            requestAnimationFrame(() => {
                this._refreshTabsListNow();
                this.__refreshOn = undefined;
            });
        }
    }

    _refreshTabsListNow() {
        if (!(this.items && this.items.length > 0) || !(this.nameItems && this.nameItems.length > 0) || this.$.scroll.clientWidth === 0) {
            return;
        }
        if (this._tabsWidth === undefined) {
            this._computeTabWidths();
        }

        let numVisibleTabs = 0;
        let reFilter = false;
        let availableWidth = this.$.scroll.clientWidth + 2; // expand borders

        // Set the container width limit (ensure that a selected tab will fit)
        if (this.selected >= 0 && this.selected < this.items.length) {
            availableWidth -= this._tabsWidth[this.selected];
        }

        for (let i = 0; i < this.items.length; i++) {
            if (this.nameItems[i].visible === false) {
                continue;
            }
            const tabEl = this.items[i];
            if (i === this.selected || availableWidth > this._tabsWidth[i]) {
                tabEl.setAttribute('visible', '');
                if (this._offScreenItems[i].visible !== false) {
                    this._offScreenItems[i].visible = false;
                    reFilter = true;
                }

                numVisibleTabs++;
                if (i !== this.selected) {
                    availableWidth -= this._tabsWidth[i];
                }
            } else {
                // Tab overflows tabs-list
                tabEl.removeAttribute('visible');

                // Add this tab to the overflow list
                if (this._offScreenItems[i].visible !== true) {
                    this._offScreenItems[i].visible = true;
                    reFilter = true;
                }

                // Set availableWidth to zero on overflow to prevent tabs after a long overflowing tab from becoming visible
                availableWidth = 0;
            }
        }

        // Overflow flag set when the dropdown list has at least one visible item
        this._overflowDropdown = this._offScreenItems.some(item => item.visible === true);

        // _oneTabLeft used to remove margin-left when only a single (selected) tab is visible
        this._oneTabLeft = numVisibleTabs === 1;

        // Get current position of the dropdown button, for custom positioning of the dropdown list
        let tabsRect = JSON.parse(JSON.stringify(this.$.tabslist.getBoundingClientRect()));
        tabsRect.left = 0;
        this._tabsDropdownRect = tabsRect;

        // Refilter dropdown if the overflow items has changed
        if (reFilter) {
            this.$.tabslist.reFilter();
        }
    }


    // Keep selected item in dropdown list in sync with selected tab
    // The drop-down list only contains off-screen items, when selected, it gets removed from that list
    _selectOverflowTab(ev) {
        if (this.disabled) {
            return;
        }

        const selected = ev.detail.value[0];
        if (selected !== undefined && this.items && this.items[selected] && !this.items[selected].disabled) {
            this.selected = selected;
        }

        // Update tabs list to remove the selected tab and add the tabs that gets swapped out
        this._refreshTabsList();
    }


    /** Override vaadin keydown handler
     *
     *
     */
    _onKeydown(ev) {
        this._keyDown(ev);
    }

    /**
   * Override because a single tab with a long name should have ellipsis and we don't want to show partially visible tabs
   *
   */
    _updateOverflow() {
    // TW-52587: Buttons should be visible in disabled mode too
    //if (this.disabled) {
    //  return;
    //}
        if (this.updateOverflowTimeout) {
            return;
        }
        this.updateOverflowTimeout = setTimeout(() => {
            this.updateOverflowTimeout = undefined;
            super._updateOverflow();

            const width = this.innerWidth || this.scrollWidth; // try to get parent (tabs element width)
            if (width && this.items && this.items.length > 0) {
                this._setMaxWidth();
                if (this.bScrollAllowed === undefined) {
                    this.bScrollAllowed = false; // at init state this function will be called twice.
                    // ignore first call since styles aren't ready yet (MB support)
                    return;
                }
            }
            super._updateOverflow();
            this._refreshTabsList();
        }, 100);
    }


    /**
   * overwritten from vaadin-list-mixin
   * do nothing if tab already visible on the screen
   * otherwise - try to make idx item to become first visible
   * @private
   */
    _scrollToItem(/*index*/) {
        return;
    }

    // Set maxWidth as a width of visible area
    _setMaxWidth() {
        const bb = this.$.scroll.getBoundingClientRect();
        const scrollWidth = `${bb.right - bb.left}px`;

        for (let i = 0; i < this.items.length; i++) {
            this.items[i].style.maxWidth = scrollWidth;
        }
    }

    // Compute all tab widths once, ignore all cases where state information might affect the widths or margins. (Improve later?)
    _computeTabWidths() {
        if (this.$.scroll.clientWidth === 0) {
            return;
        }

        this._tabsWidth = [];
        if (this.items && this.items.length > 0) {
            // Make sure all available tabs are visible
            for (let i = 0; i < this.items.length; i++) {
                if ((this.nameItems[i] && this.nameItems[i].visible) === false) {
                    this.items[i].removeAttribute('visible');
                } else {
                    this.items[i].setAttribute('visible', '');
                }
            }

            // Compute widths
            for (let i = 0; i < this.items.length; i++) {
                const tabEl = this.items[i];
                const cs = getComputedStyle(tabEl);
                const margin = parseInt(cs.getPropertyValue('margin-left')) + parseInt(cs.getPropertyValue('margin-right'));
                this._tabsWidth[i] = tabEl.clientWidth + margin;
            }
        }
    }

    _keyDown(ev) {
        const focusedItem = ev.target;

        const cmpntName = focusedItem.nodeName;
        switch (ev.key) {
            case 'ArrowLeft':
                switch (cmpntName) {
                    case 'PTCS-TAB': {
                        let prev = focusedItem.previousElementSibling;
                        while (prev && !prev.hasAttribute('visible')) {
                            prev = prev.previousElementSibling;
                        }
                        if (prev) {
                            prev.focus();
                        } else if (this._overflowDropdown) {
                            this.$.tabslist.focus();
                        }

                    }
                        ev.stopPropagation();
                        break;
                    case 'PTCS-TABS': {// Dropdown
                        let prev = this.shadowRoot.host.lastElementChild;
                        while (prev && !prev.hasAttribute('visible')) {
                            prev = prev.previousElementSibling;
                        }
                        if (prev) {
                            prev.focus();
                        }
                        ev.stopPropagation();
                        break;
                    }
                }
                break;
            case 'ArrowRight':
                switch (cmpntName) {
                    case 'PTCS-TAB': {
                        let next = focusedItem.nextElementSibling;
                        while (next && !next.hasAttribute('visible')) {
                            next = next.nextElementSibling;
                        }
                        if (next) {
                            next.focus();
                        } else if (this._overflowDropdown) {
                            this.$.tabslist.focus();
                        }
                    }
                        ev.stopPropagation();
                        break;
                    case 'PTCS-TABS': {// Dropdown
                        let next = this.shadowRoot.host.firstElementChild;
                        while (next && !next.hasAttribute('visible')) {
                            next = next.nextElementSibling;
                        }
                        if (next) {
                            next.focus(); // First ptcs-tab that is visible
                        }
                        ev.stopPropagation();
                        break;
                    }
                }

        }
    }

    // Recompute widths and overflows
    refresh() {
        this._nameItemsChanged(this.nameItems);
    }

    static get $parts() {
        return ['tabs', 'back-button', 'tabs-list', 'forward-button', 'tabs-list-select-box', 'tabs-list-icon'];
    }
};

customElements.define(PTCS.Tabs.is, PTCS.Tabs);
