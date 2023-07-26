import {PolymerElement, html} from '@polymer/polymer/polymer-element.js';
import {PTCS} from 'ptcs-library/library.js';
import {enableSvgGradients, disableSvgGradients} from 'ptcs-library/svg-gradients.js';
import '@polymer/polymer/lib/elements/dom-repeat.js';
import 'ptcs-behavior-binary/ptcs-behavior-binary.js';
import 'ptcs-behavior-styleable/ptcs-behavior-styleable.js';
import 'ptcs-behavior-focus/ptcs-behavior-focus.js';
import 'ptcs-checkbox/ptcs-checkbox.js';
import 'ptcs-div/ptcs-div.js';

PTCS.ChartLegend = class extends PTCS.BehaviorFocus(PTCS.BehaviorStyleable(PTCS.ThemableMixin(PolymerElement))) {
    static get template() {
        return html`
    <style>
    :host {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        align-content: flex-start;
        overflow: auto;
        box-sizing: border-box;
    }

    :host(:not([horizontal])[align=start]) {
        justify-content: flex-start;
    }

    :host(:not([horizontal])[align=center]) {
        justify-content: center;
    }

    :host(:not([horizontal])[align=end]) {
        justify-content: flex-end;
    }

    [part=grid] {
        display: grid;
        grid-template-columns: var(--ptcs-legend-col-widths, 1fr 1fr 1fr);
    }

    :host([align=start]) [part=grid] {
        justify-content: start;
    }

    :host([align=center]) [part=grid] {
        justify-content: center;
    }

    :host([align=end]) [part=grid] {
        justify-content: end;
    }

    [part=item] {
        justify-self: start;
        display: flex;
        flex-direction: row;
        justify-content: flex-start;
        align-items: center;
        /*max-width: 100%;*/
        max-width: var(--ptcs-legend-max-width);
        outline: 1px solid white;
    }

    [part=item][hidden] {
        display: none !important;
    }

    :host([filter]) [part=item] {
        cursor: pointer;
    }

    [part=marker] {
        display: flex;
        flex: 0 0 auto;
    }

    :host([shape=none]) [part=marker] {
        display: none;
    }

    :host([shape=circle]) [part=marker] {
        border-radius: 50%;
    }

    ptcs-checkbox {
        min-height: unset;
        padding: unset;
    }

    :not([has-icon]) > ptcs-icon {
        display: none;
    }

    ptcs-icon {
        width: 100%;
        height: 100%;
    }

    :host(:not([filter])) ptcs-checkbox {
        display: none;
    }
    </style>

    <div id="grid" part="grid" on-click="_clickLegend">
        <template id="legend" is="dom-repeat" items="{{items}}">
            <div part="item" legend-select\$="[[_legendSelect(index)]]" legend\$="[[_legend(index)]]"
                class\$="[[item.class]]" hidden\$="[[item.empty]]">
                <ptcs-div part="marker" _depfield="[[item.depfield]]" has-icon\$="[[_hasIcon(item.icon, icon)]]">
                    <ptcs-icon part="icon" icon="[[_icon(item.icon, icon)]]"></ptcs-icon>
                </ptcs-div>
                <ptcs-checkbox no-tabindex part="checkbox" checked disabled="[[disabled]]"
                            single-line on-checked-changed="_checkedChanged" on-click="_clickCheckbox"></ptcs-checkbox>
                <ptcs-label variant="label" part="label" label="[[_label(item.label, item)]]"></ptcs-label>
            </div>
        </template>
    </div>`;
    }

    static get is() {
        return 'ptcs-chart-legend';
    }

    static get properties() {
        return {
            horizontal: {
                type:               Boolean,
                reflectToAttribute: true
            },

            maxWidth: {
                type: String,
            },

            align: {
                type:               String,
                value:              'start',
                reflectToAttribute: true
            },

            disabled: {
                type:               Boolean,
                value:              false,
                reflectToAttribute: true
            },

            // indexes of selected items
            selected: {
                type:   Array,
                notify: true
            },

            // _unselected[i] = true, if i is unselected
            _unselected: {
                type:  Object,
                value: () => ({})
            },

            shape: {
                type:               String,
                reflectToAttribute: true
            },

            // If specified, uses icon instead of shape
            icon: {
                type: String
            },

            items: {
                type:  Array,
                value: () => []
            },

            // Should legend filter the related chart(s)
            filter: {
                type:               Boolean,
                observer:           '_createSelected',
                reflectToAttribute: true
            },

            //only for schedule chart
            legendcolors: {
                type:     Object,
                observer: '_updateColorsOfLegend'
            },

            _resizeObserver: ResizeObserver
        };
    }

    static get observers() {
        return [
            '_selectionChanged(selected.*)',
            '_itemsChanged(items.*)',
            '_updateMaxWidth(maxWidth, horizontal)'
        ];
    }

    ready() {
        super.ready();
        this._resizeObserver = new ResizeObserver(() => this._refreshGrid());
        this.addEventListener('keydown', ev => this._keyDown(ev));
    }

    connectedCallback() {
        super.connectedCallback();
        this._resizeObserver.observe(this);
        enableSvgGradients(this, this._gradientsDefs.bind(this));
    }

    _gradientsDefs(length) {
        let svg = this.shadowRoot.getElementById('svg-gradients');
        if (svg) {
            return svg.firstElementChild;
        }
        if (!length) {
            return undefined;
        }

        svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('id', 'svg-gradients');
        svg.style.width = '0';
        svg.style.height = '0';
        svg.style.userSelect = 'none';

        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        svg.appendChild(defs);
        this.shadowRoot.prepend(svg);
        return defs;
    }

    disconnectedCallback() {
        this._resizeObserver.unobserve(this);
        disableSvgGradients(this);
        super.disconnectedCallback();
    }

    _legendSelect(index) {
        return `L${index + 1}`;
    }

    _legend(index) {
        return `L${(index % 24) + 1}`;
    }

    _label(label, item) {
        return label !== undefined ? label : item;
    }

    _icon(itemIcon, icon) {
        return itemIcon || icon;
    }

    _hasIcon(itemIcon, icon) {
        return (itemIcon || icon) && true;
    }

    _updateColorsOfLegend() {
        requestAnimationFrame(() => {
            const legends = this.shadowRoot.querySelectorAll("[part='item']");
            for (let i = 0; i < legends.length; i++) {
                let el = legends[i];
                let label = el.lastElementChild.label;
                PTCS.assignElementColor(el.querySelector("[part='marker']"), this.legendcolors[label], el.hasAttribute('selected'));
            }
        });
    }

    _itemsChanged(/* items.* */) {
        // New legend items
        this._refreshGrid();

        requestAnimationFrame(() => {
            const chks = this.shadowRoot.querySelectorAll('ptcs-checkbox');
            this._unselected = {};
            for (let i = 0; i < chks.length; i++) {
                this._unselected[i] = !chks[i].checked;
            }
            this._createSelected();
        });
    }

    _refreshGrid() {
        if (!this.__callRefreshGrid) {
            this.__callRefreshGrid = true;
            requestAnimationFrame(() => {
                this.__callRefreshGrid = false;
                // Max-width of items might have been affected
                this.__updateMaxWidth(this.maxWidth, this.horizontal);

                // Collect legend items and compute max width
                const gridEl = this.$.grid;
                const list = [];
                let wMax = 0;
                for (let el = gridEl.firstChild; el; el = el.nextSibling) {
                    if (el.getAttribute && el.getAttribute('part') === 'item' && !el.hasAttribute('hidden')) {
                        const w = el.clientWidth;
                        if (!(wMax >= w)) {
                            wMax = w;
                        }
                        list.push(el);
                    }
                }

                // Compute number of columns
                const gap = PTCS.cssDecodeSize(getComputedStyle(gridEl).getPropertyValue('grid-column-gap'), gridEl);

                // 1, 2 or 3 columns? nc finds column that doesn't fit
                const nc = [1, 2].find(i => (i + 1) * wMax + i * gap > this.clientWidth);

                // Note: 4 legends with space for 3 columns will use 2 columns.
                //       >4 legends will use 3 columns
                const numCol = Math.min(
                    // eslint-disable-next-line no-nested-ternary
                    this.horizontal ? (nc > 0 ? nc : list.length !== 4 ? 3 : 2) : 1,
                    list.length);

                // Assign legend item to columns
                const d = Math.floor((list.length - 0.5) / numCol) + 1;
                list.forEach((el, index) => {
                    const col = Math.floor(index / d) + 1;
                    const row = index - (col - 1) * d + 1;
                    el.style.gridColumn = col;
                    el.style.gridRow = row;
                });
                // Assign CSS grid-template-columns for the item grid
                const cw = `${wMax}px`;
                this.style.setProperty('--ptcs-legend-col-widths', [...Array(numCol).keys()].map(() => cw).join(' '));
            });
        }
    }

    _createSelected() {
        const compute = () => {
            const r = [];
            const num = this.items ? this.items.length : 0;
            for (let i = 0; i < num; i++) {
                if (!this._unselected[i]) {
                    r.push(i);
                }
            }
            return r;
        };

        const selected = this.filter ? compute() : null;
        if ((selected || [-1]).join('+') === (this.selected || [-1]).join('+')) {
            // Filter has not changed. Don't generate a change event
            return;
        }

        this.__protectSelected = true;
        this.selected = selected;
        this.__protectSelected = false;
        this._refreshGrid();
    }

    _updateSelect(index, checked) {
        const checkbox = this.shadowRoot.querySelector(`[part=item][legend-select=${this._legendSelect(index)}] [part~=checkbox]`);
        if (checkbox && checkbox.checked !== checked) {
            checkbox.checked = checked;
        }
    }

    _selectionChanged(cr) {
        if (this.__protectSelected) {
            return;
        }

        //console.warn('UNIMPLEMENTED: selection has been updated by client !');

        /*
        if (cr.path === 'selected') {
            // A new list of items
            // TODO: This
            cr.base.forEach(item => this._updateSelect(item, true));
        } else if (cr.path === 'selected.splices') {
            // Added / removed items
            if (cr.value.indexSplices) {
                cr.value.indexSplices.forEach(item => {
                    if (item.removed && item.removed.length) {
                        item.removed.forEach(item => this._updateSelect(item, false));
                    }
                    if (item.addedCount > 0) {
                        for (let i = 0; i < item.addedCount; i++) {
                            this._updateSelect(item.object[item.index + i], true);
                        }
                    }
                });
            }
        }
        */
    }

    _checkedChanged(ev) {
        const index = this.$.legend.indexForElement(ev.target);
        const unselected = ev.detail.value !== true;

        if (this._unselected[index] !== unselected) {
            this._unselected[index] = unselected;
        }

        this._createSelected();
    }

    _clickLegend(ev) {
        if (this.disabled) {
            return;
        }
        const index = this.$.legend.indexForElement(ev.target);
        this._focusOn(index);
        if (index === null || !this.filter) {
            return;
        }
        this._unselected[index] = !this._unselected[index];
        this._updateSelect(index, !this._unselected[index]);
        this._createSelected();
    }

    _clickCheckbox(ev) {
        const index = this.$.legend.indexForElement(ev.target);
        this._focusOn(index);
        // Let the checkbox handle this click. Don't let it reach _clickLegend
        ev.stopPropagation();
    }

    // Callback when any values changes
    _updateMaxWidth(maxWidth, horizontal) {
        this.__updateMaxWidth(maxWidth, horizontal);
        this._refreshGrid();
    }

    // Handle changed properties or resized component
    __updateMaxWidth(maxWidth, horizontal) {
        let mw = maxWidth ? PTCS.cssDecodeSize(maxWidth, this) : NaN;
        if (horizontal && !(mw < this.clientWidth)) {
            mw = this.clientWidth;
        }
        if (isNaN(mw)) {
            this.style.removeProperty('--ptcs-legend-max-width');
        } else {
            this.style.setProperty('--ptcs-legend-max-width', `${mw}px`);
        }
    }

    _resetToDefaultValues() {
        const num = this.items ? this.items.length : 0;
        for (let i = 0; i < num; i++) {
            this._updateSelect(i, true);
        }
    }

    _initTrackFocus() {
        this._trackFocus(this, () => {
            return this._focus ? this._focus : null;
        });
    }

    _notifyFocus() {
        if (this._focus === undefined) {
            this._focusOn(0);
        } else if (this._focus) {
            this._focus.scrollIntoViewIfNeeded();
        }
    }

    _focusOn(index) {
        let el = (index !== null && index >= 0) ? this.shadowRoot.querySelector(`[part=item][legend-select=${this._legendSelect(index)}]`) : null;
        this._focus = el ? el : undefined;
        if (el) {
            el.scrollIntoViewIfNeeded();
        }
    }

    _keyDown(ev) {
        if (!this._focus) {
            return;
        }

        let currentIndex = Number(this._focus.getAttribute('legend-select').replace('L', '') - 1);
        if (!(0 <= currentIndex && currentIndex < this.items.length)) {
            return;
        }

        // Is legend item visible?
        const isVisible = i => !this.items[i].empty;

        // Find visible legend item backwards
        const prev = i => {
            for (; i >= 0; i--) {
                if (isVisible(i)) {
                    return i;
                }
            }
            for (i = this.items.length - 1; i >= 0; i--) {
                if (isVisible(i)) {
                    return i;
                }
            }
            return undefined;
        };

        // Find visible legend item forwards
        const next = i => {
            for (; i < this.items.length; i++) {
                if (isVisible(i)) {
                    return i;
                }
            }
            for (i = 0; i < this.items.length; i++) {
                if (isVisible(i)) {
                    return i;
                }
            }
            return undefined;
        };

        let nextIndex;
        switch (ev.key) {
            case 'Home':
            case 'PageUp':
                nextIndex = next(0);
                break;
            case 'ArrowUp':
            case 'ArrowLeft':
                nextIndex = prev(currentIndex - 1);
                break;
            case 'End':
            case 'PageDown':
                nextIndex = prev(this.items.length - 1);
                break;
            case 'ArrowDown':
            case 'ArrowRight':
                nextIndex = next(currentIndex + 1);
                break;
            case ' ':
                this._focus.click();
                break;
            default:
                // Not handled
                return;
        }

        // We consumed this keyboard event. Don't propagate
        ev.preventDefault();

        if (nextIndex !== undefined && nextIndex !== currentIndex) {
            this._focusOn(nextIndex);
        }
    }
};

customElements.define(PTCS.ChartLegend.is, PTCS.ChartLegend);
