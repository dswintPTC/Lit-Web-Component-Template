# ptcs-grid

## Overview

The `ptcs-grid` component displays data in tabular format. Each data item is represented by a grid row that contains one or more cells. You can customize the content of each cell. In a typical configuration, the data item is a JavaScript object and each cell corresponds to a field in that object. Additional objects types are also supported.

The grid component can manage large data sets that contain 100,000 data items. Larger data sets with up to one million data items were tested and are manageable, with some operations such as sorting taking more time.

### Data Manager

The grid component reads its data from a data manager, which is used to perform all operations on the data, such as:

- filtering,
- sorting,
- selections,
- grouping,
- hierarchical items (tree grid),
- creating, updating, deleting,
- exporting,
- lazy loading,

and more.

The data manager must provide information about the number of items it contains, and return any item when a request is sent.

If the data manager has dynamic content or dynamic views, it must send updates about any changes using change events. For example, the data manager must send a change event when data is filtered, sorted, or grouped.

### View Configurator

The grid displays each item using configurations from a view configurator.

The view configurator provides two types of view configurations:

- The _column header_, which defines the grid layout.
- _Row configurations_, which defines a row configuration for a specific data item. The row configuration defines the user interface controls that should be used for the various cells in the data row.

## Usage Examples

### Basic Usage

~~~js
<ptcs-grid data="[[dataMgr]]" view="[[viewCfg]]"></ptcs-grid>
~~~


## Component API

