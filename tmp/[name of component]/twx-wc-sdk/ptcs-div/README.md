# ptcs-div

## Overview

The &lt;ptcs-div> is a Polymer web component without any specific behaviours, or even a shadow dom.

It does however inform the _Style Aggregator_ about its presence. Therefore it is reachable for state processing.


## Usage Examples

### Basic Usage

```html
    <ptcs-component>
       <ptcs-div part="whatever">Any content that you may want to control with a state</ptcs-div>
    </ptcs-component>
```

The &lt;ptcs-div> can now be reached with this &lt;ptcs-state>:

```html
  <ptcs-state wc="ptcs-component" part="whatever">
```



### Properties

No own properties - but ready to take whatever properties the client wants to assign.

### Events

_No events_

### Methods

_No methods_

## ARIA

N/A

