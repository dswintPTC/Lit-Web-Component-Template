# ptcs-modal-overlay




## Overview

The ptcs-modal-overlay is a helper web component for supporting a semi-opaque backdrop, styled via theming or programmatically, used as a modal overlay: It is placed as child of &lt;body> when used. Being a web component, its styling is hidden in the Shadow DOM.


## Usage Examples

### Basic Usage

    <ptcs-modal-overlay></ptcs-modal-overlay>

    <ptcs-modal-overlay backdrop-color="red" backdrop-opacity="0.5" backdrop-z-index="20000"></ptcs-modal-overlay>



## Component API

### Properties
| Property | Type | Description | Triggers a changed event |
|----------|------|-------------|--------------------------|
|backdropColor| String | The backdrop overlay color | No |
|backdropOpacity| String | The backdrop opacity, a value between 0 and 1.0 | No |
|backdropZIndex| Number | The backdrop z-index | No |


### Events

None


### Methods

None

## Styling

### Parts

| Part | Description |
|------|-------------|
| backdrop | The container element styled for use as modal overlay backdrop |

### State attributes

No public state attributes.
