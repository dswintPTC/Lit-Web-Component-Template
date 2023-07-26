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

PTCS.Checkbox = class extends PTCS.BehaviorTabindex(PTCS.BehaviorValidate(PTCS.BehaviorTooltip(PTCS.BehaviorFocus(
    PTCS.BehaviorStyleable(/*PTCS.ThemableMixin(*/PTCS.BehaviorBinary(L2Pw(LitElement))/*)*/), ['checked'])))) {
    static get styles() {
        return css`
      :host {
        display: inline-flex;
        flex-direction: column;
        flex-wrap: nowrap;
        align-items: left;
        cursor: pointer;
        user-select: none;
        box-sizing: border-box;
        overflow: hidden;
      }

      .cntr {
        display: inline-flex;
        flex-direction: row;
        align-items: center;

        flex: 1 1 auto;
      }

      :host([vertical-alignment=flex-start]) .cntr {
        align-items: flex-start;
      }

      :host([vertical-alignment=center]) .cntr {
        align-items: center;
      }

      :host([vertical-alignment=flex-end]) .cntr {
        align-items: flex-end;
      }

      :host([disabled]) {
        cursor: auto;
      }

      :host([_zero-padding]){
        padding-top: 0px;
        padding-bottom: 0px;
        min-height: 0px;
      }

      [part=label] {
          min-height: unset;
          min-width: unset;
          margin-left: 7px;
      }

      [part=box] {
        flex: 0 0 auto;
        position: relative;
        width: 14px;
        height: 14px;
        box-sizing: border-box;
      }

      .v-mark, .partial-mark {
        display: none;
      }

      :host([checked]:not([partial])) .v-mark,
      :host(:not([partial]):not([disabled])) .cntr:hover .v-mark {
        display: block;
      }

      :host([checked][partial]) .partial-mark,
      :host([partial]:not([disabled])) .cntr:hover .partial-mark {
        display: block;
      }

      [part=check-mark] {
          position: absolute;
          left: 0;
          top: 0;
          right: 0;
          bottom: 0;
      }`;
    }

    render() {
        return html`<div id="cntr" class="cntr">
        <div part="box">
        <svg part="check-mark" class="v-mark" viewBox="-1.5 -1.5 9 8">
            <g stroke="none" stroke-width="1" fill-rule="evenodd" transform="translate(-3, -3.5)">
            <path d="M9.1072275,4.12331278 C9.02508659,4.04117186 8.92523299,4 8.8077343,4 C8.69023562,4 8.59011159,4.04117186
            8.50803828,4.12331278 L5.61735424,7.01845879 L4.32202924,5.7184014 C4.23961791,5.63626049 4.13976431,5.59508862
            4.02226562,5.59508862 C3.90476693,5.59508862 3.80491333,5.63626049 3.7225696,5.7184014 L3.12331278,6.31759062
            C3.04117186,6.40000195 3,6.49978795 3,6.61735424 C3,6.73485293 3.04117186,6.83490935 3.12331278,6.91705026
            L4.7184014,8.51213888 L5.31786104,9.1113281 C5.40000195,9.19373944 5.49985556,9.23464088 5.61735424,9.23464088
            C5.73485293,9.23464088 5.83470653,9.19373944 5.91705026,9.1113281 L6.51630709,8.51213888 L9.70668715,5.32196164
            C9.78882806,5.23961791 9.82999992,5.13976431 9.82999992,5.02226562 C9.82999992,4.90476693 9.78882806,4.80491333
            9.70668715,4.722502 L9.1072275,4.12331278 Z"></path>
            </g>
        </svg>
        <svg part="check-mark" class="partial-mark" viewBox="0 0 13 13">
            <rect x="3" y="6" width="8" height="2"></rect>
        </svg>
        </div>
        <ptcs-label part="label" id="label" exportparts=${this._exportparts} .label=${this.label} ?hidden=${!this.label}
                    .multiLine=${!this.singleLine} .maxWidth=${this.maxWidth}px></ptcs-label>
        </div>`;
    }

    static get is() {
        return 'ptcs-checkbox';
    }

    static get properties() {
        return {
            partial: {
                type:    Boolean,
                value:   false,
                reflect: true
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
                validate:  '_validateCheckbox(required, extraValidation)'
            },

            ariaDisabled: {
                type:      String,
                attribute: 'aria-disabled',
                computed:  '_compute_ariaDisabled(disabled)',
                reflect:   true
            },

            label: {
                type:     String,
                value:    '',
                reflect:  true,
                observer: '_adjustMessageElementWidth'
            },

            maxWidth: {
                type:      String,
                attribute: 'max-width'
            },

            singleLine: {
                type:      Boolean,
                attribute: 'single-line',
                value:     false
            },

            _zeroPadding: {
                type:      Boolean,
                reflect:   true,
                // used to style with _zero-padding
                attribute: '_zero-padding'
            },

            // Validation properties
            required: {
                type:    Boolean,
                isValue: required => !!required
            },

            requiredMessage: {
                type:      String,
                attribute: 'required-message'
            },

            // Custom validation function that complements the existing client-side validation
            extraValidation: {
                type: Function
                // Does Function need an attribute definition?
                // attribute: 'extra-validation'
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

            verticalAlignment: {
                type:      String,
                attribute: 'vertical-alignment',
                reflect:   true
            },

            _exportparts: {
                type:     String,
                readOnly: true,
                value:    PTCS.exportparts('label-', PTCS.Label)
            }
        };
    }

    ready() {
        super.ready();
        this.addEventListener('click', ev => this._onClick(ev));
        // Use boilerplate function in ptcs-behavior-tooltip
        this.tooltipFunc = this.hideIfTooltipEqualsLabel;

        // Unless otherwise specified, a checkbox should not start validation until the user has interacted with it
        // Note that both keyboard and mouse interaction comes as a click event
        if (this._stayUnvalidated === undefined) {
            this._stayUnvalidated = true;
        }
    }

    connectedCallback() {
        super.connectedCallback();
        this._connected = true;
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this._connected = false;
    }

    _onClick(ev) {
        if (PTCS.wrongMouseButton(ev) || this.isValidationMessageEvent(ev)) {
            return;
        }
        if (!this.disabled && !this.isIDE) {
            this._stayUnvalidated = false; // User has interacted with checkbox
            this.checked = !this.checked;
            ev.preventDefault();
        }
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

        this.defaultInsertValidationMessageForVerticalLayout(messageElement);
    }

    _validateCheckbox(required, extraValidation, value) {
        let messages = [];

        if (required && !value) {
            messages.push(this.requiredMessage);
        }

        if (messages.length) {
            return messages;
        }

        // All standard validation has succeeded. Leave final say to the custom validation, if any
        return typeof extraValidation === 'function' ? extraValidation(this) : true;
    }

};

customElements.define(PTCS.Checkbox.is, PTCS.Checkbox);
