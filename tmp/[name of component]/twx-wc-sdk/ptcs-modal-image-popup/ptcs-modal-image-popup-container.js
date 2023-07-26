import {PolymerElement, html} from '@polymer/polymer/polymer-element.js';
import {PTCS} from 'ptcs-library/library.js';
import 'ptcs-behavior-styleable/ptcs-behavior-styleable.js';
import 'ptcs-button/ptcs-button.js';
import 'ptcs-image/ptcs-image.js';
import 'ptcs-icons/cds-icons.js';
import 'ptcs-modal-overlay/ptcs-modal-overlay.js';

PTCS.ModalImagePopupContainer = class extends PTCS.BehaviorStyleable(PTCS.ThemableMixin(PolymerElement)) {

    static get template() {
        return html`
  <style>

    :host(:not([show-popup])) {
      display: none;
    }

    :host([show-popup]) {
      display: block;
    }

    [part=popup-container] {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      position: fixed;
      top: 0;
      left: 0;
      bottom: 0;
      right: 0;
      z-index: 99998;
    }


    [part=modal-image-popup] {
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
      position: relative;
      z-index: 99998;
      pointer-events: auto;
    }

    [part=live-art-area-image-popup] {
      box-sizing: border-box;
      }

    [part=popup-contents-and-button] {
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
      }

    [part=popup-close-button-container] {
      align-self: flex-end;
      position: fixed;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    </style>
    <div part="popup-container" id="root">
      <div part="modal-image-popup">
        <div part="popup-contents-and-button">
          <div part="popup-close-button-container">
            <ptcs-button variant="small" exportparts\$="[[_exportparts]]" id="close" part="popup-close-button" mode="icon"
              icon="cds:icon_close_mini"></ptcs-button>
          </div>
          <div id="popup" part="popup-contents">
            <div part="live-art-area-image-popup">
              <ptcs-image part="image" src="[[src]]" size="contain" position="center"></ptcs-image>
            </div>
          </div>
        </div>
      </div>
    </div>`;
    }

    static get is() {
        return 'ptcs-modal-image-popup-container';
    }

    static get properties() {
        return {

            // Image source url
            src: {
                type: String
            },

            // Toggle to show or hide the dialog
            showPopup: {
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

            // Height constraint in pixels
            height: {
                type:  Number,
                value: 200
            },

            // Width constraint in pixels
            width: {
                type:  Number,
                value: 300
            },

            _exportparts: {
                type:     String,
                readOnly: true,
                value:    PTCS.exportparts('close-button-', PTCS.Button)
            }

        };
    }

    static get $parts() {
        if (!this._$parts) {
            this._$parts = [...PTCS.partnames('close-button-', PTCS.Icon), 'popup-contents', 'live-art-area-image-popup'];
        }
        return this._$parts;
    }

};

customElements.define(PTCS.ModalImagePopupContainer.is, PTCS.ModalImagePopupContainer);
