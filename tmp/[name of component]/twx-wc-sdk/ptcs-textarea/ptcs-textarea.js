import {LitElement, html, css} from 'lit';
import {L2Pw} from 'ptcs-library/library-lit';
import {PTCS} from 'ptcs-library/library.js';
import 'ptcs-textfield/ptcs-textfield-base.js';
import 'ptcs-label/ptcs-label.js';
import 'ptcs-button/ptcs-button.js';
import 'ptcs-behavior-styleable/ptcs-behavior-styleable.js';
import 'ptcs-behavior-focus/ptcs-behavior-focus.js';
import 'ptcs-behavior-tabindex/ptcs-behavior-tabindex.js';
import 'ptcs-behavior-tooltip/ptcs-behavior-tooltip.js';

PTCS.Textarea = class extends PTCS.BehaviorTabindex(PTCS.BehaviorTooltip(PTCS.BehaviorFocus(PTCS.BehaviorStyleable(
    PTCS.TextFieldMixin/*(PTCS.ThemableMixin*/(L2Pw(LitElement)/*)*/, []))))) {
    static get styles() {
        return css`
        /* This styles block should come from ptcs-textfield-base. Currently there is some issue with style inclusion. */
        :host
        {
          display: inline-block;

          box-sizing: border-box;

          overflow: hidden;
        }

        :host(:focus) {
          outline: none;
        }

        [part="root"] {
          display: flex;
          flex-direction: column;
          width: 100%;
          height: 100%;
        }

        [part="text-box"] {
          flex-grow: 1;
          box-sizing: border-box;
        }

        [part="text-value"] {
          border: 0;
          background: transparent;
          padding: 8px;
          outline: none;
          box-shadow: none;
          width: 100%;
          height: 100%;
          box-sizing: border-box;
          flex: 1;
        }

        [part="label"] {
          display: none;

          flex-shrink: 0;

          min-width: unset;
          min-height: unset;
        }

        :host(:not([label=""])) [part="label"] {
          display: inline-flex;
          padding-bottom: 4px;
        }

        [part="text-value"]:focus::-webkit-input-placeholder { color: transparent; }
        [part="text-value"]:focus::-webkit-input-placeholder { color: transparent; }
        [part="text-value"]:focus::-moz-placeholder { color: transparent; }
        [part="text-value"]:focus:-ms-input-placeholder { color: transparent; }

        :host([counter]:not([maxlength=""]):not([disabled]):not([read-only])) [part="counter"] {
          display: block;
          margin-right: 8px;
          text-align: right;
          width: auto;
        }

        :host([text-alignment=right]) [part=text-box] {
          text-align: right;
        }

        [part="counter"] {
          display: none;
        }

        /* The end of included style block */

        :host {
          line-height: 18px;
        }

        :host([validity]) [part=text-value] {
          overflow: hidden;
        }

        :host([_auto-grow]) [part=text-value] {
          overflow: hidden;
        }

        :host(:not([_auto-grow]):not([validity])) [part=text-value] {
          overflow: auto;
        }

        [part="text-box"] {
          display: inline-flex;
          flex-direction: column;
          position: relative;
        }

        [part=text-value] {
          resize: none;
          overflow: hidden;
        }

        [part=counter] {
          margin-bottom: 8px;
          direction: rtl;
        }

        [part="hint-text"] {
          position: absolute;
          height: 100%;
          width: 100%;
          cursor: text;
          box-sizing: border-box;
        }

        :host([has-text]) [part="hint-text"] {
          display: none;
        }
        /* Hide hint-text on focus. Also a must for Safari, as <input> sometimes refuses keyboard input */
        [part="text-value"]:focus + [part="hint-text"] {
            display: none;
        }`;
    }

    render() {
        return html`
        <div part="root" id="root">
          <ptcs-label part="label" id="label" .label=${this.label} multi-line
            .horizontalAlignment=${this.labelAlignment} disable-tooltip></ptcs-label>
          <div part="text-box" id="textbox">
            <textarea part="text-value" id="input" .disabled=${this.disabled} ?readonly=${this.readOnly}
            maxlength=${this.maxNumberOfCharacters} .value=${this.text || ''} @input=${this.onInput}
            tabindex=${this._tabindex(this._delegatedFocus, this.noTabindex)}></textarea>
            <label part="hint-text" id="hintText">${this.hintText}</label>
            <div id="counter" part="counter">${this._counterString}</div>
          </div>
        </div>`;
    }

    static get is() {
        return 'ptcs-textarea';
    }

    static get properties() {
        return {
            textAlignment: {
                type:      String,
                value:     'left',
                attribute: 'text-alignment',
                reflect:   true
            },

            labelAlignment: {
                type:      String,
                value:     'left',
                attribute: 'label-alignment',
                reflect:   true
            },

            _initialHeight: {
                type:  String,
                value: ''
            },

            _autoGrow: {
                type:      Boolean,
                reflect:   true,
                attribute: '_auto-grow',
                value:     true
            },

            _forceAppendValidationMessage: {
                type:     Boolean,
                computed: '_computeForceAppendValidationMessage(_autoGrow)'
            },

            // Prevent scrolling to the input element when textarea is getting focused
            _preventFocusAutoScroll: {
                type:     Boolean,
                computed: '_computePreventFocusAutoScroll(_noSpaceForMessage)'
            },

            _delegatedFocus: {
                type:  String,
                value: null
            }
        };
    }

    static get observers() {
        return [
            '_observeValidationMessage(_autoGrow, _validationChangeNo)'
        ];
    }

    onInput(e) {
        this.text = e.target.value;
    }

    ready() {
        super.ready();

        this._trackFocus(this, this.$.textbox);

        if (this.text === undefined) {
            this.text = '';
        }

        // Clicking on the hint text sends focus to <input>
        this.$.hintText.addEventListener('mouseup', () => {
            this._forwardFocus();
            requestAnimationFrame(() => this._tooltipClose());
        });

        this.addEventListener('input', () => this._calculateDynamicHeightChanged());
        requestAnimationFrame(() => this._calculateDynamicHeightChanged());

        this.addEventListener('focus', ev => this._showTooltip(ev));

        this.addEventListener('blur', () => {
            if (this.isValueChanged()) {
                this.dispatchEvent(new CustomEvent('TextAreaChanged', {bubbles: true, composed: true, detail: {key: 'Enter'}}));
            }
            this._tooltipClose();
        });

        this.$.input.addEventListener('blur', () => {
            this._stayUnvalidated = false;
        });

        // Listen to keys in order to dismiss tooltip (if any)
        this.$.input.addEventListener('keyup', ev => {
            if (PTCS.alphanumericKey(ev.key)) {
                this._stayUnvalidated = true;
            }
            requestAnimationFrame(() => this._tooltipClose());
        });

        // Listen to click in order to dismiss tooltip (if any)
        this.$.input.addEventListener('click', () => {
            requestAnimationFrame(() => this._tooltipClose());
        });

        // Use boilerplate function in ptcs-behavior-tooltip
        this.tooltipFunc = this.hideIfTooltipEqualsLabel;

        // Unless otherwise specified, a textarea should not start validation until the user "blurs away" from a changed textfield
        if (this._stayUnvalidated === undefined) {
            this._stayUnvalidated = true;
        }
    }

    // Forward focus to <textarea>
    _forwardFocus() {
        if (!this.disabled && !this.readOnly) {
            this.$.input.focus();
        }
    }

    _tabindex(_delegatedFocus, noTabindex) {
        return (_delegatedFocus && !noTabindex) ? _delegatedFocus : '-1';
    }

    _showTooltip(ev) {
        const tooltip = this.tooltipFunc;
        this._tooltipEnter(this, ev.clientX, ev.clientY, tooltip, {showAnyway: true});
    }

    _calculateDynamicHeightChanged() {
        if (this._initialHeight === '') {
            if (this.offsetHeight === 0) {
                // Component is not ready yet
                requestAnimationFrame(() => this._calculateDynamicHeightChanged());
                return;
            }
            this._initialHeight = this.offsetHeight;
            this.$.textbox.style.height = this.$.textbox.offsetHeight + 'px';
        }

        this.style.height = 'auto';

        const contentHeight = Math.max(this.$.input.scrollHeight + this.$.counter.offsetHeight + this.$.label.offsetHeight,
            this._initialHeight);
        const messageElement = this.shadowRoot.querySelector('ptcs-validation-message');
        if (messageElement && this._autoGrow) {
            // Showing validation message and in autogrow mode
            this._autoGrowWithValidationMessage();
        } else if (this._autoGrow && this._initialHeight < contentHeight) {
            this.$.root.style.height = '100%';
            this.style.height = contentHeight + 'px';
        } else {
            this.style.height = this._initialHeight + 'px';
        }
    }

    _computeForceAppendValidationMessage(_autoGrow) {
        return _autoGrow;
    }

    _insertValidationMessage(messageElement) {
        this.defaultInsertValidationMessageForVerticalLayout(messageElement);
    }

    _computePreventFocusAutoScroll(_noSpaceForMessage) {
        return _noSpaceForMessage;
    }

    _observeValidationMessage(_autoGrow, _validationChangeNo) {
        if (_autoGrow) {
            this._autoGrowWithValidationMessage();
        }
    }

    // Showing validation message in autogrow mode
    _autoGrowWithValidationMessage() {
        const contentHeight = Math.max(this.$.input.scrollHeight + this.$.counter.offsetHeight + this.$.label.offsetHeight,
            this._initialHeight);
        const messageElement = this.shadowRoot.querySelector('ptcs-validation-message');
        if (messageElement && this._initialHeight <= contentHeight + messageElement.scrollHeight) {
            requestAnimationFrame(() => {
                this.$.root.style.height = contentHeight + 'px';
                this.style.height = (contentHeight + messageElement.scrollHeight) + 'px';
            });
        }
    }
};

customElements.define(PTCS.Textarea.is, PTCS.Textarea);
