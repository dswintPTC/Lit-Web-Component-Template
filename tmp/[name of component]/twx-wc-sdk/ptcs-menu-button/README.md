# ptcs-menu-button

## Visual

<img src="img/ptcs-menu-button.png">

## Overview

A menu button is a button that opens a menu.

## Usage Examples

### Basic Usage

```html
<ptcs-menu-button items="[[items]]"></ptcs-menu-button>
```

## Component API

### Properties

| Property            | Type    | Description                                                                                                  |  Default                                  | Triggers a changed event? |
| ------------------- | ------- | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------- | ------------------------- |
| disabled            | Boolean | Disables the button                                                                                          | false                                     | No                        |
| offset              | Number  | The distance between the button and the menu edge.                                                           | 8                                         | No                        |
| openOnHover         | Boolean | Determines whether hovering the button will trigger the menu.                                                | false                                     | No                        |
| buttonVariant       | String  | Set a button variant.                                                                                        | "tertiary"                                | No                        |
| icon                | String  | Sets an icon.                                                                                                | "cds:icon_more_vertical"                  | No                        |
| iconSrc             | String  | Sets an icon source.                                                                                         |                                           | No                        |
| contentAlign        | String  | Align the label in button to the left, right or center.                                                      | "center"                                  | No                        |
| buttonMaxWidth      | Number  | Set a maximum width for the button widget.                                                                   |                                           | No                        |
| label               | String  | The text label in button.                                                                                    |                                           | No                        |
| tooltip             | String  | The tooltip that appears when hovering over the button                                                       |                                           | No                        |
| tooltipIcon         | String  | The icon for the tooltip                                                                                     |                                           | No                        |
| displayIcons        | Boolean | When false, icon data is ignored by the menu, and no icons are rendered.                                     | false                                     | No                        |
| allowMissingIcons   | Boolean | When allowMissingIcons is false, and displayIcons is true, a default icon will be assigned to any Menu Item that has no icon data associated with it.|false| No                      |
| menuMaxWidth        | String  | Sets the maximum width the menu can be reduced to. May be defined by a custom value, in pixels. If set to "auto", the menu will assume the width of its widest menu item.  |"auto"|No|
| menuMinWidth     | String  | Sets the minimum width the menu can be reduced to. May be defined by a custom value, in pixels. If set to "auto", the menu will not become narrower than its widest menu item.|"auto"|No|
| maxMenuItems        | String  | Defines the maximum number of visible dropdown menu and submenu items.                                       | 5                                         | No                        |
| iconPlacement       | String  | Sets the tooltip icon image on the left or right of the text label if there is any.                          | "right"                                   | No                        |
| menuPlacement       | String  | Sets the placement of the menu in relation to its button. The property lets you choose to place the menu on the top/bottom(vertically) or left/right(horizontally) of the button. The exact alignment of the menu will be auto adjusted based on the menu button’s position on the page. Options: "vertical" / "horizontal".         | "vertical"                                | No                        |

### Events

| Name     | Data                   | Description                                                                            |
| -------- | ---------------------- | -------------------------------------------------------------------------------------- |
| `action` | `ev.detail = { item }` | Generated when the user clicks on a "leaf" in the menu tree (an item without a submenu)|
