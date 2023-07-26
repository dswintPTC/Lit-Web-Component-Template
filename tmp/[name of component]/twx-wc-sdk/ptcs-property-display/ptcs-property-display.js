import {LitElement, html, css} from 'lit';
import {map} from 'lit/directives/map.js';
import {L2Pw} from 'ptcs-library/library-lit';
import {PTCS} from 'ptcs-library/library.js';
import 'ptcs-icons/cds-icons.js';
import 'ptcs-behavior-styleable/ptcs-behavior-styleable.js';
import 'ptcs-behavior-focus/ptcs-behavior-focus.js';
import 'ptcs-behavior-tabindex/ptcs-behavior-tabindex.js';
import 'ptcs-value-display/ptcs-value-display.js';

PTCS.PropertyDisplay = class extends PTCS.BehaviorTabindex(PTCS.BehaviorFocus(
    PTCS.BehaviorStyleable(/*PTCS.ThemableMixin(*/L2Pw(LitElement)/*)*/))) {

    static get styles() {
        return css`
            :host {
                display: block;
                box-sizing: border-box;
                overflow: auto;
            }

            [part=value-display-item] {
                height: 100%;
                width: 100%;
            }

            :host(:not([vertical-mode]):not([_responsive])) [part=property-group-container]  {
                display: grid;
                grid-template-columns: repeat(auto-fill, var(--ptcs-property-value-width, 166px));
                column-gap: 16px;
                row-gap: 8px;
            }

           :host(:not([vertical-mode])[_responsive]) [part=property-group-container]  {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(var(--ptcs-property-value-min-width), 1fr));
                column-gap: 16px;
                row-gap: 8px;
            }

            :host([vertical-mode]) [part=property-group-container]  {
                display: grid;
                grid-template-columns: 1fr;
                column-gap: 16px;
                row-gap: 0px;
            }

            [part=property-display-label] {
                width: 100%;
            }

            [part=property-group-label] {
                width: 100%;
            }
        `;
    }

    render() {
        return html`
        <div part="property-display-root">
            <ptcs-label part="property-display-label" ?hidden=${this.hidePropertyDisplayLabel}
                label=${this.propertyDisplayLabel} horizontal-alignment=${this.propertyDisplayLabelAlignment}
                variant=${this.propertyDisplayLabelType} multi-line></ptcs-label>
            <div id="propertycontainer" part="property-container">
                <ptcs-label part="text-if-no-value" ?hidden=${this._notEmpty(this.items)} label=${this.textIfNoValue}></ptcs-label>
                <!-- The list of groups -->
                ${map(this._getGroups(this.items, this.itemsInfo, this.selectorGroupTitle), (group) => html`
                    <div part="property-group">
                        <ptcs-label part="property-group-label"
                            ?hidden=${this._doHideGroupTitle(this.hideGroupTitles, group, 'groupTitle')}
                            label=${this._getStringFromObject(group, 'groupTitle')}
                            horizontal-alignment=${this.groupLabelAlignment}
                            variant=${this.groupLabelType}></ptcs-label>
                        <div part="property-group-container">
                            <!-- The key/value list items of the group -->
                            ${map(this._getItemsFromGroup(group, 'groupItems'), (item) => html`
                                <ptcs-value-display
                                    property-display-item
                                    part="value-display-item"
                                    label=${this._getStringFromObject(item, this.selectorItemKey)}
                                    .data=${this._getObjectFromObject(item, this.selectorItemValue)}
                                    .itemMeta=${this._getObjectFromObject(item, this.selectorItemMeta)}
                                    .textWrap=${this.multiLine}
                                    modal-width=${this.modalWidth}
                                    modal-height=${this.modalHeight}
                                    overflow-option=${this.overflow}
                                    max-width=${this._width(this.valueDisplayMinWidth, this.valueDisplayWidth)}
                                    max-height=${this.valueDisplayHeight}
                                    no-dynamic-size-constraint
                                    ?disabled=${this.disabled}></ptcs-value-display>`)}
                        </div>
                    </div>
                `)}
            </div>
        </div>`;
    }

    static get observers() {
        return [
            '_observeWidthConstraints(valueDisplayMinWidth, valueDisplayWidth)'
        ];
    }

    static get is() {
        return 'ptcs-property-display';
    }

    static get properties() {
        return {

            // Are we in vertical or horizontal mode?
            verticalMode: {
                type:      Boolean,
                value:     false,
                attribute: 'vertical-mode',
                reflect:   true,
            },

            // Minimum responsive width of each Value Display WC
            valueDisplayMinWidth: {
                type:      Number,
                attribute: 'value-display-min-width'
            },

            _responsive: {
                type:      Boolean,
                attribute: '_responsive',
                reflect:   true,
                computed:  '_computeResponsive(valueDisplayMinWidth)'
            },

            // Max Width of each Value Display WC
            valueDisplayWidth: {
                type:      Number,
                value:     250,
                attribute: 'value-display-width',
                reflect:   true
            },

            // Max Height of each Value Display WC
            valueDisplayHeight: {
                type:      Number,
                attribute: 'value-display-height',
                reflect:   true
            },

            // Main label to use "above" the Property Display
            propertyDisplayLabel: {
                type:      String,
                attribute: 'property-display-label'
            },

            // "Type" of the "main" Property Display label
            propertyDisplayLabelType: {
                type:      String,
                value:     'label',
                attribute: 'property-display-label-type'
            },

            // Should the 'main' label be visible?
            hidePropertyDisplayLabel: {
                type:      Boolean,
                value:     false,
                attribute: 'hide-property-display-label'
            },

            propertyDisplayLabelAlignment: {
                type:      String,
                value:     'left',
                attribute: 'property-display-label-alignment'
            },

            // "Type" of the group labels
            groupLabelType: {
                type:      String,
                value:     'label',
                attribute: 'group-label-type'
            },

            // Should the group 'titles' be visible?
            hideGroupTitles: {
                type:      Boolean,
                value:     false,
                attribute: 'hide-group-titles'
            },

            groupLabelAlignment: {
                type:      String,
                value:     'left',
                attribute: 'group-label-alignment'
            },

            items: { // input data
                type:      Array,
                value:     () => [],
                attribute: 'items'
            },

            itemsInfo: {
                type:      Object,
                attribute: 'items-info'
            },

            selectorGroupTitle: {
                type:      String,
                attribute: 'selector-group-title'
            },

            selectorItemKey: {
                type:      String,
                value:     'key',
                attribute: 'selector-item-key'
            },

            selectorItemValue: {
                type:      String,
                value:     'value',
                attribute: 'selector-item-value'
            },

            selectorItemMeta: {
                type:      String,
                value:     'meta',
                attribute: 'selector-item-meta'
            },

            modalWidth: {
                type:      Number,
                value:     600,
                attribute: 'modal-width'
            },

            modalHeight: {
                type:      Number,
                value:     380,
                attribute: 'modal-height'
            },

            overflow: {
                type:      String,
                value:     'disclosure',
                attribute: 'overflow'
            },

            multiLine: {
                type:      Boolean,
                value:     false,
                attribute: 'multi-line',
                reflect:   true
            },

            textIfNoValue: {
                type:      String,
                value:     '', // To prevent ptcs-label from defaulting to 'Label'
                attribute: 'text-if-no-value',
                reflect:   true,
            },

            _groupFocusIndex: {
                type:  Number,
                value: -1
            },

            _valueDisplayFocusIndex: {
                type:  Number,
                value: -1
            },

            disabled: {
                type:      Boolean,
                value:     false,
                attribute: 'disabled'
            }

        };
    }

    ready() {
        super.ready();

        // For keyboard navigation / managing focus
        this.addEventListener('keydown', ev => this._keyDown(ev));

        // The extra 'true' parameter makes sure we get this event *before* the VD gets it,
        // otherwise we will select the wrong VD after e.g. clicking 'Show less'...
        this.addEventListener('click', ev => this._click(ev), true);
    }

    _getNumGroups() {
        return this.$.propertycontainer.querySelectorAll('div[part="property-group"]').length;
    }

    _getGroupEl(index) {
        return this.$.propertycontainer.querySelector(`div[part="property-group"]:nth-of-type(${index + 1})`);
    }

    _getNumVDsInGroup(groupIdx) {
        let groupEl = this._getGroupEl(groupIdx);
        if (groupEl) {
            return groupEl.querySelectorAll('ptcs-value-display').length;
        }

        return 0;
    }

    _getValueDisplayEl(groupEl, index) {
        return groupEl.querySelector(`ptcs-value-display:nth-of-type(${index + 1})`);
    }

    // if subcomponent is interactive, return it
    _getValueContainerEl(groupEl, index) {
        const valueDisplayEl = this._getValueDisplayEl(groupEl, index);
        if (valueDisplayEl._overflow) {
            if (valueDisplayEl.overflowOption === 'disclosure') {
                // Overflow with an overflow button, focus on button');
                return valueDisplayEl.shadowRoot.querySelector('[part=disclosure-button]');
            } else if (valueDisplayEl.overflowOption === 'showmore') {
                // Overflow with show more / show less link, focus on link');
                return valueDisplayEl.shadowRoot.querySelector('[part=text-link]');
            }
        }
        // Focus on the VD or an interactive part thereof');
        const valueContainer = valueDisplayEl.shadowRoot.querySelector('ptcs-value-container');
        const textfield = valueContainer.querySelector('ptcs-textfield');
        if (textfield) {
            return textfield.shadowRoot.querySelector('div[part="text-box"]');
        }
        return valueContainer.querySelector('ptcs-link') || valueDisplayEl;
    }

    _makeFocusItemVisible() {
        let pdRect = this.getBoundingClientRect();
        let bottomEnd = Math.min(pdRect.bottom, window.innerHeight);
        let topEnd = Math.max(pdRect.top, 0);
        if (this._valueDisplayFocusIndex !== -1) {
            console.assert(this._groupFocusIndex !== -1);
            let groupEl = this._getGroupEl(this._groupFocusIndex);
            let valueDisplayEl = this._getValueDisplayEl(groupEl, this._valueDisplayFocusIndex);
            let vdRect = valueDisplayEl.getBoundingClientRect();
            if (vdRect.bottom > bottomEnd) {
                // Align with bottom
                valueDisplayEl.scrollIntoView(false);
            } else if (vdRect.top < topEnd) {
                // Align with top
                valueDisplayEl.scrollIntoView(true);
            }
        } else if (this._groupFocusIndex !== -1) {
            let groupEl = this._getGroupEl(this._groupFocusIndex);
            let groupRect = groupEl.getBoundingClientRect();
            if (groupRect.top < topEnd) {
                // Align with top
                groupEl.scrollIntoView(true);
            } else {
                // Scrolling to the "next" group
                let firstVDEl = this._getValueDisplayEl(groupEl, 0);
                if (firstVDEl) {
                    let vdRect = firstVDEl.getBoundingClientRect();
                    if (vdRect.bottom > bottomEnd) {
                        firstVDEl.scrollIntoView(false);
                    }
                } else {
                    groupEl.scrollIntoView(false);
                }
            }
        } else {
            // Focus on the "main" PD
            this.scrollTop = 0;
            if (pdRect.top < 0 || pdRect.top > window.innerHeight) {
                this.scrollIntoView(true);
            }
        }
    }

    _gotoPrevGroup() {
        this._valueDisplayFocusIndex = -1;
        if (this._groupFocusIndex >= 0) {
            this._groupFocusIndex--;
        }
    }

    _gotoNextGroup() {
        this._valueDisplayFocusIndex = -1;
        let numGroups = this._getNumGroups();
        if ((this._groupFocusIndex + 1) < numGroups) {
            this._groupFocusIndex++;
        } else {
            // We were at the last VD of the last group, set the focus back to the whole PD
            this._groupFocusIndex = -1;
        }
    }

    _gotoPrevRowVD() {
        let groupEl = this._getGroupEl(this._groupFocusIndex);
        let vdElts = groupEl.querySelectorAll('ptcs-value-display');
        let numVDs = vdElts.length;

        console.assert(this._valueDisplayFocusIndex >= 0);
        console.assert(this._valueDisplayFocusIndex < numVDs);

        let currVDRect = vdElts[this._valueDisplayFocusIndex].getBoundingClientRect();
        let currTop = currVDRect.top;
        let currLeft = currVDRect.left;

        // Going up...
        if (this._valueDisplayFocusIndex > 0) {
            for (let i = this._valueDisplayFocusIndex - 1; i >= 0; i--) {
                let prevVDRect = vdElts[i].getBoundingClientRect();
                if (prevVDRect.left === currLeft && prevVDRect.top < currTop) {
                    this._valueDisplayFocusIndex = i;
                    return;
                }
            }
        }
        // If we get here, then set the focus back to the "current" group
        this._valueDisplayFocusIndex = -1;
    }

    _gotoNextRowVD() {
        let groupEl = this._getGroupEl(this._groupFocusIndex);
        let vdElts = groupEl.querySelectorAll('ptcs-value-display');
        let numVDs = vdElts.length;

        console.assert(this._valueDisplayFocusIndex >= 0);
        console.assert(this._valueDisplayFocusIndex < numVDs);

        let currVDRect = vdElts[this._valueDisplayFocusIndex].getBoundingClientRect();
        let currTop = currVDRect.top;
        let currLeft = currVDRect.left;

        for (let i = this._valueDisplayFocusIndex + 1; i < numVDs; i++) {
            let nextVDRect = vdElts[i].getBoundingClientRect();
            if (nextVDRect.left === currLeft && nextVDRect.top > currTop) {
                this._valueDisplayFocusIndex = i;
                return;
            }
        }
        // If we got here, then move to the next group (if any)
        this._gotoNextGroup();
    }

    _goLeft() {
        if (this._valueDisplayFocusIndex !== -1) {
            // Focus is on a VD
            this._valueDisplayFocusIndex--;
        } else if (this._groupFocusIndex !== -1) {
            // Focus is on a Group, set focus to the "last" VD of the previous group (if any)
            if (this._groupFocusIndex > 0) {
                this._groupFocusIndex--;
                this._valueDisplayFocusIndex = this._getNumVDsInGroup(this._groupFocusIndex) - 1;
            } else {
                // Topmost group, set the index to the whole PD
                this._groupFocusIndex = -1;
            }
        }
        this._makeFocusItemVisible();
    }

    _goRight() {
        if (this._valueDisplayFocusIndex !== -1) {
            // Focus on a VD, move on to the next
            let numVDs = this._getNumVDsInGroup(this._groupFocusIndex);
            if ((this._valueDisplayFocusIndex + 1) < numVDs) {
                // Simple case, just move on to the next VD
                this._valueDisplayFocusIndex++;
            } else {
                // We were at the last VD in group, focus on next group (if any)
                this._gotoNextGroup();
            }
        } else if (this._groupFocusIndex !== -1) {
            // Focus on a Group, move "into" the group, to the first VD
            this._valueDisplayFocusIndex = 0;
        } else {
            // Focus was on the PD itself, move into the first group
            this._groupFocusIndex = 0;
        }
        this._makeFocusItemVisible();
    }

    _goUp() {
        if (this._valueDisplayFocusIndex !== -1) {
            this._gotoPrevRowVD();
        } else if (this._groupFocusIndex !== -1) {
            this._gotoPrevGroup();
        }
        this._makeFocusItemVisible();
    }

    _goDown() {
        if (this._valueDisplayFocusIndex !== -1) {
            this._gotoNextRowVD();
        } else if (this._groupFocusIndex !== -1) {
            this._gotoNextGroup();
        } else {
            // Focus is on the PD, go to the first group
            this._groupFocusIndex = 0;
        }
        this._makeFocusItemVisible();
    }

    _goOut() {
        if (this._valueDisplayFocusIndex !== -1) {
            this._valueDisplayFocusIndex = -1;
        } else if (this._groupFocusIndex !== -1) {
            this._groupFocusIndex = -1;
        }
        this._makeFocusItemVisible();
    }

    _activate(ev) {
        if (this._valueDisplayFocusIndex !== -1) {
            console.assert(this._groupFocusIndex !== -1);
            let groupEl = this._getGroupEl(this._groupFocusIndex);
            if (groupEl) {
                let valueDisplayEl = this._getValueDisplayEl(groupEl, this._valueDisplayFocusIndex);
                if (valueDisplayEl) {
                    // Simulate a click on the 'Show More' - and make sure focus is retained...
                    const [_valueDisplayFocusIndex, _groupFocusIndex] = [this._valueDisplayFocusIndex, this._groupFocusIndex];
                    valueDisplayEl.dispatchEvent(new CustomEvent('space-activate', {bubbles: false, composed: false, detail: {}}));
                    [this._valueDisplayFocusIndex, this._groupFocusIndex] = [_valueDisplayFocusIndex, _groupFocusIndex];
                }
            }
        } else if (this._groupFocusIndex !== -1) {
            // Focus is on the group, move into it
            this._valueDisplayFocusIndex = 0;
        } else {
            // Focus is on the PD, go to the first group
            this._groupFocusIndex = 0;
        }
        this._makeFocusItemVisible();
    }

    _keyDown(ev) {
        switch (ev.key) {
            case 'ArrowLeft':
                this._goLeft();
                ev.preventDefault();
                break;
            case 'ArrowUp':
                this._goUp();
                ev.preventDefault();
                break;
            case 'ArrowRight':
                this._goRight();
                ev.preventDefault();
                break;
            case 'ArrowDown':
                this._goDown();
                ev.preventDefault();
                break;
            case 'Escape':
                this._goOut();
                ev.preventDefault();
                break;
            case ' ':
            case 'Enter':
                this._activate(ev);
                ev.preventDefault();
                break;
        }
    }

    _inRect(x, y, rect) {
        return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
    }

    _selectElementAtPoint(atX, atY) {
        let groupElts = this.$.propertycontainer.querySelectorAll('div[part="property-group"]');
        for (let i = 0; i < groupElts.length; i++) {
            if (this._inRect(atX, atY, groupElts[i].getBoundingClientRect())) {
                // Found the correct Group---now scan its VDs
                this._groupFocusIndex = i;
                let vdElts = groupElts[i].querySelectorAll('ptcs-value-display');
                for (let j = 0; j < vdElts.length; j++) {
                    if (this._inRect(atX, atY, vdElts[j].getBoundingClientRect())) {
                        // Click on a VD, make it the "active" one...
                        this._valueDisplayFocusIndex = j;
                        return;
                    }
                }
                // Not on any VD, probably a click on the Group label---make the group active
                this._valueDisplayFocusIndex = -1;
                return;
            }
        }
        // Click outside of any Group, set focus on the PD itself
        this._groupFocusIndex = -1;
        this._valueDisplayFocusIndex = -1;
    }

    _click(ev) {
        this._selectElementAtPoint(ev.clientX, ev.clientY);
        requestAnimationFrame(() => this._makeFocusItemVisible());
    }

    // Callback for BehaviorFocus
    _initTrackFocus() {
        this._trackFocus(this, () => {
            if (this._groupFocusIndex >= 0) {
                let groupEl = this._getGroupEl(this._groupFocusIndex);
                if (groupEl) {
                    if (this._valueDisplayFocusIndex >= 0) {
                        let valueDisplayEl = this._getValueContainerEl(groupEl, this._valueDisplayFocusIndex);
                        if (valueDisplayEl) {
                            // Focus on the VD
                            return valueDisplayEl;
                        }
                    }

                    // No VD has focus, highlight the current group
                    return groupEl;
                }
            }

            // No group has focus, highlight the entire PD
            return this;
        });
    }

    _notEmpty(items) {
        if (items) {
            if (Array.isArray(items)) {
                return items.length > 0;
            }
        }

        // Not a proper array...
        return false;
    }

    _observeWidthConstraints(valueDisplayMinWidth, valueDisplayWidth) {
        if (valueDisplayMinWidth) {
            this.style.setProperty('--ptcs-property-value-min-width', valueDisplayMinWidth + 'px');
        } else {
            this.style.setProperty('--ptcs-property-value-min-width', '');
        }
        if (valueDisplayWidth) {
            this.style.setProperty('--ptcs-property-value-width', valueDisplayWidth + 'px');
        } else {
            this.style.setProperty('--ptcs-property-value-width', '');
        }
    }

    _processProperties(obj, group, titleField) {
        for (var key in this.itemsInfo) {
            if (this.itemsInfo.hasOwnProperty(key) && typeof this.itemsInfo[key] !== 'function') {
                const value = obj[key];
                if (value === undefined || value === null) {
                    continue;
                }

                if (key !== titleField) {
                    let newObj = {};

                    let label = key;
                    if (this.itemsInfo[key].friendlyName) {
                        label = this.itemsInfo[key].friendlyName;
                    } else if (PTCS.Formatter) {
                        label = PTCS.Formatter.localize(key);
                    }
                    newObj[this.selectorItemKey] = label;
                    newObj[this.selectorItemValue] = value;

                    if (this.itemsInfo[key].baseType) {
                        newObj[this.selectorItemMeta] = {baseType: this.itemsInfo[key].baseType};
                    } else if (this.itemsInfo[key].type) {
                        newObj[this.selectorItemMeta] = {type: this.itemsInfo[key].type};
                    }
                    group.push(newObj);
                }
            }
        }
    }

    _createGroupFromObject(obj, titleField) {
        let title = '';

        if (titleField) {
            if (obj[titleField]) {
                title = obj[titleField];
            }
        }

        let items = [];

        // Add all properties of the object except the one used for the group title
        this._processProperties(obj, items, titleField);

        return {groupItems: items, groupTitle: title};
    }

    _createGroupFromArray(array, numItems) {
        let items = [];

        // Here we add all properties of all objects in the array to the same group...
        for (let i = 0; i < numItems; i++) {
            this._processProperties(array[i], items);
        }

        // In this case, there will never be a group title (if so, we would have
        // handled the objects individually)
        return {groupItems: items, groupTitle: ''};
    }


    _getGroups(items, itemsInfo, selectorGroupTitle) {
        if (!items || !itemsInfo) {
            return [];
        }

        const numItems = items.length;

        let groups = [];

        if (Array.isArray(items)) {
            if (selectorGroupTitle) {
                // We have a group title specified---emit each item in the row in its own group
                for (let i = 0; i < numItems; i++) {
                    groups.push(this._createGroupFromObject(items[i], selectorGroupTitle));
                }
            } else {
                // No title specified---this means that all items generated from the
                // objects in the array should be added to the same group
                groups.push(this._createGroupFromArray(items, numItems));
            }
        } else if (typeof items === 'object') {
            groups.push(this._createGroupFromObject(items, selectorGroupTitle));
        }

        return groups;
    }

    _doHideGroupTitle(hideGroupTitles, item, groupTitle) {
        const label = this._getStringFromObject(item, groupTitle);
        if (!label) {
            return true;
        }
        if (typeof label !== 'string') {
            return true;
        }
        if (label.length < 1) {
            return true;
        }

        return hideGroupTitles;
    }

    _getStringFromObject(item, selector) {
        if (!item) {
            return '';
        }

        if (!selector) {
            return item || '';
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

    _getObjectFromObject(item, selector) {
        if (item === null || typeof item === 'undefined') {
            return {};
        }

        if (!selector) {
            return item;
        }

        if (typeof selector === 'string') {
            return item[selector] === undefined ? {} : item[selector];
        }

        if (selector && selector.constructor && selector.call && selector.apply) {
            return selector(item);
        }

        console.error('Invalid selector: ', selector);
        // Fallback
        return item;
    }

    _getItemsFromGroup(item, selector) {
        if (!item) {
            return [];
        }

        if (!selector) {
            return item || [];
        }

        if (typeof selector === 'string') {
            let resultItem = item[selector];

            if (resultItem) {
                if (Array.isArray(resultItem)) {
                    return resultItem;
                } else if (typeof resultItem === 'object') {
                    if (resultItem.array && Array.isArray(resultItem.array)) {
                        return resultItem.array;
                    } else if (resultItem.rows && Array.isArray(resultItem.rows)) {
                        return resultItem.rows;
                    }
                }
            }

            // Bad selector/data
            return [];
        }

        if (selector && selector.constructor && selector.call && selector.apply) {
            return selector(item);
        }

        console.error('Invalid selector');

        // Fallback
        return item || [];
    }

    _computeResponsive(valueDisplayMinWidth) {
        return valueDisplayMinWidth > 0;
    }

    _width(valueDisplayMinWidth, valueDisplayWidth) {
        if (valueDisplayMinWidth) {
            return '';
        }
        return valueDisplayWidth;
    }

};

customElements.define(PTCS.PropertyDisplay.is, PTCS.PropertyDisplay);
