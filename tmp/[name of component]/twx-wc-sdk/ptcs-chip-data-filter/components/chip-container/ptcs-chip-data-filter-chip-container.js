import {PolymerElement, html} from '@polymer/polymer/polymer-element.js';
import '@polymer/polymer/lib/elements/dom-if.js';
import '@polymer/polymer/lib/elements/dom-repeat.js';

import './ptcs-chip-data-filter-chip-child.js';

import {PTCS} from 'ptcs-library/library.js';
import 'ptcs-behavior-styleable/ptcs-behavior-styleable.js';
import 'ptcs-behavior-tooltip/ptcs-behavior-tooltip.js';

class PTCSchipDataFilterChipContainer extends PTCS.BehaviorTooltip(PTCS.BehaviorStyleable(PTCS.ThemableMixin(PolymerElement))) {
    static get is() {
        return 'ptcs-chip-data-filter-chip-container';
    }
    static get template() {
        return html`
            <style>
                [part="container"] {
                    display: flex;
                    flex-wrap: wrap;
                    --ptcs-tooltip-start-delay: 0;
                }
            </style>
            <div id="container" part="container">
                <template is="dom-repeat" items="[[data]]">
                    <ptcs-chip-data-filter-chip-child part="chip-child" content="[[item.content]]" exportparts="oval-container, content"
                    on-focus="_focusEv" on-blur="_blurEv"
                    data-id\$="[[item.id]]" field-name\$="[[item.fieldName]]" tabindex\$="[[subTabindex]]"></ptcs-chip-data-filter-chip-child>
                </template>
            </div>
        `;
    }
    static get properties() {
        return {
            data: {
                type:  Array,
                value: () => []
            },

            subTabindex: {
                type: String
            }
        };
    }

    get focusedChip() {
        return this.shadowRoot.activeElement;
    }

    _focusEv(ev) {
        this._tooltipEnter(ev.target, undefined, undefined, undefined, {showAnyway: true});
    }

    _blurEv(ev) {
        this._tooltipLeave(ev.target);
    }

    get focusableElements() {
        return [...this.$.container.querySelectorAll('[tabindex]')].filter(el => el.clientHeight > 0)
            .map(chip => chip.shadowRoot.querySelector('[part=cross-button]'));
    }
}

customElements.define(PTCSchipDataFilterChipContainer.is, PTCSchipDataFilterChipContainer);
