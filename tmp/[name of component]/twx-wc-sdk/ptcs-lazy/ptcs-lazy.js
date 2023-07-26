import {LitElement} from 'lit';
import {L2Pw} from 'ptcs-library/library-lit';
import '@polymer/polymer/lib/elements/dom-if';
import {PTCS} from 'ptcs-library/library.js';
import {BehaviorLazy} from './ptcs-behavior-lazy.js';

export const Lazy = class extends BehaviorLazy(L2Pw(LitElement)) {
    static get is() {
        return 'ptcs-lazy';
    }

    static get properties() {
        return {
            mode: {
                type:    String,
                value:   Lazy.LAZY,
                reflect: true,
            }
        };
    }

    createRenderRoot() {
        return this;
    }

    get shouldLazyLoad() {
        return this.mode !== Lazy.NONE;
    }

    get shouldReload() {
        return this.mode === Lazy.RELOAD;
    }

    get shouldUnload() {
        return this.mode === Lazy.UNLOAD;
    }

    async init() {
        this._initFromChild(await PTCS.waitForChild(this));
    }

    /**
     *
     * @param {HTMLElement|ChildNode} child
     */
    _initFromChild(child) {
        /* istanbul ignore else: angular */
        if (child.nodeType === Node.ELEMENT_NODE) {
            /* istanbul ignore else: no template */
            if (child.tagName === 'TEMPLATE') {
                this.__template = child;
            }
        }
    }

    async realLoad() {
        /* istanbul ignore else: angular */
        if (this.__template) {
            const clone = this.__template.content.cloneNode(true);
            this.__loadedChildren = [];

            // Save list of loaded children to allow unloading the template
            for (let el = clone.firstChild; el; el = el.nextSibling) {
                this.__loadedChildren.push(el);
            }

            this.__loadedTemplate = this.appendChild(clone);
        }
    }

    async realUnload() {
        /* istanbul ignore else: angular */
        if (this.__loadedTemplate) {
            this.__loadedChildren.forEach(el => {
                this.removeChild(el);
            });

            this.__loadedTemplate = null;
            this.__loadedChildren = null;
        }
    }
};

Lazy.NONE = 'none';
Lazy.LAZY = 'lazy';
Lazy.RELOAD = 'reload';
Lazy.UNLOAD = 'unload';

PTCS.Lazy = Lazy;

customElements.define(PTCS.Lazy.is, PTCS.Lazy);
