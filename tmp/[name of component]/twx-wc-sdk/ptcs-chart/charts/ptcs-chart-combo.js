import {PolymerElement, html} from '@polymer/polymer/polymer-element.js';
import '@polymer/polymer/lib/elements/dom-repeat.js';
import '@polymer/polymer/lib/elements/dom-if.js';

import {PTCS} from 'ptcs-library/library.js';
import {axisBarMin, axisBarMax, axisMin, axisMax, typeIsFullRange, invertScaleRange} from 'ptcs-library/library-chart.js';

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
import '../ptcs-chart-bands.js';
import '../ptcs-chart-icons.js';
import '../axes/ptcs-chart-axis.js';
import '../zoom/ptcs-chart-zoom.js';
import '../ptcs-chart-display-axis.js';
import './ptcs-chart-core-combo.js';
import {__xv} from './ptcs-chart-core-bar.js';

import {DrawPlot} from '../draw/ptcs-chart-draw-plot.js';
import {DrawLine} from '../draw/ptcs-chart-draw-line.js';
import {DrawArea} from '../draw/ptcs-chart-draw-area.js';
import {DrawBar} from '../draw/ptcs-chart-draw-bar.js';
import {DrawStackedBars} from '../draw/ptcs-chart-draw-stacked-bars';
import {DrawStackedAreas} from '../draw/ptcs-chart-draw-stacked-areas';
import {markersSet} from '../draw/ptcs-chart-draw-library';

import {
    curveLinear, curveBasis, curveBundle, curveCardinal, curveCatmullRom, curveMonotoneX,
    curveMonotoneY, curveNatural, curveStepBefore, curveStepAfter, curveStep} from 'd3-shape';

/* eslint-disable no-confusing-arrow */

const curveArg = (value, _default) => value !== undefined ? value : _default;

