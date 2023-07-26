import {PolymerElement, html} from '@polymer/polymer/polymer-element.js';
import {PTCS} from 'ptcs-library/library.js';
import {createSubComponent} from 'ptcs-library/create-sub-component.js';
import 'ptcs-button/ptcs-button.js';
import 'ptcs-dropdown/ptcs-dropdown.js';
import moment from 'ptcs-moment/moment-import.js';

import './selectionViews/ptcs-number-case.js';
import './selectionViews/ptcs-string-case.js';
import './selectionViews/ptcs-boolean-case.js';
import './selectionViews/ptcs-datetime-case.js';
import './selectionViews/ptcs-location-case.js';

const extElem = new Set(['PTCS-NUMBER-CASE', 'PTCS-STRING-CASE', 'PTCS-BOOLEAN-CASE', 'PTCS-DATETIME-CASE', 'PTCS-LOCATION-CASE']);

class PTCSselector extends PTCS.BehaviorFocus(PTCS.BehaviorStyleable(PTCS.ThemableMixin(PolymerElement))) {
    static get template() {
        return html`
            <style>
                :host{
                    --subcomponent-margin-spacing: var(--ptcs-chip-data-filter-selector-dropdown-subcomponent-spacing);
                }
                :host([display="compact"][mode="open"]) {
                    display: block;
                }
                :host([display="compact"][mode="closed"]) {
                    display: none;
                }
                :host([display="compact"]) {
                    position: absolute;
                    z-index:  99990;
                }
                [part="filters-container"] {
                    display: flex;
                    flex-wrap: wrap;
                    align-items: flex-end;
                }
                :host([display="compact"]) [part="filters-container"] {
                    flex-direction: column;
                    align-items: flex-start;
                }
                [part="main-drop-down"] {
                    align-self: flex-start;
                }
                [part="main-drop-down"], [part="no-selection"] {
                    width:  var(--ptcs-chip-data-filter-selector-dropdown-base-subcomponent-width);
                    margin-right: var(--subcomponent-margin-spacing);
                }
                :host([display="compact"]) [part="main-drop-down"] {
                    width: 100%;
                }
                :host([display="compact"]) [part="no-selection"] {
                    width: 100%;
                }
                [part="apply-button"], [part="cancel-button"] {
                    align-self: flex-end;
                }
                ptcs-textfield[hidden] {
                    display: none;
                }
            </style>
            <div id="container" part="filters-container">
                <ptcs-dropdown id="main-drop-down" part="main-drop-down" label="[[__computeLabel(categoryLabel, dictionary.stringFilterBy)]]"
                on-selected-indexes-changed="__handleMainDropDownIndexChange" filter="[[showListFilter]]" tabindex\$="[[_tabindex]]"
                selector="label" valueSelector="value" disabled></ptcs-dropdown>

                <ptcs-textfield id="no-selection-case-text-field" part="no-selection"
                label="[[__computeLabel(conditionLabel, dictionary.stringCondition)]]"
                hint-text=[[dictionary.stringSelectFilterFirst]] disabled tabindex\$="[[_tabindex]]"
                hidden\$="[[__setHiddenIfPossible(__selectedItemParamsMainDropDown)]]"></ptcs-textfield>

                <span id="buttons-container" part="buttons-container">
                    <ptcs-button id="apply-button" part="apply-button" disabled variant="primary" label="[[_setApplyLabel(dictionary.stringAdd)]]"
                        content-align="center" mode="label" on-click="__handleApplyClick" tabindex\$="[[_tabindex]]"></ptcs-button>
                    <ptcs-button id="cancel-button" part="cancel-button" variant="secondary" label=[[dictionary.stringCancel]]
                        content-align="center" mode="label" on-click="__handleCancelClick" tabindex\$="[[_tabindex]]"></ptcs-button>
                </span>
            </div>
        `;
    }
    static get is() {
        return 'ptcs-chip-data-filter-selector-dropdown';
    }
    static get properties() {
        return {
            dictionary: {
                type:  Object,
                value: () => {}
            },
            // The text displayed above the drop-down list for the filter categories
            categoryLabel: {
                type: String
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
            // The text above the field used to select the start of the time range
            rangeStartTimeValueLabel: {
                type: String
            },
            // The text above the field used to select the end of the time range
            rangeEndTimeValueLabel: {
                type: String
            },
            // The text displayed above the drop-down list that is used to set the units when filtering by location or date.
            unitsLabel: {
                type: String
            },
            // The text displayed above the input box for latitude when filtering by location.
            latitudeLabel: {
                type: String
            },
            // The text displayed above the input box for longitude when filtering by location.
            longitudeLabel: {
                type: String
            },
            _data: {
                type:     Object,
                value:    null,
                observer: '__handleDataChange'
            },
            _lastFieldDefinitions: {
                type:  Object,
                value: null
            },
            _delegatedFocus: {
                type: String
            },
            subTabindex: {
                type: String
            },
            _tabindex: {
                type:     String,
                computed: '_computeTabindex(_delegatedFocus, subTabindex)'
            },
            formatToken: {
                type: String
            },
            dateOrder: {
                type: String
            },
            showListFilter: {
                type: Boolean
            },
            customBaseTypesMapping: {
                type:  Object,
                value: () => {}
            },
            columnFormat: {
                type:  String,
                value: null
            },
            sortFilters: {
                type:     Boolean,
                value:    true,
                observer: '__updateData'
            },
            mode: {
                type:               String,
                value:              'closed',
                reflectToAttribute: true
            },
            display: {
                type:               String,
                value:              'compact',
                reflectToAttribute: true
            },
            operator: {
                type:  String,
                value: 'And'
            },
            daysContainingAnyData: {
                type:  Array,
                value: () => []
            }
        };
    }
    constructor() {
        super();
        this.__caseRelatedDataInOrder = []; // the property keeps data entered by a user related with the different filter options
        this.__selectedItemParamsMainDropDown = {
            idx:      undefined,
            dataType: undefined,
            name:     undefined,
            label:    undefined,
            aspects:  undefined
        };

        // Simulate a click on the 'Apply' button
        this.__forceClickOntoApplyBind = this.__forceClickOntoApply.bind(this);

        // Dynamically loaded sub-components
        this.__mapCmpnt = {};
    }
    ready() {
        super.ready();
        this._ready = true;
        this.addEventListener('keydown', this._keyDown.bind(this));
    }

    _computeTabindex(_delegatedFocus, subTabindex) {
        // Return: undefined || '-1' || '0'
        const f = v => {
            if (v === -1 || v === '-1') {
                return '-1';
            }
            return ((v || v === 0) && v >= 0) ? '0' : undefined;
        };

        return f(_delegatedFocus || subTabindex);
    }

    get query() {
        const filters = this.__caseRelatedDataInOrder
            .filter(specCase => specCase.query)
            .map(specCase => specCase.query);

        if (filters.length) {
            let queryHeader = {
                filters: {
                    type:    this.operator,
                    filters: filters
                }
            };
            return queryHeader;
        }
        return null;
    }
    set data(inputData) {
        if (inputData && inputData.dataShape && inputData.dataShape.fieldDefinitions) {
            let shouldUpdateFilters = false;

            if (this.columnFormat) {
                let colFormat = JSON.parse(this.columnFormat);
                this.columnFormat = null; // we will use it once

                if (!this.__wasDataShapeChanged(colFormat, inputData.dataShape.fieldDefinitions)) {
                    shouldUpdateFilters = true; // we have to re-load filters since items order/localization/visibility may change from datashape
                    this._lastFieldDefinitions = colFormat;
                }
                // else do nothing - ignore columnFormat that was prepared by IDE since actual dataShape doesn't match it
            }

            if (!shouldUpdateFilters && this.__wasDataShapeChanged(this._lastFieldDefinitions, inputData.dataShape.fieldDefinitions)) {
                shouldUpdateFilters = true;
                this._lastFieldDefinitions = inputData.dataShape.fieldDefinitions;
            }

            if (!shouldUpdateFilters) {
                return;
            }

            this.__updateData();
        } else {
            console.error('Incorrect format of data passed to selector [data-filter]', inputData);
        }
    }

    __updateData() {
        if (!this._lastFieldDefinitions) {
            return;
        }

        const [dropDownItems, filteredData] = this.__getFilteredOutStructs(this._lastFieldDefinitions);
        /* debug only
        if (JSON.stringify(filteredData) === JSON.stringify(this._data)) {
            console.warn('Very strange, should never get here');
            return;
        }
        */
        const q = this.query;
        [this.$['main-drop-down'].items, this._data] = [dropDownItems, filteredData];
        if (q) {
            this.loadQuery(q);
        }
    }

    get data() {
        return this._data;
    }

    _setApplyLabel(stringAdd) {
        return this.display === 'compact' ? this.dictionary.stringApply : stringAdd;
    }

    __computeLabel(label, dictionaryEntry) {
        return label === undefined ? dictionaryEntry : label;
    }

    removeEnteredData(index, fieldName) {
        this.__clearCache(fieldName);
        this.__caseRelatedDataInOrder.splice(index, 1);
        this.__emmitChangeEvent();
    }

    __wasDataShapeChanged(fieldDefinitions1, fieldDefinitions2) {
        if (!this.fieldDefinitions1 && !fieldDefinitions2) {
            return false;
        }

        if (!fieldDefinitions1 || !fieldDefinitions2) {
            return true;
        }

        const keys1 = Object.keys(fieldDefinitions1);
        const keys2 = Object.keys(fieldDefinitions2);

        if (keys1.length !== keys2.length) {
            return true;
        }

        let shouldUpdateFilters = false;
        for (let prop in fieldDefinitions1) {
            if (fieldDefinitions2[prop] === undefined) {
                shouldUpdateFilters = true;
                break;
            } else if (fieldDefinitions1[prop].baseType !== fieldDefinitions2[prop].baseType) {
                shouldUpdateFilters = true;
                break;
            }
        }

        return shouldUpdateFilters;
    }

    __emmitChangeEvent() {
        this.dispatchEvent(new CustomEvent(
            'change',
            {
                bubbles:  true,
                composed: true,
                detail:   {
                    data: this.__caseRelatedDataInOrder.slice()
                }
            })
        );
    }

    __emitCloseEvent(apply) {
        this.dispatchEvent(new CustomEvent(
            'close',
            {
                bubbles:  true,
                composed: true,
                detail:   {
                    data: apply
                }
            })
        );
    }

    __handleDataChange() {
        this.__setDefaultSelectorSetting();
        this.__caseRelatedDataInOrder = [];
        this.__emmitChangeEvent();
    }

    __toggleApply(event) {
        this.$['apply-button'].disabled = !event.detail.value;
    }

    __handleApplyClick() {
        if (!this.$['apply-button'].hasAttribute('disabled')) {
            this.__hideCaseComp();
            this.mode = 'closed';
            this.__saveSelection();
            this.__setDefaultSelectorSetting();
            this.__emitCloseEvent(true);
        }
    }

    __handleCancelClick() {
        this.__setDefaultSelectorSetting();
        this.__hideCaseComp();
        this.mode = 'closed';
        this.__emitCloseEvent(false);
    }

    cancelPopup() {
        if (this.display === 'compact' && this.mode !== 'closed') {
            this.__handleCancelClick();
        }
    }

    reset() {
        // Reset any data (as if the cancel button had been pressed)
        this.__handleCancelClick();
    }

    __hideCaseComp() {
        // Hides the subcomponents when closing the flyover
        ['datetime', 'location', 'boolean', 'number', 'string'].forEach(id => {
            const el = this.$.container.querySelector(`ptcs-${id}-case`);
            if (el) {
                el.setAttribute('hidden', '');
            }
        });
    }

    // Re-create query from parameter
    loadQuery(query) {
        if (!query || !query.filters) {
            return;
        }
        this.__loadQueryRelationsFilter(query.filters);
        this.__hideCaseComp();
    }

    __loadQueryRelationsFilter(filter) {
        if (filter.type && (filter.type.toLowerCase() === 'and' || filter.type.toLowerCase() === 'or')) {
            this.__loadQuerySiblingChips(filter.filters);
        } else {
            this.__loadQuerySiblingChips([filter]);
        }
    }

    __loadQuerySiblingChips(filters) {
        if (!filters) {
            return;
        }
        if (!this._ready) {
            return;
        }

        // ptcs-chip-data-filter-selector-dropdown
        const fieldDefinitionsArray = Object.values(this._data.dataShape.fieldDefinitions);
        const dropdown = this.$['main-drop-down'];

        // Components that may be loaded dynamically
        let stringCaseComp, datetimeCaseComp, locationCaseComp, booleanCaseComp, numberCaseComp;

        let idx, baseType;
        for (const expr of filters) {
            // Future support for nested operations
            if (expr.type && (expr.type.toLowerCase() === 'and' || expr.type.toLowerCase() === 'or')) {
                this.__loadQueryRelationsFilter(expr.filters);
                continue;
            }
            // Boolean or number category: A chip for a category replaces an existing chip in same category.
            // Select the filter item in main dropdown and resolve its baseType
            idx = fieldDefinitionsArray.findIndex(item => item.name === expr.fieldName);
            if (idx === -1) {
                console.warn('Ignoring filter condition. Unknown field name "' + expr.fieldName + '" in query: ', filters);
                continue;
            }

            let obj = {};
            dropdown.selected = idx;
            baseType = this.__getBaseDataType(fieldDefinitionsArray[idx].baseType);
            switch (baseType) {
                case 'string': {
                    if (!stringCaseComp) {
                        stringCaseComp = this.__getSubCmpnt('ptcs-string-case');
                    }
                    switch (expr.type) {
                        case 'EQ':
                            obj.operation = 'exact';
                            obj.value = expr.value;
                            break;
                        case 'NOTLIKE':
                            if (expr.value.startsWith('*') && expr.value.endsWith('*')) {
                                obj.operation = 'notContains';
                                obj.value = expr.value.substr(1, expr.value.length - 2);
                            } else if (expr.value.startsWith('*')) {
                                obj.operation = 'notEndWith';
                                obj.value = expr.value.substr(1, expr.value.length - 1);
                            } else if (expr.value.endsWith('*')) {
                                obj.operation = 'notStartWith';
                                obj.value = expr.value.substr(0, expr.value.length - 1);
                            } else {
                                obj.operation = 'isNot';
                                obj.value = expr.value;
                            }
                            break;
                        case 'LIKE':
                            if (expr.value.startsWith('*') && expr.value.endsWith('*')) {
                                obj.operation = 'contains';
                                obj.value = expr.value.substr(1, expr.value.length - 2);
                            } else if (expr.value.startsWith('*')) {
                                obj.operation = 'endWith';
                                obj.value = expr.value.substr(1, expr.value.length - 1);
                            } else if (expr.value.endsWith('*')) {
                                obj.operation = 'startWith';
                                obj.value = expr.value.substr(0, expr.value.length - 1);
                            } else { // default case
                                obj.operation = 'contains';
                                obj.value = expr.value;
                            }
                            break;
                        default:
                            console.warn('Ignoring filter condition. Unknown operation type: "' + expr.type + '" in condition: ', expr);
                            continue;
                    }
                    stringCaseComp.dataEnteredByUser = obj;
                    break;
                }
                case 'number': {
                    if (!numberCaseComp) {
                        numberCaseComp = this.__getSubCmpnt('ptcs-number-case');
                    }
                    switch (expr.type) {
                        case 'EQ':
                            obj.value = expr.value;
                            obj.operation = '=';
                            break;
                        case 'NE':
                            obj.value = expr.value;
                            obj.operation = '≠';
                            break;
                        case 'LT':
                            obj.operation = '<';
                            obj.value = expr.value;
                            break;
                        case 'LE':
                            obj.operation = '<=';
                            obj.value = expr.value;
                            break;
                        case 'GT':
                            obj.operation = '>';
                            obj.value = expr.value;
                            break;
                        case 'GE':
                            obj.operation = '>=';
                            obj.value = expr.value;
                            break;
                        case 'NOTBETWEEN':
                            obj.from = expr.from;
                            obj.to = expr.to;
                            obj.operation = 'notBetween';
                            break;
                        case 'BETWEEN': {
                            obj.from = expr.from;
                            obj.to = expr.to;
                            obj.operation = 'between';
                            break;
                        }
                    }
                    numberCaseComp.dataEnteredByUser = obj;
                    break;
                }
                case 'boolean':
                    if (!booleanCaseComp) {
                        booleanCaseComp = this.__getSubCmpnt('ptcs-boolean-case');
                    }
                    booleanCaseComp.dataEnteredByUser = expr.value;
                    break;

                case 'datetime': {
                    if (!datetimeCaseComp) {
                        datetimeCaseComp = this.__getSubCmpnt('ptcs-datetime-case');
                    }
                    switch (expr.type) {
                        case 'EQ': {// backward compatibility
                            obj.date = moment(expr.value);
                            obj.operation = 'equals';
                            break;
                        }
                        case 'LT':
                            obj.operation = 'before';
                            obj.date = moment(expr.value);
                            break;
                        case 'LE':
                            obj.operation = 'beforeEq';
                            obj.date = moment(expr.value);
                            break;
                        case 'GT':
                            obj.operation = 'after';
                            obj.date = moment(expr.value);
                            break;
                        case 'GE':
                            obj.operation = 'afterEq';
                            obj.date = moment(expr.value);
                            break;
                        case 'NE':
                            obj.operation = 'notEq';
                            obj.date = moment(expr.value);
                            break;
                        case 'BETWEEN': {
                            const fromDate = moment(expr.from);
                            const toDate = moment(expr.to);

                            const diffFromNow = moment().diff(toDate, 'seconds');
                            if (diffFromNow >= 0 && diffFromNow < 60) { // toDate is less then 1min from now. winthin case
                                const diff = moment.duration(toDate.diff(fromDate));
                                obj.operation = 'within'; // the only case when start time isn't 00:00:00
                                let totalDuration = diff.asYears() | 0;
                                if (totalDuration !== 0) {
                                    obj.units = 'y';
                                    obj.value = totalDuration;
                                    break;
                                }
                                totalDuration = diff.asMonths() | 0;
                                if (totalDuration !== 0) {
                                    obj.units = 'M';
                                    obj.value = totalDuration;
                                    break;
                                }
                                totalDuration = diff.asWeeks() | 0;
                                if (totalDuration !== 0) {
                                    obj.units = 'w';
                                    obj.value = totalDuration;
                                    break;
                                }
                                totalDuration = diff.asDays() | 0;
                                if (totalDuration !== 0) {
                                    obj.units = 'd';
                                    obj.value = totalDuration;
                                    break;
                                }
                                totalDuration = diff.asHours() | 0;
                                if (totalDuration !== 0) {
                                    obj.units = 'h';
                                    obj.value = totalDuration;
                                    break;
                                }
                                totalDuration = diff.asMinutes() | 0;
                                if (totalDuration !== 0) {
                                    obj.units = 'm';
                                    obj.value = totalDuration;
                                    break;
                                }
                                totalDuration = diff.asSeconds() | 0;
                                if (totalDuration !== 0) {
                                    obj.units = 's';
                                    obj.value = totalDuration;
                                    break;
                                }
                            } else {
                                obj.from = fromDate;
                                obj.to = toDate;
                                obj.operation = 'between';
                            }
                            break;
                        }
                    }
                    datetimeCaseComp.dataEnteredByUser = obj;
                    break;
                }
                case 'location':
                    if (!locationCaseComp) {
                        locationCaseComp = this.__getSubCmpnt('ptcs-location-case');
                    }
                    obj.type = expr.type;
                    obj.value = expr.distance;
                    obj.units = this._convertLocationUnits(expr.units);
                    obj.latitude = expr.location.latitude;
                    obj.longitude = expr.location.longitude;
                    locationCaseComp.dataEnteredByUser = obj;
                    break;
                default:
                    console.warn('baseType "' + baseType + '" not handled', expr);
                    continue;
            }
            this.__saveSelection();
            this.__setDefaultSelectorSetting();
        }
    }


    __setDefaultSelectorSetting() {
        this.$['main-drop-down'].selected = -1;
        this.$['apply-button'].disabled = true;
        this.$['main-drop-down'].disabled = this.$['main-drop-down'].items.length === 0;

        this.$['no-selection-case-text-field'].disabled = true;
    }

    //    Returns <ptcs-number-case>, <ptcs-text-case>, <ptcs-datetime-case>, <ptcs-boolean-case>, undefined, ...
    __getSelectedCaseComponent() {
        const dataType = this.__selectedItemParamsMainDropDown.dataType;
        const selectedCaseComponent = dataType && this.$.container.querySelector(`ptcs-${dataType.toLowerCase()}-case`);

        return selectedCaseComponent;
    }
    __saveSelection() {
        const selectedCaseComponent = this.__getSelectedCaseComponent();
        if (selectedCaseComponent) {
            const query = selectedCaseComponent.query;
            if (!query) {
                return;
            }
            const selectedItemIdxDropDown = this.__selectedItemParamsMainDropDown.idx;
            const selectedItemCategoryDropDown = this.__selectedItemParamsMainDropDown.label;
            const dataToBeInserted = {
                query:             query,
                dataEnteredByUser: selectedCaseComponent.dataEnteredByUser,
                formatted:         `${selectedItemCategoryDropDown}: ${selectedCaseComponent.getFormatted()}`,
                isError:           selectedCaseComponent.isError(),
                innerIdx:          selectedItemIdxDropDown,
                fieldName:         selectedCaseComponent.__queryFieldName,
                element:           selectedCaseComponent
            };
            this.__caseRelatedDataInOrder.push(dataToBeInserted); // save new data
            this.__emmitChangeEvent();
        }
    }
    __loadDataForSelectedOption() {
        const selectedCaseComponent = this.__getSelectedCaseComponent();
        if (selectedCaseComponent) {
            selectedCaseComponent.setDefaultValues();
            selectedCaseComponent.queryFieldName(this.__selectedItemParamsMainDropDown.name);
            selectedCaseComponent.setAspects(this.__processAspects());
        }
    }

    /**
     * Preprocesses aspects field for uniformity...
     * selectOptions -> _selectOptions
     *     Assumes comma delimited string in pattern of val1:displayText1,val2:displayText2 where the each entry is parsed into 2 parts
     *     the first is the internal value separated by a colon and the second value is the display text
     * @returns {object}
     * @private
     */
    __processAspects() {
        if (!this.__selectedItemParamsMainDropDown.aspects) {
            return undefined;
        }

        let aspects = this.__selectedItemParamsMainDropDown.aspects;
        if (aspects.selectOptions) {
            let items = aspects.selectOptions.split(',');
            aspects._selectOptions = items.map(item => {
                let parts = item.split(':');
                let val = parts.shift();
                let label = parts.join(':');
                return {val, label};
            });
        }
        return aspects;
    }
    __isThisDataTypeHidden(refDataType) {
        refDataType = refDataType + '';
        const selectedDataType = this.__selectedItemParamsMainDropDown.dataType || 'undefined';
        return refDataType.toLowerCase() !== selectedDataType.toLowerCase();
    }
    __setHiddenIfPossible() {
        return this.__isThisDataTypeHidden('undefined') && 'hidden';
    }

    // Function to create subcomponents (ptcs-number-case, ptcs-string-case, etc)
    __createSubCmpnt(component) {
        let cmpnt;
        switch (component) {
            case 'ptcs-string-case':
                cmpnt = createSubComponent(this, `<ptcs-string-case id="string-case" part="string-case" display="[[display]]"
                          dictionary="[[dictionary]]" tabindex="[[_tabindex]]"
                          value-label="[[valueLabel]]" condition-label="[[conditionLabel]]"
                          hidden="[[__isThisDataTypeHidden('string')]]">`);
                break;
            case 'ptcs-boolean-case':
                cmpnt = createSubComponent(this, `<ptcs-boolean-case id="boolean-case" part="boolean-case" display="[[display]]"
                          dictionary="[[dictionary]]" condition-label="[[conditionLabel]]" tabindex="[[_tabindex]]"
                          hidden="[[__isThisDataTypeHidden('boolean', __selectedItemParamsMainDropDown)]]">`);
                break;
            case 'ptcs-number-case':
                cmpnt = createSubComponent(this, `<ptcs-number-case id="number-case" part="number-case" display="[[display]]"
                          dictionary="[[dictionary]]" tabindex="[[_tabindex]]" condition-label="[[conditionLabel]]"
                          value-label="[[valueLabel]]" range-start-value-label="[[rangeStartValueLabel]]"
                          range-end-value-label="[[rangeEndValueLabel]]" hidden="[[__isThisDataTypeHidden('number')]]">`);
                break;
            case 'ptcs-datetime-case':
                cmpnt = createSubComponent(this, `<ptcs-datetime-case id="datetime-case" part="datetime-case" display="[[display]]"
                          dictionary="[[dictionary]]" tabindex="[[_tabindex]]" condition-label="[[conditionLabel]]"
                          range-start-value-label="[[rangeStartValueLabel]]" range-end-value-label="[[rangeEndValueLabel]]"
                          range-start-time-value-label="[[rangeStartTimeValueLabel]]" range-end-time-value-label="[[rangeEndTimeValueLabel]]"
                          units-label="[[unitsLabel]]" value-label="[[valueLabel]]"  format-token="[[formatToken]]"
                          date-order="[[dateOrder]]" days-containing-any-data="[[daysContainingAnyData]]" compact-mode="[[_compactMode(display)]]"
                          hidden="[[__isThisDataTypeHidden('datetime')]]">`);
                break;
            case 'ptcs-location-case':
                cmpnt = createSubComponent(this, `<ptcs-location-case id="location-case" part="location-case" display="[[display]]"
                          dictionary="[[dictionary]]"
                          tabindex="[[_tabindex]]" condition-label="[[conditionLabel]]" value-label="[[valueLabel]]"
                          latitude-label="[[latitudeLabel]]" longitude-label="[[longitudeLabel]]" units-label="[[unitsLabel]]"
                          hidden="[[__isThisDataTypeHidden('location')]]">`);
                break;
        }
        if (cmpnt) {
            this.$.container.insertBefore(cmpnt, this.$['buttons-container']);
            cmpnt.addEventListener('is-filled-changed', e => {
                this.$['apply-button'].disabled = !e.detail.value;
            });
            if (component !== 'ptcs-boolean-case') {
                cmpnt.addEventListener('data-approved', this.__forceClickOntoApplyBind);
            }
        }
        return cmpnt;
    }

    // Function that retrieves or create subcomponents (ptcs-number-case, ptcs-string-case, etc)
    __getSubCmpnt(component) {
        let cmpnt = this.__mapCmpnt[component];
        if (cmpnt) {
            return cmpnt;
        }
        cmpnt = this.__mapCmpnt[component] = this.__createSubCmpnt(component);
        return cmpnt;
    }

    __handleMainDropDownIndexChange(event) {
        // The main dropdown in ptcs-chip-data-filter-selector-dropdown leads to displaying a subcomponent based on
        // type, i.e. ptcs-string-case, ptcs-number-case, ptcs-location-case etc, created lazily on first use.

        if (!this._ready) {
            return;
        }

        const outputIdx = event.detail.value[0];
        this.__hideCaseComp(); // In case user picks other filter in Add Filter while dialog is open, hide first
        const setSelectedItemParams = () => {
            let outputDataType, outputName, outputLabel, outputAspects;
            if (outputIdx !== undefined) {
                const fieldDefinitionsArray = Object.values(this._data.dataShape.fieldDefinitions);

                outputDataType = outputIdx < fieldDefinitionsArray.length
                    ? this.__getBaseDataType(fieldDefinitionsArray[outputIdx].baseType) : undefined;
                outputName = fieldDefinitionsArray[outputIdx].name;
                outputLabel = fieldDefinitionsArray[outputIdx].Title ? fieldDefinitionsArray[outputIdx].Title : fieldDefinitionsArray[outputIdx].name;
                outputAspects = fieldDefinitionsArray[outputIdx].aspects;

                let stringCmpnt, booleanCmpnt, numberCmpnt, datetimeCmpnt, locationCmpnt;
                const subCmpnt = outputDataType.toUpperCase();
                switch (subCmpnt) {
                    case 'DATETIME': {
                        if (!datetimeCmpnt) {
                            datetimeCmpnt = this.__getSubCmpnt('ptcs-datetime-case');
                        }
                        datetimeCmpnt.removeAttribute('hidden');
                        break;
                    }
                    case 'LOCATION': {
                        if (!locationCmpnt) {
                            locationCmpnt = this.__getSubCmpnt('ptcs-location-case');
                        }
                        locationCmpnt.removeAttribute('hidden');
                        break;
                    }
                    case 'BOOLEAN': {
                        if (!booleanCmpnt) {
                            booleanCmpnt = this.__getSubCmpnt('ptcs-boolean-case');
                        }
                        booleanCmpnt.removeAttribute('hidden');
                        break;
                    }
                    case 'INTEGER':
                    case 'NUMBER': {
                        if (!numberCmpnt) {
                            numberCmpnt = this.__getSubCmpnt('ptcs-number-case');
                        }
                        numberCmpnt.removeAttribute('hidden');
                        break;
                    }
                    case 'STRING':
                        if (!stringCmpnt) {
                            stringCmpnt = this.__getSubCmpnt('ptcs-string-case');
                        }
                        stringCmpnt.removeAttribute('hidden');
                        break;
                    default: {
                        console.warn('unhandled basetype');
                    }
                }
            }

            this.__selectedItemParamsMainDropDown = { // update __selectedItemParamsMainDropDown based on the selection of mainDropDown
                idx:      outputIdx,
                dataType: outputDataType,
                name:     outputName,
                label:    outputLabel,
                aspects:  outputAspects
            };
        };

        setSelectedItemParams();

        if (outputIdx !== undefined) {
            this.__loadDataForSelectedOption();
            const selectedCaseComponent = this.__getSelectedCaseComponent();
            this.$['apply-button'].disabled = selectedCaseComponent ? !selectedCaseComponent.isFilled : true;
        }
    }

    __forceClickOntoApply() {
        this.$['apply-button'].click();
    }

    __clearCache(fieldName) {
        const typeElementRelatedtoChips = this.__caseRelatedDataInOrder.find((el) => el.fieldName === fieldName);
        if (typeElementRelatedtoChips && typeElementRelatedtoChips.element.clearCache) {
            typeElementRelatedtoChips.element.clearCache();
        }
    }

    __localizeItems(dropDownItems) {
        for (let item in dropDownItems) {
            item = dropDownItems[item][1];
            const name = item.Title;
            if (name && (name.startsWith('[[') || name.startsWith('tw.'))) {
                item.Title = PTCS.Formatter.localize(name);
            }
        }
    }

    __sortByLocalizedTitle(a, b) {
        if (!a && !b) {
            return 0;
        }

        if (!a) {
            return -1;
        }

        if (!b) {
            return 1;
        }

        let aName = this.__extractLabel(a[1]);
        let bName = this.__extractLabel(b[1]);

        return aName.localeCompare(bName);
    }

    __extractLabel(fieldDefinition) {
        let name = fieldDefinition.Title;

        if (!name) {
            name = fieldDefinition.name;
        }

        return name;
    }
    __getFilteredOutStructs(fieldDefinitions) {
        const filteredData = {
            dataShape: {
                fieldDefinitions: {}
            }
        };

        let dropDownItems = Object.entries(fieldDefinitions);
        this.__localizeItems(dropDownItems);

        if (this.sortFilters) {
            dropDownItems = dropDownItems.sort(this.__sortByLocalizedTitle.bind(this));
        }

        dropDownItems = dropDownItems.map(filterOption => {
            let dataTypeCase, filterOptionKey, filterOptionValue;
            [filterOptionKey, filterOptionValue] = filterOption;
            if (filterOptionValue.__showThisField === false) {
                console.warn(`${filterOptionValue.name} is hidden by Composer`);
                return null;
            }
            dataTypeCase = filterOptionValue.baseType;
            if (this.__getBaseDataType(dataTypeCase)) {
                filteredData.dataShape.fieldDefinitions[filterOptionKey] = filterOptionValue;
                return {label: filterOptionValue.Title ? filterOptionValue.Title : filterOptionValue.name, value: filterOptionValue.name};
            }

            return null;
        }).filter(el => el); // filter out null elements
        return [dropDownItems, filteredData];
    }

    __getBaseDataType(proposedBaseType) {
        const supportedCases = ['string', 'boolean', 'number', 'datetime', 'location'];

        proposedBaseType = proposedBaseType && proposedBaseType.toLowerCase();
        if (supportedCases.includes(proposedBaseType)) {
            return proposedBaseType;
        }

        let baseType = null;
        if (this.customBaseTypesMapping) {
            baseType = this.customBaseTypesMapping[proposedBaseType];
            if (!baseType) {
                baseType = this.customBaseTypesMapping['default'];
            }

            if (baseType === 'unsupported') {
                return null;
            }

            if (!supportedCases.includes(baseType)) {
                console.warn('chip filter: Unknown base type (' + baseType + ') for proposed base type (' + proposedBaseType + ')');
                return null;
            }
        }

        return baseType;
    }

    _convertLocationUnits(units) {
        if (units.length === 1) {
            return units;
        }

        units = units.toLowerCase();
        switch (units) {
            case 'miles':
                return 'M';
            case 'kilometers':
                return 'K';
            case 'nautical miles':
                return 'N';
        }
        return units;
    }

    get focusableElements() {
        const result = [];

        const collect = el => {
            for (let e = el.firstElementChild; e; e = e.nextElementSibling) {
                if (!(e.clientHeight > 0)) {
                    continue; // hidden
                }
                if (extElem.has(e.tagName)) {
                    collect(e.shadowRoot); // focus on sub elements
                } else {
                    if (e.hasAttribute('tabindex')) {
                        result.push(e);
                    }
                    collect(e);
                }
            }
        };

        collect(this.$.container);

        return result;
    }

    _keyDown(ev) {
        if (this.display !== 'compact') {
            return;
        }
        const close = () => {
            ev.preventDefault();
            this.cancelPopup();
        };
        switch (ev.key) {
            case 'Escape':
                close();
                break;

            case 'Tab':
                if (ev.shiftKey) {
                    if (this.shadowRoot.activeElement === this.$['main-drop-down']) {
                        // Shift-Tab on first focusable element
                        close();
                    }
                } else if (this.shadowRoot.activeElement === this.$['cancel-button']) {
                    // Shift-Tab on last focusable element
                    close();
                }
                break;
        }
    }

    _compactMode(display) {
        return display === 'compact';
    }
}

customElements.define(PTCSselector.is, PTCSselector);
