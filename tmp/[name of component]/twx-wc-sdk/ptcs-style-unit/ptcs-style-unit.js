import {PolymerElement} from '@polymer/polymer/polymer-element.js';
import {PTCS} from 'ptcs-library/library.js';
import './style-aggregator.js';

PTCS.StyleUnit = class extends PolymerElement {
    static get is() {
        return 'ptcs-style-unit';
    }

    static get properties() {
        return {
            // Web component name in uppercase letters + (optionally) case sensitive `.${variant}` (case matching the attribute value)
            // or single #id (for top-level components)
            // Examples:
            //   - PTCS-BUTTON            -> matches ptcs-button:not([variant])
            //   - PTCS-BUTTON.primary    -> matches ptcs-button:[variant=primary]
            //   - #my-button             -> matches any component with id 'my-button'
            //   - #my-button.PTCS-BUTTON -> same as '#my-button', but helps the shady dom transpiler scope parts in the component
            wc: {
                type:  String,
                value: ''
            },

            // Part name, if style should be pushed into a specific part, or '' if style applies to wc
            // Can specify several parts with ':' as separator
            // Example:
            //   - part -> the style is injected in the web component that implements part
            //   - part1:part2:part3  -> each part must be a web component: the style is injected into the deepest (part3)
            part: {
                type:  String,
                value: ''
            },

            // Is component connected to the DOM?
            connected: {
                type: Boolean
            },

            // Mutation observer that detects changes in the character data (= the CSS styling)
            mutationObserver: {
                type: Object
            }
        };
    }

    static get observers() {
        return ['_cssKeyChanged(wc, part)'];
    }

    constructor() {
        super();

        this.mutationObserver = new MutationObserver(() => {
            // The CSS has been updated
            PTCS.styleAggregator.updateStyle(this);
        });
    }

    connectedCallback() {
        super.connectedCallback();

        // Hide me
        this.style.display = 'none';

        // Is the system (WebComponents) ready?
        if (window.WebComponents && window.WebComponents.ready) {
            this._attachMe();
        } else {
            // Connected to DOM, but not attached to style aggregator
            this.connected = undefined;

            let init = () => {
                if (this.connected === undefined) {
                    this._attachMe();
                    window.removeEventListener('WebComponentsReady', init);
                }
            };

            // Wait for polyfills to load
            window.addEventListener('WebComponentsReady', init);
        }
    }

    _attachMe() {
        this.connected = true;
        PTCS.styleAggregator.attachStyle(this);

        // Look for changes in the textual data
        this.mutationObserver.observe(this, {characterData: true, childList: true, subtree: true});
    }

    disconnectedCallback() {
        if (this.connected) {
            PTCS.styleAggregator.detachStyle(this);
            this.mutationObserver.disconnect();
            this.connected = false;
        }

        super.disconnectedCallback();
    }

    get cssKey() {
        return this.part ? `${this.wc}:${this.part}` : this.wc;
    }

    _cssKeyChanged() {
        // The CSS selector has been updated
        if (this.connected) {
            PTCS.styleAggregator.updateStyle(this);
        }
    }
};

customElements.define(PTCS.StyleUnit.is, PTCS.StyleUnit);
