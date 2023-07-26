import {PolymerElement, html} from '@polymer/polymer/polymer-element.js';
import {PTCS} from 'ptcs-library/library.js';
import {SelectionMgr} from '../selection/chart-selection.js';
import {computeSampleSize, sampleArray, getChartTooltip} from 'ptcs-library/library-chart.js';
import 'ptcs-behavior-styleable/ptcs-behavior-styleable.js';
import 'ptcs-behavior-tooltip/ptcs-behavior-tooltip.js';
import 'ptcs-behavior-focus/ptcs-behavior-focus.js';
import 'ptcs-div/ptcs-div.js';

import {select} from 'd3-selection';

/* eslint-disable no-confusing-arrow, no-nested-ternary, no-inner-declarations */

// Extract values from stacked row: [yIndex, bottomValue, topValue, xIndex, delta?]
const xIndexOf = d => d[3];
const yIndexOf = d => d[0];
const _legend = d => yIndexOf(d) + 1;
const topOf = d => d[1];
const bottomOf = d => d[2];

// Return value with correct sign
// - If there is an explicit delta, use it (record is a delta entry)
// - Otherwise (record is summary entry) return range with correct sign.
//   This record type always puts negative values below the zero-line
const valueOf = d => d[4] !== undefined ? d[4] : (d[1] >= 0 ? d[2] - d[1] : d[1] - d[2]);

function compareSelectionObjects(sel1, sel2) {
    if (sel1.valueIx !== sel2.valueIx) {
        return sel1.valueIx - sel2.valueIx;
    }
    return sel1.serieIx - sel2.serieIx;
}

const __dataFields = d => d[d.length - 1];

const barType = d => d.length <= 4 ? 'sum' : (d[4] < 0 ? 'neg' : 'pos');

function depfield(_data) {
    return function(d) {
        const row = _data[+this.parentNode.getAttribute('x-index')];
        const v =  (row && row[3]) ? row[3][_legend(d) - 1] : undefined;

        // When we update the _depfield property using .property() and we set "undefined" value then d3 is removing
        // the property completely (internally it checks if value == null). It breaks the state formatting so to workaround this I use "NaN".
        return v === undefined ? NaN : v;
    };
}

function selected(selectionMgr) {
    return function(d, i) {
        const valueIx = +this.parentNode.getAttribute('x-index');
        const serieIx = yIndexOf(d);
        return selectionMgr.isSelected({valueIx, serieIx}) ? '' : undefined;
    };
}

