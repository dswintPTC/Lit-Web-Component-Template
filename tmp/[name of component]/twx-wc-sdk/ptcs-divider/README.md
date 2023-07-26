# ptcs-divider

## Visual

<img src="img/ptcs-divider.png">


## Overview

A ptcs-divider displays a horizontal divider in the shape of a line (in typographical terminology, a rule is a line).


## Usage Examples

There is 1 styling property associated to ptcs-divider: vertical.


## Component API

### Properties

The _default_  thickness, and color styling are set via theme using global-lines-dividers and global-colors-line colors-dividers respectively
where the fallback value it the default. This lets you set custom default values by simply declaring the corresponding CSS variable(s), thus preventing the fallback value from being applied.

### Properties
| Property | Type    | Description                     | Default | Triggers a changed event? |
| -------- | ------- | ------------------------------- | ------- | ------------------------- |
| vertical | Boolean | Should the divider be vertical? | false   | No                        |

### Events

No events


### Methods

No methods


## Styling

### Parts

| Part      | Description     |
| --------- | --------------  |
| line      | The divider body |

### States

| Attribute | Description                | Part  |
| --------- | -------------------------- | ----- |
| vertical  | Divider should be vertical | :host |
