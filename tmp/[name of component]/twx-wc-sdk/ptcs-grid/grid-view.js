// INPUT: columns: Array of
// {
//    label:     string || function   // Creates column header: label or function that creates an element: Default: ''
//    value:     field  || function   // Extracts column value from data item. Field name or function(item, index, dataManager). Required
//    baseType                        // Data type of value. Required
//    width:     number || `${number}${unit}`   // Pixel value or unit value: fr for adaptive widths. Default '1fr'
//    minWidth:  number                         // Minium width. Default: 0
//    maxWidth:  number                         // Maximum width. Default: unspecified
//    halign:    'left' || 'center' || 'right'  // Horizontal alignment. Default: 'left'
//    valign:    'top || 'center' || 'bottom'   // Vertical alignment. Default: 'top'
//    resizable: boolean                        // Can column be resized? Default: false
//    editable:  boolean || field name          // Can column values be edited? Default: false
//    sortable:  boolean                        // Add a sort icon in the header label?
//    config:    object                         // baseType specific parameters. See below
// }

// NOTE: The value property must return a value that consistent with the specified baseType
//       Example: a numeric property may not return a string or an object

// The config parameter:
//----------------------
// All types:
//   - editable (copied from column definition): must be handled by the type
//   - cellMarker(cellElement): put marks on the cell that contains the UI control: handled automatically
//   - format(item, index): returns a value that is sent to the cell renderer. The type must be supported by the render.
//
// DATETIME:
//   - locales: locales argument to Intl.DateTimeFormat([locales[, options]])
//   - options: options argument to Intl.DateTimeFormat([locales[, options]])
//
// IMAGELINK:
//   - size:     image size (see ptcs-image)
//   - position: image position (see ptcs-image)
//
// NUMBER:
//   - locales: locales argument to Intl.NumberFormat([locales[, options]])
//   - options: options argument to Intl.NumberFormat([locales[, options]])
//
// STRING:
//   - enum: list of choices (for editing)
//
import {PTCS} from 'ptcs-library/library.js';

// Create header elements
import {headerCreatorFunc} from './grid-view/gv-header';

// UI controls for types
import {uiBoolean} from './grid-view/gv-boolean';
import {uiString} from './grid-view/gv-string';
import {uiText} from './grid-view/gv-text';
import {uiNumber} from './grid-view/gv-number';
import {uiDatetime} from './grid-view/gv-datetime';
import {uiImagelink} from './grid-view/gv-imagelink';
import {uiHyperlink} from './grid-view/gv-hyperlink';
import {uiHtml} from './grid-view/gv-html';
import {uiFallback} from './grid-view/gv-fallback';
import {uiSelect, selectCreatorFunc} from './grid-view/gv-select';
import {uiDelete} from './grid-view/gv-delete-button';
/*********************************************************************
 * DRAG-AND-DROP-GRID-ROWS
 *********************************************************************
import {uiDrag} from './grid-view/gv-drag';
**********************************************************************/
import {uiGrouping} from './grid-view/gv-grouping';
import {uiTreeToggle} from './grid-view/tree-toggle';


/* eslint-disable no-confusing-arrow, no-nested-ternary */

//
// Sorting
//
const compareBool = (a, b) => a ? (b ? 0 : -1) : (b ? 1 : 0); // true > false
const compareString = (a, b) => (a || '').localeCompare(b || '');
const compareDate = (a, b) => (a ? a.getTime() : 0) - (b ? b.getTime() : 0);

const _safeCompareString = (a, b) => compareString(typeof a === 'string' ? a : '', typeof b === 'string' ? b : '');
const compareNumber = (a, b) => {
    if (isNaN(a) || a === '') {
        return (b === '' || isNaN(b)) ? 0 : -1;
    }
    if (isNaN(b) || b === '') {
        return 1;
    }
    return a - b;
};

const compareLink = (a, b) => {
    if (!a || !b) {
        return compareBool(a, b);
    }
    if (typeof a === 'object' && typeof b === 'object') {
        return _safeCompareString(a.label, b.label) || _safeCompareString(a.href, b.href);
    }
    return _safeCompareString(a, b);
};

