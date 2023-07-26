# ptcs-property-display

## Overview

The ptcs-property-display displays a set of values. It uses the ptcs-value-display component as a "black box" to do the actual display.

The ptcs-value-display gets the maximum value of `value-display-min-width` and `value-display-width` when both are provided, as property `max-width`.

## Usage Examples

To use the component, add a <ptcs-propert-display> element:

~~~html
<ptcs-property-display
  items="..."
  vertical-mode="..."
  value-display-min-width="..."
  value-display-width="..."
  value-display-height="..."
  property-display-label="..."
  hide-property-display-label="..."
  property-display-label-type="..."
  hide-group-titles="..."
  group-label-type="..."
  group-label-alignment="..."
  multiline="..."
  selector-group-title="..."
  selector-group-items="..."
  selector-item-key="..."
  selector-item-value="..."
  selector-item-meta="..."></ptcs-property-display>
~~~

## Component API

### Properties
| Property                      |Type     | Description                                                                                 | Default |
| ----------------------------- | ------- | ------------------------------------------------------------------------------------------- | ------- |
| items                         | Array   | Input data                                                                                  | [ ]     |
| selectorGroupTitle            | String  | In the "main" data array, what is the name of the entry containing the Group Title?         |         |
| selectorGroupItems            | String  | In the "main" data array, what is the name of the entry containing data for the Group?      |         |
| selectorItemKey               | String  | In a "value" entry in the Group array, what is the name of the "key"?                       | "key"   |
| selectorItemValue             | String  | In a "value" entry in the Group array, what is the name of the "value"?                     | "value" |
| selectorItemMeta              | String  | In a "value" entry in the Group array, what is the name of the value "metadata (type, etc)"?| "meta"  |
| verticalMode                  | Boolean | Should the items be displayed in one single vertical list?                                  | false   |
| propertyDisplayLabel          | String  | "Main" title for the widget                                                                 |         |
| hidePropertyDisplayLabel      | Boolean | Should the "main" title be hidden?                                                          | false   |
| propertyDisplayLabelType      | String  | The variant to use for the "main" label                                                     | "label" |
| propertyDisplayLabelAlignment | String  | Alignment (Left/Center/Right) for the "main" label                                          | "left"  |
| hideGroupTitles               | Boolean | Should the group titles be hidden?                                                          | false   |
| groupLabelType                | String  | The variant to use for the group labels                                                     | label   |
| groupLabelAlignment           | String  | Alignment (Left/Center/Right) for the group labels                                          | "left"  |
| valueDisplayMinWidth          | Number  | Minimum width of each value, for a more responsive layout                                   |         |
| valueDisplayWidth             | Number  | Width of each value, passed on to the value display                                         | 250     |
| valueDisplayHeight            | Number  | Width of each value, passed on to the value display                                         |         |

### Events

_No events_

### Methods

_No methods_


## Styling

### Parts

The property-display has follwing parts:

| Part                     | Description                      |
| ------------------------ | -------------------------------- |
| property-display-root    | Root div of entire component     |
| property-display-label   | ptcs-label with the "main" title |
| property-container       | Container of all properties      |
| property-group-label     | ptcs-label for a group title     |
| property-group-container | Data/Values for a group          |
| value-display-item       | A ptcs-value-display instance    |

### State attributes

_No state_

