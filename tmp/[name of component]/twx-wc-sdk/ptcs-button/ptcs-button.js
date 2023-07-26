import {LitElement, html, css} from 'lit';
import {L2Pw} from 'ptcs-library/library-lit';
import {PTCS} from 'ptcs-library/library.js';
import 'ptcs-icon/ptcs-icon.js';
import 'ptcs-label/ptcs-label.js';
import 'ptcs-behavior-styleable/ptcs-behavior-styleable.js';
import 'ptcs-behavior-focus/ptcs-behavior-focus.js';
import 'ptcs-behavior-tooltip/ptcs-behavior-tooltip.js';
import 'ptcs-behavior-tabindex/ptcs-behavior-tabindex.js';

PTCS.Button = class extends PTCS.BehaviorTabindex(PTCS.BehaviorTooltip(PTCS.BehaviorFocus(
    PTCS.BehaviorStyleable(L2Pw(LitElement))))) {
    static get styles() {
        return css`
        :host {
            user-select: none;
            -ms-user-select: none;
            position: relative;
            display: inline-flex;
            flex-direction: row;
            align-items: center;
            flex-wrap: nowrap;
            box-sizing: border-box;
          }

          :host([content-align='left']) {
            justify-content: flex-start;
          }

          :host([content-align='center']) {
            align-items: center;
            justify-content: center;
          }

          :host([content-align='right']) {
            justify-content: flex-end;
          }

          :host([aria-disabled="true"]) {
            cursor: auto;
          }

          :host([aria-disabled="false"]) {
            cursor: pointer;
          }

          [part="root"] {
            box-sizing: border-box;
            display: flex;
            align-self: center;
            align-items: center;
          }

          :host([icon-placement="right"]) [part="root"] {
              flex-direction: row-reverse;
          }

          [part="root"] {
            overflow: hidden;
            max-height: 100%;
            justify-content: center;
          }

          :host([mode="icon+label"]:not([icon-placement="right"])) ptcs-icon {
            margin-right: var(--ptcs-button-icon--sep, 8px);
          }

          :host([mode="icon+label"][icon-placement="right"]) ptcs-icon {
            margin-left: var(--ptcs-button-icon--sep, 8px);
          }

          :host([mode="label"]) ptcs-icon {
            display: none;
          }

          [part="label"] {
              min-width: unset;
              min-height: unset;
          }`;
    }

    render() {
        return html`<div part="root">
            <ptcs-icon part="icon"
                exportparts=${this._exportparts} ?hidden=${!(this.icon || this.iconSrc || this.svgIcon)}
                .icon=${this.icon || this.iconSrc || this.svgIcon}
                .size=${this._iconSize()} .iconWidth=${this.iconWidth} .iconHeight=${this.iconHeight}
                .iconSet=${this.icon ? this.iconSrc : undefined}>
                </ptcs-icon>
            <ptcs-label part="label" id="label"
                .tooltip=${this.tooltip} .tooltipIcon=${this.tooltipIcon} disable-tooltip
                .label=${this.label} .multiLine=${this.multiLine}
                ?hidden=${!this.label} .horizontalAlignment=${this.contentAlign}
                .maxHeight=${this.maxHeight} .maxWidth=${this.buttonMaxWidth}
                .disclosureControl=${'ellipsis'}>
                </ptcs-label>
        </div>`;
    }

    static get is() {
        return 'ptcs-button';
    }

    static get properties() {
        return {
            variant: {
                type:    String,
                value:   'primary',
                reflect: true
            },

            icon: {
                type:  String,
                value: null
            },

            iconWidth: {
                type:      String,
                attribute: 'icon-width'
            },

            iconHeight: {
                type:      String,
                attribute: 'icon-height'
            },

            iconSrc: {
                type:      String,
                value:     null,
                attribute: 'icon-src'
            },

            svgIcon: {
                type:      String,
                attribute: 'svg-icon',
                value:     null
            },

            iconPlacement: {
                type:      String,
                attribute: 'icon-placement',
                value:     'left',
                reflect:   true
            },

            label: {
                type:  String,
                value: null
            },

            contentAlign: {
                type:      String,
                attribute: 'content-align',
                value:     'center',
                reflect:   true
            },

            buttonMaxWidth: {
                type:      Number,
                attribute: 'button-max-width',
                observer:  '_buttonMaxWidthChanged'
            },

            // Multi-line
            multiLine: {
                type:      Boolean,
                value:     false,
                attribute: 'multi-line'
            },

            // Fixed max-height for multi-line
            maxHeight: {
                type:      String,
                attribute: 'max-height'
            },

            mode: {
                type:     String,
                computed: '_computeMode(icon, iconSrc, svgIcon, label)',
                reflect:  true
            },

            disabled: {
                type:    Boolean,
                value:   false,
                reflect: true
            },

            // FocusBehavior should simulate a click event when ArrowDown key is pressed. This is (currently)
            // only used in the Grid toolbar 'Display' button
            _arrowDownActivate: {
                type: Boolean
            },

            // ARIA attributes
            ariaDisabled: {
                type:      String,
                attribute: 'aria-disabled',
                computed:  '_disabled(disabled)',
                reflect:   true
            },

            ariaLabel: {
                type:      String,
                attribute: 'aria-label',
                computed:  '_computeAriaLabel(label, tooltip)',
                reflect:   true
            },

            // FocusBehavior should simulate a click event when enter key is pressed
            _enterActivate: {
                type:     Boolean,
                value:    true,
                readOnly: true
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

            role: {
                type:    String,
                value:   'button',
                reflect: true
            },

            _exportparts: {
                type:     String,
                readOnly: true,
                value:    PTCS.exportparts('icon-', PTCS.Icon)
            }
        };
    }

    constructor() {
        super();
        this.tooltipFunc = this._monitorTooltip.bind(this);
        this.addEventListener('click', this._onClick.bind(this));
    }

    _iconSize() {
        return (this.iconWidth || this.iconHeight) ? 'custom' : 'small';
    }

    _buttonMaxWidthChanged() {
        if (this.buttonMaxWidth) {
            const unitTest = `${this.buttonMaxWidth}`;
            if (unitTest.indexOf('px') === -1) {
                this.style.maxWidth = unitTest + 'px';
            } else {
                this.style.maxWidth = unitTest;
            }
        } else {
            this.style.removeProperty('max-width');
        }
    }

    _monitorTooltip() { // Implements ptcs-button's tooltip behavior on label truncation
        const el = this.shadowRoot.querySelector('[part=label]');

        const tooltip = el.tooltipFunc();

        if (!tooltip || tooltip === this.tooltip) {
            // If we are here it means that the label text is not truncated and it is not included in the tooltip.
            // Give it another chance. Maybe the truncation was not identified by the label because of sub-pixel difference.
            const rootEl = this.shadowRoot.querySelector('[part=root]');
            const elR = el.getBoundingClientRect();

            const paddingLeft = getComputedStyle(rootEl).paddingLeft;
            const paddingRight = getComputedStyle(rootEl).paddingRight;

            if (!paddingLeft && !paddingRight) {
                // No padding to un-restrict the label width
                return tooltip;
            }

            rootEl.style.paddingLeft = 0;
            rootEl.style.paddingRight = 0;

            const elRNew = el.getBoundingClientRect();
            rootEl.style.paddingLeft = '';
            rootEl.style.paddingRight = '';

            // TW-98495: Re-calculate the tooltip if the size *grows* when given more space
            return elRNew.width > elR.width ? el.tooltipFunc(true) : tooltip;
        }

        return tooltip;
    }

    _computeMode() {
        const iconLabel = this.label ? 'icon+label' : 'icon';
        return this.icon || this.iconSrc || this.svgIcon ? iconLabel : 'label';
    }

    _disabled(disabled) {
        return disabled ? 'true' : 'false';
    }

    _onClick(ev) {
        if (PTCS.wrongMouseButton(ev)) {
            return;
        }
        if (!this.disabled) {
            this.dispatchEvent(new CustomEvent('action', {detail: {item: this.item}}));
        }
    }

    // ARIA attributes
    _computeAriaLabel(label, tooltip) {
        return label || tooltip;
    }

    static get $parts() {
        if (!this._$parts) {
            this._$parts = [/*'root', */'icon', 'label', ...PTCS.partnames('icon-', PTCS.Icon)];
        }
        return this._$parts;
    }
};


customElements.define(PTCS.Button.is, PTCS.Button);