const emptyLoc = {elevation: 0, latitude: 0, longitude: 0};
const compareLoc = (a, b) => {
    if (typeof a === 'object' && typeof b === 'object') {
        if (!a) {
            a = emptyLoc;
        }
        if (!b) {
            b = emptyLoc;
        }
        return (a.latitude - b.latitude) || (a.longitude - b.longitude) || (a.elevation - b.elevation);
    }
    if (typeof a === 'string' && typeof b === 'string') {
        return compareString(a, b);
    }
    return 0; // Don't know how to compare
};

const compareType = {
    BASETYPENAME: compareString,
    BOOLEAN:      compareBool,
    DATETIME:     compareDate,
    HTML:         compareString, // or what?
    HYPERLINK:    compareLink,
    // IMAGE - compare image data?
    IMAGELINK:    compareLink,
    INTEGER:      compareNumber,
    LOCATION:     compareLoc,
    LONG:         compareNumber,
    NUMBER:       compareNumber,
    STRING:       compareString,
    TEXT:         compareString,
    THINGNAME:    compareString
};

//
// Mapping table
//
const uiMap = {
    BOOLEAN:      uiBoolean,
    DATETIME:     uiDatetime,
    HYPERLINK:    uiHyperlink,
    HTML:         uiHtml,
    IMAGE:        uiImagelink,
    IMAGELINK:    uiImagelink,
    INTEGER:      uiNumber,
    LONG:         uiNumber,
    NUMBER:       uiNumber,
    STRING:       uiString,
    TEXT:         uiText,
    // TWX TYPES
    BASETYPENAME: uiString,
    LOCATION:     uiString,
    XML:          uiText,
    JSON:         uiText,

    '#select': uiSelect,
    '#delete': uiDelete,
    /*********************************************************************
     * DRAG-AND-DROP-GRID-ROWS
     *********************************************************************
    '#drag':   uiDrag,
    **********************************************************************/
    '#group':  uiGrouping
};


function ui(type, config) {
    let uiControl = (uiMap[type] || uiFallback)(config);

    if (config && typeof config.cellMarker === 'function') {
        const create = uiControl.create;
        const cellMarker = config.cellMarker;
        uiControl = {
            create: cell => {
                cellMarker(cell);
                return create(cell);
            },

            assign: uiControl.assign
        };
    }

    return uiControl;
}


// Get index of item
function valueIndex(_, index) {
    return index + 1;
}

function typeValue(value) {
    switch (typeof value) {
        case 'string':
            return value === '#index' ? valueIndex : item => item[value];

        case 'function':
            return value;
    }
    throw new Error(`Unknown value accessor ${value}`);
}

function decodeSize(size) {
    const _size = size && PTCS.cssDecodeSize(size);
    return _size > 0 ? _size : undefined;
}

function editAction(ev) {
    if (PTCS.wrongMouseButton(ev)) {
        return;
    }
    ev.target.dispatchEvent(new CustomEvent('edit-activated', {bubbles: true}));
}

function editKeydown(ev) {
    if (ev.key === ' ' || ev.key === 'Enter') {
        ev.target.click();
    }
}

//
// The DataViewer
//
export class DataViewer {

