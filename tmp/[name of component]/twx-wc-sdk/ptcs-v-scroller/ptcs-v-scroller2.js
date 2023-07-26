import {LitElement} from 'lit';
import {L2Pw} from 'ptcs-library/library-lit';
import {PTCS} from 'ptcs-library/library.js';
import 'ptcs-behavior-focus/ptcs-behavior-focus.js';
import {closeTooltip} from 'ptcs-behavior-tooltip/ptcs-behavior-tooltip.js';
import {AnimScroller} from './anim-scroller.js';

// TODO: Optimize number of calls to _placeItems

const SCROLL_LITTLE = 25;
const SCROLL_MORE = 80;

const itemHeight = el => {
    // itemHeight need to use sub-pixel precision (el.offsetHeight is not good enough)
    const bb = el.getBoundingClientRect();
    return bb.bottom - bb.top;
};

// A virtual scroller
PTCS.VScroller2 = class extends PTCS.BehaviorFocus(L2Pw(LitElement)) {
    static get is() {
        return 'ptcs-v-scroller2';
    }

    static get properties() {
        return {
            // Number of items as assigned by the client
            numItems: {
                type:        Number,
                observer:    '_change',
                observeWhen: 'immediate',
                noAccessor:  true
            },

            // Client supplied function for creating elements from items
            createItemElement: {
                type:     Function, // args: (index, el-reuse?)
                value:    () => PTCS.VScroller2._dfltCreateItemElement,
                observer: '_change'
            },

            // Client supplied function for recycling item elements
            recycleItemElement: {
                type: Function // args: (el)
            },

            // Client supplied function for picking element to reuse
            pickReuseItemElement: {
                type: Function // args: (listOfItemElements, index)
            },

            // Total number of items
            _numItems: {
                type:  Number,
                value: 0
            },

            // Index to first loaded item
            _startIx: {
                type:  Number,
                value: 0
            },

            // Index to last loaded item + 1 (if _startIx === _endIx no items are loaded)
            _endIx: {
                type:  Number,
                value: 0
            },

            // Height of loaded items that are above the viewport
            _aboveH: {
                type:  Number,
                value: 0
            },

            // Adapt if scroller area changes
            _resizeObserver: ResizeObserver,

            // Check if item areas changes
            _resizeItemObserver: ResizeObserver,

            // Container that represent the full height of all items
            _elSpace: Element,

            // Container that scrolls _elSpace
            _elScroll: Element,

            // Container for _elItems
            _elCntr: Element,

            // Container for the loaded items
            _elItems: Element,

            // Index of item with keyboard focus
            focusedItemIndex: {
                type:  Number,
                value: 0
            },

            // Are all items visible with a gap at the end of the grid?
            gap: {
                type:   Boolean,
                notify: true
            }
        };
    }

    static _dfltCreateItemElement(index, el) {
        if (!el) {
            el = document.createElement('div');
        }
        el.textContent = `ITEM ${index}`;
        return el;
    }

    constructor(...arg) {
        super(arg);
        this.__old = {}; // Keep track of old scroll values
        this.pickReuseItemElement = reuse => reuse.pop();
        this.style.display = 'block';
        this.style.position = 'relative';
        this.style.overflow = 'hidden';
        this._elSpace = document.createElement('div');
        this._elScroll = document.createElement('div');
        this._elScroll.style.outline = 'none'; // No UA focus
        this._elScroll.style.position = 'absolute';
        this._elScroll.style.overflow = 'auto';
        this._elScroll.style.width = '100%';
        this._elScroll.style.height = '100%';
        this._elScroll.appendChild(this._elSpace);
        this._elCntr = document.createElement('div');
        this._elCntr.style.outline = 'none'; // No UA focus
        this._elCntr.style.overflow = 'hidden';
        this._elCntr.style.position = 'absolute';
        this._elCntr.style.left = '0';
        this._elCntr.style.top = '0';
        this._elCntr.style.right = '0';
        this._elCntr.style.bottom = '0';
        this._elCntr.style.display = 'flex';
        this._elCntr.style.alignItems = 'stretch';
        this._elCntr.style.justifyContent = 'space-between';
        this._elItems = document.createElement('div');
        this._elItems.style.outline = 'none'; // No UA focus
        this._elItems.style.flex = '1 1 auto';
        this._elCntr.appendChild(this._elItems);
        this._items = []; // The loaded elements
        this._itemsH = 0; // Height of all elements in _items
        this._height = 0;
        this._sbWidth = 0;
        this._sbHeight = 0;
        this._animating$ = 0;
        this.appendChild(this._elScroll);
        this.appendChild(this._elCntr);
        this._resizeObserver = new ResizeObserver(this.resized.bind(this));
        this._resizeItemObserver = new ResizeObserver(this._resizeItemEv.bind(this));
    }

    // The virtual scroller doesn't use a shadow dom
    createRenderRoot() {
        return this;
    }

    ready() {
        super.ready();
        this._elScroll.addEventListener('scroll', this._onscroll.bind(this));
        this._elCntr.addEventListener('touchstart', this._ontouchstart.bind(this));
        this._elCntr.addEventListener('touchmove', this._ontouchmove.bind(this));
        this.addEventListener('wheel', this._wheel.bind(this));
        this.addEventListener('mousedown', this._mouseDown.bind(this));
        this.addEventListener('keydown', this._keyDown.bind(this));
    }

    get viewportWidth() {
        return this._elScroll.clientWidth;
    }

    get viewportHeight() {
        return this._elScroll.clientHeight;
    }

    get startIx() {
        return this._startIx;
    }

    get endIx() {
        return this._endIx;
    }

    getRow(index) {
        return (this._startIx <= index && index < this._endIx) ? this._items[index - this._startIx].el : null;
    }

    getFocusRow() {
        return this.getRow(this.focusedItemIndex);
    }

    setFocusRowIndex(index) {
        // Negative index goes backwards
        const fi = index < 0 ? Math.max(this._numItems + index, 0) : Math.min(Math.max(index, 0), this._numItems - 1);
        if (fi !== this.focusedItemIndex) {
            this.focusedItemIndex = fi;
            this.scrollTo(fi);
            this.dispatchEvent(new CustomEvent('focused-item-updated', {detail: {value: fi}}));
        }
    }

    getElItemsTransform() {
        // Get the transform of the element which contains the scroller items
        return this._elItems.style.transform;
    }

    get hasScrollbar() {
        return this._endIx > 0 && this._numItems > 0 && (this._startIx > 0 || this._endIx < this._numItems || this._itemsH > this.viewportHeight);
    }

    get elScroll() {
        return this._elScroll;
    }

    _initTrackFocus() {
        this._trackFocus(this, () => this.getFocusRow() || this);
    }

    connectedCallback() {
        super.connectedCallback();
        this._resizeObserver.observe(this._elSpace); // For width
        this._resizeObserver.observe(this); // For height
        this._items.forEach(item => this._resizeItemObserver.observe(item.el));
    }

    disconnectedCallback() {
        this._resizeObserver.unobserve(this._elSpace);
        this._resizeObserver.unobserve(this);
        this._items.forEach(item => this._resizeItemObserver.unobserve(item.el));
        super.disconnectedCallback();
    }

    // numItems or createItemElement has changed
    _change() {
        const {numItems} = this;
        this._numItems = numItems || 0;

        // Empty or has all loaded items has been lost?
        if (this._endIx === 0 || this._startIx >= numItems) {
            // Reload all
            this._load();
        } else {
            // Remove truncated items
            const reuse = [];
            while (this._endIx > numItems) {
                reuse.push(this._deleteItem(this._items.length - 1));
                this._endIx--;
            }
            this._fill(reuse);
        }

        if (this.focusedItemIndex >= numItems) {
            this.setFocusRowIndex(-1); // Focus on last item
        }
    }

    _initItem(el) {
        el.style.position = 'absolute';
        el.style.left = '0';
        el.style.minWidth = '100%';
        this._elItems.appendChild(el);
        this._resizeItemObserver.observe(el);
        return itemHeight(el);
    }

    _addItem(index, reuse, prepend) {
        const elOrg = reuse && this.pickReuseItemElement(reuse, index);
        const el = this.createItemElement(index, elOrg);
        let h;

        if (elOrg) {
            if (el === elOrg) {
                h = itemHeight(el); // Same element, different height?

                // This should NOT be needed! (But it is, in Navigate, for unknown reasons...)
                this._resizeItemObserver.unobserve(el);
                this._resizeItemObserver.observe(el);
            } else {
                reuse.unshift(elOrg); // Didn't use the suggested element
                h = this._initItem(el); // New element
            }
        } else {
            h = this._initItem(el); // New element
        }

        if (prepend) {
            this._items.unshift({el, h});
        } else {
            this._items.push({el, h});
        }
        this._itemsH += h;

        return h;
    }

    _updateItem(index) {
        console.assert(this._startIx <= index && index < this._endIx, `updateIndex: startIx: ${this._startIx} ix: ${index}, endIx: ${this._endIx}`);

        const item = this._items[index - this._startIx];
        const el = this.createItemElement(index, item.el);
        let h;
        if (el !== item.el) {
            this._recycle(item.el);
            item.el = el;
            h = this._initItem(el);
        } else {
            h = itemHeight(el);
        }

        if (h !== item.h) {
            this._itemsH += (h - item.h);
            item.h = h;

            // Remember that the heights have changed. Must _placeItems()
            this._updatedItemH = true;
        }
    }

    // Returns the deleted element for reuse, still attached to DOM for optimization
    _deleteItem(index) {
        console.assert(0 <= index && index < this._items.length, `index: ${index} length: ${this._items.length}`);
        const item = this._items[index];
        this._items.splice(index, 1);
        this._itemsH -= item.h;
        return item.el;
    }

    // Remove all loaded items
    _clearItems() {
        const reuse = this._items.map(item => item.el);
        this._items = [];
        this._itemsH = 0;
        return reuse;
    }

    // Detach element(s) from DOM and recycle it
    _recycle(el) {
        if (el instanceof Array) {
            el.forEach(el2 => this._recycle(el2));
        } else if (el) {
            this._resizeItemObserver.unobserve(el);
            this._elItems.removeChild(el);
            if (this.recycleItemElement) {
                this.recycleItemElement(el);
            }
        }
    }

    // Approximate the current scroll height based on height of the loaded data
    _setScrollHeight() {
        if (this._itemsH && this._endIx - this._startIx < this._numItems) {
            this._elSpace.style.height = `${Math.min(5500000, this._numItems * this._itemsH / (this._endIx - this._startIx))}px`;
        } else {
            this._elSpace.style.height = `${this._itemsH}px`;
        }
    }

    // Map (relative) point in item to viewport y-coordinate based on the scrollbar values
    _getScrollTarget(scrollTop, clientHeight, scrollHeight) {
        if (!(this._numItems >= 0) || isNaN(scrollTop) || scrollHeight <= clientHeight) {
            return {ix: 0, ixOffs: 0, y: 0}; // No scrollbars, so put the topmost element at the top
        }

        const fx = (this._numItems * scrollTop) / (scrollHeight - clientHeight);
        const ix = Math.min(Math.floor(fx), this._numItems - 1); // At the absolute bottom we go one item too far

        return {
            ix,
            // 0 .. 1: 0 = top-most pixel-row. 1 = bottom-most pixel-row
            ixOffs: fx - ix,
            // Where the ix pixel-row should be placed on the viewport
            y:      clientHeight * (fx / this._numItems)
        };
    }

    // Adapt scrollbar so it matches the loaded data
    _setScrollPos() {
        if (!this.hasScrollbar) {
            // No scrollbar, no scrolltop
            this._setAboveH(0);
            this._elScroll.scrollTop = 0;
            this._elSpace.style.height = `${this._itemsH}px`;
            return;
        }

        const clientHeight = this.viewportHeight;

        // Best estimate for the scrollHeight
        const scrollHeight = Math.min(5500000, this._numItems * this._itemsH / (this._endIx - this._startIx));
        if (scrollHeight !== this._elScroll.scrollHeight) {
            this._elSpace.style.height = `${scrollHeight}px`;
        }

        // Iterate to scrollTop value
        const index2pos = index => index / this._numItems;

        const index2scrollTop = index => index2pos(index) * (scrollHeight - clientHeight);

        const y2index = y => {
            y -= this._aboveH;
            for (let i = this._startIx; i < this._endIx; i++) {
                const itemH = this._items[i - this._startIx].h;
                if (y < itemH) {
                    return i + y / itemH;
                }
                y -= itemH;
            }
            // Can't find the item. Return near end position of last item
            return this._endIx - 0.0001;
        };

        const step = index => y2index(clientHeight * index2pos(index));

        let index = this._startIx;
        let scrollTop = index2scrollTop(index);

        // 10 steps should be more than enough
        for (let i = 0; i < 10; i++) {
            const oldTop = scrollTop;
            index = step(index);
            scrollTop = index2scrollTop(step(index));
            if (Math.abs(scrollTop - oldTop) < 0.5) {
                break;
            }
        }
        this._elScroll.scrollTop = Math.round(scrollTop);
    }

    // Set the scroll adjustment for the loaded items
    _setAboveH(aboveH) {
        this._aboveH = aboveH;
        if (this._scrollLeft > 0) {
            // Horizontal scrolling too
            this._elItems.style.transform = `translate(${-this._scrollLeft}px, ${this._aboveH}px)`;
        } else {
            this._elItems.style.transform = `translateY(${this._aboveH}px)`;
        }
    }

    // Put the loaded items at their proper places
    _placeItems() {
        // Set position of items
        let y = 0;
        this._items.forEach(item => {
            item.el.style.transform = `translateY(${y}px)`;
            y += item.h;
        });

        // Rows have been put at their places
        this._updatedItemH = undefined;
    }

    // Throw out all loaded content and reload the page
    _load(wipe) {
        const reuse = this._clearItems();

        if (wipe) {
            // Prevent previous elements from being recycled
            reuse.forEach(el => {
                this._resizeItemObserver.unobserve(el);
                this._elItems.removeChild(el);
            });
            reuse.length = 0;
        }

        if (!this._numItems) {
            this._recycle(reuse);
            this._setAboveH(0);
            this._startIx = this._endIx = 0;
            this._setScrollHeight();
            return;
        }

        // Adjust current location
        if (this._startIx >= this._numItems) {
            this._startIx = this._numItems - 1;
        }
        this._endIx = this._startIx;

        this._fill(reuse);
    }

    // Eliminate all blank areas on the viewport, if possible
    // Keep the current scroll position, if possible
    _fill(reuse, dirty) {
        const height = this.viewportHeight - this._aboveH;

        // Fill downwards
        while (height > this._itemsH && this._endIx < this._numItems) {
            dirty = true;
            this._addItem(this._endIx++, reuse);
        }

        // Fill upwards
        while (height > this._itemsH && this._startIx > 0) {
            dirty = true;
            this._addItem(--this._startIx, reuse, true);
        }

        // Recycle any remaining elements
        this._recycle(reuse);

        if (dirty) {
            this._placeItems();
        }

        this._setScrollPos();
    }

    // Move item[ix] dy pixels
    _move(dy, reuse, recursive) {
        console.assert(this._endIx <= this._numItems, `_endIx: ${this._endIx} numItems: ${this._numItems}`);
        let aboveH = this._aboveH + dy;
        let belowH = this.viewportHeight - aboveH - this._itemsH;

        // Recycle out-of-sight items above viewport
        while (this._items.length && -aboveH > this._items[0].h) {
            aboveH += this._items[0].h;
            reuse.push(this._deleteItem(0));
            this._startIx++;
        }

        // Recycle out-of-sight items below viewport
        while (this._items.length && -belowH > this._items[this._items.length - 1].h) {
            belowH += this._items[this._items.length - 1].h;
            reuse.push(this._deleteItem(this._items.length - 1));
            this._endIx--;
        }

        // Fill items to top of viewport
        while (this._startIx > 0 && aboveH > 0) {
            aboveH -= this._addItem(--this._startIx, reuse, true);
        }

        // Fill items to bottom of viewport
        while (this._endIx < this._numItems && belowH > 0) {
            belowH -= this._addItem(this._endIx++, reuse);
        }

        // Put items at their proper place
        this._placeItems();

        if (this._startIx === 0 && aboveH > 0) {
            // Reached the first item and found white space above it
            this._setAboveH(0);
            this._fill(reuse);
        } else if (this._endIx === this._numItems && belowH > 0.5 && this._startIx > 0 && !recursive) {
            // Reached the last item and found white space below it
            this._setAboveH(aboveH);
            this._move(belowH, reuse, true);
        } else {
            // Cleanup and fixup
            this._recycle(reuse);

            this._setAboveH(aboveH);
        }
    }

    // Place the loaded content according to the scrollbar
    // Aproach:
    // - compute a relative offset [pos] for the current scroll position - a value between 0..1
    // - select the item that occupies this slot [Math.floor(ix = this._numItems * pos)]
    // - find the pixel-row on the selected item that corresponds to pos (pos slides over the height as it grows...)
    // - find the pixel-row in the viewport that corresponds to pos
    // - align the pixel-rows
    _scroll() {
        console.assert(this._endIx <= this._numItems);
        const sb = this.__old;
        const scrollTop = this._elScroll.scrollTop;
        const clientHeight = this._elScroll.clientHeight;
        const scrollHeight = this._elScroll.scrollHeight;
        if (sb.scrollTop !== scrollTop || sb.clientHeight !== clientHeight || sb.scrollHeight !== scrollHeight) {
            Object.assign(sb, {scrollTop, clientHeight, scrollHeight});
            this._vscroll(scrollTop, clientHeight, scrollHeight);
        }

        const scrollLeft = this._elScroll.scrollLeft;
        if (sb.scrollLeft !== scrollLeft) {
            sb.scrollLeft = scrollLeft;
            this._hscroll(scrollLeft);
        }
    }

    _vscroll(scrollTop, clientHeight, scrollHeight) {
        if (!this._numItems || scrollHeight <= clientHeight) {
            this._setScrollHeight();
            this._setAboveH(0);
            this._placeItems();
            return;
        }

        const s = this._getScrollTarget(scrollTop, clientHeight, scrollHeight);
        let reuse = [];

        // Need to load target item?
        if (s.ix < this._startIx || this._endIx <= s.ix) {
            if (this._startIx === s.ix + 1) {
                this._addItem(--this._startIx, reuse, true);
            } else if (this._endIx === s.ix) {
                this._addItem(this._endIx++, reuse);
            } else {
                // Target node is out-of-scope
                this._setAboveH(0);

                // Add target item
                reuse = this._clearItems();
                this._startIx = this._endIx = s.ix;
                this._addItem(this._endIx++, reuse);
            }
            this._placeItems();
        }

        // The target item is loaded
        const item = this._items[s.ix - this._startIx];
        const bb0 = this.getBoundingClientRect();
        const bb1 = item.el.getBoundingClientRect();
        this._move(s.y - (bb1.top - bb0.top + bb1.height * s.ixOffs), reuse); // Move item target to viewport target
    }

    _hscroll(scrollLeft) {
        if (this._scrollLeft !== scrollLeft) {
            this._scrollLeft = scrollLeft;
            this._setAboveH(this._aboveH);
            this.dispatchEvent(new CustomEvent('scroll-left-changed', {
                bubbles:  true,
                composed: true,
                detail:   {value: scrollLeft}
            }));
        }
    }

    _setGap() {
        this.gap = this.hasScrollbar ? -1 : Math.floor(this.viewportHeight) - Math.floor(this._itemsH) - 1;
    }

    // Grid has been resized
    resized() {
        const clientWidth = this.clientWidth;
        const clientHeight = this.clientHeight;
        const clientWidthSw = this._elScroll.clientWidth;
        const clientHeightSw = this._elScroll.clientHeight;

        // eslint-disable-next-line max-len
        if (this.__old.clientWidth === clientWidth && this.__old.clientHeight === clientHeight && this.__old.clientWidthSw === clientWidthSw && this.__old.clientHeightSw === clientHeightSw) {
            // Nothing has changed, so ignore this event
            return;
        }

        Object.assign(this.__old, {clientWidth, clientHeight, clientWidthSw, clientHeightSw});

        if (this._height !== clientHeight) {
            const growed = this._height < clientHeight;
            this._height = clientHeight;
            if (growed) {
                // Area got higher - might need more items
                this._fill();
            } else {
                // Area (only) got smaller - might need scrollbar
                this._setScrollPos();
            }
        }

        const sbWidth = clientWidth - clientWidthSw;
        const sbHeight = clientHeight - clientHeightSw;

        if (this._sbWidth !== sbWidth || this._sbHeight !== sbHeight) {
            this._sbWidth = sbWidth;
            this._sbHeight = sbHeight;

            // Scrollable area needs to be inside scroll viewport
            this._elCntr.style.right = `${sbWidth}px`;
            this._elCntr.style.bottom = `${sbHeight}px`;
        }

        // Avoid "ResizeObserver loop limit exceeded"
        requestAnimationFrame(() => {
            this.dispatchEvent(new CustomEvent('resized-width', {
                bubbles:  true,
                composed: true,
                detail:   {width: clientWidthSw, height: clientHeightSw, sbWidth, sbHeight}
            }));

            this._setGap();
        });
    }

    // User has scrolled the view
    _onscroll() {
        this._scroll();
        requestAnimationFrame(closeTooltip);
    }

    // Tablet touch scrolling leveraging wheel event handling
    _ontouchstart(ev) {
        this._pageX = ev.targetTouches[0].pageX;
        this._pageY = ev.targetTouches[0].pageY;

        // Make sure the vertical mode detection is triggered in the first 'move' event
        this._vertical = undefined;
    }

    _ontouchmove(ev) {
        // How much have we moved since the last time?
        const deltaX = this._pageX - ev.targetTouches[0].pageX;
        const deltaY = this._pageY - ev.targetTouches[0].pageY;

        if (this._vertical === undefined) {
            // Only do this once (per "touch") to limit the scrolling to one direction
            this._vertical = Math.abs(deltaX) < Math.abs(deltaY);
        }

        if (this._vertical) {
            // Vertical scrolling
            let deltaMode = 0;
            const delta = Math.abs(deltaY);
            if (delta > SCROLL_LITTLE && delta < SCROLL_MORE) {
                deltaMode = 1;
            } else if (delta >= SCROLL_MORE) {
                deltaMode = 2;
            }
            this.dispatchEvent(new WheelEvent('wheel', {deltaY, deltaMode}));

            // Store this as the last known y-location
            this._pageY = ev.targetTouches[0].pageY;
        } else {
            // Horizontal scrolling (always use pixel mode)
            this.dispatchEvent(new WheelEvent('wheel', {deltaX, deltaMode: 0}));

            // Remember the last known x-location
            this._pageX = ev.targetTouches[0].pageX;
        }
        ev.preventDefault();
    }

    // Item has been resized
    _resizeItemEv() {
        if (this._animating$) {
            // Ignore event becase animation is playing. Items will be placed when animation ends.
            return;
        }
        let resized = this._updatedItemH; // Is there a resizing debt?
        this._updatedItemH = undefined;

        this._items.forEach(item => {
            const h = itemHeight(item.el);
            if (h !== item.h) {
                this._itemsH += h - item.h;
                item.h = h;
                resized = true;
            }
        });

        const setScrollWidth = () => {
            const w1 = this._items.length && this._items[0].el.clientWidth;
            const w2 = this._elScroll.clientWidth;
            const w = w1 > w2 ? `${w1}px` : '';
            if (w !== this._elSpace.style.width) {
                this._elSpace.style.width = w;
            }
        };

        if (resized) {
            requestAnimationFrame(() => {
                const clientHeight = this.viewportHeight;

                if (!(clientHeight > 0)) {
                    // scroller appears to be hidden...
                    return; // Not returning here can be _very_ costly for huge grids
                }

                if (clientHeight - this._aboveH > this._itemsH && (this._startIx > 0 || this._endIx < this._numItems)) {
                    // Need more items and have more items
                    this._fill(undefined, true);
                } else {
                    // Relayout items
                    this._placeItems();
                    this._setScrollPos();
                }
                setScrollWidth();
            });
        } else {
            requestAnimationFrame(setScrollWidth);
        }

        this._setGap();
    }

    // Client request: refresh item(s)
    refresh(item) {
        if (item === undefined) {
            for (let index = this._startIx; index < this._endIx; index++) {
                this._updateItem(index);
            }
            this._fill();
        } else if (typeof item === 'number') {
            const index = Math.floor(item);
            if (this._startIx <= index && index < this._endIx) {
                this._updateItem(index);
            }
        } else {
            console.warn(`Don't know how to refresh ${JSON.stringify(item)}`);
        }
    }

    // Client request: throw out all loaded items and restart
    rebuild(wipe) {
        this._load(wipe);
    }

    _scrollToFirstVisibleRow(ix) {
        const br1 = this.getBoundingClientRect();
        const br2 = this._items[ix - this._startIx].el.getBoundingClientRect();
        this._move(br1.bottom - br2.bottom, []);
        this._setScrollPos();
    }

    _scrollToLastVisibleRow(ix) {
        const br1 = this.getBoundingClientRect();
        const br2 = this._items[ix - this._startIx].el.getBoundingClientRect();
        this._move(br1.top - br2.top, []);
        this._setScrollPos();
    }

    _findFirstVisibleRowIndex() {
        let startIx = this._startIx;
        const br1 = this.getBoundingClientRect();

        while (startIx < this._endIx - 1) {
            const br2 = this._items[startIx - this._startIx].el.getBoundingClientRect();

            if (br2.bottom - br1.top >= br2.height * 0.75) {
                return startIx;
            }

            startIx++;
        }

        return -1;
    }

    _findLastVisibleRowIndex() {
        let endIx = this._endIx - 1;
        const br1 = this.getBoundingClientRect();

        while (endIx >= this._startIx) {
            const br2 = this._items[endIx - this._startIx].el.getBoundingClientRect();

            if (br1.bottom - br2.top >= br2.height * 0.75) {
                return endIx;
            }

            endIx--;
        }

        return -1;
    }

    // Client request: scroll to specific item
    scrollTo(index) {
        // Viewport height
        const h = this._elScroll.scrollHeight - this._elScroll.clientHeight;

        // Scroll index item into view
        if (this._startIx <= index && index < this._endIx) {
            // Item is already loaded, but might be out of viewport sight
            const br1 = this.getBoundingClientRect();
            const br2 = this._items[index - this._startIx].el.getBoundingClientRect();
            if (br1.top > br2.top || br1.bottom < br2.bottom) {
                // TODO: It is not always enough to only check the height of st.ix
                const st = this._getScrollTarget(this._elScroll.scrollTop, this._elScroll.clientHeight, this._elScroll.scrollHeight);
                const br3 = this._items[Math.max(Math.min(st.ix, this._endIx - 1) - this._startIx, 0)].el.getBoundingClientRect();
                const h2 = br2.bottom - br2.top;
                const f = h2 / (br3.bottom - br3.top);
                const d = (br1.top > br2.top) ? (br2.top - br1.top) : (br2.bottom - br1.bottom);
                const pos = Math.min(Math.max(st.ix + st.ixOffs + (1.2 * d * f) / h2, 0), this._numItems - 0.0001);

                // Make sure the scroll position is recalculated
                this.__old.scrollTop = -1;
                this._elScroll.scrollTop = (h * pos) / this._numItems;
                this._scroll();
            }
        } else if (0 <= index && index < this._numItems) {
            // Full scroll
            this.__old.scrollTop = -1;
            this._elScroll.scrollTop = ((h + h / this._numItems) * index) / this._numItems;
            this._scroll();
        }
    }

    _animate(anim, dy = 0) {
        this._animating$++; // Start animation

        const finishedCb = () => {
            this._animating$--; // End animation
            this._resizeItemEv(); // Make sure everything is at its proper place
        };

        const recyleEl = this._recycle.bind(this);

        new AnimScroller(anim, {dy, recyleEl, finishedCb});
    }

    // Client message: _inserted = [[$index, $count] ...] - $count items has been removed, starting from $index
    inserted(_inserted) {
        this._numItems = this._numItems + _inserted.reduce((a, v) => a + v[1], 0);
        this.numItems = this._numItems;

        // Adjust _startIx / _endIx for all items that has been inserted before viewport
        let mustUpdate = false;
        _inserted.forEach(([index, count]) => {
            if (index + count <= this._startIx) {
                this._startIx += count;
                this._endIx += count;
                mustUpdate = true;
            } else if (index <= this._endIx) {
                mustUpdate = true;
            }
        });

        if (mustUpdate) {
            this._items.forEach((_, i) => this._updateItem(this._startIx + i));
        }

        this._placeItems();
        this._fill();

        // Collect animated items
        const anim = [];
        for (let ix = this._startIx; ix < this._endIx; ix++) {
            const item = this._items[ix - this._startIx];
            const insert = _inserted.some(([index, count]) => index <= ix && ix < index + count);
            anim.push({el: item.el, h: item.h, state: insert && 'insert'});
        }

        // Start animation when view has stabilized
        if (anim.find(item => item.state)) { // Is there anything to animate?
            requestAnimationFrame(() => this._animate(anim));
        }
    }

    // Client message: _removed = [[$index, $count] ...] - $count items has been removed, starting from $index
    removed(_removed) {
        this._numItems = this._numItems - _removed.reduce((a, v) => a + v[1], 0);
        this.numItems = this._numItems;

        // Adjust _startIx / _endIx for all items that has been removed before viewport
        const adjustIxs = () => {
            _removed.forEach(([index, count]) => {
                if (index + count <= this._startIx) {
                    this._startIx -= count;
                    this._endIx -= count;
                }
            });
            if (this._startIx >= this._numItems) {
                this._startIx = Math.max(0, this._numItems - 1);
            }
            this._items.forEach((_, i) => this._updateItem(this._startIx + i));
        };

        // Are any removed items visible?
        if (_removed.every(([index, count]) => index + count <= this._startIx || index >= this._endIx)) {
            // No visible items where removed. No animation needed
            adjustIxs();
            this._setScrollPos();
            return;
        }

        const aboveH0 = this._aboveH;

        // Collect animated items
        const anim = [];
        for (let ix = this._startIx; ix < this._endIx; ix++) {
            const item = this._items[ix - this._startIx];
            const remove = _removed.some(([index, count]) => index <= ix && ix < index + count);
            anim.push({el: item.el, h: item.h, state: remove && 'remove'});
        }

        anim[0].topmost = true;

        for (let i = anim.length - 1; i >= 0; i--) {
            if (anim[i].state) {
                this._deleteItem(i);
            }
        }

        // Update viewport indexes
        adjustIxs();

        // Adjust endIx
        this._endIx = this._startIx + this._items.length;

        const startIx = this._startIx;
        const endIx = this._endIx;

        this._placeItems();
        this._fill();

        // Add new elements to animation
        for (let i = startIx - 1; i >= this._startIx; i--) {
            const item = this._items[i - this._startIx];
            anim.unshift({el: item.el, h: item.h});
        }
        for (let i = endIx; i < this._endIx; i++) {
            const item = this._items[i - this._startIx];
            anim.push({el: item.el, h: item.h});
        }

        // Start animation when view has stabilized
        requestAnimationFrame(() => this._animate(anim, this._aboveH - aboveH0));
    }

    // Must handle the wheel event, because _elItems covers the scroll window
    _wheel(ev) {
        if (ev.deltaY) {
            const scrollTop = this._elScroll.scrollTop;
            switch (ev.deltaMode) {
                case 0: // pixels
                    this._elScroll.scrollTop += ev.deltaY;
                    break;

                case 1: // lines (rows)
                    if (this._endIx > this._startIx) {
                        this._elScroll.scrollTop += ev.deltaY * this._itemsH / (this._endIx - this._startIx);
                    }
                    break;

                case 2: // pages
                    this._elScroll.scrollTop += ev.deltaY * (0.9 * this._elItems.clientHeight);
                    break;
            }
            if (this._elScroll.scrollTop !== scrollTop) {
                ev.preventDefault();
            }
        }
        if (ev.deltaX) {
            const scrollLeft = this._elScroll.scrollLeft;
            this._elScroll.scrollLeft += ev.deltaX;
            if (this._elScroll.scrollLeft !== scrollLeft) {
                ev.preventDefault();
            }
        }
    }

    _mouseDown(ev) {
        // Adapt focus
        for (let el = ev.target; el; el = el.parentNode) {
            if (el.parentNode === this._elItems) {
                const index = this._items.findIndex(item => item.el === el);
                if (index >= 0) {
                    this.setFocusRowIndex(this._startIx + index);
                }
                return;
            }
        }
    }

    _keyDown(ev, keepTrackOfFocusOnly = false) {
        // Do nothing if the list is disabled or if a sub-element has the actual keyboard focus
        if (this.disabled || (!PTCS.hasFocus(this) && !keepTrackOfFocusOnly) || ev.defaultPrevented) {
            return;
        }

        let fi = this.focusedItemIndex;
        switch (ev.key) {
            case 'ArrowRight':
            case 'ArrowUp':
                fi = Math.max(fi - 1, 0);
                break;
            case 'ArrowLeft':
            case 'ArrowDown':
                fi = Math.min(fi + 1, this._numItems - 1);
                break;
            case 'PageUp':
                fi = this._findFirstVisibleRowIndex();

                // Move first visible row to bottom of page
                this._scrollToFirstVisibleRow(fi);
                break;
            case 'Home':
                fi = Math.min(0, this._numItems - 1);
                break;
            case 'PageDown':
                fi = this._findLastVisibleRowIndex();

                // Move last visible row to top of page
                this._scrollToLastVisibleRow(fi);
                break;
            case 'End':
                fi = Math.max(0, this._numItems - 1);
                break;
            case ' ':
            case 'Enter':
                // Click on focused item
                if (this._startIx <= fi && fi < this._endIx) {
                    this._items[fi - this._startIx].el.click();
                } else {
                    this.scrollTo(fi);
                    requestAnimationFrame(() => {
                        if (fi === this.focusedItemIndex && this._startIx <= fi && fi < this._endIx) {
                            this._items[fi - this._startIx].el.click();
                        }
                    });
                }
                break;
            default:
                // Not handled
                return;
        }

        // We consumed this keyboard event. Don't propagate
        ev.preventDefault();

        // Set new focus index, if any
        this.setFocusRowIndex(fi);
    }
};

customElements.define(PTCS.VScroller2.is, PTCS.VScroller2);
