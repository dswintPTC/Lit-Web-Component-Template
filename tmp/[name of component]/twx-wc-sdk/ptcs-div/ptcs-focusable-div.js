import {LitElement} from 'lit';
import {L2Pw} from 'ptcs-library/library-lit';
import {PTCS} from 'ptcs-library/library.js';
import 'ptcs-behavior-styleable/ptcs-behavior-styleable.js';
import 'ptcs-behavior-focus/ptcs-behavior-focus.js';

// This component uses BehaviorFocus, so it follows the focus conventions
PTCS.FocusableDiv = class extends PTCS.BehaviorFocus(PTCS.BehaviorStyleable(L2Pw(LitElement))) {
    static get is() {
        return 'ptcs-focusable-div';
    }

    createRenderRoot() {
        return this;
    }
};

customElements.define(PTCS.FocusableDiv.is, PTCS.FocusableDiv);
