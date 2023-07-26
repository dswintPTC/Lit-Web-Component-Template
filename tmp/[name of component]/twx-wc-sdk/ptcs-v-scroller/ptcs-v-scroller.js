import {LitElement} from 'lit';
import {L2Pw} from 'ptcs-library/library-lit';
import {PTCS} from 'ptcs-library/library.js';
import 'ptcs-behavior-focus/ptcs-behavior-focus.js';
import {closeTooltip} from 'ptcs-behavior-tooltip/ptcs-behavior-tooltip.js';

// When loading data, always load at least vScrollerChunkSize items (if possible)
const vScrollerChunkSize = 7;

PTCS.VScroller = class extends PTCS.BehaviorFocus(L2Pw(LitElement)) {
    static get is() {
        return 'ptcs-v-scroller';
    }

    static get properties() {
        return {
            // Number of items
            numItems: {
                type:        Number,
                observer:    '_change',
                observeWhen: 'immediate',
                noAccessor:  true
            },

            // Create element from item  (index, el-reuse?)
            createItemElement: {
                type:     Function,
                value:    () => PTCS.VScroller._dfltCreateItemElement,
                observer: '_change'
            },

            // Average height of an item
            _avgH: {
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

            // Height above top-most loaded item
            _aboveH: {
                type:     Number,
                value:    0,
                observer: '_aboveHChanged'
            },

            // Previous scroll position
            _oldScrollTop: {
                type:  Number,
                value: 0
            },

            // Adapt if list area changes
            _resizeObserver: ResizeObserver,

            // Container that represent the full height of all items
            _elSpace: Element,

            // Container for the loaded items
            _elItems: Element,

            // Index of item with keyboard focus
            focusedItemIndex: {
                type:  Number,
                value: 0
            },

            // Should the focus "wrap", e.g. should 'ArrowUp' from the first item navigate to the
            // last item and 'ArrowDown' from the last item move focus to the top?
            wrapFocus: {
                type: Boolean
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
        this.style.display = 'block';
        this.style.overflow = 'auto';
        this._oldScrollTop = 0;
        this._elSpace = document.createElement('div');
        this._elItems = document.createElement('div');

        this._resizeObserver = new ResizeObserver(() => {
            // We wrap it in requestAnimationFrame to avoid this error - ResizeObserver loop limit exceeded
            // https://stackoverflow.com/a/58701523
            requestAnimationFrame(() => {
                this._resizeEv();
            });
        });
    }

    // The virtual scroller doesn't use a shadow dom
    createRenderRoot() {
        return this;
    }

    ready() {
        super.ready();
        this.addEventListener('scroll', () => this._onscroll());
        this._elSpace.appendChild(this._elItems);
        this.appendChild(this._elSpace);

        this.addEventListener('keydown', ev => this._keyDown(ev));
    }

    _initTrackFocus() {
        this._trackFocus(this, () => {
            if (this.focusedItemIndex < this._startIx || this._endIx <= this.focusedItemIndex) {
                return this; // Not loaded
            }
            return this._elItems.childNodes[this.focusedItemIndex - this._startIx];
        });
    }

    connectedCallback() {
        super.connectedCallback();
        this._resizeObserver.observe(this);
    }

    disconnectedCallback() {
        this._resizeObserver.unobserve(this);
        super.disconnectedCallback();
    }

    _change() {
        const {numItems} = this;

        if (this.focusedItemIndex >= numItems) {
            this.focusedItemIndex = Math.max(0, numItems - 1);
        }

        // Empty or has all loaded items has been lost?
        if (this._endIx === 0 || this._startIx >= numItems) {
            // Reload it all
            this._load();
        } else {
            // Remove truncated items
            while (this._endIx > numItems) {
                this._elItems.removeChild(this._elItems.lastChild);
                this._endIx--;
            }
            if (this._avgH && this._endIx - this._startIx < this.numItems) {
                this._elSpace.style.height = `${this._avgH * this.numItems}px`;
            } else {
                this._elSpace.style.height = '';
            }
            this._fill();
        }
    }

    _aboveHChanged(_aboveH) {
        this._elItems.style.transform = `translateY(${_aboveH}px)`;
    }

    _load() {
        const elItems = this._elItems;

        // Remove previous elements
        while (elItems.firstChild) {
            elItems.removeChild(elItems.firstChild);
        }

        if (!this.numItems) {
            this._startIx = this._endIx = 0;
            this._avgH = 0;
            this._aboveH = 0;
            this._elSpace.style.height = '';
            return;
        }

        if (this._startIx + vScrollerChunkSize >= this.numItems) {
            this._startIx = Math.max(0, this.numItems - vScrollerChunkSize - 1);
        }

        // Fill downwards
        this._endIx = this._startIx;
        for (;;) {
            const end = Math.min(this._endIx + vScrollerChunkSize - 1, this.numItems);
            if (this._endIx >= end) {
                break;
            }
            while (this._endIx < end) {
                elItems.appendChild(this.createItemElement(this._endIx++));
            }
            if (elItems.clientHeight >= this.clientHeight) {
                break;
            }
        }

        this._avgH = elItems.clientHeight / (this._endIx - this._startIx);
        this._aboveH = this._avgH * this._startIx;
        if (this._avgH && this._endIx - this._startIx < this.numItems) {
            this._elSpace.style.height = `${this._avgH * this.numItems}px`;
        } else {
            this._elSpace.style.height = '';
        }
        this.scrollTop = this._aboveH;
        this._fill();
    }

    _gotoIndex(startIx) {
        if (!this.numItems) {
            return;
        }
        const numLoaded = this._endIx - this._startIx;

        // Load a new chunk of items
        const elItems = this._elItems;
        const end = Math.min(startIx + numLoaded, this.numItems);
        const start = Math.max(0, end - numLoaded);

        for (let i = start; i < end; i++) {
            const el = elItems.childNodes[i - start];
            const el2 = this.createItemElement(i, el);
            if (el2 !== el) {
                elItems.replaceChild(el2, el);
            }
        }

        this._startIx = start;
        this._endIx = end;
        this._aboveH = this._avgH * this._startIx;
        //this._elSpace.style.height = `${this._avgH * this.numItems}px`;

        if (this.scrollHeight) {
            this._fill();
        }
    }

    _gotoScroll(scrollTop) {
        if (!this.numItems) {
            return;
        }
        const numLoaded = this._endIx - this._startIx;
        const startIx = (this._avgH && this.scrollHeight) ? Math.floor(this.numItems * scrollTop / this.scrollHeight) : 0;
        const endIx = Math.min(startIx + numLoaded, this.numItems);

        if (this._startIx <= startIx && startIx < this._endIx) {
            this._fill(); // start item is already loaded
        } else if (this._startIx <= endIx && endIx < this._endIx) {
            this._fill(); // end item is already loaded
        } else {
            this._gotoIndex(startIx);
        }
    }

    // Make sure everything that can become visible becomes visible
    _fill() {
        if (this._startIx === this._endIx) {
            if (this.numItems) {
                this._load();
            } else {
                // No items
                this.scrollTop = 0;
                this._elSpace.style.height = '';
                this._aboveH = 0;
            }
            return;
        }

        const elItems = this._elItems;
        let retry = 0;

        while (this._endIx - this._startIx < this.numItems) {
            if (retry > 255) {
                console.warn(`ptcs-v-scroller: too many fill retries (${retry})...`);
                return;
            }
            const needAbove = this._aboveH - this.scrollTop;
            const needBelow = this.clientHeight - needAbove - elItems.clientHeight;

            if (!(needAbove > 0) && !(needBelow > 0)) {
                // The viewport is fully covered
                break;
            }

            // Need more visibility upwards?
            if (needAbove > 0) {
                if (this._startIx > 0) {
                    const list = [];

                    // Reuse elements from below the visible area
                    if (!retry < 5) {
                        const limit = elItems.clientHeight + needAbove - this.clientHeight;
                        let y = 0;
                        for (let el = elItems.lastChild; el; el = el.previousSibling) {
                            y += el.clientHeight;
                            if (y >= limit) {
                                break;
                            }
                            list.push(el);
                            if (this._startIx - list.length <= 0 || list.length >= vScrollerChunkSize) {
                                break;
                            }
                        }
                    }

                    if (list.length === 0) {
                        const num = Math.min(vScrollerChunkSize, this._startIx);
                        let h = 0;
                        for (let i = 0; i < num && h < needAbove; i++) {
                            this._startIx--;
                            const el = this.createItemElement(this._startIx);
                            elItems.insertBefore(el, elItems.firstChild);
                            h += el.clientHeight;
                        }
                    } else {
                        list.forEach(el => {
                            elItems.removeChild(el);
                            this._startIx--;
                            this._endIx--;
                            el = this.createItemElement(this._startIx, el);
                            elItems.insertBefore(el, elItems.firstChild);
                        });
                    }

                    this._aboveH = this._avgH * this._startIx;
                } else {
                    // At top
                    this.scrollTop = 0;
                    this._aboveH = 0;
                }
            }

            // Need more visibility downwards?
            if (needBelow > 0) {
                if (this._endIx < this.numItems) {
                    const list = [];

                    // Reuse elements from above the visible area
                    if (retry < 5) {
                        let y = needAbove;
                        for (let el = elItems.firstChild; el; el = el.nextSibling) {
                            y += this._avgH;
                            if (y >= 0) {
                                break;
                            }
                            list.push(el);
                            if (this._endIx + list.length >= this.numItems || list.length >= vScrollerChunkSize) {
                                break;
                            }
                        }
                    }

                    if (list.length === 0) {
                        const num = Math.min(vScrollerChunkSize, this.numItems - this._endIx);
                        let h = 0;
                        for (let i = 0; i < num && h < needBelow; i++) {
                            const el = this.createItemElement(this._endIx++);
                            elItems.appendChild(el);
                            h += el.clientHeight;
                        }
                    } else {
                        list.forEach(el => {
                            this._startIx++;
                            elItems.removeChild(el);
                            elItems.appendChild(this.createItemElement(this._endIx++, el));
                        });
                    }

                    this._aboveH = this._avgH * this._startIx;
                } else if (this._startIx > 0) {
                    // Adjust scrollTop so data fits perfectly
                    this.scrollTop = this.scrollHeight - this.clientHeight;
                    this._aboveH = Math.max(0, this.scrollHeight - elItems.clientHeight);
                }
            }

            ++retry;
        }

        if (this._avgH && this._elSpace.clientHeight >= this._avgH * this.numItems && (0 < this._startIx || this._endIx < this.numItems)) {
            const _avgH = elItems.clientHeight / (this._endIx - this._startIx);
            const _aboveH = _avgH * this._startIx;
            const scrollTop = this.scrollTop + _aboveH - this._aboveH;
            this._elSpace.style.height = `${_avgH * this.numItems}px`;
            this.setProperties({_avgH, _aboveH});
            this.scrollTop = scrollTop;
        }
    }


    // Element has been resized
    _resizeEv() {
        if (this._avgH === 0 && this._elItems.clientHeight > 0) {
            this._avgH = this._elItems.clientHeight / (this._endIx - this._startIx);
            this._aboveH = this._avgH * this._startIx;
            if (this._avgH && this._endIx - this._startIx < this.numItems) {
                this._elSpace.style.height = `${this._avgH * this.numItems}px`;
            } else {
                this._elSpace.style.height = '';
            }
        }

        this._fill();
    }

    // User has scrolled the view
    _onscroll() {
        const delta = this.scrollTop - this._oldScrollTop;
        this._oldScrollTop = this.scrollTop;
        requestAnimationFrame(closeTooltip);
        if (Math.abs(delta) < this.clientHeight) {
            // Soft scrolling: target is close to the currently displayed items
            this._fill();

            // The ptcs-v-scroller has a problem when items have different heights. Sometimes the soft scrolling can even jump in the wrong
            // direction. This test detects that - and if so switches to "random access" scrolling.
            const err = (a, b) => a && b && a !== b;
            if (err(Math.sign(delta), Math.sign(this.scrollTop - this._oldScrollTop))) {
                this._gotoScroll(this._oldScrollTop);
                this.scrollTop = this._oldScrollTop;
            }
        } else {
            // Random access scrolling
            this._gotoScroll(this.scrollTop);
        }
    }

    _keyDown(ev) {
        // Do nothing if the list is disabled or if a sub-element has the actual keyboard focus
        if (this.disabled || !PTCS.hasFocus(this) || ev.defaultPrevented) {
            return;
        }

        let fi = this.focusedItemIndex;
        switch (ev.key) {
            case 'ArrowRight':
            case 'ArrowUp':
                if (this.wrapFocus && fi === 0) {
                    fi = Math.max(0, this.numItems - 1);
                } else {
                    fi = Math.max(fi - 1, 0);
                }
                break;
            case 'ArrowLeft':
            case 'ArrowDown':
                if (this.wrapFocus && fi === this.numItems - 1) {
                    fi = 0;
                } else {
                    fi = Math.min(fi + 1, this.numItems - 1);
                }
                break;
            case 'PageUp':
            case 'Home':
                fi = Math.min(0, this.numItems - 1);
                break;
            case 'PageDown':
            case 'End':
                fi = Math.max(0, this.numItems - 1);
                break;
            case ' ':
            case 'Enter':
                // Click on focused item
                if (this._startIx <= fi && fi < this._endIx) {
                    this._elItems.childNodes[fi - this._startIx].click();
                } else {
                    this.scrollTo(fi);
                    requestAnimationFrame(() => {
                        if (fi === this.focusedItemIndex && this._startIx <= fi && fi < this._endIx) {
                            this._elItems.childNodes[fi - this._startIx].click();
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

        if (fi !== this.focusedItemIndex) {
            this.focusedItemIndex = fi;
            ev.preventDefault();
            this.scrollTo(fi);
            this.dispatchEvent(new CustomEvent('focused-item-updated', {bubbles: true, composed: true}));
        }
    }

    focusItem(fi) {
        // Make sure the value is within bounds
        fi = Math.min(Math.max(fi, 0), this.numItems - 1);
        if (fi !== this.focusedItemIndex) {
            this.focusedItemIndex = fi;
            this.scrollTo(fi);
            this.dispatchEvent(new CustomEvent('focused-item-updated', {bubbles: true, composed: true}));
        }
    }

    refresh(item) {
        const elItems = this._elItems;

        if (item === undefined) {
            //console.log('--refresh all loaded items');
            for (let index = this._startIx; index < this._endIx; index++) {
                const el = elItems.childNodes[index - this._startIx];
                const el2 = this.createItemElement(index, el);
                if (el2 !== el) {
                    elItems.replaceChild(el2, el);
                }
            }
        } else if (typeof item === 'number') {
            const index = Math.floor(item);
            //console.log('---refresh index ' + index);
            if (this._startIx <= index && index < this._endIx) {
                const el = elItems.childNodes[index - this._startIx];
                if (el) {
                    const el2 = this.createItemElement(index, el);
                    if (el2 !== el) {
                        elItems.replaceChild(el2, el);
                    }
                } else {
                    console.error('Can\'t find item ' + index);
                }
            }
        } else {
            console.warn(`Don't know how to refresh ${JSON.stringify(item)}`);
        }
    }

    rebuild() {
        this._load();
    }

    scrollTo(index) {
        if (this._startIx <= index && index < this._endIx) {
            // Already loaded, but might be out of viewport sight...
            const br1 = this.getBoundingClientRect();
            const br2 = this._elItems.childNodes[index - this._startIx].getBoundingClientRect();
            if (br1.top > br2.top) {
                this.scrollTop -= br1.top - br2.top;
            } else if (br1.bottom < br2.bottom) {
                this.scrollTop += br2.bottom - br1.bottom;
            }
        } else if (0 <= index && index < this.numItems) {
            if (this._avgH && this.scrollHeight) {
                if (index === this._endIx) {
                    this.scrollTop += this._elItems.childNodes[this._endIx - this._startIx - 1].clientHeight;
                } else if (index + 1 === this._startIx) {
                    this.scrollTop -= this._elItems.childNodes[0].clientHeight;
                } else {
                    this.scrollTop = this.scrollHeight * index / this.numItems;
                }
            } else {
                this._gotoIndex(index);
            }
        }
    }

};

customElements.define(PTCS.VScroller.is, PTCS.VScroller);
