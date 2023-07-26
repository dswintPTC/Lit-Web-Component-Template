// data-viewer UI for drag button (#drag)

import {PTCS} from 'ptcs-library/library.js';
import 'ptcs-icon/ptcs-icon';

const fieldDM = Symbol('data-manager');

function drag(ev) {
    if (PTCS.wrongMouseButton(ev)) {
        return;
    }
    const el = ev.target.closest('[part=drag-icon]');
    if (!el || el.disabled) {
        return;
    }
    const {index, dataMgr} = el[fieldDM];
    const y0 = ev.clientY;
    const row = ev.target.closest('.row');
    const container = row && row.parentNode;
    const scroller = container && container.closest('ptcs-v-scroller2');
    const grid = scroller && scroller.getRootNode() && scroller.getRootNode().host;
    if (!grid) {
        return;
    }

    // Tell grid about the nodes we are moving
    const num = 1 + dataMgr.numOpenDescendants(index);
    grid.dragNodes(index, num);

    // Create draggable row (clone)
    const clone = scroller.createItemElement(index);
    clone.removeAttribute('is-dragged');
    clone.style.pointerEvents = 'none';
    clone.style.transform = '';
    clone.setAttribute('is-clone', '');

    // Create target node
    const target = document.createElement('div');
    target.setAttribute('part', 'drop-target');

    container.style.userSelect = 'none';
    container.appendChild(target);
    container.appendChild(clone);

    // Set bump height
    grid.style.setProperty('--ptcs-row-bump', `${clone.clientHeight}px`);

    const dy = row.getBoundingClientRect().top - clone.getBoundingClientRect().top;

    function scrollOffset() {
        const m = /^translateY\(([^p]+)px\).*$/g.exec(scroller.getElItemsTransform());
        return m ? Number(m[1]) : 0;
    }

    const so0 = scrollOffset();

    let scrollMode;
    let scrollHandle;
    let dropOn;

    function dropLevel() {
        const _index = dropOn.hasAttribute('bump') ? dropOn.index - 1 : dropOn.index;
        if (_index < 0) {
            return 0;
        }
        return dataMgr.treeLevel(_index) + (dataMgr.subTree(_index) === true ? 1 : 0);
    }

    // Called by timer to scroll grid when row is dragged above or below viewport
    function doScroll() {
        switch (scrollMode) {
            case 'up':
                scroller.dispatchEvent(new WheelEvent('wheel', {deltaY: -1, deltaMode: 1}));
                break;
            case 'down':
                scroller.dispatchEvent(new WheelEvent('wheel', {deltaY: 1, deltaMode: 1}));
                break;
        }
    }

    // Start / stop scroll timer, based on scrolling mode
    function setScroller(mode) {
        if (!mode === !scrollMode) {
            return;
        }
        scrollMode = mode;
        if (mode) {
            scrollHandle = setInterval(doScroll, 250);
        } else {
            clearInterval(scrollHandle);
            scrollHandle = undefined;
        }
    }

    // Start / stop scroll timer, based on mouse position
    function scroll(top, y, bottom) {
        if (top > y) {
            setScroller('up');
        } else if (y > bottom) {
            setScroller('down');
        } else {
            setScroller(null);
        }
    }

    // Dragged row has changed its position
    function mouseMove(ev2) {
        const b = scroller.elScroll.getBoundingClientRect();
        if (b.left > ev2.clientX || ev2.clientX > b.right) {
            // Prepare to abort drop
            dropOn = undefined;
            clone.remove();
            target.remove();
            grid.bumpNodes(100000);
            return;
        }

        clone.style.transform = `translateY(${ev2.clientY - y0 + dy + so0 - scrollOffset()}px)`;
        container.appendChild(clone);

        dropOn = grid.bumpNodes(ev2.clientY - b.top);
        if (dropOn) {
            clone.removeAttribute('cannot-drop');
            const txf = dropOn.style.transform;
            target.style.transform = dropOn.hasAttribute('bump') ? `${txf} translateY(-${clone.clientHeight}px)` : txf;
            const toggle = clone.querySelector('.tree-toggle');
            if (toggle && toggle.setToggleIndent) {
                toggle.setToggleIndent(dropLevel());
            }
            container.appendChild(target);
        } else {
            clone.setAttribute('cannot-drop', '');
            target.remove();
        }

        scroll(b.top, ev2.clientY, b.bottom);
    }

    function mouseUp(ev2) {
        setScroller(null);
        window.removeEventListener('mousemove', mouseMove);
        container.style.userSelect = '';
        clone.remove();
        target.remove();

        grid.dropNodes(dropOn);
    }

    // Track mouse
    window.addEventListener('mousemove', mouseMove);
    window.addEventListener('mouseup', mouseUp, {once: true});

    // Place clone at the correct place
    mouseMove(ev);
}


function createDrag() {
    const el = document.createElement('ptcs-icon');
    el.icon = 'cds:icon_drag';
    el.setAttribute('part', 'drag-icon');
    el.setAttribute('grid-action', '');
    el.addEventListener('mousedown', drag);
    el._createPropertyObserver('disabled', v => PTCS.setbattr(el, 'disabled', v), false);
    return el;
}


function assignDrag(el, item, index, dataMgr) {
    el[fieldDM] = {index, dataMgr};
}

export function uiDrag() {
    return {create: createDrag, assign: assignDrag, format: null};
}
