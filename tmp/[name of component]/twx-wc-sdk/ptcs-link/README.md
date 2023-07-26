# ptc-link


## Visual

<img src="img/ptcs-link.png">


## Overview

A ptcs-link is a link that is similar to the HTML &lt;a&gt; element, with specific styling.

## Usage Examples

### Basic Usage

~~~html
<ptcs-link href="http://www.ptc.com" label="PTC"></ptcs-link>
~~~

## Component API

### Properties
| Property          | Type    | Description                                                                      | Default   | Triggers a changed event |
| ----------------- | ------- | -------------------------------------------------------------------------------- |---------  |--------------------------|
| alignment         | String  | Controls the alignment of items. You can set it to "left", "right", or "center". | "left"    | No                       |
| disabled          | Boolean | Disables the link                                                                | false     | No                       |
| singleLine        | Boolean | Shows the link text on a single line.                                            | false     | No                       |
| href              | String  | Specifies the URL to open when the link is clicked                               |           | No                       |
| linkRouted        | Boolean | Suppresses traversal of the href (to enable link routing)                        | false     | No                       |
| label             | String  | The link label                                                                   | "Link"    | No                       |
| target            | String  | Target tab type: "new", "same" or "popup".                                       | "same"    | No                       |
| textMaximumWidth  | String  | The maximum width for the link text                                              |           | No                       |
| tooltip           | String  | The tooltip that appears when hovering over the link                             |           | No                       |
| tooltipIcon       | String  | The icon for the tooltip                                                         |           | No                       |
| variant           | String  | The link variant.                                                                | "primary" | No                       |
| verticalAlignment | String  | Controls the vertical alignment of the link text.                                |           |                          |



### Events
| Name         | Data     | Description                     |
| ------------ | -------- | ------------------------------- |
| a-click | { a: The &lt;a> element within the ptcs-link, originalEvent: The originating event } | Triggered when the link is clicked |

### Methods

No methods


## Styling

### The Parts of a Component

| Part      | Description                 |
| --------- | --------------------------- |
| link      | The link element            |
| label     | The container for the label |


### State Attributes

| Attribute | Description                                                                                             | Part        |
| --------- | ------------------------------------------------------------------------------------------------------- | ----------- |
| disabled  | Disables the link                                                                                       | :host, link |
| variant   | Specifies the variant. You can set the link type to "primary" or "secondary". The default is "primary"  | :host       |
