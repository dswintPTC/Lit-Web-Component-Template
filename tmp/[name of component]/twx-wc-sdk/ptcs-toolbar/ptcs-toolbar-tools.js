import {PolymerElement, html} from '@polymer/polymer/polymer-element.js';
import {PTCS} from 'ptcs-library/library.js';
import 'ptcs-label/ptcs-label.js';
import 'ptcs-button/ptcs-button.js';
import 'ptcs-link/ptcs-link.js';
import 'ptcs-chip/ptcs-chip.js';
import 'ptcs-dropdown/ptcs-dropdown.js';
import './ptcs-toolbar-popup.js';
import 'ptcs-behavior-styleable/ptcs-behavior-styleable.js';
import 'ptcs-icons/cds-icons.js';

/* eslint-disable no-confusing-arrow */

// Offset from overflow button to overflow list
const offsetToPopup = 8;
const offsetToWindowOverflowPopup = 20;
const offsetToMashupToolbar = 34;

// Symbol fields in action element
const actionField = Symbol('action'); // {action, states}
const assignField = Symbol('set-value'); // value => {assign value to component}

// Only need one instance each of these functions
const selectDropdownLabel = item => item.label || item.value;
const selectDropdownValue = item => item.value;
const selectDropdownState = item => item.state;

const setWidth = (el, width, maxWidth) => {
    if (width) {
        el.style.width = `${PTCS.cssDecodeSize(width, el)}px`;
    }
    if (maxWidth) {
        el.style.maxWidth = `${PTCS.cssDecodeSize(maxWidth, el)}px`;
    }
};

