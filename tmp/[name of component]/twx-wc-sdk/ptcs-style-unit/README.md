# ptcs-style-unit

## Overview

The &lt;ptcs-style-unit&gt; injects CSS styling into the shadow DOM of Web Components, allowing it to style the internal elements.

This component runs in two modes:
- Shadow DOM - For browsers that have [native support for shadow DOM](https://caniuse.com/#search=Shadow%20DOM%20v1).
- Shady DOM - For other browsers such as _Edge_. This mode has limitations that are discussed below.

The component detects the browser and sets the run mode automatically.

## Usage Examples

### Basic usage

Change the color of the radio button ring to red:

```html
<ptcs-style-unit wc="PTCS-RADIO">
  [part=exterior-ring] {
    stroke: #FF0000;
  }
</ptcs-style-unit>
```

### Styling a variant

Add a red border around the icon part in the primary ptcs-button's

```html
<ptcs-style-unit wc="PTCS-BUTTON.primary">
  [part=icon] {
    border: 1px solid red;
  }
</ptcs-style-unit>
```

### Styling sub-components

Style content in the clear-button part when it occurs in the date-field part in a ptcs-datepicker component:

```html
<ptcs-style-unit wc="PTCS-DATEPICKER" part="date-field:clear-button">...</ptcs-style-unit>
```

The wc attribute always specifies the component where the styling starts. If any parts of the component is a sub-component, the part attribute allows you to drill down in that hierarchy and deliver the style into the correct shadow DOM.


### Styling a specific component

Style content in a specific component:

```html
<ptcs-style-unit wc="#my-button">...</ptcs-style-unit>
```

When the value of the wc attribute starts with `#`, it specifies the id of the targeted component. The styling is injected only into that component.

In _Shady DOM_ mode, you should also specify the component name. Otherwise the ptcs-style-unit cannot prevent the styling from leaking into any sub-components.

Example:
```html
<ptcs-style-unit wc="#my-button.ptcs-button">...</ptcs-style-unit>
```

Now the ptcs-style-unit knows that `my-button` is (supposed to be) a ptcs-button and can add the proper scoping rules.

If the browser runs in _Shadow DOM_ mode it ignores this name.


## Component API

### Properties
| Property | Type | Description |Triggers a changed event?|
|--------- |------|-------------|-------------------------|
| part | String | The part to apply a style to. If you are apply styling to a part inside the target component, specify the part name using this property. If you are applying styles to a part within a part, then use ':' as a separator. If the part itself contains a part that should receive the styling, append that part name with a ':' as a separator. Repeat as long as needed. | no |
| wc | String | Specifies the target component. You can specify the component by a _name_ or by an _id_.  Use uppercase letters when using a name. If the component specifies a variant attribute, the variant value should be concatenated with '.' as a separator. Make sure that character cases match. The component id is prefixed with `#`. You should concatenate the component name with '.' as a separator for compatibility with _Shady DOM browsers_. See above for examples.  | no |


### Methods

This component does not have any methods.

## Styling

This component is not designed to be styled, and is hidden by default.

## Notes about ptcs-style-unit styling

Web components hide their implementation. The component has a public interface and all interaction with the component should _only_ use this interface. Writing code that is based on knowledge about the implementation details of a component is unsafe, since those details can change at any time. Only the public interface is stable and clearly documented.

When styling the internal structure of a web component, you should only use the public styling information. This information consists of:

- any state attributes for the component.
- the part names.
- any state attributes for the parts.

The styling is not even supposed to know if certain parts contains other parts. This is consistent with the emerging W3C specification [CSS Shadow Parts](https://www.w3.org/TR/css-shadow-parts-1/).


Adding any style sheet to the ptcs-style-unit in _Shadow DOM mode_ is possible, but not recommended. In _Shady DOM mode_ the styling _must_ follow the styling rules, or the translation to shady DOM fails.

The styling rules applies to the CSS selectors. A CSS selector in a ptcs-style-unit should have this structure:

### Selector structure in ptcs-style-unit

~~~
selector :- host part? | part

host     :- ':host' param?

param    :- '(' selector ')'

part     :- '[' 'part' is name] selector

is       :- '=' | '~=' | '|=' | '^='   note: use '~='

name     :- any valid part name

selector :- any valid CSS selector
~~~

### Examples of valid ptcs-style-unit selectors

~~~
:host { ... }

:host([disabled]) { ... }

:host(:not([disabled]):hover) { ... }

[part~=label] { ... }

:host([variant=primary]) [part~=label]:not([disabled]):hover { ... }
~~~

### Examples of _**invalid**_ ptcs-style-unit selectors

~~~
img { ... }

.selected {...}

[disabled] [part=foo] .active

:host(:hover) #my-button {}
~~~

# ptcs-style-context

## Overview

The &lt;ptcs-style-context&gt; creates isolated compartment for &lt;ptcs-style-unit&gt; and &lt;ptcs-state-unit&gt; action.  
&lt;ptcs-style-unit&gt; and &lt;ptcs-state-unit&gt; are affecting Web Components inside same &lt;ptcs-style-context&gt; compartment only, 
or whole document if no &lt;ptcs-style-context&gt; exist.

Native Shadow DOM is the only supported mode.

## Usage Example

Use different styling for a part of the document - `global` and `local` buttons will have different styles

```html
<ptcs-style-unit wc="PTCS-RADIO">
  [part=exterior-ring] {
    stroke: #FF0000;
  }
</ptcs-style-unit>
<ptcs-radio id="global"/>
<ptcs-style-context>
  <ptcs-style-unit wc="PTCS-RADIO">
    [part=exterior-ring] {
      stroke: #00FF00;
    }
  </ptcs-style-unit>
  <ptcs-radio id="local"/>
</ptcs-style-context>
```

## Component API

### Properties
| Property | Type | Description |  
|-|-|-|  
| styleAggregator | StyleAggregator | StyleAggregator of the context (read only)

### Methods

This component does not have any methods.

## Styling

This component is not designed to be styled, and should be used with `style="display:contents;"`
