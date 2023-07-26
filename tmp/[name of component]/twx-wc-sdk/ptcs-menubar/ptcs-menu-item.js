import {PolymerElement, html} from '@polymer/polymer/polymer-element.js';
import {PTCS} from 'ptcs-library/library.js';
import {createSubComponent} from 'ptcs-library/create-sub-component.js';
import 'ptcs-behavior-styleable/ptcs-behavior-styleable.js';
import 'ptcs-behavior-focus/ptcs-behavior-focus.js';
import 'ptcs-behavior-tooltip/ptcs-behavior-tooltip.js';
import 'ptcs-label/ptcs-label.js';
import 'ptcs-icons/cds-icons.js';

PTCS.MenuItem = class extends PTCS.BehaviorTooltip(PTCS.BehaviorFocus(PTCS.BehaviorStyleable(PTCS.ThemableMixin(PolymerElement)))) {
    static get template() {
        return html`
        <style>
            :host {
                cursor: pointer;
                display: flex;
                flex-direction: row;
                width: 100%;
                align-items: center;

                box-sizing: border-box;

                white-space: nowrap;
                overflow: hidden;
            }

            :host([hidden]) {
                display: none;
            }

            :host([disabled]) {
                cursor: default;
            }

            [part=label] {
                flex-grow: 100;
            }

        </style>

        <ptcs-icon part="icon" icon="[[_getIcon(icon, allowMissingIcons)]]" size="[[_iconSize(iconWidth, iconHeight)]]" icon-width="[[iconWidth]]"
        icon-height="[[iconHeight]]" hidden$="[[_noIcon(icon, allowMissingIcons, displayIcons)]]" aria-hidden="true"></ptcs-icon>
        <ptcs-label part="label" id="label" label="[[text]]" hidden$="[[_hideLabel(compactMode, level)]]"
            tooltip="[[tooltip]]" tooltip-icon="[[tooltipIcon]]" disable-tooltip="true"></ptcs-label>
        <ptcs-icon part="submenu-icon" icon="cds:icon_chevron_right_mini" hidden$="[[_hideSubmenuIcon(submenu, compactMode, level)]]"
            aria-hidden="true"></ptcs-icon>`;
    }

    static get is() {
        return 'ptcs-menu-item';
    }

    static get properties() {
        return {
            item: {
                type: Object
            },

            text: {
                type: String
            },

            icon: {
                type: String
            },

            iconWidth: {
                type: String
            },

            iconHeight: {
                type: String
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

            menuMaxWidth: {
                type: String
            },

            menuMinWidth: {
                type: String
            },

            submenu: {
                type:  Array,
                value: () => []
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

            level: {
                type:               Number,
                reflectToAttribute: true
            },

            selected: {
                type:               Boolean,
                reflectToAttribute: true
            },

            noContent: {
                type:               Boolean,
                computed:           '_noContent(submenu)',
                reflectToAttribute: true
            },

            header: {
                type:               Boolean,
                reflectToAttribute: true
            },

            allSiblingsChildless: {
                type:               Boolean,
                value:              false,
                reflectToAttribute: true
            },

            role: {
                type:               String,
                value:              'menuitem',
                reflectToAttribute: true
            },

            ariaLabel: {
                type:               String,
                computed:           '_ariaLabel(text)',
                reflectToAttribute: true
            },

            ariaHaspopup: {
                type:               String,
                computed:           '_ariaHaspopup(submenu)',
                reflectToAttribute: true
            },

            ariaExpanded: {
                type:               String,
                computed:           '_ariaExpanded(selected)',
                reflectToAttribute: true
            },

            _popup: {
                type: Object
            },

            _parent: {
                type: Object
            },

            ignoreClick: {
                type:  Boolean,
                value: false
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
        this.addEventListener('click', (ev) => {
            this._click();
            ev.preventDefault();
        });
        this.tooltipFunc = this._monitorTooltip;
    }

    connectedCallback() {
        super.connectedCallback();

        // Set the _parent pointer (the submenu or the menu itself)
        this._parent = this._getClosestParentContainer();
    }

    _iconSize(iconWidth, iconHeight) {
        if (iconWidth || iconHeight) {
            return 'custom';
        }
        return 'small';
    }

    _getClosestParentContainer() {
        for (let el = this; el; el = el.parentNode) {
            if (el.nodeName === '#document-fragment') {
                return el.host;
            }
        }
        return null;
    }

    _hideLabel(compactMode, level) {
        return compactMode && level === 0;
    }

    _hideSubmenuIcon(submenu, compactMode, level) {
        if (compactMode && level === 0) {
            // New spec---the icon should never be shown when the menu is collapsed
            return true;
        }
        if (Array.isArray(submenu) && submenu.length > 0) {
            return false;
        }
        return true;
    }

    _noContent(submenu) {
        if (Array.isArray(submenu) && submenu.length > 0) {
            return false;
        }
        return true;
    }

    _ariaLabel(text) {
        return text;
    }

    _ariaHaspopup(submenu) {
        return !this._hideSubmenuIcon(submenu, false, 0);
    }

    _ariaExpanded(selected) {
        return selected;
    }

    _getIcon(icon, allowMissingIcons) {
        if (icon) {
            return icon;
        }
        // No icon specified, use default if so configured
        return allowMissingIcons ? icon : 'cds:icon_image';
    }

    _noIcon(icon, allowMissingIcons, displayIcons) {
        if (!displayIcons) {
            // Never display any icons, even if they are specified
            return true;
        }
        if (icon) {
            // Nope, there is an icon
            return false;
        }
        return allowMissingIcons;
    }

    _monitorTooltip() {
        if (this.compactMode && this.level === 0) {
            return this.text;
        }
        // In the "normal" case, the label component handles everything...
        return this.$.label.tooltipFunc();
    }

    _containsPoint(xPos, yPos) {
        const _inRect = (x, y, rect) => x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
        if (_inRect(xPos, yPos, this.getBoundingClientRect())) {
            // This was a click inside a popup, don't do anything
            return true;
        }
        // If we got here, the point was outside this menu item---but we have to check "our" popups as well
        if (this._popup) {
            return this._popup._containsPoint(xPos, yPos);
        }
        // Nope, not within the scope of this item (or its subitems)
        return false;
    }

    _getMainComponent() {
        let el = this._parent;
        while (el._parent) {
            el = el._parent;
        }
        return el;
    }

    _dispatchClickedEvent() {
        // Find the "main" component and dispatch the event from there...
        this._getMainComponent().dispatchEvent(new CustomEvent(
            'action',
            {
                bubbles:  true,
                composed: true,
                detail:   {item: this.item}
            }));
    }

    // The selectionMade parameter is true if we close the "chain" of popups because a proper selection
    // was made (and false if the popup was closed because of a "click outside" or a click on some other item)
    _closeParents(selectionMade = false) {
        // If we have an open popup, remove it from the tree
        if (this._popup) {
            document.body.removeChild(this._popup);
            this._popup = null;
        }

        if (this.level === 0 && this.isWithinFlyout && selectionMade) {
            // The top-level items should now remain selected after a "proper" selection (but remove the flag
            // from any previously selected top level item...)
            if (this._parent._selectedTopLevelItem && this._parent._selectedTopLevelItem !== this) {
                this._parent._selectedTopLevelItem.selected = false;
            }
            this._parent._selectedTopLevelItem = this;
        } else {
            // No longer selected
            this.selected = false;
        }

        // Continue upwards in the tree
        this._parent._closeParents(selectionMade);
    }

    get isWithinFlyout() {
        // The feature to keep top-level items selected should ONLY be available in ptcs-menubar, not in the ptcs-menu-button
        return this._parent && this._parent.nodeName === 'PTCS-MENU-FLYOUT';
    }

    _closeChildren() {
        if (this._popup) {
            // Process children first (recursively)...
            this._popup._closeChildren();

            // ...and then remove it from the DOM tree
            document.body.removeChild(this._popup);
            this._popup = null;
        }

        if (!this.isEmptyTopLevelItem) {
            // No longer selected
            this.selected = false;
        }
    }

    get isEmptyTopLevelItem() {
        return this.level === 0 && this._noContent(this.submenu);
    }

    _closeCurrentPopup() {
        this.selected = false;
        this._parent._setSelectedItem(null);
        this._parent.focus();
    }

    _nextLevel(level) {
        return level + 1;
    }

    _createPopup() {
        let el = createSubComponent(this, `<ptcs-menu-submenu part$="popup" variant="[[variant]]"
            items="[[_createSubmenu(submenu)]]" parent-item="[[item]]" compact-mode="[[compactMode]]"
            icon-width="[[iconWidth]]" icon-height="[[iconHeight]]"
            menu-max-width="[[menuMaxWidth]]" menu-min-width="[[menuMinWidth]]"level="[[_nextLevel(level)]]"
            max-submenu-items="[[maxSubmenuItems]]" allow-missing-icons="[[allowMissingIcons]]"
            more-items-icon="[[moreItemsIcon]]" more-items-label="[[moreItemsLabel]]"
            display-icons="[[displayIcons]]" __az-navigation="[[__azNavigation]]">`);

        // Remember that we are the parent of this new popup
        el._parent = this;

        return el;
    }

    _createSubmenu(submenu) {
        if (Array.isArray(submenu) && submenu.length > this.maxSubmenuItems) {
            // Too many submenu items, move the surplus ones to a 'More...' entry...
            let submenuItems = [...submenu];
            const moreItems = submenuItems.splice(this.maxSubmenuItems > 0 ? this.maxSubmenuItems - 1 : 0);
            let more = {};
            more.icon = this.moreItemsIcon;
            more.label = this.moreItemsLabel;
            more.content = moreItems;
            submenuItems.push(more);
            return submenuItems;
        }

        // Within limits, use original...
        return submenu;
    }

    _positionPopup() {
        const rectItem = this.getBoundingClientRect();

        const widthWindow = window.innerWidth;
        const heightWindow = window.innerHeight;

        const rectPopup = this._popup.getBoundingClientRect();
        const widthPopup = rectPopup.width;

        let posX = rectItem.left + rectItem.width;

        if (this.level === 0) {
            // Here we should SOMEHOW try to compensate the position of the first popup
            // level, it gets too far to the left (unless the menu itself is very far to the left,
            // which it usually is)...
        }

        // In the "overflow" case (where there isn't enough space to the right of this item to add a
        // popup menu), we should add a border and a slight offset to the popup, and this should
        // be done for all "subsequent" popups---so check if "our" popup is in overflow mode...
        let overflowOffset = 0;

        // By default, there should be no "overflow" border in the new popup
        this._popup.overflow = this._parent.overflow || false;

        // Does the popup fit on the right side?
        if (posX + widthPopup > widthWindow) {
            const leftSidePos = rectItem.left - widthPopup;
            // The menu should be shifted *upwards*...
            overflowOffset = -16;
            this._popup.overflow = true;

            if (leftSidePos > 0) {
                // Fits to the left
                posX = leftSidePos;
            } else {
                // Here it won't fit on either side, so emit the popup aligned to the right window border,
                // slightly offset vertically
                posX = widthWindow - (widthPopup + 1);
            }
        }

        let posY = Math.max(0, rectItem.top + overflowOffset);

        // Adjust the vertical position as well
        const numPopupItems = Math.min(this.submenu.length, this.maxSubmenuItems ? this.maxSubmenuItems : this.submenu.length);
        let estimatedPopupHeight = numPopupItems * rectItem.height + 1;

        if (this._popup.overflow) {
            // Get the top/bottom border widths added in theming and compensate the height
            const cs = getComputedStyle(this._popup);
            const borderTopWidthStr = cs.getPropertyValue('border-top-width');
            const borderTopWidth = Number(borderTopWidthStr.substr(0, borderTopWidthStr.indexOf('px'))) || 0;
            const borderBottomWidthStr = cs.getPropertyValue('border-bottom-width');
            const borderBottomWidth = Number(borderBottomWidthStr.substr(0, borderBottomWidthStr.indexOf('px'))) || 0;
            estimatedPopupHeight += (borderTopWidth + borderBottomWidth);
        }

        if (posY + estimatedPopupHeight > heightWindow) {
            posY = Math.max(0, heightWindow - estimatedPopupHeight);
        }

        // Set the final position
        this._popup.style.left = `${posX}px`;
        this._popup.style.top = `${posY}px`;
    }

    _activate() {
        // Disabled item should not be clickable or accessible through the keyboard
        if (this.disabled) {
            return;
        }

        if (!this._parent._setSelectedItem) {
            // We use a ptcs-menu-item to display the footer, outside of the ptcs-menu-flyout structure...
            this._tooltipClose();
            this._dispatchClickedEvent();
            return;
        }

        // Tell the parent (main component or popup) that this is now the selected item
        this._parent._setSelectedItem(this);

        // In case the current item was showing a tooltip, close it...
        this._tooltipClose();

        if (!this.submenu || this.submenu.length === 0) {
            if (this.level === 0 && this.isWithinFlyout) {
                // If it's the first level item make it selected (TW-88197), after removing any previous top-level selection
                if (this._parent._selectedTopLevelItem && this._parent._selectedTopLevelItem !== this) {
                    this._parent._selectedTopLevelItem.selected = false;
                }

                this._parent._selectedTopLevelItem = this;
                this.selected = true;
            } else {
                // Inform the parent (popup or main component) that it should close the popup chain, and that a "proper"
                // selection has been made
                this._parent._closeParents(true);
            }

            // Here we communicate the menu selection to the world
            this._dispatchClickedEvent();

            // Done
            return;
        }

        // User click in an item---this should now be selected
        this.selected = true;

        // Create the element
        this._popup = this._createPopup();

        // Display the popup
        document.body.appendChild(this._popup);

        this._popup.style.position = 'absolute';
        this._popup.style.boxSizing = 'border-box';

        // Hide the popup until it is time to do the positioning
        this._popup.setAttribute('hidden', '');

        if (this.menuMaxWidth) {
            const stringValue = this.menuMaxWidth + '';
            if (stringValue.match(/^[0-9]+([,.][0-9]+)?$/)) {
                this._popup.style.maxWidth = this.menuMaxWidth + 'px';
            } else {
                this._popup.style.maxWidth = this.menuMaxWidth;
            }
        } else {
            this._popup.style.removeProperty('max-width');
        }

        if (this.menuMinWidth) {
            const stringValue = this.menuMinWidth + '';
            if (stringValue.match(/^[0-9]+([,.][0-9]+)?$/)) {
                this._popup.style.minWidth = this.menuMinWidth + 'px';
            } else {
                this._popup.style.minWidth = this.menuMinWidth;
            }
        } else {
            this._popup.style.removeProperty('min-width');
        }

        // Position the popup on the window where it is visible (wait a bit to let it "get" the size)
        setTimeout(() => {
            // Make sure it is visible again
            this._popup.removeAttribute('hidden');

            // Now the "real" size of the meny should be available
            this._positionPopup();

            const mainElt = this._getMainComponent();

            // Set the tabindex to be whatever the "main" component is having
            const tabindex = mainElt.getAttribute('tabindex');

            if (tabindex) {
                this._popup.setAttribute('tabindex', tabindex);
            }

            // Move focus to the new popup
            this._popup.focus();
        }, 100);
    }

    _click() {
        if (!this.disabled && !this.ignoreClick) {
            this._activate();
        }
    }
};

customElements.define(PTCS.MenuItem.is, PTCS.MenuItem);
