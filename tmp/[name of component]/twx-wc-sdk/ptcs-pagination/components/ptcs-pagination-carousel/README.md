# ptcs-pagination-carousel


## Overview

The carousel is part of the pagination. It contains navigation buttons for page numbers. The subcomponent has a standard size, and a smaller size a few items are visible. Clicking on the edge button causes the carousel to refresh.

## Usage Examples

### Basic Usage

~~~html
<ptcs-pagination-carousel total-number-of-pages="10"></ptcs-pagination-carousel>
~~~

### Small version

~~~html
<ptcs-pagination-carousel total-number-of-pages="10" min-size></ptcs-pagination-carousel>
~~~

## Component API

### Properties
| Property | Type | Description | Triggers a changed event |
|--------- |------|-------------|--------------------------|
| currentPage | Number | The current selected page | No |
| totalNumberOfPages | Number | Corresponds to the number of buttons | No |
| minSize | Boolean | Carousel is displayed in the minimum size if set | No |

### Events

|  Name  | Data        | Description                         |
|--------|-------------|-------------------------------------|
| change | page number | Triggers when the current page changes |


### Methods

No methods.

## Styling

### Parts

| Part | Description |
|-----------|-------------|
| left-arrow | The back arrow |
| three-dots | The ellipsis element between page numbers |
| page-number-button | The current page number button |
| right-arrow | The forward arrow |
