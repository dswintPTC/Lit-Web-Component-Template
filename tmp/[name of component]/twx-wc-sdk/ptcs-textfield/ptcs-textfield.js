import {LitElement, html, css} from 'lit';
import {L2Pw} from 'ptcs-library/library-lit';
import {PTCS} from 'ptcs-library/library.js';
import {InputMask} from './lib/masking-input.js';
import './ptcs-textfield-base.js';
import 'ptcs-label/ptcs-label.js';
import 'ptcs-button/ptcs-button.js';
import 'ptcs-behavior-styleable/ptcs-behavior-styleable.js';
import 'ptcs-behavior-tooltip/ptcs-behavior-tooltip.js';
import 'ptcs-behavior-focus/ptcs-behavior-focus.js';
import 'ptcs-behavior-tabindex/ptcs-behavior-tabindex.js';
import 'ptcs-icon/ptcs-icon.js';
import 'ptcs-icons/cds-icons.js';

PTCS.Textfield = class extends PTCS.BehaviorTabindex(PTCS.BehaviorTooltip(PTCS.BehaviorFocus(PTCS.BehaviorStyleable(/*PTCS.ThemableMixin(*/
    PTCS.TextFieldMixin(L2Pw(LitElement)/*)*/), ['counter', 'read-only', 'show-clear-text', 'has-text'])))) {

    static get styles() {
        return css`
        /* This styles block should come from ptcs-textfield-base. Currently there is some issue with style inclusion. */
        :host
        {
          display: inline-flex;
          box-sizing: border-box;
          overflow: hidden;
        }

        [part="root"] {
          flex: 0 0 auto;
          display: inline-flex;
          flex-direction: column;
          justify-content: space-between;
          align-items: stretch;
          align-content: stretch;

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
          outline: none;
          box-shadow: none;
          margin-left: 8px;
          width: 100%;
          box-sizing: border-box;
          flex: 1;
        }

        /* FF needs this rule */
        :host(:not([has-text])) [part="text-value"]:not(:focus) {
            width: 0px;
            flex: 0 0 auto;
        }

        :host([text-alignment=right]) [part="text-value"] {
          text-align: right;
          margin-left: 0px;
          margin-right: 8px;
          order: 3;
          overflow: auto;
        }

        [part="text-value"]:focus {
          min-width: 1px;
       }

        :host([egde-fix]) [part="text-value"]:focus {
          min-width: 4px;
        }

        [part="label"] {
          display: none;

          flex-shrink: 0;

          min-width: unset;
          min-height: unset;
        }

        :host([label]:not([label=""])) [part="label"] {
          display: inline-flex;
          padding-bottom: 4px;
        }

        [part="text-value"]:focus::-webkit-input-placeholder { color: transparent; }
        [part="text-value"]:focus::-webkit-input-placeholder { color: transparent; }
        [part="text-value"]:focus::-moz-placeholder { color: transparent; }
        [part="text-value"]:focus:-ms-input-placeholder { color: transparent; }

        :host([counter]:not([maxlength=""]):not([disabled]):not([read-only])) [part="counter"] {
          display: block;
          width: auto;
        }

        [part="counter"] {
          display: none;
        }
        /* The end of included style block */

        [part="text-box"] {
          display: inline-flex;
          flex-direction: row;
          justify-content: start;
          align-items: center;
        }

        [part=icon] {
          display: none;
          pointer-events: none;
        }

        :host([icon]:not([icon=""])) [part=icon] {
          display: inline-flex;
        }

        :host([icon]:not([icon=""])) [part="text-value"] {
          margin-left: 0px;
        }

        [part=clear-button] {
          flex: 0 0 auto;
          display: none;
        }

        #maskShell[mask-active]~[part=counter] {
          display: none;
        }

        #maskShell[mask-active] [part="text-value"]:focus::-webkit-input-placeholder { color: transparent; }
        #maskShell[mask-active] [part="text-value"]:focus::-webkit-input-placeholder { color: transparent; }
        #maskShell[mask-active] [part="text-value"]:focus::-moz-placeholder { color: transparent; }
        #maskShell[mask-active] [part="text-value"]:focus:-ms-input-placeholder { color: transparent; }

        :host(:hover:not([counter]):not([disabled]):not([read-only])[show-clear-text][has-text]) [part=clear-button] {
          display: inline-flex;
        }

        :host(:not([counter]):not([disabled]):not([read-only])[show-clear-text][has-text]) #maskShell[focused]+[part=clear-button] {
          display: inline-flex;
        }

        /* E.g. the datepicker needs to show the clear button DESPITE readonly */
        :host(:hover:not([counter]):not([disabled])[show-clear-text][has-text][display-clear-button-on-readonly]) [part=clear-button] {
          display: inline-flex;
        }

        :host(:not([counter]):not([disabled])[show-clear-text][has-text][display-clear-button-on-readonly]) #maskShell[focused]+[part=clear-button] {
          display: inline-flex;
        }

        /* masking css */

        .shell {
          position:relative;
          display:inline-flex;
          width: 100%;
        }

        [part=mask] {
          position:absolute;
          margin-left: 8px;
          pointer-events: none;
          height: 22px;
        }

        [part=mask] i {
          font-style: normal;
          /* any of these 3 will work */
          color: transparent;
          opacity: 0;
          visibility: hidden;
        }

        input.masked,[part=mask] {
          background-color: transparent;
        }

        [part="hint-text"] {
          align-self: center;
          cursor: text;

          /* minimal height should exists otherwise hint is not shown */
          min-height: 16px;
          width: 100%;

          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          user-select: none;
        }

        :host([text-alignment=right]) [part="hint-text"] {
            text-align: right;
        }

        :host([text-alignment=right]) .shell{
            justify-content: flex-end;
        }

        :host([text-alignment=right]) [part=mask]{
            margin-right: 8px;
        }

        :host([has-text]) [part="hint-text"] {
            display: none;
        }

        /* Hide hint-text on focus. Also a must for Safari, as <input> sometimes refuses keyboard input */
        [part="text-value"]:focus + [part="hint-text"] {
            display: none;
        }

        [part=clear-button] {
          visibility: visible;
        }

        [part="clear-button"] ptcs-icon {
          max-width: 100%;
          overflow: visible;
        }

        /* IE11 and Edge fix to remove auto-generated non-standard clear button in input field */
        [part=text-value]::-ms-clear {
          display: none;
        }`;
    }

    render() {
        return html`
        <div part="root">
            <ptcs-label part="label"
                .label=${this.label} multi-line .horizontalAlignment=${this.labelAlignment} disable-tooltip>
            </ptcs-label>
            <div part="text-box" id="textbox">
                <ptcs-icon part="icon"
                    .icon=${this.icon} .iconSet=${this.iconSet} .size=${this._iconSize()}
                    .iconWidth=${this.iconWidth} .iconHeight=${this.iconHeight}>
                </ptcs-icon>
                <span id="maskShell" class="shell">
                    <span aria-hidden="" part="mask" id="inputMask">
                    <i></i>
                    </span>
                    <input id="input" part="text-value" class=${this._maskedClass()} .disabled=${this.disabled} ?readonly=${this.readOnly}
                    maxlength=${this.maxNumberOfCharacters} pattern=${this._maskToRegex()} data-charset=${this.dataCharset}
                    data-hint-text=${this.dataHintText} .value=${this.text || ''} @input=${this.onInput}
                    tabindex=${this._tabindex(this._delegatedFocus, this.noTabindex)} .ariaLabel=${this.ariaLabel} spellcheck=${this.spellcheck}>
                    <label part="hint-text" id="hintText">${this.hintText}</label>
                </span>

                <ptcs-button variant="small" no-tabindex id="clearbutton" part="clear-button"
                    mode="icon" icon="cds:icon_close_mini" exportparts=${this._exportparts}></ptcs-button>

                <div part="counter">${this._counterString}</div>
            </div>
        </div>`;
    }

    static get is() {
        return 'ptcs-textfield';
    }

    static get properties() {
        return {
            password: {
                type:     Boolean,
                value:    false,
                observer: '_passwordChanged',
                reflect:  true
            },

            showClearText: {
                type:      Boolean,
                attribute: 'show-clear-text',
                reflect:   true,
                observer:  '_updateHideClearText'
            },

            hideClearText: {
                type:      Boolean,
                value:     false,
                attribute: 'hide-clear-text',
                observer:  '_updateShowClearText'
            },

            labelAlignment: {
                type:      String,
                value:     'left',
                attribute: 'label-alignment',
                reflect:   true
            },

            textAlignment: {
                type:      String,
                value:     'left',
                attribute: 'text-alignment',
                reflect:   true
            },

            icon: {
                type:    String,
                reflect: true
            },

            iconWidth: {
                type:      String,
                attribute: 'icon-width'
            },

            iconHeight: {
                type:      String,
                attribute: 'icon-height'
            },

            iconSet: {
                type:      String,
                attribute: 'icon-set',
                reflect:   true
            },

            mask: {
                type:     String,
                reflect:  true,
                observer: '_maskChanged'
            },

            _inputMask: {
                type:  Object,
                value: undefined
            },

            dataCharset: {
                type:      String,
                attribute: 'data-charset'
            },

            dataHintText: {
                type:      String,
                attribute: 'data-hint-text'
            },

            readOnly: {
                type:      Boolean,
                attribute: 'read-only',
                value:     false,
                reflect:   true
            },

            noAutoSelect: {
                type:      Boolean,
                attribute: 'no-auto-select'
            },

            spellcheck: {
                type: String
            },

            _delegatedFocus: {
                type:  String,
                value: null
            },

            _hintTextOverflow: {
                type: Boolean
            },

            // ARIA attributes

            ariaLabel: {
                type:      String,
                attribute: 'aria-label',
                computed:  '_computeAriaLabel(label, hintText)'
            },

            _exportparts: {
                type:     String,
                readOnly: true,
                value:    PTCS.exportparts('clear-button-', PTCS.Button)
            },

            // Prevents from scrolling to the input el when textfield is getting focused
            _preventFocusAutoScroll: {
                type:     Boolean,
                computed: '_computePreventFocusAutoScroll(_noSpaceForMessage)'
            }
        };
    }

    constructor() {
        super();

        this.mask = '';
    }

    onInput(e) {
        this.text = e.target.value;
    }

    _iconSize() {
        if (this.iconWidth || this.iconHeight) {
            return 'custom';
        }
        return 'small';
    }

    _tabindex(_delegatedFocus, noTabindex) {
        return (_delegatedFocus && !noTabindex) ? _delegatedFocus : '-1';
    }

    _maskChanged() {
        if (this._inputMask === undefined) {
            this._inputMask = new InputMask({wc: this, shell: this.$.maskShell});
        }

        this._inputMask.refresh(this.mask);

        this._sendInputEvent();
    }

    _passwordChanged() {
        let type = this.password ? 'password' : 'text';
        this.$.input.type = type;
    }

    /**
* Returns the class required by input-masking library
*/
    _maskedClass() {
        return (this.mask ? 'masked' : '');
    }

    /**
* Input-masking library: Include type="tel" when requiring numbers only.
*/
    _maskType(mask) {
        return (mask.match(/^[9]+$/) ? 'tel' : '');
    }

    _maskToRegex() {
        let pattern = '';
        let hint = '';
        let dataCharSet = '';

        for (let i = 0; i < this.mask.length; i++) {
            let maskChar = this.mask[i];

            switch (maskChar) {
                case 'a':
                    pattern += '[a-zA-Z]';
                    hint += '_';
                    dataCharSet += '_';
                    break;
                case '9':
                    pattern += '[0-9]';
                    hint += '_';
                    dataCharSet += 'X';
                    break;
                case '*':
                    pattern += '[a-zA-Z0-9]';
                    hint += '_';
                    dataCharSet += '*';
                    break;
                default:
                    hint += maskChar;
                    dataCharSet += maskChar;
                    pattern += maskChar;
            }
        }

        this.dataHintText = hint;
        this.dataCharset = dataCharSet;
        if (pattern.length === 0) { // make pattern accept every thing to prevent HTML error messages on runtime
            pattern = '.*';
        }
        return pattern;
    }

    _sendInputEvent() {
        var event = new Event('input', {
            bubbles:    true,
            cancelable: true
        });

        this.$.input.dispatchEvent(event);
    }

    _dispatchEnterKeyPressedEvent() {
        this.dispatchEvent(new CustomEvent('EnterKeyPressed', {bubbles: true, composed: true, detail: {key: 'Enter'}}));
        this._stayUnvalidated = false;
    }

    _dispatchFocusLostEvent() {
        this.dispatchEvent(new CustomEvent('FocusLost', {bubbles: true, composed: true, detail: {lostFocus: true}}));
    }

    _preventTooltip() {
        this.disableTooltip = true;
        requestAnimationFrame(() => this._tooltipClose());
    }

    _allowTooltip() {
        this.__ptId = (this.__ptId || 0) + 1;
        const __ptId = this.__ptId;
        setTimeout(() => {
            // Make sure the timeout is still relevant and that we have not regained focus
            if (__ptId === this.__ptId && !this.$.maskShell.hasAttribute('focused')) {
                this.disableTooltip = false;
            }
        }, 100);
    }

    ready() {
        super.ready();

        this._trackFocus(this, this.$.textbox);

        // Click on textfield -> don't show tooltip
        this.addEventListener('click', this._preventTooltip.bind(this));

        // Click on clearbutton
        this.$.clearbutton.addEventListener('click', ev => {
            ev.preventDefault();
            this.$.input.value = '';
            this._sendInputEvent();
            this.dispatchEvent(new Event('clear-text'));
        });

        this.addEventListener('focus', ev => {
            this.$.maskShell.setAttribute('focused', '');
            if (!this.disabled && !this.readOnly && !this.noAutoSelect) {
                // Select text
                this.$.input.setSelectionRange(0, this.$.input.value.length);
            }
            this._showTooltip(ev);
        });

        this.addEventListener('blur', () => {
            this._preventTooltip();
            this.$.maskShell.removeAttribute('focused');
            this._dispatchFocusLostEvent();
            // The hint overflow computation in hintText observer yields false when text is assigned before hint text
            // or while the textfield has focus (because it then hides the hint text)
            if (!this.hasText && this.hintText) {
                this.hintTextChanged(this.hintText);
            }
            this._allowTooltip();
        });

        this.addEventListener('mousemove', this._showTooltip.bind(this));

        // Track mouseleave in <input> to re-enable tooltip while the field is still in focus (e.g. after clearing it with clear button)
        this.$.input.addEventListener('mouseleave', () => {
            this.disableTooltip = false;
        });

        // Listen to <enter> keys
        this.$.input.addEventListener('keypress', (event) => {
            this._preventTooltip();
            const x = event.which || event.keyCode; // Use either which or keyCode, depending on browser support
            if (x === 13) {
                this._dispatchEnterKeyPressedEvent();
            }
        });
        this.$.input.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                this._stayUnvalidated = false;
            } else if (PTCS.alphanumericKey(event.key)) {
                this._stayUnvalidated = true;
            }
        });

        this.$.input.addEventListener('blur', () => {
            this._stayUnvalidated = false;
        });

        this.tooltipFunc = this.$.textbox.tooltipFunc = this._getTooltip.bind(this);

        // Unless otherwise specified, a textfield should not start validation until:
        // - The user has pressed the Enter key, or
        // - The user "blurs away" from a changed textfield
        if (this._stayUnvalidated === undefined) {
            this._stayUnvalidated = true;
        }
    }

    _getTooltip() {
        // Implements ptcs-textfield's tooltip behavior on label truncation. Show the truncated hint text
        // if any, and don't show the tooltip if its text is the same as the hint text or the label text.
        // When textfield is *focused* the hint text is not shown and its scrollWidth becomes zero as display === none
        // The hint text is then included in the tooltip even if not truncated, as it is no longer visible.
        if (this.isTruncated()) {
            // Textfield text is truncated (actual text or hint text), use truncated text as tooltip.
            // Filter out non-empty tooltip string identical to label
            const tooltip = this.tooltip && this.tooltip !== this.label ? this.tooltip : '';
            if (!this.hasText && this.hintText) {
                // We are showing truncated hint text. Filter out tooltip if identical to the hint text.
                return tooltip && tooltip !== this.hintText ? this.hintText + '\n\n' + tooltip : this.hintText;
            }
            // We are showing truncated text
            return tooltip && tooltip !== this.text ? this.text + '\n\n' + tooltip : this.text;
        }
        if (this.tooltip && this.tooltip === this.label) {
            return ''; // No truncated Hint Text. Don't show tooltip if identical to the text field label text, which cannot be truncated
        }
        if (!this.hasText && this.tooltip === this.hintText) {
            return ''; // No truncated hint text, but hint text is showing and identical to tooltip.
        }
        return this.tooltip || ''; // Either no hint text truncation or no hint, tooltip text different from label. Return tooltip if any
    }

    _showTooltip(ev) {
        const tooltip = this._getTooltip();
        this._tooltipEnter(this, ev.clientX, ev.clientY, tooltip, {showAnyway: true});
    }

    get selectionStart() {
        return this.$.input.selectionStart;
    }

    get selectionEnd() {
        return this.$.input.selectionEnd;
    }

    setSelectionRange(start, end) {
        this.$.input.setSelectionRange(start, end);
    }

    selectAll() {
        const input = this.$.input;
        if (input.value) {
            input.setSelectionRange(0, input.value.length);
        }
    }

    appendSuggestion(suggestion) {
        const input = this.$.input;
        if (input.value) {
            input.setRangeText(suggestion, input.value.length, input.value.length, 'select');
        }
    }

    getFullText() {
        return this.$.input.value;
    }

    _insertValidationMessage(messageElement) {
        this.defaultInsertValidationMessageForVerticalLayout(messageElement, this.shadowRoot.querySelector('[part=root]'));
    }

    _computePreventFocusAutoScroll(_noSpaceForMessage) {
        return _noSpaceForMessage;
    }

    // ARIA attributes

    _computeAriaLabel(label, tooltip, hintText) {
        return label || tooltip || hintText;
    }

    static get $parts() {
        if (!this._$parts) {
            this._$parts = [/*'root', */'text-box', 'text-value', 'label', 'counter', 'icon', 'clear-button',
                'mask', 'hint-text', ...PTCS.partnames('clear-button-', PTCS.Button)];
        }
        return this._$parts;
    }

    _updateHideClearText(v) {
        this.hideClearText = !v;
    }

    _updateShowClearText(v) {
        this.showClearText = !v;
    }
};

customElements.define(PTCS.Textfield.is, PTCS.Textfield);
