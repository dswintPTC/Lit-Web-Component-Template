import {PolymerElement, html} from '@polymer/polymer/polymer-element.js';
import {PTCS} from 'ptcs-library/library.js';
import 'ptcs-image/ptcs-image.js';

PTCS.ImageValueContainer = class extends PTCS.BehaviorStyleable(PTCS.ThemableMixin(PolymerElement)) {

    static get is() {
        return 'ptcs-image-value-container';
    }

    static get template() {
        return html`
            <style>
                [part=image-area] {
                    width: 100%;
                    height: 100%;
                }
            </style>

            <div id="image-area" part="image-area">
                <ptcs-image id="image" part="image"
                src="[[_getImage(data, selector)]]"
                no-placeholder=""
                size="[[_computeWidgetDimension(scaling)]]" position="center"
                ></ptcs-image>
            </div>
            `;
    }

    static get properties() {
        return {
            // Input data
            data: {
                type: Object,
            },

            selector: {
                value: null
            },

            scaling: {
                type: String
            },

            width: {
                type: Number
            },

            height: {
                type: Number
            }
        };
    }

    static get observers() {
        return [
            '_observeHeightWidth(height, width)'
        ];
    }

    _observeHeightWidth(height, width) {
        const imageArea = this.$['image-area'];
        if (!isNaN(width) && imageArea) {
            imageArea.style.width = width + 'px';
        }

        if (!isNaN(height) && imageArea) {
            imageArea.style.height = height + 'px';
        }
    }

    _getImage(data, selector) {
        let retData = '';
        if (!selector) {
            retData = data;
        } else if (selector.constructor && selector.call && selector.apply) {
            retData = selector(data);
        }
        return retData;
    }

    _computeWidgetDimension(scaling) {
        let size, position = 'center';
        switch (scaling) {
            case 'image':
                size = 'auto';
                break;

            case 'scaledtowidth':
                size = 'fit-x';
                position = 'top';
                break;

            case 'scaledtoheight':
                size = 'fit-y';
                position = 'top';
                break;

            case 'contain':
                size = 'contain';
                break;

            case '25%':
            case '50%':
            case '75%':
                size = scaling;
                position = 'center';
                break;

            case 'cover':
            default:
                size = 'cover';
                position = 'center';
                break;
        }
        const el = this.$.image;
        if (el) {
            el.position = position;
        }

        return size;
    }
};

customElements.define(PTCS.ImageValueContainer.is, PTCS.ImageValueContainer);
