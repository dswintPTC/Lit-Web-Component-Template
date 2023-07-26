import {PolymerElement, html} from '@polymer/polymer/polymer-element.js';
import {PTCS} from 'ptcs-library/library.js';
import {typeValue, typeIsFullRange} from 'ptcs-library/library-chart.js';
import 'ptcs-label/ptcs-label.js';
import 'ptcs-slider/ptcs-slider.js';
import '../axes/ptcs-chart-axis.js';
import 'ptcs-behavior-styleable/ptcs-behavior-styleable.js';
import 'ptcs-behavior-focus/ptcs-behavior-focus.js';
import {select} from 'd3-selection';


PTCS.ChartZoomSlider = class extends PTCS.BehaviorFocus(PTCS.BehaviorStyleable(PTCS.ThemableMixin(PolymerElement))) {
    static get template() {
        return html`
        <style>
        :host {
            display: flex;
            justify-content: flex-start; /*space-between;*/
            align-items: center;
            flex-direction: row;
            overflow: hidden;
            box-sizing: border-box;
        }

        :host([vertical]) {
            flex-direction: column;
        }

        [part=slider-container] {
            flex: 1 1 auto;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-direction: column;
            /*overflow: hidden;*/
            box-sizing: border-box;
        }

        :host([vertical]) [part=slider-container] {
            flex-direction: row-reverse;
            height: 100%;
        }

        [part=zoom-slider] {
            display: flex;
            position: relative;
            width: 100%;
        }

        :host([vertical]) [part=zoom-slider] {
            height: 100%;
        }

        [part=zoom-axis] {
            width: calc(100% - 2 * 9px);
        }

        [part=ticks] {
            position: absolute;
        }

        :host(:not([vertical])) [part=ticks] {
            left: 0px;
            right: 0px;
        }

        :host([vertical]) [part=ticks] {
            top: 0px;
            bottom: 0px;
        }

        [part=tick-line] {
            position: absolute;
        }

        :host(:not([vertical])) [part=tick-line] {
            top: 0;
            bottom: 0;
            width: 1px;
        }

        :host([vertical]) [part=tick-line] {
            left: 0;
            right: 0;
            height: 1px;
        }

        :host(:not([vertical])) #slider {
            /*width: calc(100% - 2 * var(--zoom-slider-delta, 0px));
            margin-left: var(--zoom-slider-delta, 0px);*/
            width: 100%;
            heigth: 100%;
        }

        :host([vertical]) #slider {
            /*height: calc(100% - 2 * var(--zoom-slider-delta, 0px));
            margin-top: var(--zoom-slider-delta, 0px);*/
            heigth: 100%;
            width: 100%;
        }
        ptcs-button {
            flex: 0 0 auto;
        }
        ptcs-button[hidden] {
            display: none !important;
        }
        </style>

        <div part="slider-container" id="slider-container">
        <div part="zoom-slider">
            <div part="ticks" id="ticks" hidden\$="[[!showAxis]]"></div>
            <ptcs-slider part="slider" id="slider"
                tabindex\$="[[_delegatedFocus]]"
                disabled="[[disabled]]"
                precision="[[_precision(type)]]"
                vertical="[[vertical]]"
                label="[[label]]" min-label="[[minLabel]]" max-label="[[maxLabel]]"
                min-value="[[_typeVal(minValue, type)]]" max-value="[[_typeVal(maxValue, type)]]"
                value="[[_typeVal2(zoomStart, minValue, type)]]" value2="[[_typeVal2(zoomEnd, maxValue, type)]]" range
                step="[[_stepSize(minValue, maxValue, type)]]"
                on-value-changed="_thumb1Changed"
                on-value2-changed="_thumb2Changed"
                reverse-minmax="[[_reverseAxis(reverseAxis, vertical)]]"
                thumb-icon="#circle" thumb2-icon="#circle" overlap-thumbs></ptcs-slider>
        </div>
        <ptcs-chart-axis part="zoom-axis" id="axis" hidden\$="[[!showAxis]]"
            type="[[type]]"
            min-value="[[minValue]]"
            max-value="[[maxValue]]"
            size="[[_size]]"
            reverse="[[reverseAxis]]"
            scale="{{_scale}}"
            ticks="{{_ticks}}"
            side="[[side]]" zoom></ptcs-chart-axis>
        </div>
        <ptcs-button label="[[resetLabel]]" part="reset" variant="transparent" id="reset" icon="cds:icon_refresh"
                     tabindex\$="[[_delegatedFocus]]"
                     hidden\$="[[vertical]]"
                     disabled="[[_disabled(type, minValue, maxValue, zoomStart, zoomEnd, enableReset, disabled)]]"
                     on-click="reset"></ptcs-button>`;
    }

    static get is() {
        return 'ptcs-chart-zoom-slider';
    }

    static get properties() {
        return {
            // bottom || top || left || right
            side: {
                type: String
            },

            vertical: {
                type:               Boolean,
                reflectToAttribute: true,
                computed:           '_computeVertical(side)',
                observer:           '_verticalChanged'
            },

            type: {
                type:     Object, // "number" || "date" || Array (of labels)
                value:    'number',
                observer: '_typeChanged'
            },

            // Length in pixels of control. Used by slider axis
            _size: {
                type: Number
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

            // Reverse the axis direction
            reverseAxis: {
                type:               Boolean,
                reflectToAttribute: true
            },

            // Slider label
            label: {
                type: String
            },

            // Slider Min label
            minLabel: {
                type: String
            },

            // Slider Max label
            maxLabel: {
                type: String
            },

            // TODO: Remove reset button
            resetLabel: {
                type: String
            },

            // Show the slider axis?
            showAxis: {
                type: Boolean
            },

            // Length of axis (or use full length of element)
            axisLength: {
                type: String
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

            // Axis scale
            _scale: {
                type: Function
            },

            disabled: {
                type: Boolean
            },

            // Axis ticks
            _ticks: {
                type: Array
            },

            _delegatedFocus: String,

            _zoomAxis: Element
        };
    }

    static get observers() {
        return [
            '_ticksChanged(_ticks, vertical)',
            '_axisLengthChanged(axisLength, vertical, _size)'
        ];
    }

    ready() {
        super.ready();
        this._zoomAxis = this.$.slider; // Previously: this.shadowRoot.querySelector('[part=zoom-axis]');
        if (this.showAxis === undefined) {
            this.showAxis = false;
        }
    }

    _precision(type) {
        return type === 'number' ? 6 : undefined;
    }

    _stepSize(minValue, maxValue, type) {
        const v1 = typeValue(minValue, type);
        const v2 = typeValue(maxValue, type);

        if (isNaN(v1) || isNaN(v2)) {
            return false;
        }

        return Math.abs(v2 - v1) / 50;
    }

    _verticalChanged(vertical) {
        if (this._zoomAxis) {
            const rect = this._zoomAxis.getBoundingClientRect();
            this._size = vertical ? rect.height : rect.width;
        }
    }

    _computeVertical(side) {
        return side === 'left' || side === 'right';
    }

    _reverseAxis(reverseAxis, vertical) {
        return vertical ? !reverseAxis : reverseAxis;
    }

    resizeEv() {
        this._verticalChanged(this.vertical);
        if (this.axisLength >= 0) {
            this._testResetButton();
        }
    }

    _typeChanged(type, old) {
        if (old !== undefined) {
            // Let the system stabilize, then reset the zoom
            setTimeout(() => this.reset(), 50);
        }
    }

    _axisLengthChanged(axisLength, vertical, _size) {
        const el = this.$['slider-container'];
        const style = el.style;
        const al = PTCS.cssDecodeSize(axisLength, el, vertical);
        if (al >= 0) {
            if (vertical) {
                style.width = '';
                style.height = `${al}px`;
            } else {
                style.width = `${al}px`;
                style.height = '';
            }
            style.flex = '0 0 auto';
        } else {
            style.width = '';
            style.height = '';
            style.flex = '';
        }

        this._testResetButton();
    }

    _testResetButton() {
        // show / hide reset button
        const button = this.$.reset;
        if (this.hideReset || !(this.axisLength > 0)) {
            button.style.display = 'none';
            this.noReset = true;
        } else if (!this.__checkResetButton) {
            this.__checkResetButton = true;
            requestAnimationFrame(() => {
                this.__checkResetButton = false;
                button.style.display = '';
                const b0 = this.getBoundingClientRect();
                const b1 = button.getBoundingClientRect();
                const noReset = b0.right < b1.right;
                if (noReset) {
                    button.style.display = 'none';
                }
                this.noReset = noReset;
            });
        }
    }

    _disabled(type, minValue, maxValue, zoomStart, zoomEnd, enableReset, disabled) {
        if (disabled) {
            return true;
        } else if (enableReset) {
            return false;
        }
        return typeIsFullRange(type, minValue, maxValue, zoomStart, zoomEnd);
    }

    _isType(value, type) {
        return !isNaN(typeValue(value, type));
    }

    _typeVal(value, type) {
        return typeValue(value, type);
    }

    _typeVal2(v1, v2, type) {
        const x = typeValue(v1, type);
        return isNaN(x) ? typeValue(v2, type) : x;
    }

    _number2value(value) {
        if (this.type === 'date') {
            return new Date(+value);
        }
        if (this.type instanceof Array) {
            const item = (0 <= value && value < this.type.length ? this.type[+value] : this.minValue);
            return item.label || item;
        }
        return +value;
    }

    reset() {
        if (this.disabled) {
            return;
        }
        this.zoomStart = undefined;
        this.zoomEnd = undefined;
        this.dispatchEvent(new CustomEvent('zoom-reset', {bubbles: true, composed: true, detail: {}}));
    }

    _thumb1Changed(ev) {
        const value = this._number2value(ev.detail.value);
        if (this._isType(value, this.type) && value !== this.zoomStart) {
            this.zoomStart = value;
        }
    }

    _thumb2Changed(ev) {
        const value = this._number2value(ev.detail.value);
        if (this._isType(value, this.type) && value !== this.zoomEnd) {
            this.zoomEnd = value;
        }
    }

    _ticksChanged(_ticks, vertical) {
        if (!this._scale) {
            return; // Not ready
        }
        const setPos = vertical
            ? d => `translate(0, ${d.offs}px)`
            : d => `translate(${d.offs}px, 0)`;

        const ticksEl = this.$.ticks;

        if (vertical) {
            ticksEl.style.width = `${this.$.slider.clientWidth}px`;
            ticksEl.style.height = '';
        } else {
            ticksEl.style.width = '';
            ticksEl.style.height = `${this.$.slider.clientHeight}px`;
        }

        const join = select(ticksEl)
            .selectAll('[part=tick-line]')
            .data(_ticks || []);

        // EXIT old elements not present in new data
        join.exit().remove();

        // UPDATE old elements present in new data
        join.style('transform', setPos);

        // ENTER new elements present in new data
        join.enter()
            .append('div')
            .attr('part', 'tick-line')
            .style('transform', setPos);

        /* This causes problems in K. Revisit later
        if (this.type instanceof Array && this._scale.bandwidth) {
            this.style.setProperty('--zoom-slider-delta', `${this._scale.bandwidth() / 2 - 9}px`);
        } else {
            this.style.setProperty('--zoom-slider-delta', '');
        }
        */
    }
};

customElements.define(PTCS.ChartZoomSlider.is, PTCS.ChartZoomSlider);
