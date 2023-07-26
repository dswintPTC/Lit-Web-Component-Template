import {PolymerElement, html} from '@polymer/polymer/polymer-element.js';
import {PTCS} from 'ptcs-library/library.js';
import 'ptcs-toggle-button/ptcs-toggle-button.js';
import 'ptcs-behavior-styleable/ptcs-behavior-styleable.js';
import 'ptcs-behavior-focus/ptcs-behavior-focus.js';
import 'ptcs-icons/cds-icons.js';

const ownerField = Symbol('owner'); // {action, states}
const updateField = Symbol('update'); // Update value function
const offsetToWindowOverflowDD = 20;

PTCS.ToolBarPopup = class extends PTCS.BehaviorFocus(PTCS.BehaviorStyleable(PTCS.ThemableMixin(PolymerElement))) {
    static get template() {
        return html`
        <style>
        :host {
            position: absolute;
            top: 0;
            left: 0;
            z-index: 20001;
            display: flex;
            flex-direction: column;
            box-sizing: border-box;
            user-select: none;
        }

        [part~=action-item] {
            flex: 1 1 auto;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        [part~=action-item]:not([disabled]) {
            cursor: pointer;
        }

        [part~=action-item][hidden] {
            display: none;
        }

        #dropdown {
            display: none;
            position: absolute;
            left: 0;
            top: 0;
            flex-direction: column;
            box-sizing: border-box;
            user-select: none;
        }

        #dropdown[show], #dropdown:hover {
            display: flex;
            overflow-x: hidden;
            overflow-y: auto;
        }

        [part=dropdown-value] {
            display: flex;
            align-items: center;
            cursor: pointer;
        }
        [part=dropdown-value][hidden] {
            display: none;
        }
        [part=dropdown-value][disabled] {
            pointer-events: none;
        }

        #actions {
            overflow-x: hidden;
            overflow-y: auto;
        }

        </style>
        <div id="dropdown" part="dropdown-values" show\$="[[_dropdownShow]]" on-click="_onClickValue">
        <template is="dom-repeat" items="{{_dropdownItems}}">
            <div part="dropdown-value" selected\$="[[_eq(_dropdownValue, item.value)]]" hidden\$="[[_eq(item.state, 'hidden')]]"
                disabled\$="[[_eq(item.state, 'disabled')]]">
                <ptcs-label part="dropdown-label" label="[[_or(item.label, item.value)]]" click-item="[[item]]"
                disabled\$="[[_eq(item.state, 'disabled')]]">
                </ptcs-label>
            </div>
        </template>
        </div>
        <div id="actions" part="actions">
        </div>`;
    }

    static get is() {
        return 'ptcs-toolbar-popup';
    }

    static get properties() {
        return {
            // Overflow actions elements in the toolbar
            elements: {
                type:     Array,
                observer: '_elementsChanged'
            },

            // Key to get action data from action elements
            actionKey: {
                type: Symbol
            },

            actionMaxHeight: {
                type:     Number,
                observer: '_actionMaxHeightChanged'
            },

            // Popup elements created from elements
            _elements: {
                type: Array
            },

            // Keep track of dropdown submenu
            _dropdownShow:     Boolean,
            _dropdownValue:    Object,
            _dropdownItems:    Array,
            _dropdownSourceEl: Element,

            // Focused element
            _focusIx: Number,

            // Focused dropdown value, if any
            _valueIx: Number
        };
    }

    ready() {
        super.ready();
        this.shadowRoot.addEventListener('mousedown', this._setFocus.bind(this));
        this.addEventListener('keydown', this._keyDown.bind(this));
    }

    disconnectedCallback() {
        this._dropdownShow = undefined;
        this._dropdownSourceEl = undefined;
        super.disconnectedCallback();
    }

    _eq(a, b) {
        return a === b;
    }

    _or(a, b) {
        return a || b;
    }

    // Append action element with part name to fragment
    createAction(element) {
        const action = element[this.actionKey].action;
        const cntr = document.createElement('div');
        cntr[ownerField] = element;
        cntr.setAttribute('part', `action-item ${action.type}-item`);
        (PTCS.ToolBarPopup.actionCtor[action.type] || PTCS.ToolBarPopup.createInvalid)(action, cntr);
        return cntr;
    }

    _elementsChanged(elements) {
        // Remove previous action elements
        if (this._elements) {
            this._elements.forEach(el => this.$.actions.removeChild(el));
        }

        // Create new action elements
        this._elements = Array.isArray(elements) ? elements.map(el => this.createAction(el)) : [];

        // Insert new action elements
        this.$.actions.appendChild(this._elements.reduce(
            (a, el) => {
                a.appendChild(el);
                return a;
            },
            document.createDocumentFragment()));

        this.refreshStates();

        // Reset focus
        this._focusIx = this._valueIx = undefined;
    }

    _actionMaxHeightChanged(maxHeight) {
        if (maxHeight && maxHeight > 0) {
            this.$.actions.style.maxHeight = maxHeight + 'px';
            this._scrollToAction(this._focusIx);
        } else {
            this.$.actions.style.removeProperty('max-height');
        }
    }

    refreshStates() {
        this._dropdownSourceEl = undefined;
        if (this._elements) {
            this._elements.forEach(cntr => {
                const states = cntr[ownerField][this.actionKey].states;
                if (states.hidden) {
                    cntr.setAttribute('hidden', '');
                } else {
                    cntr.removeAttribute('hidden');
                }
                const el = cntr.firstChild;
                el.disabled = states.disabled;
                if (el[updateField]) {
                    el[updateField](states);
                }
                if (states.disabled) {
                    cntr.setAttribute('disabled', '');
                } else {
                    cntr.removeAttribute('disabled');
                }
            });
        }
        this._valueIx = undefined;
    }

    _onClickValue(ev) {
        const el = ev.target;
        const item = el.clickItem || (el.firstElementChild && el.firstElementChild.clickItem);
        if (item) {
            this._dropdownSourceEl[ownerField].selectedValue = item.value;
            this.dispatchEvent(new KeyboardEvent('keyup', {key: 'Escape'}));
        }
    }

    _initTrackFocus() {
        this._trackFocus(this, () => {
            if (this._elements && this._focusIx < this._elements.length) {
                return this._valueIx >= 0
                    ? this.$.dropdown.children[this._valueIx]
                    : this._elements[Math.max(0, this._focusIx)];
            }
            return (this._elements && this._elements[0]) || this;
        });
    }

    _setFocus(ev) {
        if (!(this.tabIndex >= 0)) {
            return; // Not focusable
        }
        const childNo = el => {
            let i = 0;
            for (el = el.previousElementSibling; el; el = el.previousElementSibling) {
                i++;
            }
            return i;
        };
        for (let el = ev.target; el; el = el.parentNode) {
            const part = el.getAttribute && el.getAttribute('part');
            if (!part) {
                continue;
            }
            if (part.indexOf('action-item') >= 0) {
                this._valueIx = undefined;
                this._focusIx = childNo(el);
                return;
            }
            if (part === 'dropdown-value') {
                this._valueIx = childNo(el);
                this._focusIx = childNo(this._dropdownSourceEl);
                return;
            }
        }
    }

    _scrollToAction(index) {
        const num = this._elements ? this._elements.length : 0;
        if (!num || index === undefined || index < 0 || index >= num) {
            return;
        }

        const actionContainer = this.$.actions;
        const actionContainerBR = actionContainer.getBoundingClientRect();
        const actionElBR = this._elements[index].getBoundingClientRect();

        if (actionContainerBR.top > actionElBR.top) {
            actionContainer.scrollTop -= actionContainerBR.top - actionElBR.top;
        } else if (actionContainerBR.bottom < actionElBR.bottom) {
            actionContainer.scrollTop += actionElBR.bottom - actionContainerBR.bottom;
        }
    }

    _scrollToDDItem(index) {
        const dropdownContainer = this.$.dropdown;
        const allValuesElements = dropdownContainer.querySelectorAll('[part=dropdown-value]');
        const num = allValuesElements ? allValuesElements.length : 0;
        if (!num || index === undefined || index < 0 || index >= num) {
            return;
        }
        const dropdownContainerBR = dropdownContainer.getBoundingClientRect();
        const valueElBR = allValuesElements[index].getBoundingClientRect();

        if (dropdownContainerBR.top > valueElBR.top) {
            dropdownContainer.scrollTop -= dropdownContainerBR.top - valueElBR.top;
        } else if (dropdownContainerBR.bottom < valueElBR.bottom) {
            dropdownContainer.scrollTop += valueElBR.bottom - dropdownContainerBR.bottom;
        }
    }

    _keyDown(ev) {
        const num = this._elements ? this._elements.length : 0;
        if (!num) {
            return;
        }
        const isDropdown = el => el.getAttribute('part').indexOf('dropdown-item') >= 0;
        let fi = Math.max(0, Math.min(this._focusIx || 0, num - 1));
        let vi = this._valueIx;
        const orgEl = this._elements[fi];
        const {action, states} = orgEl[ownerField][this.actionKey];

        switch (ev.key) {
            case 'ArrowUp':
                if (vi >= 0) {
                    vi = Math.max(vi - 1, 0);
                } else {
                    fi = Math.max(fi - 1, 0);
                }
                break;
            case 'ArrowDown':
                if (vi >= 0) {
                    vi = Math.min(vi + 1, action.opt.values.length - 1);
                } else {
                    fi = Math.min(fi + 1, num - 1);
                }
                break;
            case 'PageUp':
            case 'Home':
                if (vi >= 0) {
                    vi = 0;
                } else {
                    fi = 0;
                }
                break;
            case 'PageDown':
            case 'End':
                if (vi >= 0) {
                    vi = Math.max(0, action.opt.values.length - 1);
                } else {
                    fi = Math.max(0, num - 1);
                }
                break;
            case 'ArrowRight':
            case 'ArrowLeft':
                if (!isDropdown(orgEl)) {
                    return; // Not handled
                }
                if (vi >= 0) {
                    vi = undefined;
                } else {
                    vi = Math.max(0, action.opt.values.findIndex(item => item.value === states.value));
                }
                break;
            case ' ':
            case 'Enter':
                if (vi >= 0) {
                    if (action.opt.values[vi].state !== 'disabled') {
                        orgEl[ownerField].selectedValue = action.opt.values[vi].value;
                        const host = orgEl.getRootNode().host;
                        host.dispatchEvent(new KeyboardEvent('keyup', {key: 'Escape'}));
                    }
                } else if (!isDropdown(orgEl)) {
                    PTCS.ToolBarPopup.fireActionEvent(orgEl);
                }
                ev.preventDefault();
                return;
            default:
                // Not handled
                return;
        }

        // Keyboard event has been consumed
        ev.preventDefault();

        // Adapt to focus change, if any
        if (this._focusIx === fi) {
            this._valueIx = vi;
            this._scrollToDDItem(vi);
        } else {
            if (isDropdown(orgEl)) {
                PTCS.ToolBarPopup.leaveDropdown({target: orgEl});
            }
            this._focusIx = fi;
            this._scrollToAction(fi);
            this._valueIx = undefined;
        }

        const el = this._elements[this._focusIx];
        if (isDropdown(el) && (el !== this._dropdownSourceEl || !this._dropdownShow)) {
            PTCS.ToolBarPopup.enterDropdown({target: el});
        }
    }

    /*
     * Create popup menu items
     */
    static fireActionEvent(el, ev) { // ev parameter only present in touch-based browser
        const host = el.getRootNode().host;
        if (!el[ownerField].disabled) {
            host.dispatchEvent(new KeyboardEvent('keyup', {key: 'Escape'}));
        }
        if (!ev) {
            // Mouse click or keyboard entry
            const type = el[ownerField][host.actionKey].action.type;
            // Firing the action uses click(); the activateLink() invocation also leads to a click(), but
            // in touch-based browser the corresponding click listener is not being triggered reliably.
            if (type === 'link') {
                el[ownerField].activateLink();
            } else {
                el[ownerField].click();
            }
        } else {
            // Work-around in touch-based browser to emit the click event programmatically
            const touch = ev.changedTouches[ev.changedTouches.length - 1];
            el[ownerField].dispatchEvent(new MouseEvent('click',
                {
                    bubbles:       true,
                    cancelable:    true,
                    view:          document.defaultView,
                    detail:        0,
                    screenX:       touch.screenX,
                    screenY:       touch.screenY,
                    clientX:       touch.clientX,
                    clientY:       touch.clientY,
                    ctrlKey:       false,
                    altKey:        false,
                    shiftKey:      false,
                    metaKey:       0,
                    button:        null,
                    relatedTarget: null
                }));
            ev.stopPropagation();
            ev.preventDefault();
        }
    }

    static actionClicked(ev) {
        for (let el = ev.target; el; el = el.parentNode) {
            if (el[ownerField]) {
                if (ev.changedTouches) {
                    // Event was triggered by touch event
                    PTCS.ToolBarPopup.fireActionEvent(el, ev);
                } else {
                    PTCS.ToolBarPopup.fireActionEvent(el);
                }
                return;
            }
        }
    }

    static createAction({type, label, alt, altIcon, maxWidth, opt}, cntr) {
        let el;
        if (label || !opt || !opt.icon) {
            el = document.createElement('ptcs-label');
            el.label = label;
        } else {
            el = document.createElement('ptcs-icon');
            el.icon = opt.icon;
        }
        el.tooltip = alt;
        el.tooltipIcon = altIcon;
        el.maxWidth = maxWidth;
        el.setAttribute('part', `action ${type}`);
        el.setAttribute('draggable', 'false');
        cntr.addEventListener('click', PTCS.ToolBarPopup.actionClicked);
        cntr.addEventListener('touchend', PTCS.ToolBarPopup.actionClicked);
        cntr.appendChild(el);
    }

    static toggleChanged(ev) {
        ev.target.parentNode[ownerField].checked = ev.detail.value;
    }

    static createToggle({type, label, alt, altIcon, maxWidth, opt}, cntr) {
        const el = document.createElement('ptcs-toggle-button');
        el.checked = (opt && opt.value) || false;
        el.labelalign = (opt && opt.labelalign) || 'left';
        el.label = label;
        el.tooltip = alt;
        el.tooltipIcon = altIcon;
        if (maxWidth) {
            el.labelMaxWidth = maxWidth;
        }
        el.style.width = '100%';
        el.style.justifyContent = 'space-between';

        el[updateField] = states => {
            el.checked = states.value;
        };
        el.setAttribute('part', `action ${type}`);
        el.addEventListener('checked-changed', PTCS.ToolBarPopup.toggleChanged);
        cntr.appendChild(el);
    }

    static enterDropdown(ev) {
        const el = ev.target;
        if (!el[ownerField]) {
            return;
        }
        const host = el.getRootNode().host;
        const data = el[ownerField][host.actionKey];
        if (data.states.disabled) {
            return;
        }
        host._dropdownSourceEl = el;
        host._dropdownValue = data.states.value;
        host._dropdownItems = data.action.opt.values;
        host._dropdownShow = true;
        host.$.dropdown.style.transform = '';
        host.$.dropdown.style.visibility = 'hidden';
        host.$.dropdown.style.removeProperty('max-height');
        requestAnimationFrame(() => {
            if (host._dropdownSourceEl !== el || !host._dropdownShow) {
                return;
            }
            const bb0 = el.getBoundingClientRect();
            const bb1 = host.$.dropdown.getBoundingClientRect();
            let dx = bb0.right + bb1.right - bb1.left + offsetToWindowOverflowDD < window.innerWidth
                ? bb0.right - bb1.left + 1
                : bb0.left - bb1.right - 1;
            let dy = bb0.top + bb1.bottom - bb1.top < window.innerHeight
                ? bb0.top - bb1.top
                : bb0.bottom - bb1.bottom;
            if (dy < 0 && bb0.bottom - bb1.bottom + bb1.top < 0) {
                const bb2 = host.getBoundingClientRect();
                dy = offsetToWindowOverflowDD - bb2.top;
                host.$.dropdown.style.maxHeight = bb0.bottom - bb2.top - dy + 'px';
                if (dx < 0) {
                    dx -= offsetToWindowOverflowDD;
                }
            }
            host.$.dropdown.style.transform = `translate(${dx}px, ${dy}px)`;
            host.$.dropdown.style.visibility = '';
        });
    }

    static leaveDropdown(ev) {
        const host = ev.target.getRootNode().host;
        host._dropdownShow = undefined;
    }

    static createDropdown({type, label, alt, altIcon, maxWidth}, cntr) {
        const el = document.createElement('ptcs-label');
        el.label = label;
        el.tooltip = alt;
        el.tooltipIcon = altIcon;
        if (maxWidth) {
            el.maxWidth = maxWidth;
        }

        el[updateField] = states => {
            el.checked = states.value;
        };
        el.setAttribute('part', `action ${type}`);
        cntr.appendChild(el);

        const icon = document.createElement('ptcs-icon');
        icon.icon = 'cds:icon_chevron_right_mini';
        icon.setAttribute('part', 'dropdown-icon');
        cntr.appendChild(icon);

        cntr.addEventListener('mouseenter', PTCS.ToolBarPopup.enterDropdown);
        cntr.addEventListener('mouseleave', PTCS.ToolBarPopup.leaveDropdown);
        // no listener for touchend associated to leaveDropdown to keep the submenu open
        // while user moves the finger to tap submenu item
        cntr.addEventListener('touchstart', PTCS.ToolBarPopup.enterDropdown);
    }

    static createInvalid({type, label, alt, altIcon}, cntr) {
        const el = document.createElement('ptcs-label');
        el.label = `${label}: type err: ${JSON.stringify(type)}`;
        el.tooltip = alt;
        el.tooltipIcon = altIcon;
        el.setAttribute('part', `action ${type}`);
        cntr.appendChild(el);
    }
};

PTCS.ToolBarPopup.actionCtor = {
    button:   PTCS.ToolBarPopup.createAction,
    link:     PTCS.ToolBarPopup.createAction,
    toggle:   PTCS.ToolBarPopup.createToggle,
    dropdown: PTCS.ToolBarPopup.createDropdown
};

customElements.define(PTCS.ToolBarPopup.is, PTCS.ToolBarPopup);
