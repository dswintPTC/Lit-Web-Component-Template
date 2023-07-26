import {PolymerElement, html} from '@polymer/polymer/polymer-element.js';

import {PTCS} from 'ptcs-library/library.js';
import 'ptcs-behavior-styleable/ptcs-behavior-styleable.js';
import 'ptcs-behavior-focus/ptcs-behavior-focus.js';

const dropDownDefaultValue = 'exact';
const dropDownSelectDefaultValue = {val: '', label: ''};
const operations = [
    {name: 'exact', translationKey: 'stringExact', label: 'is exactly'},
    {name: 'startWith', translationKey: 'stringStartsWith', label: 'starts with'},
    {name: 'endWith', translationKey: 'stringEndsWith', label: 'ends with'},
    {name: 'contains', translationKey: 'stringContains', label: 'contains'},
    {name: 'isNot', translationKey: 'stringNot', label: 'is not'},
    {name: 'notStartWith', translationKey: 'stringNotStartsWith', label: 'does not start with'},
    {name: 'notEndWith', translationKey: 'stringNotEndsWith', label: 'does not end with'},
    {name: 'notContains', translationKey: 'stringNotContains', label: 'does not contain'}
];
class PTCSStringCase extends PTCS.BehaviorFocus(PTCS.BehaviorStyleable(PolymerElement)) {
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
                    width: 100%;
                }

                #drop-down, #text-field {
                    width: var(--ptcs-chip-data-filter-selector-dropdown-number-case-subcomponent-width);
                    margin-right: var(--subcomponent-margin-spacing);
                }

                :host([display="compact"]) #drop-down {
                    width: 100%;
                    margin-right: 0px;
                }

                :host([display="compact"]) #text-field {
                    width: 100%;
                    margin-top: var(--ptcs-chip-data-filter-selector-subcomponent-compact-top-margin);
                    margin-right: 0px;
                }

                #string-select-field {
                    width:        var(--ptcs-chip-data-filter-selector-dropdown-base-subcomponent-width);
                    margin-right: var(--subcomponent-margin-spacing);
                }

                :host([display="compact"]) #string-select-field {
                    width: 100%;
                    margin-right: 0px;
                }

                #string-text-container, #string-select-container {
                    display: none;
                }

                #string-text-container[data-enabled], #string-select-container[data-enabled] {
                    display: flex;
                }

                :host([display="compact"]) #string-text-container[data-enabled] {
                    flex-direction: column;
                    width: 100%;
                }

                :host([display="compact"]) #string-select-container[data-enabled] {
                    flex-direction: column;
                    width: 100%;
                }

            </style>
            <div id="string-text-container" data-enabled\$="[[!_isSelectMode]]">
                <ptcs-dropdown id="drop-down" part="drop-down" label="[[__computeLabel(conditionLabel, dictionary.stringCondition)]]"
                  selected-value="{{__currentSelectionDropDown}}"
                tabindex\$="[[_delegatedFocus]]" on-selected-indexes-changed="__setIsFilled" selector="label" value-selector="name">
                </ptcs-dropdown>
                <ptcs-textfield
                    id="text-field"
                    part="text-field"
                    label="[[__computeLabel(valueLabel, dictionary.stringValue)]]"
                    tabindex\$="[[_delegatedFocus]]"
                    on-text-changed="__setIsFilled"
                    on-keyup="__handleKeyUp">
                </ptcs-textfield>
            </div>
            <div id="string-select-container" data-enabled\$="[[_isSelectMode]]">
                <ptcs-dropdown
                    id="string-select-field"
                    part="string-select-field"
                    label="[[__computeLabel(valueLabel, dictionary.stringValue)]]"
                    tabindex\$="[[_delegatedFocus]]"
                    selected-indexes="{{__currentSelectionStringDropDownIndex}}"
                    selector="label"
                    value-selector="val"
                    filter="true"
                    treat-value-as-string="true"
                    on-selected-items-changed="__handleSelected">
                </ptcs-dropdown>
            </div>
        `;
    }
    static get is() {
        return 'ptcs-string-case';
    }
    static get properties() {
        return {
            dictionary: {
                type:     Object,
                observer: '__updateTranslations',
                value:    () => {}
            },
            conditionLabel: {
                type: String
            },
            valueLabel: {
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
            _delegatedFocus: {
                type:  String,
                value: null
            }
        };
    }
    ready() {
        super.ready();
        this.__updateTranslations();
        this.setDefaultValues();
    }
    set dataEnteredByUser(newData) {
        if (newData) {
            this.__currentSelectionDropDown = newData.operation;
            this.__setValue(newData.value);
            this.__setIsFilled();
        } else {
            this.setDefaultValues();
        }
    }
    get dataEnteredByUser() {
        return this.__getCurrentData();
    }
    /*
        An example of query:
        {
             "type": "LIKE",
             "fieldName": "textBasedCategory",
             "value": "Pol"
        }
    */
    get query() {
        if (this.isError() || !this.__queryFieldName) {
            return null;
        }

        const data = this.__getCurrentData();
        let operator = 'LIKE';
        let value = null;

        switch (data.operation) {
            case 'contains':
                if (data.value.indexOf('*') !== -1) {
                    value =  data.value;
                } else {
                    value = '*' + data.value + '*';
                }
                break;
            case 'startWith':
                value = data.value + '*';
                break;
            case 'endWith':
                value = '*' + data.value;
                break;
            case 'exact':
                value = data.value;
                operator = 'EQ';
                break;
            case 'notStartWith':
                operator = 'NOTLIKE';
                value = data.value + '*';
                break;
            case 'notEndWith':
                operator = 'NOTLIKE';
                value = '*' + data.value;
                break;
            case 'notContains':
                operator = 'NOTLIKE';
                value = '*' + data.value + '*';
                break;
            case 'isNot':
                operator = 'NOTLIKE';
                value = data.value;
                break;
            default:
                console.warn('Ignoring filter condition. Unknown operation type: "' + data.operation + '" in the filter: ', data);
                this.setDefaultValues();
                return null;
        }

        return {
            fieldName: this.__queryFieldName,
            type:      operator,
            value:     value
        };
    }
    queryFieldName(newFieldName) {
        this.__queryFieldName = newFieldName;
    }
    setDefaultValues() {
        this.__currentSelectionDropDown = dropDownDefaultValue;
        this.__currentSelectionStringDropDown = dropDownSelectDefaultValue;
        this.__setTextDefault();
    }

    setAspects(aspects) {
        this.__aspects = aspects;
        this.__processSelectOptions();
        this.__setTextDefault();
    }

    __processSelectOptions() {
        this._isSelectMode = false;
        this.__currentSelectionStringDropDownIndex = [];

        let aspects = this.__aspects || {};
        if (!aspects._selectOptions || aspects._selectOptions.length === 0) {
            return;
        }

        this._isSelectMode = true;
        this.$['string-select-field'].items = aspects._selectOptions;

        if (aspects.defaultValue) {
            let idx = aspects._selectOptions.findIndex(item => {
                return item.val === aspects.defaultValue;
            });
            this.__currentSelectionStringDropDownIndex = idx === -1 ? [] : [idx];
        }
    }

    __setTextDefault() {
        let aspects = this.__aspects || {};
        this.$['text-field'].text = aspects.defaultValue || '';
    }

    isError() {
        return !this.isFilled;
    }
    getFormatted() {
        const data = this.__getCurrentData();
        const display = this._isSelectMode ? this.__currentSelectionStringDropDown.label : data.value;

        return operations.find(o => o.name === data.operation).label + ': ' + display;
    }
    __computeLabel(label, dictionaryEntry) {
        return label === undefined ? dictionaryEntry : label;
    }
    __setIsFilled() {
        this._setIsFilled(this.__getValue());
    }
    __getCurrentData() {
        return {operation: this.__currentSelectionDropDown, value: this.__getValue()};
    }

    __getValue() {
        return this._isSelectMode ? this.__currentSelectionStringDropDown.val : this.$['text-field'].text;
    }

    __setValue(val) {
        if (this._isSelectMode) {
            this.__currentSelectionStringDropDown = this.__aspects._selectOptions.find(item => {
                return item.val === val;
            }) || dropDownSelectDefaultValue;
        } else {
            this.$['text-field'].text = val;
        }
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
            this.$['text-field'].blur();
            this.dispatchEvent(new CustomEvent('data-approved', {
                bubbles:  true,
                composed: true
            }));
        }
    }

    __handleSelected(event) {
        this.__currentSelectionStringDropDown = event.detail.value.length ? event.detail.value[0] : '';
        this.__setIsFilled();
    }
}

customElements.define(PTCSStringCase.is, PTCSStringCase);
