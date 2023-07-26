import {PolymerElement, html} from '@polymer/polymer/polymer-element.js';
import {PTCS} from 'ptcs-library/library.js';
import '@polymer/polymer/lib/elements/dom-repeat.js';
import 'ptcs-behavior-styleable/ptcs-behavior-styleable.js';
import 'ptcs-behavior-focus/ptcs-behavior-focus.js';
import 'ptcs-behavior-tabindex/ptcs-behavior-tabindex.js';
import './ptcs-accordion-item.js';


PTCS.Accordion = class extends PTCS.BehaviorTabindex(PTCS.BehaviorFocus(PTCS.BehaviorStyleable(PTCS.ThemableMixin(PolymerElement)))) {

    static get template() {
        return html`
        <style>
            :host {
                display: flex;
                flex-direction: column;
            }
        </style>
        <template is="dom-repeat" items="{{items}}">
            <ptcs-accordion-item part="item" item="[[item]]" variant="[[variant]]" _level="[[_level]]"
                icon="[[item.icon]]" icon-width="[[iconWidth]]" icon-height="[[iconHeight]]"
                label="[[item.label]]" content="[[item.content]]" _parent="[[_getParent()]]"
                hide-trigger="[[hideTrigger]]" trigger-type="[[triggerType]]" trigger-align="[[triggerAlign]]"
                trigger-can-collapse="[[triggerCanCollapse]]" disabled="[[disabled]]" allow-missing-icons="[[allowMissingIcons]]"
                multiple-open-items="[[multipleOpenItems]]" display-icons="[[displayIcons]]"
                on-opened-changed="_openedChanged"></ptcs-accordion-item>
        </template>`;
    }

    static get is() {
        return 'ptcs-accordion';
    }

    static get properties() {
        return {
            variant: {
                type:               String,
                value:              'primary',
                reflectToAttribute: true
            },

            disabled: {
                type:               Boolean,
                reflectToAttribute: true
            },

            items: {
                type: Array
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

            displayIcons: {
                type:     Boolean,
                observer: '_updateHideIcons'
            },

            hideIcons: {
                type:     Boolean,
                value:    false,
                observer: '_updateDisplayIcons'
            },

            _parent: {
                type: Object
            },

            // This is the accordion element that 'contains' the currently selected item, it is either the
            // item itself or within one of its sub-accordions
            _selectedItem: {
                type: Object
            },

            _level: {
                type: Number
            },

            minWidth: {
                type:     String,
                observer: '_minWidthChanged'
            },

            maxWidth: {
                type:     String,
                observer: '_maxWidthChanged'
            },

            iconWidth: {
                type: String
            },

            iconHeight: {
                type: String
            },

            multipleOpenItems: {
                type:     Boolean,
                observer: '_multipleOpenItemsChanged'
            },

            // "type1" || "type2" || "type3" || "type4"
            triggerType: {
                type: String
            },

            hideTrigger: {
                type: Boolean
            },

            // "left" || "right"
            triggerAlign: {
                type: String
            },

            // Can trigger collapse panel?
            triggerCanCollapse: {
                type: Boolean
            },

            _currFocusedEl: Element,

            _focus: Element,

            _subFocus: Boolean
        };
    }

    ready() {
        super.ready();
        this.addEventListener('keydown', this._keyDown.bind(this));
        this.addEventListener('blur', this._blur.bind(this));
        this.shadowRoot.addEventListener('click', this._clickOnAccordion.bind(this));
        this.shadowRoot.addEventListener('focus-changed', this.subFocusChanged.bind(this));
    }

    get _openItems() {
        return [...this.shadowRoot.querySelectorAll('ptcs-accordion-item[opened]')];
    }

    _getParent() {
        return this;
    }

    _clearSelection() {
        if (this._selectedItem) {
            this._selectedItem._clearSelection();
            this._selectedItem = null;
        }
    }

    _setSelectedItem(item) {
        // One of the 'leaf' items of this accordion (within its subtree) has been clicked, so make
        // sure any previous selection is cleared
        if (this._selectedItem) {
            // There *was* a selected item before in this accordion, so we don't need to go any further
            // up the tree---just clear the previous selection
            if (this._selectedItem !== item) {
                this._selectedItem._clearSelection();
            }
        } else if (this._parent) {
            // Not selected, let the parent item continue upwards, registring itself
            this._parent._setSelected();
        }

        // This is now the *new* selected item and all ancestors know this
        this._selectedItem = item;
    }

    // Somebody has set the selection from the outside
    selectKey(selectedKey, matchSelectorF) {
        const allItemEls = this.shadowRoot.querySelectorAll('[part=item]');
        // Process each item recursively
        for (let i = 0; i < allItemEls.length; i++) {
            const itemEl = allItemEls[i];
            if (itemEl.selectKey(selectedKey, matchSelectorF)) {
                return true;
            }
        }
        return false;
    }

    _minWidthChanged(minWidth) {
        const v = PTCS.cssDecodeSize(minWidth);
        this.style.minWidth = v > 0 ? `${v}px` : '';
    }

    _maxWidthChanged(maxWidth) {
        const v = PTCS.cssDecodeSize(maxWidth);
        this.style.maxWidth = v > 0 ? `${v}px` : '';
    }

    _multipleOpenItemsChanged(multipleOpenItems) {
        if (!multipleOpenItems) {
            this._openItems.forEach((el, i) => {
                if (i > 0) {
                    el.opened = false;
                }
            });
        }
    }

    _openedChanged(ev) {
        if (!this.multipleOpenItems && ev.detail.value === true) {
            this._openItems.forEach(el => {
                if (el !== ev.target) {
                    el.opened = false;
                }
            });
        }
    }

    subFocusChanged(ev) {
        if (ev.target.parentNode === this.shadowRoot) {
            this._focus = ev.target;
            this._subFocus = ev.detail.el;
        }
    }

    get focusEl() {
        if (!this._focus || this._focus.parentNode !== this.shadowRoot) {
            this._focus = this.shadowRoot.querySelector('ptcs-accordion-item:first-of-type');
            this._subFocus = null;
        }
        return this._focus;
    }

    set focusEl(el) {
        if (el && el.parentNode === this.shadowRoot && el.tagName === 'PTCS-ACCORDION-ITEM') {
            this._focus = el;
            this._subFocus = null;
            this.dispatchEvent(new CustomEvent('focus-changed', {
                bubbles:  true,
                composed: true,
                detail:   {el}
            }));
        }
    }

    get deepFocusEl() {
        const focus = this.focusEl;
        return focus && (this._subFocus || this._focus);
    }

    _initTrackFocus() {
        this._trackFocus(this, () => {
            const item = this.deepFocusEl;
            // Since we now need to style the focused item differently, add an attribute to the item
            if (this._currFocusedEl) {
                if (this._currFocusedEl !== item) {
                    this._currFocusedEl.removeAttribute('focused');
                }
            }
            if (this._currFocusedEl !== item) {
                item.setAttribute('focused', '');
                this._currFocusedEl = item;
            }
            return item && item.headerElement;
        });
    }

    _blur(ev) {
        if (this._currFocusedEl) {
            this._currFocusedEl.removeAttribute('focused');
            this._currFocusedEl = null;
        }
        this.dispatchEvent(new CustomEvent('lost-focus', {
            bubbles:  true,
            composed: true,
            detail:   {cmpnt: 'accordion'}
        }));
    }

    _clickOnAccordion(ev) {
        if (ev.target.tagName === 'PTCS-ACCORDION-ITEM') {
            this.focusEl = ev.target;
            if (this.focusEl.opened) {
                this._setNextDeepFocus();
            }

            ev.stopPropagation();
        }
    }

    _setFirstDeepFocus() {
        this.focusEl = this.shadowRoot.querySelector('ptcs-accordion-item:first-of-type');
        return this._subFocus || this._focus;
    }

    _setLastDeepFocus() {
        const focus = this.shadowRoot.querySelector('ptcs-accordion-item:last-of-type');
        if (!focus) {
            return null;
        }
        const accordion = focus.opened && focus.accordion;
        this._focus = focus;
        this._subFocus = accordion && accordion._setLastDeepFocus();
        return this._subFocus || this._focus;
    }

    _setNextDeepFocus() {
        if (this._focus.opened) {
            const accordion = this._focus.accordion;
            this._subFocus = accordion && (this._subFocus ? accordion._setNextDeepFocus() : accordion._setFirstDeepFocus());
            if (this._subFocus) {
                return this._subFocus;
            }
        }
        const next = this._focus.nextElementSibling;
        if (!next) {
            return null;
        }
        this.focusEl = next;
        return (this._focus === next) && next;
    }

    _setPrevDeepFocus() {
        if (this._subFocus && this._focus.opened) {
            // Focus is somewhere inside this._focus
            const accordion = this._focus.accordion;
            this._subFocus = accordion && accordion._setPrevDeepFocus();
            return this._subFocus || this._focus;
        }
        const prev = this._focus.previousElementSibling;
        if (!prev) {
            return null;
        }
        // Focus should be moved to last sub-leaf in prev, if prev is opened
        const accordion = prev.opened && prev.accordion;
        this._subFocus = accordion && accordion._setLastDeepFocus();
        if (this._subFocus) {
            this._focus = prev;
            return this._subFocus;
        }
        this.focusEl = prev;
        return (this._focus === prev) && this._focus;
    }

    _getParentItem(el) {
        // Starting from the parent, find the closest item
        for (el = el._parent; el; el = el._parent) {
            if (el.nodeName === 'PTCS-ACCORDION-ITEM') {
                return el;
            }
        }
        // Not found
        return null;
    }

    _setParentFocus() {
        if (this._subFocus && this._focus.opened) {
            // Focus is somewhere inside this._focus
            const accordion = this._focus.accordion;
            this._subFocus = accordion && accordion._setParentFocus();
            return this._subFocus || this._focus;
        }
        const parent = this._getParentItem(this._focus);
        if (!parent) {
            return null;
        }
        this.focusEl = parent;
        return (this._focus === parent) && this._focus;
    }

    _keyDown(ev) {
        const focus = this.deepFocusEl;
        if (!focus) {
            return;
        }
        switch (ev.key) {
            case 'Home':
                this._setFirstDeepFocus();
                break;
            case 'ArrowUp':
                if (!this._setPrevDeepFocus()) {
                    this._setLastDeepFocus();
                }
                break;
            case 'End':
                this._setLastDeepFocus();
                break;
            case 'ArrowDown':
                if (!this._setNextDeepFocus()) {
                    this._setFirstDeepFocus();
                }
                break;
            case 'ArrowLeft':
                {
                    if (focus.content) {
                        if (focus.opened) {
                            focus.toggle();
                            return;
                        }
                    }
                    const parent = this._getParentItem(focus);
                    if (parent) {
                        // Move focus to the parent item...
                        this._setParentFocus();

                        // ...and collapse it again
                        parent.toggle();
                    }
                }
                break;
            case 'ArrowRight':
                if (focus.content) {
                    if (!focus.opened) {
                        // Open it...
                        focus.toggle();

                        // ...and move the focus to the first child
                        this._setNextDeepFocus();
                    }
                }
                break;
            case 'Enter':
            case ' ':
                focus.toggle();
                if (focus.opened) {
                    // Move the focus to the first child
                    this._setNextDeepFocus();
                }
                break;
            default:
                // Not handled
                return;
        }

        // We acted on this keyboard event
        ev.preventDefault();

        if (focus !== this.deepFocusEl) {
            if (this.deepFocusEl) {
                this.deepFocusEl.scrollIntoViewIfNeeded();
            }
        }
    }

    _updateFillMissingIcons(v) {
        this.fillMissingIcons = !v;
    }

    _updateAllowMissingIcons(v) {
        this.allowMissingIcons = !v;
    }

    _updateHideIcons(v) {
        this.hideIcons = !v;
    }

    _updateDisplayIcons(v) {
        this.displayIcons = !v;
    }
};

customElements.define(PTCS.Accordion.is, PTCS.Accordion);
