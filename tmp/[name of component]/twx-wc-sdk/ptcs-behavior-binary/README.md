# ptcs-behavior-binary

## Overview

A binary visual representation can be in _on_ or _off_ state. When the UI element is activated it toggles state.


## Usage Examples
Can be seen in: ptcs-checkbox and ptc-toggle-button

Example for ptcs-checkbox:
### Basic Usage

    <ptcs-checkbox variable="{{show}}">Show</ptcs-checkbox>

Assigns the variable _show_ to _true_ whenever the checkbox state becomes _on_, and to _false_ whenever it becomes _off_.

### Start in on state (checked)

    <ptcs-checkbox variable="{{show}}" checked>Show</ptcs-checkbox>


### Explicit variable values

    <ptcs-checkbox variable="{{tool}}" value-on="knife" value-off="fork">Use tool</ptcs-checkbox>

Assigns the variable _tool_ to "knife" whenever the checkbox is _on_ and "fork" otherwise.


## Component API

### Properties
| Property | Type | Description | Triggers a changed event |
|----------|------|-------------|--------------------------|
|checked| Boolean | Current element state (on = true, off = false) | Yes |
|disabled| Boolean | Is the element disabled? | No |
|state| Boolean | Same like "checked" but not reflected to attribute | No |
|valueOff| _any_ | The value that the element assigns to _variable_ when the element is turned _off_. Default: false | No |
|valueOn| _any_ | The value that the element assigns to _variable_ when the element is turned _on_. Default: _true_ | No |
|variable| _any_ | The variable that the element monitors and assigns | Yes |


### Methods

No methods


### State attributes

| Attribute | Description | Part |
|-----------|-------------|------|
| checked | Current element state (on = true, off = false) | :host |
| disabled | Is the element disabled? | :host |

