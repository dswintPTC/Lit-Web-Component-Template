import {PolymerElement, html} from '@polymer/polymer/polymer-element.js';
import {PTCS} from 'ptcs-library/library.js';
import './components/ptcs-input-number/ptcs-pagination-input-number.js';
import './components/ptcs-pagination-carousel/ptcs-pagination-carousel.js';
import 'ptcs-icon/ptcs-icon.js';
import 'ptcs-icons/cds-icons.js';
import 'ptcs-dropdown/ptcs-dropdown.js';
import 'ptcs-hbar/ptcs-hbar.js';
import 'ptcs-behavior-styleable/ptcs-behavior-styleable.js';
import 'ptcs-behavior-tabindex/ptcs-behavior-tabindex.js';
import {delegateToPrev} from 'ptcs-behavior-focus/ptcs-behavior-focus.js';

const THRESHOLD_WIDTH_FOR_MIN_SIZE = 432;

const navKeys = new Set(['Home', 'End', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' ']);

PTCS.Pagination = class extends PTCS.BehaviorTabindex(PTCS.BehaviorStyleable(PTCS.ThemableMixin(PolymerElement))) {

    static get template() {
        return html`
            <style>
                :host {
                  display: inline-flex;
                }
                :host(:not([show-page-break]):not([show-total-results])) [part="page-break-and-total-results-container"] {
                    display: none !important;
                }
                [part="direct-link"] {
                    display: flex;
                    align-items: center;
                    flex: 0 0;
                }
                [part="page-break-and-total-results-container"] {
                    justify-content: flex-end;
                    flex: 0 0;
                }
                :host(:not([show-page-break]):not([show-total-results]):not([show-direct-link])) [part="carousel"] {
                    padding-bottom: 0;
                }
                :host([size=minimum][show-direct-link]:not([show-page-break]):not([show-total-results])) [part="direct-link"] {
                    padding-bottom: 0;
                }
                :host([size=minimum][show-total-results]:not([show-direct-link])) [part="page-break-and-total-results-container"] {
                    padding-bottom: 0;
                }
                :host([size=minimum][show-pagebreak]:not([show-direct-link])) [part="page-break-and-total-results-container"] {
                    padding-bottom: 0;
                }
                [part="carousel"] {
                    flex: 0 0;
                }
                [part="page-results-dropdown"][hidden],
                [part="total-results"][hidden],
                [part="direct-link"][hidden] {
                    display: none;
                }
                [part="string-per-page-label"],
                [part="page-results-dropdown"],
                [part="total-results-label"] {
                    min-width: max-content;
                    padding-right: 8px;
                }
                [part="total-results"] {
                    display: flex;
                    align-items: center;
                    flex-shrink: 0;
                }

                :host([size=minimum]) #break {
                    display: none;
                }
                :host([size=medium]) #break {
                    height: 0;
                    width: 100%;
                    order: 2;
                }
                :host([size=maximum]) #break {
                    display: none;
                }
                :host([size=minimum]) {
                    display: inline-flex;
                    flex-wrap: no-wrap;
                    flex-direction: column;
                    align-items: center;
                }
                :host([size=minimum]) [part="carousel"] {
                    order: 1;
                }
                :host([size=minimum]) [part="page-break-and-total-results-container"] {
                    order: 2;
                }
                :host([size=minimum]) [part="direct-link"] {
                    order: 3;
                }

                :host([size=medium]) {
                    display: inline-flex;
                    justify-content: flex-start;
                    flex-wrap: wrap;
                }
                :host([size=medium]) [part="carousel"] {
                    order: 1;
                    ;
                }
                :host([size=medium]) [part="direct-link"] {
                    order: 3;
                }
                :host([size=medium]) [part="page-break-and-total-results-container"] {
                    order: 2;
                }

                :host([size=maximum]) {
                    display: inline-flex;
                    flex-wrap: no-wrap;
                    justify-content: flex-start;
                }
                :host([size=maximum]) [part="carousel"] {
                    order: 2;
                    justify-items: center;
                }
                :host([size=maximum]) [part="direct-link"] {
                    order: 3;
                }
                :host([size=maximum]) [part="page-break-and-total-results-container"] {
                    order: 1;
                }
            </style>
            <div id="break"></div>
            <ptcs-pagination-carousel
                focusable="[[_focusable(tabindex)]]"
                id="carousel" part="carousel"
                current-page="[[pageNumber]]"
                min-size="[[_minSize]]"
                total-number-of-pages="[[__totalNumberOfPages]]"
                on-change="__handleCarouselOrInputNumberChange">
            </ptcs-pagination-carousel>
            <ptcs-hbar id="page-break-control-and-total-results-container" part="page-break-and-total-results-container"
                       start center>
                <ptcs-label part="total-results-label" hidden\$="[[!showTotalResults]]"
                    id="total-results-label" disable-tooltip
                    label="[[_stringResults]]"></ptcs-label>
                <ptcs-dropdown
                      hidden\$="[[!showPageBreak]]"
                      tabindex\$="[[_tabindex(tabindex)]]"
                      id="main-drop-down"
                      part="page-results-dropdown"
                      selected-value="[[__getPageSizeStringRepresentation(pageSize)]]"
                      on-selected-value-changed="__handleMainDropDownChange">
                </ptcs-dropdown>
                <ptcs-label part="string-per-page-label" id="string-per-page" label="[[_stringPerPage]]"
                                hidden\$="[[!showPageBreak]]" disable-tooltip></ptcs-label>
            </ptcs-hbar>
            <div id="direct-link" part="direct-link" hidden\$="[[!showDirectLink]]">
                <ptcs-label part="string-jump-to-label" id="string-jump-to" label="[[stringJumpToPage]]: " disable-tooltip></ptcs-label>
                <ptcs-pagination-input-number
                  tabindex\$="[[_tabindex(tabindex)]]"
                  id='input-number' part="input-number"
                  on-value-approved="__handleCarouselOrInputNumberChange"
                  total-number-of-pages="[[__totalNumberOfPages]]"
                  error-message="[[stringMax]]">
                </ptcs-pagination-input-number>
            </div>`;
    }
    static get properties() {
        return {
            // Private read-only _pageNumber from initial implementation (formerly pageNumber)
            _pageNumber: {
                type:     Number,
                readOnly: true,
                value:    1
            },
            // Two-way bindable public pageNumber
            pageNumber: {
                type:     Number,
                notify:   true,
                value:    1,
                observer: 'pageNumberChanged'
            },
            pageSize: {
                type:   Number,
                value:  1,
                notify: true
            },
            __pageBreaks: {
                type:     Array,
                computed: '__parseObjectToArray(firstBreak, secondBreak, thirdBreak, fourthBreak, fifthBreak)',
                observer: '__setItemsInDropdown'
            },
            // PageBreaks
            firstBreak: {
                type:  Number,
                value: 10
            },
            secondBreak: {
                type:  Number,
                value: 25
            },
            thirdBreak: {
                type:  Number,
                value: 50
            },
            fourthBreak: {
                type:  Number,
                value: 75
            },
            fifthBreak: {
                type:  Number,
                value: 100
            },
            totalNumberOfElements: {
                type: Number
            },
            showPageBreak: {
                type:               Boolean,
                reflectToAttribute: true,
                value:              false
            },
            resultsOptions: {
                type:     Number,
                observer: 'resultsOptionsChanged'
            },
            showDirectLink: {
                type:               Boolean,
                value:              false,
                observer:           'showDirectLinkChanged',
                reflectToAttribute: true
            },
            showTotalResults: {
                type:               Boolean,
                value:              false,
                reflectToAttribute: true
            },
            stringPerPage: {
                type:  String,
                value: '__ResultsDropdown__ per page'
            },
            // The processed stringPerPage, without placeholder text
            _stringPerPage: {
                type:     String,
                computed: '_computeStringPerPage(stringPerPage)'
            },
            stringResults: {
                type:  String,
                value: '__TotalResults__ results'
            },
            // The processed stringResults, without placeholder text
            _stringResults: {
                type:     String,
                computed: '_computeStringResults(totalNumberOfElements, stringResults)'
            },
            stringJumpToPage: {
                type:  String,
                value: 'Jump to page'
            },
            stringMax: {
                type:  String,
                value: 'Max'
            },
            _focusEl: {
                type: Element
            },
            // Following property for IDE interaction
            enableResponsiveBehavior: {
                type:               Boolean,
                reflectToAttribute: true,
                value:              true
            },
            width: {
                type: Number
            },
            height: {
                type: Number
            },
            // Maximum width in pixels
            maximumWidth: {
                type:     Number,
                observer: 'maximumWidthChanged'
            },
            // To keep track of size change
            _resizeObserver: {
                type: ResizeObserver
            },
            // Toggle to switch ptcs-carousel to mini view
            _minSize: {
                type:     Boolean,
                observer: '_minSizeChanged'
            }
        };
    }
    static get observers() {
        return [
            /*eslint-disable max-len*/
            '_updateLayout(maximumWidth, width, totalNumberOfElements, showPageBreak, showTotalResults, showDirectLink, enableResponsiveBehavior, _minSize)',
            '__handleTotalNumberOfElementsOrPageSizeChange(pageSize, totalNumberOfElements)',
            '_responsiveBehavior(width, maximumWidth)'
            /*eslint-enable max-len*/
        ];
    }
    ready() {
        super.ready();
        this._resizeObserver = new ResizeObserver(entries => {
            const w = entries[0].contentRect.width;
            if (w > 0) {
                requestAnimationFrame(() => {
                    this.__updateLayout(w);
                });
            }
        });

        // Keyboard navigation
        this.shadowRoot.addEventListener('mousedown', this._mouseDown.bind(this));
        this.$.carousel.addEventListener('focus-on-button', this._focusOnCarouselButton.bind(this));
        this.addEventListener('keydown', this._keyDown.bind(this));
        this.addEventListener('focus', this._focusEv.bind(this));
    }

    static get is() {
        return 'ptcs-pagination';
    }
    constructor() {
        super();
        this.__totalNumberOfPages = 1;
    }

    connectedCallback() {
        super.connectedCallback();
        this._resizeObserver.observe(this);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this._resizeObserver.unobserve(this);
    }
    _responsiveBehavior(width, maximumWidth) {
        this.enableResponsiveBehavior = !(width || maximumWidth);
        if (this.enableResponsiveBehavior) {
            this.style.maxWidth = '';
        }
    }

    maximumWidthChanged(maximumWidth) {
        this.style.maxWidth = maximumWidth ? maximumWidth + 'px' : '';
    }

    _minSizeChanged(_minSize) {
        if (_minSize) {
            this.style.minWidth = '';
        }
    }

    showDirectLinkChanged(showDirectLink) {
        if (showDirectLink) {
            this.setAttribute('size', 'minimum');
        }
    }

    _updateLayout(maximumWidth, width, totalNumberOfElements, showPageBreak, showTotalResults, showDirectLink, enableResponsiveBehavior, _minSize) {
        if (totalNumberOfElements !== undefined) { // Ready?
            // Debounce layout computations
            if (!this.__callUpdateLayout) {
                this.__callUpdateLayout = true;
                requestAnimationFrame(() => {
                    this.__callUpdateLayout = false;
                    this.__updateLayout(this.maximumWidth);
                });
            }
        }
    }

    _getMinHeight(pageBreakControlHeight, carouselHeight, directLinkHeight) {
        let height = carouselHeight;
        switch (this.getAttribute('size')) {
            case 'maximum':
                break;
            case 'medium':
                if (this.showPageBreak || this.showTotalResults || this.showDirectLink) {
                    // Carousel plus other subcomponent showing
                    height += Math.max(pageBreakControlHeight, directLinkHeight);
                }
                break;
            default:
                // minimum
                if ((this.showPageBreak || this.showTotalResults) && this.showDirectLink) {
                    // All three showing
                    height += pageBreakControlHeight + directLinkHeight;
                } else if (this.showDirectLink) {
                    height += directLinkHeight;
                } else if (this.showDirectLink || this.showTotalResults) {
                    height += pageBreakControlHeight;
                }
        }
        return height;
    }

    __updateLayout(maximumWidth) {
        // maximumWidth param is either the component property, or the resizeObserver's returned width value
        const pageBreakControl = this.$['page-break-control-and-total-results-container'];
        const carousel = this.$.carousel;
        const directLink = this.$['direct-link'];

        // Dynamic toggle of "mini view"
        if (this._resizing) {
            // Interactive resizing via dragging in IDE
            this._minSize = this.clientWidth < THRESHOLD_WIDTH_FOR_MIN_SIZE;
        } else {
            this._minSize = Math.max(this.clientWidth, carousel.scrollWidth, this.maximumWidth) < THRESHOLD_WIDTH_FOR_MIN_SIZE;
        }

        // Set carousel left / right padding depending on options. This will only apply in size='maximum' configuration.
        // The padding value on left side has been adjusted to compensate for 8px padding-right on adjacent control.
        const csl = PTCS.cssDecodeSize(getComputedStyle(this).getPropertyValue('--ptcs-pagination-carousel-padding-left').trim(), this);
        const csr = PTCS.cssDecodeSize(getComputedStyle(this).getPropertyValue('--ptcs-pagination-carousel-padding-right').trim(), this);
        const interPaddingLeft = csl ? csl : 32;
        const interPaddingRight = csr ? csr : 40;
        const ds = PTCS.cssDecodeSize(getComputedStyle(this).getPropertyValue('--ptcs-pagination-directlink-padding').trim(), this);
        const directLinkPaddingMediumLayout = ds ? ds : 40;
        const carouselPaddingLeft = (this.showPageBreak || this.showTotalResults) ? interPaddingLeft : 0;
        const carouselPaddingRight = this.showDirectLink ? interPaddingRight : 0;

        carousel.style.paddingRight = '';
        carousel.style.paddingLeft = '';
        pageBreakControl.style.marginLeft = '';

        // Get widths of subcomponents
        const pageBreakControlWidth = pageBreakControl.scrollWidth;
        const carouselWidth = carousel.scrollWidth;
        const directLinkWidth = directLink.scrollWidth;
        const widestSubComponentWidth = Math.max(pageBreakControlWidth, carouselWidth, directLinkWidth);

        const componentMaxWidth = pageBreakControlWidth + carouselWidth + directLinkWidth + carouselPaddingLeft + carouselPaddingRight;
        this.style.minWidth = widestSubComponentWidth + 'px';

        if (this.enableResponsiveBehavior) {
            // We don't have width related constraint and should do the layout responsively
            carousel.style.paddingRight = carouselPaddingRight + 'px';
            carousel.style.paddingLeft = carouselPaddingLeft + 'px';
            carousel.style.marginLeft = '';
            pageBreakControl.style.marginLeft = '';
            this._setDisplaySize('maximum');
        } else if (maximumWidth) { // maximumWidth set yet?
            carousel.style.marginLeft = '';
            pageBreakControl.style.marginLeft = '';
            // Width related constraint: Select amongst maximum / medium / minimum:
            if (componentMaxWidth <= maximumWidth) {
                // Everything fits in one row
                carousel.style.paddingRight = carouselPaddingRight + 'px';
                carousel.style.paddingLeft = carouselPaddingLeft + 'px';
                this._setDisplaySize('maximum');
            } else if (!(this.showPageBreak || this.showDirectLink) && this.showTotalResults) {
                // carousel + total results: Two rows
                this._setDisplaySize('minimum');
            } else if (this.showPageBreak && !(this.showDirectLink && this.showTotalResults)) {
                // carousel + page break control: Two rows
                this._setDisplaySize('minimum');
            } else if (!this.showPageBreak && this.showDirectLink && !this.showTotalResults) {
                // carousel + direct link control: Two rows
                this._setDisplaySize('minimum');
            } else {
                // carousel with at least two additional controls
                let secondRowWidth;
                // if (widestSubComponentWidth <= maximumWidth && MIN_WIDTH_OF_MEDIUM_SIZE <= maximumWidth) {
                if (widestSubComponentWidth <= this.maximumWidth) {
                    // The widest subcomponent is less than or equal to maximumWidth constraint and more than or equal min width for medium layout
                    if ((this.showPageBreak || this.showTotalResults) && this.showDirectLink &&
                        (pageBreakControlWidth + directLinkWidth + directLinkPaddingMediumLayout > maximumWidth)) {
                        this._setDisplaySize('minimum');
                        carousel.style.paddingLeft = '';
                        carousel.style.paddingRight = '';
                        carousel.style.marginLeft = '';
                        pageBreakControl.style.marginLeft = '';
                    } else {
                        secondRowWidth = pageBreakControlWidth + directLinkWidth + directLinkPaddingMediumLayout;
                        if (secondRowWidth >= maximumWidth) {
                            this._setDisplaySize('minimum');
                            carousel.style.paddingLeft = '';
                            carousel.style.paddingRight = '';
                            carousel.style.marginLeft = '';
                            pageBreakControl.style.marginLeft = '';
                        } else {
                            this._setDisplaySize('medium');
                            // Compute alignments
                            if ((this.showPageBreak || this.showTotalResults) && this.showDirectLink) {
                                if (carouselWidth < secondRowWidth) {
                                    carousel.style.marginLeft = (secondRowWidth - carouselWidth) / 2 + 'px';
                                } else {
                                    pageBreakControl.style.marginLeft = (carouselWidth - secondRowWidth) / 2 + 'px';
                                }
                            } else if ((this.showPageBreak || this.showTotalResults) && !this.showDirectLink) {
                                if (carouselWidth < pageBreakControlWidth) {
                                    carousel.style.marginLeft = (pageBreakControlWidth - carouselWidth) / 2 + 'px';
                                } else {
                                    pageBreakControl.style.marginLeft = (carouselWidth - pageBreakControlWidth) / 2 + 'px';
                                }
                            }
                        }
                    }
                } else { // Did not meet medium width test
                    this._setDisplaySize('minimum');
                }
            }
        }
        // Get height of the subcomponents - they get different padding from theming depending on the maximum / medium / minimum layout
        if (this._heightAutosized) {
            this.style.height = '';
        }
        const h = this._getMinHeight(pageBreakControl.scrollHeight, carousel.scrollHeight, directLink.scrollHeight);
        requestAnimationFrame(() => {
            if (!this._resizing) {
                this.style.minHeight = '';
                this.style.minHeight = h + 'px';

            }
        });
    }

    _setDisplaySize(size) {
        if (size !== this.getAttribute('size')) {
            this.setAttribute('size', size);
        }
    }

    _computeStringPerPage(stringPerPage) {
        const dropdownPlaceholder = '__ResultsDropdown__';
        const perPageString = stringPerPage.replace(dropdownPlaceholder, '').trim();
        if (stringPerPage.indexOf(dropdownPlaceholder) > stringPerPage.indexOf(perPageString)) {
            // Dropdown should be after the per page string
            this.$['string-per-page'].style.order = '2';
            this.$['main-drop-down'].style.order = '3';
        } else {
            // Dropdown should be before the per page string
            this.$['main-drop-down'].style.order = '2';
            this.$['string-per-page'].style.order = '3';
        }
        return perPageString;
    }

    _computeStringResults(totalNumberOfElements, stringResults) {
        const totalString = String(totalNumberOfElements);
        const placeholder = '__TotalResults__';
        return stringResults.includes(placeholder)
            ? stringResults.replace(placeholder, totalString)
            : totalString + ' ' + stringResults;
    }

    pageNumberChanged(num) {
        const pageno = Number(num);
        if (1 <= pageno && pageno <= this.__totalNumberOfPages) {
            const paginationInput = this.$['input-number'];
            paginationInput.__checkBorderUseCases(pageno);
        } else { // provided page number is out of bounds, reset pageNumber to current value
            this.pageNumber = this._pageNumber;
        }
    }

    __handleCarouselOrInputNumberChange(event) {
        const pageNo = event.detail.pageNo;
        if (pageNo && pageNo !== this._pageNumber) {
            // Set the read-only _pageNumber
            this._set_pageNumber(pageNo);
            // Update the public pageNumber
            this.pageNumber = pageNo;
        }
        event.stopPropagation();
    }
    __handleTotalNumberOfElementsOrPageSizeChange() {
        if (this.pageSize > 0 && this.totalNumberOfElements > 0) {
            this.__totalNumberOfPages = Math.ceil(this.totalNumberOfElements / this.pageSize);
        } else {
            this.__totalNumberOfPages = 1;
        }
        if (this.__totalNumberOfPages < this.$['input-number'].value) {
            this.$['input-number'].reset();
        }
        if (this.maximumWidth) {
            requestAnimationFrame(() => {
                this.__updateLayout(this.maximumWidth);
            });
        }
    }

    // main-drop-down index change might happen when:
    //   1. User itself has selected an item
    //   2. pageBreak param has been updated

    __handleMainDropDownChange() {
        const mainDropDownSelectedItem = this.$['main-drop-down'].selectedValue;
        if (mainDropDownSelectedItem !== undefined) {
            this.pageSize = Number(mainDropDownSelectedItem);
        }
    }

    __getPageSizeStringRepresentation(pageSize) {
        return pageSize.toString();
    }

    resultsOptionsChanged() {
        this.__setItemsInDropdown(this.__pageBreaks);
    }

    __setItemsInDropdown(pageBreak) {
        this.$['main-drop-down'].items = pageBreak.slice(0, this.resultsOptions);
        this.$['main-drop-down'].selectedValue = this.__getPageSizeStringRepresentation(this.pageSize);
    }


    __parseObjectToArray(...pageBreaks) {
        return [...new Set(Object.values(pageBreaks).filter(elem => elem))];
    }

    // Keyboard navigation
    _tabindex(tabindex) {
        return tabindex && typeof tabindex === 'string' && '0';
    }

    _focusable(tabindex) {
        return tabindex && typeof tabindex === 'string' && '-1';
    }

    get focusableElements() {
        const resultOrder = [];

        const order = id => getComputedStyle(this.$[id]).order;

        resultOrder.push([order('carousel'), this.$.carousel.shadowRoot.querySelectorAll('ptcs-button:not([hidden])')]);

        return resultOrder.sort((a, b) => a[0] - b[0]).reduce((acc, v) => {
            acc.push(...v[1]);
            return acc;
        }, []);
    }

    _mouseDown(ev) {
        const tagName = ev.target.tagName;
        if (tagName === 'PTCS-DROPDOWN') {
            this._focusEl = ev.target;
        } else if (tagName === 'PTCS-PAGINATION-INPUT-NUMBER') {
            this._focusEl = ev.target.shadowRoot.querySelector('ptcs-textfield');
        }
    }

    _focusOnCarouselButton(ev) {
        this._focusEl = ev.detail.button;
    }

    _focusEv() {
        // Ignore if we don't support focusing or already have focus on a sub element
        if (!this.tabindex || this.shadowRoot.activeElement) {
            return;
        }
        if (!this._focusEl || !this._focusEl.clientWidth) {
            const fe = this.focusableElements;
            this._focusEl = fe.find(el => el.hasAttribute('selected')) || fe[0];
            console.assert(this._focusEl);
        }
        this._focusEl.focus();
    }

    get focusElement() {
        if (!this.tabindex) {
            return null; // Not focusable
        }
        let hit = this.shadowRoot.activeElement;
        let el = hit || document.activeElement;
        while (el && el.shadowRoot && el.shadowRoot.activeElement) {
            hit = hit || el === this || this.contains(el);
            el = el.shadowRoot.activeElement;
        }
        // Focused element must be  in slotted content or in shadow dom
        return (hit || this.shadowRoot.activeElement) && el;
    }

    _keyDown(ev) {
        // This element must be focusable, or the key event is only for the textfield
        if (ev.defaultPrevented || !this.tabindex) {
            return;
        }
        const focusable = this.focusableElements;


        if (ev.shiftKey && ev.key === 'Tab') {
            // Move with ShiftTab key between the directLink and the PageBreak
            if (this.showDirectLink && this.showPageBreak && this.shadowRoot.activeElement === this.$['input-number']) {
                return;
            }
            // Fisrt focus not starting by focusable element (carousel)
            if (!focusable.includes(this._focusEl)) {
                const fe = this.focusableElements;
                this._focusEl = fe.find(el => el.hasAttribute('selected')) || fe[0];
                this._focusEl.focus();
            } else if (this.focusElement !== this._focusEl) {
                this._focusEl.focus();
            // Prevent backwards navigation from stopping on this (ptcs-pagination) element
            } else if (!delegateToPrev(this)) {
                this.blur();
            }

            ev.preventDefault();
            return;
        }

        // There must be a focused sub element - and the key must be relevant for keyboard navigation
        if (!this._focusEl || !navKeys.has(ev.key)) {
            return;
        }

        // Special rules for textfield
        if (this.focusElement.tagName === 'INPUT') {
            let focus = this.focusElement.getRootNode().host;
            if (focus.tagName === 'PTCS-TEXTFIELD') {
                switch (ev.key) {
                    case 'ArrowLeft':
                    case 'Home':
                        if (this.focus.selectionEnd > 0) {
                            return; // Ignore unless cursor is at start of text
                        }
                        break;
                    case 'End':
                    case 'ArrowRight':
                        if (focus.selectionStart < focus.text.length) {
                            return; // Ignore unless cursor is at end of text
                        }
                        break;
                }
            }
        }

        let focusEl = this._focusEl;
        const index = focusable.indexOf(focusEl);
        let idx;

        if (focusable.includes(this.focusElement)) {
            switch (ev.key) {
                case 'Home':
                    focusEl = focusable[0];
                    break;
                case 'End':
                    focusEl = focusable[focusable.length - 1];
                    break;
                case 'ArrowLeft':
                case 'ArrowUp':
                    idx = index === 0 ? focusable.length - 1 : index - 1;
                    focusEl = focusable[idx];
                    break;
                case 'ArrowRight':
                case 'ArrowDown':
                    idx = index === focusable.length - 1 ? 0 : index + 1;
                    focusEl = focusable[idx];
                    break;
                case ' ':
                    this._focusEl.click();
                    ev.preventDefault();
                    return;
            }

            if (focusEl && focusEl !== this._focusEl) {
                this._focusEl = focusEl;
                focusEl.focus();
                ev.preventDefault();
            }
        }
    }
};

customElements.define(PTCS.Pagination.is, PTCS.Pagination);
