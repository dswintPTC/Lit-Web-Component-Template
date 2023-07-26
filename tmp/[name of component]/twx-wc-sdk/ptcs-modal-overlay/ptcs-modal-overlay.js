import {PolymerElement, html} from '@polymer/polymer/polymer-element.js';
import {PTCS} from 'ptcs-library/library.js';
import 'ptcs-behavior-styleable/ptcs-behavior-styleable.js';

PTCS.ModalOverlay = class extends PTCS.BehaviorStyleable(PTCS.ThemableMixin(PolymerElement)) {
    static get template() {
        return html`
      <style>
      :host {
        cursor: default;
      }

      :host [part=backdrop] {
        display: inline-flex;
        position: fixed;
        top: 0;
        left: 0;
        bottom: 0;
        right: 0;
      }
      </style>
      <div part="backdrop" id="backdrop"></div>
      `;
    }

    static get is() {
        return 'ptcs-modal-overlay';
    }

    static get properties() {
        return {

            backdropColor: { // Backdrop color
                type:     String,
                observer: 'backdropColorChanged'
            },

            backdropOpacity: { // Backdrop opacity
                type:     String,
                observer: 'backdropOpacityChanged'
            },

            backdropZIndex: { // Backdrop Z-index
                type:     Number,
                observer: 'backdropZIndexChanged'
            }

        };
    }

    ready() {
        super.ready();
        /*     this.addEventListener('click', this._ignoreEvent);
    this.addEventListener('scroll', this._ignoreEvent);
    this.addEventListener('keydown', this._ignoreEvent); */
    }

    /*   _ignoreEvent(evt) {
      evt.stopPropagation();
  } */

    backdropColorChanged(data) {
        if (data) {
            this.$.backdrop.style.backgroundColor = data;
        }
    }

    backdropOpacityChanged(data) {
        if (data) {
            this.$.backdrop.style.opacity = data;
        }
    }

    backdropZIndexChanged(data) {
        if (data) {
            this.$.backdrop.style.zIndex = data;
        }
    }

};

customElements.define(PTCS.ModalOverlay.is, PTCS.ModalOverlay);
