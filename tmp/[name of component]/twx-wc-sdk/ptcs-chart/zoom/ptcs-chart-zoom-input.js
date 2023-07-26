import {PolymerElement} from '@polymer/polymer/polymer-element.js';
import '@polymer/polymer/lib/elements/dom-if.js';
import {PTCS} from 'ptcs-library/library.js';
import 'ptcs-textfield/ptcs-textfield.js';
import 'ptcs-dropdown/ptcs-dropdown.js';
import 'ptcs-datepicker/ptcs-datepicker.js';
import 'ptcs-behavior-styleable/ptcs-behavior-styleable.js';
import 'ptcs-behavior-focus/ptcs-behavior-focus.js';

// NOTE:   This component creates it sub-components in the regular DOM, not in the shadow DOM
// REASON: The client should have direct styling access to to content, both via CSS and theme designer
//         (This component is only an internal implementation detail)

/* Don't need a warning to make sure I have not confused "=>" with ">=" or "<=" */
/* eslint-disable no-confusing-arrow */

PTCS.ChartZoomInput = class extends PTCS.BehaviorFocus(PolymerElement) {
    static get is() {
        return 'ptcs-chart-zoom-input';
    }

    static get properties() {
        return {
            type: {
                type:               Object, // 'number' || 'date' || Array (of labels)
                observer:           '_typeChanged',
                reflectToAttribute: true
            },

            // validated type
            _type: {
                type: Object
            },

            // Minimum value in data
            value: {
                type:     Object,
                observer: '_valueChanged',
                notify:   true
            },

            partNames: {
                type:     String,
                observer: '_partNamesChanged',
            },

            // 2 next properties are for dates only
            formatToken: {
                type:     String,
                observer: '_formatTokenChanged'
            },

            hintText: {
                type:     String,
                value:    'Select Date & Time',
                observer: '_hintTextChanged'
            },

            // Property on range sub-control that contains value
            propName: String,

            // i18n
            label: {
                type:     String,
                observer: '_labelChanged'
            },

            enableTabindex: {
                type:     String,
                observer: '_enableTabindexChanged'
            },

            disabled: {
                type:     Boolean,
                observer: '_disabledChanged'
            }
        };
    }

    _formatTokenChanged(formatToken) {
        const dp = this.querySelector('ptcs-datepicker');
        if (dp) {
            dp.formatToken = formatToken;
        }
    }

    _hintTextChanged(hintText) {
        const dp = this.querySelector('ptcs-datepicker');
        if (dp) {
            dp.hintText = hintText;
        }
    }

    _isType(value) {
        if (value === '' || value === null || value === undefined) {
            return false;
        }
        if (this._type === 'date') {
            return value instanceof Date;
        }
        if (this._type instanceof Array) {
            return this._type.findIndex(s => s === value || s.label === value) >= 0;
        }
        return !isNaN(+value);
    }

    _valueChanged(value) {
        if (!this._isType(value) || !this.propName) {
            return;
        }
        this.firstChild[this.propName] = value;
    }

    _typeChanged(type) {
        // eslint-disable-next-line no-confusing-arrow, no-nested-ternary
        const tf = t => (t === 'number' || t === 'date') ? t : (t instanceof Array ? 'labels' : false);
        const tn = tf(type);
        if (!tn) {
            return; // Invalid type
        }
        const tn0 = tf(this._type);

        this._type = type;

        // Switch element representation
        if (tn !== tn0) {
            while (this.firstChild) {
                this.removeChild(this.firstChild);
            }
            switch (tn) {
                case 'number':
                    this.createNumberControl();
                    break;
                case 'date':
                    this.createDateControl();
                    break;
                case 'labels':
                    this.createLabelsControl();
                    break;
            }
        }

        // Send types to lists
        if (tn === 'labels') {
            const dropdown = this.firstChild;
            dropdown.items = this._type;
            dropdown.selector = item => (typeof item === 'string' ? item : item.label);
            dropdown.filter = this._type.length > 6;
        }
    }

    _partNamesChanged(partNames) {
        if (this.firstChild) {
            if (partNames) {
                this.firstChild.setAttribute('part', partNames);
            } else {
                this.firstChild.removeAttribute('part');
            }
        }
    }

    _labelChanged(label) {
        if (this.firstChild) {
            this.firstChild.label = label;
        }
    }

    _disabledChanged(value) {
        if (this.firstChild) {
            this.firstChild.disabled = value;
        }
    }

    _enableTabindexChanged(enableTabindex) {
        const el = this.firstChild;
        if (!el) {
            return;
        }
        switch (el.tagName) {
            case 'PTCS-DATEPICKER':
            case 'PTCS-TEXTFIELD':
            case 'PTCS-DROPDOWN':
                if (enableTabindex !== false && enableTabindex !== undefined && enableTabindex !== null) {
                    el.setAttribute('tabindex', enableTabindex);
                } else {
                    el.removeAttribute('tabindex');
                }
                break;

            default:
                console.warn('Unknown tagName: ' + el.tagName);
        }
    }

    // Add element to local dom (not to the shadow dom)
    _insert(el, propName) {
        if (this.partNames) {
            el.setAttribute('part', this.partNames);
        }

        el.label = this.label;

        this.propName = propName;
        if (this._isType(this.value)) {
            el[propName] = this.value;
        }

        const evName = `${window.camelToDashCase(propName)}-changed`;
        el.addEventListener(evName, ev => {
            const value = ev.detail.value;
            if (this._isType(value)) {
                this.value = value;
            } else if (value === null || value === '') {
                // Reset
                this.value = value;
            }
        });

        this.appendChild(el);

        this._enableTabindexChanged(this.enableTabindex);
    }

    createNumberControl() {
        //  <ptcs-textfield label="[[label]]"
        //                  text="{{value}}"></ptcs-textfield>
        const el = document.createElement('ptcs-textfield');
        el.disabled = this.disabled;
        this._insert(el, 'text');
    }

    createDateControl() {
        // <ptcs-datepicker label="[[label]]"
        //                  date-time="{{value}}"
        //                  format-token="[[formatToken]]"
        //                  show-time display-seconds></ptcs-datepicker>
        const el = document.createElement('ptcs-datepicker');
        el.formatToken = this._formatToken;
        el.showTime = el.displaySeconds = true;
        el.disabled = this.disabled;
        el.hintText = this.hintText;
        this._insert(el, 'dateTime');
    }

    createLabelsControl() {
        //  <ptcs-dropdown label="[[label]]"
        //                 selected-value="{{value}}"
        //                 items="[[_type]]"></ptcs-dropdown>
        const el = document.createElement('ptcs-dropdown');
        el.disabled = this.disabled;
        this._insert(el, 'selectedValue');
    }
};

customElements.define(PTCS.ChartZoomInput.is, PTCS.ChartZoomInput);
