// data-viewer UI for creating grid column headers

import 'ptcs-label/ptcs-label';
import 'ptcs-icon/ptcs-icon';
import {createPTCLabelForGridCellWithUIProp} from './gv-text';

import {sortIcon} from './sort';

function isColumnSortable(sortable, compare) {
    if (!sortable) {
        return false;
    }

    const f = typeof sortable === 'function' ? sortable : compare;

    return !!f;
}

// Create column header creating function
export function headerCreatorFunc({label, sortable, externalSort, compare, singleLine, maxHeight, hAlign, vAlign, name}) {
    const isSortable = isColumnSortable(sortable, compare);

    if (isSortable && !label) {
        // No label, so create a lonely sort icon
        return (dm, dv) => sortIcon(dm, dv, name, externalSort);
    }

    // Create container that vertically centers the label and sort icon
    const container = () => {
        const div = document.createElement('div');
        div.style.display = 'flex';
        div.style.alignItems = 'center';
        div.style.width = '100%';
        return div;
    };

    if (typeof label === 'string') {
        return (dm, dv, cell, opt = {}) => {
            const cntr = container();
            const el = createPTCLabelForGridCellWithUIProp({singleLine, minHeight: '0', maxHeight, part: 'header-label'});
            el.setAttribute('variant', 'grid-item');
            el.label = label;
            if (!singleLine) {
                // In multiline case label strethes itself on the cell. We should use its own horizontal alignment.
                el.horizontalAlignment = hAlign;
                let vAlignment = vAlign;
                if (vAlign === 'top') {
                    vAlignment = 'flex-start';
                } else if (vAlign === 'bottom') {
                    vAlignment = 'flex-end';
                }
                el.verticalAlignment = vAlignment;
            }
            cntr.appendChild(el);
            if (isSortable && !opt.noActions) {
                cntr.appendChild(sortIcon(dm, dv, name, externalSort));
            }

            el.setAttribute('disable-tooltip', '');
            cell.tooltipFunc = () => el.tooltipFunc();

            return cntr;
        };
    }

    if (typeof label === 'function') {
        return (dm, dv, cell) => {
            const cntr = container();
            const el = label({singleLine, maxHeight});

            cntr.appendChild(el);
            if (isSortable) {
                cntr.appendChild(sortIcon(dm, dv, name, externalSort));
            }

            if (typeof el.tooltipFunc === 'function') {
                el.setAttribute('disable-tooltip', '');
                cell.tooltipFunc = el.tooltipFunc.bind(el);
            }

            return cntr;
        };
    }

    console.error('Invalid label');
    return null;
}
