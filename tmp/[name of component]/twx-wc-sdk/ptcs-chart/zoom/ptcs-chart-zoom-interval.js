import {PolymerElement, html} from '@polymer/polymer/polymer-element.js';
import '@polymer/polymer/lib/elements/dom-if.js';
import {PTCS} from 'ptcs-library/library.js';
import {typeValue, typeIsFullRange} from 'ptcs-library/library-chart.js';
import 'ptcs-textfield/ptcs-textfield.js';
import 'ptcs-dropdown/ptcs-dropdown.js';
import 'ptcs-radio/ptcs-radio.js';
import './ptcs-chart-zoom-input.js';
import 'ptcs-behavior-styleable/ptcs-behavior-styleable.js';
import 'ptcs-behavior-focus/ptcs-behavior-focus.js';


PTCS.ChartZoomInterval = class extends PTCS.BehaviorFocus(PTCS.BehaviorStyleable(PTCS.ThemableMixin(PolymerElement))) {
    static get template() {
        return html`<style>
        :host {
            display: flex;
            justify-content: flex-start;
            align-items: flex-end;
        }
        [part~=radio-body] {
            display: flex;
            justify-content: flex-start;
            align-items: center;
            flex-direction: row;
            flex-wrap: wrap;
        }
        ptcs-chart-zoom-input {
            display: flex;
        }
        ptcs-chart-zoom-input[hidden] {
            display: none;
        }
        ptcs-button {
            flex: 0 0 auto;
        }
        </style>
        <ptcs-chart-zoom-input part="pick" label="[[startLabel]]" part-names="[[_startPartNames]]"
                               enable-tabindex="[[_delegatedFocus]]"
                               disabled="[[disabled]]"
                               on-value-changed="_startChanged"
                               type="[[_type]]" value="[[_value(_anchorStart, anchor, minValue)]]"
                               hidden\$="[[_hideStart(origin, showAnchor)]]"></ptcs-chart-zoom-input>
        <ptcs-chart-zoom-input part="pick" label="[[endLabel]]" part-names="[[_endPartNames]]"
                               enable-tabindex="[[_delegatedFocus]]"
                               disabled="[[disabled]]"
                               on-value-changed="_endChanged"
                               type="[[_type]]" value="[[_value(_anchorEnd, anchor, maxValue)]]"
                               hidden\$="[[_hideEnd(origin, showAnchor)]]"></ptcs-chart-zoom-input>
        <ptcs-button label="[[resetLabel]]" part="reset" variant="transparent" id="reset" icon="cds:icon_refresh"
                               tabindex\$="[[_delegatedFocus]]"
                               disabled="[[_disableReset(_type, minValue, maxValue, zoomStart, zoomEnd, enableReset, disabled)]]"
                               on-click="reset"></ptcs-button>`;
    }

    static get is() {
        return 'ptcs-chart-zoom-interval';
    }

    static get properties() {
        return {
            label: {
                type: String
            },

            // dropdown, radio, textfield
            control: {
                type:               String,
                reflectToAttribute: true
            },

            // Previous value of control
            _old: {
                type:  Object,
                value: () => ({})
            },

            // control: 'dropdown' || 'radio'
            // "date":    [{label, duration: time-duration}, ...]
            // "numbers": [{label, duration: count}, ...]
            // "labels":  [{label, duration: count}, ...]
            //----
            // control: 'textfield'
            // "date":    time-unit
            // "numbers": multiplier (default: 1)
            // "labels":  mulitplier (default: 1)
            //----
            // time-duration = `${number}${time-unit}`
            // time-unit= 'Y' || 'M' || 'D' || 'W' || 'd' || 'h' || 'm' || 's' || 'ms'
            interval: {
                type: Object
            },

            // 'start' || 'end' ==> zoomEnd = _anchorStart + intervalValue || zoomStart = _anchorEnd - intervalValue
            origin: {
                type: Object
            },

            // Externally specified anchor
            anchor: {
                type:     Object,
                observer: '_anchorChanged'
            },

            // Specified start anchor (by UI control)
            _anchorStart: {
                type: Object
            },

            // Specified end anchor (by UI control)
            _anchorEnd: {
                type: Object
            },

            // The specified interval
            value: {
                type: Number
            },

            // Type of interval data
            type: {
                type:     Object, // 'number' || 'date' || Array (of labels) [=labels]
                observer: '_typeChanged'
            },

            // Validated type
            _type: {
                type: Object
            },

            // Minimum value in data
            minValue: {
                type: Object
            },

            // Maximum value in data
            maxValue: {
                type: Object
            },

            // zoomStart
            zoomStart: {
                type:     Object,
                notify:   true,
                observer: '_zoomStartChanged'
            },

            // zoomEnd
            zoomEnd: {
                type:     Object,
                notify:   true,
                observer: '_zoomEndChanged'
            },

            showAnchor: {
                type: Boolean
            },

            _startPartNames: {
                type:  String,
                value: 'pick-start'
            },

            _endPartNames: {
                type:  String,
                value: 'pick-end'
            },

            // Hide reset button
            hideReset: {
                type: Boolean
            },

            // Assigned if it is imposssible to show reset button
            noReset: {
                type:   Boolean,
                notify: true
            },

            // Reset button should be enabled
            enableReset: {
                type: Boolean
            },

            // i18n
            startLabel: {
                type: String
            },

            endLabel: {
                type: String
            },

            // TODO: Remove reset button
            resetLabel: {
                type: String
            },

            disabled: {
                type: Boolean
            },

            _delegatedFocus: {
                type:     String,
                observer: '_delegatedFocusChanged'
            }
        };
    }

    static get observers() {
        return ['_change(label, interval, control, origin, value, anchor, _anchorStart, _anchorEnd, minValue, maxValue)'];
    }

    _value(v1, v2, v3) {
        if (this._isType(v1)) {
            return v1;
        }
        return this._isType(v2) ? v2 : v3;
    }

    _hideStart(origin, showAnchor) {
        return origin !== 'start' || !showAnchor;
    }

    _hideEnd(origin, showAnchor) {
        return origin !== 'end' || !showAnchor;
    }

    __assign(cb) {
        if (this.__protect) {
            return;
        }
        this.__protect = true;
        try {
            cb();
        } finally {
            this.__protect = false;
        }
    }

    _isType(value) {
        return !isNaN(typeValue(value, this._type));
    }

    _typeChanged(type) {
        if (type !== 'number' && type !== 'date' && !(type instanceof Array)) {
            return; // Invalid type
        }
        this._type = type;
    }

    _elRange() {
        return this._old.control ? this.shadowRoot.querySelector('[part~=interval]') : null;
    }

    _anchor() {
        if (this.origin === 'start') {
            return this._value(this._anchorStart, this.anchor, this.minValue);
        }
        if (this.origin === 'end') {
            return this._value(this._anchorEnd, this.anchor, this.maxValue);
        }
        return undefined;
    }

    _change(label, interval, control, origin, value, anchor, _anchorStart, _anchorEnd, minValue, maxValue) {
        // Make sure we have the correct UI control loaded
        this._buildControl(control);

        // Get the control element
        const el = this._elRange();
        if (!el) {
            return;
        }

        // Value correspond to an index?
        const index = interval instanceof Array ? interval.findIndex(item => item.duration === value) : -1;

        // Update element structure with data
        if (control === 'textfield') {
            el.label = label;
            if (value !== `${el.text}${interval}`) {
                let v = '';
                if (typeof value === 'string' && value !== '') {
                    const m = /^([0-9.]+)(\w+)$/g.exec(value);
                    if (m && m[2] === interval) {
                        v = m[1];
                    }
                }
                el.text = v;
            }
        } else if (control === 'dropdown') {
            el.label = label;
            if (this._old.interval !== interval) {
                this._old.interval = interval;
                const items = interval instanceof Array ? interval.map(item => item.label || 'No label') : [];
                el.items = items;
                el.filter = items.length > 6;
            }
            el.selected = index;
        } else if (control === 'radio') {
            el.firstChild.label = label;
            const body = el.firstChild.nextSibling;
            if (this._old.interval !== interval) {
                this._old.interval = interval;
                let radio = body.firstChild;
                if (interval instanceof Array) {
                    interval.forEach((item, i) => {
                        if (!radio) {
                            radio = document.createElement('ptcs-radio');
                            radio.addEventListener('checked-changed', ev => this._setValueRadio(i, ev.detail.value));
                            body.appendChild(radio);
                        }
                        radio.label = item.label;
                        radio = radio.nextSibling;
                    });
                }
                // Remove radio buttons for deleted labels
                while (radio) {
                    const e = radio;
                    radio = radio.nextSibling;
                    e.parentNode.removeChild(e);
                }
            }
            if (body && body.children) {
                if (index >= 0) {
                    body.children[index].checked = true;
                } else {
                    for (let i = body.children.length - 1; i >= 0; i--) {
                        body.children[i].checked = false;
                    }
                }
            }
        }

        // Now update zoomStart / zoomEnd
        if (value === undefined || value === null || value === '') {
            return;
        }

        const _anchor = this._anchor();
        if (!this._isType(_anchor)) {
            return;
        }

        this.__assign(() => {
            switch (this._type) {
                case 'date':
                    this._changeDateInterval(value, origin, _anchor);
                    break;
                case 'number':
                    this._changeNumberInterval(value, origin, _anchor);
                    break;
                default:
                    if (this._type instanceof Array) {
                        this._changeLabelInterval(value, origin, _anchor);
                    }
                    break;
            }
        });
    }

    // make sure the control element structure is loaded
    _buildControl(control) {
        if (control === this._old.control) {
            // Already created (or no control has been specified)
            return;
        }
        if (this._old.control !== undefined) {
            // Remove old control structure
            this.shadowRoot.removeChild(this._elRange());
            this._old.interval = undefined;
        }
        // Create new control stucture
        let el;
        if (control === 'textfield') {
            el = document.createElement('ptcs-textfield');
            el.setAttribute('part', 'interval');
            el.addEventListener('text-changed', ev => this._setValue(`${ev.detail.value}${this.interval}`));
        } else if (control === 'dropdown') {
            el = document.createElement('ptcs-dropdown');
            el.setAttribute('part', 'interval');
            el.addEventListener('selected-changed', ev => this._setValueIndex(ev.detail.value));
        } else if (control === 'radio') {
            el = document.createElement('div');
            el.setAttribute('part', 'interval radio-group');
            const label = document.createElement('ptcs-label');
            label.setAttribute('part', 'label');
            label.setAttribute('variant', 'label');
            el.appendChild(label);
            const body = document.createElement('div');
            body.setAttribute('part', 'radio-body');
            el.appendChild(body);
        } else {
            this._old.control = undefined;
            return;
        }
        // Attach control structure
        this._old.control = control;
        this.shadowRoot.insertBefore(el, this.shadowRoot.lastChild);
        this._delegatedFocusChanged(this._delegatedFocus);
    }

    _delegatedFocusChanged(_delegatedFocus) {
        const el = this._elRange();
        if (!el) {
            return;
        }
        switch (el.tagName) {
            case 'PTCS-TEXTFIELD':
            case 'PTCS-DROPDOWN':
                if (_delegatedFocus !== false && _delegatedFocus !== undefined && _delegatedFocus !== null) {
                    el.setAttribute('tabindex', _delegatedFocus);
                } else {
                    el.removeAttribute('tabindex');
                }
                break;
            case 'DIV':
                // radio group - not actually supported. Ignore for now
                break;
            default:
                console.warn('Unknown tagName: ' + el.tagName);
        }
    }

    _anchorChanged(/*anchor*/) {
        this._anchorStart = undefined;
        this._anchorEnd = undefined;
    }

    _zoomStartChanged(zoomStart, old) {
        // zoomStart can e.g. be a number encoded as a string
        // eslint-disable-next-line eqeqeq
        if (this.__protect || zoomStart == old) {
            return;
        }
        if (zoomStart instanceof Date && old instanceof Date && zoomStart.getTime() === old.getTime()) {
            return;
        }
        this.value = '';
    }

    _zoomEndChanged(zoomEnd, old) {
        // zoomEnd can e.g. be a number encoded as a string
        // eslint-disable-next-line eqeqeq
        if (this.__protect || zoomEnd == old) {
            return;
        }
        if (zoomEnd instanceof Date && old instanceof Date && zoomEnd.getTime() === old.getTime()) {
            return;
        }
        this.value = '';
    }

    _startChanged(ev) {
        const value = ev.detail.value;
        if (this._isType(value)) {
            this._anchorStart = value;
        } else if (value === null || value === '') {
            if (this._anchorStart !== undefined) {
                this._anchorStart = undefined;
            } else {
                // Need explicit reset
                ev.target.value = this._value(this.anchor, this.minValue);
            }
        }
    }

    _endChanged(ev) {
        const value = ev.detail.value;
        if (this._isType(value)) {
            this._anchorEnd = value;
        } else if (value === null || value === '') {
            if (this._anchorEnd !== undefined) {
                this._anchorEnd = undefined;
            } else {
                // Need explicit reset
                ev.target.value = this._value(this.anchor, this.maxValue);
            }
        }
    }

    _changeNumberInterval(value, origin, _anchor) {
        // Convert to number
        value = +value;
        _anchor = +_anchor;
        if (isNaN(value) || isNaN(_anchor)) {
            return;
        }
        if (origin === 'start') {
            this.zoomStart = _anchor;
            this.zoomEnd = Math.min(_anchor + value, this.maxValue);
        } else if (origin === 'end') {
            this.zoomStart = Math.max(_anchor - value, this.minValue);
            this.zoomEnd = _anchor;
        }
    }

    _changeLabelInterval(value, origin, _anchor) {
        value = +value; // Convert to number
        if (value <= 0 || isNaN(value)) {
            return;
        }
        const index = this._type.findIndex(s => s === _anchor);
        if (!(index >= 0)) {
            return;
        }
        if (origin === 'start') {
            this.zoomStart = _anchor;
            this.zoomEnd = this._type[Math.max(Math.min(index + value, this._type.length - 1), 0)];
        } else if (origin === 'end') {
            this.zoomStart = this._type[Math.max(index - value, 0)];
            this.zoomEnd = _anchor;
        }
    }

    _changeDateInterval(value, origin, _anchor) {
        if (typeof value !== 'string') {
            return;
        }
        const m = /^([0-9.]+)(\w+)$/g.exec(value);
        if (!m) {
            return;
        }
        const num = m[1];
        const unit = m[2];
        let delta = 0;

        // Compute delta
        switch (unit) {
            case 'Y':
            case 'M':
                // delta is dependent on anchor
                break;
            case 'W':
                delta = num * 7 * 24 * 60 * 60 * 1000;
                break;
            case 'd':
                delta = num * 24 * 60 * 60 * 1000;
                break;
            case 'h':
                delta = num * 60 * 60 * 1000;
                break;
            case 'm':
                delta = num * 60 * 1000;
                break;
            case 's':
                delta = num * 1000;
                break;
            case 'ms':
                delta = num;
                break;
            default:
                // Failure
                return;
        }

        if (origin === 'start') {
            if (!delta) {
                const date = new Date(_anchor);
                if (unit === 'Y') {
                    date.setFullYear(date.getFullYear() + num);
                } else if (unit === 'M') {
                    const years = Math.floor(num / 12);
                    date.setFullYear(date.getFullYear() + years);
                    date.setMonth(date.getMonth() + (num - 12 * years));
                }
                delta = date.getTime() - _anchor.getTime();
            }
            this.zoomStart = new Date(_anchor);
            this.zoomEnd = new Date(Math.min(_anchor.getTime() + delta, this.maxValue.getTime()));
        } else if (origin === 'end') {
            if (!delta) {
                const date = new Date(_anchor);
                if (unit === 'Y') {
                    date.setFullYear(date.getFullYear() - num);
                } else if (unit === 'M') {
                    let months = date.getMonth();
                    if (months >= num) {
                        date.setMonth(months - num);
                    } else {
                        let years = Math.floor(num / 12);
                        const num2 = num - 12 * years;
                        if (months < num2) {
                            years++; // One more year to subtract
                            months += 12; // 12 more months to use
                        }
                        date.setFullYear(date.getFullYear() - years);
                        date.setMonth(months - num2);
                    }
                }
                delta = _anchor.getTime() - date.getTime();
            }
            this.zoomStart = new Date(Math.max(_anchor.getTime() - delta, this.minValue.getTime()));
            this.zoomEnd = new Date(_anchor);
        }
    }

    // String value
    _setValue(value) {
        this.value = value;
    }

    // Value by index
    _setValueIndex(index) {
        this._setValue(index >= 0 && this.interval instanceof Array ? this.interval[index].duration : '');
    }

    // Value by radio button index
    _setValueRadio(index, checked) {
        if (!checked) {
            return;
        }

        // Uncheck all other radio buttons
        const body = this._elRange().firstChild.nextSibling;
        let i = 0;
        for (let el = body.firstChild; el; el = el.nextSibling) {
            if (i++ !== index && el.checked) {
                el.checked = false;
            }
        }

        this._setValueIndex(index);
    }

    _disableReset(_type, minValue, maxValue, zoomStart, zoomEnd, enableReset, disabled) {
        if (disabled) {
            return true;
        } else if (enableReset) {
            return false;
        }
        return typeIsFullRange(_type, minValue, maxValue, zoomStart, zoomEnd);
    }

    _testResetButton() {
        // show / hide reset button
        const button = this.$.reset;
        if (this.hideReset) {
            button.style.display = 'none';
            this.style.flexWrap = 'wrap';
        } else if (!this.__checkResetButton) {
            this.__checkResetButton = true;
            requestAnimationFrame(() => {
                this.__checkResetButton = false;
                button.style.display = '';
                this.style.flexWrap = '';
                const b0 = this.getBoundingClientRect();
                const b1 = button.getBoundingClientRect();
                const noReset = b0.right < b1.right;
                if (noReset) {
                    button.style.display = 'none';
                    this.style.flexWrap = 'wrap';
                }
                this.noReset = noReset;
            });
        }
    }

    resizeEv() {
        this._testResetButton();
    }

    reset() {
        if (this.disabled) {
            return;
        }
        this.zoomStart = undefined;
        this.zoomEnd = undefined;
        this._anchorStart = undefined;
        this._anchorEnd = undefined;
        this.dispatchEvent(new CustomEvent('zoom-reset', {bubbles: true, composed: true, detail: {}}));
    }
};

customElements.define(PTCS.ChartZoomInterval.is, PTCS.ChartZoomInterval);
