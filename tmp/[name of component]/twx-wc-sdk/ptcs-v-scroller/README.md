# ptcs-v-scroller

## Overview

&lt;ptcs-v-scroller&gt; is a _virtual scroller_, providing a scrolling viewport into any enumerable content. Large numbers of elements can therfore be scrolled efficiently, since only the elements visible in the viewport will be stored in the DOM. Those elements will be swapped as the list is scrolled.

## Usage Examples

The &lt;ptcs-v-scroller&gt; is only intended be used with javascript, since it requires a function that creates and updates the item elements.

~~~
<ptcs-v-scroller
    num-items=[[number-of-items]]
    create-item-element=[[js function]]>
</ptcs-v-scroller>
~~~

## The create-item-element function

The `create-item-element` function is called whenever the scroller needs to display a new item. The item is referenced using an zero-based `index`.

If the virtual scroller has a spare element that no longer is visible it will pass this element to the function. If possible, this element should be reused, since that often boosts performance.

Only elements that has previously been created by `create-item-element` will be sent for re-use. No "foreign" elements will be passed.

This is a sample pattern of how this function can be implemented:

~~~js
document.getElementById('scroller').createItemElement = (index, el) => {
    if (!el) {
        // create the element structure and assign fixed attributes / properties
        el = createEmptyElement();
    }

    // Assign the specific values of item[index] to the element
    updateElement(el, index)

    // Return the element
    return el;
  };
~~~

### Properties
| Property | Type | Description |
|----------|------|-------------|
| `numItems` | Number | The number of items in the virtual scroller |
| `createItemElement` | Function | A function that creates an element that represents a specific item (see above) |

### Events

| Name | Description |
|------|-------------|
|focused-item-updated| Emitted when a list item gets focus from keyboard navigation (ptcs-list is listening for this to update the list item's truncation tooltip, if any) |


### Methods

| Signature | Description |
|-----------|-------------|
| `refresh`(`item`) | `refresh()` resend elements to `createItemElement`, so that the displayed element reflects any changes to the item data. If `item` is `undefined` all loaded elements will be refreshed. If `item` is a `Number` only the element that corresponds to that index will be refreshed - if it is currently loaded. |
| `rebuild`() | `rebuild()` works like `refresh()`, except for that it first removes all elements. `rebuild()` is useful if the basic format of the item elements changes, possibly because of some state change. |
| `scrollTo`(`index`) | `scrollTo()` scrolls `item`[`index`] into the viewport, if needed. Note that the client can also manipulate the scroll position with the DOM property `scrollTop`.
|