    constructor(columnsDef, options) {
        this._observers = new Set(); // The observers
        this.columnsDef = columnsDef;
        this.selectMethod = options && options.selectMethod;
        this._canDelete = options && options.canDelete;
        this._rowDepField = options && options.rowDepField;
        this._singleLineHeader = options && options.singleLineHeader;
        this.maxHeightHeader = options && options.maxHeightHeader;
        this.maxHeightRow = options && options.maxHeightRow;
        this.minHeightRow = options && options.minHeightRow;
        this._singleLineRows = options && options.singleLineRows;
        this._showRowNumbers = options && options.showRowNumbers;
        this._editLevel = options && options.editLevel;
        this._editControl = options && options.editControl;
        this._editControlValue = options && options.editControlValue;
        this._editControlVisibility = (options && options.editControlVisibility) || 'hover';
        this._headerVerticalAlignment = (options && options.headerVerticalAlignment) || 'top';
        this._rowsVerticalAlignment = (options && options.rowsVerticalAlignment) || 'top';
        this._sortSelectionColumn = options && options.sortSelectionColumn;
        this._rowDataAccessor = [];
        this._externalSort = options && options.externalSort;
        this._hideTreeToggle = options && options.hideTreeToggle;
        this._dragRows = options && options.dragRows;

        // The group row
        const uiGrp = ui('#group');
        this._groupRow = [{
            create: uiGrp.create,
            assign: uiGrp.assign,
            select: item => item,
            valign: 'center'
        }];
    }

    // observe changes
    observe(cb) {
        this._observers.add(cb);
    }

    // unobserve changes
    unobserve(cb) {
        this._observers.delete(cb);
    }

    // Notify observers
    _msg(msg, ...arg) {
        this._observers.forEach(cb => {
            if (typeof cb[msg] === 'function') {
                cb[msg](...arg);
            }
        });
    }

    set sortSelectionColumn(_sortSelectionColumn) {
        if (this._sortSelectionColumn === _sortSelectionColumn) {
            return;
        }

        this._sortSelectionColumn = _sortSelectionColumn;

        this._rebuildRowDef();
    }

    get sortSelectionColumn() {
        return this._sortSelectionColumn;
    }

    set externalSort(_externalSort) {
        if (this._externalSort === _externalSort) {
            return;
        }

        this._externalSort = _externalSort;

        this._rebuildRowDef();
    }

    // Support header row single Line
    set singleLineHeader(_singleLineHeader) {
        if (this._singleLineHeader === _singleLineHeader) {
            return;
        }
        this._singleLineHeader = _singleLineHeader;
        this._rebuildRowDef();
    }

    // Support rows single Line
    set singleLineRows(_singleLineRows) {
        if (this._singleLineRows === _singleLineRows) {
            return;
        }
        this._singleLineRows = _singleLineRows;
        this._rebuildRowDef();
    }

    // Support rows numbers
    set showRowNumbers(_showRowNumbers) {
        if (this._showRowNumbers === _showRowNumbers) {
            return;
        }
        this._showRowNumbers = _showRowNumbers;
        this._rebuildRowDef();
    }

    get showRowNumbers() {
        return this._showRowNumbers;
    }

    // Support edit level
    set editLevel(_editLevel) {
        if (this._editLevel === _editLevel) {
            return;
        }
        this._editLevel = _editLevel;
        this._rebuildRowDef();
    }

    get editLevel() {
        return this._editLevel;
    }

    // Support edit control
    set editControl(_editControl) {
        if (this._editControl === _editControl) {
            return;
        }
        this._editControl = _editControl;
        this._rebuildRowDef();
    }

    get editControl() {
        return this._editControl;
    }

    // Set edit control value (icon name or link label)
    set editControlValue(_editControlValue) {
        if (this._editControlValue === _editControlValue) {
            return;
        }
        this._editControlValue = _editControlValue;
        this._rebuildRowDef();
    }

    get editControlValue() {
        return this._editControlValue;
    }

    // Set edit control visibility: 'hover', 'always', 'never'
    set editControlVisibility(_editControlVisibility) {
        if (this._editControlVisibility === _editControlVisibility) {
            return;
        }
        this._editControlVisibility = _editControlVisibility;
        this._rebuildRowDef();
    }

    get editControlVisibility() {
        return this._editControlVisibility;
    }

    // Support header row max-height
    set maxHeightHeader(_maxHeightHeader) {
        const h = decodeSize(_maxHeightHeader);
        if (this._maxHeightHeader !== h) {
            this._maxHeightHeader = h;
            this._rebuildRowDef();
        }
    }

    get maxHeightHeader() {
        return this._maxHeightHeader;
    }

