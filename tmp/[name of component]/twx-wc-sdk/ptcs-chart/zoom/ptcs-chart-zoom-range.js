import {PolymerElement, html} from '@polymer/polymer/polymer-element.js';
import '@polymer/polymer/lib/elements/dom-if.js';
import {PTCS} from 'ptcs-library/library.js';
import {typeValue} from 'ptcs-library/library-chart.js';
import 'ptcs-behavior-styleable/ptcs-behavior-styleable.js';
import 'ptcs-behavior-focus/ptcs-behavior-focus.js';
import './ptcs-chart-zoom-input.js';


PTCS.ChartZoomRange = class extends PTCS.BehaviorFocus(PTCS.BehaviorStyleable(PTCS.ThemableMixin(PolymerElement))) {
    static get template() {
        return html`
        <style>
        :host {
            display: flex;
            justify-content: flex-start;
            align-items: flex-end;
            flex-direction: row;
            overflow: hidden;
            box-sizing: border-box;
        }

        ptcs-textfield, ptcs-dropdown, ptcs-datepicker {
            flex: 1 1 auto;
        }

        ptcs-button {
            flex: 0 0 auto;
        }

        ptcs-chart-zoom-input {
            display: flex;
        }
        </style>
        <ptcs-chart-zoom-input part="pick" label="[[startLabel]]" part-names="[[_startPartNames]]"
                               enable-tabindex="[[_delegatedFocus]]"
                               disabled="[[disabled]]"
                               type="[[type]]" value="[[_value(zoomStart, minValue, type)]]" hint-text="[[hintText]]"
                               formatToken="[[_formatToken]]" on-value-changed="_startChanged"></ptcs-chart-zoom-input>
        <ptcs-chart-zoom-input part="pick" label="[[endLabel]]" part-names="[[_endPartNames]]"
                               enable-tabindex="[[_delegatedFocus]]"
                               disabled="[[disabled]]"
                               type="[[type]]" value="[[_value(zoomEnd, maxValue, type)]]" hint-text="[[hintText]]"
                               formatToken="[[_formatToken]]" on-value-changed="_endChanged"></ptcs-chart-zoom-input>
        <ptcs-button label="[[resetLabel]]" part="reset" variant="primary" id="reset"
                     tabindex\$="[[_delegatedFocus]]"
                     disabled="[[_disabled(enableReset, minValue, maxValue, zoomStart, zoomEnd, type, disabled)]]"
                     on-click="reset"></ptcs-button>`;
    }

    static get is() {
        return 'ptcs-chart-zoom-range';
    }

    static get properties() {
        return {
            type: {
                type: Object // 'number' || 'date' || Array (of labels)
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
                type:   Object,
                notify: true
            },

            // zoomEnd
            zoomEnd: {
                type:   Object,
                notify: true
            },

            _formatToken: {
                type:     String,
                computed: '_computeFormatToken(minValue, maxValue)'
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

            // Hint text for the date range
            hintText: {
                type: String
            },

            _delegatedFocus: String
        };
    }

    _value(v1, v2 /*, type*/) {
        const gv = v => {
            const x = this._typeVal(v);
            if (isNaN(x)) {
                return undefined;
            }
            // Normlize compound keys to base key
            return this.type instanceof Array ? (this.type[x].label || this.type[x]) : v;
        };
        const v = gv(v1);
        return v !== undefined ? v : gv(v2);
    }

    _disabled(enableReset, minValue, maxValue, zoomStart, zoomEnd, type, disabled) {
        if (disabled) {
            return true;
        } else if (enableReset) {
            return false;
        }
        const v1 = this._typeVal(minValue);
        const v2 = this._typeVal(maxValue);
        const z1 = this._typeVal(zoomStart);
        const z2 = this._typeVal(zoomEnd);
        return (z1 === v1 && z2 === v2) || (isNaN(z1) && isNaN(z2));
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

    _computeFormatToken(minValue, maxValue) {
        if (!(minValue instanceof Date && maxValue instanceof Date)) {
            return false;
        }
        if (minValue.getFullYear() !== maxValue.getFullYear()) {
            return PTCS.ChartZoomRange.formatToken.year;
        }
        if (minValue.getMonth() !== maxValue.getMonth()) {
            return PTCS.ChartZoomRange.formatToken.month;
        }
        if (minValue.getDate() !== maxValue.getDate()) {
            return PTCS.ChartZoomRange.formatToken.day;
        }
        if (minValue.getHours() !== maxValue.getHours()) {
            return PTCS.ChartZoomRange.formatToken.hour;
        }
        if (minValue.getMinutes() !== maxValue.getMinutes()) {
            return PTCS.ChartZoomRange.formatToken.minute;
        }
        return PTCS.ChartZoomRange.formatToken.second;
    }

    _typeVal(value) {
        return typeValue(value, this.type);
    }

    // Reset range
    reset() {
        if (this.disabled) {
            return;
        }
        this.zoomStart = undefined;
        this.zoomEnd = undefined;
        this.dispatchEvent(new CustomEvent('zoom-reset', {bubbles: true, composed: true, detail: {}}));
    }

    _startChanged(ev) {
        const value = ev.detail.value;
        if (value === this.zoomStart) {
            return; // No change
        }
        const tv = this._typeVal(value);
        if (isNaN(tv)) {
            this.zoomStart = undefined; // Invalid. Reset
        } else {
            this.zoomStart = value;
            if (this._typeVal(this.zoomEnd) < tv) {
                this.zoomEnd = PTCS.clone(value);
            }
        }
    }

    _endChanged(ev) {
        const value = ev.detail.value;
        if (value === this.zoomEnd) {
            return; // No change
        }
        const tv = this._typeVal(value);
        if (isNaN(tv)) {
            this.zoomEnd = undefined; // Invalid. Reset
        } else {
            this.zoomEnd = value;
            if (this._typeVal(this.zoomStart) > tv) {
                this.zoomStart = PTCS.clone(value);
            }
        }
    }
};

PTCS.ChartZoomRange.formatToken = {
    year:   'YYYY MMM DD',
    month:  'MMM DD',
    day:    'MMM DD kk:mm',
    hour:   'kk:mm',
    minute: 'kk:mm.ss',
    second: ':ss'
};

customElements.define(PTCS.ChartZoomRange.is, PTCS.ChartZoomRange);
