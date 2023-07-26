import {PolymerElement, html} from '@polymer/polymer/polymer-element.js';
import {PTCS} from 'ptcs-library/library.js';
import {invertScalePoint, getChartTooltip} from 'ptcs-library/library-chart.js';
import {SelectionMgr} from '../selection/chart-selection.js';
import {removeChildren} from '../draw/ptcs-chart-draw-library';
import {select} from 'd3-selection';
import {enableSvgGradients, disableSvgGradients, getGradientCSS} from 'ptcs-library/svg-gradients.js';
import {addNoCollideFunc} from 'ptcs-library/collision-2d.js';

import 'ptcs-icon/ptcs-icon.js'; // Needed in tooltip

import 'ptcs-behavior-styleable/ptcs-behavior-styleable.js';
import {getTooltipOverlayElem} from 'ptcs-behavior-tooltip/ptcs-behavior-tooltip.js';
import 'ptcs-behavior-focus/ptcs-behavior-focus.js';
import 'ptcs-style-unit/ptcs-part-observer.js';


/* eslint-disable no-confusing-arrow, no-inner-declarations */

// Hot area around data point when picking markers
const PICK_D = 4;

// Default sort order of drawables
const zIndexType = {
    bar:             1,
    'stacked-bars':  1,
    area:            2,
    'stacked-areas': 2,
    streamgraph:     3,
    line:            4,
    step:            5,
    scatter:         6
};

// Compare zIndex of drawables
const compareZindex = (a, b) => (a.zIndex !== b.zIndex) ? (a.zIndex - b.zIndex) : (zIndexType[a.chartType] || 0) - (zIndexType[b.chartType] || 0);

// Do drawable display bars?
const isaBar = drawable => ['bar', 'stacked-bars'].indexOf(drawable.chartType) >= 0;

// Compare selected data points
function compareSelectionObjects(sel1, sel2) {
    if (sel1.valueIx !== sel2.valueIx) {
        return sel1.valueIx - sel2.valueIx;
    }
    return sel1.serieIx - sel2.serieIx;
}