### Properties
| Property | Type | Description |
|----------|------|-------------|
|data      |_Data Manager_| Specifies the data manager. Refer to the detailed section about the data manager below. |
|disabled  |Boolean| Disables the grid |
|disableRow|Function or String| A function that specifies if a row should be disabled. The function is called as `disableRow(item, baseIndex, dataManager)`. If the function returns `true`, the row that corresponds to the item is disabled. As syntactic sugar, `disableRow` can also be supplied as a string. In that case the grid creates the following function: `item => item[disableRow]`. That is, if `disableRow` is a string it specifies a field in the row object that in turn specifies if the item is disabled or not.|
|filterHintText|String| The hint text to display in the quick filter box |
|filterString|String| The string for the filter query |
|showFilter|Boolean| Shows or hides the grid filter (a.k.a. simple / quick filter) |
|filterWidth|Number|Sets a specific width in pixels for the quick filter box, although actual width may be limited by CSS `min-width` on part `filter-field`| No |
|quickFilterMinWidth | Number | _Read-only_ property returning the quick filter's min-width, if any |
|hideHeader|Boolean| Enables you to hide the grid header |
|items|Array| A simpler interface for specifying data: if `items` is assigned, the array is forwarded to `data` - if `data` is an instance of the default data manager. If `data` is unassigned, the grid instantiates a default data manager and assign `items` to it.|
|label|String| Enables you to specify the grid title |
|labelVariant|String| Specifies the variant of the grid title |
|labelAlignment|String| Enables you to set the title alignment to the "left", "center", or "right". |
|filterLabel|String| Enables you to specify a title for the grid filter |
|clearFilteredSelection|Boolean| Clears the selected rows when filtering the grid data. |
|selectedIndexes|Array| Array of selected items indexes. The indexes are base indexes, not row indexes. This property can be used both for selecting items and for checking which items are selected. It is automatically updated when the user selects or unselects rows. Note that `selectedIndexes` is an array even if `selectMethod` is `'single'`. |
|selectedItemText| String | The text to display next to the filter label when a single item is selected (default value: 'Selected Item'). |
|selectedItemsText| String | The text to display next to the filter label when two or more items are selected (default value: 'Selected Items'). |
|hideMessage| Boolean | Hide the grid message? (Ignore bindDataText, noDataToDisplayText, noResultsText, noMatchesText?) |
|bindDataText| String | Prompt to bind data to the grid, shown in the message area (default value: 'Bind data to the grid')|
|noDataToDisplayText| String | Alternative text shown in the message area when there is no data binding (default value: 'There is no data to display.') |
|noResultsText| String | Text shown in the message area when there is bound data but no rows to show (default value: 'No Results.') |
|noMatchesText| String | Text shown in the message area when data filtering causes all rows to be filtered out (default value: 'No matches found.')|
|selectMethod|String| Sets the selection method of `data`.|
|selectRow |Boolean| Allow users to select grid rows using the mouse or the keyboard. |
|view      |_View Configurator_| Sets the View Configurator. Refer to the detailed section about the view configurator below. |
|cacheRuntimeChanges |Boolean| Should we store user interactions in browser session storage? (effective only when gridId is defined)|
|preserveRowExpansion |Boolean| Should we store expanded rows in browser session storage? (effective only when gridId is defined and cacheRuntimeChanges is true)|
|gridId|String| Id for internal grid usage. Currently only for keeping sort configurations.|
|dataLoading| Boolean | Set to `true` to show the "data loading" indicator when starting to load data, and to `false` to hide the indicator |
|loadingIndicatorSize| Number | Container size in pixels (same height / width) for the data loading indicator (default: 200) |
|loadingIndicatorDelay| Number | Delay before displaying the loading indicator, in ms (default: 1000) |
|loadingIndicatorImage| String | The url of a custom loading indicator image, that replaces the default indeterminate progress bar load indicator. If the image load fails, the default loading indicator is used as fallback. |
|showResetButton |Boolean| Shows a button that resets the grid back to its default configuration when changes are made at run time. |
|resizeColumns |Boolean| Enables to adjust the width of grid columns by dragging the divider lines. |
|reorderColumns |Boolean| Allows the user to reorder columns in runtime using drag and drop. |
|rowEditFormTitle|String|Title for the Row Edit form when it edits an existing row..|
|rowEditFormAddTitle|String|Title for the Row Edit form when it adds a new row.|
|updateButtonText|String|Label for Save button in Row Edit Form when it edits an existing row.|
|addButtonText|String|Label for Save button in Row Edit Form when it adds a new row.|
|applyButtonText|String|Label for Apply button in Column Reorder Form.|
|cancelButtonText|String|Label for Cancel button in Column Reorder Form and Row Edit Form.|
|isEditable|Boolean|Specifies the editing mode. If `true`, then any editable cells can be edited. Otherwise the grid is read-only. If `showEditButton` is `true`, the default value for `isEditable` is `false` and it will not become `true` until the `Edit` button is clicked.|
|edit|String|Specifies inline editing mode: `'cell'` for cell editing or `'row'` for row editing. All changes will be submitted as soon as they are valid. If `edit` has the value `grid`, the grid uses `cell` editing, but doesn't submit the changes until the user presses the `Save` button or the method `commitUpdates` is called.|
|showEditButton|Boolean|When this property is `true`, buttons are displayed on the grid toolbar that enable you to turn editing mode on or off. Initially, only the `Edit` button is displayed. When the `edit level` is set to `grid` and `Edit` is clicked, the `edit-started` event is triggered and the `Edit` button is replaced by `Save` and `Cancel` buttons. When the `Save` button is clicked, the `edit-completed` event is triggered and the editing mode is stopped. When the `Cancel` button is clicked, the `edit-cancelled` event is triggered and the editing mode is stopped. The save and cancel buttons are only available when editing on a grid level. Grid-level editing enables you to save all modifications to grid cells at the same time. Cell level and row level editing will immediately save the edits to a cell or a row. When the edit mode is stopped, the `Save` and `Cancel` buttons are hidden and the `Edit` button is displayed again.|
|editButtonText|String|Label for the `Edit` toolbar button (only visible if `showEditButton` is on). Default: `'Edit'`.|
|saveEditButtonText|String|Label for the `Save` toolbar button (only visible if `showEditButton` is on). Default: `'Save'`.|
|cancelEditButtonText|String|Label for the `Cancel` toolbar button (only visible if `showEditButton` is on). Default: `'Cancel'`.|
|editControlVisibility|String|Specifies how to show the edit control in `'cell'` edit mode: `'hover'` (default), `'always'`, or `'never'`. Note that the `'never'` option effectively disables editing.|
|showDeleteRowButton|Boolean|Show a _Delete Row_ button in the grid toolbar that allows the user to delete the selected rows?|
|deleteRowButtonText|String|Label for the _Delete Row_ toolbar button. Default: `'Delete'`|
|showAddRowButton|Boolean|Show an _Add Row_ button in the grid toolbar that allows the user to add new rows?|
|addRowButtonText|String|Label for _Add Row_ toolbar button. Default: `'Add'`. |
|editControl|String|Specifies the edit control. The edit controls the edit activator, that the user can click on to edit a cell or row. Supported values: `'icon'` (default), `'link'`, or `'none'` (= disable editing)
|editControlLabel|String|Specifies the label for the `'link'` edit control.|
|editControlIcon|String|Specifies the icon for the `'icon'` edit control.|
|highlightDrafts|Boolean|Highlight cells that contains a value that has been changed by grid inline editing.|
|highlightNewRows|Boolean|Highlight newly added rows with a "change badge" marker.|
|columnsMenuOptions |String| Enables user to show and hide specific columns using a check box, and change the order of the columns by dragging. |
|columnsMenuVisibleItems |Number| Sets the number of items to display initially when the columns configuration menu is opened. |
|columnsMenuReorderTooltip|String|Tooltip for the reorder icon in the columns configuration menu. |
|columnsMenuVisibilityTooltip|String|Tooltip for the column visibility checkbox in the columns configuration menu. |
|navigation|String|Specifies the focus navigation method. Possible values: `'row-first'` (default), `cell-first`, `cell-only`|
|preventFocusRowWrap|Boolean|Prevents the left and right arrow keys from navigating to next or previous row. Default: false|
|selectFollowsFocus|Boolean|In single selection mode, automatically selects the focused row. Default: false |
|autoScroll |Boolean| Keeps selected rows visible by scrolling automatically when the grid is updated or resized. |
|footerData |Array| A JS object that contains data for the grid footer. Refer to the detailed section about the grid footer.|
|showFooter |Boolean| Adds a footer area to the grid. |
|showHeaderRowInFooter |Boolean| Shows the header row within the grid footer. |
|deleteRowsConfirmation |Boolean| Prevents the `deleteSelectedRows` method from being executed after pressing the `delete` button. It can be used together with the `delete-row-clicked` event to add a custom confirmation step before calling the `deleteSelectedRows` manually. |
|customActions |Action[]| Actions to display on the grid toolbar. |
|customActionsPosition |String| Position of the toolbar actions relative to the edit, add, and delete buttons on the grid. Possible values: `'after'` (default), `'before'`, `'none'`.|

