# ptcs-image

## Overview

A ptcs-image displays an image file. It supports the image file formats that the browser supports

The widget is read-only, not responding to user interaction.

The dimensions of the image is either:
- relative to the intrinsic dimension of the image, or
- expands to the dimensions of the image container, or
- specified in CSS units that are independent of the image and its container


If the image size is relative to its container the image is either _stretched or contracted_ to match the container dimension (ignoring the aspect ratio) or _cropped_ or only _partially fills_ the container.


## Usage Examples

### Image with intrinsic width and height

~~~html
  <ptcs-image src="image.png"></ptcs-image>
~~~

### Image with 'small' predefined dimensions

~~~html
  <ptcs-image size="small" src="image.jpg"></ptcs-image>
~~~

### Image with half the intrinsic dimensions

~~~html
  <ptcs-image size="50%" src="image.png"></ptcs-image>
~~~

### Image resized to fill its container

~~~html
  <ptcs-image size="fit" src="image.png"></ptcs-image>
~~~

## Component API

### Properties
| Property       | Type    | Description                                                                                                                    | Default |
| -------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------ | ------- |
| alt            | String  | A descriptive text of the image, mainly intended for screen readers. This text is also displayed if the image cannot be loaded |         |
| labelVariant   | String  | `ptcs-label` variant for the label text                                                                                        | "label" |
| position       | String  | Specifies the position of the image when `size` is either `contain`, `cover`, `fit-x` or `fit-y`. See below for details.       |         |
| size           | String  | Specifies the size of the image. See below for details.                                                                        | "auto"  |
| src            | String  | The source / url of the image                                                                                                  |         |
| preventCaching | Boolean | Prevents the image source from being cached so that the most recent version is shown when reloaded                             | false   |
| noPlaceholder  | Boolean | Don't show placeholder image if the src property is not populated                                                              |         |

### The `size` property

The `size` property specifies the dimension of the displayed image.


size = `auto` | `cover` | `contain` | `fit` | `fit-x` | `fit-y` | `small` | `medium` | `large` | `xlarge` | _length_ | _length_ `auto` | `auto` _length_ | _length_ _length_


| Value    | Description                                                                                                    |
| -------- | -------------------------------------------------------------------------------------------------------------- |
| `auto`   | The image is displayed with its original dimensions. This is the default value.                                |
| `cover`  | The image is resized, retaining the aspect ratio, to cover the area of the container element. If the container has a different aspect ratio a part of the image will be truncated. This can be controlled with the `position` property. (See below)|
| `contain`| The image is resized, retaining the aspect ratio, to fit inside the container element. If the container has a different aspect ratio a part of the container background will be visible. This can be controlled with the `position` property. (See below)|
| `fit`    | The image is resized to completly fill the container element. The aspect ratio is not retained.                |
| `fit-x`  | The image is resized to completly fill the container element horizontally, retaining the aspect ratio. The image may therefore be clipped vertically or part of the container might be visible above and / or below the image. This can be controlled with the `position` property. (See below) |
| `fit-y`  | The image is resized to completly fill the container element vertically, retaining the aspect ratio. The image may therefore be clipped horizontally or part of the container might be visible to the left and / or to the right of the image. This can be controlled with the `position` property. (See below) |
| `small`  | Sets width and height to _34px_                                                                                |
| `medium` | Sets width and height to _40px_                                                                                |
| `large`  | Sets width and height to _80px_                                                                                |
| `xlarge` | Sets width and height to _140px_                                                                               |
| _length_ | Same as _length_ `auto` (See below)                                                                            |
|_length_&nbsp;`auto`  | _length_ specifies the width of the image. The aspect ratio is retained.                           |
|`auto`&nbsp;length    | _length_ specifies the height of the image. The aspect ratio is retained.                          |
|_length_&nbsp;_length_| The first _length_ specifies the width of the image and the second _length_ the height             |

Note:
- a _length_ is a number directly followed by a optional unit (no whitespace between)
- if no  unit is specified the default is `px`
- the unit `%` specifies the length as a percentage
 relative to the intrinsic width or height of the image


### The `position` property

The `position` property specifies where the image will be positioned inside its container if either parts of the image is cropped (in `cover` mode) or if parts of the container is visible (in `contain` mode).

The value consist of a combiation of keywords:

| Keyword | Description                                                       |
| ------- | ----------------------------------------------------------------- |
| `center`| center the image horizontally or vertically or in both directions |
| `bottom`| place the image at the _bottom_ side of the container             |
| `left`  | place the image at the _left_ side of the container               |
| `right` | place the image at the _right_ side of the container              |
| `top`   | place the image at the _top_ side of the container                |

The default value is: `left top`

### Events

| Name  | Data                                            | Description                                                                   |
| ----- |------------------------------------------------ | ----------------------------------------------------------------------------- |
| load  | ev.detail.naturalWidth, ev.detail.naturalHeight | Generated when the image has been succesfully loaded (intrinsic size details) |
| error | -                                               | Generated if there is an error loading the image                              |


### Methods

No methods

## Styling

### Parts

| Part      | Description                                                  |
| --------- | ------------------------------------------------------------ |
| alt-label | Label that shows the `alt` text if the image can't be loaded |
| image     | The image container                                          |


### State attributes

| Attribute     | Description                                        | Part  |
| ------------- | -------------------------------------------------- | ----- |
| container-dim | Is the image dimension dependent on the container? | :host |
| error         | Was there an error when loading the image?         | :host |
