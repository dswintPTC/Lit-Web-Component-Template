import {PolymerElement, html} from '@polymer/polymer/polymer-element.js';
import '@polymer/polymer/lib/elements/dom-if.js';
import {PTCS} from 'ptcs-library/library.js';
import {typeIsFullRange} from 'ptcs-library/library-chart.js';
import './ptcs-chart-zoom-interval.js';
import './ptcs-chart-zoom-range.js';
import './ptcs-chart-zoom-slider.js';
import 'ptcs-behavior-styleable/ptcs-behavior-styleable.js';
import 'ptcs-behavior-focus/ptcs-behavior-focus.js';
import 'ptcs-behavior-tabindex/ptcs-behavior-tabindex.js';

PTCS.ChartZoom = class extends PTCS.BehaviorTabindex(PTCS.BehaviorFocus(PTCS.BehaviorStyleable(PTCS.ThemableMixin(PolymerElement)))) {
    static get template() {
        return html`
        <style>
        :host {
            display: block;
        }

        :host([side=left]),
        :host([side=right]) {
            height: 100%;
        }
        </style>
        <template is="dom-if" if="[[_showReset]]">
            <div part="reset-container">
                <ptcs-button label="[[resetLabel]]" part="reset" variant="transparent" icon="cds:icon_refresh"
                             tabindex\$="[[_delegatedFocus]]"
                             disabled="[[_disabled(type, minValue, maxValue, zoomStart, zoomEnd, enableReset, disabled)]]"
                             on-click="_resetButton"></ptcs-button>
            </div>
        </template>

        <template is="dom-if" if="[[_showInterval]]">
            <ptcs-chart-zoom-interval part="interval-picker"
                tabindex\$="[[_delegatedFocus]]"
                disabled="[[disabled]]"
                label="[[intervalLabel]]"
                control="[[intervalControl]]"
                origin="[[intervalOrigin]]"
                anchor="[[intervalAnchor]]"
                interval="[[interval]]"
                type="[[type]]"
                min-value="[[minValue]]"
                max-value="[[maxValue]]"
                zoom-start="{{zoomStart}}"
                zoom-end="{{zoomEnd}}"
                hide-reset="[[_or(hideReset, _showRange, slider)]]"
                no-reset="{{_noResetInterval}}"
                enable-reset="[[enableReset]]"
                reset-label="[[resetLabel]]"
                start-label="[[intervalFromLabel]]"
                end-label="[[intervalToLabel]]"
                show-anchor="[[showIntervalAnchor]]"></ptcs-chart-zoom-interval>
        </template>
        <template is="dom-if" if="[[_showRange]]">
            <ptcs-chart-zoom-range part="range-picker"
                tabindex\$="[[_delegatedFocus]]"
                disabled="[[disabled]]"
                type="[[type]]"
                min-value="[[minValue]]"
                max-value="[[maxValue]]"
                zoom-start="{{zoomStart}}"
                zoom-end="{{zoomEnd}}"
                hide-reset="[[_or(hideReset, _showInterval, slider)]]"
                no-reset="{{_noResetRange}}"
                enable-reset="[[enableReset]]"
                reset-label="[[resetLabel]]"
                start-label="[[rangeStartLabel]]"
                end-label="[[rangeEndLabel]]"
                hint-text="[[dateRangeHintText]]"></ptcs-chart-zoom-range>
        </template>
        <template is="dom-if" if="[[slider]]">
            <ptcs-chart-zoom-slider part="slider"
                tabindex\$="[[_delegatedFocus]]"
                disabled="[[disabled]]"
                side="[[side]]"
                type="[[type]]"
                min-value="[[minValue]]"
                max-value="[[maxValue]]"
                zoom-start="{{zoomStart}}"
                zoom-end="{{zoomEnd}}"
                label="[[sliderLabel]]"
                min-label="[[sliderMinLabel]]"
                max-label="[[sliderMaxLabel]]"
                hide-reset="[[_or(hideReset, _showInterval, _showRange)]]"
                no-reset="{{_noResetSlider}}"
                enable-reset="[[enableReset]]"
                reset-label="[[resetLabel]]"
                show-axis="[[showSliderAxis]]"
                axis-length="[[axisLength]]"
                reverse-axis="[[reverseSlider]]"></ptcs-chart-zoom-slider>
        </template>`;
    }

    static get is() {
        return 'ptcs-chart-zoom';
    }

    static get properties() {
        return {
            // bottom || top || left || right
            side: {
                type:               String,
                reflectToAttribute: true
            },

            // Make zoom control active, even if no controls are visible.
            // Effect: at least the reset button will be visible
            active: {
                type: Boolean
            },

            // Reset button should be enabled
            enableReset: {
                type: Boolean
            },

            // Specify interval
            // interval-control: 'dropdown' || 'radio'
            // "date":   [{label, duration: time-duration}, ...]
            // "number": [{label, duration: count}, ...]
            // labels: [{label, duration: count}, ...]
            //----
            // interval-control: 'textfield'
            // "date":   time-unit
            // "number": multiplier (default: 1)
            // labels:   mulitplier (default: 1)
            //----
            // time-duration = `${number}${time-unit}`
            // time-unit= 'Y' || 'M' || 'D' || 'W' || 'd' || 'h' || 'm' || 's' || 'ms'
            interval: {
                type: Object
            },

            // Show the range picker
            rangePicker: {
                type: Boolean
            },

            // Show the slider
            slider: {
                type: Boolean
            },

            showSliderAxis: {
                type: Boolean
            },

            // Data type: 'number' || 'date' || Array of labels
            type: {
                type: Object
            },

            // Minimum zoom value
            minValue: {
                type: Object
            },

            // Maximum zoom value
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

            // Label for interval picker
            intervalLabel: {
                type: String
            },

            // Label for zoom slider
            sliderLabel: {
                type: String
            },

            // Max label for zoom slider
            sliderMaxLabel: {
                type: String
            },

            // Min label for zoom slider
            sliderMinLabel: {
                type: String
            },

            // TODO: Remove reset button
            // Label for reset button
            resetLabel: {
                type: String
            },

            // Label for range start drop-down
            rangeStartLabel: {
                type: String
            },

            // Label for range end drop-down
            rangeEndLabel: {
                type: String
            },

            // Label for interval from label
            intervalFromLabel: {
                type: String
            },

            // Label for interval to label
            intervalToLabel: {
                type: String
            },

            // 'radio' || 'dropdown' || 'textfield'
            intervalControl: {
                type: Object
            },

            // 'start' || 'end'
            intervalOrigin: {
                type: String
            },

            intervalAnchor: {
                type: Object
            },

            // Show start interval control
            showIntervalAnchor: {
                type: Boolean
            },

            // Reverse the direction of the slider
            reverseSlider: {
                type: Boolean
            },

            disabled: {
                type: Boolean
            },

            _showInterval: {
                type:     Boolean,
                computed: '_computeShowInterval(side, interval, type, intervalOrigin, intervalControl)'
            },

            _showRange: {
                type:     Boolean,
                computed: '_computeShowRange(side, rangePicker)'
            },

            hideReset: {
                type: Boolean
            },

            // Show separate reset button?
            _showReset: {
                type:     Boolean,
                computed: '_computeShowReset(hideReset, side, active, slider, _showInterval, _showRange,' +
                    '_noResetInterval, _noResetRange, _noResetSlider)'
            },

            // Use narrow view
            narrow: {
                type: Boolean
            },

            // Size of axis
            axisLength: {
                type: String
            },

            _noResetInterval: {
                type: Boolean
            },

            _noResetRange: {
                type: Boolean
            },

            _noResetSlider: {
                type: Boolean
            },

            _delegatedFocus: String,

            _resizeObserver: ResizeObserver
        };
    }

    ready() {
        super.ready();

        this._resizeObserver = new ResizeObserver(entries => {
            requestAnimationFrame(() => {
                if (this.id === 'zoomX') {
                    const xZoom = this.parentElement.xZoom;
                    if ((xZoom === true || Array.isArray(xZoom)) &&
                        ((Array.isArray(this.interval) || this.slider || this.rangePicker ||
                            this.parentElement.querySelector('[part=core-chart]').zoomSelect))) {
                        this.noTabindex = false;
                    } else {
                        this.noTabindex = true;
                    }
                }
                if (this.id === 'zoomY') {
                    const yZoom = this.parentElement.yZoom;
                    if ((yZoom === true || Array.isArray(yZoom)) &&
                        ((Array.isArray(this.interval) || this.slider || this.rangePicker ||
                            this.parentElement.querySelector('[part=core-chart]').zoomSelect))) {
                        this.noTabindex = false;
                    } else {
                        this.noTabindex = true;
                    }
                }
                for (let el = this.shadowRoot.firstChild; el; el = el.nextSibling) {
                    if (typeof el.resizeEv === 'function') {
                        el.resizeEv();
                    }
                }
            });
        });
    }

    connectedCallback() {
        super.connectedCallback();
        this._resizeObserver.observe(this);
    }

    disconnectedCallback() {
        this._resizeObserver.unobserve(this);
        super.disconnectedCallback();
    }

    _or(...args) {
        return args.find(v => !!v) || false;
    }

    _computeShowReset(hideReset, side, active, slider, _showInterval, _showRange, _noResetInterval, _noResetRange, _noResetSlider) {
        if (hideReset || side === 'left' || side === 'right') {
            return false;
        }
        const num = (slider ? 1 : 0) + (_showInterval ? 1 : 0) + (_showRange ? 1 : 0);
        if (num > 1) {
            return true;
        }
        if (num === 0) {
            return active;
        }
        // A single zoom-control is open
        if (slider) {
            return _noResetSlider;
        }
        if (_showInterval) {
            return _noResetInterval;
        }
        if (_showRange) {
            return _noResetRange;
        }
        return false; // Unreachable
    }

    _computeShowInterval(side, interval, type, intervalOrigin, intervalControl) {
        if (side === 'left' || side === 'right') {
            return false;
        }
        if (intervalOrigin !== 'start' && intervalOrigin !== 'end') {
            return false;
        }
        if (intervalControl === 'radio' || intervalControl === 'dropdown') {
            return interval instanceof Array;
        }
        if (intervalControl === 'textfield') {
            if (type === 'date') {
                return typeof interval === 'string' && interval !== '';
            }
            if (type !== 'number' && !(type instanceof Array)) {
                return false;
            }
            return interval !== '' && !isNaN(+interval);
        }
        // Unknown interval type
        return false;
    }

    _computeShowRange(side, rangePicker) {
        return side !== 'left' && side !== 'right' && rangePicker;
    }

    _disabled(type, minValue, maxValue, zoomStart, zoomEnd, enableReset, disabled) {
        if (disabled) {
            return true;
        } else if (enableReset) {
            return false;
        }
        return typeIsFullRange(type, minValue, maxValue, zoomStart, zoomEnd);
    }

    _resetButton() {
        if (this.disabled) {
            return;
        }
        this._resetToDefaultValues();
        this.dispatchEvent(new CustomEvent('zoom-reset', {bubbles: true, composed: true, detail: {}}));
    }

    _resetToDefaultValues() {
        this.zoomStart = undefined;
        this.zoomEnd = undefined;
        // Force change callback
        if (this.intervalAnchor === undefined) {
            this.intervalAnchor = null;
        }
        this.intervalAnchor = undefined;
    }
};

customElements.define(PTCS.ChartZoom.is, PTCS.ChartZoom);
