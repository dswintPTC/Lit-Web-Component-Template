import {PolymerElement, html} from '@polymer/polymer/polymer-element.js';
import {PTCS} from 'ptcs-library/library.js';
import 'ptcs-behavior-styleable/ptcs-behavior-styleable.js';
import 'ptcs-behavior-tabindex/ptcs-behavior-tabindex.js';
import './ptcs-confirmation-dialog.js';

PTCS.Confirmation = class extends PTCS.BehaviorTabindex(PTCS.BehaviorStyleable(PTCS.ThemableMixin(PolymerElement))) {
    static get template() {
        return html`
        <style>
            :host {
                display: none;
            }
        </style>
        <ptcs-confirmation-dialog mode="[[mode]]" part="popdialog" title-text="[[titleText]]"
        message-text="[[messageText]]" display-close-button="[[displayCloseButton]]"
        display-secondary-action="[[displaySecondaryAction]]" primary-action-label="[[primaryActionLabel]]"
        primary-button-style="[[primaryButtonStyle]]" action-button-tooltip-field="[[actionButtonTooltipField]]"
        secondary-action-label="[[secondaryActionLabel]]" second-button-tooltip-field="[[secondButtonTooltipField]]"
        primary-action-icon="[[primaryActionIcon]]" secondary-action-icon="[[secondaryActionIcon]]" cancel-action-icon="[[cancelActionIcon]]"
        action-button-tooltip-icon="[[actionButtonTooltipIcon]]" second-button-tooltip-icon="[[secondButtonTooltipIcon]]"
        cancel-button-tooltip-icon="[[cancelButtonTooltipIcon]]" cancel-action-label="[[cancelActionLabel]]"
        cancel-button-tooltip-field="[[cancelButtonTooltipField]]" close-button-tooltip-field="[[closeButtonTooltipField]]"
        action-position="[[actionPosition]]" on-primary-action="_primary" on-secondary-action="_secondary"
        on-close-action="close" conf-width="[[confWidth]]" conf-height="[[confHeight]]" hide-cancel-action="[[hideCancelAction]]">
        </ptcs-confirmation-dialog>
`;
    }

    static get is() {
        return 'ptcs-confirmation';
    }

    static get properties() {
        return {

            mode: {
                type:               String,
                value:              'closed',
                reflectToAttribute: true,
                observer:           '_modeHandler'
            },

            titleText: {
                type:               String,
                value:              '',
                reflectToAttribute: true
            },

            messageText: {
                type:               String,
                value:              '',
                reflectToAttribute: true
            },

            actionPosition: {
                type:  String,
                value: 'left'
            },

            displayCloseButton: {
                type:  Boolean,
                value: false
            },

            primaryButtonStyle: {
                type:  String,
                value: 'primary' /* primary or danger */
            },

            primaryActionIcon: {
                type:  String,
                value: null
            },

            cancelActionIcon: {
                type:  String,
                value: null
            },

            secondaryActionIcon: {
                type:  String,
                value: null
            },

            displaySecondaryAction: {
                type:     Boolean,
                value:    false,
                observer: '_toggleSecondaryActionButtonDisplay'
            },

            /* Button text labels */
            primaryActionLabel: {
                type:  String,
                value: null
            },

            secondaryActionLabel: {
                type:  String,
                value: null
            },

            hideCancelAction: {
                type:     Boolean,
                value:    false,
                observer: '_toggleCancelActionDisplay'
            },

            cancelActionLabel: {
                type:  String,
                value: null
            },
            confWidth: {
                type:  String,
                value: '600px'
            },
            confHeight: {
                type:  String,
                value: '260px'
            },

            actionButtonTooltipField: {
                type:  String,
                value: null
            },
            actionButtonTooltipIcon: {
                type:  String,
                value: null
            },
            secondButtonTooltipField: {
                type:  String,
                value: null
            },
            secondButtonTooltipIcon: {
                type:  String,
                value: null
            },
            closeButtonTooltipField: {
                type:  String,
                value: null
            },
            cancelButtonTooltipField: {
                type:  String,
                value: null
            },
            cancelButtonTooltipIcon: {
                type:  String,
                value: null
            },

        };
    }

    connectedCallback() {
        super.connectedCallback();
        if (this._dialog) {
            this._dialog.__saSa = this.__saSa;
            document.body.appendChild(this._dialog);
        }
    }

    disconnectedCallback() {
        if (this._dialog) {
            document.body.removeChild(this._dialog);
        }
        super.disconnectedCallback();
    }

    _initDialog() {
        if (!this._dialog) {
            var uniqueSuffixForId = performance.now().toString().replace('.', '');
            var dialog = this.shadowRoot.querySelector('ptcs-confirmation-dialog');
            dialog.remove();
            dialog.__saSa = this.__saSa;
            this._dialog = document.body.appendChild(dialog);
            this._dialogId = 'ptcs-confirmation-dialog-' + uniqueSuffixForId;
            this._dialog.setAttribute('id', this._dialogId);
        }
    }

    _toggleSecondaryActionButtonDisplay(val) {
        this._initDialog();
        var el = this._dialog.$['secondary-button'];
        el.style.display = val ? 'inline-flex' : 'none';
    }

    _toggleCancelActionDisplay(val) {
        this._initDialog();
        const el = this._dialog.$['cancel-button'];
        el.style.display = val ? 'none' : 'inline-flex';
    }

    _modeHandler(val) {
        this._initDialog();

        if (val === 'open') {
            this._dialog.style.display = 'block';
        } else {
            this._dialog.style.display = 'none';
        }
    }

    open() {
        this.mode = 'open';
    }

    _primary() {
        this.dispatchEvent(new CustomEvent('primary-action'), {
            bubbles:  true,
            composed: true
        });
        this.mode = 'closed';
    }

    _secondary() {
        this.dispatchEvent(new CustomEvent('secondary-action'), {
            bubbles:  true,
            composed: true
        });
        this.mode = 'closed';
    }

    close() {
        this.dispatchEvent(new CustomEvent('close-action'), {
            bubbles:  true,
            composed: true
        });
        this.mode = 'closed';
    }
};

customElements.define(PTCS.Confirmation.is, PTCS.Confirmation);
