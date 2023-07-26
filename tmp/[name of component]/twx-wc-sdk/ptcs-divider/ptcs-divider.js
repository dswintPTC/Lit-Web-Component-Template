import {LitElement, html, css} from 'lit';
import {L2Pw} from 'ptcs-library/library-lit';
import {PTCS} from 'ptcs-library/library.js';
import 'ptcs-behavior-styleable/ptcs-behavior-styleable.js';

PTCS.Divider = class extends PTCS.BehaviorStyleable(/*PTCS.ThemableMixin(*/L2Pw(LitElement)/*)*/) {
    static get styles() {
        return css`
            :host {
                display: flex;
                min-width: 34px;
                min-height: 34px;
                box-sizing: border-box;
                overflow: hidden;
            }

            :host(:not([vertical])) {
                height: auto;
            }

            :host([vertical]) {
                justify-content: center;
                width: auto;
            }

            :host(:not([vertical])) [part="line"]
            {
                min-height: 1px;
                width: 100%;
                align-self: center;
            }

            :host([vertical]) [part="line"]
            {
                min-width: 1px;
                height: auto;
            }`;
    }

    render() {
        return html`<div part="line" id="line"></div>`;
    }

    static get is() {
        return 'ptcs-divider';
    }

    static get properties() {
        return {
            vertical:
              {
                  type:    Boolean,
                  value:   false,
                  reflect: true
              }
        };
    }
};

customElements.define(PTCS.Divider.is, PTCS.Divider);
