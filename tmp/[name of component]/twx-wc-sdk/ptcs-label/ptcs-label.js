import {LitElement, html, css} from 'lit';
import {L2Pw} from 'ptcs-library/library-lit';
import {PTCS} from 'ptcs-library/library.js';
import 'ptcs-behavior-styleable/ptcs-behavior-styleable.js';
import 'ptcs-behavior-focus/ptcs-behavior-focus.js';
import 'ptcs-behavior-tooltip/ptcs-behavior-tooltip.js';
import 'ptcs-div/ptcs-focusable-div.js';
import {closeTooltip} from 'ptcs-behavior-tooltip/ptcs-behavior-tooltip.js';

PTCS.Label = class extends PTCS.BehaviorTooltip(PTCS.BehaviorFocus(PTCS.BehaviorStyleable(/*PTCS.ThemableMixin(*/L2Pw(LitElement)/*)*/))) {
    static get styles() {
        return css`
        :host {
            display: inline-flex;
            flex-direction: row;
            overflow: hidden;
            min-width: 34px;
            min-height: 13px;
            box-sizing: border-box;
        }

        :host([disabled]) {
            cursor: auto;
            pointer-events: none;
        }

        :host(:not([disabled]))  [part=text-link] {
            cursor: pointer;
        }

        :host(:not([disabled]))  [part=text-link]::before {
            pointer-events: auto;
            cursor: pointer;
        }

        :host([hidden]) {
            display: none;
            visibility: hidden;
        }

        [part=root] {
            display: inline-block;
            width: 100%;
            height: 100%;
        }

        [part=root].sl {
            display: inline-flex;
        }

        .ml {
            position: relative;
        }

        .sl [part=label] {
            display: block;
            white-space: nowrap;
            text-overflow: ellipsis;
            overflow: hidden;
            width: 100%;
            text-decoration: inherit;
        }

        .ml [part=label] {
            display: flex;
            flex-wrap: nowrap;
            flex-direction: column;
            overflow: auto;
            height: 100%;
            transition: max-height 100ms;
            word-wrap: break-word;
        }

        .ml.overflow_showmore [part=label] {
            overflow: hidden;
        }

        :host([vertical-alignment=center]) .ml [part=label] {
            justify-content: center;
        }

        :host([vertical-alignment=flex-end]) .ml [part=label] {
            justify-content: flex-end;
        }

        :host([vertical-alignment=center]) [part=root].sl {
            align-items: center;
        }

        :host([vertical-alignment=flex-end]) [part=root].sl {
            align-items: flex-end;
        }

        .overflow_showmore [part=show-button] {
            display: block;
            position: absolute;
        }

        .overflow_showmore[show-all] [part=show-button] {
            position: static;
            padding-right: 0px;
            background-color: transparent;
            box-shadow: none;
        }

        .overflow_showmore[show-all][static-pos] {
            overflow-y: auto;
        }

        .overflow_showmore:not([show-all])[static-pos] {
            overflow-y: hidden;
        }

        [part=show-button] {
            display: none;
            left: 0px;
            right: 0px;
            bottom: 0px;
            width: 100%;
        }

        [part=text-link]::before {
            content: var(--ptcs-label-show-button--more, "Show More");
            pointer-events: auto;
        }

        .overflow_showmore[show-all] [part=show-button] [part=text-link]::before {
            content: var(--ptcs-label-show-button--less, "Show Less");
            pointer-events: auto;
        }

        /* Hack for multiline labels that only fits on a single line */
        .forced-single-line {
            display: block !important;
            white-space: nowrap !important;
            text-overflow: ellipsis !important;
            overflow: hidden !important;
        }

        :host([preserve-white-space]) .ml [part=label] {
            white-space: break-spaces;
        }

        :host([preserve-white-space]) .sl [part=label] {
            white-space: pre;
        }`;
    }

    render() {
        const style = [];

        if (this._maxHeight) {
            style.push(`max-height:${this._maxHeight}px`);
        }

        if (this.maxWidth) {
            const mw = PTCS.cssDecodeSize(this.maxWidth);
            if (mw > 0) {
                style.push(`max-width:${mw}px`);
            }
        }

        if (this.horizontalAlignment) {
            style.push(`text-align:${this.horizontalAlignment}`);
        }

        if (this._overflow) {
            return html`<div id="root" part="root" ?show-all=${this._showAll} class=${this._class()} style=${style.join('; ')}>
            <div id="label" part="label">${this.label}</div>
            <div id="show" part="show-button" ?show-all=${this._showAll}><ptcs-focusable-div part="text-link" tabindex="0"
              @click=${this._clickShow} @keydown=${this._keydown}></ptcs-focusable-div></div>
          </div>`;
        }

        return html`<div id="root" part="root" class=${this._class()} style=${style.join('; ')}>
          <div id="label" part="label">${this._labelTruncated || this.label}</div>
        </div>`;
    }

    static get is() {
        return 'ptcs-label';
    }

    static get properties() {
        return {
            // Label value
            label: {
                type:     String,
                observer: '_checkHeight'
            },

            // Variant (for theming)
            variant: {
                type:    String,
                reflect: true
            },

            // Multi-line string?
            multiLine: {
                type:      Boolean,
                attribute: 'multi-line',
                value:     false,
                observer:  '_checkHeight'
            },

            // Fixed max-height for multi-line?
            maxHeight: {
                type:      String,
                attribute: 'max-height',
                observer:  '_maxHeightChanged'
            },

            // the unitless value of maxHeight
            _maxHeight: {},

            // maximum width?
            maxWidth: {
                type:      String,
                attribute: 'max-width',
                observer:  '_maxWidthChanged'
            },

            // Support white space in labelText
            preserveWhiteSpace: {
                type:      Boolean,
                attribute: 'preserve-white-space',
                reflect:   true
            },

            // Support disabled (this is now hidden in widgets.json)
            disabled: {
                type:    Boolean,
                reflect: true
            },

            // Horizontal Alignment
            horizontalAlignment: {
                type:      String,
                attribute: 'horizontal-alignment',
                observer:  '_horizontalAlignmentChanged'
            },

            // Vertical Alignment
            verticalAlignment: {
                type:      String,
                attribute: 'vertical-alignment',
                reflect:   true
            },

            // select if multiline and maxHeight are set and label-text is long, select if display showMore or text Ellipsis
            disclosureControl: {
                type:      String,
                attribute: 'disclosure-control',
                value:     'show-more',
                observer:  '_checkHeight'
            },

            disScrollOnEllipsMultiLine: {
                type:      Boolean,
                attribute: 'dis-scroll-on-ellips-multi-line',
            },

            // The truncated label, if it is truncated
            _labelTruncated: {
                type: String
            },

            // Is the text overflowing?
            _overflow: {
                type: Boolean
            },

            // Show all text?
            _showAll: {
                type: Boolean
            },

            // this.$.root.style.maxHeight
            _styleMaxHeight: {
                type:     String,
                observer: '_styleMaxHeightChanged',
                computed: '_computeStyleMaxHeight(maxHeight, disclosureControl, _showAll, _staticPositioning)'
            },

            _staticPositioning: {
                type:  Boolean,
                value: false
            },

            showMoreLabel: {
                type:      String,
                attribute: 'show-more-label',
                observer:  '_showMoreLabelChanged'
            },

            showLessLabel: {
                type:      String,
                attribute: 'show-less-label',
                observer:  '_showLessLabelChanged'
            }
        };
    }

    constructor() {
        super();

        this.variant = 'label';
    }

    ready() {
        super.ready();
        this.tooltipFunc = this._monitorTooltip.bind(this);
    }

    // Has label been truncated?
    // NOTE: this is a public function used by aggregating components
    isTruncated() {
        const el = this.$.label;
        if (!el) {
            return false;
        }
        // Truncated label to be added to tooltip?
        if (this.disclosureControl === 'ellipsis' && this._labelTruncated !== this.label) {
            return true;
        }
        const b = el.getBoundingClientRect();
        // Remaining tests applied on other browsers than MS Edge
        if (el.offsetWidth < el.scrollWidth) {
            return true;
        }
        if (el.offsetHeight < el.scrollHeight && (getComputedStyle(el)['writingMode'] === 'vertical-rl' || this.maxHeight)) {
            // Only if maxHeight is defined the label is truncated otherwise we have a scrollbar
            return true;
        }
        // NOTE: This code is not 100% reliable. It misses some cases
        // NOTE: At most a sub-pixel will overflow if we reach here
        // PROBLEM:
        // - getBoundingClientRect includes fractions (sub-pixels) for the client area.
        // - there is no way to get sub-pixel info for scrollWidth / scrollHeight
        // HENCE: Some overflow cases are impossible to determine
        // FIX:   This code tells ptcs-label to expand itself fully, and if it gets any bigger
        //        this way we know some part of it was previousy hidden (or maybe line broken...)
        // HOWEVER: Sometimes some other element puts the size restriction of the label, in some way,
        //          and those restrictions are practically difficult (impossible) to find and loosen
        const {maxWidth, maxHeight} = this.style;
        if (!maxWidth && !maxHeight) {
            // No max dimensions to un-restrict on the label itself
            return false;
        }
        this.style.maxWidth = 'max-content';
        this.style.maxHeight = 'max-content';
        const b2 = el.getBoundingClientRect();
        this.style.maxWidth = maxWidth;
        this.style.maxHeight = maxHeight;

        // TW-75329: Only set the item as truncated if the size *grows* when styled
        // to its maximum width---on Firefox this value sometimes shrinks (!)
        return b2.width > b.width || b2.height > b.height;
    }

    // Tooltip behavior on label truncation
    _monitorTooltip(truncated = false) {
        if (this.isTruncated() || truncated) {
            if (!this.tooltip) {
                // No tooltip, but truncated label. Use label as tooltip
                return this.label;
            }
            if (this.tooltip !== this.label) {
                // If label is not same as tooltip, show both:
                return this.label + '\n\n' + this.tooltip;
            }
        } else if (this.tooltip === this.label) {
            // Label is not truncated. Don't show tooltip if identical to label.
            return '';
        }
        // Only show explicit tooltip
        return this.tooltip || '';
    }

    _class() {
        if (this.multiLine) {
            if (this.disclosureControl === 'ellipsis') {
                return this.disScrollOnEllipsMultiLine ? 'ml overflow_showmore' : 'ml';
            }
            return this._overflow ? 'ml overflow_showmore' : 'ml';
        }
        return 'sl';
    }

    _maxWidthChanged(maxWidth) {
        const mw = parseInt(maxWidth);
        this.$.root.style.maxWidth = mw > 0 ? mw + 'px' : '';
        this._checkHeight();
    }

    _maxHeightChanged(value) {
        // Only change if effective boolean value has changed
        if (this._overflow) {
            this._showAll = false;
        }

        this._maxHeight = PTCS.cssDecodeSize(value);

        this._checkHeight();
    }

    _horizontalAlignmentChanged(horizontalAlignment) {
        this.$.root.style.textAlign = horizontalAlignment || '';
    }

    // Value for this.$.root.style.maxHeight has changed
    _styleMaxHeightChanged(styleMaxHeight) {
        this.$.root.style.maxHeight = styleMaxHeight;
    }

    // Compute value for this.$.root.style.maxHeight
    _computeStyleMaxHeight(maxHeight, disclosureControl, _showAll, _staticPositioning) {
        if (maxHeight && ((disclosureControl === 'ellipsis') || !_showAll || (_showAll && _staticPositioning))) {
            const mh = parseInt(maxHeight);
            if (mh > 0) {
                return mh + 'px';
            }
        }

        return '';
    }

    // Monitor the label height
    _checkHeight() {
        let v = {};
        this._labelTruncated = this.label;
        this.performUpdate();

        const label = this.$.label;
        label.classList.remove('forced-single-line');
        if (this.maxHeight) {
            this._handleResizeEvent(true);
            if (this.disclosureControl === 'ellipsis') {
                if (label.scrollHeight > this._maxHeight) {
                    let searchLow = 0;
                    let searchHigh = Math.max(this._labelTruncated.length - 1, 0);
                    let middle;
                    while ((searchLow !== searchHigh) && (searchLow !== searchHigh - 1)) {
                        middle = Math.floor((searchLow + searchHigh) / 2);
                        this._labelTruncated = this.label.substring(0, middle);
                        this.performUpdate();

                        if (label.scrollHeight > this.maxHeight) {
                            searchHigh = middle;
                        } else {
                            searchLow = middle;
                        }
                    }
                    if (searchLow !== middle) {
                        this._labelTruncated = this.label.substring(0, searchLow);
                    }
                    // removing four characters to make room for Unicode horizontal ellipsis
                    this._labelTruncated = this._labelTruncated.slice(0, -4) + '\u2026';

                    if (label.clientHeight < 2 * PTCS.cssDecodeSize(getComputedStyle(label).fontSize, label, true)) {
                        // The result is a single line. Now need to enter a special mode so the
                        // ptcs-label gets resize events if the label gets more available space
                        label.classList.add('forced-single-line');
                        this._labelTruncated = this.label;
                    }
                }
                return; // ----> EXIT
            }
            v._overflow = this._showAll || (this.$.root.offsetHeight < label.scrollHeight);
        } else {
            // maxHeight is not specified so don't show "show more" button

            // Only change these values if the effective boolean value has changed.
            // If they are changed from undefined to false they will invoke callbacks
            if (this._overflow) {
                v._overflow = false;
            }
            if (this._showAll) {
                v._showAll = false;
            }
            this._handleResizeEvent(false);
        }
        this.setProperties(v);
    }

    _clickShow() {
        if (this.disabled) {
            return;
        }
        this._showAll = this._showAll ? undefined : true;
        requestAnimationFrame(closeTooltip);
        if (this._staticPositioning && !this._showAll) {
            this.$.root.scrollTop = 0;
        }
    }

    _keydown(ev) {
        if (ev.key === ' ' || ev.key === 'Enter') {
            this._clickShow();
            ev.preventDefault();
        }
    }

    _handleResizeEvent(observe) {
        if (this._resizeObserver) {
            if (!observe) {
                this._resizeObserver.unobserve(this);
                this._resizeObserver = undefined;
                this._labelTruncated = undefined;
            }
        } else if (observe) {
            this._resizeObserver = new ResizeObserver(() => {
                // Trick to get rid of "resizeobserver loop exceeded" error in the unit tests
                requestAnimationFrame(() => {
                    this._checkHeight();
                });
            });
            this._resizeObserver.observe(this);
        }
    }

    _showMoreLabelChanged(showMoreLabel) {
        this.style.setProperty('--ptcs-label-show-button--more', `"${showMoreLabel}"`);
    }

    _showLessLabelChanged(showLessLabel) {
        this.style.setProperty('--ptcs-label-show-button--less', `"${showLessLabel}"`);
    }

    static get $parts() {
        return [/*'root', */'label', 'show-button', 'text-link'];
    }
};

customElements.define(PTCS.Label.is, PTCS.Label);
