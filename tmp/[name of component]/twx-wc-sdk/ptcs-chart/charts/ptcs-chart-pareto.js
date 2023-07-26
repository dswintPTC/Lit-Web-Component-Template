import {PolymerElement, html} from '@polymer/polymer/polymer-element.js';
import {PTCS} from 'ptcs-library/library.js';
import {axisMin, axisMax, typeIsFullRange, typeValue, invTypeValue} from 'ptcs-library/library-chart.js';
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
import './ptcs-chart-core-pareto.js';

const yType = 'number';

PTCS.ChartPareto = class extends BehaviorChart(PTCS.BehaviorTabindex(PTCS.BehaviorFocus(
    PTCS.BehaviorStyleable(PTCS.ThemableMixin(PolymerElement))))) {
    static get template() {
        return html`
        <style>
        :host {
            display: block;
        }

        :host([disabled]) {
            pointer-events: none;
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
                           y-axis2="[[showY2Axis]]"
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
                y2-ticks="[[_y2Ticks]]"
                show-x-rulers="[[showXRulers]]"
                has-y2="[[showY2Axis]]"
                show-y-rulers="[[_showYRulers(showYRulers, yAxisRulerAlignment, showY2Axis)]]"
                show-y2-rulers="[[_showY2Rulers(showYRulers, yAxisRulerAlignment, showY2Axis)]]"
                y-axis-ruler-alignment="[[yAxisRulerAlignment]]"
                front-rulers="[[frontRulers]]"
                hide-zero-ruler="[[hideZeroRuler]]"
                spark-view="[[sparkView]]"
                graph-width="{{_graphWidth}}"
                graph-height="{{_graphHeight}}">
                <ptcs-chart-core-pareto id="chart" slot="chart" part="core-chart" style="pointer-events: auto"
                    tabindex\$="[[_delegatedFocus]]"
                    disabled="[[disabled]]"
                    threshold-value="[[thresholdValue]]"
                    threshold-line="[[thresholdLine]]"
                    emphasize-threshold-factors="[[emphasizeThresholdFactors]]"
                    hide-cumulative-percentage="[[_hideCumulative(hideCumulativePercentage, _hideCumulativePercentage)]]"
                    data="[[data]]"
                    legend="[[legend]]"
                    tooltip-template="[[tooltipTemplate]]"
                    tooltip-template2="[[tooltipTemplate2]]"
                    stack-order="[[stackOrder]]"
                    x-type="{{_labels}}"
                    x-min="{{_xMin}}"
                    x-max="{{_xMax}}"
                    y-min="{{_yMin}}"
                    y-max="{{_yMax}}"
                    y-value-format="[[yAxisNumberFormatSpecifier]]"
                    show-values="[[_showValues(sparkView, hideValues, showValues)]]"
                    curve="[[curve]]"
                    bundle-beta="[[bundleBeta]]"
                    cardinal-tension="[[cardinalTension]]"
                    catmull-rom-alpha="[[catmullRomAlpha]]"
                    step-position="[[stepPosition]]"
                    flip-axes="[[flipAxes]]"
                    reverse-x-axis="[[reverseXAxis]]"
                    reverse-y-axis="[[reverseYAxis]]"
                    x-scale="[[_xScale]]"
                    y-scale="[[_yScale]]"
                    filter-legend="[[_selectedLegend2]]"
                    marker="[[_getMarker(sparkView, hideMarkers, marker)]]"
                    marker-size="[[markerSize]]"
                    show-marker-values="[[_showValues(sparkView, hideValues, showMarkerValues)]]"
                    marker-value-format="[[y2AxisNumberFormatSpecifier]]"
                    show-y2-axis="[[showY2Axis]]"
                    y2-min="[[_y2Min]]"
                    y2-max="[[_y2Max]]"
                    y2-scale="[[_y2Scale]]"
                    zoom-select="[[_zoomSelect(xZoomSelect, noXZoom, yZoomSelect, noYZoom)]]"
                    zoom-drag-x="[[_zoomDrag(xZoomDrag, noXZoom)]]"
                    zoom-drag-y="[[_zoomDrag(yZoomDrag, noYZoom)]]"
                    selection-mode="[[selectionMode]]"
                    unselectable="[[unselectable]]"
                    sample-size="[[sampleSize]]"
                    on-chart-selection="_onSelectionChanged"
                    on-zoom-selection="_onZoomSelection"
                    exportparts="bar"
                    chart-state-data-error="{{_chartStateDataError}}"
                    chart-state-data-empty="{{_chartStateDataEmpty}}"></ptcs-chart-core-pareto>
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
                    items="[[_legendData]]"
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
                disabled="[[disabled]]"
                tabindex\$="[[_delegatedFocus]]"
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
                interval-from-label="[[yZoomIntervalFromLabel]]"
                interval-to-label="[[yZoomIntervalToLabel]]"></ptcs-chart-zoom>
            <ptcs-chart-axis id="yaxis" slot="yaxis" part="yaxis" style="pointer-events: auto"
                no-tabindex
                type="number"
                spec-min="[[_specValueMinY(specYMin, specYMax, yZoomStart, noYZoom, _yMin, _yMax)]]"
                spec-max="[[_specValueMaxY(specYMin, specYMax, yZoomEnd, noYZoom, _yMin, _yMax)]]"
                side="[[_ySide(flipYAxis, flipAxes)]]"
                label="[[yAxisLabel]]"
                align-label="[[yAxisAlign]]"
                min-value="[[_yMin]]"
                max-value="[[_yMax]]"
                num-ticks="[[numberOfYLabels]]"
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
                type="number"
                spec-min="[[_specValueMinY(specY2Min, specY2Max, y2ZoomStart, noYZoom, _y2Min, _y2Max)]]"
                spec-max="[[_specValueMaxY(specY2Min, specY2Max, y2ZoomEnd, noYZoom, _y2Min, _y2Max)]]"
                side="[[_y2Side(flipYAxis, flipAxes)]]"
                label="[[y2AxisLabel]]"
                align-label="[[y2AxisAlign]]"
                min-value="[[_y2Min]]"
                max-value="[[_y2Max]]"
                num-ticks="[[numberOfYLabels]]"
                size="[[_ySize(_graphWidth, _graphHeight, flipAxes)]]"
                max-size="[[_if(flipAxes, horizontalAxisMaxHeight, verticalAxisMaxWidth)]]"
                reverse="[[reverseY2Axis]]"
                scale="{{_y2Scale}}"
                number-format-specifier="[[y2AxisNumberFormatSpecifier]]"
                date-format-token="[[y2AxisDateFormatToken]]"
                ticks="{{_y2Ticks}}"
                ticks-rotation="[[horizontalTicksRotation]]"
                hidden\$="[[!showY2Axis]]"></ptcs-chart-axis>
        </ptcs-chart-layout>`;
    }

    static get is() {
        return 'ptcs-chart-pareto';
    }

    static get properties() {
        return {
            // Pareto threshold value (in %)
            thresholdValue: {
                type:  Number,
                value: 85
            },

            // 'horizontal' || 'vertical' || 'both' || 'none'
            thresholdLine: {
                type: String
            },

            emphasizeThresholdFactors: {
                type: Boolean
            },

            // Hide cumulative line via property
            hideCumulativePercentage: {
                type: Boolean
            },

            // Hide cumulative line via legend
            _hideCumulativePercentage: {
                type: Boolean
            },

            cumulativeLegend: {
                type: String
            },

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

            hideYAxis: {
                type:     Boolean,
                observer: '_hideYAxisChanged'
            },

            // Y-axis number of labels
            numberOfYLabels: {
                type: Number
            },

            hideLegend: {
                type:   Boolean,
                notify: true // Can be toggled via button
            },

            // Names of legend items, if legend should be visible
            legend: {
                type: Array
            },

            _legendData: {
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

            // Legend Filter sent to core-chart (excluding cumulativeLine)
            _selectedLegend2: {
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

            // Specified y-max-value: auto || Number
            specYMax: {
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

            // Zooming of secondary y-axis - computed from the zooming of the primary y-axis
            y2ZoomStart: {
                type: Object
            },

            y2ZoomEnd: {
                type: Object
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

            // Hide all values (bar values and marker values)
            hideValues: {
                type:  Boolean,
                value: false
            },

            // Stack order: auto || reverse || appearance || ascending || descending || insideout
            stackOrder: {
                type: String,
            },

            // linear || basis || bundle || cardinal || catmull-rom || monotone-x || monotone-y || natural || step
            curve: {
                type: String
            },

            // when curve === bundle
            bundleBeta: {
                type: Number
            },

            // when curve === cardinal
            cardinalTension: {
                type: Number
            },

            // when curve === catmull-rom
            catmullRomAlpha: {
                type: Number
            },

            // when curve === step
            stepPosition: {
                type: String, // center || before || after
            },

            // Markers on the percentage line
            hideMarkers: {
                type:  Boolean,
                value: false
            },

            // none || square || circle || triangle || plus || cross
            marker: {
                type: String
            },

            // small || medium || large || xlarge || <number>
            markerSize: {
                type: String
            },

            // 'no' || 'above' || 'on' || 'below'
            showMarkerValues: {
                type: String
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

            reverseY2Axis: {
                type: Boolean
            },

            // Move y2-scale from y2-axis to chart2
            _y2Scale: {
                type: Function,
            },

            // Secondary y-axis starts at 0%
            _y2Min: {
                type:     Number,
                value:    0,
                readOnly: true
            },

            // Secondary y-axis ends at 100%
            _y2Max: {
                type:     Number,
                value:    100,
                readOnly: true
            },

            specY2Min: {
                type: String
            },

            specY2Max: {
                type: String
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

            y2AxisDateFormatToken: {
                type: String
            },

            // Needed by chart behavior for zooming
            _xType: {
                type:     Array,
                computed: '_alias(_labels)'
            },

            _yType: {
                type:  String,
                value: yType
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

            // sampleSize: unassigned - use default sampling,
            //             number - sample down data to specified number,
            //             0 (zero) = no sampling = show all points
            sampleSize: {
                type: Number
            },

            tooltipTemplate: {
                type: String
            },

            tooltipTemplate2: {
                type: String
            },

            _isZoomable$tb: {
                // eslint-disable-next-line max-len
                computed: '_isZoomable(noXZoom, noYZoom, xZoomRange, yZoomRange, xZoomInterval, yZoomInterval, xZoomSlider, yZoomSlider, xZoomDrag, yZoomDrag, xZoomSelect, yZoomSelect, flipAxes, showZoomButtons)'
            },

            _resetButtonEnabled$tb: {
                computed: '_enableZoomReset(_labels, _xMin, _xMax, specXMin, specXMax, xZoomStart, xZoomEnd, _yEnabled)'
            }
        };
    }

    static get observers() {
        return [
            '_observeYzoom(_yMin, _yMax, yZoomStart, yZoomEnd, specYMin, specYMax, specYMax, specY2Min, specY2Max)',
            '_legendChanged(legend.*, cumulativeLegend, hideCumulativePercentage)',
            '_updateLegendFilter(legend, _selectedLegend, hideCumulativePercentage)',
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
        if (this.showY2Axis === undefined) {
            this.showY2Axis = false;
        }
        if (this.specY2Min === undefined) {
            this.specY2Min = 0;
        }
        if (this.specY2Max === undefined) {
            this.specY2Max = 100 + 5; // Some extra space to fit the pareto line
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

    _showY2Rulers(showYRulers, yAxisRulerAlignment, showY2Axis) {
        return showYRulers && showY2Axis && (yAxisRulerAlignment === 'secondary');
    }

    _getMarker(sparkView, hideMarkers, marker) {
        return (sparkView || hideMarkers) ? 'none' : marker;
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
        // specYMin on y-axis defaults to 'baseline' for pareto charts
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
    _observeYzoom(/*_yMin, _yMax, yZoomStart, yZoomEnd, specYMin, specYMax, specY2Min, specY2Max*/) {
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

            if (enabled && this.showY2Axis) {
                // Adjust scrolling of secondary y-axis
                const start = typeValue(min, yType);
                const end = typeValue(max, yType);
                const v1 = this.yZoomStart === undefined ? start : typeValue(this.yZoomStart, yType);
                const v2 = this.yZoomEnd === undefined ? end : typeValue(this.yZoomEnd, yType);
                const start2 = typeValue(this._zoomMinY(this._y2Min, this._y2Max, this.specY2Min, this.specY2Max), yType);
                const end2 = typeValue(this._zoomMaxY(this._y2Min, this._y2Max, this.specY2Max, this.specY2Min), yType);
                const z1 = start2 + ((v1 - start) * (end2 - start2)) / (end - start);
                const z2 = end2 - ((end2 - start2) * (end - v2)) / (end - start);
                this.y2ZoomStart = invTypeValue(z1, yType);
                this.y2ZoomEnd = invTypeValue(z2, yType);
            } else {
                // Secondary y-axis is not scrolled
                this.y2ZoomStart = undefined;
                this.y2ZoomEnd = undefined;
            }
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

    _zoomArg(noZoom, option) {
        return noZoom ? undefined : option;
    }

    _legendChanged(legendCr, cumulativeLegend, hideCumulativePercentage) {
        // Dynamic update of label
        if (legendCr.path.match(/^legend\.(\d+)\.label$/)) {
            this.set(`_legendData${legendCr.path.substring(6)}`, legendCr.value);
            return;
        }

        const legend = legendCr.base;
        if (hideCumulativePercentage) {
            this._legendData = legend instanceof Array ? [...PTCS.clone(legend)] : [];
        } else {
            const r = {label: cumulativeLegend || '', class: 'cumulative-line'};
            this._legendData = legend instanceof Array ? [...PTCS.clone(legend), r] : [r];
        }
    }

    _updateLegendFilter(legend, _selectedLegend, hideCumulativePercentage) {
        if (!legend || !_selectedLegend) {
            return; // Not ready
        }
        // NOTE: Every update of the filter causes a rebuild of the Pareto chart
        //       Only update the filter when it has actually changed
        if (hideCumulativePercentage) {
            if (this._selectedLegend2 !== _selectedLegend) {
                this._selectedLegend2 = _selectedLegend;
            }
            this._hideCumulativePercentage = true;
            return;
        }
        const r = _selectedLegend.filter(i => i < legend.length);
        if (!this._selectedLegend2 || r.join('+') !== this._selectedLegend2.join('+')) {
            this._selectedLegend2 = r;
        }
        this._hideCumulativePercentage = _selectedLegend[_selectedLegend.length - 1] < legend.length;
    }

    _hideCumulative(hideCumulativePercentage, _hideCumulativePercentage) {
        return hideCumulativePercentage || _hideCumulativePercentage;
    }

    _actionBar(actionBar, hideToolbar) {
        if (hideToolbar) {
            return null;
        }

        return actionBar || 'top';
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

    // The user has selected a zoom area
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

customElements.define(PTCS.ChartPareto.is, PTCS.ChartPareto);
