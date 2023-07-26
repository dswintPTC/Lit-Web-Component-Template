# ptcs-lazy

## Overview

`<ptcs-lazy>` has no own visual representation and displays elements from its child template. Template elements are rendered when `hidden` property of `<ptcs-lazy>` component is set to `false` for a first time. The component works well as a child of `<ptcs-tab-set>` and `<ptcs-page-select>` components.

## Usage Examples

### Basic Usage

```html
<ptcs-lazy hidden>
  <template>
    <div>Text</div>
    <script>alert('load');</script>
  </template>
</ptcs-lazy>
```

## Component API

### Properties
| Property | Type | Description |  
|----------|------|-------------|  
| hidden | boolean | Hide/Show component content. |  
| mode | "none", "lazy", "unload", "reload" | Define component behavior when `hidden` change. Default is `lazy` |
| loading | boolean | Read only. Became `true` before content rendering and `false` after content rendering |  
| unloading | boolean | Read only. Became `true` before content removing and `false` after content removing |  
| loaded | boolean | Read only. Became `true` after content rendering and `false` after content removing. |  

### Content
Single `<template>` element with a document fragment expected as a component child  

### Events
| Name | Data | Description |  
|------|------|-------------|  
| loading | | When content rendering is started |  
| loaded | | When content is rendered |  
| unloading | | When content removing is started |  
| unloaded | | When content is removed |  

## Styling

`<ptcs-lazy>` is a pure logic component. It does not have any parts nor any CSS variable styling.  