const curve = {
    linear: function() {
        return curveLinear;
    },
    basis: function() {
        return curveBasis;
    },
    bundle: function() {
        return curveBundle.beta(curveArg(this.bundleBeta, 0.5));
    },
    cardinal: function() {
        return curveCardinal.tension(curveArg(this.cardinalTension, 0.5));
    },
    'catmull-rom': function() {
        return curveCatmullRom.alpha(curveArg(this.catmullRomAlpha, 0.5));
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


PTCS.ChartCombo = class extends BehaviorChart(PTCS.BehaviorTabindex(PTCS.BehaviorFocus(
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

        .yaxis-container:not([flip-axes]) {
            display: flex;
            flex-direction: row;
            height: 100%;
            overflow: auto hidden;
        }

        ptcs-chart-axis, [part=legend-area] {
            width: 100%;
            height: 100%;
        }

        .yaxis-container[flip-axes] {
            display: flex;
            flex-direction: column;
            width: 100%;
            overflow: hidden auto;
        }

        :host([dragging]) :is(ptcs-chart-legend, ptcs-toolbar, ptcs-chart-zoom, ptcs-label, ptcs-axis)  {
            pointer-events: none;
            user-select: none;
        }
        </style>
        <ptcs-chart-display-axis id="display-axis" part="display-axis" tabindex\$="[[_delegatedFocus]]"
                                 open="{{_showDisplayAxis}}" axes="[[yAxes]]" enabled="[[_enabledYAxes]]"
                                 selected-indexes="{{_showYAxes}}"></ptcs-chart-display-axis>
        <ptcs-chart-layout id="chart-layout" style="height:100%" part="chart-layout"
                           disabled="[[disabled]]"
                           title-pos="[[titlePos]]" hide-title="[[!titleLabel]]"
                           notes-pos="[[notesPos]]" notes-align="[[notesAlign]]" hide-notes="[[_hideNotes(notesLabel, hideNotes)]]"
                           legend-pos="[[legendPos]]" hide-legend="[[_hideLegend(hideLegend, legend)]]"
                           eff-legend-pos="{{_effLegendPos}}"
                           x-zoom="[[_showZoomX(noXZoom, xZoomRange, xZoomInterval, xZoomSlider, xZoomDrag, xZoomSelect)]]"
                           y-zoom="[[_showZoomY(noYZoom, yZoomRange, yZoomInterval, yZoomSlider, yZoomDrag, yZoomSelect)]]"
                           flip-axes="[[flipAxes]]"
                           flip-x-axis="[[flipXAxis]]"
                           flip-y-axis="[[flipYAxes]]"
                           spark-view="[[sparkView]]"
                           x-axis="[[!hideXAxis]]"
                           x-axis2="[[_isXReferenceLines]]"
                           y-axis="[[!hideY1Axis]]"
                           y-axis2="[[_showY2Axis(hideY2Axis, _secondaryYAxes.length, _isYReferenceLines)]]"
                           action-bar="[[_actionBar(actionBar, _hideToolbar)]]"
                           chart-state="[[_hideChartState(_chartState)]]">
            <div part="title-area" slot="title" style\$="text-align:[[_getHorizontalAlignment(titlePos, titleAlign)]]">
                <ptcs-label part="title-label" label="[[titleLabel]]" variant="[[titleVariant]]"
                    horizontal-alignment="[[_getHorizontalAlignment(titlePos, titleAlign)]]" multi-line></ptcs-label>
            </div>
            <div part="notes-area" slot="notes" style\$="text-align:[[_getHorizontalAlignment(notesPos, notesAlign)]];">
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
            <ptcs-chart-bands slot="chart-bands" part="chart-bands"
                show-chart-bands="[[_showChartBands]]" flip-axes="[[flipAxes]]"
                inner-padding="[[_innerPadding]]" outer-padding="[[_outerPadding]]" bandwidth="[[_bandwidth]]"
            >
            </ptcs-chart-bands>
            <ptcs-chart-coord slot="chart" part="chart"
                flip-axes="[[flipAxes]]"
                flip-x-axis="[[flipXAxis]]"
                flip-y-axis="[[flipYAxes]]"
                x-ticks="[[_xTicks]]"
                x2-ticks="[[_xReferenceLines]]"
                y-ticks="[[_yTicks]]"
                y-scale="[[_yScale]]"
                y2-ticks="[[_if(_isYReferenceLines, _yReferenceLines, _y2Ticks)]]"
                y2-scale="[[_y2Scale]]"
                show-x-rulers="[[showXRulers]]"
                show-x2-rulers="[[_isXReferenceLines]]"
                has-y2="[[_showY2Axis(hideY2Axis, _secondaryYAxes.length, _isYReferenceLines)]]"
                show-y-rulers="[[_showYRulers(showYRulers, yAxisRulerAlignment, hideY2Axis)]]"
                show-y2-rulers="[[_showY2Rulers(_isYReferenceLines, showYRulers, yAxisRulerAlignment, hideY2Axis)]]"
                is-reference-lines="[[_or(_isXReferenceLines, _isYReferenceLines)]]"
                y-axis-ruler-alignment="[[yAxisRulerAlignment]]"
                front-rulers="[[frontRulers]]"
                hide-zero-ruler="[[hideZeroRuler]]"
                graph-width="{{_graphWidth}}"
                graph-height="{{_graphHeight}}"
                spark-view="[[sparkView]]">
                <ptcs-chart-core-combo slot="chart" id="chart" part="core-chart" style="pointer-events: auto"
                    tabindex\$="[[_delegatedFocus]]"
                    disabled="[[disabled]]"
                    data="[[data]]"
                    drawables="[[_drawables]]"
                    legend="[[legend]]"
                    tooltip-template="[[tooltipTemplate]]"
                    selected-legend="[[_selectedLegend]]"
                    x-scale="[[_xScale]]"
                    y-scales="[[_ayScale]]"
                    flip-axes="[[flipAxes]]"
                    show-chart-bands="[[_showChartBands]]"
                    zoom-select="[[_zoomSelect(xZoomSelect, noXZoom, yZoomSelect, noYZoom)]]"
                    zoom-drag-x="[[_zoomDrag(xZoomDrag, noXZoom)]]"
                    zoom-drag-y="[[_zoomDrag(yZoomDrag, noYZoom)]]"
                    dragging="{{dragging}}"
                    selection-mode="[[selectionMode]]"
                    cursor-type="[[_cursorType(pointerType, flipAxes)]]"
                    cursor-target="[[_cursorTarget(dataPointSelection, flipAxes)]]"
                    on-chart-selection="_onSelectionChanged"
                    on-zoom-selection="_onZoomSelection"
                    chart-state-data-error="{{_chartStateDataError}}"
                    chart-state-data-empty="{{_chartStateDataEmpty}}"></ptcs-chart-core-combo>
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
                    items="[[_legend]]"
                    shape="[[legendShape]]"
                    filter="[[filterLegend]]"
                    horizontal="[[_horizLegend(_effLegendPos)]]"
                    max-width="[[legendMaxWidth]]"
                    align="[[legendAlign]]"
                    disabled="[[disabled]]"
                    selected="{{_selectedLegend$}}"></ptcs-chart-legend>
            </div>
            <ptcs-chart-zoom slot="xzoom" id="zoomX" part="zoom-xaxis"
                tabindex\$="[[_delegatedFocus]]"
                disabled="[[disabled]]"
                type="[[_xType]]"
                side="[[_xSide(flipXAxis, flipAxes)]]"
                hidden\$="[[noXZoom]]"
                hide-reset
                axis-length="[[_xSize(_graphWidth, _graphHeight, flipAxes)]]"
                min-value="[[_zoomMin(_xMin, _xMax, _xType, specXMin, specXMax)]]"
                max-value="[[_zoomMax(_xMin, _xMax, _xType, specXMax, specXMin)]]"
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
                type="[[_xType]]"
                disabled="[[disabled]]"
                spec-min="[[_specValueMin(specXMin, specXMax, xZoomStart, noXZoom, _xMin, _xMax, _xType)]]"
                spec-max="[[_specValueMax(specXMin, specXMax, xZoomEnd, noXZoom, _xMin, _xMax, _xType)]]"
                side="[[_xSide(flipXAxis, flipAxes)]]"
                label="[[xAxisLabel]]"
                align-label="[[xAxisAlign]]"
                min-value="[[_xMin]]"
                max-value="[[_xMax]]"
                size="[[_xSize(_graphWidth, _graphHeight, flipAxes)]]"
                max-size="[[_if(flipAxes, verticalAxisMaxWidth, horizontalAxisMaxHeight)]]"
                ticks="{{_xTicks}}"
                ticks-rotation="[[horizontalTicksRotation]]"
                tick-format="[[xAxisTickFormat]]"
                num-ticks="[[numberOfXLabels]]"
                reverse="[[reverseXAxis]]"
                scale="{{_xScale}}"
                hidden\$="[[hideXAxis]]"
                outer-padding="[[outerPadding]]"
                inner-padding="[[innerPadding]]"></ptcs-chart-axis>
            <template is="dom-if" if="[[_isXReferenceLines]]">
                <ptcs-chart-axis id="xaxis2" slot="xaxis2" part="xaxis2" style="pointer-events: auto"
                    no-tabindex
                    type="[[_xType]]"
                    disabled="[[disabled]]"
                    spec-min="[[_specValueMin(specXMin, specXMax, xZoomStart, noXZoom, _xMin, _xMax, _xType)]]"
                    spec-max="[[_specValueMax(specXMin, specXMax, xZoomEnd, noXZoom, _xMin, _xMax, _xType)]]"
                    side="[[_x2Side(flipXAxis, flipAxes)]]"
                    min-value="[[_xMin]]"
                    max-value="[[_xMax]]"
                    size="[[_xSize(_graphWidth, _graphHeight, flipAxes)]]"
                    max-size="[[_if(flipAxes, verticalAxisMaxWidth, horizontalAxisMaxHeight)]]"
                    ticks="{{_xTicks}}"
                    ticks-rotation="[[horizontalTicksRotation]]"
                    reverse="[[reverseXAxis]]"
                    scale="{{_xScale}}"
                    reference-lines="[[_xAxisReferenceLines]]"
                    eff-reference-lines="{{_xReferenceLines}}"
                    is-reference-lines="[[_isXReferenceLines]]"></ptcs-chart-axis>
            </template>
            <ptcs-chart-zoom slot="yzoom" id="zoomY" part="zoom-yaxis"
                tabindex\$="[[_delegatedFocus]]"
                disabled="[[disabled]]"
                type="number"
                side="[[_ySide(flipYAxes, flipAxes)]]"
                hidden\$="[[noYZoom]]"
                hide-reset
                axis-length="[[_if(flipAxes, _graphWidth, _graphHeight)]]"
                min-value="0"
                max-value="100"
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
            <div slot="yaxis" class="yaxis-container" flip-axes\$="[[flipAxes]]" id="yaxis-container">
                <template is="dom-repeat" items="{{_primaryYAxes}}">
                    <ptcs-chart-axis part="yaxis" style="pointer-events: auto"
                        no-tabindex
                        hidden\$="[[_isHiddenAxis(item._minValue, item._maxValue, item.hide)]]"
                        axis-id="[[item.id]]"
                        disabled="[[disabled]]"
                        type="[[item._type]]"
                        spec-min="[[_yAxisMin(item._minValue, item._maxValue, item._type, item.specMin, item.specMax, yZoomStart)]]"
                        spec-max="[[_yAxisMax(item._minValue, item._maxValue, item._type, item.specMax, item.specMin, yZoomEnd)]]"
                        side="[[_ySide(flipYAxes, flipAxes)]]"
                        label="[[item.label]]"
                        align-label="[[item.align]]"
                        min-value="[[item._minValue]]"
                        max-value="[[item._maxValue]]"
                        size="[[_if(flipAxes, _graphWidth, _graphHeight)]]"
                        max-size="[[_if(flipAxes, horizontalAxisMaxHeight, verticalAxisMaxWidth)]]"
                        ticks-rotation="[[horizontalTicksRotation]]"
                        reverse="[[_reverseY(item.reverse, reverseYAxis)]]"
                        tick-format="[[item.tickFormat]]"
                        num-ticks="[[item.numTicks]]"
                        on-ticks-changed="_primaryYTicksChanged"
                        on-scale-changed="_primaryYScaleChanged"></ptcs-chart-axis>
                </template>
            </div>
            <div slot="yaxis2" class="yaxis-container" flip-axes\$="[[flipAxes]]" id="yaxis-container2">
                <template is="dom-if" if="[[_isYReferenceLines]]">
                    <ptcs-chart-axis part="yaxis2" is-reflines style="pointer-events: auto"
                        no-tabindex
                        disabled="[[disabled]]"
                        scale="[[_yScaleReferenceLines]]"
                        side="[[_y2Side(flipYAxes, flipAxes)]]"
                        size="[[_if(flipAxes, _graphWidth, _graphHeight)]]"
                        max-size="[[_if(flipAxes, horizontalAxisMaxHeight, verticalAxisMaxWidth)]]"
                        ticks-rotation="[[horizontalTicksRotation]]"
                        reference-lines="[[_yAxisReferenceLines]]"
                        eff-reference-lines="{{_yReferenceLines}}"
                        is-reference-lines="[[_isYReferenceLines]]"></ptcs-chart-axis>
                </template>
                <template is="dom-repeat" items="{{_secondaryYAxes}}">
                    <ptcs-chart-axis part="yaxis2" style="pointer-events: auto"
                        no-tabindex
                        hidden\$="[[_isHiddenAxis(item._minValue, item._maxValue, item.hide)]]"
                        disabled="[[disabled]]"
                        axis-id="[[item.id]]"
                        type="[[item._type]]"
                        spec-min="[[_yAxisMin(item._minValue, item._maxValue, item._type, item.specMin, item.specMax, yZoomStart)]]"
                        spec-max="[[_yAxisMax(item._minValue, item._maxValue, item._type, item.specMax, item.specMin, yZoomEnd)]]"
                        side="[[_y2Side(flipYAxes, flipAxes)]]"
                        label="[[item.label]]"
                        align-label="[[item.align]]"
                        min-value="[[item._minValue]]"
                        max-value="[[item._maxValue]]"
                        size="[[_if(flipAxes, _graphWidth, _graphHeight)]]"
                        max-size="[[_if(flipAxes, horizontalAxisMaxHeight, verticalAxisMaxWidth)]]"
                        reverse="[[_reverseY(item.reverse, reverseYAxis)]]"
                        tick-format="[[item.tickFormat]]"
                        num-ticks="[[item.numTicks]]"
                        ticks-rotation="[[horizontalTicksRotation]]"
                        on-ticks-changed="_secondaryYTicksChanged"
                        on-scale-changed="_secondaryYScaleChanged"></ptcs-chart-axis>
                </template>
            </div>
        </ptcs-chart-layout>`;
    }

    static get is() {
        return 'ptcs-chart-combo';
    }

    static get properties() {
        return {
            disabled: {
                type:               Boolean,
                reflectToAttribute: true
            },

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

            xAxisTickFormat: {
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

            // [{id, type, label, position, align, reverse, hide, min, max, tickFormat}, ...]
            yAxes: {
                type: Array,
            },

            // yAxes ids of axes that are in use (not filtered out by legend filtering)
            _enabledYAxes: {
                type: Array,
            },

            // Array of yAxes indexes that should be displayed on chart
            _showYAxes: {
                type:     Array,
                observer: '_showYAxesChanged'
            },

            axisDisplayControl: {
                type:     Boolean,
                observer: '_axisDisplayControlChanged'
            },

            _primaryYAxes: {
                type:  Array,
                value: []
            },

            _secondaryYAxes: {
                type:  Array,
                value: []
            },

            _ayScale: {
                type:  Object,
                value: () => ({})
            },

            // _yAxesValues holds the min and max values for each y-axis, as computed from the data
            // {axisId: [minValue, maxValue]}
            _yAxesValues: {
                type:  Object,
                value: () => ({})
            },

            // {bar: [], area: [], line: [], axisMap: Map }
            _drawables: {
                type:  Object,
                value: {bar: [], area: [], line: [], axisMap: new Map()}
            },

            // [{id, method, order, curve}]
            stacks: {
                type: Array
            },

            hideY1Axis: {
                type:     Boolean,
                observer: '_hideY1AxisChanged'
            },

            hideLegend: {
                type:   Boolean,
                notify: true // Can be toggled via button
            },

            // Names of legends, if legends should be visible
            legend: {
                type: Array
            },

            // Same as legend, but with icons
            _legend: {
                type: Array
            },

            // top || bottom || left || [right]
            legendPos: {
                type: String
            },

            // Same as legendPos, unless chart size limitations forces legend to a different place
            _effLegendPos: {
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

            // Selected legends from legend component
            _selectedLegend$: {
                type: Array
            },

            // Legends currently selected in the legend component
            _selectedLegend: {
                type:     Array,
                computed: '_computeSelectedLegend(_selectedLegend$, legend)',
                observer: '_selectedLegendChanged'
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

            // Flip y-axes sides
            flipYAxes: {
                type: Boolean
            },

            tooltipTemplate: {
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
                type:     String,
                observer: '_yAxisRulerAlignmentChanged'
            },

            // Put rulers on top of chart
            frontRulers: {
                type: Boolean
            },

            // Reference lines (a.k.a. threshold lines) raw data
            referenceLines: {
                type:     Array,
                observer: 'referenceLinesChanged'
            },

            _yScaleReferenceLines: {
                type: Function
            },

            // Is at least one y-reference line mapped to an axis with a value?
            _isXReferenceLines: {
                type: Boolean
            },

            // Reference lines for y-axes
            _xAxisReferenceLines: {
                type: Array
            },

            // Sorted & filtered reference lines from xaxis2 ptcs-chart-axis
            _xReferenceLines: {
                type: Array
            },

            // Is at least one y-reference line mapped to an axis with a value?
            _isYReferenceLines: {
                type: Boolean
            },

            // Reference lines for y-axes
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

            // x-axis type: number || date || label || [string]
            xType: {
                type: Object
            },

            // x-axis type: number || date || [string]
            _xType: {
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

            // Minimun y value in data - for zooming
            _yMin: {
                value:    0,
                readOnly: true
            },

            // Maximum y value in data - for zooming
            _yMax: {
                value:    100,
                readOnly: true
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

            // Specified y-max-value: auto || Number
            specYMax: {
                type: Object
            },

            // Move x-scale from x-axis to chart
            _xScale: {
                type:     Function,
                observer: '_xScaleChanged'
            },

            // Move y-scale from y-axis to chart
            _yScale: {
                type: Function
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
            // yZoomStart and yZoomEnd zooms all y-axes. The values are percentages which scales the y-axes
            yZoomStart: {
                type: Number
            },

            yZoomEnd: {
                type: Number
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

            yZoomSliderLabel: {
                type: String
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

            // When mouse is dragging on the chart
            dragging: {
                type:               Boolean,
                reflectToAttribute: true
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

            yAxesMaxWidth: {
                type: String
            },

            alignBarsAtZero: {
                type:     Boolean,
                observer: '_alignBarsAtZeroChanged'
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
                type:     String,
                observer: '_groupPaddingChanged'
            },

            // Secondary y-axis
            hideY2Axis: {
                type:     Boolean,
                observer: '_hideY2AxisChanged'
            },

            _y2Scale: {
                type: Function,
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

            // target method: auto (point) || horz || vert || cross
            pointerType: {
                type: String,
            },

            // target method: auto (over) || horz || vert || both || none
            dataPointSelection: {
                type: String,
            },

            // sampleSize: unassigned - use default sampling,
            //             number - sample down data to specified number,
            //             0 (zero) = no sampling = show all points
            sampleSize: {
                type:     Number,
                observer: '_sampleSizeChanged'
            },

            // For the toolbar
            _isZoomable$tb: {
                // eslint-disable-next-line max-len
                computed: '_isZoomable(noXZoom, noYZoom, xZoomRange, yZoomRange, xZoomInterval, yZoomInterval, xZoomSlider, yZoomSlider, xZoomDrag, yZoomDrag, xZoomSelect, yZoomSelect, flipAxes, showZoomButtons)'
            },

            _resetButtonEnabled$tb: {
                computed: '_enableZoomReset(_xType, _xMin, _xMax, xZoomStart, xZoomEnd, _yMin, _yMax, yZoomStart, yZoomEnd, specYMin, specYMax)'
            },

            _showDisplayAxis: {
                type:     Boolean,
                observer: '_showDisplayAxisChanged'
            },

            // Show chart bands

            // user-provided property
            showChartBands: {
                type: Boolean
            },

            // calculated later depending on several conditions
            _showChartBands: {
                type: Boolean
            },

            _innerPadding: {
                type: Number
            },

            _outerPadding: {
                type: Number
            },

            _bandwidth: {
                type: Number
            }
        };
    }

    static get observers() {
        return [
            '_dataChanged(data, xType)',
            '_yAxesChanged(yAxes.*)',
            '_chartChanged(yAxes.*, data, legend, stacks)',
            '_resized(_graphWidth, graphHeight)',
            '_yAxesMaxSize(yAxesMaxWidth, flipAxes)',
            '_updateChartBands(_xScale, showChartBands, _drawables.bar)'
        ];
    }

    ready() {
        super.ready();

        this._yScaleReferenceLines = this.__yScaleReferenceLines.bind(this);

        if (this.hideXAxis === undefined) {
            this.hideXAxis = false;
        }
        if (this.hideY1Axis === undefined) {
            this.hideY1Axis = false;
        }
        if (this.hideY2Axis === undefined) {
            this.hideY2Axis = false;
        }
    }

    _gcTabindex(_delegatedFocus, _hideToolbar) {
        return _hideToolbar ? false : _delegatedFocus;
    }

    _tabindex(filterLegend, _delegatedFocus) {
        return filterLegend ? _delegatedFocus : false;
    }

    _reverseY(reverse1, reverse2) {
        return reverse1 ? !reverse2 : reverse2;
    }

    _isZoomable(noXZoom, noYZoom, xZoomRange, yZoomRange, xZoomInterval, yZoomInterval, xZoomSlider, yZoomSlider, xZoomDrag, yZoomDrag,
        xZoomSelect, yZoomSelect, showZoomButtons) {
        return this._showZoom(noXZoom, xZoomRange, xZoomInterval, xZoomSlider, xZoomDrag, xZoomSelect, showZoomButtons) ||
            this._showZoom(noYZoom, yZoomRange, yZoomInterval, yZoomSlider, yZoomDrag, yZoomSelect, showZoomButtons);
    }

    _enableZoomReset(_xType, _xMin, _xMax, xZoomStart, xZoomEnd, _yMin, _yMax, yZoomStart, yZoomEnd, specYMin, specYMax) {
        return this._enabled(_xType, _xMin, _xMax, xZoomStart, xZoomEnd) ||
            this._yEnabled(_yMin, _yMax, yZoomStart, yZoomEnd, specYMin, specYMax);
    }

    _zoomSelect(xZoomSelect, noXZoom, yZoomSelect, noYZoom) {
        return (!noXZoom && xZoomSelect) || (!noYZoom && yZoomSelect);
    }

    _zoomDrag(drag, noZoom) {
        return !noZoom && drag;
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

    _horizLegend(_effLegendPos) {
        return _effLegendPos === 'top' || _effLegendPos === 'bottom';
    }

    _xSide(flipXAxis, flipAxes) {
        // eslint-disable-next-line no-nested-ternary
        return flipAxes ? (flipXAxis ? 'right' : 'left') : (flipXAxis ? 'top' : 'bottom');
    }

    _x2Side(flipXAxis, flipAxes) {
        // eslint-disable-next-line no-nested-ternary
        return flipAxes ? (flipXAxis ? 'right' : 'left') : (flipXAxis ? 'bottom' : 'top');
    }

    _ySide(flipYAxes, flipAxes) {
        // eslint-disable-next-line no-nested-ternary
        return flipAxes ? (flipYAxes ? 'top' : 'bottom') : (flipYAxes ? 'right' : 'left');
    }

    _y2Side(flipYAxes, flipAxes) {
        // eslint-disable-next-line no-nested-ternary
        return flipAxes ? (flipYAxes ? 'bottom' : 'top') : (flipYAxes ? 'left' : 'right');
    }

    _xSize(_graphWidth, _graphHeight, flipAxes) {
        return flipAxes ? _graphHeight : _graphWidth;
    }

    /*
    _ySize(_graphWidth, _graphHeight, flipAxes) {
        return flipAxes ? _graphWidth : _graphHeight;
    }*/

    _actionBar(actionBar, hideToolbar) {
        if (hideToolbar) {
            return null;
        }

        return actionBar || 'top';
    }

    _showYRulers(showYRulers, yAxisRulerAlignment, hideY2Axis) {
        return showYRulers && (hideY2Axis || yAxisRulerAlignment !== 'secondary');
    }

    _showY2Rulers(_isYReferenceLines, showYRulers, yAxisRulerAlignment, hideY2Axis) {
        return _isYReferenceLines || (showYRulers && !hideY2Axis && yAxisRulerAlignment === 'secondary');
    }

    _showY2Axis(hideY2Axis, numY2Axes, _isYReferenceLines) {
        return !hideY2Axis && (numY2Axes || _isYReferenceLines);
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


    _zoomMin(min, max, type, spec, specMax) {
        return axisMin(min, max, type, spec, specMax);
    }

    _zoomMax(min, max, type, spec, specMin) {
        return axisMax(min, max, type, spec, specMin);
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

    _yZoomMin(_yMin, _yMax, specYMin, specYMax) {
        return axisBarMin(_yMin, _yMax, specYMin, specYMax);
    }

    _yZoomMax(_yMin, _yMax, specYMax, specYMin) {
        return axisBarMax(_yMin, _yMax, specYMin, specYMax);
    }

    _yAxisMin(_yMin, _yMax, yType, specYMin, specYMax, yZoomStart) {
        const min = axisMin(_yMin, _yMax, yType, specYMin, specYMax);
        if (yZoomStart > 0) {
            const max = axisMax(_yMin, _yMax, yType, specYMax, specYMin);
            if (yType === 'number') {
                return min + Math.min(yZoomStart, 100) * (max - min) / 100;
            }
            if (yType === 'date' && min instanceof Date && max instanceof Date) {
                return new Date(min.getTime() + Math.min(yZoomStart, 100) * (max.getTime() - min.getTime()) / 100);
            }
        }
        return min;
    }

    _yAxisMax(_yMin, _yMax, yType, specYMax, specYMin, yZoomEnd) {
        const max = axisMax(_yMin, _yMax, yType, specYMax, specYMin);
        if (yZoomEnd < 100) {
            const min = axisMin(_yMin, _yMax, yType, specYMin, specYMax);
            if (yType === 'number') {
                return max - Math.max(0, 100 - yZoomEnd) * (max - min) / 100;
            }
            if (yType === 'date' && max instanceof Date && min instanceof Date) {
                return new Date(max.getTime() - Math.max(0, 100 - yZoomEnd) * (max.getTime() - min.getTime()) / 100);
            }
        }
        return max;
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

    _cursorType(pointerType, flipAxes) {
        const map = flipAxes ? {horz: 'x', vert: 'y', cross: 'xy'} : {horz: 'y', vert: 'x', cross: 'xy'};
        return map[pointerType] || pointerType;
    }

    _cursorTarget(dataPointSelection, flipAxes) {
        const map = flipAxes ? {horz: 'x', vert: 'y', both: 'xy'} : {horz: 'y', vert: 'x', both: 'xy'};
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
        // The combo chart simulates an y-scale from 0 to 100 that specifies the current zooming
        const invertYscale = v => {
            const [y1, y2] = [this.yZoomStart || 0, this.yZoomEnd || 100];
            const d1 = this.flipAxes ? this._graphWidth : this._graphHeight;
            const d2 = Math.abs(y2 - y1);
            return y1 + d2 * (d1 - v) / d1;
        };

        const xScale = this._xScale;
        const yScale = {invert: invertYscale};
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
                ? invertScaleRange(xScale, d.x + d.w, d.x) : invertScaleRange(xScale, d.x, d.x + d.w);
        }
        if (this.yZoomDrag || this.yZoomSelect) {
            const [start, end] = reverseYAxis // default y-axis is reversed
                ? invertScaleRange(yScale, d.y, d.y + d.h) : invertScaleRange(yScale, d.y + d.h, d.y);
            this.yZoomStart = start > 0 ? start : undefined;
            this.yZoomEnd = end < 100 ? end : undefined;
        }
    }

    refreshData() {
        this._dataChanged(this.data, this.xType);
    }

    _resetToDefaultValues() {
        this.$.legend._resetToDefaultValues();
        this.$.zoomX._resetToDefaultValues();
        this.$.zoomY._resetToDefaultValues();
    }

    _dataChanged(data, xType) {
        if (!Array.isArray(data)) {
            this._xType = this._xMin = this._xMax = undefined;
            return;
        }
        try {
            if (xType === 'label' || !xType) {
                this._xType = [...new Set(data.map(__xv))];
                this._xMin = this._xType[0];
                this._xMax = this._xType[this._xType.length - 1];
            } else if (xType === 'number') {
                const ax = data.map(item => item[0]);
                this._xType = xType;
                this._xMin = Math.min(...ax);
                this._xMax = Math.max(...ax);
            } else if (xType === 'date') {
                const ax = data.map(item => item[0].getTime());
                this._xType = xType;
                this._xMin = new Date(Math.min(...ax));
                this._xMax = new Date(Math.max(...ax));
            } else if (Array.isArray(xType) && xType.every(tick => typeof tick === 'string')) {
                this._xType = [...new Set(xType)];
                this._xMin = this._xType[0];
                this._xMax = this._xType[this._xType.length - 1];
            } else {
                this._xType = this._xMin = this._xMax = undefined;
                console.warn('Unknown xType: ' + xType);
            }
        } catch (e) {
            this._xType = this._xMin = this._xMax = undefined;
        }
    }

    // Inform drawables about x-zoom factor (filter out unmapped x-values)
    _setXZoom() {
        const zoomStart = this.xZoomStart !== undefined && this.xZoomStart !== null && this.xZoomStart !== this._xMin;
        const zoomEnd = this.xZoomEnd !== undefined && this.xZoomEnd !== null && this.xZoomEnd !== this._xMax;
        const xScale = this._xScale;
        const sampleSize = (this.sampleSize >= 0 && this.sampleSize !== '') ? Number(this.sampleSize) : undefined;
        const drawables = [...this._drawables.bar, ...this._drawables.line, ...this._drawables.area];
        const axisMap = this._drawables.axisMap;
        const toZeroScale = () => 0;
        const yScale = axisMap ? drawable => (this._ayScale[axisMap.get(drawable)] || toZeroScale) : () => toZeroScale;

        if (zoomStart || zoomEnd) {
            drawables.forEach(drawable => drawable.zoom(xScale, sampleSize, yScale(drawable)));
        } else {
            drawables.forEach(drawable => drawable.unZoom(xScale, sampleSize, yScale(drawable)));
        }
    }

    /**
     *  Show chart bands only when the next conditions are met:
     *  - chart is ready (has the scaling) and the user chose to show chart bands
     *  - chart has bar/stacked bar series
     *  - bars are wider than 6 px
     *  - inner padding is greater than 1px
     **/
    _updateChartBands(xScale, showChartBands, bar) {
        const visibleBars = bar.filter(el => !el.hidden);

        this._showChartBands = showChartBands && xScale && xScale.bandwidth &&
            visibleBars.length > 0 &&
            visibleBars[0].barSize(xScale).barW > 6 &&
            xScale.step() * xScale.paddingInner() > 1;

        this._innerPadding = this._showChartBands ? xScale.step() * xScale.paddingInner() : undefined;
        this._outerPadding = this._showChartBands ? xScale.step() * xScale.paddingOuter() : undefined;
        this._bandwidth = this._showChartBands ? xScale.bandwidth() : undefined;
    }

    _xScaleChanged() {
        this._setXZoom();
    }

    _sampleSizeChanged() {
        if (this._xScale) {
            this._setXZoom();
            this.$.chart.refresh();
        }
    }

    _hideXAxisChanged(hide) {
        if (!hide) {
            this.$.xaxis.refresh();
        }
    }

    _isHiddenAxis(_minValue, _maxValue, hide) {
        return (_minValue === null && _maxValue === null) || hide;
    }

    _curve(series) {
        const f = curve[series.curve];
        return f ? f.call(series) : curveLinear;
    }

    _alignBarAxes() {
        if (this.alignBarsAtZero) {
            const stacks = Array.isArray(this.stacks) ? this.stacks : [];
            const legend = Array.isArray(this.legend) ? this.legend : [];

            // Collect axes that render bars
            const barAxes = legend.reduce((set, series) => {
                const renderOn = series.renderOn;
                const stack = stacks.find(s => s.id === renderOn);
                if (stack) {
                    if (stack.curve === 'bar') {
                        set.add(stack.yaxis);
                    }
                } else if (series.curve === 'bar') {
                    set.add(renderOn);
                }
                return set;
            }, new Set());

            // Is a value?
            const isv = s => s !== undefined && s !== null && s !== '' && s !== false;

            // Collect min and max values of bar rendering axes that includes the zero value
            const av = [...this._primaryYAxes, ...this._secondaryYAxes].reduce((acc, yaxis) => {
                if (yaxis.type === 'number' && barAxes.has(yaxis.id)) {
                    const [_minValue, _maxValue] = this._yAxesValues[yaxis.id] || [null, null];
                    if (isv(_minValue) && _minValue <= 0 && isv(_maxValue) && _maxValue >= 0) {
                        acc.push([_minValue, _maxValue, yaxis.id]);
                    }
                }
                return acc;
            }, []);

            // Compute relative size of the negative side of the axis
            const avgK = av.reduce((acc, r) => acc + r[0] / (r[0] - r[1]), 0) / av.length;

            // Assign values to axis
            const f = axisGroup => (axis, i) => {
                const r = av.find(r2 => r2[2] === axis.id);

                if (r) {
                    this.set(`${axisGroup}.${i}._type`, 'number');
                    const k = r[0] / (r[0] - r[1]);
                    if (k > avgK) {
                        // Increase max value
                        this.set(`${axisGroup}.${i}._minValue`, r[0]);
                        this.set(`${axisGroup}.${i}._maxValue`, r[1] + ((avgK - 1) * r[0] - avgK * r[1]) / avgK);
                    } else if (k < avgK) {
                        // Increase min value
                        this.set(`${axisGroup}.${i}._minValue`, r[0] + ((avgK - 1) * r[0] - avgK * r[1]) / (1 - avgK));
                        this.set(`${axisGroup}.${i}._maxValue`, r[1]);
                    } else {
                        this.set(`${axisGroup}.${i}._minValue`, r[0]);
                        this.set(`${axisGroup}.${i}._maxValue`, r[1]);
                    }
                } else {
                    const vv = this._yAxesValues[axis.id] || {};
                    if (vv) {
                        this.set(`${axisGroup}.${i}._type`, vv[2] || this[axisGroup][i].type);
                        this.set(`${axisGroup}.${i}._minValue`, vv[0]);
                        this.set(`${axisGroup}.${i}._maxValue`, vv[1]);
                    }
                }
            };

            this._primaryYAxes.forEach(f('_primaryYAxes'));
            this._secondaryYAxes.forEach(f('_secondaryYAxes'));

        } else {
            const f = axisGroup => (axis, i) => {
                const vv = this._yAxesValues[axis.id] || {};
                if (vv) {
                    this.set(`${axisGroup}.${i}._type`, vv[2] || this[axisGroup][i].type);
                    this.set(`${axisGroup}.${i}._minValue`, vv[0]);
                    this.set(`${axisGroup}.${i}._maxValue`, vv[1]);
                }
            };

            this._primaryYAxes.forEach(f('_primaryYAxes'));
            this._secondaryYAxes.forEach(f('_secondaryYAxes'));
        }
    }

    _alignBarsAtZeroChanged() {
        this._alignBarAxes();
    }

    _updateYRanges() {
        // Compute min / max
        if (!Array.isArray(this.yAxes)) {
            return;
        }

        const axisMap = this._drawables.axisMap;
        const drawables = [...this._drawables.bar, ...this._drawables.line, ...this._drawables.area];

        this.yAxes.forEach(axis => {
            let yMin = null;
            let yMax = null;
            let ySet = null;

            const drawList = drawables.filter(d => axis.id === axisMap.get(d));

            switch (axis.type) {
                case 'number':
                case 'date': {
                    drawList.forEach(drawObj => drawObj.eachY(y => {
                        if (yMin > y || yMin === null) {
                            yMin = y;
                        }
                        if (yMax < y || yMax === null) {
                            yMax = y;
                        }
                    }));
                    break;
                }

                case 'label': {
                    if (!ySet) {
                        ySet = new Set();
                    }
                    drawList.forEach(drawObj => drawObj.eachY(y => ySet.add(typeof y === 'string' ? y : `${y}`)));
                    break;
                }

                default:
                    if (Array.isArray(axis.type) && axis.type.every(tick => typeof tick === 'string')) {
                        console.error('LIST OF TICK STRINGS axis');
                    } else {
                        console.error('Unknown axis type');
                    }
            }

            if (ySet) {
                const yValues = [...ySet];
                const v = index => yValues[index] !== undefined ? yValues[index] : null;
                this._yAxesValues[axis.id] = [v(0), v(yValues.length - 1), yValues];
            } else {
                this._yAxesValues[axis.id] = [yMin, yMax];
            }
        });

        // Align yaxes that displays bar, if neeed, and then assign the new values to displayed axes
        this._alignBarAxes();

        // Tell axis selector about available axes
        const r = [];
        const f = axis => !this._isHiddenAxis(axis._minValue, axis._maxValue, false) && r.push(axis.id);
        this._primaryYAxes.forEach(f);
        this._secondaryYAxes.forEach(f);
        this._enabledYAxes = r;

        // Refresh chart
        this.$.chart.refresh();
    }

    _yAxesChanged(cr) {
        const hide = Array.isArray(this._showYAxes) ? i => !(this._showYAxes.indexOf(i) >= 0) : () => false;
        const sepName = {primary: 'primary', secondary: 'secondary'};
        const sepAxes = {primary: [], secondary: []};
        if (Array.isArray(this.yAxes)) {
            this.yAxes.forEach((axis, index) => {
                const where = sepName[axis.position] || (index ? 'secondary' : 'primary');
                sepAxes[where].push({...axis, _type: axis.type, hide: hide(index)});
            });
        }

        this.__yAxesTicks = {};
        this._primaryYAxes = sepAxes.primary;
        this._secondaryYAxes = sepAxes.secondary;
    }

    _yAxesMaxSizeConstraints(id, size, flipAxes) {
        const yAxesContainer = this.shadowRoot.getElementById(id);
        if (yAxesContainer) {
            if (flipAxes) {
                yAxesContainer.style.maxHeight = /^\d+$/.test(size) ? size + 'px' : size;
                yAxesContainer.style.maxWidth = '';
            } else {
                yAxesContainer.style.maxWidth = /^\d+$/.test(size) ? size + 'px' : size;
                yAxesContainer.style.maxHeight = '';
            }
        }
    }

    _yAxesMaxSize(yAxesMaxWidth, flipAxes) {
        this._yAxesMaxSizeConstraints('yaxis-container', yAxesMaxWidth, flipAxes);
        this._yAxesMaxSizeConstraints('yaxis-container2', yAxesMaxWidth, flipAxes);
    }

    _chartChanged(/*yAxes.*, data, legend, stacks*/) {
        if (this.__chartChangedDebounce) {
            return;
        }
        this.__chartChangedDebounce = true;
        requestAnimationFrame(() => {
            this.__chartChangedDebounce = undefined;
            this.__chartChanged();
        });
    }

    __chartChanged() {
        const legend = Array.isArray(this.legend) ? this.legend : [];
        const data = Array.isArray(this.data) ? this.data : [];
        const alwaysNull = () => null;
        const id2yAxis = Array.isArray(this.yAxes) ? id => this.yAxes.find(axis => axis.id === id) : alwaysNull;
        const id2stack = Array.isArray(this.stacks) ? id => this.stacks.find(_stack => _stack.id === id) : alwaysNull;
        const zIndex = series => isNaN(+series.zIndex) ? 0 : +series.zIndex;

        // Index to every x-value: [0, 1, ..., N - 1];
        let _allIxs;

        // Don't duplicate _allIxs array
        const allIxs = () => {
            if (!_allIxs) {
                _allIxs = Array.from(data, (_, index) => index);
            }
            return _allIxs;
        };

        const drawables = {bar: [], area: [], line: [], axisMap: new Map()};

        const mapStack = new Map();

        // Bind Drawable / Chart graph to yAxis
        const bindToYAxis = (drawable, yAxis) => {
            drawable.setSelectedSeries(this._selectedLegend);

            if (drawable && yAxis.id) {
                drawables.axisMap.set(drawable, yAxis.id);
            }
            return drawable;
        };

        // Process series (map to axes or stacks)
        legend.forEach((series, seriesIx) => {
            const renderOnStack = id2stack(series.renderOn);
            const renderOnYAxis = !renderOnStack && id2yAxis(series.renderOn);

            if (renderOnStack) {
                const stackList = mapStack.get(renderOnStack);
                if (stackList) {
                    stackList.push(seriesIx);
                } else {
                    mapStack.set(renderOnStack, [seriesIx]);
                }
            } else if (renderOnYAxis) {
                const valueFormat = series.showValues && (series.valueFormat || id2yAxis(series.renderOn).tickFormat);
                if (series.curve === 'bar') {
                    drawables.bar.push(bindToYAxis(
                        new DrawBar(seriesIx, data, allIxs, +this.groupPadding, series.showValues, valueFormat, zIndex(series)),
                        renderOnYAxis));
                } else if (series.showArea) {
                    drawables.area.push(bindToYAxis(new DrawArea(
                        seriesIx, data, allIxs, this._curve(series), series.showLine,
                        series.marker, series.markerSize, series.showValues, valueFormat, zIndex(series)), renderOnYAxis));
                } else if (series.showLine) {
                    drawables.line.push(bindToYAxis(new DrawLine(
                        seriesIx, data, allIxs, this._curve(series),
                        series.marker, series.markerSize, series.showValues, valueFormat, zIndex(series)), renderOnYAxis));
                } else if (markersSet.has(series.marker)) {
                    drawables.line.push(bindToYAxis(new DrawPlot(
                        seriesIx, data, allIxs,
                        series.marker, series.markerSize, series.showValues, valueFormat, zIndex(series)), renderOnYAxis));
                }
            }
        });

        // Create stacked data
        mapStack.forEach((seriesIxs, stackOn) => {
            const renderOnYAxis = id2yAxis(stackOn.yaxis);
            if (!renderOnYAxis || renderOnYAxis.type !== 'number') {
                console.error('Data can only be stacked on numeric y-axis: ' + stackOn.yaxis);
                return;
            }

            const showValues = seriesIxs.map(i => legend[i].showValues);
            const formatValues = seriesIxs.map(i => PTCS.formatValue(legend[i].valueFormat || renderOnYAxis.tickFormat));
            const zI = Math.max(...seriesIxs.map(i => zIndex(legend[i])));

            if (stackOn.curve === 'bar') {
                drawables.bar.push(bindToYAxis(new DrawStackedBars( // Stacked bars must use "diverging", or they will fail to display negative values
                    seriesIxs, data, 'diverging', stackOn.order, +this.groupPadding, showValues, formatValues, zI, stackOn.showSum), renderOnYAxis));
            } else {
                const markers = seriesIxs.map(i => [legend[i].marker, legend[i].markerSize]);
                drawables.area.push(bindToYAxis(new DrawStackedAreas(
                    seriesIxs, data, stackOn.method, stackOn.order, this._curve(stackOn), markers, showValues, formatValues, zI), renderOnYAxis));
            }
        });

        // Assign legend icons
        const allDrawables = [...drawables.bar, ...drawables.area, ...drawables.line];

        this._legend = legend.map((series, seriesIx) => {
            const drawable = allDrawables.find(d => d.displaysSeries(seriesIx));
            return drawable ? {...series, icon: `chart-icons:${drawable && drawable.chartType}`} : series;
        });

        // Inform bars about their available bandwidth
        drawables.bar.filter(bar => !bar.hidden).forEach((bar, index, a) => bar.setBand(index, a.length));

        // Publish new drawables
        this._drawables = drawables;

        // Compute min / max for all y-axes
        this._updateYRanges();

        // Adjust the zoom factor (filter out unmapped x-values)
        this._setXZoom();
    }

    _computeSelectedLegend(_selectedLegend$, legend) {
        if (Array.isArray(_selectedLegend$)) {
            return _selectedLegend$;
        }
        if (Array.isArray(legend)) {
            return legend.map((_, i) => i);
        }
        return [];
    }

    _selectedLegendChanged(_selectedLegend) {
        const selectedSeries = Array.isArray(_selectedLegend) ? _selectedLegend : [];

        // Inform all drawables about the new legend filter
        [...this._drawables.bar, ...this._drawables.line, ...this._drawables.area]
            .forEach(d => d.setSelectedSeries(selectedSeries));

        this.notifyPath('_drawables.bar');

        // Inform bars about their available bandwidth
        this._drawables.bar.filter(bar => !bar.hidden).forEach((bar, index, a) => bar.setBand(index, a.length));

        // Adapt y-axis ranges
        this._updateYRanges();

        // Make sure the changes are displayed
        this.$.chart.refresh();
    }

    _groupPaddingChanged(groupPadding) {
        if (this._drawables.bar.length) {
            this._drawables.bar.forEach(drawable => drawable.setPadding(+groupPadding));
            this.$.chart.refresh();
        }
    }

    // This function simulates a scale function for the reference lines
    // The value argument is an index into _yAxisReferenceLines
    // The return value is the current scale value of the reference lines
    __yScaleReferenceLines(value) {
        try {
            const line = Array.isArray(this._yAxisReferenceLines) && this._yAxisReferenceLines[value];
            if (!line || !(this._primaryYAxes.some(a => a.id === line.axis) || this._secondaryYAxes.some(a => a.id === line.axis))) {
                return undefined; // Axis is not in use
            }
            const scale = this._ayScale[line.axis];
            const d = scale.domain()[0];

            if (typeof d === 'number') {
                return scale(typeof line._value === 'number' ? line._value : Number(line._value));
            }
            if (d instanceof Date) {
                return scale(line._value instanceof Date ? line._value : new Date(line._value));
            }
            return scale(line._value);
        } catch (e) {
            // Ignore error. Many things can go wrong above...
        }
        return undefined;
    }

    // Request to recompute _isYReferenceLines
    _updateIsYReferenceLines() {
        if (this._computeIsReferenceLines) {
            return;
        }
        this._computeIsReferenceLines = true;
        requestAnimationFrame(() => {
            this._computeIsReferenceLines = undefined;
            this._isYReferenceLines = Array.isArray(this._yAxisReferenceLines) &&
                this._yAxisReferenceLines.some(item => item._value !== undefined && item.axis);

            // Update scale, so axis is updated
            const reflinesEl = this.$['yaxis-container2'].querySelector(':scope > [is-reflines]');
            if (reflinesEl) {
                reflinesEl.refresh();
            }
        });
    }

    referenceLinesChanged(referenceLines) {
        const reset = v => v ? undefined : v; // Keep old value, if falsy

        if (!Array.isArray(referenceLines)) {
            this._xAxisReferenceLines = reset(this._xAxisReferenceLines);
            this._yAxisReferenceLines = reset(this._yAxisReferenceLines);
            this._isXReferenceLines = reset(this._isXReferenceLines);
            this._isYReferenceLines = reset(this._isYReferenceLines);
            return;
        }

        const xAxisReferenceLines = [];
        const yAxisReferenceLines = [];

        this.referenceLines.forEach((line, index) => {
            if (line.axis === 'xaxis') {
                if (this._xType === 'number') {
                    if (!isNaN(line.value)) {
                        xAxisReferenceLines.push(line);
                    }
                } else if (this._xType === 'date') {
                    const d = line.value instanceof Date ? line.value : new Date(line.value);
                    if (!isNaN(d)) {
                        xAxisReferenceLines.push({...line, value: d});
                    }
                }
            } else {
                yAxisReferenceLines.push({label: line.label, _value: line.value, axis: line.axis, value: yAxisReferenceLines.length});
            }
        });

        this._xAxisReferenceLines = xAxisReferenceLines.length && xAxisReferenceLines;
        this._yAxisReferenceLines = yAxisReferenceLines.length && yAxisReferenceLines;
        this._isXReferenceLines = xAxisReferenceLines.length > 0;
        this._updateIsYReferenceLines();
    }

    // The scale for axisId has changed
    _updateYReferenceValues(axisId) {
        if (!Array.isArray(this._yAxisReferenceLines)) {
            return;
        }
        if (this._yAxisReferenceLines.some(line => line.axis === axisId)) {
            // Need to recalculate _isYReferenceLines
            this._updateIsYReferenceLines();
        }
    }

    _yAxisRulerAlignmentChanged() {
        if (this.__yAxisRulerAlignment$) {
            return;
        }
        this.__yAxisRulerAlignment$ = true;
        requestAnimationFrame(() => {
            this.__yAxisRulerAlignment$ = undefined;

            if (!this.__yAxesTicks || !this._primaryYAxes || !this._secondaryYAxes) {
                this._yTicks = this._y2Ticks = undefined;
                this._yScale = this._y2Scale = undefined;
            } else if (this._primaryYAxes.find(axis => axis.id === this.yAxisRulerAlignment)) {
                this._yTicks = this.__yAxesTicks[this.yAxisRulerAlignment];
                this._yScale = this._ayScale[this.yAxisRulerAlignment];
                this._y2Ticks = undefined;
                this._y2Scale = undefined;
            } else if (this._secondaryYAxes.find(axis => axis.id === this.yAxisRulerAlignment)) {
                this._yTicks = undefined;
                this._yScale = undefined;
                this._y2Ticks = this.__yAxesTicks[this.yAxisRulerAlignment];
                this._y2Scale = this._ayScale[this.yAxisRulerAlignment];
            } else if ((this.yAxisRulerAlignment === 'primary' || !this.yAxisRulerAlignment) && this._primaryYAxes.length > 0) {
                this._yTicks = this.__yAxesTicks[this._primaryYAxes[0].id];
                this._yScale = this._ayScale[this._primaryYAxes[0].id];
                this._y2Ticks = undefined;
                this._y2Scale = undefined;
            } else if (this.yAxisRulerAlignment === 'secondary' && this._secondaryYAxes.length > 0) {
                this._yTicks = undefined;
                this._yScale = undefined;
                this._y2Ticks = this.__yAxesTicks[this._secondaryYAxes[0].id];
                this._y2Scale = this._ayScale[this._secondaryYAxes[0].id];
            } else {
                this._yTicks = this._y2Ticks = undefined;
                this._yScale = this._y2Scale = undefined;
            }
        });
    }

    _primaryYTicksChanged(ev) {
        if (ev.target.axisId && this.__yAxesTicks) {
            this.__yAxesTicks[ev.target.axisId] = ev.detail.value;
            if (this.yAxisRulerAlignment === ev.target.axisId || this.yAxisRulerAlignment === 'primary' || !this.yAxisRulerAlignment) {
                this._yAxisRulerAlignmentChanged();
            }
        }
    }

    _primaryYScaleChanged(ev) {
        this._ayScale[ev.target.axisId] = ev.detail.value;
        this._updateYReferenceValues(ev.target.axisId);
        this.$.chart.refresh();
    }

    _secondaryYTicksChanged(ev) {
        if (ev.target.axisId && this.__yAxesTicks) {
            this.__yAxesTicks[ev.target.axisId] = ev.detail.value;
            if (this.yAxisRulerAlignment === ev.target.axisId || this.yAxisRulerAlignment === 'secondary') {
                this._yAxisRulerAlignmentChanged();
            }
        }
    }

    _secondaryYScaleChanged(ev) {
        this._ayScale[ev.target.axisId] = ev.detail.value;
        this._updateYReferenceValues(ev.target.axisId);
        this.$.chart.refresh();
    }

    _hideY1AxisChanged(hideY1Axis) {
        if (!hideY1Axis) {
            this.shadowRoot.querySelectorAll('[part=yaxis]').forEach(yaxis => yaxis.refresh());
        }
    }

    _hideY2AxisChanged(hideY2Axis) {
        if (!hideY2Axis) {
            this.shadowRoot.querySelectorAll('[part=yaxis2]').forEach(yaxis => yaxis.refresh());
        }
    }

    _axisDisplayControlChanged(axisDisplayControl) {
        this._showAxisDisplayButton = axisDisplayControl;
    }

    _showDisplayAxisChanged(_showDisplayAxis) {
        this.$.toolbar.setSelected('axis-display-button', _showDisplayAxis);

        if (!_showDisplayAxis) {
            this.__showDisplayAxisClosed = Date.now();
        }

        if (this.hasAttribute('tabindex')) {
            requestAnimationFrame(() => this.$[this._showDisplayAxis ? 'display-axis' : 'toolbar'].focus());
        }
    }

    _resized() {
        this._showDisplayAxis = false;
    }

    _showAxisDisplay(buttonRect) {
        // A hack to stop the toolbar from reopening the reorder menu if clicking on the Display toolbar button
        if (Date.now() - this.__showDisplayAxisClosed < 200) {
            // User clicked on display button to close the menu. Don't reopen the menu
            return;
        }

        const r = this.getBoundingClientRect();
        const dlg = this.$['display-axis'];

        this._showDisplayAxis = true;
        dlg.style.top = `${buttonRect.bottom - r.top + 8}px`;
        dlg.style.left = `${buttonRect.left - r.left}px`;
        const r2 = dlg.getBoundingClientRect();
        if (r2.right > r.right) {
            dlg.style.left = `${Math.max(0, buttonRect.left - r.left - (r2.right - r.right))}px`;
        }
    }

    _showYAxesChanged(_showYAxes) {
        const set = new Set((_showYAxes || []).map(i => this.yAxes[i].id));

        this._primaryYAxes.forEach((axis, i) => this.set(`_primaryYAxes.${i}.hide`, !set.has(axis.id)));
        this._secondaryYAxes.forEach((axis, i) => this.set(`_secondaryYAxes.${i}.hide`, !set.has(axis.id)));

        // Axes sometimes needs a push to find the correct size
        requestAnimationFrame(() => [...this.$['chart-layout'].querySelectorAll('[part=yaxis],[part=yaxis2]')].forEach(el => el.refresh()));
    }
};

customElements.define(PTCS.ChartCombo.is, PTCS.ChartCombo);
