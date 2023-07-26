import {LitElement, css} from 'lit';
import {L2Pw} from 'ptcs-library/library-lit';
import {PTCS} from 'ptcs-library/library.js';
import 'ptcs-behavior-validate/ptcs-behavior-validate.js';

PTCS.TextFieldMixin = subclass => class PtcsTextFieldMixin extends PTCS.BehaviorValidate(L2Pw(LitElement, subclass)) {
    static get styles() {
        return css`
        :host
        {
          display: inline-block;

          font-family: 'Open Sans', sans-serif;
          font-size: 14px;
          font-weight: normal;
          font-style: normal;
          font-stretch: normal;
          letter-spacing: normal;

          min-width:fit-content;
          min-height:fit-content;
        }

        [part="root"] {
          display: inline-flex;
          flex-direction: column;

          width: 100%;
        }

        [part="text-box"] {
          min-width: 32px;
          min-height: 32px;
        }

        [part="text-value"] {
          border: 0;
          background: transparent;
          padding: 0;
          outline: none;
          box-shadow: none;

          margin-left: 8px;
          margin-right: 8px;

          width: 100%;
          box-sizing: border-box;
          flex: 1;
          min-width: 0;
        }

        [part="label"] {
          display: none;

          font-size: 12px;
        }

        :host(:not([label=""])) [part="label"] {
          display: block;

          margin-bottom: 4px;
        }

        [part="text-value"]:focus::-webkit-input-placeholder { color: transparent; }
        [part="text-value"]:focus::-webkit-input-placeholder { color: transparent; }
        [part="text-value"]:focus::-moz-placeholder { color: transparent; }
        [part="text-value"]:focus:-ms-input-placeholder { color: transparent; }

        :host([counter]:not([maxlength=""]):not([disabled]):not([read-only])) [part="counter"] {
          display: block;

          font-size: 12px;

          margin-right: 8px;
          width: auto;
        }

        [part="counter"] {
          display: none;
        }`;
    }

    static get properties() {
        return {
            text: {
                type:     String,
                notify:   true,
                validate: '_validateText(required, minlength, maxlength, pattern, extraValidation)'
            },

            // Client-provided custom validation function
            extraValidation: {
                type: Function
            },

            // If we have both TextField and Grid Widget,
            // In some cases, dhtmlxgrid.js:1665 vendor code checks for existance of the 'value' property, and if it's
            // not there, the Grid prevents event propagation. (dhtmlxgrid.js:1698)
            value: {
                type:     String,
                observer: 'valueChanged'
            },

            minlength: {
                type:      Number,
                attribute: 'min-length',
                isValue:   minlength => minlength > 0
            },

            minLengthFailureMessage: {
                type:      String,
                attribute: 'min-length-failure-message'
            },

            maxlength: {
                type:      Number,
                attribute: 'max-length',
                isValue:   maxlength => maxlength > 0
            },

            maxLengthFailureMessage: {
                type:      String,
                attribute: 'max-length-failure-message'
            },

            required: {
                type:    Boolean,
                isValue: required => !!required
            },

            requiredMessage: {
                type:      String,
                attribute: 'required-message'
            },

            _valueHasChanged: {
                type: Boolean
            },

            label: {
                type:    String,
                value:   '',
                reflect: true
            },

            counter: {
                type:    Boolean,
                value:   false,
                reflect: true
            },

            _counterString: {
                type: String
            },

            _nearLimit: {
                type:    Boolean,
                value:   false,
                reflect: true
            },

            maxNumberOfCharacters: {
                type:      Number,
                value:     1000000,
                attribute: 'max-number-of-characters',
                reflect:   true
            },

            hintText: {
                type:      String,
                observer:  'hintTextChanged',
                attribute: 'hint-text',
                reflect:   true
            },

            disabled: {
                type:    Boolean,
                value:   false,
                reflect: true
            },

            readOnly: {
                type:      Boolean,
                value:     false,
                attribute: 'read-only',
                reflect:   true
            },

            /**
         * A read-only property indicating whether this input has a non empty value.
         * It can be used for example in styling of the component.
         **/
            hasText: {
                type:      Boolean,
                value:     false,
                readOnly:  true,
                observer:  '_hasTextChanged',
                attribute: 'has-text',
                reflect:   true
            }
        };
    }

    constructor() {
        super();
        this.text = '';
    }

    static get observers() {
        return [
            '_changeBaseInput(text, maxNumberOfCharacters)'
        ];
    }

    _hasTextChanged(hasText) {
        if (!hasText) {
            this.hintTextChanged(this.hintText);
        } else {
            this._hintTextOverflow = false;
        }
    }

    hintTextChanged(val) {
        if (val) {
            requestAnimationFrame(() => {
                const el = this.shadowRoot.querySelector('[part=hint-text]');
                this._hintTextOverflow = el.offsetWidth < el.scrollWidth;
            });
        }
    }

    valueChanged(val, oldval) {
        if (oldval === undefined) {
            this._valueHasChanged = val !== '';
        } else {
            this._valueHasChanged = true;
        }
    }

    isValueChanged() {
        const result =  this._valueHasChanged;
        this._valueHasChanged = false;
        return result;
    }

    isTruncated() {
        const el = this.$.input;
        if (this.hasText && el.offsetWidth < el.scrollWidth) {
            return true;
        }
        // Are we showing truncated hint text?
        if (!this.hasText && this.hintText) {
            const hintEl = this.shadowRoot.querySelector('[part=hint-text]');
            this._hintTextOverflow = hintEl.offsetWidth < hintEl.scrollWidth;
            // When textfield is *focused* the hint text is not shown and its scrollWidth becomes zero as display === none
            // It is included in the tooltip even if not truncated, as it is no longer visible
            return this._hintTextOverflow || hintEl.scrollWidth === 0;
        }
        return false;
    }

    _changeBaseInput(text, maxNumberOfCharacters) {
        if (!text) {
            text = '';
        }
        if (text.length > maxNumberOfCharacters) {
            this.text = text.substr(0, maxNumberOfCharacters);
            return; // Text has changed so there will be new change event
        }
        this.value = text;
        this._setHasText(!!text);
        this._counterString = (maxNumberOfCharacters ? text.length + '/' + maxNumberOfCharacters : '');
        this._nearLimit = maxNumberOfCharacters && maxNumberOfCharacters * 0.9 <= text.length;
    }

    _validateText(required, minlength, maxlength, pattern, extraValidation, value) {
        let messages = [];

        // required
        if (!value && required) {
            messages.push(this.requiredMessage);
        }

        // minlength
        if (value !== undefined && minlength > 0 && value.length < minlength) {
            const msg = PTCS.replaceStringTokens(this.minLengthFailureMessage, {value: minlength});
            messages.push(msg ? msg.join('. ') : false);
        }

        // maxlength
        if (value !== undefined && maxlength > 0 && value.length > maxlength) {
            const msg = PTCS.replaceStringTokens(this.maxLengthFailureMessage, {value: maxlength});
            messages.push(msg ? msg.join('. ') : false);
        }

        // pattern
        if (pattern) {
            try {
                const re = new RegExp(`^${pattern}$`);
                if (!re.test(value)) {
                    messages.push(false);
                }
            } catch (err) {
                console.error(`Invalid textfield pattern: ${JSON.stringify(pattern)}`);
            }
        }

        // At least one validation failed
        if (messages.length) {
            return messages;
        }

        // All standard validation has succeeded. Leave final say to the custom validation, if any
        return typeof extraValidation === 'function' ? extraValidation(this) : true;
    }
};
