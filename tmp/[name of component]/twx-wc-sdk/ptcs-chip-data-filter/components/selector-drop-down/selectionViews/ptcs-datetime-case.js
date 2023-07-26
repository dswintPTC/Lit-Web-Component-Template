import {PolymerElement, html} from '@polymer/polymer/polymer-element.js';

import {PTCS} from 'ptcs-library/library.js';
import 'ptcs-datepicker/ptcs-datepicker.js';
import 'ptcs-behavior-styleable/ptcs-behavior-styleable.js';
import 'ptcs-behavior-focus/ptcs-behavior-focus.js';
import moment from 'ptcs-moment/moment-import.js';

const dropDownDefaultValue = 'within';
const operations = [
    {name: 'within', translationKey: 'stringWithinLast', label: 'within the last'},
    {name: 'between', translationKey: 'stringBetween', label: 'between'},
    {name: 'equals', translationKey: 'stringEquals', label: 'equal to'},
    {name: 'notEq', translationKey: 'stringNotEquals', label: 'not equal to'},
    {name: 'after', translationKey: 'stringAfter', label: 'after'},
    {name: 'afterEq', translationKey: 'stringAfterEq', label: 'after or equal to'},
    {name: 'before', translationKey: 'stringBefore', label: 'before'},
    {name: 'beforeEq', translationKey: 'stringBeforeEq', label: 'before or equal to'}
];
const dropDownWithinDefaultValue = 'h';
const withinUnits = [
    {name: 's', translationKey: 'stringSeconds', label: 'seconds'},
    {name: 'm', translationKey: 'stringMinuts', label: 'minutes'},
    {name: 'h', translationKey: 'stringHours', label: 'hours'},
    {name: 'd', translationKey: 'stringDays', label: 'days'},
    {name: 'w', translationKey: 'stringWeeks', label: 'weeks'},
    {name: 'M', translationKey: 'stringMonths', label: 'months'},
    {name: 'y', translationKey: 'stringYears', label: 'years'}
];

