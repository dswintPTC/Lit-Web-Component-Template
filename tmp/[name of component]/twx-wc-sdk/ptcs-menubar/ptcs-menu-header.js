import {PolymerElement, html} from '@polymer/polymer/polymer-element.js';
import {PTCS} from 'ptcs-library/library.js';
import 'ptcs-behavior-styleable/ptcs-behavior-styleable.js';
import 'ptcs-behavior-focus/ptcs-behavior-focus.js';
import 'ptcs-behavior-tooltip/ptcs-behavior-tooltip.js';
import './ptcs-menu-item.js';

PTCS.MenuHeader = class extends PTCS.BehaviorTooltip(PTCS.BehaviorFocus(PTCS.BehaviorStyleable(PTCS.ThemableMixin(PolymerElement)))) {
    static get template() {
        return html`
      <style>
        :host {
          display: block;
          cursor: default;
          flex-wrap: nowrap;

          min-width: 34px;
          min-height: 19px;

          box-sizing: border-box;

          white-space: nowrap;
          overflow: hidden;
          outline: none;
        }

        :host([hidden]) {
          display: none;
        }

        :host([disabled]) {
            cursor: default;
        }

      </style>

      <ptcs-menu-item variant="dark" id="item" part="item" compact-mode="[[compactMode]]" icon="[[icon]]"
       icon-width="[[iconWidth]]" icon-height="[[iconHeight]]"
       item="[[item]]" level="0" header="true" ignore-click="[[ignoreClick]]" disabled="[[disabled]]" allow-missing-icons="[[allowMissingIcons]]"
       display-icons="[[displayIcons]]">
      </ptcs-menu-item>`;
    }

    static get is() {
        return 'ptcs-menu-header';
    }

    static get properties() {
        return {
            compactMode: {
                type:               Boolean,
                value:              false,
                reflectToAttribute: true
            },

            icon: {
                type: String
            },

            iconWidth: {
                type: String
            },

            iconHeight: {
                type: String
            },

            ignoreClick: {
                type:  Boolean,
                value: false
            },

            allowMissingIcons: {
                type: Boolean
            },

            displayIcons: {
                type: Boolean
            },

            disabled: {
                type:               Boolean,
                value:              false,
                reflectToAttribute: true
            }
        };
    }

    ready() {
        super.ready();

        this.addEventListener('blur', ev => {
            this.dispatchEvent(new CustomEvent('lost-focus', {
                bubbles:  true,
                composed: true,
                detail:   {cmpnt: 'header'}
            }));
        });
    }

    // Callback for BehaviorFocus
    _initTrackFocus() {
        this._trackFocus(this, this.$.item);
    }
};

customElements.define(PTCS.MenuHeader.is, PTCS.MenuHeader);
