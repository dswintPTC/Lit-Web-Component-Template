import {PolymerElement, html} from '@polymer/polymer/polymer-element.js';
import {PTCS} from 'ptcs-library/library.js';
import {SelectionMgr} from '../selection/chart-selection.js';
import {computeSampleSize, sampleArray, getChartTooltip} from 'ptcs-library/library-chart.js';
import 'ptcs-behavior-styleable/ptcs-behavior-styleable.js';
import 'ptcs-behavior-tooltip/ptcs-behavior-tooltip.js';
import 'ptcs-behavior-focus/ptcs-behavior-focus.js';
import 'ptcs-div/ptcs-div.js';

import {select} from 'd3-selection';
import {stack, line, curveLinear, curveBasis, curveBundle,
    curveCardinal, curveCatmullRom, curveMonotoneX, curveMonotoneY,
    curveNatural, curveStepBefore, curveStepAfter, curveStep,
    stackOrderNone, stackOrderReverse, stackOrderAppearance,
    stackOrderAscending, stackOrderDescending, stackOrderInsideOut,
    stackOffsetNone, stackOffsetExpand, stackOffsetDiverging,
    stackOffsetSilhouette, stackOffsetWiggle} from 'd3-shape';

/* eslint-disable no-confusing-arrow, no-nested-ternary, no-inner-declarations */

function compareSelectionObjects(sel1, sel2) {
    if (sel1.valueIx !== sel2.valueIx) {
        return sel1.valueIx - sel2.valueIx;
    }
    return sel1.serieIx - sel2.serieIx;
}

// Compute sum of all series values for a data point - excluding negative numbers
const sumOf = y => y.reduce((tot, v) => tot + (v === undefined ? 0 : Math.max(v, 0)), 0);

// Extract state value from data row
const stateValueOf = d => d[4];

// Extract tooltip fields from data row
const tooltipFieldsOf = d => d[5] || {};

function mergeArrays(a1, a2, err) {
    const a = [...a1];
    const num = Math.max(a.length, a2.length);
    for (let i = 0; i < num; i++) {
        if (a[i] === undefined) {
            a[i] = a2[i];
        } else if (a2[i] !== undefined && a2[i] !== a[i]) {
            err(i);
        }
    }
    return a;
}

// Merge two chart data rows. Data format: [x, [y], [state], {tooltips}]
function mergeRows(row1, row2) {
    const merged = [...row1];
    merged[1] = mergeArrays(row1[1], row2[1], i => console.warn(`${row1[0]} serie ${i + 1}: duplicate assignment ${row1[1][i]} and ${row2[1][i]}`));

    // State formatting
    if (row1[2] && row2[2]) {
        merged[2] = mergeArrays(row1[2], row2[2], i => console.warn(`${row1[0]} serie ${i + 1}: duplicate state ${row1[2][i]} and ${row2[2][i]}`));
    }

    // Tooltips
    if (merged[3] && row2[3]) {
        merged[3] = Object.assign({}, merged[3], row2[3]);
    }

    return merged;
}

