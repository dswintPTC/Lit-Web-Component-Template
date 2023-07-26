import {PolymerElement, html} from '@polymer/polymer/polymer-element.js';
import {PTCS} from 'ptcs-library/library.js';
import 'ptcs-behavior-styleable/ptcs-behavior-styleable.js';
import 'ptcs-button/ptcs-button.js';
import 'ptcs-image/ptcs-image.js';
import 'ptcs-icons/cds-icons.js';
import 'ptcs-modal-overlay/ptcs-modal-overlay.js';
import './ptcs-modal-image-popup-container.js';

import {createSubComponent} from 'ptcs-library/create-sub-component.js';

PTCS.ModalImagePopup = class extends PTCS.BehaviorStyleable(PTCS.ThemableMixin(PolymerElement)) {

    static get template() {
        return html`
    <style>

    :host {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    :host([disabled]) {
        pointer-events: none;
    }

    :host([disabled]) [part=popup-container]::selection {
        background-color: transparent;
    }

    [part=live-art-area-image-thumbnail] {
        box-sizing: border-box;
    }

    [part=popup-root] {
        display: flex;
        flex-direction: column;
        box-sizing: border-box;
    }

    </style>
    <div part="popup-root" id="root">
      <div part="live-art-area-image-thumbnail">
        <ptcs-image id="img" part="image" src="[[src]]" alt="[[altText]]" label-variant="body" size="contain" position="center"></ptcs-image>
      </div>
    </div>`;
    }

    static get is() {
        return 'ptcs-modal-image-popup';
    }

    static get properties() {
        return {

            // Image url
            src: {
                type: String
            },

            // Image alt text
            altText: {
                type: String
            },

            // Toggle to show or hide the disclosure button container
            noDisclosureButton: {
                type: Boolean
            },

            // Toggle to show or hide the popup dialog
            _showpopup: {
                type:               Boolean,
                reflectToAttribute: true
            },

            // Modal backdrop color
            backdropColor: {
                type: String
            },

            // Modal backdrop opacity
            backdropOpacity: {
                type: String
            },

            // Prevents pop-up when true
            disabled: {
                type:               Boolean,
                reflectToAttribute: true
            },

            // Fixed width constraint
            width: {
                type: Number
            },

            // Fixed height constraint
            height: {
                type: Number
            },

            // Widget max-width constraint in pixels (i.e. including any internal padding etc)
            maxWidth: {
                type: Number
            },

            // Widget max-height constraint in pixels (i.e. including any internal padding etc)
            maxHeight: {
                type: Number
            },

            // The height of the displayed image
            _imageScaledHeight: {
                type: Number
            },

            // The width of the displayed image
            _imageScaledWidth: {
                type: Number
            },

            // The intrinsic width of the image
            _naturalWidth: {
                type: Number
            },

            // The intrinsic height of the image
            _naturalHeight: {
                type: Number
            },

            // Did image load?
            _imgLoaded: {
                type: Boolean
            },

            // Error on loading image?
            _imgError: {
                type: Boolean
            },

            //  If the displayed image is smaller than its intrinsic size we will want to show the disclosure button to handle the "overflow"
            overflow: {
                type:               Boolean,
                readOnly:           true,
                observer:           '_overflowChanged',
                reflectToAttribute: true
            },
        };
    }

    static get observers() {
        return [
            '_observe(width, height, maxWidth, maxHeight, _imgLoaded)'
        ];
    }

    ready() {
        super.ready();
        // Listen to image load completion
        this.addEventListener('load', ev => this._onLoad(ev));
    }

    connectedCallback() {
        super.connectedCallback();
    }

    disconnectedCallback() {
        this.close();
        if (this._dialog) {
            document.body.removeChild(this._dialog);
        }
        const mdl = document.body.querySelector('ptcs-modal-overlay');
        if (mdl) {
            document.body.removeChild(mdl);
        }
        super.disconnectedCallback();
    }

    open() {
        // When the "no disclosure button" option is used or there is no overflow, the thumbnail should not open popup on keyboard Enter / Space
        if (this.noDisclosureButton || !this.overflow) {
            return;
        }
        if (!this._showpopup) { // If we are not showing a modal background / dialog...
            if (!this.disabled) {

                // Create the modal overlay and style it
                const mdl = createSubComponent(this,
                    '<ptcs-modal-overlay backdrop-color="[[backdropColor]]" backdrop-opacity="[[backdropOpacity]]">');
                document.body.appendChild(mdl); // Insert backdrop as child of body
                if (!this._dialog) {
                    // Generate the <div part=popup-container dynamically on-demand
                    const popup = createSubComponent(this, '<ptcs-modal-image-popup-container src="[[src]]" show-popup="[[_showpopup]]">');
                    this._dialog = document.body.appendChild(popup);
                    popup.shadowRoot.querySelector('[part=popup-close-button-container]').addEventListener('click', () => this.close());
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

    close() { // Delete the dialog, delete the modal background overlay, and emit popup-close-action event
        if (this._showpopup) {
            // Remove the popup from DOM
            document.body.removeChild(this._dialog);
            this._dialog = undefined;
            // Remove the modal overlay
            const mdl = document.body.querySelector('ptcs-modal-overlay');
            if (mdl) {
                document.body.removeChild(mdl);
            }
            var vdWidget = this.$.root;
            while (vdWidget.parentNode) {
                vdWidget = vdWidget.parentNode;
                if (vdWidget.nodeType === 11) { // Fragment
                    vdWidget = vdWidget.host;
                }
                if (vdWidget.nodeName === 'PTCS-VALUE-DISPLAY') {
                    break;
                }
            }
            if (vdWidget.nodeName === 'PTCS-VALUE-DISPLAY') {
                vdWidget.dispatchEvent(new CustomEvent('popup-close-action'), {
                    bubbles:  true,
                    composed: true
                });

            } else {
                this.dispatchEvent(new CustomEvent('popup-close-action'), {
                    bubbles:  true,
                    composed: true
                });
            }
            this._showpopup = false;

            // Remove the "global" event listener for the "modal" popup
            document.removeEventListener('keydown', this._captureTab);

            // Restore focus to "main" part of the component
            if (this.__prevFocusElt) {
                this.__prevFocusElt.focus();
                this.__prevfocusElt = undefined;
            }
        }
    }

    // Image has been loaded
    _onLoad(ev) {
        this.setProperties({_imgLoaded: true, _naturalWidth: ev.detail.naturalWidth, _naturalHeight: ev.detail.naturalHeight});
    }

    // Report current image overflow state
    _overflowChanged(overflow) {
        this.dispatchEvent(new CustomEvent(
            'image-overflow',
            {
                bubbles:  true,
                composed: true,
                detail:   {overflow: overflow}
            }));
    }

    _observe(width, height, maxWidth, maxHeight, _imgLoaded) {
        if (_imgLoaded) {
            //
            this.style.visibility = 'hidden';
            const DEFAULT_IMG_HEIGHT = 158; // max default thumbnail height
            const DEFAULT_IMG_WIDTH = 284; // max default thumbnail width
            const MIN_IMAGE_SIZE = 18;
            const rootCS = window.getComputedStyle(this.$.root);
            const verticalSpacing = PTCS.cssDecodeSize(rootCS.paddingTop) + PTCS.cssDecodeSize(rootCS.paddingBottom);
            const horizontalSpacing = PTCS.cssDecodeSize(rootCS.paddingLeft) + PTCS.cssDecodeSize(rootCS.paddingRight);
            const DISCLOSURE_BUTTON_HEIGHT = 35; // Button is created dynamically on-demand, height 34px + 1px border
            const heightConstraint = maxHeight > verticalSpacing ? maxHeight - verticalSpacing : DEFAULT_IMG_HEIGHT + verticalSpacing;
            const widthConstraint = maxWidth > horizontalSpacing ? maxWidth - horizontalSpacing : DEFAULT_IMG_WIDTH + horizontalSpacing;
            const desiredHeight = Math.max(Math.min(heightConstraint, DEFAULT_IMG_HEIGHT, this._naturalHeight), MIN_IMAGE_SIZE);
            const desiredWidth = Math.max(Math.min(widthConstraint, DEFAULT_IMG_WIDTH, this._naturalWidth), MIN_IMAGE_SIZE);
            const scaleH = desiredHeight / this._naturalHeight;
            const scaleW = desiredWidth / this._naturalWidth;
            // Image is scaled uniformly and needs to stay within set size constraints: If the scaleH / scaleW scale differ, pick the smaller
            const scale = Math.min(scaleH, scaleW);
            this._imageScaledWidth = Math.round(scale * this._naturalWidth);
            this._imageScaledHeight = Math.round(scale * this._naturalHeight);
            // Cap the image size to fixed width / height if provided
            if (width > 0) {
                this._imageScaledWidth = Math.min(width, this._imageScaledWidth);
            }
            if (height > 0) {
                this._imageScaledHeight = Math.min(height, this._imageScaledHeight);
            }
            // Image "overflows" if its scaled size is less than its intrinsic size AND setting is to have a disclosure button
            this._setOverflow(!this.noDisclosureButton &&
                (this._imageScaledHeight < this._naturalHeight || this._imageScaledWidth < this._naturalWidth));
            if (this.overflow) {
                // Thumbnail is smaller than the image's intrinsic size: Reduce the image height to make room for the overflow button
                // and padding - which is applied only when there is an overflow
                const PADDING = 16;
                this._imageScaledHeight = Math.max(this._imageScaledHeight - DISCLOSURE_BUTTON_HEIGHT - PADDING, MIN_IMAGE_SIZE);
            }
            const h1 = this._imageScaledHeight + verticalSpacing;
            const w1 = this._imageScaledWidth + horizontalSpacing;
            this.$.root.style = 'height: ' + h1 + 'px; width: ' + w1 + 'px;';

            // Allow fixed height / width to be set if larger than the image's intrinsic size
            if (height > this._naturalHeight + verticalSpacing) {
                this.style.height = height + 'px';
            } else {
                this.style.height = '';
            }
            if (width > this._naturalWidth + horizontalSpacing) {
                this.style.width = width + 'px';
            } else {
                this.style.width = '';
            }
            setTimeout(() => {
                this.style.visibility = 'visible';
            }, 200);
        }
    }
};

customElements.define(PTCS.ModalImagePopup.is, PTCS.ModalImagePopup);
