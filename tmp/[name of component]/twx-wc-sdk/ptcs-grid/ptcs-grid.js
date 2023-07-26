/* eslint-disable no-confusing-arrow */
import {PolymerElement, html} from '@polymer/polymer/polymer-element.js';
import '@polymer/polymer/lib/elements/dom-repeat.js';
import {PTCS} from 'ptcs-library/library.js';
import {DataManager} from './grid-data.js';
import {DataViewerAPI} from './grid-view-api.js';
import {createSubComponent} from 'ptcs-library/create-sub-component.js';
import 'ptcs-toolbar/ptcs-toolbar.js';
import 'ptcs-behavior-styleable/ptcs-behavior-styleable.js';
import 'ptcs-behavior-focus/ptcs-behavior-focus.js';
import 'ptcs-behavior-tabindex/ptcs-behavior-tabindex.js';
import 'ptcs-confirmation/ptcs-confirmation.js';
import {QuickFilter} from './quick-filter.js';
import './ptcs-columns-display.js';
import './ptcs-core-grid.js';
import './ptcs-data-load-bar';

const updateNewView = Symbol('updateNewView');

// Grid proxy properties for the View Configurator
const dataViewerProperties = [
    'singleLineHeader',
    'singleLineRows',
    'showRowNumbers',
    'maxHeightHeader',
    'maxHeightRow',
    'minHeightRow',
    'headerVerticalAlignment',
    'rowsVerticalAlignment',
    'canDelete',
    'rowDepField',
    'sortSelectionColumn',
    'externalSort',
    'interpolation',
    'columnDefName',
    'dragRows'
];

const sameColumns = (col1, col2) => {
    if (col1.name || col2.name) {
        return col1.name === col2.name;
    }

    if (col1.label || col2.label) {
        return col1.label === col2.label;
    }

    return false;
};

const findColumnByName = (cols, colName) => {
    let res = cols.find(col => col.name === colName);

    if (!res) {
        res = cols.find(col => col.label === colName);
    }

    return res;
};

