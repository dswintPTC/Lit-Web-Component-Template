import {PTCS} from 'ptcs-library/library.js';
import '@polymer/iron-collapse/iron-collapse.js';

// Inherit from iron-collapse
customElements.whenDefined('iron-collapse').then(() => {
    PTCS.Collapse = class extends customElements.get('iron-collapse') {
        static get is() {
            return 'ptcs-collapse';
        }
    };

    customElements.define(PTCS.Collapse.is, PTCS.Collapse);
});
