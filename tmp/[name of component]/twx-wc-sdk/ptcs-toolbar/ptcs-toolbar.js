import {PolymerElement, html} from '@polymer/polymer/polymer-element.js';
import {PTCS} from 'ptcs-library/library.js';
import 'ptcs-chip-data-filter/ptcs-chip-data-filter.js';
import './ptcs-toolbar-tools.js';
import 'ptcs-behavior-styleable/ptcs-behavior-styleable.js';
import 'ptcs-behavior-focus/ptcs-behavior-focus.js';
import 'ptcs-behavior-tabindex/ptcs-behavior-tabindex.js';
import 'ptcs-icons/cds-icons.js';

/*
type ActionType = 'button' | 'link' | 'toggle' | 'dropdown';

type ButtonOptions = {
    // Default: 'transparent'
    variant?: string;

    // Action icon - see ptcs-icon
    icon?: string;
    iconSet?: string;
};

type LinkOptions = {
    // Default: 'primary'
    variant?: string;
};

type ToggleOptions = {
    // Initial value. Default: false. Can be changed with setValue(id, checked?)
    value?: boolean;

    // Hide selection icon?
    hideIcon?: boolean;
};

type DropdownValues = {
    // Displayed option label
    label: string;

    // Corresponding value. Default: label
    value?: any;
};

type DropdownOptions = {
    values: DropdownValues[];

    // Initial value
    value?: any;
};

type ActionOptions = ButtonOptions | LinkOptions | ToggleOptions | DropdownOptions;

type Action = {
    type: ActionType,

    // Identifies the action for hiding / disabling it
    id?: string | number;

    // Action label
    label?: string;

    // Alt action text for screen reader
    alt?: string;

    // Link
    link?: string;

    // Disable action? Can be changed with setDisabled(id, disabled);
    disabled?: boolean;

    // Hide action? Can be changed with setHidden(id, hidden);
    hidden?: boolean;

    // Explicit with of control
    width?: string | number;

    // Limit max with of control
    maxWidth?: string | number;

    // Options - dependent on ActionType
    opt?: ActionOptions;
}
*/

