import {PolymerElement, html} from '@polymer/polymer/polymer-element.js';
import {PTCS} from 'ptcs-library/library.js';
import {SelectionMgr} from '../selection/chart-selection.js';
import {numberLabel, getChartTooltip} from 'ptcs-library/library-chart.js';
import 'ptcs-behavior-styleable/ptcs-behavior-styleable.js';
import 'ptcs-behavior-focus/ptcs-behavior-focus.js';
import 'ptcs-behavior-tooltip/ptcs-behavior-tooltip.js';
import 'ptcs-div/ptcs-div.js';
import {min, max} from 'd3-array';
import {select} from 'd3-selection';
import {scaleBand} from 'd3-scale';

/* Don't need a warning to make sure I have not confused "=>" with ">=" or "<=" */
/* eslint-disable no-confusing-arrow */

function __date2str(d) {
    const lz = n => n <= 9 ? '0' + n : n;
    const lzz = n => n <= 99 ? '0' + lz(n) : n;
    // eslint-disable-next-line max-len
    return `${d.getFullYear()}-${lz(d.getMonth() + 1)}-${lz(d.getDate())} ${lz(d.getHours())}:${lz(d.getMinutes())}:${lz(d.getSeconds())}.${lzz(d.getMilliseconds())}`;
}

export function __xv(item) {
    const x = item[0];
    if (typeof x === 'string') {
        return x;
    }
    if (x instanceof Date) {
        return __date2str(x);
    }
    return JSON.stringify(x);
}

export function __yv(item) {
    return item[1];
}

const __statesArr = d => d[2] ? d[2] : d[1];

const __statev = function(d, i) {
    return this.parentElement._depfield[i];
};

function compareSelectionObjects(sel1, sel2) {
    if (sel1.valueIx !== sel2.valueIx) {
        return sel1.valueIx - sel2.valueIx;
    }
    return sel1.serieIx - sel2.serieIx;
}

const __dataFields = d => d[3] ? d[3] : {};

