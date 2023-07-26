import {PolymerElement, html} from '@polymer/polymer/polymer-element.js';
import {PTCS} from 'ptcs-library/library.js';
import 'ptcs-icons/cds-icons.js';
import 'ptcs-hbar/ptcs-hbar.js';
import 'ptcs-link/ptcs-link.js';
import 'ptcs-dropdown/ptcs-dropdown.js';
import 'ptcs-behavior-styleable/ptcs-behavior-styleable.js';
import 'ptcs-behavior-focus/ptcs-behavior-focus.js';
import 'ptcs-behavior-tabindex/ptcs-behavior-tabindex.js';

const DEFAULT_MAX_BREADCRUMB_WIDTH_PX = 2000;
const OVERFLOW_THRESHOLD_DEFAULT = 4;
PTCS.Breadcrumb = class extends PTCS.BehaviorTabindex(PTCS.BehaviorFocus(PTCS.BehaviorStyleable(PTCS.ThemableMixin(PolymerElement)))) {
    static get template() {
        return html`
      <style>

        :host
        {
          display: inline-block;
          box-sizing: border-box;
          overflow: hidden;
        }

        #root
        {
          position: relative;
          box-sizing: content-box;
        }

        #list
        {
          flex: 1 1 auto;
          overflow: hidden;
        }

        [part="separator"]:last-of-type
        {
          display: none;
        }

        [part="separator"]
        {
          flex: 0 0 auto;
          min-width: 0px;
          text-align: center;
        }

        ptcs-button
        {
          flex: 0 0 auto;
        }

        ptcs-link::part(label)
        {
          text-overflow: ellipsis;
        }

        ptcs-link
        {
          flex: 0 0 auto;
          position: relative;
          white-space: nowrap;
        }

        ptcs-link[hidden]
        {
          display: none;
        }

        ptcs-button[hidden]
        {
          display: none;
        }

        ptcs-dropdown[hidden]
        {
          display: none;
        }

        #dropdown:not([disabled])
        {
          cursor: pointer;
        }

        [part=dropdown]
        {
          min-height: 0;
          border: none;
        }

        ptcs-dropdown::part(select-box)
        {
          min-height: 0;
          border: none;
        }

        ptcs-dropdown::part(item-value)
        {
          display: none;
        }

        ptcs-dropdown::part(icon)
        {
          min-height: 0;
          pointer-events: auto;
        }

        :host([_overflow]) [part*=dd-separator] {
            display: inline;
        }

        [part*=dd-separator] {
            display: none;
        }
        </style>

      <ptcs-hbar id="root" part="root">
        <ptcs-hbar part="body" id="list" class="body">
          <ptcs-dropdown id="dropdown" part="dropdown" items="[[_overflowItems]]" state-selector="[[_itemStateSelector]]"
              selected="{{_selectedDropdownItem}}" disabled="[[disabled]]" value-hide="" custom-list-pos-rect="[[_breadcrumbDropdownRect]]"
              disable-no-item-selection="" display-mode="small" hidden\$="[[_dropdownButtonHidden]]" tabindex\$="[[_delegatedFocus]]"
              selector="[[_selector(selector)]]" exportparts\$="[[_exportdropdown]]"
              icon="cds:icon_more_horizontal_mini"></ptcs-dropdown>
          <template id="body" is="dom-repeat" items="[[items]]">
              <ptcs-link part="link" on-click="_clickOnLink" href="[[_getUrlFromObject(item, selectorUrl)]]"
              hidden\$="[[_hideCurrentLevel(index, item, _currentLevel, showCurrentLevel, _overflow)]]"
              disabled="[[_isCurrentLevel(index, item, _currentLevel, showCurrentLevel, disabled)]]"
              text-maximum-width="[[_linkTruncation(linkTruncation, linkTruncationLength, _maxLenCrumb)]]"
              single-line="" variant="secondary" label="[[_getLabelFromObject(item, selector)]]" tabindex\$="[[_delegatedFocus]]"
              exportparts\$="[[_exportlink]]"></ptcs-link>
              <span part="separator" hidden\$="[[_hideCurrentLevel(index, item, _currentLevel, showCurrentLevel, _overflow)]]">/</span>
          </template>
        </ptcs-hbar>
        <span id="filler">&nbsp;</span>
      </ptcs-hbar>`;
    }

    static get is() {
        return 'ptcs-breadcrumb';
    }

    static get properties() {
        return {

            items: // items assigned
              {
                  type:  Array,
                  value: () => []
              },

            selector: // Name of the property in each item object that contains the 'label'
              {
                  type:  String,
                  value: ''
              },

            selectorUrl: // Name of the property in each item object that contains the 'href'
              {
                  type:  String,
                  value: ''
              },

            showCurrentLevel: // Show/hide the "current" level?
              {
                  type:               Boolean,
                  reflectToAttribute: true,
                  observer:           '_updateHideCurrentLevel'
              },

            hideCurrentLevel: // Show/hide the "current" level?
              {
                  type:               Boolean,
                  reflectToAttribute: true,
                  value:              false,
                  observer:           '_updateShowCurrentLevel'
              },

            overflowThreshold: { // Max number of links before overflow layout with dropdown list is shown
                type:     Number,
                value:    OVERFLOW_THRESHOLD_DEFAULT,
                observer: '_determineOverflow'
            },

            linkTruncation: // Truncate the label of long links?
              {
                  type:     Boolean,
                  value:    false,
                  observer: '_updateDropdownLocation'
              },

            linkTruncationLength: // If link truncation is active, what should be the max width?
              {
                  type:     Number,
                  value:    120,
                  observer: '_updateDropdownLocation'
              },

            lastClickedIndex:
              {
                  type:  Number,
                  value: -1
              },

            disabled:
              {
                  type:  Boolean,
                  value: false
              },

            ////////////////////////////////////////////////////////////////
            //  P r i v a t e
            ////////////////////////////////////////////////////////////////
            _currentLevel: // Index of the "current" level
              {
                  type:  Number,
                  value: 0
              },

            _overflow: // Overflow raised when the breadcrumb links exceed overflowThreshold value
            {
                type:               Boolean,
                reflectToAttribute: true,
                observer:           '_updateDropdownLocation'
            },

            _overflowItems: // List items for the dropdown when we have _overflow condition
            {
                type: Array
            },

            _breadcrumbOverflow: { // Breadcrumbs don't fit the container?
                type: Boolean
            },

            _dropdownButtonHidden: // Should the dropdown be hidden?
              {
                  type:  Boolean,
                  value: true
              },

            _maxLenCrumb: // Size of the crumb area, items wider than this should be auto-truncated
              {
                  type:  Number,
                  value: DEFAULT_MAX_BREADCRUMB_WIDTH_PX
              },

            _selectedDropdownItem: // The selected item # in the dropdown list
              {
                  type:     Number,
                  value:    -1,
                  observer: '_clickInDropdown'
              },

            _exportlink: {
                type:     String,
                readOnly: true,
                value:    PTCS.exportparts('link-', PTCS.Link)
            },

            _exportdropdown: {
                type:     String,
                readOnly: true,
                // It only makes sense to export these parts, since the breadcrumb hides the other parts
                value:    'select-box : dropdown-select-box, icon : dropdown-icon'
                //value:  PTCS.exportparts('dropdown-', PTCS.Dropdown)
            },

            _delegatedFocus: String,

            _resizeObserver: {
                type: ResizeObserver
            }
        };
    }

    static get observers() {
        return [
            '_items(items.*)'
        ];
    }

    ready() {
        super.ready();

        this._determineOverflow();

        // For keyboard navigation / managing focus
        this.addEventListener('keydown', ev => this._keyDown(ev));

        // Resize observers to adjust the breadcrumb to available width
        this._resizeObserver = new ResizeObserver(entries => {
            this._updateLayoutOnResize();
        });
        window.addEventListener('resize', () => this._updateLayoutOnResize());

    }

    _updateLayoutOnResize() {
        // Reset dynamically set constraint
        if (this.overflowThreshold < this._currentOverflowThreshold) {
            this.overflowThreshold = this._currentOverflowThreshold;
        }
        this._determineOverflow();
    }

    _selector(selector) {
        return selector || 'name';
    }

    _getLabelFromObject(item, selector) {
        if (!item) {
            return '';
        }

        if (typeof item === 'string') {
            return item;
        }

        if (!selector) {
            return item['name'] || '';
        }

        if (typeof selector === 'string') {
            return item[selector] || '';
        }

        if (selector && selector.constructor && selector.call && selector.apply) {
            return selector(item);
        }

        console.error('Invalid selector');

        // Fallback
        return item || '';
    }

    _getUrlFromObject(item, selector) {
        if (!item) {
            return '';
        }

        if (!selector) {
            return '';
        }

        if (typeof selector === 'string') {
            return item[selector] || '';
        }

        if (selector && selector.constructor && selector.call && selector.apply) {
            return selector(item);
        }

        console.error('Invalid url selector');

        // Fallback
        return '';
    }

    _linkTruncation(linkTruncation, linkTruncationLength, _maxLenCrumb) {
        if (linkTruncation && !isNaN(linkTruncationLength) && !isNaN(_maxLenCrumb)) {
            return '' + Math.min(linkTruncationLength, _maxLenCrumb);
        }

        if (linkTruncation && !isNaN(linkTruncationLength)) {
            return '' + linkTruncationLength;
        }

        if (!isNaN(_maxLenCrumb)) {
            // Default to the "max" possible value
            return _maxLenCrumb === DEFAULT_MAX_BREADCRUMB_WIDTH_PX ? '' : '' + _maxLenCrumb;
        }
        return '';
    }

    // eslint-disable-next-line no-unused-vars
    _hideCurrentLevel(index, item, currentLevel, showCurrentLevel, _overflow) {
        const numItems = this.items ? this.items.length : 0;

        if (numItems > 0) {
            if (!_overflow && (index === (numItems - 1))) {
                if (!showCurrentLevel) {
                    return true;
                }
            } else if (_overflow) {
                if (index === 0) {
                    return false;
                }
                if (index === (currentLevel - 1)) {
                    return false;
                }
                if (index === currentLevel && showCurrentLevel) {
                    return false;
                }
                return true;
            }
        }
        return false;
    }

    // eslint-disable-next-line no-unused-vars
    _isCurrentLevel(index, item, currentLevel, showCurrentLevel, disabled) {
        if (disabled === true) {
            return true;
        }

        const numItems = this.items ? this.items.length : 0;

        if (numItems > 0) {
            if (index === (numItems - 1)) {
                return true;
            }
        }

        return false;
    }

    _breadcrumbsFitCheck() {
        const list = this.$.list;
        const links = list.querySelectorAll('ptcs-link:not([hidden])');
        const len = links.length;
        if (len < 2) {
            return;
        }

        /* Figma spec 4.1 Overflow
        *  If the breadcrumb width is longer than the parent container, truncate the text links to an EVEN width
        *  (single line label truncation ellipsis with tooltip)
        */
        let meanWidth = 0;
        this._maxLenCrumb = DEFAULT_MAX_BREADCRUMB_WIDTH_PX;
        for (let i = 0; i < len; i++) {
            meanWidth += PTCS.cssDecodeSize(getComputedStyle(links[i]).getPropertyValue('width'), this);
        }
        meanWidth = Math.round(meanWidth / len);
        let roundedMeanWidth = meanWidth % 2 ? meanWidth - 1 : meanWidth;

        const lastSeparator = list.querySelector('span:nth-last-of-type(2)');
        const lastLink = list.querySelector('ptcs-link:last-of-type');
        // The last item is either a link (when showCurrentLevel is true) or a separator (when showCurrentLevel is false)
        const lastItem = this.showCurrentLevel ? lastLink : lastSeparator;
        const root = this.$.root;
        const fillerWidth = PTCS.cssDecodeSize(getComputedStyle(this.$.filler).getPropertyValue('width'), this);
        // containerRight is the right edge of the breadcrumb container
        let containerRight = root.getBoundingClientRect().right - fillerWidth;
        let lastItemBCRect = lastItem.getBoundingClientRect();
        let lastItemRight = lastItemBCRect.right;
        // Breadcrumb overflow?
        this._breadcrumbOverflow = containerRight < lastItemRight;
        // The dynamic link truncation on overflow starts by setting _maxLenCrumb to an initial value of the mean width
        // of the breadcrumbs and then reduce it gradually (rounded to smallest even value).
        this._maxLenCrumb = this._breadcrumbOverflow ? roundedMeanWidth : DEFAULT_MAX_BREADCRUMB_WIDTH_PX;

        // Figma 5.2: Use minimum link width 34px as minimum breadcrumb page link width
        while (this._breadcrumbOverflow && this._maxLenCrumb > 34) {
            // Reduce _maxLenCrumb until we no longer have an overflow or reach the allowed minimum link width.
            const _maxLenCrumbTmp = Math.round(this._maxLenCrumb * 0.9);
            this._maxLenCrumb = Math.max(34, _maxLenCrumbTmp % 2 ? _maxLenCrumbTmp - 1 : _maxLenCrumbTmp);
            lastItemBCRect = lastItem.getBoundingClientRect();
            lastItemRight = lastItemBCRect.right;
            // Breadcrumb overflow?
            this._breadcrumbOverflow = containerRight < lastItemRight;
        }

        /* Figma spec 4.1 Overflow
         * If the breadcrumb still overflows the parent container after applying dynamic link truncation, use the overflow
         * menu (regardless of overflowThreshold value = MaxLinkNumber of the Figma spec)
         */
        if (this._breadcrumbOverflow && this._maxLenCrumb === 34) {
            // Still overflow: Store the current overflowThreshold so that it can be restored later and switch to its default value of 4
            this._currentOverflowThreshold = this.overflowThreshold;
            this.overflowThreshold = OVERFLOW_THRESHOLD_DEFAULT;
        } else if (this._currentOverflowThreshold < this.overflowThreshold) {
            // Restore the previous overflowThreshold value
            this.overflowThreshold = this._currentOverflowThreshold;
        }
    }

    _determineOverflow() {
        setTimeout(() => {
            // The dropdown should be shown when the number of breadcrumbs exceeds overflowThreshold value
            this._dropdownButtonHidden = this.items.length <= this.overflowThreshold;
            this._overflow = !this._dropdownButtonHidden;
            this._breadcrumbsFitCheck();
        }, 100);
    }

    _clickOnLink(ev) {
        if (this.disabled || (ev.target && ev.target.disabled)) { // ev.target is the actual ptcs-link
            return;
        }

        if (ev.ctrlKey) {
            return;
        }

        const index = this.$.body.indexForElement(ev.target);

        if (index >= 0 && index < this.items.length && index !== null) {
            this.lastClickedIndex = index;

            setTimeout(() => {
                // Click on Link gets lost if you splice without a timeout. The reason in that the link becomes disabled after selection.
                this.splice('items', this.lastClickedIndex + 1);
            });

            this.dispatchEvent(new CustomEvent('ptcs-breadcrumb', {bubbles: true, composed: true, detail: {index, item: this.$.body.items[index]}}));
        } else {
            this.lastClickedIndex = -1;
        }
    }

    _clickInDropdown(index) {
        if (this.disabled) {
            return;
        }

        if (index >= 0 && index < this.items.length && index !== null) {
            this.lastClickedIndex = index;
            // Before we generate the event, first see if we have a URL attached and, if so, navigate to the same href...
            const el = this.$.list;
            const links = el.querySelectorAll('ptcs-link');
            if (links && links.length > 0) {
                // The last item in the list should NOT be treated as a link
                if (index + 1 < links.length) {
                    const link = links[index];
                    // If the link has an associated href, then just open it the same way as if the link itself would have
                    // been clicked...
                    if (link.href && PTCS.validateURL(link.href)) {
                        PTCS.openUrl('open', link.href, link.target ? link.target : '_self');
                    }
                }
            }

            this.splice('items', this.lastClickedIndex + 1);

            this.dispatchEvent(new CustomEvent('ptcs-breadcrumb', {bubbles: true, composed: true, detail: {index, item: this.$.body.items[index]}}));
        } else {
            this.lastClickedIndex = -1;
        }
        this._updateDropdownList();
    }

    _items(changeRecord) {
        if (changeRecord) {
            const items = changeRecord.base;
            const len = items.length;
            this._maxLenCrumb = DEFAULT_MAX_BREADCRUMB_WIDTH_PX;
            // Set the _currentLevel to have the items correctly updated
            this._currentLevel = Math.max(len - 1, 0);
            // Restore user-set threshold
            if (this.overflowThreshold < this._currentOverflowThreshold) {
                this.overflowThreshold = this._currentOverflowThreshold;
            }
            this._updateDropdownLocation();
        }
    }


    _updateDropdownLocation() {
        this._determineOverflow();
        if (this._overflow) {
            // Overflow condition, show dropdown
            setTimeout(() => {
                // Move the dropdown to be displayed before the second link
                const el = this._getItemEl(1);
                this.$.list.insertBefore(this.$.dropdown, el);
                let sep = this.$.list.querySelector('[part*=dd-separator]');
                if (!sep) {
                    sep = document.createElement('span');
                    sep.setAttribute('part', 'separator dd-separator');
                    sep.textContent = '/';
                }
                this.$.list.insertBefore(sep, el);
                this._updateDropdownList();
            }, 100);
        }
    }

    _updateDropdownList() {
        const len = this.items.length;
        let _overflowItems = [...this.items];
        if (len > this.overflowThreshold) {
            for (let i = 0; i < len; i++) {
                // Hide first item and penultimate item as they are always visible.
                // Also hide the last item, it is shown when showCurrentLevel is set
                const show = !((i === 0) ||
                               (i === (len - 2)) ||
                               (i === (len - 1))
                );
                if (typeof _overflowItems[i] === 'string') {
                    _overflowItems[i] = {name: this._getLabelFromObject(this.items[i], this.selector), visible: show};
                } else {
                    _overflowItems[i].visible = show;
                }
            }
            this._overflowItems = _overflowItems;
            // Get the dropdown button DOMRect to custom position the dropdown list flush with the button's left edge and slightly below it
            let buttonClientRect = JSON.parse(JSON.stringify(this.$.dropdown.shadowRoot.querySelector('#icon').getBoundingClientRect()));
            buttonClientRect.top += 8; // Shift the dropdown just below its hit area per Figma spec
            this._breadcrumbDropdownRect = buttonClientRect;
        }
    }

    _getItemEl(index) {
        return this.$.list.querySelector(`ptcs-link:nth-of-type(${index + 1})`);
    }

    _keyDown(ev) {
        if (this.disabled || ev.defaultPrevented || !this.tabindex || !this.shadowRoot.activeElement) {
            return;
        }
        if (ev.key === 'Enter' || ev.key === ' ') {
            ev.preventDefault();
            this.shadowRoot.activeElement.click();
        }
    }

    _itemStateSelector(item) {
        if (!item) {
            return undefined;
        }

        if (typeof item.visible !== undefined && item.visible === false) {
            return 'hidden';
        } else if (item.disabled) {
            return 'disabled';
        }

        return undefined;
    }

    _updateHideCurrentLevel(v) {
        this.hideCurrentLevel = !v;
    }

    _updateShowCurrentLevel(v) {
        this.showCurrentLevel = !v;
    }
};

customElements.define(PTCS.Breadcrumb.is, PTCS.Breadcrumb);
