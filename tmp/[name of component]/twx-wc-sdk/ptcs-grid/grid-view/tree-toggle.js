// data-viewer UI for delete button (#delete)
import {PTCS} from 'ptcs-library/library.js';

import 'ptcs-icon/ptcs-icon';
import 'ptcs-icons/cds-icons.js';

const fieldDM = Symbol('data-manager');
const fieldToggle = Symbol('toggle');


function triggerIcon(opened, triggerType) {
    switch (triggerType) {
        case 'type1':
        case 'doublecarets':
            return 'cds:icon_double_chevron';
        case 'type2':
        case 'close':
            return opened ? 'cds:icon_close' : 'cds:icon_chevron_left';
        case 'type3':
        case 'singlecaret':
            return 'cds:icon_chevron_left';
        case 'type4':
        case 'plus/minus':
            return opened ? 'cds:icon_minus' : 'cds:icon_add';
        case 'type5':
        case 'arrow':
            return 'cds:icon_arrow_right';
    }
    return false;
}

function triggerRotate(opened, triggerType) {
    switch (triggerType) {
        case 'type1':
        case 'type3':
        case 'doublecarets':
        case 'singlecaret':
            return opened ? 270 : 180;
        case 'type2':
        case 'close':
            return opened ? 0 : 180;
        case 'type4':
        case 'plus/minus':
            return 0;
        case 'type5':
        case 'arrow':
            return opened ? 90 : 0;
    }
    return '0';
}


function activateToggle(ev) {
    if (PTCS.wrongMouseButton(ev)) {
        return;
    }
    const iconEl = ev.target.closest('[part=tree-toggle-icon]');
    if (!iconEl || iconEl.hasAttribute('disabled')) {
        return;
    }
    const {dataMgr, index} = iconEl[fieldDM];

    dataMgr.subTree(index, -1);
}

function keyboardToggle(ev) {
    if (ev.key === ' ') {
        activateToggle(ev);
        ev.preventDefault();
    }
}

function _$activateToggle() {
    if (this instanceof Element) {
        activateToggle({target: this});
    }
}

function createToggle(cell, config, toggle, hideToggle, create) {
    const body = document.createElement('ptcs-div');
    body.setAttribute('class', 'tree-toggle');
    body.style.display = 'flex';
    body.style.width = 'calc(100% - var(--ptcs-edit-control-width, 0px))';
    body.style['box-sizing'] = 'border-box';

    if (!hideToggle) {
        const icon = document.createElement('ptcs-icon');
        icon.setAttribute('part', 'tree-toggle-icon');
        icon.setAttribute('style-focus', ''); // Need help with focus styling
        icon.style.flex = '0 0 auto';
        icon[fieldToggle] = toggle;

        icon.addEventListener('mousedown', activateToggle);
        icon.addEventListener('keydown', keyboardToggle);
        icon._$activateToggle = _$activateToggle;

        body._createPropertyObserver('disabled', v => PTCS.setbattr(icon, 'disabled', v), false);
        body.appendChild(icon);

        PTCS.setbattr(cell, 'tree-toggle', true);
    }

    const title = create(cell, config);
    if (cell.hasAttribute('state-key')) {
        title.setAttribute('state-key', cell.getAttribute('state-key'));
    }
    title.style.flex = '1 1 auto';

    body.appendChild(title);

    body.setToggleIndent = function(level) {
        this.style.paddingLeft = `calc(${level} * var(--ptcs-toggle-indent, 24px))`;
    };

    return body;
}

function assignToggle(el, item, index, dataMgr, assign) {
    const iconEl = el.firstElementChild;
    if (iconEl.tagName === 'PTCS-ICON') {
        iconEl[fieldDM] = {dataMgr, index};
        const state = dataMgr.subTree(index);
        switch (state) {
            case false: // Available, but collapsed
            case null: // Don't know. Need to query
                iconEl.icon = triggerIcon(false, iconEl[fieldToggle]);
                iconEl.style.transform = `rotate(${triggerRotate(false, iconEl[fieldToggle])}deg)`;
                iconEl.style.cursor = 'pointer';
                iconEl.setAttribute('grid-action', '');
                break;
            case true: // Available, and expanded
                iconEl.icon = triggerIcon(true, iconEl[fieldToggle]);
                iconEl.style.transform = `rotate(${triggerRotate(true, iconEl[fieldToggle])}deg)`;
                iconEl.style.cursor = 'pointer';
                iconEl.setAttribute('grid-action', '');
                break;
            case 'loading': // Don't know. Working on it.
                iconEl.icon = 'cds:icon_sync';
                iconEl.style.transform = '';
                iconEl.removeAttribute('grid-action');
                break;
            default: // No children
                iconEl.style.cursor = '';
                iconEl.icon = null;
                iconEl.style.transform = 'rotate(0deg)';
                iconEl.removeAttribute('grid-action');
        }

        PTCS.setbattr(iconEl, 'loading', state === 'loading');
    }

    //el.style.paddingLeft = `${34 * dataMgr.treeLevel(index)}px`;
    el.setToggleIndent(dataMgr.treeLevel(index));

    return assign(el.lastElementChild, item, index, dataMgr);
}


export function uiTreeToggle(uiControl, opt) {
    const {create, assign, format} = uiControl;
    const toggle = triggerIcon(false, opt && opt.toggle) ? opt.toggle : 'type1'; // 'type1' if toggle is unrecognized
    const hideToggle = opt && opt.hideToggle;

    return {
        create: (cell, config) => createToggle(cell, config, toggle, hideToggle, create),
        assign: (el, item, index, dm) => assignToggle(el, item, index, dm, assign),
        format
    };
}