PTCS.ChartCoreWaterfall = class extends PTCS.BehaviorTooltip(PTCS.BehaviorFocus(PTCS.BehaviorStyleable(PTCS.ThemableMixin(PolymerElement)))) {
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
            position: absolute;
            width: 100%;
            height: 100%;
        }

        #chart {
            position: relative;
            width: 100%;
            height: 100%;
        }

        [group] {
            position: absolute;
        }

        :host(:not([flip-axes])) [group] {
            top: 0;
            bottom: 0;
        }

        :host([flip-axes]) [group] {
            left: 0;
            right: 0;
        }

        [part=bar] {
            position: absolute;
            box-sizing: border-box;
        }

        :host(:not([flip-axes])) [part=bar] {
            left: 0;
            right: 0;
        }

        :host([flip-axes]) [part=bar] {
            top: 0;
            bottom: 0;
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

        [part=drag-rect] {
            position: absolute;
            display: none;
        }

        [part=bridge] {
            stroke-width: 2;
        }

        [part=bridge][type=hidden] {
            display: none;
        }

        :host([hide-connector-lines]) [part=bridge] {
            display: none;
        }
        </style>

        <div id="chart" on-dragstart="_ondragstart" on-mouseout="_closeTooltip"
            on-mousemove="_mouseTooltip" on-click="_clickOnChart" on-mousedown="_dragStart">
            <svg>
              <g id="bridges"></g>
            </svg>
            <div id="summarybars" class="summary"></div>
            <div id="bars"></div>
            <div id="values"></div>
            <div id="aggrvalues"></div>
            <div id="dragrect" part="drag-rect"></div>
        </div>`;
    }

    static get is() {
        return 'ptcs-chart-core-waterfall';
    }

    static get properties() {
        return {
            disabled: {
                type:               Boolean,
                reflectToAttribute: true
            },

            stacked: {
                type:               Boolean,
                reflectToAttribute: true
            },

            // Recieved data with format = [x-value, [y-values], [state-values], {additional tooltip tokens by <key: value>}]
            data: Array,

            // Massaged data
            _data: Array,

            // Names of legend items, for tooltip
            legend: Array,

            // Index of selected legends
            filterLegend: Array,

            // Massaged index of selected items: = filterLegend or dynamically created legend indexes
            _filterLegend: Array,

            // generated xType
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

            // hide Connector Lines between bars
            hideConnectorLines: {
                type:               Boolean,
                reflectToAttribute: true
            },

            // Focused bar: {el, xIndex, yIndex}
            _focus: {
                type: Object,
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

            // summaryBars: an array of x-indexes that should show summary bars
            summaryBars: {
                type:     Array,
                observer: '_summaryBarsChanged'
            },

            // Set(summaryBars): for quick access
            _summaryBarsSet: {
                type: Set
            },

            // Data for the summary bars. Same format as _data
            _summaryBarsData: {
                type: Array
            },

            // Activate use-trend-colors attribute, if data has a single series
            trendColors: {
                type: Boolean
            },

            useTrendColors: {
                type:               Boolean,
                computed:           '_useTrendColors(trendColors, stacked)',
                reflectToAttribute: true
            },

            // sampleSize: unassigned - use default sampling,
            //             number - sample down data to specified number,
            //             0 (zero) = no sampling = show all points
            sampleSize: {
                type:     Number,
                observer: 'refresh'
            },

            tooltipTemplate: {
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
            '_change(data, filterLegend)',
            '_dataChanged(data.*)',
            '_selectionModeChanged(selectionMode, zoomSelect)'
        ];
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

    _useTrendColors(trendColors, stacked) {
        return trendColors && !stacked;
    }

    _buildSummaryBars() {
        if (!this._summaryBarsSet || !(Array.isArray(this._data) && this._data.length > 0)) {
            this._summaryBarsData = [];
            return;
        }

        // Create summary bars
        const summaryBars = [];
        const sum = this._filterLegend.map(i => this._data[0][3][i]);
        for (let index = 1; index < this._data.length; index++) {
            const row = this._data[index];
            const values = row[3];
            if (!values) {
                continue; // This is already a summary bar
            }

            // Add deltas to summary
            this._filterLegend.forEach((serie, i) => {
                sum[i] += values[serie];
            });

            if (this._summaryBarsSet.has(index)) {
                const xIndex = row[2][0][3];
                let prevYpos = 0;
                let prevYneg = 0;
                const yarr = [];

                this._filterLegend.forEach((serie, i) => {
                    const y = sum[i];
                    if (y < 0) {
                        yarr.push([serie, prevYneg + y, prevYneg, xIndex]);
                        prevYneg += y;
                    } else {
                        yarr.push([serie, prevYpos, prevYpos + y, xIndex]);
                        prevYpos += y;
                    }
                });

                summaryBars.push([row[0], sum.reduce((a, v) => a + v, 0), yarr]);
            }
        }
        this._summaryBarsData = summaryBars;
    }

    // Convert input data to waterfall data
    _preprocessData(data, filterLegend) {
        if (!(data instanceof Array)) {
            return null;
        }

        let legendIsFiltered = false;

        // Massage filter
        const _filterLegend = (() => {
            if (filterLegend instanceof Array && filterLegend.every(v => !isNaN(v))) {
                legendIsFiltered = true;
                return filterLegend;
            }

            const numSeries = data.reduce((r, v) => Math.max(r, v[1] ? v[1].length : 0), 0);
            return [...Array(numSeries).keys()];
        })();

        if (_filterLegend.length === 0) {
            // Legend filter hides everything
            return {
                xType: [...new Set(this.data.map(item => item[0]))],
                _data: [],
                xMin:  undefined,
                xMax:  undefined,
                yMin:  undefined,
                yMax:  undefined,
                _filterLegend};
        }

        this.stacked = _filterLegend.length > 1;

        // Create stacked data
        const baseRec = (i, from, to, xIndex) => [_filterLegend[i], from, to, xIndex];
        const deltaRec = (i, from, to, xIndex, d) => [_filterLegend[i], from, to, xIndex, d];

        const stack = (xIndex, yValues, rec, org = 0) => {
            const curr = [];
            let prevYpos = org;
            let prevYneg = org;
            for (let i = 0; i < yValues.length; i++) {
                const y = yValues[i];
                if (y < 0) {
                    curr.unshift(rec(i, prevYneg + y, prevYneg, xIndex, y));
                    prevYneg += y;
                } else {
                    curr.push(rec(i, prevYpos, prevYpos + (y || 0), xIndex, y));
                    prevYpos += (y || 0);
                }
            }
            return curr;
        };

        const sumOf = yValues => yValues.reduce((tot, v) => tot + (v || 0), 0);

        // Start values
        let allYValues = data[0][1].slice();
        const yValues = _filterLegend.map(ix => data[0][1][ix]);
        let sum = sumOf(yValues);

        // [2] and [3] are state and tooltip data values
        const _data = [[data[0][0], sum, stack(0, yValues, baseRec), data[0][2] ? data[0][2] : data[0][1], data[0][3]]];

        // Delta values
        for (let i = 1; i < data.length; i++) {
            const dyValues = data[i][1];
            if (!dyValues || dyValues.every(e => e === undefined)) {
                let states;

                if (data[i][2]) {
                    // Set the states for the summary columns
                    states = data[i][2].map((v, index) => {
                        if (v !== undefined) {
                            if (typeof v === 'string') {
                                // State for the summary bar can be either a value or the series index
                                const match = v.match(/^series:(?<series>\d+)$/);

                                if (match) {
                                    return allYValues[match.groups.series];
                                }
                            }

                            return v;
                        }

                        return allYValues[index];
                    });
                }

                _data.push([data[i][0], sum, stack(i, yValues, baseRec), states, data[i][3]]);
            } else {
                const dy = _filterLegend.map(ix => dyValues[ix]);
                const yStack = stack(i, dy, deltaRec, sum);
                dyValues.forEach((d, _i) => {
                    allYValues[_i] += (d || 0);

                    const yValuesIndex = legendIsFiltered ? _filterLegend.indexOf(_i) : _i;

                    if (yValuesIndex !== -1) {
                        sum += (d || 0);
                        yValues[yValuesIndex] += (d || 0);
                    }
                });
                _data.push([data[i][0], sum, yStack, data[i][2] ? data[i][2] : data[i][1], data[i][3]]);
            }
            console.assert(sum === sumOf(yValues));
        }

        // Min / Max
        let yMin = Number.POSITIVE_INFINITY;
        let yMax = Number.NEGATIVE_INFINITY;
        for (let i = 0; i < _data.length; i++) {
            const y = _data[i][2];
            yMin = Math.min(yMin, y[0][1]);
            yMax = Math.max(yMax, y[y.length - 1][2]);
        }

        const xType = _data.map(item => item[0]);
        const xMin = xType[0];
        const xMax = xType[xType.length - 1];

        const discardUpdatingXType = this.xType &&
                                     this.xType.length === xType.length &&
                                     this.xType.every((d, i) => d === xType[i]);

        if (discardUpdatingXType) {
            return {_data, xMin, xMax, yMin, yMax, _filterLegend};
        }
        return {xType, _data, xMin, xMax, yMin, yMax, _filterLegend};
    }

    // A change in some parameter(s) that fundamentally affects the waterfall view
    _change(/*data, filterLegend*/) {
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
                const pp = this._preprocessData(this.data, this.filterLegend);
                if (pp) {
                    this.setProperties(pp);
                    this.refresh();
                }

                this._buildSummaryBars();

                // Legend filter may have changed, which affects the selectable items
                this._adjustSelection();
            } catch (e) {
                console.error(`Error processing Waterfall data: ${e.name}: ${e.message}`);
            }
        });
    }

    _dataChanged(cr) {
        if (cr.path !== 'data' && cr.path !== 'data.length') {
            // Some internal data point has changed. Refresh data
            this._change(this.data, this.filterLegend);
        }

        // For now - reset selection whenever the data changes
        this._selectionMgr.selection = null;
    }

    refreshData() {
        this._change(this.data, this.filterLegend);
    }

    _summaryBarsChanged(summaryBars) {
        this._summaryBarsSet = (Array.isArray(summaryBars) && summaryBars.length > 0) && new Set(summaryBars);

        // Only need to recompute the summary if the chart data has been processed
        if (Array.isArray(this._data) && this._data.length > 0) {
            this._buildSummaryBars();
            this.refresh();
        }
    }

    // The waterfall view must be refreshed
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

    // Get function that places bar values
    _setValuePosFunc(xOffs) {
        const yScale = this.yScale;
        const deltaX = this.xScale.bandwidth() / 2;
        const f = (x, y) => `translate(${x}px,${y}px)`;

        if (this.showValues === 'outside' && !this.stacked) {
            return this.flipAxes
                ? (this.reverseYAxis
                    ? (v, y1, y2, i, w, h) => f(yScale(y2) - w, xOffs[i] + deltaX - h / 2)
                    : (v, y1, y2, i, w, h) => f(yScale(y2), xOffs[i] + deltaX - h / 2))
                : (this.reverseYAxis
                    ? (v, y1, y2, i, w, h) => f(xOffs[i] + deltaX - w / 2, yScale(y2))
                    : (v, y1, y2, i, w, h) => f(xOffs[i] + deltaX - w / 2, yScale(y2) - h));
        }
        if (this.showValues === 'inside-end') {
            return this.flipAxes
                ? (this.reverseYAxis
                    ? (v, y1, y2, i, w, h) => f(v < 0 ? yScale(y1) - w : yScale(y2), xOffs[i] + deltaX - h / 2)
                    : (v, y1, y2, i, w, h) => f(v < 0 ? yScale(y1) : yScale(y2) - w, xOffs[i] + deltaX - h / 2))
                : (this.reverseYAxis
                    ? (v, y1, y2, i, w, h) => f(xOffs[i] + deltaX - w / 2, v < 0 ? yScale(y1) : yScale(y2) - h)
                    : (v, y1, y2, i, w, h) => f(xOffs[i] + deltaX - w / 2, v < 0 ? yScale(y1) - h : yScale(y2)));
        }
        // 'inside' is default - and fallback
        return this.flipAxes
            ? (this.reverseYAxis
                ? (v, y1, y2, i, w, h) => f(yScale(y1) - w, xOffs[i] + deltaX - h / 2)
                : (v, y1, y2, i, w, h) => f(yScale(y1), xOffs[i] + deltaX - h / 2))
            : (this.reverseYAxis
                ? (v, y1, y2, i, w, h) => f(xOffs[i] + deltaX - w / 2, yScale(y1))
                : (v, y1, y2, i, w, h) => f(xOffs[i] + deltaX - w / 2, yScale(y1) - h));
    }

    // Get function that rotates bar values. Only used for vertical bars
    _setValueRotatePosFunc(xOffs) {
        const yScale = this.yScale;
        const deltaX = this.xScale.bandwidth() / 2;
        const f = (x, y) => `translate(${x}px,${Math.max(0, y)}px) rotate(-90deg)`;

        if (this.showValues === 'outside' && !this.stacked) {
            return this.reverseYAxis
                ? (v, y1, y2, i, w, h) => f(xOffs[i] + deltaX - h / 2, v < 0 ? yScale(y1) : yScale(y2) + w)
                : (v, y1, y2, i, w, h) => f(xOffs[i] + deltaX - h / 2, v < 0 ? yScale(y1) + w : yScale(y2));
        }
        if (this.showValues === 'inside-end') {
            return this.reverseYAxis
                ? (v, y1, y2, i, w, h) => f(xOffs[i] + deltaX - h / 2, v < 0 ? yScale(y1) + w : yScale(y2))
                : (v, y1, y2, i, w, h) => f(xOffs[i] + deltaX - h / 2, v < 0 ? yScale(y1) : yScale(y2) + w);
        }
        // 'inside' is default - and fallback
        return this.reverseYAxis
            ? (v, y1, y2, i, w, h) => f(xOffs[i] + deltaX - h / 2, v < 0 ? yScale(y2) : yScale(y1) + w)
            : (v, y1, y2, i, w, h) => f(xOffs[i] + deltaX - h / 2, v < 0 ? yScale(y2) + w : yScale(y1));
    }

    // Prepare data before it is viewed:
    // - eliminates out-of-sight x-values
    // - samples big data
    _filterViewData(data0) {
        if (data0.length === 0) {
            return {data: [], xIndex: () => -1};
        }
        const xScale = this.xScale;
        const maxPoints = computeSampleSize(xScale, this.sampleSize);

        // Index to first x-point that is included in current zoom viewport
        const x1 = data0.findIndex(d => xScale(d[0]) !== undefined);

        // Index to last x-point that is included in current zoom viewport
        const x2 = (() => { // findIndex backwards
            for (let i = data0.length - 1; i >= 0; i--) {
                if (xScale(data0[i][0]) !== undefined) {
                    return i;
                }
            }
            return -1;
        })();

        // Default values if no filtering / sampling is needed
        let data = data0;

        if (x1 > 0 || x2 < data0.length - 1) {
            // Zoom filtering
            data = data0.filter((d, i) => (x1 <= i && i <= x2));
            if (data.length > maxPoints && maxPoints > 0) {
                // Add sampling to zooming
                data = sampleArray(data, maxPoints);
            }
        } else if (data.length > maxPoints && maxPoints > 0) {
            // Sample down data set
            data = sampleArray(data, maxPoints);
        }

        // Index mapping function: old x-index => new x-index
        const xIndex = (() => {
            if (data.length === x2 - x1 + 1) {
                // No sampling was applied to data. Straigthforward map
                return x1 > 0 ? i => i - x1 : i => i;
            }
            // Sampling was applied to data. Complex rule to determine original x-index
            const xMap = [];
            let ix = 0;
            for (let i = x1; i <= x2; i++) {
                if (data0[i] === data[ix]) {
                    xMap[i] = ix++;
                }
            }
            console.assert(ix === data.length); // All values should have been mapped
            return i => xMap[i];
        })();

        return {data, xIndex};
    }

    _refreshBars(data, xOffs, barContainer, _selected, unselectableSet, _depfield) {
        const yScale = this.yScale;
        const bandwidth = Math.max(this.xScale.bandwidth(), 1);
        const legend = d => `L${_legend(d)}`;
        const groupX = this.flipAxes ? null : (d, i) => `${xOffs[i]}px`;
        const groupY = this.flipAxes ? (d, i) => `${xOffs[i]}px` : null;
        const groupW = this.flipAxes ? null : `${bandwidth}px`;
        const groupH = this.flipAxes ? `${bandwidth}px` : null;
        const xIndex = (d, i) => xIndexOf(d[2][0]);
        const barW = this.flipAxes ? d => `${Math.abs(yScale(bottomOf(d)) - yScale(topOf(d)))}px` : null;
        const barH = this.flipAxes ? null : d => `${Math.abs(yScale(bottomOf(d)) - yScale(topOf(d)))}px`;
        const barLeft = this.flipAxes ? (this.reverseYAxis ? d => `${yScale(bottomOf(d))}px` : d => `${yScale(topOf(d))}px`) : null;
        const barTop = this.flipAxes ? null : (this.reverseYAxis ? d => `${yScale(topOf(d))}px` : d => `${yScale(bottomOf(d))}px`);

        function setXIndex(d, i) {
            const v = xIndex(d, i);
            this.setAttribute('x-index', v);
            if (unselectableSet && unselectableSet.has(v)) {
                this.setAttribute('unselectable', '');
            } else {
                this.removeAttribute('unselectable');
            }
        }

        function createBarEl(d, i) {
            const el = document.createElement('ptcs-div');
            el.setAttribute('part', 'bar');
            el.setAttribute('state-key', _legend(d));
            return el;
        }

        // Bar groups
        const join = select(barContainer)
            .selectAll('[group]')
            .data(data);

        // Enter
        join.enter()
            .append('div')
            .attr('group', d => d[0])
            .each(setXIndex)
            .style('width', groupW)
            .style('height', groupH)
            .style('left', groupX)
            .style('top', groupY)
            .selectAll('[part=bar]')
            .data(d => d[2])
            .enter()
            .append(createBarEl)
            .attr('type', barType)
            .attr('legend', legend)
            .attr('selected', _selected)
            .property('_depfield', _depfield)
            .style('width', barW)
            .style('height', barH)
            .style('left', barLeft)
            .style('top', barTop);

        // Update
        join.attr('group', d => d[0])
            .each(setXIndex)
            .style('width', groupW)
            .style('height', groupH)
            .style('left', groupX)
            .style('top', groupY);

        // Exit
        join.exit().remove();

        // update / enter / exit for children
        const children = join
            .selectAll('ptcs-div')
            .data(d => d[2]);

        children.enter()
            .append(createBarEl)
            .attr('type', barType)
            .attr('legend', legend)
            .attr('selected', _selected)
            .property('_depfield', _depfield)
            .style('width', barW)
            .style('height', barH)
            .style('left', barLeft)
            .style('top', barTop);

        children
            .attr('legend', legend)
            .attr('state-key', _legend)
            .attr('type', barType)
            .attr('selected', _selected)
            .property('_depfield', _depfield)
            .style('width', barW)
            .style('height', barH)
            .style('left', barLeft)
            .style('top', barTop);

        children.exit().remove();
    }

    _refreshBridges(data, xOffs) {
        const yScale = this.yScale;
        const bandwidth = Math.max(this.xScale.bandwidth(), 1);
        const isSummaryBar = d => !d[2] || d[2].every(v => v[4] === undefined);
        const nextX = i => {
            for (let j = i + 1; j < data.length; j++) {
                if (isSummaryBar(data[j]) || data[i][1] !== data[j][1]) {
                    return xOffs[j];
                }
            }
            return xOffs[data.length - 1];
        };
        const x1 = this.flipAxes
            ? d => yScale(topOf(d))
            : (this.reverseXAxis ? (d, i) => xOffs[i] : (d, i) => xOffs[i] + bandwidth);
        const x2 = this.flipAxes
            ? d => yScale(topOf(d))
            : (this.reverseXAxis
                ? (d, i) => (i + 1 < xOffs.length ? nextX(i) + bandwidth : xOffs[i])
                : (d, i) => (i + 1 < xOffs.length ? nextX(i) : xOffs[i] + bandwidth));
        const y1 = this.flipAxes
            ? (this.reverseXAxis
                ? (d, i) => xOffs[i] + bandwidth
                : (d, i) => xOffs[i])
            : d => yScale(topOf(d));
        const y2 = this.flipAxes
            ? (this.reverseXAxis
                ? (d, i) => (i + 1 < xOffs.length ? nextX(i) : xOffs[i] + bandwidth)
                : (d, i) => (i + 1 < xOffs.length ? nextX(i) + bandwidth : xOffs[i]))
            : d => yScale(topOf(d));

        const type = (d, i) => {
            if (isSummaryBar(d)) {
                return 'sum';
            }
            if (i > 0 && data[i - 1][1] === d[1]) {
                return 'hidden'; // Same value as previous item. Hide.
            }
            const sum = d[2].reduce((a, y) => a + y[4], 0);
            return (sum < 0 ? 'neg' : (sum > 0 ? 'pos' : 'sum'));
        };

        const join = select(this.$.bridges)
            .selectAll('line')
            .data(data);

        // Enter
        join.enter()
            .append('line')
            .attr('part', 'bridge')
            .attr('type', type)
            .attr('x1', x1)
            .attr('x2', x2)
            .attr('y1', y1)
            .attr('y2', y2);

        // Update
        join.attr('type', type)
            .attr('x1', x1)
            .attr('x2', x2)
            .attr('y1', y1)
            .attr('y2', y2);

        // Exit
        join.exit().remove();
    }

    _refreshValues(data, xOffs, xIndex) {
        const yScale = this.yScale;
        const bandwidth = this.xScale.bandwidth();
        const stacked = this.stacked;
        const _xIndex = (d, i) => xIndexOf(d[2][0]);
        const legend = d => `L${_legend(d)}`;

        let rotate = false;

        function checkSizeVertMode(w, h, barHeight) {
            if (h > barHeight && stacked) {
                // Too high
                this.setAttribute('hidden', '');
            } else if (w > bandwidth) {
                // Too wide
                if (h <= bandwidth && (w <= barHeight || !stacked)) {
                    // Fits if rotated though
                    rotate = true;
                } else {
                    this.setAttribute('hidden', '');
                }
            }
        }

        function checkSizeHorzMode(w, h, barWidth) {
            if ((w > barWidth && stacked) || h > bandwidth) {
                this.setAttribute('hidden', '');
            }
        }

        const checkSize = this.flipAxes ? checkSizeHorzMode : checkSizeVertMode;

        const formatNumber = PTCS.formatNumber(this.yValueFormat);

        function createLabelEl(d, i) {
            const el = document.createElement('ptcs-label');
            el.setAttribute('part', 'value');
            el.setAttribute('state-key', _legend(d));
            return el;
        }

        const _depfield = depfield(this._data);

        const _selected = selected(this._selectionMgr);

        // Bar values
        {
            const setPos = this._setValuePosFunc(xOffs);

            function processLabel(d, i) {
                const value = valueOf(d);
                const top = topOf(d);
                const bottom = bottomOf(d);

                this.removeAttribute('hidden');
                this.label = `${formatNumber(value)}`;
                const clientWidth = this.clientWidth;
                const clientHeight = this.clientHeight;
                checkSize.call(this, clientWidth, clientHeight, Math.abs(yScale(bottom) - yScale(top)));

                this.style.transform = setPos(value, top, bottom, xIndex(xIndexOf(d)), clientWidth, clientHeight);
            }

            const join = select(this.$.values)
                .selectAll('.value-legend')
                .data(this.showValues && this.showValues !== 'no' && bandwidth >= 10 ? data : []);

            // Enter
            join.enter()
                .append('div')
                .attr('class', 'value-legend')
                .attr('x-index', _xIndex)
                .selectAll('[part=value]')
                .data(d => d[2])
                .enter()
                .append(createLabelEl)
                .attr('legend', legend)
                .attr('selected', _selected)
                .property('_depfield', _depfield)
                .attr('variant', 'label')
                .property('horizontalAlignment', 'center')
                .each(processLabel);

            // Update
            join.attr('x-index', _xIndex);

            // Exit
            join.exit().remove();

            // update / enter / exit for children
            const children = join
                .selectAll('[part=value]')
                .data(d => d[2]);

            children.exit().remove();

            children
                .attr('legend', legend)
                .attr('state-key', _legend)
                .attr('selected', _selected)
                .property('_depfield', _depfield)
                .each(processLabel);

            children.enter()
                .append(createLabelEl)
                .attr('legend', legend)
                .attr('selected', _selected)
                .property('_depfield', _depfield)
                .attr('variant', 'label')
                .property('horizontalAlignment', 'center')
                .each(processLabel);
        }

        // Aggregated bar value
        {
            const setPos = this._setValuePosFunc(xOffs);

            function processAggrLabel(d, i) {
                const yArr = d[2];
                const ySum = yArr.reduce((a, y) => a + valueOf(y), 0);
                this.removeAttribute('hidden');
                this.label = `${formatNumber(ySum)}`;
                const clientWidth = this.clientWidth;
                const clientHeight = this.clientHeight;
                checkSize.call(this, clientWidth, clientHeight, Number.MAX_SAFE_INTEGER);
                this.style.transform = setPos(ySum, bottomOf(yArr[yArr.length - 1]), topOf(yArr[0]), i, clientWidth, clientHeight);
            }

            const join = select(this.$.aggrvalues)
                .selectAll('ptcs-label')
                .data(this.showValues === 'outside' && stacked && bandwidth >= 10 ? data : []);

            // Update
            join.each(processAggrLabel);

            // Enter
            join.enter()
                .append('ptcs-label')
                .attr('variant', 'label')
                .attr('part', 'value')
                .property('horizontalAlignment', 'center')
                .each(processAggrLabel);

            // Exit
            join.exit().remove();
        }

        // Rotate bar values?
        if (rotate) {
            const setPos = this._setValueRotatePosFunc(xOffs);

            function rotateLabel(d) {
                this.style.transform = setPos(valueOf(d), topOf(d), bottomOf(d), xIndex(xIndexOf(d)), this.clientWidth, this.clientHeight);
            }

            select(this.$.values)
                .selectAll('.value-legend')
                .data(data)
                .selectAll('[part=value]')
                .data(d => d[2])
                .each(rotateLabel);

            // Rotate aggregated values?
            if (this.showValues === 'outside' && stacked) {

                function rotateAggrLabel(d, i) {
                    const yArr = d[2];
                    const ySum = yArr.reduce((a, y) => a + valueOf(y), 0);
                    this.style.transform = setPos(ySum, bottomOf(yArr[yArr.length - 1]), topOf(yArr[0]), i, this.clientWidth, this.clientHeight);
                }

                select(this.$.aggrvalues).selectAll('ptcs-label').each(rotateAggrLabel);
            }
        }
    }


    _refreshSummaryBars() {
        const {data} = this._filterViewData(this._summaryBarsData || []);
        const xOffs = data.map(d => this.xScale(d[0]));

        this._refreshBars(data, xOffs, this.$.summarybars);
    }


    _refreshView() {
        if (!this._data || !this.xScale || !this.yScale) {
            return;
        }
        this._refreshSummaryBars();

        const {data, xIndex} = this._filterViewData(this._data);
        const xOffs = data.map(d => this.xScale(d[0]));

        this._refreshBars(data, xOffs, this.$.bars, selected(this._selectionMgr), this._unselectableSet, depfield(this._data));
        this._refreshBridges(data, xOffs);
        this._refreshValues(data, xOffs, xIndex);

        this._updateFocus();
    }

    _selectPart(el) {
        const part = el.getAttribute('part');
        if (part !== 'bar') {
            return null;
        }
        return {el, xIndex: +el.parentNode.getAttribute('x-index'), yIndex: (+el.getAttribute('legend').substring(1)) - 1};
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

    _clickAction(ev) {
        if (this.disabled) {
            return;
        }
        const _selected = this._selectPart(ev.target);
        if (!_selected) {
            return; // Did not click on a bar
        }
        this._focusOn(_selected);

        const {xIndex, yIndex} = _selected;
        const barData = {
            serieIx: yIndex,
            valueIx: xIndex,
            x:       this._data[xIndex][0],
            y:       valueOf(this._data[xIndex][2][this._filterLegend.indexOf(yIndex)])};

        if (!this._unselectableSet || !this._unselectableSet.has(xIndex)) {
            this._selectionMgr.select(barData);
        }

        this.dispatchEvent(new CustomEvent('series-click', {
            bubbles:  true,
            composed: true,
            detail:   barData}));

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
        this._movedMouse = null;

        if (this.disabled) {
            return;
        }
        if ((!this.zoomDragX && !this.zoomDragY)) {
            this._clickAction(ev);
            return;
        }

        // Mouse down on a bar? Then give it immedate focus.
        const _selected = this._selectPart(ev.target);
        if (_selected) {
            this._focusOn(_selected);
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
        const [dragX, dragY] = this.flipAxes ? [this.zoomDragY, this.zoomDragX] : [this.zoomDragX, this.zoomDragY];
        const x = dragX ? Math.min(x0, ev.clientX) - cntr.left : 0;
        const y = dragY ? Math.min(y0, ev.clientY) - cntr.top : 0;
        const w = dragX ? Math.abs(x0 - ev.clientX) : cntr.width;
        const h = dragY ? Math.abs(y0 - ev.clientY) : cntr.height;

        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        el.style.width = `${w}px`;
        el.style.height = `${h}px`;

        if (this._movedMouse) {
            Object.assign(this._movedMouse, {x, y, w, h});
        } else {
            this._movedMouse = {x, y, w, h, time: Date.now()};
            el.style.display = 'block';
        }
    }

    _mouseUp() {
        const el = this.$.dragrect;
        el.style.display = '';
        if (!this._movedMouse) {
            return;
        }
        const [dragX, dragY] = this.flipAxes ? [this.zoomDragY, this.zoomDragX] : [this.zoomDragX, this.zoomDragY];
        const {x, y, w, h, time} = this._movedMouse;
        this._movedMouse = null;

        if ((!dragX || w < 3) && (!dragY || h < 3)) {
            // Dragged less than 3px. Ignore
            return;
        }
        if (Date.now() - time < 150) {
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
        if (partName !== 'bar') {
            return;
        }
        const xIndex = +el.parentNode.getAttribute('x-index');
        const serie = +(el.getAttribute('legend').substring(1)) - 1;
        const label = this._data[xIndex][0];
        const legend = this.legend ? this.legend[serie].label : `Serie ${serie + 1}`;
        const dataArr = this._data[xIndex][2].find(item => item[0] === serie);
        const formatNumber = PTCS.formatNumber(this.yValueFormat);
        let value = dataArr.length > 4 ? dataArr[4] : valueOf(dataArr);
        const bartype = barType(dataArr);
        const total = formatNumber(this._data[xIndex][1]);

        let tooltip;

        const isStep = bartype !== 'sum';

        let signedValue;

        if (value !== undefined) {
            signedValue = `${formatNumber(value)}`;

            if (bartype === 'pos' && value !== 0) {
                signedValue = `+${formatNumber(value)}`;
            }
        }

        const arg = {showAnyway: true};

        if (this.tooltipTemplate) {
            tooltip = getChartTooltip(this.tooltipTemplate, Object.assign({
                label, total,
                series: legend,
                value:  signedValue,
            }, __dataFields(this._data[xIndex])),
            {
                step: isStep
            });
        } else {
            tooltip = [`${label}, ${legend}: ${signedValue}`];

            if (isStep) {
                tooltip.push(`${total} in total`);
            }
        }

        // Open tooltip for bar
        this.__tooltipEl = el;
        this._tooltipEnter(this.__tooltipEl, ev.clientX, ev.clientY, tooltip, arg);
    }

    _closeTooltip() {
        if (this.__tooltipEl) {
            this._tooltipLeave(this.__tooltipEl);
            this.__tooltipEl = null;
        }
    }

    _findBar({valueIx, serieIx}) {
        return this.$.bars.querySelector(`[x-index="${valueIx}"] > [part=bar][legend=L${serieIx + 1}]`);
    }

    _findValue({valueIx, serieIx}) {
        return this.$.values.querySelector(`[x-index="${valueIx}"] > [part=value][legend=L${serieIx + 1}]`);
    }

    _pickPart(xIndex, yIndex) {
        const el = this._findBar({valueIx: xIndex, serieIx: yIndex});
        return el ? this._selectPart(el) : null;
    }

    _updateFocus() {
        if (!this._focus) {
            return;
        }
        const el = this._pickPart(
            Math.min(this._focus.xIndex, this._data.length - 1),
            Math.min(this._focus.yIndex, this._filterLegend.length - 1));

        this._focusOn(el || this.$.bars.querySelector('[part~=bar]'));
    }

    _initTrackFocus() {
        this._trackFocus(this, () => this._focus && !this._movedMouse ? this._focus.el : null);
    }

    _notifyFocus() {
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
        if (!this._focus) {
            this._focusOn(this.$.bars.querySelector('[part~=bar]'));
            if (!this._focus) {
                return;
            }
        }
        const prev = yIndex => {
            const i = this._filterLegend.findIndex(yi => yi === yIndex);
            return i > 0 ? this._filterLegend[i - 1] : yIndex;
        };

        const next = yIndex => {
            const i = this._filterLegend.findIndex(yi => yi === yIndex);
            return i + 1 < this._filterLegend.length ? this._filterLegend[i + 1] : yIndex;
        };

        let focus = null;
        switch (ev.key) {
            case 'ArrowLeft':
                focus = this._pickPart(this._focus.xIndex - 1, this._focus.yIndex);
                break;
            case 'ArrowRight':
                focus = this._pickPart(this._focus.xIndex + 1, this._focus.yIndex);
                break;
            case 'ArrowUp':
                focus = this._pickPart(this._focus.xIndex, prev(this._focus.yIndex));
                break;
            case 'ArrowDown':
                focus = this._pickPart(this._focus.xIndex, next(this._focus.yIndex));
                break;
            case 'PageUp':
                focus = this._pickPart(this._focus.xIndex, 0);
                break;
            case 'PageDown':
                focus = this._pickPart(this._focus.xIndex, this._filterLegend[this._filterLegend.length - 1]);
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

    selectedChanged(sel, barSelected) {
        let el = this._findBar(sel);
        if (el) {
            if (barSelected) {
                el.setAttribute('selected', '');
            } else {
                el.removeAttribute('selected');
            }
        }

        el = this._findValue(sel);
        if (el) {
            if (barSelected) {
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
        if (this._data) {
            this._data.forEach((row, valueIx) => {
                if (this._unselectableSet && this._unselectableSet.has(valueIx)) {
                    return;
                }
                this._filterLegend.forEach((serieIx, i) => {
                    selection.push({
                        valueIx,
                        serieIx,
                        x: row[0],
                        y: valueOf(row[2][i])});
                });
            });
        }
        this._selectionMgr.selection = selection;
    }

    unselectAll() {
        this._selectionMgr.selection = null;
    }
};

customElements.define(PTCS.ChartCoreWaterfall.is, PTCS.ChartCoreWaterfall);
