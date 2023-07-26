import {LitElement} from 'lit';
import {L2Pw} from 'ptcs-library/library-lit';
import {PTCS} from 'ptcs-library/library.js';
import 'ptcs-behavior-styleable/ptcs-behavior-styleable.js';

// This component uses BehaviorStyleable, so it informs the Style Aggregator about its precence
PTCS.Div = class extends PTCS.BehaviorStyleable(L2Pw(LitElement)) {
    static get is() {
        return 'ptcs-div';
    }

    createRenderRoot() {
        return this;
    }
};

customElements.define(PTCS.Div.is, PTCS.Div);
