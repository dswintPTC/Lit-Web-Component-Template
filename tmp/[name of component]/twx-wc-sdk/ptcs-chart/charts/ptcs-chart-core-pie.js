import {PolymerElement, html} from '@polymer/polymer/polymer-element.js';
import {PTCS} from 'ptcs-library/library.js';
import {SelectionMgr} from '../selection/chart-selection.js';
import '../axes/library-axis-ticks.js';
import 'ptcs-behavior-styleable/ptcs-behavior-styleable.js';
import 'ptcs-behavior-tooltip/ptcs-behavior-tooltip.js';
import 'ptcs-behavior-focus/ptcs-behavior-focus.js';
import 'ptcs-style-unit/ptcs-part-observer.js';
import {intersect, getChartTooltip} from 'ptcs-library/library-chart.js';
import {enableSvgGradients, disableSvgGradients} from 'ptcs-library/svg-gradients.js';

import 'ptcs-icon/ptcs-icon.js';
import 'ptcs-label/ptcs-label.js';

import {select} from 'd3-selection';
import {pie, arc} from 'd3-shape';
import {scaleSqrt} from 'd3-scale';

/* Don't need a warning to make sure I have not confused "=>" with ">=" or "<=" */
/* eslint-disable no-confusing-arrow */

const degrees2radians = v => v * (Math.PI / 180);
const DONUT_MIN_INNER_VALUE = 0.5;
const NUM_OF_PIX_OUTER_VALUE = 35;
const HIGHLIGHT_TRANSLATE_MOVEMENT = 0.05;

const TOOLTIP_LINE_LENGTH = 20;

function compareSelectionObjects(sel1, sel2) {
    return sel1 - sel2;
}

const __dataFields = d => d[3] ? d[3] : {};

// Create (browser) global id
let __gid = 0;
function gid() {
    const a = performance.now().toString().split('.');
    return `${__gid++}-${a[a.length - 1]}`;
}

