# ptcs-icon

## Overview

A ptcs-icon displays an icon. The icon can either be part of an SVG icon set or a separate icon file.

Using property `size` you have 4 predefined icon sizes available, with the size set via theming:
| name | size (height and width are equal)|
|-------|----|
|`small`|icon size 18px + 8px padding on all sides = 34px |
|`medium`|icon size 22px + 8px padding on all sides = 38px |
|`large`|icon size 60px + 8px padding on all sides = 76px |
|`xlarge`|icon size 80px + 8px padding on all sides = 96px |

The default size is `small`.

The value `custom` has no padding in theming with CSS `height` and `width` set to 100%.

As an alternative to using property `size`, the size can be controlled directly via CSS styling.

## Usage Examples

### Icon in a separate file

```html
<ptcs-icon icon="icon.svg"></ptcs-icon>
```

### Icon referenced via url

```html
<ptcs-icon
  icon="https://upload.wikimedia.org/wikipedia/commons/3/3a/Tux_Mono.svg"
  size="xlarge"
></ptcs-icon>
```

### Icon with 'small' size

```html
<ptcs-image size="small" icon="icon.svg"></ptcs-image>
```

### Three icons, from the same icon set, with screen reader labels

```html
<ptcs-image icon-set="my-icons.svg" icon="play" alt="start video"></ptcs-image>
<ptcs-image icon-set="my-icons.svg" icon="pause" alt="pause video"></ptcs-image>
<ptcs-image
  icon-set="my-icons.svg"
  icon="next"
  alt="skip to next video"
></ptcs-image>
```

Icons do not respond to user interaction, they are non-interactive.

Inline SVG icons (such as from an icon set) can by styled via CSS, so by applying a `fill` color one could e.g. _grey out_ a disabled icon.

```html
ptcs-icon[disabled] { /* ONLY inline SVG can be styled */ fill: #adb5bd; }
```

SVG icons referenced as a file / url cannot have their styling overridden in same way as the SVG is not inline.

## Component API

### Properties

| Property        | Type    | Description                                                                                                                              | Default |
| --------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| alt             | String  | A descriptive text of the icon, intended for screen readers / assistive technologies                                                     |         |
| icon            | String  | If `iconSet` is unspecified, `icon` specifies a separate icon file. If `iconSet` is specified, `icon` specifies an icon in that icon set |         |
| iconSet         | String  | A URL to an icon set from which `icon` selects an icon (see below for details about the icon set format)                                 |         |
| size            | String  | The size of the image: `small` \| `medium` \| `large` \| `xlarge` \| `custom`\|                                                          | "small" |
| preventCaching  | Boolean | Appends a timestamp suffix to the icon url to prevent the browser from caching the icon, forcing a fresh reload                          | false   |
| placeholder     | Boolean | If icon is empty a placeholder image will use used instead when placeholder is set to true                                               | false   |
| iconWidth       | String  | Sets a fixed width for the icon                                                                                                          |         |
| iconHeight      | String  | Sets a fixed height for the icon                                                                                                         |         |

### Events

_No events_

### Methods

_No methods_

## Icon set file format

The icon set is based on SVG with each icon identified via `id` attribute. This is a common format that many SVG sprite tools generate natively.

Example icon set:

```xml
<svg version="1.1" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <g id="add-location"><path d="M12 2C8.14 2 5 5.14 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.86-3.14-7-7-7zm4 8h-3v3h-2v-3H8V8h3V5h2v3h3v2z"></path></g>
    <g id="beenhere"><path d="M19 1H5c-1.1 0-1.99.9-1.99 2L3 15.93c0 .69.35 1.3.88 1.66L12 23l8.11-5.41c.53-.36.88-.97.88-1.66L21 3c0-1.1-.9-2-2-2zm-9 15l-5-5 1.41-1.41L10 13.17l7.59-7.59L19 7l-9 9z"></path></g>
    <g id="directions"><path d="M21.71 11.29l-9-9c-.39-.39-1.02-.39-1.41 0l-9 9c-.39.39-.39 1.02 0 1.41l9 9c.39.39 1.02.39 1.41 0l9-9c.39-.38.39-1.01 0-1.41zM14 14.5V12h-4v3H8v-4c0-.55.45-1 1-1h5V7.5l3.5 3.5-3.5 3.5z"></path></g>
   ...
  </defs>
</svg>
```

## Styling

### Parts

| Part  | Description        |
| ----- | ------------------ |
| image | The icon container |

### State attributes

| Attribute       | Description                                              | Part  |
| --------------- | -------------------------------------------------------- | ----- |
| prevent-caching | Should the icon always be reloaded afresh?               | :host |
| placeholder     | Use a default icon when the icon property is unassigned? | :host |
