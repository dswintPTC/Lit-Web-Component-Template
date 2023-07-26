# ptcs-state-unit

## Overview

The &lt;ptcs-state-unit&gt; adds a state handler to one or several web components. The target components must use the `BehaviorStyleable` behavior, or the state handler will not find them.

A state handler consists of two parts:
- a state name
- a state function, that maps an arbitrary value to a (small) predefined set of strings

The state handler is hence a _classifier_ that maps values down to a small set of categories. Some possible examples are:

- cold, normal, hot
- hi, ok, low
- true, false

The state handler observes a specific property on the web component. Whenever the property is updated the state function is invoked. The resulting value is assigned to an attribute on the component. The name of the attribute is based on the state name. Currently the attribute name is `ptcstate-{`state-name`}`. Hence, if the name of the state is `temperature`, the name of the state attribute is `ptcstate-temperature`.

When the attribute is present on the component element CSS selectors can target it to bind state specific styling.

If the state function returns a _falsy_ value, the state attribute is removed.

This component only works in browsers that have [native support for shadow DOM](https://caniuse.com/#search=Shadow%20DOM%20v1).


## Usage Examples

The state function is not supposed to be added as HTML, but  programmatically. A simple example:

~~~js
// Create state element
const el = document.createElement('ptcs-state-unit');

// Attach it to a component with ID=foo
el.wc = '#foo';

// Observe the property named value
el.property = 'value';

// Attach the state
el.state = {
    name: 'water',
    func: temperature => {
        if (temperature < 0) {
            return 'ice';
        }
        if (temperature < 100) {
            return 'liquid';
        }
        return 'steam';
    }
};

// Attaching the state to the DOM activates it
// Removing it deactivates it
document.body.appendChild(el);
~~~

## Component API

### Properties
| Property | Type | Description |
|----------|------|-------------|
| wc | String | The name of the target web component name in uppercase letters plus an optional (case sensitive) variant name. If the variant is present, a `.` separates it from the component name. Alternatively, `wc` can be specified as an `#` followed by the id of the target component.|
| part | String | A part name, if the state should be pushed into a specific part. The part name can consists of several parts with `:` as separator. Each part must be a proper web component. The state drills down and attaches to the last part.|
| property | String | Name of property on target component that should be observed - and used as input to the state function. |
| state | Object | An object with two fields: `name` that specifies the name of the state and `func` that is the state function.|

### Events

_No events_

### Methods

_No methods_
