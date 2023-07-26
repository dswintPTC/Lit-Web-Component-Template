import {PolymerElement, html} from '@polymer/polymer/polymer-element.js';
import {PTCS} from 'ptcs-library/library.js';
import {createSubComponent} from 'ptcs-library/create-sub-component.js';
import 'ptcs-behavior-styleable/ptcs-behavior-styleable.js';
import {delegateToPrev} from 'ptcs-behavior-focus/ptcs-behavior-focus.js';
import 'ptcs-behavior-tabindex/ptcs-behavior-tabindex.js';

import './components/chip-container/ptcs-chip-data-filter-chip-container.js';
import './components/selector-drop-down/ptcs-chip-data-filter-selector-dropdown.js';

import {refDictionary, getStringBasedProperties} from './localization.js';

/* eslint-disable no-confusing-arrow */

(() => {
    const iconset = document.createElement('iron-iconset-svg');
    iconset.setAttribute('name', 'chips-filter');
    iconset.setAttribute('size', '24');
    iconset.innerHTML = `<svg>
<g id="chevron-open" w="18" h="18" viewBox="0 0 34 34" stroke="none" stroke-width="1" transform="translate(8 8) rotate(-90) translate(-18 0)">
<polygon part="img" fill-rule="nonzero" points="10 15.5735294 3.81916329 8.82352941 10 2.07352941 8.09716599 0 0 8.82352941 8.09716599 17.6470588"/>
<polygon part="img" fill-rule="nonzero" points="18 15.5735294 11.8191633 8.82352941 18 2.07352941 16.097166 0 8 8.82352941 16.097166 17.6470588"/>
</g>
</svg>`;
    document.head.appendChild(iconset);
})();

const filterOperatorDefaultValue = 'And';

function focusIndex(el, focusable) {
    const index = focusable.indexOf(el); // Quick test
    return index >= 0 ? index : focusable.findIndex(e => e.shadowRoot && e.shadowRoot.contains(el));
}


