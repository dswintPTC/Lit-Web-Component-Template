// data-viewer UI for delete button (#delete)

import 'ptcs-button/ptcs-button';

function createDelete(cell, config) {
    const el = document.createElement('ptcs-button');
    el.icon = 'delete';
    el.variant = 'small';
    el.setAttribute('part', 'delete-button');
    el.setAttribute('grid-action', '');
    // remove default tabindex
    el.noTabindex = true;
    el.tooltip = 'Delete row';
    el.addEventListener('action', () => el.__dataMgr.deleteItem(el.__index));
    return el;
}

function updateDelete(el, item, index, dataMgr) {
    el.__index = index;
    el.__dataMgr = dataMgr;
}

export function uiDelete(config) {
    return {create: cell => createDelete(cell, config), assign: updateDelete, format: null};
}