### Additional properties for the Tree Grid

| Property | Type | Description |
|----------|------|-------------|
|subItems| String | For tree grids: specifies a field name in the data item that contains sub-items|
|alwaysExpanded|Boolean|If true, then all sub-items will always be visible and the tree toggle icons are automatically hidden.|
|showExpandAll|Boolean|If true, the grid displays a button in the toolbar that allows the user to expand or collsapse all sub-items.|
|expandAllText|String|The label of the `showExpandAll` button when it expands all sub-nodes. Default: `'Expand All'`|
|collapseAllText|String|The label of the `showExpandAll` button when it collapses all sub-nodes. Default: `'Collapse All'`|
|disableChildRows|Boolean|Works together with `disableRow`. If `disableChildRows` is true, items will be disabled if any ancestor item is disabled.|

#### Using the Data Manager Interface

To use a data manager with the grid, it should have the following methods and properties:

---

~~~js
data.observe(cbObj)
~~~

The method registers `cbOoj` as an observer to state changes in the data manager.

Each change event corresponds to a function name. If the object `cbObj` has a corresponding function, the event is sent to that function.

In ThingWorx, 9.2, the grid component monitors the following events:

- `dmView()` - Triggered when the data view is updated through sorting, filtering, or grouping.

- `dmItem(index)` - Triggered when data item with index `index` is updated.

- `dmInserted([[index, count], ...])` - Triggered when `count` items are inserted, starting at the `index`. Note that several segments can be inserted at the same time.

- `dmRemoved([[index, count], ...])` - Triggered when `count` items are removed, starting at `index`. Note that several segments can be removed at the same time.

- `dmSelected(baseIndex, selected)` - Triggered when an item with the base index `baseIndex` is selected (`selected` is `true`) or unselected (`selected` is `false`).

The `baseIndex` persists to a specific data item, including when the data is sorted, filtered, grouped, and more. However, some operations such as adding or removing items can affect the `baseIndex` persistence.

---

~~~js
data.unobserve(cbObj);
~~~

Use the unobserve() method to stop the `cbObj` observer from listening to the data manager events.

---

~~~js
data.length
~~~

