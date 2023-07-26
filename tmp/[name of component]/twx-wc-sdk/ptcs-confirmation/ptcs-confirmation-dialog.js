import {PolymerElement, html} from '@polymer/polymer/polymer-element.js';
import 'ptcs-hbar/ptcs-hbar.js';
import 'ptcs-vbar/ptcs-vbar.js';
import 'ptcs-button/ptcs-button.js';
import 'ptcs-icons/cds-icons.js';
import 'ptcs-label/ptcs-label.js';
import {PTCS} from 'ptcs-library/library.js';
import 'ptcs-behavior-styleable/ptcs-behavior-styleable.js';
import 'ptcs-modal-overlay/ptcs-modal-overlay.js';
import 'ptcs-behavior-focus/ptcs-behavior-focus.js';

PTCS.ConfirmationDialog = class extends PTCS.BehaviorFocus(PTCS.BehaviorStyleable(PTCS.ThemableMixin(PolymerElement))) {
    static get template() {
        return html`
        <style>

            [part=close-button][no-close-button] {
                display: none;
            }

            [part=secondary-button] {
                display: none;
            }

            [part=root] { /* Root of the dialog, used to position it centered and above the opaque background  */
                z-index: 25000;
                position: absolute;
                top: 0;
                left: 0;
                bottom: 0;
                right: 0;
                display: flex;
                align-items: center;
                justify-content: center;
          }

            [part=dialog] { /* The dialog itself */
                position: fixed;
                background-color: white;
                display: flex;
                flex-direction: column;
                padding: 24px;
            }

            [part=message-container] {
                padding-right: 18px;
                padding-left: 18px;
                align-self: flex-start;
                flex-shrink: 10;
                display: flex;
                flex-direction: column;
                min-height: 0px;
            }

            [part=title] {
                padding-bottom: 16px;
                min-width: 0px;
            }

            [part=message-wrapper] {
                flex-shrink: 100;
                overflow: auto;
            }

            [part=message] {
                padding-right: 8px;
                min-width: 0px;
            }

            [part=buttons-container] {
                padding-top: 16px;
                padding-right: 18px;
                padding-left: 18px;
                margin-top: auto;
                display: flex;
                justify-content: flex-end;
            }

            [part=buttons-wrapper] {
                display: flex;
            }

            [part=buttons-wrapper].reverse { /* to toggle the Primary Action Position */
                flex-direction: row-reverse;
            }

            ptcs-button[variant=secondary],
            ptcs-button[variant=tertiary],
            ptcs-button[variant=danger],
            ptcs-button[variant=transparent] {
                margin-left: 16px;
            }

            ptcs-button[variant=secondary].reverse,
            ptcs-button[variant=tertiary].reverse,
            ptcs-button[variant=danger].reverse,
            ptcs-button[variant=transparent].reverse {
                margin-right: 16px;
                margin-left: 0px;
            }

        </style>
        <ptcs-modal-overlay part="overlay"></ptcs-modal-overlay>
        <div id="root" part="root">
            <div id="dialog" class="dialog" part="dialog">
                <ptcs-hbar end="">
                    <ptcs-button variant="small" exportparts\$="[[_exportclose]]" id="close" part="close-button"
                    mode="icon" icon="cds:icon_close_mini" no-close-button\$="[[!displayCloseButton]]"
                    on-click="cancelAction"  tooltip="[[closeButtonTooltipField]]" tabindex=4>
                    </ptcs-button>
                </ptcs-hbar>
                <div part="message-container">
                    <ptcs-label part="title" id="dlg-title" label="[[titleText]]" variant="header"  hidden$="[[_isEmpty(titleText)]]" multi-line>
                    </ptcs-label>
                    <div part="message-wrapper" id="message-wrapper" hidden$="[[_isEmpty(messageText)]]">
                        <ptcs-label part="message" id="dlg-msg" label="[[messageText]]" variant="body" multi-line>
                        </ptcs-label>
                    </div>
                </div>
                <div part="buttons-container" class$="[[_clsButtons(actionPosition)]]">
                    <div part="buttons-wrapper" class$="[[_clsButtons(actionPosition)]]">
                        <ptcs-button id="primary-button" variant="[[primaryButtonStyle]]"
                            exportparts\$="[[_exportprimary]]"
                            part="primary-button" on-click="primaryAction" label="[[primaryActionLabel]]" class$="[[_clsButtons(actionPosition)]]"
                            icon="[[primaryActionIcon]]" tooltip="[[actionButtonTooltipField]]" tooltip-icon="[[actionButtonTooltipIcon]]"
                            tabindex=1>
                        </ptcs-button>
                        <ptcs-button id="secondary-button" variant="tertiary" part="secondary-button"
                            exportparts\$="[[_exporttertiary]]"
                            on-click="secondaryAction" label="[[secondaryActionLabel]]" class$="[[_clsButtons(actionPosition)]]"
                            icon="[[secondaryActionIcon]]" tooltip="[[secondButtonTooltipField]]" tooltip-icon="[[secondButtonTooltipIcon]]"
                            tabindex=2>
                        </ptcs-button>
                        <ptcs-button id="cancel-button" variant="secondary" exportparts\$="[[_exportsecondary]]"
                            part="cancel-button" on-click="cancelAction" label="[[cancelActionLabel]]" class$="[[_clsButtons(actionPosition)]]"
                            icon="[[cancelActionIcon]]" tooltip="[[cancelButtonTooltipField]]" tooltip-icon="[[cancelButtonTooltipIcon]]"
                            tabindex=3>
                        </ptcs-button>
                    </div>
                </div>
            </div>
        </div>`;
    }

    static get is() {
        return 'ptcs-confirmation-dialog';
    }

    static get properties() {
        return {
            mode: {
                type:     String,
                value:    'closed',
                observer: '_modeHandler'
            },
            confWidth: {
                type:     String,
                value:    '600px',
                observer: '_dialogWidth'
            },
            confHeight: {
                type:     String,
                value:    '260px',
                observer: '_dialogHeight'
            },
            displaySecondaryAction: {
                type: Boolean
            },
            displayCloseButton: {
                type: Boolean
            },
            hideCancelAction: {
                type: Boolean
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

            _exportclose: {
                type:     String,
                readOnly: true,
                value:    PTCS.exportparts('close-button-', PTCS.Button)
            },

            _exportprimary: {
                type:     String,
                readOnly: true,
                value:    PTCS.exportparts('primary-button-', PTCS.Button)
            },

            _exporttertiary: {
                type:     String,
                readOnly: true,
                value:    PTCS.exportparts('tertiary-button-', PTCS.Button)
            },

            _exportsecondary: {
                type:     String,
                readOnly: true,
                value:    PTCS.exportparts('secondary-button-', PTCS.Button)
            }
        };
    }

    ready() {
        super.ready();

        // Keyboard navigation
        this.addEventListener('keydown', this._keyDown.bind(this));
    }

    _keyDown(ev) {
        const key = ev.key;

        if (key === 'Escape') {
            this.cancelAction();
            return;
        }
    }

    _isEmpty(str) {
        return (!str);
    }

    primaryAction() {
        this.dispatchEvent(new CustomEvent('primary-action'), {
            bubbles:  true,
            composed: true
        });
    }

    secondaryAction() {
        this.dispatchEvent(new CustomEvent('secondary-action'), {
            bubbles:  true,
            composed: true
        });
    }

    cancelAction() {
        this.dispatchEvent(new CustomEvent('close-action'), {
            bubbles:  true,
            composed: true
        });
    }

    _clsButtons(actionPosition) {
        return actionPosition.toLowerCase() === 'right' ? 'reverse' : '';
    }

    _dialogWidth(confWidth) {
        let num = 600;
        let padding = 24 * 2;
        if (confWidth) {
            num = parseInt(confWidth);
        }
        num -= padding;
        this.$.dialog.style.width = num + 'px';
        // setting max width for labels, for IE11 label bug
        num = num - 36;
        this.$['message-wrapper'].style.maxWidth = num + 'px';
        this.$['dlg-title'].style.maxWidth = num + 'px';
    }

    _dialogHeight(confHeight) {
        let padding = 24 * 2;
        let num = 260;
        if (confHeight) {
            num = parseInt(confHeight);
        }
        num -= padding;
        this.$.dialog.style.height = num + 'px';
    }

    _manualTabKeyNavigation(ev) {
        const key = ev.which || ev.keyCode;
        const thisWidget = ev.target;
        const lastLoopComponent = thisWidget.displayCloseButton ? thisWidget.$['close'] : thisWidget.$['cancel-button'];
        if (!ev.shiftKey && key === 9 && thisWidget.shadowRoot.activeElement === lastLoopComponent) {
            thisWidget.$['primary-button'].focus();
            ev.preventDefault();
        }
        if (ev.shiftKey && key === 9 && thisWidget.shadowRoot.activeElement === thisWidget.$['primary-button']) {
            lastLoopComponent.focus();
            ev.preventDefault();
        }
    }

    _modeHandler(mode) {
        if (mode === 'open') {
            var thisWidget = this;
            setTimeout(function() {
                var dialogWidth = thisWidget.$.dialog.style.width ? parseInt(thisWidget.$.dialog.style.width) : 600;

                var numOfButtons = (thisWidget.displaySecondaryAction) ? 3 : 2;
                if (thisWidget.hideCancelAction) {
                    --numOfButtons;
                }

                var primaryButtonWidth = (thisWidget.$['primary-button'].getBoundingClientRect().width)
                    ? Math.ceil(thisWidget.$['primary-button'].getBoundingClientRect().width) : 0;
                var secondaryButtonWidth = thisWidget.$['secondary-button'].getBoundingClientRect().width
                    ? Math.ceil(thisWidget.$['secondary-button'].getBoundingClientRect().width) : 0;
                var cancelButtonWidth = thisWidget.$['cancel-button'].getBoundingClientRect().width
                    ? Math.ceil(thisWidget.$['cancel-button'].getBoundingClientRect().width) : 0;
                var maxWidth = Math.max(primaryButtonWidth, secondaryButtonWidth, cancelButtonWidth);
                // total - dialog side padding - buttons in between margins
                var maxAllowedWidth = (dialogWidth - 36 - (16 * (numOfButtons - 1))) / numOfButtons;
                if (maxWidth > maxAllowedWidth) {
                    maxWidth = maxAllowedWidth;
                }
                const primaryButton = thisWidget.$['primary-button'];
                primaryButton.style.width = maxWidth + 'px';
                thisWidget.$['secondary-button'].style.width = maxWidth + 'px';
                thisWidget.$['cancel-button'].style.width = maxWidth + 'px';
                primaryButton.__disabledTooltipOnfocus = true;
                primaryButton.focus();
                primaryButton.addEventListener('blur', () => {
                    delete primaryButton.__disabledTooltipOnfocus;
                }, {once: true});
                thisWidget.addEventListener('keydown', thisWidget._manualTabKeyNavigation);
            }, 50);
        } else {
            this.$['primary-button'].style.width = '';
            this.$['secondary-button'].style.width = '';
            this.$['cancel-button'].style.width = '';
            this.removeEventListener('keydown', this._manualTabKeyNavigation);
        }
    }
};

customElements.define(PTCS.ConfirmationDialog.is, PTCS.ConfirmationDialog);
