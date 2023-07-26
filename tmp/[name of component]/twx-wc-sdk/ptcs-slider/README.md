# ptcs-slider

## Overview

A slider is useful when selecting a numeric value within a certain range. The slider design makes it impossible to enter a bad value. Any value that can be picked on the slider is valid.

The _ptcs-slider_ has several features
* Supports horizontal and vertical layouts
* The range can be between any numbers, not only integers or positive numbers
* The step can be any arbitrary (positive) number
* The slider can have one thumb for selecting a single value or two thumbs for selecting ranges
* The slider can be customized with icons


## Usage Examples

### Basic Usage

```html
<ptcs-slider min-value="0" min-label="Freezing" max-value="100" max-label="Boiling">
</ptcs-slider>
```


### Vertical slider

```html
<ptcs-slider vertical></ptcs-slider>
```


## Component API

### Properties
| Property                | Type    | Description                                                                                  | Default     | Triggers a changed event? |
| ----------------------- | ------- | -------------------------------------------------------------------------------------------- | ----------- |---------------------------|
| disabled                | Boolean |Is the slider disabled?                                                                       | false       | -                         |
| editValue               | Boolean |Can the displayed value(s) be edited?                                                         | false       | -                         |
| fullTrack               | Boolean |Should the track span the full slider or leave space for the  slider thumbs to go partially outside? If `false`, indicates that the thumb always reads from the center of the thumb. If `true` indicates that the value position is sliding inside the thumb: when the thumb is at the leftmost position, the value position is at the left side of the thumb, when the thumb is at 50% the value position is at the center of the thumb, and when the thumb is at the rightmost position the value position is at the right side of the thumb. | false |-|
| iconSet                 | String  |An iconset for the slider icons                                                               |             | -                         |
| label                   | String  |The slider label                                                                              | ""          | -                         |
| labelAlignment          | String  |The alignment of the slider label. Supported values are: `left`, `center`, and `right`.       | "left"      | -                         |
| labelVariant            | String  |The variant of the label. Intended for _theming_.                                             |             | -                         |
| maxIcon                 | String  |The icon on the max side of the slider                                                        | null        | -                         |
| maxIconSize             | String  |The icon size of _maxIcon_                                                                    |             | -                         |
| maxLabel                | String  |The label for the max side of the slider                                                      |             | -                         |
| maxValue                | Number  |The maximum value for the slider.                                                             | 100         | -                         |
| minIcon                 | String  |The icon for the min side of the slider                                                       | null        | -                         |
| minIconSize             | String  |The icon size of _minIcon_                                                                    |             | -                         |
| minLabel                | String  |The label for the min side of the slider                                                      |             | -                         |
| minValue                | Number  |The minimum value of the slider.                                                              | 0           | -                         |
| minValueWidth           | Number  |The minimum width for the value container.                                                    | 34          | -                         |
| maxValueWidth           | Number  |The maximum width for the value container (single line truncation overflow pattern).          | 96          | -                         |
| numStep                 | Number  |The number of discrete steps the that the slider range will be partitioned into. Only one of _numStep_ and _sizeStep_ should be specified. If neither are specified, the slider is continuous.| |-|
| overlapThumbs           | Boolean |When the slider has two thumbs (for selecting ranges), can they overlap?                      | false       |                           |
| precision               | Number  |Number of fraction digits for _value_ and _value2_. If `0` then the slider  selects integers. | 0           | -                         |
| range                   | Boolean |Is the slider selecting a range instead of a single value? That is, use two thumbs instead of one? | false  | -                         |
| reverseLabels           | Boolean |Swap the location of the labels and values?                                                   | false       | -                         |
| reverseMinmax           | Boolean |Swap the location of the min and max sides?                                                   | false       | -                         |
| showValue               | String  |Show the current value(s)? The options are: `yes`, `no`, `true`, `false`, or `drag`. The latter means that the value is only displayed when dragging the thumb. | false |-|
| sizeStep                | Number  |The size of a slider step. Only one of _sizeStep_ and _numStep_ should be specified. If neither are specified, the slider is continuous.||-|
| tabindex                | Number  |An HTML tabindex. When assigned the controls can be focused and supports keyboard navigation  |             | -                         |
| thumb2Icon              | String  |Icon for the range thumb (the second thumb)                                                   | null        | -                         |
| thumbIcon               | String  |Icon for the thumb                                                                            | null        | -                         |
| thumbSize               | Number  |Size of thumb. Thumbs are squared.                                                            | 44          | -                         |
| thumbTooltip            | String  |Tooltip text for thumb                                                                        | ""          | -                         |
| thumbTooltipIcon        | String  |Icon for the thumb tooltip                                                                    | ""          | -                         |
| thumb2Tooltip           | String  |Tooltip text for second thumb (on range slider)                                               |             | -                         |
| thumb2TooltipIcon       | String  |Icon for the second thumb tooltip (on range slider)                                           |             | -                         |
| trackPlacement          | String  |Placement of the track relative to the thumb. Options: `center`, `start`, `end`. Horizontal sliders may use `top` instead of `start` and `bottom` instead of `end`. Vertical sliders may use `left` and `right`.| "center" |-|
| trackSize               | Number  |_width_ (if vertical) or _height_ (if horizontal) of the slider track.                        | 20          | -                         |
| value                   | Number  |Current value of slider.                                                                      | 0           | yes                       |
| value2                  | Number  |Current value of second thumb, if slider is a  _range_ slider.                                | 100         | yes                       |
| variant                 | String  |The variant of the slider. Intended for _theming_.                                            |             | -                         |
| vertical                | Boolean |Is slider orientation _vertical_ instead of _horizontal_?                                     | false       | -                         |
| hideMinMaxLabels        | Boolean |Hide min/max labels?                                                                          |             | -                         |
| validity                | String  |Returns the value of validation: "undefined", "unverified", "invalid" or "valid"              | "undefined" | -                         |
| extraValidation         | Function|Custom client validation function. This is invoked with the slider component itself as parameter, so that it can use any ptcs-slider property for custom validation. Can return `true` (= valid), `false` (= invalid), or `undefined` (ignore validation)||-|
| externalValidity        | String  |Controls the state of the validation. You can set this property to unvalidated, valid, or invalid.|         | -                         |
| hideValidationCriteria  | Boolean |Don't show validation criteria in unvalidated state?                                          |             | -                         |
| hideValidationError     | Boolean |Don't show validation error state?                                                            |             | -                         |
| hideValidationSuccess   | Boolean |Don't show validation success state?                                                          |             | -                         |
| minValidValue           | Number  |Validation criterion: minimum slider value                                                    |             | -                         |
| minValueFailureMessage  | String  |The message to display when the value is invalid because of min slider value                  |             | -                         |
| maxValidValue           | Number  |Validation criterion: maximum slider value                                                    |             | -                         |
| maxValueFailureMessage  | String  |The message to display when the current value exceeds the maximum slider value                |             | -                         |
| validationCriteria      | String  |The validation details message                                                                |             | -                         |
| validationCriteriaIcon  | String  |Icon for criteria state (unvalidated).                                                        |"cds:icon_info"| -                       |
| validationErrorIcon     | String  |Icon for error state (invalid).                                                               |"cds:icon_error"| -                      |
| validationMessage       | String  |The validation (title) message                                                                |             | -                         |
| validationSuccessDetails| String  |The validation success details message                                                        |             | -                         |
| validationSuccessIcon   | String  |Icon for success state (valid).                                                               |"cds:icon_success"| -                    |
| validationSuccessMessage| String  |The validation success (title) message.                                                       | "Success"   | -                         |
### Methods

