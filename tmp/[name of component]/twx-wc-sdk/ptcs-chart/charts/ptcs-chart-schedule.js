import {PolymerElement, html} from '@polymer/polymer/polymer-element.js';
import {PTCS} from 'ptcs-library/library.js';
import {axisMin, axisMax} from 'ptcs-library/library-chart.js';
import {typeValue, typeIsFullRange} from 'ptcs-library/library-chart.js';

import 'ptcs-toolbar/ptcs-toolbar.js';
import 'ptcs-datepicker/ptcs-datepicker.js';
import {BehaviorChart} from '../ptcs-behavior-chart.js';
import 'ptcs-behavior-styleable/ptcs-behavior-styleable.js';
import 'ptcs-behavior-focus/ptcs-behavior-focus.js';
import 'ptcs-behavior-tabindex/ptcs-behavior-tabindex.js';

import '../ptcs-chart-layout.js';
import '../ptcs-chart-legend.js';
import '../ptcs-chart-state.js';
import '../ptcs-chart-coord.js';
import '../axes/ptcs-chart-axis.js';
import '../zoom/ptcs-chart-zoom.js';
import './ptcs-chart-core-schedule.js';

// Don't need lint to warn about that ES5 arrow functions might be a mistaken >=
// eslint-disable no-confusing-arrow

