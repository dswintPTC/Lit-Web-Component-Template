import 'ptcs-label/ptcs-label.js';
import 'ptcs-behavior-focus/ptcs-behavior-focus.js';
import 'ptcs-icon/ptcs-icon.js';
import 'ptcs-textfield/ptcs-textfield.js';
import 'ptcs-behavior-styleable/ptcs-behavior-styleable.js';

import {PolymerElement, html} from '@polymer/polymer/polymer-element.js';

import {PTCS} from 'ptcs-library';

class InputNumber extends PTCS.BehaviorFocus(PTCS.BehaviorStyleable(PTCS.ThemableMixin(PolymerElement))) {

    static get template() {
        return html`
            <style>
                :host {
                    position: relative;
                    display: inline-flex;
                }
                [part="pagination-input"] {
                    box-sizing: border-box;
                }
                [part="error-text"][show] {
                    display: block;
                }
                [part="error-text"] {
                    position: absolute;
                    display: none;
                }
            </style>
            <ptcs-textfield
                type="text"
                id="pagination-input"
                part="pagination-input"
                text="{{__inputValue}}"
                disabled\$="[[disabled]]"
                on-blur="__onBlurInput"
                on-keyup="__onKeyUpChange"
                on-keydown="__onKeyDownChange"
                on-paste="__checkPassedValue"
                tabindex\$="[[_delegatedFocus]]">
            </ptcs-textfield>

            <ptcs-label
                show\$="[[__isInputValueGratherThanMax(__inputValue)]]"
                id="error-text"
                part="error-text"
                label="[[errorMessage]]: [[totalNumberOfPages]]"
            ></ptcs-label>
        `;
    }

    constructor() {
        super();
        this.reset();
    }

    static get properties() {
        return {
            disabled: {
                type:                 Boolean,
                reflectedToAttribute: true
            },
            totalNumberOfPages: {
                type: Number
            },
            errorMessage: {
                type:  String,
                value: 'Max'
            },
            _delegatedFocus: {
                type:  String,
                value: null
            },
        };
    }

    static get is() {
        return 'ptcs-pagination-input-number';
    }

    get value() {
        return this.__currentValue;
    }

    connectedCallback() {
        super.connectedCallback();
        this.$['pagination-input'].showClearText = false;
    }
    reset() {
        this.__inputValue = '1';
        this.__currentValue = 1;
    }

    __isInputValueGratherThanMax() {
        return Number(this.__inputValue) > this.totalNumberOfPages;
    }

    __checkPassedValue(evt) {
        const clipboardData = evt.clipboardData.getData('Text');
        if (isNaN(clipboardData) || clipboardData < 0) {
            evt.preventDefault();
        }
    }

    __onKeyDownChange(evt) {
        const numericArray = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
            'Backspace', 'ArrowLeft', 'ArrowRight', 'Delete', 'Tab', 'Home', 'End'];
        this.__inputValue = this.__inputValue === '0' ? '' : this.__inputValue;
        if (!numericArray.includes(evt.key) &&
            !((evt.ctrlKey || evt.metaKey) && ['a', 'A', 'c', 'C', 'v', 'V', 'x', 'X'].includes(evt.key))
        ) {
            evt.preventDefault();
        }
    }

    __onBlurInput() {
        if (this.__inputValue.length === 0) {
            this.__inputValue = this.__currentValue.toString();
            return;
        }
        this.__checkBorderUseCases(this.__inputValue);
    }

    __onKeyUpChange(evt) {
        if (evt.key === 'Enter') {
            if (this.__inputValue.length === 0) {
                this.__inputValue = this.__currentValue.toString();
            }
            this.__checkBorderUseCases(this.__inputValue);
            this._selectInputText();
        } else if (evt.key === 'Escape') {
            this.__inputValue = this.__currentValue.toString();
            this._selectInputText();
        }
    }

    __checkBorderUseCases(page) {
        let inputValueNumber = Number(page);
        if (inputValueNumber > this.totalNumberOfPages || inputValueNumber === 0) {
            this.__inputValue = this.__currentValue.toString();
            inputValueNumber = this.__currentValue;
        }
        this.__currentValue = inputValueNumber;
        this.dispatchEvent(new CustomEvent('value-approved', {
            bubbles:  true,
            composed: true,
            detail:   {
                pageNo: this.__currentValue
            }
        }));
    }

    _selectInputText() {
        const input = this.$['pagination-input'];
        if (!input.hasUpdated) {
            input.performUpdate();
        }
        input.selectAll();
    }
}

customElements.define(InputNumber.is, InputNumber);