Returns the number of data items in the data manager.

---

~~~js
data.item(index)
~~~

Returns the data item that corresponds at a specific index number.

The `index` is a zero-based index with a value between `0` and `data.length - 1`.

Note: The item is used as an input for methods in the view configurator and it is not interpreted by the grid.

---

~~~js
data.isSelected(index)
~~~

Returns `true` if a data item at a specific index number is selected, and `false` in any other case. The grid uses the returned value to set or unset the `selected` attribute on the corresponding row element.

---

~~~js
data.selectMethod
~~~

The property (or `get` function) specifies the data selection mode using one of the following options:

- `none` - disable selection
- `single` - select one item at a time
- `multiple` - select multiple items at the same time

---

~~~js
data.baseIndex(index)
~~~

Converts the current `index` into a persistent base index that is not affected by changes to the view. When `index` does not correspond to an item, such as a virtual grouping item, the method returns `-1`.

The base indexes are used to maintain the selection when the data view is changed by sorting, filtering, or any additional changes to the data projection.

---

~~~js
data.setSelected(selected, directSelection)
~~~

Set the selected items. The `directSelection` argument indicates whether the unselection was direct or non-direct.

---

~~~js
data.select(baseIndex, selected, directSelection)
~~~

Controls the selection of the item using the index number and based on the value of the `selected` variable. The item is selected when `selected` is True unselected when False. When `selected` is set to `undefined`, the method toggles the selected state of the item. The `directSelection` argument indicates whether the unselection was direct or non-direct.

---

~~~js
data.selectAllItems(directSelection)
~~~

Selects all items. The `directSelection` argument indicates whether the selection was direct or non-direct.

---

~~~js
data.unselectAllItems(directSelection)
~~~

Unselects all items. The `directSelection` argument indicates whether the unselection was direct or non-direct.

---

~~~js
data.directSelection
~~~

Returns `true` if the row or rows selection was direct, and `undefined` or `false` if triggered from other data service.  A direct selection is when a user selects grid rows using the mouse or the keyboard.

---

#### View Configurator interface

The grid expects that the view configurator has the following methods or properties:

---

~~~js
view.singleLineHeader
~~~

Displays each column label on the grid header as a single line of text.

---

~~~js
view.maxHeightHeader
~~~

Sets the maximum height of the grid header when it is displayed across multiple lines.

---

~~~js
view.singleLineRows
~~~

Use this property to display the grid rows on a single line.

---

~~~js
view.maxHeightRow
~~~

Sets the maximum height of the grid rows when each row is displayed across multiple lines.

---

~~~js
view.minHeightRow
~~~

Sets the grid minimum height of each row on the grid.

---

~~~js
view.sortSelectionColumn
~~~

Adds a sort button to the row selection column.

---

~~~js
view.externalSort
~~~

Controls whether an internal sort function is applied or an external sort is used when you click to sort a column.

---

~~~js
view.getSortExpression()
~~~

Gets the current sort expression based on column names and sort orders.

---

~~~js
view.setSortExpression(expr, dataManager, opt)
~~~

Applies a sort expression to the grid. Set `opt.noOrder` to `true` to reset only the sort icons. Set `opt.reset` to `true` to reset current sort order.

---

~~~js
view.getOrderExpression()
~~~

Get the current columns order.

---

~~~js
view.getWidthsExpression()
~~~

Get the current widths expression based on column names and widths.

---

~~~js
view.getVisibilityExpression()
~~~

Get the current visibility expression based on column names and its hidden property.

---

~~~js
view.observe(cbObj);
~~~

Registers `cbOoj` as an observer to any state changes in the view configurator.

Each change event corresponds to a function name. If the object `cbObj` has a corresponding function, the event is sent to that function.

In ThingWorx, 9.2, the grid component observes one event:

- `dvChanged()` - Triggers when the view configuration changes, which allows the grid to refresh the current view.

---

~~~js
view.unobserve(cbObj);
~~~

Stops the `cbObj` observer from observing the view configurator events.

---

~~~js
view.columns
~~~

The `columns` property (or `get` function) contains an array that defines the grid columns. Each array item is an object that contains the following fields:

##### col.name

Specifies the identifier of the column. Optional. Required only if you want to show a footer data for this column.

##### col.label

