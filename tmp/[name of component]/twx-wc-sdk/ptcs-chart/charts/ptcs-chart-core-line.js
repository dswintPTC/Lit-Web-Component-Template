import {PolymerElement, html} from '@polymer/polymer/polymer-element.js';
import {PTCS} from 'ptcs-library/library.js';
import {SelectionMgr} from '../selection/chart-selection.js';
import {numberLabel, sampleArray, getChartTooltip, computeSampleSize, sampleArray2} from 'ptcs-library/library-chart.js';
import {enableSvgGradients, disableSvgGradients} from 'ptcs-library/svg-gradients.js';
import moment from 'ptcs-moment/moment-import.js';
import 'ptcs-behavior-styleable/ptcs-behavior-styleable.js';
import 'ptcs-behavior-tooltip/ptcs-behavior-tooltip.js';
import 'ptcs-behavior-focus/ptcs-behavior-focus.js';
import 'ptcs-style-unit/ptcs-part-observer.js';

import {select} from 'd3-selection';
import {stack, area, line, curveLinear, curveBasis, curveBundle,
    curveCardinal, curveCatmullRom, curveMonotoneX, curveMonotoneY,
    curveNatural, curveStepBefore, curveStepAfter, curveStep,
    stackOrderNone, stackOrderReverse, stackOrderAppearance,
    stackOrderAscending, stackOrderDescending, stackOrderInsideOut,
    stackOffsetNone, stackOffsetExpand, stackOffsetDiverging,
    stackOffsetSilhouette, stackOffsetWiggle} from 'd3-shape';

/* Don't need a warning to make sure I have not confused "=>" with ">=" or "<=" */
/* eslint-disable no-confusing-arrow */
const __xv = item => item[0];
const __yv = item => item[1];

function compareSelectionObjects(sel1, sel2) {
    if (sel1.valueIx !== sel2.valueIx) {
        return sel1.valueIx - sel2.valueIx;
    }
    return sel1.serieIx - sel2.serieIx;
}

function __dataLabel(d) {
    switch (typeof d) {
        case 'undefined': return '';
        case 'number': return numberLabel(d);
    }
    return `${d}`;
}

const __dataFields = d => d[3] ? d[3] : {};

function resolveMarker(series, defaultMarker) {
    const seriesMarker = series && series.marker;
    return ((seriesMarker && seriesMarker !== 'default') ? seriesMarker : defaultMarker) || 'none';
}

