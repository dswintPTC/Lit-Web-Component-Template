import {PolymerElement, html} from '@polymer/polymer/polymer-element.js';
import {PTCS} from 'ptcs-library/library.js';
import 'ptcs-behavior-styleable/ptcs-behavior-styleable.js';
import {delegateToPrev} from 'ptcs-behavior-focus/ptcs-behavior-focus.js';
import {setTooltipByFocus} from 'ptcs-behavior-tooltip/ptcs-behavior-tooltip.js';
import 'ptcs-v-scroller/ptcs-v-scroller2.js';
import 'ptcs-label/ptcs-label.js';
import 'ptcs-div/ptcs-div.js';
import './ptcs-edit-grid-cells.js';
import {uiText} from './grid-view/gv-text.js';
import {replaceOperationTokens, replaceLocalizationTokens} from 'ptcs-library/library-grid.js';


/* eslint-disable no-confusing-arrow */

// Default minimum column width as specified by UX (for fr units). Same value for all themes
const defaultColMinW = '75px';

// Specified baseIndex when adding a new row
const newRowBaseIndex = -1;

// For silently adding validation information to cell elements
const validationField = Symbol('validation');

// validationErrorIcon should default to cds:icon_error
const defaultErrorIcon = 'cds:icon_error';

// Decode navigation mode
const Nav = {grid: 0, rowFirst: 1, cellFirst: 2, cellOnly: 3};

const _navigate = {
    false: {},
    true:  {
        'row-first':  Nav.rowFirst,
        'cell-first': Nav.cellFirst,
        'cell-only':  Nav.cellOnly
    }
};

const _navigateDflt = {false: Nav.cellOnly, true: Nav.rowFirst};

const nav = (treeMode, navMode) => {
    return _navigate[treeMode][navMode] || _navigateDflt[treeMode];
};

// Clone cell of selection element and turn off keyboard navigation on the clone
function cloneSelectionCell(el) {
    if (!el) {
        return el;
    }
    const cell = el.closest('.cell').cloneNode(true);
    [...cell.querySelectorAll('ptcs-checkbox')].forEach(e => {
        e.noTabindex = true;
    });
    return cell;
}

// Decode '3px' to [3, 'px']
const decode = w => {
    if (!w) {
        return undefined;
    }
    const m = /^(\d*(\.\d*)?)([\w%]*)$/.exec(w);
    return m && [+m[1], m[3] || 'px'];
};