Specifies the title in the column header. It is either a string or a function. If it is a string it will be displayed using a `ptcs-label` component. If it is a function, it returns a single element which may contain sub-elements, that is used as the column header.


##### col.width

Sets the column width. For variable widths, set the value using fractions or percentage (`fr`) units.

##### col.minWidth

Sets the minimum column width, width when the `col.width` property contains is a variable width.

##### col.maxWidth

Sets the maximum column width, width when the `col.width` property contains is a variable width.

##### col.headerHAlign

Sets the horizontal alignment of the column header label to one of the following options:

- `'left'`
- `'center'`
- `'right'`

##### col.headerVAlign

Sets the vertical alignment of the column header label to one of the following options:

- `'top'`
- `'center'`
- `'bottom'`

##### col.halign

Sets the horizontal alignment of content within the column cells to one of the following options:

- `'left'`
- `'center'`
- `'right'`


##### col.valign

Sets the vertical alignment of content within the column cells to one of the following options:

- `'top'`
- `'center'`
- `'bottom'`


##### col.resizable

Returns a True value when column can be resized by the user using mouse or keyboard interaction (not implemented yet).

##### col.hidden

Returns a True value if the column is hidden.

---

~~~js
view.getRowDef(item);
~~~

Returns the row configuration of an item. The row configuration is an array, where each array item defines a specific cell. It is an object with these fields:


##### row.create

`row.create` is a function that creates the cell content. It is called with a single parameter: the cell element where the result is placed. This allows the create function to mark the cell with extra styling or attributes, giving it control over the whole cell area.

Note that the returned element is not yet bound to a data item. The element may be reused for many items, which can improve performance.

##### row.select

Retrieves the cell data from a data item. The function is called with two parameters:

~~~js
row.select(item, index);
~~~

- `item` - the data item from the data manager
- `index` - the index number of the item

The returned value is assigned as a `value` property to the cell element, which makes the cell available for state formatting, and also sent to `row.assign()`.

##### row.assign

Binds an element that is created by the `row.create()` function to a data item. The function is executed with four parameters:

~~~js
row.assign(element, value, index, dataManager);
~~~

- `element` - the element created by the `row.create()`
- `value` - the value selected by `row.select()`
- `index` - the index of the corresponding data item
- `dataManager` - the data manager that contains the data item

The two latter arguments is mainly intended for inline cell editing, which allows the editor to send any changes to the data manager.

##### row.halign

`row.halign` sets the horizontal alignment of the cell to one of the following options:

- `'left'`
- `'center'`
- `'right'`


##### row.valign

`row.valign` specifies the vertical alignment of the cell to one of the following options:

- `'top'`
- `'center'`
- `'bottom'`

#### Grid Footer
See the example of the grid footer object. When you create your own footer data you should ensure same field names in the footer data as are used in the actual grid data.
````js
grid.footerData = [
    {
        avatar:     'Footer Area',
        title:      '#cspan',
        name:       'Total Count: {#stat_count}, text-align:right;',
        department: '#cspan',
        linkedin:   '#cspan',
        born:       'Average Age:, text-align:right;',
        age:        '{#stat_average}',
        desc:       '#cspan'
    }
];
````
`{#stat_count}` - Counts the number of rows.

`{#stat_max}` - Calculates the maximum client-side value for the values in the column. Limited for numbers and dates only.

`{#stat_min}` - Calculates the minimum client-side value for the values in the column. Limited for numbers and dates only.

`{#stat_average}` - Calculates the average client-side value for the values in the column. Limited for numbers only.

`{#stat_total}` - Calculates the total client-side value for the values in the column. Limited to numbers only.

`{#cspan}` - Span columns.

You can align data in the footer using #cspan and text alignment settings text-align:left or text-align:right. Use HTML escape characters for comma in text, and the text following the comma is the alignment setting in the configuration, which is by default text-align:left.

### Events

