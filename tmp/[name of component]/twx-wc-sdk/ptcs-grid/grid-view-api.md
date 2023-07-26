# Grid DataViewer Simplified API

The following document describes the simplified API to the `DataViewer`.

The Grid component uses a view configurator to determine how data is displayed. The `DataViewer` implements such a view configurator. Creating and configuring a `DataViewer` requires a fair amount of Javascript code. The simplified API allows you to do it with plain HTML instead.

Features:

- Specify the view configuration using HTML
- Use arbitrary HTML content in grid headers and cells
- Extract fields from the grid data to the cells
- Handle events from interactive header and cell content
- Process field data with modifiers (translate and format the data)

## Overview

The simpified API mainly consists `ptcs-grid-column-def` elements, as child elements to the `ptcs-grid` element. Each `ptcs-grid-column-def` defines a column renderer in the grid.

The API also allows you to configure main properties of the `DataViewer` with properties / HTML attributes on `ptcs-grid`.

Example:

~~~html
<ptcs-grid single-line-header min-height-row="34px">
    <ptcs-grid-column-def
        label="Photo"
        value="photo"
        base-type="IMAGELINK"
        width="100px"
        valign="center"
        config='{"size": "34px"}'></<ptcs-grid-column-def>
    <ptcs-grid-column-def
        label="Name"
        value="name"
        base-type="STRING"
        sortable
        width="1fr"></<ptcs-grid-column-def>
</ptcs-grid>
~~~

This HTML creates a grid with two columns. The first column has the header "Photo" and shows images based on the URL in the `photo` field. The second column has the header "Name" and shows the `name` field (as a string). This column can be sorted by clicking on a sort icon in the header. The header uses single label lines (no text wrapping) and the rows are at least 34px high.

Boolean attributes, such as `sortable`, are `true` if they exists. They can also explicitly be specifed as `false` with the attribute value `"false"`.

## ptcs-grid properties mapped to DataViewer properties

These properties / attributes can be assigned to `ptcs-grid` to specify `DataViewer`  properties:

| Property | Description |
|----------|-------------|
|singleLineHeader |Boolean: Display header rows as single Line? |
|singleLineRows | Display grid rows as single Line? |
|showRowNumbers | Show row numbers |
|maxHeightHeader |Maximum header height |
|maxHeightRow |Maximum row height |
|minHeightRow |Minimum row height |
|headerVerticalAlignment | Controls the vertical alignment of data within the header row |
|rowsVerticalAlignment | Controls the vertical alignment of data within body rows |
|canDelete | Boolean: Add a delete button column |
|rowDepField | Name of field for row state formatting |
|sortSelectionColumn | Boolean: allow sorting based on selection state? |
|externalSort | Boolean: use external sort function when user clicks on the sort icon? |
|selectButton | This property is mapped to the `selectMethod` property in the DataViewer, which allows you to add a select button column ('single' or 'multiple'). The grid property has been renamed to `selectButton` because of a name conflict. |

See the documentation for `DataViewer` for additional information about the properties.

NOTE: When the properties are assigned as attributes, the attribute name must be the kebab case version of the property name

## ptcs-grid-column-def attributes (column properties)

These attributes specifies column properties.

| Attribute | Property | Description |
|-----------|----------|-------------|
|label | label | The column header label |
|base-type |baseType |The data type of the column value |
|value |value |Column value: field name or "#index" or macro expression |
|header-halign |headerHAlign |The horizontal alignment of the header |
|header-valign |headerVAlign |The vertical alignment of the header |
|halign |halign |The horizontal alignment of the cell content |
|valign |valign |The vertical alignment of the cell content |
|width |width |The column width |
|min-width |minWidth | The minimum column width when the width property is a dynamic value |
|sortable |sortable |Boolean: should column be sortable? |
|editable |editable |Boolean: enable inline editing? |
|resizable |resizable |Boolean: can column be resized by the user. (_Not yet implemented_) |
|hidden |hidden |Boolean: Hide column? |
|tree-toggle|treeToggle|String or Boolean, that adds a tree toggle icon to the column cells|
|config |config |JSON: Specific cell configuration for the columns baseType |

See the documentation for `DataViewer` for additional information about the properties.

## Cell templates

Instead of using the default `baseType` renderer of the `DataViewer`, the cell content can be specified in the `ptcs-grid-column-def`. The cell content has to be a _single_ element, but can have any number of _descendant_ elements.

The specified element acts as a template; it can pull in field values using the syntax:

~~~js
${ field-name }
~~~

Example:

~~~html
<ptcs-grid>
    <ptcs-grid-column-def label="Name">
        <!-- Concatenate firstname and lastname -->
        <ptcs-label label="${firstname} ${lastname}"></ptcs-label>
    </ptcs-grid-column-def>
    <ptcs-grid-column-def label="Score">
        <!-- Use a complex element structure as cell content -->
        <div>
            <ptcs-label label="Best: ${top}"></ptcs-label>
            <ptcs-label label="Average: ${avg}"></ptcs-label>
        </div>
    </ptcs-grid-column-def>
</ptcs-grid>
~~~

This cell template pulls the fields `firstname`, `lastname`, `top`, and `avg` from the row data.

### Prevent creation of cell templates

Some elements can cause harm if they are created with template expressions. Example:

~~~html
<ptcs-grid>
    <ptcs-grid-column-def [...]>
        <ptcs-icon icon="cds:icon_${name}"></ptcs-icon>
    </ptcs-grid-column-def>