const DataFilter = class extends PTCS.BehaviorTabindex(PTCS.BehaviorStyleable(PTCS.ThemableMixin(PolymerElement))) {
    static get is() {
        return 'ptcs-chip-data-filter';
    }
    static get template() {
        return html`
        <style>
                :host {
                    display: inline-flex;
                    flex-direction: column;
                    width: 100%;
                }
                :host([chips-on-top]) {
                    flex-direction: column-reverse;
                }
                ptcs-button {
                    margin: var(--subcomponent-margin-spacing) var(--subcomponent-margin-spacing) 0px 0px;
                }
                [part="add-filter-button"]:not([display="compact"]) {
                    display: none;
                }
                [part="top-bar"] {
                    display: inline-flex;
                    align-items: flex-end;
                    justify-content: space-around;
                    box-sizing: border-box;
                }
                [part="top-bar"] > * {
                    flex: 0 0 auto;
                }
                :host([hide-filter]) ptcs-chip-data-filter-chip-container {
                    display: none;
                }
                :host([hide-filter]) [part="top-bar"] > * {
                    display: none;
                }
                [part="show-button"][hidden], [part="small-show-button"][hidden], [part="filter-operator-drop-down"][hidden] {
                    display: none;
                }
                [part="small-show-button"][open] {
                    transform-origin: center;
                    transform: rotate(180deg);
                }
                :host([chips-disclosure=icon]) [part="show-button"] {
                    display: none;
                }
                :host(:not([chips-disclosure=icon])) [part="small-show-button"] {
                    display: none;
                }
                :host([chips-disclosure=none]) [part="show-button"] {
                    display: none;
                }
                :host([chips-disclosure=none]) [part="small-show-button"] {
                    display: none;
                }
                [part="filter-operator-drop-down"] {
                    width:  var(--ptcs-chip-data-filter-selector-dropdown-base-subcomponent-width);
                }
            </style>
            <div id="top-bar" part="top-bar">
                <ptcs-button id="add-filter" part="add-filter-button" variant="primary" label=[[dictionary.stringAddFilter]] disabled="[[disabled]]"
                content-align="center" mode="label" on-click="__handleAddFilterClick" tabindex\$="[[_tabindex]]" display$="[[displayMode]]">
                </ptcs-button>
                <ptcs-label id="filters-counter" variant="label" part="filters-counter" hidden\$="[[hideFilterCounter]]"
                label="[[__filtersLabel(__filtersCount, dictionary.stringFilter, dictionary.stringFilters,
                    _showOperator, showAndOrOperator, dictionary.stringJoinedBy)]]">
                </ptcs-label>
                <div style="flex: 1 1 auto; display: block; overflow: hidden"><slot></slot></div>
            </div>
            <ptcs-chip-data-filter-selector-dropdown on-close="__handleClose" on-change="__handleSelectorChange" id="selector" part="selector"
                show-list-filter="[[showListFilter]]" dictionary="[[dictionary]]"
                tabindex\$="[[_xTabindex(tabindex, displayMode)]]" sub-tabindex="[[_tabindex]]"
                date-order="[[dateOrder]]" format-token="[[formatToken]]" display$="[[displayMode]]"
                custom-base-types-mapping="[[customBaseTypesMapping]]" column-format="[[columnFormat]]" sort-filters="[[sortFilters]]"
                category-label="[[categoryLabel]]" condition-label="[[conditionLabel]]" value-label="[[valueLabel]]"
                range-start-value-label="[[rangeStartValueLabel]]" range-end-value-label="[[rangeEndValueLabel]]"
                range-start-time-value-label="[[rangeStartTimeValueLabel]]" range-end-time-value-label="[[rangeEndTimeValueLabel]]"
                units-label="[[unitsLabel]]" latitude-label="[[latitudeLabel]]" longitude-label="[[longitudeLabel]]"
            ></ptcs-chip-data-filter-selector-dropdown>
        `;
    }
    static get properties() {
        /*
            to avoid loooong list of string based properties, they are appended here using Object.assign
            if a string has been changed, then the 'dictionary' property is updated

            Additional string properties named *Label (e.g. rangeStartValueLabel) are provided to override corresponding
            dictionary-based strings. When a *Label property is undefined, the corresponding dictionary entry is used.
        */
        // add observer param to all string based properties
        const stringBasedProperties = getStringBasedProperties();
        Object.keys(stringBasedProperties).forEach(stringParam => {
            stringBasedProperties[stringParam].observer = '__updateDictionary';
        });
        return Object.assign({
            dictionary: { //  object is passed from parent component to its child (those that need translation(s))
                type:     Object,
                observer: '__updateTranslations',
                value:    refDictionary
            },
            filterOperators: {
                type:  Object,
                value: () => [
                    {name: 'And', translationKey: 'stringAnd', label: 'AND'},
                    {name: 'Or', translationKey: 'stringOr', label: 'OR'}
                ]
            },
            // The two-way data binding query
            query: {
                type:     Object,
                notify:   true,
                observer: '_queryChanged'
            },
            // The actual query object
            _query: {
                type: Object
            },
            data: {
                type: String
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

            _tabindex: {
                type:     String,
                computed: '_computeTabIndex(tabindex)'
            },
            daysContainingData: {
                type: Object
            },
            // Full override of format
            formatToken: {
                type: String
            },
            dateOrder: {
                type:  String,
                value: 'YMD' //  auto, YMD, MDY, DMY (auto - is default format)
            },
            hideFilterCounter: {
                type:     Boolean,
                observer: '_hideFilterCounterChanged'
            },
            showListFilter: {
                type: Boolean
            },
            customBaseTypesMapping: {
                type: Object
            },
            columnFormat: {
                type:  String,
                value: null
            },
            sortFilters: {
                type:     Boolean,
                observer: '_updateDisableFilterSorting'
            },
            disableFilterSorting: {
                type:     Boolean,
                value:    false,
                observer: '_updateSortFilters'
            },
            maxWidth: {
                type:     Number,
                observer: '_maxWidthChanged'
            },
            filtersMaxHeight: {
                type: Number
            },
            __filtersCount: {
                type: Number
            },
            _showChips: {
                type:  Boolean,
                value: true
            },
            displayMode: {
                type:               String,
                value:              'compact',
                reflectToAttribute: true
            },
            showAndHideFilters: {
                type:     Boolean,
                observer: '_showAndHideFiltersChanged'
            },
            showAndOrOperator: {
                type: Boolean
            },
            chipsOnTop: {
                type:               Boolean,
                reflectToAttribute: true
            },
            chipsDisclosure: { // 'link' || 'icon' || 'none'
                type:               String,
                value:              'link',
                observer:           '_chipsDisclosureChanged',
                reflectToAttribute: true
            },
            hideFilter: {
                type:               Boolean,
                reflectToAttribute: true
            },
            borders: {
                type:     String,
                observer: 'bordersChanged'
            },
            _borderTop: {
                type:               Boolean,
                reflectToAttribute: true
            },
            _borderBottom: {
                type:               Boolean,
                reflectToAttribute: true
            },
            _borderLeft: {
                type:               Boolean,
                reflectToAttribute: true
            },
            _borderRight: {
                type:               Boolean,
                reflectToAttribute: true
            },
            _showChipToggleBtn: {
                type: Boolean
            },
            _showOperator: {
                type: Boolean
            },
            _selector: { // reference to the selector drop-down
                type: Object
            },
            _selectorId: {
                type: String
            },
            _reDrawSelector: {
                type:  Boolean,
                value: false
            }

        }, stringBasedProperties);
    }

    get _selector() {
        if (!this.__selector) {
            this.__selector = this.shadowRoot.querySelector('ptcs-chip-data-filter-selector-dropdown');
        }

        return this.__selector;
    }

    ready() {
        super.ready();
        this._initCompactMode();
        this.__updateTranslations();

        // Keyboard navigation
        this.shadowRoot.addEventListener('mousedown', this._mouseDown.bind(this));
        this.addEventListener('keydown', this._keyDown.bind(this));
        this.addEventListener('focus', this._focusEv.bind(this));
    }

    // Handles filterOperators object localization
    __updateTranslations() {
        if (this.dictionary) {
            for (let o of this.filterOperators) {
                if (this.dictionary[o.translationKey]) {
                    o.label = this.dictionary[o.translationKey];
                }
            }
        }

        const filterOperatorEl = this.$['top-bar'].querySelector('#filter-operator');
        if (filterOperatorEl) {
            filterOperatorEl.items = this.filterOperators;
        }
    }

    disconnectedCallback() {
        // Remove the selector
        if (!this._reDrawSelector) {
            this._resetCompactMode();
            this._reDrawSelector = true;
        }
        super.disconnectedCallback();
    }

    connectedCallback() {
        super.connectedCallback();
        if (this._reDrawSelector) {
            this._initCompactMode();
            this._reDrawSelector = false;
        }
    }

    set data(newData) {
        this._selector.data = newData;
        if (newData && this._pendingQuery) {
            this._queryChanged(this._pendingQuery);
            delete this._pendingQuery;
        }
    }
    get data() {
        return this._selector.data;
    }

    set daysContainingData(newData) {
        const supportedType = 'datetime';
        const fieldWithDays = Object.entries(newData.dataShape.fieldDefinitions)[0][1];
        if (fieldWithDays && fieldWithDays.baseType.toLowerCase() === supportedType) {
            const arrayOfTimestamp = newData.rows.map(row => row[fieldWithDays.name]);
            /* eslint-disable no-unused-vars */
            // Trigger on-demand creation of ptcs-datetime-case if needed
            const datetimeCmpnt = this._selector.__getSubCmpnt('ptcs-datetime-case');
            /* eslint-enable no-unused-vars */
            this._selector.daysContainingAnyData = arrayOfTimestamp;
        }
    }

    get daysContainingData() {
        // Trigger on-demand creation of ptcs-datetime-case if needed
        const datetimeCmpnt = this.$.selector.__getSubCmpnt('ptcs-datetime-case').shadowRoot.querySelector('#date-picker');
        return datetimeCmpnt.daysContainingAnyData;

    }

    bordersChanged(borders) {
        const b = (borders + '').toLowerCase();
        this._borderTop = b.includes('t');
        this._borderBottom = b.includes('b');
        this._borderLeft = b.includes('l');
        this._borderRight = b.includes('r');
    }

    // Return the height of part="top-bar"
    get topBarHeight() {
        return this.$['top-bar'].getBoundingClientRect().height;
    }

    __removeEnteredData(event) {
        const triggerChip = event.composedPath()[0];
        const triggerChipId = Number(triggerChip.getAttribute('data-id'));
        const triggerChipFieldName = triggerChip.getAttribute('field-name');

        this._selector.removeEnteredData(triggerChipId, triggerChipFieldName);

        // Set the focus back to either the 'Add' button or the dropdown list
        this.__setFocusToAddOrDropdown();
    }

    __handleClose() {
        if (this.__autoCloseEv) {
            document.removeEventListener('mousedown', this.__autoCloseEv);
            this.__autoCloseEv = undefined;
        }
        // Set the focus back to either the 'Add' button or the dropdown list
        this.__setFocusToAddOrDropdown();
    }

    __setFocusToAddOrDropdown() {
        if (this.displayMode === 'compact') {
            if (this.$['add-filter']) {
                this.$['add-filter'].focus();
            }
        } else if (this.$.selector) {
            const dropdown = this.$.selector.$['main-drop-down'];
            if (dropdown) {
                dropdown.focus();
            }
        }
    }

    _showAndHideFiltersChanged(showAndHideFilters) {
        if (showAndHideFilters) {
            this._createOnDemandShowchipsDisclosure();
        }
    }

    _hideFilterCounterChanged(hideFilterCounter) {
        if (hideFilterCounter && !this._showChips) {
            this.__handleHideChips();
        }
    }

    _hideChipsArea(showChips) {
        const numFilters = (this._query && this._query.filters) ? this._query.filters.filters.length : 0;
        if (numFilters === 0) {
            return true;
        }
        return !showChips;
    }

    __handleAddFilterClick() {
        this._selector.mode = 'open';
        this._selector.style.visibility = 'hidden'; // prevent selector from displaying before it's ready
        this._selector.style.width = '';

        // Need to wait a few animation frames for the list to stabilize (100ms ~ 6 animation frames)
        setTimeout(() => {
            this._selector.style.visibility = ''; // show selector in proper place

            const dim = this._get_dimension();
            this._set_selector_position(dim); // set list position

            if (this._selector.mode === 'open') {
                this._selector.focus();
            }

            // Keep track of list position
            this.track_position(dim);
        }, 100);

        // Can el somehow be linked to the selector?
        const isSelectorPart = el => {
            for (const selector = this.$.selector; el; el = el.__$mainCmpnt) {
                for (let e = el; e; e = e.getRootNode && e.getRootNode().host) {
                    if (e === selector) {
                        return true;
                    }
                }
            }
            return false;
        };

        // Close AddFilter popup if user clicks outside of it
        this.__autoCloseEv = ev => {
            const el = this.shadowRoot.elementFromPoint(ev.clientX, ev.clientY) || document.elementFromPoint(ev.clientX, ev.clientY);
            if (el !== this.$['add-filter'] && !isSelectorPart(el)) {
                // Clicked on something that is not the AddFilter button nor anything that is connected to the selector
                this.$.selector.cancelPopup();
            }
        };

        document.addEventListener('mousedown', this.__autoCloseEv);
    }

    _hidden(a, b) {
        return !(a && b);
    }

    __handleHideChips() {
        if (this.disabled) {
            return;
        }
        this._showChips = !this._showChips;
        this._hideShowChipsLabel = this._showChips ? this.dictionary.stringHideFilters : this.dictionary.stringShowFilters;
    }

    __handleSelectorChange(event) {
        const selectorDataEnteredByUser = event.detail.data;
        const chipContainerData = selectorDataEnteredByUser.map((filterOption, index) => {
            return {
                content:   filterOption.formatted,
                error:     filterOption.isError,
                id:        index,
                fieldName: filterOption.fieldName
            };
        });

        let chipContainerEl = this.shadowRoot.querySelector('#chip-container');
        if (!chipContainerEl && chipContainerData.length) {
            this._createOnDemandChipContainer();
            chipContainerEl = this.shadowRoot.querySelector('#chip-container');
        }
        if (chipContainerEl || chipContainerData.length) {
            chipContainerEl.data = chipContainerData;
        }
        // Get the actual query
        this._query = this._selector.query;
        if (!this.__blockQuery) {
            // Make query publically available
            this.query = this._query;
        }
        event.stopPropagation();
    }

    __handleOperatorChange(event) {
        this._selector.operator = event.detail.value;
        this._query = this._selector.query;
        if (!this.__blockQuery) {
            // Make query publically available
            this.query = this._query;
        }
        event.stopPropagation();
    }

    __updateDictionary() {
        // notice, that the whole dictionary is updated, even if the only one string was changed as a result of translation :|
        // for sure, this can be the subject of the further improvements
        var tmpDidc = Object.assign({}, this.dictionary);
        for (const stringProp of Object.keys(tmpDidc)) {
            tmpDidc[stringProp] = this[stringProp];
        }
        this.dictionary = tmpDidc; // notify about change of a property
    }

    _isQueryIdentical(query) {
        return (query === this._query || JSON.stringify(query) === JSON.stringify(this._query) ||
        (query && this._query && !Array.isArray(query.filters) && this._query.filters.filters.length === 1 &&
        JSON.stringify(query.filters) === JSON.stringify(this._query.filters.filters[0])));
    }

    // Assign query and build the filter chips
    _queryChanged(query) {
        if (query) {
            this._createOnDemandChipContainer();
        }
        if (!this._selector.data && query) {
            this._pendingQuery = query;
            return;
        }
        if (this._isQueryIdentical(query)) {
            this.__updateFiltersCount();
            return; // No change
        }
        //
        // The client has changed the query
        //
        let el = this.shadowRoot.querySelector('#chip-container')
            ? this.shadowRoot.querySelector('#chip-container').shadowRoot.querySelector('ptcs-chip-data-filter-chip-child') : undefined;
        // Purge internal data from present query (if any): Iterate until current query becomes null
        this.__blockQuery = true;
        while (this._query && el) {
            // Remove the chips of existing query
            this._selector.removeEnteredData(Number(el.getAttribute('data-id')), el.getAttribute('field-name'));
            el = this.shadowRoot.querySelector('#chip-container').shadowRoot.querySelector('ptcs-chip-data-filter-chip-child');
        }

        // Assign the new query
        this._selector.loadQuery(query);
        this.__blockQuery = false;

        if (query && query.filters) {
            this._selector.operator = this._resolveAndOrOperator(query.filters.type);
            const filterOperatorEl = this.$['top-bar'].querySelector('#filter-operator');
            if (filterOperatorEl) {
                filterOperatorEl.selectedValue = this._selector.operator;
            }
        }

        // Store current query
        const q = this._selector.query;
        this._query = q;
        if (q && JSON.stringify(query) !== JSON.stringify(q)) {
            requestAnimationFrame(() => {
                this.query = q;
            });
        }
        this.__updateFiltersCount();
    }

    __updateFiltersCount() {
        const filters = (this._query && this._query.filters) ? this._query.filters.filters.length : 0;
        if (filters > 1) {
            this._showOperator = true;
        } else {
            this._showOperator = false;
        }
        this.__filtersCount = filters;
        if (filters > 0) {
            this._hideShowChipsLabel = this._showChips ? this.dictionary.stringHideFilters : this.dictionary.stringShowFilters;
            this._showChipToggleBtn = true;
            this.shadowRoot.querySelector('#chip-container').mode = 'closed';
        } else {
            this._showChipToggleBtn = false;
        }

        // check creating UI on demand
        if (this.showAndOrOperator && filters > 1) {
            this._createOnDemandFilterOperator();
        }
        if (this.showAndHideFilters && this.chipsDisclosure !== 'none' && filters) {
            this._createOnDemandShowchipsDisclosure();
        }

    }

    _createOnDemandFilterOperator() {
        const filterOperatorEl = this.$['top-bar'].querySelector('#filter-operator');
        if (filterOperatorEl) {
            return;
        }

        const filterOperator = createSubComponent(this, `<ptcs-dropdown id="filter-operator" part="filter-operator-drop-down"
            tabindex$="[[_tabindex]]" selector="label" value-selector="name" hidden$="[[!_showOperator]]">`);
        this.$['filters-counter'].after(filterOperator);
        filterOperator.items = this.filterOperators;
        filterOperator.selectedValue = this._selector.operator || filterOperatorDefaultValue;
        filterOperator.addEventListener('selected-value-changed', this.__handleOperatorChange.bind(this));
    }

    _createOnDemandShowchipsDisclosure() {
        const filterCounterEl = this.$['top-bar'].querySelector('#filters-counter');
        const filterOperatorEl = this.$['top-bar'].querySelector('#filter-operator');
        const chipsToggleEl = this.$['top-bar'].querySelector('#chips-toggle');
        const smallChipsToggleEl = this.$['top-bar'].querySelector('#small-chips-toggle');
        let newAddedEl;
        if (this.chipsDisclosure === 'link' && !chipsToggleEl) {
            newAddedEl = createSubComponent(this, `<ptcs-link id="chips-toggle" part="show-button"
                tabindex$="[[_tabindex]]" hidden$="[[_hidden(_showChipToggleBtn, showAndHideFilters)]]" label="[[_hideShowChipsLabel]]">`);
            newAddedEl.addEventListener('click', this.__handleHideChips.bind(this));
        } else if (this.chipsDisclosure === 'icon' && !smallChipsToggleEl) {
            newAddedEl = createSubComponent(this, `<ptcs-button id="small-chips-toggle" part="small-show-button" icon="chips-filter:chevron-open"
                variant="small" open$="[[_showChips]]" tabindex$="[[_tabindex]]" hidden$="[[_hidden(_showChipToggleBtn, showAndHideFilters)]]">`);
            newAddedEl.addEventListener('click', this.__handleHideChips.bind(this));
        }

        if (!newAddedEl) {
            return;
        }

        const afterApendedEl = filterOperatorEl ? filterOperatorEl : filterCounterEl;
        afterApendedEl.after(newAddedEl);
    }

    reset() {
        // Remove all chips
        const elContainer = this.shadowRoot.querySelector('#chip-container');
        let el = elContainer ? elContainer.shadowRoot.querySelector('ptcs-chip-data-filter-chip-child') : undefined;

        while (this._query && el) {
            this._selector.removeEnteredData(Number(el.getAttribute('data-id')), el.getAttribute('field-name'));
            el = elContainer.shadowRoot.querySelector('ptcs-chip-data-filter-chip-child');
        }

        // Also, reset the selector to its initial state
        this._selector.reset();
    }

    _createOnDemandChipContainer() {
        const chipContainerEl = this.shadowRoot.querySelector('#chip-container');
        if (chipContainerEl) {
            return;
        }

        const chipContainer = createSubComponent(this, `<ptcs-chip-data-filter-chip-container id="chip-container" part="chip-container"
            sub-tabindex="[[_tabindex]]" exportparts$="oval-container, content, chip-child"
            hidden$="[[_hideChipsArea(_showChips, _query)]]">`);
        chipContainer.addEventListener('remove', this.__removeEnteredData.bind(this));
        this.shadowRoot.appendChild(chipContainer);
    }

    __filtersLabel(filters, stringFilter, stringFilters, showOperator, showAndOrOperator, stringJoinedBy) {
        return filters === 1 ? filters + ' ' + stringFilter
            : `${filters} ${stringFilters}${showOperator && showAndOrOperator ? stringJoinedBy : ''}`;
    }

    getExternalComponentId() {
        return this._selectorId;
    }

    /*
     * Sets an id for external component
     */
    setExternalComponentId(id) {
        if (id) {
            this._selectorId = id;
        } else if (!this._selectorId) {
            this._selectorId = 'ptcs-chip-data-filter-' + performance.now().toString().replace('.', '');
        }

        this._selector.setAttribute('id', this._selectorId);
    }
    _get_dimension() {
        return {
            // Get window dimension
            windowWidth:  window.innerWidth,
            windowHeight: window.innerHeight,
            // Get current scroll offset
            scrollDx:     document.documentElement.scrollLeft + document.body.scrollLeft,
            scrollDy:     document.documentElement.scrollTop + document.body.scrollTop,
            // Where is the dropdown box?
            box:          this.$['top-bar'].getBoundingClientRect(),
            // Where is the Add Filter button?
            button:       this.$['add-filter'].getBoundingClientRect()
        };
    }
    _set_selector_position(r) {
        const dw = 0;
        const bbSelector = this._selector.getBoundingClientRect();
        const smallModeAllignemt = 8;
        let x;
        if (r.windowWidth - r.box.left - bbSelector.width > 0) {
            x = r.box.left;
        } else if (r.windowWidth > r.box.right && r.box.right - smallModeAllignemt - bbSelector.width > 0) {
            x = r.box.right - smallModeAllignemt - bbSelector.width;
        } else if (r.windowWidth - bbSelector.width - dw - 24 > 0) {
            x = r.windowWidth - bbSelector.width - dw - 24;
        } else {
            x = 2;
        }
        let y = r.button.bottom + smallModeAllignemt;
        if (y + bbSelector.height >= r.windowHeight) {
            // Show popup list above filter instead
            y = Math.max(r.button.top - smallModeAllignemt - bbSelector.height, 2);
        }

        // Set list position
        this._selector.style.left = `${r.scrollDx + x}px`;
        this._selector.style.top = `${r.scrollDy + y}px`;

    }

    // Keep track of list position, if the filter selector box is moved or the view is scrolled
    track_position(rOld) {
        if (this._selector.mode === 'open') {
            if (this._isHidden()) {
                this._selector.mode = 'closed';
            } else {
                const rNew = this._get_dimension();
                if (this._diff_dimension(rOld, rNew)) {
                    if (rNew.box.bottom < 0 || rNew.box.top > rNew.windowHeight) {
                        // The dropdown anchor has been scrolled out of sight. Close the popup
                        this._selector.mode = 'closed';
                        return;
                    }
                    this._set_selector_position(rNew);
                }

                // Take a fresh look at things in 0.2 seconds
                setTimeout(() => this.track_position(rNew), 200);
            }
        }
    }
    _isHidden() {
        return !(this.offsetWidth || this.offsetHeight || this.getClientRects().length);
    }
    _diff_dimension(r1, r2) {
        if (r1.windowWidth !== r2.windowWidth || r1.windowHeight !== r2.windowHeight) {
            return true;
        }
        if (r1.scrollDx !== r2.scrollDx || r1.scrollDy !== r2.scrollDy) {
            return true;
        }
        if (r1.box.width !== r2.box.width || r1.box.bottom !== r2.box.bottom || r1.box.left !== r2.box.left) {
            return true;
        }

        return false;
    }

    _initCompactMode() {
        if (this.displayMode === 'compact') {
            this._selector.remove();
            this._selector.__saSa = this.__saSa;
            document.body.appendChild(this._selector);
            this.setExternalComponentId();
        }
    }
    _resetCompactMode() {
        if (this.displayMode === 'compact') {
            document.body.removeChild(this._selector);
        }
    }

    _maxWidthChanged(val) {
        if (val) {
            var unitTest = val + '';
            if (unitTest.indexOf('px') === -1) {
                this.style.maxWidth = val + 'px';
            } else {
                this.style.maxWidth = val;
            }
        } else {
            this.style.removeProperty('max-width');
        }
    }

    _chipsDisclosureChanged(chipsDisclosure) {
        if (chipsDisclosure === 'none' && !this._showChips) {
            // Toggles this._showChips to true and changes link text
            this.__handleHideChips();
        }

        if (this.showAndHideFilters && this.__filtersCount && chipsDisclosure !== 'none') {
            this._createOnDemandShowchipsDisclosure();
        }
    }

    _resolveAndOrOperator(type) {
        if (!type || typeof type !== 'string') {
            return filterOperatorDefaultValue;
        }

        switch (type.toLowerCase()) {
            case 'and':
                return 'And';
            case 'or':
                return 'Or';
        }
        return filterOperatorDefaultValue;
    }

    _computeTabIndex(tabindex) {
        return tabindex && '-1';
    }

    _xTabindex(tabindex, displayMode) {
        return displayMode !== 'expanded' && tabindex;
    }

    get focusElement() {
        if (!this.tabindex) {
            return null; // Not focusable
        }
        let hit = this.shadowRoot.activeElement;
        let el = hit || document.activeElement;
        while (el && el.shadowRoot && el.shadowRoot.activeElement) {
            hit = hit || el === this || this.contains(el);
            el = el.shadowRoot.activeElement;
        }
        // Focused element must be  in slotted content or in shadow dom
        return (hit || this.shadowRoot.activeElement) && el;
    }

    get _focusableSlotted() {
        return [...this.querySelectorAll('[focusable]')]
            .filter(el => el.clientHeight > 0)
            .reduce((acc, el) => {
                const sub = el.focusableElements;
                if (Array.isArray(sub)) {
                    acc.push(...sub);
                } else {
                    acc.push(el);
                }
                return acc;
            }, []);
    }

    get focusableElements() {
        const selector = this.$.selector ? this.$.selector.focusableElements : [];
        return [
            ...[...this.$['top-bar'].querySelectorAll('[tabindex]')].filter(el => el.clientHeight > 0),
            ...this._focusableSlotted,
            ...selector
        ];
    }

    get focusableElementsChipContainer() {
        return [
            ...(this.shadowRoot.querySelector('#chip-container') ? this.shadowRoot.querySelector('#chip-container').focusableElements : [])
        ];
    }

    _focusEv() {
        // Ignore if we don't support focusing or already have focus on a sub element
        if (!this.tabindex || this.shadowRoot.activeElement) {
            return;
        }

        // Restore old focus or initialize new focus
        const focusableElms = [...this.focusableElements, ...this.focusableElementsChipContainer];

        if (!this._focusEl || focusIndex(this._focusEl, focusableElms) === -1) {
            this._focusElTopBar = this._focusEl = this.focusableElements[0];
        }
        this._focusEl.focus();
    }

    _mouseDown() {
        // Keep track of focused sub-element, so focus can be restored
        requestAnimationFrame(() => {
            this._focusElTopBar = this.focusElement;
        });
    }

    get chipFirstElementChild() {
        const chipContainer = this.shadowRoot.querySelector('#chip-container');
        return chipContainer ? chipContainer.shadowRoot.querySelector('#container').firstElementChild : null;
    }
    get activeElement() {
        return this.shadowRoot.activeElement;
    }

    _keyDown(ev) {
        // This element must be focusable, or the key event is only for a textfield
        if (ev.defaultPrevented || !this.tabindex) {
            return;
        }

        const key = ev.key;
        let focusEl = this.focusElement;
        if (!focusEl) {
            return;
        }

        if (!focusEl.tagName.toLowerCase().includes('ptcs-')) {
            focusEl = focusEl.getRootNode().host;
        }

        // Special rules for INPUT
        if (focusEl.tagName === 'INPUT' || focusEl.tagName === 'PTCS-TEXTFIELD') {
            switch (key) {
                case 'ArrowLeft':
                case 'Home':
                    if (focusEl.selectionEnd > 0) {
                        return; // Ignore unless cursor is at start of text
                    }
                    break;
                case 'End':
                case 'ArrowRight':
                    if (focusEl.selectionStart < focusEl.value.length) {
                        return; // Ignore unless cursor is at end of text
                    }
                    break;
                case ' ':
                    // Space should be added to the text as expected
                    return;
            }
        }
        const focusableContainer = this.focusableElementsChipContainer;
        let indexContainer = focusIndex(this._focusElChipContainer, focusableContainer);

        const focusable = this.focusableElements;
        let index = focusIndex(this._focusElTopBar, focusable);

        if (index === -1) {
            // Out of sync. Reset
            index = 0;
        }

        const chipContainerEl = this.shadowRoot.querySelector('#chip-container');
        let newFocusEl = focusEl;
        const currentFocusable =
        this.activeElement === chipContainerEl && !!chipContainerEl
            ? focusableContainer : focusable;
        const currentIndex =
            this.activeElement === chipContainerEl && !!chipContainerEl
                ? indexContainer : index;
        switch (ev.key) {
            case 'Tab' :
                if (ev.shiftKey) {
                    // Shift Tab
                    if (focusableContainer.includes(focusEl) && chipContainerEl) {
                        newFocusEl = (index !== -1) ? focusable[index] : focusable[0];
                        // Prevent backwards Tab navigation from stopping on this (ptcs-chip-data-filter) element
                    } else if (!delegateToPrev(this)) {
                        (this.focusElement || this).blur();
                    }
                    ev.preventDefault();
                // Tab
                } else if (!ev.shiftKey && focusable.includes(focusEl) && chipContainerEl ? !chipContainerEl.hidden : null) {
                    newFocusEl = (indexContainer !== -1) ? focusableContainer[indexContainer] : focusableContainer[0];
                    ev.preventDefault();
                }
                break;
            case 'Home':
                newFocusEl = currentFocusable[0];
                break;
            case 'End':
                newFocusEl = currentFocusable[currentFocusable.length - 1];
                break;
            case 'ArrowLeft':
            case 'ArrowUp':
                newFocusEl = currentFocusable[currentIndex === 0 ? currentFocusable.length - 1 : currentIndex - 1];
                break;
            case 'ArrowRight':
            case 'ArrowDown':
                newFocusEl = currentFocusable[currentIndex === currentFocusable.length - 1 ? 0 : currentIndex + 1];
                break;
            case 'Enter':
            case ' ':
                if (typeof focusEl.closeChip === 'function') {
                    focusEl.closeChip();
                } else {
                    focusEl.click();
                }
                ev.preventDefault();
                return;
        }

        if (newFocusEl && newFocusEl !== focusEl) {
            newFocusEl.focus();
            // Save last focused element of chip-container and top-bar
            if (focusableContainer.includes(newFocusEl)) {
                this._focusElChipContainer = newFocusEl;
            }
            if (focusable.includes(newFocusEl)) {
                this._focusElTopBar = newFocusEl;
            }
            this._focusEl = newFocusEl;
            ev.preventDefault();
        }
    }

    _updateSortFilters(v) {
        this.sortFilters = !v;
    }

    _updateDisableFilterSorting(v) {
        this.disableFilterSorting = !v;
    }
};

customElements.define(DataFilter.is, DataFilter);
