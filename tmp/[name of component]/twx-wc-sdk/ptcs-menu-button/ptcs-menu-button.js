import {LitElement, html, css} from 'lit';
import {L2Pw} from 'ptcs-library/library-lit';
import {PTCS} from 'ptcs-library/library.js';
import 'ptcs-button/ptcs-button.js';
import 'ptcs-menubar/ptcs-menu-submenu.js';
import {createSubComponent} from 'ptcs-library/create-sub-component.js';
import 'ptcs-behavior-styleable/ptcs-behavior-styleable.js';
import 'ptcs-behavior-focus/ptcs-behavior-focus.js';
import 'ptcs-behavior-tooltip/ptcs-behavior-tooltip.js';
import 'ptcs-behavior-tabindex/ptcs-behavior-tabindex.js';
import 'ptcs-icons/cds-icons.js';

const _menuComponentConfig = `<ptcs-menu-submenu part$="menu" style="position:absolute;left:0;top:0;visibility:hidden;"
level="[[__firstMenuLevel]]" disabled="[[disabled]]"
display-icons="[[displayIcons]]" allow-missing-icons="[[allowMissingIcons]]"
variant="[[menuColor]]" menu-max-width="[[_menuMaxWidth]]" menu-min-width="[[_menuMinWidth]]"
max-submenu-items="[[maxMenuItems]]" more-items-icon="[[moreItemsIcon]]" more-items-label="[[moreItemsLabel]]" __az-navigation="[[__azNavigation]]">`;
PTCS.MenuButton = class extends PTCS.BehaviorTabindex(PTCS.BehaviorTooltip(PTCS.BehaviorFocus(
    PTCS.BehaviorStyleable(/*PTCS.ThemableMixin(*/L2Pw(LitElement)/*)*/)))) {
    static get styles() {
        return css`
        :host {
            display: inline-block;
        }

        [part=button] {
            width: 100%;
        }`;
    }

    render() {
        return html`<ptcs-button id="button" .disabled=${this.disabled} part="button" tabindex=${this._delegatedFocus} ?selected=${this._selected}
            .variant=${this.buttonVariant} .icon=${this.icon} .label=${this.label}
            .disableTooltip=${this.disableTooltip} .tooltip=${this.tooltip} .tooltipIcon=${this.tooltipIcon}
            .contentAlign=${this.contentAlign} .iconPlacement=${this.iconPlacement} .buttonMaxWidth=${this.buttonMaxWidth}>
        </ptcs-button>`;
    }

    static get is() {
        return 'ptcs-menu-button';
    }

    static get properties() {
        return {
            items: {
                type:  Array,
                value: () => []
            },

            disabled: {
                type:    Boolean,
                value:   false,
                reflect: true
            },

            offset: {
                type:     Number,
                value:    8,
                observer: '_setMenuPosition'
            },

            _mode: {
                type:  String,
                value: 'closed'
            },

            _position: {
                type:  String,
                value: 'below'
            },

            _selected: {
                type:    Boolean,
                value:   false,
                reflect: true
            },

            openOnHover: {
                type:      Boolean,
                value:     false,
                attribute: 'open-on-hover'
            },

            buttonVariant: {
                type:      String,
                value:     'tertiary',
                attribute: 'button-variant'
            },

            icon: {
                type:  String,
                value: 'cds:icon_more_vertical'
            },

            contentAlign: {
                type:      String,
                value:     'center',
                reflect:   true,
                attribute: 'content-align'
            },

            menuPlacement: {
                type:      String,
                value:     'vertical',
                attribute: 'menu-placement'
            },

            buttonMaxWidth: {
                type:      Number,
                attribute: 'button-max-width'
            },

            label: {
                type: String
            },

            iconPlacement: {
                type:      String,
                value:     'right',
                attribute: 'icon-placement'
            },

            allowMissingIcons: {
                type:      Boolean,
                value:     false,
                attribute: 'allow-missing-icons'
            },

            displayIcons: {
                type:      Boolean,
                value:     false,
                attribute: 'display-icons'
            },

            menuMaxWidth: {
                type:      String,
                value:     'auto',
                attribute: 'menu-max-width'
            },

            _menuMaxWidth: {
                type:     String,
                computed: '_computeWidth(menuMaxWidth)'
            },

            menuMinWidth: {
                type:      String,
                value:     'auto',
                attribute: 'menu-min-width'
            },

            _menuMinWidth: {
                type:     String,
                computed: '_computeWidth(menuMinWidth)'
            },

            maxMenuItems: {
                type:      Number,
                value:     5,
                attribute: 'max-menu-items'
            },

            menuColor: {
                type:      String,
                value:     'light',
                reflect:   true,
                attribute: 'menu-color'
            },

            moreItemsIcon: {
                type:      String,
                value:     'cds:icon_more_horizontal',
                attribute: 'more-items-icon'
            },

            moreItemsLabel: {
                type:      String,
                value:     'More...',
                attribute: 'more-items-label'
            },

            __firstMenuLevel: {
                type:     Number,
                value:    1,
                readOnly: true
            },

            // Temporary property that enables the a-z navigation only for ptcs menu button
            __azNavigation: {
                type:     Boolean,
                value:    true,
                readOnly: true
            },

            // Focus delegation
            _delegatedFocus: String
        };
    }

    ready() {
        super.ready();

        this.tooltipFunc = this._monitorTooltip.bind(this);

        this.$.button.addEventListener('click', () => {
            this.openMenu('first');
        });

        this.$.button.addEventListener('mouseover', () => {
            if (this.openOnHover && this._mode === 'closed') {
                this.openMenu('first', true);
            }
        });

        this._clickOutsideHandler = ev => {
            if (this._isEventOutside(ev) && this._mode === 'open') {
                ev.preventDefault();
                ev.stopPropagation();

                this.closeMenu();
            }
        };

        this._mouseOutsideHandler = ev => {
            if (this._isEventOutside(ev) && this._mode === 'open') {
                ev.preventDefault();
                ev.stopPropagation();
            }
        };

        this._mouseOverHandler = ev => {
            if (this._isEventOutside(ev) && this._mode === 'open') {
                ev.preventDefault();
                ev.stopPropagation();

                this.closeMenu();
            }
        };

        this.addEventListener('action', () => {
            this.closeMenu();
        });

        // For keyboard navigation / managing focus
        this.$.button.addEventListener('keydown', ev => this._keyDown(ev));
    }

    connectedCallback() {
        super.connectedCallback();

        // We should close all popups if the window is resized...
        window.addEventListener('resize', this._windowResized.bind(this));
    }

    disconnectedCallback() {
        super.disconnectedCallback();

        window.removeEventListener('resize', this._windowResized.bind(this));

        this.closeMenu();
    }

    _monitorTooltip() {
        return this.$.button.tooltipFunc();
    }

    _createMenuItems() {
        if (this.items.length > this.maxMenuItems) {
            // Too many menu items, move the surplus ones to a 'More...' entry...
            let menuItems = [...this.items];
            const moreItems = menuItems.splice(this.maxMenuItems > 0 ? this.maxMenuItems - 1 : 0);
            let more = {};
            more.icon = this.moreItemsIcon;
            more.label = this.moreItemsLabel;
            more.content = moreItems;
            menuItems.push(more);
            return menuItems;
        }

        // Within limits, use original...
        return this.items;
    }

    closeMenu(closeChildren = true) {
        if (this._mode === 'open') {
            if (closeChildren) {
                // We may want not to close the children in case they are already closed by the internal logic of the submenu
                this._menu._closeChildren();
            }

            document.body.removeChild(this._menu);

            this._mode = 'closed';

            if (this._clickOutsideHandler) {
                document.removeEventListener('click', this._clickOutsideHandler, true);
            }

            if (this._mouseOutsideHandler) {
                document.removeEventListener('mousedown', this._mouseOutsideHandler, true);
                document.removeEventListener('mouseup', this._mouseOutsideHandler, true);
            }

            if (this._mouseOverHandler) {
                document.removeEventListener('mousemove', this._mouseOverHandler, true);
            }

            this._selected = false;

            this.disableTooltip = false;

            return;
        }
    }

    _computeWidth(w) {
        return w === 'auto' ? undefined : w;
    }

    // Is called by the sub menu when it's closed
    _closeParents() {
        this.closeMenu(false);

        if (this.hasAttribute('tabindex')) {
            this.$.button.focus();
        }
    }

    _createMenu() {
        if (!this._menu) {
            this._menu = createSubComponent(this, _menuComponentConfig);

            this._menu._parent = this;
        }
    }

    openMenu(focusOn = 'first', noSelection) {
        if (this.disabled) {
            return;
        }

        if (this._mode === 'open') {
            this.closeMenu();
            return;
        }

        this._createMenu();

        document.body.appendChild(this._menu);

        this._mode = 'open';

        // I'm not able to get the correct visual order of the items using _menuComponentConfig. Something is not refreshed on dom-repeat.
        // For now passing the items this way.
        this._menu.items = this._createMenuItems();

        // Set the tabindex to be whatever the "main" component is having
        const tabindex = this.getAttribute('tabindex');

        if (tabindex) {
            this._menu.setAttribute('tabindex', tabindex);
        } else {
            this._menu.removeAttribute('tabindex');
        }

        document.addEventListener('click', this._clickOutsideHandler, true);
        document.addEventListener('mousedown', this._mouseOutsideHandler, true);
        document.addEventListener('mouseup', this._mouseOutsideHandler, true);

        if (this.openOnHover && noSelection) {
            document.addEventListener('mousemove', this._mouseOverHandler, true);
        }

        this._menu.style.visibility = 'hidden';

        this._tooltipClose();
        this.disableTooltip = true;

        // Wait a small timeout for the menu to get the real size
        setTimeout(() => {
            this._setMenuPosition();

            if (this.hasAttribute('tabindex')) {
                this._menu.focus();

                if (focusOn === 'last') {
                    this._menu._focusedItem = this._menu._getMenuItemElements().length - 1;
                }
            }

            if (!noSelection) {
                this._selected = true;
            }
        }, 100);
    }

    _closeCurrentPopup() {
        this._closeParents();
    }

    _setMenuPosition() {
        if (!this._menu) {
            return;
        }

        const r = this.$.button.getBoundingClientRect();

        const widthWindow = window.innerWidth;
        const heightWindow = window.innerHeight;

        const rMenu = this._menu.getBoundingClientRect();
        const w = rMenu.width;
        const h = rMenu.height;

        let posX, posY, hOffset = 0, vOffset = 0;

        if (this.menuPlacement === 'horizontal') {
            hOffset = PTCS.cssDecodeSize(this.offset);

            posX = r.left + r.width + hOffset;
            posY = r.top;
        } else {
            vOffset = PTCS.cssDecodeSize(this.offset);

            posX = r.left;
            posY = r.top + r.height + vOffset;
        }

        // Does the menu fit below the button?
        if (posY + h > heightWindow) {
            const topSidePos = (this.menuPlacement === 'horizontal' ? r.bottom : r.top) - h - vOffset;

            if (topSidePos > 0) {
                // Fits to the top
                posY = topSidePos;
                this._position = this.menuPlacement === 'horizontal' ? this._position : 'above';
            } else {
                // Here it won't fit on either side, so emit the popup aligned to the bottom window border,
                // slightly offset horizontally
                posY = heightWindow - (h + 1);
            }
        } else {
            this._position = this.menuPlacement === 'horizontal' ? this._position : 'below';
        }

        // Does the menu fit to the right of the button?
        if (posX + w > widthWindow) {
            const leftSidePos = (this.menuPlacement === 'horizontal' ? r.left : r.right) - w - hOffset;

            if (leftSidePos > 0) {
                // Fits to the left
                posX = leftSidePos;
                this._position = this.menuPlacement === 'horizontal' ? 'left' : this._position;
            } else {
                // Here it won't fit on either side, so emit the popup aligned to the bottom window border,
                // slightly offset vertically
                posX = widthWindow - (w + 1);
            }
        } else {
            this._position = this.menuPlacement === 'horizontal' ? 'right' : this._position;
        }

        // Set the final position
        // this._setMenuOffset();

        this._menu.style.visibility = '';

        this._menu.style.left = `${posX}px`;
        this._menu.style.top = `${posY}px`;
    }

    _isEventOutside(/**@type {MouseEvent}*/ ev) {
        if (this._mode === 'closed' || !this._menu) {
            return true;
        }

        // Is event inside the button?
        const inButton = (x, y) => {
            const rect = this.$.button.getBoundingClientRect();
            let left, right, top, bottom;
            ({left, right, top, bottom} = rect);
            const offset = PTCS.cssDecodeSize(this.offset);

            switch (this._position) {
                case 'above':
                    top -= offset;
                    break;
                case 'below':
                    bottom += offset;
                    break;
                case 'left':
                    left -= offset;
                    break;
                case 'right':
                    right += offset;
                    break;
                default:
            }

            return x >= Math.floor(left) && x <= Math.floor(right) && y >= Math.floor(top) && y <= Math.floor(bottom);
        };

        if (inButton(ev.clientX, ev.clientY)) {
            return false;
        }

        // Is event inside the menu?
        const menuItemElts = this._menu._getMenuItemElements();

        return Array.prototype.reduce.call(menuItemElts, (outside, menuItemElt) => {
            return outside && !menuItemElt._containsPoint(ev.clientX, ev.clientY);
        }, true);
    }

    _windowResized() {
        this.closeMenu();
    }

    _keyDown(ev) {
        switch (ev.key) {
            case 'ArrowUp':
                this.openMenu('last');
                ev.preventDefault();
                break;
            case 'ArrowDown':
                this.openMenu('first');
                ev.preventDefault();
                break;
        }
    }

    static get $parts() {
        return [];
    }
};

customElements.define(PTCS.MenuButton.is, PTCS.MenuButton);
