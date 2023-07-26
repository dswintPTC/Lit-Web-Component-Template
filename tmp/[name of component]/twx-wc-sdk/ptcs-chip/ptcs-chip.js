import {LitElement, html, css} from 'lit';
import {L2Pw} from 'ptcs-library/library-lit';
import {PTCS} from 'ptcs-library/library.js';
import 'ptcs-behavior-binary/ptcs-behavior-binary.js';
import 'ptcs-behavior-styleable/ptcs-behavior-styleable.js';
import 'ptcs-behavior-focus/ptcs-behavior-focus.js';
import 'ptcs-behavior-tabindex/ptcs-behavior-tabindex.js';
import 'ptcs-behavior-tooltip/ptcs-behavior-tooltip.js';
import 'ptcs-label/ptcs-label.js';
import 'ptcs-icon/ptcs-icon.js';
import 'ptcs-icons/cds-icons.js';

PTCS.Chip = class extends PTCS.BehaviorTabindex(PTCS.BehaviorTooltip(PTCS.BehaviorFocus(PTCS.BehaviorStyleable(
    /*PTCS.ThemableMixin(*/PTCS.BehaviorBinary(L2Pw(LitElement))/*)*/), ['disabled', 'checked']))) {
    static get styles() {
        return css`
      :host {
        display: inline-flex;
        flex-direction: row;
        justify-content: center;
        align-items: baseline;
        box-sizing: border-box;
        overflow: hidden;
        cursor: pointer;
        user-select: none;
      }

      :host([disabled]) {
        cursor: auto;
      }

      :host([labelalign=right]) {
        flex-direction: row-reverse;
      }

      :host(:not([checked])) [part=icon] {
        display: none;
      }

      :host([hide-icon]) [part=icon] {
        display: none;
      }`;
    }

    render() {
        return html`<ptcs-label id="label" part="label" .label=${this.label}
        .maxWidth=${this.labelMaxWidth} .horizontalAlignment=${this._alignLabel(this.hideIcon, this.labelalign)}
        .tooltip=${this.tooltip} .tooltip-icon=${this.tooltipIcon} .disableTooltip=${this.disableTooltip}></ptcs-label>
    <ptcs-icon id="icon" part="icon" .size=${this._iconSize(this.iconWidth, this.iconHeight)}
        .iconWidth=${this.iconWidth} .iconHeight=${this.iconHeight} .icon=${this.icon}></ptcs-icon>`;
    }

    static get is() {
        return 'ptcs-chip';
    }

    static get properties() {
        return {
            label: {
                type:  String,
                value: ''
            },

            icon: {
                type: String
            },

            iconWidth: {
                type:      String,
                attribute: 'icon-width'
            },

            iconHeight: {
                type:      String,
                attribute: 'icon-height'
            },

            hideIcon: {
                type:      Boolean,
                attribute: 'hide-icon',
                reflect:   true
            },

            labelalign: {
                type:    String,
                reflect: true
            },

            labelMaxWidth: {
                type:      String,
                attribute: 'label-max-width'
            },

            // FocusBehavior should simulate a click event when space is pressed
            _spaceActivate: {
                type:     Boolean,
                value:    true,
                readOnly: true
            },

            // FocusBehavior should simulate a click event when enter key is pressed
            _enterActivate: {
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

            // ARIA attributes

            role: {
                type:    String,
                value:   'checkbox',
                reflect: true
            },

            // aria-pressed with role button *should* be used for toggle buttons per WAI-ARIA
            // but Windows Narrator doesn't say the state out loud using that combination...
            // aria-checked with role checkbox works in Chromium Edge, Narrator says the checked
            // state when button is focused or toggled - so using that.
            ariaChecked: {
                type:      String,
                computed:  '_compute_ariaChecked(checked)',
                attribute: 'aria-checked',
                reflect:   true
            },

            ariaDisabled: {
                type:      String,
                computed:  '_compute_ariaDisabled(disabled)',
                attribute: 'aria-disabled',
                reflect:   true
            }
        };
    }

    ready() {
        super.ready();
        this.addEventListener('click', this._onClick.bind(this));
        if (this.icon === undefined) {
            this.icon = 'cds:icon_ok_circle';
        }
        if (this.labelalign === undefined) {
            this.labelalign = 'left';
        }
        this.tooltipFunc = () => this.$.label.tooltipFunc();
    }

    _iconSize(iconWidth, iconHeight) {
        if (iconWidth || iconHeight) {
            return 'custom';
        }
        return 'small';
    }

    _alignLabel(hideIcon, labelalign) {
        return hideIcon ? 'center' : labelalign;
    }

    _onClick() {
        if (!this.disabled && !this.isIDE) {
            this.checked = !this.checked;
        }
    }

    // ARIA

    _compute_ariaChecked(checked) {
        return checked ? 'true' : false;
    }

    _compute_ariaDisabled(disabled) {
        return disabled ? 'true' : false;
    }
};

customElements.define(PTCS.Chip.is, PTCS.Chip);