    // Support row max-height
    set maxHeightRow(_maxHeightRow) {
        const h = decodeSize(_maxHeightRow);
        if (this._maxHeightRow !== h) {
            this._maxHeightRow = h;
            this._rebuildRowDef();
        }
    }

    get maxHeightRow() {
        return this._maxHeightRow;
    }

    // Support row min-height
    set minHeightRow(_minHeightRow) {
        const h = decodeSize(_minHeightRow);
        if (this._minHeightRow !== h) {
            this._minHeightRow = h;
            this._rebuildRowDef();
        }
    }

    get minHeightRow() {
        return this._minHeightRow;
    }

    // Support Header Vertical Alignment
    set headerVerticalAlignment(_headerVerticalAlignment) {
        if (this._headerVerticalAlignment !== _headerVerticalAlignment) {
            this._headerVerticalAlignment = _headerVerticalAlignment;
            this._rebuildRowDef();
        }
    }

    // Support Rows vertical alignment
    set rowsVerticalAlignment(_rowsVerticalAlignment) {
        if (this._rowsVerticalAlignment !== _rowsVerticalAlignment) {
            this._rowsVerticalAlignment = _rowsVerticalAlignment;
            this._rebuildRowDef();
        }
    }

    // Support deletions: add a delete button column
    set canDelete(_canDelete) {
        if (!!_canDelete === !!this._canDelete) {
            return;
        }
        this._canDelete = !!_canDelete;
        this._rebuildRowDef();
    }

    get canDelete() {
        return !!this._canDelete;
    }

    // Support rows numbers
    set hideTreeToggle(_hideTreeToggle) {
        if (!this._hideTreeToggle === !_hideTreeToggle) {
            return;
        }
        this._hideTreeToggle = _hideTreeToggle;
        this._rebuildRowDef();
    }

    get hideTreeToggle() {
        return this._hideTreeToggle;
    }

    /*********************************************************************
     * DRAG-AND-DROP-GRID-ROWS
     *********************************************************************
    set dragRows(_dragRows) {
        if (this._dragRows === _dragRows) {
            return;
        }
        this._dragRows = _dragRows;
        this._rebuildRowDef();
    }

    get dragRows() {
        return this._dragRows;
    }
    ***********************************************************************/

    // Support selections: add a select button column: 'single' || 'multiple'
    set selectMethod(_selectMethod) {
        const sm = (_selectMethod === 'single' || _selectMethod === 'multiple') ? _selectMethod : undefined;
        if (sm === this._selectMethod) {
            return;
        }
        this._selectMethod = sm;
        this._rebuildRowDef();
    }

    get selectMethod() {
        return this._selectMethod || 'none';
    }

    get rowDepField() {
        return this._rowDepField;
    }

    // Set column specification
    set columnsDef(_columnsDef) {
        if (_columnsDef === this._columnsDef) {
            return; // Just in case the same def are assigned several times ...
        }

        this._columnsDef = _columnsDef;
        this._rebuildRowDef();
    }

    get columnsDef() {
        return this._columnsDef;
    }

    _rebuildRowDef() {
        if (this.requestAnimationFrameId) {
            return;
        }

        this.requestAnimationFrameId = requestAnimationFrame(() => {
            this.requestAnimationFrameId = undefined;
            this.__rebuildSoon = false;
            if (this._columnsDef) {
                this._rebuildRowDefNow();
            } else {
                this._columns = null;
            }
            this._msg('dvChanged');
        });
    }

    updateSortFields(fieldName, {sortOrder, icon}) {
        const field = Array.isArray(this._sortFields) && this._sortFields.find(el => el.name === fieldName);
        if (field) {
            if (sortOrder) {
                field.sort = sortOrder;
            }

            if (icon) {
                field.icon = icon;
            }
        }
    }

    getOrderExpression() {
        let expr = this.columnsDef.reduce((acc, cur) => {
            return acc + `${cur.name || cur.label},`;
        }, '');

        return expr;
    }

