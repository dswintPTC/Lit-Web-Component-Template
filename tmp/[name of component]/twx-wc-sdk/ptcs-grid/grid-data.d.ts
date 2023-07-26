export class DataManager {
    // Create with initial data, if any
    constructor(items?: any[]);

    // observe changes
    observe(cbObj: any): void;

    // unobserve changes
    unobserve(cbObj: any): void;

    // Change data
    set items(_items: any[]);

    // Size of data
    get length(): number;

    // Size of base data
    get baseLength(): number;

    // Get data item
    item(index: number): any;

    // Get item from base data
    baseItem(baseIndex: number): any;

    // Translate index to base index
    baseIndex(index: number): number;

    // Find tree depth of item / index
    treeLevel(index: number): number;

    // treeLevel for baseIndex
    baseLevel(baseIndex: number): number;

    // Get baseIndex of parent
    treeParent(baseIndex: number): number;

    // Update data item. update contains the fields that should be changed
    updateItem(index: number, update: any, validation?: any): void;

    // Insert data item. Return new index of item (in current projection)
    insertItem(item: any, baseIndex: number, validation?: any): number;

    // Remove data item
    deleteItem(index: number): void;

    // Remove multiple data items
    deleteBaseItems(baseIndexes: number[]): void;

    // Quick test if an item is selected
    isSelected(index: number): boolean;

    // Test if an item is selected, as alternative to data.isSelected(data.translateBaseIndexToIndex(baseIndex))
    isSelectedBaseIndex(baseIndex: number): boolean;

    // Translate baseIndex to view index. Slow if there is an active projection.
    translateBaseIndexToIndex(baseIndex: number): number;

    // Set default sort function
    set defaultSort(_defaultSort: (a: any, b: any) => number);

    // Apply default sort
    applyDefaultSort(): void;

    // Set sort function
    set sort(_sort: (a: any, b: any) => number);

    // Set filter function
    set filter(_filter: (item: any, index: number) => boolean);

    // Set grouping function
    set group(_group: (item: any, index: number) => string);

    // Load sub nodes of item
    set subItems(_subItems: (item: any, baseIndex: number) => any[] | Promise<any> | null | undefined);

    // subItemsState returns sub-item state of item:
    // - true: has visible sub-items
    // - false: has hidden sub-items
    // - undefined: is leaf item (no sub-items)
    // - null: unknown - need to check (i.e. call subItems)
    set subItemsState(_subItemsState: (item: any, baseIndex: number) => true | false | undefined | null);

    // Collapse (close) all sub-nodes: only show top-level nodes
    collapseAll() : void;

    // Show all nodes, on every level
    expandAll(): void;

    // 'collapsed': only top-level nodes are visible, 'expanded': all nodes are visible, 'partial': some sub-nodes are visible, but not all
    get expandState(): string;

    // Reset both filtering, sorting and grouping
    // Avoid doing it in three separate steps, because it forces a projection remaps
    resetView(): void;

    // selectMethod: 'none' || 'single' || 'multiple'
    get selectMethod(): string;
    set selectMethod(method: string);

    // Current selection - calls setSelected(_selected)
    get selected(): null | number | number[];
    set selected(_selected: null | number | number[]);

    // Set current selection, set direct or non direct selection
    setSelected(_selected: null | number | number[], directSelection?: boolean) : void;

    // Individually select / unselect items
    select(baseIndex: number, selected?: boolean, directSelection?: boolean): void;

    // Select All Items
    selectAllItems(directSelection?: boolean) : void;

    // unselect All Items
    unselectAllItems(directSelection?: boolean) : void;

    // Were rows directly selected
    get directSelection(): boolean;

    // Turn on / off record keeping of updated items
    traceUpdates(enable?: boolean): void;

    // Get update record for item, if any
    updatedItem(index: number): any;

    // Get update record for item, if any
    updatedBaseItem(baseIndex: number): any;

    // Are all changes valid?
    get isValid(): boolean;

    // Submit record / field of it is valid
    submitIfValid(baseIndex: number, field?: string): void;

    // Get all valid edited items for 'cell' or 'row' level
    getEditedItems(level: string): any[] | null;

    // Get changed items
    get changedItems(): any[] | null;

    // Get deleted items
    get deletedItems(): any[] | null;

    // Get inserted items
    get insertedItems(): any[] | null;

    // Rollback all updated items
    rollbackUpdates(): void;

    // Commit all updated items
    commitUpdates(): void;
}