PTCS.ChartCorePareto = class extends PTCS.BehaviorTooltip(PTCS.BehaviorFocus(PTCS.BehaviorStyleable(PTCS.ThemableMixin(PolymerElement)))) {

    static get template() {
        return html`
        <style>
        :host {
            display: block;
            width: 100%;
            height: 100%;
            --ptcs-tooltip-start-delay: 0;
        }

        svg {
            pointer-events: none;
            position: relative;
            z-index: 10;
            width: 100%;
            height: 100%;
        }

        #chart {
            position: relative;
            width: 100%;
            height: 100%;
        }

        [part~=bar] {
            position: absolute;
            box-sizing: border-box;
        }

        #markers {
            pointer-events: all;
        }

        #values {
            pointer-events: none;
            position: absolute;
            left: 0;
            right: 0;
            top: 0;
            bottom: 0;
            user-select: none;
            z-index: 12;
            overflow: hidden;
        }

        ptcs-label[part=value] {
            position: absolute;
            left: 0;
            top: 0;
            transform-origin: top left;
        }

        ptcs-label[part=marker-value] {
            position: absolute;
            left: 0;
            top: 0;
        }

        [part=drag-rect] {
            display: none;
        }

        [part=line] {
            fill: none;
        }
        </style>

        <div id="chart" on-dragstart="_ondragstart" on-mouseout="_closeTooltip"
             on-mousemove="_mouseTooltip" on-click="_clickOnChart" on-mousedown="_dragStart">
            <div id="bars"></div>
            <svg>
                <defs>
                    <circle id="ptc-circle" cx="0" cy="0" r="8"/>
                    <rect id="ptc-square" x="-8" y="-8" width="16" height="16"/>
                    <rect id="ptc-diamond" x="-8" y="-8" width="16" height="16" transform="rotate(45)"/>
                    <polygon id="ptc-triangle" points="-9,6.364 0,-6.364 9,6.364"/>
                    <polygon id="ptc-plus" points="-9,3 -9,-3 -3,-3 -3,-9 3,-9, 3,-3, 9,-3 9,3 3,3 3,9 -3,9 -3,3"/>
                    <use id="ptc-cross" href="#ptc-plus" transform="rotate(45)"/>
                </defs>
                <g xid="bars"></g>
                <g id="thresholds"></g>
                <g id="paretoline"></g>
                <g id="markers"></g>
                <rect id="dragrect" part="drag-rect"></rect>
            </svg>
            <div id="values"><div id="markervalues"></div><div id="aggrvalues"></div></div>
        </div>`;
    }

    static get is() {
        return 'ptcs-chart-core-pareto';
    }

    static get properties() {
        return {
            disabled: {
                type:               Boolean,
                reflectToAttribute: true
            },

            // Pareto threshold value (in %)
            thresholdValue: {
                type:     Number,
                observer: '_thresholdValueChanged'
            },

            // index to item at thresholdValue
            _thresholdIndex: Number,

            // 'horizontal' || 'vertical' || 'both' || 'none'
            thresholdLine: {
                type:     String,
                observer: 'refresh'
            },

            emphasizeThresholdFactors: {
                type:     Boolean,
                observer: 'refresh'
            },

            hideCumulativePercentage: {
                type:     Boolean,
                observer: 'refresh'
            },

            // Recieved data
            data: Array,

            // Massaged data: [[x, y, percentage], ...], sorted by percentage. Note: y is an array of series values
            _data: Array,

            _dataStacked: Array, // d3stack'ed data

            // Names of legend items, for tooltip
            legend: Array,

            // Index of selected legends
            filterLegend: Array,

            // Massaged index of selected items: = filterLegend or dynamically created legend indexes
            _filterLegend: Array,

            // Stack order: auto || reverse || appearance || ascending || descending || insideout
            stackOrder: String,

            // generated xType: x-values sorted according to percentage
            xType: {
                type:   Object,
                notify: true
            },

            // Minimun x value in data
            xMin: {
                type:   Object,
                notify: true
            },

            // Maximum x value in data
            xMax: {
                type:   Object,
                notify: true
            },

            // Minimun y value in data
            yMin: {
                type:   Object,
                notify: true
            },

            // Maximum y value in data
            yMax: {
                type:   Object,
                notify: true
            },

            // Sum of all y-values on chart (affected by legend filtering)
            _yTotal: Number,

            yValueFormat: {
                type: String
            },

            // Scale that maps x-positions to x-axis
            xScale: {
                type:     Function,
                observer: 'refresh'
            },

            // Scale that maps y-positions to y-axis
            yScale: {
                type:     Function,
                observer: 'refresh'
            },

            flipAxes: {
                type:               Boolean,
                observer:           'refresh',
                reflectToAttribute: true
            },

            reverseXAxis: {
                type:               Boolean,
                reflectToAttribute: true
            },

            reverseYAxis: {
                type:               Boolean,
                reflectToAttribute: true
            },

            // 'inside' || 'outside' || 'inside-end'
            showValues: {
                type:     String,
                observer: 'refresh'
            },

            // linear || basis || bundle || cardinal || catmull-rom || monotone-x || monotone-y || natural || step
            curve: {
                type:     String,
                observer: 'refresh'
            },

            // when curve === bundle
            bundleBeta: {
                type:     Number,
                value:    0.5,
                observer: 'refresh'
            },

            // when curve === cardinal
            cardinalTension: {
                type:     Number,
                value:    0.5,
                observer: 'refresh'
            },

            // when curve === catmull-rom
            catmullRomAlpha: {
                type:     Number,
                value:    0.5,
                observer: 'refresh'
            },

            // when curve === step
            stepPosition: {
                type:     String, // center || before || after
                observer: 'refresh'
            },

            // none || square || circle || triangle || plus || cross
            marker: {
                type:               String,
                observer:           'refresh',
                reflectToAttribute: true
            },

            // small || medium || large || xlarge || <number>
            markerSize: {
                type:     String,
                observer: 'refresh'
            },

            // 'no' || 'above' || 'on' || 'below'
            showMarkerValues: {
                type:     String,
                observer: 'refresh'
            },

            markerValueFormat: {
                type:     String,
                observer: 'refresh'
            },

            // zoom by selecting two elements
            zoomSelect: {
                type: Boolean
            },

            // X-zoom by dragging the mouse over the chart
            zoomDragX: {
                type: Boolean
            },

            // Y-zoom by dragging the mouse over the chart
            zoomDragY: {
                type: Boolean
            },

            // Show secondary y-axis
            showY2Axis: {
                type:     Boolean,
                observer: 'refresh'
            },

            // Minimun y2 value (should be 0)
            y2Min: {
                type: Number
            },

            // Maximum y2 value (should be 100)
            y2Max: {
                type: Number
            },

            // Scale that maps y2-positions (the percentage value) to y2-axis
            y2Scale: {
                type:     Function,
                observer: 'refresh'
            },

            // 'none' || 'single' || 'multiple'
            selectionMode: {
                type: String
            },

            // Unselectable items (array of indexes, where data[index] is unselectable)
            unselectable: {
                type:     Array,
                observer: '_unselectableChanged'
            },

            // Set(unselectable)
            _unselectableSet: {
                type: Set
            },

            _selectionMgr: {
                type:  SelectionMgr,
                value: () => new SelectionMgr(compareSelectionObjects)
            },

            // sampleSize: unassigned - use default sampling,
            //             number - sample down data to specified number,
            //             0 (zero) = no sampling = show all points
            sampleSize: {
                type:     Number,
                observer: 'refresh'
            },

            // Focused item (bar or marker)
            // bar: {el, xIndex, yIndex, index} || marker: {el, xIndex, index}
            _focus: {
                type: Object,
            },

            labelUnits: {
                type:  String,
                value: ''
            },

            labelOfTotal: {
                type:  String,
                value: 'of total'
            },

            labelCumulativeValue: {
                type:  String,
                value: 'Cumulative value'
            },

            tooltipTemplate: {
                type: String
            },

            tooltipTemplate2: {
                type: String
            },

            chartStateDataError: {
                type:     Boolean,
                value:    false,
                readOnly: true,
                notify:   true
            },

            chartStateDataEmpty: {
                type:     Boolean,
                readOnly: true,
                notify:   true
            }
        };
    }

    static get observers() {
        return [
            '_change(data, stackOrder, filterLegend)',
            '_dataChanged(data.*)',
            '_selectionModeChanged(selectionMode, zoomSelect)'
        ];
    }

    // Create function that compares strings according to order in values
    static arrayCmp(values) {
        const weigth = values.reduce((w, label, index) => {
            w[label] = index;
            return w;
        }, {});

        return (a, b) => {
            const av = weigth[a];
            const bv = weigth[b];
            if (av !== undefined) {
                if (bv !== undefined) {
                    return av - bv;
                }
                return 1;
            }
            return bv !== undefined ? -1 : 0;
        };
    }

    ready() {
        super.ready();

        this._selectionMgr.observe(this);

        // Keyboard navigation
        this.addEventListener('keydown', ev => this._keyDown(ev));
    }

    _ondragstart() {
        return false;
    }

    // Convert input data to pareto data
    _preprocessData(data, stackOrder, filterLegend) {
        if (!(data instanceof Array)) {
            return null;
        }

        // Massage filter
        const _filterLegend = (() => {
            if (filterLegend instanceof Array && filterLegend.every(v => !isNaN(v))) {
                return filterLegend;
            }
            const numSeries = data.reduce((r, v) => Math.max(r, v[1].length), 0);
            return [...Array(numSeries).keys()];
        })();

        // {xType, _data, _dataStacked: y, xMin, xMax, yMin, yMax, _filterLegend, _thresholdIndex, _yTotal};
        if (!(data.length > 0)) {
            return {
                xType:           [],
                _data:           [],
                _dataStacked:    [],
                xMin:            undefined,
                xMax:            undefined,
                yMin:            undefined,
                yMax:            undefined,
                _filterLegend,
                _thresholdIndex: 0,
                _yTotal:         0
            };
        }

        const filterSize = _filterLegend.length;

        // Are there holes in the legendFilter?
        const holey = _filterLegend.some((d, i) => d !== i);

        // Create new row that adds sum of all y-values + x-index + state value + tooltip fields
        const createRow = (x, y, i, y2, fields) => [x, y, sumOf(y), i, y2 || y, fields];

        // Extract the values that filterLegend specifies when filterLegend has holes
        // Note: undefined-values will be added if legend expects more values than available
        const filterValues = y => _filterLegend.map(index => y[index]);

        // Extract the values that filterLegend specifies when filterLegend is unholey
        const filterValuesOpt = y => y.length === filterSize ? y : filterValues(y);

        // Map data row to internal format
        const holeyMap = (item, index) => item[2] // Is there a separate state values field?
            ? createRow(item[0], filterValues(item[1]), index, filterValues(item[2]), item[3])
            : createRow(item[0], filterValues(item[1]), index, undefined, item[3]);

        const unholeyMap = (item, index) => item[2] // Is there a separate state values field?
            ? createRow(item[0], filterValuesOpt(item[1]), index, filterValuesOpt(item[2]), item[3])
            : createRow(item[0], filterValuesOpt(item[1]), index, undefined, item[3]);

        // Merge rows with identical x-values
        const rows = data.reduce((acc, row) => {
            const other = acc.get(row[0]);
            if (other) {
                acc.set(row[0], mergeRows(other, row));
            } else {
                acc.set(row[0], row);
            }
            return acc;
        }, new Map());

        // Create sorted mapping of label = sum of all its y-values [[x, y, sum], ...]
        const _data = [...rows.values()].map(holey ? holeyMap : unholeyMap).sort((a, b) => b[2] - a[2]);

        // Compute sum of all values
        const _yTotal = _data.reduce((tot, item) => tot + item[2], 0);

        // Translate values to percentage
        let acc = 0;
        for (let i = 0; i < _data.length; i++) {
            acc += _data[i][2];
            _data[i][2] = 100 * (acc / _yTotal);
        }

        // Create label array type for the x-axis (properly sorted)
        const xType = _data.map(item => item[0]);

        // Stacked data creator
        const d3stack = stack()
            .keys([...Array(filterSize).keys()])
            .value((d, key) => Math.max((d[1][key] || 0), 0))
            .offset(stackOffsetNone);

        const order = PTCS.ChartCorePareto.stackOrder[stackOrder];
        if (order) {
            d3stack.order(order);
        }

        // Create stacked data
        const y = d3stack(_data);

        const xMin = xType[0];
        const xMax = xType[xType.length - 1];

        let yMin, yMax;

        if (y && y[0]) {
            yMin = y[0][0][0];
            yMax = y[0][0][1];
            y.forEach(a => {
                a.forEach(item => {
                    if (yMin > item[0]) {
                        yMin = item[0];
                    }
                    if (yMax < item[1]) {
                        yMax = item[1];
                    }
                });
            });
        }

        const _thresholdIndex = this._computeThresholdIndex(_data, this.thresholdValue);

        return {xType, _data, _dataStacked: y, xMin, xMax, yMin, yMax, _filterLegend, _thresholdIndex, _yTotal};
    }

    // Threshold index - index to first non-bottleneck item
    _computeThresholdIndex(_data, thresholdValue) {
        const _thresholdIndex = _data.findIndex(d => d[2] > thresholdValue);
        return _thresholdIndex >= 0 ? _thresholdIndex : _data.length;
    }

    _thresholdValueChanged(thresholdValue) {
        if (this._data) {
            this._thresholdIndex = this._computeThresholdIndex(this._data, thresholdValue);
        }
        this.refresh();
    }

    // A change in some parameter(s) that fundamentally affects the pareto view
    _change(/*data, stackOrder, filterLegend*/) {
        if (this.__changeOn) {
            return;
        }
        this.__changeOn = true;
        requestAnimationFrame(() => {
            this.__changeOn = false;
            const emptyState = !(this.data && Array.isArray(this.data) && this.data.length);
            this._setChartStateDataEmpty(emptyState);
            if (emptyState) {
                return;
            }
            try {
                const pp = this._preprocessData(this.data, this.stackOrder, this.filterLegend);
                if (pp) {
                    this.setProperties(pp);
                    this.refresh();
                }
                // Legend filter may have changed, which affects the sectable items
                this._adjustSelection();
            } catch (e) {
                console.error(`Error processing Pareto data: ${e.name}: ${e.message}`);
            }
        });
    }

    _dataChanged(cr) {
        if (cr.path !== 'data' && cr.path !== 'data.length') {
            // Some internal data point has changed. Refresh data
            this._change(this.data, this.stackOrder, this.filterLegend);
        }

        // For now - reset selection whenever the data changes
        this._selectionMgr.selection = null;
    }

    // The pareto view must be refreshed
    refresh() {
        if (this.__refreshOn) {
            return;
        }
        this.__refreshOn = true;
        requestAnimationFrame(() => {
            this.__refreshOn = false;
            this._refreshView();
        });
    }

    // Get curve generator for pareto line
    _curve() {
        const f = PTCS.ChartCorePareto.curveMap[this.curve];
        if (f) {
            return f.call(this);
        }
        return curveLinear;
    }

    // Get current scale of pareto line markers
    _getMarkerScale() {
        switch (this.markerSize) {
            case 'small':
                return 0.5;
            case undefined:
            case null:
            case '':
            case 'medium':
                return 1;
            case 'large':
                return 1.5;
            case 'xlarge':
                return 2;
            default:
                if (this.markerSize !== '') {
                    const v = +this.markerSize;
                    if (!isNaN(v) && v > 0) {
                        return v / 16;
                    }
                }
        }
        return 1;
    }

    // Get function that places pareto line markers
    _setMarkerPosFunc(xPos, yPos) {
        const scaleFactor = this._getMarkerScale();

        if (scaleFactor === 1) {
            return this.flipAxes
                ? d => `translate(${yPos(d)}px,${xPos(d)}px)`
                : d => `translate(${xPos(d)}px,${yPos(d)}px)`;
        }

        return this.flipAxes
            ? d => `translate(${yPos(d)}px,${xPos(d)}px) scale(${scaleFactor})`
            : d => `translate(${xPos(d)}px,${yPos(d)}px) scale(${scaleFactor})`;
    }

    // Get function that places values bound to pareto line markers
    _setMarkerValuePosFunc(xPos, yPos) {
        const showMarker = this.marker && this.marker !== 'none';
        const mh = showMarker ? 8 * this._getMarkerScale() : 0;
        const f = (x, y) => `translate(${x}px,${y}px)`;

        if (this.showMarkerValues === 'above') {
            return this.flipAxes
                ? (d, w, h) => f(yPos(d) - w / 2, xPos(d) - h - mh)
                : (d, w, h) => f(xPos(d) - w / 2, yPos(d) - h - mh);
        }

        if (this.showMarkerValues === 'below') {
            return this.flipAxes
                ? (d, w, h) => f(yPos(d) - w / 2, xPos(d) + mh)
                : (d, w, h) => f(xPos(d) - w / 2, yPos(d) + mh);
        }

        return this.flipAxes
            ? (d, w, h) => f(yPos(d) - w / 2, xPos(d) - h / 2)
            : (d, w, h) => f(xPos(d) - w / 2, yPos(d) - h / 2);
    }

    // Get function that places bar values
    _setValuePosFunc(xOffs) {
        const width = this.clientWidth;
        const height = this.clientHeight;
        const yScale = this.yScale;
        const deltaX = this.xScale.bandwidth() / 2;
        const f = (x, y) => `translate(${x}px,${y}px)`;

        if (this.showValues === 'outside' && this._dataStacked.length <= 1) {
            return this.flipAxes
                ? (this.reverseYAxis
                    ? (d, i, w, h) => f(yScale(d[1]) - w, xOffs[i] + deltaX - h / 2)
                    : (d, i, w, h) => f(yScale(d[1]), xOffs[i] + deltaX - h / 2))
                : (this.reverseYAxis
                    ? (d, i, w, h) => f(xOffs[i] + deltaX - w / 2, yScale(d[1]))
                    : (d, i, w, h) => f(xOffs[i] + deltaX - w / 2, yScale(d[1]) - h));
        }

        if (this.showValues === 'inside-end') {
            return this.flipAxes
                ? (this.reverseYAxis
                    ? (d, i, w, h) => f(Math.min(yScale(d[1]), width - w), xOffs[i] + deltaX - h / 2)
                    : (d, i, w, h) => f(yScale(d[1]) - w, xOffs[i] + deltaX - h / 2))
                : (this.reverseYAxis
                    ? (d, i, w, h) => f(xOffs[i] + deltaX - w / 2, Math.max(yScale(d[1]) - h, 0))
                    : (d, i, w, h) => f(xOffs[i] + deltaX - w / 2, Math.min(yScale(d[1]), height - h)));
        }

        return this.flipAxes
            ? (this.reverseYAxis
                ? (d, i, w, h) => f(yScale(d[0]) - w, xOffs[i] + deltaX - h / 2)
                : (d, i, w, h) => f(yScale(d[0]), xOffs[i] + deltaX - h / 2))
            : (this.reverseYAxis
                ? (d, i, w, h) => f(xOffs[i] + deltaX - w / 2, yScale(d[0]))
                : (d, i, w, h) => f(xOffs[i] + deltaX - w / 2, yScale(d[0]) - h));
    }

    // Get function that rotates bar values. Only used for vertical bars
    _setValueRotatePosFunc(xOffs) {
        const yScale = this.yScale;
        const deltaX = this.xScale.bandwidth() / 2;
        const f = (x, y) => `translate(${x}px,${Math.max(0, y)}px) rotate(-90deg)`;

        if (this.showValues === 'outside' && this._dataStacked.length <= 1) {
            return this.reverseYAxis
                ? (d, i, w, h) => f(xOffs[i] + deltaX - h / 2, yScale(d[1]) + w)
                : (d, i, w, h) => f(xOffs[i] + deltaX - h / 2, yScale(d[1]));
        }

        if (this.showValues === 'inside-end') {
            return this.reverseYAxis
                ? (d, i, w, h) => f(xOffs[i] + deltaX - h / 2, yScale(d[1]))
                : (d, i, w, h) => f(xOffs[i] + deltaX - h / 2, yScale(d[1]) + w);
        }

        return this.reverseYAxis
            ? (d, i, w, h) => f(xOffs[i] + deltaX - h / 2, yScale(d[0]) + w)
            : (d, i, w, h) => f(xOffs[i] + deltaX - h / 2, yScale(d[0]));
    }

    // Get function that places bar aggregate values. Only used in 'outside' mode
    _setAggrValuePosFunc(xOffs) {
        const yScale = this.yScale;
        const deltaX = this.xScale.bandwidth() / 2;
        const f = (x, y) => `translate(${x}px,${y}px)`;

        return this.flipAxes
            ? (this.reverseYAxis
                ? (i, y, w, h) => f(yScale(y) - w, xOffs[i] + deltaX - h / 2)
                : (i, y, w, h) => f(yScale(y), xOffs[i] + deltaX - h / 2))
            : (this.reverseYAxis
                ? (i, y, w, h) => f(xOffs[i] + deltaX - w / 2, Math.max(0, yScale(y)))
                : (i, y, w, h) => f(xOffs[i] + deltaX - w / 2, Math.max(0, yScale(y) - h)));
    }

    // Get function that rotates bar aggregate values
    // Only used for vertical bars in 'outside' mode
    _setAggrValueRotatePosFunc(xOffs) {
        const yScale = this.yScale;
        const deltaX = this.xScale.bandwidth() / 2;
        const f = (x, y) => `translate(${x}px,${y}px) rotate(-90deg)`;
        return this.reverseYAxis
            ? (i, y, w, h) => f(xOffs[i] + deltaX - h / 2, yScale(y) + w)
            : (i, y, w, h) => f(xOffs[i] + deltaX - h / 2, yScale(y));
    }

    // Prepare data before it is viewed
    // - eliminates out-of-sight x-values
    // - samples big data
    _filterViewData() {
        const xScale = this.xScale;
        const maxPoints = computeSampleSize(this.xScale, this.sampleSize);
        const xOrg = this._data;
        const yOrg = this._dataStacked;

        // Index to first x-point that is included in current zoom viewport
        const x1 = xOrg.findIndex(d => xScale(d[0]) !== undefined);

        // Index to last x-point that is included in current zoom viewport
        const x2 = (() => { // findIndex backwards
            for (let i = xOrg.length - 1; i >= 0; i--) {
                if (xScale(xOrg[i][0]) !== undefined) {
                    return i;
                }
            }
            return -1;
        })();

        // Default values if no filtering / sampling is needed
        let x = xOrg;
        let y = yOrg;

        if (x1 > 0 || x2 < xOrg.length - 1) {
            // Zoom filtering
            x = xOrg.filter((d, i) => (x1 <= i && i <= x2));
            if (x.length > maxPoints && maxPoints > 0) {
                // Add sampling to zooming
                x = sampleArray(x, maxPoints);
            }
            y = [];
            yOrg.forEach(line2 => {
                let _line = line2.filter((d, i) => (x1 <= i && i <= x2));

                if (maxPoints < _line.length && maxPoints > 0) {
                    // Add sampling
                    _line = sampleArray(_line, maxPoints);
                }
                if (_line.length > 0) {
                    _line.key = line2.key;
                    _line.index = line2.index;
                    y.push(_line);
                }
            });
        } else if (x.length > maxPoints && maxPoints > 0) {
            // Sample down data set
            x = sampleArray(x, maxPoints);
            y = [];
            yOrg.forEach(line2 => {
                console.assert(line2.length === xOrg.length);
                const _line = sampleArray(line2, maxPoints);
                if (_line.length > 0) {
                    _line.key = line2.key;
                    _line.index = line2.index;
                    y.push(_line);
                }
            });
        }

        // Index mapping function: new x-index => org x-index
        const xIndex = (() => {
            if (x.length === x2 - x1 + 1) {
                // No sampling was applied to data. Straigthforward map
                return x1 > 0 ? (d, i) => i + x1 : (d, i) => i;
            }
            // Sampling was applied to data. Complex rule to determine original x-index
            const xMap = [];
            let ix = 0;
            for (let i = x1; i <= x2; i++) {
                if (xOrg[i] === x[ix]) {
                    xMap[ix++] = i;
                }
            }
            console.assert(ix === x.length); // All values should have been mapped
            return (d, i) => xMap[i];
        })();

        return {x, y, xIndex};
    }

    _refreshBars(xOffs, xIndex, y) {
        const yScale = this.yScale;
        const bandwidth = Math.max(this.xScale.bandwidth(), 1);
        const data = this._data;
        const selectionMgr = this._selectionMgr;
        const unselectableSet = this._unselectableSet;

        const group = d => `L${this._filterLegend[d.key] + 1}`;

        const legend = function(d) {
            return this.parentNode.getAttribute('group');
        };

        const barX = this.flipAxes
            ? (this.reverseYAxis
                ? d => yScale(d[1])
                : d => yScale(d[0]))
            : (d, i) => xOffs[i];

        const barY = this.flipAxes
            ? (d, i) => xOffs[i]
            : (this.reverseYAxis
                ? d => yScale(d[0])
                : d => yScale(d[1]));

        const translate = (d, i) => `translate(${barX(d, i)}px,${barY(d, i)}px)`;

        const barW = this.flipAxes ? d => `${Math.abs(yScale(d[1]) - yScale(d[0]))}px` : `${bandwidth}px`;

        const barH = this.flipAxes ? `${bandwidth}px` : d => `${Math.abs(yScale(d[1]) - yScale(d[0]))}px`;

        const checkZeroSize = s => s.charAt(0) === '0' || s.charAt(0) === '.';

        const wZero = (typeof barW === 'function') ? d => checkZeroSize(barW(d)) : d => checkZeroSize(barW);
        const hZero = (typeof barH === 'function') ? d => checkZeroSize(barH(d)) : d => checkZeroSize(barH);

        // Don's show borders if bar height/widget is zero
        const barB = d => (wZero(d) || hZero(d)) ? 'none' : null;

        const _thresholdIndex = this._thresholdIndex;
        const threshold = this.emphasizeThresholdFactors
            ? (d, i) => xIndex(d, i) >= _thresholdIndex ? 'after' : 'before'
            : null;

        function selected(d, i) {
            const valueIx = data[+this.getAttribute('x-index')][3];
            const serieIx = +this.getAttribute('legend').substring(1) - 1;
            return selectionMgr.isSelected({valueIx, serieIx}) ? '' : undefined;
        }

        function createBarEl(d, i) {
            const el = document.createElement('ptcs-div');
            el.setAttribute('part', 'bar');
            el.setAttribute('state-key', `${this._parent._legend + 1}`);
            return el;
        }

        function depfield(d, i) {
            const row = data[+this.getAttribute('x-index')];
            return stateValueOf(row)[this.parentNode._legend];
        }

        function setXIndex(d, i) {
            // i - index of d in filtered data
            // xIndex(d, i) - index in sorted data
            // data[xIndex(d, i)][3] - index in original data
            const ix = xIndex(d, i);

            this.setAttribute('x-index', ix);

            // ix is the sorted x-index and data[ix][3] is the original index
            if (unselectableSet && unselectableSet.has(data[ix][3])) {
                this.setAttribute('unselectable', '');
            } else {
                this.removeAttribute('unselectable');
            }
        }

        const index = (d, i) => `${i}`;

        // Bar gropus for each legend
        const join = select(this.$.bars)
            .selectAll('[group]')
            .data(y);

        // Enter
        join.enter()
            .append('div')
            .attr('group', group)
            .property('_legend', d => this._filterLegend[d.key])
            .selectAll('[part~=bar]')
            .data(d => d)
            .enter()
            .append(createBarEl)
            .attr('legend', legend)
            .attr('index', index)
            .each(setXIndex)
            .attr('selected', selected)
            .property('_depfield', depfield)
            .style('transform', translate)
            .style('width', barW)
            .style('height', barH)
            .style('border-style', barB)
            .attr('threshold', threshold);

        // Update
        join.attr('group', group)
            .property('_legend', d => this._filterLegend[d.key]);

        // Exit
        join.exit().remove();

        // update / enter / exit for children
        const children = join
            .selectAll('ptcs-div')
            .data(d => d);

        children.enter()
            .append(createBarEl)
            .attr('legend', legend)
            .attr('index', index)
            .each(setXIndex)
            .attr('selected', selected)
            .property('_depfield', depfield)
            .style('transform', translate)
            .style('width', barW)
            .style('height', barH)
            .style('border-style', barB)
            .attr('threshold', threshold);

        children
            .attr('legend', legend)
            .attr('index', index)
            .each(setXIndex)
            .attr('selected', selected)
            .property('_depfield', depfield)
            .style('transform', translate)
            .style('width', barW)
            .style('height', barH)
            .style('border-style', barB)
            .attr('threshold', threshold);

        children.exit().remove();
    }

    _refreshValues(x, xIndex, xOffs, y) {
        const yScale = this.yScale;
        const bandwidth = this.xScale.bandwidth();
        const limitedBarHeight = this._dataStacked.length > 1;

        let rotate = false;

        function checkSize(w, h, barHeight) {
            if (h > barHeight && limitedBarHeight) {
                // Too high for the bar
                this.setAttribute('hidden', '');
            } else if (w > bandwidth) {
                // Too wide for the bar
                if (h <= bandwidth && (w <= barHeight || !limitedBarHeight)) {
                    // Fits if rotated though
                    rotate = true;
                } else {
                    // Must hide label
                    this.setAttribute('hidden', '');
                }
            }
        }

        const formatNumber = PTCS.formatNumber(this.yValueFormat);

        // Bar values
        {
            const setPos = this._setValuePosFunc(xOffs);
            const data = this._data;

            // Note: don't convert processLabel to ES6 function - the this context is assigned by d3
            // eslint-disable-next-line no-inner-declarations
            function processLabel(d, i) {
                const value = data[xIndex(d, i)][1][this.parentNode.__valueIndex];
                if (!(value > 0)) {
                    this.setAttribute('hidden', '');
                    return;
                }
                this.removeAttribute('hidden');
                this.label = `${formatNumber(value)}`;

                const clientWidth = this.clientWidth;
                const clientHeight = this.clientHeight;
                checkSize.call(this, clientWidth, clientHeight, Math.abs(yScale(d[1]) - yScale(d[0])));
                this.style.transform = setPos(d, i, clientWidth, clientHeight);
            }

            const join = select(this.$.values)
                .selectAll('.value-legend')
                .data(this.showValues && this.showValues !== 'no' && bandwidth >= 10 ? y : []);

            // Exit
            join.exit().remove();

            // Enter
            join.enter()
                .append('div')
                .attr('class', 'value-legend')
                .property('__valueIndex', d => d.key)
                .selectAll('[part=value]')
                .data(d => d)
                .enter()
                .append('ptcs-label')
                .attr('variant', 'label')
                .attr('part', 'value')
                .property('horizontalAlignment', 'center')
                .each(processLabel);

            // update / enter / exit for children
            const children = join
                .selectAll('[part=value]')
                .data(d => d);

            children.exit().remove();

            children
                .each(processLabel);

            children.enter()
                .append('ptcs-label')
                .attr('variant', 'label')
                .attr('part', 'value')
                .property('horizontalAlignment', 'center')
                .each(processLabel);
        }

        // Aggregated bar value
        {
            const setPos = this._setAggrValuePosFunc(xOffs);

            // Note: don't convert processAggrLabel to ES6 function - the this context is assigned by d3
            // eslint-disable-next-line no-inner-declarations
            function processAggrLabel(d, i) {
                const ySum = sumOf(d[1]);
                if (ySum <= 0) {
                    this.setAttribute('hidden', '');
                    return;
                }
                this.removeAttribute('hidden');
                this.label = `${formatNumber(ySum)}`;
                const clientWidth = this.clientWidth;
                const clientHeight = this.clientHeight;
                checkSize.call(this, clientWidth, clientHeight, Number.MAX_SAFE_INTEGER);
                this.style.transform = setPos(i, ySum, clientWidth, clientHeight);
            }

            const join = select(this.$.aggrvalues)
                .selectAll('ptcs-label')
                .data(this.showValues === 'outside' && this._dataStacked.length > 1 && bandwidth >= 10 ? x : []);

            // Exit
            join.exit().remove();

            // Update
            join.each(processAggrLabel);

            // Enter
            join.enter()
                .append('ptcs-label')
                .attr('variant', 'label')
                .attr('part', 'value')
                .property('horizontalAlignment', 'center')
                .each(processAggrLabel);
        }

        // Rotate bar values? (only on vertical bars)
        if (rotate && !this.flipAxes) {
            const setPos = this._setValueRotatePosFunc(xOffs);

            function rotateLabel(d, i) {
                this.style.transform = setPos(d, i, this.clientWidth, this.clientHeight);
            }

            select(this.$.values)
                .selectAll('.value-legend')
                .data(y)
                .selectAll('[part=value]')
                .data(d => d)
                .each(rotateLabel);

            // Rotate aggregated values?
            if (this.showValues === 'outside' && this._dataStacked.length > 1) {
                const setAggrPos = this._setAggrValueRotatePosFunc(xOffs);

                function rotateAggrLabel(d, i) {
                    const ySum = sumOf(d[1]);
                    this.style.transform = setAggrPos(i, ySum, this.clientWidth, this.clientHeight);
                }

                select(this.$.aggrvalues).selectAll('ptcs-label').each(rotateAggrLabel);
            }
        }
    }

    _refreshLines(x, xIndex) {
        const xScale = this.xScale;
        const yScale = this.y2Scale;
        const deltaX = xScale.bandwidth() / 2;
        const xPos = d => xScale(d[0]) + deltaX;
        const yPos = d => yScale(d[2]);
        const hide = this.hideCumulativePercentage || this._filterLegend.length <= 0;

        // Truncate any empty bars from line
        const full = x.findIndex(v => v[2] >= 100);
        if (full >= 0 && full + 1 < x.length) {
            x = x.slice(0, full + 1);
        }

        // Pareto line
        {
            const d3line = this.flipAxes
                ? line().x(yPos).y(xPos).curve(this._curve())
                : line().x(xPos).y(yPos).curve(this._curve());

            const join = select(this.$.paretoline)
                .selectAll('path')
                .data(hide ? [] : [x]);

            // Enter
            join.enter()
                .append('path')
                .attr('part', 'line')
                .attr('d', d3line);

            // Update
            join.attr('d', d3line);

            // Exit
            join.exit().remove();
        }

        // Threshold lines
        {
            const d3line = this.flipAxes
                ? line().x(d => d[1]).y(d => d[0]).curve(this._curve())
                : line().x(d => d[0]).y(d => d[1]).curve(this._curve());

            const lineWidth = this.flipAxes ? this.clientHeight : this.clientWidth;
            const lineHeight = this.flipAxes ? this.clientWidth : this.clientHeight;
            const horizontal = this.thresholdLine === 'horizontal' || this.thresholdLine === 'both';
            const vertical = this.thresholdLine === 'vertical' || this.thresholdLine === 'both';

            // Threshold lines
            const lines = [];

            // Horiontal threshold line
            if (horizontal) {
                const y = this.y2Scale(this.thresholdValue);
                if (!isNaN(y)) {
                    lines.push([[0, y], [lineWidth, y]]);
                }
            }

            // Vertical threshold line
            if (vertical) {
                const i = Math.min(this._thresholdIndex, this._data.length - 1);
                const x1 = xScale(this._data[i][0]) + deltaX;
                const y1 = this._data[i][2];
                const x0 = i > 0 ? xScale(this._data[i - 1][0]) + deltaX : 0;
                const y0 = i > 0 ? this._data[i - 1][2] : 0;
                const a = y1 - y0;
                const b = x1 - x0;
                const c = this.thresholdValue - y0;
                const xx = x0 + (a ? (b * c) / a : 0);

                if (!isNaN(xx)) {
                    lines.push([[xx, 0], [xx, lineHeight]]);
                }
            }

            const join = select(this.$.thresholds)
                .selectAll('path')
                .data(lines);

            // Enter
            join.enter()
                .append('path')
                .attr('part', 'threshold')
                .attr('d', d3line);

            // Update
            join.attr('d', d3line);

            // Exit
            join.exit().remove();
        }

        // Markers
        {
            const marker = `#ptc-${this.marker}`;
            const setPos = this._setMarkerPosFunc(xPos, yPos);
            const index = (d, i) => `${i}`;

            const join = select(this.$.markers)
                .selectAll('use')
                .data(this.marker && this.marker !== 'none' && !hide ? x : []);

            // Enter
            join.enter()
                .append('use')
                .attr('part', 'marker')
                .property('focusNoClipping', true)
                .attr('href', marker)
                .attr('index', index)
                .attr('x-index', xIndex)
                .style('transform', setPos);

            // Update
            join.attr('href', marker)
                .attr('index', index)
                .attr('x-index', xIndex)
                .style('transform', setPos);

            // Exit
            join.exit().remove();
        }

        // Marker values
        {
            const formatTick = PTCS.formatNumber(this.markerValueFormat);
            const setPos = this._setMarkerValuePosFunc(xPos, yPos);

            // Showing marker values is _very_ expensive, so they might need to be sampled down _significantly_
            const xValues = (this.showMarkerValues && this.showMarkerValues !== 'no' && !hide)
                ? (x.length > 50 ? sampleArray(x, 50) : x) // Sample down values if needed
                : []; // Hide values

            function processMarkerLabel(d, i) {
                this.label = formatTick(Math.round(d[2]));
                this.style.transform = setPos(d, this.clientWidth, this.clientHeight);
            }

            const join = select(this.$.markervalues)
                .selectAll('[part=marker-value]')
                .data(xValues);

            // Enter
            join.enter()
                .append('ptcs-label')
                .attr('variant', 'label')
                .attr('part', 'marker-value')
                .property('horizontalAlignment', 'center')
                .each(processMarkerLabel);

            // Update
            join.each(processMarkerLabel);

            // Exit
            join.exit().remove();
        }
    }

    _refreshView() {
        if (!this._data || !this.xScale || !this.yScale || !this.y2Scale) {
            return;
        }

        const {x, y, xIndex} = this._filterViewData();
        const xScale = this.xScale;
        const xOffs = x.map(d => xScale(d[0]));

        // Pareto line
        this._refreshLines(x, xIndex);

        // Bars
        this._refreshBars(xOffs, xIndex, y);

        // Values
        this._refreshValues(x, xIndex, xOffs, y);

        this._updateFocus();
    }

    _selectPart(el) {
        const part = el.getAttribute('part');
        if (!part) {
            return null;
        }
        const xIndex = +el.getAttribute('x-index');
        const index = +el.getAttribute('index');
        if (part === 'bar') {
            return {el, xIndex, yIndex: (+el.getAttribute('legend').substring(1)) - 1, index};
        }
        if (part === 'marker') {
            return {el, xIndex, index};
        }
        if (part) {
            console.warn(`Unknown part: ${part}`);
        }
        return null;
    }

    // Set the focused element
    _focusOn(focus) {
        if (this.disabled) {
            return null;
        }
        if (focus instanceof Element) {
            focus = this._selectPart(focus);
        }
        if (this._focus) {
            this._focus.el.removeAttribute('focus');
        }
        this._focus = focus;
        if (this._focus) {
            this._focus.el.setAttribute('focus', '');
        }
        return focus;
    }

    _findBar(sel) {
        // sel.valueIx is index in original data: find index in sorted data
        const xIndex = this._data && this._data.findIndex(d => d[3] === sel.valueIx);
        return xIndex >= 0 && this.$.bars.querySelector(`[group=L${sel.serieIx + 1}] > [x-index="${xIndex}"]`);
    }

    _clickAction(ev) {
        if (this.disabled) {
            return;
        }
        const _selected = this._selectPart(ev.target);
        if (!_selected) {
            return;
        }
        this._focusOn(_selected);

        // Clicked on a bar?
        if (_selected.hasOwnProperty('yIndex')) {
            const valueIx = this._data[_selected.xIndex][3];
            const serieIx = _selected.yIndex;
            const v = this.data[valueIx];
            const barData = {serieIx, valueIx, x: v[0], y: v[1][serieIx]};

            if (!this._unselectableSet || !this._unselectableSet.has(valueIx)) {
                this._selectionMgr.select(barData);
            }

            this.dispatchEvent(new CustomEvent('series-click', {
                bubbles:  true,
                composed: true,
                detail:   barData
            }));
        }

        // Has a zoom range been selected?
        if (!this.zoomSelect) {
            return; // Not in zoom selection mode
        }
        if (!this._selectionMgr.selection || this._selectionMgr.selection.length < 2) {
            return; // Don't have two selected bars
        }

        const el1 = this._findBar(this._selectionMgr.selection[0]);
        const el2 = this._findBar(this._selectionMgr.selection[1]);
        this._selectionMgr.selection = null; // Reset selection
        if (!el1 || !el2) {
            return; // Internal error
        }

        // Report selected range
        const b1 = el1.getBoundingClientRect();
        const b2 = el2.getBoundingClientRect();
        const cntr = this.$.bars.getBoundingClientRect();
        const x1 = Math.min(b1.left, b2.left) - cntr.left;
        const y1 = Math.min(b1.top, b2.top) - cntr.top;
        const x2 = Math.max(b1.left + b1.width, b2.left + b2.width) - cntr.left;
        const y2 = Math.max(b1.top + b1.height, b2.top + b2.height) - cntr.top;

        this.dispatchEvent(new CustomEvent('zoom-selection', {
            bubbles:  true,
            composed: true,
            detail:   {x: x1, y: y1, w: x2 - x1, h: y2 - y1}
        }));
    }

    _clickOnChart(ev) {
        if (this.disabled) {
            return;
        }
        if ((!this.zoomDragX && !this.zoomDragY) || this._movedMouse) {
            return; // Either disabled or handled by mouse-down
        }
        this._clickAction(ev);
    }

    _dragStart(ev) {
        this._movedMouse = 0;

        if (this.disabled) {
            return;
        }
        if ((!this.zoomDragX && !this.zoomDragY)) {
            this._clickAction(ev);
            return;
        }

        const x = ev.clientX;
        const y = ev.clientY;

        const mmv = ev1 => this._mouseDrag(ev1, x, y);

        this.dragging = true;
        const mup = () => {
            this.dragging = false;
            window.removeEventListener('mousemove', mmv);
            window.removeEventListener('mouseup', mup);
            this._mouseUp();
        };

        window.addEventListener('mousemove', mmv);
        window.addEventListener('mouseup', mup);
    }

    _mouseDrag(ev, x0, y0) {
        const cntr = this.$.chart.getBoundingClientRect();
        const el = this.$.dragrect;
        const [dragX, dragY] = this.flipAxes
            ? [this.zoomDragY, this.zoomDragX]
            : [this.zoomDragX, this.zoomDragY];

        el.setAttribute('x', dragX ? Math.min(x0, ev.clientX) - cntr.left : 0);
        el.setAttribute('y', dragY ? Math.min(y0, ev.clientY) - cntr.top : 0);
        el.setAttribute('width', dragX ? Math.abs(x0 - ev.clientX) : cntr.width);
        el.setAttribute('height', dragY ? Math.abs(y0 - ev.clientY) : cntr.height);
        if (!this._movedMouse) {
            this._movedMouse = Date.now();
            el.style.display = 'block';
        }
    }

    _mouseUp() {
        const el = this.$.dragrect;
        el.style.display = '';
        if (!this._movedMouse) {
            return;
        }

        const x = +el.getAttribute('x');
        const y = +el.getAttribute('y');
        const w = +el.getAttribute('width');
        const h = +el.getAttribute('height');

        const [dragX, dragY] = this.flipAxes
            ? [this.zoomDragY, this.zoomDragX]
            : [this.zoomDragX, this.zoomDragY];

        if ((!dragX || w < 3) && (!dragY || h < 3)) {
            // Dragged less than 3px. Ignore
            return;
        }
        if (Date.now() - this._movedMouse < 150) {
            // Only dragged for 150ms. Ignore
            return;
        }

        this.dispatchEvent(new CustomEvent('zoom-selection', {
            bubbles:  true,
            composed: true,
            detail:   {x, y, w, h}
        }));
    }

    _mouseTooltip(ev) {
        const el = ev.target;
        if (el === this.__tooltipEl) {
            return;
        }
        this._closeTooltip();

        const partName = el.getAttribute('part');
        if (!partName) {
            return;
        }

        const i = +el.getAttribute('x-index');
        const total = sumOf(this._data[i][1]);
        const units = this.labelUnits ? ' ' + this.labelUnits : '';
        const label = this._data[i][0];
        const xTot = `${label}, ${total}${units}`;
        const perc = `${Math.round(100 * total / this._yTotal)}%`;
        const percStr = `${perc} ${this.labelOfTotal}${units}`;
        const percCum = `${Math.round(this._data[i][2])}%`;
        const percCumStr = `${this.labelCumulativeValue}, ${percCum}`;

        const arg = {showAnyway: true};

        let tooltip;

        if (partName === 'bar') {
            const y = (+el.getAttribute('legend').substring(1)) - 1;
            const lData = this._data[i][1][y];
            const series = this.legend[y].label;
            const value = lData === undefined ? 'N/A' : lData;
            const xSerie = `${series}, ${value}${units}`;

            if (this.tooltipTemplate) {
                tooltip = getChartTooltip(this.tooltipTemplate, Object.assign({
                    label, total, series, value, perc, percCum
                }, tooltipFieldsOf(this._data[i])));
            } else {
                tooltip = this._filterLegend.length > 1
                    ? [xTot, xSerie, percStr, percCumStr]
                    : [xTot, percStr, percCumStr]; // Exclude serie if there is only one serie
            }

            // Open tooltip for bar
            this.__tooltipEl = el;
            this._tooltipEnter(this.__tooltipEl, ev.clientX, ev.clientY, tooltip, arg);
        } else if (partName === 'marker') {
            if (this.tooltipTemplate2) {
                tooltip = getChartTooltip(this.tooltipTemplate2, Object.assign({
                    label, total, perc, percCum
                }, tooltipFieldsOf(this._data[i])));
            } else {
                tooltip = [xTot, percStr, percCumStr];
            }

            // Open tooltip for marker
            this.__tooltipEl = el;
            this._tooltipEnter(this.__tooltipEl, ev.clientX, ev.clientY, tooltip, arg);
        } else {
            console.warn('mouse over unknown part: ' + partName);
        }
    }

    _closeTooltip() {
        if (this.__tooltipEl) {
            this._tooltipLeave(this.__tooltipEl);
            this.__tooltipEl = null;
        }
    }

    _pickPart(index, yIndex) {
        const el = typeof yIndex === 'number'
            ? this.$.bars.querySelector(`[index="${index}"][legend=L${yIndex + 1}]`)
            : this.$.markers.querySelector(`[index="${index}"]:not([hidden])`);
        return el ? this._selectPart(el) : null;
    }

    _updateFocus() {
        if (!this._focus) {
            return;
        }

        // TODO: Avoid traversing the tree if possible? (Is current focus already correct?)

        const el = this._pickPart(
            Math.min(this._focus.index, this._data.length - 1),
            Math.min(this._focus.yIndex, this._filterLegend.length - 1));

        this._focusOn(el || this.$.bars.querySelector('[part~=bar]'));
    }

    _initTrackFocus() {
        this._trackFocus(this, () => this._focus ? this._focus.el : null);
    }

    _notifyFocus() {
        if (this.disabled) {
            return;
        }
        requestAnimationFrame(() => {
            if (this.dragging) {
                return;
            }
            // Make sure a chart item has focus, if possible
            if (!this._focus) {
                // Set focus on first bar
                this._focusOn(this.$.bars.querySelector('[part~=bar]'));
            }
            if (this._focus) {
                this._mouseTooltip({target: this._focus.el});
            }
        });
    }

    _notifyBlur() {
        this._closeTooltip();
    }

    _keyDown(ev) {
        if (this.disabled) {
            return;
        }
        if (!this._focus) {
            this._focusOn(this.$.bars.querySelector('[part~=bar]'));
            if (!this._focus) {
                return;
            }
        }

        const prev = yIndex => {
            if (yIndex === undefined) {
                // Go from percentage marker to last visible bar
                return this._filterLegend[this._filterLegend.length - 1];
            }
            const i = this._filterLegend.findIndex(yi => yi === yIndex);
            return i > 0 ? this._filterLegend[i - 1] : yIndex;
        };

        const next = yIndex => {
            const i = this._filterLegend.findIndex(yi => yi === yIndex);
            return (i >= 0 && i + 1 < this._filterLegend.length) ? this._filterLegend[i + 1] : undefined;
        };

        const first = yValues => this._filterLegend[yValues.findIndex(v => !isNaN(v))];

        const last = yValues => {
            let i = yValues.length - 1;
            while (i >= 0 && isNaN(yValues[i])) {
                i--;
            }
            return this._filterLegend[i];
        };

        let focus = null;
        switch (ev.key) {
            case 'ArrowLeft':
                focus = this._pickPart(this._focus.index - 1, this._focus.yIndex);
                break;
            case 'ArrowRight':
                focus = this._pickPart(this._focus.index + 1, this._focus.yIndex);
                break;
            case 'ArrowUp':
                focus = this._pickPart(this._focus.index, prev(this._focus.yIndex));
                break;
            case 'ArrowDown':
                focus = this._pickPart(this._focus.index, next(this._focus.yIndex));
                break;
            case 'PageUp':
                focus = this._pickPart(this._focus.index, first(this._data[this._focus.index][1]));
                break;
            case 'PageDown':
                focus = this._pickPart(this._focus.index, last(this._data[this._focus.index][1]));
                break;
            case 'Home':
                focus = this._pickPart(0, this._focus.yIndex);
                break;
            case 'End':
                focus = this._pickPart(this._data.length - 1, this._focus.yIndex);
                break;
            case 'Enter':
            case ' ':
                this._clickAction({target: this._focus.el});
                break;
            default:
                // Not handled - avoid calling ev.preventDefault()
                return;
        }

        // We consumed this keyboard event. Don't propagate
        ev.preventDefault();

        if (!focus || focus.el === this._focus.el) {
            return;
        }
        this._focusOn(focus);
        this._mouseTooltip({target: focus.el});
    }

    // Selections
    _selectionModeChanged(selectionMode, zoomSelect) {
        this._selectionMgr.selection = null;
        this._selectionMgr.selectMethod = zoomSelect ? 'multiple' : selectionMode;
    }

    _unselectableChanged(unselectable) {
        this._unselectableSet = Array.isArray(unselectable) ? new Set(unselectable) : undefined;

        // Remove unselectable items from current selection
        if (this._unselectableSet && this._selectionMgr.selection) {
            if (Array.isArray(this._selectionMgr.selection)) {
                if (this._selectionMgr.selection.some(sel => this._unselectableSet.has(sel.valueIx))) {
                    this._selectionMgr.selection = this._selectionMgr.selection.filter(sel => !this._unselectableSet.has(sel.valueIx));
                }
            } else if (this._unselectableSet.has(this._selectionMgr.selection.valueIx)) {
                this._selectionMgr.selection = null;
            }
        }
        this.refresh();
    }

    // Legend filter may have changed. Adjust selection
    _adjustSelection() {
        if (!this._selectionMgr.selection) {
            return; // Nothing to adjust
        }
        if (Array.isArray(this._selectionMgr.selection)) {
            const set = new Set(this._filterLegend);
            if (this._selectionMgr.selection.some(sel => !set.has(sel.serieIx))) { // Only refilter if needed
                this._selectionMgr.selection = this._selectionMgr.selection.filter(sel => set.has(sel.serieIx));
            }
        } else if (this._filterLegend.indexOf(this._selectionMgr.selection.serieIx) < 0) {
            this._selectionMgr.selection = null;
        }
    }

    selectionChanged(selection) {
        this.dispatchEvent(new CustomEvent('chart-selection', {
            bubbles:  true,
            composed: true,
            detail:   {selection}
        }));
    }

    selectedChanged(sel, selected) {
        const el = this._findBar(sel);
        if (el) {
            if (selected) {
                el.setAttribute('selected', '');
            } else {
                el.removeAttribute('selected');
            }
        }
    }

    selectData(selection) {
        // Verify selection
        if (selection !== null) {
            const verify = s => typeof s === 'object' &&
                                typeof s.valueIx === 'number' && typeof s.serieIx === 'number' &&
                                s.hasOwnProperty('x') && s.hasOwnProperty('y');

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
        const selection = [];
        if (this.data) {
            this.data.forEach((row, valueIx) => {
                if (this._unselectableSet && this._unselectableSet.has(valueIx)) {
                    return;
                }
                const x = row[0];
                this._filterLegend.forEach(serieIx => {
                    const y = row[1][serieIx];
                    if (y !== undefined) {
                        selection.push({serieIx, valueIx, x, y});
                    }
                });
            });
        }
        this._selectionMgr.selection = selection;
    }

    unselectAll() {
        this._selectionMgr.selection = null;
    }
};


PTCS.ChartCorePareto.curveMap = {
    linear: function() {
        return curveLinear;
    },
    basis: function() {
        return curveBasis;
    },
    bundle: function() {
        return curveBundle.beta(this.bundleBeta);
    },
    cardinal: function() {
        return curveCardinal.tension(this.cardinalTension);
    },
    'catmull-rom': function() {
        return curveCatmullRom.alpha(this.catmullRomAlpha);
    },
    'monotone-x': function() {
        return curveMonotoneX;
    },
    'monotone-y': function() {
        return curveMonotoneY;
    },
    natural: function() {
        return curveNatural;
    },
    step: function() {
        if (this.stepPosition === 'before') {
            return curveStepBefore;
        }
        if (this.stepPosition === 'after') {
            return curveStepAfter;
        }
        return curveStep;
    }
};

PTCS.ChartCorePareto.stackOrder = {
    // Returns the given series order
    auto: stackOrderNone,

    // Returns the reverse of the given series order
    reverse: stackOrderReverse,

    // Returns a series order such that the earliest series
    // (according to the maximum value) is at the bottom.
    appearance: stackOrderAppearance,

    // Returns a series order such that the smallest series
    // (according to the sum of values) is at the bottom.
    ascending: stackOrderAscending,

    // Returns a series order such that the largest series
    // (according to the sum of values) is at the bottom.
    descending: stackOrderDescending,

    // Returns a series order such that the earliest series
    // (according to the maximum value) are on the inside and the later
    // series are on the outside. This order is recommended for
    // streamgraphs in conjunction with the wiggle offset.
    insideout: stackOrderInsideOut
};

PTCS.ChartCorePareto.stackOffset = {
    // Applies a zero baseline
    auto: stackOffsetNone,

    // Applies a zero baseline and normalizes the values for each point such that the
    // topline is always one
    expand: stackOffsetExpand,

    // Positive values are stacked above zero, negative values are stacked below zero,
    // and zero values are stacked at zero
    diverging: stackOffsetDiverging,

    // Shifts the baseline down such that the center of the streamgraph is always at zero
    silhouette: stackOffsetSilhouette,

    // Shifts the baseline so as to minimize the weighted wiggle of layers. This offset is
    // recommended for streamgraphs in conjunction with the inside-out order
    wiggle: stackOffsetWiggle
};

customElements.define(PTCS.ChartCorePareto.is, PTCS.ChartCorePareto);
