import {PolymerElement, html} from '@polymer/polymer/polymer-element.js';
import {PTCS} from 'ptcs-library/library.js';
import '@polymer/polymer/lib/elements/dom-repeat.js';
import 'ptcs-behavior-styleable/ptcs-behavior-styleable.js';

const STATE_DATA = 'data';
const STATE_LOADING = 'loading';
const STATE_LOADING_SILENT = 'loading-silent';
const STATE_NO_DATA = 'no-data';
const STATE_EMPTY = 'empty';
const STATE_ERROR = 'error';

PTCS.ChartState = class extends PTCS.BehaviorStyleable(PTCS.ThemableMixin(PolymerElement)) {
    static get template() {
        return html`
    <style>
    :host {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
    }

    :host([chart-state=data]) {
        display: none;
    }

    :host([chart-state=loading]) [part=icon] {
        width: 50%;
        height: 50%;

        background-size: 300% 100%;
        background-image: linear-gradient(90deg, rgba(190, 190, 190, 0.2) 25%, rgba(129, 129, 129, 0.24) 37%, rgba(190, 190, 190, 0.2) 63%);

        animation-direction: reverse;
        animation-timing-function: ease;
        animation-duration: 3s;
        animation-iteration-count: infinite;
        animation-name: animationMoveRight;
    }

    @keyframes animationMoveRight {
        0% {
            background-position: 0%;
        }
        100% {
            background-position: 100%;
        }
    }
    </style>

    <ptcs-icon id="icon" part="icon" icon="[[_setIcon(chartState, iconLoading, iconNoData, iconEmpty, iconError)]]"></ptcs-icon>
    <ptcs-label part="label" variant="label" label="[[_setLabel(chartState, labelNoData, labelEmpty, labelError)]]"></ptcs-label>`;
    }

    static get is() {
        return 'ptcs-chart-state';
    }

    static get properties() {
        return {
            // 'data', 'loading', 'loading-silent', 'no-data', 'error'
            chartStateExt: {
                type: String
            },

            chartStateDataError: {
                type: Boolean
            },

            chartStateDataEmpty: {
                type: Boolean
            },

            // 'data', 'loading', 'no-data', 'empty', 'error'
            chartState: {
                type:               String,
                value:              'data',
                readOnly:           true,
                notify:             true,
                computed:           '_updateChartState(chartStateExt, chartStateDataError, chartStateDataEmpty)',
                reflectToAttribute: true
            },

            iconLoading: {
                type: String
            },

            labelNoData: {
                type: String
            },

            iconNoData: {
                type: String
            },

            labelEmpty: {
                type: String
            },

            iconEmpty: {
                type: String
            },

            labelError: {
                type: String
            },

            iconError: {
                type: String
            }
        };
    }

    ready() {
        super.ready();
    }

    _updateChartState(chartStateExt, chartStateDataError, chartStateDataEmpty) {
        let _state;
        switch (chartStateExt) {
            case STATE_LOADING:
            case STATE_LOADING_SILENT:
            case STATE_NO_DATA:
            case STATE_ERROR:
                _state = chartStateExt;
                break;
            case STATE_DATA:
            default:
                if (chartStateDataError) {
                    _state = STATE_ERROR;
                } else if (chartStateDataEmpty) {
                    _state = STATE_EMPTY;
                } else {
                    _state = STATE_DATA;
                }
                break;
        }
        return _state;
    }

    _setLabel(chartState, labelNoData, labelEmpty, labelError) {
        let label;
        switch (chartState) {
            case STATE_NO_DATA:
                label = labelNoData;
                break;
            case STATE_EMPTY:
                label = labelEmpty;
                break;
            case STATE_ERROR:
                label = labelError;
                break;
            case STATE_DATA:
            case STATE_LOADING_SILENT:
            default:
                label = '';
                break;
        }
        return label;
    }

    _setIcon(chartState, iconLoading, iconNoData, iconEmpty, iconError) {
        let icon;
        switch (chartState) {
            case STATE_LOADING:
                icon = iconLoading;
                break;
            case STATE_NO_DATA:
                icon = iconNoData;
                break;
            case STATE_EMPTY:
                icon = iconEmpty;
                break;
            case STATE_ERROR:
                icon = iconError;
                break;
            case STATE_DATA:
            case STATE_LOADING_SILENT:
            default:
                icon = '';
                break;
        }
        return icon;
    }
};

customElements.define(PTCS.ChartState.is, PTCS.ChartState);
