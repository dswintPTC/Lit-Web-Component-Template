import {PolymerElement, html} from '@polymer/polymer/polymer-element.js';
import {PTCS} from 'ptcs-library/library.js';
import {axisBarMin, axisBarMax, typeIsFullRange} from 'ptcs-library/library-chart.js';
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
import {__xv} from './ptcs-chart-core-bar.js';


// Don't need lint to warn about that ES5 arrow functions might be a mistaken >=
/*eslint-disable no-confusing-arrow*/

PTCS.ChartBar = class extends BehaviorChart(PTCS.BehaviorTabindex(PTCS.BehaviorFocus(PTCS.BehaviorStyleable(PTCS.ThemableMixin(PolymerElement))))) {
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
        </style>
        <ptcs-chart-layout id="chart-layout" style="height:100%" part="chart-layout"
                           disabled="[[disabled]]"
                           title-pos="[[titlePos]]" hide-title="[[!titleLabel]]"
                           notes-pos="[[notesPos]]" notes-align="[[notesAlign]]" hide-notes="[[_hideNotes(notesLabel, hideNotes)]]"
                           legend-pos="[[legendPos]]" hide-legend="[[_hideLegend(hideLegend, legend)]]"
                           eff-legend-pos="{{effLegendPos}}"
                           x-zoom="[[_showZoomX(noXZoom, xZoomRange, xZoomInterval, xZoomSlider, xZoomDrag, xZoomSelect)]]"
                           y-zoom="[[_showZoomY(noYZoom, yZoomRange, yZoomInterval, yZoomSlider, yZoomDrag, yZoomSelect)]]"
                           flip-axes="[[flipAxes]]"
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
                y2-ticks="[[_if(isReferenceLines, _yReferenceLines, _y2Ticks)]]"
                y2-scale="[[_y2Scale]]"
                show-x-rulers="[[showXRulers]]"
                has-y2="[[_hasY2(showY2Axis, data2.*)]]"
                show-y-rulers="[[_showYRulers(showYRulers, yAxisRulerAlignment, showY2Axis, data2.*)]]"
                show-y2-rulers="[[_showY2Rulers(isReferenceLines, showYRulers, yAxisRulerAlignment, showY2Axis, data2.*)]]"
                is-reference-lines="[[isReferenceLines]]"
                y-axis-ruler-alignment="[[yAxisRulerAlignment]]"
                front-rulers="[[frontRulers]]"
                hide-zero-ruler="[[hideZeroRuler]]"
                graph-width="{{_graphWidth}}"
                graph-height="{{_graphHeight}}"
                spark-view="[[sparkView]]">
                <ptcs-chart-core-bar slot="chart" id="chart"  part="core-chart" style="pointer-events: auto"
                    tabindex\$="[[_delegatedFocus]]"
                    data="[[data]]"
                    disabled="[[disabled]]"
                    legend="[[legend]]"
                    tooltip-template="[[tooltipTemplate]]"
                    stack-method="[[stackMethod]]"
                    stack-order="[[stackOrder]]"
                    stack-method2="[[stackMethod2]]"
                    x-min="{{_xMin}}"
                    x-max="{{_xMax}}"
                    y-min="{{_yMin}}"
                    y-max="{{_yMax}}"
                    y-axis-number-format="{{_yAxisNumberFormat}}"
                    show-y2-axis="[[showY2Axis]]"
                    data2="[[data2]]"
                    y2-min="{{_y2Min}}"
                    y2-max="{{_y2Max}}"
                    y2-scale="[[_y2Scale]]"
                    y2-axis-number-format="{{_y2AxisNumberFormat}}"
                    flip-axes="[[flipAxes]]"
                    reverse-x-axis="[[reverseXAxis]]"
                    reverse-y-axis="[[reverseYAxis]]"
                    reverse-y2-axis="[[reverseY2Axis]]"
                    x-scale="[[_xScale]]"
                    y-scale="[[_yScale]]"
                    filter-legend="[[_selectedLegend]]"
                    show-values="[[_showValues(sparkView, hideValues, showValues)]]"
                    show-y2-axis="[[_showY2Axis(showY2Axis, isReferenceLines)]]"
                    group-padding="[[groupPadding]]"
                    zoom-select="[[_zoomSelect(xZoomSelect, noXZoom, yZoomSelect, noYZoom)]]"
                    zoom-drag-x="[[_zoomDrag(xZoomDrag, noXZoom)]]"
                    zoom-drag-y="[[_zoomDrag(yZoomDrag, noYZoom)]]"
                    selection-mode="[[selectionMode]]"
                    on-chart-selection="_onSelectionChanged"
                    on-zoom-selection="_onZoomSelection"
                    exportparts="bar"
                    chart-state-data-error="{{_chartStateDataError}}"
                    chart-state-data-empty="{{_chartStateDataEmpty}}"></ptcs-chart-core-bar>
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
            <ptcs-chart-zoom slot="xzoom" id="zoomX" part="zoom-xaxis"
                tabindex\$="[[_delegatedFocus]]"
                disabled="[[disabled]]"
                type="[[labels]]"
                side="[[_xSide(flipXAxis, flipAxes)]]"
                hidden\$="[[noXZoom]]"
                hide-reset _no-reset-slider
                axis-length="[[_xSize(_graphWidth, _graphHeight, flipAxes)]]"
                min-value="[[_xMin]]"
                max-value="[[_xMax]]"
                zoom-start="{{xZoomStart}}"
                zoom-end="{{xZoomEnd}}"
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
                reverse-slider="[[reverseXAxis]]"
                reset-label="[[resetLabel]]"
                interval-from-label="[[xZoomIntervalFromLabel]]"
                interval-to-label="[[xZoomIntervalToLabel]]"></ptcs-chart-zoom>
            <ptcs-chart-axis slot="xaxis" id="xaxis" part="xaxis" style="pointer-events: auto"
                no-tabindex
                type="[[labels]]"
                disabled="[[disabled]]"
                spec-min="[[_specValue(specXMin, xZoomStart, noXZoom)]]"
                spec-max="[[_specValue(specXMax, xZoomEnd, noXZoom)]]"
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
                hidden\$="[[hideXAxis]]"
                outer-padding="[[outerPadding]]"
                inner-padding="[[innerPadding]]"></ptcs-chart-axis>
            <ptcs-chart-zoom slot="yzoom" id="zoomY" part="zoom-yaxis"
                tabindex\$="[[_delegatedFocus]]"
                disabled="[[disabled]]"
                type="number"
                side="[[_ySide(flipYAxis, flipAxes)]]"
                hidden\$="[[noYZoom]]"
                hide-reset
                axis-length="[[_ySize(_graphWidth, _graphHeight, flipAxes)]]"
                min-value="[[_yZoomMin(_yMin, _yMax, specYMin, specYMax)]]"
                max-value="[[_yZoomMax(_yMin, _yMax, specYMax, specYMin)]]"
                zoom-start="{{yZoomStart}}"
                zoom-end="{{yZoomEnd}}"
                range-picker="[[yZoomRange]]"
                interval="[[yZoomInterval]]"
                interval-label="[[yZoomIntervalLabel]]"
                interval-control="[[yZoomIntervalControl]]"
                interval-origin="[[yZoomIntervalOrigin]]"
                show-interval-anchor="[[yShowIntervalAnchor]]"
                slider="[[yZoomSlider]]"
                slider-label="[[yZoomSliderLabel]]"
                slider-min-label="[[yZoomSliderMinLabel]]"
                slider-max-label="[[yZoomSliderMaxLabel]]"
                range-start-label="[[yZoomRangeStartLabel]]"
                range-end-label="[[yZoomRangeEndLabel]]"
                reverse-slider="[[reverseYAxis]]"
                reset-label="[[resetLabel]]"
                interval-from-label="[[yZoomIntervalFromLabel]]"
                interval-to-label="[[yZoomIntervalToLabel]]"></ptcs-chart-zoom>
            <ptcs-chart-axis slot="yaxis" id="yaxis" part="yaxis" style="pointer-events: auto"
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
                number-format="[[_yAxisNumberFormat]]"
                number-format-specifier="[[yAxisNumberFormatSpecifier]]"
                hidden\$="[[hideYAxis]]"></ptcs-chart-axis>
            <template is="dom-if" if="[[_showY2Axis(showY2Axis, isReferenceLines)]]">
                <ptcs-chart-axis id="yaxis2" slot="yaxis2" part="yaxis2" style="pointer-events: auto"
                    no-tabindex
                    disabled="[[disabled]]"
                    type="number"
                    spec-min="[[_specValueMinY2(isReferenceLines, _specYValueMin, specY2Min, specY2Max, yZoomStart, noYZoom, _y2Min, _y2Max)]]"
                    spec-max="[[_specValueMaxY2(isReferenceLines, _specYValueMax, specY2Min, specY2Max, yZoomEnd, noYZoom, _y2Min, _y2Max)]]"
                    num-ticks="[[numberOfYLabels]]"
                    side="[[_y2Side(flipYAxis, flipAxes)]]"
                    label="[[y2AxisLabel]]"
                    align-label="[[y2AxisAlign]]"
                    min-value="[[_if(isReferenceLines, _yMin, _y2Min)]]"
                    max-value="[[_if(isReferenceLines, _yMax, _y2Max)]]"
                    size="[[_ySize(_graphWidth, _graphHeight, flipAxes)]]"
                    max-size="[[_if(flipAxes, horizontalAxisMaxHeight, verticalAxisMaxWidth)]]"
                    reverse="[[_if(isReferenceLines, reverseYAxis, reverseY2Axis)]]"
                    scale="{{_y2Scale}}"
                    number-format="[[_y2AxisNumberFormat]]"
                    number-format-specifier="[[y2AxisNumberFormatSpecifier]]"
                    dual-ticks="[[_dualTicks(isReferenceLines, data2.*, _yTicks)]]"
                    ticks="{{_y2Ticks}}"
                    ticks-rotation="[[horizontalTicksRotation]]"
                    reference-lines="[[_yAxisReferenceLines]]"
                    eff-reference-lines="{{_yReferenceLines}}"
                    is-reference-lines="[[isReferenceLines]]"></ptcs-chart-axis>
            </template>
        </ptcs-chart-layout>`;
    }

    static get is() {
        return 'ptcs-chart-bar';
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

            // The x-value on a bar-chart is always [string] (labels)
            /*
            // x-axis type: number || date || [string]
            xType: {
                type: Object
            },
            */

            // x-axis labels
            labels: {
                type:     Array, // of labels
                computed: '_computeLabels(data.*, data2.*, showY2Axis)'
            },

            // The y-value on a bar-chart is always number
            /*
            // y-axis type: number || date || string
            yType: {
                type: Object
            },
            */

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

            // Needed by chart behavior for zooming
            _xType: {
                type:     Array,
                computed: '_alias(labels)'
            },

            _yType: {
                type:  String,
                value: 'number'
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

            // X-Axis Zoom Range Start Label
            xZoomRangeStartLabel: {
                type: String
            },

            // X-Axis Zoom Range End Label
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

            xZoomSliderMaxLabel: {
                type: String
            },

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

            yZoomSliderMaxLabel: {
                type: String
            },

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

            // uniform || sparse
            format: {
                type: String,
            },

            // Stack method: auto || expand /*|| diverging || silhouette || wiggle*/
            // (If assigned, enables stacking.)
            stackMethod: {
                type: Boolean,
            },

            // Stack order: auto || reverse || appearance || ascending || descending || insideout
            stackOrder: {
                type: String,
            },

            // The same stack options for the second y axis
            stackMethod2: {
                type: String,
            },

            showValues: {
                type: String
            },

            hideValues: {
                type: Boolean
            },

            hideZeroRuler: {
                type: Boolean
            },

            outerPadding: {
                type: String
            },

            innerPadding: {
                type: String
            },

            groupPadding: {
                type: String
            },

            _yAxisNumberFormat: {
                type: String
            },

            yAxisNumberFormatSpecifier: {
                type: String
            },

            // Secondary y-axis
            showY2Axis: {
                type: Boolean
            },

            reverseY2Axis: {
                type: Boolean
            },

            _y2Scale: {
                type: Function,
            },

            data2: {
                type: Array
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

            _y2AxisNumberFormat: {
                type: String
            },

            y2AxisNumberFormatSpecifier: {
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

            // For the toolbar
            _isZoomable$tb: {
                // eslint-disable-next-line max-len
                computed: '_isZoomable(noXZoom, noYZoom, xZoomRange, yZoomRange, xZoomInterval, yZoomInterval, xZoomSlider, yZoomSlider, xZoomDrag, yZoomDrag, xZoomSelect, yZoomSelect, showZoomButtons)'
            },

            _resetButtonEnabled$tb: {
                computed: '_enableZoomReset(labels, _xMin, _xMax, xZoomStart, xZoomEnd, _yMin, _yMax, yZoomStart, yZoomEnd, specYMin, specYMax)'
            }
        };
    }

    static get observers() {
        return [
            '_observeIsReferenceLines(referenceLines, showY2Axis)',
            '_observeSpecValueMin(specYMin, specYMax, yZoomStart, noYZoom, _yMin, _yMax)',
            '_observeSpecValueMax(specYMin, specYMax, yZoomEnd, noYZoom, _yMin, _yMax)'
        ];
    }

    ready() {
        super.ready();

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
        return this._showZoom(noXZoom, xZoomRange, xZoomInterval, xZoomSlider, xZoomDrag, xZoomSelect, showZoomButtons) ||
            this._showZoom(noYZoom, yZoomRange, yZoomInterval, yZoomSlider, yZoomDrag, yZoomSelect, showZoomButtons);
    }

    _enableZoomReset(labels, _xMin, _xMax, xZoomStart, xZoomEnd, _yMin, _yMax, yZoomStart, yZoomEnd, specYMin, specYMax) {
        return this._enabled(labels, _xMin, _xMax, xZoomStart, xZoomEnd) ||
            this._yEnabled(_yMin, _yMax, yZoomStart, yZoomEnd, specYMin, specYMax);
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
        this._specYValueMin = this._specValueMin(specYMin, specYMax, yZoomStart, noYZoom, _yMin, _yMax);
    }

    _observeSpecValueMax(specYMin, specYMax, yZoomEnd, noYZoom, _yMin, _yMax) {
        this._specYValueMax = this._specValueMax(specYMin, specYMax, yZoomEnd, noYZoom, _yMin, _yMax);
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

    _actionBar(actionBar, hideToolbar) {
        if (hideToolbar) {
            return null;
        }

        return actionBar || 'top';
    }

    /*
     * Computes labels that are shown on the X Axis according to the data and data2
     */
    _computeLabels(cr, cr2, showY2Axis) {
        let xValues1 = [], xValues2 = [];

        if (!(cr.base instanceof Array || (this._hasY2(showY2Axis, cr2) && cr2.base instanceof Array))) {
            return ['error'];
        }

        if (cr.base instanceof Array) {
            xValues1 = cr.base.map(item => __xv(item));
        }

        if (this._hasY2(showY2Axis, cr2) && cr2.base instanceof Array) {
            xValues2 = cr2.base.map(item => __xv(item));

            // Filter duplicate labels in O(n + m)
            return [...new Set([...xValues1, ...xValues2])];
        }

        return xValues1;
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
        return sparkView || hideValues ? false : showValues;
    }

    _showZoom(noZoom, zoomRange, zoomInterval, zoomSlider, zoomDrag, zoomSelect, showZoomButtons) {
        if (noZoom) {
            return false;
        }
        return zoomRange || zoomInterval || zoomSlider || zoomDrag || zoomSelect || showZoomButtons;
    }

    _showZoomX(noXZoom, xZoomRange, xZoomInterval, xZoomSlider, xZoomDrag, xZoomSelect) {
        return this._showZoom(noXZoom, xZoomRange, xZoomInterval, xZoomSlider, xZoomDrag, xZoomSelect);
    }

    _showZoomY(noYZoom, yZoomRange, yZoomInterval, yZoomSlider, yZoomDrag, yZoomSelect) {
        return this._showZoom(noYZoom, yZoomRange, yZoomInterval, yZoomSlider, yZoomDrag, yZoomSelect);
    }

    _specValue(spec, zoom, noZoom) {
        if (noZoom || zoom === undefined || zoom === '' || zoom === null) {
            return spec;
        }
        return zoom;
    }

    _specValueMin(specYMin, specYMax, yZoomStart, noYZoom, _yMin, _yMax) {
        if (!noYZoom && yZoomStart !== undefined && yZoomStart !== '' && yZoomStart !== null) {
            // Zooming
            return yZoomStart;
        }
        return this._yZoomMin(_yMin, _yMax, specYMin, specYMax);
    }

    _specValueMax(specYMin, specYMax, yZoomEnd, noYZoom, _yMin, _yMax) {
        if (!noYZoom && yZoomEnd !== undefined && yZoomEnd !== '' && yZoomEnd !== null) {
            // Zooming
            return yZoomEnd;
        }
        // No zooming
        return this._yZoomMax(_yMin, _yMax, specYMax, specYMin);
    }

    _specValueMinY2(isReferenceLines, _specYValueMin, specYMin, specYMax, yZoomStart, noYZoom, _yMin, _yMax) {
        if (isReferenceLines) {
            return _specYValueMin;
        }
        return this._specValueMin(specYMin, specYMax, yZoomStart, noYZoom, _yMin, _yMax);
    }

    _specValueMaxY2(isReferenceLines, _specYValueMax, specYMin, specYMax, yZoomEnd, noYZoom, _yMin, _yMax) {
        if (isReferenceLines) {
            return _specYValueMax;
        }
        return this._specValueMax(specYMin, specYMax, yZoomEnd, noYZoom, _yMin, _yMax);
    }

    _yZoomMin(_yMin, _yMax, specYMin, specYMax) {
        return axisBarMin(_yMin, _yMax, specYMin, specYMax);
    }

    _yZoomMax(_yMin, _yMax, specYMax, specYMin) {
        return axisBarMax(_yMin, _yMax, specYMin, specYMax);
    }

    _enabled(type, minValue, maxValue, zoomStart, zoomEnd) {
        return !typeIsFullRange(type, minValue, maxValue, zoomStart, zoomEnd);
    }

    _yEnabled(_yMin, _yMax, yZoomStart, yZoomEnd, specYMin, specYMax) {
        return this._enabled(
            'number',
            this._yZoomMin(_yMin, _yMax, specYMin, specYMax),
            this._yZoomMax(_yMin, _yMax, specYMax, specYMin),
            yZoomStart, yZoomEnd);
    }

    _dualTicks(isReferenceLines, data2, _yTicks) {
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

customElements.define(PTCS.ChartBar.is, PTCS.ChartBar);