| Name | Event.detail | Description |
|------|------|-------------|
| edit-started | | Generated when the user clicks on the `Edit` button. |
| edit-completed | | Generated when the user clicks on the `Save` button. |
| edit-cancelled | | Generated when the user clicks on the `Cancel` button. |
| add-row | | Generated when the user clicks on the `Add Row` button.  |
| edit-item-started | {item, field, baseIndex}| Generated when the user begins inline editing: `item` is the edited item. `field` is the edited field, if `edit` mode is `'cell'` (otherwise `field` is undefined). `baseIndex` is the base index of the edited item. If a new item is being created, only `baseIndex` is present, with the value `-1`. |
| edit-item-cancelled | {baseIndex, field, item}| Generated when the user stops inline editing without making any changes.|
| edit-item-completed | {baseIndex, field, item, update, validation} | Generated when the user has completed an inline change. `item` contains the updated item and `update` contains the actual changes. `validation` contains any validation errors for the changes.|
| reset-to-default | | Generated when the user clicks on the `Reset` button. |
| row-click | { value: row index } | Generated when the user clicks on a row. |
| delete-row-clicked | {rowsIndex: rows indexes} | Generated when the user clicks on the `Delete` button (row deletion). |
| custom-actions-activated | { action, value } | Event generated from the toolbar custom actions. It's triggered when the user clicks on a `button` or `link`.|
| custom-actions-value-changed | { action, value } | Event generated from the toolbar custom actions. It's triggered when the value of a `toggle` or `dropdown` changes.|

NOTE: The _data manager_ and _view configurator_ also generates various events.


### Methods

| Name      | Argument | Type   | Description |
|-----------|----------|--------|-------------|
|isIndexSelected|index | Number | Returns true if the item with the base index `index` is selected.|
|isRowSelected|index | Number | Returns true if the item on the row at index `index` is selected.|
|selectIndex| index    | Number | Base index for item |
|           | select   | Boolean| `false`: unselect item. `true`: select item. `undefined`: toggle item selection state. |
|selectRowIndex| index    | Number | Row index for item (dependent on filtering, sorting, ...) |
|           | select   | Boolean|  `false`: unselect item. `true`: select item. `undefined`: toggle item selection state. |
| scrollTo  | index    | Number | Scrolls the item with the specified index number into the current view. |
| getSortExpression| | | Returns the value of getSortExpression() from the view configurator |
| setSortExpression| sortExpression, opt | | Forwards the call to setSortExpression() in the view configurator |
| getOrderExpression| | | Returns the value of getSortExpression() from the view configurator |
| getWidthsExpression| | | Returns the value of getSortExpression() from the view configurator |
| getVisibilityExpression| | | Returns the value of getSortExpression() from the view configurator |
| rollbackUpdates | | | Rollback all unsubmitted changes made by the grid inline editing |
| commitUpdates | | | Submit all changes made by the grid inline editing - including invalid changes. |
| deleteSelectedRows | | | Removes the selected rows from the grid. |
| modifyCustomAction |actionId, value, updateType | String, <value_type>, String| Modifies the toolbar according to the updateType (`'value'`/`'disabled'`/`'visible'`) |


## Styling

### Parts

| Part | Description         |
|------|---------------------|
|body-cell  | A data cell|
|header-cell  | A header cell|
|header| The grid header row |
|header-label|The column label in header cell|
|row   | A data row          |
|cell-link| A link in a cell |


### States
| Attribute| Description                           | Part  |
|----------|---------------------------------------|-------|
|disabled  | Indicates whether the grid is disabled | :host |

## Subcomponents

The grid has subcomponent `ptcs-quick-filter` with following parts:

| Part         | Description                                                                     |
|--------------|---------------------------------------------------------------------------------|
| label        | The filter label                                                                |
| filter-field | The filter textfield                                                            |
| filter-label | Displays the number of selected rows when the grid selection mode is `multiple` |

The grid has subcomponent `ptcs-data-load-bar` with following parts:

| Part         | Description                                                                     |
|--------------|---------------------------------------------------------------------------------|
| bar-container| The container for the indeterminate progress bar or custom image                |
| track | The default progress bar (a horizontal track with a moving slider)                     |
| slider| The moving part within the track                                                       |
| image | The custom image that replaces the default progress bar                                |

## TODO

- rows spanning multiple columns
- resize columns with mouse interaction
- drag and drop reordering of columns
- drag and drop reordering of rows (or?)
- pinned rows and columns (the row / column stays in place regardless of scrolling)
- allow runtime user to dynamically show / hide columns
- keyboard interaction for resizing columns
- keyboard interaction for moving columns
- keyboard interaction for moving rows (or?)
- pagination
- tile / card layout
- ARIA attributes
