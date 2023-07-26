import {PolymerElement, html} from '@polymer/polymer/polymer-element.js';
import {PTCS} from 'ptcs-library/library.js';
import {SelectionMgr} from '../selection/chart-selection.js';
import {getChartTooltip} from 'ptcs-library/library-chart.js';
import 'ptcs-behavior-styleable/ptcs-behavior-styleable.js';
import 'ptcs-behavior-focus/ptcs-behavior-focus.js';
import 'ptcs-behavior-tooltip/ptcs-behavior-tooltip.js';

import {select} from 'd3-selection';

//import {transition} from 'd3-transition';

/* Data format:

    [
        [ name, [{<id>, reason, <info>, start, end, <color>, ...}] ]
    ]
*/


/* Don't need a warning to make sure I have not confused "=>" with ">=" or "<=" */
/* eslint-disable no-confusing-arrow */
const __xv = item => item[0];
const __yv = item => item[1];

function compareSelectionObjects(sel1, sel2) {
    if (sel1.group !== sel2.group) {
        return sel1.group - sel2.group;
    }
    return sel1.task - sel2.task;
}

function sameTask(t1, t2) {
    const sameDate = (d1, d2) => d1 === d2 || (d1 instanceof Date && d2 instanceof Date && d1.getTime() === d2.getTime());
    return t1.reason === t2.reason && t1.info === t2.info && sameDate(t1.start, t2.start) && sameDate(t1.end, t2.end);
}

const __dataFields = d => {
    const dataFields = {};

    Object.keys(d).map((key) => {
        dataFields[`Data:${key}`] = d[key];
    });

    return dataFields;
};

