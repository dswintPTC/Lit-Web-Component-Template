import {PTCS} from 'ptcs-library/library.js';
import 'ptcs-style-unit/ptcs-style-unit.js';

PTCS.BehaviorStyleable = superClass => {
    return (window.ShadyCSS && !window.ShadyCSS.nativeShadow) ? superClass : (class extends superClass {
        static get properties() {
            return {
                noWcStyle: {
                    type:               Boolean,
                    value:              false,
                    reflectToAttribute: true
                }
            };
        }

        // Workaround for bug / strange behavior. Call pattern sometimes are:
        // connectedCallback() {
        //   super --> disconnectedCallback(); connectedCallback();
        // }

        connectedCallback() {
            if (this.__preConnected) {
                super.connectedCallback();
                return;
            }
            this.__preConnected = true;
            super.connectedCallback();
            delete this.__preConnected;

            this.domConnected();
        }

        disconnectedCallback() {
            if (!this.__preConnected) {
                this.domDisconnected();
            }

            super.disconnectedCallback();
        }

        // Use instead of connectedCallback / disconnectedCallback
        domConnected() {
            if (this.noWcStyle) {
                return;
            }
            if (PTCS.styleAggregator) {
                PTCS.styleAggregator.enlist(this);
            } else {
                if (!PTCS.__styleable) {
                    PTCS.__styleable = new Set();
                }
                PTCS.__styleable.add(this);
            }
        }

        domDisconnected() {
            if (this.noWcStyle) {
                return;
            }
            if (PTCS.styleAggregator) {
                PTCS.styleAggregator.delist(this);
            } else if (PTCS.__styleable) {
                PTCS.__styleable.delete(this);
            }
        }
    });
};