PTCS.CoreGrid = class extends PTCS.BehaviorTooltip(PTCS.BehaviorFocus(PTCS.BehaviorStyleable(PTCS.ThemableMixin(PolymerElement)))) {
    static get template() {
        /* eslint-disable max-len */
        return html`
        <style>
        :host {
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            flex-wrap: nowrap;
            justify-content: space-between;
            align-items: stretch;

            position: relative;

            /* If the container doesn't limit the height, then negotiate height with scroller */
            height: var(--ptcs-core-grid-height, var(--ptcs-core-grid-max-height, 750px));

            --ptcs-tooltip-start-delay: 100;

            /* Don't show horizontal scroller when the resizer comes out of the grid */
            overflow:hidden;
        }

        #chunker {
            flex: 1 1 auto;
            box-sizing: border-box;
        }

        .row {
            display: grid;
            grid-template-columns: var(--ptcs-grid-columns);
            box-sizing: border-box;
            top: 0;
            transition: top 250ms;
        }

        .row .cell {
            overflow: hidden;
        }

        .row[is-dragged] {
            opacity: 0.3;
        }

        .row[bump] {
            top: var(--ptcs-row-bump, 34px);
        }

        .row[is-clone] {
            background: #ffffff;
            border-left: none !important;
            border-right: none !important;
            border-top: solid 1px gray !important;
            border-bottom: solid 1px gray !important;
        }

        .row[cannot-drop] {
            background: rgba(255, 204, 204, 0.5);
        }

        [part=header] {
            flex: 0 0 auto;
            overflow: hidden;
            box-sizing: border-box;
            max-width: 100%;
        }

        [part=header][hidden] {
            display: none !important;
        }

        .cell {
            display: flex;
            box-sizing: border-box;
        }

        .cell[halign=left],
        .cell[header-halign=left] div {
            justify-content: flex-start;
        }

        .cell[halign=center],
        .cell[header-halign=center] div {
            justify-content: center;
        }

        .cell[halign=right],
        .cell[header-halign=right] div {
            justify-content: flex-end;
        }

        .cell[valign=top],
        .cell[header-valign=top] {
            align-items: flex-start;
        }

        .cell[valign=center],
        .cell[header-valign=center] {
            align-items: center;
        }

        .cell[valign=bottom],
        .cell[header-valign=bottom] {
            align-items: flex-end;
        }

        .cell[invalid] {
            justify-content: space-between !important;
        }

        ptcs-v-scroller2 {
            outline: none; /* No focus indication */
        }

        .reorder-indicator {
            display: none;
            position: absolute;
            top: 0;
            height: 100%;
            z-index: 10;
        }

        /* Resizer Base Styling */
        .resizer {
            display: none;
            position: absolute;
            height: 100%;
        }

        .resizer-handle {
            position: relative;
            top: 0;
            height: 100%;
        }

        #resizer {
            /* Hover Resizer should be on top of the grid and the second Focus Resizer */
            z-index: 100;
        }

        #resizer-handle {
            /* Resizer Handle should be on top of the first Hover Resizer */
            z-index: 200;
        }

        #resizer-focus {
            z-index: 10;
            display: none;
        }

        #resizer-focus[selected] {
            display: block;
        }

        :host(:focus-within) #resizer-focus[focused] {
            display: block;
        }

        #resizer-focus-handle {
            z-index: 20;
        }

        #resizer-focus-handle:focus {
            outline: var(--ptcs-focus-overlay--border-style, solid) var(--ptcs-focus-overlay--border-width, 2px) var(--ptcs-focus-overlay--border-color, #0094c8);
            outline-offset: calc(-1 * var(--ptcs-focus-overlay--border-width, 2px));
        }

        :host([hide-focus]) #resizer-focus-handle:focus {
            outline: none;
        }

        /* Only show a single edit control in a cell */
        ptcs-icon[part=invalid-icon] + [part=edit-control] {
            display: none;
        }

        [part=edit-control] {
            align-self: center;
        }

        ptcs-icon[part=edit-control] {
            cursor: pointer;
        }

        /* Dont show edit control in hover mode, unless cell is hovered or has focus */
        ptcs-v-scroller2[edit-visibility=cell] [part=body-cell]:not(:hover):not([focus]) [part=edit-control] {
            opacity: 0;
        }
        ptcs-v-scroller2[edit-visibility=row] .row:not(:hover):not([focus]) [part=edit-control] {
            opacity: 0;
        }

        [part=edit-control]:focus-within {
            opacity: 1 !important;
        }

        /* Internal actions that does not implement the focus behavior. Needs explicit styling */
        [style-focus]:focus-within {
            outline: var(--ptcs-focus-overlay--border-style, solid) var(--ptcs-focus-overlay--border-width, 2px) var(--ptcs-focus-overlay--border-color, #0094c8);
            border-radius: var(--ptcs-focus-overlay--border-radius, 2px);
            outline-offset: calc(-1 * var(--ptcs-focus-overlay--border-width, 2px));
        }

        :host([hide-focus]) [style-focus]:focus-within {
            outline: none;
        }

        :host([modal]) [part=header] {
            pointer-events: none;
        }

        :host([modal]) ptcs-v-scroller2 {
            pointer-events: none;
        }

        :host(:not([show-footer])) #footer {
            display: none;
        }

        :host(:not([show-header-row-in-footer])) #footer-header {
            display: none;
        }

        .footer {
            overflow: hidden;
        }

        .footer-row {
            min-height: 34px;
        }

        .footer-cell {
            min-height: 34px;
            display: flex;
        }

        [part=tree-toggle-icon][disabled] {
            cursor: default !important;
        }

        @keyframes spinner {
            from {transform: rotate(0deg);}
            to {transform: rotate(360deg);}
        }

        [part=tree-toggle-icon][loading] {
            animation-name: spinner;
            animation-duration: 750ms;
            animation-timing-function: linear;
            animation-iteration-count: infinite;
        }

        [part=drag-icon]:not([disabled]) {
            cursor: grab;
        }

        [part=drag-icon][disabled] {
            color: silver;
        }

        [part=drag-icon]:not([disabled]):active {
            cursor: grabbing;
        }

        [part=drag-icon]:focus {
            outline-color: #0094c8;
        }

        [part=drop-target] {
            position: absolute;
            width: calc(100% - 16px);
            height: var(--ptcs-row-bump, 34px);
            margin: 8px;
            border: dashed 1px green;
            background: transparent;
        }

        [part=change-badge] {
            visibility: hidden;
            flex: 0 0 auto;
            order: -1;
        }

        .new-row [part=change-badge] {
            visibility: visible;
        }

        </style>

        <div id="resizer" class="resizer" part=resizer>
            <div id="resizer-handle" class="resizer-handle" part=resizer-handle></div>
        </div>
        <div id="resizer-focus" class="resizer" part=resizer>
            <div id="resizer-focus-handle" class="resizer-handle" part=resizer-handle></div>
        </div>
        <div id="reorder-indicator" class="reorder-indicator" part=reorder-indicator></div>
        <div id="header" class="row" part="header" on-dragstart="_onheaderdragstart" hidden\$="[[hideHeader]]"></div>
        <ptcs-v-scroller2 id="chunker" part="body" gap="{{_gap}}"
            on-mousemove="_mouseOverGrid" on-mouseleave="_mouseLeaveGrid"
            on-mousedown="_mouseDownOnGrid" on-mouseup="_mouseUpOnGrid"
            on-edit-activated="_editActivated" edit-visibility\$="[[_editVisibility(editControlVisibility, _editCells)]]"
            ></ptcs-v-scroller2>
        <div id="footer" part="footer" class="footer">
            <div id="footer-header" class="row footer-row"></div>
            <div class="footer-rows" id="footer-rows"></div>
        </div><div id="empty-message" class="row"><slot></slot></div>`;
        /* eslint-enable max-len */
    }

    static get is() {
        return 'ptcs-core-grid';
    }

    static get properties() {
        return {
            disabled: {
                type:               Boolean,
                reflectToAttribute: true,
                observer:           '_disabledChanged'
            },

            disableRow: {
                type: Object // property name or (item, baseIndex, dataManager) => disabled
            },

            disableChildRows: { // Only used in tree grid mode
                type: Boolean
            },

            _disableRow: {
                type:     Function,
                computed: '_computeDisableRow(disabled, disableRow, disableChildRows)',
                observer: '_disableRowChanged'
            },

            // Hide header
            hideHeader: {
                type:               Boolean,
                reflectToAttribute: true
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

            // Data Manager
            data: {
                type:     Object,
                observer: '_dataChanged'
            },

            // Is there a grid gap?
            _gap: {
                type:     Number,
                observer: '_gapChanged'
            },

            // Is any column a tree toggle?
            _treeToggle: {
                type: Boolean
            },

            highlightNewRows: {
                type:     Boolean,
                observer: '_highlightNewRowsChanged'
            },

            // How client specifies if columns should be resizable
            resizeColumns: {
                type: Boolean // true: resize columns, false: don't resize columns, undefined: only resize tree toggle
            },

            // If the component (internally) supports resizable columns (tree toggle columns should be resizable by default)
            _resizeColumns: {
                type:     Boolean,
                computed: '_computeResizeColumns(resizeColumns, _treeToggle)',
                observer: '_resizeColumnsChanged'
            },

            reorderColumns: {
                type:     Boolean,
                value:    false,
                observer: '_reorderColumnsChanged'
            },

            // Title for row editor, when editing a row
            rowEditFormTitle: {
                type: String
            },

            // Title for row editor, when adding a new row
            rowEditFormAddTitle: {
                type: String
            },

            // Label for "Update" button in row editor, when editing a row
            updateButtonText: {
                type: String
            },

            // Label for "Add" button in row editor, when adding a new row (different label for Update button)
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

            // Hide validation error message (for edit components in inline editor)
            hideValidationError: {
                type: Boolean
            },

            // Hide validation criteria message (for edit components in inline editor)
            hideValidationCriteria: {
                type: Boolean
            },

            // Hide validation success message (edit components in inline editor)
            hideValidationSuccess: {
                type: Boolean
            },

            // Icon for validation error (edit components in inline editor AND in grid cells)
            validationErrorIcon: {
                type:     String,
                observer: '_validationErrorIconChanged'
            },

            // Icon for validation success (edit components in inline editor)
            validationSuccessIcon: {
                type: String
            },

            // Icon for validation criteria (edit components in inline editor)
            validationCriteriaIcon: {
                type: String
            },

            // Visibility of edit control when it occurs in cells: 'hover', 'always', 'never'
            editControlVisibility: {
                type:     String,
                observer: '_editControlVisibilityChanged'
            },

            // Is each cells editable, or only the whole row at once?
            _editCells: {
                type: Boolean
            },

            // Scroll to selected item when the grid view is resized?
            autoScroll: {
                type: Boolean
            },

            navigation: {
                type: String // row-first (default), cell-first, cell-only
            },

            // Do we allow to move to the previous/next row when pressing left/right arrow key from the
            // first/last item on a row?
            preventFocusRowWrap: {
                type: Boolean
            },

            // In single select mode, should the focused row be selected?
            selectFollowsFocus: {
                type: Boolean
            },

            // Recycled rows
            _recycled: {
                type:  Map,
                value: () => new Map()
            },

            // The row with focus
            _focusedRow: {
                type:     Element,
                observer: '_focusedRowChanged'
            },

            // The cell with focus, in _focusedRow
            _focusedCell: {
                type:     Element,
                observer: '_focusedCellChanged'
            },

            // The action with focus, in _focusedCell, or this._resizerFocusHandle if the focus is on the column resizer
            _focusedAction: {
                type:     Element,
                observer: '_focusedActionChanged'
            },

            _resizedCell: {
                type:     Element,
                observer: '_resizedCellChanged'
            },

            // Dest index for dragged column
            _draggedDestIndex: {
                type: Number
            },

            _resizedFocusedCell: {
                type:     Element,
                observer: '_resizedFocusedCellChanged'
            },

            __defaultColumns: Array,

            // Array of column widths: {minWidth, width, maxWidth}
            _colWidths: {
                type:  Array,
                value: () => []
            },

            _resizedColWidths: {
                type:  Array,
                value: () => []
            },

            __resizerHitArea: {
                value: 17
            },

            _changeResizeCol: Boolean,

            footerData: {
                type:     Array,
                value:    () => [],
                observer: '_rebuildFooter'
            },

            showFooter: {
                type:               Boolean,
                value:              false,
                reflectToAttribute: true
            },

            showHeaderRowInFooter: {
                type:               Boolean,
                value:              false,
                reflectToAttribute: true
            },

            // Do the slotted content contain a message for when the grid is empty?
            slottedMessage: {
                type:     Boolean,
                observer: '_slottedMessageChanged'
            },

            _messageEl: Element
        };
    }

    constructor() {
        super();

        this.__setResizerHeight = (cellR, resizer) => {
            const chunkerR = this.$.chunker.getBoundingClientRect();

            if (!this.data || this.data.length === 0) {
                // No real data in the grid, but the chunker might contain an "empty message"
                resizer.style.height = `${cellR.height}px`;
            } else if (this.$.chunker._itemsH < chunkerR.height) {
                // If there are less items than the chunker height then limit the height of the resizer
                resizer.style.height = `${cellR.height + this.$.chunker._itemsH}px`;
            } else {
                resizer.style.height = '';
            }
        };

        this._getResizedCell = (ev) => {
            let cell = this._getGridCell(ev);

            if (!cell) {
                return;
            }

            const cellR = cell.getBoundingClientRect();
            const left = cellR.left;
            const posX = PTCS.getCoordinatesFromEvent(ev).posX;

            if (posX >= cellR.right - this.__resizerHitArea && posX <= cellR.right && this._isResizable(cell)) {
                this.$.resizer.setAttribute('hovered', '');
                this.style.cursor = 'ew-resize';

                this._resizedCell = cell;
            } else if (posX >= left && posX <= left + this.__resizerHitArea && this._isResizable(cell.previousSibling)) {
                this.$.resizer.setAttribute('hovered', '');
                this.style.cursor = 'ew-resize';

                this._resizedCell = cell.previousSibling;
            } else {
                this.$.resizer.removeAttribute('hovered');
                this.style.cursor = '';

                this._resizedCell = null;
            }
        };

        this.__mouseOverHeader = (ev) => {
            if (this.__dragging || this.__resizing) {
                return;
            }

            this._getResizedCell(ev);
        };

        this.__checkIfMouseLeftResizedCell = (ev) => {
            if (!this.__resizing && this._resizedCell) {
                const cellR = this._resizedCell.getBoundingClientRect();

                if ((ev.targetTouches && ev.targetTouches.length === 0) || // We came from "touchend" event
                    !(ev.clientY <= cellR.bottom && ev.clientY >= cellR.top && ev.clientX <= cellR.right + this.__resizerHitArea)) {
                    this._resizedCell = null;
                    this.$.resizer.removeAttribute('selected');
                    this.$.resizer.removeAttribute('hovered');
                }
            }
        };

        this.__resize = e => {
            const posX = PTCS.getCoordinatesFromEvent(e).posX;
            const rR = this._resizedCell.getBoundingClientRect();
            let cNewWidth = posX - rR.left;
            this.__setCellWidthWithConstraints(this._resizedCell, cNewWidth);
            this.__setResizerHeight(rR, this.$.resizer);
            this._updateResizerPositions();
        };

        this.__stopResize = (ev) => {
            if (PTCS.wrongMouseButton(ev)) {
                return;
            }
            window.removeEventListener('mousemove', this.__resize);
            window.removeEventListener('mouseup', this.__stopResize);
            window.removeEventListener('touchmove', this.__resize);
            window.removeEventListener('touchend', this.__stopResize);

            this.__resizing = false;

            const rRight = this._resizedCell.getBoundingClientRect().right;
            const hRight = this.$.header.getBoundingClientRect().right;

            // Check if we need to scroll to the new location
            if (rRight > hRight) {
                this.$.chunker.elScroll.scrollLeft = this.$.chunker.elScroll.scrollLeft + rRight - hRight;
            }

            this._updateWidthsInView();

            this.dispatchEvent(new CustomEvent('columns-resized', {
                bubbles:  true,
                composed: true
            }));

            this._changeResizeCol = true;

            requestAnimationFrame(() => {
                const resizedCell = this._resizedCell;

                this.__checkIfMouseLeftResizedCell(ev);

                // TODO: The management of the grid resizers needs to be refactored.
                //       There are far too many explicit assignments of DOM properties (like this) spread out over the code.
                // Set keyboard focus on the resizer
                this.focus();
                this._resizedFocusedCellChanged(this._resizedFocusedCell);
                this._setFocusResizer(resizedCell);

                this.$['resizer-focus'].style.removeProperty('display');
            });
        };

        this.__resizeMouseUp = (ev) => {
            if (PTCS.wrongMouseButton(ev)) {
                return;
            }
            this.$.resizer.removeAttribute('selected');
        };

        this._newRows = new WeakSet();
    }

    ready() {
        super.ready();

        this._resizerFocusHandle = this.$['resizer-focus-handle'];

        this.$.chunker.recycleItemElement = this._recycleGridRow.bind(this);
        this.$.chunker.createItemElement = this._createGridRow.bind(this);

        this.$.chunker.addEventListener('resized-width', ev => {
            this.style.setProperty('--vssbw', `${ev.detail.sbWidth}px`);
            this.$.header.style.width = `${ev.detail.width}px`;
            this.$.footer.style.width = `${ev.detail.width}px`;
            this._updateResizerPositions();
        });

        this.$.chunker.addEventListener('scroll-left-changed', ev => {
            this.$.header.scrollLeft = ev.detail.value;
            this.$.footer.scrollLeft = ev.detail.value;
            this._updateResizerPositions();
        });

        if (this.editControlVisibility === undefined) {
            this.editControlVisibility = 'hover';
        }

        // Select rows
        this.$.chunker.addEventListener('click', ev => this._clickOnGrid(ev));

        this.addEventListener('keydown', this._keyDown.bind(this));
        this.addEventListener('keyup', this._keyUp.bind(this));

        this.shadowRoot.addEventListener('mousedown', ev => this._mouseDown(ev));
        this.shadowRoot.addEventListener('touchstart', ev => this._mouseDown(ev, true));

        this.shadowRoot.addEventListener('mousemove', this._mouseTooltip.bind(this));
        this.$.chunker.addEventListener('focused-item-updated', this._chunkerFocusRowChanged.bind(this));

        this.$.header.addEventListener('mousedown', this._onDragStart.bind(this));
        this.$.header.addEventListener('touchstart', this._onDragStart.bind(this));

        this.__resizeCall = true;

        // Plug out the "empty message" element
        this._messageEl = this.$['empty-message'];
        this._messageEl.remove();

        // If no data manager is attached within 500ms, show an "empty message"
        if (!this.data) {
            setTimeout(() => !this.data && this._setDataLength(0), 500);
        }

        if (this.disableRow === undefined) {
            this.disableRow = null; // Force computation of _disableRow
        }
    }

    disconnectedCallback() {
        this._editDone({}, false); // Just in case the inline editor is still open
        super.disconnectedCallback();
    }

    _editVisibility(editControlVisibility, _editCells) {
        if (editControlVisibility !== 'hover') {
            return null;
        }
        return _editCells ? 'cell' : 'row';
    }

    _isResizable(cell) {
        if (!cell) {
            return false;
        }
        if (this.resizeColumns) {
            return !cell.hasAttribute('non-resizable');
        }
        // Tree toggle columns are resizable unless the client explicitly says they should not be
        return this.resizeColumns !== false && cell.hasAttribute('tree-toggle');
    }

    _rebuildFooter() {
        cancelAnimationFrame(this.__rebuildFooterAnimationFrame);

        this.__rebuildFooterAnimationFrame = requestAnimationFrame(() => {
            this.__rebuildFooter();
        });
    }

    __rebuildFooter() {
        this.$['footer-rows'].innerHTML = '';
        this.$['footer-header'].innerHTML = '';

        if (!this.view || !this.view.columns || !this.data || this.data.length === 0) {
            return;
        }

        let cellF = uiText({});

        const columns = this.view.columns;
        const maxHeightHeader = this.view.maxHeightHeader;

        // Create footer header
        columns.forEach(def => {
            if (def.hidden) {
                return;
            }

            const cell = document.createElement('div');
            cell.setAttribute('part', 'footer-cell');
            cell.classList.add('cell');

            if (def.name) {
                if (def.headerHAlign) {
                    cell.setAttribute('header-halign', def.headerHAlign);
                }
                if (def.headerVAlign) {
                    cell.setAttribute('header-valign', def.headerVAlign);
                }
                if (maxHeightHeader > 0) {
                    cell.style.maxHeight = maxHeightHeader + 'px';
                    cell.style.overflow = 'hidden';
                }

                if (typeof def.label === 'function') {
                    cell.appendChild(def.label(this.data, this.view, cell, {noActions: true}));
                }
            }

            this.$['footer-header'].appendChild(cell);
        });

        this.footerData.forEach(item => {
            const row = document.createElement('div');
            row.classList.add('footer-row');
            row.classList.add('row');

            let hiddenCount = 0;

            let cell;

            columns.forEach((def, i) => {
                if (!def.name) {
                    // I skip columns without a name. This way I also skip "functional" columns like selection or show row numbers.
                    return;
                }

                const key = def.name;

                if (def.hidden) {
                    hiddenCount++;
                }

                if (item.hasOwnProperty(key) && item[key] !== '#cspan' && !def.hidden) {
                    cell = document.createElement('div');
                    cell.setAttribute('part', 'footer-cell');
                    cell.classList.add('footer-cell');
                    cell.classList.add('cell');

                    cell.style['grid-column-start'] = i + 1 - hiddenCount;

                    let cellContent = item[key];
                    let align = 'left';
                    cellContent = cellContent.replace(/,\s*text-align:\s*(.*);/, (match, p1) => {
                        align = p1;
                        return '';
                    });

                    cellContent = replaceLocalizationTokens(cellContent, def);
                    cellContent = replaceOperationTokens(cellContent, def, this.data);

                    cell.appendChild(cellF.create(cell));
                    // eslint-disable-next-line no-nested-ternary
                    cell.style['justify-content'] = align === 'right' ? 'flex-end' : (align === 'center' ? 'center' : 'flex-start');

                    cellF.assign(cell.firstChild, cellContent);

                    row.appendChild(cell);

                    if (cell.previousSibling) {
                        cell.previousSibling.style['grid-column-end'] = i + 1 - hiddenCount;
                    }
                }
            });

            if (cell) {
                cell.style['grid-column-end'] = columns.length + 1 - hiddenCount;
            }

            this.$['footer-rows'].appendChild(row);
        });
    }

    _resetColumnsWidths() {
        const columnsDef = [...this.view.columnsDef];

        columnsDef.forEach(col => {
            const defCol = this.__defaultColumns.find(def => col.name === def.name || col.label === def.label);

            if (defCol) {
                col.width = defCol.width;
            }
        });

        this.view.columnsDef = columnsDef;

        this._changeResizeCol = false;
    }

    adjustView() {
        if (this._changeResizeCol) {
            this._resetColumnsWidths();
        } else {
            requestAnimationFrame(() => this._adjustMinMaxColumnWidths());
        }

        this._autoScroll();
        this._adjustEditorPlace();
    }

    // Load the focusable action elements in the cell
    _cellActions(cell) {
        // Find visible grid actions
        const r = [...cell.querySelectorAll('[grid-action]')].filter(el => el.offsetParent !== null);
        return r.length > 0 && r;
    }

    // Return default cell action (single action that will not interfere with keyboard navigation)
    _defaultCellAction(cellActions) {
        if (cellActions && cellActions.length === 1) {
            const ga = cellActions[0].getAttribute('grid-action');
            if (ga === '' || ga.split(' ').every(mode => mode !== 'updown' && mode !== 'tab')) {
                return cellActions[0];
            }
        }
        return null;
    }

    // Track focused row
    _focusedRowChanged(_focusedRow, old) {
        if (old) {
            old.removeAttribute('focus');
        }
        if (_focusedRow) {
            this._focusedRow.setAttribute('focus', '');

            // Select follows Focus?
            if (this.selectFollowsFocus && this.data.selectMethod === 'single' && _focusedRow.index >= 0) {
                this.data.select(this.data.baseIndex(_focusedRow.index), true);
            }
        }
    }

    // Track focused cell
    _focusedCellChanged(_focusedCell, old) {
        if (old) {
            old.removeAttribute('focus');
        }
        if (_focusedCell) {
            // Track focus on cell level
            _focusedCell.setAttribute('focus', '');

            // Scroll cell into view
            const bb0 = this.$.chunker.elScroll.getBoundingClientRect();
            const bb = _focusedCell.getBoundingClientRect();

            if (bb.left < bb0.left) {
                this.$.chunker.elScroll.scrollLeft += bb.left - bb0.left - 16;
            } else if (bb.right > bb0.right) {
                this.$.chunker.elScroll.scrollLeft += bb.right - bb0.right + 16;
            }
        }
    }

    // Move focus between grid and sub-action
    _focusedActionChanged(_focusedAction, old) {
        if (old === this._resizerFocusHandle) {
            this.$['resizer-focus'].removeAttribute('selected');
            this.$['resizer-focus'].removeAttribute('focused');
            this._resizedFocusedCell = null;
        }
        if (_focusedAction) {
            _focusedAction.noTabindex = false;
            _focusedAction.setAttribute('tabindex', '-1');

            if (_focusedAction === this._resizerFocusHandle) {
                this._updateResizerPositions();
                this.$['resizer-focus'].setAttribute('focused', '');
            }

            requestAnimationFrame(() => {
                // Refocus on action - if it still has focus
                if (this._focusedAction === _focusedAction && PTCS.hasFocus(this) && this.shadowRoot.activeElement !== _focusedAction) {
                    _focusedAction.focus();
                    setTooltipByFocus(_focusedAction);
                }
            });
        } else if (this.shadowRoot.activeElement) {
            // Move focus from action element to grid
            this.focus();
            this._trackMyFocus(); // Need to bump focus behavior (since it won't get a focus event)
            setTooltipByFocus(this);
        }
    }


    // Set focus on row / cell / action
    _setFocus(row, cell, actionCandidate) {
        console.assert(!row || ['row', 'header'].indexOf(row.getAttribute('part') >= 0), row);
        console.assert(!cell || (cell.parentNode === row && cell.classList.contains('cell')), cell);

        if (!row) {
            this._resetFocus();
            return;
        }

        // Are there any action elements in the cell?
        const cellActions = actionCandidate && cell && this._cellActions(cell);

        // Focus on internal cell action?
        let el;
        if (cellActions) {
            if (actionCandidate instanceof Element) {
                el = cellActions.find(e => e === actionCandidate || e.contains(actionCandidate));
            }
            if (!el) {
                // actionCandidate failed: do the cell contain a single element that can be navigated with the arrow keys?
                el = this._defaultCellAction(cellActions);
            }
        }

        this.setProperties({_focusedRow: row, _focusedCell: cell, _focusedAction: el});
    }

    // Set focus on this._resizerFocusHandle
    _setFocusResizer(resizedCell) {
        this._focusedRow = this.$.header;
        this._focusedCell = this.$['resizer-handle'];
        if (this._focusedAction === this._resizerFocusHandle) {
            this._focusedAction = undefined; // Need a change event, because position may have changed
        }
        this._focusedAction = this._resizerFocusHandle;
        this._resizedFocusedCell = resizedCell;
    }

    // Reset focus, but remember selected column - if applicable
    _resetFocus() {
        if (this._focusedCell) {
            this._focusChildNo = PTCS.getChildIndex(this._focusedCell);
        }

        // Reset focus
        this._focusedRow = undefined;
        this._focusedCell = undefined;
        this._focusedAction = undefined;
    }

    _getChunkerFocusRow() {
        // The "empty message" item should never get focus
        return this.data && this.data.length && this.$.chunker.getFocusRow();
    }

    _chunkerFocusRowChanged() {
        if (this._focusedCell) {
            const focusRow = this._getChunkerFocusRow();
            if (!focusRow || !focusRow.contains(this._focusedCell)) {
                this._resetFocus();
            }
        }
    }

    _getFocus() {
        // Is the focus on the column resizer?
        if (this._focusedAction === this._resizerFocusHandle) {
            return this._focusedAction;
        }

        // Is focus in the header?
        if (this._focusedRow === this.$.header) {
            return this._focusedAction || this._focusedCell || this._focusedRow;
        }

        const focusRow = this._getChunkerFocusRow();
        if (focusRow !== this._focusedRow) {
            const cell = focusRow && (focusRow.children[this._focusChildNo] || focusRow.firstChild);
            switch (this._navigation) {
                case Nav.cellFirst:
                case Nav.cellOnly:
                    this._setFocus(focusRow, cell, true);
                    break;

                case Nav.rowFirst:
                    this._setFocus(focusRow);
                    break;
            }
        }

        return this._focusedAction || this._focusedCell || this._focusedRow;
    }

    _scrollFocusedRowIntoView() {
        if (this.data && this.data.length) {
            // Scroll focused row into sight
            const fi = this.$.chunker.focusedItemIndex;
            if (!(fi >= 0)) {
                this.$.chunker.setFocusRowIndex(0); // No row had focus. Assign focus to first row
            } else {
                this.$.chunker.scrollTo(fi);
            }
        }
    }

    _notifyFocus() {
        // Delegate focus to focusable sub-part
        if (!this._getFocus()) {

            // No element has focus. Try to focus / refocus on row
            this._scrollFocusedRowIntoView();

            if (!this._getFocus()) {
                // Unable to focus on a grid row. Try to focus on something in the header
                for (let focus = this.$.header.firstElementChild; focus; focus = focus.nextSibling) {
                    // Focus on header cell if it has actions
                    const cellActions = this._cellActions(focus);
                    if (cellActions) {
                        this._setFocus(this.$.header, focus, this._defaultCellAction(cellActions));
                        return;
                    }

                    // Focus on header resizer if resizing is enabled
                    if (this._isResizable(focus)) {
                        this._setFocusResizer(focus);
                        return;
                    }
                }
            }
        }
        // Make sure the focus action, if any, actually has the focus
        if (this._focusedAction && this.shadowRoot.activeElement !== this._focusedAction) {
            this._focusedAction.focus();
        }
    }

    _notifyBlur() {
        this._closeTooltip();
    }

    _initTrackFocus() {
        // If activeElement, then an action that doesn't use the focus behavior curently has focus. It will render the focus itself.
        this._trackFocus(this, () => this.shadowRoot.activeElement ? null : this._getFocus());
    }

    _getGridCell(ev) {
        return ev.target.closest('.cell');
    }

    _getVisibleColDef(colNo) {
        const columns = this.view.columns;
        for (let i = 0; i < columns.length; i++) {
            if (!columns[i].hidden) {
                if (colNo-- === 0) {
                    return columns[i];
                }
            }
        }
        return null;
    }

    _mouseDown(ev, touch = false) {
        if (PTCS.wrongMouseButton(ev)) {
            return;
        }

        if (touch && this._resizeColumns) {
            this._getResizedCell(ev);
        }

        if (this._resizedCell) {
            const cellR = this._resizedCell.getBoundingClientRect();
            const posX = PTCS.getCoordinatesFromEvent(ev).posX;

            if (!(posX < cellR.right - this.__resizerHitArea || posX > cellR.right + this.__resizerHitArea)) {
                // Now we are entering the resizing mode so any other default browser actions should be disabled.
                // If not e.g. all the header cells become selected during the resizing.
                ev.preventDefault();

                const mouseMoveEv = touch ? 'touchmove' : 'mousemove';
                const mouseUpEv = touch ? 'touchend' : 'mouseup';

                window.addEventListener(mouseMoveEv, this.__resize);
                window.addEventListener(mouseUpEv, this.__stopResize);

                this.__resizing = true;

                this.$.resizer.setAttribute('selected', '');

                // When you click on hover resizer remove the focus from the focus resizer
                this.blur();
                this.$['resizer-focus'].removeAttribute('selected');
                this.$['resizer-focus'].style.display = 'none'; // Hide "focus resizer" while mouse is dragging "mouse resizer"

                return;
            }
        }

        const cell = this._getGridCell(ev);
        if (!cell) {
            return;
        }

        if (this.$.header.contains(cell) && !this._cellActions(cell)) {
            // Can't focus on header cell, because it doesn't have a focusable element
            return;
        }

        if (this.$.header === cell.parentNode) {
            // Clicked on header
            this._setFocus(cell.parentNode, cell, ev.target);
        } else {
            // Clicked on grid
            switch (this._navigation) {
                case Nav.cellFirst:
                case Nav.cellOnly:
                    this._setFocus(cell.parentNode, cell, ev.target);
                    break;

                case Nav.rowFirst:
                    // The mouse can only select rows
                    this._setFocus(cell.parentNode);
                    break;
            }
        }
    }

    _recycleGridRow(el) {
        const reg = this._recycled.get(el.__rows);
        if (reg) {
            reg.push(el);
            console.assert(reg.length < 50, 'there are many elements in the recycle bin');
        } else if (el.__rows) {
            this._recycled.set(el.__rows, [el]);
        }

        if (this._bumping) {
            el.removeAttribute('bump');
        }
        if (this._draggingNodes) {
            el.removeAttribute('is-dragged');
        }
    }

    _fallbackRow() {
        // Temporary row, while waiting for a proper view configuration
        const el = document.createElement('div');
        el.style.height = '1000px';
        el.__rows = this;
        return el;
    }

    // Set boolean attribute
    _setbattr(el, attr, value) {
        if (value) {
            el.setAttribute(attr, '');
        } else {
            el.removeAttribute(attr);
        }
    }

    _insertErrorIcon(cell, tooltip) {
        if (cell[validationField]) {
            // Replace tooltip on existing error icon
            cell.querySelector(':scope > [part=invalid-icon]').tooltip = tooltip;
        } else {
            const icon = document.createElement('ptcs-icon');
            icon.setAttribute('part', 'invalid-icon');
            icon.setAttribute('grid-action', '');
            icon.setAttribute('style-focus', ''); // Need help with focus styling
            icon.icon = this.validationErrorIcon || defaultErrorIcon;
            icon.size = 'small';
            icon.tooltip = tooltip;
            if (this._editing && this.view.editLevel !== 'row') {
                icon.style.cursor = 'pointer';
                icon.addEventListener('click', ev => this._editActivated(ev));
                icon.addEventListener('keydown', ev => (ev.key === ' ' || ev.key === 'Enter') && ev.target.click());
            }
            cell.insertBefore(icon, cell.firstChild.nextSibling); // Make sure any edit controls are after the error icon
        }
        cell.setAttribute('invalid', '');
        cell[validationField] = tooltip;
    }

    _removeErrorIcon(cell) {
        cell.removeAttribute('invalid');
        cell[validationField] = undefined;
        cell.removeChild(cell.querySelector(':scope > [part=invalid-icon]'));
    }

    // Callback from scroller to create row element
    _createGridRow(index, el) {
        if (!this.data || this.data.length === 0) {
            return this._messageEl;
        }

        const item = this.data.item(index);
        console.assert(item, `Invalid index: ${index}`);

        const rows = this.view ? this.view.getRowDef(item) : undefined;
        if (!rows) {
            return this._fallbackRow();
        }

        const rowDepField = this.view.rowDepField;

        // Create element
        if (!el || el.__rows !== rows) {
            el  = (this._recycled.get(rows) || []).pop();
            if (!el) {
                const minHeightRow = this.view.minHeightRow;
                const maxHeightRow = this.view.maxHeightRow;
                el = document.createElement('ptcs-div');
                el.__rows = rows;
                el.setAttribute('class', 'row');
                el.setAttribute('part', 'row');

                if (rows) {
                    const frag = document.createDocumentFragment();

                    rows.forEach(def => {
                        if (def.hidden) {
                            return;
                        }

                        const cell = document.createElement('ptcs-div');
                        cell.value = def.select(item, index); // Start with the correct value, so the state manager can attach
                        cell.setAttribute('class', 'cell');

                        // Propagate row state formatting to the cell only if it doesn't define its own state formatting
                        cell.setAttribute('part', `body-cell${rowDepField && !def.depcolumn ? ' state-value' : ''}`);

                        // Apply column state formatting in case dependent column is defined
                        if (def.depcolumn) {
                            cell.setAttribute('state-key', def.name);
                        }

                        if (def.halign) {
                            cell.setAttribute('halign', def.halign);
                        }
                        if (def.valign) {
                            // Unfortunately, Thingworx specifies middle instead of center. Now need to support both to be backwards compatible
                            const valign = def.valign === 'middle' ? 'center' : def.valign;
                            cell.setAttribute('valign', valign);
                        }

                        if (minHeightRow > 0) {
                            cell.style.minHeight = `${minHeightRow}px`;
                        }
                        if (maxHeightRow > 0) {
                            cell.style.maxHeight = `${maxHeightRow}px`;
                            cell.style.overflow = 'hidden';
                        }

                        const div = def.create(cell);
                        cell.appendChild(div);

                        if (def.editable && this._editCells && this.editControlVisibility !== 'never') {
                            const editControl = this.view.createEditControl();
                            if (editControl !== null) {
                                cell.style.justifyContent = 'space-between';
                                cell.appendChild(editControl);
                            }
                        }
                        frag.appendChild(cell);
                    });

                    // Use change badges?
                    if (this.highlightNewRows) {
                        const badge = document.createElement('div');
                        badge.setAttribute('part', 'change-badge');
                        frag.firstChild.appendChild(badge);
                    }

                    el.appendChild(frag);
                }

                // Did we get our first body-cell row-selection-checkbox?
                if (this.view.selectMethod === 'multiple' && this.__watchSelectionColumnWidth$ && !this.__watchSelectionColumnWidth$.el2) {
                    const el2 = cloneSelectionCell(el.querySelector('[part~=row-selection-checkbox]'));
                    if (el2) {
                        this.__watchSelectionColumnWidth$.el2 = el2;
                        this.__watchSelectionColumnWidth$.el.appendChild(el2);
                    }
                }
            }
        }
        // Bind element to data
        const oldIndex = el.index;
        el.index = index;
        const cells = el.children;
        if (rows) {
            const updated = this.data.updatedItem(index);
            const validation = updated && updated.$validation;

            let hiddenCount = 0;
            rows.forEach((def, colix) => {
                if (def.hidden) {
                    hiddenCount++;
                    return;
                }

                const cell = cells[colix - hiddenCount]; // Problem with spanning cells!
                if (cell) {
                    const value = def.select(item, index);
                    cell.value = value;

                    // Put row state formatting on the cell
                    if (rowDepField) {
                        cell._depfield = item[rowDepField];

                        if (cell.firstChild) {
                            cell.firstChild._depfield = item[rowDepField];
                        }
                    }

                    // Apply column state formatting in case dependent column is defined
                    if (def.depcolumn) {
                        cell._depcolumn = item[def.depcolumn];

                        if (cell.firstChild && !cell.hasAttribute('tree-toggle')) {
                            cell.firstChild.setAttribute('state-key', def.name);
                            cell.firstChild._depcolumn = item[def.depcolumn];
                        }
                    }

                    // Dirty state and validation? (Only used in editing mode)
                    if (def.editable) {
                        this._setbattr(cell, 'dirty',
                            updated && updated.hasOwnProperty(def.editable) && updated[def.editable] !== item[def.editable]);

                        const invalid = validation && validation[def.editable];
                        if (cell[validationField] !== (invalid || undefined)) {
                            if (invalid) {
                                this._insertErrorIcon(cell, invalid);
                            } else {
                                this._removeErrorIcon(cell);
                            }
                        }
                    }
                    const disabled = this._disabledRow(index);
                    this._disableCell(cell, disabled);

                    def.assign(cell.firstChild, def.render ? def.render(item, index) : value, index, this.data);
                }
            });
        }

        // Set selection mode
        this._setbattr(el, 'selected', this.data.isSelected(index));
        this._setbattr(el, 'next-row-selected', this.data.isSelected(index + 1));

        // Cell Markers (first, last, alt)
        this._setbattr(el, 'first', index === 0);
        this._setbattr(el, 'last', index + 1 === this.data.length);
        if (this.data._subItems && this.data._subItemsState) {
            const baseIndex = this.data.baseIndex(index);
            const baseLevel = this.data.baseLevel(baseIndex);
            this._setbattr(el, 'alt', baseLevel % 2 === 1);
        } else {
            this._setbattr(el, 'alt', index % 2 === 1);
        }

        // Put state formatting on the row
        if (rowDepField) {
            el._depfield = item[rowDepField];
        }

        // Remove (potential) bump
        if (this._bumping) {
            el.removeAttribute('bump');
        }

        // Update (potential) is-dragged state
        if (this._draggingNodes) {
            this._setbattr(el, 'is-dragged', this._draggingNodes.start <= index && index < this._draggingNodes.end);
        }

        // Needed for performance when updating selected items
        this._selMap = null; // Visible items has changed

        // If the row element is reused, and the old row has an action item with focus...
        if (this._focusedAction && this._focusedCell && this._focusedCell.parentNode === el && oldIndex !== el.index) {
            requestAnimationFrame(this._resetFocus.bind(this));
        }

        if (this.highlightNewRows) {
            if (this._newRows.has(item)) {
                el.classList.add('new-row');
            } else {
                el.classList.remove('new-row');
            }
        }

        return el;
    }

    _disableCell(node, isDisabled) {
        for (const child of node.children) {
            if (child.tagName !== 'PTCS-ICON') {
                if (child.classList.contains('tree-toggle')) {
                    child.disabled = false;
                } else {
                    child.disabled = isDisabled;
                }
            } else {
                child.ariaDisabled = isDisabled;
            }
        }
    }

    _disabledChanged(disabled) {
        for (let el = this.$.header.firstChild; el; el = el.nextSibling) {
            if (el.firstChild) {
                el.firstChild.disabled = disabled;
            }
        }
    }

    _disableRowChanged(_disableRow) {
        this.$.chunker.querySelectorAll('[part=row]').forEach(row => {
            const index = row.index;
            if (index >= 0) {
                const disabled = this._disabledRow(index);
                row.querySelectorAll(':scope > [part~=body-cell]').forEach(cell => {
                    this._disableCell(cell, disabled);
                });
            }
        });
    }

    _disabledRow(index) {
        return this._disableRow && this._disableRow(this.data.item(index), this.data.baseIndex(index), this.data);
    }

    __disableRowAndChildren(item, baseIndex, data) {
        console.assert(this.data === data);
        console.assert(typeof this.disableRow === 'function');
        console.assert(!this.disabled);

        if (this.disableRow(item, baseIndex, data)) {
            return true;
        }
        for (let bi = data.treeParent(baseIndex); bi >= 0; bi = data.treeParent(bi)) {
            if (this.disableRow(data.baseItem(bi), bi, data)) {
                return true;
            }
        }
        return false;
    }

    _computeDisableRow(disabled, disableRow, disableChildRows) {
        if (disabled) {
            return () => true;
        }
        switch (typeof disableRow) {
            case 'string':
                return item => item[disableRow];
            case 'function':
                return disableChildRows ? this.__disableRowAndChildren.bind(this) : disableRow;
        }
        return null;
    }

    // A new view configurator
    _viewChanged(view, old) {
        if (old) {
            old.unobserve(this);
        }
        if (view) {
            view.observe(this);
        }
    }

    // Compute width of Edit Control
    _ecWidth() {
        const ec = this.editControlVisibility !== 'never' && this.view.createEditControl();
        if (!ec) {
            return 0; // Client hides the edit control or doesn't use an edit control
        }
        ec.style.position = 'absolute';
        ec.style.visibility = 'hidden';
        document.body.appendChild(ec);
        const w = ec.clientWidth;
        ec.remove();
        return w;
    }

    _colMinWidth(col) {
        const minW = PTCS.cssDecodeSize(col.minWidth, this);
        const requiredMin = col.sortable ? 34 : this.__resizerHitArea;
        return (isNaN(minW) || minW < requiredMin) ? requiredMin : minW;
    }

    _assignColWidths() {
        const colWidths = [];
        let canGrow = false; // Can the grid expand to any width?
        const maxW = {};
        const colMaxWidths = [];

        // Width that should be added to all editable columns
        const ecWidth = this._editCells ? this._ecWidth() : 0;

        // Add ecWidth to editable columns and --ptcs-toggle-depth to toggle columns
        const ecAdjust = (width, col) => {
            if (ecWidth && col.editable) {
                return col.treeToggle
                    ? `calc(${width} + ${ecWidth}px + var(--ptcs-toggle-depth, 0) * var(--ptcs-toggle-indent, 24px))`
                    : `calc(${width} + ${ecWidth}px)`;
            }
            return col.treeToggle ? `calc(${width} + var(--ptcs-toggle-depth, 0) * var(--ptcs-toggle-indent, 24px))` : width;
        };

        // Decode minmax(5px, 10px) to [[5, 'px'], [10, 'px']]
        const decodeMinmax = w => {
            if (typeof w !== 'string') {
                return undefined;
            }
            const m = /^minmax\(([\d.\w%]+) *, *([\d.\w%]+)\)$/.exec(w);
            if (!m) {
                return undefined;
            }
            const v1 = decode(m[1]);
            const v2 = decode(m[2]);
            return v1 && v2 && [v1, v2];
        };

        this._colWidths.forEach((w, i) => {
            const minmax = decodeMinmax(w.width);
            let minWidth = decode(w.minWidth) || (minmax && minmax[0]);
            let width = decode(w.width);
            let maxWidth = decode(w.maxWidth) || (minmax && minmax[1]);

            // minWidth and maxWidth can not use fraction units
            if (minWidth && minWidth[1] === 'fr') {
                minWidth = undefined;
            }
            if (maxWidth && maxWidth[1] === 'fr') {
                maxWidth = undefined;
            }

            const isFrUnit = width && width[1] === 'fr';

            // Can we reduce the number of width specifiers to two, so with can be handled by minmax()?
            if (maxWidth) {
                if (!minWidth && !isFrUnit) {
                    // Cannot do this switch if width uses fraction units (don't know why, but both Chrome and Firefox fails otherwise)
                    minWidth = width;
                    width = maxWidth;
                    maxWidth = undefined;
                } else if (!width) {
                    width = maxWidth;
                    maxWidth = undefined;
                } else {
                    // There are 3 width specifiers, which CSS grid doesn't support. Need to monitor widths manually
                    colMaxWidths[i] = {width: width.join(''), maxWidth: maxWidth.join('')};
                }
            }

            // Assign widths
            const _minWidth = minWidth ? minWidth.join('') : defaultColMinW;
            if (width) {
                const _width = colMaxWidths[i] ? `var(--ptcs-grid-colw-${i})` : width.join('');
                if (width[1] === 'fr' || width[1] === '%') {
                    if (maxWidth) {
                        maxW[maxWidth[1]] = (maxW[maxWidth[1]] || 0) + maxWidth[0]; // Add value to its unit
                    } else {
                        canGrow = true;
                    }
                    colWidths[i] = `minmax(${ecAdjust(_minWidth, w)},${_width})`;
                } else {
                    colWidths[i] = ecAdjust(_width, w);
                    maxW[width[1]] = (maxW[width[1]] || 0) + width[0] + (w.editable ? ecWidth : 0); // Add value to its unit
                }
            } else if (typeof w.width === 'string' && w.width.startsWith('var(--')) {
                // Exact width via CSS variable
                colWidths[i] = w.width;
            } else {
                canGrow = true;
                colWidths[i] = `minmax(${ecAdjust(_minWidth, w)},1fr)`;
            }
        });

        this._colMaxWidths = colMaxWidths.length && colMaxWidths;
        if (this._colMaxWidths) {
            // Initialize the CSS variables that holds the column widths
            this._colMaxWidths.forEach((w, i) => {
                this.style.setProperty(`--ptcs-grid-colw-${i}`, w.width);
            });
        }

        this.style.maxWidth = canGrow ? '' : `calc(${Object.keys(maxW).map(u => maxW[u] + u).join(' + ')} + var(--vssbw, 0px))`;
        this.style.setProperty('--ptcs-grid-columns', colWidths.join(' '));
        this._adjustMinMaxColumnWidths();

        this.style.setProperty('--ptcs-edit-control-width', `${ecWidth}px`);
    }

    _adjustMinMaxColumnWidths() {
        if (!this._colMaxWidths) {
            return;
        }

        if (this._colMaxWidths.clientWidth < this.clientWidth) {
            // Viewport has grown. Restore all default column widths
            this._colMaxWidths.forEach((w, i) => {
                if (w.maximized) {
                    this.style.setProperty(`--ptcs-grid-colw-${i}`, w.width);
                    w.maximized = undefined;
                }
            });
        }
        this._colMaxWidths.clientWidth = this.clientWidth;

        // Make sure no columns exceed the maximum width
        const header = this.$.header.children;

        let maximizedCols;
        do {
            maximizedCols = [];
            this._colMaxWidths.forEach((w, i) => {
                if (!w.maximized && header[i].clientWidth > PTCS.cssDecodeSize(w.maxWidth, header[i])) {
                    maximizedCols[i] = w.maxWidth;
                    w.maximized = true;
                }
            });
            maximizedCols.forEach((w, i) => {
                this.style.setProperty(`--ptcs-grid-colw-${i}`, w);
            });
        } while (maximizedCols.length && this._colMaxWidths.some(w => !w.maximized));
    }


    _resizedCellChanged(_resizedCell) {
        if (!_resizedCell) {
            this.$.resizer.style.display = 'none';
            this.style.cursor = '';

            return;
        }

        const cellR = _resizedCell.getBoundingClientRect();
        const headR = this.$.header.getBoundingClientRect();
        const gridR = this.getBoundingClientRect();

        this.$.resizer.style.display = 'block';
        this.$.resizer.style.left = `${Math.min(cellR.right - gridR.left - 1, headR.right - gridR.left - 1)}px`;
        this.$['resizer-handle'].style.height = `${cellR.height}px`;

        this.__setResizerHeight(cellR, this.$.resizer);
    }

    _resizedFocusedCellChanged(_resizedFocusedCell) {
        if (!_resizedFocusedCell) {
            return;
        }

        const cellR = _resizedFocusedCell.getBoundingClientRect();
        const gridR = this.getBoundingClientRect();

        this.$['resizer-focus'].style.left = `${cellR.right - gridR.left - 1}px`;
        this._resizerFocusHandle.style.height = `${cellR.height}px`;

        this.__setResizerHeight(cellR, this.$['resizer-focus']);
    }

    _updateResizerPositions() {
        if (this._resizedCell) {
            this._resizedCellChanged(this._resizedCell);
        }
        if (this._resizedFocusedCell) {
            this._resizedFocusedCellChanged(this._resizedFocusedCell);
        }
    }

    _updateWidthsInView() {
        if (!Array.isArray(this._resizedColWidths) || this._resizedColWidths.length === 0) {
            return;
        }

        const columns = this.view.columns;
        const columnsDef = this.view.columnsDef;

        let hiddenCount = 0;

        const findColumnByName = col => {
            let res = columnsDef.find(e => (e.name || col.name) && e.name === col.name);

            if (!res) {
                res = columnsDef.find(e => (e.label || col.title) && e.label === col.title);
            }

            return res;
        };

        columns.forEach((col, i) => {
            const colDef = findColumnByName(col);

            if (colDef) {
                if (!colDef.hidden) {
                    const colResizedWidth = PTCS.cssDecodeSize(this._resizedColWidths[i - hiddenCount]);
                    colDef.width = `${colResizedWidth - (this._editCells && col.editable ? this._ecWidth() : 0)}px`;
                } else {
                    hiddenCount++;
                }
            }
        });
    }

    __setCellWidthWithConstraints(resizedCell, newWidth) {
        newWidth = resizedCell.hasAttribute('resize-min-width') ? Math.max(resizedCell.getAttribute('resize-min-width'), newWidth) : newWidth;
        newWidth = resizedCell.hasAttribute('resize-max-width') ? Math.min(resizedCell.getAttribute('resize-max-width'), newWidth) : newWidth;

        const cellIndex = PTCS.getChildIndex(resizedCell);
        const hR = this.$.header.getBoundingClientRect();
        const rR = resizedCell.getBoundingClientRect();
        const oldRRight = rR.right;
        const rRight = rR.left + newWidth;
        const gridRect = this.getRootNode().host.getBoundingClientRect();
        const lastCell = this.$.header.lastChild;
        const lastCellIndex = PTCS.getChildIndex(lastCell);
        const lastCellRect = lastCell.getBoundingClientRect();
        const vScrollBarWidth = PTCS.getVerticalScrollbarWidth(this.$.chunker.elScroll);

        if (!Array.isArray(this._resizedColWidths) || this._resizedColWidths.length === 0) {
            this._resizedColWidths = [];

            for (let i = 0; i < this._colWidths.length; i++) {
                const cellR = this.$.header.children[i].getBoundingClientRect();
                this._resizedColWidths.push(`${cellR.width}px`);
            }
        }

        // When resizing columns, add the offset to the last column so it will grow accordingly and stay anchored to the right side of the grid
        if (lastCellRect.right < gridRect.right - vScrollBarWidth) {
            const offset = rRight - oldRRight;
            this._resizedColWidths[lastCellIndex] = `${lastCellRect.width + Math.abs(offset)}px`;
        }

        const colsWidthSum = this._resizedColWidths.reduce((acc, val, i) => acc + (i !== cellIndex ? Number(decode(val)[0]) : newWidth), 0);

        // Set 'resize-min-width' for the last cell to limit it from getting narrower than the width of grid
        const requiredMin = this._colMinWidth(this.view.columns[cellIndex]);
        const lastCellMinWidth = gridRect.width - vScrollBarWidth - colsWidthSum + newWidth;
        lastCell.setAttribute('resize-min-width', Math.max(lastCellMinWidth, requiredMin));

        this._resizedColWidths[cellIndex] = `${newWidth}px`;

        this.style.maxWidth = `calc(${this._resizedColWidths.reduce((acc, w) => PTCS.cssDecodeSize(w) + acc, 0)}px + var(--vssbw, 0px))`;

        this.style.setProperty('--ptcs-grid-columns', this._resizedColWidths.join(' '));

        // Show a 'not-allowed' cursor when trying to resize the last column to be narrower than the width of grid
        if (lastCellIndex === cellIndex && colsWidthSum < gridRect.width) {
            this.style.cursor = 'not-allowed';
        }

        if (!this.__resizeCall) {
            return;
        }

        this.__resizeCall = false;

        // Check if we need to scroll to the new location
        if (rRight > hR.right) {
            this.$.chunker.elScroll.scrollLeft = this.$.chunker.elScroll.scrollLeft + rRight - oldRRight;
        }

        requestAnimationFrame(() => {
            this.__resizeCall = true;
        });
    }

    _computeResizeColumns(resizeColumns, _treeToggle) {
        return resizeColumns || (_treeToggle && resizeColumns !== false);
    }

    _resizeColumnsChanged(_resizeColumns, old) {
        if (!_resizeColumns === !old) {
            return; // Effective Boolean value is unchanged
        }
        if (!_resizeColumns) {
            // Remove all the listeners
            this.$.header.removeEventListener('mousemove', this.__mouseOverHeader);
            this.$.header.removeEventListener('mouseleave', this.__checkIfMouseLeftResizedCell);

            this.$['resizer-focus'].removeEventListener('mouseleave', this.__checkIfMouseLeftResizedCell);

            this.$['resizer'].removeEventListener('mousemove', this.__checkIfMouseLeftResizedCell);
            this.$['resizer'].removeEventListener('mouseleave', this.__checkIfMouseLeftResizedCell);

            this.shadowRoot.removeEventListener('mouseup', this.__resizeMouseUp);

            // Hide the resizer leftovers
            this._resizedCell = null;
            this._resizedFocusedCell = null;

            return;
        }

        this.$.header.addEventListener('mousemove', this.__mouseOverHeader);
        this.$.header.addEventListener('mouseleave', this.__checkIfMouseLeftResizedCell);

        this.$['resizer-focus'].addEventListener('mouseleave', this.__checkIfMouseLeftResizedCell);

        this.$['resizer'].addEventListener('mousemove', this.__checkIfMouseLeftResizedCell);
        this.$['resizer'].addEventListener('mouseleave', this.__checkIfMouseLeftResizedCell);

        this.shadowRoot.addEventListener('mouseup', this.__resizeMouseUp);
    }

    _reorderColumnsChanged(reorderColumns) {
        const columns = (this.view && this.view.columns) || [];
        this.$.header.querySelectorAll('[part~=header-cell]').forEach((el, i) => {
            this._setbattr(el, 'draggable', reorderColumns && columns[i] && !columns[i].nonReorderable);
        });
    }

    // View configuration has changed
    dvChanged() {
        if (!this.view) {
            return;
        }

        // Is editing enabled?
        this._editing = this.view.editLevel === 'cell' || this.view.editLevel === 'row' || this.view.editLevel === 'grid';

        // Show an edit control in hovered / focused cells?
        this._editCells = this.view.editLevel === 'cell' || this.view.editLevel === 'grid';

        const columns = this.view.columns;
        const maxHeightHeader = this.view.maxHeightHeader;

        if (!columns || !columns.length) {
            console.error('Invalid core-grid columns');
            return;
        }

        // Are there any tree toggles
        this._treeToggle = columns.some(col => col.treeToggle);

        const header = this.$.header;
        while (header.firstChild) {
            header.removeChild(header.firstChild);
        }

        this._colWidths = [];
        this._resizedColWidths = [];

        // Create the header cells offscreen
        const frag = document.createDocumentFragment();

        columns.forEach((col) => {
            if (col.hidden) {
                return;
            }

            // Create header cell
            const cell = document.createElement('div');
            cell.setAttribute('part', 'header-cell');
            cell.setAttribute('class', 'cell');

            if (col.headerHAlign) {
                cell.setAttribute('header-halign', col.headerHAlign);
            }
            if (col.headerVAlign) {
                // Unfortunately, Thingworx specifies middle instead of center. Now need to support both to be backwards compatible
                cell.setAttribute('header-valign', col.headerVAlign === 'middle' ? 'center' : col.headerVAlign);
            }
            if (col.treeToggle) {
                cell.setAttribute('tree-toggle', '');
            }
            if (maxHeightHeader > 0) {
                cell.style.maxHeight = maxHeightHeader + 'px';
                cell.style.overflow = 'hidden';
            }

            if (this._resizeColumns) {
                if (col.nonresizable) {
                    cell.setAttribute('non-resizable', '');
                } else {
                    // Set min and max width for the resizing
                    const minW = this._colMinWidth(col);
                    const maxW = PTCS.cssDecodeSize(col.maxWidth, this);

                    if (minW && !Number.isNaN(minW)) {
                        cell.setAttribute('resize-min-width', minW);
                    }

                    if (maxW && !Number.isNaN(maxW)) {
                        cell.setAttribute('resize-max-width', maxW);
                    }
                }
            }

            // Create header cell content
            let el;
            if (!col.label) {
                el = document.createElement('div');
            } else if (typeof col.label === 'string') {
                el = document.createElement('ptcs-label');
                el.setAttribute('variant', 'grid-item');
                el.setAttribute('part', 'header-label');
                el.label = col.label;
            } else if (typeof col.label === 'function') {
                el = col.label(this.data, this.view, cell);
            }

            if (el) {
                el.disabled = this.disabled;

                cell.appendChild(el);
            }

            if (this.view.selectMethod === 'multiple') {
                if (col.id === 'select') {
                    PTCS.setbattr(cell, 'selection', true);
                } else if (col.id === 'showRowNumbers') {
                    PTCS.setbattr(cell, 'show-row-numbers', true);
                }
            }

            if (this.reorderColumns && !col.nonReorderable) {
                cell.setAttribute('draggable', '');
            }

            frag.appendChild(cell);

            this._colWidths.push({...col});
        });

        // Use change badges?
        if (this.highlightNewRows) {
            // Reserve space in leftmost header cell
            const badge = document.createElement('div');
            badge.setAttribute('part', 'change-badge');
            frag.firstChild.appendChild(badge);
        }

        header.appendChild(frag);

        this._assignColWidths();

        // Drop all recycled elements. The format has changed
        this._recycled.clear();

        // The view configuration has been updated. Must rebuild now, or there will be strange flickering effects
        this.$.chunker.rebuild(true);

        // If chunker is rebuilt then the footer should be rebuild as well
        this._rebuildFooter();

        this.___rebuildChunkerOn = 0;

        this.dispatchEvent(new CustomEvent('core-grid-dv-changed', {
            bubbles:  true,
            composed: true
        }));

        if (this.__currSortExpr) {
            // If a sort expression existed we should apply it again
            requestAnimationFrame(() => {
                this.view.setSortExpression(this.__currSortExpr, this.data, {
                    noOrder: false,
                    reset:   true
                });
            });
        }

        this._watchSelectionColumnWidth();
    }

    // Observe widths of multi selection cells (header and body) and store max width in --ptcs-core-grid-selection-width
    _watchSelectionColumnWidth() {
        if (this.__watchSelectionColumnWidth$) {
            this.__watchSelectionColumnWidth$.ro.disconnect();
            this.__watchSelectionColumnWidth$.el.remove();
            this.__watchSelectionColumnWidth$ = undefined;
        }
        if (this.view.selectMethod === 'multiple') {
            requestAnimationFrame(() => {
                const el1 = cloneSelectionCell(this.$.header.querySelector('ptcs-grid-selection-observer'));
                const el2 = cloneSelectionCell(this.$.chunker.querySelector('[part~=row-selection-checkbox]'));
                if (!el1 && !el2) {
                    return; // Nothing to watch yet
                }

                // Create an invisble element with the multi selection cells that we can watch
                const el = document.createElement('div');
                el.style.visibility = 'hidden';
                el.style.position = 'absolute';
                el.style.top = '-100px';
                if (el1) {
                    el.appendChild(el1);
                }
                if (el2) {
                    el.appendChild(el2);
                }
                this.shadowRoot.appendChild(el);

                // Observe widths of cloned header and body cells (assume that any relevant CSS styling applies to them as well)
                const ro = new ResizeObserver(entries => {
                    requestAnimationFrame(() => this.style.setProperty('--ptcs-core-grid-selection-width', `${entries[0].contentRect.width}px`));
                });

                ro.observe(el);

                this.__watchSelectionColumnWidth$ = {el, ro, el2};
            });
        }
    }

    _editControlVisibilityChanged() {
        // Drop all recycled elements. The format has changed
        this._recycled.clear();

        // The view configuration has been updated. Must rebuild now, or there will be strange flickering effects
        this._rebuildChunker({wipe: true});
    }

    _doElsOverlap(el1, el2, midPoint = false) {
        const rect1 = el1.getBoundingClientRect();
        const rect2 = el2.getBoundingClientRect();

        const rect1MidPoint = rect1.left + ((rect1.width) / 2);

        if (midPoint) {
            // Checks if el1 middle is overlapping el2
            return !((rect1MidPoint < rect2.left) ||
                     (rect1MidPoint > rect2.right) ||
                     (rect1.bottom < rect2.top) ||
                     (rect1.top > rect2.bottom));
        }

        return !((rect1.right < rect2.left) ||
                 (rect1.left > rect2.right) ||
                 (rect1.bottom < rect2.top) ||
                 (rect1.top > rect2.bottom));
    }

    // Returns a list of grid header cells as objects conatining index, cell midPoint(x), html node, and rect details.
    _getHeaderCellsObj() {
        if (!this.$.header) {
            return null;
        }

        const headerCellsNodes = this.$.header.querySelectorAll('[part^=header-cell]');
        let objsList = [];

        headerCellsNodes.forEach((node, index) => {
            if (this.view.columns[index].nonReorderable) {
                return;
            }

            const elRect = node.getBoundingClientRect();

            const obj = {
                node:     node,
                rect:     elRect,
                midPoint: elRect.left + ((elRect.width) / 2)
            };

            objsList.push(obj);
        });

        return objsList;
    }

    _onheaderdragstart() {
        return false;
    }

    _onDragStart(ev) {
        if (PTCS.wrongMouseButton(ev)) {
            return;
        }

        const actionEl = ev.target.closest('[grid-action]');
        if (actionEl) {
            return; // Clicked on a grid action (the sort button?)
        }
        const cell = ev.target.closest('[part~=header-cell]');
        const colIndex = PTCS.getChildIndex(cell);

        if (!this.reorderColumns || this._resizedCell || (this.view.columns[colIndex] && this.view.columns[colIndex].nonReorderable)) {
            return;
        }

        ev.preventDefault();

        this.__dragging = true;
        this.style.cursor = 'grabbing';

        const gridRect = this.getBoundingClientRect();
        const headerCellsObjs = this._getHeaderCellsObj();

        const draggedCol = this._getDraggedColumn(colIndex, cell);
        this.shadowRoot.appendChild(draggedCol);

        let draggedColRect = draggedCol.getBoundingClientRect();
        const draggedColMiddle = draggedColRect.width / 2;

        if (headerCellsObjs) {
            this._updateReorderIndicator(gridRect, draggedCol, headerCellsObjs);
        }

        let {posX: x, posY: y} = PTCS.getCoordinatesFromEvent(ev);

        const mouseMoveHandler = (ev2) => {
            if (this.__resizing) {
                return;
            }

            draggedColRect = draggedCol.getBoundingClientRect();

            let {posX: moveX, posY: moveY} = PTCS.getCoordinatesFromEvent(ev2);

            // How far the mouse has been moved
            const dx = moveX - x;
            const dy = moveY - y;

            let offsetX;
            // Check if draggedCol x values exceed grid boundaries
            if (((draggedColRect.right - (draggedColRect.width / 2)) + dx) > gridRect.right) {
                offsetX = gridRect.right - draggedColMiddle - draggedCol.width;
            } else if ((draggedCol.offsetLeft + dx) < -draggedColMiddle) {
                offsetX = -draggedColMiddle;
            } else {
                offsetX = draggedCol.offsetLeft + dx;
            }

            let offsetY;
            // Check if draggedCol y values exceed grid boundaries from the top
            if ((draggedCol.offsetTop + dy) < 0) {
                offsetY = 0;
            } else {
                offsetY = draggedCol.offsetTop + dy;
            }

            // Set the position of element
            draggedCol.style.top = `${offsetY}px`;
            draggedCol.style.left = `${offsetX}px`;

            // Re assign the position of the mouse
            x = moveX;
            y = moveY;

            if (headerCellsObjs) {
                this._updateReorderIndicator(gridRect, draggedCol, headerCellsObjs);
            }
        };

        const mouseUpHandler = () => {
            ['mousemove', 'touchmove'].forEach(evName => {
                document.removeEventListener(evName, mouseMoveHandler);
            });

            ['mouseup', 'touchend'].forEach(evName => {
                document.removeEventListener(evName, mouseUpHandler);
            });

            if (this._doElsOverlap(draggedCol, this.$.header)) {
                this._reorderColumns(colIndex, this._draggedDestIndex);
            }

            draggedCol.remove();
            this.style.cursor = '';
            this.__dragging = false;
            this.$['reorder-indicator'].style.display = 'none';
        };

        ['mousemove', 'touchmove'].forEach(evName => {
            document.addEventListener(evName, mouseMoveHandler);
        });

        ['mouseup', 'touchend'].forEach(evName => {
            document.addEventListener(evName, mouseUpHandler);
        });
    }

    // Updates reorder indicator position and dest index
    _updateReorderIndicator(gridRect, draggedCol, headerCellsObjs) {
        const indicatorStyle = this.$['reorder-indicator'].style;

        if (this._doElsOverlap(draggedCol, this.$.header)) {
            const draggedColRect = draggedCol.getBoundingClientRect();
            indicatorStyle.display = 'block';
            this.style.cursor = 'grabbing';

            for (let i = 0; i < headerCellsObjs.length; i++) {
                if (this._doElsOverlap(draggedCol, headerCellsObjs[i].node, true)) {
                    const draggedColMidPoint = draggedColRect.left + (draggedColRect.width / 2);

                    if (draggedColMidPoint < headerCellsObjs[i].midPoint) {
                        indicatorStyle.left = `${headerCellsObjs[i].rect.left - gridRect.left - 1}px`;
                        this._draggedDestIndex = i;
                    } else {
                        indicatorStyle.left = `${headerCellsObjs[i].rect.right - gridRect.left - 1}px`;
                        this._draggedDestIndex = i + 1;
                    }

                    break;
                }
            }
        } else {
            indicatorStyle.display = 'none';
            this.style.cursor = 'not-allowed';
        }
    }

    _reorderColumns(fromIndex, toIndex) {
        // Adjust indexes according to leading nonReorderable and hidden columns
        let realFromIndex = -1, realToIndex = -1, i = -1;
        for (const col of this.view.columns) {
            if (col.nonReorderable) {
                fromIndex--;
                continue;
            }

            realFromIndex++;

            if (!col.hidden) {
                i++;
            }

            if (i === fromIndex) {
                break;
            }
        }

        i = -1;
        for (const col of this.view.columns) {
            if (col.nonReorderable) {
                continue;
            }

            realToIndex++;

            if (!col.hidden) {
                i++;
            }

            if (i === toIndex) {
                break;
            }
        }

        if (realToIndex < toIndex) {
            realToIndex = toIndex; // no hiddens, toIndex is last+1
        } else if (i < toIndex) {
            realToIndex++; // there are hiddens, toIndex is last+1
        }

        if (realFromIndex === realToIndex) {
            return;
        }

        const columnsDef = [...this.view.columnsDef];
        const tempCol = columnsDef[realFromIndex];
        columnsDef.splice(realFromIndex, 1);
        columnsDef.splice(realFromIndex < realToIndex ? realToIndex - 1 : realToIndex, 0, tempCol);
        this.view.columnsDef = columnsDef;
    }

    _getDraggedColumn(colIndex, headerCell) {
        const nodesList = this.$.chunker.querySelectorAll(`[part=row]>*[part^=body-cell]:nth-child(${colIndex + 1})`);
        const cellR = headerCell.getBoundingClientRect();
        const gridR = this.getBoundingClientRect();

        const tempCol = document.createElement('div');
        tempCol.setAttribute('part', 'dragged-column');
        tempCol.style.position = 'absolute';
        tempCol.style.left = `${cellR.left - gridR.left - 1}px`;
        tempCol.style.top = `${cellR.top - gridR.top - 3}px`;
        tempCol.style.zIndex = 100;

        const tempHeader = headerCell.cloneNode(true);
        tempHeader.removeAttribute('draggable');
        tempHeader.setAttribute('dragged', '');
        tempHeader.style.width = `${cellR.width}px`;
        tempHeader.style.height = `${cellR.height}px`;
        tempHeader.style.zIndex = 10;

        const cloneShadow = (shadow) => {
            const frag = document.createDocumentFragment();
            var nodes = [...shadow.childNodes];

            nodes.forEach(node => {
                frag.appendChild(node.cloneNode(true));
            });

            return frag;
        };

        const headerLabel = headerCell.querySelector('[part=header-label]');
        if (headerLabel) {
            const tempHeaderLabel = tempHeader.querySelector('[part=header-label]');
            tempHeaderLabel.label = headerLabel.label;
            tempHeaderLabel.attachShadow({mode: 'open'}).appendChild(cloneShadow(headerLabel.shadowRoot));
        }

        const rowsContainer = document.createElement('div');
        rowsContainer.style.transform = this.$.chunker.getElItemsTransform();
        let rowsContainerHeight = 0;

        const def = this.view.columns[colIndex];

        /* eslint-disable consistent-return */
        const getMatchingNode = (list, index) => {
            for (const node of list) {
                if (node.parentNode.index === index) {
                    return node;
                }
            }
        };
        /* eslint-enable consistent-return */

        if (this.data && this.data.length) {
            let newCell;
            let newCellR;

            for (let i = this.$.chunker.startIx; i < this.$.chunker.endIx; i++) {
                const item = this.data.item(i);
                const value = def.select(item, i);

                const node = getMatchingNode(nodesList, i);

                newCellR = node.getBoundingClientRect();
                newCell = node.cloneNode(true);
                newCell.value = value;
                newCell.style.width = `${newCellR.width}px`;
                newCell.style.height = `${newCellR.height}px`;
                newCell.style.transform = node.parentNode.style.transform;
                newCell.style.position = 'absolute';

                if (node.firstChild.shadowRoot) {
                    newCell.firstChild.attachShadow({mode: 'open'}).appendChild(cloneShadow(node.firstChild.shadowRoot));
                }

                rowsContainerHeight += newCellR.height;

                def.assign(newCell.firstChild, value, i, this.data);
                rowsContainer.appendChild(newCell);
            }
        }

        rowsContainer.style.height = `${rowsContainerHeight}px`;

        tempCol.appendChild(tempHeader);
        tempCol.appendChild(rowsContainer);

        return tempCol;
    }

    _setDataLength(dataLength) {
        this.$.chunker.numItems = this.slottedMessage
            ? Math.max(1, dataLength) // If no items, then show the slotted message
            : dataLength; // Don't show a message when the grid is empty
    }

    _slottedMessageChanged() {
        if (!this.data || this.data.length === 0) {
            this._setDataLength(0);
            this._refreshChunker(0);
        }
    }

    _dataChanged(data, old) {
        if (old) {
            old.unobserve(this);
        }
        if (data) {
            data.observe(this);
            this._setDataLength(data.length);
        } else {
            this._setDataLength(0);
        }
        if (old) {
            // Replaced the data manager. Need to refresh out all references to the old data manager in the view structure
            this.dvChanged();
            this._autoScroll();
        } else {
            this._rebuildChunker({autoScroll: true});
        }
    }

    _refreshChunker(index) {
        if (this.view && this.view.columns && this.data) {
            this.$.chunker.refresh(index);
        }
    }

    // opt: {wipe, autoScroll}
    _rebuildChunker(opt) {
        if (this.___rebuildChunkerOn) {
            if (opt && opt.wipe) {
                this.___rebuildChunkerOn = 2;
            }
            return;
        }
        this.___rebuildChunkerOn = (opt && opt.wipe) ? 2 : 1;
        requestAnimationFrame(() => {
            if (!this.___rebuildChunkerOn) {
                return;
            }
            const _wipe = this.___rebuildChunkerOn === 2;
            this.___rebuildChunkerOn = 0;
            if (this.view && this.view.columns && this.data) {
                this.$.chunker.rebuild(_wipe);

                if (opt && opt.autoScroll) {
                    this._autoScroll();
                }
            }
        });
    }

    dmSort() {
        requestAnimationFrame(() => {
            // I use requestAnimationFrame to ensure that sort icon listeners are applied first
            const sortExpr = this.view.getSortExpression();
            this.__currSortExpr = sortExpr && sortExpr.short;
        });
    }

    // Data Notifier: the data has changed
    dmView() {
        this._setDataLength(this.data.length);
        this._rebuildChunker({autoScroll: true});
    }

    dmFilter() {
        this._rebuildFooter();
    }

    dmItem(index) {
        this._refreshChunker(index);

        this._rebuildFooter();
    }

    // Data Notifier: data has been added
    dmInserted(inserted) {
        this.$.chunker.inserted(inserted);
        this._rebuildFooter();

        this.dispatchEvent(new CustomEvent('items-updated', {
            bubbles:  true,
            composed: true,
            detail:   {inserted}}));
    }

    // Data Notifier: data has been removed
    dmRemoved(removed) {
        this.$.chunker.removed(removed);
        this._rebuildFooter();

        this.dispatchEvent(new CustomEvent('items-updated', {
            bubbles:  true,
            composed: true,
            detail:   {removed}}));

        // If the last visible item got removed
        if (this.data.length === 0) {
            setTimeout(() => {
                // This is a hack to force the chunker to show the empty message
                // when the last visible row are removed, after the scroll animation has ended
                if (!this.data || !this.data.length) {
                    this.$.chunker.numItems = 0;
                    this._setDataLength(0);
                }
            }, 300);
        }
    }

    dmSelected(baseIndex, selected) {
        // _selMap is only really needed when we have a projection on the data,
        // because then translateBaseIndexToIndex can get _really_ slow,
        // but it is good for performance whenever the number of data items is big
        if (!this._selMap) {
            const endIx = this.$.chunker.endIx;
            this._selMap = new Map();
            for (let i = this.$.chunker.startIx; i <= endIx; i++) {
                this._selMap.set(this.data.baseIndex(i), i);
            }
        }

        const index = this._selMap.get(baseIndex);
        if (index >= 0) {
            this._refreshChunker(index);
            const el = index > 0 && this.$.chunker.getRow(index - 1);
            if (el) {
                this._setbattr(el, 'next-row-selected', selected);
            }
        }
    }

    dmSelection() {
        if (this.autoScroll) {
            requestAnimationFrame(this._autoScroll.bind(this));
        }
    }

    dmDepth(depth) {
        this.style.setProperty('--ptcs-toggle-depth', depth);
    }

    dmCommit() {
        // Get rid of any dirty flags
        this._refreshChunker();
    }

    // Mouse click on grid - select row?
    _clickOnGrid(ev) {
        if (PTCS.wrongMouseButton(ev)) {
            return;
        }

        // Prevent the double click from deselecting the row
        if (ev.detail === 2) {
            return;
        }

        if (this.disabled) {
            return;
        }
        // Did interactive cell content (e.g. checkbox, ...) already handle this interaction?
        if (ev.defaultPrevented) {
            return;
        }
        if (!this.data || !this.data.length) {
            return; // If there is a row in the chunker, it is the empty message
        }
        if (ev.target.closest('[grid-action]')) {
            return; // Clicked on a grid-action, so click event should be ignored
        }
        for (let el = ev.target; el; el = el.parentNode) {
            if (el.hasOwnProperty('index')) {
                const baseIndex = this.data.baseIndex(el.index);
                const disabled = this._disabledRow(el.index);
                const toggleIcon = el.querySelector('[part~=tree-toggle-icon]');
                if (!disabled && baseIndex >= 0 && toggleIcon !== ev.target) {
                    if (this.selectRow && this.data.selectMethod === 'single' && !this.selectFollowsFocus) {
                        this.data.select(baseIndex, undefined, true); // Toggle selection
                    }

                    this.dispatchEvent(new CustomEvent('row-click', {bubbles: true, composed: true, detail: {value: el.index, baseIndex}}));
                }
                break;
            }
        }
    }

    scrollTo(index) {
        this.$.chunker.scrollTo(index);
    }

    _autoScroll() {
        if (!this.autoScroll || !this.data || (this.data && this.data.selected) === null || this.__waitingForAutoScroll) {
            return;
        }

        // Debounce call
        this.__waitingForAutoScroll = true;
        requestAnimationFrame(() => {
            this.__waitingForAutoScroll = undefined;

            const selected = this.data.selected;

            if (typeof selected === 'number') {
                this.scrollTo(this.data.translateBaseIndexToIndex(selected));
            } else if (selected instanceof Array) {
                // Calculate the middle index of the viewport and checks which selected index is the closest
                const viewport = Math.round(this.$.chunker.startIx + ((this.$.chunker.endIx - this.$.chunker.startIx) / 2));

                const baseSelected = selected.map((index) => this.data.translateBaseIndexToIndex(index));

                const targetIndex = baseSelected.reduce((a, b) => {
                    return Math.abs(b - viewport) < Math.abs(a - viewport) ? b : a;
                });

                this.scrollTo(targetIndex);
            }
        });
    }

    /*********************************************************************
     * DRAG-AND-DROP-GRID-ROWS
     *********************************************************************
    dragNodes(start, num) {
        const end = start + num;
        this._draggingNodes = {start, end};
        this.$.chunker.querySelectorAll('[part=row]').forEach(el => {
            if (start <= el.index && el.index < end) {
                el.setAttribute('is-dragged', '');
            }
        });
    }

    bumpNodes(_y) {
        const rows = this.$.chunker.querySelectorAll('[part=row]:not([is-clone])');

        const eli = index => {
            for (let i = 0; i < rows.length; i++) {
                if (rows[i].index === index) {
                    return rows[i];
                }
            }
            return null;
        };

        const blocked = el => el && el.hasAttribute('is-dragged');
        const canDrop = el => !blocked(el) && !blocked(eli(el.index - 1)) && !blocked(eli(el.index + 1));

        this._bumping = true;

        const y = _y + this.$.chunker.getBoundingClientRect().top;

        for (let i = 0; i < rows.length; i++) {
            const el = rows[i];
            const b = el.getBoundingClientRect();

            if (b.bottom < y) {
                // el is before drag position
                el.removeAttribute('bump');
            } else if (y < b.top) {
                // el is after drag position
                el.setAttribute('bump', '');
            } else if (canDrop(el)) {
                // el is at drag position, and we can drop the dragged row on it
                if (y < (b.bottom + b.top) / 2) {
                    el.setAttribute('bump', '');
                } else {
                    el.removeAttribute('bump');
                }
            } else {
                // el is at drag position, but we cannot drop the dragged row on it
                rows.forEach(e => e.removeAttribute('bump'));
                return null;
            }
        }

        let el;
        let elLast = rows[0];
        for (let i = 0; i < rows.length; i++) {
            if (rows[i].hasAttribute('bump') && (!el || rows[i].index < el.index)) {
                el = rows[i];
            }
            if (rows[i].index > elLast.index) {
                elLast = rows[i];
            }
        }
        return el || elLast;
    }

    dropNodes(performDrop) {
        const rows = this.$.chunker.querySelectorAll('[part=row]');

        let el;
        if (performDrop && this._draggingNodes) {
            for (let i = 0; i < rows.length; i++) {
                if (rows[i].hasAttribute('bump') && (!el || rows[i].index < el.index)) {
                    el = rows[i];
                }
            }
        }

        rows.forEach(e => {
            e.removeAttribute('is-dragged');
            e.removeAttribute('bump');
        });

        const from = this._draggingNodes.start;
        this._bumping = undefined;
        this._draggingNodes = undefined;

        if (performDrop) {
            this.data.moveItem(from, el ? el.index : undefined);
        }
    }
    **********************************************************************/

    _closeTooltip() {
        if (this.__tooltipEl) {
            this._tooltipLeave(this.__tooltipEl);
            this.__tooltipEl = null;
        }
    }

    _mouseTooltip(ev) {
        const el = this._getGridCell(ev);
        if (this.__tooltipEl === el) {
            return;
        }

        this._closeTooltip();

        if (el) {
            this.__tooltipEl = el;
            this._tooltipEnter(this.__tooltipEl, ev.clientX, ev.clientY, undefined, {showAnyway: true});
        }
    }

    // Nav.rowFirst | Nav.cellFirst | Nav.cellOnly
    get _navigation() {
        return nav(this._treeToggle, this.navigation);
    }

    _unbadgeNewRow(el) {
        const row = this.highlightNewRows && el && el.closest('.new-row');
        if (row && row.index >= 0) {
            this._newRows.delete(this.data.item(row.index));
            row.classList.remove('new-row');
        }
    }

    _keyDown(ev) {
        if (ev.defaultPrevented) {
            return;
        }

        // Get the focused element
        const focusEl = this._getFocus();
        if (!focusEl) {
            // No element has focus. Try to bring a focused row into view
            this._scrollFocusedRowIntoView();
            return;
        }

        // Find key dispatcher
        const keyMethod = `__processKey${ev.key !== ' ' ? ev.key : 'Space'}`;
        if (typeof this[keyMethod] !== 'function') {
            return;
        }

        // Is the grid empty?
        const isGridEmpty = !this.data || this.data.length === 0;

        // Is the focused element in the header?
        const isInHeader = this._focusedRow === this.$.header;

        // Find all sub-focusable elements in the focused cell
        const cellActions = this._focusedCell && this._cellActions(this._focusedCell);

        // Find grid-action modes of current action (options: updown, tab, enter)
        const ga = this._focusedAction && this._focusedAction.getAttribute('grid-action');
        const navModes = ga ? ga.split(' ') : [];

        // If the current focus locked to an action in a cell? (Can only leave the cell via Escape or Tab)
        const lockedAction = this._focusedAction && cellActions && (cellActions.length > 1 || navModes.some(m => m === 'tab' || m === 'updown'));

        // Hack to select resize bar in header cell
        this.__keyDownSelectResizeBar = undefined;

        // Handle keyboard event
        const index = focusEl.index;
        const focusEl2 = this[keyMethod]({ev, focusEl, isInHeader, isGridEmpty, cellActions, navModes, lockedAction});
        if (focusEl === focusEl2) {
            if (index !== (focusEl2 && focusEl2.index)) {
                ev.preventDefault(); // Same element, but reused for other data item
            }
            return;
        }

        this._unbadgeNewRow(focusEl);

        switch (focusEl2) {
            case false:
            case null:
            case undefined:
                return;
            case true:
                ev.preventDefault();
                return;
        }

        // The keyboard processor wants us to focus on focusEl2
        if (focusEl2 instanceof Element) {
            const row = focusEl2.closest('.row');
            const cell = focusEl2.closest('.cell');
            if (row) {
                ev.preventDefault();
                if (row === this.$.header && this.__keyDownSelectResizeBar) {
                    console.assert(cell);
                    this._setFocusResizer(cell);
                } else {
                    // If the cell should be selected, and it has a default action, the action should always be selected instead
                    const action = focusEl2.closest('[grid-action]') || (cell && this._defaultCellAction(this._cellActions(cell)));
                    this._setFocus(row, cell, action);
                }
            }
        } else {
            console.error(focusEl2);
        }
    }

    __changeColumnWidth(dir, shiftKey) {
        const WIDTH_DELTA = 2;
        const delta = shiftKey ? 2 * WIDTH_DELTA : WIDTH_DELTA;
        const newWidth = this._resizedFocusedCell.getBoundingClientRect().width + (dir === 'right' ? delta : -delta);

        this.__setCellWidthWithConstraints(this._resizedFocusedCell, newWidth);
        this.__setResizerHeight(this._resizedFocusedCell.getBoundingClientRect(), this.$['resizer-focus']);

        this._updateWidthsInView();

        this.dispatchEvent(new CustomEvent('columns-resized', {bubbles: true, composed: true}));

        this._changeResizeCol = true;

        this._updateResizerPositions();
    }

    __retainColumnFocus(focus, cb) {
        // Save column number of cell element
        const colNo = PTCS.getChildIndex(focus === this._resizerFocusHandle ? this._resizedFocusedCell : this._focusedCell);

        // Do processing
        cb();

        // Move focus to old column in new row
        const focusRow = this._getChunkerFocusRow();
        if (focusRow) {
            return colNo >= 0 ? focusRow.children[colNo] : focusRow;
        }
        this._focusChildNo = colNo;
        return true; // preventDefault
    }

    // Return the resize bar for the cell
    __resizeBar(cell) {
        console.assert(cell.parentNode === this.$.header);
        // console.assert(this.__keyDownSelectResizeBar === undefined); -- can happen when ArrowLeft wrap jumps into the header
        this.__keyDownSelectResizeBar = true; // Tell _keyDown to select the resizer of this header cell
        return cell;
    }

    __moveFocusToNextCell(isGridEmpty) {
        const focusedCell = this._focusedCell.nextElementSibling;
        if (!focusedCell && !this.preventFocusRowWrap && !isGridEmpty) {
            const focusEl2 = this.__processKeyArrowDown(arguments[0]);
            if (focusEl2 instanceof Element) {
                const row = focusEl2.closest('.row');
                return row !== this._focusedRow && (this._navigation === Nav.rowFirst ? row : row.firstElementChild);
            }
        }
        return focusedCell;
    }

    __processKeyArrowRight({ev, focusEl, isInHeader, isGridEmpty, cellActions, navModes, lockedAction}) {
        if (focusEl === this._resizerFocusHandle && this.$['resizer-focus'].hasAttribute('selected')) {
            this.__changeColumnWidth('right', ev.shiftKey);
            return true;
        }

        if (navModes.indexOf('tab') >= 0) {
            return false; // Cannot use ArrowRight to navigate current action
        }

        if (cellActions) {
            const idxOfAction = cellActions.findIndex(el => el === this._focusedAction) + 1;
            const action = lockedAction && cellActions[Math.min(idxOfAction, cellActions.length - 1)];

            // If action is last action in the same cell, move to next cell
            if (idxOfAction === cellActions.length && !isInHeader) {
                return this.__moveFocusToNextCell(isGridEmpty);
            } else if (action instanceof Element) {
                return action; // Found other action is same cell
            }
        }

        if (!isInHeader) {
            // If a row is focused, and it is collapsed, expands the current row
            // If a row is focused, and it is expanded, focuses the first cell in the row
            if (this._focusedRow && !this._focusedCell) {
                const state = this.data.subTree(this._focusedRow.index);
                if (state === false || state === null) {
                    const toggle = this._focusedRow.querySelector('[part~=tree-toggle-icon]');
                    if (toggle && toggle._$activateToggle) {
                        toggle._$activateToggle(); // Animates toggle
                    } else {
                        this.data.subTree(this._focusedRow.index, true); // Expand whitout using toggle
                    }
                    return true;
                }

                return this._focusedRow.firstElementChild;
            }

            // If a cell is focused, moves one cell to the right.
            // If focus is on the right most cell, focus does not move --- (unless !this.preventFocusRowWrap)
            return this.__moveFocusToNextCell(isGridEmpty);

        }

        // In header, only focus on action elements or resizer
        let focusedCell;

        if (this._resizeColumns && this._focusedAction === this._resizerFocusHandle) {
            focusedCell = this._resizedFocusedCell.nextElementSibling;
        } else {
            if (this._isResizable(this._focusedCell)) {
                return this.__resizeBar(this._focusedCell);
            }
            focusedCell = this._focusedCell.nextElementSibling;
        }

        for (; focusedCell; focusedCell = focusedCell.nextElementSibling) {
            if (this._cellActions(focusedCell)) {
                return focusedCell;
            }
            if (this._isResizable(focusedCell)) {
                return this.__resizeBar(focusedCell);
            }
        }

        if (!this.preventFocusRowWrap && !isGridEmpty) {
            this.$.chunker.setFocusRowIndex(0);
            const focusRow = this._getChunkerFocusRow();
            if (focusRow) {
                return this._navigation === Nav.rowFirst ? focusRow : focusRow.firstElementChild;
            }
        }

        return null;
    }

    __processKeyArrowLeft({ev, focusEl, isInHeader, isGridEmpty, cellActions, navModes, lockedAction}) {
        if (focusEl === this._resizerFocusHandle && this.$['resizer-focus'].hasAttribute('selected')) {
            this.__changeColumnWidth('left', ev.shiftKey);
            return true;
        }

        if (navModes.indexOf('tab') >= 0) {
            return false; // Cannot use ArrowLeft to navigate current action
        }

        const action = lockedAction && cellActions[Math.max(cellActions.findIndex(el => el === this._focusedAction) - 1, 0)];
        if (action instanceof Element) {
            return action; // Found other action is same cell
        }

        let focusedCell;

        if (!isInHeader) {
            // If a row is focused, and it is expanded, collapses the current row.
            // If a row is focused, and it is collapsed, focus does not move.
            if (this._focusedRow && !this._focusedCell) {
                if (this.data.subTree(this._focusedRow.index) === true) {
                    const toggle = this._focusedRow.querySelector('[part~=tree-toggle-icon]');
                    if (toggle && toggle._$activateToggle) {
                        toggle._$activateToggle(); // Animates toggle
                    } else {
                        this.data.subTree(this._focusedRow.index, false); // Collapse whitout using toggle
                    }
                    return true;
                }

                return null;
            }


            // If a cell in a [non first] column is focused, moves focus one cell to the left.
            focusedCell = this._focusedCell.previousElementSibling;
            if (focusedCell) {
                return focusedCell;
            }

            // If a cell in the first column is focused, focuses the row
            if ([Nav.rowFirst, Nav.cellFirst].indexOf(this._navigation) >= 0) {
                return this._focusedRow;
            }

            if (this.preventFocusRowWrap || isGridEmpty) {
                return null;
            }

            const focusRow = this._focusedRow;
            const focusEl2 = this.__processKeyArrowUp(arguments[0]);
            const focusRow2 = (focusEl2 instanceof Element) && focusEl2.closest('.row');
            if (!focusRow2 || focusRow2 === focusRow) {
                return null;
            }

            if (focusRow2 !== this.$.header) {
                // Still in grid
                return this._navigation === Nav.rowFirst ? focusRow2 : focusRow2.lastElementChild;
            }

            // Move into header
            focusedCell = focusRow2.lastElementChild;
        } else if (this._resizeColumns && this._focusedAction === this._resizerFocusHandle) {
            const cellActions2 = this._cellActions(this._resizedFocusedCell);
            if (cellActions2) {
                return cellActions2[cellActions2.length - 1];
            }
            focusedCell = this._resizedFocusedCell.previousElementSibling;
        } else {
            focusedCell = this._focusedCell.previousElementSibling;
        }

        // In header, only focus on action elements or resizer
        for (; focusedCell; focusedCell = focusedCell.previousElementSibling) {
            if (this._isResizable(focusedCell)) {
                return this.__resizeBar(focusedCell);
            }
            if (this._cellActions(focusedCell)) {
                return focusedCell;
            }
        }

        return null;
    }

    __processKeyArrowUp({focusEl, lockedAction, isInHeader}) {
        if (lockedAction || isInHeader) {
            return null; // Cannot use ArrowUp to navigate current action
        }
        const fi = this.$.chunker.focusedItemIndex - 1;
        if (fi >= 0) {
            return this.__retainColumnFocus(focusEl, () => this.$.chunker.setFocusRowIndex(fi));
        }

        // Move focus from table to header, if possible
        const focusedCell = this.$.header.children[PTCS.getChildIndex(this._focusedCell)] || this.$.header.firstElementChild;
        if (this._cellActions(focusedCell)) {
            return focusedCell;
        }
        if (this._isResizable(focusedCell)) {
            return this.__resizeBar(focusedCell);
        }

        return null;
    }

    __processKeyArrowDown({focusEl, lockedAction, isInHeader, isGridEmpty}) {
        if (lockedAction) {
            return null; // Cannot use ArrowDown to navigate current action
        }
        if (!isInHeader) {
            return this.__retainColumnFocus(focusEl, () => this.$.chunker.setFocusRowIndex(this.$.chunker.focusedItemIndex + 1));
        }

        // Move focus from header to table
        if (!isGridEmpty) {
            const r = this.__retainColumnFocus(focusEl, () => this.$.chunker.setFocusRowIndex(this.$.chunker.startIx));
            return (this._navigation === Nav.rowFirst && r instanceof Element) ? r.closest('.row') : r;
        }
        return null;
    }

    __processKeyHome({ev, focusEl, isInHeader, lockedAction}) {
        if (lockedAction) {
            return false; // Home cannot navigate focused action
        }

        if (ev.ctrlKey || !this._focusedCell) {
            return this.__retainColumnFocus(focusEl, () => this.$.chunker.setFocusRowIndex(0));
        }

        if (!isInHeader) {
            // Focus on first cell of row
            return this._focusedRow && this._focusedRow.firstElementChild;
        }

        // Move to first appropriate item in header
        for (let focusedCell = this.$.header.firstElementChild; focusedCell; focusedCell = focusedCell.nextElementSibling) {
            const cellActions2 = this._cellActions(focusedCell);
            if (cellActions2) {
                return cellActions2[0];
            }
            if (this._isResizable(focusedCell)) {
                return this.__resizeBar(focusedCell);
            }
        }

        return null;
    }

    __processKeyEnd({ev, focusEl, isInHeader, lockedAction}) {
        if (lockedAction) {
            return false; // End cannot navigate focused action
        }

        if (ev.ctrlKey || !this._focusedCell) {
            return this.__retainColumnFocus(focusEl, () => this.$.chunker.setFocusRowIndex(-1));
        }

        if (!isInHeader) {
            // Focus on first cell of row
            return this._focusedRow && this._focusedRow.lastElementChild;
        }

        // Move to last appropriate item in header
        for (let focusedCell = this.$.header.lastElementChild; focusedCell; focusedCell = focusedCell.previousElementSibling) {
            if (this._isResizable(focusedCell)) {
                return this.__resizeBar(focusedCell);
            }
            const cellActions2 = this._cellActions(focusedCell);
            if (cellActions2) {
                return cellActions2[0];
            }
        }

        return null;
    }

    __processKeySpace({ev}) {
        // We never want the default browser action on Space (some kind of strange scrolling, page down?)
        ev.preventDefault();


        if (!this._focusedAction && this._focusedCell && this._toggleFocusedRow()) {
            return true;
        }

        // eslint-disable-next-line max-len
        if (ev.shiftKey && this.data.selectMethod === 'multiple' && this._focusedRow && this._focusedRow.hasOwnProperty('index') && !this._focusedAction) {
            // User can select items with Shift+Space
            const value = this._focusedRow.index;
            const baseIndex = this.data.baseIndex(value);
            if (baseIndex >= 0) {
                this.data.select(baseIndex); // Toggle selection
                this.dispatchEvent(new CustomEvent('row-click', {bubbles: true, composed: true, detail: {value, baseIndex}}));
            }
            return true;
        }

        return this.__processKeyEnter(arguments[0]);
    }

    __processKeyEnter({ev, focusEl, cellActions}) {
        if (focusEl === this._resizerFocusHandle) {
            if (this.$['resizer-focus'].hasAttribute('selected')) {
                this.$['resizer-focus'].removeAttribute('selected');
            } else {
                this.$['resizer-focus'].setAttribute('selected', '');
            }
            return true;
        }

        // eslint-disable-next-line max-len
        if (this.data.selectMethod === 'single' && this._focusedRow && this._focusedRow.hasOwnProperty('index') && !this._focusedAction && !(ev.key === 'Enter' && cellActions && cellActions.length > 0)) {
            const value = this._focusedRow.index;
            const baseIndex = this.data.baseIndex(this._focusedRow.index);
            if (baseIndex >= 0) {
                this.data.select(baseIndex); // Toggle selection
                this.dispatchEvent(new CustomEvent('row-click', {bubbles: true, composed: true, detail: {value, baseIndex}}));
            }
            return true;
        }

        // Toggle state?
        const toggleIcon = this._focusedCell && this._focusedCell.querySelector('[part~=tree-toggle-icon]');
        if (!(cellActions && (this._focusedAction === null || this._focusedAction !== toggleIcon)) && this._focusedCell && this._toggleFocusedRow()) {
            return true;
        }

        // Enter cell on Enter key (not Space)
        if (this._focusedAction || !cellActions || ev.key !== 'Enter') {
            return false;
        }

        this.__enterKeyAction = true; // Hack so the action don't react to the first keyup
        return cellActions[0]; // Focus on first cell action
    }

    __processKeyEscape({lockedAction}) {
        if (!lockedAction) {
            return false;
        }

        this._focusedAction = null;
        return true;
    }

    __processKeyTab({ev, cellActions, lockedAction}) {
        // In case focus is on locked sub-element, don't leave grid
        if (lockedAction) {
            const i = cellActions && cellActions.findIndex(el => el === this._focusedAction);
            const action = i >= 0 && (ev.shiftKey ? cellActions[i - 1] : cellActions[i + 1]);
            if (action) {
                return action;
            }

            // Leave grid-action group
            this._focusedAction = null;
            return true;
        }

        if (ev.shiftKey && this.shadowRoot.activeElement) {
            // Make sure focus leaves the core-grid
            delegateToPrev(this);
            return true;
        }

        return false;
    }

    __processKeyPageUp(arg) {
        return this.__processKeyPage(arg);
    }

    __processKeyPageDown(arg) {
        return this.__processKeyPage(arg);
    }

    __processKeyPage({ev, focusEl, isInHeader, isGridEmpty, lockedAction}) {
        if (lockedAction) {
            return false; // PageUp / PageDown cannot navigate focused action
        }

        if (isInHeader) {
            const fi = ev.key === 'PageUp' ? this.$.chunker.startIx : this.$.chunker.endIx;
            // Move focus from header to table
            return isGridEmpty ? false : this.__retainColumnFocus(focusEl, () => this.$.chunker.setFocusRowIndex(fi));
        }

        const fi = this.$.chunker.focusedItemIndex;

        const focusEl2 = this.__retainColumnFocus(focusEl, () => this.$.chunker._keyDown(ev, true));

        if (fi === this.$.chunker.focusedItemIndex) {
            //  PageUp / PageDown stayed on same element - so we need a hack to show the tooltip
            this._closeTooltip();
            if (this._getFocus()) {
                this.__tooltipEl = this._getFocus();
                this._tooltipEnter(this.__tooltipEl, undefined, undefined, undefined, {showAnyway: true});
            }
        }

        return focusEl2;
    }

    /* Handle action with grid-action='enter': move focus to next action or back to cell level */
    _keyUp(ev) {
        if (ev.defaultPrevented || ev.key !== 'Enter' || !this._focusedAction) {
            return;
        }

        /* Is this the keyup of the Enter-keydown that moved focus into the cell? If so, ignore */
        if (this.__enterKeyAction) {
            this.__enterKeyAction = false;
            return;
        }

        // User pressed Enter on an action. Is it an 'enter' action?
        const ga = this._focusedAction && this._focusedAction.getAttribute('grid-action');
        if (ga && ga.split(' ').indexOf('enter') >= 0) {
            const cellActions = this._focusedCell && this._cellActions(this._focusedCell);
            const i = cellActions && cellActions.findIndex(el => el === this._focusedAction);
            // Go to next action, if any, otherwise move focus to the cell
            this._focusedAction = cellActions && cellActions[i + 1];
            ev.preventDefault();
        }
    }

    _toggleFocusedRow() {
        const state = this.data.subTree(this._focusedRow.index);
        if (state !== undefined) {
            const toggle = this._focusedCell.querySelector('[part~=tree-toggle-icon]');
            if (toggle && toggle._$activateToggle) {
                toggle._$activateToggle(); // Animate toggle
                return true;
            }
        }
        return false;
    }

    _rowIndexFromPoint(x, y) {
        const el = this.shadowRoot.elementFromPoint(x, y);
        const row = el && el.closest('[part~=row]');
        return row && row.index;
    }

    _setHoverSibling(index) {
        if (this.__oldHoverRow) {
            this.__oldHoverRow.removeAttribute('next-row-hovers');
        }
        this.__oldHoverRow = this.$.chunker.getRow(index - 1);
        if (this.__oldHoverRow) {
            this.__oldHoverRow.setAttribute('next-row-hovers', '');
        }
    }

    get _hoverRow() {
        return this._$hoverRow;
    }

    set _hoverRow(row) {
        if (row && this._$hoverRow) {
            if (row.index !== this._$hoverRow.index) {
                this._setHoverSibling(row.index);
            }
        } else if (row) {
            this._setHoverSibling(row.index);
            // Need to update hover state if grid scrolls with fixed mouse position (e.g wheel scrolling)
            this.__hoverRowIID = setInterval(() => {
                const index = this._rowIndexFromPoint(this._$hoverRow.x, this._$hoverRow.y);
                if (index !== this._$hoverRow.index) {
                    this._$hoverRow.index = index;
                    this._setHoverSibling(index);
                }
            }, 250);
        } else {
            this._setHoverSibling(-1);
            clearInterval(this.__hoverRowIID);
        }
        this._$hoverRow = row;
    }

    get _pressedRow() {
        return this._$pressedRow;
    }

    set _pressedRow(row) {
        if (this._$pressedRow === row) {
            return;
        }
        if (this.__oldPressedPrevRow) {
            this.__oldPressedPrevRow.removeAttribute('next-row-pressed');
        }
        this.__oldPressedPrevRow = row > 0 && this.$.chunker.getRow(row - 1);
        if (this.__oldPressedPrevRow) {
            this.__oldPressedPrevRow.setAttribute('next-row-pressed', '');
        }
        this._$pressedRow = row;
    }

    _mouseOverGrid(ev) {
        this._hoverRow = {index: this._rowIndexFromPoint(ev.x, ev.y), x: ev.x, y: ev.y};
        if (this._pressedRow >= 0 && this._pressedRow !== this._hoverRow.index) {
            this._pressedRow = -1;
        }
    }

    _mouseLeaveGrid() {
        this._hoverRow = undefined;
        this._pressedRow = -1;
    }

    _mouseDownOnGrid(ev) {
        if (PTCS.wrongMouseButton(ev)) {
            return;
        }
        this._pressedRow = this._rowIndexFromPoint(ev.x, ev.y);
        this._unbadgeNewRow(ev.target);
    }

    _mouseUpOnGrid(ev) {
        if (PTCS.wrongMouseButton(ev)) {
            return;
        }
        this._pressedRow = -1;
    }

    _gapChanged(_gap) {
        const h0 = this.clientHeight;
        if (_gap > 0) {
            this.setAttribute('gap', ''); // Tell theme engine there is a gap
            // Reduce grid height so gap is removed
            this.style.setProperty('--ptcs-core-grid-height', `${(this.offsetHeight - Math.min(this.$.chunker.viewportHeight, _gap))}px`);
        } else {
            this.removeAttribute('gap'); // Tell theme engine there is no gap
            if (_gap < 0) {
                // Don't reduce height if scrollbar is visible. Let the grid grow
                this.style.removeProperty('--ptcs-core-grid-height');
            }
        }
        const h1 = this.clientHeight;
        if (h0 !== h1) {
            // Avoid browser flashing by immediatly processing the new height (make the scroller fit without ever showing an incorrect height)
            this.$.chunker.resized();
        }
    }

    _highlightNewRowsChanged() {
        // Need a full rebuild and empty the recycled elements.
        this.dvChanged();
    }

    _isItemUpdated(baseIndex, field) {
        const updated = this.data.updatedBaseItem(baseIndex);
        if (!updated) {
            return false;
        }
        const item = this.data.baseItem(baseIndex);
        if (!item) {
            return false;
        }
        if (field) {
            return updated.hasOwnProperty(field) && updated[field] !== item[field];
        }
        for (const f in updated) {
            if (item.hasOwnProperty(f) && updated[f] !== item[f]) {
                return true;
            }
        }
        return false;
    }

    _editActivated(ev) {
        if (PTCS.wrongMouseButton(ev) || ev.target.disabled) {
            return;
        }

        // Find column that contains the edit control
        const cell = ev.target.closest('[part~=body-cell]');
        const colNo = PTCS.getChildIndex(cell);
        const colDef = this._getVisibleColDef(colNo);
        if (!colDef) {
            return;
        }
        const baseIndex = this.data.baseIndex(cell.parentNode.index);
        if (baseIndex === -1) {
            return; // This row is not editable (bug?)
        }

        const item = this.data.baseItem(baseIndex);

        // In "row" edit mode, the user has clicked on a column that don't specify editable field.
        // Therefore the launced editor becomes a row editor
        const field = colDef.editable;

        this._launchEditor(baseIndex, item, field, colNo, cell, this.rowEditFormTitle, this.updateButtonText);
    }

    _launchEditor(baseIndex, item, field, colNo, cellEl, title, updateButtonText, parentBaseIndex) {
        // Create inline editor (only once)
        if (!this._gridEditor) {
            this._gridEditor = document.createElement('ptcs-edit-grid-cells');
            this._gridEditor.setAttribute('part', 'grid-edit-cells');
            this._gridEditor.setAttribute('tabindex', '-1');
            this._gridEditor.style.position = 'absolute';
            this._gridEditor.style.left = '0px';
            this._gridEditor.style.top = '0px';
            this._gridEditor.addEventListener('close', this._editDone.bind(this));
            this._gridEditor.addEventListener('blur', this._closeEditByBlur.bind(this));
        }

        // Updated data (need validation messages)
        const updated = this.data.updatedBaseItem(baseIndex);

        // Compute parent label
        const parentItem = this.data.isTreeGrid && parentBaseIndex >= 0 && this.data.baseItem(parentBaseIndex);
        const rows = (parentItem && this.view) && this.view.getRowDef(parentItem);
        const col = rows && rows.find(def => !def.hidden && def.treeToggle);
        const theParentLabel = parentItem ? (col && (col.select(parentItem) || '')) : (this.data.isTreeGrid && null);

        // Assign data to editor
        this._gridEditor.setProperties({
            label:   title,
            columns: this.view.columns.filter(_item => !_item.hidden),
            field,
            item,
            baseIndex,
            colNo,
            parentBaseIndex,
            theParentLabel,

            // Validation setup
            validation:             updated && updated.$validation,
            hideValidationError:    this.hideValidationError,
            hideValidationCriteria: this.hideValidationCriteria,
            hideValidationSuccess:  this.hideValidationSuccess,
            validationErrorIcon:    this.validationErrorIcon,
            validationSuccessIcon:  this.validationSuccessIcon,
            validationCriteriaIcon: this.validationCriteriaIcon,
        });

        // Add / Update button
        if (updateButtonText) {
            this._gridEditor.updateButtonText = updateButtonText;
        }

        // Other labels (not context sensitive)
        ['cancelButtonText', 'dateLabel', 'monthLabel', 'yearLabel', 'hoursLabel', 'minutesLabel', 'secondsLabel', 'meridiemLabel', 'selectLabel',
            'cancelLabel', 'parentLabel', 'noParentLabel'].forEach(label => {
            if (this[label]) {
                this._gridEditor[label] = this[label];
            }
        });


        // Component id, if specified
        if (this.externalComponentId) {
            this._gridEditor.setAttribute('id', this.externalComponentId);
        }

        // Open inline editor
        this.setAttribute('modal', '');
        document.body.appendChild(this._gridEditor);
        this._gridEditor.style.display = 'none';
        setTimeout(() => {
            this._gridEditor.style.display = '';
            this._placeEditor(cellEl); // Put the editor at the correct place
            // Move focus to (first) editable item
            requestAnimationFrame(() => this._gridEditor.initFocus());
        }, 200);
        this.__closeEdit = this._closeEditByOutsideClick.bind(this);
        window.addEventListener('mousedown', this.__closeEdit);

        // Inform client if the editing of this data just started
        if (!this._isItemUpdated(baseIndex, field)) {
            this.dispatchEvent(new CustomEvent('edit-item-started', {bubbles: true, composed: true, detail: {baseIndex, field, item}}));
        }
    }

    _validationErrorIconChanged(validationErrorIcon) {
        const iconElement = this.shadowRoot.querySelectorAll('[part=invalid-icon]');
        iconElement.forEach(elem => {
            elem.icon = validationErrorIcon || defaultErrorIcon;
        });
    }

    _placeEditor(cell) {
        const body = document.body;
        const docEl = document.documentElement;
        const scrollTop = window.pageYOffset || docEl.scrollTop || body.scrollTop;
        const scrollLeft = window.pageXOffset || docEl.scrollLeft || body.scrollLeft;
        const clientTop = docEl.clientTop || body.clientTop || 0;
        const clientLeft = docEl.clientLeft || body.clientLeft || 0;
        const bb = this._gridEditor.getBoundingClientRect();

        // Arbitrary: leave at least 8px between left and top sides of browser window
        const minX = scrollLeft + 8;
        const minY = scrollTop + 8;

        // Arbitrary: leave at least 16px between right and bottom sides of browser window
        const maxX = scrollLeft + window.innerWidth - bb.width - 16;
        const maxY = scrollTop + window.innerHeight - bb.height - 16;

        // Prefered position
        let x, y;

        if (this._gridEditor.field) {
            // Cell editing
            const bbCell = cell.getBoundingClientRect();
            const cs = getComputedStyle(this._gridEditor);
            const dx = PTCS.cssDecodeSize(cs.getPropertyValue('--ptcs-offset-x'), this._gridEditor);
            const dy = PTCS.cssDecodeSize(cs.getPropertyValue('--ptcs-offset-y'), this._gridEditor, true);

            x = bbCell.left + (isNaN(dx) ? 0 : dx) + scrollLeft - clientLeft;
            y = bbCell.top + (isNaN(dy) ? 0 : dy) + scrollTop - clientTop;

        } else {
            // Row editing
            const bbGrid = this.getBoundingClientRect();

            x = bbGrid.right - (bb.right - bb.left) + scrollLeft - clientLeft;
            y = bbGrid.top + scrollTop - clientTop;
        }

        this._gridEditor.style.transform = `translate(${Math.max(Math.min(x, maxX), minX)}px, ${Math.max(Math.min(y, maxY), minY)}px)`;
    }

    _adjustEditorPlace() {
        if (!this.__closeEdit) {
            return; // Editor is not open
        }
        const row = this.$.chunker.getRow(this.data.translateBaseIndexToIndex(this._gridEditor.baseIndex));
        const cell = row && row.children[this._gridEditor.colNo];

        // Is cell visible or are we creating a new row?
        if (cell || this._gridEditor.baseIndex === newRowBaseIndex) {
            this._placeEditor(cell);
        } else {
            this._gridEditor.update();
        }
    }

    _closeEditByBlur() {
        requestAnimationFrame(() => {
            if (!this.__closeEdit) {
                return; // Already detached
            }
            if (document.activeElement.matches('ptcs-datepicker-calendar, ptcs-list[is-dropdown]')) {
                return; // Ignore this blur event. It is (probably) part of the inline editing process
            }
            this._gridEditor.update();
        });
    }

    _closeEditByOutsideClick(ev) {
        if (PTCS.wrongMouseButton(ev)) {
            return;
        }
        if (ev.target.matches('ptcs-edit-grid-cells, ptcs-datepicker-calendar, ptcs-list[is-dropdown]')) {
            return; // Ignore this click. It is (probably) part of the inline editing process
        }
        this._gridEditor.update();
    }

    _editDone(ev, focus) {
        if (!this.__closeEdit) {
            return; // Already closed
        }

        const {baseIndex, item, field, parentBaseIndex} = this._gridEditor;

        // Close editor and return focus to grid
        window.removeEventListener('mousedown', this.__closeEdit);
        this.__closeEdit = undefined;
        document.body.removeChild(this._gridEditor);
        this.removeAttribute('modal');
        if (focus !== false) {
            requestAnimationFrame(() => this.focus());
        }

        // Get update that should be applied to data manager
        const update = ev.detail && ev.detail.values;
        if (!update) {
            if (!this._isItemUpdated(baseIndex, field)) {
                // Update client about cancelled change
                this.dispatchEvent(new CustomEvent('edit-item-cancelled', {
                    bubbles:  true,
                    composed: true,
                    detail:   {baseIndex, field, item}}));
            }
            return;
        }

        // Apply the requested update
        this._applyEditUpdate(baseIndex, item, field, update, ev.detail.validation, parentBaseIndex);
    }

    async _applyEditUpdate(baseIndex, item, field, update, validation, parentBaseIndex) {
        // Adding a new row?
        if (baseIndex === newRowBaseIndex) {
            // Adding first item? If so, the empty message must be removed first
            if (this.data.length === 0 && this.$.chunker.numItems === 1) {
                this.$.chunker.numItems = 0;
            }
            const newItem = Object.assign({}, item, update);
            if (this.highlightNewRows) {
                this._newRows.add(newItem); // Add in advance, so it is available when grid renders new item
            }

            // Clear filter and resort
            this.dispatchEvent(new CustomEvent('new-row'));
            this.data.filter = null;

            const index = await this.__insertGridRow(newItem, validation, parentBaseIndex);
            if (!(index >= 0)) {
                console.error('internal error');
                return;
            }

            // Now we can get the new items baseIndex
            baseIndex = this.data.baseIndex(index);

            setTimeout(() => {
                // Focus on new item and scroll it into view (why so complex? translateBaseIndexToIndex can be expensive)
                this.$.chunker.setFocusRowIndex(this.data.baseIndex(index) === baseIndex ? index : this.data.translateBaseIndexToIndex(baseIndex));
            }, 300);

        } else {
            const index = this.data.translateBaseIndexToIndex(baseIndex);
            if (item !== this.data.item(index)) {
                console.error('data item has changed during editing');
                return;
            }

            this.data.updateItem(index, update, validation);
        }

        // Event that goes off whenever the user edits an item
        this.dispatchEvent(new CustomEvent('edit-item', {bubbles: true, composed: true, detail: {baseIndex, update, validation}}));

        // Get all changes to item before we try to submit them. Note: this returns the original values
        const itemUpdated = PTCS.clone(this.data.updatedBaseItem(baseIndex));

        // Submit change?
        switch (this.view.editLevel) {
            case 'cell':
            case 'row':
                this.data.submitIfValid(baseIndex, field);
        }

        // NOTE: if _isItemUpdated(...) returns false, then all changes was submitted in the previous step.
        //       Otherwise there are validation errors.
        if (!this._isItemUpdated(baseIndex, field) && itemUpdated) {
            // Remove unwanted property
            delete itemUpdated.$validation;
        }

        // Inform client about submitted change! regardless validation status - aligned to legacy grid behaviors
        this.dispatchEvent(new CustomEvent('edit-item-completed', {
            bubbles:  true,
            composed: true,
            detail:   {baseIndex, field, item, original: itemUpdated}}));
    }

    async __insertGridRow(item, validation, parentBaseIndex) {
        const data = this.data;

        if (parentBaseIndex >= 0) {
            const f = () => {
                switch (data.toggleState(parentBaseIndex)) {
                    case -1:
                        return -1;

                    case false:
                        // Has hidden children
                        data.subTree(data.translateBaseIndexToIndex(parentBaseIndex), true);
                        return data.insertTreeItem(item, data.childRange(parentBaseIndex)[1], 'after', validation);

                    case true:
                        // Has visible children
                        return data.insertTreeItem(item, data.childRange(parentBaseIndex)[1], 'after', validation);

                    case undefined:
                        // Has not children (leaf)
                        return data.insertTreeItem(item, parentBaseIndex, 'child', validation);

                    case null:
                        data.subTree(data.translateBaseIndexToIndex(parentBaseIndex), true);
                        break;
                }
                return undefined;
            };

            // Poll toggle until we have a result
            const fwait = resolve => {
                requestAnimationFrame(() => {
                    const index = f();
                    if (index !== undefined) {
                        resolve(index);
                    } else {
                        fwait(resolve);
                    }
                });
            };

            const index = f();
            return index !== undefined ? index : new Promise(fwait);
        }

        return data.insertItem(item, undefined, validation);
    }

    // Add new row. Start from (optional) item0
    addRow(item) {
        const _item = Object.assign({}, item || {});
        const selected = this.data.isTreeGrid && this.data.selected;
        const bi  = Array.isArray(selected) ? (selected.length === 1 && selected[0]) : (typeof selected === 'number' && selected);
        const parentBaseIndex = bi !== false ? bi : undefined;
        this._launchEditor(newRowBaseIndex, _item, undefined, -1, null, this.rowEditFormAddTitle, this.addButtonText, parentBaseIndex);
    }
};

customElements.define(PTCS.CoreGrid.is, PTCS.CoreGrid);
