import {PolymerElement, html} from '@polymer/polymer/polymer-element.js';
import {PTCS} from 'ptcs-library/library.js';
import 'ptcs-behavior-styleable/ptcs-behavior-styleable.js';

//
// IMPORTANT: This component may only be used by ptcs-behavior-tooltip.js
//

PTCS.__TooltipOverlay = class extends PTCS.BehaviorStyleable(PTCS.ThemableMixin(PolymerElement)) {
    static get template() {
        return html`
        <style>
        :host {
            position: fixed;
            z-index: 99999;
            pointer-events: none;
            box-sizing: border-box;
            display: inline-block;
        }

        :host(:not([_showtooltip])) {
            visibility: hidden;
        }

        .hbar {
            display: flex;
            flex-direction: row;
            justify-content: center;
        }

        [part=truncation-overflow],
        [part=text] {
            word-break: break-word;
        }

        [part=tooltip-icon] {
            align-self: flex-start;
        }

        /* Tooltip pointer on kbd focus should be 14px wide and 8px high */
        [part=pointer] {
            position: absolute;
            display: block;
        }

        :host([_top=hide]) [part=pointer] {
            display: none;
        }

        :host([_top]) [part=pointer] {
            top: var(--ptcs-tooltip-pointer-shift, -5px);
            transform: rotate(180deg);
        }

        :host(:not([_top])) [part=pointer] {
            bottom: var(--ptcs-tooltip-pointer-shift, -5px);
        }

        [part=tooltip-text] {
            display: grid;
            grid-template-columns: auto auto;
            justify-items: start;
            align-items: center;
        }

        [part=tooltip-text] > ptcs-icon {
            grid-column: 1;
            color: #FFFFFF;
        }

        [part=tooltip-text] > [part=marker] {
            grid-column: 1;
        }

        [part=tooltip-text] > div {
            grid-column: 2;
        }

        #svgline {
            display: none;
            position: absolute;
        }
        </style>
        <div class="hbar" part="tooltip">
            <svg height="8" width="14" part="pointer" id="svgptr">
               <polyline points="0 0, 7 8, 14 0"/>
            </svg>
            <svg part="tooltip-line" id="svgline">
                <line id="tooltip-line" part="tooltip-line"></line>
            </svg>
            <ptcs-icon id="icon" part="tooltip-icon" icon="[[tooltipIcon]]" size="small" hidden\$="[[!tooltipIcon]]"></ptcs-icon>
            <div part="tooltip-text"></div>
        </div>`;
    }

    static get is() {
        return 'ptcs-tooltip-overlay';
    }

    static get properties() {
        return {
            variant: {
                type:               String,
                value:              'primary',
                reflectToAttribute: true
            },

            // The tooltip text
            tooltip: {
                type: String
            },

            // tooltip decomposed into separate lines
            _tooltipItems: {
                type:     Array,
                computed: '_computeTooltipItems(tooltip)',
                observer: '_tooltipItemsChanged'
            },

            // The tooltip icon, if any
            tooltipIcon: {
                type:     String,
                observer: 'tooltipIconChanged',
                value:    '' // Need an initial value, or @hidden will not be computed
            },

            // Show tooltip?
            _showtooltip: {
                type:     Boolean,
                observer: '_showtooltipChanged'
            },

            // Show tooltip pointer at top - or at bottom
            _top: {
                type:               String,
                reflectToAttribute: true
            },

            ariaHidden: {
                type:               Boolean,
                compute:            '_computeAriaHidden(_showtooltip)',
                reflectToAttribute: true
            },

            _tooltipMove: {
                type:  Boolean,
                value: false
            }
        };
    }

    ready() {
        super.ready();

        // Only pay the price for Edge on Edge
        if (PTCS.isEdge) {
            this._createPropertyObserver('tooltip', '_tooltipChanged', false);
            this._createPropertyObserver('kbdfocus', '_kbdfocusChanged', false);
        }
    }

    // Convert tooltip data to tooltipItems
    _computeTooltipItems(tooltip) {
        if (tooltip instanceof Array) {
            return tooltip.map(item => {
                if (typeof item === 'string') {
                    return {text: item, part: 'text'};
                }
                return {color: item.color, icon: item.icon, text: item.text || '', part: item.part || 'text'};
            });
        }

        if (typeof tooltip === 'string') {
            const a = tooltip.split('\n\n').map(s => ({text: s, part: 'text'}));
            if (a.length > 1) {
                a[0].part = 'truncation-overflow';
            }
            return a;
        }

        // Unknown format
        return [{text: `${tooltip}`, part: 'text'}];
    }

    _tooltipItemsChanged(_tooltipItems) {
        // This would look better if it used  D3, but tooltips should not require a D3 module
        const root = this.shadowRoot.querySelector('[part=tooltip-text]');

        const select = (el, tagName) => {
            if (!el) {
                return root.appendChild(document.createElement(tagName));
            }
            if (el.tagName === tagName) {
                // remove leftovers
                el.removeAttribute('part');
                el.removeAttribute('style');
                el.textContent = '';
                return el;
            }
            const el2 = root.insertBefore(document.createElement(tagName), el);
            el.remove();
            return el2;
        };

        const elems = [...root.querySelectorAll(':scope > *')];

        let marker;

        for (let i = 0; i < _tooltipItems.length; i++) {
            const tt = _tooltipItems[i];

            if (tt.icon) {
                const icon = select(elems.shift(), 'PTCS-ICON');
                icon.setAttribute('part', `${tt.part}-icon`);
                icon.icon = tt.icon;
            } else if (tt.color) {
                if (marker) {
                    // Make the previous marker stretch along the tooltip text lines
                    marker.style.gridRowEnd = i + 1;
                }

                marker = select(elems.shift(), 'DIV');
                marker.setAttribute('part', 'marker');
                marker.style.background = tt.color;

                marker.style.gridRowStart = i + 1;
            }

            const label = select(elems.shift(), 'DIV');
            label.setAttribute('part', tt.part);
            label.textContent = tt.text;
        }

        if (marker) {
            // Make the last marker stretch along the tooltip text lines
            marker.style.gridRowEnd = _tooltipItems.length + 1;
        }

        elems.forEach(el => el.remove());
    }

    _computeAriaHidden(_showtooltip) {
        return !_showtooltip;
    }

    hide() {
        // Abort any ongoing requests to show the tooltip
        this._requestShow = null;

        // Hide tooltip
        this._showtooltip = false;
    }

    _showtooltipChanged(/*_showtooltip*/) {
        if (this._tooltipMove) {
            this._showtooltipAttribute(this._showtooltip);
            this._tooltipMove = false;
        } else {
            // Delay setting the visibility attribute, to avoid flicker
            if (this.__showTimeout) {
                return;
            }
            this.__showTimeout = true;
            setTimeout(() => {
                this.__showTimeout = false;
                this._showtooltipAttribute(this._showtooltip);
            }, 150); // Magic number (for now): must be higher than --ptcs-tooltip-next-delay
        }
    }

    _showtooltipAttribute(_showtooltip) {
        if (_showtooltip) {
            this.setAttribute('_showtooltip', '');
        } else {
            this.removeAttribute('_showtooltip');
            // Remove positions, allow the tooltip to size itself freely
            this.style.left = '';
            this.style.top = '';
        }

        // Edge needs some extra help
        if (PTCS.isEdge) {
            this.style.visibility = this._showtooltip ? 'visible' : 'hidden';
        }
    }

    show(el, tooltip, area, showAnyway, variant) {
        console.assert(showAnyway || (el && tooltip && area && area.w > 0 && area.h > 0));

        // Cancel any previous request
        this._requestShow = null;

        // In case tooltip is a function ...
        if (typeof tooltip === 'function') {
            tooltip = tooltip.call(el) || '';
        }

        if (tooltip) {
            // New tooltip about to be shown
            this.tooltip = tooltip;
            this.tooltipIcon = el.tooltipIcon;

            if (variant) {
                this.variant = variant;
            }

            this._requestShow = area;
            requestAnimationFrame(() => this._placeWindow(el, area));
        }
    }

    _placeWindow(el, area) {
        if (area !== this._requestShow) {
            // Request has been cancelled
            return;
        }
        this._requestShow = null;

        // CSS variables may change dynamically, so we need to check every time
        // Padding (distance between focused element and the focus border)
        let pd = 8;
        const padding = getComputedStyle(el).getPropertyValue('--ptcs-tooltip-overlay--padding');
        if (padding) {
            const m = /^\s*(-?[0-9.]+)([a-zA-Z]*)\s*/g.exec(padding);
            if (m && (m[2] === '' || m[2] === 'px')) {
                const x = parseFloat(m[1]);
                if (!isNaN(x)) {
                    pd = x;
                }
            }
        }

        // Screen geometry
        const width = document.documentElement.clientWidth;
        const height = document.documentElement.clientHeight;

        // Offset between area.mx and pointer
        const mousePointerWidth = 12;

        // Tooltip dimension
        const b = this.getBoundingClientRect();
        // Mouse enter position
        const mx = typeof area.mx === 'number' ? area.mx : area.x + area.w / 2;
        const my = typeof area.my === 'number' ? area.my : area.y + area.h / 2;
        // Potential tooltip positions
        const areaArg = area.arg || {};
        const x1 = mx + mousePointerWidth - b.width;
        const x2 = mx - mousePointerWidth;
        const y1 = area.y - b.height - pd;
        const y2 = area.y + area.h + pd;
        const hidePointer = areaArg.hidePointer || false;
        const tooltipLine = areaArg.tooltipLine;
        const arg = {mx, my, w: b.width, h: b.height, hidePointer, tooltipLine};

        let shiftX = areaArg.shiftX || 0;
        let shiftY = areaArg.shiftY || 0;
        const fitTop = y1 - shiftY >= 0;
        const fitBottom = y2 + b.height + shiftY < height;
        const fitLeft = x1 - shiftX >= 0;
        const fitRight = x2 + b.width + shiftX < width;

        /*
           Tooltip should be positioned in following locations, in order of preference, if not positioned from mouse pointer point of entry:

                  Ternary Position             Secondary Position
                                 WIDGET WITH TOOLTIP
                                  Inside Position
                  Quaternary Position          Primary Position
        */
        // Places to try
        const places = ['br', 'tr', 'tl', 'bl', 'in'];

        // Do the tooltip have any preferences about its position?
        const pos = el.tooltipPos || el.getAttribute('tooltip-pos');
        if (typeof pos === 'string') {
            places.unshift(...pos.split(' '));
        }

        // Find a place for the tooltip
        const place = places.find(p => {
            switch (p) {
                case 'tl':
                    // Ternary Position
                    if (fitTop && fitLeft) {
                        this._setPos(x1 - shiftX, y1 - shiftY, false, arg);
                        return true;
                    }
                    break;
                case 'tr':
                    // Secondary Position
                    if (fitTop && fitRight) {
                        this._setPos(x2 + shiftX, y1 - shiftY, false, arg);
                        return true;
                    }
                    break;
                case 'bl':
                    // Quaternary Position
                    if (fitBottom && fitLeft) {
                        this._setPos(x1 - shiftX, y2 + shiftY, true, arg);
                        return true;
                    }
                    break;
                case 'br':
                    // Primary Position
                    if (fitBottom && fitRight) {
                        this._setPos(x2 + shiftX, y2 + shiftY, true, arg);
                        return true;
                    }
                    break;
                case 'in':
                    // Inside Position
                    this._tooltipMove = true;
                    this._setPos(mx - pd, my + mousePointerWidth + pd * 2, true, arg);
                    return true;
                case 'ce-tl':
                    // The piece is at the top left
                    this._setPos(mx - b.width, my - b.height, true, arg, p);
                    return true;
                case 'ce-tr':
                    // The piece is at the top right
                    this._setPos(mx, my - b.height, true, arg, p);
                    return true;
                case 'ce-bl':
                    // The piece is at the top left
                    this._setPos(mx - b.width, my, true, arg, p);
                    return true;
                case 'ce-br':
                    // The piece is at the bottom right
                    this._setPos(mx, my, true, arg, p);
                    return true;
                default:
                    if (p !== '') {
                        console.warn('Unknown tooltip position: ' + p);
                    }
            }
            return false;
        });

        if (place) {
            // Found a valid tooltip place
            return;
        }

        // Tooltips doesn't fit anywhere. Find a fallback position
        const x = Math.max(Math.min((x1 + x2 - b.width) / 2, width - b.width), 0);
        if (b.height <= height - area.y - area.h) {
            // Center below
            this._setPos(x, area.y + area.h + pd, true, arg);
        } else if (b.height < area.y) {
            // Center above
            this._setPos(x, area.y - b.height - pd, false, arg);
        } else {
            // Double fail. Just put the toolbar as far down as possible
            this._setPos(x, Math.min(0, height - b.height), true, arg);
        }
    }

    _drawTooltipLine(tooltipLine, pos, width, height) {
        if (!tooltipLine) {
            return;
        }

        let x1 = 0, y1 = 0, x2, y2, length, angle;
        ({angle, length} = tooltipLine);

        x2 = -Math.sin(angle) * length;
        y2 = Math.cos(angle) * length;

        const svgline = this.$.svgline;
        const ttLine = this.$['tooltip-line'];

        ttLine.setAttribute('x1', x1);
        ttLine.setAttribute('y1', y1);
        ttLine.setAttribute('x2', x2);
        ttLine.setAttribute('y2', y2);

        svgline.style.display = 'block';

        svgline.setAttribute('width', length);
        svgline.setAttribute('height', length);

        svgline.style.left = '';
        svgline.style.top = '';
        svgline.style.right = '';
        svgline.style.bottom = '';

        ttLine.style.transform = '';

        if (pos === 'ce-tl') {
            svgline.style.left = `${width}px`;
            svgline.style.top = `${height}px`;
        } else if (pos === 'ce-tr') {
            svgline.style.left = `-${length}px`;
            svgline.style.top = `${height}px`;

            ttLine.style.transform = `translate(${length}px)`;
        } else if (pos === 'ce-br') {
            svgline.style.left = `-${length}px`;
            svgline.style.top = `-${length}px`;

            ttLine.style.transform = `translate(${length}px, ${length}px)`;
        } else if (pos === 'ce-bl') {
            svgline.style.left = `${width}px`;
            svgline.style.top = `-${length}px`;

            ttLine.style.transform = `translate(0px, ${length}px)`;
        }
    }

    _setPos(x, y, top, arg, p) {
        this._top = arg.hidePointer ? 'hide' : top;
        this.style.left = `${Math.max(0, x)}px`;
        this.style.top = `${Math.max(0, y)}px`;

        this.$.svgline.style.display = 'none';

        if (p !== undefined && p.includes('ce-')) {
            this.$.svgptr.style.display = 'none';

            this._drawTooltipLine(arg.tooltipLine, p, arg.w, arg.h);
        } else {
            this.$.svgptr.style.display = 'block';
            // Magic numbers:
            // - Width of pointer: 14px
            // - Min distance of pointer from edge: 8px
            x += Math.abs(Math.min(0, x));
            this.$.svgptr.style.left = `${Math.min(Math.max(8, arg.mx - x), arg.w - 14 - 8)}px`;
        }

        this._showtooltip = true;
    }

    tooltipIconChanged(val) {
        // Drives CSS for spacing between icon / tooltip text
        if (val) {
            this.setAttribute('_icon', '');
        } else {
            this.removeAttribute('_icon');
        }
    }

    //
    // Egde fixes - these functions will only be invoked on Edge
    //
    _tooltipChanged(tooltip) {
        // Edge fix for artificial use case where tooltip text cannot be line-broken properly...
        if (typeof tooltip === 'string' && !tooltip.includes(' ') && this.scrollWidth > 546) {
            this.style.wordBreak = 'break-all';
        } else {
            this.style.wordBreak = '';
        }
    }

    _kbdfocusChanged(kbdfocus) {
        this.style.visibility = kbdfocus ? 'visible' : 'hidden';
    }
};

customElements.define(PTCS.__TooltipOverlay.is, PTCS.__TooltipOverlay);