PTCS.ChartSchedule = class extends BehaviorChart(PTCS.BehaviorTabindex(PTCS.BehaviorFocus(
    PTCS.BehaviorStyleable(PTCS.ThemableMixin(PolymerElement))))) {

    static get template() {
        return html`
        <style>
        :host {
            display: block;
        }

        ptcs-chart-axis, [part=legend-area] {
            width: 100%;
            height: 100%;
        }
        </style>
        <ptcs-chart-layout id="chart-layout" style="height:100%" part="chart-layout"
                           disabled="[[disabled]]"
                           title-pos="[[titlePos]]" hide-title="[[!titleLabel]]"
                           notes-pos="[[notesPos]]" notes-align="[[notesAlign]]" hide-notes="[[_hideNotes(notesLabel, hideNotes)]]"
                           legend-pos="[[legendPos]]" hide-legend="[[_hideLegend(hideLegend, legend)]]"
                           eff-legend-pos="{{effLegendPos}}"
                           x-zoom="[[_showZoomX(noXZoom, xZoomRange, xZoomInterval, xZoomSlider, zoomDrag, zoomSelect)]]"
                           y-zoom="[[_showZoomY(noYZoom, yZoomRange, yZoomInterval, yZoomSlider, zoomDrag, zoomSelect)]]"
                           flip-axes="[[!flipAxes]]"
                           flip-x-axis="[[flipXAxis]]"
                           flip-y-axis="[[flipYAxis]]"
                           spark-view="[[sparkView]]"
                           x-axis="[[!hideXAxis]]"
                           y-axis="[[!hideYAxis]]"
                           y-axis2="[[_showY2Axis(showY2Axis, isReferenceLines)]]"
                           is-reference-lines="[[isReferenceLines]]"
                           action-bar="[[_actionBar(actionBar, _hideToolbar)]]"
                           chart-state="[[_hideChartState(_chartState)]]">
            <div part="title-area" slot="title"
                style\$="text-align:[[_getHorizontalAlignment(titlePos, titleAlign)]]">
                <ptcs-label part="title-label" label="[[titleLabel]]" variant="[[titleVariant]]"
                    horizontal-alignment="[[_getHorizontalAlignment(titlePos, titleAlign)]]" multi-line></ptcs-label>
            </div>
            <div part="notes-area" slot="notes"
                style\$="text-align:[[_getHorizontalAlignment(notesPos, notesAlign)]];">
                <ptcs-label part="notes-label" label="[[notesLabel]]" variant="label"
                    horizontal-alignment="[[_getHorizontalAlignment(notesPos, notesAlign)]]" multi-line></ptcs-label>
            </div>
            <ptcs-chart-state part="chart-state" slot="chart-state"
                chart-state-ext="[[chartState]]"
                chart-state-data-error="[[_chartStateDataError]]"
                chart-state-data-empty="[[_chartStateDataEmpty]]"
                chart-state="{{_chartState}}"
                icon-loading="[[iconStateLoading]]"
                label-no-data="[[labelStateNoData]]"
                icon-no-data="[[iconStateNoData]]"
                label-empty="[[labelStateEmpty]]"
                icon-empty="[[iconStateEmpty]]"
                label-error="[[labelStateError]]"
                icon-error="[[iconStateError]]"></ptcs-chart-state>
            <ptcs-chart-coord slot="chart" part="chart"
                flip-axes="[[!flipAxes]]"
                flip-x-axis="[[flipXAxis]]"
                flip-y-axis="[[flipYAxis]]"
                x-ticks="[[_xTicks]]"
                y-ticks="[[_yTicks]]"
                y2-ticks="[[_if(isReferenceLines, _yReferenceLines, _y2Ticks)]]"
                show-x-rulers="[[showXRulers]]"
                show-y-rulers="[[showYRulers]]"
                show-y2-rulers="[[isReferenceLines]]"
                is-reference-lines="[[isReferenceLines]]"
                y-axis-ruler-alignment="[[yAxisRulerAlignment]]"
                front-rulers="[[frontRulers]]"
                hide-zero-ruler
                graph-width="{{_graphWidth}}"
                graph-height="{{_graphHeight}}"
                spark-view="[[sparkView]]">
                <ptcs-chart-core-schedule slot="chart" id="chart" part="core-chart" style="pointer-events: auto"
                    tabindex\$="[[_delegatedFocus]]"
                    disabled="[[disabled]]"
                    legend="[[legend]]"
                    tooltip-template="[[tooltipTemplate]]"
                    data="[[data]]"
                    selected-data="{{selectedData}}"
                    labels="{{labels}}"
                    x-min="{{_xMin}}"
                    x-max="{{_xMax}}"
                    y-min="{{_yMin}}"
                    y-max="{{_yMax}}"
                    flip-axes="[[flipAxes]]"
                    reverse-x-axis="[[!reverseXAxis]]"
                    reverse-y-axis="[[reverseYAxis]]"
                    x-scale="[[_xScale]]"
                    y-scale="[[_yScale]]"
                    filter-legend="[[_selectedLegend]]"
                    zoom-select="[[_zoomMouseOpt(zoomSelect, noXZoom, noYZoom)]]"
                    zoom-drag="[[_zoomMouseOpt(zoomDrag, noXZoom, noYZoom)]]"
                    selection-mode="[[selectionMode]]"
                    on-selection="_onChartSelection"
                    chart-state-data-error="{{_chartStateDataError}}"
                    chart-state-data-empty="{{_chartStateDataEmpty}}"></ptcs-chart-core-schedule>
            </ptcs-chart-coord>
            <div part="action-bar-area" slot="action-bar">
                <ptcs-toolbar id="toolbar" tabindex\$="[[_gcTabindex(_delegatedFocus, _hideToolbar)]]"
                    part="action-bar" disabled="[[disabled]]" variant="secondary" hide-filter on-activated="_toolbarAction">
                </ptcs-toolbar>
            </div>
            <div part="legend-area" hidden\$="[[hideLegend]]" slot="legend">
                <ptcs-chart-legend
                    tabindex\$="[[_tabindex(filterLegend, _delegatedFocus)]]"
                    disabled="[[disabled]]"
                    part="legend"
                    items="[[legend]]"
                    legendcolors="[[legendcolors]]"
                    shape="[[legendShape]]"
                    filter="[[filterLegend]]"
                    horizontal="[[_horizLegend(effLegendPos)]]"
                    max-width="[[legendMaxWidth]]"
                    align="[[legendAlign]]"
                    selected="{{_selectedLegend}}"></ptcs-chart-legend>
            </div>
            <ptcs-chart-zoom slot="xzoom" id="zoomX" part="zoom-xaxis" type="[[labels]]" hidden\$="[[noXZoom]]"
                tabindex\$="[[_delegatedFocus]]"
                disabled="[[disabled]]"
                side="[[_xSide(flipXAxis, flipAxes)]]"
                min-value="[[_xMin]]"
                max-value="[[_xMax]]"
                zoom-start="{{xZoomStart}}"
                zoom-end="{{xZoomEnd}}"
                hide-reset
                axis-length="[[_xSize(_graphWidth, _graphHeight, flipAxes)]]"
                range-picker="[[xZoomRange]]"
                interval="[[xZoomInterval]]"
                interval-label="[[xZoomIntervalLabel]]"
                interval-control="[[xZoomIntervalControl]]"
                interval-origin="[[xZoomIntervalOrigin]]"
                show-interval-anchor="[[xShowIntervalAnchor]]"
                slider="[[xZoomSlider]]"
                slider-label="[[xZoomSliderLabel]]"
                slider-min-label="[[xZoomSliderMinLabel]]"
                slider-max-label="[[xZoomSliderMaxLabel]]"
                range-start-label="[[xZoomRangeStartLabel]]"
                range-end-label="[[xZoomRangeEndLabel]]"
                reverse-slider="[[!reverseXAxis]]"
                reset-label="[[resetLabel]]"
                interval-from-label="[[xZoomIntervalFromLabel]]"
                interval-to-label="[[xZoomIntervalToLabel]]"></ptcs-chart-zoom>
            <ptcs-chart-axis slot="xaxis" id="xaxis" part="xaxis" style="pointer-events: auto"
                tabindex\$="[[_delegatedFocus]]"
                disabled="[[disabled]]"
                type="[[labels]]" zoom
                spec-min="[[_specValue(specXMin, xZoomStart, noXZoom)]]"
                spec-max="[[_specValue(specXMax, xZoomEnd, noXZoom)]]"
                side="[[_xSide(flipXAxis, flipAxes)]]"
                label="[[xAxisLabel]]"
                align-label="[[xAxisAlign]]"
                min-value="[[_xMin]]"
                max-value="[[_xMax]]"
                size="[[_xSize(_graphWidth, _graphHeight, flipAxes)]]"
                max-size="[[_if(flipAxes, horizontalAxisMaxHeight, verticalAxisMaxWidth)]]"
                ticks="{{_xTicks}}"
                ticks-rotation="[[horizontalTicksRotation]]"
                reverse="[[!reverseXAxis]]"
                scale="{{_xScale}}"
                hidden\$="[[hideXAxis]]"
                outer-padding="[[outerPadding]]"
                inner-padding="[[innerPadding]]"></ptcs-chart-axis>
            <ptcs-chart-zoom slot="yzoom" id="zoomY" part="zoom-yaxis" type="date" hidden\$="[[noYZoom]]"
                tabindex\$="[[_delegatedFocus]]"
                disabled="[[disabled]]"
                side="[[_ySide(flipYAxis, flipAxes)]]"
                hide-reset
                axis-length="[[_ySize(_graphWidth, _graphHeight, flipAxes)]]"
                min-value="[[_yZoomMin(_yMin, _yMax, specYMin, specYMax)]]"
                max-value="[[_yZoomMax(_yMin, _yMax, specYMax, specYMin)]]"
                zoom-start="{{yZoomStart}}"
                zoom-end="{{yZoomEnd}}"
                range-picker="[[yZoomRange]]"
                range-start-label="[[yZoomRangeStartLabel]]"
                range-end-label="[[yZoomRangeEndLabel]]"
                interval="[[yZoomInterval]]"
                interval-label="[[yZoomIntervalLabel]]"
                interval-control="[[yZoomIntervalControl]]"
                interval-origin="[[yZoomIntervalOrigin]]"
                show-interval-anchor="[[yShowIntervalAnchor]]"
                slider="[[yZoomSlider]]"
                slider-label="[[yZoomSliderLabel]]"
                slider-min-label="[[yZoomSliderMinLabel]]"
                slider-max-label="[[yZoomSliderMaxLabel]]"
                reverse-slider="[[reverseYAxis]]"
                reset-label="[[resetLabel]]"
                interval-from-label="[[yZoomIntervalFromLabel]]"
                interval-to-label="[[yZoomIntervalToLabel]]"
                date-range-hint-text="[[dateRangeHintText]]"></ptcs-chart-zoom>
            <ptcs-chart-axis slot="yaxis" id="yaxis" part="yaxis" style="pointer-events: auto"
                no-tabindex
                disabled="[[disabled]]"
                type="date" zoom
                date-format-token="[[_updateDateFormatToken(numberOfYLabels, dateFormatToken)]]"
                spec-min="[[_specValue(specYMin, yZoomStart, noYZoom)]]"
                spec-max="[[_specValue(specYMax, yZoomEnd, noYZoom)]]"
                num-ticks="[[numberOfYLabels]]"
                side="[[_ySide(flipYAxis, flipAxes)]]"
                label="[[yAxisLabel]]"
                align-label="[[yAxisAlign]]"
                min-value="[[_yMin]]"
                max-value="[[_yMax]]"
                size="[[_ySize(_graphWidth, _graphHeight, flipAxes)]]"
                max-size="[[_if(flipAxes, verticalAxisMaxWidth, horizontalAxisMaxHeight)]]"
                ticks="{{_yTicks}}"
                ticks-rotation="[[horizontalTicksRotation]]"
                reverse="[[reverseYAxis]]"
                scale="{{_yScale}}"
                hidden\$="[[hideYAxis]]"></ptcs-chart-axis>
            <template is="dom-if" if="[[_showY2Axis(showY2Axis, isReferenceLines)]]">
                <ptcs-chart-axis id="yaxis2" slot="yaxis2" part="yaxis2" style="pointer-events: auto"
                    no-tabindex
                    disabled="[[disabled]]"
                    type="date" zoom
                    date-format-token="[[_updateDateFormatToken(numberOfYLabels, y2AxisDateFormatToken)]]"
                    spec-min="[[_specValue(specYMin, yZoomStart, noYZoom)]]"
                    spec-max="[[_specValue(specYMax, yZoomEnd, noYZoom)]]"
                    num-ticks="[[numberOfYLabels]]"
                    side="[[_y2Side(flipYAxis, flipAxes)]]"
                    label="[[y2AxisLabel]]"
                    align-label="[[y2AxisAlign]]"
                    min-value="[[_yMin]]"
                    max-value="[[_yMax]]"
                    size="[[_ySize(_graphWidth, _graphHeight, flipAxes)]]"
                    max-size="[[_if(flipAxes, verticalAxisMaxWidth, horizontalAxisMaxHeight)]]"
                    reverse="[[reverseYAxis]]"
                    scale="{{_yScale}}"
                    ticks="{{_y2Ticks}}"
                    ticks-rotation="[[horizontalTicksRotation]]"
                    dual-ticks="[[_dualTicks(isReferenceLines, _yTicks)]]"
                    reference-lines="[[_yAxisReferenceLines]]"
                    eff-reference-lines="{{_yReferenceLines}}"
                    is-reference-lines="[[isReferenceLines]]"
                    hidden\$="[[!_showY2Axis(showY2Axis, isReferenceLines)]]"></ptcs-chart-axis>
            </template>
        </ptcs-chart-layout>`;
    }

    static get is() {
        return 'ptcs-chart-schedule';
    }

    static get properties() {
        return {
            // Title label
            titleLabel: {
                type: String
            },

            // [top] || bottom || left || right
            titlePos: {
                type: String
            },

            // Title label variant
            titleVariant: {
                type:  String,
                value: 'header'
            },

            // Title alignment: left || center || right
            titleAlign: {
                type: String
            },

            disabled: {
                type:               Boolean,
                value:              false,
                reflectToAttribute: true
            },

            hideNotes: {
                type:  Boolean,
                value: false
            },

            // Notes label
            notesLabel: {
                type: String
            },

            // top || [bottom] || left || right
            notesPos: {
                type: String
            },

            notesAlign: {
                type: String
            },

            // 'data', 'loading', 'no-data'
            chartState: {
                type: String
            },

            iconStateLoading: {
                type: String
            },

            labelStateNoData: {
                type: String
            },

            iconStateNoData: {
                type: String
            },

            labelStateEmpty: {
                type: String
            },

            iconStateEmpty: {
                type: String
            },

            labelStateError: {
                type: String
            },

            iconStateError: {
                type: String
            },

            // X-axis label
            xAxisLabel: {
                type: String
            },

            xAxisAlign: {
                type: String
            },

            hideXAxis: {
                type:     Boolean,
                observer: '_hideXAxisChanged'
            },

            // Y-axis label
            yAxisLabel: {
                type: String
            },

            yAxisAlign: {
                type: String
            },

            hideYAxis: {
                type:     Boolean,
                observer: '_hideYAxisChanged'
            },

            // Y-axis number of labels
            numberOfYLabels: {
                type: Number
            },

            // Secondary y-axis
            showY2Axis: {
                type: Boolean
            },

            y2AxisLabel: {
                type: String
            },

            // [left] || center || right
            y2AxisAlign: {
                type: String
            },

            y2AxisDateFormatToken: {
                type: String
            },

            dateFormatToken: {
                type: String
            },

            hideLegend: {
                type:   Boolean,
                notify: true // Can be toggled via button
            },

            // Names of legends, if legends should be visible
            legend: {
                type: Array
            },

            // top || bottom || left || [right]
            legendPos: {
                type: String
            },

            effLegendPos: {
                type: String
            },

            legendAlign: {
                type: String
            },

            // square || circle || none
            legendShape: {
                type: String
            },

            // Filter chart using the legend?
            filterLegend: {
                type: Boolean
            },

            // Legends currently selected in the legend component
            _selectedLegend: {
                type: Array
            },

            // top || bottom
            actionBar: {
                type: String
            },

            sparkView: {
                type:  Boolean,
                value: false
            },

            // Flip x- and y-axes
            flipAxes: {
                type:  Boolean,
                value: false
            },

            // Flip x-axis side
            flipXAxis: {
                type: Boolean
            },

            // Flip y-axis side
            flipYAxis: {
                type: Boolean
            },

            // Connects ticks from x-axis to chart
            _xTicks: {
                type: Array
            },

            // Connects ticks from y-axis to chart
            _yTicks: {
                type: Array
            },

            // Connects ticks from second y-axis to chart
            _y2Ticks: {
                type: Array
            },

            // Show rulers for X-axis
            showXRulers: {
                type: Boolean
            },

            // Show rulers for Y-axis
            showYRulers: {
                type: Boolean
            },

            // Put rulers on top of chart
            frontRulers: {
                type: Boolean
            },

            // Flag to use secondary axis for reference lines
            isReferenceLines: {
                type: Boolean
            },

            // Reference lines (a.k.a. threshold lines) raw data
            referenceLines: {
                type:     Array,
                observer: 'referenceLinesChanged'
            },

            // Reference lines for y-axis (only values valid according to the data type of the axis)
            _yAxisReferenceLines: {
                type: Array
            },

            // Sorted & filtered secondary y-axis data from ptcs-chart-axis
            _yReferenceLines: {
                type: Array
            },

            // Watches for resizes
            _graphWidth: {
                type: Number
            },

            // Watches for resizes
            _graphHeight: {
                type: Number
            },

            // The x-value on a bar-chart is always [string] (labels)
            /*
            // x-axis type: number || date || [string]
            xType: {
                type: Object
            },
            */

            // x-axis labels
            labels: {
                type: Array
            },

            // Needed by chart behavior for zooming
            _xType: {
                type:     Array,
                computed: '_alias(labels)'
            },

            _yType: {
                type:  String,
                value: 'date'
            },

            // Reverse direction of x-axis
            reverseXAxis: {
                type: Boolean
            },

            // Reverse direction of y-axis
            reverseYAxis: {
                type: Boolean
            },

            // Minimun x value in data
            _xMin: {
                type: Object
            },

            // Maximum x value in data
            _xMax: {
                type: Object
            },

            // Minimun y value in data
            _yMin: {
                type: Object
            },

            // Maximum y value in data
            _yMax: {
                type: Object
            },

            // Specified x-min-value: baseline || auto || Number
            specXMin: {
                type: Object
            },

            // Specified x-max-value: auto || Number
            specXMax: {
                type: Object
            },

            // Specified y-min-value: baseline || auto || Number
            specYMin: {
                type: Object
            },

            _specYValueMin: {
                type: Object,
            },

            // Specified y-max-value: auto || Number
            specYMax: {
                type: Object
            },

            // Move x-scale from x-axis to chart
            _xScale: {
                type: Function,
            },

            // Move y-scale from y-axis to chart
            _yScale: {
                type: Function,
            },

            // Disable X-axis zooming
            noXZoom: {
                type: Boolean
            },

            // Zooming based on properties
            xZoomStart: {
                type: Object
            },

            xZoomEnd: {
                type: Object
            },

            // Show zoom range UI control
            xZoomRange: {
                type: Boolean
            },

            // Specify zoom interval
            xZoomInterval: {
                type: Object
            },

            xZoomIntervalLabel: {
                type: String
            },

            // 'dropdown' || 'radio' || 'textfield'
            xZoomIntervalControl: {
                type: String
            },

            // 'start' || 'end'
            xZoomIntervalOrigin: {
                type: String
            },

            // Allow interval control to manipulate origin?
            xShowIntervalAnchor: {
                type: Boolean
            },

            // Show zoom slider
            xZoomSlider: {
                type: Boolean
            },

            // Disable Y-axis zooming
            noYZoom: {
                type: Boolean
            },

            // Zooming based on properties
            yZoomStart: {
                type: Object
            },

            yZoomEnd: {
                type: Object
            },

            // Show zoom range UI control
            yZoomRange: {
                type: Boolean
            },

            yZoomRangeStartLabel: {
                type: String
            },

            yZoomRangeEndLabel: {
                type: String
            },

            // Specify zoom interval
            yZoomInterval: {
                type: Object
            },

            yZoomIntervalLabel: {
                type: String
            },

            // 'dropdown' || 'radio' || 'textfield'
            yZoomIntervalControl: {
                type: String
            },

            // 'start' || 'end'
            yZoomIntervalOrigin: {
                type: String
            },

            // Allow interval control to manipulate origin?
            yShowIntervalAnchor: {
                type: Boolean
            },

            // Show zoom slider
            yZoomSlider: {
                type: Boolean
            },

            // zoom by dragging mouse: "x" || "y" || "xy" || undefined
            zoomDrag: {
                type: String
            },

            // zoom by selecting two elements: "x" || "y" || "xy" || undefined
            zoomSelect: {
                type: String
            },

            xZoomIntervalFromLabel: {
                type: String
            },

            xZoomIntervalToLabel: {
                type: String
            },

            yZoomIntervalFromLabel: {
                type: String
            },

            yZoomIntervalToLabel: {
                type: String
            },

            legendMaxWidth: {
                type: Number
            },

            verticalAxisMaxWidth: {
                type: Number
            },

            horizontalAxisMaxHeight: {
                type: Number
            },

            horizontalTicksRotation: {
                type: Number
            },

            // The chart data
            data: {
                type: Array
            },

            outerPadding: {
                type: String
            },

            innerPadding: {
                type: String
            },

            _delegatedFocus: String,

            selectedData: {
                type:   Object,
                notify: true
            },

            // Needed by BehaviorChart to select correct label for selection toolbar label
            // TODO?: refactor schedule chart selections so they work more like other charts
            _chartSelection: {
                type:     Object,
                computed: '_computeChartSelection(selectedData)'
            },

            // 'none' || 'single' || 'multiple'
            selectionMode: {
                type: String
            },

            tooltipTemplate: {
                type: String
            },

            dateRangeHintText: {
                type: String
            },

            legendcolors: {
                type: Object
            },

            _isZoomable$tb: {
                type:     Boolean,
                // eslint-disable-next-line max-len
                computed: '_isZoomable(noXZoom, noYZoom, xZoomRange, yZoomRange, xZoomInterval, yZoomInterval, xZoomSlider, yZoomSlider, zoomDrag, zoomSelect, showZoomButtons)'
            },

            _resetButtonEnabled$tb: {
                computed: '_enableZoomReset(type, minValue, maxValue, zoomStart, zoomEnd, _yMin, _yMax, yZoomStart, yZoomEnd)'
            }
        };
    }

    static get observers() {
        return [
            '_observeIsReferenceLines(_yAxisReferenceLines, showY2Axis)'
        ];
    }

    ready() {
        super.ready();
        if (this.titleLabel === undefined) {
            this.titleLabel = null;
        }
        if (this.notesLabel === undefined) {
            this.notesLabel = null;
        }
        if (this.flipAxes === undefined) {
            this.flipAxes = false;
        }
        if (this.hideXAxis === undefined) {
            this.hideXAxis = false;
        }
        if (this.hideYAxis === undefined) {
            this.hideYAxis = false;
        }
    }

    _updateDateFormatToken(numberOfLabels, dateFormatToken) {
        return (numberOfLabels > 0 && !dateFormatToken) ? 'YYYY-MM-DD HH:mm:ss.SSS' : dateFormatToken;
    }

    _gcTabindex(_delegatedFocus, _hideToolbar) {
        return _hideToolbar ? false : _delegatedFocus;
    }

    _tabindex(filterLegend, _delegatedFocus) {
        return filterLegend ? _delegatedFocus : false;
    }

    _isZoomable(noXZoom, noYZoom, xZoomRange, yZoomRange, xZoomInterval, yZoomInterval,
        xZoomSlider, yZoomSlider, zoomDrag, zoomSelect, showZoomButtons) {
        return this._showZoomX(noXZoom, xZoomRange, xZoomInterval, xZoomSlider, zoomDrag, zoomSelect, showZoomButtons) ||
            this._showZoomY(noYZoom, yZoomRange, yZoomInterval, yZoomSlider, zoomDrag, zoomSelect, showZoomButtons);
    }

    // Hack to align selection manager of
    _computeChartSelection(selectedData) {
        if (!selectedData) {
            return {length: 0};
        }
        return {length: Array.isArray(selectedData) ? selectedData.length : 1};
    }

    _enableZoomReset(type, minValue, maxValue, zoomStart, zoomEnd, _yMin, _yMax, yZoomStart, yZoomEnd) {
        return this._enabled(type, minValue, maxValue, zoomStart, zoomEnd) ||
            this._yEnabled(_yMin, _yMax, yZoomStart, yZoomEnd);
    }

    _zoomMouseOpt(zoom, noXZoom, noYZoom) {
        if (zoom === 'x') {
            return noXZoom ? false : 'x';
        }
        if (zoom === 'y') {
            return noYZoom ? false : 'y';
        }
        if (zoom === 'xy') {
            if (noXZoom) {
                return noYZoom ? false : 'y';
            }
            return noYZoom ? 'x' : 'xy';
        }
        return false;
    }

    referenceLinesChanged(referenceLines) {
        if (!Array.isArray(referenceLines)) {
            this._yAxisReferenceLines = undefined;
            return;
        }

        // Filter out invalid values
        this._yAxisReferenceLines = referenceLines.reduce((acc, line) => {
            if (line.value instanceof Date) {
                acc.push(line);
            } else {
                const ms = Date.parse(line.value);
                if (!isNaN(ms)) {
                    acc.push({...line, value: new Date(ms)});
                }
            }
            return acc;
        }, []);
    }

    _observeIsReferenceLines(_yAxisReferenceLines, showY2Axis) {
        this.isReferenceLines = !showY2Axis && _yAxisReferenceLines && _yAxisReferenceLines.length > 0;
    }

    _getHorizontalAlignment(pos, align) {
        if (pos === 'top' || pos === 'bottom') {
            return align;
        }

        return 'start';
    }

    _hideNotes(nodesLabel, hideNotes) {
        return !nodesLabel || hideNotes;
    }

    _hideChartState(chartState) {
        return chartState !== 'data';
    }

    _hideLegend(hideLegend, legend) {
        return hideLegend || !(legend instanceof Array) || !(legend.length > 0);
    }

    _horizLegend(effLegendPos) {
        return effLegendPos === 'top' || effLegendPos === 'bottom';
    }

    _xSide(flipXAxis, flipAxes) {
        // eslint-disable-next-line no-nested-ternary
        return flipAxes ? (flipXAxis ? 'top' : 'bottom') : (flipXAxis ? 'right' : 'left');
    }

    _ySide(flipYAxis, flipAxes) {
        // eslint-disable-next-line no-nested-ternary
        return flipAxes ? (flipYAxis ? 'right' : 'left') : (flipYAxis ? 'top' : 'bottom');
    }

    _y2Side(flipYAxis, flipAxes) {
        // eslint-disable-next-line no-nested-ternary
        return flipAxes ? (flipYAxis ? 'left' : 'right') : (flipYAxis ? 'bottom' : 'top');
    }

    _dualTicks(isReferenceLines, _yTicks) {
        return isReferenceLines ? null : _yTicks;
    }

    _xSize(_graphWidth, _graphHeight, flipAxes) {
        return flipAxes ? _graphWidth : _graphHeight;
    }

    _ySize(_graphWidth, _graphHeight, flipAxes) {
        return flipAxes ? _graphHeight : _graphWidth;
    }

    _showY2Axis(showY2Axis, isReferenceLines) {
        return showY2Axis || isReferenceLines;
    }

    _showZoom(noZoom, zoomRange, zoomInterval, zoomSlider, zoomMouse, showZoomButtons) {
        if (noZoom) {
            return false;
        }
        return zoomRange || zoomInterval || zoomSlider || zoomMouse || showZoomButtons;
    }

    _showZoomX(noXZoom, xZoomRange, xZoomInterval, xZoomSlider, zoomDrag, zoomSelect, showZoomButtons) {
        const zoomMouse = [zoomDrag, zoomSelect].find(item => item === 'x' || item === 'xy');
        return this._showZoom(noXZoom, xZoomRange, xZoomInterval, xZoomSlider, zoomMouse, showZoomButtons);
    }

    _showZoomY(noYZoom, yZoomRange, yZoomInterval, yZoomSlider, zoomDrag, zoomSelect, showZoomButtons) {
        const zoomMouse = [zoomDrag, zoomSelect].find(item => item === 'y' || item === 'xy');
        return this._showZoom(noYZoom, yZoomRange, yZoomInterval, yZoomSlider, zoomMouse, showZoomButtons);
    }

    _specValue(spec, zoom, noZoom) {
        if (noZoom || zoom === undefined || zoom === '' || zoom === null) {
            return spec;
        }
        return zoom;
    }

    _yZoomMin(_yMin, _yMax, specYMin, specYMax) {
        return axisMin(_yMin, _yMax, 'date', specYMin, specYMax);
    }

    _yZoomMax(_yMin, _yMax, specYMax, specYMin) {
        return axisMax(_yMin, _yMax, 'date', specYMax, specYMin);
    }

    _enabled(type, minValue, maxValue, zoomStart, zoomEnd) {
        return !typeIsFullRange(type, minValue, maxValue, zoomStart, zoomEnd);
    }

    _yEnabled(_yMin, _yMax, yZoomStart, yZoomEnd) {
        return this._enabled('date', _yMin, _yMax, yZoomStart, yZoomEnd);
    }

    _actionBar(actionBar, hideToolbar) {
        if (hideToolbar) {
            return null;
        }

        return actionBar || 'top';
    }

    _onChartSelection(ev) {
        function invert(scale, v1, v2) {
            if (scale.invert) {
                return [scale.invert(v1), scale.invert(v2)];
            }
            const domain = scale.domain();
            if (domain.length <= 1) {
                return [domain[0], domain[0]];
            }
            let a = scale(domain[0]);
            let b = scale(domain[1]);
            let min, max;

            if (a < b) {
                const d = (b - a);
                const p = d * scale.padding();
                min = Math.ceil((v1 - a + p) / d - 1);
                max = Math.floor((v2 - a) / d);
            } else {
                a = scale(domain[domain.length - 1]);
                b = scale(domain[domain.length - 2]);
                const d = (b - a);
                const p = d * scale.padding();
                max = domain.length - 1 - Math.ceil((v2 - a + p) / d - 1);
                min = domain.length - 1 - Math.floor((v1 - a) / d);
            }

            min = Math.max(Math.min(min, domain.length), 0);
            max = Math.max(Math.min(max, domain.length), min);

            return [domain[min], domain[max]];
        }

        const xScale = this._xScale;
        const yScale = this._yScale;
        let reverseXAxis = !this.reverseXAxis;
        let reverseYAxis = this.reverseYAxis;
        let d = ev.detail;
        if (!this.flipAxes) {
            d = {x: d.y, y: d.x, w: d.h, h: d.w};
            reverseXAxis = !reverseXAxis;
            reverseYAxis = !reverseYAxis;
        }
        const zd = this._zoomMouseOpt(this.zoomDrag, this.noXZoom, this.noYZoom);
        const zs = this._zoomMouseOpt(this.zoomSelect, this.noXZoom, this.noYZoom);

        if (zd === 'x' || zd === 'xy' || zs === 'x' || zs === 'xy') {
            // Make sure the selection at least covers one task bar
            const domain = xScale.domain();
            const [start, end] = reverseXAxis ? invert(xScale, d.x + d.w, d.x) : invert(xScale, d.x, d.x + d.w);
            if (typeValue(start, domain) <= typeValue(end, domain)) {
                [this.xZoomStart, this.xZoomEnd] = [start, end];
            }
        }
        if (zd === 'y' || zd === 'xy' || zs === 'y' || zs === 'xy') {
            [this.yZoomStart, this.yZoomEnd] = reverseYAxis // default y-axis is reversed
                ? invert(yScale, d.y, d.y + d.h) : invert(yScale, d.y + d.h, d.y);
        }
    }

    refreshData() {
        this.$.chart.refreshData();
    }

    _resetToDefaultValues() {
        this.$.legend._resetToDefaultValues();
        this.$.zoomX._resetToDefaultValues();
        this.$.zoomY._resetToDefaultValues();
    }

    _hideXAxisChanged(hide) {
        if (!hide) {
            this.$.xaxis.refresh();
        }
    }

    _hideYAxisChanged(hide) {
        if (!hide) {
            this.$.yaxis.refresh();
        }
    }
};

customElements.define(PTCS.ChartSchedule.is, PTCS.ChartSchedule);
