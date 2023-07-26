import {PolymerElement, html} from '@polymer/polymer/polymer-element.js';
import {PTCS} from 'ptcs-library/library.js';
import 'ptcs-collapse/ptcs-collapse.js';
import 'ptcs-button/ptcs-button.js';
import 'ptcs-behavior-styleable/ptcs-behavior-styleable.js';
import 'ptcs-icons/cds-icons.js';


PTCS.AccordionItem = class extends PTCS.BehaviorStyleable(PTCS.ThemableMixin(PolymerElement)) {

    static get template() {
        return html`
        <style>
            [part=header] {
                display: flex;
                justify-content: space-between;
                align-items: center;
                cursor: pointer;
            }

            [part=header][halign=left] {
                flex-direction: row-reverse;
                justify-content: flex-end;
            }

            :host([mute]) [part=header] {
                cursor: unset;
            }

            [part=trigger-button] {
                transform-origin: center;
            }

            [part=trigger-button][hidden] {
                display: none !important;
            }

            [part=trigger-button][rotate='270'] {
                transform: rotate(270deg);
            }

            [part=trigger-button][rotate='90'] {
                transform: rotate(90deg);
            }

            [part=label] {
                width: 100%;
            }
        </style>
        <div part="header" id="header" halign$="[[triggerAlign]]" on-click="toggle" aria-role="heading" disabled$="[[disabled]]">
            <ptcs-icon part="icon" icon="[[_getIcon(icon, allowMissingIcons)]]" size="[[_iconSize(iconWidth, iconHeight)]]"
            icon-width="[[iconWidth]]" icon-height="[[iconHeight]]" aria-hidden="true"
                hidden$="[[_noIcon(icon, allowMissingIcons, displayIcons)]]"></ptcs-icon>
            <ptcs-label part="label" label="[[label]]"
                        aria-role="button" aria-expanded="[[_ariaBoolean(opened)]]"
                        aria-disabled="[[_ariaBoolean(mute)]]"></ptcs-label>
            <ptcs-button no-tabindex part="trigger-button" variant="small" hidden$="[[_hideTrigger(hideTrigger, content)]]" disabled="[[disabled]]"
                         icon="[[_icon(opened, triggerType)]]" rotate$="[[_rotateIcon]]" aria-hidden="true"></ptcs-button>
        </div>
        <ptcs-collapse opened="[[opened]]">
            <div part="panel" aria-role="region"></div>
        </ptcs-collapse>`;
    }

    static get is() {
        return 'ptcs-accordion-item';
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

            label: {
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

            // If we don't init this to something, the _hideTrigger won't be triggered when the content is undefined
            content: {
                type:  String,
                value: ''
            },

            // Is this the "currently selected" leaf?
            selected: {
                type:               Boolean,
                reflectToAttribute: true
            },

            noContent: {
                type:               Boolean,
                computed:           '_noContent(content)',
                reflectToAttribute: true
            },

            item: {
                type: Object
            },

            _parent: {
                type: Object
            },

            _level: {
                type: Number
            },

            opened: {
                type:               Boolean,
                observer:           '_openedChanged',
                notify:             true,
                reflectToAttribute: true
            },

            multipleOpenItems: {
                type: Boolean
            },

            // "type1" || "type2" || "type3" || "type4"
            triggerType: {
                type:               String,
                reflectToAttribute: true
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

            _rotateIcon: {
                type:     String,
                computed: '_computeRotateIcon(opened, triggerType)'
            },

            mute: {
                type:               Boolean,
                computed:           '_computeMute(disabled, opened, triggerCanCollapse)',
                reflectToAttribute: true
            }
        };
    }

    static get observers() {
        // eslint-disable-next-line max-len
        return ['_updatePanel(disabled, content, multipleOpenItems, triggerType, hideTrigger, triggerAlign, triggerCanCollapse, allowMissingIcons, displayIcons, variant, iconWidth, iconHeight)'];
    }

    _ariaBoolean(opened) {
        return opened ? 'true' : 'false';
    }

    ready() {
        super.ready();
        if (this.opened === undefined) {
            this.opened = false;
        }
        if (this.triggerType === undefined) {
            this.triggerType = 'type1';
        }
        this._panelEl = this.shadowRoot.querySelector('[part=panel]');
        this.__isReady = true;
        this._updatePanel(this.disabled, this.content, this.multipleOpenItems, this.triggerType,
            this.hideTrigger, this.triggerAlign, this.triggerCanCollapse, this.allowMissingIcons, this.displayIcons, this.variant);
    }

    _updatePanel(disabled, content, multipleOpenItems, triggerType, hideTrigger, triggerAlign, triggerCanCollapse,
        allowMissingIcons, displayIcons, variant, iconWidth, iconHeight) {
        if (!this.__isReady) {
            return;
        }
        let el = this._panelEl.firstChild;

        if (Array.isArray(content)) {
            if (!el || el.tagName !== 'PTCS-ACCORDION') {
                if (el) {
                    el.remove();
                }
                el = document.createElement('ptcs-accordion');
                el.setAttribute('part', 'sub-accordion');
                el.setAttribute('no-tabindex', '');
                this._panelEl.appendChild(el);
            }

            // We must keep track of the nesting depth to handle the indent
            const nextLevel = this._level ? this._level + 1 : 1;

            // eslint-disable-next-line max-len
            el.setProperties({items: content, _parent: this, _level: nextLevel, disabled, multipleOpenItems, triggerType, hideTrigger, triggerAlign, triggerCanCollapse, allowMissingIcons, displayIcons, variant, iconWidth, iconHeight});

            // Add a CSS variable on the ptcs-accordion element that will affect the indentation
            el.style.setProperty('--ptcs-accordion-current-indent', nextLevel);

            this.setAttribute('sub-accordion', '');
        } else {
            if (el && el.nodeType !== Node.TEXT_NODE) {
                el.remove();
            }
            this._panelEl.textContent = content;
            this.removeAttribute('sub-accordion');
        }
    }

    _hideTrigger(hideTrigger, content) {
        if (!content) {
            return true;
        }
        return hideTrigger;
    }

    get headerElement() {
        return this.$.header;
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

    _noContent(content) {
        if (Array.isArray(content) && content.length > 0) {
            return false;
        }
        return true;
    }

    _computeMute(disabled, opened, triggerCanCollapse) {
        if (disabled) {
            return true;
        }
        if (triggerCanCollapse) {
            return false;
        }
        return opened;
    }

    _openedChanged(opened, old) {
        // If this item is closed, close all sub-items
        if (!opened && old) {
            const accordion = this.accordion;
            if (accordion) {
                accordion._openItems.forEach(el => {
                    el.opened = false;
                });
            }
        }
    }

    _clearSelection() {
        if (this.accordion) {
            this.accordion._clearSelection();
        } else if (this.selected) {
            this.selected = false;
        }
    }

    _setSelected() {
        // An item further down in the tree has been selected, propagate this upwards
        this._parent._setSelectedItem(this);
    }

    static _triggerType(triggerType) {
        return typeof triggerType === 'string' ? triggerType.replace(/\s/g, '').toLowerCase() : '';
    }

    _icon(opened, triggerType) {
        switch (PTCS.AccordionItem._triggerType(triggerType)) {
            case 'type1':
            case 'doublecarets':
                return 'cds:icon_double_chevron_mini';
            case 'type2':
            case 'close':
                return opened ? 'cds:icon_close_mini' : 'cds:icon_chevron_left_mini';
            case 'type3':
            case 'singlecaret':
                return 'cds:icon_chevron_left_mini';
            case 'type4':
            case 'plus/minus':
                return opened ? 'cds:icon_minus_mini' : 'cds:icon_add_mini';
        }
        return false;
    }

    _computeRotateIcon(opened, triggerType) {
        switch (PTCS.AccordionItem._triggerType(triggerType)) {
            case 'type1':
            case 'type3':
            case 'doublecarets':
            case 'singlecaret':
                return opened ? '90' : '270';
            case 'type2':
            case 'close':
                return opened ? '0' : '270';
            case 'type4':
            case 'plus/minus':
                return '0';
        }
        return false;
    }

    _iconSize(iconWidth, iconHeight) {
        if (iconWidth || iconHeight) {
            return 'custom';
        }
        return 'small';
    }

    toggle() {
        if (this.disabled) {
            return;
        }

        if (this.content && (this.triggerCanCollapse || !this.opened)) {
            this.opened = !this.opened;
        }

        if (!this.content) {
            // Inform the parent that there is a new 'selected' item,
            this._parent._setSelectedItem(this);

            this.selected = true;

            this.dispatchEvent(new CustomEvent(
                'action',
                {
                    bubbles:  true,
                    composed: true,
                    detail:   {item: this.item}
                }));
        }
    }

    // This item has been selected from the "outside", programmatically
    selectKey(selectedKey, matchSelectorF) {
        // Either this is a hit on the item itself...
        if (!Array.isArray(this.content) && matchSelectorF(this.item) === selectedKey) {
            // Inform the parent that there is a new 'selected' item,
            this._parent._setSelectedItem(this);
            this.selected = true;
            return true;
        }

        // ...or maybe it is in one of the sub-accordions?
        const accordion = this.accordion;
        if (accordion) {
            return accordion.selectKey(selectedKey, matchSelectorF);
        }

        // No hit within this accordion item
        return false;
    }

    get accordion() {
        const sub = this._panelEl.firstChild;
        return (sub && sub.tagName === 'PTCS-ACCORDION') ? sub : null;
    }
};


customElements.define(PTCS.AccordionItem.is, PTCS.AccordionItem);
