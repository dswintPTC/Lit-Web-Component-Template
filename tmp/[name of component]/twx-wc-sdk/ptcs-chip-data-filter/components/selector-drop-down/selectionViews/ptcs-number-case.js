import {PolymerElement, html} from '@polymer/polymer/polymer-element.js';

import {PTCS} from 'ptcs-library/library.js';
import 'ptcs-behavior-styleable/ptcs-behavior-styleable.js';
import 'ptcs-behavior-focus/ptcs-behavior-focus.js';

const dropDownDefaultValue = '=';
const operations = [
    {name: '=', translationKey: 'string=', label: '='},
    {name: '≠', translationKey: 'string=', label: '≠'},
    {name: '>', translationKey: 'string>', label: '>'},
    {name: '<', translationKey: 'string<', label: '<'},
    {name: '>=', translationKey: 'string>=', label: '>='},
    {name: '<=', translationKey: 'string<=', label: '<='},
    {name: 'between', translationKey: 'stringBetween', label: 'between'},
    {name: 'notBetween', translationKey: 'stringOutside', label: 'outside'}
];

class PTCSNumberCase extends PTCS.BehaviorFocus(PTCS.BehaviorStyleable(PolymerElement)) {
    static get is() {
        return 'ptcs-number-case';
    }
    static get template() {
        return html`
            <style>
                :host {
                    display: flex;
                    align-items: flex-end;
                    flex-wrap: wrap;
                }
                :host([hidden]) {
                    display: none;
                }
                :host([display="compact"]) {
                    flex-direction: column;
                    align-items: flex-start;
                    width: 100%;
                }
                #drop-down, ptcs-textfield {
                    width: var(--ptcs-chip-data-filter-selector-dropdown-number-case-subcomponent-width);
                }
                #drop-down, #from-text-field, #to-text-field {
                    margin-right: var(--subcomponent-margin-spacing);
                }
                :host([display="compact"]) #drop-down {
                    width: 100%;
                    margin-right: 0px;
                }
                :host([display="compact"]) #from-text-field {
                    width: 100%;
                    margin-top: var(--ptcs-chip-data-filter-selector-subcomponent-compact-top-margin);
                    margin-right: 0px;
                }
                :host([display="compact"]) #to-text-field {
                    width: 100%;
                    margin-top: var(--ptcs-chip-data-filter-selector-subcomponent-compact-top-margin);
                    margin-right: 0px;
                }
                span {
                    align-self: center;
                    margin-right: var(--subcomponent-margin-spacing);
                }
                :host([display="compact"]) span {
                    display: none;
                }
                #between-outside-container {
                    display: none;
                }
                #between-outside-container[data-enabled] {
                    display: flex;
                }
                :host([display="compact"]) #between-outside-container[data-enabled] {
                    width: 100%;
                }
                ptcs-textfield::part(text-box) {
                    flex-grow: 0;
                }
            </style>
            <ptcs-dropdown id="drop-down" part="drop-down" label="[[__computeLabel(conditionLabel, dictionary.stringCondition)]]"
            selected-value="{{__currentSelectionDropDown}}"
            tabindex\$="[[_delegatedFocus]]" on-selected-indexes-changed="__setIsFilled" selector="label" value-selector="name">
            </ptcs-dropdown>
            <ptcs-textfield id="from-text-field" part="text-field" label="[[__computeLabel(valueLabel, dictionary.stringValue)]]"
            tabindex\$="[[_delegatedFocus]]"
            on-text-changed="__setIsFilled" on-keyup="__handleKeyUp"></ptcs-textfield>
            <div id="between-outside-container" data-enabled\$="[[_isRangeMode]]">
                <span> [[dictionary.stringTo]] </span>
                <ptcs-textfield id="to-text-field" part="text-field" label="[[__computeLabel(rangeEndValueLabel, dictionary.stringValue2)]]"
                tabindex\$="[[_delegatedFocus]]"
                on-text-changed="__setIsFilled" on-keyup="__handleKeyUp"></ptcs-textfield>
            </div>
        `;
    }
    static get properties() {
        return {
            dictionary: {
                type:     Object,
                observer: '__updateTranslations',
                value:    () => { }
            },
            // The text displayed above the drop-down list for the filter condition
            conditionLabel: {
                type: String
            },
            // The text displayed above the box which contains the value for the condition
            valueLabel: {
                type: String
            },
            // The text displayed above the first input box when filtering a range of values.
            rangeStartValueLabel: {
                type: String
            },
            // The text displayed above the second input box when filtering a range of values.
            rangeEndValueLabel: {
                type: String
            },
            isFilled: { // carries information whether the view is filled with enough amount of data
                readOnly: true,
                notify:   true,
                value:    false
            },
            display: {
                type:               String,
                value:              'compact',
                reflectToAttribute: true
            },
            __currentSelectionDropDown: {
                type:     String,
                observer: '__changeOperation'
            },
            _isRangeMode: {
                type:  Boolean,
                value: false
            },
            _delegatedFocus: {
                type:  String,
                value: null
            }
        };
    }
    ready() {
        super.ready();
        this.__updateTranslations();
        // this.__currentSelectionDropDown = dropDownDefaultValue;
    }
    set dataEnteredByUser(newData) {
        if (!newData) {
            this.setDefaultValues();
            return;
        }
        if (!newData.operation) {
            console.warn('dataEnteredByUser: Missing operation. newData: ', newData);
            return;
        }
        this.__currentSelectionDropDown = newData.operation;
        switch (newData.operation) {
            case 'between':
            case 'notBetween':
                if (isNaN(newData.from) || isNaN(newData.to)) {
                    console.warn('dataEnteredByUser: Missing from/to numbers. newData: ', newData);
                    return;
                }
                this.$['from-text-field'].text = '' + newData.from;
                this.$['to-text-field'].text = '' + newData.to;
                break;
            default:
                if (isNaN(newData.value)) {
                    console.warn('dataEnteredByUser: Missing number. newData: ', newData);
                    return;
                }
                this.$['from-text-field'].text = '' + newData.value;
        }
    }
    get dataEnteredByUser() {
        return this.__getCurrentData();
    }
    get query() {
        if (this.isError() || !this.__queryFieldName) {
            return null;
        }

        let query = {
            fieldName: this.__queryFieldName
        };

        const obj = this.__getCurrentData();
        switch (obj.operation) {
            case '=':
                query.type = 'EQ';
                query.value = obj.value;
                break;
            case '≠':
                query.type = 'NE';
                query.value = obj.value;
                break;
            case '>':
                query.type = 'GT';
                query.value = obj.value;
                break;
            case '>=':
                query.type = 'GE';
                query.value = obj.value;
                break;
            case '<':
                query.type = 'LT';
                query.value = obj.value;
                break;
            case '<=':
                query.type = 'LE';
                query.value = obj.value;
                break;
            case 'between':
                query.type = 'BETWEEN';
                query.from = obj.from;
                query.to = obj.to;
                break;
            case 'notBetween':
                query.type = 'NOTBETWEEN';
                query.from = obj.from;
                query.to = obj.to;
                break;
            default:
                console.warn('Unknown operation type: "' + obj.operation + '". Obj: ', obj);
                query = null;
        }

        return query;
    }
    queryFieldName(newFieldName) {
        if (arguments.length !== 0) {
            this.__queryFieldName = newFieldName;
        }
        return this.__queryFieldName;
    }
    __computeLabel(label, dictionaryEntry) {
        return label === undefined ? dictionaryEntry : label;
    }
    isError() {
        const isFromTextFieldValueValid = this.$['from-text-field'].text.length !== 0;

        if (this._isRangeMode) {
            const isToTextFieldValueValid = this.$['to-text-field'].text.length !== 0;

            return !isFromTextFieldValueValid || !isToTextFieldValueValid;
        }
        return !isFromTextFieldValueValid;
    }
    setDefaultValues() {
        this.$['from-text-field'].text = this.$['to-text-field'].text = '';
        this.__currentSelectionDropDown = dropDownDefaultValue;
    }
    setAspects(aspects) {
        this.__aspects = aspects;
    }
    getFormatted() {
        let formatted;

        const obj = this.__getCurrentData();
        const oper = operations.find(item => {
            return item.name === obj.operation;
        });

        if (this._isRangeMode) {
            formatted = `${oper.label} ${obj.from} ${this.dictionary.stringAnd} ${obj.to}`;
        } else {
            formatted = `${oper.label} ${obj.value}`;
        }

        return formatted;
    }
    __changeOperation(operation) {
        if (operation !== '' && this.dictionary) {
            this._isRangeMode = operation !== undefined && (operation === 'between' || operation === 'notBetween');

            if (this._isRangeMode) {
                this.$['from-text-field'].label = this.__computeLabel(this.rangeStartValueLabel, this.dictionary.stringValue1);
            } else {
                this.$['from-text-field'].label = this.__computeLabel(this.valueLabel, this.dictionary.stringValue);
            }

            this.__setIsFilled();
        }
    }

    __setIsFilled() {
        this._setIsFilled(!this.isError());
    }
    __getCurrentData() {
        if (this.isError()) {
            return null;
        }

        if (this._isRangeMode) {
            return {
                operation: this.__currentSelectionDropDown,
                from:      Number(this.$['from-text-field'].text),
                to:        Number(this.$['to-text-field'].text)
            };
        }
        return {
            operation: this.__currentSelectionDropDown,
            value:     Number(this.$['from-text-field'].text)
        };
    }
    __updateTranslations() {
        if (this.dictionary) {
            for (let o of operations) {
                if (this.dictionary[o.translationKey]) {
                    o.label = this.dictionary[o.translationKey];
                }
            }
        }
        this.$['drop-down'].items = operations;

        this.__currentSelectionDropDown = '';
        this.__currentSelectionDropDown = dropDownDefaultValue;
    }
    __handleKeyUp(event) {
        if (event.key === 'Enter' && !this.isError()) {
            this.blur();
            this.dispatchEvent(new CustomEvent('data-approved', {
                bubbles:  true,
                composed: true
            }));
        }
    }
}

customElements.define(PTCSNumberCase.is, PTCSNumberCase);
