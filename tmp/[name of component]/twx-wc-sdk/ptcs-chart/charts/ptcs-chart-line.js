import {PolymerElement, html} from '@polymer/polymer/polymer-element.js';
import {PTCS} from 'ptcs-library/library.js';
import {axisMin, axisMax, typeValue, invTypeValue, typeIsFullRange} from 'ptcs-library/library-chart.js';
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
import './ptcs-chart-core-line.js';

/* eslint-disable max-len */
PTCS.ChartLine = class extends BehaviorChart(PTCS.BehaviorTabindex(PTCS.BehaviorFocus(PTCS.BehaviorStyleable(PTCS.ThemableMixin(PolymerElement))))) {
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

        #chart2 {
            position: absolute;
            left: 0;
            top: 0;
            right: 0;
            bottom: 0;
            /*pointer-events: none;*/
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
                           x-axis2="[[isReferenceLines]]"
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
                <ptcs-label part="notes-label" label="[[notesLabel]]" variant="body"
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
                x2-ticks="[[_xReferenceLines]]"
                y2-ticks="[[_if(isReferenceLines, _yReferenceLines, _y2Ticks)]]"
                y2-scale="[[_y2Scale]]"
                show-x-rulers="[[showXRulers]]"
                show-x2-rulers="[[isReferenceLines]]"
                has-y2="[[_hasY2(showY2Axis, data2.*)]]"
                show-y-rulers="[[_showYRulers(showYRulers, yAxisRulerAlignment, showY2Axis, data2.*)]]"
                show-y2-rulers="[[_showY2Rulers(isReferenceLines, showYRulers, yAxisRulerAlignment, showY2Axis, data2.*)]]"
                is-reference-lines="[[isReferenceLines]]"
                y-axis-ruler-alignment="[[yAxisRulerAlignment]]"
                front-rulers="[[frontRulers]]"
                hide-zero-ruler="[[hideZeroRuler]]"
                spark-view="[[sparkView]]"
                graph-width="{{_graphWidth}}"
                graph-height="{{_graphHeight}}">
                <ptcs-chart-core-line id="chart" slot="chart" part="core-chart" style="pointer-events: auto"
                    tabindex\$="[[_delegatedFocus]]"
                    disabled="[[disabled]]"
                    data="[[data]]"
                    legend="[[legend]]"
                    tooltip-template="[[tooltipTemplate]]"
                    stack-method="[[stackMethod]]"
                    stack-order="[[stackOrder]]"
                    stack-method2="[[stackMethod2]]"
                    stack-order2="[[stackOrder2]]"
                    x-date-format-token="[[_updateDateFormatToken(numberOfXLabels, xAxisDateFormatToken)]]"
                    x-type="[[_xType]]"
                    x-min="{{_xMin}}"
                    x-max="{{_xMax}}"
                    y-type="[[yType]]"
                    y-min="{{_yMinReal}}"
                    y-max="{{_yMaxReal}}"
                    hide-lines="[[hideLines]]"
                    show-areas="[[showAreas]]"
                    curve="[[_getCurve(chartType, curve)]]"
                    bundle-beta="[[bundleBeta]]"
                    cardinal-tension="[[cardinalTension]]"
                    catmull-rom-alpha="[[catmullRomAlpha]]"
                    step-position="[[stepPosition]]"
                    flip-axes="[[flipAxes]]"
                    reverse-x-axis="[[reverseXAxis]]"
                    reverse-y-axis="[[reverseYAxis]]"
                    x-scale="[[_xScale]]"
                    y-scale="[[_yScale]]"
                    filter-legend="[[_selectedLegend]]"
                    marker="[[_getMarker(sparkView, chartType, hideMarkers, marker)]]"
                    marker-size="[[markerSize]]"
                    show-values="[[_showValues(sparkView, hideValues, showValues)]]"
                    show-y2-axis="[[showY2Axis]]"
                    data2="[[data2]]"
                    y2-type="[[y2Type]]"
                    y2-min="{{_y2Min}}"
                    y2-max="{{_y2Max}}"
                    y2-scale="[[_y2Scale]]"
                    cursor-type="[[_cursorType(pointerType, flipAxes)]]"
                    cursor-target="[[_cursorTarget(dataPointSelection, flipAxes)]]"
                    sample-size="[[sampleSize]]"
                    zoom-select="[[_zoomSelect(xZoomSelect, noXZoom, yZoomSelect, noYZoom)]]"
                    zoom-drag-x="[[_zoomDrag(xZoomDrag, noXZoom)]]"
                    zoom-drag-y="[[_zoomDrag(yZoomDrag, noYZoom)]]"
                    selection-mode="[[selectionMode]]"
                    on-chart-selection="_onSelectionChanged"
                    on-zoom-selection="_onZoomSelection"
                    chart-state-data-error="{{_chartStateDataError}}"
                    chart-state-data-empty="{{_chartStateDataEmpty}}"></ptcs-chart-core-line>
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
                             type="[[_xType]]"
                             side="[[_xSide(flipXAxis, flipAxes)]]"
                             hide-reset
                             axis-length="[[_xSize(_graphWidth, _graphHeight, flipAxes)]]"
                             min-value="[[_zoomMin(_xMin, _xMax, _xType, specXMin, specXMax)]]"
                             max-value="[[_zoomMax(_xMin, _xMax, _xType, specXMax, specXMin)]]"
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
                             interval-to-label="[[xZoomIntervalToLabel]]"
                             date-range-hint-text="[[dateRangeHintText]]"></ptcs-chart-zoom>
            <ptcs-chart-axis id="xaxis" slot="xaxis" part="xaxis" style="pointer-events: auto"
                no-tabindex
                disabled="[[disabled]]"
                type="[[_xType]]"
                spec-min="[[_specValueMin(specXMin, specXMax, xZoomStart, noXZoom, _xMin, _xMax, _xType)]]"
                spec-max="[[_specValueMax(specXMin, specXMax, xZoomEnd, noXZoom, _xMin, _xMax, _xType)]]"
                side="[[_xSide(flipXAxis, flipAxes)]]"
                label="[[xAxisLabel]]"
                align-label="[[xAxisAlign]]"
                min-value="[[_xMin]]"
                max-value="[[_xMax]]"
                num-ticks="[[numberOfXLabels]]"
                size="[[_xSize(_graphWidth, _graphHeight, flipAxes)]]"
                max-size="[[_if(flipAxes, verticalAxisMaxWidth, horizontalAxisMaxHeight)]]"
                ticks="{{_xTicks}}"
                ticks-rotation="[[horizontalTicksRotation]]"
                reverse="[[reverseXAxis]]"
                scale="{{_xScale}}"
                number-format-specifier="[[xAxisNumberFormatSpecifier]]"
                date-format-token="[[_updateDateFormatToken(numberOfXLabels, xAxisDateFormatToken)]]"
                hidden\$="[[hideXAxis]]"></ptcs-chart-axis>
                <template is="dom-if" if="[[isReferenceLines]]">
                    <ptcs-chart-axis id="xaxis2" slot="xaxis2" part="xaxis2" style="pointer-events: auto"
                        no-tabindex
                        disabled="[[disabled]]"
                        type="[[_xType]]"
                        spec-min="[[_specValueMin(specXMin, specXMax, xZoomStart, noXZoom, _xMin, _xMax, _xType)]]"
                        spec-max="[[_specValueMax(specXMin, specXMax, xZoomEnd, noXZoom, _xMin, _xMax, _xType)]]"
                        side="[[_x2Side(flipXAxis, flipAxes)]]"
                        min-value="[[_xMin]]"
                        max-value="[[_xMax]]"
                        num-ticks="[[numberOfXLabels]]"
                        size="[[_xSize(_graphWidth, _graphHeight, flipAxes)]]"
                        max-size="[[_if(flipAxes, verticalAxisMaxWidth, horizontalAxisMaxHeight)]]"
                        ticks="{{_xTicks}}"
                        ticks-rotation="[[horizontalTicksRotation]]"
                        reverse="[[reverseXAxis]]"
                        scale="{{_xScale}}"
                        number-format-specifier="[[xAxisNumberFormatSpecifier]]"
                        date-format-token="[[_updateDateFormatToken(numberOfXLabels, xAxisDateFormatToken)]]"
                        reference-lines="[[_xAxisReferenceLines]]"
                        eff-reference-lines="{{_xReferenceLines}}"
                        is-reference-lines="[[isReferenceLines]]">
                        hidden\$="[[!isReferenceLines]]"></ptcs-chart-axis>
                </template>
                <ptcs-chart-zoom slot="yzoom" id="zoomY" part="zoom-yaxis" hidden\$="[[noYZoom]]"
                             tabindex\$="[[_delegatedFocus]]"
                             disabled="[[disabled]]"
                             type="[[yType]]"
                             side="[[_ySide(flipYAxis, flipAxes)]]"
                             hide-reset
                             axis-length="[[_ySize(_graphWidth, _graphHeight, flipAxes)]]"
                             min-value="[[_zoomMin(_yMin, _yMax, yType, specYMin, specYMax)]]"
                             max-value="[[_zoomMax(_yMin, _yMax, yType, specYMax, specYMin)]]"
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
                             interval-to-label="[[yZoomIntervalToLabel]]"
                             date-range-hint-text="[[dateRangeHintText]]"></ptcs-chart-zoom>
            <ptcs-chart-axis id="yaxis" slot="yaxis" part="yaxis" style="pointer-events: auto"
                no-tabindex
                disabled="[[disabled]]"
                type="[[yType]]"
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
                date-format-token="[[_updateDateFormatToken(numberOfYLabels, yAxisDateFormatToken)]]"
                hidden\$="[[hideYAxis]]"></ptcs-chart-axis>
            <template is="dom-if" if="[[_showY2Axis(showY2Axis, isReferenceLines)]]">
                <ptcs-chart-axis id="yaxis2" slot="yaxis2" part="yaxis2" style="pointer-events: auto"
                    no-tabindex
                    disabled="[[disabled]]"
                    type="[[_if(isReferenceLines, yType, y2Type)]]"
                    spec-min="[[_specValueMinY2(isReferenceLines, _specYValueMin, specY2Min, specY2Max, y2ZoomStart, noYZoom, _y2Min, _y2Max, y2Type)]]"
                    spec-max="[[_specValueMaxY2(isReferenceLines, _specYValueMax, specY2Min, specY2Max, y2ZoomEnd, noYZoom, _y2Min, _y2Max, y2Type)]]"
                    num-ticks="[[numberOfYLabels]]"
                    side="[[_y2Side(flipYAxis, flipAxes)]]"
                    label="[[y2AxisLabel]]"
                    align-label="[[y2AxisAlign]]"
                    min-value="[[_if(isReferenceLines, _yMin,_y2Min)]]"
                    max-value="[[_if(isReferenceLines, _yMax,_y2Max)]]"
                    size="[[_ySize(_graphWidth, _graphHeight, flipAxes)]]"
                    max-size="[[_if(flipAxes, horizontalAxisMaxHeight, verticalAxisMaxWidth)]]"
                    reverse="[[_if(isReferenceLines, reverseYAxis, reverseY2Axis)]]"
                    scale="{{_y2Scale}}"
                    number-format-specifier="[[y2AxisNumberFormatSpecifier]]"
                    date-format-token="[[_updateDateFormatToken(numberOfYLabels, y2AxisDateFormatToken)]]"
                    dual-ticks="[[_dualTicks(data2.*, _yTicks, isReferenceLines)]]"
                    ticks="{{_y2Ticks}}"
                    reference-lines="[[_yAxisReferenceLines]]"
                    eff-reference-lines="{{_yReferenceLines}}"
                    is-reference-lines="[[isReferenceLines]]"></ptcs-chart-axis>
            </template>
        </ptcs-chart-layout>`;
    }
    /* eslint-enable max-len */

    static get is() {
        return 'ptcs-chart-line';
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

            // X-axis number of labels
            numberOfXLabels: {
                type: Number
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

            // Reference lines for x-axis (only values valid according to the data type of the axis)
            _xAxisReferenceLines: {
                type: Array
            },

            // Reference lines for y-axis (only values valid according to the data type of the axis)
            _yAxisReferenceLines: {
                type: Array
            },

            // Sorted & filtered secondary x-axis data from ptcs-chart-axis
            _xReferenceLines: {
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

            // x-axis type: number || date || string
            xType: {
                type: Object
            },

            _xType: {
                type:     Object,
                computed: '_getXType(chartType, xType)'
            },

            // y-axis type: number || date || string
            yType: {
                type: Object
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
            _yMinReal: {
                type: Object
            },

            // Maximum y value in data
            _yMaxReal: {
                type: Object
            },

            // Minimun y value in data - unless it is identical to maximum y value (in which case it needs some extra delta)
            _yMin: {
                type:     Object,
                computed: '_computeYMin(_yMinReal, _yMaxReal, yType)'
            },

            // Maximum y value in data - unless it is identical to minimum y value (in which case it needs some extra delta)
            _yMax: {
                type:     Object,
                computed: '_computeYMax(_yMinReal, _yMaxReal, yType)'
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
                type:     Array,
                observer: '_resetZoom'
            },

            // target method: auto (point) || horz || vert || cross
            pointerType: {
                type: String,
            },

            // target method: auto (over) || horz || vert || both
            dataPointSelection: {
                type: String,
            },

            // Stack method: falsy || auto || expand || diverging || silhouette || wiggle
            // (If assigned, enables stacking.)
            stackMethod: {
                type: String,
            },

            // Stack order: auto || reverse || appearance || ascending || descending || insideout
            stackOrder: {
                type: String,
            },

            // The same stack options for the second y axis
            stackMethod2: {
                type: String,
            },

            stackOrder2: {
                type: String,
            },

            // Hide curve lines
            hideLines: {
                type: Boolean
            },

            // Show areas under chart lines
            showAreas: {
                type: Boolean
            },

            // linear || basis || bundle || cardinal || catmull-rom || monotone-x || monotone-y || natural || step
            curve: {
                type: String
            },

            // linechart || runchart || stepchart || areachart || scatterchart || streamgraphchart
            chartType: {
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

            hideMarkers: {
                type:  Boolean,
                value: false
            },

            hideValues: {
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

            // above || on || below
            showValues: {
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
                type: Boolean
            },

            // y2-axis type: number || date || Array of string
            y2Type: {
                type: Object
            },

            reverseY2Axis: {
                type: Boolean
            },

            // Move y2-scale from y2-axis to chart2
            _y2Scale: {
                type: Function,
            },

            data2: {
                type:     Array,
                observer: '_resetZoom'
            },

            // Minimun y value in data2
            _y2Min: {
                type: Object
            },

            // Maximum y value in data2
            _y2Max: {
                type: Object
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

            _delegatedFocus: String,

            // 'none' || 'single' || 'multiple'
            selectionMode: {
                type: String
            },

            // Current selection in chart
            _chartSelection: {
                type: Object
            },

            tooltipTemplate: {
                type: String
            },

            dateRangeHintText: {
                type: String
            },

            // sampleSize: unassigned - use default sampling,
            //             number - sample down data to specified number,
            //             0 (zero) = no sampling = show all points
            sampleSize: {
                type: Number
            },

            _isZoomable$tb: {
                // eslint-disable-next-line max-len
                computed: '_isZoomable(noXZoom, noYZoom, xZoomRange, yZoomRange, xZoomInterval, yZoomInterval, xZoomSlider, yZoomSlider, xZoomDrag, yZoomDrag, xZoomSelect, yZoomSelect, flipAxes, showZoomButtons)'
            },

            _resetButtonEnabled$tb: {
                computed: '_enableZoomReset(chartType, xType, _xMin, _xMax, specXMin, specXMax, xZoomStart, xZoomEnd, _yEnabled)'
            }
        };
    }

    static get observers() {
        return [
            '_observeYzoom(yType, _yMin, _yMax, yZoomStart, yZoomEnd, specYMin, specYMax, y2Type, specYMax, _y2Min, _y2Max, specY2Min, specY2Max)',
            '_observeIsReferenceLines(referenceLines, showY2Axis)',
            '_observeSpecYValueMin(specYMin, specYMax, yZoomStart, noYZoom, _yMin, _yMax, yType)',
            '_observeSpecValueMax(specYMin, specYMax, yZoomEnd, noYZoom, _yMin, _yMax, yType)'
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
        if (this.xType === undefined) {
            this.xType = 'number';
        }
        if (this.yType === undefined) {
            this.yType = 'number';
        }
        if (this.hideXAxis === undefined) {
            this.hideXAxis = false;
        }
        if (this.hideYAxis === undefined) {
            this.hideYAxis = false;
        }
        if (this.yType2 === undefined) {
            this.yType2 = 'number';
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

    _isZoomable(noXZoom, noYZoom, xZoomRange, yZoomRange, xZoomInterval, yZoomInterval, xZoomSlider, yZoomSlider, xZoomDrag, yZoomDrag,
        xZoomSelect, yZoomSelect, showZoomButtons) {
        return this._showZoomX(noXZoom, xZoomRange, xZoomInterval, xZoomSlider, xZoomDrag, xZoomSelect, showZoomButtons) ||
            this._showZoomY(noYZoom, yZoomRange, yZoomInterval, yZoomSlider, yZoomDrag, yZoomSelect, showZoomButtons);
    }

    _computeYMin(_yMinReal, _yMaxReal, yType) {
        if (_yMinReal !== _yMaxReal) {
            return _yMinReal;
        }
        if (yType === 'number' && typeof _yMinReal === 'number') {
            return _yMinReal - 0.8; // Need some extra delta - arbitrary value
        }
        if (yType === 'date' && _yMinReal instanceof Date) {
            return new Date(_yMinReal.getTime() - 0.4 * 1000 * 60 * 60 * 24); // Need some extra delta - arbitrary value
        }
        return _yMinReal;
    }

    _computeYMax(_yMinReal, _yMaxReal, yType) {
        if (_yMinReal !== _yMaxReal) {
            return _yMaxReal;
        }
        if (yType === 'number' && typeof _yMaxReal === 'number') {
            return _yMaxReal + 0.8; // Need some extra delta - arbitrary value
        }
        if (yType === 'date' && _yMaxReal instanceof Date) {
            return new Date(_yMaxReal.getTime() + 0.4 * 1000 * 60 * 60 * 24); // Need some extra delta - arbitrary value
        }
        return _yMaxReal;
    }

    _enableZoomReset(chartType, xType, _xMin, _xMax, specXMin, specXMax, xZoomStart, xZoomEnd, _yEnabled) {
        return this._xEnabled(chartType, xType, _xMin, _xMax, specXMin, specXMax, xZoomStart, xZoomEnd) || _yEnabled;
    }

    _zoomSelect(xZoomSelect, noXZoom, yZoomSelect, noYZoom) {
        return (!noXZoom && xZoomSelect) || (!noYZoom && yZoomSelect);
    }

    _zoomDrag(drag, noZoom) {
        return !noZoom && drag;
    }

    _observeIsReferenceLines(referenceLines, showY2Axis) {
        this.isReferenceLines = !showY2Axis && (referenceLines && referenceLines.length > 0);
    }

    _observeSpecYValueMin(specYMin, specYMax, yZoomStart, noYZoom, _yMin, _yMax, yType) {
        this._specYValueMin = this._specValueMin(specYMin, specYMax, yZoomStart, noYZoom, _yMin, _yMax, yType);
    }

    _observeSpecValueMax(specYMin, specYMax, yZoomEnd, noYZoom, _yMin, _yMax, yType) {
        this._specYValueMax = this._specValueMax(specYMin, specYMax, yZoomEnd, noYZoom, _yMin, _yMax, yType);
    }

    referenceLinesChanged(referenceLines) {
        if (!(referenceLines instanceof Array)) {
            return;
        }

        const p = (type, line, acc) => {
            if (type === 'number') {
                if (!isNaN(line.value)) {
                    acc.push(line);
                }
            } else if (type === 'date') {
                const d = line.value instanceof Date ? line.value : new Date(line.value);
                if (!isNaN(d)) {
                    acc.push({...line, value: d});
                }
            }
        };

        // Partition referenceLines data according to axis and filter out lines whose value is invalid for its axis data type
        const validXLines = [];
        const validYLines = [];
        this._xAxisReferenceLines = [];
        this._yAxisReferenceLines = [];
        referenceLines.forEach((line) => {
            switch (line.axis) {
                case 'xaxis':
                    p(this.xType, line, validXLines);
                    break;
                case 'yaxis':
                    p(this.yType, line, validYLines);
                    break;
                default:
                    console.warn('Invalid axis value on reference line data: ' + line.axis);
            }
        });
        this._xAxisReferenceLines = validXLines;
        this._yAxisReferenceLines = validYLines;
    }

    _getXType(chartType, xType) {
        if (chartType === 'runchart' || chartType === 'streamgraphchart') {
            return 'date';
        }

        return xType;
    }

    _getCurve(chartType, curve) {
        switch (chartType) {
            case 'stepchart':
                return 'step';
            case 'scatterchart':
                return 'linear';
            case 'runchart':
                return curve ? curve : 'monotone-x';
            default: return curve;
        }
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

    _x2Side(flipXAxis, flipAxes) {
        // eslint-disable-next-line no-nested-ternary
        return flipAxes ? (flipXAxis ? 'right' : 'left') : (flipXAxis ? 'bottom' : 'top');
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

    _getMarker(sparkView, chartType, hideMarkers, marker) {
        return ((sparkView || hideMarkers) && chartType !== 'scatterchart') ? 'none' : marker;
    }

    _hasY2(showY2Axis, data2) {
        return showY2Axis && data2 && data2.base && data2.base.series && data2.base.series.length > 0;
    }

    _showYRulers(showYRulers, yAxisRulerAlignment, showY2Axis, data2) {
        return showYRulers && !(this._hasY2(showY2Axis, data2) && yAxisRulerAlignment === 'secondary');
    }

    _showY2Rulers(isReferenceLines, showYRulers, yAxisRulerAlignment, showY2Axis, data2) {
        return isReferenceLines || showYRulers && this._hasY2(showY2Axis, data2) && (yAxisRulerAlignment === 'secondary');
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

    _specValueMin(specMin, specMax, zoomStart, noZoom, min, max, type) {
        if (!noZoom && zoomStart !== undefined && zoomStart !== '' && zoomStart !== null) {
            // Zooming
            return zoomStart;
        }
        return this._zoomMin(min, max, type, specMin, specMax);
    }

    _specValueMax(specMin, specMax, zoomEnd, noZoom, min, max, type) {
        if (!noZoom && zoomEnd !== undefined && zoomEnd !== '' && zoomEnd !== null) {
            // Zooming
            return zoomEnd;
        }
        // No zooming
        return this._zoomMax(min, max, type, specMax, specMin);
    }

    _specValueMinY2(isReferenceLines, _specYValueMin, specY2Min, specY2Max, y2ZoomStart, noYZoom, _y2Min, _y2Max, y2Type) {
        if (isReferenceLines) {
            return _specYValueMin;
        }
        return this._specValueMin(specY2Min, specY2Max, y2ZoomStart, noYZoom, _y2Min, _y2Max, y2Type);
    }

    _specValueMaxY2(isReferenceLines, _specYValueMax, specY2Min, specY2Max, y2ZoomEnd, noYZoom, _y2Min, _y2Max, y2Type) {
        if (isReferenceLines) {
            return _specYValueMax;
        }
        return this._specValueMax(specY2Min, specY2Max, y2ZoomEnd, noYZoom, _y2Min, _y2Max, y2Type);
    }

    _zoomMin(min, max, type, spec, specMax) {
        return axisMin(min, max, type, spec, specMax);
    }

    _zoomMax(min, max, type, spec, specMin) {
        return axisMax(min, max, type, spec, specMin);
    }

    // Set _yEnabled - and make the secondary yaxis zoom in the same way as the primary yaxis
    _observeYzoom(/*yType, _yMin, _yMax, yZoomStart, yZoomEnd, specYMin, y2Type, specYMax, _y2Min, _y2Max, specY2Min, specY2Max*/) {
        if (this.__observeYzoomActive) {
            // Wait until all changes has been reported
            return;
        }
        this.__observeYzoomActive = true;
        requestAnimationFrame(() => {
            // Update state of reset button and secondary axis scrolling
            this.__observeYzoomActive = false;
            const min = this._zoomMin(this._yMin, this._yMax, this.yType, this.specYMin, this.specYMax);
            const max = this._zoomMax(this._yMin, this._yMax, this.yType, this.specYMax, this.specYMin);
            const enabled = !typeIsFullRange(this.yType, min, max, this.yZoomStart, this.yZoomEnd);

            if (enabled && (this.showY2Axis || this.isReferenceLines) && this.data2 && this.data2.series && this.data2.series.length) {
                // Adjust scrolling of secondary y-axis
                const start = typeValue(min, this.yType);
                const end = typeValue(max, this.yType);
                const v1 = this.yZoomStart === undefined ? start : typeValue(this.yZoomStart, this.yType);
                const v2 = this.yZoomEnd === undefined ? end : typeValue(this.yZoomEnd, this.yType);
                const start2 = typeValue(this._zoomMin(this._y2Min, this._y2Max, this.y2Type, this.specY2Min, this.specY2Max), this.y2Type);
                const end2 = typeValue(this._zoomMax(this._y2Min, this._y2Max, this.y2Type, this.specY2Max, this.specY2Min), this.y2Type);
                const z1 = start2 + ((v1 - start) * (end2 - start2)) / (end - start);
                const z2 = end2 - ((end2 - start2) * (end - v2)) / (end - start);
                this.y2ZoomStart = invTypeValue(z1, this.y2Type);
                this.y2ZoomEnd = invTypeValue(z2, this.y2Type);
            } else {
                // Secondary y-axis is not scrolled
                this.y2ZoomStart = undefined;
                this.y2ZoomEnd = undefined;
            }
            this._yEnabled = enabled;
        });
    }

    _dualTicks(data2, _yTicks, isReferenceLines) {
        if (isReferenceLines) {
            return null;
        }
        if (data2 && data2.base && data2.base.series && data2.base.series.length > 0) {
            // We *have* a second set of data, so let it use its own ticks
            return null;
        }
        // Use the ticks from the "main" y-axis as-is
        return _yTicks;
    }

    _xEnabled(chartType, xType, _xMin, _xMax, specXMin, specXMax, xZoomStart, xZoomEnd) {
        const type = this._getXType(chartType, xType);
        return !typeIsFullRange(
            type,
            this._zoomMin(_xMin, _xMax, type, specXMin, specXMax),
            this._zoomMax(_xMin, _xMax, type, specXMax, specXMin),
            xZoomStart,
            xZoomEnd);
    }

    _zoomArg(noZoom, option) {
        return noZoom ? undefined : option;
    }

    _actionBar(actionBar, hideToolbar) {
        if (hideToolbar) {
            return null;
        }

        return actionBar || 'top';
    }

    _cursorType(pointerType, flipAxes) {
        const map = flipAxes ? PTCS.ChartLine.mapPointerTypeFlip : PTCS.ChartLine.mapPointerType;
        return map[pointerType] || pointerType;
    }

    _cursorTarget(dataPointSelection, flipAxes) {
        const map = flipAxes ? PTCS.ChartLine.mapPoinSelectFlip : PTCS.ChartLine.mapPoinSelect;
        return map[dataPointSelection] || dataPointSelection;
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

    // Reset zoom whenever data changes
    _resetZoom() {
        requestAnimationFrame(() => {
            this.$.zoomX._resetToDefaultValues();
            this.$.zoomY._resetToDefaultValues();
            // Sometimes two resets are needed... (why?)
            requestAnimationFrame(() => {
                this.$.zoomX._resetToDefaultValues();
                this.$.zoomY._resetToDefaultValues();
            });
        });
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

    refreshData() {
        this.$.chart.refreshData();
    }
};

PTCS.ChartLine.mapPointerType = {horz: 'y', vert: 'x', cross: 'xy'};
PTCS.ChartLine.mapPoinSelect = {horz: 'y', vert: 'x', both: 'xy'};
PTCS.ChartLine.mapPointerTypeFlip = {horz: 'x', vert: 'y', cross: 'xy'};
PTCS.ChartLine.mapPoinSelectFlip = {horz: 'x', vert: 'y', both: 'xy'};

customElements.define(PTCS.ChartLine.is, PTCS.ChartLine);