PTCS.ChartCoreSchedule = class extends PTCS.BehaviorTooltip(PTCS.BehaviorFocus(PTCS.BehaviorStyleable(PTCS.ThemableMixin(PolymerElement)))) {
    static get template() {
        return html`
        <style>
        :host {
            display: block;
            width: 100%;
            height: 100%;
            --ptcs-tooltip-start-delay: 100;
        }

        /* Add an extra chart level, so we have exclusive access to the influencing class attribute */
        #chart {
            position: relative;
            width: 100%;
            height: 100%;
            overflow: hidden;
        }

        [part=group] {
            position: absolute;
            box-sizing: border-box;
        }

        :host(:not([flip-axes])) [part=group] {
            width: 100%;
        }

        :host([flip-axes]) [part=group] {
            height: 100%;
        }

        [part=task] {
            position: absolute;
            top: 0;
            left: 0;
            box-sizing: border-box;
        }

        :host([dragging]) [part=task] {
            pointer-events: none;
        }

        :host(:not([flip-axes])) [part=task] {
            height: 100%;
        }

        :host([flip-axes]) [part=task] {
            width: 100%;
        }

        [part=drag-rect] {
            position: absolute;
            pointer-events: none;
            display: none;
        }

        /* FILTERING */
        div.filter [part=task] {
            opacity: 0;
        }
        [legend=L0] { /* Unknown task - don't hide when filtering */
            opacity: 1 !important;
        }
        div.filter.L1 [legend=L1] {
            opacity: 1;
        }
        div.filter.L2 [legend=L2] {
            opacity: 1;
        }
        div.filter.L3 [legend=L3] {
            opacity: 1;
        }
        div.filter.L4 [legend=L4] {
            opacity: 1;
        }
        div.filter.L5 [legend=L5] {
            opacity: 1;
        }
        div.filter.L6 [legend=L6] {
            opacity: 1;
        }
        div.filter.L7 [legend=L7] {
            opacity: 1;
        }
        div.filter.L8 [legend=L8] {
            opacity: 1;
        }
        div.filter.L9 [legend=L9] {
            opacity: 1;
        }
        div.filter.L10 [legend=L10] {
            opacity: 1;
        }
        div.filter.L11 [legend=L11] {
            opacity: 1;
        }
        div.filter.L12 [legend=L12] {
            opacity: 1;
        }
        div.filter.L13 [legend=L13] {
            opacity: 1;
        }
        div.filter.L14 [legend=L14] {
            opacity: 1;
        }
        div.filter.L15 [legend=L15] {
            opacity: 1;
        }
        div.filter.L16 [legend=L16] {
            opacity: 1;
        }
        div.filter.L17 [legend=L17] {
            opacity: 1;
        }
        div.filter.L18 [legend=L18] {
            opacity: 1;
        }
        div.filter.L19 [legend=L19] {
            opacity: 1;
        }
        div.filter.L20 [legend=L20] {
            opacity: 1;
        }
        div.filter.L21 [legend=L21] {
            opacity: 1;
        }
        div.filter.L22 [legend=L22] {
            opacity: 1;
        }
        div.filter.L23 [legend=L23] {
            opacity: 1;
        }
        div.filter.L24 [legend=L24] {
            opacity: 1;
        }
        </style>

        <div id="chart" class\$="[[_filter(filterLegend)]]" on-dragstart="_ondragstart"
            ><div id="sub"></div
            ><div id="dragrect" part="drag-rect"></div
        ></div>`;
    }

    static get is() {
        return 'ptcs-chart-core-schedule';
    }

    static get properties() {
        return {
            // Recieved data
            data: {
                type: Array
            },

            // Massaged data
            _data: {
                type: Array
            },

            // labels
            labels: {
                type:   Array,
                notify: true
            },

            disabled: {
                type:               Boolean,
                reflectToAttribute: true
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

            // Scale that maps x-positions to x-axis
            xScale: {
                type:     Function,
                observer: '_scaleChanged'
            },

            // Scale that maps y-positions to y-axis
            yScale: {
                type:     Function,
                observer: '_scaleChanged'
            },

            flipAxes: {
                type:               Boolean,
                observer:           'refresh',
                value:              false,
                reflectToAttribute: true
            },

            reverseYAxis: {
                type:     Boolean,
                observer: 'refresh'
            },

            legend: {
                type: Array
            },

            _legendMap: {
                type:     Object,
                computed: '_computeLegendMap(legend.*)'
            },

            // Legend filtering
            filterLegend: {
                type: Array
            },

            // zoom by selecting two elements: 'x' || 'y' || 'xy' || undefined
            zoomSelect: {
                type: String,
            },

            // zoom by dragging mouse: 'x' || 'y' || 'xy' || undefined
            zoomDrag: {
                type: String
            },

            // Dragging mouse over chart?
            dragging: {
                type:               Boolean,
                reflectToAttribute: true
            },

            // Focused task: {xIx, yIx, el}
            _focus: {
                type: Object
            },

            selectedData: {
                type:     Object,
                notify:   true,
                observer: '_selectedDataChanged'
            },

            // 'none' || 'single' || 'multiple'
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
            '_dataChanged(data.*)',
            '_selectionModeChanged(selectionMode, zoomSelect)',
            '_adjustSelection(filterLegend.*)'
        ];
    }

    ready() {
        super.ready();
        if (!this.legend) {
            this.legend = null;
        }

        this._untrackHover(this);

        // Tooltip function: this === the hovered task div
        const that = this;
        this.__tooltipFunc = function() {
            const task = that._getData(this);
            if (!task && task.data) {
                return null;
            }
            const d = task.data;

            let tooltip;

            const reason = `${d.reason}${d.info ? ': ' + d.info : ''}`;
            const start = d.start.toLocaleString();
            const end = d.end.toLocaleString();
            const duration = that._duration(d.start, d.end);

            if (that.tooltipTemplate) {
                tooltip = getChartTooltip(that.tooltipTemplate, Object.assign({
                    reason, start, end, duration
                }, __dataFields(d)));
            } else {
                tooltip = [
                    {text: reason, part: 'title'},
                    `Start: ${start}`,
                    `End: ${end}`,
                    `Duration: ${duration}`
                ];
            }

            return tooltip;
        };

        this._selectionMgr.observe(this);

        // Click on schedule item
        this.$.chart.addEventListener('click', ev => this._click(ev));

        // Tooltips
        this.$.chart.addEventListener('mousemove', ev => this._mouseTooltip(ev));
        this.$.chart.addEventListener('mouseout', () => this._closeTooltip());

        // Drag selecting
        this.$.chart.addEventListener('mousedown', ev => this._mouseDown(ev));

        // Keyboard navigation
        this.addEventListener('keydown', ev => this._keyDown(ev));
    }

    _ondragstart() {
        return false;
    }

    _computeLegendMap(cr) {
        const r = {};

        if (cr.base) {
            cr.base.forEach((d, i) => {
                r[d] = `L${i + 1}`;
            });
        }

        return r;
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

    _scaleChanged() {
        this.refresh();
    }

    _dataChanged(cr) {
        if (cr.path !== 'data.length') {
            // Some internal data point has changed
            this.refreshData();
        }

        // For now - reset selection whenever the data changes
        this._selectionMgr.selection = null;
    }

    refreshData() {
        const data = this.data;
        const emptyState = !(data && Array.isArray(data) && data.length);
        this._setChartStateDataEmpty(emptyState);
        if (emptyState) {
            return;
        }

        // Create labels array (duplicate elimination) and store weight for each label
        const _stop = {};
        const labels = [];
        const openIx = this._findOpenLabel();
        const openLabel = openIx >= 0 ? __xv(this._data[openIx]) : undefined;
        data.forEach(row => {
            const label = __xv(row);
            let ix = _stop[label];
            if (ix === undefined) {
                _stop[label] = ix = labels.length;
                labels.push({label, sub: new Set(), open: label === openLabel});
            }

            // Merge reasons into existing group
            const sub = labels[ix].sub;
            row[1].forEach(d => {
                if (d.reason) {
                    sub.add(d.reason);
                }
            });
        });

        // Sort reasons according to order in legend: use label itself as fallback
        labels.forEach(item => {
            item.sub = [... item.sub].sort((a, b) => {
                const k1 = this._legendMap[a] || `X${a}`;
                const k2 = this._legendMap[b] || `X${b}`;
                return k1.localeCompare(k2);
            });
        });

        let yMin, yMax;

        // Initialize with any valid values
        try {
            const first = data.find(item => __yv(item)[0] && __yv(item)[0].start);
            if (first) {
                yMin = yMax = __yv(first)[0].start;
            }
        } catch (err) {
            console.error(err);
            console.error('invalid schedule data');
            console.error(data);
        }

        // Group data to series layout
        data.forEach(item1 => {
            __yv(item1).forEach(item2 => {
                if (yMin > item2.start) {
                    yMin = item2.start;
                }
                if (yMax < item2.end) {
                    yMax = item2.end;
                }
            });
        });

        let lastLabel, firstLabel;

        if (labels.length > 0) {
            const last = labels[labels.length - 1];

            firstLabel = labels[0].label;

            lastLabel = last && last.sub
                ? `${last.label}:$:${last.sub[last.sub.length - 1]}`
                : last.label;
        }

        this.setProperties({
            _data: data,
            xMin:  firstLabel,
            xMax:  lastLabel,
            yMin,
            yMax,
            labels});

        this.refresh();
    }

    refresh() {
        if (this.__refreshOn) {
            return;
        }
        this.__refreshOn = true;
        requestAnimationFrame(() => {
            this.__refreshOn = false;
            this.__refresh();
        });
    }

    _findOpenLabel() {
        if (!(this._data instanceof Array) || !this.xScale) {
            return -1;
        }
        // Only a single group can be expanded
        return this._data.findIndex(d => {
            // If first task is visible then this group is open
            const subKey = `${__xv(d)}:$:${((d[1] || [])[0] || {}).reason}`;
            return this.xScale(subKey) !== undefined;
        });
    }

    __refresh() {
        const xScale = this.xScale;
        const yScale = this.yScale;

        if (!(this._data instanceof Array) || !xScale || !yScale) {
            return;
        }

        const selectionMgr = this._selectionMgr;

        // Map reason to legend attribute. L0 = fallback for unmapped
        const legend = d => this._legendMap[d.reason] || 'L0';

        const groupWidth = this.flipAxes
            ? `${xScale.bandwidth()}px`
            : null;
        const groupHeight = this.flipAxes
            ? null
            : `${xScale.bandwidth()}px`;
        const groupPos = this.flipAxes
            ? d => `translate(${xScale(__xv(d))}px, 0)`
            : d => `translate(0, ${xScale(__xv(d))}px)`;
        const groupDisplay = d => xScale(__xv(d)) === undefined ? 'none' : null;

        /* eslint-disable no-nested-ternary */
        const taskWidth = this.flipAxes
            ? null
            : (this.reverseYAxis
                ? d => `${Math.max(yScale(d.start) - yScale(d.end), 1)}px`
                : d => `${Math.max(yScale(d.end) - yScale(d.start), 1)}px`);
        const taskHeight = this.flipAxes
            ? (this.reverseYAxis
                ? d => `${Math.max(yScale(d.end) - yScale(d.start), 1)}px`
                : d => `${Math.max(yScale(d.start) - yScale(d.end), 1)}px`)
            : null;
        const taskPos = this.flipAxes
            ? (this.reverseYAxis
                ? d => `translate(0,${yScale(d.start)}px)`
                : d => `translate(0,${yScale(d.end)}px)`)
            : (this.reverseYAxis
                ? d => `translate(${yScale(d.end)}px,0)`
                : d => `translate(${yScale(d.start)}px,0)`);
        /* eslint-enable no-nested-ternary */

        function setColor(d) {
            this.__color$ = d.color;
            PTCS.assignElementColor(this, d.color, this.hasAttribute('selected'));
        }

        function selected(d, i) {
            const group = +this.parentNode.getAttribute('x-index');
            return selectionMgr.isSelected({group, task: i}) ? '' : undefined;
        }

        // JOIN new data with old elements
        const join = select(this.$.chart)
            .selectAll('[part=group]')
            .data(this._data);

        // EXIT old elements not present in new data
        join.exit().remove();

        // UPDATE old elements present in new data
        join
            .attr('x-index', (d, i) => i)
            .style('display', groupDisplay)
            .style('width', groupWidth)
            .style('height', groupHeight)
            .style('transform', groupPos);

        // ENTER new elements present in new data
        join.enter()
            .append('div')
            .attr('part', 'group')
            .attr('x-index', (d, i) => i)
            .style('display', groupDisplay)
            .style('width', groupWidth)
            .style('height', groupHeight)
            .style('transform', groupPos)
            .selectAll('[part=task]')
            .data(d => __yv(d))
            .enter()
            .append('div')
            .attr('part', 'task')
            .attr('y-index', (d, i) => i)
            .attr('legend', legend)
            .attr('selected', selected)
            .style('width', taskWidth)
            .style('height', taskHeight)
            .style('transform', taskPos)
            .each(setColor);

        // update / enter / exit for children
        const children = join
            .selectAll('[part=task]')
            .data(d => __yv(d));

        children
            .attr('y-index', (d, i) => i)
            .attr('legend', legend)
            .attr('selected', selected)
            .style('width', taskWidth)
            .style('height', taskHeight)
            .style('transform', taskPos)
            .each(setColor);

        children.exit().remove();

        children.enter()
            .append('div')
            .attr('part', 'task')
            .attr('y-index', (d, i) => i)
            .attr('legend', legend)
            .attr('selected', selected)
            .style('width', taskWidth)
            .style('height', taskHeight)
            .style('transform', taskPos)
            .each(setColor);

        // Is any group expanded?
        const ix = this._findOpenLabel();
        if (ix >= 0) {
            const key = __xv(this._data[ix]) + ':$:';
            const subTaskWidth = this.flipAxes ? `${xScale.bandwidth()}px` : taskWidth;
            const subTaskHeight = this.flipAxes ? taskHeight : `${xScale.bandwidth()}px`;
            /* eslint-disable no-nested-ternary */
            const subTaskPos = this.flipAxes
                ? (this.reverseYAxis
                    ? d => `translate(${xScale(key + d.reason)}px,${yScale(d.start)}px)`
                    : d => `translate(${xScale(key + d.reason)}px,${yScale(d.end)}px)`)
                : (this.reverseYAxis
                    ? d => `translate(${yScale(d.end)}px,${xScale(key + d.reason)}px)`
                    : d => `translate(${yScale(d.start)}px,${xScale(key + d.reason)}px)`);
            /* eslint-enable no-nested-ternary */

            this.$.sub.setAttribute('x-index', `${ix}`);

            // JOIN new data with old elements
            const join2 = select(this.$.sub)
                .selectAll('[part=task]')
                .data(__yv(this._data[ix]));

            // ENTER new elements
            join2.enter()
                .append('div')
                .attr('part', 'task')
                .attr('y-index', (d, i) => i)
                .attr('legend', legend)
                .attr('selected', selected)
                .style('width', subTaskWidth)
                .style('height', subTaskHeight)
                .style('transform', subTaskPos)
                .each(setColor);

            // UPDATE existing elements
            join2
                .attr('y-index', (d, i) => i)
                .attr('legend', legend)
                .attr('selected', selected)
                .style('width', subTaskWidth)
                .style('height', subTaskHeight)
                .style('transform', subTaskPos)
                .each(setColor);

            // EXIT old elements not present in new data
            join2.exit().remove();

            this.$.sub.style.display = '';
        } else {
            this.$.sub.style.display = 'none';
        }
    }

    _getData(el) {
        if (el.getAttribute('part') !== 'task') {
            return null;
        }
        const groupEl = el.parentNode;
        if (!groupEl || !groupEl.hasAttribute('x-index')) {
            return null;
        }
        const group = +groupEl.getAttribute('x-index');
        const task = +el.getAttribute('y-index');

        return {group, task, label: this._data[group][0], data: this._data[group][1][task]};
    }

    _findTask({group, task}) {
        return this.$.chart.querySelector(`[part=group][x-index="${group}"] > [part=task][y-index="${task}"]`);
    }

    _click(ev) {
        if (this.disabled) {
            return;
        }
        const detail = this._getData(ev.target);
        if (!detail) {
            return;
        }

        this._selectionMgr.select(detail);

        this._focusOn({xIx: detail.group, yIx: detail.task, el: ev.target});

        this.dispatchEvent(new CustomEvent('series-click', {bubbles: true, composed: true, detail}));

        if (!this.zoomSelect) {
            return;
        }

        // Has a zoom range been selected?
        if (!this._selectionMgr.selection || this._selectionMgr.selection.length < 2) {
            return; // Nope
        }

        const el1 = this._findTask(this._selectionMgr.selection[0]);
        const el2 = this._findTask(this._selectionMgr.selection[1]);
        this._selectionMgr.selection = null; // Reset selection
        if (!el1 || !el2) {
            return; // Internal error
        }

        // Report selected range
        const zoomX = this.zoomSelect === 'x' || this.zoomSelect === 'xy';
        const zoomY = this.zoomSelect === 'y' || this.zoomSelect === 'xy';
        const b1 = el1.getBoundingClientRect();
        const b2 = el2.getBoundingClientRect();
        const cntr = this.$.chart.getBoundingClientRect();
        const x1 = zoomY ? Math.min(b1.x, b2.x) - cntr.x : 0;
        const y1 = zoomX ? Math.min(b1.y, b2.y) - cntr.y : 0;
        const x2 = zoomY ? Math.max(b1.x + b1.width, b2.x + b2.width) - cntr.x : cntr.width;
        const y2 = zoomX ? Math.max(b1.y + b1.height, b2.y + b2.height) - cntr.y : cntr.height;

        // Report range
        this.dispatchEvent(new CustomEvent('selection', {
            bubbles:  true,
            composed: true,
            // Increase hit area with just a pixel on all side, or there can be rounding errors when zooming
            detail:   {x: x1 - 1, y: y1 - 1, w: x2 - x1 + 2, h: y2 - y1 + 2}
        }));
    }

    _mouseTooltip(ev) {
        if (ev.target === this.__tooltipEl || this.dragging) {
            return;
        }
        this._closeTooltip();
        if (this._isVisibleLegend(ev.target)) {
            const detail = this._getData(ev.target);
            if (detail) {
                this.__tooltipEl = ev.target;
                this._tooltipEnter(this.__tooltipEl, ev.clientX, ev.clientY, this.__tooltipFunc);
            }
        }
    }

    _closeTooltip() {
        if (this.__tooltipEl) {
            this._tooltipLeave(this.__tooltipEl);
            this.__tooltipEl = null;
        }
    }

    _mouseDown(ev) {
        if (this.disabled) {
            return;
        }
        const detail = this._getData(ev.target);
        if (detail) {
            this._focusOn({xIx: detail.group, yIx: detail.task, el: ev.target});
        }
        const zd = this.zoomDrag;
        if (zd !== 'x' && zd !== 'y' && zd !== 'xy') {
            return; // Zoom dragging is not enabled
        }
        const x = ev.clientX;
        const y = ev.clientY;

        this._movedMouse = null;
        const mmv = ev1 => this._mouseDrag(ev1, x, y);

        // Activate dragging when dragging has actually started, or this will prevent select events
        // this.dragging = true;
        const mup = () => {
            this.dragging = false;
            window.removeEventListener('mousemove', mmv);
            window.removeEventListener('mouseup', mup);
            this._mouseUp();
        };

        window.addEventListener('mousemove', mmv);
        window.addEventListener('mouseup', mup);

        this._closeTooltip();
    }

    _mouseDrag(ev, x0, y0) {
        const cntr = this.$.chart.getBoundingClientRect();
        const s = this.$.dragrect.style;
        if (!this._movedMouse) {
            s.display = 'block';
        }
        const zoomX = this.zoomDrag === 'x' || this.zoomDrag === 'xy';
        const zoomY = this.zoomDrag === 'y' || this.zoomDrag === 'xy';
        this._movedMouse = {
            x: zoomY ? Math.min(x0, ev.clientX) - cntr.left : 0,
            y: zoomX ? Math.min(y0, ev.clientY) - cntr.top : 0,
            w: zoomY ? Math.abs(x0 - ev.clientX) : cntr.width,
            h: zoomX ? Math.abs(y0 - ev.clientY) : cntr.height,
            t: this._movedMouse ? this._movedMouse.t : Date.now()
        };
        s.left = `${this._movedMouse.x}px`;
        s.top = `${this._movedMouse.y}px`;
        s.width = `${this._movedMouse.w}px`;
        s.height = `${this._movedMouse.h}px`;

        // Dragging has started
        this.dragging = true;
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

        const zoomX = this.zoomDrag === 'x' || this.zoomDrag === 'xy';
        const zoomY = this.zoomDrag === 'y' || this.zoomDrag === 'xy';
        if ((!zoomX || Math.abs(x2 - x1) < 3) && (!zoomY || Math.abs(y2 - y1) < 3)) {
            // Dragged less than 3 pixels. Ignore
            return;
        }

        const d = Date.now() - this._movedMouse.t;
        if (d < 150) {
            // Only dragged for 150ms. Ignore
            return;
        }

        this.dispatchEvent(new CustomEvent('selection', {
            bubbles:  true,
            composed: true,
            detail:   this._movedMouse
        }));
    }

    _setSelectedData(_focus) {
        if (this._selectionMgr.selectMethod !== 'none') {
            return;
        }
        if (_focus && !isNaN(_focus.xIx) && !isNaN(_focus.yIx)) {
            if (this._data) {
                // Get the x value from the _data
                const xvalue = __xv(this._data[_focus.xIx]);
                const task = __yv(this._data[_focus.xIx])[_focus.yIx];

                if (this.selectedData && this.selectedData.label === xvalue &&
                    this.selectedData.data && sameTask(this.selectedData.data, task)) {
                    return;
                }

                this.selectedData = this._getData(_focus.el);
            }
        }
    }

    // Set the focused element
    _focusOn(focus, scroll) {
        if (this.disabled) {
            return null;
        }
        if (focus instanceof Element) {
            const detail = this._getData(focus);
            focus = detail ? {xIx: detail.group, yIx: detail.task, el: focus} : null;
        }

        this._setSelectedData(focus);

        if (this._focus) {
            this._focus.el.removeAttribute('focus');
        }
        this._focus = focus;
        if (this._focus) {
            this._focus.el.setAttribute('focus', '');
            if (scroll) {
                focus.el.scrollIntoViewIfNeeded();
            }
            this._mouseTooltip({target: focus.el});
        }
        return focus;
    }

    _duration(date1, date2) {
        if (date1 > date2) {
            [date1, date2] = [date2, date1];
        }

        let y1 = date1.getFullYear();
        let y2 = date2.getFullYear();
        let mo1 = date1.getMonth();
        let mo2 = date2.getMonth();
        let d1 = date1.getDate();
        let d2 = date2.getDate();
        let h1 = date1.getHours();
        let h2 = date2.getHours();
        let mi1 = date1.getMinutes();
        let mi2 = date2.getMinutes();
        let s1 = date1.getSeconds();
        let s2 = date2.getSeconds();

        let dy = y2 - y1;
        let dmo = mo2 - mo1;
        let dd = d2 - d1;
        let dh = h2 - h1;
        let dmi = mi2 - mi1;
        let ds = s2 - s1;

        const calculateDaysInMonth = (mm, yyyy) => {
            // series 0, for feb mm is 1
            if (mm === 1) {
                if (yyyy % 4 === 0) {
                    if (yyyy % 100 === 0 && yyyy % 400 !== 0) {
                        return 28;
                    }
                    return 29;
                }
                return 28;
            } else if ([0, 2, 4, 6, 7, 9, 11].includes(mm)) {
                return 31;
            }
            return 30;
        };
        const days = calculateDaysInMonth(date1.getMonth(), date1.getFullYear());
        if (ds < 0) {
            dmi--;
            ds += 60;
        }
        if (dmi < 0) {
            dh--;
            dmi += 60;
        }
        if (dh < 0) {
            dd--;
            dh += 24;
        }
        if (dd < 0) {
            dmo--;
            dd += days; // can be 28, 29, 30 31
        }
        if (dmo < 0) {
            dy--;
            dmo += 12;
        }

        // eslint-disable-next-line max-len
        return `${dy ? dy + ' years ' : ''}${dmo ? dmo + ' months ' : ''}${dd ? dd + ' days ' : ''}${dh ? dh + ' hours ' : ''}${dmi ? dmi + ' minutes ' : ''}${ds ? ds + ' seconds ' : ''}`;
    }

    _initTrackFocus() {
        this._trackFocus(this, () => this._focus ? this._focus.el : null);
    }

    _notifyFocus() {
        // Make sure a chart item has focus, if possible
        if (this._focus) {
            this._focusOn(this._focus, true); // Scroll into view and show tooltips
            return;
        }
        function rectInside(b0, b) {
            return b0.left <= b.left && b0.top <= b.top && b.right <= b0.right && b.bottom <= b0.bottom;
        }
        const b0 = this.$.chart.getBoundingClientRect();
        for (let groupEl = this.$.chart.firstChild; groupEl; groupEl = groupEl.nextSibling) {
            if (groupEl.getAttribute('part') !== 'group') {
                continue;
            }
            for (let el = groupEl.firstChild; el; el = el.nextSibling) {
                if (rectInside(b0, el.getBoundingClientRect()) && this._focusOn(el, true)) {
                    return;
                }
            }
        }
    }

    _notifyBlur() {
        this._closeTooltip();
    }

    _findFocusEl(elOrg, candidate, better) {
        if (!elOrg) {
            return null;
        }
        const bOrg = elOrg.getBoundingClientRect();
        let elBest = 0;
        let bBest = null;

        // Not very efficient, but simple...
        function findEl(el) {
            if (el.getAttribute('part') === 'task') {
                if (el !== elOrg) {
                    const b = el.getBoundingClientRect();
                    if (candidate(bOrg, b)) {
                        if (!elBest || better(b, bBest, bOrg)) {
                            elBest = el;
                            bBest = b;
                        }
                    }
                }
            } else {
                for (let e = el.firstChild; e; e = e.nextSibling) {
                    findEl(e);
                }
            }
        }

        findEl(this.$.chart);
        return elBest;
    }

    _keyDown(ev) {
        if (this.disabled || !this._focus) {
            return;
        }

        // Distance from center of a to center of b
        const d = (a, b) => Math.abs((a.right + a.left) / 2 - (b.right + b.left) / 2);

        // Select the rect that is closest to c
        const f = (a, b, c) => {
            if (a.top !== b.top) {
                return false; // Not on the same row
            }
            return d(c, a) < d(c, b); // Is a closer to c than b?
        };

        let el = this._focus.el;

        switch (ev.key) {
            case 'ArrowRight':
                el = this._findFocusEl(el, (a, b) => a.top === b.top && a.left < b.left, (a, b) => a.left < b.left);
                break;
            case 'ArrowUp':
                el = this._findFocusEl(el, (a, b) => a.top > b.top, (a, b, c) => a.top > b.top || f(a, b, c));
                break;
            case 'ArrowLeft':
                el = this._findFocusEl(el, (a, b) => a.top === b.top && a.left > b.left, (a, b) => a.left > b.left);
                break;
            case 'ArrowDown':
                el = this._findFocusEl(el, (a, b) => a.top < b.top, (a, b, c) => a.top < b.top || f(a, b, c));
                break;
            case 'PageUp':
                el = this._findFocusEl(el, (a, b) => a.top > b.top, (a, b, c) => a.top < b.top || f(a, b, c));
                break;
            case 'PageDown':
                el = this._findFocusEl(el, (a, b) => a.top < b.top, (a, b, c) => a.top > b.top || f(a, b, c));
                break;
            case 'Home':
                el = this._findFocusEl(el, (a, b) => a.top === b.top && a.left > b.left, (a, b) => a.left < b.left);
                break;
            case 'End':
                el = this._findFocusEl(el, (a, b) => a.top === b.top && a.left < b.left, (a, b) => a.left > b.left);
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

        if (!el || el === this._focus.el) {
            return;
        }

        this._focusOn(el, true);
    }

    // Selections
    _selectionModeChanged(selectionMode, zoomSelect) {
        this._selectionMgr.selection = null;
        this._selectionMgr.selectMethod = zoomSelect ? 'multiple' : selectionMode;
    }

    selectionChanged(selection) {
        this.selectedData = (this.selectedData === selection && selection instanceof Array) ? selection.slice() : selection;
    }

    selectedChanged(sel, selected) {
        const list = this.$.chart.querySelectorAll(`[x-index="${sel.group}"] > [part=task][y-index="${sel.task}"]`);
        for (let i = 0; i < list.length; i++) {
            const el = list[i];
            if (selected) {
                el.setAttribute('selected', '');
            } else {
                el.removeAttribute('selected');
            }
            if (el.__color$) {
                PTCS.assignElementColor(el, el.__color$, selected);
            }
        }
    }

    _selectedDataChanged(selectedData) {
        this._selectionMgr.selection = selectedData;
    }

    // Is reason visible or hidden by legend filter?
    // Returns: isVisble(reason) => Boolean
    _createIsVisibleFunc() {
        if (Array.isArray(this.legend) && Array.isArray(this.filterLegend)) {
            const filterSet = new Set(this.filterLegend.map(i => this.legend[i]));
            return reason => filterSet.has(reason);
        }
        return () => true; // Fallback. Don't hide anything
    }

    // Legend filter have changed. Adjust selection
    _adjustSelection() {
        if (!this._selectionMgr.selection) {
            return; // Nothing to adjust
        }
        const isVisible = this._createIsVisibleFunc();
        if (Array.isArray(this._selectionMgr.selection)) {
            if (this._selectionMgr.selection.some(sel => !isVisible(sel.data.reason))) { // Only refilter if needed
                this._selectionMgr.selection = this._selectionMgr.selection.filter(sel => isVisible(sel.data.reason));
            }
        } else if (!isVisible(this._selectionMgr.selection.data.reason)) {
            this._selectionMgr.selection = null;
        }
    }

    selectAll() {
        const selection = [];
        if (this.data) {
            const isVisible = this._createIsVisibleFunc();
            this.data.forEach((row, group) => {
                const label = row[0];
                row[1].forEach((data, task) => {
                    if (isVisible(data.reason)) {
                        selection.push({group, task, label, data});
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


customElements.define(PTCS.ChartCoreSchedule.is, PTCS.ChartCoreSchedule);
