# ptcs-behavior-tabindex

## Overview

`ptcs-behavior-tabindex` is a behavior that tracks the tabindex.

The behavior watches the `tabindex` and `noTabindex` properties.

Some components can be also interactive subcomponents. The behavior has been created in order to dissociate the assignment of the default `tabindex` property when it is a component or a subcomponent.

If the element is the main component itself, then it will be assigned the value of the `tabindex` assigned to it by default.
If the element is used as a subcomponent of another component, it will be assigned the value `noTabindex`.

Each component will have a default tabindex property with its value and each subcomponent a `noTabindex` property, which removes the default tabindex property of the component.


## Usage Example

```javascript
import '../ptcs-behavior-tabindex/ptcs-behavior-tabindex.js';

const MyWC = PTCS.BehaviorTabindex(PolymerElement) {
    ...
};
```

This gives `MyWC` access to the tabindex behavior.

#### Tabindex property

```js
tabindex: {
    type:     String
}
```
 
The tabindex behavior will watch the `tabindex` and assigns its default value if it is defined.


#### NoTabindex property

```js
noTabindex: {
    type:  Boolean
}
```

The `noTabindex` property is useful when the component should not have its default tabindex.

In short, this is how it works (_if_ the component declares `noTabindex`):

- The tabindex behavior removes any `tabindex` property on the host.

- The component should assign `noTabindex` on each sub-component that should not be focusable like this:

```
<sub-component no-tabindex">
```

