# ptcs-pagination-input-number

## Visual

<img src="img/inputNumber.png">

## Overview

 Input number was designed for the pagination widget. Component allows only to type the positive, natural numbers. If a number greater than 'totalNumberOfPages' param was introduced then a message about exceeding the max value appears. Pressing `Enter` or clicking outside causes the entered value to be set. If the entered value is 0 or it is greater than 'totalNumberOfPages' param, then the final value is the previous value. One can get the current approved value using 'value' getter.

## Usage Examples

### Basic Usage

~~~html
<ptcs-pagination-input-number total-number-of-pages="100"></ptcs-pagination-input-number>
~~~

~~~js
const ptcsInputNumber = document.querySelector('ptcs-pagination-input-number');
...
console.log("The current approved value is", ptcsInputNumber.value);
~~~

## Component API

### Properties

| Property | Type | Description | Triggers a changed event |
|--------- |------|-------------|--------------------------|
| value | Number | Current approved value, read only | No  |
| totalNumberOfPages | Number | Maximum number which can by type in input number | No |
| errorMessage | String | Error Message when selected page number is higher then last page | No |


### Events

| Name           | Description |
|----------------|----------------------------------------------------------------------------------|
| value-approved | Fired when entered data was accepted (pressing ENTER or clicking outside (blur)) |

### Methods

No methods.

## Styling

### Parts

| Part | Description |
|-----------|-------------|
| pagination-input | The container for the slected page number |
| error-text | Error message below "pagination-input" |