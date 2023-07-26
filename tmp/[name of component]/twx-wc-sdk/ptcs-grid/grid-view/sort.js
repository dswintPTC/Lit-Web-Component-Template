/* eslint-disable no-confusing-arrow */
import {PTCS} from 'ptcs-library/library.js';
import 'ptcs-icons/cds-icons.js';

function revertToNoOrder(icon, dm, headerCell) {
    icon.icon = 'cds:icon_reorder_mini';
    icon.sort.order = 'none';

    if (dm) {
        dm.unobserve(this);
        dm = null;
    }

    headerCell.removeAttribute('sort');
}

// When data manager changes sort function
function sortChanged(sort, changeIconOnly = false) {
    const sr = this.sort;
    const headerCell = this.closest('[part~=header-cell]');

    if (!changeIconOnly && sr.dm && sr.dv && (!sr.dm.sort || !sr.dv.sortFunc() || sr.dm.sort.toString() !== sr.dv.sortFunc().toString())) {
        // If the sort was defined from outside but not from clicking on a sorting icon then the icon should get the default image.
        // I'm not sure about the quality of this check but I can't think of anything better.
        revertToNoOrder(this, sr.dm, headerCell);

        sr.dv.updateSortFields(this.name, {sortOrder: 'none'});
        return;
    }

    switch (sr.order) {
        case 'asc':
            this.icon = 'cds:icon_ascending_mini';

            headerCell.setAttribute('sort', 'ascending');

            break;
        case 'desc':
            this.icon = 'cds:icon_descending_mini';

            headerCell.setAttribute('sort', 'descending');

            break;
        default:
            revertToNoOrder(this, sr.dm, headerCell);
    }
}

// When sort icon is clicked
function sortClicked(externalSort = false) {
    return function(ev) {
        if (PTCS.wrongMouseButton(ev)) {
            return;
        }
        const getParentOf = el => el.nodeType === 11 && el.host ? el.host : el.parentNode;
        for (let el = this.parentNode; el; el = getParentOf(el)) {
            if (el.tagName === 'PTCS-CORE-GRID') {
                const dv = el.view;

                if (this.sort.dv !== dv) {
                    this.sort.dv = dv;
                }

                // Set sort function
                switch (this.sort.order) {
                    case 'none':
                        this.sort.order = 'asc';
                        break;
                    case 'asc':
                        this.sort.order = 'desc';
                        break;
                    case 'desc':
                    default:
                        this.sort.order = 'none';
                }

                dv.updateSortFields(this.name, {sortOrder: this.sort.order});

                if (!externalSort && el.data) {
                    const dm = el.data;
                    const sr = this.sort;

                    // Keep track of when the sort function changes
                    if (sr.dm !== dm) {
                        if (sr.dm) {
                            sr.dm.unobserve(this);
                        }
                        sr.dm = dm;
                        sr.dm.observe(this);
                    }

                    const sortFunc = dv.sortFunc();

                    if (sortFunc === null) {
                        dm.applyDefaultSort();
                    } else {
                        dm.sort = sortFunc;
                    }
                } else {
                    sortChanged.apply(this, [null, true]); // only change the icon image without applying an actual sort
                }

                this.dispatchEvent(new CustomEvent('sort-icon-click', {
                    bubbles:  true,
                    composed: true
                }));

                ev.preventDefault();
            }
        }
    };
}

export const sortIcon = (dm, dv, name, externalSort) => {
    const icon = document.createElement('ptcs-icon');
    icon.icon = 'cds:icon_reorder_mini';
    icon.name = name;
    icon.setAttribute('part', 'sort-icon');

    icon.sort = {order: 'none', dm, dv};

    if (dm) {
        dm.observe(icon);
    }
    dv.updateSortFields(name, {icon});

    icon.dmSort = sortChanged; // Callback when data manager changes sorting

    const hitArea = document.createElement('div');
    hitArea.setAttribute('part', 'hit-area');
    hitArea.setAttribute('grid-action', '');
    hitArea.setAttribute('style-focus', ''); // Need help with focus styling
    hitArea.appendChild(icon);

    hitArea.addEventListener('click', sortClicked(externalSort).bind(icon));
    hitArea.addEventListener('keydown', ev => {
        if (ev.key === ' ' || ev.key === 'Enter') {
            ev.preventDefault();
            hitArea.click();
        }
    });

    if (!PTCS.isIOS) {
        // Trigger highlight of icon via a state attribute 'hit' styling the icon same as when hovered
        hitArea.addEventListener('mouseenter', ev => ev.target.firstChild.setAttribute('hit', ''));
        hitArea.addEventListener('mouseleave', ev => ev.target.firstChild.removeAttribute('hit'));
    }

    // Workaround to prevent Chrome from selecting the next element when double-clicking on the icon
    hitArea.addEventListener('mousedown', function(e) {
        if (PTCS.wrongMouseButton(e)) {
            return;
        }
        e.preventDefault();
    }, false);

    return hitArea;
};