    getVisibilityExpression() {
        let expr = this.columnsDef.reduce((acc, cur) => {
            return acc + `${cur.name || cur.label}:${!cur.hidden},`;
        }, '');

        return expr;
    }

    getWidthsExpression() {
        let expr = this.columnsDef.reduce((acc, cur) => {
            return acc + `${cur.name || cur.label}:${cur.width},`;
        }, '');

        return expr;
    }

    /*
     * Builds sort expression from the current sort orders
     */
    getSortExpression() {
        const reducer = (acc, cur) => {
            if (cur.sort === 'asc' || cur.sort === 'desc') {
                acc.short += `${cur.name}:${cur.sort},`;

                acc.full.push({
                    fieldName:   cur.name,
                    isAscending: cur.sort === 'asc'
                });
            }

            return acc;
        };

        let expr = {short: '', full: []};

        if (this._sortFields) {
            expr = this._sortFields.reduce(reducer, expr);

            expr.short = expr.short.slice(0, -1); // slice erases the last comma
        }

        return expr;
    }

    /*
     * Applies sort which was decoded from the provided sort expression like: "Title:desc,Col2:asc".
     */
    setSortExpression(expr, dm, opt) {
        if (!expr || !this._columnsDef) { // grid neither doesn't have any columns nor the expression is empty
            return;
        }

        opt = (typeof opt === 'boolean') ? {noOrder: opt} : opt || {}; // backward compatability

        const exprArr = expr.split(',');

        const doSort = () => {
            exprArr.forEach((s) => {
                const s2 = s.split(':');
                this.updateSortFields(s2[0], {sortOrder: opt.noOrder ? 'none' : s2[1]});
            });

            if (!this._externalSort) {
                const sortFunc = this.sortFunc();

                if (sortFunc === null) {
                    dm.applyDefaultSort();
                } else {
                    dm.sort = sortFunc;
                }
            }

            if (Array.isArray(this._sortFields)) {
                this._sortFields.forEach(field => {
                    if (field.icon) {
                        field.icon.sort.order = field.sort;
                        field.icon.dmSort(null, this._externalSort);
                    }
                });
            }
        };

        if (opt.reset) {
            dm.applyDefaultSort();
        }

        doSort();
    }

    sortFunc() {
        const sortFields = this._sortFields;

        const defaultSort = !Array.isArray(sortFields) || sortFields.every(e => e.sort === 'none');

        return defaultSort ? null
            : (a, b, i1, i2, dm) => {
                for (let sortField of sortFields) {
                    if (sortField.sort === 'none') {
                        continue;
                    }

                    const res = sortField.compare(sortField.select(a), sortField.select(b), i1, i2, dm);

                    if (res) {
                        return sortField.sort === 'asc' ? res : -res;
                    }
                }
                return 0;
            };
    }

    createEditControl() {
        if (this._editControl === 'none') {
            return null;
        }
        let el;
        if (this._editControl === 'link') {
            el = document.createElement('ptcs-link');
            el.label = this._editControlValue || 'edit';
            el.singleLine = true;
            el.setAttribute('is-link', ''); // Tell theme engine that this is alink
            el.noTabindex = true;
            if (this.editLevel === 'cell') {
                el.alignment = 'right';
            }
        } else {
            el = document.createElement('ptcs-icon');
            el.size = 'small';
            el.icon = this._editControlValue || 'cds:icon_edit';
            el.setAttribute('is-icon', ''); // Tell theme engine that this is an icon
            el.setAttribute('style-focus', ''); // Need help with focus styling
            el.addEventListener('keydown', editKeydown);
        }
        el.style.flex = '0 0 auto';
        el.setAttribute('part', 'edit-control');
        el.setAttribute('grid-action', '');
        el.setAttribute('tabindex', '-1');
        el.addEventListener('click', editAction);
        return el;
    }

    assignEditControl(/*el, item, index, dm*/) {
        // Do nothing
    }