PTCS.ChartCoreCombo = class extends PTCS.BehaviorTooltip(PTCS.BehaviorFocus(PTCS.BehaviorStyleable(PTCS.ThemableMixin(PolymerElement)))) {

    static get template() {
        return html`
        <style>
        :host {
            display: block;
            position: relative;
            width: 100%;
            height: 100%;
            --ptcs-tooltip-start-delay: 100;
        }

        :host(:not(:focus)) [part][need-focus] {
            display: none;
        }

        :host([hide-focus]) [part][need-focus] {
            display: none;
        }

        #chart {
            height: 100%;
        }

        svg {
            height: 100%;
            width: 100%;
        }

        ptcs-label[part=value] {
            position: absolute;
            left: 0;
            top: 0;
            min-width: unset;
            box-sizing: border-box;
            pointer-events: none;
        }

        [rotate-values] ptcs-label[part=value] {
            writing-mode: vertical-lr;
        }

        [part=drag-rect] {
            display: none;
        }

        #hoveraggr {
            pointer-events: none;
        }

        #tooltip-colors {
            visibility: hidden;
        }

        :host([show-chart-bands]) [part=bar]:not([hover]):not([no-outline]) {
            outline: 1px solid var(--ptcs-chart-bar-outline, #FFFFFF);
        }

        :host([disabled]) #hoveraggr, :host(:not(:hover)) #hoveraggr, :host(:active) #hoveraggr {
            display: none;
        }

        :host(:not([cursor-type*=x])) #hoverxline {
            display: none;
        }

        :host(:not([cursor-type*=y])) #hoveryline {
            display: none;
        }
        </style>

        <div id="chart" on-dragstart="_ondragstart">
            <ptcs-part-observer>
            <svg id="svg" on-mousedown="_dragStart" on-mousemove="_moveOverChart" on-mouseleave="_mouseLeaveChart">
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
                <g id="graphs"></g>
                <g id="focus" style="pointer-events: none"></g>
                <g id="hover"></g>
                <g id="hoveraggr">
                    <path id="hoverxline" part="hover-line"/>
                    <path id="hoveryline" part="hover-line"/>
                </g>
                <g id="tooltip-colors"></g>
                <rect id="dragrect" part="drag-rect"></rect>
            </svg>
            </ptcs-part-observer>
            <div id="values"></div>
        </div>`;
    }

    static get is() {
        return 'ptcs-chart-core-combo';
    }

    static get properties() {
        return {
            disabled: {
                type:               Boolean,
                reflectToAttribute: true
            },

            // The original data
            data: {
                type:     Array,
                observer: '_dataChanged'
            },

            // {bar: [], area: [], line: [], axesMap: Map }
            drawables: {
                type:     Object,
                observer: 'refresh'
            },

            // Scale that maps x-positions to x-axis
            xScale: {
                type:     Function,
                observer: 'refresh'
            },

            flipAxes: {
                type:     Boolean,
                observer: 'refresh'
            },

            // Report when mouse is dragging (to prevent selections)
            dragging: {
                type:   Boolean,
                notify: true
            },

            // X-zoom by dragging the mouse over the chart
            zoomDragX: {
                type: Boolean
            },

            // Y-zoom by dragging the mouse over the chart
            zoomDragY: {
                type: Boolean
            },

            // zoom by selecting two elements
            zoomSelect: {
                type: Boolean
            },

            legend: {
                type: Array
            },

            // Indices of selected (visible) series (legends)
            selectedLegend: {
                type:     Array,
                observer: '_selectedLegendChanged'
            },

            tooltipTemplate: {
                type: String
            },

            // Items that is hovered
            _hoverItems: {
                type:     Array,
                observer: '_hoverItemsChanged'
            },

            // Focused data point: {valueIx, serieIx}
            _focus: {
                type:     Object,
                observer: '_focusChanged'
            },

            // 'none' || 'single' || 'mutiple'
            selectionMode: {
                type: String
            },

            _selectionMgr: {
                type:  SelectionMgr,
                value: () => new SelectionMgr(compareSelectionObjects)
            },

            // cursor: auto (just mouse) || x (x-line) || y (y-line) || xy (cross)
            cursorType: {
                type:               String,
                reflectToAttribute: true
            },

            // target method: auto (over) || x (closest x) || y (closest y) || xy (closest) || none
            cursorTarget: {
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
            },

            showChartBands: {
                type:               Boolean,
                reflectToAttribute: true,
                observer:           'refresh'
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

    connectedCallback() {
        super.connectedCallback();
        enableSvgGradients(this, this.$.defs);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        disableSvgGradients(this);
    }

    get _allDrawables() {
        return [...this.drawables.bar, ...this.drawables.area, ...this.drawables.line];
    }

    _dataChanged() {
        this._selectionMgr.selection = null;
        const emptyState = !(this.data && Array.isArray(this.data) && this.data.length);
        this._setChartStateDataEmpty(emptyState);
    }

    refresh() {
        if (this.__refreshDebounce) {
            return;
        }
        this.__refreshDebounce = true;
        requestAnimationFrame(() => {
            this.__refreshDebounce = undefined;
            this.__refresh();
            this._updateHoverline();
            this._refreshFocus();

            // If focused element has become hidden
            if (this._focus && this.selectedLegend.indexOf(this._focus.serieIx) === -1) {
                this._focus = this._firstFocusable;
            }
        });
    }

    __refresh() {
        const xScale = this.xScale;
        if (!xScale) {
            return;
        }

        const flipAxes = this.flipAxes;
        const axisMap = this.drawables.axisMap;
        const yScales = this.yScales;
        const selectionMgr = this._selectionMgr;
        const {bar, area, line} = this.drawables;
        const drawables = [...bar, ...area, ...line].sort(compareZindex);
        const showChartBands = this.showChartBands;

        function draw(drawable) {
            const yScale = yScales[axisMap.get(drawable)];
            if (yScale) {
                function subdraw(drawMarkers) {
                    if (drawMarkers) {
                        drawable.drawMarkers({el: this, xScale, yScale, flipAxes, selectionMgr});
                    } else {
                        drawable.draw({el: this, xScale, yScale, flipAxes, selectionMgr, showChartBands});
                    }
                }

                // Draw chart and then markers
                const join = select(this).selectAll(':scope > g.top').data(isaBar(drawable) ? [false] : [false, true]);

                join.enter()
                    .append('g')
                    .attr('class', 'top')
                    .each(subdraw);

                join.each(subdraw);

                join.exit().remove();

            } else {
                removeChildren(this);
            }
        }

        // Bars, lines, areas, and markers
        {
            const join = select(this.$.graphs)
                .selectAll('g.graph')
                .data(drawables);

            // Enter
            join.enter()
                .append('g')
                .attr('class', 'graph')
                .each(draw);

            // Update
            join.each(draw);

            // Exit
            join.exit().remove();
        }

        // Values
        {
            let rotateValues = false;
            let unrotatedValues = false;

            // Collision detection
            let fit = addNoCollideFunc(this.clientWidth, this.clientHeight);

            function drawValues(drawable) {
                const yScale = yScales[axisMap.get(drawable)];
                if (yScale) {
                    drawable.drawValues({el: this, xScale, yScale, flipAxes, rotateValues, fit});
                } else {
                    removeChildren(this);
                }

                // Coordinate rotated bar values (if one bar rotates the values, all bar values must be rotated)
                if (isaBar(drawable)) {
                    if (this.hasAttribute('rotate-values')) {
                        rotateValues = true;
                    } else if (!this.__$hidden) {
                        unrotatedValues = true;
                    }
                }
            }

            function rotateBarValues(drawable) {
                if (this.__$hidden) {
                    return;
                }
                if (isaBar(drawable) && !this.hasAttribute('rotate-values')) {
                    const yScale = yScales[axisMap.get(drawable)];
                    if (yScale) {
                        drawable.drawValues({el: this, xScale, yScale, flipAxes, rotateValues: true, fit});
                    }
                } else {
                    // Reserve space for the already placed labels
                    const bb0 = this.getBoundingClientRect();

                    this.querySelectorAll('ptcs-label').forEach(el => {
                        const bb = el.getBoundingClientRect();
                        if (bb.width > 0 && bb.height > 0) {
                            fit(bb.left - bb0.left, bb.top - bb0.top, bb.width, bb.height);
                        }
                    });
                }
            }

            const join = select(this.$.values)
                .selectAll('div.values')
                .data(this._allDrawables);

            // Enter
            join.enter()
                .append('div')
                .attr('class', 'values')
                .each(drawValues);

            // Update
            join.each(drawValues);

            // Exit
            join.exit().remove();

            if (rotateValues && unrotatedValues) {
                // Some values are rotated, some are not
                fit = addNoCollideFunc(this.clientWidth, this.clientHeight); // Needs new collision detection

                select(this.$.values).selectAll('div.values').data(this._allDrawables).each(rotateBarValues);
            }
        }
    }

    _refreshSelection() {
        const xScale = this.xScale;
        if (!xScale) {
            return;
        }

        const flipAxes = this.flipAxes;
        const axisMap = this.drawables.axisMap;
        const yScales = this.yScales;
        const selectionMgr = this._selectionMgr;
        const {bar, area, line} = this.drawables;
        const drawables = [...bar, ...area, ...line].sort(compareZindex);

        function updateSelection(drawable) {
            const yScale = yScales[axisMap.get(drawable)];
            if (yScale) {
                select(this).selectAll(':scope > g.top').data(isaBar(drawable) ? [false] : [false, true]).each(function(drawMarkers) {
                    if (drawMarkers) {
                        drawable.updateMarkerSelection({el: this, xScale, yScale, flipAxes, selectionMgr});
                    } else {
                        drawable.updateSelection({el: this, xScale, yScale, flipAxes, selectionMgr});
                    }
                });
            }
        }

        select(this.$.graphs).selectAll('g.graph').data(drawables).each(updateSelection);
    }

    _getSeriesColor(selection, hover = false) {
        const {xScale, yScales, flipAxes, showChartBands} = this;
        if (!xScale) {
            return;
        }
        const axisMap = this.drawables.axisMap;

        function showSeries(d) {
            const yScale = yScales[axisMap.get(d)];
            if (yScale) {
                d.showSelection({el: this, xScale, yScale, flipAxes, selection, showChartBands});
            } else {
                removeChildren(this);
            }
        }

        const join = select(this.$['tooltip-colors'])
            .selectAll('g')
            .data(this._allDrawables);

        // Enter
        join.enter()
            .append('g')
            .each(showSeries);

        // Update
        join.each(showSeries);

        // Exit
        join.exit().remove();
    }

    _refreshHover(selection) {
        const {xScale, yScales, flipAxes, _selectionMgr, _focus, showChartBands} = this;
        if (!xScale) {
            return;
        }
        const axisMap = this.drawables.axisMap;

        function cb(sel) {
            this.setAttribute('hover', '');
            PTCS.setbattr(this, 'focus', _focus && compareSelectionObjects(_focus, sel) === 0);
            PTCS.setbattr(this, 'selected', _selectionMgr.isSelected(sel));
        }

        function showHover(d) {
            const yScale = yScales[axisMap.get(d)];
            if (yScale) {
                d.showSelection({el: this, xScale, yScale, flipAxes, selection, cb, showChartBands});
            } else {
                removeChildren(this);
            }
        }

        const join = select(this.$.hover)
            .selectAll('g')
            .data(this._allDrawables);

        // Enter
        join.enter()
            .append('g')
            .each(showHover);

        // Update
        join.each(showHover);

        // Exit
        join.exit().remove();
    }

    _pickHover(ev) {
        const el = ev.target;
        const g = el && el.closest('#hover > g');
        if (!g) {
            return {point: null, all: null};
        }

        const drawable = this._allDrawables[PTCS.getChildIndex(g)];
        const index = PTCS.getChildIndex([...g.querySelectorAll(':scope > *')].find(e => e.contains(el)));
        const point = index >= 0 && drawable && this._hoverItems.filter(item => drawable.displaysSeries(item.serieIx))[index];

        let all;
        if (this.selectionMode === 'multiple') {
            all = this.flipAxes ? this._pickPoints(ev.offsetY, ev.offsetX, 'auto') : this._pickPoints(ev.offsetX, ev.offsetY, 'auto');
        }

        return {point, all};
    }

    _refreshFocus() {
        const {xScale, yScales, flipAxes, _selectionMgr, showChartBands} = this;
        if (!xScale) {
            return;
        }
        const drawable = this._focus && this._allDrawables.find(d => d.displaysSeries(this._focus.serieIx) && !d.hidden);
        const axisMap = this.drawables.axisMap;

        function cb(sel) {
            this.setAttribute('need-focus', ''); // Only show when chart has focus
            this.setAttribute('focus', '');
            PTCS.setbattr(this, 'selected', _selectionMgr.isSelected(sel));
        }

        function showFocus(d) {
            const yScale = yScales[axisMap.get(drawable)];
            if (yScale) {
                drawable.showSelection({el: this, xScale, yScale, flipAxes, selection: [d], cb, showChartBands});
            } else {
                removeChildren(this);
            }
        }

        const join = select(this.$.focus)
            .selectAll('g')
            .data(drawable ? [this._focus] : []);

        // Enter
        join.enter()
            .append('g')
            .each(showFocus);

        // Update
        join.each(showFocus);

        // Exit
        join.exit().remove();
    }

    _hoverItemsChanged(_hoverItems, old) {
        if (!PTCS.sameArray(_hoverItems, old, (a, b) => a.valueIx === b.valueIx && a.serieIx === b.serieIx)) {
            // Show hovered data points
            this._refreshHover(_hoverItems);

            // Display corresponding tooltips
            this._updateTooltips();
        }
    }

    _updateTooltips(onFocus = false) {
        function focusOf(el) {
            for (; el; el = el.parentNode) {
                if (el.nodeType === 11 && el.host) {
                    return el.host.shadowRoot.activeElement;
                }
            }
            return document.activeElement;
        }

        let tooltips, x, y;

        if (!onFocus && this._hoverItems && this._hoverItems.length > 0) {
            tooltips = this._hoverItems;
            x = this._movingMouse.x;
            y = this._movingMouse.y;
        } else {
            const fe = focusOf(this);
            const f = (fe === this || this.contains(fe)) && this._focus;
            const el = f && this.$.focus.querySelector('[need-focus]');
            const bb = el && el.getBoundingClientRect();
            if (bb && bb.width && bb.height) {
                const chartType = this._allDrawables.find(d => d.displaysSeries(f.serieIx)).chartType;
                const bb0 = this.getBoundingClientRect();
                x = bb.left - bb0.left + bb.width / 2;
                y = bb.top - bb0.top + bb.height / 2;
                tooltips = [{...f, x: this.data[f.valueIx][0], y: this.data[f.valueIx][1][f.serieIx], chartType}];
            } else {
                tooltips = [];
            }
        }

        if (PTCS.sameArray(this._tooltips, tooltips, (a, b) => a.valueIx === b.valueIx && a.serieIx === b.serieIx)) {
            return;
        }

        this._tooltips = tooltips;
        this._showTooltip(tooltips, x, y);
    }

    _showTooltip(tooltips, x, y) {
        // Stop tooltip timer, if running
        if (this.__tooltipTimeout) {
            clearTimeout(this.__tooltipTimeout);
            this.__tooltipTimeout = undefined;
        }

        // Hide tooltip, if not data points
        if (tooltips.length === 0) {
            getTooltipOverlayElem().hide();
            this.__tooltipVisible = undefined;
            return;
        }

        const displayNow = () => {
            const defaultLegend = seriesIx => `Series ${seriesIx + 1}`;

            const legend = Array.isArray(this.legend)
                ? seriesIx => (this.legend[seriesIx] && this.legend[seriesIx].label) || defaultLegend(seriesIx)
                : defaultLegend;

            const dataFields = d => d[3] ? d[3] : {};

            const extractTooltip = item => {
                let text;
                let series = legend(item.serieIx);
                let value = item.y;

                if (this.tooltipTemplate) {
                    text = getChartTooltip(this.tooltipTemplate, Object.assign({
                        label: item.x,
                        series,
                        value
                    }, dataFields(this.data[item.valueIx])));
                } else {
                    text = [`${item.x}, ${series}: ${value}`];
                }

                return text.map((el, i) => {
                    const tooltipObj = {};

                    if (i === 0) {
                        const tooltipColorsEl = this.$['tooltip-colors'];
                        this._getSeriesColor([item]);
                        const e = tooltipColorsEl.querySelector(`[legend=L${item.serieIx + 1}]`);

                        const seriesColor = window.getComputedStyle(e).fill;
                        tooltipObj.color = getGradientCSS(seriesColor);

                        tooltipColorsEl.replaceChildren();
                    }

                    if (typeof el === 'object') {
                        Object.assign(tooltipObj, el);
                    } else {
                        tooltipObj.text = el;
                    }

                    return tooltipObj;
                });
            };

            const tooltip = tooltips.reduce((result, el) => result.concat(extractTooltip(el)), []);

            const bb = this.$.svg.getBoundingClientRect();

            // TODO: tooltip behavior should support:
            //   - place tooltip at x, y position
            //   - place tooltip to the left / right of the position
            getTooltipOverlayElem().show(this.$.svg, tooltip, {
                mx: Math.max(bb.left, Math.min(bb.right, bb.left + x)),
                y:  Math.max(bb.top, Math.min(bb.bottom, bb.top + y)),
                w:  16,
                h:  16
            }, undefined, 'secondary');
            //this._tooltipEnter(this.$.svg, bb.left + x, bb.top + y, tooltip, {});

            this.__tooltipVisible = true;
        };

        if (this.__tooltipVisible) {
            displayNow(); // Tooltip already visible, replace content now
        } else {
            // Wait a little before showing tooltip
            this.__tooltipTimeout = setTimeout(() => {
                this.__tooltipTimeout = undefined;
                displayNow();
            }, 250);
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
    }

    // The mouse moves over the chart...
    _moveOverChart(ev) {
        if (this.disabled) {
            return;
        }
        // Remember mouse position
        this._movingMouse = {x: ev.offsetX, y: ev.offsetY};

        if (!this.xScale) {
            return;
        }
        if (this.dragging) {
            return;
        }

        // What items are below the mouse?
        this._hoverItems = this.flipAxes ? this._pickPoints(ev.offsetY, ev.offsetX) : this._pickPoints(ev.offsetX, ev.offsetY);

        // Track mouse motion with hoverlines
        const b = this.$.chart.getBoundingClientRect();
        const x = ev.clientX - b.left;
        const y = ev.clientY - b.top;

        if (this.flipAxes) {
            this.$.hoverxline.style.transform = `translate(0,${y}px)`;
            this.$.hoveryline.style.transform = `translate(${x}px,0)`;
        } else {
            this.$.hoverxline.style.transform = `translate(${x}px,0)`;
            this.$.hoveryline.style.transform = `translate(0px,${y}px)`;
        }
    }

    _mouseLeaveChart() {
        // Close "decorations"
        this._hoverItems = [];
    }

    _matchYvalueFunc(yScale, y, drawable, cursorTarget) {
        if (cursorTarget === 'x') {
            // Ignore y-value
            return () => true;
        }

        if (cursorTarget === 'y' || cursorTarget === 'xy') {
            // Find y-value that is closest to cursor position
            const y0 = yScale.bandwidth ? y - yScale.bandwidth() / 2 : y;
            let yHit;
            let d0 = Number.MAX_VALUE;

            drawable.eachVisible((xValue, yValue, valueIx, serieIx, y1, y2) => {
                const yV = y2 !== undefined ? y2 : yValue;
                const d = Math.abs(y0 - yScale(yV));
                if (d <= d0) {
                    d0 = d;
                    yHit = yV;
                }
            });

            const yCoord = yScale(yHit);

            return yValue => Math.abs(yScale(yValue) - yCoord) <= 0.5; // Within half a pixel from the best hit
        }

        // Default pick method
        if (yScale.invert) {
            const a = yScale.invert(y - PICK_D);
            const b = yScale.invert(y + PICK_D);
            const y1 = Math.min(a, b);
            const y2 = Math.max(a, b);
            return _y => y1 <= _y && _y <= y2;
        }

        const iy = invertScalePoint(yScale, y);
        return _y => _y === iy;
    }

    _pickPoints(x, y, cursorTarget = this.cursorTarget) {
        if (cursorTarget === 'none') {
            return []; // Don't want any data hovering
        }

        const xScale = this.xScale;
        if (!xScale) {
            return [];
        }

        const matchesEveryX = (cursorTarget === 'y');
        const matchXorY = (cursorTarget === 'xy'); // Strange matching mode...

        let currBand = 1; // Several bars may stand side by side on the same x-point: which band is x above?

        const setCurrBand = xValue => {
            const numBand = this.drawables.bar.reduce((n, item) => n + (item.hidden ? 0 : 1), 0);
            const bandwidth = xScale.bandwidth ? Math.max(xScale.bandwidth(), 1) : 1;
            currBand = Math.floor(((x - xScale(xValue)) / bandwidth) * numBand);
        };

        // Create function that selects correct x-values
        const xMatchFunc = () => {
            if (cursorTarget === 'x' || cursorTarget === 'xy') {
                // Find x-value that is closest to cursor position
                const x0 = xScale.bandwidth ? x - xScale.bandwidth() / 2 : x;
                let xHit;
                let d0 = Number.MAX_VALUE;

                this.data.forEach(item => {
                    const d = Math.abs(x0 - xScale(item[0]));
                    if (d <= d0) {
                        d0 = d;
                        xHit = item[0];
                    }
                });

                if (xScale.bandwidth) {
                    setCurrBand(xHit);
                }

                const xCoord = xScale(xHit);

                return xValue => Math.abs(xCoord - xScale(xValue)) <= 0.5; // Within half a pixel from the best hit
            }

            if (xScale.bandwidth) {
                const xPick = invertScalePoint(xScale, x);
                const x0 = xScale(xPick);
                if (x + 2 < x0 && !matchesEveryX) {
                    return null; // x is in bar padding area. Nothing matches...
                }
                setCurrBand(xPick);
                return xValue => xValue === xPick;
            }

            // XAxis is not a label
            const a = invertScalePoint(xScale, x - PICK_D);
            const b = invertScalePoint(xScale, x + PICK_D);
            const xPick1 = Math.min(a, b);
            const xPick2 = Math.max(a, b);
            return xValue => xPick1 <= xValue && xValue <= xPick2;
        };

        const xMatch = xMatchFunc();
        if (!xMatch) {
            return []; // In bar padding area. No data points matches
        }

        const yScaleOf = drawable => this.yScales[this.drawables.axisMap.get(drawable)];

        let yMinDist = (cursorTarget === 'y' || cursorTarget === 'xy') ? Number.MAX_SAFE_INTEGER : -1;

        // Collect all points that are in scope of the mouse position
        let pick = this._allDrawables.reduce((r, drawable) => {
            if (drawable.hidden) {
                return r;
            }
            const yScale = yScaleOf(drawable);
            if (!yScale) {
                return r;
            }
            const chartType = drawable.chartType;
            const isBar = isaBar(drawable);
            const yPick = invertScalePoint(yScale, y);
            const yMatch = isBar ? () => false : this._matchYvalueFunc(yScale, y, drawable, cursorTarget); // No need for a match function for bars

            // Detect if y-value is visible on screen (regradless of value type)
            const [_1, _2] = yScale.range();
            const yMin = Math.min(_1, _2);
            const yMax = Math.max(_1, _2);
            const yVisible = yPos => yMin <= yPos && yPos <= yMax;

            drawable.eachVisible((xValue, yValue, valueIx, serieIx, y1, y2, band) => {
                let hit, yDist;
                if (isBar && y1 !== undefined && y2 !== undefined) {
                    // When over a bar the x-position must match and the mouse must be over the stacked region
                    hit = xMatch(xValue) && Math.min(y1, y2) <= yPick && yPick <= Math.max(y1, y2) && (band === undefined || band === currBand);
                } else {
                    const yV = y2 !== undefined ? y2 : yValue;
                    const yPos = yScale(yV);
                    if (!yVisible(yPos)) {
                        return;
                    }
                    hit = matchXorY ? (xMatch(xValue) || yMatch(yV)) : ((matchesEveryX || xMatch(xValue)) && yMatch(yV));
                    if (hit && yMinDist > 0) {
                        yDist = Math.abs(y - yPos);
                        if (yMinDist > yDist + 0.5) {
                            yMinDist = yDist + 0.5; // Within half a pixel from the best hit
                        }
                    }
                }
                if (hit && (yDist === undefined || yMinDist < 0 || yDist <= yMinDist || matchXorY)) {
                    r.push({x: xValue, y: yValue, valueIx, serieIx, y1, y2, chartType, yDist});
                }
            });
            return r;
        }, [])
            .sort((a, b) => a.seriesIx - b.seriesIx);

        if (0 < yMinDist && yMinDist < Number.MAX_SAFE_INTEGER) {
            // One extra filtering step, to remove too distant y points that was added early in the process
            pick = pick.filter(d => d.yDist === undefined || d.yDist <= yMinDist || (matchXorY && xMatch(d.x)));
        }

        return pick;
    }

    _mouseDown(ev) {
        const point = this._pickHover(ev);
        if (point.point) {
            this._focus = point.point;
        }

        return point;
    }

    _coordinates({serieIx, x, y, y1, y2}) {
        const drawable = this._allDrawables.find(d => d.displaysSeries(serieIx));
        const _yScale = drawable && this.yScales[this.drawables.axisMap.get(drawable)];
        if (!_yScale) {
            throw Error('Invalid data point');
        }
        const ybw = _yScale.bandwidth ? _yScale.bandwidth() / 2 : 0;
        const yScale = ybw ? v => _yScale(v) + ybw : _yScale;
        const xbw = this.xScale.bandwidth ? this.xScale.bandwidth() / 2 : 0;
        const xScale = xbw ? v => this.xScale(v) + xbw : this.xScale;
        const a = xScale(x);

        if (y1 === undefined || y2 === undefined) {
            const t = yScale(y);
            return [a - xbw, a + xbw, t - ybw, t + ybw];
        }
        const t1 = yScale(y1);
        const t2 = yScale(y2);
        return [a - xbw, a + xbw, Math.min(t1, t2) - ybw, Math.max(t1, t2) + ybw];
    }

    _selectPoint({point, all}) {
        if (!point) {
            if (this._selectionMgr.selectMethod !== 'multiple') {
                this._selectionMgr.selection = null;
            }
            return;
        }

        const extractPoint = p => {
            const {serieIx, valueIx, x, y, y1, y2} = p;
            return {serieIx, valueIx, x, y, y1, y2};
        };

        const {serieIx, valueIx, x, y, y1, y2} = point;

        if (Array.isArray(all)) {
            all.forEach(el => {
                this._selectionMgr.select(extractPoint(el));
            });
        } else {
            this._selectionMgr.select({serieIx, valueIx, x, y, y1, y2});
        }

        this.dispatchEvent(new CustomEvent('series-click', {
            bubbles:  true,
            composed: true,
            detail:   {serieIx, valueIx, x, y}
        }));

        // Has a zoom range been selected?
        if (!this.zoomSelect) {
            if (this._hoverItems.length) {
                this._refreshHover(this._hoverItems);
            }
            return; // Not in zoom selection mode
        }
        if (!this._selectionMgr.selection || this._selectionMgr.selection.length < 2) {
            return; // Don't have two selected bars
        }

        // Zoom in
        const sel1 = this._selectionMgr.selection[0];
        const sel2 = this._selectionMgr.selection[1];
        this._selectionMgr.selection = null;

        // Resolve coordinates
        const [x11, x12, y11, y12] = this._coordinates(sel1);
        const [x21, x22, y21, y22] = this._coordinates(sel2);

        // Report selected area
        this.dispatchEvent(new CustomEvent('zoom-selection', {detail: {
            x: Math.min(x11, x21),
            y: Math.min(y11, y21),
            w: Math.max(x12, x22) - Math.min(x11, x21),
            h: Math.max(y12, y22) - Math.min(y11, y21)}
        }));
    }

    _dragStart(ev) {
        if (this.disabled) {
            return;
        }

        const point = this._mouseDown(ev);

        if ((!this.zoomDragX && !this.zoomDragY)) {
            // Zoom selection is not enabled
            this._selectPoint(point);
            return;
        }

        const x = ev.clientX;
        const y = ev.clientY;

        this._movedMouse = 0;
        const mmv = ev1 => this._mouseDrag(ev1, x, y);

        const mup = () => {
            this.dragging = false;
            window.removeEventListener('mousemove', mmv);
            this._mouseUp(point);
        };

        window.addEventListener('mousemove', mmv);
        window.addEventListener('mouseup', mup, {once: true});
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
            this.dragging = true;

            // Close "decorations"
            this._hoverItems = [];

            this._movedMouse = Date.now();
            el.style.display = 'block';
        }
    }

    _mouseUp(point) {
        const dragrect = this.$.dragrect;
        dragrect.style.display = '';

        if (this.disabled) {
            return;
        }

        if (!this._movedMouse || Date.now() - this._movedMouse < 150) {
            // Dragged for less than 150ms. Ignore
            this._selectPoint(point);
            return;
        }

        const x = +dragrect.getAttribute('x');
        const y = +dragrect.getAttribute('y');
        const w = +dragrect.getAttribute('width');
        const h = +dragrect.getAttribute('height');

        const [dragX, dragY] = this.flipAxes ? [this.zoomDragY, this.zoomDragX] : [this.zoomDragX, this.zoomDragY];

        if ((!dragX || w < 3) && (!dragY || h < 3)) {
            // Dragged less than 3px. Ignore
            this._selectPoint(point);
            return;
        }

        // Clear selection and report range
        /* this._selected = null; */

        this.dispatchEvent(new CustomEvent('zoom-selection', {
            bubbles:  true,
            composed: true,
            detail:   {x, y, w, h}
        }));
    }

    _zoomSelectPoint(point) {
        if (!this.zoomSelect) {
            this._selectionMgr.select(Object.assign({
                x: this.data[point.valueIx][0],
                y: this.data[point.valueIx][1][point.serieIx]
            }, point));
            return;
        }
        // Zoom selection needs a lot of additional paramters...
        const drawable = this._allDrawables.find(d => !d.hidden && d.displaysSeries(point.serieIx));
        if (!drawable) {
            return;
        }

        drawable.eachVisible((x, y, valueIx, serieIx, y1, y2) => {
            if (valueIx === point.valueIx && serieIx === point.serieIx) {
                this._selectPoint({
                    point: {x, y, valueIx, serieIx, y1, y2, chartType: drawable.chartType}
                });
            }
        });
    }

    _focusChanged() {
        this._refreshFocus();
        this._updateTooltips(true);
    }

    get _firstFocusable() {
        if (Array.isArray(this.data)) {
            for (let valueIx = 0; valueIx < this.data.length; valueIx++) {
                const ya = this.data[valueIx][1];
                const serieIx = ya && this.selectedLegend.find(six => ya[six] !== undefined);
                if (serieIx >= 0) {
                    return {valueIx, serieIx};
                }
            }
        }
        return null;
    }

    _findFocusable(sel, next) {
        for (; sel; sel = next(sel)) {
            if (this.data[sel.valueIx][0] !== undefined && this.data[sel.valueIx][1] && this.data[sel.valueIx][1][sel.serieIx] !== undefined) {
                return sel;
            }
        }
        return null;
    }

    _notifyFocus() {
        // Make sure a chart item has focus, if possible
        if (!this._focus) {
            this._focus = this._firstFocusable;
        } else {
            this._updateTooltips();
        }
    }

    _notifyBlur() {
        this._updateTooltips();
    }

    _keyDown(ev) {
        if (!this._focus || this.disabled) {
            return;
        }

        const prevValue = sel => sel.valueIx > 0 && {valueIx: sel.valueIx - 1, serieIx: sel.serieIx};

        const nextValue = sel => sel.valueIx + 1 < this.data.length && {valueIx: sel.valueIx + 1, serieIx: sel.serieIx};

        const prevSeries = sel => {
            const i = this.selectedLegend.indexOf(sel.serieIx);
            return i >= 1 && {valueIx: sel.valueIx, serieIx: this.selectedLegend[i - 1]};
        };

        const nextSeries = sel => {
            const i = this.selectedLegend.indexOf(sel.serieIx);
            return i >= 0 && i + 1 < this.selectedLegend.length && {valueIx: sel.valueIx, serieIx: this.selectedLegend[i + 1]};
        };

        let focus = this._focus;

        switch (ev.key) {
            case 'ArrowLeft':
                focus = this._findFocusable(prevValue(focus), prevValue);
                break;
            case 'ArrowRight':
                focus = this._findFocusable(nextValue(focus), nextValue);
                break;
            case 'ArrowUp':
                focus = this._findFocusable(prevSeries(focus), prevSeries);
                break;
            case 'ArrowDown':
                focus = this._findFocusable(nextSeries(focus), nextSeries);
                break;
            case 'PageUp':
                focus = this._findFocusable({valueIx: focus.valueIx, serieIx: this.selectedLegend[0]}, nextSeries);
                break;
            case 'PageDown':
                focus = this._findFocusable({valueIx: focus.valueIx, serieIx: this.selectedLegend[this.selectedLegend.length - 1]}, prevSeries);
                break;
            case 'Home':
                focus = this._findFocusable({valueIx: 0, serieIx: focus.serieIx}, nextValue);
                break;
            case 'End':
                focus = this._findFocusable({valueIx: this.data.length - 1, serieIx: focus.serieIx}, prevValue);
                break;
            case 'Enter':
            case ' ':
                this._zoomSelectPoint(focus);
                break;
            default:
                // Not handled
                return;
        }

        if (!focus || (focus.valueIx === this._focus.valueIx && focus.serieIx === this._focus.serieIx)) {
            return;
        }

        // We consumed this keyboard event. Don't propagate
        ev.preventDefault();

        this._focus = focus;

        /*
        this._focusOn(focus);
        this._focus.el.scrollIntoViewIfNeeded();
        this._mouseTooltip({target: focus.el});
        */
    }


    // Selections
    _selectionModeChanged(selectionMode, zoomSelect) {
        this._selectionMgr.selection = null;
        this._selectionMgr.selectMethod = zoomSelect ? 'multiple' : selectionMode;
    }

    selectionChanged(selection) {
        //console.log('%c|' + selection.map(a => [a.valueIx, a.serieIx]).join('|') + '|', 'color: blue; font-weight: bold;');
        this._refreshSelection();
        this._refreshFocus();

        this.dispatchEvent(new CustomEvent('chart-selection', {
            bubbles:  true,
            composed: true,
            detail:   {selection}
        }));
    }

    // Legend filter have changed. Adjust selection
    _selectedLegendChanged(selectedLegend) {
        if (!this._selectionMgr.selection) {
            return; // Nothing to adjust
        }
        const filterSet = Array.isArray(selectedLegend) && new Set(selectedLegend);
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
        if (Array.isArray(this.selectedLegend) && Array.isArray(this.data)) {
            this._selectionMgr.selection = this.data.reduce((a, item, valueIx) => {
                if (item[0] !== undefined) {
                    this.selectedLegend.forEach(serieIx => {
                        if (item[1][serieIx] !== undefined) {
                            a.push({valueIx, serieIx, x: item[0], y: item[1][serieIx]});
                        }
                    });
                }
                return a;
            }, []);
        } else {
            this._selectionMgr.selection = null;
        }
    }

    unselectAll() {
        this._selectionMgr.selection = null;
    }
};

customElements.define(PTCS.ChartCoreCombo.is, PTCS.ChartCoreCombo);
