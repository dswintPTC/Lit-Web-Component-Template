# ptcs-accordion

## Overview

A ptcs-accordion is a vertically stacked list of items. Each item can be _expanded_ or _collapsed_ to reveal the items content. There can be zero expanded items, one, or more than one item expanded at a time, depending on the proeprties.

Each item in a ptcs-accordion is a ptcs-accordion-item. The ptcs-accordion-item has two main parts:

- The _header_ that contains the header text and an optional trigger icon
- The _panel_ that contains the content of the item. The _panel_ can contain a sub-accordion, which results in an expandable / collapsible tree structure.

## Usage Example

~~~js
<ptcs-accordion items="[[items]]"></ptcs-accordion>
~~~

## Component API

### Properties

| Property          | Type    | Description                                                                                           | Default | Triggers a changed event |
| ----------------- | ------- | ----------------------------------------------------------------------------------------------------- | ------- | ------------------------ |
| allowMissingIcons | Boolean | Deprecated. Should we allow items without a specified icon, or should these be displayed using a 'default' icon?| |                        |
| fillMissingIcons  | Boolean | Displays a filler icons next to items with a missing icon                                             | false   |                          |
| disabled          | Boolean | Disables the accordion                                                                                |         |                          |
| displayIcons      | Boolean | Deprecated. Should we display the icon associated with each item (if any)?                            |         |                          |
| hideIcons         | Boolean | Hides the icons that are displayed next to the accordion items                                        |  false  |                          |
| hideTrigger       | Boolean | Specifies if the trigger icons should be hidden.                                                      |         |                          |
| items             | Array   | The items of the accordion. Currently an item has three fields, `label` (a String), `icon` (a String) and `content`, which is either a String or an Array of sub-items that should be renedered using a sub-accordion.| | |
| maxWidth          | Number  | Minimum width of accordion. Directly mapped to CSS max-width.                                         |         |                          |
| minWidth          | Number  | Minimum width of accordion. Directly mapped to CSS min-width.                                         |         |                          |
| multipleOpenItems | Boolean | Specifies if several panels can be expanded at the same time. If `false` only a single panel can be expanded. | |                          |
| triggerAlign      | String  | Specifies where the trigger icons should be located in the header. Supported values:  `'left'` or `'right'`. |  |                          |
| triggerCanCollapse| Boolean | Specifies if the user can collapse the panel using the trigger. If `false`, the panel can only be _expanded_ with the trigger, not _collapsed_. In this case the only way to collapse the panel is to expand another panel in the accordion (assuming that `multipleOpenItems` is `true`).| | |
| triggerType       | String  | Specifies trigger icons. Supported values are `'doublecarets'`, `'singlecaret'`, `'close'`, and `'plus/minus'`| |                          |


### Methods

No methods

### Events

No Events


### The Parts of the Component

#### Accordion parts

| Part      | Description       |
| --------- | ----------------- |
| item      | An accordion item |




#### Accordion items parts

| Part           | Description                                                        |
| -------------- | ------------------------------------------------------------------ |
| header         | The accordion header, that is always visible                       |
| label          | The header label                                                   |
| trigger-button | The header trigger icon                                            |
| panel          | The accordion panel, which is only visible if the item is expanded |
| sub-accordion  | The optional sub-accordion, that resides in the panel              |

### State attributes

#### Accordion state attributes

| Attribute | Description                | Part  |
| --------- | -------------------------- | ----- |
| disabled  | Is the accordion disabled? | :host |


#### Accordion item state attributes

| Attribute     | Description                                                                        | Part  |
| ------------- | ---------------------------------------------------------------------------------- | ----- |
| disabled      | Is the item disabled?                                                              | :host |
| sub-accordion | Do the panel contain a sub-accordion?                                              | :host |
| mute          | Can the item state (expanded / collapsed) be affected by activating the trigger?   | :host |
| opened        | Is the panel expanded?                                                             | :host |
| aria-expanded | `"true"` the panel is expanded, and `"false"` otherwise.                           | label |
| aria-disabled | `"true"` the panel state can be changed with the trigger, and `"false"` otherwise. | label |



