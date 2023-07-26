# ptcs-dynamic-panel

## Overview

A ptcs-dynamic-panel has two containers, a panel and a main container. The main container is always visible. The panel can be expanded or collpased. When collapsed it is typically hidden, but may chose to show a part of itself. The panel can share the space of the main container or fly over it.

The ptcs-dynamic-panel has a _trigger button_ that toggles the expansion mode and a _resize thumb_ that allow the user to manually resize the panel. Both parts can be hidden.

The dynamic panel can be used to implement _splitter windows_, _fly-out panels_, _accordians_, etc.


## Usage Examples

### Basic Usage

```html
<ptcs-dynamic-panel>
  <div slot="panel">This is the panel</div>
  <div>This is the main container</div>
<ptcs-dynamic-panel>
```


### Collapsed panel to the right, hide trigger and resize thumb

```html
<ptcs-dynamic-panel anchor="right" trigger="none" hide-thumb collapsed>
  <div slot="panel">This is the right sidebar</div>
  <div>First paragraph in the main container</div>
  <div>Second paragraph in the main container</div>
  <div>Third paragraph in the main container</div>
<ptcs-dynamic-panel>
```


## Component API

### Properties
| Property           | Type   | Description                                                                                                 | Default | Triggers a changed event?|
| ------------------ | ------ | ----------------------------------------------------------------------------------------------------------- | ------- | ----------------------- |
| anchor             |String  | What side of the contaienr is the panel attached to? Possible values: `top`, `right`, `bottom`, `left`.     | "left"  | -                       |
| clickOutsideToClose|Boolean | Automatically close the panel if the user clicks anywhere outside it?                                       | false   | -                       |
| collapsedPanelSize |String  | Size of panel when it is collapsed.                                                                         | "0px"   | -                       |
| collapsed          |Boolean | Is the panel collapsed?                                                                                     | false   | Yes                     |
| disabled           |Boolean | Is the component disabled?                                                                                  | false   | -                       |
| flex               |Boolean |Do the dynamic panel control its own dimensions? If `true` the dynamic panel grows when the panel is expanded| false   | -                       |
| hideThumb          |Boolen  | Hide resize thumb? If hidden, the slider cannot be resized by the user.                                     | false   | -                       | 
| hideTrigger        |Boolen  |Hide trigger button? If hidden, the collapse mode cannot be changed by the user, unless _trigger_ is `panel`.|  false  | -                       |
| maxPanelSize       |String  | Maximum panel size when expanded.                                                                           | "100%"  | -                       |
| minPanelSize       |String  | Minimum panel size when expanded.                                                                           | "34px"  | -                       |
| panelSize          |String  | Initial panel size.                                                                                         | "280px" | -                       |
| pushBehavior       |String  |  Should the panel push the main container or fly over it? Possible values: `push` or `flyover`.             | "push"  | -                       |
| scrim              |Boolean | Enable the scrim that covers the container when the panel in expanded? Only available if _pushBehavior_ is `flyover`.|false| -                  |
| speed              |String  | Animation speed when panel expansion mode changes.                                                          | "200ms" | -                       |
| thumbTooltip       |String  | Tooltip for the thumb                                                                                       | ""      | -                       |
| thumbTooltipIcon   |String  | Icon for the thumb tooltip                                                                                  | ""      | -                       |
| trigger            |String  | If visible, the trigger button always resides on the edge of the panel. The `trigger` property specifies where on the edge. Possible values: `top`, `right`, `bottom`, `left`, `center`, `middle`, `none`, `panel`. _Note_: `top` and `bottom` is only allowed if `anchor` is `left` or `right`.  `right` and `left` is only allowed if `anchor` is `top` or `bottom`. `none` hides the trigger button. `panel` also hides the trigger button, but it turns the entire main containter into a trigger button.  | "top" | - |
| triggerTooltip     |String  |Tooltip for the trigger                                                                                       |        | -                       |
| triggerTooltipIcon |String  |Icon for the trigger tooltip                                                                                  |        | -                       |
| triggerType        |String  |Specifies the trigger buttons. Possible values: `type1`, `type2`, `type3`                                     | "type1"| -                       |


### Methods

| Signature | Description           |
| --------- | --------------------- |
| toggle()  | Toggles expansion mode|

## Styling

### Parts

| Part           | Description                                            |
| -------------- | ------------------------------------------------------ |
| container      | The main container                                     |
| panel          | The panel container                                    |
| separator      | The separator between the panel and the main container |
| thumb          | The resize thumb                                       |
| trigger        | The trigger area that contains the trigger button      |
| trigger-button | The trigger button                                     |


### State attributes

| Attribute  | Description                                         | Part    |
| ---------- | --------------------------------------------------- | ------- |
| anchor     | Where is the panel anchored. See above              | `:host` |
| collapsed  | Is the panel collapsed (or expanded)?               | `:host` |
| hide-thumb | Is the resize thumb visible?                        | `:host` |
| sizing     | Is the user dragging the resize thumb?              | `:host` |
| transition | Is the panel transition between `collapsed` states? | `:host` |


## ARIA

_To be specified_


### Keyboard Navigation

_To be specified_
