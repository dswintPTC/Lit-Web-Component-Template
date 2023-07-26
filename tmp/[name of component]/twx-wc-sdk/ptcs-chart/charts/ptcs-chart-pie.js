import {PolymerElement, html} from '@polymer/polymer/polymer-element.js';
import {PTCS} from 'ptcs-library/library.js';
import '../axes/library-axis-ticks.js';
import {BehaviorChart} from '../ptcs-behavior-chart.js';
import 'ptcs-behavior-styleable/ptcs-behavior-styleable.js';
import 'ptcs-behavior-focus/ptcs-behavior-focus.js';
import 'ptcs-behavior-tabindex/ptcs-behavior-tabindex.js';

import 'ptcs-toolbar/ptcs-toolbar.js';
import 'ptcs-label/ptcs-label.js';
import '../ptcs-chart-layout.js';
import '../ptcs-chart-legend.js';
import '../ptcs-chart-state.js';
import './ptcs-chart-core-pie.js';


PTCS.ChartPie = class extends BehaviorChart(PTCS.BehaviorTabindex(PTCS.BehaviorFocus(PTCS.BehaviorStyleable(PTCS.ThemableMixin(PolymerElement))))) {
    static get template() {
        return html`
        <style>
        :host {
            display: block;
        }

        :host([disabled]) {
            pointer-events: none;
        }

        [part=legend-area] {
            width: 100%;
            height: 100%;
        }

        [part=chart] {
            position: relative;
        }

        :host(:focus) {
            outline: none;
        }
        </style>

        <ptcs-chart-layout id="chart-layout" style="height:100%" part="chart-layout"
                           title-pos="[[titlePos]]" hide-title="[[!titleLabel]]"
                           notes-pos="[[notesPos]]" notes-align="[[notesAlign]]" hide-notes="[[_hideNotes(notesLabel, hideNotes)]]"
                           legend-pos="[[legendPos]]" hide-legend="[[_hideLegend(hideLegend, _legend)]]"
                           eff-legend-pos="{{effLegendPos}}"
                           spark-view="[[sparkView]]"
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
            <ptcs-chart-core-pie id="chart" slot="chart" part="core-chart"
                tabindex\$="[[_delegatedFocus]]"
                data="[[_data]]"
                value-format-specifier="[[valueFormatSpecifier]]"
                legend="[[_legend]]"
                tooltip-template="[[tooltipTemplate]]"
                filter-legend="[[_selectedLegend]]"
                donut="[[donut]]"
                polar="[[polar]]"
                pad-angle="[[padAngle]]"
                start-angle="[[startAngle]]"
                end-angle="[[endAngle]]"
                corner-radius="[[cornerRadius]]"
                highlight-selection="[[highlightSelection]]"
                show-values="[[_showValues(sparkView, showValues)]]"
                value-pos="[[valuePos]]"
                percent-label="[[percentLabel]]"
                inside-label-show-hide="[[insideLabelShowHide]]"
                single-inside-value-label-type="[[singleInsideValueLabelType]]"
                selection-mode="[[selectionMode]]"
                on-chart-selection="_onSelectionChanged"
                chart-state-data-error="{{_chartStateDataError}}"
                chart-state-data-empty="{{_chartStateDataEmpty}}"></ptcs-chart-core-pie>
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
                    horizontal="[[_horizLegend(effLegendPos)]]"
                    max-width="[[legendMaxWidth]]"
                    align="[[legendAlign]]"
                    disabled="[[disabled]]"
                    selected="{{_selectedLegend}}"></ptcs-chart-legend>
            </div>
        </ptcs-chart-layout>`;
    }

    static get is() {
        return 'ptcs-chart-pie';
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

            hideLegend: {
                type: Boolean
            },

            // Names of legend items, if legend should be visible
            // Generated from data
            _legend: {
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

            // Legend itemss currently selected in the legend component
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

            legendMaxWidth: {
                type: Number
            },

            // 'none' || 'single' || 'multiple'
            selectionMode: {
                type: String
            },

            // Current selection in chart
            _chartSelection: {
                type: Object
            },

            donut: {
                type: Number
            },

            polar: {
                type: Boolean
            },

            padAngle: {
                type: Number
            },

            startAngle: {
                type: Number
            },

            endAngle: {
                type: Number
            },

            cornerRadius: {
                type: Number
            },

            // highlight the selected selection
            highlightSelection: Boolean,

            showValues: {
                type: Boolean
            },

            // value Position: marker || in || out || out with line
            valuePos: String,

            percentLabel: Boolean,

            insideLabelShowHide: Boolean,

            // Single Inside Value Label Type type: caption || body || label || title || large-title || sub-header || header || large-header
            singleInsideValueLabelType: String,

            // Specified chart data
            data: {
                type: Array
            },

            // chart data formated
            _data: {
                type: Array
            },

            tooltipTemplate: {
                type: String
            },

            // label type: number || date || string
            valueLabelType: String,

            labelNumberFormatSpecifier: String,

            labelDateFormatToken: String,

            valueFormatSpecifier: String,

            _delegatedFocus: String
        };
    }

    static get observers() {
        return [
            '_dataChanged(data.*, valueLabelType, labelNumberFormatSpecifier, labelDateFormatToken)'
        ];
    }

    static get _rightActions() {
        // Remove zoom buttons
        const set = new Set(['zoom-in', 'zoom-out', 'reset']);
        return Object.getPrototypeOf(this)._rightActions.filter(item => !set.has(item.id));
    }

    ready() {
        super.ready();
        if (this.titleLabel === undefined) {
            this.titleLabel = null;
        }
        if (this.notesLabel === undefined) {
            this.notesLabel = null;
        }
    }

    _gcTabindex(_delegatedFocus, _hideToolbar) {
        return _hideToolbar ? false : _delegatedFocus;
    }

    _tabindex(filterLegend, _delegatedFocus) {
        return filterLegend ? _delegatedFocus : false;
    }

    _hideNotes(nodesLabel, hideNotes) {
        return !nodesLabel || hideNotes;
    }

    _hideChartState(chartState) {
        return chartState !== 'data';
    }

    _hideLegend(hideLegend, _legend) {
        return hideLegend || !(_legend instanceof Array) || !(_legend.length > 0);
    }

    _horizLegend(effLegendPos) {
        return effLegendPos === 'top' || effLegendPos === 'bottom';
    }

    _getHorizontalAlignment(pos, align) {
        if (pos === 'top' || pos === 'bottom') {
            return align;
        }

        return 'start';
    }

    _showValues(sparkView, showValues) {
        return !sparkView && showValues;
    }

    // Someting has changed in the data
    _dataChanged(cr) {
        if (this.__changeOn) {
            return;
        }
        this.__changeOn = true;
        requestAnimationFrame(() => {
            let formater;
            let defaultLabel = '';
            if (this.valueLabelType === 'number') {
                formater = PTCS.formatNumber(this.labelNumberFormatSpecifier);
                defaultLabel = 0;
            } else if (this.valueLabelType === 'date') {
                formater = PTCS.formatDate(this.labelDateFormatToken);
            } else {
                formater = v => v;
            }
            this.__changeOn = false;
            this._data = (this.data instanceof Array
                ? this.data
                : []).map(item => [formater(item[0] || defaultLabel).toString(), item[1], item[2], item[3]]);
            this._legend = (this._data).map(item => ({
                label:    item[0],
                depfield: item[2] && /* istanbul ignore next */ item[2][0] ? /* istanbul ignore next */ item[2][0] : item[1][0]
            }));
        });
    }

    _resetToDefaultValues() {
        this.$.legend._resetToDefaultValues();
    }

    refreshData() {
        this.$.chart.refreshData();
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
        this.dispatchEvent(new CustomEvent('selected-data-changed', {
            bubbles:  true,
            composed: true,
            detail:   this._chartSelection || []
        }));
    }
};

customElements.define(PTCS.ChartPie.is, PTCS.ChartPie);