</ptcs-grid>
~~~

The `ptcs-icon`  will try to download the image "`cds:icon_${name}`", which will cause an error message.

There are two ways prevent this. The first approach is to wrap the whole grid template into an HTML `template` element:

~~~html
<ptcs-grid>
    <template>
        <ptcs-grid-column-def [...]>
            <ptcs-icon icon="cds:icon_${name}"></ptcs-icon>
        </ptcs-grid-column-def>
    </template>
</ptcs-grid>
~~~

This is the most efficient approach. None of the cell template elements will be created.

Unfortunately, the approach have some drawbacks.

- Changes to the template element will not be detected. If you want to change the template in any way during runtime, you have to replace the entire element.
- Many frameworks appears to have problems to dynamically map data into template elements.

Therefore, as an alternative, it is also possible to avoid the HTML template wrapper, but instead protect sensitive attributes from being assigned. These sensitive attributes can be specified with the prefix `strip.`

Example:

~~~html
<ptcs-grid>
    <ptcs-grid-column-def [...]>
        <ptcs-icon strip.icon="cds:icon_${name}"></ptcs-icon>
    </ptcs-grid-column-def>
</ptcs-grid>
~~~

The `ptcs-icon` does not recognize the attribute `strip.icon`, so it ignores it.

When the `ptcs-icon` is instantiated with data, the `strip.` prefix is stripped. In the example above, the attribute name becomes `icon`, which is recognized - and now have a proper value.

### Configure interpolation strings

The interpolation strings, `'${'` and `'}'` can be reconfigured using the `interpolation` property. This property is an object with the fields:
- `prefix` - string that marks the start of the interpolated expression. (Default: `'${'`)
-  `suffix` - string that marks the end of the interpolated expression. (Default: `'}'`)

The `interpolation` property can be assigned as an _object_ or as a _JSON encoded string_. It can be specified both as an attribute or a property on ptcs-grid.

## Header content

The header content can be specified. The header element must be marked with the attribute `grid-header`, to not confuse it with a cell template

~~~html
<ptcs-grid>
    <ptcs-grid-column-def>
        <div grid-header>
            The <em>Name</em> Column
        </div>
    </ptcs-grid-column-def>
</ptcs-grid>
~~~

The grid header doesn't have access to the data fields. Only one instance of this element is created in a grid.

## Cell values

Even if you specify your own cell template, you should still specify the cell value. The cell value is used for _sorting_, _filtering_, and _state formatting_.

The value can be specified in two ways:

- as a field name
- as a template value

Example:

~~~html
<!-- Allow the user to sort and filter this column based on the value of the name field -->
<ptcs-grid-column-def
    label="Name"
    value="name">
    <ptcs-label label="${name}" variant="title"></ptcs-label>
    </ptcs-grid-column-def>
<!-- Allow the user to sort and filter this column based on the visible text -->
<ptcs-grid-column-def
    label="Score"
    value="Best: ${top} Average: ${avg}">
    <div>
        <ptcs-label label="Best: ${top}"></ptcs-label>
        <ptcs-label label="Average: ${avg}"></ptcs-label>
    </div>
</ptcs-grid-column-def>
~~~


## Interactive Elements

If the cell template contains interactive elements, the simplified API allows you to translate their events into grid events. The grid event will include the following information:

- the row number (data index) of the clicked element
- the data item
- the clicked element
- the original event

The event name can be changed, so it is easy to keep track of what specific element the user interacted with. This is handled with the `grid-event-map` attribute:

~~~html
<ptcs-grid-column-def label="Name" value="name">
    <div grid-event-map="mouseenter: mouse-enter-name; mouseleave: mouse-leave-name">
      <span grid-action grid-event-map="click: click-on-name">${name}</span>
      <span grid-action grid-event-map="click: click-on-delete">DELETE</span>
    </div>
</ptcs-grid-column-def>
~~~

The example code sets up the following event scheme:

- When the mouse enters the main cell element, the grid generates the event `mouse-enter-name`
- When the mouse leaves the main cell element, the grid generates the event `mouse-leave-name`
- When the user clicks on the name, the grid generates the event `click-on-name`
- When the user clicks on `"DELETE"`, the grid generates the event `click-on-delete`

The generated event is a `CustomEvent`, with the `detail`:

~~~js
{
    index,  // The row index. First row has index 0
    item,   // The row data
    target, // The interactive element
    event   // The original event from the interactive element
}
~~~

NOTE: If the interactive element should be focusable, they should set the `grid-action` attribute. This will allow the user to navigate to them with the arrow keys and simulate click events with the space bar.

Header content can also contain interactive elements, and therefore supports the attributes `grid-event-map` and `grid-action`. Header events excludes the `index` and `item` fields though.


## Value modifiers

The template expressions supports _value modifiers_. A value modifier is a function that takes a single parameter as input and returns a value. Value modifiers are useful for conversions and formatting.

The modifier function can be specified in field expressions. Example:

~~~js
${ name | uppercase }
~~~

If there exist a global function with the name `uppercase`, the field value of name will be modified by that function.

A field expression can use any number of modifiers. One modefier can e.g. convert a string to a date, and another modifier can format dates to specific formats. Example:

~~~js
${ expires | string2date | date2localeFormat }
~~~

NOTE: Currently the modifiers has to be global functions. This is a temporary approach. Future versions will hopefully use scoped modifiers.