    _rebuildRowDefNow() {
        console.assert(this._columnsDef);

        const _editable = (editable, fieldName, baseType) => {
            if (!editable) {
                return undefined;
            }
            if (baseType === 'INFOTABLE' || baseType === 'TAGS') {
                // These types should never be editable, whatever the config says
                return undefined;
            }
            if (typeof editable === 'string') {
                return editable;
            }
            return typeof fieldName === 'string' ? fieldName : undefined;
        };

        this._sortFields = [];

        const sort = 'none';

        this._columns = this._columnsDef.map(col => {
            const select = typeValue(col.value);
            let sortSelect = select;

            switch (col.baseType) {
                case 'DATETIME':
                    sortSelect = item => {
                        const v = select(item);

                        if (typeof v === 'string' && col.name) {
                            return item[col.name];
                        }

                        return v;
                    };
                    break;
            }

            const compare = col.compare || compareType[col.baseType];
            const editable = _editable(col.editable, col.value, col.baseType);
            const rowConfig = {
                maxHeightRow:   this._maxHeightRow !== undefined && this._maxHeightRow > 0 ? this._maxHeightRow : '',
                minHeightRow:   this._minHeightRow !== undefined && this._minHeightRow > 0 ? this._minHeightRow : '',
                singleLineRows: this._singleLineRows,
                halign:         col.halign,
                valign:         col.valign || this._rowsVerticalAlignment,
            };
            const locConfig = Object.assign(rowConfig, col.config);
            const _uiCol = col.$uiCtrl || ui(col.baseType, Object.assign({editable}, locConfig));
            const uiCol = col.treeToggle ? uiTreeToggle(_uiCol, {toggle: col.treeToggle, hideToggle: this._hideTreeToggle}) : _uiCol;

            const name = col.name || col.label;

            if (col.sortable) {
                this._sortFields.push({
                    name,
                    select: sortSelect,
                    compare,
                    sort
                });
            }

            return {
                name:      col.name,
                depcolumn: col.depcolumn,
                label:     headerCreatorFunc({
                    label:        col.label,
                    sortable:     col.sortable,
                    externalSort: this._externalSort,
                    compare,
                    singleLine:   this._singleLineHeader,
                    maxHeight:    this._maxHeightHeader ? this._maxHeightHeader : '',
                    hAlign:       col.headerHAlign,
                    vAlign:       col.valign || this._rowsVerticalAlignment,
                    minWidth:     col.minWidth,
                    maxWidth:     col.maxWidth,
                    name
                }),
                create:       uiCol.create,
                assign:       uiCol.assign,
                format:       uiCol.format,
                select,
                render:       locConfig.format,
                sortSelect,
                compare,
                width:        col.width,
                minWidth:     col.minWidth,
                maxWidth:     col.maxWidth,
                halign:       col.halign,
                valign:       col.valign || this._rowsVerticalAlignment,
                headerHAlign: col.headerHAlign,
                headerVAlign: col.headerVAlign || this._headerVerticalAlignment,
                resizable:    col.resizable,
                sortable:     col.sortable,
                type:         col.baseType,
                hidden:       !!col.hidden,
                treeToggle:   col.treeToggle,

                // Needed for inline editing
                editable,
                noRowEdit:          col.noRowEdit,
                title:              col.label,
                config:             col.config,
                validationFunction: col.validationFunction
            };
        });

        const sortSelection = (this._selectMethod === 'multiple' && this._sortSelectionColumn);

        if (sortSelection) {
            this._sortFields.unshift({
                name:         '#select',
                select:       () => {},
                compare:      (a, b, i1, i2, dm) => Number(dm.isSelectedBaseIndex(i1)) - Number(dm.isSelectedBaseIndex(i2)),
                sort,
                externalSort: this._externalSort
            });
        }

        if (this.editLevel === 'row' && this._editControlVisibility !== 'never') {
            this._columns.unshift({
                label:          '',
                create:         this.createEditControl.bind(this),
                assign:         this.assignEditControl,
                select:         item => item,
                width:          '52px',
                halign:         'center',
                valign:         this._rowsVerticalAlignment,
                nonresizable:   true,
                nonReorderable: true
            });
        }

        /*********************************************************************
         * DRAG-AND-DROP-GRID-ROWS
         *********************************************************************
        if (this._dragRows) {
            const _uiDrag = ui('#drag');
            this._columns.unshift({
                id:             'drag',
                create:         _uiDrag.create,
                assign:         _uiDrag.assign,
                select:         item => item,
                format:         null,
                width:          '36px',
                halign:         'center',
                valign:         this._rowsVerticalAlignment,
                headerHAlign:   'center',
                headerVAlign:   this._headerVerticalAlignment,
                nonReorderable: true
            });
        }
        ***********************************************************************/

        if (this._selectMethod === 'single' || this._selectMethod === 'multiple') {
            const uiSel = ui('#select', {selectMethod: this._selectMethod, showRowNumbers: this._showRowNumbers});
            this._columns.unshift({
                id:             'select',
                label:          selectCreatorFunc(this._selectMethod, this._singleLineHeader, this._maxHeightHeader, sortSelection),
                create:         uiSel.create,
                assign:         uiSel.assign,
                format:         null,
                select:         item => item,
                width:          `var(--ptcs-core-grid-selection-width,${sortSelection ? 66 : 34}px)`,
                halign:         sortSelection ? 'left' : 'center',
                valign:         this._rowsVerticalAlignment,
                headerHAlign:   sortSelection ? 'left' : 'center',
                headerVAlign:   this._headerVerticalAlignment,
                nonresizable:   true,
                nonReorderable: true
            });
        }

        if (this._showRowNumbers) {
            const uiRowNumber = ui('NUMBER', {selectMethod: this._selectMethod, showRowNumbers: this._showRowNumbers});
            this._columns.unshift({
                id:             'showRowNumbers',
                create:         uiRowNumber.create,
                assign:         uiRowNumber.assign,
                format:         null,
                select:         (item, index) => index + 1,
                width:          '51px',
                halign:         'left',
                valign:         this._rowsVerticalAlignment,
                nonReorderable: true
            });
        }

        if (this._canDelete) {
            const uiDel = ui('#delete');
            this._columns.push({
                id:             'delete',
                create:         uiDel.create,
                assign:         uiDel.assign,
                select:         item => item,
                format:         null,
                width:          '36px',
                halign:         'center',
                valign:         this._rowsVerticalAlignment,
                headerHAlign:   'center',
                headerVAlign:   this._headerVerticalAlignment,
                nonReorderable: true
            });
        }

        this._rebuildRowDataAccessor();
    }