The slider does not have any methods

## Styling

### Parts

| Part | Description |
|------|-------------|
| icon-min | The icon on the min side |
| icon-max | The icon on the max side |
| label | The slider label |
| min-label | The label on the min side |
| max-label | The label on the max side |
| slider-container | The container of the track and thumbs |
| track | The slider track |
| track-before | The part of the track that is before the thumb |
| track-between | The part of the track that is between the thumbs. Only visible in _range_ mode. |
| track-after | The part of the track that is after the thumb |
| thumb | The thumbs |
| thumb1 | The first thumb |
| thumb2 | The second (_range_) thumb |
| value | The slider value |
| value2 | The slider second value (if a _range_ slider) |


### State attributes

| Attribute | Description | Part |
|-----------|-------------|------|
| vertical | Is the slider vertical (instead of horizontal)? | `:host` |
| disabled | Is the slider disabled? | `:host` |
| range  | Is the slider a _range_ slider? | `:host` |
| reverse-minmax | Has the min and max swapped sides? | `:host` |
| reverse-labels | Have the labels and values swapped sides? | `:host` |
| range-collapsed | Is _value_ === _value2_? | `:host` |
| dragging-thumb | Is the thumb dragged? | `:host` |
| editing | Is the slider value edited? | `value`,  `value2` |


## ARIA

| Attribute | Value |
|-----------|-------|
| role | If _tabindex_ is assigned, the slider sets the _role_ attribute to `slider`.|
| aria-valuenow | Contains the current value. If slider is a _range_ slider, contains: `${value} to ${value2}`|
| aria-valuemin | The minimum value |
| aria-valuemax | The maximum value |
| aria-orientation | `vertical` if slider is vertical, otherwise not assigned |
| aria-describedby | Added to thumb when tooltip is showing; value: `ptcs-tooltip-overlay` |
| aria-disabled | Only present if the slider is disabled |
| aria-label | The value assigned to the label property |


### Keyboard Navigation

| Key | Action |
|-----|--------|
| ArrowLeft, ArrowDown | Decrease slider value with one unit |
| ArrowRight, ArrowUp | Increase slider value with one unit |
| End | Set slider value to the maximum value |
| ESC | Hide tooltip (if showing) |
| Home | Set slider value to the minimum value |
| PageDown | Decrease slider value with several units |
| PageUp | Increase slider value with several units |
| Shift-TAB | Leave slider or move focus to first thumb |
| TAB | Leave slider or move focus to second thumb |

