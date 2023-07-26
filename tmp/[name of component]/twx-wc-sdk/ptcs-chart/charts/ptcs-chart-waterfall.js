import {PolymerElement, html} from '@polymer/polymer/polymer-element.js';
import {PTCS} from 'ptcs-library/library.js';
import {axisMin, axisMax, typeIsFullRange} from 'ptcs-library/library-chart.js';
import {BehaviorChart} from '../ptcs-behavior-chart.js';
import 'ptcs-behavior-styleable/ptcs-behavior-styleable.js';
import 'ptcs-behavior-focus/ptcs-behavior-focus.js';
import 'ptcs-behavior-tabindex/ptcs-behavior-tabindex.js';

import 'ptcs-toolbar/ptcs-toolbar.js';
import 'ptcs-label/ptcs-label.js';
import '../ptcs-chart-layout.js';
import '../ptcs-chart-legend.js';
import '../ptcs-chart-state.js';
import '../ptcs-chart-coord.js';
import '../axes/ptcs-chart-axis.js';
import '../zoom/ptcs-chart-zoom.js';
import './ptcs-chart-core-waterfall.js';

const yType = 'number';

// Don't need lint to warn about that ES5 arrow functions might be a mistaken >=
/* eslint-disable no-confusing-arrow */

PTCS.ChartWaterfall = class extends BehaviorChart(PTCS.BehaviorTabindex(PTCS.BehaviorFocus(
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

        [part=chart] {
            position: relative;
        }

        </style>

        <ptcs-chart-layout id="chart-layout" style="height:100%" part="chart-layout"
                           disabled="[[disabled]]"
                           title-pos="[[titlePos]]" hide-title="[[!titleLabel]]"
                           notes-pos="[[notesPos]]" notes-align="[[notesAlign]]" hide-notes="[[_hideNotes(notesLabel, hideNotes)]]"
                           legend-pos="[[legendPos]]" hide-legend="[[_hideLegend(hideLegend, legend)]]"
                           eff-legend-pos="{{effLegendPos}}"
                           x-zoom="[[_showZoomX(noXZoom,xZoomRange,xZoomInterval,xZoomSlider,xZoomDrag,xZoomSelect,noYZoom)]]"
                           y-zoom="[[_showZoomY(noYZoom,yZoomRange,yZoomInterval,yZoomSlider,yZoomDrag,yZoomSelect,noXZoom)]]"
                           flip-axes="[[flipAxes]]"
                           flip-x-axis="[[flipXAxis]]"
                           flip-y-axis="[[flipYAxis]]"
                           spark-view="[[sparkView]]"
                           x-axis="[[!hideXAxis]]"
                           y-axis="[[!hideYAxis]]"
                           y-axis2="[[_showY2Axis(isReferenceLines, showY2Axis)]]"
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
                flip-axes="[[flipAxes]]"
                flip-x-axis="[[flipXAxis]]"
                flip-y-axis="[[flipYAxis]]"
                x-ticks="[[_xTicks]]"
                y-ticks="[[_yTicks]]"
                y-scale="[[_yScale]]"
                y2-ticks="[[_if(isReferenceLines, _yReferenceLines, _y2Ticks)]]"
                show-x-rulers="[[showXRulers]]"
                has-y2="[[showY2Axis]]"
                show-y-rulers="[[_showYRulers(showYRulers, yAxisRulerAlignment, showY2Axis)]]"
                show-y2-rulers="[[isReferenceLines]]"
                is-reference-lines="[[isReferenceLines]]"
                y-axis-ruler-alignment="[[yAxisRulerAlignment]]"
                front-rulers="[[frontRulers]]"
                hide-zero-ruler="[[hideZeroRuler]]"
                spark-view="[[sparkView]]"
                graph-width="{{_graphWidth}}"
                graph-height="{{_graphHeight}}">
                <ptcs-chart-core-waterfall id="chart" slot="chart" part="core-chart" style="pointer-events: auto"
                    tabindex\$="[[_delegatedFocus]]"
                    disabled="[[disabled]]"
                    data="[[data]]"
                    legend="[[legend]]"
                    tooltip-template="[[tooltipTemplate]]"
                    x-type="{{_labels}}"
                    x-min="{{_xMin}}"
                    x-max="{{_xMax}}"
                    y-min="{{_yMin}}"
                    y-max="{{_yMax}}"
                    y-value-format="[[yAxisNumberFormatSpecifier]]"
                    show-values="[[_showValues(sparkView, hideValues, showValues)]]"
                    flip-axes="[[flipAxes]]"
                    reverse-x-axis="[[reverseXAxis]]"
                    reverse-y-axis="[[reverseYAxis]]"
                    x-scale="[[_xScale]]"
                    y-scale="[[_yScale]]"
                    filter-legend="[[_selectedLegend]]"
                    show-y2-axis="[[_showY2Axis(showY2Axis, isReferenceLines)]]"
                    zoom-select="[[_zoomSelect(xZoomSelect, noXZoom, yZoomSelect, noYZoom)]]"
                    zoom-drag-x="[[_zoomDrag(xZoomDrag, noXZoom)]]"
                    zoom-drag-y="[[_zoomDrag(yZoomDrag, noYZoom)]]"
                    selection-mode="[[selectionMode]]"
                    unselectable="[[unselectable]]"
                    summary-bars="[[summaryBars]]"
                    hide-connector-lines="[[hideConnectorLines]]"
                    trend-colors="[[trendColors]]"
                    sample-size="[[sampleSize]]"
                    on-chart-selection="_onSelectionChanged"
                    on-zoom-selection="_onZoomSelection"
                    exportparts="bar"
                    chart-state-data-error="{{_chartStateDataError}}"
                    chart-state-data-empty="{{_chartStateDataEmpty}}"></ptcs-chart-core-waterfall>
            </ptcs-chart-coord>
            <div part="action-bar-area" slot="action-bar">
                <ptcs-toolbar id="toolbar" tabindex\$="[[_gcTabindex(_delegatedFocus, _hideToolbar)]]"
                    part="action-bar" disabled="[[disabled]]" variant="secondary" hide-filter on-activated="_toolbarAction">
                </ptcs-toolbar>
            </div>
            <div part="legend-area" slot="legend">
                <ptcs-chart-legend
                    tabindex\$="[[_tabindex(filterLegend, _delegatedFocus)]]"
                    id="legend"
                    part="legend"
                    items="[[legend]]"
                    shape="[[legendShape]]"
                    filter="[[filterLegend]]"
                    horizontal="[[_horizLegend(effLegendPos)]]"
                    max-width="[[legendMaxWidth]]"
                    align="[[legendAlign]]"
                    disabled="[[disabled]]"
                    selected="{{_selectedLegend}}"></ptcs-chart-legend>
            </div>
            <ptcs-chart-zoom slot="xzoom" id="zoomX" part="zoom-xaxis" hidden\$="[[noXZoom]]"
                tabindex\$="[[_delegatedFocus]]"
                disabled="[[disabled]]"
                type="[[_labels]]"
                side="[[_xSide(flipXAxis, flipAxes)]]"
                hide-reset
                axis-length="[[_xSize(_graphWidth, _graphHeight, flipAxes)]]"
                min-value="[[_zoomMinX(_xMin, _xMax, _labels, specXMin, specXMax)]]"
                max-value="[[_zoomMaxX(_xMin, _xMax, _labels, specXMax, specXMin)]]"
                zoom-start="{{xZoomStart}}"
                zoom-end="{{xZoomEnd}}"
                range-picker="[[_zoomArg(noXZoom, xZoomRange)]]"
                interval="[[_zoomArg(noXZoom, xZoomInterval)]]"
                interval-label="[[xZoomIntervalLabel]]"
                interval-control="[[xZoomIntervalControl]]"
                interval-origin="[[xZoomIntervalOrigin]]"
                show-interval-anchor="[[xShowIntervalAnchor]]"
                slider="[[_zoomArg(noXZoom, xZoomSlider)]]"
                reverse-slider="[[reverseXAxis]]"
                reset-label="[[resetLabel]]"
                slider-label="[[xZoomSliderLabel]]"
                slider-min-label="[[xZoomSliderMinLabel]]"
                slider-max-label="[[xZoomSliderMaxLabel]]"
                range-start-label="[[xZoomRangeStartLabel]]"
                range-end-label="[[xZoomRangeEndLabel]]"
                interval-from-label="[[xZoomIntervalFromLabel]]"
                interval-to-label="[[xZoomIntervalToLabel]]"></ptcs-chart-zoom>
            <ptcs-chart-axis id="xaxis" slot="xaxis" part="xaxis" style="pointer-events: auto"
                no-tabindex
                disabled="[[disabled]]"
                type="[[_labels]]"
                spec-min="[[_specValueMinX(specXMin, specXMax, xZoomStart, noXZoom, _xMin, _xMax, _labels)]]"
                spec-max="[[_specValueMaxX(specXMin, specXMax, xZoomEnd, noXZoom, _xMin, _xMax, _labels)]]"
                side="[[_xSide(flipXAxis, flipAxes)]]"
                label="[[xAxisLabel]]"
                align-label="[[xAxisAlign]]"
                min-value="[[_xMin]]"
                max-value="[[_xMax]]"
                size="[[_xSize(_graphWidth, _graphHeight, flipAxes)]]"
                max-size="[[_if(flipAxes, verticalAxisMaxWidth, horizontalAxisMaxHeight)]]"
                ticks="{{_xTicks}}"
                ticks-rotation="[[horizontalTicksRotation]]"
                reverse="[[reverseXAxis]]"
                scale="{{_xScale}}"
                outer-padding="[[outerPadding]]"
                inner-padding="[[innerPadding]]"
                number-format-specifier="[[xAxisNumberFormatSpecifier]]"
                date-format-token="[[xAxisDateFormatToken]]"
                hidden\$="[[hideXAxis]]"></ptcs-chart-axis>
            <ptcs-chart-zoom slot="yzoom" id="zoomY" part="zoom-yaxis" hidden\$="[[noYZoom]]"
                tabindex\$="[[_delegatedFocus]]"
                disabled="[[disabled]]"
                type="number"
                side="[[_ySide(flipYAxis, flipAxes)]]"
                hide-reset
                axis-length="[[_ySize(_graphWidth, _graphHeight, flipAxes)]]"
                min-value="[[_zoomMinY(_yMin, _yMax, specYMin, specYMax)]]"
                max-value="[[_zoomMaxY(_yMin, _yMax, specYMax, specYMin)]]"
                zoom-start="{{yZoomStart}}"
                zoom-end="{{yZoomEnd}}"
                range-picker="[[_zoomArg(noYZoom, yZoomRange)]]"
                interval="[[_zoomArg(noYZoom, yZoomInterval)]]"
                interval-label="[[yZoomIntervalLabel]]"
                interval-control="[[yZoomIntervalControl]]"
                interval-origin="[[yZoomIntervalOrigin]]"
                show-interval-anchor="[[yShowIntervalAnchor]]"
                slider="[[_zoomArg(noYZoom, yZoomSlider)]]"
                reverse-slider="[[reverseYAxis]]"
                reset-label="[[resetLabel]]"
                slider-label="[[yZoomSliderLabel]]"
                slider-min-label="[[yZoomSliderMinLabel]]"
                slider-max-label="[[yZoomSliderMaxLabel]]"
                range-start-label="[[yZoomRangeStartLabel]]"
                range-end-label="[[yZoomRangeEndLabel]]"
                interval-from-label="[[yZoomIntervalFromLabel]]"
                interval-to-label="[[yZoomIntervalToLabel]]"></ptcs-chart-zoom>
            <ptcs-chart-axis id="yaxis" slot="yaxis" part="yaxis" style="pointer-events: auto"
                no-tabindex
                disabled="[[disabled]]"
                type="number"
                spec-min="[[_specYValueMin]]"
                spec-max="[[_specYValueMax]]"
                num-ticks="[[numberOfYLabels]]"
                side="[[_ySide(flipYAxis, flipAxes)]]"
                label="[[yAxisLabel]]"
                align-label="[[yAxisAlign]]"
                min-value="[[_yMin]]"
                max-value="[[_yMax]]"
                size="[[_ySize(_graphWidth, _graphHeight, flipAxes)]]"
                max-size="[[_if(flipAxes, horizontalAxisMaxHeight, verticalAxisMaxWidth)]]"
                ticks="{{_yTicks}}"
                ticks-rotation="[[horizontalTicksRotation]]"
                reverse="[[reverseYAxis]]"
                scale="{{_yScale}}"
                number-format-specifier="[[yAxisNumberFormatSpecifier]]"
                date-format-token="[[yAxisDateFormatToken]]"
                hidden\$="[[hideYAxis]]"></ptcs-chart-axis>
            <ptcs-chart-axis id="yaxis2" slot="yaxis2" part="yaxis2" style="pointer-events: auto"
                no-tabindex
                disabled="[[disabled]]"
                type="number"
                spec-min="[[_specYValueMin]]"
                spec-max="[[_specYValueMax]]"
                num-ticks="[[numberOfYLabels]]"
                side="[[_y2Side(flipYAxis, flipAxes)]]"
                label="[[y2AxisLabel]]"
                align-label="[[y2AxisAlign]]"
                min-value="[[_yMin]]"
                max-value="[[_yMax]]"
                size="[[_ySize(_graphWidth, _graphHeight, flipAxes)]]"
                max-size="[[_if(flipAxes, horizontalAxisMaxHeight, verticalAxisMaxWidth)]]"
                reverse="[[reverseYAxis]]"
                number-format-specifier="[[y2AxisNumberFormatSpecifier]]"
                dual-ticks="[[_dualTicks(isReferenceLines, _yTicks)]]"
                reference-lines="[[_yAxisReferenceLines]]"
                eff-reference-lines="{{_yReferenceLines}}"
                is-reference-lines="[[isReferenceLines]]"
                hidden\$="[[!_showY2Axis(showY2Axis, isReferenceLines)]]"></ptcs-chart-axis>
        </ptcs-chart-layout>`;
    }

    static get is() {
        return 'ptcs-chart-waterfall';
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

            // [left] || center || right
            titleAlign: {
                type: String
            },

            // Title label variant
            titleVariant: {
                type: String
            },

            hideConnectorLines: {
                type:  Boolean,
                value: false
            },

            // Notes label
            notesLabel: {
                type: String
            },

            hideNotes: {
                type:  Boolean,
                value: false
            },

            disabled: {
                type:               Boolean,
                value:              false,
                reflectToAttribute: true
            },

            // top || [bottom] || left || right
            notesPos: {
                type: String
            },

            // [left] || center || right
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

            // [left] || center || right
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

            // [left] || center || right
            yAxisAlign: {
                type: String
            },

            // Y-axis number of labels
            numberOfYLabels: {
                type: Number
            },

            hideYAxis: {
                type:     Boolean,
                observer: '_hideYAxisChanged'
            },

            hideLegend: {
                type:   Boolean,
                notify: true // Can be toggled via button
            },

            // Names of legend items, if legend should be visible
            legend: {
                type: Array
            },

            // top || bottom || left || [right]
            legendPos: {
                type: String
            },

            // The effective position of the legend may change because of overflow rules.
            // legendPos is the prefered position; effLegendPos is the actual position
            effLegendPos: {
                type: String
            },

            legendAlign: {
                type: String
            },

            // none || square || circle
            legendShape: {
                type: String
            },

            // Filter chart based on legend interaction?
            filterLegend: {
                type: Boolean
            },

            // Legend items currently selected in the legend component
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
                type: Boolean
            },

            // Flip x-axis side
            flipXAxis: {
                type: Boolean
            },

            // Flip y-axis side
            flipYAxis: {
                type: Boolean
            },

            outerPadding: {
                type: String
            },

            innerPadding: {
                type: String
            },

            // Connects ticks from x-axis to chart
            _xTicks: {
                type: Array
            },

            // Connects ticks from y-axis to chart
            _yTicks: {
                type: Array
            },

            // Connects ticks from y-axis to chart
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

            // Show rulers for the Y-axis: 'primary' or 'secondary'
            yAxisRulerAlignment: {
                type: String
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

            // Reverse direction of x-axis
            reverseXAxis: {
                type: Boolean
            },

            // Reverse direction of y-axis
            reverseYAxis: {
                type: Boolean
            },

            // x-axis labels
            _labels: {
                type: Array
            },

            // Needed by chart behavior for zooming
            _xType: {
                type:     Array,
                computed: '_alias(_labels)'
            },

            _yType: {
                type:  String,
                value: 'number'
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
                type: Object,
            },

            // Specified x-max-value: auto || Number
            specXMax: {
                type: Object,
            },

            // Specified y-min-value: baseline || auto || Number
            specYMin: {
                type: Object,
            },

            _specYValueMin: {
                type: Object,
            },

            // Specified y-max-value: auto || Number
            specYMax: {
                type: Object,
            },

            _specYValueMax: {
                type: Object,
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

            // Label for the X-axis range dropdown START (FROM) value
            xZoomRangeStartLabel: {
                type: String
            },

            // Label for the X-axis range dropdown END (TO) value
            xZoomRangeEndLabel: {
                type: String
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

            // X-Axis Zoom Slider Label
            xZoomSliderLabel: {
                type: String
            },

            // X-Axis Zoom Slider Max Label
            xZoomSliderMaxLabel: {
                type: String
            },

            // X-Axis Zoom Slider Min Label
            xZoomSliderMinLabel: {
                type: String
            },

            // X-zoom by selecting two elements
            xZoomSelect: {
                type: Boolean
            },

            // X-zoom by dragging the mouse over the chart
            xZoomDrag: {
                type: Boolean
            },

            // Disable Y-axis zooming
            noYZoom: {
                type: Boolean
            },

            // Is yAxis zoomed? (i.e. zoom is enabled AND the axis has been zoomed into)
            _yEnabled: {
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

            // Show zoom slider
            yZoomSlider: {
                type: Boolean
            },

            // Y-Axis Zoom Slider Label
            yZoomSliderLabel: {
                type: String
            },

            // Y-Axis Zoom Slider Max Label
            yZoomSliderMaxLabel: {
                type: String
            },

            // Y-Axis Zoom Slider Min Label
            yZoomSliderMinLabel: {
                type: String
            },

            // Y-zoom by selecting two elements
            yZoomSelect: {
                type: Boolean
            },

            // Y-zoom by dragging the mouse over the chart
            yZoomDrag: {
                type: Boolean
            },

            yShowIntervalAnchor: {
                type: Boolean
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

            // Specified chart data
            data: {
                type: Array
            },

            // 'inside' || 'outside' || 'inside-end'
            showValues: {
                type: String
            },

            // Hide values
            hideValues: {
                type:  Boolean,
                value: false
            },

            hideZeroRuler: {
                type: Boolean
            },

            xAxisNumberFormatSpecifier: {
                type: String
            },

            xAxisDateFormatToken: {
                type: String
            },

            yAxisNumberFormatSpecifier: {
                type: String
            },

            yAxisDateFormatToken: {
                type: String
            },

            // Secondary y-axis
            showY2Axis: {
                type:     Boolean,
                observer: '_showY2AxisChanged'
            },

            y2AxisLabel: {
                type: String
            },

            // [left] || center || right
            y2AxisAlign: {
                type: String
            },

            y2AxisNumberFormatSpecifier: {
                type: String
            },

            // Activate attribute for styling bars differently
            trendColors: {
                type: Boolean
            },

            _delegatedFocus: String,

            // 'none' || 'single' || 'multiple'
            selectionMode: {
                type: String
            },

            // Unselectable items (array of indexes, where data[index] is unselectable)
            unselectable: {
                type: Array
            },

            // Current selection in chart
            _chartSelection: {
                type: Object
            },

            // Show summary bars (array of indexes, where data[index] should show a summary bar)
            summaryBars: {
                type: Array
            },

            // sampleSize: unassigned - use default sampling,
            //             number - sample down data to specified number,
            //             0 (zero) = no sampling = show all points
            sampleSize: {
                type: Number
            },

            tooltipTemplate: {
                type: String
            },

            _isZoomable$tb: {
                // eslint-disable-next-line max-len
                computed: '_isZoomable(noXZoom, noYZoom, xZoomRange, yZoomRange, xZoomInterval, yZoomInterval, xZoomSlider, yZoomSlider, xZoomDrag, yZoomDrag, xZoomSelect, yZoomSelect, showZoomButtons)'
            },

            _resetButtonEnabled$tb: {
                computed: '_enableZoomReset(_labels, _xMin, _xMax, specXMin, specXMax, xZoomStart, xZoomEnd, _yEnabled)'
            }
        };
    }

    static get observers() {
        return [
            '_observeYzoom(_yMin, _yMax, yZoomStart, yZoomEnd, specYMin, specYMax, specYMax)',
            '_observeIsReferenceLines(referenceLines, showY2Axis)',
            '_observeSpecValueMin(specYMin, specYMax, yZoomStart, noYZoom, _yMin, _yMax)',
            '_observeSpecValueMax(specYMin, specYMax, yZoomEnd, noYZoom, _yMin, _yMax)'
        ];
    }

    ready() {
        super.ready();

        if (this.titleLabel === undefined) {
            this.titleLabel = null;
        }
        if (this.titleVariant === undefined) {
            this.titleVariant = 'header';
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

    _gcTabindex(_delegatedFocus, _hideToolbar) {
        return _hideToolbar ? false : _delegatedFocus;
    }

    _tabindex(filterLegend, _delegatedFocus) {
        return filterLegend ? _delegatedFocus : false;
    }

    _isZoomable(noXZoom, noYZoom, xZoomRange, yZoomRange, xZoomInterval, yZoomInterval, xZoomSlider, yZoomSlider, xZoomDrag, yZoomDrag,
        xZoomSelect, yZoomSelect, showZoomButtons) {
        return this._showZoomX(noXZoom, xZoomRange, xZoomInterval, xZoomSlider, xZoomDrag, xZoomSelect, showZoomButtons) ||
            this._showZoomY(noYZoom, yZoomRange, yZoomInterval, yZoomSlider, yZoomDrag, yZoomSelect, showZoomButtons);
    }

    _enableZoomReset(_labels, _xMin, _xMax, specXMin, specXMax, xZoomStart, xZoomEnd, _yEnabled) {
        return this._xEnabled(_labels, _xMin, _xMax, specXMin, specXMax, xZoomStart, xZoomEnd) || _yEnabled;
    }

    _zoomSelect(xZoomSelect, noXZoom, yZoomSelect, noYZoom) {
        return (!noXZoom && xZoomSelect) || (!noYZoom && yZoomSelect);
    }

    _zoomDrag(drag, noZoom) {
        return !noZoom && drag;
    }

    referenceLinesChanged(referenceLines) {
        if (!Array.isArray(referenceLines)) {
            return;
        }
        // The y-axis data type is always "number", filter out invalid data
        this._yAxisReferenceLines = referenceLines.filter(line => !isNaN(line.value));
    }

    _observeIsReferenceLines(referenceLines, showY2Axis) {
        this.isReferenceLines = !showY2Axis && (referenceLines && referenceLines.length > 0);
    }

    _observeSpecValueMin(specYMin, specYMax, yZoomStart, noYZoom, _yMin, _yMax) {
        this._specYValueMin = this._specValueMinY(specYMin, specYMax, yZoomStart, noYZoom, _yMin, _yMax);
    }

    _observeSpecValueMax(specYMin, specYMax, yZoomEnd, noYZoom, _yMin, _yMax) {
        this._specYValueMax = this._specValueMaxY(specYMin, specYMax, yZoomEnd, noYZoom, _yMin, _yMax);
    }

    _hideNotes(nodesLabel, hideNotes) {
        return !nodesLabel || hideNotes;
    }

    _hideChartState(chartState) {
        return chartState !== 'data';
    }

    _textAlign(align) {
        return align ? `text-align: ${align}` : false;
    }

    _hideLegend(hideLegend, legend) {
        return hideLegend || !(legend instanceof Array) || !(legend.length > 0);
    }

    _horizLegend(effLegendPos) {
        return effLegendPos === 'top' || effLegendPos === 'bottom';
    }

    _xSide(flipXAxis, flipAxes) {
        // eslint-disable-next-line no-nested-ternary
        return flipAxes ? (flipXAxis ? 'right' : 'left') : (flipXAxis ? 'top' : 'bottom');
    }

    _ySide(flipYAxis, flipAxes) {
        // eslint-disable-next-line no-nested-ternary
        return flipAxes ? (flipYAxis ? 'top' : 'bottom') : (flipYAxis ? 'right' : 'left');
    }

    _y2Side(flipYAxis, flipAxes) {
        // eslint-disable-next-line no-nested-ternary
        return flipAxes ? (flipYAxis ? 'bottom' : 'top') : (flipYAxis ? 'left' : 'right');
    }

    _dualTicks(isReferenceLines, _yTicks) {
        return isReferenceLines ? null : _yTicks;
    }

    _xSize(_graphWidth, _graphHeight, flipAxes) {
        return flipAxes ? _graphHeight : _graphWidth;
    }

    _ySize(_graphWidth, _graphHeight, flipAxes) {
        return flipAxes ? _graphWidth : _graphHeight;
    }

    _getHorizontalAlignment(pos, align) {
        if (pos === 'top' || pos === 'bottom') {
            return align;
        }

        return 'start';
    }

    _showYRulers(showYRulers, yAxisRulerAlignment, showY2Axis) {
        return showYRulers && !(showY2Axis && yAxisRulerAlignment === 'secondary');
    }

    _showY2Axis(showY2Axis, isReferenceLines) {
        return showY2Axis || isReferenceLines;
    }

    _showValues(sparkView, hideValues, showValues) {
        return sparkView || hideValues ? 'no' : showValues;
    }

    _showZoom(noZoom, zoomRange, zoomInterval, zoomSlider, zoomDrag, zoomSelect, showZoomButtons) {
        if (noZoom) {
            return false;
        }
        return zoomRange || zoomInterval || zoomSlider || zoomDrag || zoomSelect || showZoomButtons;
    }

    _showZoomX(noXZoom, xZoomRange, xZoomInterval, xZoomSlider, xZoomDrag, xZoomSelect, showZoomButtons) {
        return this._showZoom(noXZoom, xZoomRange, xZoomInterval, xZoomSlider, xZoomDrag, xZoomSelect, showZoomButtons);
    }

    _showZoomY(noYZoom, yZoomRange, yZoomInterval, yZoomSlider, yZoomDrag, yZoomSelect, showZoomButtons) {
        return this._showZoom(noYZoom, yZoomRange, yZoomInterval, yZoomSlider, yZoomDrag, yZoomSelect, showZoomButtons);
    }

    _zoomValue(noZoom, zoom, unzoomed) {
        if (!noZoom && zoom !== undefined && zoom !== '' && zoom !== null) {
            // Zooming
            return zoom;
        }
        // Not zooming
        return unzoomed();
    }

    _specValueMinX(specXMin, specXMax, zoomStart, noXZoom, min, max, type) {
        return this._zoomValue(noXZoom, zoomStart, () => this._zoomMinX(min, max, type, specXMin, specXMax));
    }

    _specValueMinY(specYMin, specYMax, zoomStart, noYZoom, min, max) {
        return this._zoomValue(noYZoom, zoomStart, () => this._zoomMinY(min, max, specYMin, specYMax));
    }

    _specValueMaxX(specMin, specMax, zoomEnd, noXZoom, min, max, type) {
        return this._zoomValue(noXZoom, zoomEnd, () => this._zoomMaxX(min, max, type, specMax, specMin));
    }

    _specValueMaxY(specMin, specMax, zoomEnd, noYZoom, min, max, type) {
        return this._zoomValue(noYZoom, zoomEnd, () => this._zoomMaxY(min, max, specMax, specMin));
    }

    _zoomMinY(min, max, spec, specMax) {
        // specYMin on y-axis defaults to 'baseline' for waterfall charts
        if ((spec === '' || spec === undefined || spec === null || spec === 'baseline') && min >= 0) {
            return 0;
        }
        return axisMin(min, max, yType, spec, specMax);
    }

    _zoomMaxY(min, max, spec, specMin) {
        return axisMax(min, max, yType, spec, specMin);
    }

    _zoomMinX(min, max, type, spec, specMax) {
        return axisMin(min, max, type, spec, specMax);
    }

    _zoomMaxX(min, max, type, spec, specMin) {
        return axisMax(min, max, type, spec, specMin);
    }

    // Set _yEnabled - and make the secondary yaxis zoom in the same way as the primary yaxis
    _observeYzoom(/*_yMin, _yMax, yZoomStart, yZoomEnd, specYMin, specYMax*/) {
        if (this.__observeYzoomActive) {
            // Wait until all changes has been reported
            return;
        }
        this.__observeYzoomActive = true;
        requestAnimationFrame(() => {
            // Update state of reset button and secondary axis scrolling
            this.__observeYzoomActive = false;
            const min = this._zoomMinY(this._yMin, this._yMax, this.specYMin, this.specYMax);
            const max = this._zoomMaxY(this._yMin, this._yMax, this.specYMax, this.specYMin);
            const enabled = !typeIsFullRange(yType, min, max, this.yZoomStart, this.yZoomEnd);
            this._yEnabled = enabled;
        });
    }

    _xEnabled(_labels, _xMin, _xMax, specXMin, specXMax, xZoomStart, xZoomEnd) {
        return !typeIsFullRange(
            _labels,
            this._zoomMinX(_xMin, _xMax, _labels, specXMin, specXMax),
            this._zoomMaxX(_xMin, _xMax, _labels, specXMax, specXMin),
            xZoomStart,
            xZoomEnd);
    }

    _actionBar(actionBar, hideToolbar) {
        if (hideToolbar) {
            return null;
        }

        return actionBar || 'top';
    }

    _zoomArg(noZoom, option) {
        return noZoom ? undefined : option;
    }

    get selectedData() {
        return this._chartSelection;
    }

    set selectedData(selection) {
        this.$.chart.selectData(selection);
    }

    // The core chart has changed the selection
    _onSelectionChanged(ev) {
        this._chartSelection = ev.detail.selection;
    }

    _onZoomSelection(ev) {
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
        let reverseXAxis = this.reverseXAxis;
        let reverseYAxis = this.reverseYAxis;
        let d = ev.detail;
        if (this.flipAxes) {
            d = {x: d.y, y: d.x, w: d.h, h: d.w};
            reverseXAxis = !reverseXAxis;
            reverseYAxis = !reverseYAxis;
        }
        if (this.xZoomDrag || this.xZoomSelect) {
            [this.xZoomStart, this.xZoomEnd] = reverseXAxis
                ? invert(xScale, d.x + d.w, d.x) : invert(xScale, d.x, d.x + d.w);
        }
        if (this.yZoomDrag || this.yZoomSelect) {
            [this.yZoomStart, this.yZoomEnd] = reverseYAxis // default y-axis is reversed
                ? invert(yScale, d.y, d.y + d.h) : invert(yScale, d.y + d.h, d.y);
        }
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

    _showY2AxisChanged(show) {
        if (show) {
            this.$.yaxis2.refresh();
        }
    }

    refreshData() {
        this.$.chart.refreshData();
    }
};

customElements.define(PTCS.ChartWaterfall.is, PTCS.ChartWaterfall);