PTCS.ChartCoreBar = class extends PTCS.BehaviorTooltip(PTCS.BehaviorFocus(PTCS.BehaviorStyleable(PTCS.ThemableMixin(PolymerElement)))) {
    static get template() {
        return html`
        <style>
        :host {
            width: 100%;
            height: 100%;
            display: block;
            position: relative;

            --tick-offs-r:  var(--tick-offs-neg, -6px);
            --tick-offs-r2: var(--tick-offs-pos, 6px);
            --ptcs-tooltip-start-delay: 100;
        }

        #bars {
            position: absolute;
            top: 0;
            bottom: 0;
            left: 0;
            right: 0;
            overflow: hidden;
        }

        .group-bar, .group-bar2 {
            position: absolute;
        }

        :host(:not([flip-axes])) .group-bar,
        :host(:not([flip-axes])) .group-bar2 {
            top: 0;
            bottom: 0;
        }

        :host([flip-axes]) .group-bar,
        :host([flip-axes]) .group-bar2 {
            left: 0;
            right: 0;
        }

        .bar {
            position: absolute;
            box-sizing: border-box;
            transition: opacity 1000ms;
        }

        .value {
            position: absolute;
            display: flex;
            justify-content: center;
            align-items: center;
            pointer-events: none;
            user-select: none;
        }

        :host([rotate-values]) .value {
            transform: rotate(180deg);
            --rotate-values: 180deg;
            writing-mode: vertical-lr;
            text-orientation: sideways;
        }

        :host([rotate-values]) [part=value] {
            overflow: hidden;
            text-overflow: ellipsis;
        }

        :host(:not([show])) .value {
            display: none;
        }

        :host([hide-values]) .value {
            visibility: hidden;
        }

        :host([show]:not([flip-axes])) .value {
            left: 0;
            right: 0;
            flex-direction: column;
        }

        :host([show]:not([flip-axes]):not([reverse-y-axis])) :not([y2]) > .value {
            bottom: 0;
        }

        :host([show]:not([flip-axes]):not([reverse-y2-axis])) [y2] > .value {
            bottom: 0;
        }

        :host([show]:not([flip-axes])[reverse-y-axis]) :not([y2]) > .value {
            top: 0;
        }

        :host([show]:not([flip-axes])[reverse-y2-axis]) [y2] > .value {
            top: 0;
        }

        :host([show][flip-axes]) .value {
            top: 0;
            bottom: 0;
            flex-direction: row;
        }

        :host([show][flip-axes]:not([reverse-y-axis])) :not([y2]) > .value {
            left: 0;
        }

        :host([show][flip-axes]:not([reverse-y2-axis])) [y2] > .value {
            left: 0;
        }

        :host([show][flip-axes][reverse-y-axis]) :not([y2]) > .value {
            right: 0;
        }

        :host([show][flip-axes][reverse-y2-axis]) [y2] > .value {
            right: 0;
        }

        /* Disable state formatting styles for the hidden bars (bar with undefined values) */
        #bars .bar[part~=bar][hidden-bar] {
            border: none;
        }

        #bars .bar[part~=bar][hidden-bar]::before {
            display: none;
        }

        /* FILTERING */
        div.filter .bar {
            opacity: 0;
        }
        div.filter.L1 .bar[legend=L1] {
            opacity: 1;
        }
        div.filter.L2 .bar[legend=L2] {
            opacity: 1;
        }
        div.filter.L3 .bar[legend=L3] {
            opacity: 1;
        }
        div.filter.L4 .bar[legend=L4] {
            opacity: 1;
        }
        div.filter.L5 .bar[legend=L5] {
            opacity: 1;
        }
        div.filter.L6 .bar[legend=L6] {
            opacity: 1;
        }
        div.filter.L7 .bar[legend=L7] {
            opacity: 1;
        }
        div.filter.L8 .bar[legend=L8] {
            opacity: 1;
        }
        div.filter.L9 .bar[legend=L9] {
            opacity: 1;
        }
        div.filter.L10 .bar[legend=L10] {
            opacity: 1;
        }
        div.filter.L11 .bar[legend=L11] {
            opacity: 1;
        }
        div.filter.L12 .bar[legend=L12] {
            opacity: 1;
        }
        div.filter.L13 .bar[legend=L13] {
            opacity: 1;
        }
        div.filter.L14 .bar[legend=L14] {
            opacity: 1;
        }
        div.filter.L15 .bar[legend=L15] {
            opacity: 1;
        }
        div.filter.L16 .bar[legend=L16] {
            opacity: 1;
        }
        div.filter.L17 .bar[legend=L17] {
            opacity: 1;
        }
        div.filter.L18 .bar[legend=L18] {
            opacity: 1;
        }
        div.filter.L19 .bar[legend=L19] {
            opacity: 1;
        }
        div.filter.L20 .bar[legend=L20] {
            opacity: 1;
        }
        div.filter.L21 .bar[legend=L21] {
            opacity: 1;
        }
        div.filter.L22 .bar[legend=L22] {
            opacity: 1;
        }
        div.filter.L23 .bar[legend=L23] {
            opacity: 1;
        }
        div.filter.L24 .bar[legend=L24] {
            opacity: 1;
        }

        :host(:not([show=outside])) #aggr,
        :host(:not([stack-method]):not([stack-method2])) #aggr,
        :host([stack-method='grouped'][stack-method2='grouped']) #aggr,
        :host([stack-method='grouped']:not([stack-method2])) #aggr,
        :host(:not([stack-method])[stack-method2='grouped']) #aggr {
            display: none;
        }

        #aggr {
            position: absolute;
            left: 0;
            top: 0;
            right: 0;
            bottom: 0;
            pointer-events: none;
        }

        #aggr .value {
            position: absolute;
            display: flex;
            overflow: hidden;
            flex-direction: column;
            align-items: center;
            /*background: rgba(0, 0, 0, 0.3);*/
            box-sizing: border-box;
        }

        :host(:not([flip-axes])) #aggr .value {
            flex-direction: column;
        }

        :host(:not([flip-axes]):not([reverse-y-axis]):not([rotate-values])) #aggr :not([y2])[part=value-pos] {
            justify-content: flex-end;
            top: 0;
        }

        :host(:not([flip-axes]):not([reverse-y2-axis]):not([rotate-values])) #aggr [y2][part=value-pos] {
            justify-content: flex-end;
            top: 0;
        }

        :host(:not([flip-axes]):not([reverse-y-axis]):not([rotate-values])) #aggr :not([y2])[part=value-neg] {
            justify-content: flex-start;
            bottom: 0;
        }

        :host(:not([flip-axes]):not([reverse-y2-axis]):not([rotate-values])) #aggr [y2][part=value-neg] {
            justify-content: flex-start;
            bottom: 0;
        }

        :host(:not([flip-axes])[reverse-y-axis]:not([rotate-values])) #aggr :not([y2])[part=value-pos] {
            justify-content: flex-start;
            bottom: 0;
        }

        :host(:not([flip-axes])[reverse-y2-axis]:not([rotate-values])) #aggr [y2][part=value-pos] {
            justify-content: flex-start;
            bottom: 0;
        }

        :host(:not([flip-axes])[reverse-y-axis]:not([rotate-values])) #aggr :not([y2])[part=value-neg] {
            justify-content: flex-end;
            top: 0;
        }

        :host(:not([flip-axes])[reverse-y2-axis]:not([rotate-values])) #aggr [y2][part=value-neg] {
            justify-content: flex-end;
            top: 0;
        }

        :host([flip-axes]:not([reverse-y-axis])) #aggr :not([y2])[part=value-pos] {
            flex-direction: row;
            justify-content: flex-start;
            right: 0;
        }

        :host([flip-axes]:not([reverse-y2-axis])) #aggr [y2][part=value-pos] {
            flex-direction: row;
            justify-content: flex-start;
            right: 0;
        }

        :host([flip-axes]:not([reverse-y-axis])) #aggr :not([y2])[part=value-neg] {
            flex-direction: row;
            justify-content: flex-end;
            left: 0;
        }

        :host([flip-axes]:not([reverse-y2-axis])) #aggr [y2][part=value-neg] {
            flex-direction: row;
            justify-content: flex-end;
            left: 0;
        }

        :host([flip-axes][reverse-y-axis]) #aggr :not([y2])[part=value-pos] {
            flex-direction: row;
            justify-content: flex-end;
            left: 0;
        }

        :host([flip-axes][reverse-y2-axis]) #aggr [y2][part=value-pos] {
            flex-direction: row;
            justify-content: flex-end;
            left: 0;
        }

        :host([flip-axes][reverse-y-axis]) #aggr :not([y2])[part=value-neg] {
            flex-direction: row;
            justify-content: flex-start;
            right: 0;
        }

        :host([flip-axes][reverse-y2-axis]) #aggr [y2][part=value-neg] {
            flex-direction: row;
            justify-content: flex-start;
            right: 0;
        }

        :host([rotate-values]) #aggr [part=value-pos] {
            justify-content: center;
            align-items: flex-start;
        }

        :host([rotate-values][reverse-y-axis]) #aggr :not([y2])[part=value-pos] {
            align-items: flex-end;
        }

        :host([rotate-values][reverse-y2-axis]) #aggr [y2][part=value-pos] {
            align-items: flex-end;
        }

        :host([rotate-values]) #aggr [part=value-neg] {
            justify-content: center;
            align-items: flex-end;
        }

        :host([rotate-values][reverse-y-axis]) #aggr :not([y2])[part=value-neg] {
            align-items: flex-start;
        }

        :host([rotate-values][reverse-y2-axis]) #aggr [y2][part=value-neg] {
            align-items: flex-start;
        }

        [part=drag-rect] {
            position: absolute;
            pointer-events: none;
            display: none;
            z-index: 11;
        }
        </style>

        <div id="bars" class\$="[[_filterBar(filterLegend)]]"
             disabled="[[disabled]]"
             on-mousemove="_mouseTooltip" on-mouseout="_leaveBars" on-click="_clickOnBars"
             on-mousedown="_mouseDown"
             on-dragstart="_ondragstart"
             ><div id="dragrect" part="drag-rect"></div></div></div>
        <div id="aggr"></div><div id="aggr2"></div>`;
    }

    static get is() {
        return 'ptcs-chart-core-bar';
    }

    static get properties() {
        return {
            // data = [{label, data}, ...] where data is value || [value || [start-value, end-value], ...]
            data: Array,

            // Allow data to be massaged
            _data: {
                type:     Array,
                computed: '_computeData(data.*)',
                observer: '_dataChanged'
            },

            // Legend data, for tooltip
            legend: {
                type:     Array,
                observer: '_computeLegend'
            },

            disabled: {
                type:               Boolean,
                reflectToAttribute: true
            },

            // [L1, L2, ...]
            _legend: Array,

            // Minimun x value in data
            xMin: {
                type:   Number,
                notify: true
            },

            // Maximum x value in data
            xMax: {
                type:   Number,
                notify: true
            },

            // Minimun y value in data
            yMin: {
                type:   Number,
                notify: true
            },

            // Maximum y value in data
            yMax: {
                type:   Number,
                notify: true
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
                observer:           '_flipAxesChanged',
                reflectToAttribute: true
            },

            // Stack bars? falsy || 'auto' || 'expand'
            stackMethod: {
                type:               Object,
                observer:           '_stackMethodChanged',
                reflectToAttribute: true
            },

            // _data arranged for stacked display, if this.stackMethod
            _stackedData: Array,

            // Show values for each bar? 'inside' || 'outside' || 'inside-end'
            showValues: String,

            show: {
                computed:           '_computeShow(showValues)',
                observer:           '_showChanged',
                reflectToAttribute: true
            },

            hideValues: {
                type:               Boolean,
                observer:           '_hideValuesChanged',
                reflectToAttribute: true
            },

            rotateValues: {
                type:               Boolean,
                value:              false,
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

            reverseY2Axis: {
                type:               Boolean,
                reflectToAttribute: true
            },

            filterLegend: {
                type:     Array,
                observer: '_filterLegendChanged'
            },

            // Padding
            groupPadding: {
                type:     String,
                observer: 'refresh'
            },

            // zoom by selecting two elements
            zoomSelect: {
                type: Boolean,
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
                type:               Boolean,
                observer:           '_showY2AxisChanged',
                reflectToAttribute: true
            },

            // Secondary y-axis
            data2: Array,

            // Minimun y value in data2
            y2Min: {
                type:   Object,
                notify: true
            },

            // Maximum y value in data2
            y2Max: {
                type:   Object,
                notify: true
            },

            // Scale that maps y2-positions to y2-axis
            y2Scale: {
                type:     Function,
                observer: 'refresh'
            },

            // Allow data to be massaged
            _data2: {
                type:     Array,
                computed: '_computeData2(data2.*)',
                observer: '_dataChanged2'
            },

            // Stack bars? falsy || 'auto' || 'expand'
            stackMethod2: {
                type:               Object,
                observer:           '_stackMethod2Changed',
                reflectToAttribute: true
            },

            // _data arranged for stacked display, if this.stackMethod
            _stackedData2: Array,

            // Mapping from data y-index to legend: _series[index] = legendIndex
            _series: {
                type:  Array,
                value: []
            },

            _series2: {
                type:  Array,
                value: []
            },

            // 'none' || 'single' || 'multiple'
            selectionMode: {
                type: String
            },

            _selectionMgr: {
                type:  SelectionMgr,
                value: () => new SelectionMgr(compareSelectionObjects)
            },

            // yAxisNumberFormat and y2AxisNumberFormat informs the corresponding axis if it should switch to #% formatting
            yAxisNumberFormat: {
                type:   String,
                notify: true
            },

            y2AxisNumberFormat: {
                type:   String,
                notify: true
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

    _clearElement(el) {
        while (el.firstChild) {
            el.removeChild(el.firstChild);
        }
    }

    _computeShow(showValues) {
        if (showValues === 'inside' || showValues === 'outside' || showValues === 'inside-end') {
            return showValues;
        }
        if (showValues === '' || showValues === true) {
            return 'inside';
        }
        return false;
    }

    _computeData(cr, isY2 = false) {
        const data = isY2 ? this._data2 : this._data;

        // TODO: A bit ugly. Can it be made better?
        if (data === cr.base) {
            // The data will not be automatically refreshed if only some internal data point changed
            // so it must be forced
            this._selectionMgr.selection = null;
            this.refreshData(isY2);
        }

        // No data massage at this time
        return cr.base;
    }

    _computeData2(cr) {
        return this._computeData(cr, true);
    }

    _showY2AxisChanged() {
        this._clearChart();

        this._computeMinMax(true);
        this.refresh();
    }

    _dataChanged(_data) {
        this._selectionMgr.selection = null;
        this.refreshData();
    }

    _dataChanged2(_data2) {
        this._selectionMgr.selection = null;
        this.refreshData(true);
    }

    _stacked(isY2 = false) {
        const stackMethod = isY2 ? this.stackMethod2 : this.stackMethod;

        if (!stackMethod || stackMethod === 'grouped') {
            return false;
        }

        return true;
    }

    _filterLegendChanged() {
        if (this._stacked()) {
            this._clearChart();
            this.refreshData();
        }

        if (this._stacked(true)) {
            this._clearChart();
            this.refreshData(true);
        }

        this._adjustSelection();
    }

    _stackMethodChanged() {
        return this.__stackMethodChanged();
    }

    _stackMethod2Changed() {
        return this.__stackMethodChanged(true);
    }

    __stackMethodChanged(isY2 = false) {
        const yFormat = isY2 ? 'y2AxisNumberFormat' : 'yAxisNumberFormat';

        this._clearChart();
        this._computeMinMax(isY2);

        this[yFormat] = '';

        if (this._stacked(isY2)) {
            this._computeStackedData(isY2);
        }

        // Refresh both axes since we've just cleared the chart
        this.refreshData();
        this.refreshData(isY2);
    }

    // TODO: assign visiblity on common root instead of on each element
    _hideValuesChanged(hideValues) {
        if (!hideValues) {
            const list = this.$.bars.querySelectorAll('.value');
            for (let i = list.length - 1; i >= 0; i--) {
                list[i].style.visibility = '';
            }
        }
    }

    _computeMinMax(isY2 = false) {
        const data = this[isY2 ? '_data2' : '_data'];

        if (!(data instanceof Array)) {
            // Not ready
            return;
        }

        let yMin;
        let yMax;

        if (this._stacked(isY2)) {
            const reduceMin = (t, v) => {
                if (v instanceof Array) {
                    return v[0] < 0 ? Math.min(t, v[0]) : t;
                }
                return v < 0 ? t + v : t;
            };
            const reduceMax = (t, v) => {
                if (v instanceof Array) {
                    return v[1] > 0 ? Math.max(t, v[1]) : t;
                }
                return v > 0 ? t + v : t;
            };
            yMin = min(data.map(d => __yv(d).reduce(reduceMin, 0)));
            yMax = max(data.map(d => __yv(d).reduce(reduceMax, 0)));
        } else {
            data.forEach(d => __yv(d).forEach(v => {
                if (v instanceof Array) {
                    if (!(yMin <= v[0])) {
                        yMin = v[0];
                    }
                    if (!(yMax >= v[1])) {
                        yMax = v[1];
                    }
                } else if (v !== undefined && v !== null) {
                    if (!(yMin <= v)) {
                        yMin = v;
                    }
                    if (!(yMax >= v)) {
                        yMax = v;
                    }
                }
            }));
        }

        const combinedData = this._getData();
        const [xMin, xMax] = combinedData.length ? [__xv(combinedData[0]), __xv(combinedData[combinedData.length - 1])] : [];

        if (isY2) {
            this.setProperties({y2Min: yMin, y2Max: yMax, xMin, xMax});
        } else {
            this.setProperties({yMin, yMax, xMin, xMax});
        }
    }

    // Get data from both data and data2
    _getData() {
        if (!(this.showY2Axis && this.data2)) {
            // No need in 2nd Y Axis data
            return this._data;
        }

        // TODO[1]: Incorporate x-values in data2 that doesn't exist in data - DONE
        // TODO[2]: Reimplement in more efficient way
        // TODO[3]: Place the 2nd yaxis-values in the correct slot, if values from 1st axis is missing

        const data = this._data.reduce((a, c) => {
            const el2 = this._data2.find(e => e[0] === c[0]);
            let arr = c.slice(); // a shallow copy of the array
            if (el2) {
                arr[1] = arr[1].concat(el2[1]);

                // if _depfield array is provided
                if (arr[2] && el2[2]) {
                    arr[2] = arr[2].concat(el2[2]);
                }
            }

            a.push(arr);

            return a;
        }, []);

        this._data2.reduce((a, c) => {
            const el2 = this._data.find(e => e[0] === c[0]);

            if (!el2) {
                a.push(c);
            }
            return a;
        }, data);

        return data;
    }

    _computeLegend(legend) {
        if (legend instanceof Array) {
            this._legend = this.legend.map((d, i) => `L${i + 1}`);
        } else if (this._series) {
            let maxSerie = this._series.length ? max(this._series) : 0;
            if (this.showY2Axis && this.y2Scale && this._series2 && this._series2.length) {
                maxSerie = Math.max(maxSerie, max(this._series2));
            }
            this._legend = [...Array(maxSerie + 1)].map((d, i) => `L${i + 1}`);
        } else {
            console.error('no series');
            this._legend = [];
        }
    }

    _computeStackedData(isY2 = false) {
        if (!this._stacked(isY2) || !this._legend) {
            return;
        }

        const stackMethod = isY2 ? this.stackMethod2 : this.stackMethod;
        const data = (isY2 ? this._data2 : this._data) || [];
        const series = (isY2 ? this._series2 : this._series) || [];
        const depth = series.length;
        const filteredLegend = this.filterLegend;
        const r = [];
        const aggrPos = [];
        const aggrNeg = [];

        if (stackMethod === 'expand') {
            const sum = (t, v) => (t + Math.abs(v));
            let vMin = 0, vMax = 0;

            data.forEach((d, xIndex) => {
                const label = __xv(d);
                const filteredData = __yv(d).filter((v, i) => !filteredLegend || filteredLegend.includes(series[i]));
                const tot = filteredData.reduce(sum, 0);
                let vNeg = 0;
                let vPos = 0;
                let posSum = 0;
                let negSum = 0;
                let posDataPushed = false;
                let negDataPushed = false;

                for (let i = 0; i < depth; i++) {
                    if (filteredLegend && !filteredLegend.includes(series[i])) {
                        continue;
                    }
                    const legend = `L${series[i] + 1}`;
                    let v = __yv(d)[i];
                    const statev = __statesArr(d)[i];
                    if (!(v instanceof Array)) {
                        let origv = v;
                        v = (v === undefined ? 0 : v);

                        if (v < 0) {
                            const v0 = vNeg;
                            vNeg += tot ? 100 * v / tot : 0;
                            negSum += v;
                            r.push([legend, label, vNeg, v0, origv, statev, xIndex]);
                            negDataPushed = true;
                        } else if (v >= 0) {
                            const v0 = vPos;
                            vPos += tot ? 100 * v / tot : 0;
                            posSum += v;
                            r.push([legend, label, v0, vPos, origv, statev, xIndex]);
                            posDataPushed = true;
                        }
                    }
                }

                if (vMin > vNeg) {
                    vMin = vNeg;
                }

                if (vMax < vPos) {
                    vMax = vPos;
                }

                if (posDataPushed) {
                    aggrPos.push([label, posSum, vPos]);
                }

                if (negDataPushed) {
                    aggrNeg.push([label, negSum, vNeg]);
                }

                if (isY2) {
                    this.y2AxisNumberFormat = '#%';
                } else {
                    this.yAxisNumberFormat = '#%';
                }
            });

            if (vMin !== 0 || vMax !== 0) {
                if (isY2) {
                    this.setProperties({y2Min: vMin, y2Max: vMax});
                } else {
                    this.setProperties({yMin: vMin, yMax: vMax});
                }
            } else if (isY2) {
                this.setProperties({y2Min: 0, y2Max: 100});
            } else {
                this.setProperties({yMin: 0, yMax: 100});
            }
        } else {
            data.forEach((d, xIndex) => {
                const label = __xv(d);
                let vNeg = 0;
                let vPos = 0;

                for (let i = 0; i < depth; i++) {
                    if (filteredLegend && !filteredLegend.includes(series[i])) {
                        continue;
                    }
                    let v = __yv(d)[i];
                    const legend = `L${series[i] + 1}`;
                    const statev = __statesArr(d)[i];
                    if (v instanceof Array) {
                        r.push([legend, label, v[0], v[1], `${v[0]}..${v[1]}`]);
                    } else {
                        let origv = v;
                        v = (v === undefined ? 0 : v);

                        if (v < 0) {
                            const v0 = vNeg;
                            vNeg += v;
                            r.push([legend, label, vNeg, v0, origv, statev, xIndex]);
                        } else if (v >= 0) {
                            const v0 = vPos;
                            vPos += v;
                            r.push([legend, label, v0, vPos, origv, statev, xIndex]);
                        }
                    }
                }

                if (r.length) {
                    aggrPos.push([label, vPos]);
                    aggrNeg.push([label, vNeg]);
                }
            });
        }
        if (isY2) {
            this._stackedAggrPos2 = aggrPos;
            this._stackedAggrNeg2 = aggrNeg;
            this._stackedData2 = r;
        } else {
            this._stackedAggrPos = aggrPos;
            this._stackedAggrNeg = aggrNeg;
            this._stackedData = r;
        }
    }

    // Assign the correct legend indexes to this._series / this._series2
    _computeSeries(isY2) {
        const data = isY2 ? this._data2 : this._data;
        this[isY2 ? '_series2' : '_series'] = data.series
            ? [...new Set(data.series)] // Eliminate potential duplicates. (Better safe than sorry)
            : [...Array(data.reduce((r, v) => Math.max(r, __yv(v).length), 0))].map((d, i) => i);
        const f = this.filterLegend instanceof Array ? i => this.filterLegend.includes(i) : () => true;
        this._numSeries1 = (this._series || []).filter(f).length;
        this._numSeries2 = (this._series2 || []).filter(f).length;
    }

    refreshData(isY2 = false) {
        const data = isY2 ? this._data2 : this._data;
        if (!(data instanceof Array)) {
            return;
        }
        this._computeMinMax(isY2);
        this._computeSeries(isY2);
        if (!this.legend) {
            // No legend supplied, so recompute legend based on series
            this._computeLegend();
        }
        this._computeStackedData(isY2);
        this.refresh();
    }

    _flipAxesChanged(flipAxes) {
        this._clearElement(this.$.aggr);
        if (flipAxes) {
            this.rotateValues = false;
            this.hideLabels = false;
        }
        this.refresh();
    }

    _showChanged(/*show*/) {
        this.refresh();
    }

    _clearChart() {
        const el = this.$.dragrect;
        el.parentNode.removeChild(el);
        this._clearElement(this.$.bars);
        this.$.bars.appendChild(el);
        this._clearElement(this.$.aggr);
    }

    _filterBar(filterLegend) {
        if (!(filterLegend instanceof Array)) {
            return '';
        }
        return 'filter ' + filterLegend.map(item => `L${item + 1}`).join(' ');
    }

    // Convert padding format to d3
    _padding(padding) {
        const value = +padding;
        if (value > 0) {
            if (value < 100) {
                return value / 100;
            }
            return 1;
        }
        return 0;
    }

    _scaleLegend(width, _legend) {
        return (this.showY2Axis && this.y2Scale && this._series2)
            ? this._scaleArray(width, [...this._series, ...this._series2].map(i => _legend[i]))
            : this._scaleArray(width, _legend);
    }

    _scaleArray(width, arr) {
        return scaleBand()
            .domain(arr)
            .range([0, width])
            .paddingInner(this._padding(this.groupPadding));
    }

    refresh() {
        if (this.__refreshOn) {
            return;
        }
        this.__refreshOn = true;
        requestAnimationFrame(() => {
            this.__refreshOn = false;
            this.__refresh();
            this._traceFocus();
        });
    }

    __refresh() {
        this.__refreshData();

        if (this.y2Scale) {
            this.__refreshData(true);
        }
    }

    __refreshData(isY2 = false) {
        const emptyState1 = !(this._data && Array.isArray(this._data) && this._data.length);
        const emptyState2 = !(this._data2 && Array.isArray(this._data2) && this._data2.length);
        this._setChartStateDataEmpty(emptyState1 && emptyState2);
        if ((emptyState1 && emptyState2)) {
            return;
        }

        const data = isY2 ? this._data2 : this._data;
        const stackMethod = isY2 ? this.stackMethod2 : this.stackMethod;
        const reverseYAxis = isY2 ? this.reverseY2Axis : this.reverseYAxis;
        const scaleLabel = this.xScale;
        const isStacked = this._stacked(isY2);
        const numSeries = isY2 ? this._numSeries2 : this._numSeries1;
        // Can bar values appear outside of bar?
        const showOutside = !isStacked || numSeries <= 1;

        // eslint-disable-next-line no-nested-ternary
        const scaleValue = isY2 ? (this.showY2Axis ? this.y2Scale : undefined) : this.yScale;

        if (!(data instanceof Array) || !scaleValue || !scaleLabel) {
            return;
        }

        const labelBandwidth = scaleLabel.bandwidth();
        let scaleLegend = this._scaleLegend(labelBandwidth, this._legend);
        let bandWidth = `${Math.max(labelBandwidth, 1)}px`;
        let bandWidth2 = `${Math.max(scaleLegend.bandwidth(), 1)}px`;

        // The following code (if (isY2) statement) is meant to divide the label width between the bars of the primary and secondary Y Axis.
        // We have 4 options: Y grouped, Y2 grouped ; Y grouped Y2 stacked ; Y stacked Y2 stacked ; Y stacked Y2 grouped.
        // In all the cases all the bar widths should be equal. To achieve that the I make scaleLegend
        // to divide the space according to following ranges (according to above order of options):
        // [L1, ..., Ln] ; [L1, ... Ln, 'stacked2'] ; ['stacked1', 'stacked2'] ; ['stacked1', L1, ... , Ln]
        const series = () => this._series ? this._series.map(i => this._legend[i]) : [];
        const series2 = () => this._series2 ? this._series2.map(i => this._legend[i]) : [];
        if (isY2) {
            if (this._stacked(true)) {
                if (this._stacked()) {
                    scaleLegend = this._scaleArray(labelBandwidth, ['stacked1', 'stacked2']);
                    bandWidth = `${Math.max(scaleLegend.bandwidth(), 1)}px`;
                } else {
                    scaleLegend = this._scaleArray(labelBandwidth, [...series(), 'stacked2']);
                    bandWidth = `${Math.max(scaleLegend.bandwidth(), 1)}px`;
                }
            } else if (this._stacked()) {
                scaleLegend = this._scaleArray(labelBandwidth, ['stacked1', ...series2()]);
                bandWidth = `${Math.max(labelBandwidth - scaleLegend('L' + (this._series[0] + 1)), 1)}px`;
                bandWidth2 = `${Math.max(scaleLegend.bandwidth(), 1)}px`;
            } else {
                bandWidth = `${Math.max(labelBandwidth - scaleLegend('L' + (this._series2[0] + 1)), 1)}px`;
            }
        } else if (this.showY2Axis && this.y2Scale) {
            if (this._stacked()) {
                if (this._stacked(true)) {
                    scaleLegend = this._scaleArray(labelBandwidth, ['stacked1', 'stacked2']);
                    bandWidth = `${Math.max(scaleLegend.bandwidth(), 1)}px`;
                } else {
                    scaleLegend = this._scaleArray(labelBandwidth, ['stacked1', ...series2()]);
                    bandWidth = `${Math.max(scaleLegend.bandwidth(), 1)}px`;
                }
            } else if (this._stacked(true)) {
                scaleLegend = this._scaleArray(labelBandwidth, [...series(), 'stacked1']);
                bandWidth = `${Math.max(scaleLegend('L' + (this._series2[0] + 1)) + scaleLegend.bandwidth(), 1)}px`;
                bandWidth2 = `${Math.max(scaleLegend.bandwidth(), 1)}px`;
            } else {
                bandWidth = `${Math.max(scaleLegend('L' + (this._series2[0] + 1)) + scaleLegend.bandwidth(), 1)}px`;
            }
        }

        let z;

        if (typeof scaleValue.range === 'function') {
            if (reverseYAxis) {
                z = Math.min(scaleValue.range()[0], scaleValue(0));
            } else {
                z = Math.min(scaleValue.range()[1], scaleValue(0));
            }
        } else {
            z = scaleValue(0);
        }

        const arg = {scaleLabel, scaleValue, scaleLegend, bandWidth, bandWidth2};
        // Select d3 renderer
        if (reverseYAxis) {
            if (this.flipAxes) {
                const barLength = isStacked
                    ? d => Math.abs(scaleValue(d[3]) - scaleValue(d[2]))
                    : d => {
                        if (d instanceof Array) {
                            return Math.abs(scaleValue(d[1]) - scaleValue(d[0]));
                        }
                        //The Y-axis down from the positive to the negative
                        return Math.abs(scaleValue(d) - z);
                    };

                arg.valueTranslate = '';
                switch (this.show) {
                    case 'outside':
                        if (showOutside) {
                            arg.valueTranslate = d => `translate(-${barLength(d)}px, 0)`;
                        }
                        break;
                    case 'inside-end':
                        arg.valueTranslate = function(d) {
                            return `translate(${Math.min(this.clientWidth - barLength(d), 0)}px, 0)`;
                        };
                        break;
                }

                if (isStacked) {
                    const chartWidth = this.clientWidth;
                    arg.leftValue = d => `${scaleValue(d[3])}px`;
                    arg.valueLeftPos = null;
                    arg.valueRightPos = stackMethod === 'expand'
                        ? d => `${chartWidth - scaleValue(d[2]) + 1}px`
                        : d => `${chartWidth - scaleValue(d[1]) + 1}px`;
                    arg.valueLeftNeg = stackMethod === 'expand'
                        ? d => `${scaleValue(d[2]) + 1}px`
                        : d => `${scaleValue(d[1]) + 1}px`;
                    arg.valueRightNeg = null;
                    this.__d3_vert_stack(Object.assign(arg, {isY2: isY2}));
                    this._checkHorizontalLabels(bandWidth.slice(0, -2));
                } else {
                    arg.barLength = d => `${barLength(d)}px`;

                    arg.leftValue = d => {
                        if (d instanceof Array) {
                            return `${scaleValue(d[1])}px`;
                        }
                        return `${d >= 0 ? scaleValue(d) : z}px`;
                    };

                    this.__d3_vert(Object.assign(arg, {isY2: isY2}));
                    this._checkHorizontalLabels(scaleLegend.bandwidth());
                }
            } else {
                const barLength = isStacked
                    ? d => Math.abs(scaleValue(d[2]) - scaleValue(d[3]))
                    : d => {
                        if (d instanceof Array) {
                            return Math.abs(scaleValue(d[1]) - scaleValue(d[0]));
                        }
                        //The Y-axis up from negative to the positive
                        return Math.abs(scaleValue(d) - z);
                    };

                arg.valueTranslate = ''; // default
                switch (this.show) {
                    case 'outside':
                        if (showOutside) {
                            arg.valueTranslate = d => `translate(0, ${barLength(d)}px) rotate(var(--rotate-values, 0deg))`;

                            arg.maxLabelLength = function(d) {
                                return `${z - barLength(d)}px`;
                            };
                        }
                        break;
                    case 'inside-end':
                        arg.valueTranslate = function(d) {
                            const dim = this.firstElementChild.clientHeight;
                            return `translate(0, ${Math.max(barLength(d) - dim, 0)}px) rotate(var(--rotate-values, 0deg))`;
                        };
                        break;
                }

                if (isStacked) {
                    const chartHeight = this.clientHeight;
                    arg.topValue = d => `${scaleValue(d[2])}px`;
                    arg.valueTopPos = stackMethod === 'expand'
                        ? d => `${scaleValue(d[2])}px`
                        : d => `${scaleValue(d[1])}px`;
                    arg.valueBottomPos = null;
                    arg.valueTopNeg = null;
                    arg.valueBottomNeg = stackMethod === 'expand'
                        ? d => `${chartHeight - scaleValue(d[2])}px`
                        : d => `${chartHeight - scaleValue(d[1])}px`;
                    this.__d3_horz_stack(Object.assign(arg, {isY2: isY2}));
                    this._checkVerticalLabels(bandWidth.slice(0, -2), true);
                } else {
                    arg.topValue = d => {
                        if (d instanceof Array) {
                            return `${scaleValue(d[0])}px`;
                        }
                        return `${d >= 0 ? z : scaleValue(d)}px`;
                    };

                    arg.barLength = d => `${barLength(d)}px`;

                    this.__d3_horz(Object.assign(arg, {isY2: isY2}));
                    this._checkVerticalLabels(scaleLegend.bandwidth(), false);
                }
            }
        } else if (this.flipAxes) {
            const barLength = isStacked
                ? d => Math.abs(scaleValue(d[3]) - scaleValue(d[2]))
                : d => {
                    if (d instanceof Array) {
                        return Math.abs(scaleValue(d[1]) - scaleValue(d[0]));
                    }
                    //The Y-axis down from the negative to the positive
                    return Math.abs(scaleValue(d) - z);
                };

            arg.valueTranslate = '';
            switch (this.show) {
                case 'outside':
                    if (showOutside) {
                        arg.valueTranslate = d => `translate(${barLength(d)}px, 0)`;
                    }
                    break;
                case 'inside-end':
                    arg.valueTranslate = function(d) {
                        return `translate(${Math.max(barLength(d) - this.clientWidth, 0)}px, 0)`;
                    };
                    break;
            }

            if (isStacked) {
                const chartWidth = this.clientWidth;
                arg.leftValue = d => `${scaleValue(d[2])}px`;
                arg.valueLeftPos = stackMethod === 'expand'
                    ? d => `${scaleValue(d[2]) + 1}px`
                    : d => `${scaleValue(d[1]) + 1}px`;
                arg.valueRightPos = null;
                arg.valueLeftNeg = null;
                arg.valueRightNeg = stackMethod === 'expand'
                    ? d => `${chartWidth - scaleValue(d[2]) + 1}px`
                    : d => `${chartWidth - scaleValue(d[1]) + 1}px`;
                this.__d3_vert_stack(Object.assign(arg, {isY2: isY2}));
                this._checkHorizontalLabels(bandWidth.slice(0, -2));
            } else {
                arg.barLength = d => `${barLength(d)}px`;

                arg.leftValue = d => {
                    if (d instanceof Array) {
                        return `${scaleValue(d[0])}px`;
                    }
                    return `${d < 0 ? scaleValue(d) : z}px`;
                };

                this.__d3_vert(Object.assign(arg, {isY2: isY2}));
                this._checkHorizontalLabels(scaleLegend.bandwidth());
            }
        } else {
            const barLength = isStacked
                ? d => Math.abs(scaleValue(d[3]) - scaleValue(d[2]))
                : d => {
                    if (d instanceof Array) {
                        return Math.abs(scaleValue(d[1]) - scaleValue(d[0]));
                    }
                    //The Y-axis up from positive to the negative
                    return Math.abs(scaleValue(d) - z);
                };

            arg.valueTranslate = ''; // default
            switch (this.show) {
                case 'outside':
                    if (showOutside) {
                        arg.valueTranslate = d => `translate(0, -${barLength(d)}px) rotate(var(--rotate-values, 0deg))`;

                        arg.maxLabelLength = function(d) {
                            return `${z - barLength(d)}px`;
                        };
                    }
                    break;
                case 'inside-end':
                    arg.valueTranslate = function(d) {
                        const dim = this.firstElementChild.clientHeight;
                        return `translate(0, ${Math.min(dim - barLength.call(this, d), 0)}px) rotate(var(--rotate-values, 0deg))`;
                    };
                    break;
                default:
            }

            if (isStacked) {
                const chartHeight = this.clientHeight;
                arg.topValue = d => `${scaleValue(d[3]) + 1}px`;
                arg.valueTopPos = null;
                arg.valueBottomPos = stackMethod === 'expand'
                    ? d => `${chartHeight - scaleValue(d[2])}px`
                    : d => `${chartHeight - scaleValue(d[1])}px`;
                arg.valueTopNeg = stackMethod === 'expand'
                    ? d => `${scaleValue(d[2])}px`
                    : d => `${scaleValue(d[1])}px`;
                arg.valueBottomNeg = null;

                this.__d3_horz_stack(Object.assign(arg, {isY2: isY2}));
                this._checkVerticalLabels(bandWidth.slice(0, -2), true);
            } else {
                arg.topValue = d => {
                    if (d instanceof Array) {
                        return `${scaleValue(d[1])}px`;
                    }
                    return `${scaleValue(d >= 0 ? d : 0)}px`;
                };

                arg.barLength = d => `${barLength(d)}px`;

                this.__d3_horz(Object.assign(arg, {isY2: isY2}));
                this._checkVerticalLabels(scaleLegend.bandwidth(), false);
            }
        }
    }

    __d3_horz({scaleLabel, scaleLegend, bandWidth, bandWidth2, topValue, barLength, valueTranslate, maxLabelLength, isY2}) {
        const series = isY2 ? this._series2 : this._series;

        const firstIndexScale = scaleLegend(`L${series[0] + 1}`);

        const groupBarX = d => `translate(${firstIndexScale + scaleLabel(__xv(d))}px,1px)`;

        const y2attr = isY2 ? '' : null;

        const groupBarHide = d => (scaleLabel(__xv(d)) === undefined ? 'none' : '');

        const barText = d => numberLabel(d instanceof Array ? d[1] : d);
        const barHide = d => (barText(d) === undefined ? '' : null);

        const getIndex = (d, i) => i;

        const stateKey = (d, i) => `${series[i] + 1}`;

        const createBarEl = (d, i) => {
            const barEl = document.createElement('ptcs-div');
            barEl.setAttribute('part', 'bar');
            barEl.setAttribute('state-key', stateKey(d, i));
            return barEl;
        };

        const legend = (d, i) => `L${series[i] + 1}`;

        const leftValue = (d, i) => `${scaleLegend('L' + (series[i] + 1)) - firstIndexScale}px`;

        const selectionMgr = this._selectionMgr;

        function selected(d, i) {
            const valueIx = +this.parentNode.getAttribute('x-index');
            return selectionMgr.isSelected({valueIx, serieIx: series[i]}) ? '' : undefined;
        }

        // eslint-disable-next-line no-nested-ternary
        const data = isY2 ? (this.showY2Axis ? this._data2 : []) : this._data;

        // Fill the holes in the data
        data.forEach(el => {
            const yArr = __yv(el);

            if (yArr.length < series.length) {
                yArr.length = series.length;
            }
        });

        const groupClass = isY2 ? 'group-bar2' : 'group-bar';

        // JOIN new data with old elements
        const join = select(this.$.bars)
            .selectAll(`div.${groupClass}`)
            .data(data);

        // EXIT old elements not present in new data
        join.exit().remove();

        // UPDATE old elements present in new data
        join
            .style('width', bandWidth)
            .style('height', null)
            .style('display', groupBarHide)
            .style('transform', groupBarX)
            .attr('x-index', getIndex)
            .property('_depfield', __statesArr);

        // ENTER new elements present in new data
        let jtmp = join.enter()
            .append('div')
            .attr('class', groupClass)
            .style('width', bandWidth)
            .style('display', groupBarHide)
            .style('transform', groupBarX)
            .attr('x-index', getIndex)
            .property('_depfield', __statesArr)
            .selectAll('.bar')
            .data(d => __yv(d))
            .enter()
            .append(createBarEl)
            .property('_depfield', __statev)
            .attr('class', 'bar')
            .attr('Y2', y2attr)
            .attr('legend', legend)
            .attr('selected', selected)
            .attr('hidden-bar', barHide)
            .style('width', bandWidth2)
            .style('left', leftValue)
            .style('top', topValue)
            .style('height', barLength)
            .append('div')
            .attr('class', 'value');
        // Must apply barText before transform
        jtmp.append('div')
            .attr('part', 'value')
            .text(barText)
            .style('max-height', maxLabelLength);
        jtmp.style('transform', valueTranslate);

        // update / enter / exit for children
        const children = join
            .selectAll('.bar')
            .data(d => __yv(d));

        jtmp = children
            .property('_depfield', __statev)
            .attr('legend', legend)
            .attr('selected', selected)
            .attr('hidden-bar', barHide)
            .attr('Y2', y2attr)
            .attr('state-key', stateKey)
            .style('width', bandWidth2)
            .style('left', leftValue)
            .style('top', topValue)
            .style('height', barLength)
            .select('.value');
        // Must apply barText before transform
        jtmp.select('div')
            .text(barText);
        jtmp.style('transform', valueTranslate);

        children.exit().remove();

        jtmp = children.enter()
            .append(createBarEl)
            .property('_depfield', __statev)
            .attr('class', 'bar')
            .attr('Y2', y2attr)
            .attr('legend', legend)
            .attr('selected', selected)
            .attr('hidden-bar', barHide)
            .style('width', bandWidth2)
            .style('left', leftValue)
            .style('top', topValue)
            .style('height', barLength)
            .append('div')
            .attr('class', 'value');
        // Must apply barText before transform
        jtmp.append('div')
            .attr('part', 'value')
            .text(barText);
        jtmp.style('transform', valueTranslate);
    }

    __d3_vert({scaleLabel, scaleLegend, bandWidth, bandWidth2, leftValue, barLength, valueTranslate, isY2}) {
        const series = isY2 ? this._series2 : this._series;

        const firstIndexScale = scaleLegend(`L${series[0] + 1}`);

        const groupBarY = d => `translate(0,${firstIndexScale + scaleLabel(__xv(d))}px)`;

        const y2attr = isY2 ? '' : null;

        const groupBarHide = d => (scaleLabel(__xv(d)) === undefined ? 'none' : '');

        const barText = d => numberLabel(d instanceof Array ? d[1] : d);
        const barHide = d => (barText(d) === undefined ? '' : null);

        const getIndex = (d, i) => i;

        const stateKey = (d, i) => `${series[i] + 1}`;

        const createBarEl = (d, i) => {
            const barEl = document.createElement('ptcs-div');
            barEl.setAttribute('part', 'bar');
            barEl.setAttribute('state-key', stateKey(d, i));
            return barEl;
        };

        const legend = (d, i) => `L${series[i] + 1}`;

        const topValue = (d, i) => `${scaleLegend('L' + (series[i] + 1)) - firstIndexScale}px`;

        const selectionMgr = this._selectionMgr;

        function selected(d, i) {
            const valueIx = +this.parentNode.getAttribute('x-index');
            return selectionMgr.isSelected({valueIx, serieIx: series[i]}) ? '' : undefined;
        }

        // eslint-disable-next-line no-nested-ternary
        const data = isY2 ? (this.showY2Axis ? this._data2 : []) : this._data;

        // Fill the holes in the data
        data.forEach(el => {
            const yArr = __yv(el);

            if (yArr.length < series.length) {
                yArr.length = series.length;
            }
        });

        const groupClass = isY2 ? 'group-bar2' : 'group-bar';

        // JOIN new data with old elements
        const join = select(this.$.bars)
            .selectAll(`div.${groupClass}`)
            .data(data);

        // EXIT old elements not present in new data
        join.exit().remove();

        // UPDATE old elements present in new data
        join
            .style('width', null)
            .style('height', bandWidth)
            .style('display', groupBarHide)
            .style('transform', groupBarY)
            .attr('x-index', getIndex)
            .property('_depfield', __statesArr);

        // ENTER new elements present in new data
        let jtmp = join.enter()
            .append('div')
            .attr('class', groupClass)
            .style('height', bandWidth)
            .style('display', groupBarHide)
            .style('transform', groupBarY)
            .attr('x-index', getIndex)
            .property('_depfield', __statesArr)
            .selectAll('.bar')
            .data(d => __yv(d))
            .enter()
            .append(createBarEl)
            .property('_depfield', __statev)
            .attr('class', 'bar')
            .attr('Y2', y2attr)
            .attr('legend', legend)
            .attr('selected', selected)
            .attr('hidden-bar', barHide)
            .style('height', bandWidth2)
            .style('top', topValue)
            .style('left', leftValue)
            .style('width', barLength)
            .append('div')
            .attr('class', 'value');
        // Must apply barText before transform
        jtmp.append('div')
            .attr('part', 'value')
            .text(barText);
        jtmp.style('transform', valueTranslate);

        // update / enter / exit for children
        const children = join
            .selectAll('.bar')
            .data(d => __yv(d));

        jtmp = children
            .property('_depfield', __statev)
            .attr('legend', legend)
            .attr('selected', selected)
            .attr('hidden-bar', barHide)
            .attr('Y2', y2attr)
            .attr('state-key', stateKey)
            .style('height', bandWidth2)
            .style('top', topValue)
            .style('left', leftValue)
            .style('width', barLength)
            .select('.value');
        // Must apply barText before transform
        jtmp.select('div')
            .text(barText);
        jtmp.style('transform', valueTranslate);

        children.exit().remove();

        jtmp = children.enter()
            .append(createBarEl)
            .property('_depfield', __statev)
            .attr('class', 'bar')
            .attr('Y2', y2attr)
            .attr('legend', legend)
            .attr('selected', selected)
            .attr('hidden-bar', barHide)
            .style('height', bandWidth2)
            .style('top', topValue)
            .style('left', leftValue)
            .style('width', barLength)
            .append('div')
            .attr('class', 'value');
        // Must apply barText before transform
        jtmp.append('div')
            .attr('part', 'value')
            .text(barText);
        jtmp.style('transform', valueTranslate);
    }

    // eslint-disable-next-line max-len
    __d3_horz_stack({scaleValue, scaleLabel, scaleLegend, bandWidth, topValue, valueTopPos, valueBottomPos, valueTopNeg, valueBottomNeg, isY2, valueTranslate}) {
        const barHide = d => (d[4] === undefined ? '' : null);
        const barDisplay = d => (scaleLabel(d[1]) === undefined ? 'none' : '');
        const barText = d => (d[4] === undefined ? 'N/A' : numberLabel(d[4]));
        const aggrText = d => numberLabel(d[1]);
        const aggrHide = d => (scaleLabel(d[0]) === undefined ? 'none' : '');
        const barHeight = d => `${Math.abs(scaleValue(d[3]) - scaleValue(d[2]))}px`;
        const leftOffset = scaleLegend(isY2 ? 'stacked2' : 'stacked1') || 0;
        const leftValue = d => `${leftOffset + scaleLabel(d[1])}px`;
        const legend = d => d[0];
        const xIndex = d => d[6];
        const selected = d => this._selectionMgr.isSelected({valueIx: d[6], serieIx: +d[0].substring(1) - 1}) ? '' : undefined;

        const createBarEl = (d) => {
            const barEl = document.createElement('ptcs-div');
            barEl.setAttribute('part', 'bar');
            if (d[0]) {
                barEl.setAttribute('state-key', d[0].substring(1)); // remove the leading "L"
            }
            return barEl;
        };

        // eslint-disable-next-line no-nested-ternary
        const data = isY2 ? (this.showY2Axis ? this._stackedData2 : []) : this._stackedData;

        const y2attr = isY2 ? '' : null;

        const join = select(this.$.bars)
            .selectAll(`ptcs-div.bar${isY2 ? '[Y2]' : ''}`)
            .data(data);

        // EXIT old elements not present in new data
        join.exit().remove();

        // UPDATE old elements present in new data
        let jtmp = join
            .attr('x-index', xIndex)
            .attr('legend', legend)
            .attr('selected', selected)
            .attr('state-key', d => d[0].substring(1))
            .attr('hidden-bar', barHide)
            .property('_xvalue', d => d[1])
            .property('_depfield', d => d[5])
            .style('width', bandWidth)
            .style('height', barHeight)
            .style('left', leftValue)
            .style('top', topValue)
            .style('display', barDisplay)
            .select('.value');
        // Must apply barText before transform
        jtmp.select('div')
            .text(barText);
        jtmp.style('transform', valueTranslate);

        // ENTER new elements present in new data
        jtmp = join.enter()
            .append(createBarEl)
            .attr('class', 'bar')
            .attr('Y2', y2attr)
            .attr('x-index', xIndex)
            .attr('legend', legend)
            .attr('selected', selected)
            .attr('hidden-bar', barHide)
            .property('_xvalue', d => d[1])
            .property('_depfield', d => d[5])
            .style('width', bandWidth)
            .style('height', barHeight)
            .style('left', leftValue)
            .style('top', topValue)
            .style('display', barDisplay)
            .append('div')
            .attr('class', 'value');
        // Must apply barText before transform
        jtmp.append('div')
            .attr('part', 'value')
            .text(barText);
        jtmp.style('transform', valueTranslate);

        if (this.show === 'outside') {
            const numSeries = isY2 ? this._numSeries2 : this._numSeries1;

            // eslint-disable-next-line no-nested-ternary
            const aggrPos = isY2 ? (this.showY2Axis ? this._stackedAggrPos2 : []) : this._stackedAggrPos;
            // eslint-disable-next-line no-nested-ternary
            const aggrNeg = isY2 ? (this.showY2Axis ? this._stackedAggrNeg2 : []) : this._stackedAggrNeg;

            let leftAggrValue = d => `${scaleLabel(d[0])}px`;
            if (isY2) {
                leftAggrValue = d => `${scaleLabel(d[0]) + leftOffset}px`;
            }

            const join2 = select(this.$.aggr)
                .selectAll(`[part=value-pos]${isY2 ? '[Y2]' : ''}`)
                .data(numSeries > 1 ? aggrPos : []);

            // EXIT old elements not present in new data
            join2.exit().remove();

            // UPDATE old elements present in new data
            join2
                .style('width', bandWidth)
                .style('left', leftAggrValue)
                .style('top', valueTopPos)
                .style('bottom', valueBottomPos)
                .style('display', aggrHide)
                .select('div')
                .text(aggrText);

            // ENTER new elements present in new data
            join2.enter()
                .append('div')
                .attr('class', 'value')
                .attr('part', 'value-pos')
                .attr('Y2', y2attr)
                .style('width', bandWidth)
                .style('left', leftAggrValue)
                .style('top', valueTopPos)
                .style('bottom', valueBottomPos)
                .style('display', aggrHide)
                .append('div')
                .attr('part', 'value')
                .text(aggrText);

            const join3 = select(this.$.aggr)
                .selectAll(`[part=value-neg]${isY2 ? '[Y2]' : ''}`)
                .data(numSeries > 1 ? aggrNeg : []);

            // EXIT old elements not present in new data
            join3.exit().remove();

            // UPDATE old elements present in new data
            join3
                .style('width', bandWidth)
                .style('left', leftAggrValue)
                .style('top', valueTopNeg)
                .style('bottom', valueBottomNeg)
                .style('display', aggrHide)
                .select('div')
                .text(aggrText);

            // ENTER new elements present in new data
            join3.enter()
                .append('div')
                .attr('class', 'value')
                .attr('part', 'value-neg')
                .attr('Y2', y2attr)
                .style('width', bandWidth)
                .style('left', leftAggrValue)
                .style('top', valueTopNeg)
                .style('bottom', valueBottomNeg)
                .style('display', aggrHide)
                .append('div')
                .attr('part', 'value')
                .text(aggrText);
        }
    }

    // eslint-disable-next-line max-len
    __d3_vert_stack({scaleValue, scaleLabel, scaleLegend, bandWidth, leftValue, valueLeftPos, valueRightPos, valueLeftNeg, valueRightNeg, isY2, valueTranslate}) {
        const barHide = d => (d[4] === undefined ? '' : null);
        const barDisplay = d => (scaleLabel(d[1]) === undefined ? 'none' : '');
        const barText = d => (d[4] === undefined ? 'N/A' : numberLabel(d[4]));
        const aggrText = d => numberLabel(d[1]);
        const aggrHide = d => (scaleLabel(d[0]) === undefined ? 'none' : '');
        const barWidth = d => `${Math.abs(scaleValue(d[3]) - scaleValue(d[2]))}px`;
        const legend = d => d[0];
        const xIndex = d => d[6];
        const selected = d => this._selectionMgr.isSelected({valueIx: d[6], serieIx: +d[0].substring(1) - 1}) ? '' : undefined;

        let topOffset = scaleLegend(isY2 ? 'stacked2' : 'stacked1') || 0;
        let barTop = d => `${topOffset + scaleLabel(d[1])}px`;

        const createBarEl = (d) => {
            const barEl = document.createElement('ptcs-div');
            barEl.setAttribute('part', 'bar');
            if (d[0]) {
                barEl.setAttribute('state-key', d[0].substring(1)); // remove the leading "L"
            }
            return barEl;
        };

        // eslint-disable-next-line no-nested-ternary
        const data = isY2 ? (this.showY2Axis ? this._stackedData2 : []) : this._stackedData;

        const y2attr = isY2 ? '' : null;

        const join = select(this.$.bars)
            .selectAll(`ptcs-div.bar${isY2 ? '[Y2]' : ''}`)
            .data(data);

        // EXIT old elements not present in new data
        join.exit().remove();

        // UPDATE old elements present in new data
        let jtmp = join
            .attr('x-index', xIndex)
            .attr('legend', legend)
            .attr('selected', selected)
            .attr('state-key', d => d[0].substring(1))
            .attr('hidden-bar', barHide)
            .property('_xvalue', d => d[1])
            .property('_depfield', d => d[5])
            .style('height', bandWidth)
            .style('width', barWidth)
            .style('top', barTop)
            .style('left', leftValue)
            .style('display', barDisplay)
            .select('.value');
        // Must apply barText before transform
        jtmp.select('div')
            .text(barText);
        jtmp.style('transform', valueTranslate);

        // ENTER new elements present in new data
        jtmp = join.enter()
            .append(createBarEl)
            .attr('class', 'bar')
            .attr('Y2', y2attr)
            .attr('x-index', xIndex)
            .attr('legend', legend)
            .attr('selected', selected)
            .attr('hidden-bar', barHide)
            .property('_xvalue', d => d[1])
            .property('_depfield', d => d[5])
            .style('height', bandWidth)
            .style('width', barWidth)
            .style('top', barTop)
            .style('left', leftValue)
            .style('display', barDisplay)
            .append('div')
            .attr('class', 'value');
        // Must apply barText before transform
        jtmp.append('div')
            .attr('part', 'value')
            .text(barText);
        jtmp.style('transform', valueTranslate);

        if (this.show === 'outside') {
            const numSeries = isY2 ? this._numSeries2 : this._numSeries1;

            // eslint-disable-next-line no-nested-ternary
            const aggrPos = isY2 ? (this.showY2Axis ? this._stackedAggrPos2 : []) : this._stackedAggrPos;
            // eslint-disable-next-line no-nested-ternary
            const aggrNeg = isY2 ? (this.showY2Axis ? this._stackedAggrNeg2 : []) : this._stackedAggrNeg;

            let topAggrValue = d => `${scaleLabel(d[0])}px`;
            if (isY2) {
                topAggrValue = d => `${scaleLabel(d[0]) + topOffset}px`;
            }

            const join2 = select(this.$.aggr)
                .selectAll(`[part=value-pos]${isY2 ? '[Y2]' : ''}`)
                .data(numSeries > 1 ? aggrPos : []);

            // EXIT old elements not present in new data
            join2.exit().remove();

            // UPDATE old elements present in new data
            join2
                .style('height', bandWidth)
                .style('top', topAggrValue)
                .style('left', valueLeftPos)
                .style('right', valueRightPos)
                .style('display', aggrHide)
                .select('div')
                .text(aggrText);

            // ENTER new elements present in new data
            join2.enter()
                .append('div')
                .attr('class', 'value')
                .attr('part', 'value-pos')
                .attr('Y2', y2attr)
                .style('height', bandWidth)
                .style('top', topAggrValue)
                .style('left', valueLeftPos)
                .style('right', valueRightPos)
                .style('display', aggrHide)
                .append('div')
                .attr('part', 'value')
                .text(aggrText);

            const join3 = select(this.$.aggr)
                .selectAll(`[part=value-neg]${isY2 ? '[Y2]' : ''}`)
                .data(numSeries > 1 ? aggrNeg : []);

            // EXIT old elements not present in new data
            join3.exit().remove();

            // UPDATE old elements present in new data
            join3
                .style('height', bandWidth)
                .style('top', topAggrValue)
                .style('left', valueLeftNeg)
                .style('right', valueRightNeg)
                .style('display', aggrHide)
                .select('div')
                .text(aggrText);

            // ENTER new elements present in new data
            join3.enter()
                .append('div')
                .attr('class', 'value')
                .attr('part', 'value-neg')
                .attr('Y2', y2attr)
                .style('height', bandWidth)
                .style('top', topAggrValue)
                .style('left', valueLeftNeg)
                .style('right', valueRightNeg)
                .style('display', aggrHide)
                .append('div')
                .attr('part', 'value')
                .text(aggrText);
        }
    }

    _checkHideOverflows(list, barWidth, hideOverflows) {
        if (this.rotateValues) {
            let w = 0;
            for (let i = 0; i < list.length && w === 0; i++) {
                w = list[i].firstChild.scrollWidth;
            }
            this.hideValues = w > 1.3 * barWidth; // Allow 30% overflow
        } else {
            this.hideValues = false;
        }

        if (!hideOverflows || this.hideValues) {
            return;
        }

        for (let i = list.length - 1; i >= 0; i--) {
            const el = list[i];
            const ch = el.parentNode.clientHeight;
            const sw = el.firstChild.clientWidth;
            const sh = el.firstChild.clientHeight;
            const overflows = sw > barWidth || sh > ch;
            el.style.visibility = overflows ? 'hidden' : '';
        }
    }

    _checkVerticalLabels(barWidth, hideOverflows) {
        if (!this.show) {
            return;
        }
        this.__cl = this.__cl ? this.__cl + 1 : 1;
        this.__hideOverflows = this.__hideOverflows || hideOverflows;
        const __cl = this.__cl;
        requestAnimationFrame(() => {
            if (__cl !== this.__cl) {
                return; // This processing is obsolete
            }
            const list1 = this.$.bars.querySelectorAll('.value');
            const list2 = this.$.aggr.querySelectorAll('.value');
            const test = this.rotateValues
                // Test if rotated labels needs to stay rotated
                ? el => el.firstChild.clientHeight > barWidth
                // Test if non-rotated labels still needs to rotate
                : el => el.firstChild.clientWidth > barWidth;
            let rotateValues = false;
            if (this.show === 'outside') {
                for (let i = list2.length - 1; i >= 0; i--) {
                    if (test(list2[i])) {
                        rotateValues = true;
                        break;
                    }
                }
            }
            if (!rotateValues) {
                for (let i = list1.length - 1; i >= 0; i--) {
                    if (test(list1[i])) {
                        rotateValues = true;
                        break;
                    }
                }
            }

            if (this.rotateValues !== rotateValues) {
                // Rotate first, then check if labels should be hidden
                this.rotateValues = rotateValues;
                requestAnimationFrame(() => this._checkHideOverflows(list1, barWidth, this.__hideOverflows));
                if (this.showValues === 'inside-end') {
                    // inside-end values needs to reposition because they depend on their heights, which changes when they are rotated
                    this.refresh();
                }
            } else {
                this._checkHideOverflows(list1, barWidth, this.__hideOverflows);
            }
            this.__hideOverflows = false;
        });
    }

    _checkHorizontalLabels(barHeight) {
        if (!this.show) {
            return;
        }

        // Find first non-hidden value
        const list1 = this.$.bars.querySelectorAll('.value');
        let h = 0;
        for (let i = 0; i < list1.length && h === 0; i++) {
            h = list1[i].firstChild.clientHeight;
        }
        this.hideValues = h > 1.5 * barHeight; // Allow values to overlap 50% (its mainly leading anyway)
        if (this.hideValues) {
            return;
        }
        this.__cl = this.__cl ? this.__cl + 1 : 1;
        const __cl = this.__cl;
        requestAnimationFrame(() => {
            if (__cl !== this.__cl) {
                return; // This processing is obsolete
            }
            for (let i = list1.length - 1; i >= 0; i--) {
                const el = list1[i];
                const overflows = el.firstChild.clientWidth > el.parentNode.clientWidth || el.firstChild.clientHeight > barHeight;
                el.style.visibility = overflows ? 'hidden' : '';
            }
            if (this._stacked() || this._stacked(true)) {
                const list2 = this.$.aggr.querySelectorAll('.value');
                for (let i = list2.length - 1; i >= 0; i--) {
                    const el = list2[i];
                    const overflows = el.firstChild.clientWidth > el.clientWidth || el.firstChild.clientHeight > barHeight;
                    el.style.visibility = overflows ? 'hidden' : '';
                }
            }
        });
    }

    _getBarEl(el) {
        if (!el || !el.parentNode) {
            return null;
        }

        const p = el.getAttribute('part');
        if (!p || !p.split(' ')[0] === 'bar') {
            return null;
        }

        const valueIx = el.parentNode.hasAttribute('x-index')
            ? +el.parentNode.getAttribute('x-index') // Grouped bar
            : +el.getAttribute('x-index'); // Stacked bar
        if (!(valueIx >= 0)) {
            return null;
        }

        const legend = el.getAttribute('legend');
        if (typeof legend !== 'string' || legend[0] !== 'L') {
            return null;
        }
        const serieIx = +legend.substring(1);
        if (!(serieIx >= 1)) {
            return null;
        }
        if (this.filterLegend && !this.filterLegend.includes(serieIx - 1)) { // don't return the element if it's filtered by the legend filter
            return null;
        }

        const isY2 = el.hasAttribute('Y2');
        const xvalue = __xv((isY2 ? this._data2 : this._data)[valueIx]);

        return {el, serieIx: serieIx - 1, valueIx, isY2, xvalue};
    }

    _findBar({valueIx, serieIx}) {
        // NOTE: need different selectors for grouped and stacked bars
        // eslint-disable-next-line max-len
        return this.$.bars.querySelector(`[x-index="${valueIx}"] > [part~=bar][legend=L${serieIx + 1}], [part~=bar][x-index="${valueIx}"][legend=L${serieIx + 1}]`);
    }

    _mouseTooltip(ev) {
        const bar = this._getBarEl(ev.target);
        if (!bar) {
            this._closeTooltip();
            return;
        }
        const {el, serieIx, valueIx, isY2} = bar;
        if (el === this.__tooltipEl) {
            return;
        }
        this._closeTooltip();

        const _legend = index => {
            if (this.legend && this.legend[index]) {
                return this.legend[index].label || this.legend[index];
            }
            return `Serie ${index + 1}`;
        };

        const v = (isY2 ? this._data2 : this._data)[valueIx];

        // Open tooltip for marker
        this.__tooltipEl = el;
        const yIndex = (isY2 ? this._series2 : this._series).findIndex(i => i === serieIx);
        const yV = __yv(v)[yIndex];
        const label = __xv(v);
        const series = _legend(serieIx);
        const value = yV === undefined ? 'N/A' : yV;
        let tooltip;

        if (this.tooltipTemplate) {
            tooltip = getChartTooltip(this.tooltipTemplate, Object.assign({
                label, series, value
            }, __dataFields(v)));
        } else {
            tooltip = `${label}, ${series}: ${value}`;
        }

        this._tooltipEnter(this.__tooltipEl, ev.clientX, ev.clientY, tooltip, {showAnyway: true});
    }

    _closeTooltip() {
        if (this.__tooltipEl) {
            this._tooltipLeave(this.__tooltipEl);
            this.__tooltipEl = null;
        }
    }

    _leaveBars() {
        this._closeTooltip();
    }

    _clickOnBars(ev) {
        if (this.disabled) {
            return;
        }
        const _selected = this._getBarEl(ev.target);
        if (!_selected) {
            return; // Did not click on a bar
        }
        this._focusOn(_selected);

        const {serieIx, valueIx} = _selected;
        const v = (_selected.isY2 ? this.data2 : this.data)[valueIx];
        const yIndex = (_selected.isY2 ? this._series2 : this._series).findIndex(ix => ix === serieIx);
        const barData = {serieIx, valueIx, x: __xv(v), y: __yv(v)[yIndex]};

        this._selectionMgr.select(barData);

        this.dispatchEvent(new CustomEvent('series-click', {
            bubbles:  true,
            composed: true,
            detail:   barData
        }));

        // Has a zoom range been selected?
        if (!this.zoomSelect) {
            return; // Not in zoom selection mode
        }
        if (!this._selectionMgr.selection || this._selectionMgr.selection.length < 2) {
            return; // Don't have two selected bars
        }

        // Report selected range
        const el1 = this._findBar(this._selectionMgr.selection[0]);
        const el2 = this._findBar(this._selectionMgr.selection[1]);
        this._selectionMgr.selection = null; // Reset selection
        if (!el1 || !el2) {
            return; // Internal error
        }
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

    _mouseDown(ev) {
        if (this.disabled) {
            return;
        }
        const _selected = this._getBarEl(ev.target);
        if (_selected) {
            this._focusOn(_selected);
        }

        if (!this.zoomDragX && !this.zoomDragY) {
            return;
        }
        const x = ev.clientX;
        const y = ev.clientY;

        this._movedMouse = null;
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
        const cntr = this.$.bars.getBoundingClientRect();
        const s = this.$.dragrect.style;
        if (!this._movedMouse) {
            s.display = 'block';
        }
        const [dragX, dragY] = this.flipAxes
            ? [this.zoomDragY, this.zoomDragX]
            : [this.zoomDragX, this.zoomDragY];

        this._movedMouse = {
            x: dragX ? Math.min(x0, ev.clientX) - cntr.left : 0,
            y: dragY ? Math.min(y0, ev.clientY) - cntr.top : 0,
            w: dragX ? Math.abs(x0 - ev.clientX) : cntr.width,
            h: dragY ? Math.abs(y0 - ev.clientY) : cntr.height,
            t: this._movedMouse ? this._movedMouse.t : Date.now()
        };

        s.left = `${this._movedMouse.x}px`;
        s.top = `${this._movedMouse.y}px`;
        s.width = `${this._movedMouse.w}px`;
        s.height = `${this._movedMouse.h}px`;
    }

    _mouseUp() {
        const s = this.$.dragrect.style;
        s.display = '';
        if (!this._movedMouse) {
            return;
        }

        const x1 = this._movedMouse.x;
        const y1 = this._movedMouse.y;
        const x2 = x1 + this._movedMouse.w;
        const y2 = y1 + this._movedMouse.h;

        const [dragX, dragY] = this.flipAxes
            ? [this.zoomDragY, this.zoomDragX]
            : [this.zoomDragX, this.zoomDragY];

        if ((!dragX || Math.abs(x2 - x1) < 3) && (!dragY || Math.abs(y2 - y1) < 3)) {
            // Dragged less than 3 pixels. Ignore
            return;
        }
        if (Date.now() - this._movedMouse.t < 150) {
            // Only dragged for 150ms. Ignore
            return;
        }

        this.dispatchEvent(new CustomEvent('zoom-selection', {
            bubbles:  true,
            composed: true,
            detail:   this._movedMouse
        }));
    }

    // Set the focused element
    _focusOn(focus) {
        if (this.disabled) {
            return null;
        }
        if (focus instanceof Element) {
            focus = this._getBarEl(focus);
        }

        if (this._focus) {
            if (focus && focus.el === this._focus.el) {
                this._focus = focus; // In case the element is reused with new data
                return focus;
            }
            this._focus.el.removeAttribute('focus');
        }
        this._focus = focus;
        if (this._focus) {
            this._focus.el.setAttribute('focus', '');
        }
        return focus;
    }

    _pickBar(valueIx, serieIx) {
        if (serieIx === undefined) {
            return null;
        }

        // Naive (simple) approach: check all elements
        const pick = el => {
            const p = el.getAttribute('part');

            if (p && p.split(' ')[0] === 'bar') {
                const bar = this._getBarEl(el);

                return bar && valueIx === bar.valueIx && serieIx === bar.serieIx ? bar : null;
            }
            for (el = el.firstChild; el; el = el.nextSibling) {
                const bar = pick(el);
                if (bar) {
                    return bar;
                }
            }
            return null;
        };

        return pick(this.$.bars);
    }

    _traceFocus() {
        if (this._focus) {
            this._focusOn(this._pickBar(this._focus.valueIx, this._focus.serieIx));
        }
    }


    _initTrackFocus() {
        this._trackFocus(this, () => this._focus ? this._focus.el : null);
    }

    _notifyFocus() {
        // Make sure a chart item has focus, if possible
        if (!this._focus) {
            this._focusOn(this._pickBar(0, 0));
        }
        if (this._focus) {
            this._mouseTooltip({target: this._focus.el});
        }
    }

    _notifyBlur() {
        this._closeTooltip();
    }

    _keyDown(ev) {
        if (!this._focus || this.disabled) {
            return;
        }
        let focus = null;

        /**
         * @param dir: 'next' or 'prev'
         */
        const findNotFilteredBar = (serieIx, dir) => {
            if (!this.filterLegend) {
                // We don't use filter
                return serieIx;
            }

            // We want to find the next available serie in the direction specified in the "dir" argument.
            // We want to skip the possible serie if it's:
            // - filtered by the legend
            // - doesn't present for the _data/_data2

            let possibleSeries = [];

            if (this._data) {
                const found = this._data.find(e => __xv(e) === this._focus.xvalue);

                if (found) {
                    possibleSeries = possibleSeries.concat(this._series);
                }
            }

            if (this._data2) {
                const found = this._data2.find(e => __xv(e) === this._focus.xvalue);

                if (found) {
                    possibleSeries = possibleSeries.concat(this._series2);
                }
            }

            possibleSeries = possibleSeries.filter(e => this.filterLegend.includes(e));

            const findNextAvailableSerie = (start) => {
                return possibleSeries.reduce((next, el) => {
                    if (el >= start && (next === undefined || el < next)) {
                        return el;
                    }

                    return next;
                }, undefined);
            };

            const findPrevAvailableSerie = (start) => {
                return possibleSeries.reduce((prev, el) => {
                    if (el <= start && (prev === undefined || el > prev)) {
                        return el;
                    }

                    return prev;
                }, undefined);
            };

            return dir === 'next' ? findNextAvailableSerie(serieIx) : findPrevAvailableSerie(serieIx);
        };

        const findLabelIndex = (serieIx) => {
            if (serieIx === undefined) {
                return undefined;
            }

            if (this._series.includes(serieIx)) {
                return this._data.findIndex(e => __xv(e) === this._focus.xvalue);
            }

            return this._data2 ? this._data2.findIndex(e => __xv(e) === this._focus.xvalue) : undefined;
        };

        let serieIx, valueIx;

        switch (ev.key) {
            case 'ArrowLeft':
                focus = this._pickBar(this._focus.valueIx - 1, this._focus.serieIx);
                break;
            case 'ArrowRight':
                focus = this._pickBar(this._focus.valueIx + 1, this._focus.serieIx);
                break;
            case 'ArrowUp':
                serieIx = findNotFilteredBar(this._focus.serieIx - 1, 'prev');
                valueIx = findLabelIndex(serieIx);
                focus = this._pickBar(valueIx, serieIx);
                break;
            case 'ArrowDown':
                serieIx = findNotFilteredBar(this._focus.serieIx + 1, 'next');
                valueIx = findLabelIndex(serieIx);
                focus = this._pickBar(valueIx, serieIx);
                break;
            case 'PageUp':
                serieIx = findNotFilteredBar(0, 'next');
                valueIx = findLabelIndex(serieIx);
                focus = this._pickBar(valueIx, serieIx);
                break;
            case 'PageDown':
                serieIx = findNotFilteredBar(this._legend.length - 1, 'prev');
                valueIx = findLabelIndex(serieIx);
                focus = this._pickBar(valueIx, serieIx);
                break;
            case 'Home':
                focus = this._pickBar(0, this._focus.serieIx);
                break;
            case 'End':
                focus = this._pickBar(this.data.length - 1, this._focus.serieIx);
                break;
            case 'Enter':
            case ' ':
                this._focus.el.click();
                break;
            default:
                // Not handled
                return;
        }

        // We consumed this keyboard event. Don't propagate
        ev.preventDefault();

        if (!focus || focus.el === this._focus.el) {
            return;
        }
        this._focusOn(focus);
        this._focus.el.scrollIntoViewIfNeeded();
        this._mouseTooltip({target: focus.el});
    }

    // Selections
    _selectionModeChanged(selectionMode, zoomSelect) {
        this._selectionMgr.selection = null;
        this._selectionMgr.selectMethod = zoomSelect ? 'multiple' : selectionMode;
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

    // Legend filter have changed. Adjust selection
    _adjustSelection() {
        if (!this._selectionMgr.selection) {
            return; // Nothing to adjust
        }
        const filterSet = this.filterLegend instanceof Array && new Set(this.filterLegend);
        const isVisible = filterSet ? i => filterSet.has(i) : () => true;
        if (Array.isArray(this._selectionMgr.selection)) {
            if (this._selectionMgr.selection.some(sel => !isVisible(sel.serieIx))) { // Only refilter if needed
                this._selectionMgr.selection = this._selectionMgr.selection.filter(sel => isVisible(sel.serieIx));
            }
        } else if (!isVisible(this._selectionMgr.selection.serieIx)) {
            this._selectionMgr.selection = null;
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
        const filterSet = this.filterLegend instanceof Array && new Set(this.filterLegend);
        const isVisible = filterSet ? i => filterSet.has(i) : () => true;
        const selection = [];
        const selectData = data => {
            if (data) {
                const series = data.series ? i => data.series[i] : i => i;
                data.forEach((row, valueIx) => {
                    const x = __xv(row);
                    __yv(row).forEach((y, i) => {
                        const serieIx = series(i);
                        if (isVisible(serieIx)) {
                            selection.push({serieIx, valueIx, x, y});
                        }
                    });
                });
            }
        };
        selectData(this.data);
        selectData(this.data2);
        this._selectionMgr.selection = selection;
    }

    unselectAll() {
        this._selectionMgr.selection = null;
    }
};

customElements.define(PTCS.ChartCoreBar.is, PTCS.ChartCoreBar);