// The Toolbar Tools component
PTCS.ToolBarTools = class extends PTCS.BehaviorStyleable(PTCS.ThemableMixin(PolymerElement)) {

    static get template() {
        return html`
        <style>
            :host {
                flex: 1 1 auto;
                display: flex;
                overflow: hidden;
            }

            [part=actions] {
                display: flex;
                align-items: flex-end;
            }

            .filter-cntr {
                display: none;
            }

            :host([show-filter]) .filter-cntr {
                display: flex;
                align-items: flex-end;
            }

            .right-cntr {
                flex: 1 1 auto;
                display: flex;
                align-items: flex-end;
                justify-content: flex-end;
            }

            :host([filter-pos=center]) .filter-cntr {
                order: 2;
                flex: 1 1 auto;
            }

            :host([filter-pos=center][filter-align=center]) .filter-cntr {
                justify-content: center;
            }

            :host([filter-pos=center][filter-align=right]) .filter-cntr {
                justify-content: flex-end;
            }

            :host([filter-pos=center]) [part=actions] {
                order: 1;
            }

            :host([filter-pos=center]) .right-cntr {
                flex: 0 0 auto;
                order: 3;
            }

            :host([filter-pos=right]) .filter-cntr {
                order: 3;
            }

            :host([filter-pos=right]) [part=actions] {
                order: 1;
            }

            :host([filter-pos=right]) .right-cntr {
                order: 2;
            }

            [part=right-actions] {
                display: flex;
                align-items: flex-end;
            }

            [part~=overflow-button] {
                position: absolute;
            }

            [part~=action] {
                flex: 0 0 auto;
            }

            [part~=action][hidden] {
                display: none !important;
            }

            [part~=right-action] {
                flex: 0 0 auto;
            }

            [part~=right-action][hidden] {
                display: none !important;
            }

            [part~=additional-label] {
                flex: 0 0 auto;
            }

            [part~=right-overflow-button] {
                margin-left: 0 !important;
            }

            [part~=right-actions]:not([collapsed]) [part~=right-overflow-button] {
                display: none;
            }

            [part~=right-actions][collapsed] :not([part~=right-overflow-button]) {
                display: none;
            }
        </style>

        <div class="filter-cntr">
            <ptcs-textfield part="simple-filter" id="filter"
                disabled="[[disabled]]"
                hidden\$="[[!additionalLabel]]"
                label="[[filterLabel]]"
                icon="[[filterIcon]]"
                hint-text="[[filterHintText]]"
                tooltip="[[filterTooltip]]"
                text="{{filterString}}"></ptcs-textfield>
        </div>
        <ptcs-label id="additional-label" variant="label" part="additional-label" label="[[additionalLabel]]" vertical-alignment='flex-end'
                hidden\$="[[!additionalLabel]]">
        </ptcs-label>
        <div id="actions" part="actions"
            ><ptcs-button part="action overflow-button" variant="tertiary" icon="cds:icon_more_horizontal"
                          aria-haspopup="listbox" aria-label="Actions" on-action="_openLeftOverflowPopup"></ptcs-button
            ><!-- actions comes here --></div>
        <div class="right-cntr"><div id="rightActions" part="right-actions" collapsed\$="[[_collapseRight]]"
            ><ptcs-button part="right-action right-overflow-button" label="[[_collapseRightLabel]]" variant="tertiary"
                          icon="cds:icon_chevron_down" icon-placement="right" on-action="_openRightOverflowPopup"
                          aria-haspopup="listbox" aria-label="Right actions" _arrow-down-activate></ptcs-button
            ><!-- rightActions comes here --></div></div>
        </div>`;
    }

    static get is() {
        return 'ptcs-toolbar-tools';
    }

    static get properties() {
        return {
            disabled: {
                type:     Boolean,
                value:    false,
                observer: '_disabledChanged'
            },

            // Actions for the action region
            actions: {
                type: Array // Action[]
            },

            // Actions for the right action region
            rightActions: {
                type: Array // Action[]
            },

            // Show filter
            showFilter: {
                type:               Boolean,
                reflectToAttribute: true,
                observer:           '_resizeActions'
            },

            // Label above the simple filter control
            filterLabel: {
                type: String
            },

            // Label to the right of the simple filter control
            additionalLabel: {
                type:     String,
                observer: '_resizeActions'
            },

            filterIcon: {
                type: String
            },

            filterWidth: {
                type:     Number,
                observer: '_filterWidthChanged'
            },

            // Filter position (if showFilter): 'left', 'center', 'right'
            filterPos: {
                type:               String,
                reflectToAttribute: true
            },

            filterHintText: {
                type:  String,
                value: 'Filter'
            },

            // Filter alignment (if filterPos='center'): 'left', 'center', 'right'
            filterAlign: {
                type:               String,
                reflectToAttribute: true
            },

            filterTooltip: {
                type: String
            },

            // Specified text in the simple filter
            filterString: {
                type:   String,
                notify: true
            },

            // Maximum width for toolbar tools, dynamically assigned by client
            maxWidth: {
                type:     Number,
                observer: '_resizeActions'
            },

            // Width of overflow button, right tools and filter (minimum width needed by this component)
            minWidth: {
                type:   Number,
                notify: true
            },

            // Overflowing elements
            _overflowElements: {
                type: Array // Action[]
            },

            focusable: {
                type:     String,
                observer: '_focusableChanged'
            },

            rightOverflowLabel: {
                type:     String,
                observer: '_resizeActions'
            },

            _collapseRight: {
                type: Boolean
            },

            _collapseRightLabel: {
                type: String
            },

            _overflowButton: Element,

            _rightOverflowButton: Element,

            _overflowPopup: Element
        };
    }

    static get observers() {
        return [
            '_actionsChanged(actions.*)',
            '_rightActionsChanged(rightActions.*)'
        ];
    }

    ready() {
        super.ready();
        this._closeOverflowEv = () => requestAnimationFrame(() => this._closeOverflowPopup());
        this._overflowButton = this.$.actions.querySelector('[part~=overflow-button]');
        this._rightOverflowButton = this.$.rightActions.querySelector('[part~=right-overflow-button]');

        // Firefox needs this, or it truncates the focus border at the top of the buttons
        this._overflowButton.focusNoClipping = true;

        if (this.additionalLabel === undefined) {
            this.additionalLabel = null; // Force notification
        }
    }

    disconnectedCallback() {
        this._closeOverflowPopup();
        super.disconnectedCallback();
    }

    // Return the CSS min-width of the simple filter
    get simpleFilterMinWidth() {
        const minWidth = PTCS.cssDecodeSize(getComputedStyle(this.$.filter).minWidth, this.$.filter);
        return !isNaN(minWidth) ? minWidth : undefined;
    }

    // Set width of the filter
    _filterWidthChanged(filterWidth) {
        this.$.filter.style.width = filterWidth ? filterWidth + 'px' : '';
        this._resizeActions();
    }

    _applyToItemElements(f) {
        f(this.$.filter);

        for (let el = this.$.actions.firstElementChild; el; el = el.nextElementSibling) {
            f(el);
        }
        for (let el = this.$.rightActions.firstElementChild; el; el = el.nextElementSibling) {
            f(el);
        }
        if (this._overflowPopup && this._overflowPopup.parentNode) {
            this._overflowPopup.refreshStates();
        }
    }

    _disabledChanged(disabled) {
        this._closeOverflowPopup();
        this._applyToItemElements(el => {
            el.disabled = disabled || (el[actionField] && el[actionField].states.disabled);
        });
    }

    _focusableChanged(focusable) {
        if (focusable) {
            this._applyToItemElements(el => el.setAttribute('tabindex', '-1'));
        } else {
            this._applyToItemElements(el => el.removeAttribute('tabindex'));
        }
    }

    // Append action element with part name to fragment
    _addActionPart(frag, action, partName) {
        const el = PTCS.ToolBarTools.createAction(action);
        el.setAttribute('part', partName);
        frag.appendChild(el);
        return frag;
    }

    _actionsChanged() {
        this._closeOverflowPopup();
        if (!this._overflowButton) {
            return;
        }

        // Remove old actions
        while (this._overflowButton.nextSibling) {
            this.$.actions.removeChild(this._overflowButton.nextSibling);
        }

        // Add new actions
        if (Array.isArray(this.actions)) {
            this.$.actions.appendChild(this.actions.reduce(
                (a, d) => this._addActionPart(a, d, 'action'),
                document.createDocumentFragment()));
        }

        // Set taborder, if applicable
        if (this.focusable) {
            this._focusableChanged(this.focusable, this.filterPos);
        }

        // Show / Hide actions region
        this.$.actions.style.display = this._overflowButton.nextElementSibling ? '' : 'none';

        this._resizeActions();
    }

    _tryToCollapseRightActions() {
        if (this._rightOverflowButton.nextElementSibling &&
            Math.round(this.getBoundingClientRect().right) < Math.round(this.$.rightActions.getBoundingClientRect().right)) {
            this._collapseRightLabel = this.rightOverflowLabel;
            this._collapseRight = true;
            if (this._collapseRightLabel && this.getBoundingClientRect().right < this.$.rightActions.getBoundingClientRect().right) {
                this._collapseRightLabel = undefined;
            }
        }
    }

    _firstVisibleAction(overflowButton) {
        for (let el = overflowButton.nextElementSibling; el; el = el.nextElementSibling) {
            if (!el.hasAttribute('hidden')) {
                return el;
            }
        }
        return null;
    }

    // Hide overflowing actions, if any, and place overflow button after last non-hidden action
    _resizeActions() {
        if (!this.maxWidth) {
            return; // Not ready
        }
        if (this.__isOpeningPopup) {
            return; // Ignore fake resize event
        }
        this._closeOverflowPopup();
        this._overflowElements = [];
        this._collapseRight = false;
        this._collapseRightLabel = undefined; // Need to know minimum width of right overflow button

        // Basic geometry
        const bb0 = this.$.actions.getBoundingClientRect();
        const filterWidth = this.$.filter.offsetWidth;
        const rightWidth = this.$.rightActions.offsetWidth;
        const additionalLabelWidth = PTCS.getElementWidth(this.$['additional-label']);
        const end = bb0.left + this.maxWidth - filterWidth - additionalLabelWidth - rightWidth;

        // Overflow buttons geometry
        const firstVisibleAction = this._firstVisibleAction(this._overflowButton);
        const overflowWidth = firstVisibleAction ? PTCS.getElementWidth(this._overflowButton) : 0;
        const rightOverflowWidth = this._firstVisibleAction(this._rightOverflowButton)
            ? PTCS.getElementWidth(this._rightOverflowButton.clientWidth)
            : 0;

        // Report minimum width
        this.minWidth = filterWidth + additionalLabelWidth + overflowWidth + rightOverflowWidth;

        const isHidden = el => el.hasAttribute('hidden');

        let bb;
        for (let el = firstVisibleAction; el; el = el.nextElementSibling) {
            if (isHidden(el)) {
                continue;
            }

            bb = el.getBoundingClientRect();
            if (bb.right < end) {
                // Action is fully visible
                el.style.visibility = '';
                continue;
            }

            // Found overflowing action
            if (bb.left + overflowWidth >= end && el !== firstVisibleAction) {
                // Previous action must also be moved to in the overflow bag, if any (visible) exist
                el = el.previousElementSibling;
                while (isHidden(el)) {
                    el = el.previousElementSibling;
                }
                bb = el.getBoundingClientRect();
            }

            // Place overflow button at its proper place
            this._overflowButton.style.transform = `translateX(${Math.max(bb.left - bb0.left, 0)}px)`;
            this._overflowButton.style.visibility = '';

            // Hide all following actions
            do {
                if (!isHidden(el)) {
                    this._overflowElements.push(el);
                }
                el.style.visibility = 'hidden';
                el = el.nextElementSibling;
            } while (el);

            this.$.actions.style.width = `${bb.left - bb0.left + overflowWidth}px`;

            this._tryToCollapseRightActions();
            this._updateOverflowSelected();
            return;
        }

        // No overflows found
        this._overflowButton.style.visibility = 'hidden';
        this.$.actions.style.width = '';
        if (!firstVisibleAction) {
            this._tryToCollapseRightActions();
            this._updateOverflowSelected();
        }
    }

    _rightActionsChanged() {
        // Remove old rightActions
        while (this._rightOverflowButton.nextSibling) {
            this.$.rightActions.removeChild(this._rightOverflowButton.nextSibling);
        }

        // Add new rightActions
        if (Array.isArray(this.rightActions)) {
            this.$.rightActions.appendChild(this.rightActions.reduce(
                (a, d) => this._addActionPart(a, d, 'right-action'),
                document.createDocumentFragment()));
        }

        // Set taborder, if applicable
        if (this.focusable) {
            this._focusableChanged(this.focusable, this.filterPos);
        }

        // Show / Hide right actions region
        this.$.rightActions.style.display = this._rightOverflowButton.nextSibling ? '' : 'none';
    }

    // Select overflow buttons, if they contain any selected actions
    _updateOverflowSelected() {
        if ([...this.$.actions.querySelectorAll('[part~=action][selected]:not([hidden])')].some(e => e.style.visibility === 'hidden')) {
            this._overflowButton.setAttribute('selected', '');
        } else {
            this._overflowButton.removeAttribute('selected');
        }
        if (this.$.rightActions.querySelector('[part~=right-action][selected]:not([part~=right-overflow-button])')) {
            this._rightOverflowButton.setAttribute('selected', '');
        } else {
            this._rightOverflowButton.removeAttribute('selected');
        }
    }

    _clicked({action}, r) {
        this.dispatchEvent(new CustomEvent('activated', {
            composed: true,
            detail:   {action, r}}));
    }

    _valueChanged({action, states}) {
        this.dispatchEvent(new CustomEvent('value-changed', {
            composed: true,
            detail:   {action, value: states.value}
        }));
    }

    setLabel(id, label) {
        this._applyToItemElements(el => {
            const x = el[actionField];
            if (x && x.action.id === id) {
                el.label = label;
                x.action.label = label;
            }
        });
    }

    setTooltip(id, alt) {
        this._applyToItemElements(el => {
            const x = el[actionField];
            if (x && x.action.id === id) {
                el.tooltip = alt;
                x.action.tooltip = alt;
            }
        });
    }

    setDisabled(id, disabled) {
        this._applyToItemElements(el => {
            const x = el[actionField];
            if (x && x.action.id === id) {
                el.disabled = disabled;
                x.states.disabled = disabled;
            }
        });
    }

    setHidden(id, hidden) {
        this._applyToItemElements(el => {
            const x = el[actionField];
            if (x && x.action.id === id) {
                if (hidden) {
                    el.setAttribute('hidden', '');
                } else {
                    el.removeAttribute('hidden');
                }
                x.states.hidden = hidden;
            }
        });

        this._resizeActions();
    }

    setValue(id, value) {
        this._applyToItemElements(el => {
            const x = el[actionField];
            if (x && x.action.id === id && el[assignField]) {
                el[assignField](value);
            }
        });
    }

    setSelected(id, selected) {
        this._applyToItemElements(el => {
            const x = el[actionField];
            if (x && x.action.id === id) {
                if (selected) {
                    el.setAttribute('selected', '');
                } else {
                    el.removeAttribute('selected');
                }
            }
        });
        this._updateOverflowSelected();
    }

    setArrowDownActivate(id, activate) {
        this._applyToItemElements(el => {
            const x = el[actionField];
            if (x && x.action.id === id) {
                el._arrowDownActivate = activate;
            }
        });
    }

    _openOverflowPopup(popupButton, elements) {
        this._popupButton = popupButton;
        // Make sure we have a closed popup
        if (!this._overflowPopup) {
            this._overflowPopup = document.createElement('ptcs-toolbar-popup');
            this._overflowPopup.actionKey = actionField;
            this._overflowPopup.setAttribute('part', 'overflow-popup');
            this._overflowPopup.addEventListener('keyup', this._keyupOverflowPopup.bind(this));
            this._overflowPopup.addEventListener('blur', this._delayedCloseOverflowPopup.bind(this));
            this._overflowPopup.addEventListener('mouseup', (ev) => {
                ev.cancelBubble = true;
            });
        } else if (this._overflowPopup.parentNode) {
            return; // Already open
        }

        if (this.focusable) {
            this._overflowPopup.setAttribute('tabindex', '0');
        } else {
            this._overflowPopup.removeAttribute('tabindex');
        }

        this._overflowPopup.style.visibility = 'hidden';
        this._overflowPopup.style.transform = '';
        this._overflowPopup.elements = elements;
        this._overflowPopup.refreshStates();

        // Open popup
        this.__isOpeningPopup = true; // Prevent unstoppable resize event to immediately close the popup
        document.body.appendChild(this._overflowPopup);
        document.addEventListener('mouseup', this._closeOverflowEv);
        requestAnimationFrame(() => this._placeOverflowPopup(popupButton));
    }

    _placeOverflowPopup(popupButton) {
        if (!this._overflowPopup.parentNode) {
            return; // Popup list has already been closed...
        }
        const bb0 = popupButton.getBoundingClientRect();
        const bb1 = this._overflowPopup.getBoundingClientRect();
        const w = bb1.right - bb1.left;
        const h = bb1.bottom - bb1.top;
        const x = Math.min(Math.max(0, bb0.right - w), Math.max(0, window.innerWidth - w - 1));
        let y = bb0.bottom + offsetToPopup;
        if (y + h > window.innerHeight) {
            y = bb0.top - offsetToPopup - h;
        }
        if (y < 0) {
            const y1 = bb0.bottom + offsetToPopup;
            const down = document.documentElement.clientHeight - y1 - offsetToWindowOverflowPopup - offsetToPopup;
            const y2 = document.documentElement.clientHeight - bb0.top;
            const top = document.documentElement.clientHeight - y2 - offsetToMashupToolbar - offsetToWindowOverflowPopup;
            if (down > top) {
                y = y1;
                this._overflowPopup.actionMaxHeight = down;
            } else {
                y = y2 - down - offsetToWindowOverflowPopup;
                this._overflowPopup.actionMaxHeight = top;
            }
        }

        this._overflowPopup.style.transform = `translate(${x - bb1.left}px, ${y - bb1.top}px)`;
        this._overflowPopup.style.visibility = '';
        this._overflowPopup.__justOpened = Date.now();

        requestAnimationFrame(() => {
            this.__isOpeningPopup = undefined;
            if (this._overflowPopup.parentNode) {
                this._overflowPopup.focus();
            }
        });
    }

    _openLeftOverflowPopup() {
        if (this.disabled || !this._overflowElements || this._overflowElements.length === 0) {
            return;
        }
        this._openOverflowPopup(this._overflowButton, this._overflowElements);
    }

    _openRightOverflowPopup() {
        if (this.disabled) {
            return;
        }
        const elements = [...this.$.rightActions.querySelectorAll('[part~=right-action]:not([part~=right-overflow-button]')];
        if (elements.length) {
            //this._rightOverflowButton.variant = 'primary';
            this._rightOverflowButton.setAttribute('selected', '');
            this._openOverflowPopup(this._rightOverflowButton, elements);
        }
    }

    _closeOverflowPopup() {
        if (!this._overflowPopup || !this._overflowPopup.parentNode) {
            return; // Not open
        }

        this._overflowPopup.actionMaxHeight = undefined;
        this._overflowPopup.parentNode.removeChild(this._overflowPopup);
        //this._rightOverflowButton.variant = 'tertiary';
        this._rightOverflowButton.removeAttribute('selected');
        document.removeEventListener('mouseup', this._closeOverflowEv);
    }

    _delayedCloseOverflowPopup() {
        requestAnimationFrame(() => this._closeOverflowPopup());
    }

    _keyupOverflowPopup(ev) {
        if (ev.defaultPrevented) {
            return;
        }
        switch (ev.key) {
            case 'Escape':
                if (this._overflowPopup.__justOpened + 500 < Date.now()) {
                    this._popupButton.focus();
                    this._closeOverflowPopup();
                }
                this._overflowPopup.__justOpened = 0;
                break;
        }
    }

    // Get focusable sub-elements
    get focusableElements() {
        if (!this.focusable) {
            return [];
        }
        const a = [...[...this.$.actions.querySelectorAll('[part~=action]:not([hidden])')]
            .filter(action => action.style.visibility !== 'hidden')];

        // If overflow is visible, then put it last
        if (a[0] === this._overflowButton) {
            a.push(a.shift());
        }

        // Filter to the left or in the middle?
        if (this.showFilter) {
            if (this.filterPos === 'center') {
                // Simple filter is centered
                a.push(this.$.filter);
            } else if (this.filterPos !== 'right') {
                // Simple filter is to the left (not center and not right)
                a.unshift(this.$.filter);
            }
        }

        // Right actions
        if (this._collapseRight) {
            a.push(this._rightOverflowButton);
        } else {
            a.push(...[...this.$.rightActions.querySelectorAll('[part~=right-action]:not([hidden])')]
                .filter(action => action !== this._rightOverflowButton && action.style.visibility !== 'hidden'));
        }

        // Filter to the right
        if (this.showFilter && this.filterPos === 'right') {
            // Simple filter is last
            a.push(this.$.filter);
        }
        return a;
    }


    /*
     * Create toolbar actions
     */
    static clicked(ev) {
        if (ev.target.disabled) {
            return;
        }

        // This is soo hacky... (only needed for the grid Display button)
        let el = ev.target;
        if (!el.clientWidth) {
            el = ev.target.closest('#actions');
            el = el && el.querySelector('[part~=overflow-button]');
            if (!el) {
                el = ev.target.closest('#rightActions');
                el = el && el.querySelector('[part~=right-overflow-button]');
                if (!el) {
                    el = this;
                }
            }
        }

        ev.target.getRootNode().host._clicked(ev.target[actionField], el.getBoundingClientRect());
    }

    static createButton({label, alt, altIcon, width, maxWidth, opt}) {
        const el = document.createElement('ptcs-button');
        el.variant = (opt && opt.variant) || 'transparent';
        el.icon = opt && opt.icon;
        el.iconSet = opt && opt.iconSet;

        if (opt && opt.iconPlacement) {
            el.iconPlacement = opt.iconPlacement;
        }

        el.label = label;
        el.tooltip = alt;
        el.tooltipIcon = altIcon;
        setWidth(el, width, maxWidth);
        el.addEventListener('click', PTCS.ToolBarTools.clicked);
        el.addEventListener('touchend', function(e) {
            e.preventDefault();
            PTCS.ToolBarTools.clicked(e);
        });
        return el;
    }

    static createLink({label, alt, altIcon, width, maxWidth, opt}) {
        const el = document.createElement('ptcs-link');
        el.label = label;
        el.tooltip = alt;
        el.tooltipIcon = altIcon;
        el.singleLine = true;
        el.href = opt && opt.href;
        el.target = (opt && opt.target) || 'new';
        el.variant = (opt && opt.variant) || 'primary';
        setWidth(el, width, maxWidth);
        el.addEventListener('click', PTCS.ToolBarTools.clicked);
        el.addEventListener('touchend', PTCS.ToolBarTools.clicked);
        return el;
    }

    static toggleChanged(ev) {
        const x = ev.target[actionField];
        if ((!x.states.value) !== (!ev.detail.value)) {
            x.states.value = ev.detail.value;
            ev.target.getRootNode().host._valueChanged(x);
        }
    }

    static createToggle({label, alt, altIcon, width, maxWidth, opt}) {
        const el = document.createElement('ptcs-chip');
        el.hideIcon = opt && opt.hideIcon;
        el.checked = (opt && opt.value) || false;
        el.labelalign = (opt && opt.labelalign) || 'left';
        el.label = label;
        el.tooltip = alt;
        el.tooltipIcon = altIcon;
        setWidth(el, width, maxWidth);
        el.addEventListener('checked-changed', PTCS.ToolBarTools.toggleChanged);
        el[assignField] = value => {
            el.checked = !!value;
        };
        return el;
    }

    static dropdownChanged(ev) {
        const x = ev.target[actionField];
        if (x.states.value !== ev.detail.value) {
            x.states.value = ev.detail.value;
            ev.target.getRootNode().host._valueChanged(x);
        }
    }

    static createDropdown({label, alt, altIcon, width, maxWidth, opt}) {
        const el = document.createElement('ptcs-dropdown');
        el.selector = selectDropdownLabel;
        el.valueSelector = selectDropdownValue;
        el.stateSelector = selectDropdownState;
        el.label = label;
        el.hintText = opt && opt.hintText;
        el.tooltip = alt;
        el.tooltipIcon = altIcon;
        setWidth(el, width || '120px', maxWidth);
        if (label) {
            el.setAttribute('top-label', '');
        }
        el.items = opt && opt.values;
        el.selectedValue = opt && opt.value;
        el.addEventListener('selected-value-changed', PTCS.ToolBarTools.dropdownChanged);
        el[assignField] = value => {
            el.selectedValue = value;
        };
        return el;
    }

    static createInvalid({type, label, alt, altIcon}) {
        const el = document.createElement('ptcs-label');
        el.label = `${label}: type err: ${JSON.stringify(type)}`;
        el.tooltip = alt;
        el.tooltipIcon = altIcon;
        return el;
    }

    // Create action element
    static createAction(action) {
        if (action.opt && action.opt.values) {
            action.opt.values = action.opt.values.filter(value => value.state !== 'hidden');
        }
        const el = (PTCS.ToolBarTools.actionCtor[action.type] || PTCS.ToolBarTools.createInvalid)(action);
        const states = {disabled: action.disabled, hidden: action.hidden, value: action.opt && action.opt.value};
        el[actionField] = {action, states};

        el.disabled = states.disabled;
        if (states.hidden) {
            el.setAttribute('hidden', true);
        }

        // Firefox needs this, or it truncates the focus border at the top of the buttons
        el.focusNoClipping = true;

        // Don't allow flexbox to resize control
        el.style.flex = '0 0 auto';

        return el;
    }
};

// Create actions
PTCS.ToolBarTools.actionCtor = {
    button:   PTCS.ToolBarTools.createButton,
    link:     PTCS.ToolBarTools.createLink,
    toggle:   PTCS.ToolBarTools.createToggle,
    dropdown: PTCS.ToolBarTools.createDropdown
};

customElements.define(PTCS.ToolBarTools.is, PTCS.ToolBarTools);
