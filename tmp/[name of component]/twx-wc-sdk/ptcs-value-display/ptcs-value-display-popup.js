import {PolymerElement, html} from '@polymer/polymer/polymer-element.js';
import {PTCS} from 'ptcs-library/library.js';
import 'ptcs-behavior-styleable/ptcs-behavior-styleable.js';
import 'ptcs-behavior-focus/ptcs-behavior-focus.js';
import 'ptcs-behavior-tooltip/ptcs-behavior-tooltip.js';
import 'ptcs-button/ptcs-button.js';
import 'ptcs-label/ptcs-label.js';
import './ptcs-value-container.js';
import 'ptcs-icons/cds-icons.js';

PTCS.ValueDisplayPopup = class extends PTCS.BehaviorTooltip(PTCS.BehaviorFocus(
    PTCS.BehaviorStyleable(PTCS.ThemableMixin(PolymerElement)))) {
    static get is() {
        return 'ptcs-value-display-popup';
    }

    static get template() {
        return html`
        <style>

            [part=popup-container] {
              display: flex;
              align-items: center;
              justify-content: center;
              position: fixed;
              top: 0;
              left: 0;
              bottom: 0;
              right: 0;
              z-index: 99997;
            }

            [part="value-display-popup"] {
               display: flex;
               flex-direction: column;
               box-sizing: border-box;
               position: relative;
               z-index: 99998;
               pointer-events: auto;
             }

             [part="live-contents-area-popup"] {
               overflow: auto;
               display: flex;
               flex-direction: column;
             }

             [part="value-container-popup"] {
               position: relative;
               overflow: auto;
               z-index: 99998;
             }

             [part="popup-close-button-container"] {
               align-self: flex-end;
               position: fixed;
               display: flex;
               align-items: center;
               justify-content: center;
               z-index: 99998;
             }

            [part="value-display-label-popup"] {
               box-sizing: border-box;
               position: static;
               z-index: 99998;
               display: block;
             }
        </style>
        <div part="popup-container">
           <div part="value-display-popup" style\$="[[_computeModalSize(modalHeight, modalWidth)]]">
                <div part="live-contents-area-popup">
                    <div part="popup-close-button-container">
                        <ptcs-button variant="small" id="close" part="popup-close-button"
                               icon="cds:icon_close_mini"></ptcs-button>
                    </div>
                    <ptcs-label part="value-display-label-popup" label\$="[[label]]"
                        variant="[[labelVariant]]" multi-line="" horizontal-alignment="[[labelAlignment]]"></ptcs-label>
                    <ptcs-value-container part="value-container-popup"
                        label="[[value]]"
                        item-meta="[[itemMeta]]"
                        value-type="[[valueType]]"
                        text-wrap="[[textWrap]]"
                        max-width="[[maxWidth]]"
                        backdrop-color="[[backdropColor]]"
                        backdrop-opacity="[[backdropOpacity]]">
                    </ptcs-value-container>
                </div>
            </div>
        </div >`;
    }

    static get properties() {
        return {

            // The value to display
            value: {
                type: String
            },

            itemMeta: {
                type: Object
            },

            // The key label above the value
            label: {
                type: String
            },

            // Label variant (header, sub-header, label, body, ...)
            labelVariant: {
                type: String
            },

            // Label Horizontal Alignment: 'left', 'center', 'right'
            labelAlignment: {
                type: String
            },

            // Data type of the value: 'text' | 'image' | ...
            valueType: {
                type: String
            },

            // Allow text content to wrap in the renderer?
            textWrap: {
                type: Boolean
            },

            // Max width in pixels
            maxWidth: {
                type: Number
            },

            // Modal pop-up dialog height in pixels
            modalHeight: {
                type: Number
            },

            // Modal pop-up dialog width in pixels
            modalWidth: {
                type: Number
            },

            // Modal backdrop color
            backdropColor: {
                type: String
            },

            // Modal backdrop opacity
            backdropOpacity: {
                type: Number
            }

        };
    }

    _computeModalSize(modalHeight, modalWidth) {
        const w = modalWidth ? 'width:' + modalWidth + 'px;' : '';
        const h = modalHeight ? 'height:' + modalHeight + 'px;' : '';
        return h + w;
    }

};

customElements.define(PTCS.ValueDisplayPopup.is, PTCS.ValueDisplayPopup);
