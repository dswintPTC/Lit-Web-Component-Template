import {LitElement, html, css} from 'lit';
import {L2Pw} from 'ptcs-library/library-lit';
import {PTCS} from 'ptcs-library/library.js';
import 'ptcs-behavior-binary/ptcs-behavior-binary.js';
import 'ptcs-behavior-styleable/ptcs-behavior-styleable.js';
import 'ptcs-behavior-focus/ptcs-behavior-focus.js';
import 'ptcs-behavior-tooltip/ptcs-behavior-tooltip.js';
import 'ptcs-behavior-validate/ptcs-behavior-validate.js';
import 'ptcs-behavior-tabindex/ptcs-behavior-tabindex.js';
import 'ptcs-label/ptcs-label.js';

// PTCS.radiobuttonMap[radiogroup] = <selected radio button in group>
PTCS.radiobuttonMap = {};

PTCS.Simpleradio = class extends PTCS.BehaviorTabindex(PTCS.BehaviorValidate(PTCS.BehaviorTooltip(PTCS.BehaviorFocus(
    PTCS.BehaviorStyleable(/*PTCS.ThemableMixin(*/PTCS.BehaviorBinary(L2Pw(LitElement))/*)*/))))) {
    static get styles() {
        return css`
        :host {
          cursor: pointer;
          display: inline-flex;
          flex-direction: column;

          min-width: 34px;
          min-height: 19px;

          box-sizing: border-box;
        }

        :host([hidden]) {
          display: none;
        }

        .cntr {
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          white-space: nowrap;
          overflow: hidden;
        }

        [part=circle] {
          min-width: 14px;
          margin-right: 8px;
        }

        [part=label] {
          white-space: normal;
          flex-wrap: wrap;

          min-height: unset;
          min-width: unset;
        }

        :host(:not([checked]):not(:hover)) [part="interior-button"] {
          fill: transparent;
        }`;
    }
    render() {
        return html`<div id="cntr" class="cntr">
        <svg part="circle" height="14px" width="14px" viewBox="0 0 14 14">
            <circle part="exterior-ring" cx="7" cy="7" r="6" stroke-width="1" fill="transparent"></circle>
            <circle part="interior-button" cx="7" cy="7" r="3" stroke-width="0" fill="transparent"></circle>
        </svg><ptcs-label part="label" .maxWidth=${this.labelMaxWidth} multi-line="" .label=${this.label}></ptcs-label></div>`;
    }

    static get is() {
        return 'ptcs-radio';
    }

    static get properties() {
        return {
            radiogroup: {
                type:     String,
                value:    '',
                observer: '_radiogroupChanged'
            },

            preventAutoSelect: {
                type:      Boolean,
                attribute: 'prevent-auto-select',
            },

            label: {
                type:     String,
                value:    'Radio Button',
                observer: '_adjustMessageElementWidth'
            },

            labelMaxWidth: {
                type:      String,
                attribute: 'label-max-width',
                value:     '',
                src:       'maxWidth'
            },

            disabled: {
                type:    Boolean,
                value:   false,
                reflect: true
            },

            // ARIA attributes
            ariaChecked: {
                type:      String,
                attribute: 'aria-checked',
                computed:  '_compute_ariaChecked(checked)',
                reflect:   true,
                validate:  '_validateRadio(required, radiogroup, extraValidation)'
            },

            ariaDisabled: {
                type:      String,
                attribute: 'aria-disabled',
                computed:  '_compute_ariaDisabled(disabled)',
                reflect:   true
            },

            role: {
                type:    String,
                value:   'radio',
                reflect: true
            },

            // FocusBehavior should simulate a click event when space is pressed
            _spaceActivate: {
                type:     Boolean,
                value:    true,
                readOnly: true
            },

            // Handles its own focus styling - no need for FocusBehavior to track its position
            _ownFocusStyling: {
                type:     Boolean,
                value:    true,
                readOnly: true
            },

            // Validation properties
            required: {
                type:    Boolean,
                isValue: required => !!required
            },

            // Custom validation function that complements the existing client-side validation
            extraValidation: {
                type: Function
            }
        };
    }

    ready() {
        super.ready();
        this.addEventListener('click', this._onClick.bind(this));
        this.tooltipFunc = this.hideIfTooltipEqualsLabel;

        // Unless otherwise specified, a radio should not start validation until the user has interacted with it
        // Note that both keyboard and mouse interaction comes as a click event
        if (this._stayUnvalidated === undefined) {
            this._stayUnvalidated = true;
        }
    }

    connectedCallback() {
        super.connectedCallback();
        if (this.checked) {
            this._checkedChanged(this.checked);
        } else if (!this.preventAutoSelect && this.radiogroup && !PTCS.radiobuttonMap[this.radiogroup]) {
            this.checked = true;
        }
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        // Remove from PTCS.radiobuttonMap
        if (this.checked && this.radiogroup && PTCS.radiobuttonMap[this.radiogroup] === this) {
            PTCS.radiobuttonMap[this.radiogroup] = null;
        }
    }

    _radiogroupChanged(radiogroup, old) {
        if (old && old !== radiogroup && PTCS.radiobuttonMap[old] === this) {
            PTCS.radiobuttonMap[old] = null;
        }
        if (radiogroup && this.checked) {
            const curr = PTCS.radiobuttonMap[radiogroup];
            if (curr && curr !== this) {
                curr.checked = false;
            }
            PTCS.radiobuttonMap[radiogroup] = this;
        }
    }

    _checkedChanged(checked) {
        super._checkedChanged(checked);
        if (!this.radiogroup) {
            return;
        }
        const curr = PTCS.radiobuttonMap[this.radiogroup];
        if (checked) {
            if (curr !== this) {
                if (curr) {
                    curr.checked = false;
                }
                PTCS.radiobuttonMap[this.radiogroup] = this;
            }
        } else if (curr === this) {
            PTCS.radiobuttonMap[this.radiogroup] = null;
        }
    }

    _onClick(ev) {
        if (this.disabled || this.isIDE || PTCS.wrongMouseButton(ev) || this.isValidationMessageEvent(ev)) {
            return;
        }
        this._stayUnvalidated = false; // radio button has been interacted with via click or keyboard selection
        this.checked = true;
        ev.preventDefault();
    }

    _compute_ariaChecked(checked) {
        return checked ? 'true' : false;
    }

    _compute_ariaDisabled(disabled) {
        return disabled ? 'true' : false;
    }

    _adjustMessageElementWidth() {
        const cntrR = this.$.cntr.getBoundingClientRect();
        this.setValidationMessageMaxWidth(cntrR.width);
    }

    _insertValidationMessage(messageElement) {
        this._adjustMessageElementWidth();

        this.shadowRoot.appendChild(messageElement);
    }

    _validateRadio(required, radiogroup, extraValidation) {
        // Pass the radio component as argument to extraValidation function, if it exists
        let extraValidationRes = typeof extraValidation === 'function' ? extraValidation(this) : undefined;
        return new Promise(resolve => {
            Promise.resolve(extraValidationRes).then(v => {
                if (v === false) {
                    resolve(false);
                }
                if (!required && !v) {
                    resolve(undefined); // No validation enabled
                }
                if (radiogroup) {
                    // No radio group selected?
                    if (PTCS.radiobuttonMap[this.radiogroup] === null) {
                        this._stayUnvalidated = true;
                        resolve(true);
                    }
                    // If self is not checked is some button in the group selected?
                    if (!this.checked && PTCS.radiobuttonMap[radiogroup] && PTCS.radiobuttonMap[radiogroup].checked) {
                        this._stayUnvalidated = true; // Revert to neutral display when self is not selected
                        resolve(true);
                    }

                }
                resolve(this.checked);
            });
        });
    }

};

customElements.define(PTCS.Simpleradio.is, PTCS.Simpleradio);