PTCS.ToolBar = class extends PTCS.BehaviorTabindex(PTCS.BehaviorFocus(PTCS.BehaviorStyleable(PTCS.ThemableMixin(PolymerElement)))) {

    static get template() {
        return html`
        <style>
            :host {
                display: flex;
                width: 100%;
                /*width: calc(100% - 2 * var(--ptcs-toolbar---padding));*/
                box-sizing: border-box;
            }
            :host([aria-disabled="true"]) {
                pointer-events: none;
            }
            ptcs-textfield[hidden] {
                display: none;
            }
            ptcs-toolbar-tools[hidden] {
                display: none;
            }
            [part=data-filter] {
                box-sizing: border-box;
                display: inline-flex;
            }
            [part=pipe-container] {
                position: absolute;
                top: 0;
            }
            [part=pipe-container][hidden] {
                display: none;
            }
        </style>
        <ptcs-chip-data-filter part="data-filter" id="data-filter"
            tabindex\$="[[_delegatedFocus]]"
            data="[[filterData]]"
            query="{{query}}"
            disabled="[[disabled]]"
            show-and-hide-filters="[[showAndHideFilters]]"
            hide-filter-counter="[[!showAndHideFilters]]"
            chips-on-top="[[chipsOnTop]]"
            chips-disclosure="[[chipsDisclosure]]"
            hide-filter="[[_hideDataFilter(hideFilter, simpleFilter)]]"
            show-list-filter="[[showListFilter]]"
            sort-filters="[[sortFilters]]"
            borders="[[borders]]"
            category-label="[[categoryLabel]]"
            condition-label="[[conditionLabel]]"
            latitude-label="[[latitudeLabel]]"
            longitude-label="[[longitudeLabel]]"
            range-start-value-label="[[rangeStartValueLabel]]"
            range-end-value-label="[[rangeEndValueLabel]]"
            units-label="[[unitsLabel]]"
            value-label="[[valueLabel]]"
            custom-base-types-mapping="[[customBaseTypesMapping]]"
            column-format="[[columnFormat]]"
            ><div part="pipe-container" hidden$="[[_hidden(separator, actions, rightActions, hideFilter, simpleFilter, query)]]"><div
              part="pipe" id="pipe-right"></div></div><div style="display: flex; align-items: flex-end; overflow: hidden" id="toolbar-container"
            ><ptcs-toolbar-tools id="toolbar" part="tools"
                focusable\$="[[_delegatedFocus]]"
                disabled="[[disabled]]"
                actions="[[actions]]"
                right-actions="[[rightActions]]"
                min-width="{{toolbarMinWidth}}"
                show-filter="[[_showToolsFilter(hideFilter, simpleFilter)]]"
                filter-label="[[filterLabel]]"
                additional-label="[[additionalLabel]]"
                filter-icon="[[filterIcon]]"
                filter-width="[[simpleFilterWidth]]"
                filter-hint-text="[[filterHintText]]"
                filter-pos="[[simpleFilterPos]]"
                filter-align="[[simpleFilterAlignment]]"
                filter-tooltip="[[filterTooltip]]"
                filter-string="{{filterString}}"
                right-overflow-label="[[rightOverflowLabel]]"
                ></ptcs-toolbar-tools
            ></div>
        </ptcs-chip-data-filter>`;
    }

    static get is() {
        return 'ptcs-toolbar';
    }

    static get properties() {
        return {
            variant: {
                type:               String,
                reflectToAttribute: true
            },

            disabled: {
                type: Boolean
            },

            // Self-reported minimum width of ptcs-toolbar-tools
            toolbarMinWidth: {
                type: Number
            },

            filterData: {
                type: Object
            },

            // Hide filter
            hideFilter: {
                type: Boolean
            },

            // Use simple filter instead of chips filter
            simpleFilter: {
                type: Boolean
            },

            simpleFilterPos: {
                type: String
            },

            simpleFilterAlignment: {
                type: String
            },

            // Actions for the action region
            actions: {
                type: Array // Action[]
            },

            // Actions for the right actions region
            rightActions: {
                type: Array // Action[]
            },

            query: {
                type:   Object,
                notify: true
            },

            chipsOnTop: {
                type: Boolean
            },

            filterIcon: {
                type:  String,
                value: 'cds:icon_filter'
            },

            filterTooltip: {
                type: String
            },

            filterHintText: {
                type:  String,
                value: 'Filter'
            },

            // Specified text in the simple filter
            filterString: {
                type:   String,
                notify: true
            },

            // 'link' || 'icon' || 'none'
            chipsDisclosure: {
                type: String
            },

            // letters 'tblr' in any order to enable border-top / border-bottom / border-left / border-right
            borders: {
                type: String
            },

            // Toggle between hiding the filter disclosure controls and expanding the chip container for the data filter
            showAndHideFilters: {
                type: Boolean
            },

            // Toggle to show filter box in the dropdown list of filter categories
            showListFilter: {
                type: Boolean
            },

            // Sorts the list of options for the data filter categories in alphabetical order
            sortFilters: {
                type: Boolean
            },

            // Displays a vertical separator between data chip if there are actions
            separator: {
                type:     Boolean,
                observer: '_separatorChanged'
            },

            ariaDisabled: {
                type:               String,
                computed:           '_disabled(disabled)',
                reflectToAttribute: true
            },

            // Full override of date format
            filterFormatToken: {
                type: String
            },

            filterDateOrder: {
                type: String //  auto, YMD, MDY, DMY (auto is default format)
            },

            // Label above the simple filter control
            filterLabel: {
                type: String
            },

            // Label to the right of the simple filter control
            additionalLabel: {
                type: String
            },

            // Width of the simple filter control (can be overridden via themed min-width)
            simpleFilterWidth: {
                type: Number
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

            // The text displayed above the first input box when filtering a range of values
            rangeStartValueLabel: {
                type: String
            },

            // The text displayed above the second input box when filtering a range of values
            rangeEndValueLabel: {
                type: String
            },

            // The text displayed above the drop-down list that is used to set the units when filtering by location or date
            unitsLabel: {
                type: String
            },

            // The text displayed above the input box for latitude when filtering by location
            latitudeLabel: {
                type: String
            },

            // The text displayed above the input box for longitude when filtering by location
            longitudeLabel: {
                type: String
            },

            rightOverflowLabel: {
                type: String
            },

            isEmpty: {
                type:               Boolean,
                computed:           '_computeIsEmpty(hideFilter, actions, rightActions)',
                reflectToAttribute: true
            },

            // ARIA attributes

            role: {
                type:               String,
                value:              'toolbar',
                reflectToAttribute: true
            },

            customBaseTypesMapping: {
                type: Object
            },

            columnFormat: {
                type:  String,
                value: null
            },

            _delegatedFocus: String,

            _resizeObserver: ResizeObserver,

        };
    }

    static get observers() {
        // _updateMinWidth: Properties that affects the minimum width of the toolbar
        // Note: should also watch the private _showChips in the chips-filter, but...
        return ['_updateMinWidth(toolbarMinWidth, query, showAndHideFilters, chipsDisclosure, hideFilter, simpleFilter)',
            '_updateSeparator(separator, actions, rightActions, query)'];
    }

    ready() {
        super.ready();
        if (this.simpleFilter === undefined) {
            this.simpleFilter = false;
        }
        this.__monitorWidthCb = this._monitorWidth.bind(this);
        this._resizeObserver = new ResizeObserver(this.__monitorWidthCb);

        if (this.actions === undefined) {
            this.actions = null; // Make sure ptcs-toolbar-tools is hidden if no actions (or views)
        }
        if (this.variant === undefined) {
            this.variant = 'primary';
        }
    }

    connectedCallback() {
        super.connectedCallback();
        this._resizeObserver.observe(this);
        this._resizeObserver.observe(this.$.toolbar);

        // Complement the resize observer to monitor size changes of the browser window itself. If you resize
        // quickly, the resizeObserver is not getting invoked sufficiently (original comment by Hasse).
        window.addEventListener('resize', this.__monitorWidthCb);
    }

    disconnectedCallback() {
        this._resizeObserver.unobserve(this);
        this._resizeObserver.unobserve(this.$.toolbar);
        window.removeEventListener('resize', this.__monitorWidthCb);
        super.disconnectedCallback();
    }

    // Return the CSS min-width of the simple filter set via theming (if any)
    get simpleFilterMinWidth() {
        return this.$.toolbar.simpleFilterMinWidth;
    }

    _disabled(disabled) {
        return disabled ? 'true' : false;
    }

    // Whenever the available space (might) have changed
    _monitorWidth() {
        if (!this.__resizing) {
            this.__resizing = true;
            requestAnimationFrame(() => {
                this.__resizing = undefined;
                const bb = this.$.toolbar.getBoundingClientRect();
                this.$.toolbar.maxWidth = bb.right - bb.left;
            });
        }
    }

    // ptcs-toolbar-tools has a new minimum width
    _updateMinWidth(toolbarMinWidth /*, query, showAndHideFilters, chipsDisclosure, hideFilter, simpleFilter */) {
        const bb0 = this.getBoundingClientRect();
        const bb1 = this.$.toolbar.getBoundingClientRect();
        const cs = getComputedStyle(this);
        const margin = PTCS.cssDecodeSize(cs.marginLeft, this) + PTCS.cssDecodeSize(cs.marginRight, this);
        const cstb = getComputedStyle(this.$.toolbar);
        const padding = PTCS.cssDecodeSize(cstb.paddingLeft, this.$.toolbar) + PTCS.cssDecodeSize(cstb.paddingRight, this.$.toolbar);

        // Add width for chips filter, if visible, toolbar tools padding, and toolbar margins
        this.style.minWidth = `${bb1.left - bb0.left + toolbarMinWidth + margin + padding + bb0.right - bb1.right}px`;
    }

    _hideDataFilter(hideFilter, simpleFilter) {
        return hideFilter || simpleFilter;
    }

    _showToolsFilter(hideFilter, simpleFilter) {
        return !hideFilter && simpleFilter;
    }

    setDisabled(id, disabled) {
        this.$.toolbar.setDisabled(id, disabled);
    }

    setLabel(id, label) {
        this.$.toolbar.setLabel(id, label);
    }

    setTooltip(id, alt) {
        this.$.toolbar.setTooltip(id, alt);
    }

    setHidden(id, hidden) {
        this.$.toolbar.setHidden(id, hidden);
    }

    setValue(id, value) {
        this.$.toolbar.setValue(id, value);
    }

    setSelected(id, selected) {
        this.$.toolbar.setSelected(id, selected);
    }

    setArrowDownActivate(id, activate) {
        this.$.toolbar.setArrowDownActivate(id, activate);
    }

    _computeIsEmpty(hideFilter, actions, rightActions) {
        if (!hideFilter) {
            return false;
        }
        if (Array.isArray(actions) && actions.length > 0) {
            return false;
        }
        if (Array.isArray(rightActions) && rightActions.length > 0) {
            return false;
        }
        return true;
    }

    _separatorChanged(separator) {
        if (separator) {
            this.setAttribute('pipe-right', '');
        } else {
            this.removeAttribute('pipe-right');
        }
    }

    _updateSeparator(separator, actions, rightActions /*, query */) {
        if (separator && (actions !== null || rightActions !== null)) {
            const df = this.$['data-filter'];
            requestAnimationFrame(() => {
                this.$['pipe-right'].style.height = df.topBarHeight + 'px';
            });
        }
    }

    _hidden(separator, actions, rightActions, hideFilter, simpleFilter, /*, query */) {
        if (!separator || hideFilter || simpleFilter) {
            return true;
        }
        if (actions === null && (rightActions === null || rightActions === undefined)) {
            return true;
        }
        return false;
    }

};


customElements.define(PTCS.ToolBar.is, PTCS.ToolBar);