PTCS.ChartCorePie = class extends PTCS.BehaviorTooltip(PTCS.BehaviorFocus(PTCS.BehaviorStyleable(PTCS.ThemableMixin(PolymerElement)))) {
    static get template() {
        return html`
        <style>
        :host {
            display: block;
            width: 100%;
            height: 100%;
            --ptcs-tooltip-start-delay: 100;
            box-sizing: border-box;
        }

        svg {
            position: relative;
            width: 100%;
            height: 100%;
        }

        /* Add an extra chart level, so we have exclusive access to the influencing class attribute */
        #chart {
            position: relative;
            width: 100%;
            height: 100%;
        }

        #values {
            position: absolute;
            left: 0;
            top: 0;
            right: 0;
            bottom: 0;
            pointer-events: none;
        }

        :host(:focus) {
            outline: none;
        }

        [part=value] {
            position: absolute;
        }

        #gfocus {
            position: relative;
            width: 100%;
            height: 100%;
            pointer-events: none;
        }

        :host(:not(:focus)) #gfocus {
            display: none;
        }

        :host([hide-focus]) #gfocus {
            display: none;
        }

        [part=focus-slice]:not([focus]) {
            display: none;
        }
        </style>

        <div id="chart" part="chart" on-dragstart="_ondragstart"
            on-mouseout="_closeTooltip" on-click="_clickOnChart">
            <ptcs-part-observer>
            <svg>
                <defs id="defs"></defs>
                <g id="pie" part="pie"></g>
                <g id="lines"></g>
                <g id="gfocus">
                    <use id="focus" part="focus-slice"></use>
                </g>
            </svg>
            </ptcs-part-observer>
            <div id="values"></div>
        </div>`;
    }

    static get is() {
        return 'ptcs-chart-core-pie';
    }

    static get properties() {
        return {
            // Recieved data
            data: Array,

            // Pie data
            _data: Array,

            valueFormatSpecifier: String,

            // Legend data, for tooltip
            legendSelect: Array,

            // Legend filtering
            filterLegend: {
                type:     Array,
                observer: '_filterLegendChanged'
            },

            _series: Array, // Currently displayed series

            // Donut radius: 0 .. 1 [none .. all]
            donut: {
                type: Number
            },

            disabled: {
                type:               Boolean,
                reflectToAttribute: true
            },

            // Polar chart?
            polar: {
                type: Boolean
            },

            // Padding angle in degres
            padAngle: Number,

            // Start angle in degres
            startAngle: Number,

            // End angle in degres
            endAngle: Number,

            // Corner radius: 0 .. 1 [none .. all]
            cornerRadius: {
                type:     Number,
                observer: '_refreshView'
            },

            // highlight the selected selection
            highlightSelection: {
                type:     Boolean,
                observer: '_refreshView'
            },

            showValues: {
                type:     Boolean,
                observer: '_refreshView'
            },

            // value Position: marker || in || out || out with line
            valuePos: {
                type:     String,
                observer: '_refreshView'
            },

            percentLabel: {
                type:     Boolean,
                observer: '_refreshView'
            },

            insideLabelShowHide: {
                type:     Boolean,
                observer: '_refreshView'
            },

            // Single Inside Value Label Type type: caption || body || label || title || large-title || sub-header || header || large-header
            singleInsideValueLabelType: {
                type:     String,
                observer: '_refreshView'
            },

            tooltipTemplate: String,

            // 'none' || 'single' || 'multiple'
            selectionMode: {
                type:     String,
                observer: '_selectionModeChanged'
            },

            chartStateDataError: {
                type:     Boolean,
                readOnly: true,
                notify:   true
            },

            chartStateDataEmpty: {
                type:     Boolean,
                readOnly: true,
                notify:   true
            },

            // Handles its own focus styling - no need for FocusBehavior to track its position
            _ownFocusStyling: {
                type:     Boolean,
                value:    true,
                readOnly: true
            },

            _selectionMgr: {
                type:  SelectionMgr,
                value: () => new SelectionMgr(compareSelectionObjects)
            },

            _resizeObserver: ResizeObserver
        };
    }

    static get observers() {
        return [
            '_modelChanged(padAngle, startAngle, endAngle, donut, polar, valueFormatSpecifier)',
            '_dataChanged(data.*)'
        ];
    }

    ready() {
        super.ready();
        this._idSuffix = gid();
        this._resizeObserver = new ResizeObserver(this._refreshView.bind(this));
        this.addEventListener('keydown', ev => this._keyDown(ev));
        this.$.pie.addEventListener('mousemove', ev => this._mouseTooltip(ev));
        this._selectionMgr.observe(this);
    }

    _ondragstart() {
        return false;
    }

    connectedCallback() {
        super.connectedCallback();
        this._resizeObserver.observe(this);
        enableSvgGradients(this, this.$.defs);
    }

    disconnectedCallback() {
        this._resizeObserver.unobserve(this);
        disableSvgGradients(this);
        super.disconnectedCallback();
    }

    _dataChanged() {
        this._selectionMgr.selection = null;
        this._modelChanged();
    }

    _percentValueDisp(v, t) {
        return v && t ? `${Number.parseFloat(100 * Math.abs(v) / t).toFixed(1)}%` : '0%';
    }

    _fetchValueByIndex(index) {
        return this.percentLabel
            ? this._percentValueDisp(this.data[index][1][0], this._TotValues)
            : this._valueFormater(this.data[index][1][0]);
    }

    _findValueEl(index) {
        return this.$.values.querySelector(`ptcs-label[legend-select=L${index}]`);
    }

    _modelChanged() {
        if (this.__changeOn) {
            return;
        }
        this.__changeOn = true;
        requestAnimationFrame(() => {
            this.__changeOn = false;
            this._rebuildModel();
        });
    }

    _rebuildModel() {
        if (!(this.data instanceof Array)) {
            this._data = null;
            this._setChartStateDataError(true);
            return;
        }
        const padAngle = isNaN(this.padAngle) ? 0 : degrees2radians(this.padAngle);
        const startAngle = isNaN(this.startAngle) ? 0 : degrees2radians(this.startAngle);
        const endAngle = isNaN(this.endAngle) ? 2 * Math.PI : degrees2radians(this.endAngle);
        const notDonut = !Math.max(0, Math.min(1, this.donut));
        const value = notDonut && this.polar ? 1 : d => (d && d[1][0]) || 0;
        this._series = this.filterLegend || [...new Array(this.data.length)].map((d, i) => i);

        // check for data validity, 0 - all zero or mix, 1 - all positive, -1 - all negative
        let dataValidity = 0;
        let data = [];
        this.data.every((elm, index) => {
            const elmValue = elm[1] && elm[1][0];
            if (isNaN(elmValue)) {
                dataValidity = 0;
                return false;
            }
            const currentSign = Math.sign(elmValue);
            if (dataValidity && dataValidity === -currentSign) {
                dataValidity = 0;
                return false;
            }
            dataValidity = !dataValidity && currentSign ? currentSign : dataValidity;

            const seriesIndex = this._series.indexOf(index);
            if (seriesIndex !== -1) {
                if (elmValue) {
                    const _label = elm[0];
                    const _value = Math.abs(elm[1][0]);
                    const _depfield = elm[2];
                    const _tooltip = elm[3];
                    data.push([_label, [_value], _depfield, _tooltip]);
                } else {
                    this._series.splice(seriesIndex, 1);
                }
            }
            return true;
        });
        this._setChartStateDataEmpty(!data.length);
        this._setChartStateDataError(data.length && !dataValidity);
        data = !dataValidity ? [] : data;

        this._valueFormater = PTCS.formatNumber(this.valueFormatSpecifier);
        this._TotValues = data.reduce((prv, cur) => prv + (cur[1][0] || 0), 0);

        this._data = pie()
            .value(value)
            .padAngle(padAngle)
            .startAngle(startAngle)
            .endAngle(endAngle)
            .sort(null)(data);

        this._refreshView();
    }

    _refreshView() {
        if (this.__refreshOn) {
            return;
        }
        this.__refreshOn = true;
        requestAnimationFrame(() => {
            this.__refreshOn = false;
            this._mapModelToDOM();

            // Update focus
            if (this._focus) {
                this._focusOn(this.$.pie.querySelector(`[part=slice][legend-select=${this._focus.getAttribute('legend-select')}]`));
            }

            this._updateInsideLabel();

            // Close tooltip
            this._closeTooltip();
        });
    }

    _checkIfLabelsOverlap() {
        if (this._insidesingleValue !== null && this._insidesingleLabel !== null) {
            const bb = this._insidesingleValue.getBoundingClientRect();
            const bb1 = this._insidesingleLabel.getBoundingClientRect();
            if (!(bb.bottom < bb1.top) && this._showInsideSingleValue() &&
                (this._insidesingleValue.label !== '' && this._insidesingleLabel.label !== '')) {
                this._insidesingleValue.label = '';
                this._insidesingleLabel.label = '';
            }
        }
    }

    _showInsideSingleValue() {
        return (this.insideLabelShowHide || (this._data && this._data.length === 1)) && this.donut >= DONUT_MIN_INNER_VALUE;
    }

    _mapModelToDOM() {
        const width = this.clientWidth;
        const height = this.clientHeight;
        let radius = 0.99 * Math.min(width, height) / 2; // utilize 99% of cher area, leave space for selection-border and focus-border
        if (this.highlightSelection && this.selectionMode !== 'none') {
            radius = 0.95 * radius; // shrink the chart, in case of highlight selection
        }
        if (!this._showInsideSingleValue() && this.showValues && (this.valuePos === 'out' || this.valuePos === 'out with line')) {
            radius = 0.8 * radius; // shrink the chart, in case of outer values
        }
        const donut = radius * Math.max(0, Math.min(1, this.donut));
        const hideOutsideValue = (this.valuePos === 'out' || this.valuePos === 'out with line') && ((radius * 0.3125) < NUM_OF_PIX_OUTER_VALUE);

        const createRadiusFunc = () => {
            const scale = scaleSqrt()
                .range([0, radius])
                .domain([0, (this.data || []).reduce((a, d) => Math.max(a, d[1][0]), Number.NEGATIVE_INFINITY)]);
            return d => scale((d.data && d.data[1][0]) || 0);
        };

        const d3arc = arc()
            .innerRadius(isNaN(donut) ? 0 : donut)
            .outerRadius(!donut && this.polar ? createRadiusFunc() : radius)
            .cornerRadius(isNaN(this.cornerRadius) ? 0 : this.cornerRadius);

        const legendSelect = (d, i) => `L${this._series[i] + 1}`;
        const legend = (d, i) => `L${(this._series[i] % 24) + 1}`;

        const _mouseenter = (e, d, i) => {
            const serIndex = this._series[d.index];
            const elValue = this._findValueEl(serIndex + 1);
            if (elValue) {
                PTCS.setbattr(elValue, 'slice-hover', true);
            }
            this._updateInsideLabel(serIndex);
        };

        const _mouseleave = (e, d, i) => {
            const elValue = this._findValueEl(this._series[d.index] + 1);
            if (elValue) {
                PTCS.setbattr(elValue, 'slice-hover');
            }
            this._updateInsideLabel();
        };

        const _mousedown = (e, d, i) => {
            const elValue = this._findValueEl(this._series[d.index] + 1);
            if (!elValue) {
                return;
            }
            PTCS.setbattr(elValue, 'slice-pressed', true);
            this._mouseupFunc = () => {
                document.removeEventListener('mouseup', this._mouseupFunc);
                this._mouseupFunc = undefined;
                PTCS.setbattr(elValue, 'slice-pressed');
            };
            document.addEventListener('mouseup', this._mouseupFunc);
        };

        const _mouseup = (e, d, i) => {
            document.removeEventListener('mouseup', this._mouseupFunc);
            this._mouseupFunc = undefined;
            const elValue = this._findValueEl(this._series[d.index] + 1);
            if (!elValue) {
                return;
            }
            PTCS.setbattr(elValue, 'slice-pressed');
        };

        const depfield = d => d.data[2] && d.data[2][0] ? d.data[2][0] : d.data[1][0];

        // Pie center
        const cx = width / 2;
        const cy = height / 2;

        // Compute radius, dependent on polar mode
        const length = !donut && this.polar ? createRadiusFunc() : () => radius;
        const lineLength = (d, i) => -0.025 * length(d, i);

        const _selected = (d, i) => {
            return this._selectionMgr.isSelected(this._series[i]);
        };

        const id = (p, i) => `${p}${i}${this._idSuffix}`;
        const pid = (d, i) => id('p', i);
        const cid = (d, i) => id('c', i);
        const rid = (d, i) => id('#p', i);

        // Define pie chart slices
        {
            // Add slices
            const path = select(this.$.defs)
                .selectAll('path')
                .data(this._data || []);

            path.enter()
                .append('path')
                .attr('id', pid) // pid only depends on index
                .attr('d', d3arc);

            path.attr('d', d3arc);

            path.exit().remove();

            // Add matching clipPath's: <clipPath id="ID-n"><use xlink:href="ID-n"/></clipPath>
            // Note: clip-path is only dependent on slice index. It never needs to be updated.
            const clip = select(this.$.defs)
                .selectAll('clipPath')
                .data(this._data || []);

            clip.enter()
                .append('clipPath')
                .attr('id', cid)
                .append('use')
                .attr('xlink:href', rid);

            clip.exit().remove();
        }

        // Display chart slices
        {
            const _translateHightlightRadius = HIGHLIGHT_TRANSLATE_MOVEMENT * radius;
            // eslint-disable-next-line no-inner-declarations
            const highlightTranslate = (d, i) => {
                const angle = (d.startAngle + d.endAngle) / 2;
                const _x = Math.sin(angle) * _translateHightlightRadius;
                const _y = -Math.cos(angle) * _translateHightlightRadius;
                return `translate(${_x}px,${_y}px)`;
            };

            // eslint-disable-next-line no-inner-declarations
            const selected = (d, i) => {
                return _selected(d, i) ? '' : undefined;
            };

            // eslint-disable-next-line no-inner-declarations
            const transform = (d, i) => {
                return this.highlightSelection && _selected(d, i) ? highlightTranslate(d, i) : '';
            };

            const createSliceEl = (d, i) => {
                const sliceEl = document.createElementNS('http://www.w3.org/2000/svg', 'use');
                sliceEl.setAttribute('part', 'slice');
                return sliceEl;
            };

            const join = select(this.$.pie)
                .style('transform', `translate(${width / 2}px,${height / 2}px)`)
                .selectAll('use')
                .data(this._data || []);

            join.enter()
                .append(createSliceEl)
                .attr('xlink:href', rid)
                .attr('clip-path', (d, i) => `url(#${cid(d, i)})`)
                .attr('legend-select', legendSelect)
                .attr('legend', legend)
                .attr('selected', selected)
                .property('_depfield', depfield)
                .property('__highlightTranslate', highlightTranslate)
                .property('__radius', length)
                .style('transform', transform)
                .on('mouseup', _mouseup)
                .on('mousedown', _mousedown)
                .on('mouseenter', _mouseenter)
                .on('mouseleave', _mouseleave);

            join.attr('legend-select', legendSelect)
                .attr('legend', legend)
                .attr('selected', selected)
                .property('_depfield', depfield)
                .property('__highlightTranslate', highlightTranslate)
                .property('__radius', length)
                .style('transform', transform);

            join.exit().remove();
        }

        // Display values
        {
            const value = this.percentLabel
                ? (d, i) => this._percentValueDisp((this.data[this._series[i]][1][0]) || 0, this._TotValues)
                : (d, i) => (this._valueFormater(this.data[this._series[i]][1][0])) || 0;

            // eslint-disable-next-line no-inner-declarations
            function createLabelEl(d, i) {
                const el = document.createElement('ptcs-label');
                el.setAttribute('variant', 'label');
                el.setAttribute('part', 'value');
                el.horizontalAlignment = 'center';
                return el;
            }

            // eslint-disable-next-line no-inner-declarations
            const selected = (d, i) => {
                return _selected(d, i) ? '' : undefined;
            };

            let _valuePos = 0.85; // marker
            if (this.valuePos === 'out' || this.valuePos === 'out with line') {
                _valuePos = 1.11; // out || out with line
            } else if (this.valuePos === 'in' && this.donut >= DONUT_MIN_INNER_VALUE) {
                _valuePos = donut / radius * 0.85; // in
            }

            // eslint-disable-next-line no-inner-declarations
            const hightlightTransform = (_highlightTranslate) => {
                return function(d, i) {
                    const angle = (d.startAngle + d.endAngle) / 2;
                    const chartR = length(d, i);
                    let r = chartR * _valuePos;
                    const w = this.clientWidth;
                    const h = this.clientHeight;

                    const angleSin = Math.sin(angle);
                    const angleCos = Math.cos(angle);
                    const leftPos = angleSin * r - w / 2;
                    const rightPos = angleSin * r + w / 2;
                    const bottomPos = angleCos * r - h / 2;
                    const topPos = angleCos * r + h / 2;

                    if (_valuePos > 1) { // values are outside - check if they are overlapping with the chart
                        const c = (a, b) => Math.sqrt(Math.pow(a, 2) + Math.pow(b, 2)); // Pythagorean theorem

                        // If the distance from the pie center to the edge of the label is smaller than the pie radius then increase this distance
                        const increaseRadius = r2 => r2 < chartR ? chartR * (_valuePos + (chartR - r2) * _valuePos / chartR) : r;

                        if (angleSin > 0 && angleCos > 0) {
                            // (top - right chart area) Check if the bottom - left edge of the label overlaps with the chart
                            r = increaseRadius(c(leftPos, bottomPos));

                        } else if (angleSin > 0 && angleCos < 0) {
                            // (bottom - right chart area) Check if the top - left edge of the label overlaps with the chart
                            r = increaseRadius(c(leftPos, topPos));

                        } else if (angleSin < 0 && angleCos > 0) {
                            // (top - left chart area) Check if the bottom - right edge of the label overlaps with the chart
                            r = increaseRadius(c(rightPos, bottomPos));

                        } else if (angleSin < 0 && angleCos < 0) {
                            // (bottom - left chart area) Check if the top - right edge of the label overlaps with the chart
                            r = increaseRadius(c(rightPos, topPos));
                        }
                    }

                    const x = cx + angleSin * r * _highlightTranslate;
                    const y = cy - angleCos * r * _highlightTranslate;

                    return `translate(${x - w / 2}px,${y - h / 2}px)`;
                };
            };

            const _highlightSelection = this.highlightSelection;
            // eslint-disable-next-line no-inner-declarations
            function transform(d, i) {
                return _highlightSelection && _selected(d, i)
                    ? hightlightTransform(1 + HIGHLIGHT_TRANSLATE_MOVEMENT).call(this, d, i)
                    : hightlightTransform(1).call(this, d, i);
            }

            const disLabels = (this.valuePos === 'in' && donut > 0 && this.donut < DONUT_MIN_INNER_VALUE) || hideOutsideValue;
            const valueOnSliceAttr = this.valuePos === 'marker' || (this.valuePos === 'in' && donut === 0) ? true : null;
            const join = select(this.$.values)
                .selectAll('ptcs-label')
                .data((this.showValues && !this._showInsideSingleValue() && !disLabels && this._data) || []);

            join.enter()
                .append(createLabelEl)
                .attr('legend-select', legendSelect)
                .attr('selected', selected)
                .attr('on-slice', valueOnSliceAttr)
                .property('label', value)
                .property('_depfield', depfield)
                .property('__translate', hightlightTransform(1))
                .property('__highlightTranslate', hightlightTransform(1 + HIGHLIGHT_TRANSLATE_MOVEMENT))
                .style('transform', transform);

            join.attr('legend-select', legendSelect)
                .attr('selected', selected)
                .attr('on-slice', valueOnSliceAttr)
                .property('label', value)
                .property('_depfield', depfield)
                .property('__translate', hightlightTransform(1))
                .property('__highlightTranslate', hightlightTransform(1 + HIGHLIGHT_TRANSLATE_MOVEMENT))
                .style('transform', transform);

            join.exit().remove();

            if (this._showInsideSingleValue()) {
                this._insidesingleValue = createLabelEl();
                this._insidesingleLabel = createLabelEl();
                this._insidesingleValue.setAttribute('variant', this.singleInsideValueLabelType || 'label');
                this._insidesingleLabel.setAttribute('variant', this.singleInsideValueLabelType || 'label');
                this._insidesingleLabel.setAttribute('max-width', `${1.8 * this.donut * radius}px`);
                this.$.values.append(this._insidesingleValue);
                this.$.values.append(this._insidesingleLabel);
            } else {
                this._insidesingleValue = null;
                this._insidesingleLabel = null;
            }
        }

        // Display lines
        {
            // eslint-disable-next-line no-inner-declarations
            const hightlightTransform = (_highlightTranslate) => {
                return function(d, i) {
                    const angle = (d.startAngle + d.endAngle) / 2;
                    const r = length(d, i) * _highlightTranslate;
                    const x = Math.sin(angle) * r;
                    const y = -1 * Math.cos(angle) * r;
                    const w = this.clientWidth;
                    const h = this.clientHeight;
                    return `translate(${x - w / 2}px,${y - h / 2}px) rotate(${angle}rad)`;
                };
            };

            const _highlightSelection = this.highlightSelection;
            // eslint-disable-next-line no-inner-declarations
            function transform(d, i) {
                return _highlightSelection && _selected(d, i)
                    ? hightlightTransform(1 + HIGHLIGHT_TRANSLATE_MOVEMENT).call(this, d, i)
                    : hightlightTransform(1).call(this, d, i);
            }

            const join = select(this.$.lines)
                .style('transform', `translate(${width / 2}px,${height / 2}px)`)
                .selectAll('line')
                .data((this.showValues && !this._showInsideSingleValue() && this.valuePos === 'out with line' && !hideOutsideValue &&
                    this._data) || []);

            join.enter()
                .append('line')
                .attr('part', 'line')
                .attr('legend-select', legendSelect)
                .attr('x1', 0)
                .attr('x2', 0)
                .attr('y1', 0)
                .attr('y2', lineLength)
                .property('__translate', hightlightTransform(1))
                .property('__highlightTranslate', hightlightTransform(1 + HIGHLIGHT_TRANSLATE_MOVEMENT))
                .style('transform', transform);

            join.attr('legend-select', legendSelect)
                .attr('x1', 0)
                .attr('x2', 0)
                .attr('y1', 0)
                .attr('y2', lineLength)
                .property('__translate', hightlightTransform(1))
                .property('__highlightTranslate', hightlightTransform(1 + HIGHLIGHT_TRANSLATE_MOVEMENT))
                .style('transform', transform);

            join.exit().remove();
        }
    }

    _fetchSliceInfo(el) {
        if (!el) {
            return ['', ''];
        }

        const legend = el.getAttribute('legend-select');
        if (!legend || legend[0] !== 'L') {
            return ['', ''];
        }
        const xIndex = +legend.substring(1) - 1;
        if (isNaN(xIndex) || this.data[xIndex] === undefined) {
            return ['', ''];
        }
        const label = this.data[xIndex][0];
        const value = this._fetchValueByIndex(xIndex);
        return [value, label, xIndex];
    }

    _mouseTooltip(ev) {
        const el = ev.target;
        if (el !== this.__tooltipEl) {
            this._closeTooltip();
        }

        if (!(this.data instanceof Array)) {
            return;
        }
        const partName = el.getAttribute('part');
        if (partName !== 'slice') {
            return;
        }

        const [value, label, xIndex] = this._fetchSliceInfo(el);
        const v = this.data[xIndex];
        if (ev.clientX > 0 && ev.clientY > 0) {
            el.tooltipPos = 'in';
        }
        this.__tooltipEl = el;

        let tooltip;

        if (this.tooltipTemplate) {
            tooltip = getChartTooltip(this.tooltipTemplate, Object.assign({
                label, value
            }, __dataFields(v)));

        } else {
            tooltip = `${label}: ${value}`;
        }

        if (ev.clientX === undefined && ev.clientY === undefined) {
            const w = this.clientWidth;
            const h = this.clientHeight;
            const bb = this.getBoundingClientRect();
            const angle = (el.__data__.endAngle + el.__data__.startAngle) / 2;

            // Pie center
            const cx = w / 2 ;
            const cy = h / 2;

            const bb1 = this.$.pie.getBoundingClientRect();

            const offset = Math.min(bb1.top - bb.top, bb1.left - bb.left); // space between the border of the pie and the border of the core pie

            // x and y are the approximate points of the edge of the tooltip
            const x = cx + Math.sin(angle) * (el.__radius + offset + TOOLTIP_LINE_LENGTH);
            const y = cy - Math.cos(angle) * (el.__radius + offset + TOOLTIP_LINE_LENGTH);

            // Check if the Y dot at the top
            if ((y + bb.top) - bb1.top < bb1.bottom - (y + bb.top)) {
                // Check if the X dot at the left
                if ((x + bb.left) - bb1.left < bb1.right - (x + bb.left)) {
                    el.tooltipPos = 'ce-tl';
                } else { // The X dot is at the right
                    el.tooltipPos = 'ce-tr';
                }
            } else if ((x + bb.left) - bb1.left < bb1.right - (x + bb.left)) { // The Y dot is at the bottom, check if the X dot at the left
                el.tooltipPos = 'ce-bl';
            } else { // The X dot is at the right
                el.tooltipPos = 'ce-br';
            }

            const legend = el.getAttribute('legend-select');
            const valueLabel = this.$.values.querySelector(`ptcs-label[legend-select=${legend}]`);

            let intersectPoint;

            if ((this.showValues && (this.valuePos === 'out' || this.valuePos === 'out with line')) && valueLabel) {
                const labelBB = valueLabel.getBoundingClientRect();

                // Tooltip line should stop before the edge of the label.
                // Find out the intersection point between the value label and the tooltip line.
                const getIntersectPoint = (pos) => {
                    const bbl = bb.left;
                    const bbt = bb.top;

                    const ll = labelBB.left;
                    const lr = labelBB.right;
                    const lt = labelBB.top;
                    const lb = labelBB.bottom;

                    let intersect1, intersect2;

                    // Now find the intersection point.
                    // E.g. if tooltip position is "ce-tl" then the line from the pie center to the tooltip edge (cx, cy, x, y)
                    // can intersect the label in 2 possible points: on the left label edge or on the top label edge.
                    switch (pos) {
                        case 'ce-tl':
                            intersect1 = intersect(cx, cy, x, y, ll - bbl, lt - bbt, ll - bbl, lb - bbt);
                            intersect2 = intersect(cx, cy, x, y, ll - bbl, lt - bbt, lr - bbl, lt - bbt);
                            break;
                        case 'ce-tr':
                            intersect1 = intersect(cx, cy, x, y, lr - bbl, lt - bbt, lr - bbl, lb - bbt);
                            intersect2 = intersect(cx, cy, x, y, ll - bbl, lt - bbt, lr - bbl, lt - bbt);
                            break;
                        case 'ce-br':
                            intersect1 = intersect(cx, cy, x, y, lr - bbl, lt - bbt, lr - bbl, lb - bbt);
                            intersect2 = intersect(cx, cy, x, y, ll - bbl, lb - bbt, lr - bbl, lb - bbt);
                            break;
                        case 'ce-bl':
                            intersect1 = intersect(cx, cy, x, y, ll - bbl, lt - bbt, ll - bbl, lb - bbt);
                            intersect2 = intersect(cx, cy, x, y, ll - bbl, lb - bbt, lr - bbl, lb - bbt);
                            break;
                        default:
                    }

                    return intersect1 || intersect2;
                };

                intersectPoint = getIntersectPoint(el.tooltipPos);
            }

            if (!intersectPoint) {
                // In this case tooltip line should go till the edge of the pie
                intersectPoint = {x: cx + Math.sin(angle) * el.__radius, y: cy - Math.cos(angle) * el.__radius};
            }

            let x2 = intersectPoint.x + Math.sin(angle) * TOOLTIP_LINE_LENGTH;
            let y2 = intersectPoint.y - Math.cos(angle) * TOOLTIP_LINE_LENGTH;

            this._tooltipEnter(this.__tooltipEl, x2 + bb.left, y2 + bb.top, tooltip, {
                tooltipLine: {
                    length: TOOLTIP_LINE_LENGTH,
                    angle
                }
            });
        } else {
            this._tooltipEnter(this.__tooltipEl, ev.clientX, ev.clientY, tooltip);
        }
    }

    _closeTooltip() {
        if (this.__tooltipEl) {
            this._tooltipLeave(this.__tooltipEl);
            this.__tooltipEl = null;
        }
    }

    _updateInsideLabel(index) {
        if (!this._insidesingleValue) {
            return;
        }

        let _value = '';
        let _label = '';
        if (index !== undefined) {
            _value = this._fetchValueByIndex(index);
            _label = this.data[index][0];
        } else if (this.selectionMode === 'single' && this._selectionMgr.selection !== null) {
            index = this._selectionMgr.selection;
            _value = this._fetchValueByIndex(index);
            _label = this.data[index][0];
        } else if (this.selectionMode === 'multiple' && this._selectionMgr.selection) {
            const _accumValue = this._selectionMgr.selection.reduce(
                (prev, currentIndex) => prev + this.data[currentIndex][1][0], 0
            );
            _value = this.percentLabel
                ? this._percentValueDisp(_accumValue, this._TotValues)
                : this._valueFormater(_accumValue);
        } else if (this._series && this._series.length === 1) {
            _value = this._fetchValueByIndex(this._series[0]);
        }
        this._insidesingleValue.label = _value;
        this._insidesingleLabel.label = _label;
        PTCS.setbattr(this._insidesingleLabel, !!_label);
        if (!_value) {
            return;
        }

        const clientWidth = this.clientWidth;
        const clientHeight = this.clientHeight;
        const moveValue = _label ? 0.05 * Math.min(clientWidth, clientHeight) : 0;
        const _xValue = (clientWidth - this._insidesingleValue.clientWidth) / 2;
        const _yValue = (clientHeight - this._insidesingleValue.clientHeight) / 2 - moveValue;
        const _xLabel = (clientWidth - this._insidesingleLabel.clientWidth) / 2;
        const _yLabel = (clientHeight - this._insidesingleLabel.clientHeight) / 2 + moveValue;
        this._insidesingleValue.style.transform = `translate(${_xValue}px,${_yValue}px)`;
        this._insidesingleLabel.style.transform = `translate(${_xLabel}px,${_yLabel}px)`;

        this._checkIfLabelsOverlap();
    }

    // Set the focused element
    _focusOn(focus) {
        const el = this.$.focus;
        this._focus = focus;
        if (focus) {
            this.$.gfocus.style.transform = this.$.pie.style.transform;
            PTCS.setbattr(el, 'focus', true);
            el.setAttribute('legend-select', focus.getAttribute('legend-select'));
            el.setAttribute('href', focus.getAttribute('href'));
            el.setAttribute('clip-path', focus.getAttribute('clip-path'));
            el.style.transform = focus.style.transform;
        } else {
            PTCS.setbattr(el, 'focus');
        }
        this._updateInsideLabel();
    }

    _clickOnChart(ev) {
        if (this.disabled || ev.target.getAttribute('part') !== 'slice') {
            return;
        }

        const legend = ev.target.getAttribute('legend-select');
        const xIndex = +legend.substring(1) - 1;
        this._selectionMgr.select(xIndex);
        this._focusOn(ev.target);
        if (this._focus) {
            this._mouseTooltip(ev);
        }
        this.dispatchEvent(new CustomEvent('series-click', {bubbles: true, composed: true}));
    }

    _notifyFocus() {
        if (!this._focus) {
            this._focusOn(this.$.pie.querySelector('[part=slice]'));
        }
        if (this._focus) {
            this._mouseTooltip({target: this._focus});
        }
    }

    _notifyBlur() {
        this._closeTooltip();
    }

    _keyDown(ev) {
        if (this.disabled || !this.data) {
            return;
        }
        if (!this._focus) {
            this._focusOn(this.$.pie.querySelector('[part=slice]'));
            if (!this._focus) {
                return;
            }
        }
        let focus = null;

        const firstSlice = () => {
            return this.$.pie.querySelector('[part=slice]');
        };

        const lastSlice = () => {
            const slices = this.$.pie.querySelectorAll('[part=slice]');
            return slices ? slices[slices.length - 1] : null;
        };

        switch (ev.key) {
            case 'ArrowLeft':
                focus = this._focus.previousElementSibling;

                if (!focus || focus.getAttribute('part').indexOf('slice') === -1) {
                    focus = lastSlice();
                }

                break;
            case 'ArrowRight':
                focus =  this._focus.nextElementSibling;

                if (!focus || focus.getAttribute('part').indexOf('slice') === -1) {
                    focus = firstSlice();
                }

                break;
            case 'Home':
                focus = firstSlice();
                break;
            case 'End':
                focus = lastSlice();
                break;
            case 'Enter':
            case ' ':
                // no .click() function for svg elements
                this._focus.dispatchEvent(new Event('click', {
                    bubbles: true
                }));
                break;
            default:
                // Not handled - avoid calling ev.preventDefault()
                return;
        }

        // We consumed this keyboard event. Don't propagate
        ev.preventDefault();

        if (!focus || focus === this._focus) {
            return;
        }
        this._focusOn(focus);
        const legend = this._focus.getAttribute('legend-select');
        const index = +legend.substring(1) - 1;
        this._updateInsideLabel(index);
        this._mouseTooltip({target: focus});
    }

    _filterLegendChanged() {
        this._adjustSelection();
        this._modelChanged();
    }

    // Selections
    _selectionModeChanged(selectionMode) {
        this._selectionMgr.selection = null;
        this._selectionMgr.selectMethod = selectionMode;
        this._refreshView();
    }

    selectionChanged(selection) {
        this.dispatchEvent(new CustomEvent('chart-selection', {
            bubbles:  true,
            composed: true,
            detail:   {selection}
        }));
    }

    selectedChanged(index, selected) {
        const highlightSelected = selected && this.highlightSelection;
        const elSlice = this.$.pie.querySelector(`[part=slice][legend-select=L${index + 1}]`);
        const elValue = this._findValueEl(index + 1);
        const elLine = this.$.lines.querySelector(`[legend-select=L${index + 1}]`);

        if (elSlice) {
            if (selected) {
                PTCS.setbattr(elSlice, 'selected', true);
            } else {
                PTCS.setbattr(elSlice, 'selected');
            }
            elSlice.style.transform = highlightSelected ? elSlice.__highlightTranslate : '';
        }
        if (elValue) {
            if (selected) {
                PTCS.setbattr(elValue, 'selected', true);
            } else {
                PTCS.setbattr(elValue, 'selected');
            }
            elValue.style.transform = highlightSelected ? elValue.__highlightTranslate : elValue.__translate;
        }
        if (elLine) {
            elLine.style.transform = highlightSelected ? elLine.__highlightTranslate : elLine.__translate;
        }

        this._updateInsideLabel();
    }

    // Legend filter have changed. Adjust selection
    _adjustSelection() {
        if (this._selectionMgr.selection === null) {
            return; // Nothing to adjust
        }
        const filterSet = this.filterLegend instanceof Array && new Set(this.filterLegend);
        const isVisible = filterSet ? i => filterSet.has(i) : () => true;
        if (Array.isArray(this._selectionMgr.selection)) {
            if (this._selectionMgr.selection.some(sel => !isVisible(sel))) { // Only refilter if needed
                this._selectionMgr.selection = this._selectionMgr.selection.filter(sel => isVisible(sel));
            }
        } else if (!isVisible(this._selectionMgr.selection)) {
            this._selectionMgr.selection = null;
        }
    }

    selectData(selection) {
        // Verify selection
        if (selection !== null) {
            const verify = i => typeof i === 'number';

            if (Array.isArray(selection)) {
                if (selection.some(s => !verify(s))) {
                    return; // Invalid selection
                }
            } else if (!verify(selection)) {
                return;
            }
        }

        // Accept selection
        this._selectionMgr.selection = selection;
    }

    selectAll() {
        this._selectionMgr.selection = this._series.map((i) => i);
    }

    unselectAll() {
        this._selectionMgr.selection = null;
    }
};

customElements.define(PTCS.ChartCorePie.is, PTCS.ChartCorePie);