class PTCSDatetimeCase extends PTCS.BehaviorFocus(PTCS.BehaviorStyleable(PolymerElement)) {
    static get template() {
        //eslint-disable-next-line max-len
        return html`
            <style>
                :host {
                    display: flex;
                    align-items: flex-end;
                }
                :host([hidden]) {
                    display: none;
                }
                :host([display="compact"]) {
                    width: 100%;
                    flex-direction: column;
                    align-items: flex-start;
                }
                :host([__current-selection-drop-down="between"][compact-mode]) [part=drop-down] {
                    align-self: flex-start;
                }
                #date-picker, #date-picker-to {
                    width: var(--ptcs-chip-data-filter-selector-dropdown-base-subcomponent-width);
                }
                :host([display="compact"]) #date-picker {
                    width: 100%;
                    margin-top: var(--ptcs-chip-data-filter-selector-subcomponent-compact-top-margin);
                    margin-right: 0px;
                }
                :host([display="compact"]) #date-picker-to {
                    width: 100%;
                    margin-top: var(--ptcs-chip-data-filter-selector-subcomponent-compact-top-margin);
                    margin-right: 0px;
                }
                #drop-down, #within-text-field, #within-drop-down {
                    width: var(--ptcs-chip-data-filter-selector-dropdown-number-case-subcomponent-width);
                }
                :host([display="compact"]) #drop-down {
                    width: 100%;
                }
                :host([display="compact"]) #within-text-field {
                    width: 100%;
                    margin-top: var(--ptcs-chip-data-filter-selector-subcomponent-compact-top-margin);
                }
                :host([display="compact"]) #within-drop-down {
                    width: 100%;
                    margin-top: var(--ptcs-chip-data-filter-selector-subcomponent-compact-top-margin);
                }
                #drop-down, #date-picker, #date-picker-to, #within-text-field, #within-drop-down {
                    margin-right: var(--subcomponent-margin-spacing);
                }
                span {
                    align-self: center;
                    margin: var(--subcomponent-margin-spacing) var(--subcomponent-margin-spacing) 0px 0px;
                }
                #within-container {
                    display: none;
                }
                #within-container[data-enabled] {
                    display: flex;
                }
                :host([display="compact"]) #within-container[data-enabled] {
                    flex-direction: column;
                    width: 100%;
                }
                #date-container {
                    display: none;
                }
                #date-container[data-enabled] {
                    display: flex;
                    align-items: flex-end;
                }
                :host([display="compact"]) #date-container[data-enabled] {
                    display: flex;
                    width: 100%;
                }
                #between-container {
                    display: none;
                }
                #between-container[data-enabled] {
                    display: flex;
                    align-items: flex-end;
                }
                ptcs-datepicker::part(label-container) {
                    display: none;
                }
            </style>
            <ptcs-dropdown id="drop-down" part="drop-down" selected-value="{{__currentSelectionDropDown}}"
                label="[[__computeLabel(conditionLabel, dictionary.stringCondition)]]"
            tabindex\$="[[_delegatedFocus]]" on-selected-indexes-changed="__setIsFilled" selector="label" value-selector="name">
            </ptcs-dropdown>
            <div id="date-container" data-enabled\$="[[!_isWithinMode]]">
                <ptcs-datepicker
                    id="date-picker"
                    part="date-picker"
                    date-order="DMY"
                    tabindex\$="[[_delegatedFocus]]"
                    hint-text="[[dictionary.stringPleaseSelectDate]]"
                    done-label="[[dictionary.stringDoneLabelButton]]"
                    today-label="[[dictionary.stringToday]]"
                    hours-label="[[dictionary.stringHoursCap]]"
                    minutes-label="[[dictionary.stringMinutsCap]]"
                    seconds-label="[[dictionary.stringSecondsCap]]"
                    select-label="[[dictionary.stringSelect]]"
                    cancel-label="[[dictionary.stringCancel]]"
                    label-alignment="left"
                    show-time
                    display-seconds
                    date-range-selection="[[_opt(_isRangeMode, compactMode)]]"
                    from-field-label="[[__computeLabel(rangeStartValueLabel, dictionary.stringDate)]]"
                    from-time-label="[[__computeLabel(rangeStartTimeValueLabel, dictionary.stringTime)]]"
                    calendar-start-time-label="[[dictionary.stringStartTime]]"
                    to-field-label="[[__computeLabel(rangeEndValueLabel, dictionary.stringToDate)]]"
                    to-time-label="[[__computeLabel(rangeEndTimeValueLabel, dictionary.stringToTime)]]"
                    calendar-end-time-label="[[dictionary.stringEndTime]]"
                    date-label="[[__computeLabel(dateValueLabel, dictionary.stringDate)]]"
                    time-label="[[__computeLabel(timeValueLabel, dictionary.stringTime)]]"
                    on-selected-date-changed="__getCurrentSelectedRange"
                    format-token="[[formatToken]]"
                    date-order="[[dateOrder]]"
                    days-containing-any-data="[[daysContainingAnyData]]"
                    >
                </ptcs-datepicker>
            </div>
            <div id="between-container" data-enabled\$="[[_expanded(_isRangeMode, compactMode)]]">
                <span part="between-to-span"> [[dictionary.stringTo]] </span>
                <ptcs-datepicker
                    id="date-picker-to"
                    part="date-picker"
                    date-order="DMY"
                    tabindex\$="[[_delegatedFocus]]"
                    hint-text="[[dictionary.stringPleaseSelectDate]]"
                    done-label="[[dictionary.stringDoneLabelButton]]"
                    today-label="[[dictionary.stringToday]]"
                    hours-label="[[dictionary.stringHoursCap]]"
                    minutes-label="[[dictionary.stringMinutsCap]]"
                    seconds-label="[[dictionary.stringSecondsCap]]"
                    select-label="[[dictionary.stringSelect]]"
                    cancel-label="[[dictionary.stringCancel]]"
                    label-alignment="left"
                    show-time
                    display-seconds
                    from-field-label="[[__computeLabel(rangeStartValueLabel, dictionary.stringDate)]]"
                    from-time-label="[[__computeLabel(rangeStartTimeValueLabel, dictionary.stringFromTime)]]"
                    calendar-start-time-label="[[dictionary.stringStartTime]]"
                    to-field-label="[[__computeLabel(rangeEndValueLabel, dictionary.stringToDate)]]"
                    to-time-label="[[__computeLabel(rangeEndTimeValueLabel, dictionary.stringToTime)]]"
                    calendar-end-time-label="[[dictionary.stringEndTime]]"
                    date-label="[[__computeLabel(dateValueLabel, dictionary.stringDate)]]"
                    time-label="[[__computeLabel(timeValueLabel, dictionary.stringTime)]]"
                    on-selected-date-changed="__getCurrentSelectedRange"
                    format-token="[[formatToken]]"
                    date-order="[[dateOrder]]"
                    days-containing-any-data="[[daysContainingAnyData]]"
                </ptcs-datepicker>
            </div>
            <div id="within-container" data-enabled\$="[[_isWithinMode]]">
                <ptcs-textfield id="within-text-field" part="text-field"
                label="[[__computeLabel(valueLabel, dictionary.stringValue)]]"
                hint-text=[[dictionary.stringAddValue]] tabindex\$="[[_delegatedFocus]]"
                on-text-changed="__setIsFilled" on-keyup="__handleKeyUp"></ptcs-textfield>
                <ptcs-dropdown id="within-drop-down" part="drop-down" selected-value="{{__currentSelectionWithinDropDown}}"
                label="[[__computeLabel(unitsLabel, dictionary.stringUnits)]]"
                tabindex\$="[[_delegatedFocus]]" on-selected-indexes-changed="__setIsFilled" selector="label" value-selector="name">
                </ptcs-dropdown>
            </div>
        `;
    }
    static get is() {
        return 'ptcs-datetime-case';
    }
    static get properties() {
        return {
            dictionary: {
                type:     Object,
                observer: '__updateTranslations',
                value:    () => {}
            },
            // The text displayed above the drop-down list for the filter condition
            conditionLabel: {
                type: String
            },
            // The text displayed above the box which contains the value for the condition
            valueLabel: {
                type: String
            },
            // The text displayed above the drop-down list that is used to set the units when filtering by location or date.
            unitsLabel: {
                type: String
            },
            // The text displayed above the date input box
            dateValueLabel: {
                type: String
            },
            // The text displayed above the time input box
            timeValueLabel: {
                type: String
            },
            // The text displayed above the first input box when filtering a range of values.
            rangeStartValueLabel: {
                type: String
            },
            // The text displayed above the first time input box when filtering a range of values.
            rangeStartTimeValueLabel: {
                type: String
            },
            // The text displayed above the second input box when filtering a range of values.
            rangeEndValueLabel: {
                type: String
            },
            // The text displayed above the second time input box when filtering a range of values.
            rangeEndTimeValueLabel: {
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
            },
            formatToken: {
                type: String
            },
            dateOrder: {
                type: String
            },
            daysContainingAnyData: {
                type:  Array,
                value: () => []
            },
            __currentSelectionDropDown: {
                type:               String,
                reflectToAttribute: true,
                observer:           '__changeOperation'
            },
            __currentSelectionWithinDropDown: {
                type: String
            },
            _isRangeMode: {
                type:  Boolean,
                value: false
            },
            _isWithinMode: {
                type:  Boolean,
                value: false
            },
            compactMode: {
                type:               Boolean,
                reflectToAttribute: true
            }
        };
    }
    ready() {
        super.ready();
        this.__updateTranslations();
        this.setDefaultValues();
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
                if (!newData.from || !newData.to) {
                    console.warn('dataEnteredByUser: Missing from/to. newData: ', newData);
                    return;
                }
                if (this.compactMode) {
                    // In compact mode we use a single range datetime picker
                    this.$['date-picker'].fromDate = newData.from;
                    this.$['date-picker'].toDate = newData.to;
                } else {
                    // In expanded mode we use separate datetime pickers (one each for each end of the range)
                    this.$['date-picker'].dateTime = newData.from;
                    this.$['date-picker-to'].dateTime = newData.to;
                }
                break;
            case 'within':
                if (!newData.value || !newData.units) {
                    console.warn('dataEnteredByUser: Missing from/to. newData: ', newData);
                    return;
                }
                this.$['within-text-field'].text = newData.value;
                this.$['within-drop-down'].selectedValue = newData.units;
                break;
            default:
                if (!newData.date) {
                    console.warn('dataEnteredByUser: Missing date. newData: ', newData);
                    return;
                }
                this.$['date-picker'].dateTime = newData.date;
        }
    }
    get dataEnteredByUser() {
        return this.__getCurrentData();
    }
    get query() {
        if (this.isError() || !this.__queryFieldName) {
            return null;
        }
        const parseToTimestamp = (day) => Date.parse(day);
        const curDateObj = this.__getCurrentData();
        let retObj = {fieldName: this.__queryFieldName};

        switch (curDateObj.operation) {
            case 'between':
                retObj.type = 'BETWEEN';
                retObj.from = parseToTimestamp(curDateObj.from);
                retObj.to = parseToTimestamp(curDateObj.to);
                break;
            case 'equals':
                retObj.type = 'EQ';
                retObj.value = parseToTimestamp(curDateObj.date);
                break;
            case 'before':
                retObj.type = 'LT';
                retObj.value = parseToTimestamp(curDateObj.date);
                break;
            case 'beforeEq':
                retObj.type = 'LE';
                retObj.value = parseToTimestamp(curDateObj.date);
                break;
            case 'after':
                retObj.type = 'GT';
                retObj.value = parseToTimestamp(curDateObj.date);
                break;
            case 'afterEq':
                retObj.type = 'GE';
                retObj.value = parseToTimestamp(curDateObj.date);
                break;
            case 'notEq':
                retObj.type = 'NE';
                retObj.value = parseToTimestamp(curDateObj.date);
                break;
            case 'within': {
                const toDate = moment(); // current time
                const fromDate = moment(toDate).add(-1 * curDateObj.value, curDateObj.units);

                retObj.type = 'BETWEEN';
                retObj.from = parseToTimestamp(fromDate);
                retObj.to = parseToTimestamp(toDate);
                break;
            }
            default:
                console.warn('Unknown operation type: "' + curDateObj.operation + '". DateObj: ', curDateObj);
                retObj = null;
        }

        return retObj;
    }
    queryFieldName(newFieldName) {
        if (arguments.length === 0) {
            return this.__queryFieldName;
        }
        this.__queryFieldName = newFieldName;
        return this.__queryFieldName;
    }
    setDefaultValues() {
        this.$['date-picker'].dateTime = null;
        this.$['date-picker-to'].dateTime = null;
        this.$['within-text-field'].text = null;
        this.$['drop-down'].selectedValue = dropDownDefaultValue;
        this.$['within-drop-down'].selectedValue = dropDownWithinDefaultValue;
    }
    setAspects(aspects) {
        this.__aspects = aspects;
    }

    clearCache() {
        this.setDefaultValues();
    }
    isError() {
        if (this._isRangeMode && this.compactMode) {
            // In compact mode, verify that the one ptcs-datepicker's fromDate and toDate have been assigned
            return !(this.$['date-picker'].fromDate && this.$['date-picker'].toDate);
        } else if (this._isRangeMode) {
            // In expanded mode, verify that we have a range as defined by the two distinct datepickers
            return !(this.$['date-picker'].dateTime && this.$['date-picker-to'].dateTime);
        } else if (this._isWithinMode) {
            return !(this.$['within-drop-down'].selectedValue && this.$['within-text-field'].text);
        }
        return !this.$['date-picker'].dateTime;
    }
    getFormatted() {
        const dateFormat = this.formatToken ? this.formatToken : 'DD-MMMM-YYYY, HH:mm:ss';
        const dateObj = this.__getCurrentData();

        switch (dateObj.operation) {
            case 'between':
                return `${this.dictionary.stringBetween} ${moment(dateObj.from).format(dateFormat)}
                    ${this.dictionary.stringAnd} ${moment(dateObj.to).format(dateFormat)}`;
            case 'equals':
                return `${this.dictionary.stringEquals} ${moment(dateObj.date).format(dateFormat)}`;
            case 'before':
                return `${this.dictionary.stringBefore} ${moment(dateObj.date).format(dateFormat)}`;
            case 'beforeEq':
                return `${this.dictionary.stringBeforeEq} ${moment(dateObj.date).format(dateFormat)}`;
            case 'after':
                return `${this.dictionary.stringAfter} ${moment(dateObj.date).format(dateFormat)}`;
            case 'afterEq':
                return `${this.dictionary.stringAfterEq} ${moment(dateObj.date).format(dateFormat)}`;
            case 'notEq':
                return `${this.dictionary.stringNotEquals} ${moment(dateObj.date).format(dateFormat)}`;
            case 'within':
                return `${this.dictionary.stringWithinLast} ${dateObj.value} ${withinUnits.find(o => o.name === dateObj.units).label}`;
        }

        console.warn('Unsupported operation: "' + dateObj.operation + '". DateObj: ', dateObj);
        return null;
    }

    __computeLabel(label, dictionaryEntry) {
        return label === undefined ? dictionaryEntry : label;
    }
    __setIsFilled() {
        this._setIsFilled(!this.isError());
    }
    __getCurrentSelectedRange() {
        this.__setIsFilled();
    }
    __getCurrentData() {
        if (this.isError()) {
            return null;
        }

        if (this._isRangeMode && this.compactMode) {
            return {
                operation: this.__currentSelectionDropDown,
                from:      this.$['date-picker'].fromDate,
                to:        this.$['date-picker'].toDate
            };
        } else if (this._isRangeMode) {
            return {
                operation: this.__currentSelectionDropDown,
                from:      this.$['date-picker'].dateTime,
                to:        this.$['date-picker-to'].dateTime
            };
        } else if (this._isWithinMode) {
            return {
                operation: this.__currentSelectionDropDown,
                value:     this.$['within-text-field'].text,
                units:     this.$['within-drop-down'].selectedValue};
        }
        return {
            operation: this.__currentSelectionDropDown,
            date:      this.$['date-picker'].dateTime
        };
    }
    __updateTranslations() {
        if (this.dictionary) {
            for (let o of operations) {
                if (this.dictionary[o.translationKey]) {
                    o.label = this.dictionary[o.translationKey];
                }
            }
            for (let o of withinUnits) {
                if (this.dictionary[o.translationKey]) {
                    o.label = this.dictionary[o.translationKey];
                }
            }
        }
        this.$['drop-down'].items = operations;
        this.$['within-drop-down'].items = withinUnits;

        this.$['drop-down'].selectedValue = '';
        this.$['within-drop-down'].selectedValue = '';
        this.$['drop-down'].selectedValue = dropDownDefaultValue;
        this.$['within-drop-down'].selectedValue = dropDownWithinDefaultValue;

    }
    __changeOperation(operation) {
        this._isRangeMode = operation === 'between';
        this._isWithinMode = operation === 'within';

        this.__setIsFilled();
    }

    _opt(a, b) {
        return a && b;
    }

    _expanded(a, b) {
        return a && !b;
    }
}

customElements.define(PTCSDatetimeCase.is, PTCSDatetimeCase);
