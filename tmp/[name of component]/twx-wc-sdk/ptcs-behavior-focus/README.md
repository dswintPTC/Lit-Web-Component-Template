# ptcs-behavior-focus

## Overview

`ptcs-behavior-focus` is a behavior that tracks the (keyboard) focus and displays a focus border. Disabled elements are allowed to get focus.

By default the focus behavior tracks the focus of the derived component itself and adds the focus border around it if it has focus, but the behavior can instead track the focus of other elements and add the border around yet other elements.

The behavior watches the `tabindex` attributes. The behavior is only active if `tabindex` is present.

If the element is inside a clipping element (CSS `overflow` is `hidden` or `auto`) only the visible part will be indicated as focused. If the element is entirely out of view the focus indicator is hidden.

Each focused area can style the focus border and its distance from the focused element with CSS variables.


## Usage Example

```javascript
import '../ptcs-behavior-focus/ptcs-behavior-focus.js';

const MyWC = PTCS.BehaviorFocus(PolymerElement) {
    ...
};
```

This gives `MyWC` access to the focus behavior.

## Component API

### Track focus

```js
_trackFocus(elFocus, elHilite)
```

Track the focus of `elFocus`. When it gets focus draw the focus border around `elHilite`.

`elHilite` can have any of these values:

- _falsy_ (`null`, `undefined`, `0`, ...). In this case the focus border will be applied to `elFocus`

- A _DOM element_

- A function that returns a _DOM element_ or _falsy_. If _falsy_ is returned, then no focus border will be displayed.

### Untrack focus

```js
_untrackFocus(elFocus)
```

Stop monitoring the focus of `elFocus`.

### Customize the Focus Behavior

_NOTE:_ This section describes methods and properties that the _derived component_ can add to affect the focus behavior.

#### Customize focus tracking

```js
_initTrackFocus()
```

By default, the focus behavior calls `this._trackFocus(this)` in the `ready()` callback. This can be customized by adding the method `_initTrackFocus()` to the derived component. If so, the focus initialization is delegated to this method.


#### Space Bar Activation

```js
_spaceActivate: {
    type:     Boolean,
    value:    true,
    readOnly: true
}
```

If the derived component declares the property `_spaceActivate` and assigns it a _truthy_ value, the focus behavior will watch the keyboard and simulate a _mouse click_ on the component if _space bar_ is pressed.

This property is only used in the `ready()` callback. Any subsequent changes are ignored.


#### Enter Key Activation

```js
_enterActivate: {
    type:     Boolean,
    value:    true,
    readOnly: true
}
```

If the derived component declares the property `_enterActivate` and assigns it a _truthy_ value, the focus behavior will watch the keyboard and simulate a _mouse click_ on the component if _enter_ key is pressed.

This property is only used in the `ready()` callback. Any subsequent changes are ignored.


#### ArrowDown Key Activation

```js
_arrowDownActivate: {
    type: Boolean
}
```

If the derived component declares the property `_arrowDownActivate` and assigns it a _truthy_ value, the focus behavior will watch the keyboard and simulate a _mouse click_ on the component if _ArrowDown_ key is pressed.

This property is only used in the `ready()` callback. Any subsequent changes are ignored.


#### Delegate Focus

```js
_delegatedFocus: {
    type:  String
}
```

The `_delegatedFocus` property is useful when the component should not have focus itself, but the focus should be delegated to the sub-component(s).

In short, this is how it works (_if_ the component declares `_delegatedFocus`):

- The focus behavior removes any `tabindex` attribute on the host, but before removing it it assigns the value to the `_delegatedFocus` property.

- The component should assign `tabindex` on each sub-component that should be focusable like this:

```
<sub-component tabindex$="[[_delegatedFocus]]">
```

## Styling

The default styling of the focus border can be customized with these CSS variables:

|variable|description|default|
|--------|-----------|-------|
|--ptcs-focus-overlay--padding|distance from element area to focus border|`8px`|
|--ptcs-focus-overlay--padding-left|distance from element area to left focus border|`--ptcs-focus-overlay--padding`|
|--ptcs-focus-overlay--padding-right|distance from element area to right focus border|`--ptcs-focus-overlay--padding`|
|--ptcs-focus-overlay--padding-top|distance from element area to top focus border|`--ptcs-focus-overlay--padding`|
|--ptcs-focus-overlay--padding-bottom|distance from element area to bottom focus border|`--ptcs-focus-overlay--padding`|
|--ptcs-focus-overlay--border-style|focus border style| `dashed`|
|--ptcs-focus-overlay--border-width|focus border width|`1px`|
|--ptcs-focus-overlay--border-color|focus border color| `#5d2fec`|
|--ptcs-focus-overlay--border-radius|focus border radius| `0`|

The focus behavior looks for these variables in the styling of the focused element. Each element can therefore specify its own focus border.
