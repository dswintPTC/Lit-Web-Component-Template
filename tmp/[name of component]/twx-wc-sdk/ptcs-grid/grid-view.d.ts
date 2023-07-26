import {DataManager} from './grid-data';

export type ColumnConfig = {
    // Column header: label or function that creates header element: Default: ''
    label?: string | (() => Element);

    // Extracts column value from data item. Field name or function
    value: string | ((item: any, index: number, dataManager: DataManager) => any);

    // Data type of value
    baseType: string;

    // Compares column entries
    compare?: (item1: any, item2: any) => number;

    // Pixel value or unit value: Default '1fr'
    width?: number | string;

    // Minium width. Default: 0
    minWidth?: number | string;

    // Horizontal alignment: 'left' || 'center' || 'right'. Default: 'left'
    halign?: string;

    // Vertical alignment: 'top || 'center' || 'bottom'. Default: 'top'
    valign?: string;

    // Header horizontal alignment: 'left' || 'center' || 'right'. Default: 'left'.
    headerHAlign?: string;

    // Header Vertical alignment: 'top || 'center' || 'bottom'. Default: 'top'
    headerVAlign?: string;

    // Maximum height. Default: no limit
    maxHeight?: number | string;

    // Can column be resized? Default: false
    resizable?: boolean;

    // Is column sortable? Default: false
    sortable?: boolean;

    // Is cell editable? Default: false
    editable?: boolean;

    // Is cell a tree grid toggle? Default: false
    treeToggle?: boolean;

    // Specifies a field name that the grid uses to bind state formatting to the row.
    rowDepField?: string;

    // baseType specific parameters
    config?: any;
}

export type RowConfig = {
    // Create a cell element
    create: (cell: Element) => Element;

    // Assign value to an element created by create() [above]
    assign: (cellElement: Element, value: any, index: number, dataManager: DataManager) => void;

    // Select | Unselect | Toggle an item
    select: (baseIndex: number, _select?: boolean) => void;

    // Column width
    width?: string;

    // Column minmum width
    minWidth?: string;

    // Horizontal alignment: 'left' || 'center' || 'right'
    halign?: string;

    // Vertical alignment: 'top || 'center' || 'bottom'
    valign?: string;

    // Row max height
    maxHeight?: string;

    // Should column be resizable?
    resizable?: boolean;

    // Basetype
    type: string;
}

export type ViewOptions = {
    // Initialize selectMethod
    selectMethod?: null | string; // null || 'single' || 'multiple'

    // Display header rows as single Line?
    singleLineHeader?: boolean;

    // Display grid rows as single Line?
    singleLineRows?: boolean;

    // Maximum header height
    maxHeightHeader?: string | number;

    // Maximum row height
    maxHeightRow?: string | number;

    // Minimum row height
    minHeightRow?: string | number;

    // Show row numbers?
    showRowNumbers?: boolean;

    // Specify grid editing level: 'cell', 'row', 'grid'
    editLevel?: string;

    // Set edit control: 'icon' (default), 'link', 'none'
    editControl?: string;

    // Edit control link label or icon
    editControlValue?: string;

    // When to show the edit control: 'hover' (default), 'always', 'never'
    editControlVisibility?: string;

    // Vertical alignment of header row: 'top' (default), 'center', 'bottom'
    headerVerticalAlignment?: string;

    // Vertical alignment of body rows: 'top' (default), 'center', 'bottom'
    rowsVerticalAlignment?: string;

    // Should the selection column have a sort button?
    sortSelectionColumn?: boolean;

    // Hide the tree grid tree toggle?
    hideTreeToggle?: boolean;

    // Add "delete row" button?
    canDelete?: boolean;
}

export class DataViewer {
    constructor(columns?: ColumnConfig[], options?: ViewOptions);

    // Observe changes
    observe(cbObj: any): void;

    // Unobserve changes
    unobserve(cbObj: any): void;

    // Set column specification
    set columnsDef(_columnsDef: ColumnConfig[]);

    // Selection column allows sorting?
    set sortSelectionColumn(sortSelectionColumn: boolean);

    // Internal sort function is really applied or an external sort is used?
    set externalSort(externalSort: boolean);

    // Get the current sort expression based on column names and sort orders
    getSortExpression(): any;

    // Apply sort expression on the grid.
    // Set opt.noOrder to true to reset only the sort icons.
    // Set opt.reset to true to reset current sort order.
    setSortExpression(expr: string, dataManager: object, opt: object): any;

    // Display header rows as single Line?
    set singleLineHeader(_singleLineHeader: boolean);

    // Show row numbers?
    set showRowNumbers(_showRowNumbers: boolean);

    // Specify grid editing level: 'cell', 'row', 'grid'
    set editLevel(_editLevel: string | undefined);

    // Set edit control: 'icon', 'link', 'none'
    set editControl(_editControl: string | undefined);

    // Set edit control link label or icon
    set editControlValue(_editControlValue: string | undefined);

    // Set edit control visibility: 'hover', 'always', 'never'
    set editControlVisibility(_editControlVisibility: string | undefined);

    // Set maximum header height
    set maxHeightHeader(_maxHeightHeader: string | number | undefined);

    // Set maximum row height
    set maxHeightRow(_maxHeightRow: string | number | undefined);

    // Set minimum row height
    set minHeightRow(_minHeightRow: string | number | undefined);

    // Set vertical alignment of header row: 'top' (default), 'center', 'bottom'
    set headerVerticalAlignment(_headerVerticalAlignment: string | undefined);

    // Set vertical alignment of body rows: 'top' (default), 'center', 'bottom'
    set rowsVerticalAlignment(_rowsVerticalAlignment: string | undefined);

    // Support deletions: add a delete button column
    get canDelete(): boolean;
    set canDelete(_canDelete: boolean);

    // Hide the tree grid tree toggle?
    set hideTreeToggle(_hideTreeToggle: boolean | undefined);

    // Support selections: add a select button column
    get selectMethod(): null | undefined | string; // Actual: 'none' || 'single' || 'multiple'
    set selectMethod(method: null | undefined | string);

    // Specifies a field name that the grid uses to bind state formatting to the row.
    set rowDepField(_rowDepField: string | undefined);

    // Get the current columns order
    getOrderExpression(): any;

    // Get the current widths expression based on column names and widths
    getWidthsExpression(): any;

    // Get the current visibility expression based on column names and its hidden property
    getVisibilityExpression(): any;

    // Create edit control element
    createEditControl(): Element | null;

    /*
     * Only intended for ptcs-core-grid
     */

    // Get columns configuration
    get columns(): ColumnConfig[] | null;

    // Get rows configuration
    getRowDef(item: any): RowConfig | null;
}
