# ptcs-chip-data-filter-selector-dropdown

## Overview

The exposed sub-component which manages selector drop down functionality. It creates views that correspond to specific filter options. The supported option types include number, string, date and boolean. The behavior & appearance is described by a specification which is not the subject of the following instruction.
Please refer to UX team to get more details.

## Usage Examples
It is not intended to be used externally, it should be wrapped by the parent who takes care about chip container & selector.

### Basic Usage

~~~html
<ptcs-chip-data-filter-selector-dropdown tabindex="0"></ptcs-chip-data-filter-selector-dropdown>
~~~

~~~js
const selectorDropDownId = document.querySelector("#specificSelectorId");
const inputData = {
    dataShape: {
        fieldDefinitions: {
            TextBasedCategory1: {
                name:        'textBasedCategory1',
                baseType:    'STRING'
            },
            TextBasedCategory2: {
                name:        'textBasedCategory2',
                baseType:    'STRING'
            }}
    }
};
selectorDropDownId.data = inputData;
~~~


## Component API

### Properties
| Property | Type | Description |  Triggers a changed event? |
|--------- |------|-------------|----------------------------|
| data | Array | Describes the filter options. See an example for details |
| customBaseTypesMapping | Object | maps base types to supported filters |
| sortFilters | Boolean | Shows list of options in the alphabetic sort order (default: true)                             | No                        |
| columnFormat | String | JSON string that contains predefined order of options to show. Should have the same set of options as in data object. `Title` field is optional and includes custom/localizable label. Add `__showThisField=false` if you want to hide option. | No |


### Events
| Name | Data | Description |
|------|------|-------------|
| change | { content } | All entered data by an user in the form of an object |

### Methods

| Signature           | Argument | Type   | Description |
|---------------------|----------|--------|-------------|
| removeEnteredData() | index    | number | Removes the specific data entry which corresponds to a filter option for which an user entered data|
| reset | none | | Clears any pending data (as if the `Cancel` button had been pressed) |


## Styling

No parts exposed for styling.

### State attributes

No states.
