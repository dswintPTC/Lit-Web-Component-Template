import {PolymerElement} from '@polymer/polymer/polymer-element.js';
import {PTCS} from 'ptcs-library/library.js';
import {StyleAggregator} from './style-aggregator.js';

PTCS.StyleContext = class extends PolymerElement {
    static get is() {
        return 'ptcs-style-context';
    }

    static get properties() {
        return {
            styleAggregator: {
                type:     Object,
                readOnly: true,
                value:    () => new StyleAggregator()
            }
        };
    }

    connectedCallback() {
        super.connectedCallback();
        PTCS.styleAggregator.attachContext(this);
    }

    disconnectedCallback() {
        PTCS.styleAggregator.detachContext(this);
        super.disconnectedCallback();
    }
};

customElements.define(PTCS.StyleContext.is, PTCS.StyleContext);