PTCS.Grid = class extends PTCS.BehaviorTabindex(PTCS.BehaviorFocus(PTCS.BehaviorStyleable(PTCS.ThemableMixin(PolymerElement)))) {
    static get template() {
        return html`
            <style>
           :host {
                display: flex;
                flex-direction: column;
                position: relative;
                overflow: hidden;
            }

            [part="label"] {
                min-width: unset;
                min-height: unset;
            }

            :host(:not([label])) [part="label"] {
                visibility: hidden;
            }

            :host([label=""]) [part="label"] {
                visibility: hidden;
            }

            :host([label]:not([label=""]):not([show-filter])) [part="label"] {
                padding-bottom: 4px;
            }

            ptcs-core-grid {
                flex: 1 1 auto;
            }

            ptcs-label, ptcs-toolbar {
                flex: 0 0 auto;
            }

            [part=message-container] {
                display: flex;
                align-items: center;
                justify-content: center;
                box-sizing: border-box;
                grid-column: 1 / 1000;
            }

            /* When data-loading, the message should be invisible */
            [part=message-container][invisible] {
                visibility: hidden;
            }

            [part=grid-control] {
                display: flex;
                flex-direction: row;
                justify-content: space-between;
                align-items: flex-end;
            }

            [part=reset-button] {
                margin-bottom: 8px;
            }

            [part=reset-button][hidden] {
                display: none;
            }

            [part=grid-control][hidden] {
                display: none;
            }

            [part=columns-display] {
                z-index: 2;
                position: absolute;
            }
            </style>
            <ptcs-label part="label" label="[[label]]" multi-line="" horizontal-alignment="[[labelAlignment]]"
                variant="[[labelVariant]]" disable-tooltip></ptcs-label>
            <ptcs-label part="selected-rows-label" label="[[_selectedRowsLabel]]" hidden\$="[[!_selectedRowsLabel]]" disable-tooltip></ptcs-label>
            <ptcs-toolbar id="toolbar" tabindex\$="[[_gcTabindex(_delegatedFocus, _hideToolbar)]]" part="grid-control" disabled="[[disabled]]"
                variant="secondary" hide-filter=[[!showFilter]] simple-filter filter-string="{{filterString}}" filter-label="[[filterLabel]]"
                filter-hint-text="[[filterHintText]]" right-overflow-label="[[toolbarRightText]]"
                hidden\$="[[_hideToolbar]]">
            </ptcs-toolbar>
            <ptcs-columns-display id="columns-display" part=columns-display view="[[view]]" mode="{{_columnsDisplayMode}}"
                options="[[columnsMenuOptions]]" visible-items="[[columnsMenuVisibleItems]]"
                tooltip-reorder="[[columnsMenuReorderTooltip]]" tooltip-show="[[columnsMenuVisibilityTooltip]]"
                apply-button-text="[[applyButtonText]]" cancel-button-text="[[cancelButtonText]]">
            </ptcs-columns-display>
            <ptcs-core-grid id="grid" tabindex\$="[[_delegatedFocus]]" part="core-grid"
                disabled="[[disabled]]" view="[[view]]" data="[[data]]" __default-columns="[[__defaultColumns]]"
                hide-header="[[hideHeader]]" select-row="[[selectRow]]" resize-columns="[[resizeColumns]]"
                edit-control-visibility="[[editControlVisibility]]"
                disable-row="[[disableRow]]" disable-child-rows="[[disableChildRows]]" on-new-row="_onNewRow"
                row-edit-form-title="[[rowEditFormTitle]]" row-edit-form-add-title="[[rowEditFormAddTitle]]"
                update-button-text="[[updateButtonText]]"
                add-button-text="[[addButtonText]]"
                apply-button-text="[[applyButtonText]]"
                cancel-button-text="[[cancelButtonText]]"
                date-label="[[dateLabel]]"
                month-label="[[monthLabel]]"
                year-label="[[yearLabel]]"
                hours-label="[[hoursLabel]]"
                minutes-label="[[minutesLabel]]"
                seconds-label="[[secondsLabel]]"
                meridiem-label="[[meridiemLabel]]"
                select-label="[[selectLabel]]" cancel-label="[[cancelLabel]]" parent-label="[[parentLabel]]" no-parent-label="[[noParentLabel]]"
                hide-validation-error ="[[hideValidationError]]" validation-error-icon="[[validationErrorIcon]]"
                hide-validation-criteria="[[hideValidationCriteria]]" validation-criteria-icon="[[validationCriteriaIcon]]"
                hide-validation-success="[[hideValidationSuccess]]" validation-success-icon="[[validationSuccessIcon]]"
                highlight-drafts\$="[[highlightDrafts]]" reorder-columns="[[reorderColumns]]" auto-scroll="[[autoScroll]]"
                navigation="[[navigation]]" prevent-focus-row-wrap="[[preventFocusRowWrap]]" select-follows-focus="[[selectFollowsFocus]]"
                footer-data="[[footerData]]" show-footer="[[showFooter]]" show-header-row-in-footer="[[showHeaderRowInFooter]]"
                highlight-new-rows="[[highlightNewRows]]">
                <div part="message-container" invisible\$="[[_or(dataLoading, hideMessage)]]">
                    <ptcs-icon part="message-icon" icon="[[_messageIcon]]"></ptcs-icon>
                    <ptcs-label variant="label" part="message-label" label="[[_messageText]]"></ptcs-label>
                </div>
            </ptcs-core-grid>
            <ptcs-confirmation id="dlg" primary-action-label="OK" hide-cancel-action/>`;
    }

    static get is() {
        return 'ptcs-grid';
    }

    static get properties() {
        return {
            disabled: {
                type:               Boolean,
                reflectToAttribute: true
            },

            disableRow: {
                type: Object
            },

            disableChildRows: { // Only used in tree grid mode
                type: Boolean
            },

            // show filter?
            showFilter: {
                type:               Boolean,
                value:              false,
                reflectToAttribute: true
            },

            // Width of the simple filter control
            filterWidth: {
                type:     Number,
                observer: '_filterWidthChanged'
            },

            // show reset?
            showResetButton: {
                type:  Boolean,
                value: false
            },

            resetButtonText: {
                type: String
            },

            resetButtonType: {
                type:  String,
                value: 'transparent'
            },

            displayButtonText: {
                type: String
            },

            // Keep selected rows (when filtering, scrolling, TBD: sorting, ...)
            clearFilteredSelection: {
                type:     Boolean,
                observer: '_clearFilteredSelectionChanged'
            },

            // Filter search string
            filterString: {
                type:     String,
                notify:   true,
                observer: '_filterStringChanged'
            },

            // Label above filter control
            filterLabel: {
                type: String
            },

            // Hint text for the filter control text field
            filterHintText: {
                type: String
            },

            _hideToolbar: {
                type:     Boolean,
                // eslint-disable-next-line max-len
                computed: '_computeHideToolbar(showFilter, showResetButton, showEditButton, showDeleteRowButton, showAddRowButton, showExpandAll, asynchronousNodeLoading, alwaysExpanded, columnsMenuOptions, customActions, customActionsPosition)'
            },

            // Hide the grid message
            hideMessage: {
                type: Boolean
            },

            // Message to display in message pane
            _messageText: {
                type: String
            },

            // Icon for the message pane
            _messageIcon: {
                type: String
            },

            // Button label for right toolbar overflow button
            toolbarRightText: {
                type: String
            },

            // Selected item boilerplate (singular)
            selectedItemText: {
                type:     String,
                observer: '_selectedItemTextChanged'
            },

            // Selected items boilerplate (plural)
            selectedItemsText: {
                type:     String,
                observer: '_selectedItemsTextChanged'
            },

            // Selected rows label
            _selectedRowsLabel: {
                type:  String,
                value: ''
            },

            // Message on no data (prompt to bind data)
            bindDataText: {
                type:  String,
                value: 'Bind data to the grid.'
            },

            // Message on no data (alternative wording for runtime)
            noDataToDisplayText: {
                type:  String,
                value: 'There is no data to display.'
            },

            // Message on no data to show (after binding, but no rows data)
            noResultsText: {
                type:  String,
                value: 'No results.'
            },

            // Message for when all rows have been filtered out
            noMatchesText: {
                type:  String,
                value: 'No matches found.'
            },

            // Set while data is being loaded, to display the loading indicator (indeterminate progress bar)
            dataLoading: {
                type:     Boolean,
                observer: '_dataLoadingChanged'
            },

            // Container size in pixels (same height / width) for the data loading indicator
            loadingIndicatorSize: {
                type:  Number,
                value: 200
            },

            // Delay in ms before the loading indicator is shown
            loadingIndicatorDelay: {
                type:  Number,
                value: 1000
            },

            // Custom data loading image source url (the image replaces the default progress bar if loaded successfully)
            loadingIndicatorImage: {
                type: String
            },

            // Hide header
            hideHeader: {
                type: Boolean
            },

            // Select row by clicking anywhere on the row
            selectRow: {
                type: Boolean
            },

            // Data Viewer / View Configurator
            view: {
                type:     Object,
                observer: '_viewChanged'
            },

            // View Configurator created from ptcs-grid-column-def elements
            // Only created if ptcs-grid contains ptcs-grid-column-def elements.
            // If the client manually assign a View Configurator, _viewColDef is disabled / unloaded
            __viewColDef: {
                type: Object
            },

            // Data Manager
            data: {
                type:     Object,
                observer: '_dataChanged'
            },

            // Simplified interface for specifying data items
            items: {
                type:     Array,
                observer: '_itemsChanged'
            },

            selectMethod: {
                type:     String,
                observer: '_selectMethodChanged'
            },

            subItems: {
                type:     String,
                observer: '_subItemsChanged'
            },

            // selected indexes of data manager
            selectedIndexes: {
                type:     Array,
                notify:   true,
                observer: '_selectedIndexesChanged'
            },

            // Grid title
            label: {
                type:               String,
                reflectToAttribute: true
            },

            expandAllText: {
                type:  String,
                value: 'Expand All'
            },

            collapseAllText: {
                type:  String,
                value: 'Collapse All'
            },

            // [left] || center || right
            labelAlignment: {
                type: String
            },

            // Grid title label variant
            labelVariant: {
                type: String
            },

            // Should we store user interactions in browser local storage? (effective only when gridId is defined)
            cacheRuntimeChanges: {
                type:               Boolean,
                observer:           '_cacheRuntimeChangesChanged',
                reflectToAttribute: true
            },

            // Id for internal grid usage. Currently only for keeping sort configurations.
            gridId: {
                type:               String,
                reflectToAttribute: true
            },

            resizeColumns: {
                type: Boolean // true: resize columns, false: don't resize columns, undefined: only resize tree toggle
            },

            reorderColumns: {
                type:  Boolean,
                value: false
            },

            _resetButtonDisabled: {
                type:     Boolean,
                computed: '_disabledResetButton(_sortDeftChg, _filterDeftChg, _selectedDeftChg, _changeResizeCol,' +
                '_changeReorderingCol, _changeColumnsVisibility)'
            },

            // Header Label for row edit form
            rowEditFormTitle: {
                type: String
            },

            // Header label for row edit form when it adds a new row
            rowEditFormAddTitle: {
                type: String
            },

            // Label for "Update" button in row edit form
            updateButtonText: {
                type: String
            },

            // Label for "Update" button in row edit form when it adds a new row
            addButtonText: {
                type: String
            },

            // Label for "Apply" button in column reorder form
            applyButtonText: {
                type: String
            },

            // Label for "Cancel" buttons (in column reorder form and row editor)
            cancelButtonText: {
                type: String
            },

            // Calendar labels
            dateLabel: {
                type: String
            },

            monthLabel: {
                type: String
            },

            yearLabel: {
                type: String
            },

            hoursLabel: {
                type: String
            },

            minutesLabel: {
                type: String
            },

            secondsLabel: {
                type: String
            },

            meridiemLabel: {
                type: String
            },

            selectLabel: {
                type: String
            },

            cancelLabel: {
                type: String
            },

            // The label  "Parent" in the edit form when adding an item in the tree grid
            parentLabel: {
                type: String
            },

            // The label used as the "Parent" value in the edit form when adding a root item
            noParentLabel: {
                type: String
            },

            // Edit mode: 'cell', 'row', 'grid' (anything else disables editing)
            edit: {
                type: String
            },

            // Show edit button in toolbar that allows you to turn on/off edit mode?
            showEditButton: {
                type: Boolean
            },

            // Label for Edit toolbar button
            editButtonText: {
                type: String
            },

            // Label for Save Edit toolbar button
            saveEditButtonText: {
                type: String
            },

            // Label for Cancel Edit toolbar button
            cancelEditButtonText: {
                type: String
            },

            // The edit state: when true all editable cells can be editied
            isEditable: {
                type:   Boolean,
                notify: true
            },

            // Hide validation error message
            hideValidationError: {
                type: Boolean
            },

            // Hide validation criteria message (info state)
            hideValidationCriteria: {
                type: Boolean
            },

            // Hide validation success message
            hideValidationSuccess: {
                type: Boolean
            },

            // Icon for validation error
            validationErrorIcon: {
                type: String
            },

            // Icon for validation success
            validationSuccessIcon: {
                type: String
            },

            // Icon for validation criteria (info state)
            validationCriteriaIcon: {
                type: String
            },

            // Show Delete Row button in toolbar that allows you to delete the selected rows?
            showDeleteRowButton: {
                type: Boolean
            },

            // Label for Delete Row toolbar button
            deleteRowButtonText: {
                type: String
            },

            // Show Add Row button in toolbar? (It triggers an event for the client to act on)
            showAddRowButton: {
                type: Boolean
            },

            // Label for Add Row toolbar button
            addRowButtonText: {
                type: String
            },

            // True if any rows are aditable
            _hasEditableRows: {
                type:     Boolean,
                observer: '_hasEditableRowsChanged'
            },

            // 'icon' (default), 'link', or 'none'
            editControl: {
                type: String
            },

            editControlLabel: {
                type: String
            },

            editControlIcon: {
                type: String,
            },

            // How and when to show the edit control: 'hover' (default), 'always', 'never'
            editControlVisibility: {
                type: String
            },

            // Are any inline editied changes invalid?
            _isInvalid: {
                type:     Boolean,
                observer: '_isInvalidChanged'
            },

            highlightDrafts: {
                type: Boolean
            },

            highlightNewRows: {
                type: Boolean
            },

            _columnsDisplayMode: {
                type:     String,
                value:    'closed',
                observer: '_columnsDisplayModeChanged'
            },

            // none / show / reorder / both
            columnsMenuOptions: {
                type:  String,
                value: 'none'
            },

            columnsMenuVisibleItems: {
                type:  Number,
                value: 6
            },

            autoScroll: {
                type: Boolean
            },

            // Do we allow to move to the previous/next row when pressing left/right arrow key from the
            // first/last item on a row?
            preventFocusRowWrap: {
                type: Boolean
            },

            navigation: {
                type: String // row-first (default), cell-first, cell-only
            },

            selectFollowsFocus: {
                type: Boolean
            },

            footerData: {
                type:  Array,
                value: () => []
            },

            showFooter: {
                type:  Boolean,
                value: false
            },

            showHeaderRowInFooter: {
                type:  Boolean,
                value: false
            },

            // Tooltip for the reorder icon in the column reorder form
            columnsMenuReorderTooltip: {
                type: String
            },

            // Tooltip for the column visibility checkbox in the column reorder form
            columnsMenuVisibilityTooltip: {
                type: String
            },

            showExpandAll: {
                type: Boolean,
            },

            alwaysExpanded: {
                type:     Boolean,
                observer: '_alwaysExpandedChanged'
            },

            maxExpandedRows: {
                type: Number
            },

            maxRowsMessageTitle: {
                type:  String,
                value: 'Maximum number of items reached'
            },

            maxRowsMessage: {
                type:  String,
                value: 'You have reached the maximum number of expanded rows.'
            },

            preserveRowExpansion: {
                type: Boolean
            },

            // Field in items that contain unique id
            idField: {
                type: String
            },

            asynchronousNodeLoading: {
                type: Boolean
            },

            selectParentOnly: { // Only used in tree grid mode
                type: Boolean
            },

            customActions: {
                type: Array
            },

            customActionsPosition: {
                type:  String,
                value: 'after'
            },

            __defaultColumns: Array,

            __gridConfigurationsApplied: Boolean,

            _changeResizeCol: Boolean,

            _changeReorderingCol: Boolean,

            _changeColumnsVisibility: Boolean,

            //
            // DataViewerAPI properties
            //

            // Display header rows as single Line?
            singleLineHeader: Boolean,

            // Display grid rows as single Line?
            singleLineRows: Boolean,

            // Display grid rows numbers?
            showRowNumbers: Boolean,

            // Maximum header height
            maxHeightHeader: String,

            // Maximum row height
            maxHeightRow: String,

            // Minimum row height
            minHeightRow: String,

            // Selection button vertical alignment in header
            headerVerticalAlignment: String,

            // Selection button vertical alignment in rows
            rowsVerticalAlignment: String,

            // Add a delete button column?
            canDelete: Boolean,

            // Name of field for row state formatting
            rowDepField: String,

            // Allow sorting based on selection state?
            sortSelectionColumn: Boolean,

            // Use internal or external sort function when user clicks sort icon
            externalSort: Boolean,

            // Name of column definition element. Default: ptcs-column-def
            columnDefName: String,

            // Default: { "prefix": "${", "suffix": "}" }
            interpolation: Object,

            // Can grid rows be dragged to new positions?
            dragRows: Boolean,

            // Support selections: add a select button column: 'single' || 'multiple'
            // Note: the view configurator calls this property selectMethod
            selectButton: {
                type:     String,
                observer: '_selectButtonChanged'
            },

            // Focus delegation
            _delegatedFocus: String,

            // Open a confirmation dialog before row deletion? (widget level)
            deleteRowsConfirmation: Boolean,

            _resizeObserver: ResizeObserver
        };
    }

    connectedCallback() {
        super.connectedCallback();
        this._resizeObserver.observe(this);
    }

    disconnectedCallback() {
        this._resizeObserver.unobserve(this);
        super.disconnectedCallback();
    }

    _clearGridConfigurations() {
        // Don't clear grid configurations before we applied them for the first time
        if (!this.__gridConfigurationsApplied) {
            return;
        }

        PTCS.saveValueInSession(`${this.gridId}_ptcsgridconf`, null);
    }

    _saveGridConfigurations() {
        if (!this.cacheRuntimeChanges || !this.gridId || !this.view || !this.data) {
            return;
        }

        const conf = {};

        const assign = (propName, value) => {
            if (value) {
                conf[propName] = value;
            }
        };

        assign('sort', this._sortDeftChg && this.view.getSortExpression().short);
        assign('visibility', this._changeColumnsVisibility && this.view.getVisibilityExpression());
        assign('widths', this._changeResizeCol && this.view.getWidthsExpression());
        assign('order', this._changeReorderingCol && this.view.getOrderExpression());

        if (this.preserveRowExpansion && this.idField) {
            const expanded = [];

            this.data.getExpandedItems((item, isOpen) => {
                if (isOpen && item[this.idField]) {
                    expanded.push(item[this.idField]);
                }
            });

            assign('expanded', expanded.length > 0 && expanded.join('|'));
        }

        if (Object.keys(conf).length === 0) {
            this._clearGridConfigurations();
        } else {
            PTCS.saveValueInSession(`${this.gridId}_ptcsgridconf`, JSON.stringify(conf));
        }
    }

    static get observers() {
        return [
            '_observeMessage(data, bindDataText, noDataToDisplayText, noResultsText, noMatchesText)',
            // eslint-disable-next-line max-len
            '_initToolbar(resetButtonText, editButtonText, saveEditButtonText, cancelEditButtonText, addRowButtonText, deleteRowButtonText, displayButtonText, resetButtonType, customActions.*, customActionsPosition)',
            '_modifyToolbar(showResetButton, _resetButtonDisabled, columnsMenuOptions)',
            '_setEditMode(edit, isEditable, showEditButton, showAddRowButton, showDeleteRowButton)',
            '_setEditControl(editControl, editControlLabel, editControlIcon, editControlVisibility)',
            '_setExpandMode(showExpandAll, alwaysExpanded)',
            '_setMaxExpandedRows(maxExpandedRows, data)'
        ];
    }

    constructor() {
        super();

        this.__toolbarAction = ev => {
            switch (ev.detail.action.id) {
                case 'reset-button':
                    this.resetAction();
                    break;
                case 'edit':
                    this.isEditable = true;
                    this.dispatchEvent(new CustomEvent('edit-started'));
                    break;
                case 'save':
                    this.saveAction();
                    break;
                case 'cancel':
                    this.cancelAction();
                    break;
                case 'delete-rows':
                    this.dispatchEvent(new CustomEvent('delete-row-clicked', {detail: {rowsIndex: this.selectedIndexes}}));
                    if (!this.deleteRowsConfirmation) {
                        this.deleteSelectedRows();
                    }
                    break;
                case 'add-row':
                    this.$.grid.addRow();
                    break;
                case 'columns-display-button':
                    // A hack to stop the toolbar from reopening the reorder menu if clicking on the Display toolbar button
                    if (Date.now() - this.__columnsMenuClosedAtTime < 100) {
                        // User clicked on display button to close the menu.
                        // Don't reopen the menu
                        break;
                    }
                    this._columnsDisplayR = ev.detail.r;
                    this.$['columns-display'].view = this.view;
                    this._columnsDisplayMode = (this._columnsDisplayMode === 'open' ? 'closed' : 'open');
                    break;
                case 'collapse-all':
                    if (this.data) {
                        this.data.collapseAll();
                    }
                    break;
                case 'expand-all':
                    if (this.data) {
                        this.data.expandAll();
                    }
                    break;
                default:
                    this.dispatchEvent(new CustomEvent('custom-actions-activated', {
                        composed: true,
                        detail:   ev.detail
                    }));
            }
        };

        this.__toolbarValue = ev => {
            switch (ev.detail.action.id) {
                case 'toggle-edit':
                    this.isEditable = ev.detail.value;
                    // Don't trigger the changed edit event unless the toggle is visible
                    if (this.edit === 'cell' || this.edit === 'row') {
                        this.dispatchEvent(new CustomEvent(this.isEditable ? 'edit-started' : 'edit-completed'));
                    }
                    break;
                default:
                    this.dispatchEvent(new CustomEvent('custom-actions-value-changed', {
                        composed: true,
                        detail:   ev.detail
                    }));
            }
        };
    }

    ready() {
        super.ready();

        // Configure View Configurator DOM interface
        this._mutationObserver = new MutationObserver(this._mutatedDom.bind(this));
        this._mutationObserver.observe(this, {childList: true, subtree: true, attributes: true, characterData: true});
        this._initViewColDef();

        // Add observers for the properties that are directly mapped to the view configurator
        dataViewerProperties.forEach(propName => {
            this._createPropertyObserver(propName, propValue => this._setViewProp(propName, propValue), false);
        });

        this._initToolbar();

        this._clickOutsideHandler = ev => {
            if (this._isEventOutside(ev) && this._columnsDisplayMode === 'open') {
                ev.preventDefault();
                ev.stopPropagation();

                this._columnsDisplayMode = 'closed';

                document.addEventListener('mouseup', () => {
                    // A hack to stop the toolbar from reopening the reorder menu if clicking on the Display toolbar button
                    this.__columnsMenuClosedAtTime = Date.now();
                }, {capture: true, once: true});
            }
        };

        this._mouseOutsideHandler = ev => {
            if (this._isEventOutside(ev) && this._columnsDisplayMode === 'open') {
                ev.preventDefault();
                ev.stopPropagation();
            }
        };

        if (this.toolbarRightText === undefined) {
            this.toolbarRightText = 'View';
        }

        this.$.grid.addEventListener('columns-resized', e => {
            this._changeResizeCol = true;

            this._saveGridConfigurations();
        });

        this.$.grid.addEventListener('core-grid-dv-changed', e => {
            this._handleGridDefaults();
        });

        // Enable edit mode if still unassigned and edit button is not used
        if (this.isEditable === undefined && !this.showEditButton) {
            this.isEditable = true;
        }

        this.setExternalComponentId();

        this.$.grid.slottedMessage = true;

        this._resizeObserver = new ResizeObserver(() => this.$.grid.adjustView());
    }

    _handleGridDefaults() {
        if (this.view[updateNewView] !== false) {
            this.view[updateNewView] = false;
            this.__defaultColumns = undefined;
        }
        const columnsDef = this.view.columnsDef;

        this._hasEditableRows = columnsDef && columnsDef.some(col => col.editable);

        if (this.__defaultColumns) {
            // If default columns already exist check if anything changed
            let changeReorderingCol = false, changeResizeCol = false, changeColumnsVisibility = false;

            columnsDef.forEach((col, i) => {
                let defaultCol = this.__defaultColumns[i];

                if (!defaultCol) {
                    return;
                }

                if (!sameColumns(col, defaultCol)) {
                    defaultCol = this.__defaultColumns.find(def => sameColumns(col, def));

                    if (!defaultCol) {
                        return;
                    }

                    changeReorderingCol = true;
                }

                if ((col.width || defaultCol.width) && col.width !== defaultCol.width) {
                    changeResizeCol = true;
                }

                if (!!col.hidden !== !!defaultCol.hidden) {
                    changeColumnsVisibility = true;
                }
            });

            this._changeReorderingCol = changeReorderingCol;
            this._changeResizeCol = changeResizeCol;
            this._changeColumnsVisibility = changeColumnsVisibility;

            this._saveGridConfigurations();

            return;
        }

        this.__defaultColumns = columnsDef.map(col => {
            const col2 = {};
            for (const key of ['name', 'label', 'hidden', 'width']) {
                if (col.hasOwnProperty(key)) {
                    col2[key] = col[key];
                }
            }

            return col2;
        });

        requestAnimationFrame(() => {
            // After we saved the defaults first time apply cached configurations
            this._applyGridConfigurations();
        });
    }

    _isEventOutside(/**@type {MouseEvent}*/ ev) {
        if (this._columnsDisplayMode === 'closed') {
            return true;
        }

        const rect = this.$['columns-display'].getBoundingClientRect();

        let left, right, top, bottom;
        ({left, right, top, bottom} = rect);

        let {posX: x, posY: y} = PTCS.getCoordinatesFromEvent(ev);

        return !(x >= Math.floor(left) && x <= Math.floor(right) &&
            y >= Math.floor(top) && y <= Math.floor(bottom));
    }

    _columnsDisplayModeChanged(mode) {
        this.$.toolbar.setSelected('columns-display-button', mode === 'open');
        if (mode === 'open') {
            const gR = this.getBoundingClientRect();
            this.$['columns-display'].style.right = `${gR.right - this._columnsDisplayR.right}px`;
            this.$['columns-display'].style.top = `${this._columnsDisplayR.bottom - gR.top + 8}px`;

            document.addEventListener('mousedown', this._clickOutsideHandler, true);

            if (this.hasAttribute('tabindex')) {
                // Set the tabindex to be whatever the "main" component is having
                this.$['columns-display'].setAttribute('tabindex', this.getAttribute('tabindex'));
                setTimeout(() => {
                    this.$['columns-display'].focus();
                }, 100);
            }

            return;
        }

        document.removeEventListener('mousedown', this._clickOutsideHandler, true);
    }

    _or(...args) {
        return args.find(v => !!v) || false;
    }

    _computeHideToolbar(showFilter, showResetButton, showEditButton, showDeleteRowButton, showAddRowButton, showExpandAll,
        asynchronousNodeLoading, alwaysExpanded, columnsMenuOptions, customActions, customActionsPosition) {
        return !showFilter && !showResetButton && !showEditButton && !showDeleteRowButton && !showAddRowButton &&
            !(showExpandAll && !asynchronousNodeLoading && !alwaysExpanded) && columnsMenuOptions === 'none' &&
            (!customActions || customActionsPosition === 'none');
    }

    _gcTabindex(_delegatedFocus, _hideToolbar) {
        return _hideToolbar ? false : _delegatedFocus;
    }

    _initToolbar() {
        const toolbar = this.$.toolbar;
        if (!toolbar) {
            return;
        }

        this._initQuickFilter();

        let actions = [
            // Toggle edit mode
            {
                type:   'toggle',
                id:     'toggle-edit',
                label:  this.editButtonText || 'Edit Mode',
                hidden: true,
                value:  this.isEditable,
                opt:    {icon: 'cds:icon_edit'}
            },
            // Enable edit mode
            {
                type:   'link',
                id:     'edit',
                label:  this.editButtonText || 'Edit Grid',
                hidden: true,
            },
            // Add row
            {
                type:     'button',
                id:       'add-row',
                label:    this.addRowButtonText || 'Add',
                hidden:   true,
                disabled: this._hasEditableRows,
                opt:      {variant: 'transparent', icon: 'cds:icon_add'}
            },
            // Delete selected rows
            {
                type:     'button',
                id:       'delete-rows',
                label:    this.deleteRowButtonText || 'Delete',
                hidden:   true,
                disabled: !(Array.isArray(this.selectedIndexes) && this.selectedIndexes.length > 0),
                opt:      {variant: 'transparent', icon: 'cds:icon_delete'}
            },
            // Save edits
            {
                type:     'button',
                id:       'save',
                label:    this.saveEditButtonText || 'Save',
                hidden:   true,
                disabled: this._isInvalid,
                opt:      {variant: 'primary'}
            },
            // Cancel edits
            {
                type:   'button',
                id:     'cancel',
                label:  this.cancelEditButtonText || 'Cancel',
                hidden: true,
                opt:    {variant: 'tertiary'}
            },
            // Expand all nodes
            {
                type:   'link',
                id:     'expand-all',
                label:  this.expandAllText || 'Expand All',
                hidden: true
            },
            // Collapse all nodes
            {
                type:   'link',
                id:     'collapse-all',
                label:  this.collapseAllText || 'Collapse All',
                hidden: true
            }
        ];

        if (Array.isArray(this.customActions) && this.customActions.length > 0) {
            if (this.customActionsPosition === 'before') {
                actions = this.customActions.concat(actions);
            } else if (this.customActionsPosition === 'after') {
                actions = actions.concat(this.customActions);
            }
        }

        toolbar.actions = actions;

        toolbar.rightActions = [
            // Reset button
            {
                type:  'button',
                id:    'columns-display-button',
                label: this.displayButtonText || 'Display',
                opt:   {variant: 'tertiary', icon: 'cds:icon_chevron_down', iconPlacement: 'right'}
            },
            {
                type:     'button',
                id:       'reset-button',
                label:    this.resetButtonText || 'Reset',
                hidden:   !this.showResetButton,
                disabled: this._resetButtonDisabled,
                opt:      {
                    icon:    'cds:icon_refresh',
                    variant: this.resetButtonType
                }
            }
        ];

        toolbar.removeEventListener('activated', this.__toolbarAction);
        toolbar.addEventListener('activated', this.__toolbarAction);
        toolbar.removeEventListener('value-changed', this.__toolbarValue);
        toolbar.addEventListener('value-changed', this.__toolbarValue);

        toolbar.setArrowDownActivate('columns-display-button', true);

        this._setEditMode(this.edit, this.isEditable, this.showEditButton, this.showAddRowButton, this.showDeleteRowButton);
        this._modifyToolbar(this.showResetButton, this._resetButtonDisabled, this.columnsMenuOptions);
    }

    _disableToolbarAction(id, disabled) {
        const toolbar = this.$.toolbar;
        if (toolbar) {
            toolbar.setDisabled(id, disabled);
        }
    }

    _hideToolbarAction(id, hidden) {
        const toolbar = this.$.toolbar;
        if (toolbar) {
            toolbar.setHidden(id, hidden);
        }
    }

    _setToolbarValue(id, value) {
        const toolbar = this.$.toolbar;
        if (toolbar) {
            toolbar.setValue(id, value);
        }
    }

    _modifyToolbar(showResetButton, _resetButtonDisabled, columnsMenuOptions) {
        if (!this.$.toolbar) {
            return;
        }

        this.$.toolbar.setHidden('reset-button', !showResetButton);
        this.$.toolbar.setDisabled('reset-button', _resetButtonDisabled);
        this.$.toolbar.setHidden('columns-display-button', columnsMenuOptions === 'none');
    }

    modifyCustomAction(actionId, value, updateType) {
        switch (updateType) {
            case 'value':
                this.$.toolbar.setValue(actionId, value);
                break;
            case 'disabled':
                this.$.toolbar.setDisabled(actionId, value);
                break;
            case 'visible':
                this.$.toolbar.setHidden(actionId, !value);
                break;
            default:
                break;
        }
    }

    _isInvalidChanged(_isInvalid) {
        if (this.$.toolbar) {
            this.$.toolbar.setDisabled('save', _isInvalid);
        }
    }

    _updateInvalid() {
        this._isInvalid = this.view && this.view.editLevel === 'grid' && !this.data.isValid;
    }

    __enableAddRowButton() {
        // Disable "Add Row" button if there isn't any editable fields or if the grid is a tree grid with more than one selected row.
        // For Tree Grid:
        // - zero selected rows: add new item last
        // - one selected row: add new item as child of the selected item
        // - multiple selected rows: not allowed to add item
        this._disableToolbarAction('add-row',
            !this._hasEditableRows || (this.data.isTreeGrid && this.selectedIndexes && this.selectedIndexes.length > 1));
    }

    _hasEditableRowsChanged() {
        this.__enableAddRowButton();
    }

    _setEditMode(edit, isEditable, showEditButton, showAddRowButton, showDeleteRowButton) {
        // Can rows be edded or deleted?
        const canAddDelete = !showEditButton || isEditable;

        // Is inline editing enabled?
        const inlineEditing = edit === 'cell' || edit === 'row' || edit === 'grid';

        // Should grid show an edit button?
        const editable = showEditButton && (inlineEditing || showAddRowButton || showDeleteRowButton);
        const showEditToggle = editable && edit !== 'grid'; // Show as single toggle?
        const showEditButtons = editable && edit === 'grid'; // Show as Edit / Save / Cancel?

        if (this.view) {
            this.view.editLevel = isEditable && inlineEditing && edit;
        }
        this._hideToolbarAction('toggle-edit', !showEditToggle);
        this._hideToolbarAction('edit', !(showEditButtons && !isEditable));
        this._hideToolbarAction('save', !(showEditButtons && isEditable));
        this._hideToolbarAction('cancel', !(showEditButtons && isEditable));
        this._hideToolbarAction('add-row', !(showAddRowButton && canAddDelete));
        this._hideToolbarAction('delete-rows', !(showDeleteRowButton && canAddDelete));

        this._setToolbarValue('toggle-edit', isEditable);
    }

    _setExpandMode() {
        if (this.showExpandAll && !this.alwaysExpanded && !this.asynchronousNodeLoading) {
            const expandState = this.data && this.data.expandState;
            if (this.__oldEM === expandState) {
                return;
            }
            this.__oldEM = expandState;
            this._hideToolbarAction('expand-all', expandState === 'expanded');
            this._hideToolbarAction('collapse-all', expandState === 'collapsed' || expandState === 'partial');
        } else {
            if (this.__oldEM === undefined) {
                return;
            }
            this.__oldEM = undefined;
            this._hideToolbarAction('expand-all', true);
            this._hideToolbarAction('collapse-all', true);
        }
    }

    _alwaysExpandedChanged(alwaysExpanded) {
        if (this.data && alwaysExpanded) {
            this.data.expandAll();
        }
        if (this.view) {
            this.view.hideTreeToggle = alwaysExpanded || undefined;
        }
    }

    _initQuickFilter() {
        if (!this._quickFilter) {
            this._quickFilter = new QuickFilter();

            this._quickFilter.setLabel = (label) => {
                this._selectedRowsLabel = label;
            };
        }
    }

    _selectedItemTextChanged(selectedItemText) {
        this._initQuickFilter();
        this._quickFilter.selectedItemText = selectedItemText;
    }

    _selectedItemsTextChanged(selectedItemsText) {
        this._initQuickFilter();
        this._quickFilter.selectedItemsText = selectedItemsText;
    }

    _clearFilteredSelectionChanged(clearFilteredSelection) {
        this._initQuickFilter();
        this._quickFilter.clearFilteredSelection = clearFilteredSelection;
    }

    _filterStringChanged(filterString) {
        if (this._quickFilter) {
            this._quickFilter.filterString = filterString;
        }
    }

    // Set width of the simple filter
    _filterWidthChanged(filterWidth) {
        this.$.toolbar.$.toolbar.$.filter.style.width = filterWidth ? filterWidth + 'px' : '';
    }

    _onNewRow() {
        this.filterString = '';
    }


    scrollTo(index) {
        this.$.grid.scrollTo(index);
    }

    // Return the CSS min-width of the quick filter set via theming (if any)
    get quickFilterMinWidth() {
        return this.$.toolbar.$.toolbar.simpleFilterMinWidth;
    }

    _restoreGridConfFromSession() {
        let gridConf = null;
        try {
            gridConf = JSON.parse(PTCS.restoreValueFromSession(`${this.gridId}_ptcsgridconf`));
        } catch (e) {
            console.warn('Grid failed to load configurations: Illegal JSON value', e);
        }
        return gridConf;
    }

    _applyGridConfigurations() {
        if (this.cacheRuntimeChanges && this.view && this.data) {
            const conf = this._restoreGridConfFromSession();

            if (!conf) {
                this.__gridConfigurationsApplied = true;
                return;
            }

            const currCols = this.view.columnsDef;
            let cols = [];

            if (conf.order) {
                const orderArr = conf.order.split(',');

                orderArr.forEach(s => {
                    if (!s) {
                        return;
                    }

                    const s2 = s.split(':');

                    // Push the columns to the new array according to the stored order
                    cols.push(findColumnByName(currCols, s2[0]));
                });

                this._changeReorderingCol = true;
            } else {
                cols = [...this.view.columnsDef];
            }

            if (conf.sort) {
                const sortArr = conf.sort.split(',');

                sortArr.forEach(s => {
                    if (!s) {
                        return;
                    }

                    const s2 = s.split(':');
                    const fCol = findColumnByName(cols, s2[0]);

                    if (fCol) {
                        fCol.sortable = true;
                    }
                });

                this._sortDeftChg = true;
            }

            if (conf.visibility) {
                const visibilityArr = conf.visibility.split(',');

                visibilityArr.forEach(s => {
                    if (!s) {
                        return;
                    }

                    const s2 = s.split(':');
                    const fCol = findColumnByName(cols, s2[0]);

                    if (fCol) {
                        fCol.hidden = s2[1] === 'false';
                    }
                });

                this._changeColumnsVisibility = true;
            }

            if (conf.widths) {
                const widthsArr = conf.widths.split(',');

                widthsArr.forEach(s => {
                    if (!s) {
                        return;
                    }

                    const s2 = s.split(':');
                    const fCol = findColumnByName(cols, s2[0]);

                    if (fCol) {
                        fCol.width = s2[1];
                    }
                });

                this._changeResizeCol = true;
            }

            this.view.columnsDef = [...cols];

            if (conf.sort) {
                // Sort can be applied only after the grid is rebuilt
                requestAnimationFrame(() => {
                    this.view.setSortExpression(conf.sort, this.data, {
                        noOrder: false,
                        reset:   true
                    });

                    this.dispatchEvent(new CustomEvent('grid-conf-sort-applied'));
                });
            }

            if (conf.expanded && this.idField) {
                this.expandRows(conf.expanded.split('|'));
            } else {
                this._autoExpandSet = undefined;
            }

            this.__gridConfigurationsApplied = true;
        }
    }

    expandRows(idsToExpand) {
        this._autoExpandEnd = 0;
        this._autoExpandSet = new Set(idsToExpand);

        setTimeout(() => this._autoExpand(this.data.baseLength), 100);
    }

    selectRows(idsToSelect, replace = true) {
        this._autoSelectEnd = 0;

        if (replace) {
            this._autoSelectSet = new Set(idsToSelect);
        } else if (idsToSelect) {
            this._autoSelectSet = this._autoSelectSet ? new Set(...idsToSelect, ...this._autoSelectSet) : new Set(idsToSelect);
        }

        setTimeout(() => this._autoSelect(this.data.baseLength), 100);
    }

    _autoExpand(to) {
        if (!this._autoExpandSet || this._autoExpandEnd >= to) {
            return;
        }
        const a = [];

        while (this._autoExpandEnd < to) {
            const id = this.data.baseItem(this._autoExpandEnd++)[this.idField];

            if (id && this._autoExpandSet && this._autoExpandSet.has(id)) {
                this._autoExpandSet.delete(id);
                a.push(this._autoExpandEnd - 1);
            }
        }

        if (this._autoExpandSet && this._autoExpandSet.size === 0) {
            this._autoExpandSet = undefined;
        }

        a.forEach(baseIndex => this.data.subTree(this.data.translateBaseIndexToIndex(baseIndex), true));
    }

    _autoSelect(to) {
        if (!this._autoSelectSet || this._autoSelectEnd >= to) {
            return;
        }

        const a = new Map();

        while (this._autoSelectEnd < to) {
            const id = this.data.baseItem(this._autoSelectEnd++)[this.idField];

            if (id && this._autoSelectSet) {
                if (this._autoSelectSet.has(id)) {
                    this._autoSelectSet.delete(id);
                    a.set(this._autoSelectEnd - 1, true);
                } else {
                    a.set(this._autoSelectEnd - 1, false);
                }
            }
        }

        if (this._autoSelectSet && this._autoSelectSet.size === 0) {
            this._autoSelectSet = undefined;
        }

        a.forEach((selected, baseIndex) => this.data.select(baseIndex, selected));
    }

    _disabledResetButton(_sortDeftChg, _filterDeftChg, _selectedDeftChg, _changeResizeCol,
        _changeReorderingCol, _changeColumnsVisibility) {

        return !(_sortDeftChg || _filterDeftChg || _selectedDeftChg || _changeResizeCol ||
                _changeReorderingCol || _changeColumnsVisibility);
    }

    _resetOrder() {
        const defaultColumns = this.__defaultColumns;

        const columnsDef = defaultColumns.map(def => {
            return this.view.columnsDef.find(col => sameColumns(col, def));
        });

        this.view.columnsDef = columnsDef;
    }

    _resetVisibility() {
        const defaultColumns = this.__defaultColumns;

        defaultColumns.forEach(def => {
            const foundCol = this.view.columnsDef.find(col => sameColumns(col, def));

            foundCol.hidden = !!def.hidden;
        });

        this.view.columnsDef = [...this.view.columnsDef];
    }

    resetAction() {
        if (this._sortDeftChg) {
            this.data.applyDefaultSort();
        }

        if (this._filterDeftChg) {
            this.filterString = '';
            this.data.filter = null;
        }

        if (this._selectedDeftChg) {
            this.data.applyDefaultSelected();
        }

        if (this._changeResizeCol) {
            this.$.grid._resetColumnsWidths();
        }

        if (this._changeReorderingCol) {
            this._resetOrder();
        }

        if (this._changeColumnsVisibility) {
            this._resetVisibility();
        }

        this.dispatchEvent(new CustomEvent('reset-to-default', {bubbles: true, composed: true, detail: {}}));
        return;
    }

    getSortExpression() {
        return this.view && this.view.getSortExpression();
    }

    setSortExpression(_sortExpression, opt) {
        console.assert(this.view);
        console.assert(this.data);
        this.view.setSortExpression(_sortExpression, this.data, opt);
    }

    getOrderExpression() {
        return this.view && this.view.getOrderExpression();
    }

    getWidthsExpression() {
        return this.view && this.view.getWidthsExpression();
    }

    getVisibilityExpression() {
        return this.view && this.view.getVisibilityExpression();
    }

    deleteSelectedRows() {
        const selectedIndexes = this.selectedIndexes;
        this.selectedIndexes = [];
        this.data.deleteBaseItems(selectedIndexes);
    }

    _setEditControl(editControl, editControlLabel, editControlIcon, editControlVisibility) {
        if (this.view) {
            this.view.editControl = editControl;
            this.view.editControlValue = editControl === 'link' ? editControlLabel : editControlIcon;
            this.view.editControlVisibility = editControlVisibility;
        }
    }

    //
    // Simplified Data Manager API (control data manager with items array)
    //

    _itemsChanged(items) {
        const _items = Array.isArray(items) ? items : [];
        if (!this.data) {
            const data = new DataManager(_items);
            data.selectMethod = this.selectMethod;
            data.selected = this.selectedIndexes;
            data.selectParentOnly = this.selectParentOnly;
            this.data = data;
            if (this.subItems) {
                this._subItemsChanged(this.subItems);
            }
        } else if (this.data instanceof DataManager) {
            this.data.items = _items;
        }
    }

    _dataChanged(data, old) {
        if (old) {
            old.unobserve(this);
        }
        if (data) {
            data.observe(this);
            this.dmSelectMethod(this.data.selectMethod);
            this.dmSelection(this.data.selected);
            data.traceUpdates(); // Always trace all updates
        }

        if (this._quickFilter) {
            this._quickFilter.data = data;
        }
    }

    //
    // Simplified View Configurator API (DOM based)
    //

    // The data view has changed
    dmView() {
        this._observeMessage(this.data, this.bindDataText, this.noDataToDisplayText, this.noResultsText, this.noMatchesText);
        this._setExpandMode();

        if (this._autoExpandSet && this.data.baseLength > this._autoExpandEnd) {
            requestAnimationFrame(() => this._autoExpand(this.data.baseLength));
        }

        if (this._autoSelectSet && this.data.baseLength > this._autoSelectEnd) {
            requestAnimationFrame(() => this._autoSelect(this.data.baseLength));
        }

        // check sorting differs from default
        if (this._applyGridConfigurationsActive) {
            this._sortDeftChg = true;
        } else if (this.data.sort !== undefined && this.data.sort !== this.data.defaultSort) {
            this._sortDeftChg = true;
        } else {
            this._sortDeftChg = false;
        }

        // check filter differs from default
        this._filterDeftChg = this.data.filter !== null;

        this._saveGridConfigurations();
    }

    // View configuration has changed
    _viewChanged(view, old) {
        if (old) {
            if (old.requestAnimationFrameId) {
                cancelAnimationFrame(old.requestAnimationFrameId);
            }
            old.unobserve(this);
        }

        if (view) {
            view.observe(this);

            // Properties controlled by ptcs-grid
            if (this.edit) {
                this._setEditMode(this.edit, this.isEditable, this.showEditButton, this.showAddRowButton, this.showDeleteRowButton);
            }
            if (this.editControl) {
                this._setEditControl(this.editControl, this.editControlLabel, this.editControlIcon, this.editControlVisibility);
            }
            view.hideTreeToggle = this.alwaysExpanded || undefined;
        }

        if (this._quickFilter) {
            this._quickFilter.view = view;
        }
    }

    // Initialize Simplified API for View Configurator
    _initViewColDef() {
        const coldefName = this.columnDefName || 'ptcs-grid-column-def';
        // Only use simple View Configurator API if view is unassigned and ptcs-grid has ptcs-grid-column-def elements
        if (!this.view && this.querySelector(`${coldefName}, slot, template`)) {
            this.view = this.__viewColDef = new DataViewerAPI(this, this.interpolation, coldefName);
            dataViewerProperties.forEach(propName => {
                if (this[propName] !== undefined) {
                    this.view[propName] = this[propName];
                }
            });
            if (this.selectButton !== undefined) {
                this.view.selectMethod = this.selectButton;
            }
        }
    }

    // Mutations on attributes or descendants (not shadow dom)
    _mutatedDom(mutations) {
        if (this.__viewColDef) {
            if (this.__viewColDef !== this.view) {
                console.warn('ptcs-grid-column-def based view configurator has been replaced by client');
                this.__viewColDef = null; // Replaced by client
            } else {
                this.__viewColDef.mutationEvent(mutations);
            }
        } else if (this.__viewColDef === undefined) {
            this._initViewColDef();
        }
    }

    _setViewProp(propName, propValue) {
        if (this.view && propName in this.view) {
            this.view[propName] = propValue;
        }
    }

    _selectButtonChanged(selectButton) {
        this._setViewProp('selectMethod', selectButton);
    }

    rebuildColumnDefs() {
        if (this.__viewColDef) {
            this.__viewColDef.rebuildColumnDefs();
        }
    }

    //
    // Simplified selection API
    //

    // The client updates the selectMethod
    _selectMethodChanged(selectMethod) {
        if (!selectMethod) {
            this.selectMethod = 'none';
        } else if (this.data) {
            this.data.selectMethod = selectMethod;
        }
    }

    // The data manager updates the selectMethod
    dmSelectMethod(method) {
        this.selectMethod = method;
    }

    _subItemsChanged(subItems) {
        if (!this.data) {
            // TODO: assign this property to data manager when it becomes available
            return;
        }
        if (typeof subItems === 'string') {
            this.data.subItems = item => item[subItems];
            this.data.subItemsState = item => Array.isArray(item[subItems]) ? false : undefined;
        } else {
            console.assert(!subItems, 'grid.subItems should specify a field name');
            this.data.subItems = undefined;
            this.data.subItemsState = undefined;
        }
    }

    // The client updates the selection
    _selectedIndexesChanged(selectedIndexes) {
        if (this.data) {
            this.data.selected = selectedIndexes;

            // Hack to manually get current selection, if data manager rejected selection
            const sel = this.data.selected;
            // eslint-disable-next-line no-nested-ternary
            const selected = Array.isArray(sel) ? sel : (typeof sel === 'number' ? [sel] : []);
            if (!PTCS.sameArray(this.selectedIndexes, selected)) {
                this.dmSelection(selected);
            }
        }
    }

    _cacheRuntimeChangesChanged(cacheRuntimeChanges) {
        if (cacheRuntimeChanges) {
            if (this.gridId) {
                if (this.view && this.data) {
                    this._saveGridConfigurations();
                }
            } else {
                console.warn('cacheRuntimeChanges has no effect unless grid doesn\'t have a gridId');
            }
        } else {
            this._clearGridConfigurations();
        }
    }

    // An item has changed
    dmItem() {
        this._updateInvalid();
    }

    // Items has been added to the view (possible by insertion)
    dmInserted(ranges) {
        this._updateInvalid();
        this._setExpandMode();
        this._saveGridConfigurations();

        if (this._autoExpandSet || this._autoSelectSet) {
            requestAnimationFrame(() => {
                const sortedRanges = [...ranges].sort((a, b) => a[0] - b[0]);

                if (this._autoExpandSet) {
                    sortedRanges.forEach(range => this._autoExpand(this.data.baseIndex(range[0]) + range[1]));
                }

                if (this._autoSelectSet) {
                    sortedRanges.forEach(range => this._autoSelect(this.data.baseIndex(range[0]) + range[1]));
                }
            });
        }
    }

    // Items has been removed from the view (possible by deletion)
    dmRemoved() {
        this._updateInvalid();
        this._setExpandMode();
        this._saveGridConfigurations();
    }

    // The data manager updates the selection
    dmSelection(selection) {
        if (this.selectedIndexes === selection) {
            // Update was written to the existing array
            this.dispatchEvent(new CustomEvent('selected-indexes-changed', {bubbles: false, composed: false, detail: {value: selection}}));
        } else {
            // eslint-disable-next-line no-nested-ternary
            this.selectedIndexes = Array.isArray(selection) ? selection : (typeof selection === 'number' ? [selection] : []);
        }

        // In tree grid mode, at most one row may be selected since this will be the parent of the new item
        this.__enableAddRowButton();

        this._disableToolbarAction('delete-rows', !this.selectedIndexes || this.selectedIndexes.length === 0);

        // check selected differs from default
        const _selection = selection ? JSON.stringify(selection) : null;
        const _defaultSelected = this.data.defaultSelected && this.data.defaultSelected.length ? JSON.stringify(this.data.defaultSelected) : null;
        this._selectedDeftChg = _selection !== _defaultSelected;
    }

    // Select item index
    selectIndex(index, select) {
        if (this.data) {
            this.data.select(index, select);
        }
    }

    // Select row index (row index depends on filtering, sorting, etc...)
    selectRowIndex(row, select) {
        if (this.data) {
            this.data.select(this.data.baseIndex(row), select);
        }
    }

    // Returns true if item is selected
    isIndexSelected(index) {
        return this.data && this.data.isSelectedBaseIndex(index);
    }

    // Returns true if row is selected
    isRowSelected(row) {
        return this.data && this.data.isSelected(row);
    }

    // Add the indefinite progress bar (data loading indicator) on-demand, show when dataLoading is true, hide when false
    _dataLoadingChanged(dataLoading) {
        if (dataLoading && !this.shadowRoot.querySelector('ptcs-data-load-bar')) {
            // eslint-disable-next-line max-len
            const progressBar = createSubComponent(this, '<ptcs-data-load-bar size="[[loadingIndicatorSize]]" image="[[loadingIndicatorImage]]" show-bar="[[dataLoading]]" delay="[[loadingIndicatorDelay]]">');
            this.shadowRoot.appendChild(progressBar);
        }
    }

    // Displays an icon + message in message area when there are no rows in grid
    _observeMessage(data, bindDataText, noDataToDisplayText, noResultsText, noMatchesText) {
        clearTimeout(this._messageTimeout);
        this._messageTimeout = setTimeout(() => {
            if (data) {
                if (data.length === 0) {
                    // Grid has no visible rows. Have they been filtered out or is the data empty?
                    this._messageText = data.baseLength > 0 ? noMatchesText : noResultsText;
                    this._messageIcon = 'cds:icon_not_visible';
                } // else - no message is shown
            } else if (this.isIDE) {
                // Prompt for builder to bind data
                this._messageText = bindDataText;
                this._messageIcon = 'cds:icon-bind';
            } else {
                // No data to display message
                this._messageText = noDataToDisplayText;
                this._messageIcon = 'cds:icon_not_visible';
            }
        }, 300);
    }

    getExternalComponentId() {
        return this._externalComponentId;
    }

    setExternalComponentId(id) {
        if (id) {
            this._externalComponentId = id;
        } else if (!this._externalComponentId) {
            this._externalComponentId = 'ptcs-grid-' + performance.now().toString().replace('.', '');
        }
        this.$.grid.externalComponentId = this._externalComponentId;
    }

    // Rollback changes
    rollbackUpdates() {
        if (this.data) {
            this.data.rollbackUpdates();
        }
    }

    // Commit saved changes
    commitUpdates() {
        if (this.data) {
            this.data.commitUpdates();
        }
    }

    // Action when user clicks Save button
    saveAction() {
        if (this.isEditable) {
            this.isEditable = false;
            this.commitUpdates();
            this.dispatchEvent(new CustomEvent('edit-completed'));
        }
    }

    // Action when user clicks Cancel button
    cancelAction() {
        if (this.isEditable) {
            this.isEditable = false;
            this.rollbackUpdates();
            this.dispatchEvent(new CustomEvent('edit-cancelled'));
        }
    }

    _setMaxExpandedRows(maxExpandedRows, data) {
        if (data) {
            data.maxExpandedRows = maxExpandedRows;
        }
    }

    openMaxExpandedRowsDialog() {
        const dlgEl = this.$.dlg;
        dlgEl.titleText = this.maxRowsMessageTitle;
        dlgEl.messageText = this.maxRowsMessage;
        dlgEl.open();
    }
};

customElements.define(PTCS.Grid.is, PTCS.Grid);
