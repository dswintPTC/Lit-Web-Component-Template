import {PolymerElement, html} from '@polymer/polymer/polymer-element.js';
import {PTCS} from 'ptcs-library/library.js';
import 'ptcs-behavior-styleable/ptcs-behavior-styleable.js';
import 'ptcs-behavior-focus/ptcs-behavior-focus.js';
import 'ptcs-behavior-tabindex/ptcs-behavior-tabindex.js';
import 'ptcs-behavior-tooltip/ptcs-behavior-tooltip.js';
import 'ptcs-button/ptcs-button.js';
import 'ptcs-label/ptcs-label.js';
import 'ptcs-modal-overlay/ptcs-modal-overlay.js';
import './ptcs-value-container.js';
import './ptcs-value-display-popup.js';
import './ptcs-image-value-container.js';
import {closeTooltip} from 'ptcs-behavior-tooltip/ptcs-behavior-tooltip.js';
import 'ptcs-icons/cds-icons.js';
import {createSubComponent} from 'ptcs-library/create-sub-component.js';
import 'ptcs-div/ptcs-div.js';
PTCS.ValueDisplay = class extends PTCS.BehaviorTabindex(PTCS.BehaviorTooltip(PTCS.BehaviorFocus(
    PTCS.BehaviorStyleable(PTCS.ThemableMixin(PolymerElement))))) {
    static get is() {
        return 'ptcs-value-display';
    }

    static get template() {
        return html`
        <style>
        :host
        {
            display: inline-block;
            box-sizing: border-box;
            overflow: auto;
        }

        :host([_overflow]) {
            overflow: auto;
        }

        :host([_value-type="image"]) {
            overflow: hidden;
        }

        :host([_fallback]:not([_default-text])) [part=overflow-control]::after {
            content: var(--ptcs-value-display-ide-string);
            display: block;
            text-align: center !important;
            width: 100%;
            font-weight: 600;
            font-size: 14px;
            order: 3;
        }

        :host([_fallback]:not([_default-text])) [part=value-container] {
            display: none;
        }

        [part=root] {
            width: 100%;
            height: 100%;
        }

        :host(:not([_image-area])) [part=value-display-area] {
            display: flex;
            flex-direction: column;
            box-sizing: border-box;
        }

        :host(:not([_image-area])) [part=overflow-control] {
            display: flex;
            flex-direction: column;
            position: relative;
            overflow: hidden;
        }

        :host([_image-area]) [part=overflow-control] {
            width: 100%;
            height: 100%;
        }

        :host([_image-area]) [part=value-container] {
            display: none;
        }

        :host([_overflow][_show-all]) [part=overflow-control] {
            overflow: visible;
        }

        [part=value-display-label][label=''] {
            display: none;
            padding: 0px;
        }

        [part=disclosure-button-overlay] {
            display: none;
        }

        [part=value-display-label]{
            display: inline-flex;
            box-sizing: border-box;
            height: fit-content;
            flex-shrink: 0;
            order: 1;
        }

        [part=value-display-label][variant=header]{
            min-height: 35px;
        }

        [part=value-container] {
            order: 2;
            overflow: visible;
        }

        :host([_showpopup][_overflow]) [part=disclosure-button-overlay] {
            pointer-events: none;
        }

        :host([_overflow][overflow-option=disclosure]) [part=disclosure-button-overlay] {
            position: absolute;
            box-sizing: border-box;
            order: 3;
            display: flex;
            justify-content: flex-end;
            left: 0px;
            bottom: 0px;
            height: 34px;
            width: 100%;
            z-index: 1;
        }

        :host([_value-type=image][_overflow][overflow-option=disclosure]) [part=disclosure-button-overlay] {
            position: relative;
        }

        :host([_fallback][_overflow]) [part=disclosure-button-overlay] {
            display: none;
        }

        :host([_overflow]) [part=disclosure-button-container] {
          align-self: flex-end;
          height: 34px;
          width: 34px;
        }

        :host([_overflow][_value-type=image]) [part=disclosure-button-overlay] {
            border-top-style: none !important;
            border-top-width: 0px;
        }

        :host([_fallback][_overflow][overflow-option=showmore]) [part=show-button] {
            display: none;
        }

        :host([_overflow][overflow-option=showmore]) [part=show-button]
        {
          position: absolute;
          order: 3;
          display: flex;
          justify-content: flex-end;
          bottom: 0px;
          width: 100%;
          z-index: 1;
        }

        :host([overflow-option=showmore][_show-all]) [part=show-button] {
          box-shadow: initial;
          background-color: transparent;
          text-align: right;
          order: 3;
          display: flex;
          justify-content: flex-end;
          position: relative;
       }

       [part=show-button] {
            display: none;
        }

        :host(:not([disabled]))  [part=show-button] {
            cursor: auto;
        }

        :host(:not([disabled]))  [part=text-link]::before {
            pointer-events: auto;
            cursor: pointer;
        }

        :host(:not([_show-all])) [part=text-link]::before {
            content: var(--ptcs-label-show-button--more, "Show More");
        }

        :host([_show-all]) [part=text-link]::before {
            content: var(--ptcs-label-show-button--less, "Show Less");
            background: transparent;
            box-shadow: none;
       }

       :host([_show-all]:not([disabled])) [part=show-button]::before {
        pointer-events: auto;
        }

        :host([disabled]) [part=disclosure-button-overlay] {
            pointer-events: none;
        }

        :host([disabled]) [part=disclosure-button] {
            pointer-events: none;
        }

        :host([disabled]) [part=show-button] {
            pointer-events: none;
        }

       :host([_overflow][overflow-option=showmore][_show-all][disabled]) [part=show-button] {
            pointer-events: none;
       }

       [part=item-value-container] {
           display: flex;
       }


        :host([_value-type=image]) [part=item-value-container] {
           justify-content: center !important;
       }
        </style>
          <div part="root" id="valueroot">
              <ptcs-div part="value-display-area" id="valuedisplayarea">
                  <div part="overflow-control" id="overflowcontrol"
                       tooltip="[[tooltip]]" tooltip-icon="[[tooltipIcon]]">
                    <ptcs-label part="value-display-label" id="keylabel" label\$="[[label]]"
                        variant="[[valueDisplayType]]" multi-line="" horizontal-alignment="[[labelAlignment]]"
                        max-width="[[_resolvedMaxWidth]]" disable-tooltip></ptcs-label>
                    <ptcs-value-container id="valuecontainer" part="value-container"
                        label="[[_label(data, selector)]]"
                        item-meta="[[itemMeta]]"
                        value-type="[[_valueType]]"
                        disabled="[[disabled]]" text-wrap="[[textWrap]]"
                        overflow-option="[[overflowOption]]"
                        no-disclosure-button="[[_option(imageDisclosure)]]"
                        height="[[height]]"
                        width="[[width]]"
                        max-height="[[_resolvedMaxHeight]]"
                        max-width="[[_resolvedMaxWidth]]"
                        backdrop-color="[[backdropColor]]"
                        backdrop-opacity="[[backdropOpacity]]"
                        default-text="[[defaultText]]">
                    </ptcs-value-container>
                  </div>
                </ptcs-div>
          </div>
         `;
    }

    static get properties() {
        return {

            // Input data
            data: {
                type:     Object,
                observer: 'dataChanged'
            },

            selector: {
                value: null
            },

            twNumberFormatToken: {
                type:     String,
                observer: '_twNumberFormatTokenChanged'
            },

            itemMeta: {
                type:     Object,
                value:    {type: 'text'},
                observer: '_itemMetaChanged'
            },

            // The key label above the value
            label: {
                type:     String,
                observer: '_determineOverflow',
                value:    '' // Needed so that ptcs-label won't default to "Label"
            },

            labelHeight: { // Actual height of the label
                type:  Number,
                value: 0
            },

            // Label Horizontal Alignment: 'left', 'center', 'right'
            labelAlignment: {
                type:  String,
                value: 'left'
            },

            // Label variant (header, sub-header, label, body)
            valueDisplayType: {
                type:  String,
                value: 'label'
            },

            // Horizontal Alignment within renderer
            horizontalAlignment: {
                type:     String,
                value:    'left',
                observer: '_horizontalAlignmentChanged'
            },

            // Vertical Alignment within renderer
            verticalAlignment: {
                type:     String,
                value:    'flex-start',
                observer: '_verticalAlignmentChanged'
            },

            // Allow text content to wrap in the renderer?
            textWrap: {
                type:  Boolean,
                value: false
            },

            // Default Textual Contents (if there is no data to render)
            defaultText: {
                type:     String,
                observer: '_defaultTextChanged'
            },

            // height in pixels
            height: {
                type: Number
            },

            // width in pixels
            width: {
                type: Number
            },

            // Max height in pixels
            maxHeight: {
                type: Number
            },

            // Smallest of maxHeight / dynamicHeight when both exist, otherwise height MINUS _verticalPadding + labelHeight
            _resolvedMaxHeight: {
                type:     Number,
                // eslint-disable-next-line max-len
                computed: '_computeMaxHeight(height, maxHeight, dynamicHeight, labelHeight, defaultText, _verticalPadding, _valueType, _fallback, _imgLoaded)'
            },

            // Max width in pixels
            maxWidth: {
                type: Number
            },

            // Smallest of maxWidth / dynamicWidth when both exist, otherwise width MINUS _horizontalPadding
            _resolvedMaxWidth: {
                type:     Number,
                computed: '_computeMaxWidth(width, maxWidth, dynamicWidth, defaultText, _horizontalPadding, _valueType, _imgLoaded)'
            },

            // Image loaded successfully
            _imgLoaded: {
                type: Boolean
            },

            // Modal pop-up dialog height in pixels
            modalHeight: {
                type:  Number,
                value: 380
            },

            // Modal pop-up dialog width in pixels
            modalWidth: {
                type:  Number,
                value: 600
            },

            disabled: {
                type:               Boolean,
                value:              false,
                reflectToAttribute: true
            },

            // Modal backdrop color
            backdropColor: {
                type: String
            },

            // Modal backdrop opacity
            backdropOpacity: {
                type: Number
            },

            // Controls whether to show disclosure button (default), horizontal ellipsis, or 'Show More' on overflow
            overflowOption: {
                type:               String, // 'disclosure' | 'ellipsis' | 'showmore'
                reflectToAttribute: true,
                value:              'disclosure'
            },

            // Controls whether to show disclosure button (default) on image thumbnail
            imageDisclosure: {
                type:               String, // 'none' | 'button'
                reflectToAttribute: true,
                value:              'button'
            },

            // Data type of the value: 'text' | 'image' | ...
            _valueType: {
                type:               String,
                reflectToAttribute: true,
                computed:           '_computeType(itemMeta)'
            },

            // Toggle to show or hide the modal pop-up dialog
            _showpopup: {
                type:               Boolean,
                reflectToAttribute: true
            },

            // State of the show more / show less. When true, we are showing all and display 'Show Less' link.
            _showAll: {
                type:               Boolean,
                value:              false,
                reflectToAttribute: true
            },

            // To keep track of size change
            _resizeObserver: {
                type: ResizeObserver
            },

            // Set when the value height exceeds the allotted display area height
            _overflow: {
                type:               Boolean,
                reflectToAttribute: true
            },

            // indicates if the value-container label is truncated
            _labelTruncated: {
                type: Boolean
            },

            // Set if we have no data to display; we may have defaultText to show
            _fallback: {
                type:               Boolean,
                reflectToAttribute: true,
                observer:           '_fallbackChanged',
                computed:           '_showFallback(data, selector)'
            },

            // Boolean to turn off the dynamic size constraints logic (that was originally added to make a responsive component)
            noDynamicSizeConstraint: {
                type: Boolean
            },

            // Height set dynamically
            dynamicHeight: {
                type:     Number,
                observer: '_updateWidgetConstraints'
            },

            // Width set dynamically
            dynamicWidth: {
                type: Number
            },

            // Horizontal padding around part overflow-control (reduces the available width in which to display the value)
            _horizontalPadding: {
                type: Number
            },

            // Vertical padding around part overflow-control (reduces the available height in which to display the value)
            _verticalPadding: {
                type: Number
            },

            _delegatedFocus: {
                type:  String,
                value: null
            },

            // To give externally assigned tabindex value priority over default tabindex
            _tabSequence: {
                type: String
            },

            // only used when imagedisclosure is set to none
            scaling: {
                type: String
            },

            _imageArea: {
                type:               Boolean,
                computed:           '_computeImageArea(imageDisclosure, itemMeta)',
                reflectToAttribute: true
            }
        };
    }

    static get observers() {
        return [
            '_observeOverflowOptionOverride(overflowOption, _valueType)',
            '_observeVariables(_showAll, width, height, maxWidth, maxHeight, _valueType, data, defaultText, overflowOption, textWrap)',
            '_observeOverflow(_overflow, overflowOption)',
            '_updateTabindexState(_overflow, _labelTruncated)',
            '_toggleDescendantsFocus(noTabindex, data)'
        ];
    }

    ready() {
        super.ready();
        this._resizeObserver = new ResizeObserver(entries => {
            if (!this._showAll) { // We are not in an expanded show all state
                if (this._valueType !== undefined && this._valueType !== 'image') {
                    // Debounce resizing computations
                    clearTimeout(this.__resizeObserverTimeoutId);
                    this.__resizeObserverTimeoutId = setTimeout(() => {
                        if (typeof this._dynamicSize === 'function') {
                            this._dynamicSize();
                            this.dynamicHeight = Math.max(entries[0].contentRect.height, this.dynamicHeight);
                        } else {
                            this.dynamicHeight = entries[0].contentRect.height;
                        }
                        requestAnimationFrame(() => {
                            this._updateWidgetConstraints();
                            this._determineOverflow();
                        });
                    }, 100);
                }
            }
        });
        this.tooltipFunc = this._monitorTooltip.bind(this);
        this.$.overflowcontrol.tooltipFunc = this._monitorTooltip.bind(this);
        this._trackFocus(this, this.$.overflowcontrol);
        this._untrackHover(this);
        this._trackHover(this.$.overflowcontrol);
        // Listen to keypress events when the 'Show More' "button" has focus...
        this.addEventListener('keypress', ev => {
            const key = ev.which || ev.keyCode;
            if (key === 32 || key === 13) {
                this._activateVD();
                ev.preventDefault();
            }
        });

        // This is dispatched from the Property Display when <space> has been pressed (since Edge
        // has issues with passing on the "real" KeyboardEvent)
        this.addEventListener('space-activate', ev => {
            this._activateVD();
            ev.preventDefault();
        });


        // This is dispatched from the ptcs-modal-image-popup to report an overflow condition (if any)
        this.addEventListener('image-overflow', ev => {
            this._overflow = ev.detail.overflow;
            ev.stopPropagation();
        });

        // This is dispatched from the ptcs-value-container when properties affecting the size changes
        this.addEventListener('check-overflow', ev => {
            requestAnimationFrame(() => {
                this._determineOverflow();
            });
            ev.preventDefault();
        });

        this.__resizeWindowCb = this._resizeWindow.bind(this);

        // Listen to image load completion
        this.addEventListener('load', ev => this._onLoad(ev));

        this._tabSequence = this.getAttribute('tabindex') || '0';
        if (this.hasAttribute('property-display-item')) {
            this.noTabindex = true;
        }
        this._labelTruncated = false;
    }

    // Complement the resize observer to monitor size changes of the browser window itself: When you resize the
    // browser window of a mashup, the component resizeObserver is not getting invoked because the value display itself is not
    // being resized, but Mashup-Builder resizes its container ancestor(s) which impose size constraints via the dynamic sizing.
    _resizeWindow() {
        if (typeof this._dynamicSize === 'function') {
            clearTimeout(this._debounceResizeWindowTimeoutId);
            this._debounceResizeWindowTimeoutId = setTimeout(() => {
                this._dynamicSize();
                this._updateWidgetConstraints();
                this._determineOverflow();
            }, 50);
        }
    }

    _activateVD() {
        if (!this.disabled) {
            if (this._valueType === 'image') {
                const elPopup = this.shadowRoot.querySelector('ptcs-modal-image-popup');
                if (elPopup) {
                    elPopup.open();
                }
            } else if (this._valueType === 'link') {
                const elLink = this.shadowRoot.querySelector('ptcs-link');
                if (elLink) {
                    const elA = elLink.shadowRoot.querySelector('[part=label]');
                    if (elA) {
                        elA.click();
                    }
                }
            } else if (this._overflow) {
                if (this.overflowOption === 'showmore') {
                    requestAnimationFrame(closeTooltip);
                    this._showAll = !this._showAll;
                } else if (this.overflowOption === 'disclosure') {
                    // This is the equivalent of a click on the disclosure button
                    this.open();
                }
            }
        }
    }


    connectedCallback() {
        super.connectedCallback();
        this._resizeObserver.observe(this);
        window.addEventListener('resize', this.__resizeWindowCb);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this._resizeObserver.unobserve(this);
        window.removeEventListener('resize', this.__resizeWindowCb);
        if (this._dialog) {
            document.body.removeChild(this._dialog);
        }
        const mdl = document.body.querySelector('ptcs-modal-overlay');
        if (mdl) {
            document.body.removeChild(mdl);
        }
    }

    _toggleDescendantsFocus(noTabindex) {
        if (this.hasAttribute('property-display-item')) {
            requestAnimationFrame(() => {
                this.shadowRoot.querySelectorAll(noTabindex ? '[tabindex]' : '[no-tabindex]').forEach(el => {
                    el.noTabindex = noTabindex;
                    if (noTabindex) {
                        el.setAttribute('no-tabindex', '');
                    } else {
                        el.removeAttribute('no-tabindex');
                    }
                });
            });
        }
    }

    _monitorTooltip() { // Implements ptcs-value-display's tooltip behavior on truncation
        const el = this.$.valuecontainer.querySelector('[part=item-value]');

        if (el && typeof el.tooltipFunc === 'function') { // Does the container have a function to deliver the tooltip contents?
            const containerTooltip = el.tooltipFunc();
            if (containerTooltip) {
                if (this.tooltip) {
                    if (this.tooltip !== this.label) {
                        return containerTooltip + '\n\n' + this.tooltip;
                    }
                }
                return containerTooltip;
            }
        }
        // Default to element tooltip proper
        if (this.tooltip !== this.label) {
            return this.tooltip || '';
        }
        return '';
    }

    dataChanged(data) {
        if (!data) {
            this._showAll = false;
        }
    }

    _showFallback(data, selector) {
        return (this._label(data, selector) === '');
    }

    _fallbackChanged(val) {
        if (val) {
            this._showAll = false;
            requestAnimationFrame(() => {
                this._determineOverflow();
            });
        }
    }

    _defaultTextChanged(val) {
        // Set Boolean attribute _default-text on WC when there is a fallback text defined
        if (val) {
            this.setAttribute('_default-text', '');
        } else {
            this.removeAttribute('_default-text');
        }
        if (this._valueType === undefined) {
            this._valueType = 'text'; // Until superseded by _computeType
        }
    }

    _determineOverflow() {
        if (this.$.valueroot.scrollHeight > 0) { // Ready?
            // Update the labelHeight used by ptcs-value-container
            this.labelHeight = this.$.keylabel.scrollHeight;
            if (this._valueType !== 'image') {
                const overflowcontrolCS = window.getComputedStyle(this.$.overflowcontrol);
                this._verticalPadding = PTCS.cssDecodeSize(overflowcontrolCS.paddingTop) + PTCS.cssDecodeSize(overflowcontrolCS.paddingBottom);
                const valuecontainerHeight = this.$.valuecontainer.querySelector('[part=item-value-container]').scrollHeight;
                if (valuecontainerHeight > 0 && !this._showAll) {
                    this._overflow = (valuecontainerHeight + this.labelHeight + this._verticalPadding) >
                      this.$.valuedisplayarea.clientHeight;
                }
            }

            if (this._valueType === 'text') {
                const el = this.$.valuecontainer.querySelector('[part=item-value]');
                this._labelTruncated = el.isTruncated();
            } else {
                this._labelTruncated = false;
            }
        }
    }

    _updateWidgetConstraints() {
        if (!this._valueType) {
            return;
        }
        if (this._valueType !== 'image') {
            this.$.valuedisplayarea.style.height = this.height > 0 ? this.height + 'px' : '100%';
            this.$.valuedisplayarea.style.width = this.width > 0 ? this.width + 'px' : '100%';
            this.$.valuedisplayarea.style.maxHeight = this.maxHeight > 0 ? this.maxHeight + 'px' : '';
            this.$.valuedisplayarea.style.maxWidth = this.maxWidth > 0 ? this.maxWidth + 'px' : '';
        } else if (this._valueType === 'image') {
            this.$.valuedisplayarea.style.height = '';
            this.$.valuedisplayarea.style.width = '';
            this.$.valuedisplayarea.style.maxHeight = '';
            this.$.valuedisplayarea.style.maxWidth = '';
        }
    }

    // disclosure is always true for image, ellipsis truncation is only supported for text (where ptcs-label does the truncation).
    _observeOverflowOptionOverride(option, _valueType) {
        if (_valueType === 'image' || option === 'ellipsis' && _valueType !== 'text') {
            this.overflowOption = 'disclosure';
        }
    }

    _updateTabindexState(_overflow, _labelTruncated) {
        if (this.hasAttribute('property-display-item')) {
            return;
        }
        this.setAttribute('tabindex', (_overflow || _labelTruncated) ? this._tabSequence : '-1');
    }

    // Create overflow related UI component dynamically when needed
    _observeOverflow(_overflow, overflowOption) {
        if (overflowOption) {
            this.$.valuecontainer.overflowOption = overflowOption;
        }
        if (_overflow) {
            if (overflowOption === 'disclosure') {
                // Create the disclosure button container dynamically when needed
                if (!this.shadowRoot.querySelector('#disclosurebuttonoverlay')) {
                    // <div part="disclosure-button-overlay" id="disclosurebuttonoverlay">
                    //     <div part="disclosure-button-container" on-click="open">
                    //         <ptcs-button variant="small" id="open" part="disclosure-button"
                    //             icon="cds:icon_disclosure_mini"></ptcs-button>
                    //     </div>
                    // </div>

                    // div part=disclosure-button-container
                    let dbc = document.createElement('div');
                    dbc.setAttribute('part', 'disclosure-button-container');
                    dbc.addEventListener('click', () => this.open());
                    // ptcs-button part=disclosure-button
                    let pb = createSubComponent(this, `<ptcs-button variant="small" id="open"
                        part="disclosure-button" icon="cds:icon_disclosure_mini" disabled="[[disabled]]">`);
                    pb.setAttribute('tabindex', this.hasAttribute('property-display-item') ? '-1' : this._tabSequence);
                    dbc.appendChild(pb);

                    // div part=disclosure-button-overlay
                    let dbo = document.createElement('div');
                    dbo.setAttribute('part', 'disclosure-button-overlay');
                    dbo.setAttribute('id', 'disclosurebuttonoverlay');
                    dbo.appendChild(dbc);
                    this.$.overflowcontrol.appendChild(dbo);
                }
            } else if (overflowOption === 'showmore') {
                if (!this.shadowRoot.querySelector('#show')) {
                    // Create the Show More container
                    // <div part="show-button" id="show">
                    //     <div part="text-link" id="textlink" on-click='_clickShow'></div>
                    // </div>
                    // div part=text-link
                    let tl = document.createElement('div');
                    tl.setAttribute('part', 'text-link');
                    tl.setAttribute('id', 'textlink');
                    tl.setAttribute('tabindex', this.hasAttribute('property-display-item') ? '-1' : this._tabSequence);
                    tl.addEventListener('click', () => this._clickShow());

                    // div part=show-button
                    let sb = document.createElement('div');
                    sb.setAttribute('part', 'show-button');
                    sb.setAttribute('id', 'show');
                    sb.appendChild(tl);

                    this.$.overflowcontrol.appendChild(sb);
                }
            }
        }
    }

    // Observer monitors more variables than it uses itself to be invoked whenever the value somehow is affected
    _observeVariables(_showAll, width, height, maxWidth, maxHeight, _valueType, data, defaultText, overflowOption, textWrap) {
        if (_valueType !== '' || defaultText) { // Do we have a data binding or defaultText?
            if (_showAll) { // We are showing all
                // Remove height constraints on the value display area container to allow it to be shown in full
                this.$.valuedisplayarea.style.maxHeight = '';
                this.$.valuedisplayarea.style.height = '';
            } else { // Resetting to state 'Show More' (if applicable)
                this._updateWidgetConstraints();
            }
            if (_valueType === 'image') {
                if (maxWidth > 0 && width > 0) {
                    this.style.maxWidth = Math.min(width, maxWidth) + 'px';
                } else if (maxWidth > 0) {
                    this.style.maxWidth = maxWidth + 'px';
                } else if (width) {
                    this.style.maxWidth = width + 'px';
                }
            }
            // Link should be Tab navigable regardless of overflow
            if (_valueType === 'link') {
                this.setAttribute('tabindex', this._tabSequence);
            }
            this._determineOverflow();
        }
    }

    _computeMaxWidth(width, maxWidth, dynamicWidth, defaultText, _horizontalPadding, _valueType, _imgLoaded) {
        if (!_valueType && !_imgLoaded) {
            return undefined;
        }

        const overflowcontrolCS = window.getComputedStyle(this.$.overflowcontrol);
        this._verticalPadding = PTCS.cssDecodeSize(overflowcontrolCS.paddingTop) + PTCS.cssDecodeSize(overflowcontrolCS.paddingBottom);
        this._horizontalPadding = PTCS.cssDecodeSize(overflowcontrolCS.paddingLeft) + PTCS.cssDecodeSize(overflowcontrolCS.paddingRight);
        if (_valueType !== 'image' && (this.data || this.label || defaultText)) {
            let widthConstraint;
            if (maxWidth > 0) {
                if (width > 0) {
                    widthConstraint = Math.min(maxWidth, width);
                } else if (this.noDynamicSizeConstraint) {
                    widthConstraint = maxWidth;
                } else {
                    widthConstraint = dynamicWidth > 0 ? Math.min(maxWidth, dynamicWidth) : maxWidth;
                }
            } else if (dynamicWidth > 0 && !this.noDynamicSizeConstraint) {
                widthConstraint = width > 0 ? width : dynamicWidth;
            } else {
                widthConstraint = width;
            }
            return !isNaN(widthConstraint) ? widthConstraint - this._horizontalPadding : undefined;
        }
        // image data
        if (_imgLoaded) {
            if (this.imageDisclosure === 'none') {
                return this.$.valuecontainer.clientWidth;
            }
            if (maxWidth > 0 && width > 0) {
                return (Math.min(maxWidth, width) - this._horizontalPadding);
            }
            let w = maxWidth - this._horizontalPadding;
            if (w > 0) {
                return w;
            }
            w = width - this._horizontalPadding;
            if (w > 0) {
                return w;
            }
        }
        return undefined;
    }

    // Image has been loaded
    _onLoad(ev) {
        this._imgLoaded = true;
        ev.stopPropagation();
    }

    _computeMaxHeight(height, maxHeight, dynamicHeight, labelHeight, defaultText, _verticalPadding, _valueType, _fallback, _imgLoaded) {
        if (!_valueType && !_imgLoaded) {
            return undefined;
        }

        const style = window.getComputedStyle(this.$.overflowcontrol);
        this._verticalPadding = PTCS.cssDecodeSize(style.paddingTop) + PTCS.cssDecodeSize(style.paddingBottom);
        this._horizontalPadding = PTCS.cssDecodeSize(style.paddingLeft) + PTCS.cssDecodeSize(style.paddingRight);
        // Other data than images
        if (_valueType !== 'image') {
            let heightConstraint = 0;
            if (maxHeight > 0) {
                if (height > 0) {
                    heightConstraint = Math.min(maxHeight, height);
                } else if (this.noDynamicSizeConstraint) {
                    heightConstraint = maxHeight;
                } else {
                    heightConstraint = dynamicHeight > 0 ? Math.min(maxHeight, dynamicHeight) : maxHeight;
                }
            } else if (dynamicHeight > 0 && !this.noDynamicSizeConstraint) {
                heightConstraint = height > 0 ? height : dynamicHeight;
            } else {
                heightConstraint = height;
            }
            heightConstraint -= labelHeight + this._verticalPadding;
            return heightConstraint > 0 ? heightConstraint : undefined;
        }
        // image data
        if (_imgLoaded) {
            const imgPopup = this.$.overflowcontrol.querySelector('ptcs-modal-image-popup');
            if (imgPopup !== null) {
                let heightConstraint;
                const thumbnailCS = window.getComputedStyle(imgPopup.shadowRoot.querySelector('#root'));
                const thumbVertPadding = PTCS.cssDecodeSize(thumbnailCS.paddingTop) + PTCS.cssDecodeSize(thumbnailCS.paddingBottom);
                const reservedVertSpace = labelHeight + thumbVertPadding + this._verticalPadding;
                const adjustedMaxHeight = maxHeight - reservedVertSpace;
                const adjustedHeight = height - reservedVertSpace;
                const dynImageMaxHeight = Math.max(dynamicHeight, this.clientHeight) - reservedVertSpace;
                if (adjustedMaxHeight > 0 && adjustedHeight > 0) {
                    heightConstraint = Math.min(adjustedMaxHeight, adjustedHeight);
                } else if (adjustedMaxHeight > 0) {
                    heightConstraint = dynImageMaxHeight > 0 ? Math.min(dynImageMaxHeight, adjustedMaxHeight) : adjustedMaxHeight;
                } else if (adjustedHeight > 0) {
                    heightConstraint = dynImageMaxHeight > 0 ? Math.min(dynImageMaxHeight, adjustedHeight) : adjustedHeight;
                }
                if (heightConstraint > 0) {
                    return heightConstraint;
                }
                return dynImageMaxHeight > 0 ? dynImageMaxHeight : undefined;
            }
        }
        return undefined;
    }

    _itemMetaChanged(meta) {
        this._updateFormattingByBaseType();
    }

    _twNumberFormatTokenChanged() {
        this.itemMeta._isFormatted = false;
        this.selector = null;

        this._updateFormattingByBaseType();
    }

    _computeType(meta) {
        if (!meta) {
            return '';
        }
        if (meta.type) {
            return meta.type;
        }
        if (!meta.baseType) {
            return '';
        }

        if (!meta.formatterStruct) {
            meta.formatterStruct = {renderer: meta.baseType};
            if (this.meta) {
                this.meta = meta.formatterStruct;
            }
        }
        meta.type = PTCS.Formatter.getContainerType(meta.baseType, meta.formatterStruct);
        if (this.meta) {
            this.meta.type = meta.type;
        }
        return meta.type;
    }

    open() {
        if (!this.disabled) {
            if (this._valueType === 'image') {
                let elPopup = this.shadowRoot.querySelector('ptcs-modal-image-popup');
                if (elPopup) {
                    elPopup.open();
                }
            } else if (!this._showpopup) {
                // Create the modal overlay
                this.__modalOverlay = this.__modalOverlay ||
                    createSubComponent(this, '<ptcs-modal-overlay backdrop-color="[[backdropColor]]" backdrop-opacity="[[backdrop-opacity]]">');
                // Insert backdrop as child of body
                document.body.appendChild(this.__modalOverlay);
                // Create the ptcs-value-display-popup dynamically each time the disclosure button is clicked, delete previous
                //   <ptcs-value-display-popup modal-height="[[modalHeight]]" modal-width="[[modalWidth]]"
                //     label="[[label]]" data="[[data]]" selector="[[selector]]" value-type="[[_valueType]]" item-meta="[[itemMeta]]"
                //     text-wrap="[[textWrap]]" label-variant="[[valueDisplayType]]" backdrop-color="[[backdropColor]]"
                //     backdrop-opacity="[[backdropOpacity]]" label-alignment="[[labelAlignment]]"></ptcs-value-display-popup>
                //         </div>

                // ptcs-value-display-popup
                const popup = createSubComponent(this, `<ptcs-value-display-popup modal-height="[[modalHeight]]" modal-width="[[modalWidth]]"
                label="[[label]]" value="[[_label(data, selector)]]" value-type="[[_valueType]]" item-meta="[[itemMeta]]" text-wrap="[[textWrap]]"
                label-variant="[[valueDisplayType]]" backdrop-color="[[backdropColor]]" backdrop-opacity="[[backdropOpacity]]"
                label-alignment="[[labelAlignment]]">`);
                this._dialog = document.body.appendChild(popup);

                const style = window.getComputedStyle(this._dialog.shadowRoot.querySelector('[part=value-container-popup]'));
                const popupHorizontalPadding = PTCS.cssDecodeSize(style.paddingLeft) + PTCS.cssDecodeSize(style.paddingRight);
                this._dialog.maxWidth = this.modalWidth - popupHorizontalPadding;
                this._dialog.shadowRoot.querySelector('[part=popup-close-button-container]').addEventListener('click', () => this.close());
                // Copy custom styling of value
                const cs = window.getComputedStyle(this.shadowRoot.querySelector('[part=item-value]'));
                let iv = this._dialog.shadowRoot.querySelector('[part=item-value]');

                // The below 2 lines are done differently because of a special FF behavior
                iv.style.backgroundColor = cs.backgroundColor;
                iv.style.backgroundImage = cs.backgroundImage;

                iv.style.color = cs.getPropertyValue('color');
                iv.style.fontFamily = cs.getPropertyValue('font-family');
                iv.style.fontSize = cs.getPropertyValue('font-size');
                iv.style.fontStyle = cs.getPropertyValue('font-style');
                iv.style.fontWeight = cs.getPropertyValue('font-weight');
                iv.style.letterSpacing = cs.getPropertyValue('letter-spacing');
                iv.style.lineHeight = cs.getPropertyValue('line-height');
                iv.style.textDecoration = cs.getPropertyValue('text-decoration');

                // State formatting can display an image next to the value. This image should be displayed in popup as well.
                const beforeCS = window.getComputedStyle(this.shadowRoot.querySelector('[part=item-value]'), ':before');

                if (beforeCS.content && beforeCS.content !== 'none') {
                    const imgDiv = document.createElement('div');
                    imgDiv.style.content = beforeCS.content;
                    imgDiv.style.paddingRight = beforeCS.paddingRight;

                    iv.parentElement.insertBefore(imgDiv, iv);
                    iv.parentElement.style.display = 'inline-flex';
                    iv.parentElement.style.backgroundColor = cs.backgroundColor;
                    iv.parentElement.style.backgroundImage = cs.backgroundImage;
                    iv.parentElement.style.alignItems = 'center';

                    iv.style.background = 'transparent';
                }

                this._showpopup = true;

                // Store the current 'focus' element (in a PD, this is the PD itself and not the VD)
                this.__prevFocusElt = document.activeElement;

                if (this.__prevFocusElt) {
                    // "Un-focus" while the popup is open
                    this.__prevFocusElt.blur();
                }

                // Add an event listener that prevents the user from tabbing out of the modal dialog and
                // allows closing it with <ESC>, <Enter>, or <Space>
                requestAnimationFrame(() => {
                    if (!this._captureTab) {
                        this._captureTab = (ev) => {
                            switch (ev.key) {
                                case 'Enter':
                                case 'Escape':
                                case ' ':
                                    this.close();
                                // Fall through to next case (preventDefault())
                                case 'Tab':
                                    ev.preventDefault();
                                    break;
                            }
                        };
                    }
                    document.addEventListener('keydown', this._captureTab);
                });
            }
        }
    }

    close() {
        if (this._showpopup) {
            // Remove the popup from DOM
            this._dialog.remove();
            this._dialog = undefined;
            // Remove the modal background overlay from DOM
            const mdl = document.body.querySelector('ptcs-modal-overlay');
            mdl.remove();
            this._showpopup = false;

            // Emit popup-close-action event
            this.dispatchEvent(new CustomEvent('popup-close-action'), {
                bubbles:  true,
                composed: true
            });

            // Remove the "global" event listener for the "modal" popup
            document.removeEventListener('keydown', this._captureTab);

            // Restore focus to "main" part of the component
            if (this.__prevFocusElt) {
                this.__prevFocusElt.focus();
                this.__prevfocusElt = undefined;
            }
        }
    }

    _clickShow() {
        if (!this.disabled) {
            this._showAll = !this._showAll;
            requestAnimationFrame(closeTooltip);
        }
    }

    _horizontalAlignmentChanged(horizontalAlignment) {
        this.$.valuedisplayarea.style.textAlign = horizontalAlignment;
        const vc = this.$.valuecontainer.querySelector('[part=item-value-container]');
        if (vc) {
            switch (horizontalAlignment) {
                case 'left':
                    vc.style.justifyContent = 'flex-start';
                    break;
                case 'right':
                    vc.style.justifyContent = 'flex-end';
                    break;
                case 'center':
                    vc.style.justifyContent = 'center';
                    break;
            }
        }
    }

    _verticalAlignmentChanged(verticalAlignment) {
        this.$.valuedisplayarea.style.justifyContent = verticalAlignment;
    }


    _label(item, selector) {
        if (item === null || item === '' || item === undefined) {
            return '';
        }

        let retLabel = '';
        if (!selector) {
            retLabel = item;
        } else if (typeof selector === 'string') {
            retLabel = item[selector];
        } else if (selector.constructor && selector.call && selector.apply) {
            retLabel = selector(item);
        } else {
            console.error('Invalid ptcs-value-display value selector', selector);
        }

        if (retLabel === undefined || retLabel === null) {
            retLabel = '';
        } else if ((!this.itemMeta || (this.itemMeta.type !== 'link' && this.itemMeta.type !== 'function')) && typeof retLabel !== 'string') {
            retLabel = retLabel.toString();
        }

        return retLabel;
    }

    _updateFormattingByBaseType() {
        var meta = this.itemMeta;

        if (!meta || meta._isFormatted || !meta.baseType) {
            return;
        }
        meta._isFormatted = true;

        meta.formatterStruct = meta.formatterStruct || {renderer: meta.baseType};
        meta.formatterStruct.numberFormatString = this.twNumberFormatToken ? '[[' + this.twNumberFormatToken + ']]' : this.twNumberFormatToken;

        let formattingInfo = PTCS.Formatter.getFormaterFunc(meta.baseType, this.selector, meta.formatterStruct);
        if (typeof formattingInfo === 'function') {
            this.selector = formattingInfo;
        } else if (formattingInfo) {
            _.forEach(formattingInfo, (value, key) => {
                if (typeof value === 'function') {
                    this.selector = value;
                } else {
                    meta[key] = value;
                }
            });
            this._determineOverflow();
        } else {
            //console.log('WARN: ptcs-value-display: Unknown formatter type: ' + meta.baseType);
        }
    }

    _computeImageArea(imageDisclosure, itemMeta) {
        if (imageDisclosure === 'button') {
            return false;
        } else if (imageDisclosure === 'none' && itemMeta && itemMeta.type !== 'image') {
            return false;
        } else if (imageDisclosure === 'none') {
            if (this.$['overflowcontrol'] && this.$['overflowcontrol'].lastChild.id === 'image-value-container') {
                return true;
            }
            const newAddedEl = createSubComponent(this, `<ptcs-image-value-container id="image-value-container" part="image-value-container"
                data="[[data]]" selector="[[selector]]" _tab-sequence="[[_tabSequence]]"
                scaling="[[scaling]]" width="[[width]]" height="[[height]]">`);
            this.$.overflowcontrol.append(newAddedEl);
            return true;
        }
        // if nothing satisfies, just render the original part
        return false;
    }

    _option(imageDisclosure) {
        return imageDisclosure === 'none';
    }
};

customElements.define(PTCS.ValueDisplay.is, PTCS.ValueDisplay);
