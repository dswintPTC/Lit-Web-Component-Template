import {PolymerElement, html} from '@polymer/polymer/polymer-element.js';

import {PTCS} from 'ptcs-library/library.js';
import 'ptcs-behavior-styleable/ptcs-behavior-styleable.js';
import 'ptcs-behavior-focus/ptcs-behavior-focus.js';
import 'ptcs-button/ptcs-button.js';
import 'ptcs-icons/cds-icons.js';
import 'ptcs-label/ptcs-label.js';

class PTCSchipDataFilterChipChild extends PTCS.BehaviorStyleable(PTCS.ThemableMixin(PolymerElement)) {
    static get is() {
        return 'ptcs-chip-data-filter-chip-child';
    }
    static get template() {
        return html`
            <style>
                :host {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start; /* thanks to that content is not extended to the error message length */
                    flex-shrink: 0; /* otherwise error could be divided into two lines */
                }
                :host([hide]) {
                    visibility: hidden;
                }
                [part="oval-container"] {
                    position: relative;
                    display: flex;
                    justify-content: space-between;
                    box-sizing: border-box;
                    align-items: center;
                }
                [part="content"] {
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                [part="content"].hand {
                    cursor: pointer;
                }

                </style>
                <div id="oval-container" part="oval-container">
                    <ptcs-label id="content" part="content" label="[[content]]"></ptcs-label>
                    <div id="cross-button-container" part="cross-button-container">
                        <ptcs-button tabindex="-1" id="cross-button" part="cross-button" on-click="closeChip"
                        variant="small" icon="cds:icon_close_mini" content-align="center" mode="icon"
                        aria-disabled="false"></ptcs-button>
                    </div>
                </div>`;
    }
    static get properties() {
        return {
            content: {
                type:     String,
                observer: '__setHandPointerVisibility'
            },
            error: {
                type:               Boolean,
                reflectToAttribute: true
            }
        };
    }

    ready() {
        super.ready();

        this.tooltipFunc = () => this.$.content.tooltipFunc();
    }

    connectedCallback() {
        super.connectedCallback();
        // There is need to handle hand pointer here, i.e. when the first time connectedCallback is called.
        // Then, the element has been already added to DOM and it is possible to compute its width.
        this.__setHandPointerVisibility();
    }

    __setHandPointerVisibility() {
        setTimeout(() => {
            const partLabel = this.$.content.shadowRoot.querySelector('[part=label]');
            // scrollWidth in case of Edge may be bigger by 1
            this.$.content.classList.toggle('hand', partLabel.clientWidth < partLabel.scrollWidth - 1);
        }, 100);
    }

    closeChip(ev) {
        if (ev) {
            ev.preventDefault();
        }
        this.dispatchEvent(new CustomEvent('remove', {
            bubbles:  true,
            composed: true
        }));
    }
}

customElements.define(PTCSchipDataFilterChipChild.is, PTCSchipDataFilterChipChild);