PTCS.ChartCoreLine = class extends PTCS.BehaviorTooltip(PTCS.BehaviorFocus(PTCS.BehaviorStyleable(PTCS.ThemableMixin(PolymerElement)))) {

    static get template() {
        return html`
        <style>
        :host {
            display: block;
            width: 100%;
            height: 100%;
            --ptcs-tooltip-start-delay: 100;
        }

        /* sparkView causes marker=none and [stacked] hides the lines in theming (display: none) so that nothing is shown */
        :host([stacked][marker=none]) [part=line]{
            display: block;
        }

        svg {
            position: relative;
            z-index: 10;
            width: 100%;
            height: 100%;
        }

        /* Add an extra chart level, so we have exclusive access to the influencing class attribute */
        #chart {
            position: relative;
            width: 100%;
            height: 100%;
        }

        #markers {
            pointer-events: none;
        }

        :host([hide-markers]) #markers {
            display: none;
        }

        :host([hide-lines]) #lines {
            display: none;
        }

        :host(:not([show-areas])) #areas {
            display: none;
        }

        #markers2 {
            pointer-events: none;
            display: none;
        }

        :host([display-y2]:not([hide-markers])) #markers2 {
            display: block;
        }

        #lines2 {
            display: none;
        }

        :host([display-y2][stacked2]:not([hide-lines])) #lines2 {
            display: block;
        }

        #areas2 {
            display: none;
        }

        :host([display-y2][stacked2][show-areas]) #areas2 {
            display: block;
        }

        :host([display-y2][stacked2]:not([hide-lines])) #areas2 [part=area] {
            opacity: 1;
        }

        .pick-marker {
            display: block;
        }

        :host([hover-pick]) .pick-marker:not(:hover) {
            display: none;
        }

        #values, #values1, #values2 {
            position: absolute;
            left: 0;
            right: 0;
            top: 0;
            bottom: 0;
            pointer-events: none;
            user-select: none;
            z-index: 12;
            overflow: hidden;
        }

        ptcs-label[part=value] {
            position: absolute;
            left: 0;
            top: 0;
        }

        [part=drag-rect] {
            display: none;
        }

        [part=selected] {
            pointer-events: none;
        }

        :host(:not(:focus)) [part=focus] {
            display: none;
        }

        :host([hide-focus]) [part=focus] {
            display: none;
        }

        [part=focus] {
            pointer-events: none;
        }

        [part=hover] {
            display: none;
            pointer-events: none;
        }

        /* FILTERING */
        #chart.filter .marker-legend {
            opacity: 0;
        }

        #chart.filter.L1 .marker-legend[legend=L1] {
            opacity: 1;
        }

        #chart.filter.L2 .marker-legend[legend=L2] {
            opacity: 1;
        }

        #chart.filter.L3 .marker-legend[legend=L3] {
            opacity: 1;
        }

        #chart.filter.L4 .marker-legend[legend=L4] {
            opacity: 1;
        }

        #chart.filter.L5 .marker-legend[legend=L5] {
            opacity: 1;
        }

        #chart.filter.L6 .marker-legend[legend=L6] {
            opacity: 1;
        }

        #chart.filter.L7 .marker-legend[legend=L7] {
            opacity: 1;
        }

        #chart.filter.L8 .marker-legend[legend=L8] {
            opacity: 1;
        }

        #chart.filter.L9 .marker-legend[legend=L9] {
            opacity: 1;
        }

        #chart.filter.L10 .marker-legend[legend=L10] {
            opacity: 1;
        }

        #chart.filter.L11 .marker-legend[legend=L11] {
            opacity: 1;
        }

        #chart.filter.L12 .marker-legend[legend=L12] {
            opacity: 1;
        }

        #chart.filter.L13 .marker-legend[legend=L13] {
            opacity: 1;
        }

        #chart.filter.L14 .marker-legend[legend=L14] {
            opacity: 1;
        }

        #chart.filter.L15 .marker-legend[legend=L15] {
            opacity: 1;
        }

        #chart.filter.L16 .marker-legend[legend=L16] {
            opacity: 1;
        }

        #chart.filter.L17 .marker-legend[legend=L17] {
            opacity: 1;
        }

        #chart.filter.L18 .marker-legend[legend=L18] {
            opacity: 1;
        }

        #chart.filter.L19 .marker-legend[legend=L19] {
            opacity: 1;
        }

        #chart.filter.L20 .marker-legend[legend=L20] {
            opacity: 1;
        }

        #chart.filter.L21 .marker-legend[legend=L21] {
            opacity: 1;
        }

        #chart.filter.L22 .marker-legend[legend=L22] {
            opacity: 1;
        }

        #chart.filter.L23 .marker-legend[legend=L23] {
            opacity: 1;
        }

        #chart.filter.L24 .marker-legend[legend=L24] {
            opacity: 1;
        }

        #chart.filter .value-legend {
            opacity: 0;
        }

        #chart.filter.L1 .value-legend[legend=L1] {
            opacity: 1;
        }

        #chart.filter.L2 .value-legend[legend=L2] {
            opacity: 1;
        }

        #chart.filter.L3 .value-legend[legend=L3] {
            opacity: 1;
        }

        #chart.filter.L4 .value-legend[legend=L4] {
            opacity: 1;
        }

        #chart.filter.L5 .value-legend[legend=L5] {
            opacity: 1;
        }

        #chart.filter.L6 .value-legend[legend=L6] {
            opacity: 1;
        }

        #chart.filter.L7 .value-legend[legend=L7] {
            opacity: 1;
        }

        #chart.filter.L8 .value-legend[legend=L8] {
            opacity: 1;
        }

        #chart.filter.L9 .value-legend[legend=L9] {
            opacity: 1;
        }

        #chart.filter.L10 .value-legend[legend=L10] {
            opacity: 1;
        }

        #chart.filter.L11 .value-legend[legend=L11] {
            opacity: 1;
        }

        #chart.filter.L12 .value-legend[legend=L12] {
            opacity: 1;
        }

        #chart.filter.L13 .value-legend[legend=L13] {
            opacity: 1;
        }

        #chart.filter.L14 .value-legend[legend=L14] {
            opacity: 1;
        }

        #chart.filter.L15 .value-legend[legend=L15] {
            opacity: 1;
        }

        #chart.filter.L16 .value-legend[legend=L16] {
            opacity: 1;
        }

        #chart.filter.L17 .value-legend[legend=L17] {
            opacity: 1;
        }

        #chart.filter.L18 .value-legend[legend=L18] {
            opacity: 1;
        }

        #chart.filter.L19 .value-legend[legend=L19] {
            opacity: 1;
        }

        #chart.filter.L20 .value-legend[legend=L20] {
            opacity: 1;
        }

        #chart.filter.L21 .value-legend[legend=L21] {
            opacity: 1;
        }

        #chart.filter.L22 .value-legend[legend=L22] {
            opacity: 1;
        }

        #chart.filter.L23 .value-legend[legend=L23] {
            opacity: 1;
        }

        #chart.filter.L24 .value-legend[legend=L24] {
            opacity: 1;
        }

        #chart.filter path[legend] {
            opacity: 0;
        }

        #chart.filter.L1 path[legend=L1] {
            opacity: var(--ptcs-chart-area--opacity, 1);
        }

        #chart.filter.L2 path[legend=L2] {
            opacity: var(--ptcs-chart-area--opacity, 1);
        }

        #chart.filter.L3 path[legend=L3] {
            opacity: var(--ptcs-chart-area--opacity, 1);
        }

        #chart.filter.L4 path[legend=L4] {
            opacity: var(--ptcs-chart-area--opacity, 1);
        }

        #chart.filter.L5 path[legend=L5] {
            opacity: var(--ptcs-chart-area--opacity, 1);
        }

        #chart.filter.L6 path[legend=L6] {
            opacity: var(--ptcs-chart-area--opacity, 1);
        }

        #chart.filter.L7 path[legend=L7] {
            opacity: var(--ptcs-chart-area--opacity, 1);
        }

        #chart.filter.L8 path[legend=L8] {
            opacity: var(--ptcs-chart-area--opacity, 1);
        }

        #chart.filter.L9 path[legend=L9] {
            opacity: var(--ptcs-chart-area--opacity, 1);
        }

        #chart.filter.L10 path[legend=L10] {
            opacity: var(--ptcs-chart-area--opacity, 1);
        }

        #chart.filter.L11 path[legend=L11] {
            opacity: var(--ptcs-chart-area--opacity, 1);
        }

        #chart.filter.L12 path[legend=L12] {
            opacity: var(--ptcs-chart-area--opacity, 1);
        }

        #chart.filter.L13 path[legend=L13] {
            opacity: var(--ptcs-chart-area--opacity, 1);
        }

        #chart.filter.L14 path[legend=L14] {
            opacity: var(--ptcs-chart-area--opacity, 1);
        }

        #chart.filter.L15 path[legend=L15] {
            opacity: var(--ptcs-chart-area--opacity, 1);
        }

        #chart.filter.L16 path[legend=L16] {
            opacity: var(--ptcs-chart-area--opacity, 1);
        }

        #chart.filter.L17 path[legend=L17] {
            opacity: var(--ptcs-chart-area--opacity, 1);
        }

        #chart.filter.L18 path[legend=L18] {
            opacity: var(--ptcs-chart-area--opacity, 1);
        }

        #chart.filter.L19 path[legend=L19] {
            opacity: var(--ptcs-chart-area--opacity, 1);
        }

        #chart.filter.L20 path[legend=L20] {
            opacity: var(--ptcs-chart-area--opacity, 1);
        }

        #chart.filter.L21 path[legend=L21] {
            opacity: var(--ptcs-chart-area--opacity, 1);
        }

        #chart.filter.L22 path[legend=L22] {
            opacity: var(--ptcs-chart-area--opacity, 1);
        }

        #chart.filter.L23 path[legend=L23] {
            opacity: var(--ptcs-chart-area--opacity, 1);
        }

        #chart.filter.L24 path[legend=L24] {
            opacity: var(--ptcs-chart-area--opacity, 1);
        }

        #hoveraggr {
            pointer-events: none;
            visibility: hidden;
        }

        [part~=line] {
            fill: none;
        }

        [part~=area] {
            stroke: none;
        }

        g[hidden] {
            display: none !important;
        }
        </style>

        <div id="chart" class\$="[[_filter(filterLegend)]]" on-dragstart="_ondragstart">
            <ptcs-part-observer>
            <svg on-click="_clickOnChart" on-mousedown="_dragStart" on-mousemove="_moveOverChart">
                <defs id="defs">
                    <circle id="ptc-circle" cx="0" cy="0" r="8"/>
                    <rect id="ptc-square" x="-8" y="-8" width="16" height="16"/>
                    <rect id="ptc-diamond" x="-8" y="-8" width="16" height="16" transform="rotate(45)"/>
                    <polygon id="ptc-triangle" points="-9,6.364 0,-6.364 9,6.364"/>
                    <polygon id="ptc-plus" points="-9,3 -9,-3 -3,-3 -3,-9 3,-9, 3,-3, 9,-3 9,3 3,3 3,9 -3,9 -3,3"/>
                    <use id="ptc-cross" href="#ptc-plus" transform="rotate(45)"/>
                    <!-- Symbols on white background -->
                    <g id="ptc-circle-wb"><use href="#ptc-circle" fill="#FFFFFF"/><use href="#ptc-circle"/></g>
                    <g id="ptc-square-wb"><use href="#ptc-square" fill="#FFFFFF"/><use href="#ptc-square"/></g>
                    <g id="ptc-diamond-wb"><use href="#ptc-diamond" fill="#FFFFFF"/><use href="#ptc-diamond"/></g>
                    <g id="ptc-triangle-wb"><use href="#ptc-triangle" fill="#FFFFFF"/><use href="#ptc-triangle"/></g>
                    <g id="ptc-plus-wb"><use href="#ptc-plus" fill="#FFFFFF"/><use href="#ptc-plus"/></g>
                    <g id="ptc-cross-wb"><use href="#ptc-cross" fill="#FFFFFF"/><use href="#ptc-cross"/></g>
                </defs>
                <g class="nstack" hidden\$="[[hidenstack]]">
                    <g id="areas"></g>
                    <g id="lines"></g>
                    <g id="markers"></g>
                </g>
                <g class="stack1" hidden\$="[[hidestack1]]">
                    <g id="areas1"></g>
                    <g id="lines1"></g>
                    <g id="markers1"></g>
                </g>
                <g class="stack2" hidden\$="[[hidestack2]]">
                    <g id="areas2"></g>
                    <g id="lines2"></g>
                    <g id="markers2"></g>
                </g>
                <g id="hoveraggr">
                    <rect id="hoverpoint" x="-4" y="-4" width="8" height="8" fill="none"/>
                    <path id="hoverxline" part="hover-line"/>
                    <path id="hoveryline" part="hover-line"/>
                </g>
                <g id="hover-markers"></g>
                <use id="focusmarker" part="focus"></use>
                <rect id="dragrect" part="drag-rect"></rect>
            </svg>
            </ptcs-part-observer>
            <div id="values" hidden\$="[[_hideValues(showValues, hidenstack)]]"></div>
            <div id="values1" hidden\$="[[_hideValues(showValues, hidestack1)]]"></div>
            <div id="values2" hidden\$="[[_hideValues(showValues, hidestack2)]]"></div>
        </div>`;
    }

    static get is() {
        return 'ptcs-chart-core-line';
    }

    static get properties() {
        return {
            // Recieved data
            data: {
                type: Array
            },

            disabled: {
                type:               Boolean,
                reflectToAttribute: true
            },

            // Massaged data
            _data: Array,

            // Legend data, for tooltip
            legend: Array,

            // Stack method. If assigned, enables stacking
            // auto || expand || diverging || silhouette || wiggle
            stackMethod: String,

            // Stack order: auto || reverse || appearance || ascending || descending || insideout
            stackOrder: String,

            // Stacked data, if stacking is enabled
            _stackedData: Array,

            stacked: {
                type:               Boolean,
                computed:           '_computeStacked(stackMethod)',
                reflectToAttribute: true
            },

            stacked2: {
                type:               Boolean,
                computed:           '_computeStacked(stackMethod2)',
                reflectToAttribute: true
            },

            // xValue type: number || date || string
            xType: Object,

            // yValue type: number || date || string
            yType: Object,

            // Minimun x value in data and data2
            xMin: {
                type:   Object,
                notify: true
            },

            // Maximum x value in data and data2
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

            // Compare x values according to xType
            _xCmp: {
                type:     Function,
                computed: '_computeType(xType)'
            },

            // Compare y values according to yType
            _yCmp: {
                type:     Function,
                computed: '_computeType(yType)'
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
                type:     Boolean,
                observer: 'refresh'
            },

            // Legend filtering
            filterLegend: {
                type:     Array,
                observer: '_filterLegendChanged'
            },

            hideLines: {
                type:               Boolean,
                observer:           'refresh',
                reflectToAttribute: true
            },

            showAreas: {
                type:               Boolean,
                observer:           'refresh',
                reflectToAttribute: true
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

            // Are any markers displayed on this chart?
            _anyMarkers: {
                type:     Boolean,
                computed: '_computeAnyMarkers(marker, legend)'
            },

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

            // cursor: auto (just mouse) || x (x-line) || y (y-line) || xy (cross)
            cursorType: {
                type:     String,
                observer: '_updateHoverline'
            },

            // target method: auto (over) || x (closests x) || y (closest y) || xy (closest) || none
            cursorTarget: {
                type: String,
            },

            // List of values that the cursorType / cursorTarget selects
            // [{valueIx, serieIx, x, y}, ...]
            _pickList: {
                type: Array
            },

            // Keep track of old pick list, to prevent unnecessary redraws
            _oldPickList: {
                type: Array
            },

            // Index to hovered item in _pickList (if any)
            hoverPick: {
                type:               Object,
                reflectToAttribute: true
            },

            // Show secondary y-axis
            showY2Axis: {
                type:     Boolean,
                observer: 'refresh'
            },

            displayY2: {
                type:               Boolean,
                reflectToAttribute: true
            },

            // Secondary y-axis
            data2: Array,

            // number || date || [string]
            y2Type: Object,

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

            // Compare y2 values according to y2Type
            _y2Cmp: {
                type:     Function,
                computed: '_computeType(y2Type)'
            },

            // Massaged data
            _data2: Array,

            // Stack method for the second axis. If assigned, enables stacking
            // auto || expand || diverging || silhouette || wiggle
            stackMethod2: String,

            // Stack order: auto || reverse || appearance || ascending || descending || insideout
            stackOrder2: String,

            // Stacked data, if stacking is enabled
            _stackedData2: Array,

            // _series[index] = serieIx for all data
            _series: Array,

            selectedData: {
                type:     Object,
                notify:   true,
                observer: '_selectedDataChanged'
            },

            // 'none' || 'single' || 'mutiple'
            selectionMode: {
                type: String
            },

            _selectionMgr: {
                type:  SelectionMgr,
                value: () => new SelectionMgr(compareSelectionObjects)
            },

            tooltipTemplate: {
                type: String
            },

            // The value that has focus
            // {valueIx, serieIx, x, y}
            _focus: {
                type: Object
            },

            // will be used for formatting it in tooltip
            xDateFormatToken: {
                type: String
            },

            // sampleSize: unassigned - use default sampling,
            //             number - sample down data to specified number,
            //             0 (zero) = no sampling = show all points
            sampleSize: {
                type:     Number,
                observer: 'refresh'
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
            },

            // Show / Hide chart regions
            hidenstack: Boolean,
            hidestack1: Boolean,
            hidestack2: Boolean
        };
    }

    static get observers() {
        return [
            '_change(data, stackMethod, stackOrder, _xCmp, _yCmp, yType)',
            '_change2(data2, stackMethod2, stackOrder2, _xCmp, _y2Cmp, y2Type)',
            '_dataChanged(data.*)',
            '_updateTooltips(_pickList, hoverPick)',
            '_selectionModeChanged(selectionMode, zoomSelect)',
            '_emptyData(data, data2)'
        ];
    }

    // Compare values of the various types
    static cmpNumber(a, b) {
        return a - b;
    }

    static cmpDate(a, b) {
        if (a instanceof Date && b instanceof Date) {
            return a.getTime() - b.getTime();
        }
        return 0;
    }

    static arrayCmp(values) {
        const weigth = values.reduce((w, item, index) => {
            w[item] = index;
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

        // Must know when the mouse leaves the chart
        this.addEventListener('mouseout', ev => {
            this.setProperties({hoverPick: undefined, _pickList: []});
            this.$.hoveraggr.style.visibility = '';
            this.__onChart = false;
        });
    }

    _ondragstart() {
        return false;
    }

    connectedCallback() {
        super.connectedCallback();
        enableSvgGradients(this, this.$.defs);
    }

    disconnectedCallback() {
        disableSvgGradients(this);
        super.disconnectedCallback();
    }

    _computeType(type) {
        if (type instanceof Array) {
            return PTCS.ChartCoreLine.arrayCmp(type);
        }
        if (type === 'date') {
            return PTCS.ChartCoreLine.cmpDate;
        }
        return PTCS.ChartCoreLine.cmpNumber;
    }

    _computeAnyMarkers(marker, legend) {
        return Array.isArray(legend) ? legend.some(series => resolveMarker(series, marker) !== 'none') : (marker && marker !== 'none');
    }

    _computeStacked(stackMethod) {
        return stackMethod ? !!PTCS.ChartCoreLine.stackOffset[stackMethod] : false;
    }

    _filterLegendChanged() {
        if (this._stackedData) {
            this._change(this.data, this.stackMethod, this.stackOrder, this._xCmp, this._yCmp, this.yType);
            this._change2(this.data2, this.stackMethod2, this.stackOrder2, this._xCmp, this._y2Cmp, this.y2Type);
        }
        if (this._focus && this.filterLegend instanceof Array && !this.filterLegend.includes(this._focus.serieIx)) {
            this._focus = undefined;
        }
        this._adjustSelection();
    }

    _filter(filterLegend) {
        if (!(filterLegend instanceof Array)) {
            return '';
        }
        return 'filter ' + filterLegend.map(item => `L${item + 1}`).join(' ');
    }

    _isVisibleLegend(el) {
        const legend = el.getAttribute('legend');
        if (legend) {
            if (!(this.filterLegend instanceof Array)) {
                return true;
            }
            // Elements filtered by legend have an attribute named legend with value L1, L2, ...
            // The filterLegend array contains corresponding integer - 1 in an item when the element is visible
            const ix = Number(legend.substring(1)) - 1;
            return this.filterLegend.includes(ix);
        }
        return false;
    }

    _hideValues(showValues, hide) {
        return hide || (showValues !== 'above' && showValues !== 'on' && showValues !== 'below');
    }

    _preprocessData(data, stackMethod, stackOrder, _xCmp, _yCmp, filterLegend, yType) {
        if (!(data instanceof Array) || !_xCmp || !_yCmp) {
            return null;
        }
        const stackOffset = PTCS.ChartCoreLine.stackOffset[stackMethod];

        let xMin, xMax, yMin, yMax, _stackedData;
        let _data;

        // Only compute number of series if we have to (a function)
        const numSeries = () => data.reduce((r, v) => Math.max(r, __yv(v).length), 0);
        const series = [...new Set(data.series || [...Array(numSeries()).keys()])];

        if (stackOffset && yType === 'number') {
            const seriesIx = [...Array(series.length).keys()];
            const d3stack = stack()
                .keys(filterLegend ? seriesIx.filter(i => filterLegend.includes(series[i])) : seriesIx)
                .value((d, key) => d[1][key] || 0)
                .offset(stackOffset);

            const order = PTCS.ChartCoreLine.stackOrder[stackOrder];
            if (order) {
                d3stack.order(order);
            }

            const x = data.map(__xv);
            const y = d3stack(data);

            xMin = x.reduce((r, v) => _xCmp(r, v) > 0 ? v : r, x[0]);
            xMax = x.reduce((r, v) => _xCmp(r, v) < 0 ? v : r, x[0]);

            if (y && y[0]) {
                yMin = y[0][0][0];
                yMax = y[0][0][1];
                y.forEach(a => {
                    a.forEach(item => {
                        if (_yCmp(yMin, item[0]) > 0) {
                            yMin = item[0];
                        }
                        if (_yCmp(yMax, item[1]) < 0) {
                            yMax = item[1];
                        }
                    });
                });
            }

            _stackedData = {x, y};
        } else {
            _data = [];

            // Group data to series layout
            data.forEach(item => {
                const x = __xv(item);
                if (x === undefined) {
                    return;
                }
                if (_xCmp(xMin, x) > 0 || xMin === undefined) {
                    xMin = x;
                }
                if (_xCmp(xMax, x) < 0 || xMax === undefined) {
                    xMax = x;
                }

                const depfield = item[2];
                const point = depfield ? (y, i) => [x, y, depfield[i]] : y => [x, y];

                series.forEach((v, index) => {
                    const y = __yv(item)[index];

                    if (y !== undefined) {
                        if (_yCmp(yMin, y) > 0 || yMin === undefined) {
                            yMin = y;
                        }

                        if (_yCmp(yMax, y) < 0 || yMax === undefined) {
                            yMax = y;
                        }
                    }

                    if (_data[index]) {
                        _data[index].push(point(y, index));
                    } else {
                        _data[index] = [point(y, index)];
                    }
                });
            });
        }

        return {_data, xMin, xMax, yMin, yMax, _stackedData};
    }

    get _selectXMin() {
        if (this._x2Min === undefined) {
            return this._x1Min;
        }
        if (this._x1Min === undefined) {
            return this._x2Min;
        }
        if (this._xCmp) {
            return this._xCmp(this._x1Min, this._x2Min) <= 0 ? this._x1Min : this._x2Min;
        }
        return undefined;
    }

    get _selectXMax() {
        if (this._x2Max === undefined) {
            return this._x1Max;
        }
        if (this._x1Max === undefined) {
            return this._x2Max;
        }
        if (this._xCmp) {
            return this._xCmp(this._x1Max, this._x2Max) <= 0 ? this._x2Max : this._x1Max;
        }
        return undefined;
    }

    _change(/*data, stackMethod, stackOrder, _xCmp, _yCmp*/) {
        if (this.__changeOn) {
            return;
        }
        this.__changeOn = true;
        requestAnimationFrame(() => {
            this.__changeOn = false;

            const pp = this._preprocessData(this.data, this.stackMethod, this.stackOrder,
                this._xCmp, this._yCmp, this.filterLegend, this.yType) || {};
            this._x1Min = pp.xMin;
            this._x1Max = pp.xMax;
            this.setProperties({
                _data:        pp._data,
                _stackedData: pp._stackedData,
                xMin:         this._selectXMin,
                xMax:         this._selectXMax,
                yMin:         pp.yMin,
                yMax:         pp.yMax
            });

            this.refresh();
        });
    }

    _change2(/*data2, stackMethod, stackOrder, _xCmp, _y2Cmp*/) {
        if (this.__changeOn2) {
            return;
        }
        this.__changeOn2 = true;
        requestAnimationFrame(() => {
            this.__changeOn2 = false;
            const pp = this._preprocessData(this.data2, this.stackMethod2, this.stackOrder2,
                this._xCmp, this._y2Cmp, this.filterLegend, this.y2Type) || {};
            this._x2Min = pp.xMin;
            this._x2Max = pp.xMax;
            this.setProperties({
                _data2:        pp._data,
                _stackedData2: pp._stackedData,
                xMin:          this._selectXMin,
                xMax:          this._selectXMax,
                y2Min:         pp.yMin,
                y2Max:         pp.yMax
            });

            this.refresh();
        });
    }

    _dataChanged(cr) {
        if (cr.path !== 'data' && cr.path !== 'data.length') {
            // Some internal data point has changed
            this.refreshData();
        }
        this._selectionMgr.selection = null;
    }

    _emptyData(data, data2) {
        const emptyState1 = !(data && Array.isArray(data) && data.length);
        const emptyState2 = !(data2 && Array.isArray(data2) && data2.length);
        this._setChartStateDataEmpty(emptyState1 && emptyState2);
    }

    refreshData() {
        this._change(this.data, this.stackMethod, this.stackOrder, this._xCmp, this._yCmp, this.yType);
    }

    refresh() {
        if (this.__refreshOn) {
            return;
        }
        this.__refreshOn = true;
        requestAnimationFrame(() => {
            this.__refreshOn = false;
            if (this._stackedData || this._stackedData2) {
                this.__refreshStacked();
            } else {
                this.hidestack1 = this.hidestack2 = true;
            }

            if (!this._stackedData || !this._stackedData2) {
                this.__refresh();
            } else {
                this.hidenstack = true;
            }

            // Reset/recompute things that are dependent on the marker locations
            this._traceFocus();
            this._closeTooltip();
            this._updateHoverline();
        });
    }

    _curve() {
        const f = PTCS.ChartCoreLine.curveMap[this.curve];
        if (f) {
            return f.call(this);
        }
        return curveLinear;
    }

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

    _setMarkerPosFunc(xPos, yPos) {
        const scale = this._getMarkerScale();

        if (scale === 1) {
            return this.flipAxes
                ? d => `translate(${yPos(d[1])}px,${xPos(d[0])}px)`
                : d => `translate(${xPos(d[0])}px,${yPos(d[1])}px)`;
        }

        return this.flipAxes
            ? d => `translate(${yPos(d[1])}px,${xPos(d[0])}px) scale(${scale})`
            : d => `translate(${xPos(d[0])}px,${yPos(d[1])}px) scale(${scale})`;
    }

    _setMarkerPosStackedFunc(xOffs, yPos) {
        const scale = this._getMarkerScale();

        if (scale === 1) {
            return this.flipAxes
                ? (d, i) => `translate(${yPos(d[1])}px,${xOffs[i]}px)`
                : (d, i) => `translate(${xOffs[i]}px,${yPos(d[1])}px)`;
        }

        return this.flipAxes
            ? (d, i) => `translate(${yPos(d[1])}px,${xOffs[i]}px) scale(${scale})`
            : (d, i) => `translate(${xOffs[i]}px,${yPos(d[1])}px) scale(${scale})`;
    }

    __assignLabelPosFunc() {
        const xMax = this.clientWidth;
        const yMax = this.clientHeight;

        return (x, y, w, h) => {
            // Push label fully into view, if any part of it is visible
            if (x < 0) {
                if (x + w > 0) {
                    x = 0;
                }
            } else if (x + w >= xMax && x < xMax) {
                x = xMax - w;
            }
            if (y < 0) {
                if (y + h > 0) {
                    y = 0;
                }
            } else if (y + h >= yMax && y < yMax) {
                y = yMax - h;
            }
            // Generate transform expression
            return `translate(${x}px,${y}px)`;
        };
    }

    _setLabelPosFunc(xPos, yPos) {
        const dy = 8 * this._getMarkerScale();
        const f = this.__assignLabelPosFunc();

        if (this.showValues === 'above' && this._anyMarkers) {
            return this.flipAxes
                ? (d, w, h) => f(yPos(d[1]) - w / 2, xPos(d[0]) - dy - h, w, h)
                : (d, w, h) => f(xPos(d[0]) - w / 2, yPos(d[1]) - dy - h, w, h);
        }

        if (this.showValues === 'below' && this._anyMarkers) {
            return this.flipAxes
                ? (d, w, h) => f(yPos(d[1]) - w / 2, xPos(d[0]) + dy, w, h)
                : (d, w, h) => f(xPos(d[0]) - w / 2, yPos(d[1]) + dy, w, h);
        }

        return this.flipAxes
            ? (d, w, h) => f(yPos(d[1]) - w / 2, xPos(d[0]) - h / 2, w, h)
            : (d, w, h) => f(xPos(d[0]) - w / 2, yPos(d[1]) - h / 2, w, h);
    }

    _setLabelPosStackedFunc(xOffs, yPos, min, max) {
        const dy = 8 * this._getMarkerScale();
        const f = this.__assignLabelPosFunc();

        if (this.showValues === 'above' && this._anyMarkers) {
            return this.flipAxes
                ? (d, i, w, h) => f(yPos(d[1]) - w / 2, xOffs[i] - dy - h, w, h)
                : (d, i, w, h) => f(xOffs[i] - w / 2, yPos(d[1]) - dy - h, w, h);
        }

        if (this.showValues === 'below' && this._anyMarkers) {
            return this.flipAxes
                ? (d, i, w, h) => f(yPos(d[1]) - w / 2, xOffs[i] + dy, w, h)
                : (d, i, w, h) => f(xOffs[i] - w / 2, yPos(d[1]) + dy, w, h);
        }

        return this.flipAxes
            ? (d, i, w, h) => f(yPos(d[1]) - w / 2, xOffs[i] - h / 2, w, h)
            : (d, i, w, h) => f(xOffs[i] - w / 2, yPos(d[1]) - h / 2, w, h);
    }

    __filterStackedData(_stackedData) {
        const xScale = this.xScale;
        const maxX = this.flipAxes ? this.clientHeight : this.clientWidth;
        const xOrg = _stackedData.x;
        const yOrg = _stackedData.y;

        // Is x-value in current viewport (or zoomed out of sight?)
        const inView = x => {
            const xoffs = xScale(x);
            return 0 <= xoffs && xoffs <= maxX;
        };

        // Index to first x-point in current zoom viewport
        const x1 = xOrg.findIndex(inView);

        // Index to last x-point in current zoom viewport
        const x2 = (() => { // findIndex backwards
            for (let i = xOrg.length - 1; i >= 0; i--) {
                if (inView(xOrg[i])) {
                    return i;
                }
            }
            return -1;
        })();

        // Default values if no filtering / sampling is needed
        let x = xOrg;
        let y = yOrg;
        let sampledIx; // indexes of sampled data points (if sampling is used)
        const sampleSize = computeSampleSize(xScale, this.sampleSize);

        // Sum of absolute y-values for a given x value (index)
        const absOfY = i => y.reduce((sum, series) => sum + Math.abs(series[i][0] - series[i][1]), 0);
        const sampleOutlier = (a, b) => absOfY(a) - absOfY(b); // Compare outlier significance of two data points

        if (x1 > 0 || x2 < xOrg.length - 1) {
            // Zoom filtering - remove all indexes that are out of view
            sampledIx = [];
            for (let i = x1; i <= x2; i++) {
                sampledIx.push(i);
            }

            // Sample down data set
            sampledIx = sampleArray2(sampledIx, sampleSize, sampleOutlier);
        } else if (x.length > sampleSize && sampleSize > 0) {
            // Sample down data set
            sampledIx = sampleArray2(x.map((v, i) => i), sampleSize, sampleOutlier);
        }

        // Has data been sampled?
        if (sampledIx) {
            x = sampledIx.map(i => xOrg[i]);
            y = [];
            yOrg.forEach(line2 => {
                const _line = sampledIx.map(i => line2[i]); // Select the same data points for all series
                if (_line.length > 0) {
                    _line.key = line2.key;
                    _line.index = line2.index;
                    y.push(_line);
                }
            });
        }

        // Index mapping function: new x-index => org x-index
        const xIndex = sampledIx ? (d, i) => sampledIx[i] : (d, i) => i;

        return {x, y, xIndex};
    }

    // Showing values is _very_ expensive, so they might need to be sampled down _significantly_
    __sampleStackedValues(y) {
        const sampleSize = computeSampleSize(this.xScale, this.sampleSize);
        const num = y.reduce((sum, serie) => sum + serie.length, 0);
        const max = Math.min(sampleSize || num, 400); // Never show more than 400 values
        if (num <= max) {
            return {_yValues: y, vIndex: i => i}; // Keep all values
        }

        // num * k = max
        const k = max / num;
        const iMap = sampleArray(y[0].map((d, i) => i), y[0].length * k);
        const r = [];
        y.forEach(serie => {
            const maxPoints = serie.length * k;
            if (maxPoints > 0) {
                const sample = sampleArray(serie, maxPoints);
                sample.index = serie.index;
                sample.key = serie.key;
                r.push(sample);
            }
        });
        return {_yValues: r, vIndex: i => iMap[i]};
    }

    __refreshStacked_internal(_stackedData, yScale, data, mapLegend, areasEl, linesEl, markersEl, valuesEl) {
        const xScale = this.xScale;

        if (!_stackedData || !xScale || !yScale) {
            return;
        }

        const deltaX = xScale.bandwidth ? xScale.bandwidth() / 2 : 0;
        const deltaY = yScale.bandwidth ? yScale.bandwidth() / 2 : 0;
        const xPos = deltaX ? value => xScale(value) + deltaX : xScale;
        const yPos = deltaY ? value => yScale(value) + deltaY : yScale;
        const legend = d => `L${mapLegend(d.key) + 1}`;

        const serieIx = d => d.key;
        const {x, y, xIndex} = this.__filterStackedData(_stackedData);
        const xOffs = x.map(_x => xPos(_x));

        // Create data for hover-markers
        this.__pickData = y.map(serie => {
            const _serie = [];
            serie.forEach((d, i) => {
                const index = xIndex(d, i);
                // Exclude empty data points
                const v = data[index];
                if (v && v[1][serie.key]) {
                    _serie.push([xOffs[i], yPos(d[1]), index]);
                }
            });
            _serie.serieIx = mapLegend(serie.key);
            return _serie;
        });

        // Always show areas when stacking data
        //if (this.showAreas) {
        {
            const d3area = this.flipAxes
                ? area().x0(d => yPos(d[0])).x1(d => yPos(d[1])).y((d, i) => xOffs[i])
                : area().x((d, i) => xOffs[i]).y0(d => yPos(d[0])).y1(d => yPos(d[1]));

            d3area.curve(this._curve());

            const join = select(areasEl)
                .selectAll('path')
                .data(y);

            // Enter
            join.enter()
                .append('path')
                .attr('part', 'area')
                .attr('legend', legend)
                .attr('d', d3area);

            // Update
            join
                .attr('legend', legend)
                .attr('d', d3area);

            // Exit
            join.exit().remove();
        }

        // Lines
        /* -- don't show lines in stacked mode
        if (!this.hideLines) {
            const d3line = this.flipAxes
                ? line().x(d => yPos(d[1])).y((d, i) => xOffs[i])
                : line().x((d, i) => xOffs[i]).y(d => yPos(d[1]));

            d3line.curve(this._curve());

            const join = select(linesEl)
                .selectAll('path')
                .data(y);

            // Enter
            join.enter()
                .append('path')
                .attr('part', 'line')
                .attr('legend', legend)
                .attr('d', d3line);

            // Update
            join
                .attr('legend', legend)
                .attr('d', d3line);

            // Exit
            join.exit().remove();
        }
        */

        // Markers
        {
            const selectionMgr = this._selectionMgr;
            const setPos = this._setMarkerPosStackedFunc(xOffs, yPos);
            const _legend = Array.isArray(this.legend) ? this.legend : [];
            const _marker = this.marker;

            // eslint-disable-next-line no-inner-declarations
            function createMarkerEl(d, i) {
                const el = document.createElementNS('http://www.w3.org/2000/svg', 'use');
                el.setAttribute('part', 'marker');
                el.setAttribute('state-key', `${this._parent._index + 1}`);
                return el;
            }

            // eslint-disable-next-line no-inner-declarations
            function marker() {
                const rmarker = resolveMarker(_legend[this.parentNode._index], _marker);
                return rmarker === 'none' ? null : `#ptc-${rmarker}-wb`;
            }

            // eslint-disable-next-line no-inner-declarations
            function stateKey(d, i) {
                return `${this.parentNode._index + 1}`;
            }

            // eslint-disable-next-line no-inner-declarations
            function selected(d, i) {
                return selectionMgr.isSelected({valueIx: xIndex(d, i), serieIx: this.parentNode._index}) ? '' : undefined;
            }

            // eslint-disable-next-line no-inner-declarations
            function setDataProps(d, i) {
                const v = data[xIndex(d, i)];
                this._depfield = v ? (v[2] ? v[2] : v[1])[this.parentNode._index] : undefined;
                this.style.display = this._depfield === undefined ? 'none' : '';
            }

            const join = select(markersEl)
                .selectAll('.marker-legend')
                .data((this._anyMarkers && y) || []);

            // Exit
            join.exit().remove();

            // Update
            join
                .property('_index', serieIx)
                .attr('legend', legend);

            // Enter
            join.enter()
                .append('g')
                .attr('class', 'marker-legend')
                .property('_index', serieIx)
                .attr('legend', legend)
                .selectAll('[part~=marker]')
                .data(d => d)
                .enter()
                .append(createMarkerEl)
                .attr('href', marker)
                .attr('x-index', xIndex)
                .attr('selected', selected)
                .each(setDataProps)
                .style('transform', setPos);

            // update / enter / exit for children
            const children = join
                .selectAll('[part~=marker]')
                .data(d => d);

            children.exit().remove();

            children
                .attr('href', marker)
                .attr('state-key', stateKey)
                .attr('x-index', xIndex)
                .attr('selected', selected)
                .each(setDataProps)
                .style('transform', setPos);

            children.enter()
                .append(createMarkerEl)
                .attr('href', marker)
                .attr('x-index', xIndex)
                .attr('selected', selected)
                .each(setDataProps)
                .style('transform', setPos);
        }

        if (!this._hideValues(this.showValues)) {
            const {_yValues, vIndex} = this.__sampleStackedValues(y);
            const setPos = this._setLabelPosStackedFunc(xOffs, yPos);

            // Note: don't convert processLabel to ES6 function - the this context is assigned by d3
            // eslint-disable-next-line no-inner-declarations
            function processLabel(d, i) {
                const valueIx = vIndex(i);
                const v = data[xIndex(d, valueIx)];
                const t = v !== undefined ? __yv(v)[this.parentNode.__serieIx] : undefined;
                this.label = __dataLabel(t);
                this.style.display = t !== undefined ? '' : 'none';
                this.style.transform = setPos(d, valueIx, this.clientWidth, this.clientHeight);
            }

            const join = select(valuesEl)
                .selectAll('.value-legend')
                .data(_yValues);

            // Exit
            join.exit().remove();

            // Update
            join.attr('legend', legend).property('__serieIx', d => d.key);

            // Enter
            join.enter()
                .append('div')
                .attr('class', 'value-legend')
                .attr('legend', legend)
                .property('__serieIx', d => d.key)
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
                .attr('part', 'value')
                .property('horizontalAlignment', 'center')
                .each(processLabel);
        }
    }

    __refreshStacked() {
        const mapLegend = this.data.series ? ix => this.data.series[ix] : ix => ix;

        // Main data
        if (this._stackedData) {
            this.hidestack1 = false;

            this.__refreshStacked_internal(
                this._stackedData,
                this.yScale,
                this.data,
                mapLegend,
                this.$.areas1,
                this.$.lines1,
                this.$.markers1,
                this.$.values1);
        } else {
            this.hidestack1 = true;
        }

        // Dual y-axis data?
        this.displayY2 = this.showY2Axis && this.y2Scale && !!this._stackedData2;
        if (this.displayY2) {
            this.hidestack2 = true;
            const mapLegend2 = this.data2.series ? ix => this.data2.series[ix] : ix => ix;
            const __pickData = this.__pickData;

            this.__refreshStacked_internal(
                this._stackedData2,
                this.y2Scale,
                this.data2,
                mapLegend2,
                this.$.areas2,
                this.$.lines2,
                this.$.markers2,
                this.$.values2);

            // Get old pick-data
            if (__pickData) {
                this.__pickData.forEach(item => {
                    __pickData.push(item);
                });

                this.__pickData = __pickData;
            }
        } else {
            this.hidestack2 = true;
        }

        // Get sorted list of used series
        this._series = this.__pickData ? this.__pickData.map(item => item.serieIx).sort((a, b) => a - b) : [];
    }

    // Remove unmapped points and "sample" the x-axis if it is huge
    __filterData() {
        const xScale = this.xScale;
        const y1Scale = this.yScale;
        const y2Scale = this.y2Scale;
        const deltaX = xScale.bandwidth ? xScale.bandwidth() / 2 : 0;
        const maxX = (this.flipAxes ? this.clientHeight : this.clientWidth) + 1; // +1 for rounding errors
        const result = [];

        // When sampling, compare samples to make sure any outliers are added to the sampled data
        const compareSamples = (a, b) => a[1] - b[1];

        const process = (_data, yScale, deltaY, mapSerie) => {
            // Compute x and y values and exclude all point that are unmapped
            _data.forEach((serie, six) => {
                let _serie = [];

                serie.forEach((point, pix) => {
                    const x = xScale(point[0]);
                    if (x !== undefined && 0 <= x && x <= maxX) {
                        const y = yScale(point[1]);
                        if (y !== undefined) {
                            if (point[2] !== undefined) { // depfield?
                                _serie.push([x + deltaX, y + deltaY, pix, point[1], point[2]]);
                            } else {
                                _serie.push([x + deltaX, y + deltaY, pix, point[1]]);
                            }
                        }
                    }
                });

                // Sample down data, if needed
                _serie = sampleArray2(_serie, computeSampleSize(xScale, this.sampleSize), compareSamples);

                // Any remaining data to show?
                if (_serie.length) {
                    _serie.serieIx = mapSerie(six);
                    result.push(_serie);
                }
            });
        };

        // data might be stacked instead
        if (y1Scale && this.data && this._data) {
            const deltaY1 = y1Scale.bandwidth ? y1Scale.bandwidth() / 2 : 0;
            const mapSerie1 = this.data.series ? ix => this.data.series[ix] : ix => ix;
            process(this._data, y1Scale, deltaY1, mapSerie1);
        }

        const y2Index = result.length;

        // Data connected to dual y-axis?
        if (this.showY2Axis && y2Scale && this.data2 && this._data2) {
            const deltaY2 = y2Scale.bandwidth ? y2Scale.bandwidth() / 2 : 0;
            const mapSerie2 = this.data2.series ? ix => this.data2.series[ix] : ix => this.data.length + ix;
            process(this._data2, y2Scale, deltaY2, mapSerie2);
        }

        return [result, y2Index];
    }

    // Showing values is _very_ expensive, so they might need to be sampled down _significantly_
    __sampleValues(_data) {
        const sampleSize = computeSampleSize(this.xScale, this.sampleSize);
        const num = _data.reduce((sum, serie) => sum + serie.length, 0);
        const max = Math.min(sampleSize || num, 400); // Never show more than 400 values
        if (num <= max) {
            return _data; // Keep all values
        }

        const compareSamples = (a, b) => a[1] - b[1]; // Compare y-positons of values

        // num * k = max
        const k = max / num;
        const r = [];
        _data.forEach(serie => {
            const maxPoints = serie.length * k;
            if (maxPoints > 0) {
                const sample = sampleArray2(serie, maxPoints, compareSamples);
                sample.serieIx = serie.serieIx;
                r.push(sample);
            }
        });

        return r;
    }

    _getZeroPosOfScale(scale, type, minValue) {
        if (type === 'number') {
            return scale(0);
        }
        if (type === 'date') {
            return scale(minValue);
        }
        if (scale.bandwidth) {
            const domain = scale.domain();
            return scale(domain[0]) + scale.bandwidth() / 2;
        }
        // Fallback
        return scale(minValue);
    }

    __refresh() {
        if ((!(this._data instanceof Array) || !this.xScale || !this.yScale) &&
            (!(this._data2 instanceof Array) || !this.xScale || !this.y2Scale)) {
            this.hidenstack = true;
            return;
        }
        this.hidenstack = false;

        const xPos = value => value;
        const yPos = value => value;
        const legend = d => `L${d.serieIx + 1}`;
        const serieIx = d => d.serieIx;
        const subData = d => d;
        const pointIx = d => d[2];

        // Filter out non-mapped positions
        const [_data, y2Index] = this.__filterData();

        this._series = _data.map(item => item.serieIx).sort((a, b) => a - b);

        this.__pickData = _data;

        // Areas
        if (this.showAreas) {
            const useY2 = this.showY2Axis && this._data2 instanceof Array && this.y2Scale;

            // Find the origin line2 (bottom or top of the areas)
            const y1Pos0 = this._getZeroPosOfScale(this.yScale, this.yType, this.yMin);
            const y2Pos0 = useY2 ? this._getZeroPosOfScale(this.y2Scale, this.y2Type, this.y2Min) : undefined;

            const d3area = this.flipAxes
                ? area().x0(y1Pos0).x1(d => yPos(d[1])).y(d => xPos(d[0]))
                : area().x(d => xPos(d[0])).y0(y1Pos0).y1(d => yPos(d[1]));

            d3area.curve(this._curve());

            let drawArea = function(d, i) {
                this.setAttribute('d', d3area(d, i));
            };

            // Are there 2 zero points? (y1-axis and y2-axis)
            if (useY2) {
                const d3area2 = this.flipAxes
                    ? area().x0(y2Pos0).x1(d => yPos(d[1])).y(d => xPos(d[0]))
                    : area().x(d => xPos(d[0])).y0(y2Pos0).y1(d => yPos(d[1]));

                d3area2.curve(this._curve());

                drawArea = function(d, i) {
                    this.setAttribute('d', i >= y2Index ? d3area2(d, i) : d3area(d, i));
                };
            }

            const join = select(this.$.areas)
                .selectAll('path')
                .data(_data);

            // Enter
            join.enter()
                .append('path')
                .attr('part', 'area')
                .attr('legend', legend)
                .each(drawArea);

            // Update
            join
                .attr('legend', legend)
                .each(drawArea);

            // Exit
            join.exit().remove();
        }

        // Lines
        if (!this.hideLines) {
            const d3line = this.flipAxes
                ? line().x(d => yPos(d[1])).y(d => xPos(d[0])).curve(this._curve())
                : line().x(d => xPos(d[0])).y(d => yPos(d[1])).curve(this._curve());

            const join = select(this.$.lines)
                .selectAll('path')
                .data(_data);

            // Enter
            join.enter()
                .append('path')
                .attr('part', 'line')
                .attr('legend', legend)
                .attr('d', d3line);

            // Update
            join
                .attr('legend', legend)
                .attr('d', d3line);

            // Exit
            join.exit().remove();
        }

        // Markers
        {
            const selectionMgr = this._selectionMgr;
            const setPos = this._setMarkerPosFunc(xPos, yPos);
            const depfield = d => d[4] === undefined ? d[3] : d[4];
            const _legend = Array.isArray(this.legend) ? this.legend : [];
            const _marker = this.marker;

            // eslint-disable-next-line no-inner-declarations
            function selected(d, i) {
                return selectionMgr.isSelected({valueIx: pointIx(d, i), serieIx: this.parentNode._index}) ? '' : undefined;
            }

            // eslint-disable-next-line no-inner-declarations
            function marker() {
                const rmarker = resolveMarker(_legend[this.parentNode._index], _marker);
                return rmarker === 'none' ? null : `#ptc-${rmarker}-wb`;
            }

            // eslint-disable-next-line no-inner-declarations
            function createMarkerEl(d, i) {
                const el = document.createElementNS('http://www.w3.org/2000/svg', 'use');
                el.setAttribute('part', 'marker');
                el.setAttribute('state-key', `${this._parent._index + 1}`);
                return el;
            }

            // eslint-disable-next-line no-inner-declarations
            function stateKey(d, i) {
                return `${this.parentNode._index + 1}`;
            }
            const join = select(this.$.markers)
                .selectAll('.marker-legend')
                .data((this._anyMarkers && _data) || []);

            // Exit
            join.exit().remove();

            // Update
            join
                .attr('legend', legend)
                .property('_index', serieIx);

            // Enter
            join.enter()
                .append('g')
                .attr('class', 'marker-legend')
                .attr('legend', legend)
                .property('_index', serieIx)
                .selectAll('[part~=marker]')
                .data(subData)
                .enter()
                .append(createMarkerEl)
                .attr('href', marker)
                .attr('x-index', pointIx)
                .attr('selected', selected)
                .property('_depfield', depfield)
                .style('transform', setPos);

            // update / enter / exit for children
            const children = join
                .selectAll('[part~=marker]')
                .data(subData);

            children.exit().remove();

            children
                .attr('href', marker)
                .attr('state-key', stateKey)
                .attr('x-index', pointIx)
                .attr('selected', selected)
                .property('_depfield', depfield)
                .style('display', '') // Element may have been hidden in stacked mode
                .style('transform', setPos);

            children.enter()
                .append(createMarkerEl)
                .attr('href', marker)
                .attr('x-index', pointIx)
                .attr('selected', selected)
                .property('_depfield', depfield)
                .style('transform', setPos);
        }

        // Values
        if (!this._hideValues(this.showValues)) {
            const _dataValues = this.__sampleValues(_data);
            const setPos = this._setLabelPosFunc(xPos, yPos);

            // eslint-disable-next-line no-inner-declarations
            function processLabel(d) {
                // Note: don't convert to ES5 function - the this context is assigned by d3
                this.label = __dataLabel(d[3]);
                this.style.transform = setPos(d, this.clientWidth, this.clientHeight);
            }

            const join = select(this.$.values)
                .selectAll('.value-legend')
                .data(_dataValues);

            // Exit
            join.exit().remove();

            // Update
            join.attr('legend', legend);

            // Enter
            join.enter()
                .append('div')
                .attr('class', 'value-legend')
                .attr('legend', legend)
                .selectAll('[part=value]')
                .data(subData)
                .enter()
                .append('ptcs-label')
                .attr('variant', 'label')
                .attr('part', 'value')
                .property('horizontalAlignment', 'center')
                .each(processLabel);

            // update / enter / exit for children
            const children = join
                .selectAll('[part=value]')
                .data(subData);

            children.exit().remove();

            children
                .style('display', '') // Element may have been hidden in stacked mode
                .each(processLabel);

            children.enter()
                .append('ptcs-label')
                .attr('part', 'value')
                .property('horizontalAlignment', 'center')
                .each(processLabel);
        }
    }

    // Return function that selects pickList items based on mouse position
    _hoverSelectFunc(x, y, list) {
        const xPos = this.flipAxes ? y : x;
        const yPos = this.flipAxes ? x : y;
        const rec = (item, serieIx) => ({valueIx: item[2], serieIx, x: item[0], y: item[1]});

        // target method: auto (over) || x (closests x) || y (closest y) || xy (closest)
        switch (this.cursorTarget) {
            case 'x': {
                let d0;
                return (item, serieIx) => {
                    const d = (item[0] - xPos) * (item[0] - xPos);
                    if (d0 === d) {
                        list.push(rec(item, serieIx));
                    } else if (!(d0 < d)) {
                        list.length = 0;
                        list.push(rec(item, serieIx));
                        d0 = d;
                    }
                };
            }
            case 'y': {
                let d0;
                return (item, serieIx) => {
                    const d = (item[1] - yPos) * (item[1] - yPos);
                    if (d0 === d) {
                        list.push(rec(item, serieIx));
                    } else if (!(d0 < d)) {
                        list.length = 0;
                        list.push(rec(item, serieIx));
                        d0 = d;
                    }
                };
            }
            case 'xy': {
                let d0;
                return (item, serieIx) => {
                    const d = (item[0] - xPos) * (item[0] - xPos) + (item[1] - yPos) * (item[1] - yPos);
                    if (!(d0 < d)) {
                        list[0] = rec(item, serieIx);
                        d0 = d;
                    }
                };
            }
            default: {
                const delta = 8 * this._getMarkerScale(); // Half the dimension of a marker. (Unscaled size is 16px)
                if (!this.cursorTarget || this.cursorTarget === 'auto') {
                    const [x1, x2] = [xPos - delta, xPos + delta];
                    const [y1, y2] = [yPos - delta, yPos + delta];

                    // Pick all the items only if we're not hovering over a specific marker
                    if (this.hoverPick === undefined) {
                        if (this.cursorType === 'x') {
                            return (item, serieIx) => {
                                if (x1 <= item[0] && item[0] <= x2) {
                                    list.push(rec(item, serieIx));
                                }
                            };
                        }

                        if (this.cursorType === 'y') {
                            return (item, serieIx) => {
                                if (y1 <= item[1] && item[1] <= y2) {
                                    list.push(rec(item, serieIx));
                                }
                            };
                        }
                    }

                    return (item, serieIx) => {
                        if (x1 <= item[0] && item[0] <= x2 && y1 <= item[1] && item[1] <= y2) {
                            list.push(rec(item, serieIx));
                        }
                    };
                }
            }
        }
        return null;
    }

    _hoverPick(x, y) {
        if (!this.__pickData) {
            return;
        }

        function eqList(list1, list2) {
            if (!(list1 instanceof Array) || !(list2 instanceof Array)) {
                return false;
            }
            if (list1.length !== list2.length) {
                return false;
            }
            for (let i = 0; i < list1.length; i++) {
                const a = list1[i];
                const b = list2[i];
                if (a.valueIx !== b.valueIx || a.serieIx !== b.serieIx || a.x !== b.x || a.y !== b.y) {
                    return false;
                }
            }
            return true;
        }

        const list = [];
        const hoverSelect = this._hoverSelectFunc(x, y, list);
        if (!hoverSelect) {
            return;
        }
        this.__pickData.forEach(serie => serie.forEach(item => hoverSelect(item, serie.serieIx)));
        list.sort((a, b) => {
            if (a.valueIx !== b.valueIx) {
                return a.valueIx < b.valueIx ? -1 : 1;
            }
            if (a.serieIx !== b.serieIx) {
                return a.serieIx < b.serieIx ? -1 : 1;
            }
            return 0;
        });

        if (!eqList(list, this._pickList)) {
            this._pickList = list;
        }
    }

    _updatePickView(_pickList) {
        if (_pickList === this._oldPickList) {
            return;
        }
        this._oldPickList = _pickList;

        const scale = `scale(${this._getMarkerScale()})`;
        const legend = d => `L${d.serieIx + 1}`;
        const index = (d, i) => i;
        const setPos = this.flipAxes
            ? d => `translate(${d.y}px,${d.x}px) ${scale}`
            : d => `translate(${d.x}px,${d.y}px) ${scale}`;
        const _marker = this.marker;
        const _legend = Array.isArray(this.legend) ? this.legend : [];

        const marker = d => {
            const rmarker = resolveMarker(_legend[d.serieIx], _marker);
            return `#ptc-${rmarker !== 'none' ? rmarker : 'circle'}`;
        };

        const selected = d => this._selectionMgr.isSelected(d) ? '' : undefined;

        const join = select(this.$['hover-markers'])
            .selectAll('.pick-marker')
            .data(_pickList);

        // Enter
        join.enter()
            .append('g')
            .attr('class', 'marker-legend pick-marker')
            .attr('legend', legend)
            .style('display', '')
            .append('use')
            .attr('part', 'marker hover-marker')
            .property('_pickIndex', index)
            .attr('href', marker)
            .attr('x-index', d => d.valueIx)
            .attr('selected', selected)
            .style('transform', setPos);

        // Update
        join.attr('legend', legend)
            .style('display', '')
            .select('use')
            .property('_pickIndex', index)
            .attr('href', marker)
            .attr('x-index', d => d.valueIx)
            .attr('selected', selected)
            .style('transform', setPos);

        // Exit
        join.exit().style('display', 'none');
    }

    _updateTooltips(_pickList, hoverPick) {
        // Create picked markers first
        this._updatePickView(_pickList);

        // Then process the tooltip (when we have the markers)
        this._closeTooltip();
        if (!(_pickList instanceof Array) || _pickList.length <= 0) {
            return;
        }

        let tooltips = [];

        // The _pickList contains all markers on a given location, just display the tooltips for
        // the ones which are currently visible
        for (let i = 0; i < _pickList.length; i++) {
            const p = _pickList[i];
            const el = this.shadowRoot.querySelector(`#hover-markers .pick-marker:nth-child(${i + 1})`);
            if (p && el) {
                if (this._isVisibleLegend(el)) {
                    const tooltip = this._tooltipText(p.valueIx, p.serieIx);

                    if (Array.isArray(tooltip)) {
                        tooltips = tooltips.concat(tooltip);
                    } else {
                        tooltips.push(tooltip);
                    }
                }
            }
        }

        // No (visible) tooltips at the current position...
        if (tooltips.length === 0) {
            return;
        }

        // Show the tooltips we found
        const arg = hoverPick >= 0 ? {} : {hidePointer: true, shiftY: 16, shiftX: 32};

        this.__tooltipEl = this.$.hoverpoint;
        this._tooltipEnter(this.__tooltipEl, undefined, undefined, tooltips, arg);
    }

    // The mouse moves over the chart...
    _moveOverChart(ev) {
        const b = this.$.chart.getBoundingClientRect();
        const x = ev.clientX - b.left;
        const y = ev.clientY - b.top;

        // Track mouse motion with hoverlines
        this.$.hoverpoint.style.transform = `translate(${x}px,${y}px)`;
        if (this.flipAxes) {
            this.$.hoverxline.style.transform = `translate(0,${y}px)`;
            this.$.hoveryline.style.transform = `translate(${x}px,0)`;
        } else {
            this.$.hoverxline.style.transform = `translate(${x}px,0)`;
            this.$.hoveryline.style.transform = `translate(0px,${y}px)`;
        }
        if (!this.disabled) {
            this.$.hoveraggr.style.visibility = 'visible';
        }

        // Debounce generation of hover pick list
        this.__hoverPickX = x;
        this.__hoverPickY = y;
        this.__onChart = true;
        if (!this.__hoverPick) {
            this.__hoverPick = true;
            requestAnimationFrame(() => {
                this.__hoverPick = false;
                if (this.__onChart) {
                    this._hoverPick(this.__hoverPickX, this.__hoverPickY);
                }
            });
        }

        // Hovering over hover-anchor?
        this.hoverPick = ev.target._pickIndex;
    }

    _getSerie(serieIx) {
        if (!this.data) {
            return null;
        }
        if (this.data.series instanceof Array) {
            const index = this.data.series.findIndex(item => item === serieIx);
            if (index >= 0) {
                return {data: this.data, index};
            }
        }
        if (this.showY2Axis && this.data2 && this.data2.series instanceof Array) {
            const index = this.data2.series.findIndex(item => item === serieIx);
            if (index >= 0) {
                return {data: this.data2, index};
            }
        }
        if (!(this.data.series instanceof Array) && serieIx >= 0) {
            return {data: this.data, index: serieIx};
        }
        return null;
    }

    // Generate tooltip text for a data point
    _tooltipText(valueIx, serieIx) {
        const s = this._getSerie(serieIx);
        if (!s) {
            return null;
        }
        const _legend = index => {
            if (this.legend && this.legend[index]) {
                return this.legend[index].label || this.legend[index];
            }
            return `Serie ${serieIx + 1}`;
        };
        const v = s.data[valueIx];
        if (v === undefined) {
            return null;
        }

        let x, y;
        const format = value => value instanceof Date ? moment(value).format(this.xDateFormatToken) : value;
        const adjust = this.xDateFormatToken ? format : value => value;

        // The original data may have gaps for this value (unless it is stacked),
        // so the data must be retrived from the massaged data
        if (s.data === this.data && this._data) {
            x = adjust(this._data[s.index][valueIx][0]);
            y = this._data[s.index][valueIx][1];
        } else if (s.data === this.data2 && this._data2) {
            x = adjust(this._data2[s.index][valueIx][0]);
            y = this._data2[s.index][valueIx][1];
        } else {
            x = __xv(v);
            y = __yv(v)[s.index];
            if (y === undefined) {
                y = '';
            }
        }

        const series = _legend(serieIx);
        let tooltip;

        if (this.tooltipTemplate) {
            tooltip = getChartTooltip(this.tooltipTemplate, Object.assign({
                label: x,
                series,
                value: y
            }, __dataFields(v)));
        } else {
            tooltip = `${x}, ${series}: ${y}`;
        }

        return tooltip;
    }

    // Show tooltip for a single data point
    _openTooltip(el, valueIx, serieIx, x, y) {
        if (el === this.__tooltipEl) {
            // No change
            return;
        }
        this._closeTooltip();
        // Open tooltip for marker
        if (el) {
            const tooltip = this._tooltipText(valueIx, serieIx);
            if (tooltip) {
                this.__tooltipEl = el;
                this._tooltipEnter(this.__tooltipEl, x, y, tooltip);
            }
        }
    }

    _closeTooltip() {
        if (this.__tooltipEl) {
            this._tooltipLeave(this.__tooltipEl);
            this.__tooltipEl = null;
        }
    }

    // Find the top-most marker not filtered out
    _pickMarker() {
        if (this._pickList instanceof Array && this._pickList.length > 0) {
            // Loop the items in _pickList backwards to find the "topmost" item not filtered out
            for (let i = this._pickList.length - 1; i >= 0; i--) {
                if (!(this.filterLegend instanceof Array) || this.filterLegend.includes(this._pickList[i].serieIx)) {

                    // Found a marker not filtered out
                    let point = this._pickList[i];

                    // _pickList and focus format are not compatible when axes are flipped
                    if (this.flipAxes) {
                        point = {valueIx: point.valueIx, serieIx: point.serieIx, x: point.y, y: point.x};
                    }

                    return point;
                }
            }
        }
        return null;
    }

    _clickOnChart(ev) {
        if (this.disabled) {
            return;
        }

        const point = this._pickMarker();
        if (point) {
            // Select the clicked marker
            this._selectPoint(point);
        } else {
            // No marker was selected, handle region click
            this._clickRegion(ev.target);
        }
    }

    _clickRegion(el) {
        if (this.showAreas && this._isVisibleLegend(el)) {
            // Area was clicked
            const serieIx = Number(el.getAttribute('legend').substring(1)) - 1;
            const s = this._getSerie(serieIx);
            if (!s) {
                return;
            }
            const num = s.data.length;
            const seriesData = [];
            for (let i = 0; i < num; i++) {
                const v = s.data[i];
                if (!v) {
                    continue;
                }
                const x = __xv(v);
                const y = __yv(v)[s.index];
                if (x !== undefined && x !== null && y !== undefined && y !== null) {
                    seriesData.push({serieIx: serieIx, valueIx: i, x, y});
                }
            }

            this.dispatchEvent(new CustomEvent('series-click', {
                bubbles:  true,
                composed: true,
                detail:   seriesData
            }));
        }
    }

    _seriesMarker(seriesIx) {
        return resolveMarker(Array.isArray(this.legend) && this.legend[seriesIx], this.marker);
    }

    _selectPoint(_selected) {
        if (!_selected) {
            return; // Invalid call
        }
        const {serieIx, valueIx} = _selected;
        const s = this._getSerie(serieIx);
        if (!s) {
            return;
        }
        const v = s.data[valueIx];
        const markerData = {serieIx, valueIx, x: __xv(v), y: __yv(v)[s.index]};

        if (this._seriesMarker(serieIx) !== 'none') {
            this._focusOn(_selected, true);
        }

        this._selectionMgr.select(markerData);

        this.dispatchEvent(new CustomEvent('series-click', {
            bubbles:  true,
            composed: true,
            detail:   markerData
        }));

        // Has a zoom range been selected?
        if (!this.zoomSelect) {
            return; // Not in zoom selection mode
        }
        if (!this._selectionMgr.selection || this._selectionMgr.selection.length < 2) {
            return; // Don't have two selected bars
        }

        const sel1 = this._selectionMgr.selection[0];
        const sel2 = this._selectionMgr.selection[1];
        this._selectionMgr.selection = null;

        const yScale = ix => this.data2 && this.data2.series && this.data2.series.includes(ix) ? this.y2Scale : this.yScale;
        const yScale1 = yScale(sel1.serieIx);
        const yScale2 = yScale(sel2.serieIx);
        if (!this.xScale || !yScale1 || !yScale2) {
            return; // Internal error
        }

        // Compute screen coordinates of selected values
        const f = (val, scale) => scale(val) + (scale.bandwidth ? scale.bandwidth() / 2 : 0);
        const x1 = f(sel1.x, this.xScale);
        const y1 = f(sel1.y, yScale1);
        const x2 = f(sel2.x, this.xScale);
        const y2 = f(sel2.y, yScale2);

        // Compute selected screen area
        const d = 8 * this._getMarkerScale(); // Half the size
        const left = Math.min(x1, x2) - d;
        const top = Math.min(y1, y2) - d;
        const right = Math.max(x1, x2) + d;
        const bottom = Math.max(y1, y2) + d;

        // Report selected area
        this.dispatchEvent(new CustomEvent('zoom-selection', {
            bubbles:  true,
            composed: true,
            detail:   {x: left, y: top, w: right - left, h: bottom - top}
        }));
    }

    _setSelectedData(_focus) {
        if (this._selectionMgr.selectMethod !== 'none') {
            return;
        }

        if (_focus && !isNaN(_focus.valueIx) && !isNaN(_focus.serieIx)) {
            const s = this._getSerie(_focus.serieIx);

            if (s && s.data) {
                // Get the x value from the data or data2 depends to which of them _focus.serieIx is related
                const xvalue = __xv(s.data[_focus.valueIx]);

                if (this.selectedData && this.selectedData.x === xvalue && this.selectedData.serieIx === _focus.serieIx) {
                    return;
                }

                this.selectedData = {x: xvalue, serieIx: _focus.serieIx};
            }
        }
    }

    // Dimension of chart or axis orientation may have changed
    _updateHoverline() {
        const b = this.$.chart.getBoundingClientRect();
        if (this.flipAxes) {
            this.$.hoverxline.setAttribute('d', `M0 0 L${b.width} 0`);
            this.$.hoveryline.setAttribute('d', `M0 0 L0 ${b.height}`);
        } else {
            this.$.hoverxline.setAttribute('d', `M0 0 L0 ${b.height}`);
            this.$.hoveryline.setAttribute('d', `M0 0 L${b.width} 0`);
        }
        switch (this.cursorType) {
            case 'x':
                this.$.hoverxline.style.visibility = '';
                this.$.hoveryline.style.visibility = 'hidden';
                break;
            case 'y':
                this.$.hoverxline.style.visibility = 'hidden';
                this.$.hoveryline.style.visibility = '';
                break;
            case 'xy':
                this.$.hoverxline.style.visibility = '';
                this.$.hoveryline.style.visibility = '';
                break;
            default:
                this.$.hoverxline.style.visibility = 'hidden';
                this.$.hoveryline.style.visibility = 'hidden';
        }
    }

    _dragStart(ev) {
        if (this.disabled) {
            return;
        }

        // Select marker immediately on mouse down
        if (this._anyMarkers) {
            const point = this._pickMarker();
            if (point && this._seriesMarker(point.serieIx) !== 'none') {
                this._focusOn(point, true);
            }
        }

        if ((!this.zoomDragX && !this.zoomDragY)) {
            return; // Zoom selection is not enabled
        }
        const x = ev.clientX;
        const y = ev.clientY;

        this._movedMouse = 0;
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
        if (this.disabled) {
            return;
        }
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

        // Clear selection and report range
        this._selected = null;

        this.dispatchEvent(new CustomEvent('zoom-selection', {
            bubbles:  true,
            composed: true,
            detail:   {x, y, w, h}
        }));
    }

    _focusOn(_focus, scroll) {
        if (this.disabled) {
            return;
        }
        const el = this.$.focusmarker;
        if (!el) {
            return;
        }

        this._setSelectedData(_focus);

        this._focus = _focus;
        if (!_focus) {
            el.style.display = 'none';
            return;
        }

        const marker = this._seriesMarker(_focus.serieIx);

        // Focus border is 2px wide and 1px away from the marker, which is 16px when unscaled
        const scale = (this._getMarkerScale() * 16 + 4) / 16;

        el.setAttribute('href', `#ptc-${marker !== 'none' ? marker : 'circle'}`);
        el.style.transform = `translate(${_focus.x}px,${_focus.y}px) scale(${scale})`;
        el.style.display = '';
        if (scroll) {
            el.scrollIntoViewIfNeeded();
        }
    }

    /*
     * In the provided data find the closest x value to a given point.
     * @param currentXValue - Starting x value.
     * @param dir - In what direction to search ('next'/'prev').
     */
    _pickXCandidate(data, currentXValue, dir) {
        const serieMatchesLegendFilter = (i) => {
            if (data.series) {
                return this.filterLegend.includes(data.series[i]);
            }

            return this.filterLegend.includes(i);
        };

        const xNextValue = () => data.reduce((nextX, curX, index) => {
            if (__yv(curX).length > 0 && this._xCmp(__xv(curX), __xv(currentXValue)) > 0 &&
                    (nextX === undefined || this._xCmp(__xv(curX), __xv(nextX.x)) < 0) &&
                    !(this.filterLegend && __yv(curX).filter((e, i) => serieMatchesLegendFilter(i)).length === 0)) {
                return {x: curX, index};
            }

            return nextX;
        }, undefined);

        const xPreviousValue = () => data.reduce((nextX, curX, index) => {
            if (__yv(curX).length > 0 && this._xCmp(__xv(curX), __xv(currentXValue)) < 0 &&
                    (nextX === undefined || this._xCmp(__xv(curX), __xv(nextX.x)) > 0) &&
                    !(this.filterLegend && __yv(curX).filter((e, i) => serieMatchesLegendFilter(i)).length === 0)) {
                return {x: curX, index};
            }

            return nextX;
        }, undefined);

        return dir === 'next' ? xNextValue() : xPreviousValue();
    }

    _pickData(valueIx, serieIx, findAvailableSerie = false) {
        if (!this.xScale || !this.yScale) {
            return null;
        }
        const s = this._getSerie(serieIx);
        if (!s) {
            return null;
        }
        const isY2 = s.data !== this.data;

        let yScale = isY2 ? this.y2Scale : this.yScale;
        if (!yScale) {
            return null;
        }
        let point;
        if (this._stackedData && s.data === this.data) {
            const [x, y] = [this._stackedData.x, this._stackedData.y];
            if (y[s.index] && y[s.index][valueIx]) {
                point = [x[valueIx], y[s.index][valueIx][1]];
            }
        } else if (this._stackedData2 && s.data === this.data2) {
            const [x, y] = [this._stackedData2.x, this._stackedData2.y];
            if (y[s.index] && y[s.index][valueIx]) {
                point = [x[valueIx], y[s.index][valueIx][1]];
            }
        } else {
            const p = s.data[valueIx];

            if (!p || __yv(p).length === 0) {
                // no next x value to move to
                return null;
            }

            const pvalues = __yv(p);
            let pvalue = pvalues[s.index];

            if (pvalue === undefined && findAvailableSerie) {
                // The value for the specific serie doesn't exist. Let's find a serie that does have a value.
                for (let i = 0; i < pvalues.length; i++) {
                    serieIx = i;

                    if (serieIx === s.index) {
                        continue;
                    }

                    pvalue = pvalues[serieIx];

                    if (pvalue !== undefined) {
                        if (s.data.series) {
                            serieIx = s.data.series[serieIx];
                        }

                        if (this.filterLegend && !this.filterLegend.includes(serieIx)) {
                            continue;
                        }

                        break;
                    }
                }
            }

            point = [__xv(p), pvalue];
        }
        if (point && point[0] !== undefined && point[1] !== undefined) {
            const deltaX = this.xScale.bandwidth ? this.xScale.bandwidth() / 2 : 0;
            const deltaY = yScale.bandwidth ? yScale.bandwidth() / 2 : 0;
            const x = this.xScale(point[0]) + deltaX;
            const y = yScale(point[1]) + deltaY;
            if (!isNaN(x) && !isNaN(y)) {
                return this.flipAxes ? {x: y, y: x, valueIx, serieIx} : {x, y, valueIx, serieIx};
            }
        }
        return null;
    }

    _pickDataEx(valueIx, serieIx) {
        let p = this._pickData(valueIx, serieIx);
        if (p) {
            return p;
        }
        if (valueIx === 0) {
            while (++valueIx < this.data.length) {
                p = this._pickData(valueIx, serieIx);
                if (p) {
                    return p;
                }
            }
        } else {
            while (valueIx-- > 0) {
                p = this._pickData(valueIx, serieIx);
                if (p) {
                    return p;
                }
            }
        }
        return null;
    }

    _checkFilteredSeries(current, next, limit) {
        if (!(this.filterLegend instanceof Array)) {
            return next;
        }
        if (this.filterLegend.includes(next)) {
            return next;
        }

        const nextEQLimit = next === limit;
        const currentBIGnext = current > next;
        let operation = nextEQLimit === currentBIGnext ? 1 : -1;

        let condition;
        if (nextEQLimit) {
            condition = (test) => test !== current;
        } else if (currentBIGnext) {
            condition = (test) => test >= limit;
        } else {
            condition = (test) => limit >= test;
        }

        let testSeries = next;
        while (condition(testSeries)) {
            testSeries = testSeries + operation;
            if (this.filterLegend.includes(testSeries)) {
                return testSeries;
            }
        }
        return current !== next ? current : -1;
    }

    _initTrackFocus() {
        // Handle focus ourself
        this._trackFocus(this, () => null);
    }

    // Update focus
    _traceFocus() {
        if (this._focus) {
            this._focusOn(this._pickData(this._focus.valueIx, this._focus.serieIx));
        }
    }

    _notifyFocus() {
        // Make sure a chart item has focus, if possible
        if (!this._focus) {
            const initSeries = this._checkFilteredSeries(0, 0, __yv(this.data[0]).length - 1);
            this._focusOn(this._pickData(0, initSeries), true);
        }
        if (this._focus) {
            this._openTooltip(this.$.focusmarker, this._focus.valueIx, this._focus.serieIx);
        }
    }

    _notifyBlur() {
        this._closeTooltip();
    }

    _keyDown(ev) {
        if (this.disabled) {
            return;
        }
        if (!(this._series instanceof Array)) {
            return;
        }
        if (!this._focus) {
            const initSeries = this._checkFilteredSeries(0, 0, __yv(this.data[0]).length - 1);
            this._focusOn(this._pickData(0, initSeries));
            if (!this._focus) {
                return;
            }
        }
        let focus = null;
        const series = this.filterLegend ? this._series.filter(ix => this.filterLegend.includes(ix)) : this._series;
        let six = series.findIndex(item => item === this._focus.serieIx);

        const findNextXValue = (valueIx, serieIx, dir) => {
            const s = this._getSerie(this._focus.serieIx);
            const isY2 = s.data !== this.data;

            const xValue = s.data[valueIx];

            const yAxisXCandidate = this._pickXCandidate(this.data, xValue, dir);
            let y2AxisXCandidate;

            if (this.showY2Axis && this.data2) {
                y2AxisXCandidate = this._pickXCandidate(this.data2, xValue, dir);
            }

            const getAvailableSerie = (data, candidate) => {
                const serie = __yv(candidate.x).findIndex((e, i) => e !== undefined &&
                    !(this.filterLegend && !this.filterLegend.includes(data.series[i])));

                return data.series[serie];
            };

            if (yAxisXCandidate && y2AxisXCandidate) {
                const yAxisXLabel = __xv(yAxisXCandidate.x);
                const y2AxisXLabel = __xv(y2AxisXCandidate.x);

                if (!isY2 && (dir === 'next' && this._xCmp(yAxisXLabel, y2AxisXLabel) > 0 ||
                    dir === 'prev' && this._xCmp(yAxisXLabel, y2AxisXLabel) < 0)) {
                    // Next candidate on the Y2 Axis is closer than the next candidate on the Y Axis.
                    return {valueIx: y2AxisXCandidate.index, serieIx: getAvailableSerie(this.data2, y2AxisXCandidate)};
                }

                if (isY2 && (dir === 'next' && this._xCmp(yAxisXLabel, y2AxisXLabel) < 0 ||
                    dir === 'prev' && this._xCmp(yAxisXLabel, y2AxisXLabel) > 0)) {
                    // Next candidate on the Y Axis is closer than the next candidate on the Y2 Axis.
                    return {valueIx: yAxisXCandidate.index, serieIx: getAvailableSerie(this.data, yAxisXCandidate)};
                }

                // Next candidate is on the current Axis.
                return isY2 ? {valueIx: y2AxisXCandidate.index, serieIx} : {valueIx: yAxisXCandidate.index, serieIx};
            } else if (y2AxisXCandidate) {
                // No candidate on the Y Axis. Next candidates on the Y2 Axis.
                return {valueIx: y2AxisXCandidate.index,
                    serieIx: isY2 ? serieIx : getAvailableSerie(this.data2, y2AxisXCandidate)};
            } else if (yAxisXCandidate) {
                // No candidate on the Y2 Axis. Next candidates on the Y Axis.
                return {valueIx: yAxisXCandidate.index,
                    serieIx: isY2 ? getAvailableSerie(this.data, yAxisXCandidate) : serieIx};
            }

            // No candidates to jump to. Stay on the same focused marker.
            return {valueIx, serieIx};
        };

        let nextXValue;

        switch (ev.key) {
            case 'ArrowLeft':
                nextXValue = findNextXValue(this._focus.valueIx, this._focus.serieIx, 'prev');
                focus = this._pickData(nextXValue.valueIx, nextXValue.serieIx, true);
                break;
            case 'ArrowRight':
                nextXValue = findNextXValue(this._focus.valueIx, this._focus.serieIx, 'next');
                focus = this._pickData(nextXValue.valueIx, nextXValue.serieIx, true);
                break;
            case 'ArrowUp':
                focus = this._pickData(this._focus.valueIx, series[six - 1]);
                break;
            case 'ArrowDown':
                focus = this._pickData(this._focus.valueIx, series[six + 1]);
                break;
            case 'PageUp':
                focus = this._pickData(this._focus.valueIx, series[0]);
                break;
            case 'PageDown':
                focus = this._pickData(this._focus.valueIx, series[series.length - 1]);
                break;
            case 'Home':
                focus = this._pickDataEx(0, this._focus.serieIx);
                break;
            case 'End':
                focus = this._pickDataEx(this.data.length - 1, this._focus.serieIx);
                break;
            case 'Enter':
            case ' ':
                // Select focused item
                this._selectPoint(this._focus);
                break;
            default:
                // Not handled
                return;
        }

        // We consumed this keyboard event. Don't propagate
        ev.preventDefault();

        if (focus) {
            this._focusOn(focus, true);
            this._closeTooltip();
            this._openTooltip(this.$.focusmarker, focus.valueIx, focus.serieIx);
        }
    }

    _findMarker({valueIx, serieIx}) {
        return this.shadowRoot.querySelector(`.marker-legend[legend=L${serieIx + 1}] > [x-index="${valueIx}"]`);
    }

    _findPickMarker({valueIx, serieIx}) {
        return this.$['hover-markers'].querySelector(`.marker-legend[legend=L${serieIx + 1}] > [x-index="${valueIx}"]`);
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

    _selectedDataChanged(selectedData) {
        this._selectionMgr.selection = selectedData;
    }

    selectedChanged(sel, selected) {
        const setSelect = el => {
            if (el) {
                if (selected) {
                    el.setAttribute('selected', '');
                } else {
                    el.removeAttribute('selected');
                }
            }
        };
        setSelect(this._findMarker(sel));
        setSelect(this._findPickMarker(sel));
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


PTCS.ChartCoreLine.curveMap = {
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

PTCS.ChartCoreLine.stackOrder = {
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

PTCS.ChartCoreLine.stackOffset = {
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


customElements.define(PTCS.ChartCoreLine.is, PTCS.ChartCoreLine);
