import {PolymerElement} from '@polymer/polymer/polymer-element.js';
import {PTCS} from 'ptcs-library/library.js';
import 'ptcs-behavior-styleable/ptcs-behavior-styleable.js';
import 'ptcs-link/ptcs-link.js';
import 'ptcs-label/ptcs-label.js';
import 'ptcs-checkbox/ptcs-checkbox.js';
import 'ptcs-textfield/ptcs-textfield.js';
import 'ptcs-image/ptcs-image.js';
import 'ptcs-modal-image-popup/ptcs-modal-image-popup.js';

PTCS.ValueContainer = class extends PolymerElement {
    static get is() {
        return 'ptcs-value-container';
    }

    static get properties() {
        return {

            // The data to render
            label: {
                type:     String,
                observer: '_labelChanged'
            },

            defaultText: {
                type: String
            },

            // The data type
            itemMeta: {
                type:  Object,
                value: {type: 'text'}
            },

            // The data type string value
            valueType: {
                type:               String,
                reflectToAttribute: true
            },

            disabled: {
                type:               Boolean,
                reflectToAttribute: true,
                observer:           '_disabledChanged'
            },

            overflowOption: {
                type: String
            },

            // Image disclosure option
            noDisclosureButton: {
                type: Boolean
            },

            // Allow text content to wrap in the renderer?
            textWrap: {
                type: Boolean
            },

            // Fixed width, can be used by image thumbnail
            width: {
                type: Number
            },

            // Fixed height, can be used by image thumbnail
            height: {
                type: Number
            },

            maxWidth: {
                type: Number
            },

            maxHeight: {
                type: Number
            },

            // Modal backdrop related properties follow
            backdropColor: {
                type: String
            },

            backdropOpacity: {
                type: Number
            },

            _tabSequence: {
                type: String
            }
        };
    }

    static get observers() {
        return ['_itemMetaChanged(itemMeta, itemMeta.type, itemMeta.baseType, label)',
            '_constraintsChanged(textWrap, width, height, maxWidth, maxHeight, overflowOption, valueType, label, defaultText, noDisclosureButton)'
        ];
    }

    // _getContainerType indirectly uses the later params as well, invoke it on any change
    _itemMetaChanged(itemMeta, itemMetaType, itemMetaBaseType, label) {
        if (itemMeta) {
            itemMeta.type = this._getContainerType(itemMeta);
            this._itemMetaTypeChanged(itemMeta.type);
        }
    }

    _constraintsChanged(textWrap, width, height, maxWidth, maxHeight, overflowOption, valueType, label, defaultText, noDisclosureButton) {
        if (!valueType) {
            return;
        }
        let el = this.querySelector('[part=item-value]');
        if (!el) {
            return;
        }

        // Invoking performUpdate() to synchronize with lit-based components.
        //
        // The value display is currently a Polymer component and uses web components as part=item-value for most of the value
        // types (except HTML and function). In the lit migration we can get failed UTs when some components are migrated to lit,
        // with different life cycle handling.
        if (el.nodeName.startsWith('PTCS-') && !(el instanceof PolymerElement) && typeof el.performUpdate === 'function') {
            if (!el.shadowRoot) {
                return; // Lit shadowRoot wasn't created yet
            }
            el.performUpdate();
        }

        // Debounce updates
        clearTimeout(this.__updateTimeoutId);
        this.__updateTimeoutId = setTimeout(() => {
            if (valueType === 'link') {
                el.singleLine = !textWrap;
            } else {
                el.multiLine = textWrap;
            }

            if (valueType === 'image') {
                el.setProperties({
                    width:              width,
                    height:             height,
                    maxWidth:           maxWidth,
                    maxHeight:          maxHeight,
                    noDisclosureButton: noDisclosureButton,
                    altText:            defaultText
                });
            } else { // not image
                if (valueType === 'link') {
                    el.textMaximumWidth = maxWidth > 0 ? maxWidth : undefined;
                } else {
                    el.maxWidth = maxWidth > 0 ? maxWidth : undefined;
                }
                if (maxHeight) {
                    if (valueType === 'text') {
                        el.label = label || defaultText || '';

                        if (overflowOption === 'ellipsis' || el.label === defaultText) {
                            el.maxHeight = maxHeight;

                            setTimeout(() => {
                                if (textWrap &&
                                el.$.label.clientHeight < 2 * PTCS.cssDecodeSize(getComputedStyle(el.$.label).fontSize, el.$.label, true)) {
                                    // To prevent scrollbar flicker in ptcs-label _checkHeight() for multiLine content when only one line will fit
                                    el.multiLine = false;
                                }
                            }, 50);
                        } else {
                            el.maxHeight = undefined; // To prevent forced-single-line in ptcs-label
                        }
                    } else {
                        // Value type is not text
                        el.maxHeight = maxHeight;
                    }
                }
            }
            this.dispatchEvent(new CustomEvent('check-overflow', {bubbles: true, composed: true, detail: {}}));
        }, 50);
    }

    _itemMetaTypeChanged(type) {
        let el, containerEl = this._getItem();

        if (!containerEl) {
            return; // not ready
        }

        if (containerEl && containerEl.firstChild) {
            el = containerEl.firstChild;
        }

        if (containerEl.__type !== type) {
            let newEl = this._createItem(type);

            if (newEl) {
                containerEl.insertBefore(newEl, el);
                containerEl.removeChild(el);
            }
        }
    }

    // Get item type
    _type() {
        return this._getContainerType(this.itemMeta);
    }

    // Returns the part=item-value parent of the web component or span content holder
    _getItem() {
        const type = this._type();
        if (!type) {
            return null; // Not ready
        }

        let containerEl = this.querySelector('[part=item-value-container]');

        if (!containerEl) {
            containerEl = this._createItemContainer(type);
            let el = this._createItem(type);

            containerEl.appendChild(el);
            this.appendChild(containerEl);
        }

        return containerEl;
    }

    // Returns the first child of part=item-value i.e. ptcs-label, ptcs-image, etc if exists
    _getInternalItem() {
        let el = this._getItem();
        if (el && el.firstChild) {
            return el.firstChild;
        }

        return null;
    }

    _createItem(type) {
        let el;
        switch (type) {
            case 'text':
                el = document.createElement('ptcs-label');
                el.setProperties({
                    label:             this.label || this.defaultText || '',
                    multiLine:         this.textWrap,
                    maxWidth:          this.maxWidth,
                    disabled:          this.disabled,
                    variant:           'body',
                    disclosureControl: 'ellipsis',
                    disableTooltip:    true
                });
                if (this.overflowOption === 'ellipsis' || el.label === this.defaultText) {
                    el.maxHeight = this.maxHeight > 0 ? this.maxHeight : undefined;
                }
                break;

            case 'password':
                el = document.createElement('ptcs-textfield');
                el.setProperties({
                    text:     this.label,
                    password: true,
                    readOnly: true
                });
                break;

            case 'link':
                el = document.createElement('ptcs-link');
                el.setProperties({
                    variant:          'primary',
                    href:             encodeURI(this.label.href),
                    disabled:         this.disabled,
                    label:            this.label.label,
                    target:           this.itemMeta.target,
                    singleLine:       !this.textWrap,
                    textMaximumWidth: this.maxWidth
                });
                el.setAttribute('tabindex', this._tabSequence);
                this._setbattr(el, 'no-padding', true);
                break;

            case 'image':
                el = document.createElement('ptcs-modal-image-popup'); // Modal dialog with pop-up functionality
                el.setProperties({
                    src:                this.label,
                    width:              this.width,
                    height:             this.height,
                    maxHeight:          this.maxHeight,
                    maxWidth:           this.maxWidth,
                    noDisclosureButton: this.noDisclosureButton,
                    backdropColor:      this.backdropColor,
                    backdropOpacity:    this.backdropOpacity
                });
                break;

            case 'checkbox':
                el = document.createElement('ptcs-checkbox');
                el.setProperties({
                    checked:  this.label ? (this.label !== 'false') : false,
                    disabled: true
                });
                el.setAttribute('style', 'pointer-events: none;'); // Disallow checkbox functionality

                break;

            case 'html':
                el = document.createElement('span');
                if (this.label) {
                    el.innerHTML = this.label;
                }
                if (this.disabled) {
                    el.disabled = true;
                }
                break;

            case 'function':
                if (this.label) {
                    el = this.label(this.disabled);
                } else {
                    el = document.createElement('span');
                }
                break;
            default:
                throw Error(`Unknown value item type: ${type}`);
        }
        el.setAttribute('part', 'item-value');

        return el;
    }

    _createItemContainer(type) {
        let containerEl = document.createElement('div');
        containerEl.setAttribute('part', 'item-value-container');

        containerEl.__type = type;

        return containerEl;
    }

    _labelChanged(label) {
        const type = this._type();
        let el, containerEl = this._getItem();

        if (!type || !containerEl) {
            return; // Not ready
        }

        if (containerEl && containerEl.firstChild) {
            el = containerEl.firstChild;
        }

        if (containerEl.__type !== type) {
            let newEl = this._createItem(type);

            if (newEl) {
                containerEl.insertBefore(newEl, el);
                containerEl.removeChild(el);
            }

            el = newEl;
        }

        switch (type) {
            case 'text':
                el.label = label;
                break;

            case 'password':
                el.label = label;
                break;

            case 'link':
                el.href = encodeURI(label.href);
                el.label = label.label;
                break;

            case 'checkbox':
                el.checked = label ? (this.label !== 'false') : false;
                break;

            case 'image':
                el.src = label;
                break;

            case 'html':
                el.innerHTML = label;
                break;
        }
    }

    _disabledChanged(disabled) {
        const type = this._type();
        if (!type) {
            return; // Not ready
        }

        // Update item
        switch (type) {
            case 'text':
            case 'password':
            case 'link':
            case 'image':
            case 'checkbox':
            case 'html':
                this._setbattr(this._getItem(), 'disabled', disabled);
                this._setbattr(this._getInternalItem(), 'disabled', disabled);
                break;
            case 'function': {
                this._setbattr(this._getItem(), 'disabled', disabled);
                // Binding can make list disabled. In that case you have to prevent link activation
                let linkEls = this.querySelectorAll('ptcs-link');
                _.forEach(linkEls, linkEl => {
                    linkEl.disabled = disabled;
                });
                break;
            }
        }
    }


    // Set boolean attribute
    _setbattr(el, attr, value) {
        if (el && el.setAttribute) {
            if (value) {
                el.setAttribute(attr, '');
            } else {
                el.removeAttribute(attr);
            }
        }
    }

    _getContainerType(itemMeta) {
        if (!itemMeta) {
            return undefined;
        }
        if (itemMeta.type) {
            return itemMeta.type;
        }
        if (!itemMeta.baseType) {
            return undefined;
        }

        if (!itemMeta.formatterStruct) {
            itemMeta.formatterStruct = {renderer: itemMeta.baseType};
        }
        itemMeta.type = PTCS.Formatter.getContainerType(itemMeta.baseType, itemMeta.formatterStruct);
        return itemMeta.type;
    }

};

customElements.define(PTCS.ValueContainer.is, PTCS.ValueContainer);