    // Get columns configuration
    get columns() {
        return this._columns;
    }

    // Get rows configuration
    getRowDef(item) {
        return item.hasOwnProperty('$groupKey') ? this._groupRow : this._columns;
    }

    _rebuildRowDataAccessor() {
        this._rowDataAccessor = Array.isArray(this._columns)
            ? this._columns
                .filter(col => !col.hidden && col.format !== null)
                .map(col => {
                    const select = col.select;
                    const render = col.render;
                    const format = col.format;
                    if (typeof format === 'function') {
                        return (item, i, dataManager) => format(select(item, i, dataManager));
                    }
                    if (render) {
                        return (item, i, dataManager) => [`${render(item, i, dataManager)}`, `${select(item, i, dataManager)}`];
                    }
                    return select;
                })
            : [];
    }

    // Get values of row as an array of strings
    // Note: some values might be duplictated, but with different "formatting"
    getRowStrings(item, index, dataManager) {
        return item.hasOwnProperty('$groupKey')
            ? [item.$groupKey.toString()]
            : this._rowDataAccessor.reduce((a, f) => {
                const v = f(item, index, dataManager);
                if (typeof v === 'string') {
                    a.push(v); // Column produces a single string
                } else if (Array.isArray(v)) {
                    v.forEach(s => a.push(s)); // Column produces multiple strings
                } else if (v) {
                    a.push(v.toString());
                }
                return a;
            }, []);
    }
}
