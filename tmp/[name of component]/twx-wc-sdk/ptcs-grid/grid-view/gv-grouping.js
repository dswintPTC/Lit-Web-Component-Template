// data-viewer UI for grouping row (#group)

import 'ptcs-button/ptcs-button';
import 'ptcs-icons/cds-icons.js';

function clickOnGroup(ev) {
    for (let el = ev.target; el; el = el.parentNode) {
        if (el.classList && el.classList.contains('grouping') && typeof el.parentNode.index === 'number') {
            const index = el.parentNode.index;
            for (el = el.parentNode; el; el = (el.nodeType === 11 && el.host) ? el.host : el.parentNode) {
                if (el.tagName === 'PTCS-CORE-GRID') {
                    el.data.toggleGroup(index);
                    break;
                }
            }
        }
    }
}

function groupMarker(cell) {
    cell.classList.add('grouping');
    cell.style.gridColumn = '1/1000';
    cell.addEventListener('click', clickOnGroup);
}

function createGrouping(cell) {
    groupMarker(cell);
    const el = document.createElement('div');
    el.classList.add('grouping-div');
    const icon = document.createElement('ptcs-icon');
    icon.icon = 'cds:icon_chevron_right_mini';
    icon.style.transform = 'rotate(0deg)';
    icon.style.transition = 'transform 300ms';
    el.appendChild(icon);
    const label = document.createElement('ptcs-label');
    el.appendChild(label);
    const num = document.createElement('ptcs-label');
    num.classList.add('grouping-count');
    el.appendChild(num);
    return el;
}

function updateGrouping(el, value, index) {
    // TODO: specify indent via options?
    el.firstChild.style.marginLeft = `${20 * value.level}px`;
    el.firstChild.style.transform = value.isOpen ? 'rotate(90deg)' : 'rotate(0deg)';
    el.firstChild.nextSibling.label = value.$groupKey;
    el.firstChild.nextSibling.nextSibling.label = `(${value.count})`;
}

export function uiGrouping() {
    return {create: createGrouping, assign: updateGrouping};
}
